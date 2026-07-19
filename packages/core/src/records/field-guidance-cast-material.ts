import { recordEditorDescriptors } from "./editor-descriptors.js";
import { enumerateCanonicalPaths } from "./field-path-enumeration.js";
import type { FieldGuidance } from "./field-guidance.js";

const recordTypes = [
  "CAST MEMBER",
  "ENTITY",
  "ENTITY STATUS",
  "LOCATION",
  "OBJECT",
  "VISIBLE AFFORDANCE"
] as const;

type CastMaterialRecordType = (typeof recordTypes)[number];

const operationalFields = new Set(["id", "status"]);

const destinationFamilyByType: Readonly<Record<CastMaterialRecordType, string>> = {
  "CAST MEMBER": "rich_active_cast_dossiers",
  ENTITY: "locations_objects_affordances",
  "ENTITY STATUS": "locations_objects_affordances",
  LOCATION: "locations_objects_affordances",
  OBJECT: "locations_objects_affordances",
  "VISIBLE AFFORDANCE": "locations_objects_affordances"
};

const visibilityToPovGuidance = {
  visible: { short: "The POV can see it directly." },
  audible: { short: "The POV can hear it." },
  inferred: { short: "The POV can infer it from available traces." },
  hidden: { short: "The POV cannot perceive it." },
  not_applicable: { short: "POV visibility is not meaningful here." }
};

const specificGuidance = new Map<string, Partial<FieldGuidance>>([
  ["CAST MEMBER.entity_id", {
    promptFacing: "never",
    promptDestinations: [],
    short: "Reference to the ENTITY this cast dossier represents.",
    validationRole:
      "Record-reference metadata for validation and linkage; active cast dossiers do not print raw entity ids.",
    authoringAdvice: "Use the linked ENTITY for identity/state references, not as prose text."
  }],
  ["CAST MEMBER.voice_anchor.core_voice", durableVoice("Core durable voice identity.", {
    examples: ["Speaks in exacting practical images; avoids decorative reassurance."],
    antiExamples: ["Stoic but secretly soft."]
  })],
  ["CAST MEMBER.voice_anchor.rhythm_and_syntax", durableVoice("Durable rhythm and sentence shape.")],
  ["CAST MEMBER.voice_anchor.register_and_diction", durableVoice("Durable register and word choice.")],
  ["CAST MEMBER.voice_anchor.vocabulary_and_metaphor_pools", durableVoice("Recurring vocabulary and metaphor material.")],
  ["CAST MEMBER.voice_anchor.must_preserve[]", durableVoice("Voice features that must survive pressure.", {
    examples: ["Keeps questions short when frightened."],
    antiExamples: ["Sounds unique."]
  })],
  ["CAST MEMBER.voice_anchor.must_avoid[]", durableVoice("Voice mistakes to avoid for this cast member.", {
    examples: ["Do not make her explain feelings in polished abstractions."],
    antiExamples: ["Do not write boring dialogue."]
  })],
  ["CAST MEMBER.voice_anchor.anti_repetition_warnings[]", durableVoice("Repetition traps to avoid while preserving identity.")],
  ["CAST MEMBER.voice_extended.anti_generic_warnings[]", durableVoice("Anti-generic warnings for extended speech pattern.")],
  ["CAST MEMBER.sample_utterances[].text", {
    short: "A compact example of the cast member's speech.",
    continuityRole: "Illustrates durable voice; it is not a prose source to copy by default.",
    authoringAdvice: "Use sparse, annotated examples that teach cadence or tactic."
  }],
  ["CAST MEMBER.sample_utterances[].copy_policy", {
    short: "How the sample utterance may influence generated wording.",
    enumValues: {
      never_copy_verbatim: {
        short: "Default: teach voice without copying the sentence."
      },
      may_reuse_cadence_not_text: {
        short: "Cadence may echo, but the words should be new."
      },
      canonical_phrase: {
        short: "A deliberate catchphrase or fixed wording may be reused."
      }
    },
    doctrineWarnings: ["Sample utterances are voice evidence, not accepted prose authority."]
  }],
  ["ENTITY STATUS.life", {
    short: "Current life-state continuity for the entity.",
    enumValues: {
      alive: { short: "Alive in current continuity." },
      dead: { short: "Dead in current continuity." },
      unknown: { short: "Current life state is unknown." },
      not_applicable: { short: "Life state does not apply to this entity." }
    }
  }],
  ["ENTITY STATUS.agency", {
    short: "Current ability to act or choose.",
    enumValues: {
      free: { short: "Can choose and act normally." },
      constrained: { short: "Can act, but under meaningful limits." },
      coerced: { short: "Pressure or threat constrains choice." },
      captive: { short: "Physically or institutionally held." },
      incapacitated: { short: "Unable to act effectively." },
      unconscious: { short: "Not conscious in the current moment." },
      unknown: { short: "Agency state is unknown." },
      not_applicable: { short: "Agency state does not apply." }
    }
  }],
  ["ENTITY STATUS.visibility_to_pov", {
    short: "How the entity status is perceptible to the POV.",
    enumValues: visibilityToPovGuidance
  }],
  ["ENTITY.entity_kind", {
    short: "The kind of entity. A selected non-person entity compiles into material pressure using its kind and short_description; a person entity does not, because person identity and voice belong to a CAST MEMBER dossier.",
    promptDestinations: ["locations_objects_affordances"],
    authoringAdvice: "Use the closest concrete kind; do not use roles_in_story to describe pressure."
  }],
  ["ENTITY.short_description", {
    short: "Prompt-facing material-pressure description for a selected non-person entity. A person entity's short_description is not compiled into material pressure, even when the entity is selected or named as offstage pressure.",
    promptDestinations: ["locations_objects_affordances"],
    examples: ["A union office with enough authority to close the pier gates."],
    authoringAdvice: "For a non-person entity, describe what it is and why its presence can matter physically or institutionally now. For a person who is only offstage pressure, keep the entity ENTITY-first and author the current pressure in the Generation Brief; a CAST MEMBER dossier is optional durable deepening, not a prerequisite, and is where a person's identity and voice compile."
  }],
  ["ENTITY.roles_in_story[]", {
    promptFacing: "never",
    promptDestinations: [],
    short: "Structured authoring metadata for selecting and organizing entities.",
    validationRole: "Authoring metadata only; it is not sent as literal prose prompt context."
  }],
  ["LOCATION.hazards_or_shelters[]", {
    short: "Physical dangers, cover, shelter, or safe movement constraints at this location.",
    promptDestinations: ["locations_objects_affordances"],
    examples: ["The west aisle gives cover from the balcony but leaves footprints in flour dust."]
  }],
  ["LOCATION.social_rules[]", {
    short: "Public behavior, access, etiquette, authority, taboo, or consequence pressure in this location.",
    promptDestinations: ["locations_objects_affordances"],
    examples: ["Only guild clerks may touch sealed ledgers while the steward is present."]
  }],
  ["OBJECT.visibility_to_pov", {
    short: "How the object is perceptible to the POV.",
    enumValues: {
      visible: { short: "The POV can see it." },
      hidden: { short: "The POV cannot perceive it." },
      inferred: { short: "The POV can infer it from traces." },
      unknown: { short: "The POV's access is unknown." }
    }
  }],
  ["OBJECT.durability", {
    promptFacing: "never",
    promptDestinations: [],
    short: "How durable this object's state is for continuity.",
    validationRole:
      "Continuity metadata for author review; object prose rendering currently uses description, holder/location, visibility, affordances, and constraints.",
    enumValues: {
      local_texture: { short: "Useful local texture; low continuity weight." },
      continuity_relevant: { short: "Track changes because future continuity may depend on it." },
      major: { short: "High-impact continuity object." }
    }
  }],
  ["VISIBLE AFFORDANCE.durability", {
    short: "How durable the result of using this affordance may be.",
    enumValues: {
      local: { short: "Local effect only." },
      reversible_state_change: { short: "Changes state, but can be undone." },
      durable_state_change: { short: "Creates a lasting state change." },
      irreversible: { short: "Cannot be undone in ordinary continuity." }
    }
  }],
  ["VISIBLE AFFORDANCE.risk", {
    short: "The kind of risk attached to using this affordance.",
    enumValues: {
      none: { short: "No meaningful risk." },
      social: { short: "Social consequence or exposure." },
      physical: { short: "Bodily danger or material hazard." },
      legal: { short: "Rule, law, or institutional consequence." },
      emotional: { short: "Emotional cost or vulnerability." },
      secrecy: { short: "Risk of revealing protected information." },
      mixed: { short: "More than one risk family applies." }
    }
  }]
]);

