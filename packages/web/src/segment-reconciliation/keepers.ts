import type {
  ParsedBriefProposal,
  ParsedRecordChangeProposal,
  ParsedRecordCreationProposal
} from "@loom/core";

const keyPrefix = "loom.segment-reconciliation.keepers.v1";

export type SegmentReconciliationKeeper =
  | { kind: "brief"; proposal: ParsedBriefProposal }
  | { kind: "record-change"; proposal: ParsedRecordChangeProposal }
  | { kind: "record-creation"; proposal: ParsedRecordCreationProposal };

export function listKeepers(scope: string): readonly SegmentReconciliationKeeper[] {
  const stored = sessionStorage.getItem(storageKey(scope));
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

export function addKeeper(scope: string, keeper: SegmentReconciliationKeeper): readonly SegmentReconciliationKeeper[] {
  const keepers = listKeepers(scope);
  if (keepers.some((candidate) => keeperKey(candidate) === keeperKey(keeper))) {
    return keepers;
  }

  const updated = [...keepers, keeper];
  sessionStorage.setItem(storageKey(scope), JSON.stringify(updated));
  return updated;
}

export function removeKeeper(scope: string, keeper: SegmentReconciliationKeeper): readonly SegmentReconciliationKeeper[] {
  const updated = listKeepers(scope).filter((candidate) => keeperKey(candidate) !== keeperKey(keeper));
  if (updated.length === 0) {
    clearKeepers(scope);
  } else {
    sessionStorage.setItem(storageKey(scope), JSON.stringify(updated));
  }
  return updated;
}

export function clearKeepers(scope: string): void {
  sessionStorage.removeItem(storageKey(scope));
}

export function keeperScope(projectKey: string, promptFingerprint: string): string {
  return `${projectKey}:${promptFingerprint}`;
}

export function keeperKey(keeper: SegmentReconciliationKeeper): string {
  return `${keeper.kind}:${keeper.proposal.id}`;
}

function storageKey(scope: string): string {
  return `${keyPrefix}:${scope}`;
}

function isKeeper(value: unknown): value is SegmentReconciliationKeeper {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SegmentReconciliationKeeper>;
  return (
    (candidate.kind === "brief" || candidate.kind === "record-change" || candidate.kind === "record-creation") &&
    typeof candidate.proposal === "object" &&
    candidate.proposal !== null &&
    "id" in candidate.proposal &&
    typeof (candidate.proposal as { id?: unknown }).id === "string"
  );
}
