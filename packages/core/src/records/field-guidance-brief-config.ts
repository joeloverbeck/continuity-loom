import type { FieldGuidance, PromptFacing } from "./field-guidance.js";

type GuidanceInput = Omit<FieldGuidance, "surface" | "ownerKind" | "fieldPath" | "promptFacing"> & {
  fieldPath: string;
  surface?: FieldGuidance["surface"];
  ownerKind?: string;
  promptFacing?: PromptFacing;
};

const currentStateOpts = {
  continuityRole: "Defines current continuity for this local generation.",
  validationRole: "Used by fail-closed validation to catch impossible or underspecified prompt state.",
  authoringAdvice: "Write the current fact directly; do not rely on prior prose to imply it."
} satisfies Partial<GuidanceInput>;

const alwaysRequiredCurrentStateOpts = {
  ...currentStateOpts,
  requiredness: "always",
  requirednessNote: "Required before preview or generation."
} satisfies Partial<GuidanceInput>;

const contextGatedCurrentStateOpts = {
  ...currentStateOpts,
  requiredness: "conditional",
  requirednessNote: "Required when relevant; the readiness checklist confirms exactly when."
} satisfies Partial<GuidanceInput>;

const directiveOpts = {
  continuityRole: "Applies authorial pressure within the selected records and current state.",
  doctrineWarnings: ["Manual directives cannot override hard canon, physical state, POV knowledge, reveal locks, or policy."],
  examples: ["Make Mara ask about the missing key before anyone leaves."],
  antiExamples: ["Reveal the locked secret even though the POV cannot know it."],
  authoringAdvice: "Use this as local causal pressure, not as a mini-outline."
} satisfies Partial<GuidanceInput>;

const optionalDirectiveOpts = {
  ...directiveOpts,
  requiredness: "optional"
} satisfies Partial<GuidanceInput>;

const voicePressureOpts = {
  continuityRole: "Temporary pressure for this generation; durable identity belongs in CAST MEMBER records.",
  criticalVisibleHint: "Current-generation pressure only; update CAST MEMBER records manually for durable changes.",
  authoringAdvice: "Name the pressure that matters now without rewriting the character's permanent dossier.",
  requiredness: "optional"
} satisfies Partial<GuidanceInput>;

const optionalOpts = {
  requiredness: "optional"
} satisfies Partial<GuidanceInput>;

const generationBriefDisplayLabels: Record<string, string> = {
  "active_working_set.selected_records[]": "Selected records",
  "active_working_set.active_onstage_cast_full[].cast_member_id": "Full active cast member",
  "active_working_set.active_onstage_cast_full[].local_function": "Local function",
  "active_working_set.present_minor_cast_compressed[]": "Present minor cast compressed",
  "active_working_set.offstage_relevant_cast[]": "Offstage relevant cast",
  "active_working_set.selected_pov": "Selected POV",
  "current_authoritative_state.current_time": "Current time",
  "current_authoritative_state.current_location": "Current location",
  "current_authoritative_state.onstage_entities[]": "Onstage entities",
  "current_authoritative_state.immediate_situation_summary": "Immediate situation summary",
  "current_authoritative_state.offstage_pressuring_entities[]": "Offstage pressuring entities",
  "current_authoritative_state.positions": "Positions",
  "current_authoritative_state.possessions": "Possessions",
  "current_authoritative_state.visible_conditions[]": "Visible conditions",
  "current_authoritative_state.environmental_conditions": "Environmental conditions",
  "current_authoritative_state.entity_statuses": "Entity statuses",
  "current_authoritative_state.line_of_sight_and_visibility": "Line of sight and visibility",
  "current_authoritative_state.pov_cannot_perceive_now": "POV cannot perceive right now",
  "current_authoritative_state.routes_and_exits[]": "Routes and exits",
  "current_authoritative_state.available_time": "Available time",
  "current_authoritative_state.consent_or_force_conditions": "Consent or force conditions",
  "current_authoritative_state.current_locks[]": "Current locks",
  "immediate_handoff.recent_causal_context": "Recent causal context",
  "immediate_handoff.last_visible_moment": "Last visible moment",
  "immediate_handoff.begin_after": "Begin after",
  "manual_moment_directive.must_render[]": "Must render",
  "manual_moment_directive.may_render_if_naturally_caused[]": "May render if naturally caused",
  "manual_moment_directive.do_not_force[]": "Do not force",
  "current_cast_voice_pressure[].cast_member_id": "Cast member",
  "current_cast_voice_pressure[].current_voice_pressure": "Current voice pressure",
  "current_cast_voice_pressure[].dialogue_pressure": "Dialogue pressure",
  "current_cast_voice_pressure[].pov_narration_pressure": "POV narration pressure",
  "current_cast_voice_pressure[].nonverbal_or_silence_pressure": "Nonverbal or silence pressure",
  "current_cast_voice_pressure[].current_must_preserve[]": "Current must preserve",
  "current_cast_voice_pressure[].current_must_avoid[]": "Current must avoid",
  "cast_voice_overrides[].cast_member_id": "Cast member",
  "cast_voice_overrides[].reason": "Reason (not sent to the writer)",
  "cast_voice_overrides[].applies_to[]": "Applies to",
  "cast_voice_overrides[].override_text": "Override text",
  "generation_validation_focus.validation_focus_tags.generation_context[]": "Generation context checks",
  "generation_validation_focus.validation_focus_tags.expected_local_modes[]": "Expected local-mode checks",
  "generation_validation_focus.validation_focus_tags.possible_durable_changes[]": "Possible durable-change checks",
  "stop_guidance.soft_unit_guidance": "Soft unit guidance"
};

