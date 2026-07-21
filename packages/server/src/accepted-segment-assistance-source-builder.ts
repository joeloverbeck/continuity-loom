import {
  briefFieldCitationKey,
  deriveFullDisplayLabel,
  extractRecordReferences,
  getRecordTypeDefinition,
  parseRecordPayload,
  partitionAcceptedSegmentSpans,
  projectRecordStatus,
  RECONCILIATION_BRIEF_FIELD_PATHS,
  type AcceptedSegmentSpan,
  type GenerationSessionDraft,
  type ReconciliationBriefField,
  type ReconciliationRecord,
  type ReconciliationReferenceStub,
  type SegmentReconciliationAcceptedSegment,
  type SegmentReconciliationRequest
} from "@loom/core";

import type {
  AcceptedSegmentReconciliationSource,
  JsonReadResult,
  RecordReadResult
} from "./record-repository.js";

export interface AcceptedSegmentAssistanceRepository {
  listRecords(options: { includeArchived: false }): RecordReadResult[];
  getGenerationSession(): JsonReadResult;
  getLatestAcceptedSegmentForReconciliation(): AcceptedSegmentReconciliationSource | null;
}

export interface AcceptedSegmentAssistanceSource {
  request: SegmentReconciliationRequest;
  acceptedSegment: SegmentReconciliationAcceptedSegment;
  generationBriefDraft: GenerationSessionDraft;
  briefFields: readonly ReconciliationBriefField[];
  records: readonly ReconciliationRecord[];
  referenceStubs: readonly ReconciliationReferenceStub[];
  acceptedSegmentSpans: readonly AcceptedSegmentSpan[];
}

export type BuildAcceptedSegmentAssistanceSourceResult =
  | { ok: true; source: AcceptedSegmentAssistanceSource }
  | {
      ok: false;
      status: 409 | 422;
      body: {
        ok: false;
        kind: "no-accepted-segment" | "malformed-accepted-segment-assistance-source";
        message: string;
      };
    };

export function buildAcceptedSegmentAssistanceSource(
  repository: AcceptedSegmentAssistanceRepository,
  request: SegmentReconciliationRequest
): BuildAcceptedSegmentAssistanceSourceResult {
  const acceptedSegment = repository.getLatestAcceptedSegmentForReconciliation();
  if (!acceptedSegment) {
    return {
      ok: false,
      status: 409,
      body: { ok: false, kind: "no-accepted-segment", message: "No accepted segment exists for assistance." }
    };
  }

  const draftResult = readGenerationDraft(repository);
  if (!draftResult.ok) {
    return malformed(draftResult.message);
  }

  const recordsResult = scopedRecords(repository, request, draftResult.draft);
  if (!recordsResult.ok) {
    return malformed(recordsResult.message);
  }

  return {
    ok: true,
    source: {
      request,
      acceptedSegment: {
        id: String(acceptedSegment.id),
        sequence: acceptedSegment.sequence,
        acceptedAt: acceptedSegment.acceptedAt,
        text: acceptedSegment.text
      },
      generationBriefDraft: draftResult.draft,
      briefFields: briefFieldsFor(draftResult.draft),
      records: recordsResult.records,
      referenceStubs: recordsResult.referenceStubs,
      acceptedSegmentSpans: partitionAcceptedSegmentSpans(acceptedSegment.text, acceptedSegment.sequence)
    }
  };
}

function readGenerationDraft(repository: AcceptedSegmentAssistanceRepository):
  | { ok: true; draft: GenerationSessionDraft }
  | { ok: false; message: string } {
  const result = repository.getGenerationSession();
  if (!result.ok) {
    if (result.kind === "not-found") {
      return { ok: true, draft: {} };
    }
    return { ok: false, message: result.message };
  }
  return { ok: true, draft: objectPayload(result.payload) };
}

