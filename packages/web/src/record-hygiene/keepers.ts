import type { ParsedRecordHygieneFinding } from "../api.js";

const keepersKey = "loom.record-hygiene.keepers.v1";

export type RecordHygieneKeeper = ParsedRecordHygieneFinding;

export function listKeepers(): readonly RecordHygieneKeeper[] {
  const stored = sessionStorage.getItem(keepersKey);
  if (!stored) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter(isKeeper) : [];
  } catch {
    return [];
  }
}

export function addKeeper(finding: RecordHygieneKeeper): readonly RecordHygieneKeeper[] {
  const keepers = listKeepers();
  if (keepers.some((keeper) => keeperKey(keeper) === keeperKey(finding))) {
    return keepers;
  }

  const updated = [...keepers, finding];
  sessionStorage.setItem(keepersKey, JSON.stringify(updated));
  return updated;
}

export function removeKeeper(finding: RecordHygieneKeeper): readonly RecordHygieneKeeper[] {
  const updated = listKeepers().filter((keeper) => keeperKey(keeper) !== keeperKey(finding));
  if (updated.length === 0) {
    clearKeepers();
  } else {
    sessionStorage.setItem(keepersKey, JSON.stringify(updated));
  }
  return updated;
}

export function clearKeepers(): void {
  sessionStorage.removeItem(keepersKey);
}

export function keeperKey(finding: Pick<RecordHygieneKeeper, "number" | "cluster" | "action">): string {
  return `${finding.number}:${finding.cluster}:${finding.action}`;
}

function isKeeper(value: unknown): value is RecordHygieneKeeper {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<RecordHygieneKeeper>;
  return typeof candidate.number === "number"
    && typeof candidate.cluster === "string"
    && typeof candidate.action === "string"
    && Array.isArray(candidate.citations);
}
