import {
  generateRecordId,
  generationSessionDraftSchema,
  getRecordTypeDefinition,
  parseRecordPayload,
  projectRecordSalience,
  projectRecordStatus,
  projectRecordUrgency,
  pruneWorkingSetReferences,
  storyContractSchema,
  universalContentPolicySchema,
  proseModeSchema,
  type RecordReference
} from "@loom/core";
import type { DatabaseSync } from "node:sqlite";
import { ZodError, type ZodType } from "zod";

export interface RecordRepositoryRecord {
  id: string;
  type: string;
  displayLabel: string;
  status: string | null;
  salience: string | null;
  urgency: string | null;
  archived: boolean;
  userOrder: number | null;
  createdAt: string;
  updatedAt: string;
  payload: unknown;
}

export type RecordReadResult =
  | { ok: true; record: RecordRepositoryRecord }
  | { ok: false; kind: "not-found" | "malformed-record"; message: string; id?: string };

export type StoryConfigKind = "STORY CONTRACT" | "UNIVERSAL CONTENT POLICY" | "PROSE MODE";

export type JsonReadResult =
  | { ok: true; payload: unknown }
  | { ok: false; kind: "not-found" | "malformed-json"; message: string };

export interface AcceptedSegment {
  id: number;
  sequence: number;
  text: string;
  metadata: unknown;
  createdAt: string;
}

export interface AcceptedSegmentReminderRef {
  sequence: number;
  createdAt: string;
}

export interface AcceptedSegmentReconciliationSource {
  id: number;
  sequence: number;
  acceptedAt: string;
  text: string;
}

export interface CreateRecordInput {
  type: string;
  displayLabel: string;
  payload: unknown;
  userOrder?: number | null;
}

export interface UpdateRecordInput {
  id: string;
  displayLabel?: string;
  payload: unknown;
  userOrder?: number | null;
}

export interface IncomingRecordReference {
  fromRecordId: string;
  refRole: string;
}

const storyConfigSchemas: Record<StoryConfigKind, ZodType> = {
  "STORY CONTRACT": storyContractSchema,
  "UNIVERSAL CONTENT POLICY": universalContentPolicySchema,
  "PROSE MODE": proseModeSchema
};

function nowIso(): string {
  return new Date().toISOString();
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(value);
}

function payloadRecordId(payload: unknown): string | null {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "id" in payload &&
    typeof (payload as { id?: unknown }).id === "string"
  ) {
    return (payload as { id: string }).id;
  }

  return null;
}

function schemaDefinition(schema: ZodType): Record<string, unknown> {
  return (schema as unknown as { _def?: Record<string, unknown>; def?: Record<string, unknown> })._def
    ?? (schema as unknown as { def?: Record<string, unknown> }).def
    ?? {};
}

function schemaType(schema: ZodType): string | undefined {
  return schemaDefinition(schema).type as string | undefined;
}

function objectShape(schema: ZodType): Record<string, ZodType> {
  const shape = schemaDefinition(schema).shape as Record<string, ZodType> | (() => Record<string, ZodType>);

  if (typeof shape === "function") {
    return shape();
  }

  return shape;
}

function schemaHasRecordId(schema: ZodType): boolean {
  return schemaType(schema) === "object" && Object.hasOwn(objectShape(schema), "id");
}

function injectRecordId(schema: ZodType, payload: unknown, id: string): unknown {
  if (!schemaHasRecordId(schema) || typeof payload !== "object" || payload === null) {
    return payload;
  }

  return { ...payload, id };
}

function parsePayloadJson(json: string): unknown {
  return JSON.parse(json) as unknown;
}

function boolFromInteger(value: unknown): boolean {
  return value === 1;
}

function normalizeProjection(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function rowToRecord(row: Record<string, unknown>, payload: unknown): RecordRepositoryRecord {
  return {
    id: String(row.id),
    type: String(row.type),
    displayLabel: String(row.display_label),
    status: typeof row.status === "string" ? row.status : null,
    salience: normalizeProjection(row.salience),
    urgency: normalizeProjection(row.urgency),
    archived: boolFromInteger(row.archived),
    userOrder: typeof row.user_order === "number" ? row.user_order : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    payload
  };
}

export class RecordIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecordIntegrityError";
  }
}

