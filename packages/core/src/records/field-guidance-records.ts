import { PROMPT_FACING_FIELD_OVERRIDES, recordEditorDescriptors } from "./editor-descriptors.js";
import { enumerateCanonicalPaths } from "./field-path-enumeration.js";
import type { FieldGuidance } from "./field-guidance.js";

const recordTypes = [
  "FACT",
  "BELIEF",
  "SECRET",
  "EVENT",
  "INTENTION",
  "PLAN",
  "CLOCK",
  "OBLIGATION",
  "CONSEQUENCE",
  "OPEN THREAD",
  "RELATIONSHIP",
  "EMOTION"
] as const;

type GuidedRecordType = (typeof recordTypes)[number];

const operationalFields = new Set([
  "id",
  "status",
  "plan_status",
  "salience",
  "urgency",
  "current_relevance",
  "visibility",
  "audience_visibility",
  "pov_visibility",
  "visibility_to_pov",
  "can_drive_prose"
]);

const destinationFamilyByType: Readonly<Record<GuidedRecordType, string>> = {
  FACT: "facts_beliefs_events",
  BELIEF: "facts_beliefs_events",
  SECRET: "pov_audience_and_reveal_constraints",
  EVENT: "facts_beliefs_events",
  INTENTION: "plans_clocks_obligations",
  PLAN: "plans_clocks_obligations",
  CLOCK: "plans_clocks_obligations",
  OBLIGATION: "plans_clocks_obligations",
  CONSEQUENCE: "plans_clocks_obligations",
  "OPEN THREAD": "plans_clocks_obligations",
  RELATIONSHIP: "facts_beliefs_events",
  EMOTION: "facts_beliefs_events"
};

const secretAudienceVisibilityGuidance = {
  hidden: { short: "The audience should not see the secret yet." },
  implied: { short: "The audience may sense a pattern without full knowledge." },
  explicit: { short: "The audience may know the secret directly." },
  ambiguous: { short: "The audience sees material that can be read more than one way." }
};

const specificGuidance = new Map<string, Partial<FieldGuidance>>([
  ["FACT.audience_visibility", {
    promptFacing: "conditional",
    promptDestinations: ["facts_beliefs_events"],
    short: "Whether the audience is allowed to know this fact.",
    continuityRole: "Keeps audience knowledge distinct from POV knowledge and writer-visible truth.",
    enumValues: {
      hidden: { short: "Do not expose this fact to the audience yet." },
      implied: { short: "Allow implication without direct statement." },
      explicit: { short: "The audience may know it directly." },
      not_applicable: { short: "Audience visibility is not meaningful for this fact." }
    }
  }],
  ["SECRET.audience_visibility", {
    short: "How visible the secret is to the audience.",
    continuityRole: "Audience visibility is separate from what the POV can know.",
    enumValues: secretAudienceVisibilityGuidance
  }],
  ["SECRET.pov_access", {
    short: "How much the current POV can access about the secret.",
    continuityRole: "Protects the POV knowledge boundary.",
    enumValues: {
      hidden: { short: "The POV cannot know or infer it." },
      can_suspect: { short: "The POV may suspect from allowed cues." },
      knows_partly: { short: "The POV has partial, bounded knowledge." },
      knows: { short: "The POV knows the secret." }
    }
  }],
  ["SECRET.reveal_permission", {
    short: "The rule for whether and how this secret may surface.",
    continuityRole: "A locked secret cannot be opened by manual directive or local prose pressure.",
    doctrineWarnings: ["Keep holder knowledge, POV access, audience visibility, and writer-visible truth distinct."],
    examples: ["clue_only: the broken wax seal may be noticed, but the identity behind it stays unrevealed."],
    antiExamples: ["locked, but reveal it because the current scene would be more dramatic."],
    enumValues: {
      locked: {
        short: "No reveal and no decisive clue.",
        implications: "Directive-proof until the record changes."
      },
      clue_only: {
        short: "Only approved surface clues may appear.",
        implications: "The truth remains unrevealed."
      },
      natural_reveal_allowed: {
        short: "The secret may reveal if the selected state naturally causes it."
      },
      directive_required: {
        short: "Do not reveal unless the manual directive explicitly calls for it."
      }
    }
  }],
  ["SECRET.allowed_surface_cues[]", {
    short: "Surface cues allowed without revealing the full secret.",
    examples: ["He flinches at the family crest."],
    antiExamples: ["He says he murdered the heir."],
    authoringAdvice: "Write observable clues, not the hidden truth itself."
  }],
  ["SECRET.forbidden_reveals[]", {
    short: "Secret content that must not be revealed.",
    examples: ["Do not name the real parent."],
    antiExamples: ["Hint so strongly that the secret is effectively solved."]
  }],
  ["RELATIONSHIP.pressure_text", {
    short: "The live relational pressure that can bend behavior now.",
    examples: ["Trust is brittle: she wants his help but expects a betrayal."],
    antiExamples: ["They have a complicated relationship."],
    authoringAdvice: "Name the actionable pressure, not just the relationship label."
  }],
  ["EMOTION.behavioral_pressure[]", {
    short: "Closed selection of behaviors this emotion pressures.",
    details: "This is enum selection guidance, not a prose field.",
    examples: ["withdraw_socially when shame makes the holder avoid witnesses."],
    antiExamples: ["A paragraph explaining the whole emotional arc."],
    enumValues: {
      accommodate: { short: "Yield or smooth conflict to reduce pressure." },
      self_soothe: { short: "Regulate internally through a repeated action or ritual." },
      ruminate: { short: "Loop on the feeling rather than act cleanly." },
      withdraw_socially: { short: "Pull away from contact or attention." }
    }
  }],
  ["PLAN.current_step", {
    short: "The next concrete step in the plan.",
    examples: ["Get the signed ledger before dawn."],
    antiExamples: ["Eventually win back the kingdom."],
    authoringAdvice: "Keep it local enough to affect the next generated segment."
  }],
  ["PLAN.can_drive_prose", {
    promptFacing: "never",
    promptDestinations: [],
    short: "Whether this plan may drive local prose pressure.",
    validationRole: "Operational flag for selection and validation; it is not sent to the prose prompt."
  }],
  ["CLOCK.current_pressure", {
    short: "What the clock is making urgent right now.",
    examples: ["The patrol changes in three minutes."],
    antiExamples: ["The situation is tense."]
  }],
  ["CLOCK.tick_trigger", {
    short: "What causes the clock to advance.",
    examples: ["Each failed lockpick attempt moves the patrol closer."],
    antiExamples: ["When more pressure would be convenient."]
  }],
  ["OBLIGATION.consequence_if_broken", {
    short: "What happens if the obligation is violated.",
    examples: ["Breaking the oath costs her access to the archive."],
    antiExamples: ["Something bad happens."]
  }],
  ["CONSEQUENCE.current_effect", {
    short: "The consequence already active in continuity.",
    examples: ["His injured hand cannot grip a blade steadily."],
    antiExamples: ["He might be punished later."]
  }],
  ["CONSEQUENCE.possible_next_effect", {
    short: "The plausible next pressure this consequence can create.",
    examples: ["If he hides the tremor, Mira may misread it as fear."],
    antiExamples: ["This opens a larger arc unrelated to the current pressure."]
  }],
  ["OPEN THREAD.possible_pressure_now", {
    short: "How the unresolved thread can matter in the next local moment.",
    examples: ["The unanswered bell can interrupt before the confession finishes."],
    antiExamples: ["Resolve the mystery completely."]
  }]
]);

