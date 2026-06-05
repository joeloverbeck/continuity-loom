import { getEditorDescriptor } from "./editor-descriptors.js";
import type { FieldDescriptor } from "./editor-descriptors.js";

export type CastMemberSectionId =
  | "identity"
  | "durable_voice_anchor"
  | "voice_extended_speech_pattern"
  | "pressure_behavior"
  | "body_and_presence"
  | "agency_and_planning"
  | "world_pressure_relational_moral_edge"
  | "perception_and_embodiment"
  | "sample_utterances"
  | "anti_generic_and_anti_repetition_warnings";

export interface CastMemberSection {
  id: CastMemberSectionId;
  label: string;
  tier: "required_core" | "optional_extended" | "emphasis";
  fields: readonly FieldDescriptor[];
  emphasisFieldPaths?: readonly string[];
}

const sectionDefinitions = [
  {
    id: "identity",
    label: "Identity",
    tier: "required_core",
    fieldNames: ["entity_id", "identity"]
  },
  {
    id: "durable_voice_anchor",
    label: "Durable voice anchor",
    tier: "required_core",
    fieldNames: ["voice_anchor"]
  },
  {
    id: "voice_extended_speech_pattern",
    label: "Voice extended / speech-pattern details",
    tier: "optional_extended",
    fieldNames: ["voice_extended"]
  },
  {
    id: "pressure_behavior",
    label: "Pressure behavior",
    tier: "required_core",
    fieldNames: ["pressure_behavior_core", "pressure_behavior_extended"]
  },
  {
    id: "body_and_presence",
    label: "Body and presence",
    tier: "required_core",
    fieldNames: ["body_presence_core", "body_and_presence_extended"]
  },
  {
    id: "agency_and_planning",
    label: "Agency and planning",
    tier: "required_core",
    fieldNames: ["agency_core", "agency_and_planning_extended"]
  },
  {
    id: "world_pressure_relational_moral_edge",
    label: "World pressure / relational charge / moral edge",
    tier: "optional_extended",
    fieldNames: ["world_pressure_core", "relational_charge", "moral_psychological_edge"]
  },
  {
    id: "perception_and_embodiment",
    label: "Perception and embodiment",
    tier: "optional_extended",
    fieldNames: ["perception_and_embodiment"]
  },
  {
    id: "sample_utterances",
    label: "Sample utterances",
    tier: "optional_extended",
    fieldNames: ["sample_utterances"]
  },
  {
    id: "anti_generic_and_anti_repetition_warnings",
    label: "Anti-generic and anti-repetition warnings",
    tier: "emphasis",
    fieldNames: [],
    emphasisFieldPaths: ["voice_anchor.anti_repetition_warnings", "voice_extended.anti_generic_warnings"]
  }
] as const satisfies readonly {
  id: CastMemberSectionId;
  label: string;
  tier: CastMemberSection["tier"];
  fieldNames: readonly string[];
  emphasisFieldPaths?: readonly string[];
}[];

type CastMemberSectionDefinition = (typeof sectionDefinitions)[number];

export function castMemberSectionModel(): readonly CastMemberSection[] {
  const descriptor = getEditorDescriptor("CAST MEMBER");

  if (!descriptor) {
    return [];
  }

  const fieldsByName = new Map(descriptor.fields.map((field) => [field.name, field]));

  return sectionDefinitions.map((section) => {
    const modeledSection: CastMemberSection = {
      id: section.id,
      label: section.label,
      tier: section.tier,
      fields: section.fieldNames.map((fieldName) => {
      const field = fieldsByName.get(fieldName);

      if (!field) {
        throw new Error(`Missing CAST MEMBER field descriptor: ${fieldName}`);
      }

      return field;
      })
    };

    if (hasEmphasisFieldPaths(section)) {
      return { ...modeledSection, emphasisFieldPaths: section.emphasisFieldPaths };
    }

    return modeledSection;
  });
}

function hasEmphasisFieldPaths(
  section: CastMemberSectionDefinition
): section is CastMemberSectionDefinition & { emphasisFieldPaths: readonly string[] } {
  return "emphasisFieldPaths" in section;
}