const psychicDistanceGuidance = {
  close: { short: "Stay near the viewpoint's immediate perception and thought." },
  medium: { short: "Balance interior access with observable action." },
  distant: { short: "Keep more narrative distance from inner experience." },
  variable: { short: "Allow distance to shift when local continuity supports it." }
};

const dialogueDensityGuidance = {
  sparse: { short: "Use dialogue sparingly." },
  balanced: { short: "Balance dialogue with action, thought, and material detail." },
  moment_led: { short: "Let the local pressure decide whether speech leads." },
  dense: { short: "Allow dialogue to carry much of the moment." }
};

const interiorityGuidance = {
  minimal: { short: "Keep thought mostly off the page." },
  filtered: { short: "Render thought through perception and interpretation." },
  free_indirect: { short: "Blend narration with the viewpoint's mental texture." },
  direct: { short: "Allow direct thought when the POV permits it." },
  variable: { short: "Let interiority shift with the local situation." }
};

const paragraphingGuidance = {
  spare: { short: "Use short, clean paragraph movement." },
  mixed: { short: "Mix short and medium paragraphs." },
  lush: { short: "Allow fuller paragraph development." },
  variable: { short: "Let paragraph shape follow the moment." }
};

const localFunctionGuidance = {
  pov_narrator: { short: "The viewpoint or narrative anchor for the moment." },
  active_speaker: { short: "Expected to speak or drive exchange." },
  active_silent: { short: "Onstage and consequential without necessarily speaking." },
  close_non_pov: { short: "Near the viewpoint and behaviorally important." },
  present_minor_speaker: { short: "Present with limited speech weight." },
  physically_active: { short: "Material action matters more than speech." },
  materially_referenced: { short: "Referenced through objects, traces, or constraints." }
};