export class RecordRepository {
  constructor(private readonly database: DatabaseSync) {}

  createRecord(input: CreateRecordInput): RecordRepositoryRecord {
    const definition = getRecordTypeDefinition(input.type);
    if (!definition) {
      throw new Error(`Unsupported record type: ${input.type}`);
    }

    const id = payloadRecordId(input.payload) ?? generateRecordId();
    const payload = parseRecordPayload(input.type, injectRecordId(definition.payloadSchema, input.payload, id));
    const timestamp = nowIso();
    const status = projectRecordStatus(input.type, payload);
    const salience = normalizeProjection(projectRecordSalience(input.type, payload));
    const urgency = normalizeProjection(projectRecordUrgency(input.type, payload));

    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database
        .prepare(
          `INSERT INTO records (
            id, type, display_label, status, salience, urgency, archived, user_order,
            created_at, updated_at, payload_json
          ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`
        )
        .run(
          id,
          input.type,
          input.displayLabel,
          status,
          salience,
          urgency,
          input.userOrder ?? null,
          timestamp,
          timestamp,
          canonicalJson(payload)
        );
      this.refreshReferences(id, definition.extractReferences(payload));
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }

    return {
      id,
      type: input.type,
      displayLabel: input.displayLabel,
      status,
      salience,
      urgency,
      archived: false,
      userOrder: input.userOrder ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
      payload
    };
  }

  updateRecord(input: UpdateRecordInput): RecordRepositoryRecord {
    const existing = this.getExistingRecordRow(input.id);
    const type = String(existing.type);
    const definition = getRecordTypeDefinition(type);
    if (!definition) {
      throw new Error(`Unsupported record type: ${type}`);
    }

    const payloadId = payloadRecordId(input.payload);
    if (payloadId !== null && payloadId !== input.id) {
      throw new RecordIntegrityError(`Record update id mismatch: row ${input.id} vs payload ${payloadId}`);
    }
    const payload = parseRecordPayload(type, injectRecordId(definition.payloadSchema, input.payload, input.id));

    const timestamp = nowIso();
    const displayLabel = input.displayLabel ?? String(existing.display_label);
    const userOrder = input.userOrder ?? (typeof existing.user_order === "number" ? existing.user_order : null);
    const status = projectRecordStatus(type, payload);
    const salience = normalizeProjection(projectRecordSalience(type, payload));
    const urgency = normalizeProjection(projectRecordUrgency(type, payload));

    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database
        .prepare(
          `UPDATE records
             SET display_label = ?, status = ?, salience = ?, urgency = ?, user_order = ?,
                 updated_at = ?, payload_json = ?
           WHERE id = ?`
        )
        .run(displayLabel, status, salience, urgency, userOrder, timestamp, canonicalJson(payload), input.id);
      this.refreshReferences(input.id, definition.extractReferences(payload));
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }

    return {
      id: input.id,
      type,
      displayLabel,
      status,
      salience,
      urgency,
      archived: boolFromInteger(existing.archived),
      userOrder,
      createdAt: String(existing.created_at),
      updatedAt: timestamp,
      payload
    };
  }

  getRecord(id: string): RecordReadResult {
    const row = this.database.prepare("SELECT * FROM records WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;

    if (!row) {
      return { ok: false, kind: "not-found", message: `Record not found: ${id}`, id };
    }

    try {
      const payload = parseRecordPayload(String(row.type), parsePayloadJson(String(row.payload_json)));
      return { ok: true, record: rowToRecord(row, payload) };
    } catch (error) {
      if (error instanceof SyntaxError || error instanceof ZodError) {
        return {
          ok: false,
          kind: "malformed-record",
          message: `Record ${id} has malformed payload JSON.`,
          id
        };
      }

      throw error;
    }
  }

  listRecords(options: { type?: string; includeArchived?: boolean } = {}): RecordReadResult[] {
    const rows = this.database
      .prepare(
        `SELECT * FROM records
          WHERE (?1 IS NULL OR type = ?1)
            AND (?2 = 1 OR archived = 0)
          ORDER BY COALESCE(user_order, 9223372036854775807), created_at, id`
      )
      .all(options.type ?? null, options.includeArchived ? 1 : 0) as Record<string, unknown>[];

    return rows.map((row) => this.getRecord(String(row.id)));
  }

  archiveRecord(id: string): void {
    this.assertNoActiveInboundReferences(id);
    this.database.prepare("UPDATE records SET archived = 1, updated_at = ? WHERE id = ?").run(nowIso(), id);
  }

  deleteRecord(id: string): void {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.assertNoActiveInboundReferences(id);
      this.database.prepare("DELETE FROM records WHERE id = ?").run(id);
      this.pruneDeletedRecordFromGenerationSession(id);
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  setStoryConfig(kind: StoryConfigKind, payloadInput: unknown): void {
    const payload = storyConfigSchemas[kind].parse(payloadInput);
    this.database
      .prepare(
        `INSERT INTO story_config (kind, payload_json, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(kind) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at`
      )
      .run(kind, canonicalJson(payload), nowIso());
  }

  getStoryConfig(kind: StoryConfigKind): JsonReadResult {
    const row = this.database.prepare("SELECT payload_json FROM story_config WHERE kind = ?").get(kind) as
      | { payload_json: string }
      | undefined;

    if (!row) {
      return { ok: false, kind: "not-found", message: `Story config not found: ${kind}` };
    }

    return this.parseJsonWithSchema(row.payload_json, storyConfigSchemas[kind], `Story config ${kind}`);
  }

  setGenerationSession(payloadInput: unknown): void {
    const payload = generationSessionDraftSchema.parse(payloadInput);
    this.database
      .prepare(
        `INSERT INTO generation_session (id, payload_json, updated_at)
         VALUES (1, ?, ?)
         ON CONFLICT(id) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at`
      )
      .run(canonicalJson(payload), nowIso());
  }

  getGenerationSession(): JsonReadResult {
    const row = this.database.prepare("SELECT payload_json FROM generation_session WHERE id = 1").get() as
      | { payload_json: string }
      | undefined;

    if (!row) {
      return { ok: false, kind: "not-found", message: "Generation session not found." };
    }

    return this.parseJsonWithSchema(row.payload_json, generationSessionDraftSchema, "Generation session");
  }

  private pruneDeletedRecordFromGenerationSession(deletedId: string): void {
    const row = this.database.prepare("SELECT payload_json FROM generation_session WHERE id = 1").get() as
      | { payload_json: string }
      | undefined;

    if (!row) {
      return;
    }

    const session = generationSessionDraftSchema.parse(JSON.parse(row.payload_json) as unknown);
    const result = pruneWorkingSetReferences(session, (id) => id !== deletedId);
    if (result.removed.length === 0) {
      return;
    }

    this.database
      .prepare(
        `INSERT INTO generation_session (id, payload_json, updated_at)
         VALUES (1, ?, ?)
         ON CONFLICT(id) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at`
      )
      .run(canonicalJson(result.session), nowIso());
  }

  appendAcceptedSegment(input: { text: string; metadata?: unknown }): AcceptedSegment {
    const sequenceRow = this.database
      .prepare("SELECT COALESCE(MAX(sequence), 0) + 1 AS next_sequence FROM accepted_segments")
      .get() as { next_sequence: number };
    const sequence = sequenceRow.next_sequence;
    const createdAt = nowIso();
    const metadata = input.metadata ?? {};
    const result = this.database
      .prepare(
        "INSERT INTO accepted_segments (sequence, text, metadata_json, created_at) VALUES (?, ?, ?, ?)"
      )
      .run(sequence, input.text, canonicalJson(metadata), createdAt);

    return { id: Number(result.lastInsertRowid), sequence, text: input.text, metadata, createdAt };
  }

  listAcceptedSegments(): AcceptedSegment[] {
    return (
      this.database
        .prepare("SELECT id, sequence, text, metadata_json, created_at FROM accepted_segments ORDER BY sequence")
        .all() as Record<string, unknown>[]
    ).map((row) => ({
      id: Number(row.id),
      sequence: Number(row.sequence),
      text: String(row.text),
      metadata: parsePayloadJson(String(row.metadata_json)),
      createdAt: String(row.created_at)
    }));
  }

  getLatestAcceptedSegment(): AcceptedSegmentReminderRef | null {
    const row = this.database
      .prepare("SELECT sequence, created_at FROM accepted_segments ORDER BY sequence DESC LIMIT 1")
      .get() as { sequence: number; created_at: string } | undefined;

    if (!row) {
      return null;
    }

    return { sequence: Number(row.sequence), createdAt: String(row.created_at) };
  }

  getLatestAcceptedSegmentForReconciliation(): AcceptedSegmentReconciliationSource | null {
    const row = this.database
      .prepare("SELECT id, sequence, text, created_at FROM accepted_segments ORDER BY sequence DESC LIMIT 1")
      .get() as { id: number; sequence: number; text: string; created_at: string } | undefined;

    if (!row) {
      return null;
    }

    return {
      id: Number(row.id),
      sequence: Number(row.sequence),
      acceptedAt: String(row.created_at),
      text: String(row.text)
    };
  }

  getReminderAcknowledgedSequence(): number {
    const row = this.database
      .prepare("SELECT acknowledged_through_sequence FROM reminder_state WHERE id = 1")
      .get() as { acknowledged_through_sequence: number } | undefined;

    return row ? Number(row.acknowledged_through_sequence) : 0;
  }

  acknowledgeRemindersThrough(sequence: number): void {
    this.database
      .prepare(
        `INSERT INTO reminder_state (id, acknowledged_through_sequence, updated_at)
         VALUES (1, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           acknowledged_through_sequence = excluded.acknowledged_through_sequence,
           updated_at = excluded.updated_at`
      )
      .run(sequence, nowIso());
  }

  deleteAcceptedSegment(id: number): boolean {
    const result = this.database.prepare("DELETE FROM accepted_segments WHERE id = ?").run(id);
    return result.changes > 0;
  }

  referencesForRecord(id: string): RecordReference[] {
    return this.database
      .prepare("SELECT ref_role AS refRole, target_id AS targetId FROM record_references WHERE from_record_id = ?")
      .all(id) as unknown as RecordReference[];
  }

  incomingReferencesForRecord(id: string): IncomingRecordReference[] {
    return this.database
      .prepare(
        `SELECT rr.from_record_id AS fromRecordId, rr.ref_role AS refRole
           FROM record_references rr
           JOIN records r ON r.id = rr.from_record_id
          WHERE rr.target_id = ?
            AND r.archived = 0
          ORDER BY rr.from_record_id, rr.ref_role`
      )
      .all(id) as unknown as IncomingRecordReference[];
  }

  private getExistingRecordRow(id: string): Record<string, unknown> {
    const row = this.database.prepare("SELECT * FROM records WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;

    if (!row) {
      throw new Error(`Record not found: ${id}`);
    }

    return row;
  }

  private refreshReferences(fromRecordId: string, references: RecordReference[]): void {
    this.database.prepare("DELETE FROM record_references WHERE from_record_id = ?").run(fromRecordId);
    const insert = this.database.prepare(
      "INSERT OR IGNORE INTO record_references (from_record_id, ref_role, target_id) VALUES (?, ?, ?)"
    );

    for (const reference of references) {
      insert.run(fromRecordId, reference.refRole, reference.targetId);
    }
  }

  private assertNoActiveInboundReferences(targetId: string): void {
    const incoming = this.incomingReferencesForRecord(targetId);

    if (incoming.length > 0) {
      const referrers = incoming.map((reference) => `${reference.fromRecordId}:${reference.refRole}`).join(", ");
      throw new RecordIntegrityError(`Record ${targetId} is referenced by active records: ${referrers}.`);
    }
  }

  private parseJsonWithSchema(json: string, schema: ZodType, label: string): JsonReadResult {
    try {
      return { ok: true, payload: schema.parse(parsePayloadJson(json)) };
    } catch (error) {
      if (error instanceof SyntaxError || error instanceof ZodError) {
        return { ok: false, kind: "malformed-json", message: `${label} has malformed JSON.` };
      }

      throw error;
    }
  }
}
