import type { ValidationRecord, ValidationSnapshot } from "../validation/snapshot.js";

export function displayLabel(record: ValidationRecord): string {
  const promptLabel = promptFacingLabel(record);
  if (promptLabel) {
    return promptLabel;
  }

  const fixtureLabel = (record as ValidationRecord & { displayLabel?: unknown }).displayLabel;
  return record.metadata?.displayLabel || asString(fixtureLabel) || record.id;
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

function promptFacingLabel(record: ValidationRecord): string {
  const payload = record.payload && typeof record.payload === "object"
    ? (record.payload as Record<string, unknown>)
    : {};

  if (record.type === "ENTITY") {
    return asString(payload.display_name);
  }

  if (record.type === "LOCATION" || record.type === "OBJECT" || record.type === "VISIBLE AFFORDANCE") {
    return asString(payload.label);
  }

  return "";
}
