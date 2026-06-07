import { describe, expect, it } from "vitest";

import {
  DIAGNOSTIC_CODES,
  buildValidationSnapshot,
  runValidation,
  type BuildValidationSnapshotInput
} from "../src/index.js";

const povId = "019b0298-5c00-7000-8000-000000000001";
const castId = "019b0298-5c00-7000-8000-000000000002";
const factId = "019b0298-5c00-7000-8000-000000000003";
const secretId = "019b0298-5c00-7000-8000-000000000004";
const objectId = "019b0298-5c00-7000-8000-000000000005";
const entityId = "019b0298-5c00-7000-8000-000000000006";

function cleanInput(): BuildValidationSnapshotInput {
  return {
    records: [
      {
        id: entityId,
        type: "ENTITY",
        payload: {
          id: entityId,
          entity_kind: "person"
        }
      },
      {
        id: castId,
        type: "CAST MEMBER",
        castBand: "active_onstage_cast_full",
        localFunction: "active_speaker",
        payload: fullCastPayload(entityId)
      },
      {
        id: factId,
        type: "FACT",
        payload: {
          id: factId,
          status: "active",
          known_by: [povId]
        }
      }
    ],
    generationSession: {
      active_working_set: {
        selected_records: [castId, factId],
        active_onstage_cast_full: [{ cast_member_id: castId, local_function: "active_speaker" }],
        present_minor_cast_compressed: [],
        offstage_relevant_cast: [],
        selected_pov: povId
      },
      current_authoritative_state: {
        current_time: "Night.",
        current_location: "Warehouse.",
        onstage_entities: [entityId],
        immediate_situation_summary: "A and B are at the loading door while the key changes hands.",
        offstage_pressuring_entities: [],
        positions: "A and B stand near the loading door.",
        possessions: "The key is in A's hand.",
        visible_conditions: ["dim"],
        environmental_conditions: "Rain outside.",
        entity_statuses: "A is awake.",
        line_of_sight_and_visibility: "They can see each other.",
        routes_and_exits: ["loading door"],
        available_time: "A few seconds.",
        consent_or_force_conditions: "none",
        current_locks: ["The roof exit is blocked."]
      },
      immediate_handoff: {
        recent_causal_context: "A arrived with the key.",
        last_visible_moment: "B noticed the key.",
        prior_accepted_prose_status_or_handoff_note: "None. No accepted prose is included.",
        begin_after: "B noticing the key."
      },
      manual_moment_directive: {
        must_render: ["B asks for the key."],
        may_render_if_naturally_caused: [],
        do_not_force: []
      },
      current_cast_voice_pressure: [
        {
          cast_member_id: castId,
          local_function: "active_speaker",
          current_voice_pressure: "B is clipped and afraid.",
          dialogue_pressure: "Direct question.",
          pov_narration_pressure: "none",
          nonverbal_or_silence_pressure: "none",
          current_must_preserve: [],
          current_must_avoid: []
        }
      ],
      cast_voice_overrides: [],
      generation_validation_focus: {
        validation_focus_tags: {
          generation_context: ["first_segment"],
          expected_local_modes: [],
          possible_durable_changes: []
        }
      },
      stop_guidance: {
        soft_unit_guidance: "Stop after B's first response point."
      }
    },
    storyConfig: {
      storyContract: {
        title: "Continuity Test",
        premise: "A city keeps its promises badly.",
        genre_mode: "urban fantasy",
        tone: "tense and intimate",
        continuity_philosophy: "continuity_first",
        setting_baseline: "Rainy districts under old bargains.",
        content_intensity: "mature",
        explicitness: "Render mature material only when earned.",
        language_register: "controlled contemporary prose",
        prose_preferences: {
          psychic_distance: "close",
          dialogue_density: "moment_led",
          interiority: "filtered",
          paragraphing: "mixed"
        }
      },
      universalContentPolicy: {
        rating_label: "Mature",
        allowed_content_scope: "Tense but non-graphic.",
        tonal_handling: "Grounded.",
        governing_policy_note: "Obey provider policy.",
        character_bias_handling: "Render bias as character belief, not endorsement."
      },
      proseMode: {
        pov_character: povId,
        person: "third",
        tense: "past",
        psychic_distance: "close",
        interiority_mode: "filtered",
        dialogue_density: "balanced",
        paragraphing: "mixed",
        language_output: "English",
        special_style_constraints: []
      }
    },
    versions: {
      template: "0.0.0",
      compiler: "0.0.0",
      contract: "1.0.0"
    }
  };
}

