import {
  deriveFullDisplayLabel,
  getRecordTypeDefinition,
  HYGIENE_TYPE_ORDER,
  isHygieneActive,
  parseRecordPayload,
  projectRecordStatus,
  type HygieneRecord,
  type StoryRecordHygieneSnapshot
} from "@loom/core";

import type { IncomingRecordReference, RecordReadResult } from "./record-repository.js";

export type BuildRecordHygieneSnapshotResult =
  | { ok: true; snapshot: StoryRecordHygieneSnapshot }
  | { ok: false; status: 422; body: { ok: false; kind: "malformed-hygiene-source"; message: string } };

export interface RecordHygieneRepository {
  listRecords(options: { includeArchived: false }): RecordReadResult[];
  referencesForRecord(id: string): readonly { refRole: string; targetId: string }[];
  incomingReferencesForRecord(id: string): readonly IncomingRecordReference[];
}

export function buildStoryRecordHygieneSnapshot(repository: RecordHygieneRepository): BuildRecordHygieneSnapshotResult {
  const results = repository.listRecords({ includeArchived: false });
  const records = [];
  const seenIds = new Set<string>();
  const labelsById = new Map<string, string>();

  for (const result of results) {
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

  return {
    ok: true,
    snapshot: {
      records,
      referenceIndex: Object.fromEntries(records.map((record) => [record.id, referenceSummary(repository, record.id, labelsById)])),
      versions: { template: "server-built", compiler: "server-built", contract: "server-built" }
    }
  };
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
