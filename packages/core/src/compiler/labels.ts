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

/**
 * Like {@link resolveRecordLabel} but fails closed instead of falling back to the raw id: an
 * unresolvable reference yields `""`, never the stored identifier. Used where a raw identifier must
 * never stand in for a name (e.g. cast identity per PRD #129; compiler-contract §9 cast exception).
 */
export function resolveRecordLabelStrict(snapshot: ValidationSnapshot, value: unknown): string {
  const id = asString(value);
  if (!id) {
    return "";
  }

  const record = snapshot.records.find((item) => item.id === id);
  return record ? displayLabel(record) : "";
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
