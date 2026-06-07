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

const directiveOpts = {
  continuityRole: "Applies authorial pressure within the selected records and current state.",
  doctrineWarnings: ["Manual directives cannot override hard canon, physical state, POV knowledge, reveal locks, or policy."],
  examples: ["Make Mara ask about the missing key before anyone leaves."],
  antiExamples: ["Reveal the locked secret even though the POV cannot know it."],
  authoringAdvice: "Use this as local causal pressure, not as a mini-outline."
} satisfies Partial<GuidanceInput>;

const voicePressureOpts = {
  continuityRole: "Temporary pressure for this generation; durable identity belongs in CAST MEMBER records.",
  criticalVisibleHint: "Current-generation pressure only; update CAST MEMBER records manually for durable changes.",
  authoringAdvice: "Name the pressure that matters now without rewriting the character's permanent dossier."
} satisfies Partial<GuidanceInput>;

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
  config("STORY CONTRACT.continuity_philosophy", "Marks this project as continuity-first story state.", [], {
    promptFacing: "never",
    validationRole: "Operational doctrine marker; it is not sent to the prose prompt."
  }),
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
  config("STORY CONTRACT.prose_preferences.psychic_distance", "Default narrative closeness for prose rendering.", [
    "{psychic_distance}"
  ], { enumValues: psychicDistanceGuidance }),
  config("STORY CONTRACT.prose_preferences.dialogue_density", "Default density of spoken exchange.", [
    "{dialogue_density}"
  ], { enumValues: dialogueDensityGuidance }),
  config("STORY CONTRACT.prose_preferences.interiority", "Default access to thought and felt interior movement.", [
    "{interiority_mode}"
  ], { enumValues: interiorityGuidance }),
  config("STORY CONTRACT.prose_preferences.paragraphing", "Default paragraph rhythm for the prose surface.", [
    "{paragraphing}"
  ], { enumValues: paragraphingGuidance }),
  config("UNIVERSAL CONTENT POLICY.rating_label", "Human-readable rating label for the current policy.", [
    "{rating_label}"
  ]),
  config("UNIVERSAL CONTENT POLICY.allowed_content_scope", "What the prose is allowed to render.", [
    "{allowed_content_scope}"
  ]),
  config("UNIVERSAL CONTENT POLICY.tonal_handling", "How sensitive or intense material should be handled tonally.", [
    "{tonal_handling}"
  ]),
  config("UNIVERSAL CONTENT POLICY.governing_policy_note", "Provider or platform policy note that outranks story pressure.", [
    "{governing_policy_note}"
  ], {
    doctrineWarnings: ["Manual directives and character pressure cannot override governing policy."]
  }),
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
    continuityRole: "The active working set is explicit and user-controlled; omitted records are not silently added."
  }),
  brief("active_working_set.active_onstage_cast_full[].cast_member_id", "Cast member receiving a full active dossier.", [
    "rich_active_cast_dossiers",
    "{active_onstage_full_cast_dossiers}"
  ]),
  brief("active_working_set.active_onstage_cast_full[].local_function", "Why this cast member matters locally.", [
    "{active_onstage_full_cast_dossiers}"
  ], { enumValues: localFunctionGuidance }),
  brief("active_working_set.present_minor_cast_compressed[]", "Present cast kept intentionally compressed.", [
    "present_minor_cast",
    "{present_minor_cast_notes}"
  ]),
  brief("active_working_set.offstage_relevant_cast[]", "Offstage cast allowed to pressure the scene.", [
    "offstage_relevance",
    "{offstage_relevance_notes}"
  ]),
  brief("active_working_set.selected_pov", "Selected viewpoint for this generation.", ["{pov_character}"]),
  brief("active_working_set.manual_directive_id", "Operational link to the current manual directive.", [], {
    promptFacing: "never",
    validationRole: "Used to connect UI state; it is not sent to the prose prompt."
  }),
  brief("current_authoritative_state.current_time", "The exact current story time.", ["{current_time}"], currentStateOpts),
  brief("current_authoritative_state.current_location", "The current location authority.", ["{current_location}"], currentStateOpts),
  brief("current_authoritative_state.onstage_entities[]", "Entities physically or narratively onstage now.", [
    "{onstage_entities}"
  ], currentStateOpts),
  brief(
    "current_authoritative_state.immediate_situation_summary",
    "Short user-authored summary of the immediate local situation.",
    ["{immediate_situation_summary}"],
    {
      ...currentStateOpts,
      doctrineWarnings: ["Do not derive this from accepted prose, candidate prose, or automatic summaries."],
      examples: ["Elin and Niko are in the cellar while she guards the hidden flour bin."],
      authoringAdvice: "Keep it local, state-like, and prose-neutral; describe the starting situation, not an outline."
    }
  ),
  brief("current_authoritative_state.offstage_pressuring_entities[]", "Offstage entities exerting immediate pressure.", [
    "{offstage_pressuring_entities}"
  ], currentStateOpts),
  brief("current_authoritative_state.positions", "Where bodies and important things are positioned.", ["{positions}"], currentStateOpts),
  brief("current_authoritative_state.possessions", "Who has or controls important objects now.", ["{possessions}"], currentStateOpts),
  brief("current_authoritative_state.visible_conditions[]", "Conditions visible in the local scene.", [
    "{visible_conditions}"
  ], currentStateOpts),
  brief("current_authoritative_state.environmental_conditions", "Environmental facts currently shaping action.", [
    "{environmental_conditions}"
  ], currentStateOpts),
  brief("current_authoritative_state.entity_statuses", "Current state of relevant entities.", ["{entity_statuses}"], currentStateOpts),
  brief("current_authoritative_state.line_of_sight_and_visibility", "What can and cannot be seen now.", [
    "{line_of_sight_and_visibility}"
  ], currentStateOpts),
  brief("current_authoritative_state.routes_and_exits[]", "Available routes, exits, and movement constraints.", [
    "{routes_and_exits}"
  ], currentStateOpts),
  brief("current_authoritative_state.available_time", "How much time is available before pressure changes.", [
    "{available_time}"
  ], currentStateOpts),
  brief("current_authoritative_state.consent_or_force_conditions", "Current consent, coercion, restraint, or force constraints.", [
    "{consent_or_force_conditions}"
  ], currentStateOpts),
  brief("current_authoritative_state.current_locks[]", "Current locked doors, blocked options, or hard limits.", [
    "{current_locks}"
  ], currentStateOpts),
  brief("immediate_handoff.recent_causal_context", "User-authored recent cause that launches the next segment.", [
    "{recent_causal_context}"
  ], {
    examples: ["Mara just saw the seal crack and has not warned Ivo yet."],
    antiExamples: ["A recap of the entire previous chapter."],
    authoringAdvice: "Keep this as causal context, not a transcript or summary archive."
  }),
  brief("immediate_handoff.last_visible_moment", "The last visible action or image before generation begins.", [
    "{last_visible_moment}"
  ]),
  brief("immediate_handoff.prior_accepted_prose_status_or_handoff_note", "A handoff note about accepted prose status, not prose authority.", [
    "{prior_accepted_prose_status_or_handoff_note}"
  ], {
    criticalVisibleHint: "Accepted prose is readable output, not continuity authority.",
    doctrineWarnings: ["Do not use accepted prose as canon for future prompt context."],
    examples: ["Previous segment accepted; durable changes still need manual record updates."],
    antiExamples: ["Use the accepted segment as the source of current canon."],
    authoringAdvice: "State the operational handoff; put durable facts in records."
  }),
  brief("immediate_handoff.begin_after", "The exact point where new prose should begin.", ["{begin_after}"], {
    examples: ["Begin after the door shuts behind Lio."],
    antiExamples: ["Begin somewhere later after the argument resolves."],
    authoringAdvice: "Anchor a local start point; do not skip over the next decision."
  }),
  brief("manual_moment_directive.must_render[]", "Required local pressure the next segment must render.", [
    "{manual_must_render}"
  ], directiveOpts),
  brief("manual_moment_directive.may_render_if_naturally_caused[]", "Optional pressure allowed only if the selected state causes it.", [
    "{manual_may_render_if_naturally_caused}"
  ], directiveOpts),
  brief("manual_moment_directive.do_not_force[]", "Outcomes or moves the prose must not force.", ["{manual_do_not_force}"], directiveOpts),
  brief("current_cast_voice_pressure[].cast_member_id", "Cast member receiving current-generation voice pressure.", [
    "{active_cast_voice_pressure_pins}"
  ]),
  brief("current_cast_voice_pressure[].local_function", "The cast member's local function in this generation.", [
    "{active_cast_voice_pressure_pins}"
  ], { enumValues: localFunctionGuidance }),
  brief("current_cast_voice_pressure[].current_voice_pressure", "Temporary voice pressure for this immediate moment.", [
    "{voice_pressure}",
    "{active_cast_voice_pressure_pins}"
  ], voicePressureOpts),
  brief("current_cast_voice_pressure[].dialogue_pressure", "Current dialogue pressure, or none.", ["{voice_pressure}"], voicePressureOpts),
  brief("current_cast_voice_pressure[].pov_narration_pressure", "Current narration pressure for POV rendering, or none.", [
    "{voice_pressure}"
  ], voicePressureOpts),
  brief("current_cast_voice_pressure[].nonverbal_or_silence_pressure", "Current nonverbal or silence pressure, or none.", [
    "{voice_pressure}"
  ], voicePressureOpts),
  brief("current_cast_voice_pressure[].current_must_preserve[]", "Temporary voice elements to preserve now.", [
    "{voice_pressure}"
  ], voicePressureOpts),
  brief("current_cast_voice_pressure[].current_must_avoid[]", "Temporary voice mistakes to avoid now.", [
    "{voice_pressure}"
  ], voicePressureOpts),
  brief("cast_voice_overrides[].cast_member_id", "Cast member receiving a current-generation-only override.", [
    "{voice_pressure}"
  ]),
  brief("cast_voice_overrides[].scope", "The override scope; v1 supports current generation only.", ["{voice_pressure}"], {
    criticalVisibleHint: "Current-generation only; never written back to CAST MEMBER records."
  }),
  brief("cast_voice_overrides[].reason", "Why this temporary voice override exists.", ["{voice_pressure}"]),
  brief("cast_voice_overrides[].applies_to[]", "Voice surface affected by the temporary override.", ["{voice_pressure}"]),
  brief("cast_voice_overrides[].override_text", "The exact temporary voice instruction.", ["{voice_pressure}"], {
    examples: ["For this confrontation only, his register becomes clipped and formal."],
    antiExamples: ["Change his permanent voice anchor from now on."]
  }),
  validationFocus("generation_validation_focus.validation_focus_tags.generation_context[]", "Which generation context checks apply."),
  validationFocus("generation_validation_focus.validation_focus_tags.expected_local_modes[]", "Expected local-mode checks, not story beats."),
  validationFocus("generation_validation_focus.validation_focus_tags.possible_durable_changes[]", "Possible durable-change checks that may require record updates later."),
  brief("stop_guidance.soft_unit_guidance", "Where the prose should stop for the user's next decision.", [
    "{soft_unit_guidance}"
  ], {
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
    promptFacing: promptDestinations.length > 0 ? "conditional" : "never",
    promptDestinations,
    ...options
  };
}

function validationFocus(fieldPath: string, short: string): GuidanceInput {
  return brief(fieldPath, short, [], {
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
