import type { ValidationRecord, ValidationSnapshot } from "../validation/snapshot.js";
import { deriveFullDisplayLabel } from "../records/editor-descriptors.js";

export function displayLabel(record: ValidationRecord): string {
  return deriveFullDisplayLabel(record.type, record.payload);
}

export function resolveRecordLabel(snapshot: ValidationSnapshot, value: unknown): string {
  const id = asString(value);
  if (!id) {
    return "";
  }

  const record = snapshot.records.find((item) => item.id === id);
  return record ? displayLabel(record) : id;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
