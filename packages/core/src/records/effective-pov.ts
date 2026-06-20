import type { ValidationSnapshot } from "../validation/snapshot.js";

export type EffectivePov = string | undefined;

export function resolveEffectivePov(snapshot: ValidationSnapshot): EffectivePov {
  const configuredPov = snapshot.storyConfig.proseMode?.pov_character;

  if (configuredPov === "variable") {
    return snapshot.generationSession.active_working_set?.selected_pov;
  }

  return configuredPov;
}
