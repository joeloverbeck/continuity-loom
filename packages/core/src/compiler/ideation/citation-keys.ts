import type { ValidationRecord } from "../../validation/snapshot.js";
import { displayLabel } from "../labels.js";

export function citationKey(record: ValidationRecord): string {
  return makeCitationKey(record, "");
}

export function citationKeysFor(records: readonly ValidationRecord[]): ReadonlyMap<string, string> {
  const sortedRecords = [...records].sort(compareRecordsForKeys);
  const typeCounts = new Map<string, number>();
  const keys = new Map<string, string>();

  for (const record of sortedRecords) {
    const count = (typeCounts.get(record.type) ?? 0) + 1;
    typeCounts.set(record.type, count);
    keys.set(record.id, makeCitationKey(record, String(count)));
  }

  return keys;
}

function makeCitationKey(record: ValidationRecord, suffix: string): string {
  return `[${record.type}-${suffix || "1"}]`;
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
