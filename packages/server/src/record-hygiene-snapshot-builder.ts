import {
  deriveFullDisplayLabel,
  getRecordTypeDefinition,
  HYGIENE_TYPE_ORDER,
  isHygieneActive,
  parseRecordPayload,
  projectRecordStatus,
  type HygieneRecord,
  type RecordHygieneRequest,
  type StoryRecordHygieneSnapshot
} from "@loom/core";

import type { IncomingRecordReference, JsonReadResult, RecordReadResult } from "./record-repository.js";

export type BuildRecordHygieneSnapshotResult =
  | { ok: true; snapshot: StoryRecordHygieneSnapshot }
  | { ok: false; status: 422; body: { ok: false; kind: "malformed-hygiene-source"; message: string } };

const typeRank = new Map<string, number>(HYGIENE_TYPE_ORDER.map((recordType, index) => [recordType, index]));

export interface RecordHygieneRepository {
  listRecords(options: { includeArchived: false }): RecordReadResult[];
  referencesForRecord(id: string): readonly { refRole: string; targetId: string }[];
  incomingReferencesForRecord(id: string): readonly IncomingRecordReference[];
  getGenerationSession(): JsonReadResult;
}

export function buildStoryRecordHygieneSnapshot(
  repository: RecordHygieneRepository,
  request: RecordHygieneRequest
): BuildRecordHygieneSnapshotResult {
  const results = repository.listRecords({ includeArchived: false });
  const scopeIds = scopeRecordIds(repository, request);
  const records = [];
  const seenIds = new Set<string>();
  const labelsById = new Map<string, string>();

  for (const result of results) {
    if (scopeIds && !isResultInScope(result, scopeIds)) {
      continue;
    }

    if (!result.ok) {
      return malformed(result.message);
    }

    const { record } = result;
    if (seenIds.has(record.id)) {
      return malformed(`Duplicate record id in hygiene source: ${record.id}`);
    }
    seenIds.add(record.id);
    labelsById.set(record.id, record.displayLabel);

    if (!getRecordTypeDefinition(record.type)) {
      return malformed(`Unsupported record type in hygiene source: ${record.type}`);
    }

    try {
      parseRecordPayload(record.type, record.payload);
    } catch {
      return malformed(`Record ${record.id} has malformed hygiene payload.`);
    }

    if (!isHygieneActive(record)) {
      continue;
    }

    if (!HYGIENE_TYPE_ORDER.includes(record.type as (typeof HYGIENE_TYPE_ORDER)[number])) {
      return malformed(`Unsupported hygiene record type: ${record.type}`);
    }

    records.push({
      id: record.id,
      type: record.type as HygieneRecord["type"],
      displayLabel: record.displayLabel,
      fullDisplayLabel: deriveFullDisplayLabel(record.type, record.payload),
      status: projectRecordStatus(record.type, record.payload),
      payload: record.payload
    });
  }

  const orderedRecords = orderHygieneRecords(records);

  return {
    ok: true,
    snapshot: {
      records: orderedRecords,
      referenceIndex: Object.fromEntries(orderedRecords.map((record) => [record.id, referenceSummary(repository, record.id, labelsById)])),
      versions: { template: "server-built", compiler: "server-built", contract: "server-built" }
    }
  };
}

function orderHygieneRecords(records: readonly HygieneRecord[]): readonly HygieneRecord[] {
  return [...records].sort(
    (left, right) =>
      (typeRank.get(left.type) ?? Number.MAX_SAFE_INTEGER) - (typeRank.get(right.type) ?? Number.MAX_SAFE_INTEGER)
      || left.fullDisplayLabel.localeCompare(right.fullDisplayLabel)
      || left.id.localeCompare(right.id)
  );
}

function scopeRecordIds(repository: RecordHygieneRepository, request: RecordHygieneRequest): ReadonlySet<string> | null {
  if (request.mode !== "active_working_set_atomic_review") {
    return null;
  }

  const sessionResult = repository.getGenerationSession();
  if (!sessionResult.ok) {
    return new Set();
  }

  const session = objectPayload(sessionResult.payload);
  const activeWorkingSet = objectPayload(session.active_working_set);
  const selectedRecords = activeWorkingSet.selected_records;

  return new Set(Array.isArray(selectedRecords) ? selectedRecords.filter((value): value is string => typeof value === "string") : []);
}

function objectPayload(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? { ...(value as Record<string, unknown>) } : {};
}

function isResultInScope(result: RecordReadResult, scopeIds: ReadonlySet<string>): boolean {
  return result.ok ? scopeIds.has(result.record.id) : result.id !== undefined && scopeIds.has(result.id);
}

function referenceSummary(repository: RecordHygieneRepository, recordId: string, labelsById: ReadonlyMap<string, string>) {
  return {
    outgoing: repository.referencesForRecord(recordId).map((reference) => `${reference.refRole} -> ${labelFor(labelsById, reference.targetId)} (${reference.targetId})`),
    incoming: repository.incomingReferencesForRecord(recordId).map((reference) => `${labelFor(labelsById, reference.fromRecordId)} (${reference.fromRecordId}):${reference.refRole}`)
  };
}

function labelFor(labelsById: ReadonlyMap<string, string>, id: string): string {
  return labelsById.get(id) ?? id;
}

function malformed(message: string): BuildRecordHygieneSnapshotResult {
  return {
    ok: false,
    status: 422,
    body: { ok: false, kind: "malformed-hygiene-source", message }
  };
}
