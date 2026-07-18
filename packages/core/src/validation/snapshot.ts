import type { GenerationSession } from "../records/generation-brief.js";
import type { GenerationContextCoherence } from "../records/generation-brief-draft.js";
import type {
  ProseMode,
  StoryContract,
  UniversalContentPolicy
} from "../records/global-config.js";
import type { RecordMetadata } from "../records/metadata.js";

export type SelectedCastBand =
  | "active_onstage_cast_full"
  | "present_minor_cast_compressed"
  | "offstage_relevant_cast";

export interface ValidationRecord {
  id: string;
  type: string;
  payload: unknown;
  metadata?: RecordMetadata;
  castBand?: SelectedCastBand;
  localFunction?: string;
}

export interface ValidationVersions {
  template: string;
  compiler: string;
  contract: string;
}

export interface ValidationStoryConfig {
  storyContract?: StoryContract;
  universalContentPolicy?: UniversalContentPolicy;
  proseMode?: ProseMode;
}

export interface BuildValidationSnapshotInput {
  records: readonly ValidationRecord[];
  generationSession: GenerationSession;
  storyConfig: ValidationStoryConfig;
  versions: ValidationVersions;
  projectRecordIndex?: Readonly<Record<string, string>>;
  generationContext?: GenerationContextCoherence;
}

export interface ValidationSnapshot {
  records: readonly ValidationRecord[];
  generationSession: Readonly<GenerationSession>;
  storyConfig: Readonly<ValidationStoryConfig>;
  versions: Readonly<ValidationVersions>;
  projectRecordIndex: Readonly<Record<string, string>>;
  generationContext?: Readonly<GenerationContextCoherence>;
}

export function buildValidationSnapshot(input: BuildValidationSnapshotInput): ValidationSnapshot {
  return deepFreeze({
    records: [...input.records]
      .map((record) => deepClone(record))
      .sort(compareRecords),
    generationSession: deepClone(input.generationSession),
    storyConfig: deepClone(input.storyConfig),
    versions: deepClone(input.versions),
    projectRecordIndex: normalizeProjectRecordIndex(input.projectRecordIndex ?? {}),
    ...(input.generationContext ? { generationContext: deepClone(input.generationContext) } : {})
  });
}

function compareRecords(left: ValidationRecord, right: ValidationRecord): number {
  const idComparison = left.id.localeCompare(right.id);

  if (idComparison !== 0) {
    return idComparison;
  }

  return left.type.localeCompare(right.type);
}

function deepClone<T>(value: T): T {
  return structuredClone(value);
}

function normalizeProjectRecordIndex(index: Readonly<Record<string, string>>): Record<string, string> {
  return Object.fromEntries(Object.entries(index).sort(([left], [right]) => left.localeCompare(right)));
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") {
    return value;
  }

  Object.freeze(value);

  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }

  return value;
}
