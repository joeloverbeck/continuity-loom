import type { ValidationRecord } from "../../validation/snapshot.js";
import { displayLabel } from "../labels.js";

export function citationKey(record: ValidationRecord): string {
  return makeCitationKey(record, "");
}

export function citationKeysFor(records: readonly ValidationRecord[]): ReadonlyMap<string, string> {
  const sortedRecords = [...records].sort(compareRecordsForKeys);
  const baseCounts = new Map<string, number>();
  const keys = new Map<string, string>();

  for (const record of sortedRecords) {
    const base = citationKeyBase(record);
    const count = baseCounts.get(base) ?? 0;
    baseCounts.set(base, count + 1);
    keys.set(record.id, makeCitationKey(record, count === 0 ? "" : ` ${count + 1}`));
  }

  return keys;
}

function citationKeyBase(record: ValidationRecord): string {
  return `${record.type}: ${recordLabel(record)}`;
}

function makeCitationKey(record: ValidationRecord, suffix: string): string {
  return `[${citationKeyBase(record)}${suffix}]`;
}

function compareRecordsForKeys(left: ValidationRecord, right: ValidationRecord): number {
  return (
    left.type.localeCompare(right.type) ||
    recordLabel(left).localeCompare(recordLabel(right)) ||
    left.id.localeCompare(right.id)
  );
}

function recordLabel(record: ValidationRecord): string {
  return displayLabel(record);
}
