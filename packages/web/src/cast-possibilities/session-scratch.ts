import type {
  CastPossibilitiesDisclosure,
  CastPossibilitiesOutput
} from "@loom/core";

export interface CastPossibilitiesScratch {
  projectIdentity: string;
  sourceFingerprint: string;
  disclosure: CastPossibilitiesDisclosure;
  possibilities: CastPossibilitiesOutput;
  keptCardIds: readonly string[];
}

const namespace = "continuity-loom:cast-possibilities:v1";

function prefix(projectIdentity: string): string {
  return `${namespace}:${projectIdentity}`;
}

function sourceKey(projectIdentity: string, sourceFingerprint: string): string {
  return `${prefix(projectIdentity)}:${sourceFingerprint}`;
}

function latestKey(projectIdentity: string): string {
  return `${prefix(projectIdentity)}:latest`;
}

export function saveCastPossibilitiesScratch(
  storage: Storage,
  scratch: CastPossibilitiesScratch
): void {
  const previousFingerprint = storage.getItem(latestKey(scratch.projectIdentity));
  if (previousFingerprint && previousFingerprint !== scratch.sourceFingerprint) {
    storage.removeItem(sourceKey(scratch.projectIdentity, previousFingerprint));
  }
  storage.setItem(sourceKey(scratch.projectIdentity, scratch.sourceFingerprint), JSON.stringify(scratch));
  storage.setItem(latestKey(scratch.projectIdentity), scratch.sourceFingerprint);
}

export function loadCastPossibilitiesScratch(
  storage: Storage,
  projectIdentity: string,
  currentFingerprint: string
): { scratch: CastPossibilitiesScratch; stale: boolean } | null {
  const exact = read(storage.getItem(sourceKey(projectIdentity, currentFingerprint)));
  if (exact) {
    return { scratch: exact, stale: false };
  }
  const latest = storage.getItem(latestKey(projectIdentity));
  const prior = latest ? read(storage.getItem(sourceKey(projectIdentity, latest))) : null;
  return prior ? { scratch: prior, stale: prior.sourceFingerprint !== currentFingerprint } : null;
}

export function loadLatestCastPossibilitiesScratch(
  storage: Storage,
  projectIdentity: string
): { scratch: CastPossibilitiesScratch; stale: true } | null {
  const latest = storage.getItem(latestKey(projectIdentity));
  const scratch = latest ? read(storage.getItem(sourceKey(projectIdentity, latest))) : null;
  return scratch ? { scratch, stale: true } : null;
}

export function clearCastPossibilitiesScratch(
  storage: Storage,
  scratch: CastPossibilitiesScratch
): void {
  const projectPrefix = `${prefix(scratch.projectIdentity)}:`;
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(projectPrefix)) {
      keys.push(key);
    }
  }
  for (const key of keys) {
    storage.removeItem(key);
  }
}

function read(value: string | null): CastPossibilitiesScratch | null {
  if (!value) {
    return null;
  }
  try {
    const parsed = JSON.parse(value) as CastPossibilitiesScratch;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