describe("universal completeness validation", () => {
  it("stays silent for a fully populated clean snapshot", () => {
    const result = runValidation(buildValidationSnapshot(cleanInput()));

    expect(result.blockers).toEqual([]);
    expect(result.isBlocked).toBe(false);
  });

  it.each([
    [
      "story config",
      DIAGNOSTIC_CODES.missingStoryConfig,
      (input: BuildValidationSnapshotInput) => {
        input.storyConfig.storyContract = undefined;
      }
    ],
    [
      "current state",
      DIAGNOSTIC_CODES.missingCurrentAuthoritativeState,
      (input: BuildValidationSnapshotInput) => {
        input.generationSession.current_authoritative_state = undefined;
      }
    ],
    [
      "manual directive",
      DIAGNOSTIC_CODES.missingManualDirective,
      (input: BuildValidationSnapshotInput) => {
        input.generationSession.manual_moment_directive = { must_render: [] };
      }
    ],
    [
      "POV knowledge",
      DIAGNOSTIC_CODES.povKnowledgeMissing,
      (input: BuildValidationSnapshotInput) => {
        input.records = input.records.filter((record) => record.id !== factId);
      }
    ]
  ])("blocks when %s is incomplete", (_name, code, mutate) => {
    const input = cleanInput();
    mutate(input);

    expect(blockerCodes(input)).toContain(code);
  });

  it("requires only the minimum current authoritative state when no physical focus tag is selected", () => {
    const input = cleanInput();
    input.generationSession.current_authoritative_state = {
      current_time: "Night.",
      current_location: "Warehouse.",
      onstage_entities: [entityId],
      immediate_situation_summary: "A and B are at the loading door while the key changes hands.",
      offstage_pressuring_entities: [],
      positions: [],
      possessions: [],
      visible_conditions: [],
      environmental_conditions: "",
      entity_statuses: "",
      line_of_sight_and_visibility: "",
      routes_and_exits: [],
      available_time: "",
      consent_or_force_conditions: "none",
      current_locks: []
    };

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.missingCurrentAuthoritativeState);
  });

  it("blocks when immediate situation summary is missing from the minimum current state", () => {
    const input = cleanInput();
    input.generationSession.current_authoritative_state = {
      ...input.generationSession.current_authoritative_state,
      immediate_situation_summary: ""
    };

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.missingCurrentAuthoritativeState);
  });

  it("allows first-segment generation without handoff or stop guidance", () => {
    const input = cleanInput();
    input.generationSession.immediate_handoff = undefined;
    input.generationSession.stop_guidance = { soft_unit_guidance: "" };

    const codes = blockerCodes(input);
    expect(codes).not.toContain(DIAGNOSTIC_CODES.missingImmediateHandoff);
    expect(codes).not.toContain("missing-stop-guidance");
  });

  it("blocks continuation generation without a complete handoff", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus.validation_focus_tags.generation_context = [
      "continuation_after_accepted_segment"
    ];
    input.generationSession.immediate_handoff = undefined;

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.missingImmediateHandoff);
  });

  it("flags only malformed multiple generation contexts", () => {
    const missingContextInput = cleanInput();
    missingContextInput.generationSession.generation_validation_focus = undefined;
    expect(blockerCodes(missingContextInput)).not.toContain(DIAGNOSTIC_CODES.focusTagCountInvalid);

    const malformedInput = cleanInput();
    malformedInput.generationSession.generation_validation_focus.validation_focus_tags.generation_context = [
      "first_segment",
      "continuation_after_accepted_segment"
    ];
    expect(blockerCodes(malformedInput)).toContain(DIAGNOSTIC_CODES.focusTagCountInvalid);
  });

  it("blocks an active secret missing reveal-boundary fields", () => {
    const input = cleanInput();
    input.records = [
      ...input.records,
      {
        id: secretId,
        type: "SECRET",
        payload: {
          id: secretId,
          status: "hidden",
          holders: [],
          non_holders_to_protect: "none",
          forbidden_reveals: [],
          reveal_permission: "locked",
          allowed_surface_cues: []
        }
      }
    ];

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.activeSecretIncomplete);
  });

  it("requires allowed cues when clue pressure is active", () => {
    const input = cleanInput();
    input.records = [
      ...input.records,
      {
        id: secretId,
        type: "SECRET",
        payload: {
          id: secretId,
          status: "hidden",
          holders: [povId],
          non_holders_to_protect: [entityId],
          forbidden_reveals: ["Do not state the true name."],
          reveal_permission: "clue_only",
          allowed_surface_cues: []
        }
      }
    ];
    input.generationSession.generation_validation_focus = {
      validation_focus_tags: {
        generation_context: ["first_segment"],
        expected_local_modes: ["secret_or_clue_pressure"],
        possible_durable_changes: []
      }
    };

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.activeSecretIncomplete);
  });

  it("blocks active physical interaction missing required physical context", () => {
    const input = cleanInput();
    input.records = [
      ...input.records,
      {
        id: objectId,
        type: "OBJECT",
        payload: { id: objectId, status: "active" }
      }
    ];
    input.generationSession.generation_validation_focus.validation_focus_tags.possible_durable_changes = [
      "object_use_possible"
    ];
    input.generationSession.current_authoritative_state = {
      ...input.generationSession.current_authoritative_state,
      possessions: []
    };

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.activePhysicalContextIncomplete);
  });

  it("blocks active onstage cast missing core dossier or local function", () => {
    const input = cleanInput();
    input.records = input.records.map((record) =>
      record.id === castId
        ? {
            ...record,
            localFunction: undefined,
            payload: {
              entity_id: entityId,
              identity: { one_line: "A" }
            }
          }
        : record
    );

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.activeCastIncomplete);
  });
});

