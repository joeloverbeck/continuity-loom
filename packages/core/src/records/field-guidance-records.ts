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
  "visibility_to_pov"
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
  ["EVENT.sequence_order", {
    promptFacing: "never",
    promptDestinations: [],
    short: "Authoring note for where the event falls in sequence: a number, prose note, or unknown.",
    validationRole:
      "Authoring metadata for continuity review; it is not sent to the prose prompt and does not control compiled event ordering.",
    authoringAdvice:
      "Use this as a private ordering note; prompt event ordering is controlled separately by record order, destination family, salience, urgency, label, and id."
  }],
  ["FACT.audience_visibility", {
    promptFacing: "conditional",
    promptDestinations: ["facts_beliefs_events"],
    short: "Author metadata about how openly this fact is treated. It is not a reader-concealment control and does not conceal the fact from the reader.",
    continuityRole:
      "Records how openly this POV-accessible truth is handled; it does not conceal the fact from the reader and never reaches the compiled audience-knowledge block. To hide a POV-known premise from the reader, model it as a SECRET (pov_access: knows, audience_visibility: hidden) — the SECRET record is the sole reader-concealment (dramatic-irony) authority.",
    authoringAdvice:
      "If you need the reader kept unaware of a premise the POV knows, do not rely on this field. Create a SECRET with pov_access: knows and audience_visibility: hidden; a hidden SECRET is what populates the compiled \"Audience does not know\" line.",
    enumValues: {
      hidden: {
        short:
          "Author note that you would rather this fact stay in the background. It does not conceal the fact from the reader; to conceal a POV-known premise, model it as a SECRET (pov_access: knows, audience_visibility: hidden)."
      },
      implied: { short: "Author note to favor implication over direct statement; it does not enforce concealment in the compiled prompt." },
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
    antiExamples: ["Hint so strongly that the secret is effectively solved."],
    authoringAdvice:
      "Use the literal none to affirm that no reveals are forbidden beyond the stated reveal permission; do not leave an active secret blank."
  }],
  ["RELATIONSHIP.status", {
    short: "Whether the relationship is eligible to pressure new prose.",
    enumValues: {
      active: { short: "Live; selected active relationships can compile into pressure." },
      resolved: { short: "Settled; should not drive new relationship pressure." },
      abandoned: { short: "Intentionally dropped by the author." }
    }
  }],
  ["RELATIONSHIP.axis", {
    promptFacing: "never",
    promptDestinations: [],
    short: "The dimension of the bond. Pick the single axis the pressure runs along; nuance goes in prose fields.",
    validationRole:
      "Classification metadata for authoring, filtering, and review; prose-facing relationship pressure comes from description, pressure_text, and current_expression.",
    enumValues: {
      trust: { short: "One party relies on the other's honesty, care, or steadiness." },
      fear: { short: "One party is afraid of the other or what the other may do." },
      desire: { short: "One party wants closeness, approval, possession, or response from the other." },
      debt: { short: "One party owes the other and feels the weight of owing." },
      intimacy: { short: "Private closeness, familiarity, or vulnerability shapes the bond." },
      loyalty: { short: "Allegiance or chosen faithfulness pressures action." },
      resentment: { short: "Old or current grievance sharpens the bond." },
      power_imbalance: { short: "One party holds leverage or authority over the other." },
      attention: { short: "Notice, neglect, watching, or being watched defines the pressure." },
      familiarity: { short: "Shared history or practiced knowledge changes how they read each other." },
      approval: { short: "One party wants or withholds approval." },
      respect: { short: "Esteem, contempt, or earned regard shapes behavior." },
      obligation: { short: "Duty inside the relationship presses on choice." },
      hostility: { short: "Open dislike or antagonism shapes the interaction." },
      dependency: { short: "One party needs the other materially, emotionally, or socially." },
      rivalry: { short: "Competition between them drives comparison or opposition." },
      protectiveness: { short: "One party feels responsible for shielding the other." },
      other: { short: "None of the listed axes fit; explain the bond in description." }
    }
  }],
  ["RELATIONSHIP.direction_kind", {
    promptFacing: "never",
    promptDestinations: [],
    short: "Whether the quality flows one way or both.",
    validationRole:
      "Relationship structure metadata for interpreting from/to; it is not literal prompt content.",
    relatedFields: ["RELATIONSHIP.from", "RELATIONSHIP.to"],
    enumValues: {
      directed: { short: "From -> to only." },
      bidirectional: { short: "Held by both parties." }
    }
  }],
  ["RELATIONSHIP.from", {
    short: "The entity who holds this relationship quality: the one who trusts, fears, owes, wants, or resents.",
    authoringAdvice: "For a directed axis, from is the subject of the feeling; to is its target.",
    relatedFields: ["RELATIONSHIP.to", "RELATIONSHIP.direction_kind"]
  }],
  ["RELATIONSHIP.to", {
    short: "The entity the relationship is directed at: the one trusted, feared, owed, wanted, or resented.",
    authoringAdvice: "For bidirectional relationships, still choose the clearest anchor pair and explain reciprocity in prose.",
    relatedFields: ["RELATIONSHIP.from", "RELATIONSHIP.direction_kind"]
  }],
  ["RELATIONSHIP.value", {
    promptFacing: "never",
    promptDestinations: [],
    short: "Intensity of the bond on its axis.",
    validationRole:
      "Classification metadata for author review; render the actionable pressure in pressure_text/current_expression.",
    enumValues: {
      none: { short: "Effectively absent." },
      trace: { short: "Barely present." },
      low: { short: "Light pressure; easy to override." },
      medium: { short: "Noticeable pressure that can shape the moment." },
      high: { short: "Strong pressure that is hard to ignore." },
      extreme: { short: "Dominates how this party acts toward the other." }
    }
  }],
  ["RELATIONSHIP.valence", {
    promptFacing: "never",
    promptDestinations: [],
    short: "The shape of reciprocity or stability between the two parties.",
    validationRole:
      "Classification metadata for author review; render the actionable pressure in pressure_text/current_expression.",
    enumValues: {
      symmetric: { short: "Both feel it similarly." },
      asymmetric: { short: "One party feels it far more than the other." },
      bidirectional: { short: "Mutual but not necessarily equal." },
      adversarial: { short: "Opposed or hostile." },
      unstable: { short: "Fluctuating or contested." }
    }
  }],
  ["RELATIONSHIP.visibility", {
    promptFacing: "never",
    promptDestinations: [],
    short: "Who can perceive this relationship.",
    validationRole:
      "Visibility metadata for review and validation; prose-facing relationship material comes from description, pressure_text, and current_expression.",
    enumValues: {
      private: { short: "Not visible to others." },
      shared: { short: "Known to some involved parties." },
      public: { short: "Widely known in-world." },
      hidden: { short: "Actively concealed." },
      audience_only: { short: "Visible to the reader but not to characters; use for dramatic irony." }
    }
  }],
  ["RELATIONSHIP.description", {
    short: "What the bond is: its nature, history, and stakes. Also used as the record's display label in the prompt.",
    details:
      "This is the stable relationship premise the prose writer sees before the live pressure. It should explain why this bond matters across segments.",
    examples: ["They were close before the trial, but each now treats honesty as a different kind of risk."],
    antiExamples: ["She is angry at him right now."],
    authoringAdvice:
      "State the relationship and why it matters; keep it stable across segments. Pressure that changes now goes in pressure_text or current_expression.",
    relatedFields: ["RELATIONSHIP.pressure_text", "RELATIONSHIP.current_expression"]
  }],
  ["RELATIONSHIP.pressure_text", {
    short: "The live relational pressure that can bend behavior now.",
    details:
      "The internal or relational charge that pushes a choice, word, silence, refusal, or concession in the next segment. This is distinct from how that pressure visibly shows.",
    examples: ["Trust is brittle: she wants his help but expects a betrayal."],
    antiExamples: ["They have a complicated relationship."],
    authoringAdvice: "Name the actionable pressure, not just the relationship label.",
    relatedFields: ["RELATIONSHIP.current_expression", "RELATIONSHIP.description"]
  }],
  ["RELATIONSHIP.current_expression", {
    short: "How the relationship visibly shows right now: the behavior the POV and others can perceive.",
    details:
      "The observable, embodied manifestation: tone, body language, distance, touch, eye contact, hesitation, warmth, or coldness. It answers what a camera would catch, while pressure_text names the unseen charge driving it. It compiles into the relationship pressure line alongside pressure_text.",
    examples: ["They stand close but leave a careful inch between them; his voice flattens whenever she decides without asking."],
    antiExamples: ["He resents needing her."],
    authoringAdvice: "Write what is seen or heard, not what is felt.",
    relatedFields: ["RELATIONSHIP.pressure_text", "RELATIONSHIP.description"]
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
  ["PLAN.fallback_steps[]", {
    promptFacing: "never",
    promptDestinations: [],
    short: "Authoring backup steps for plan maintenance.",
    validationRole:
      "Private planning metadata; fallback branches are not offered to the prose writer as alternate futures.",
    authoringAdvice:
      "When a fallback becomes current, update current_step, selected pressure, or current state instead of expecting multiple future options to compile."
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
  ["CLOCK.tick_history[].threshold", {
    promptFacing: "never",
    promptDestinations: [],
    short: "Historical threshold already crossed by this clock.",
    validationRole: "Continuity-history metadata; historical ticks are excluded from current prompt context.",
    authoringAdvice:
      "If a past tick still matters now, represent it as current state, an event, a consequence, or current clock pressure."
  }],
  ["CLOCK.tick_history[].cause", {
    promptFacing: "never",
    promptDestinations: [],
    short: "What caused a historical clock tick.",
    validationRole: "Continuity-history metadata; historical ticks are excluded from current prompt context.",
    authoringAdvice:
      "If the cause still matters now, represent it as current state, an event, a consequence, or current clock pressure."
  }],
  ["CLOCK.tick_history[].result", {
    promptFacing: "never",
    promptDestinations: [],
    short: "What changed after a historical clock tick.",
    validationRole: "Continuity-history metadata; historical ticks are excluded from current prompt context.",
    authoringAdvice:
      "If the result still matters now, represent it as current state, an event, a consequence, or current clock pressure."
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
  ["OPEN THREAD.type", {
    short: "The kind of unresolved thread this record tracks.",
    enumValues: {
      question: { short: "A specific unanswered question remains live." },
      promise: { short: "A made promise still has to be kept, broken, or tested." },
      unresolved_setup: { short: "A planted setup has not paid off or been dismissed." },
      tension: { short: "An unresolved strain can affect choices or speech." },
      mystery: { short: "A hidden cause, identity, or mechanism remains unknown." },
      risk: { short: "A known danger remains possible but not yet settled." }
    }
  }],
  ["OPEN THREAD.status", {
    short: "Whether the thread is still active for selection and compilation.",
    details: "Only status active threads are eligible to compile into the open-thread prompt section.",
    enumValues: {
      active: { short: "Still unresolved; selected active threads compile into the prompt." },
      answered: { short: "The answer is known, but follow-through may still matter elsewhere." },
      resolved: { short: "The thread is closed and should not pressure new prose." },
      escalated: { short: "The thread changed into a larger or sharper unresolved pressure." },
      abandoned: { short: "The author has intentionally dropped the thread." },
      superseded: { short: "Another record now carries the live version of this thread." }
    }
  }],
  ["OPEN THREAD.title", {
    short: "The display label and first compiled line for this open thread."
  }],
  ["OPEN THREAD.summary", {
    short: "What the unresolved thread is, in present-tense prose.",
    details:
      "Describe the live question, promise, risk, mystery, or tension itself; do not recap prior events, predict consequences, or reveal the answer.",
    examples: ["Someone inside the chapel is still hiding the stolen ledger."],
    antiExamples: [
      "A full recap of how the ledger was stolen, chased, and hidden.",
      "The missing ledger will make Mara accuse Ivo next."
    ],
    relatedFields: ["OPEN THREAD.possible_pressure_now", "OPEN THREAD.answer_if_known"]
  }],
  ["OPEN THREAD.audience_visibility", {
    short: "How visible the unresolved thread is to the audience.",
    validationRole: "Operational metadata for visibility review; it is not sent to the prose prompt.",
    enumValues: secretAudienceVisibilityGuidance
  }],
  ["OPEN THREAD.urgency", {
    short: "How sharply this open thread should press on the next local unit.",
    details: "Compiled active threads include this as the urgency value.",
    enumValues: {
      low: { short: "Background pressure; present but not urgent." },
      medium: { short: "Relevant pressure that may shape choices." },
      high: { short: "Strong pressure likely to affect the next unit." },
      critical: { short: "Immediate pressure that should be hard to ignore." }
    }
  }],
  ["OPEN THREAD.current_relevance", {
    short: "How useful this thread is for current active-working-set selection.",
    validationRole: "Operational metadata for selection salience; it is not sent to the prose prompt.",
    enumValues: {
      none: { short: "Not useful for the current local unit." },
      low: { short: "Only lightly relevant right now." },
      medium: { short: "Relevant enough to consider selecting." },
      high: { short: "Strongly relevant to the current local unit." },
      critical: { short: "Central to the current local unit." }
    }
  }],
  ["OPEN THREAD.possible_pressure_now", {
    short: "How the unresolved thread can matter in the next local moment.",
    examples: ["The unanswered bell can interrupt before the confession finishes."],
    antiExamples: ["Resolve the mystery completely."]
  }],
  ["OPEN THREAD.answer_if_known", {
    promptFacing: "never",
    promptDestinations: [],
    short: "Private authoring note for the answer, or none while the answer is unknown.",
    validationRole: "Authoring metadata for continuity review; it is not sent to the prose prompt.",
    examples: [
      "Mara hid the ledger under the chapel floor.",
      "none: the answer is not yet decided."
    ],
    authoringAdvice:
      "Use this for private resolution tracking only; it cannot pressure closure because it never reaches the writer.",
    relatedFields: ["OPEN THREAD.summary", "OPEN THREAD.possible_pressure_now"]
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
  const isOperational =
    operationalFields.has(leafName) && !PROMPT_FACING_FIELD_OVERRIDES[recordType]?.has(leafName);
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