export const castMaterialGuidance: readonly FieldGuidance[] = recordTypes.flatMap((recordType) => {
  const descriptor = recordEditorDescriptors[recordType];

  if (!descriptor) {
    return [];
  }

  return enumerateCanonicalPaths(recordType, descriptor.fields).map((fieldPath) =>
    recordEntry(recordType, fieldPath, specificGuidance.get(fieldPath))
  );
});

function recordEntry(
  recordType: CastMaterialRecordType,
  fieldPath: string,
  override: Partial<FieldGuidance> = {}
): FieldGuidance {
  const leafName = fieldPath.split(".").at(-1)?.replace(/\[]$/, "") ?? fieldPath;
  const isOperational = operationalFields.has(leafName);

  return {
    fieldPath,
    surface: "record",
    ownerKind: recordType,
    short: `${labelForField(leafName)} for the ${recordType} record.`,
    promptFacing: isOperational ? "never" : "conditional",
    promptDestinations: isOperational ? [] : [destinationFamilyByType[recordType]],
    continuityRole: continuityRoleFor(recordType),
    authoringAdvice: adviceFor(recordType),
    ...(isOperational ? { validationRole: "Operational metadata for filtering or UI state." } : {}),
    ...override
  };
}

function durableVoice(short: string, extra: Partial<FieldGuidance> = {}): Partial<FieldGuidance> {
  return {
    short,
    promptDestinations: ["rich_active_cast_dossiers", "{active_onstage_full_cast_dossiers}"],
    continuityRole: "Durable voice identity; active/onstage cast dossiers are not silently compressed.",
    criticalVisibleHint: "Durable cast identity belongs here; current pressure belongs in the generation brief.",
    authoringAdvice: "Write behaviorally useful constraints, not generic adjectives.",
    ...extra
  };
}

function labelForField(name: string): string {
  return name.replace(/_/g, " ");
}

function continuityRoleFor(recordType: CastMaterialRecordType): string {
  if (recordType === "CAST MEMBER") {
    return "Maintains durable cast identity, voice, pressure response, and embodiment.";
  }

  if (recordType === "ENTITY" || recordType === "ENTITY STATUS") {
    return "Maintains who exists, where they are, what they can do, and what the POV can perceive.";
  }

  return "Maintains physical continuity, material affordances, and local constraints.";
}

function adviceFor(recordType: CastMaterialRecordType): string {
  if (recordType === "CAST MEMBER") {
    return "Name the stable pattern that helps prose preserve the person under pressure.";
  }

  return "Make the physical state concrete enough to constrain the next local segment.";
}