function blockerCodes(input: BuildValidationSnapshotInput): readonly string[] {
  return runValidation(buildValidationSnapshot(input)).blockers.map((diagnostic) => diagnostic.code);
}

function fullCastPayload(entityIdValue: string) {
  return {
    entity_id: entityIdValue,
    identity: {
      one_line: "A careful operator.",
      public_face: "Composed.",
      private_pressure: "Fearful."
    },
    voice_anchor: {
      core_voice: "formal",
      rhythm_and_syntax: "measured",
      register_and_diction: "precise",
      vocabulary_and_metaphor_pools: "weather",
      profanity_and_intensity: "low",
      taboo_and_avoidance_patterns: "home",
      dialogue_tactics_and_speech_functions: "deflects",
      address_terms_and_naming: "titles",
      silence_interruption_and_turntaking: "strategic",
      under_pressure_voice: "clipped",
      suppression_or_evasion_rule: "redirects",
      must_preserve: ["precision"],
      must_avoid: ["rambling"],
      anti_repetition_warnings: ["do not repeat weather metaphors"]
    },
    pressure_behavior_core: {
      cornered: "narrows choices",
      tempted_or_offered_power: "bargains",
      protecting_attachment: "deflects"
    },
    body_presence_core: {
      physicality: "still",
      habitual_gestures_or_presence: "folded hands",
      social_presentation: "controlled"
    },
    agency_core: {
      default_strategy: "delay",
      risk_style: "calculated"
    }
  };
}
