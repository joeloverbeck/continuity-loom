const keepersKey = "loom.ideate.keepers.v1";

export interface IdeationKeeper {
  slotNumber: number;
  operator: string;
  headline?: string;
  question?: string;
  why?: string;
  grounds: readonly string[];
  unknownCitations: readonly string[];
}

export function listKeepers(): readonly IdeationKeeper[] {
  const stored = sessionStorage.getItem(keepersKey);
  if (!stored) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isKeeper);
  } catch {
    return [];
  }
}

export function addKeeper(idea: IdeationKeeper): readonly IdeationKeeper[] {
  const keepers = listKeepers();
  if (keepers.some((keeper) => keeperKey(keeper) === keeperKey(idea))) {
    return keepers;
  }

  const updated = [...keepers, idea];
  sessionStorage.setItem(keepersKey, JSON.stringify(updated));
  return updated;
}

export function removeKeeper(idea: IdeationKeeper): readonly IdeationKeeper[] {
  const updated = listKeepers().filter((keeper) => keeperKey(keeper) !== keeperKey(idea));
  writeKeepers(updated);
  return updated;
}

export function clearKeepers(): void {
  sessionStorage.removeItem(keepersKey);
}

export function keeperKey(idea: IdeationKeeper): string {
  return `${idea.slotNumber}:${idea.operator}:${idea.headline ?? idea.question ?? ""}`;
}

function writeKeepers(keepers: readonly IdeationKeeper[]): void {
  if (keepers.length === 0) {
    clearKeepers();
    return;
  }

  sessionStorage.setItem(keepersKey, JSON.stringify(keepers));
}

function isKeeper(value: unknown): value is IdeationKeeper {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<IdeationKeeper>;
  return typeof candidate.slotNumber === "number"
    && typeof candidate.operator === "string"
    && Array.isArray(candidate.grounds)
    && Array.isArray(candidate.unknownCitations);
}