function scopedRecords(
  repository: AcceptedSegmentAssistanceRepository,
  request: SegmentReconciliationRequest,
  draft: GenerationSessionDraft
):
  | { ok: true; records: readonly ReconciliationRecord[]; referenceStubs: readonly ReconciliationReferenceStub[] }
  | { ok: false; message: string } {
  const results = repository.listRecords({ includeArchived: false });
  const scopeIds = scopeRecordIds(request, draft);
  const allRecords = new Map<string, ReconciliationRecord>();
  const scoped = new Map<string, ReconciliationRecord>();

  for (const result of results) {
    if (!result.ok) {
      if (!scopeIds || (result.id !== undefined && scopeIds.has(result.id))) {
        return { ok: false, message: result.message };
      }
      continue;
    }

    const recordResult = assistanceRecord(result.record);
    if (!recordResult.ok) {
      if (!scopeIds || scopeIds.has(result.record.id)) {
        return { ok: false, message: recordResult.message };
      }
      continue;
    }

    if (allRecords.has(recordResult.record.id)) {
      return { ok: false, message: `Duplicate record id in accepted-segment assistance source: ${recordResult.record.id}` };
    }
    allRecords.set(recordResult.record.id, recordResult.record);
    if (!scopeIds || scopeIds.has(recordResult.record.id)) {
      scoped.set(recordResult.record.id, recordResult.record);
    }
  }

  const stubResult = referenceStubsFor(scoped, allRecords);
  return stubResult.ok
    ? { ok: true, records: [...scoped.values()], referenceStubs: stubResult.referenceStubs }
    : stubResult;
}

function assistanceRecord(record: {
  id: string;
  type: string;
  displayLabel: string;
  payload: unknown;
}): { ok: true; record: ReconciliationRecord } | { ok: false; message: string } {
  if (!getRecordTypeDefinition(record.type)) {
    return { ok: false, message: `Unsupported record type in accepted-segment assistance source: ${record.type}` };
  }
  try {
    parseRecordPayload(record.type, record.payload);
  } catch {
    return { ok: false, message: `Record ${record.id} has malformed accepted-segment assistance payload.` };
  }
  return {
    ok: true,
    record: {
      id: record.id,
      type: record.type,
      displayLabel: deriveFullDisplayLabel(record.type, record.payload),
      payload: record.payload,
      lifecycleStatus: projectRecordStatus(record.type, record.payload)
    }
  };
}

function referenceStubsFor(
  records: ReadonlyMap<string, ReconciliationRecord>,
  allRecords: ReadonlyMap<string, ReconciliationRecord>
): { ok: true; referenceStubs: readonly ReconciliationReferenceStub[] } | { ok: false; message: string } {
  const stubs = new Map<string, ReconciliationReferenceStub>();
  for (const record of records.values()) {
    for (const reference of extractRecordReferences(record.type, record.payload)) {
      if (records.has(reference.targetId) || stubs.has(reference.targetId)) {
        continue;
      }
      const target = allRecords.get(reference.targetId);
      if (!target) {
        return { ok: false, message: `Record ${record.id} references missing assistance target ${reference.targetId}.` };
      }
      stubs.set(reference.targetId, {
        id: target.id,
        type: target.type,
        displayLabel: target.displayLabel
      });
    }
  }
  return { ok: true, referenceStubs: [...stubs.values()] };
}

function scopeRecordIds(
  request: SegmentReconciliationRequest,
  draft: GenerationSessionDraft
): ReadonlySet<string> | null {
  if (request.recordScope !== "active_working_set") {
    return null;
  }
  const selectedRecords = objectPayload(draft.active_working_set).selected_records;
  return new Set(Array.isArray(selectedRecords)
    ? selectedRecords.filter((value): value is string => typeof value === "string")
    : []);
}

function briefFieldsFor(draft: GenerationSessionDraft): readonly ReconciliationBriefField[] {
  return RECONCILIATION_BRIEF_FIELD_PATHS.map((fieldPath) => {
    const value = valueAtPath(draft, fieldPath);
    if (value.state === "missing") {
      return { fieldPath, citationKey: briefFieldCitationKey(fieldPath), currentState: "missing" };
    }
    if (isBlank(value.value)) {
      return { fieldPath, citationKey: briefFieldCitationKey(fieldPath), currentState: "blank" };
    }
    return {
      fieldPath,
      citationKey: briefFieldCitationKey(fieldPath),
      currentState: "present",
      currentValue: value.value
    };
  });
}

function valueAtPath(value: unknown, path: string): { state: "present"; value: unknown } | { state: "missing" } {
  let current = value;
  for (const part of path.split(".")) {
    if (!current || typeof current !== "object" || !Object.hasOwn(current, part)) {
      return { state: "missing" };
    }
    current = (current as Record<string, unknown>)[part];
  }
  return { state: "present", value: current };
}

function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === "string") {
    return value.trim().length === 0;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return typeof value === "object" && Object.keys(value).length === 0;
}

function objectPayload(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? { ...(value as Record<string, unknown>) } : {};
}

function malformed(message: string): BuildAcceptedSegmentAssistanceSourceResult {
  return {
    ok: false,
    status: 422,
    body: { ok: false, kind: "malformed-accepted-segment-assistance-source", message }
  };
}
