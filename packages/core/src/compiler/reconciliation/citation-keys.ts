import { recordTypes } from "../../records/registry.js";
import type {
  ReconciliationBriefFieldPath,
  ReconciliationRecord,
  ReconciliationReferenceStub
} from "./types.js";

export const RECORD_SCOPE_CITATION_KEY = "[RECORD-SCOPE]";

export function segmentSpanCitationKey(sequence: number, spanIndex: number): string {
  return `[SEG-${sequence}-S${String(spanIndex).padStart(3, "0")}]`;
}

export function briefFieldCitationKey(fieldPath: ReconciliationBriefFieldPath): string {
  return `[BRIEF:${fieldPath}]`;
}

export function reconciliationRecordCitationKeysFor(
  records: readonly ReconciliationRecord[]
): ReadonlyMap<string, string> {
  const typeCounts = new Map<string, number>();
  const keys = new Map<string, string>();

  for (const record of [...records].sort(compareRecordsForReconciliationKeys)) {
    const count = (typeCounts.get(record.type) ?? 0) + 1;
    typeCounts.set(record.type, count);
    keys.set(record.id, `[${recordTypeKeyPrefix(record.type)}-${count}]`);
  }

  return keys;
}

export function referenceStubCitationKeysFor(
  stubs: readonly ReconciliationReferenceStub[]
): ReadonlyMap<string, string> {
  const typeCounts = new Map<string, number>();
  const keys = new Map<string, string>();

  for (const stub of [...stubs].sort(compareReferenceStubsForReconciliationKeys)) {
    const count = (typeCounts.get(stub.type) ?? 0) + 1;
    typeCounts.set(stub.type, count);
    keys.set(stub.id, `[REF-${recordTypeKeyPrefix(stub.type)}-${count}]`);
  }

  return keys;
}

export function recordTypeKeyPrefix(recordType: string): string {
  return recordType.trim().replace(/\s+/g, "-");
}

function compareRecordsForReconciliationKeys(left: ReconciliationRecord, right: ReconciliationRecord): number {
  return (
    compareRecordTypes(left.type, right.type) ||
    left.displayLabel.localeCompare(right.displayLabel) ||
    left.id.localeCompare(right.id)
  );
}

function compareReferenceStubsForReconciliationKeys(
  left: ReconciliationReferenceStub,
  right: ReconciliationReferenceStub
): number {
  return (
    compareRecordTypes(left.type, right.type) ||
    left.displayLabel.localeCompare(right.displayLabel) ||
    left.id.localeCompare(right.id)
  );
}

function compareRecordTypes(left: string, right: string): number {
  const leftIndex = recordTypes.indexOf(left);
  const rightIndex = recordTypes.indexOf(right);

  if (leftIndex !== -1 || rightIndex !== -1) {
    return normalizeTypeIndex(leftIndex) - normalizeTypeIndex(rightIndex);
  }

  return left.localeCompare(right);
}

function normalizeTypeIndex(index: number): number {
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}