const storyConfigEntries: readonly GuidanceInput[] = [
  config("STORY CONTRACT.title", "The durable title used to identify the story contract.", ["{title}"]),
  config("STORY CONTRACT.premise", "The compact continuity premise the prose prompt works from.", ["{premise}"], {
    continuityRole: "Defines the story's baseline promise; keep it stable unless the project premise truly changes."
  }),
  config("STORY CONTRACT.genre_mode", "Genre expectations that shape rendering without becoming a plot formula.", [
    "{genre_mode}"
  ]),
  config("STORY CONTRACT.tone", "The durable tonal envelope for generated local prose.", ["{tone}"]),
  config("STORY CONTRACT.setting_baseline", "Stable setting context the prompt can rely on.", ["{setting_baseline}"]),
  config("STORY CONTRACT.content_intensity", "The intensity lane for allowed prose rendering.", ["{content_intensity}"], {
    enumValues: {
      general: { short: "Keep content broadly non-explicit." },
      mature: { short: "Allow mature pressure without explicit rendering." },
      explicit: { short: "Allow explicit rendering inside the governing content policy." },
      graphic: { short: "Allow graphic treatment only where the policy and records permit it." },
      variable: { short: "Let the local situation and policy decide the intensity." }
    }
  }),
  config("STORY CONTRACT.explicitness", "Specific boundaries for how direct the prose may be.", ["{explicitness}"]),
  config("STORY CONTRACT.language_register", "The durable language register for narration and dialogue.", [
    "{language_register}"
  ]),
  config("UNIVERSAL CONTENT POLICY.rating_label", "Human-readable rating label for the current policy.", [
    "{rating_label}"
  ]),
  config("UNIVERSAL CONTENT POLICY.allowed_content_scope", "What the prose is allowed to render.", [
    "{allowed_content_scope}"
  ]),
  config("UNIVERSAL CONTENT POLICY.tonal_handling", "How sensitive or intense material should be handled tonally.", [
    "{tonal_handling}"
  ]),
  config("UNIVERSAL CONTENT POLICY.character_bias_handling", "How character bias should be rendered without endorsing it.", [
    "{character_bias_handling}"
  ]),
  config("PROSE MODE.pov_character", "The viewpoint authority for the next local segment.", ["{pov_character}"], {
    continuityRole: "Controls what can be known, noticed, interpreted, or withheld in the prose."
  }),
  config("PROSE MODE.person", "The grammatical person for the prose segment.", ["{person}"], {
    enumValues: {
      first: { short: "Narrate as I/we from the chosen viewpoint." },
      second: { short: "Narrate as you, only when the project deliberately uses that mode." },
      third: { short: "Narrate as he/she/they with the chosen psychic distance." },
      omniscient: { short: "Use only when the project permits broader narrative knowledge." }
    }
  }),
  config("PROSE MODE.tense", "The grammatical tense for the prose segment.", ["{tense}"]),
  config("PROSE MODE.psychic_distance", "Segment-level psychic distance.", ["{psychic_distance}"], {
    enumValues: psychicDistanceGuidance
  }),
  config("PROSE MODE.interiority_mode", "Segment-level interiority access.", ["{interiority_mode}"], {
    enumValues: interiorityGuidance
  }),
  config("PROSE MODE.dialogue_density", "Segment-level dialogue density.", ["{dialogue_density}"], {
    enumValues: dialogueDensityGuidance
  }),
  config("PROSE MODE.paragraphing", "Segment-level paragraph rhythm.", ["{paragraphing}"], {
    enumValues: paragraphingGuidance
  }),
  config("PROSE MODE.language_output", "The language the prose should be written in.", ["{language_output}"]),
  config("PROSE MODE.special_style_constraints[]", "Specific style constraints for this prose mode.", [
    "{special_style_constraints}"
  ])
];

