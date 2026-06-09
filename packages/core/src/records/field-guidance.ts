import { PLACEHOLDER_MAP } from "../compiler/placeholder-map.js";
import {
  compileDestinationFamilyIds,
  type CompileDestinationFamilyId
} from "./compile-destinations.js";
import { briefConfigGuidance } from "./field-guidance-brief-config.js";
import { castMaterialGuidance } from "./field-guidance-cast-material.js";
import { recordGuidance } from "./field-guidance-records.js";
import { assertCanonical, normalizeListIndices } from "./field-paths.js";

export type PromptFacing = "always" | "conditional" | "never";
export type FieldRequiredness = "always" | "continuation" | "conditional" | "optional";

export interface EnumValueGuidance {
  short: string;
  implications?: string;
  useWhen?: string;
  avoidWhen?: string;
}

export interface FieldGuidance {
  fieldPath: string;
  surface: "story_config" | "generation_brief" | "record";
  ownerKind: string;
  short: string;
  displayLabel?: string;
  details?: string;
  promptFacing: PromptFacing;
  requiredness?: FieldRequiredness;
  requirednessNote?: string;
  promptDestinations?: string[];
  validationRole?: string;
  continuityRole?: string;
  authoringAdvice?: string;
  criticalVisibleHint?: string;
  doctrineWarnings?: string[];
  commonMistakes?: string[];
  examples?: string[];
  antiExamples?: string[];
  relatedFields?: string[];
  enumValues?: Record<string, EnumValueGuidance>;
}

const GUIDANCE_ENTRIES: readonly FieldGuidance[] = [
  ...briefConfigGuidance,
  ...castMaterialGuidance,
  ...recordGuidance
];
const placeholderNames = new Set(Object.keys(PLACEHOLDER_MAP));
const destinationFamilyIds: ReadonlySet<CompileDestinationFamilyId> = new Set(compileDestinationFamilyIds);

export function buildGuidanceRegistry(entries: readonly FieldGuidance[]): ReadonlyMap<string, FieldGuidance> {
  const registry = new Map<string, FieldGuidance>();

  for (const entry of entries) {
    assertCanonical(entry.fieldPath);

    if (registry.has(entry.fieldPath)) {
      throw new Error(`Duplicate field guidance path: ${entry.fieldPath}`);
    }

    registry.set(entry.fieldPath, entry);
  }

  return registry;
}

export const GUIDANCE_REGISTRY: ReadonlyMap<string, FieldGuidance> = buildGuidanceRegistry(GUIDANCE_ENTRIES);

export function getFieldGuidance(
  path: string,
  registry: ReadonlyMap<string, FieldGuidance> = GUIDANCE_REGISTRY
): FieldGuidance | undefined {
  return registry.get(normalizeListIndices(path));
}

export function validatePromptDestinations(guidance: FieldGuidance): string[] {
  return (guidance.promptDestinations ?? []).filter((destination) => !isValidPromptDestination(destination));
}

function isValidPromptDestination(destination: string): boolean {
  const placeholderMatch = /^\{([^{}]+)}$/.exec(destination);

  if (placeholderMatch) {
    return placeholderNames.has(placeholderMatch[1] ?? "");
  }

  return destinationFamilyIds.has(destination as CompileDestinationFamilyId);
}
