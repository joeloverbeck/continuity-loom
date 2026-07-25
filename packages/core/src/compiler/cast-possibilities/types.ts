import type { ValidationSnapshot } from "../../validation/snapshot.js";

export const CAST_POSSIBILITIES_SOURCE_PROFILE = "cast-possibilities";
export const CAST_POSSIBILITIES_OUTPUT_CONTRACT = "cast_possibilities.v1";

export const castPossibilitiesVersionInfo = Object.freeze({
  template: "1.0.0",
  compiler: "1.0.6",
  contract: "1.0.0"
});

export interface CastPossibilitiesCompileRequest {
  savedDraftIdentity: string;
  targetCharacterId?: string;
  avoidList?: readonly string[];
}
export interface CastPossibilitiesCharacterDisclosure {
  characterKey: string;
  castMemberId: string;
  entityId: string;
  label: string;
  dossierKeys: readonly string[];
}

export interface CastPossibilitiesDisclosure {
  sourceProfile: typeof CAST_POSSIBILITIES_SOURCE_PROFILE;
  savedDraftIdentity: string;
  selectedPov: { entityId: string; label: string };
  eligibleCharacters: readonly CastPossibilitiesCharacterDisclosure[];
  recordCountsByType: Readonly<Record<string, number>>;
  includesSecrets: boolean;
  promptLength: number;
  tokenEstimate: number;
  versions: typeof castPossibilitiesVersionInfo;
  fingerprint: string;
  citationMap: Readonly<Record<string, string>>;
}

export interface CastPossibilitiesParseContext {
  expectedCharacters: readonly {
    characterKey: string;
    dossierKeys: readonly string[];
  }[];
  contextKeys: readonly string[];
}

export interface CastPossibilitiesCompileSuccess {
  ok: true;
  prompt: string;
  disclosure: CastPossibilitiesDisclosure;
  outputSchema: Record<string, unknown>;
  parseContext: CastPossibilitiesParseContext;
  snapshot: ValidationSnapshot;
}

export interface CastPossibilitiesReadinessBlocker {
  code: string;
  message: string;
  field?: string;
}

export interface CastPossibilitiesCompileBlocked {
  ok: false;
  kind: "cast-possibilities-not-ready";
  blockers: readonly CastPossibilitiesReadinessBlocker[];
  warnings: readonly { code: string; message: string }[];
}

export type CastPossibilitiesCompileResult =
  | CastPossibilitiesCompileSuccess
  | CastPossibilitiesCompileBlocked;

export interface CastPossibilitiesCard {
  observable_move: string;
  character_fit: string;
  moment_fit: string;
  local_effect: string;
  dossier_keys: readonly string[];
  context_keys: readonly string[];
  distinction: string;
}

export interface CastPossibilitiesCharacterResult {
  character_key: string;
  cards: readonly [CastPossibilitiesCard, CastPossibilitiesCard, CastPossibilitiesCard];
}

export interface CastPossibilitiesOutput {
  contract: typeof CAST_POSSIBILITIES_OUTPUT_CONTRACT;
  characters: readonly CastPossibilitiesCharacterResult[];
}