const generationBriefEntries: readonly GuidanceInput[] = [
  brief("active_working_set.selected_records[]", "Records selected as authority for this generation.", [
    "active_working_set"
  ], {
    ...optionalOpts,
    continuityRole: "The active working set is explicit and user-controlled; omitted records are not silently added."
  }),
  brief("active_working_set.active_onstage_cast_full[].cast_member_id", "Cast member receiving a full active dossier.", [
    "rich_active_cast_dossiers",
    "{active_onstage_full_cast_dossiers}"
  ], optionalOpts),
  brief("active_working_set.active_onstage_cast_full[].local_function", "Why this cast member matters locally.", [
    "{active_onstage_full_cast_dossiers}"
  ], { ...optionalOpts, enumValues: localFunctionGuidance }),
  brief("active_working_set.present_minor_cast_compressed[]", "Present cast kept intentionally compressed.", [
    "present_minor_cast",
    "{present_minor_cast_notes}"
  ], optionalOpts),
  brief("active_working_set.offstage_relevant_cast[]", "Offstage cast allowed to pressure the scene.", [
    "offstage_relevance",
    "{offstage_relevance_notes}"
  ], optionalOpts),
  brief("active_working_set.selected_pov", "Selected viewpoint for this generation.", ["{pov_character}"], optionalOpts),
  brief("current_authoritative_state.current_time", "The exact current story time.", ["{current_time}"], alwaysRequiredCurrentStateOpts),
  brief("current_authoritative_state.current_location", "The current location authority.", ["{current_location}"], alwaysRequiredCurrentStateOpts),
  brief("current_authoritative_state.onstage_entities[]", "Entities physically or narratively onstage now.", [
    "{onstage_entities}"
  ], alwaysRequiredCurrentStateOpts),
  brief(
    "current_authoritative_state.immediate_situation_summary",
    "Short user-authored summary of the immediate local situation.",
    ["{immediate_situation_summary}"],
    {
      ...alwaysRequiredCurrentStateOpts,
      doctrineWarnings: ["Do not derive this from accepted prose, candidate prose, or automatic summaries."],
      examples: ["Elin and Niko are in the cellar while she guards the hidden flour bin."],
      antiExamples: ["Elin hid the flour yesterday, Niko followed her, and that is why they are arguing now."],
      authoringAdvice:
        "Write a prose-neutral state-now snapshot: what is true at the start, not how the moment got here.",
      relatedFields: ["GENERATION BRIEF.immediate_handoff.recent_causal_context"]
    }
  ),
  brief("current_authoritative_state.offstage_pressuring_entities[]", "Offstage entities exerting immediate pressure.", [
    "{offstage_pressuring_entities}"
  ], contextGatedCurrentStateOpts),
  brief("current_authoritative_state.positions", "Where bodies and important things are positioned.", ["{positions}"], contextGatedCurrentStateOpts),
  brief("current_authoritative_state.possessions", "Who has or controls important objects now.", ["{possessions}"], contextGatedCurrentStateOpts),
  brief("current_authoritative_state.visible_conditions[]", "Conditions visible in the local scene.", [
    "{visible_conditions}"
  ], contextGatedCurrentStateOpts),
  brief("current_authoritative_state.environmental_conditions", "Environmental facts currently shaping action.", [
    "{environmental_conditions}"
  ], contextGatedCurrentStateOpts),
  brief("current_authoritative_state.entity_statuses", "Current state of relevant entities.", ["{entity_statuses}"], contextGatedCurrentStateOpts),
  brief("current_authoritative_state.line_of_sight_and_visibility", "What can and cannot be seen now.", [
    "{line_of_sight_and_visibility}"
  ], contextGatedCurrentStateOpts),
  brief(
    "current_authoritative_state.pov_cannot_perceive_now",
    "Specific things the POV is barred from perceiving right now.",
    ["{pov_cannot_perceive_now}"],
    {
      ...contextGatedCurrentStateOpts,
      doctrineWarnings: [
        "Use only intentional perception limits; do not paste general line-of-sight geometry here."
      ],
      examples: ["Mara cannot hear the courier behind the locked pantry door."],
      antiExamples: ["The pantry door is west of the kitchen and the hallway is dim."],
      authoringAdvice:
        "Name the forbidden perception directly: what the POV cannot see, hear, smell, touch, or otherwise know from the local moment.",
      relatedFields: ["GENERATION BRIEF.current_authoritative_state.line_of_sight_and_visibility"]
    }
  ),
  brief("current_authoritative_state.routes_and_exits[]", "Available routes, exits, and movement constraints.", [
    "{routes_and_exits}"
  ], contextGatedCurrentStateOpts),
  brief("current_authoritative_state.available_time", "How much time is available before pressure changes.", [
    "{available_time}"
  ], contextGatedCurrentStateOpts),
  brief("current_authoritative_state.consent_or_force_conditions", "Current consent, coercion, restraint, or force constraints.", [
    "{consent_or_force_conditions}"
  ], contextGatedCurrentStateOpts),
  brief("current_authoritative_state.current_locks[]", "Current locked doors, blocked options, or hard limits.", [
    "{current_locks}"
  ], contextGatedCurrentStateOpts),
  brief("immediate_handoff.recent_causal_context", "User-authored recent cause that launches the next segment.", [
    "{recent_causal_context}"
  ], {
    requiredness: "continuation",
    requirednessNote: "Required for continuations; optional for a first segment.",
    continuityRole:
      "Launches the segment with recent cause. It is writer-visible context, not automatically POV knowledge.",
    doctrineWarnings: ["Do not paste or summarize accepted prose here."],
    examples: ["Mara just saw the seal crack and has not warned Ivo yet."],
    antiExamples: ["A recap of the entire previous chapter."],
    authoringAdvice: "Name the immediate causal bridge into this segment; keep current facts in current state.",
    relatedFields: [
      "GENERATION BRIEF.current_authoritative_state.immediate_situation_summary",
      "GENERATION BRIEF.immediate_handoff.last_visible_moment",
      "GENERATION BRIEF.immediate_handoff.begin_after"
    ]
  }),
  brief("immediate_handoff.last_visible_moment", "The last visible action or image before generation begins.", [
    "{last_visible_moment}"
  ], {
    requiredness: "continuation",
    requirednessNote: "For continuations, this or begin_after is required.",
    continuityRole:
      "Gives the concrete final image or action the prose renders from, distinct from the abstract situation summary.",
    examples: ["The candle gutters as Mara's hand stops on the latch."],
    antiExamples: ["They are in danger because the guards are coming."],
    authoringAdvice:
      "Use a visible sensory anchor or final action, not a causal explanation or broad state summary.",
    relatedFields: ["GENERATION BRIEF.immediate_handoff.begin_after"]
  }),
  brief("immediate_handoff.begin_after", "The exact point where new prose should begin.", ["{begin_after}"], {
    requiredness: "continuation",
    requirednessNote: "For continuations, this or last_visible_moment is required.",
    continuityRole:
      "Imperative cut-point: begin prose exactly after this point so the writer does not re-narrate or skip the next decision.",
    examples: ["Begin after the door shuts behind Lio."],
    antiExamples: ["Begin somewhere later after the argument resolves."],
    authoringAdvice: "Write the exact start instruction; use last_visible_moment for the descriptive image.",
    relatedFields: ["GENERATION BRIEF.immediate_handoff.last_visible_moment"]
  }),
  brief("manual_moment_directive.must_render[]", "Required local pressure the next segment must render.", [
    "{manual_must_render}"
  ], {
    ...directiveOpts,
    requiredness: "always",
    requirednessNote: "Required before preview or generation."
  }),
  brief("manual_moment_directive.may_render_if_naturally_caused[]", "Optional pressure allowed only if the selected state causes it.", [
    "{manual_may_render_if_naturally_caused}"
  ], optionalDirectiveOpts),
  brief("manual_moment_directive.do_not_force[]", "Outcomes or moves the prose must not force.", ["{manual_do_not_force}"], optionalDirectiveOpts),
  brief("current_cast_voice_pressure[].cast_member_id", "Cast member receiving current-generation voice pressure.", [
    "{active_cast_voice_pressure_pins}",
    "{present_minor_cast_notes}"
  ], optionalOpts),
  brief("current_cast_voice_pressure[].current_voice_pressure", "Temporary voice pressure for this immediate moment.", [
    "{active_cast_voice_pressure_pins}",
    "{present_minor_cast_notes}"
  ], voicePressureOpts),
  brief("current_cast_voice_pressure[].dialogue_pressure", "Current dialogue pressure, or none.", [
    "{active_cast_voice_pressure_pins}",
    "{present_minor_cast_notes}"
  ], voicePressureOpts),
  brief("current_cast_voice_pressure[].pov_narration_pressure", "Current narration pressure for POV rendering, or none.", [
    "{active_cast_voice_pressure_pins}",
    "{present_minor_cast_notes}"
  ], voicePressureOpts),
  brief("current_cast_voice_pressure[].nonverbal_or_silence_pressure", "Current nonverbal or silence pressure, or none.", [
    "{active_cast_voice_pressure_pins}",
    "{present_minor_cast_notes}"
  ], voicePressureOpts),
  brief("current_cast_voice_pressure[].current_must_preserve[]", "Temporary voice elements to preserve now.", [
    "{active_cast_voice_pressure_pins}",
    "{present_minor_cast_notes}"
  ], voicePressureOpts),
  brief("current_cast_voice_pressure[].current_must_avoid[]", "Temporary voice mistakes to avoid now.", [
    "{active_cast_voice_pressure_pins}",
    "{present_minor_cast_notes}"
  ], voicePressureOpts),
  brief("cast_voice_overrides[].cast_member_id", "Cast member receiving a current-generation-only override.", [
    "{active_cast_voice_pressure_pins}",
    "{present_minor_cast_notes}"
  ], optionalOpts),
  brief("cast_voice_overrides[].reason", "Author-only note explaining why this temporary voice override exists.", [], {
    ...optionalOpts,
    promptFacing: "never",
    authoringAdvice: "Use this for your process note only; put the actual writer instruction in override_text.",
    criticalVisibleHint: "Not sent to the writer.",
    doctrineWarnings: ["Do not rely on reason to carry continuity, secrets, or rendering instructions."]
  }),
  brief("cast_voice_overrides[].applies_to[]", "Voice surface affected by the temporary override.", [
    "{active_cast_voice_pressure_pins}",
    "{present_minor_cast_notes}"
  ], optionalOpts),
  brief("cast_voice_overrides[].override_text", "The exact temporary voice instruction.", [
    "{active_cast_voice_pressure_pins}",
    "{present_minor_cast_notes}"
  ], {
    ...optionalOpts,
    examples: ["For this confrontation only, his register becomes clipped and formal."],
    antiExamples: ["Change his permanent voice anchor from now on."]
  }),
  validationFocus("generation_validation_focus.validation_focus_tags.generation_context[]", "Which generation context checks apply."),
  validationFocus("generation_validation_focus.validation_focus_tags.expected_local_modes[]", "Expected local-mode checks, not story beats."),
  validationFocus("generation_validation_focus.validation_focus_tags.possible_durable_changes[]", "Possible durable-change checks that may require record updates later."),
  brief("stop_guidance.soft_unit_guidance", "Where the prose should stop for the user's next decision.", [
    "{soft_unit_guidance}"
  ], {
    ...optionalOpts,
    criticalVisibleHint: "Stop at the next local response point; do not ask for downstream consequences.",
    examples: ["Stop when Mara has to decide whether to open the sealed letter."],
    antiExamples: ["Continue through the whole investigation and show the fallout."],
    authoringAdvice: "Use this as a local stop condition, not as a mini-outline."
  })
];