export const recordGuidance: readonly FieldGuidance[] = recordTypes.flatMap((recordType) => {
  const descriptor = recordEditorDescriptors[recordType];

  if (!descriptor) {
    return [];
  }

  return enumerateCanonicalPaths(recordType, descriptor.fields).map((fieldPath) =>
    recordEntry(recordType, fieldPath, specificGuidance.get(fieldPath))
  );
});

function recordEntry(
  recordType: GuidedRecordType,
  fieldPath: string,
  override: Partial<FieldGuidance> = {}
): FieldGuidance {
  const leafName = fieldPath.split(".").at(-1)?.replace(/\[]$/, "") ?? fieldPath;
  const isOperational = operationalFields.has(leafName) && !PROMPT_FACING_FIELD_OVERRIDES[recordType]?.has(leafName);
  const promptDestinations = isOperational ? [] : [destinationFamilyByType[recordType]];

  return {
    fieldPath,
    surface: "record",
    ownerKind: recordType,
    short: `${labelForField(leafName)} for the ${recordType} record.`,
    promptFacing: isOperational ? "never" : "conditional",
    promptDestinations,
    continuityRole: continuityRoleFor(recordType),
    authoringAdvice: adviceFor(recordType),
    ...(isOperational ? { validationRole: "Operational metadata for filtering, validation, or UI state." } : {}),
    ...override
  };
}

function labelForField(name: string): string {
  return name.replace(/_/g, " ");
}

function continuityRoleFor(recordType: GuidedRecordType): string {
  if (recordType === "SECRET") {
    return "Protects hidden truth, POV access, reveal permission, and audience visibility as separate continuity facts.";
  }

  if (recordType === "FACT" || recordType === "BELIEF" || recordType === "EVENT") {
    return "Maintains knowledge and event continuity without relying on accepted prose as authority.";
  }

  if (recordType === "RELATIONSHIP" || recordType === "EMOTION") {
    return "Turns character state into behaviorally legible pressure without making automatic continuity changes.";
  }

  return "Supplies local causal pressure without becoming global structure.";
}

function adviceFor(recordType: GuidedRecordType): string {
  if (recordType === "SECRET") {
    return "State what is known, by whom, and what may surface; do not collapse writer knowledge into POV knowledge.";
  }

  if (recordType === "RELATIONSHIP" || recordType === "EMOTION") {
    return "Write the pressure that changes action, speech, silence, or perception now.";
  }

  return "Keep the entry concrete enough to affect the next local segment.";
}
