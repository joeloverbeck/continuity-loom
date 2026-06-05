import {
  generateRecordId,
  generationSessionSchema,
  getRecordTypeDefinition,
  parseRecordPayload,
  projectRecordSalience,
  projectRecordStatus,
  projectRecordUrgency,
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
  salience: string | number | null;
  urgency: string | number | null;
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

function recordIdFromPayload(recordType: string, payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "id" in payload &&
    typeof (payload as { id?: unknown }).id === "string"
  ) {
    return (payload as { id: string }).id;
  }

  return generateRecordId();
}

function parsePayloadJson(json: string): unknown {
  return JSON.parse(json) as unknown;
}

function boolFromInteger(value: unknown): boolean {
  return value === 1;
}

function normalizeProjection(value: unknown): string | number | null {
  return typeof value === "number" || typeof value === "string" ? value : null;
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

    const payload = parseRecordPayload(input.type, input.payload);
    const id = recordIdFromPayload(input.type, payload);
    const timestamp = nowIso();
    const status = projectRecordStatus(input.type, payload);
    const salience = projectRecordSalience(input.type, payload);
    const urgency = projectRecordUrgency(input.type, payload);

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

    const payload = parseRecordPayload(type, input.payload);
    const timestamp = nowIso();
    const displayLabel = input.displayLabel ?? String(existing.display_label);
    const userOrder = input.userOrder ?? (typeof existing.user_order === "number" ? existing.user_order : null);
    const status = projectRecordStatus(type, payload);
    const salience = projectRecordSalience(type, payload);
    const urgency = projectRecordUrgency(type, payload);

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
    this.assertNoActiveInboundReferences(id);
    this.database.prepare("DELETE FROM records WHERE id = ?").run(id);
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
    const payload = generationSessionSchema.parse(payloadInput);
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

    return this.parseJsonWithSchema(row.payload_json, generationSessionSchema, "Generation session");
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

  referencesForRecord(id: string): RecordReference[] {
    return this.database
      .prepare("SELECT ref_role AS refRole, target_id AS targetId FROM record_references WHERE from_record_id = ?")
      .all(id) as unknown as RecordReference[];
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
    const row = this.database
      .prepare(
        `SELECT r.id
           FROM record_references rr
           JOIN records r ON r.id = rr.from_record_id
          WHERE rr.target_id = ?
            AND r.archived = 0
          LIMIT 1`
      )
      .get(targetId) as { id: string } | undefined;

    if (row) {
      throw new RecordIntegrityError(`Record ${targetId} is referenced by active record ${row.id}.`);
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