export const briefConfigGuidance: readonly FieldGuidance[] = [
  ...storyConfigEntries,
  ...generationBriefEntries
].map(toFieldGuidance);

function config(
  fieldPath: string,
  short: string,
  promptDestinations: string[],
  options: Partial<GuidanceInput> = {}
): GuidanceInput {
  return {
    fieldPath,
    ownerKind: fieldPath.split(".")[0] ?? fieldPath,
    surface: "story_config",
    short,
    promptFacing: promptDestinations.length > 0 ? "always" : "never",
    promptDestinations,
    ...options
  };
}

function brief(
  fieldPath: string,
  short: string,
  promptDestinations: string[],
  options: Partial<GuidanceInput> = {}
): GuidanceInput {
  return {
    fieldPath: `GENERATION BRIEF.${fieldPath}`,
    ownerKind: "GENERATION BRIEF",
    surface: "generation_brief",
    short,
    displayLabel: generationBriefDisplayLabel(fieldPath),
    promptFacing: promptDestinations.length > 0 ? "conditional" : "never",
    promptDestinations,
    ...options
  };
}

function generationBriefDisplayLabel(fieldPath: string): string {
  const displayLabel = generationBriefDisplayLabels[fieldPath];

  if (!displayLabel) {
    throw new Error(`Missing generation-brief display label for ${fieldPath}`);
  }

  return displayLabel;
}

function validationFocus(fieldPath: string, short: string): GuidanceInput {
  return brief(fieldPath, short, [], {
    ...optionalOpts,
    promptFacing: "never",
    validationRole: "Activates deterministic validation checks; it is not sent to the prose prompt.",
    criticalVisibleHint: "Completeness checks, not plot beats.",
    continuityRole: "Tags help validators inspect risk; they do not create story events."
  });
}

function toFieldGuidance(input: GuidanceInput): FieldGuidance {
  return {
    surface: input.surface ?? "generation_brief",
    ownerKind: input.ownerKind ?? "GENERATION BRIEF",
    promptFacing: input.promptFacing ?? "conditional",
    ...input
  };
}
