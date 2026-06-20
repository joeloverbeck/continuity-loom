import { describe, expect, it } from "vitest";

import {
  DIAGNOSTIC_CODES,
  buildValidationSnapshot,
  runValidation,
  type BuildValidationSnapshotInput
} from "../src/index.js";
import { isCleanNoAcceptedProseNote } from "../src/validation/rules/universal-blockers.js";

const povId = "019b0298-5c00-7000-8000-000000000001";
const castId = "019b0298-5c00-7000-8000-000000000002";
const factId = "019b0298-5c00-7000-8000-000000000003";
const entityId = "019b0298-5c00-7000-8000-000000000004";
const recordA = "019b0298-5c00-7000-8000-000000000005";
const recordB = "019b0298-5c00-7000-8000-000000000006";

describe("universal blocker validation", () => {
  it("stays silent for a clean universal-blocker snapshot", () => {
    expect(runValidation(buildValidationSnapshot(cleanInput())).blockers).toEqual([]);
  });

  it("does not throw when optional voice-pressure rows are absent", () => {
    const snapshot = buildValidationSnapshot({
      records: [],
      generationSession: {},
      storyConfig: {},
      versions: {
        template: "0.0.0",
        compiler: "0.0.0",
        contract: "1.0.0"
      }
    } as unknown as BuildValidationSnapshotInput);

    expect(() => runValidation(snapshot)).not.toThrow();
  });

  it("does not throw when validation focus tags are absent", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus = {} as BuildValidationSnapshotInput["generationSession"]["generation_validation_focus"];

    expect(() => runValidation(buildValidationSnapshot(input))).not.toThrow();
  });

  it("does not throw when generation context is absent from validation focus tags", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus = ({
      validation_focus_tags: {
        expected_local_modes: [],
        possible_durable_changes: []
      }
    } as unknown) as BuildValidationSnapshotInput["generationSession"]["generation_validation_focus"];

    expect(() => runValidation(buildValidationSnapshot(input))).not.toThrow();
  });

  it.each([
    [
      "non-local directive",
      DIAGNOSTIC_CODES.localProseScopeViolation,
      (input: BuildValidationSnapshotInput) => {
        input.generationSession.manual_moment_directive!.must_render = ["Write the whole chapter outline."];
      }
    ],
    [
      "non-local stop guidance",
      DIAGNOSTIC_CODES.localProseScopeViolation,
      (input: BuildValidationSnapshotInput) => {
        input.generationSession.stop_guidance!.soft_unit_guidance = "Continue through future consequences.";
      }
    ],
    [
      "directive and stop disagreement",
      DIAGNOSTIC_CODES.directiveStopGuidanceDisagreement,
      (input: BuildValidationSnapshotInput) => {
        input.generationSession.manual_moment_directive!.must_render = ["Continue through the later consequence."];
        input.generationSession.stop_guidance!.soft_unit_guidance = "Stop after the first response point.";
      }
    ],
    [
      "state handoff contradiction",
      DIAGNOSTIC_CODES.handoffCurrentStateContradiction,
      (input: BuildValidationSnapshotInput) => {
        input.generationSession.immediate_handoff!.last_visible_moment = "This contradicts current state.";
      }
    ],
    [
      "one entity in two locations",
      DIAGNOSTIC_CODES.entityCurrentLocationContradiction,
      (input: BuildValidationSnapshotInput) => {
        input.records = [
          ...input.records,
          {
            id: recordA,
            type: "ENTITY STATUS",
            payload: { entity_id: entityId, life: "alive", agency: "free", location: "019b0298-5c00-7000-8000-000000000111" }
          },
          {
            id: recordB,
            type: "ENTITY STATUS",
            payload: { entity_id: entityId, life: "alive", agency: "free", location: "019b0298-5c00-7000-8000-000000000222" }
          }
        ];
      }
    ],
    [
      "one object with two holders",
      DIAGNOSTIC_CODES.objectCurrentHolderContradiction,
      (input: BuildValidationSnapshotInput) => {
        input.records = [
          ...input.records,
          {
            id: recordA,
            type: "OBJECT",
            payload: {
              owner: povId,
              carried_by: entityId
            }
          }
        ];
      }
    ],
    [
      "active plan held by unable entity",
      DIAGNOSTIC_CODES.inactivePlanHolder,
      (input: BuildValidationSnapshotInput) => {
        input.records = [
          ...input.records,
          {
            id: recordA,
            type: "ENTITY STATUS",
            payload: { entity_id: entityId, life: "alive", agency: "unconscious", location: "019b0298-5c00-7000-8000-000000000111" }
          },
          {
            id: recordB,
            type: "PLAN",
            payload: {
              plan_status: "active",
              holder: entityId,
              current_step: "Act now.",
              resources: [],
              fallback_steps: [],
              can_drive_prose: true
            }
          }
        ];
      }
    ],
    [
      "secret both hidden from and known by POV",
      DIAGNOSTIC_CODES.secretRevealContradiction,
      (input: BuildValidationSnapshotInput) => {
        input.records = [...input.records, hiddenKnownSecret()];
      }
    ],
    [
      "hidden truth in POV knowledge",
      DIAGNOSTIC_CODES.hiddenTruthInPovKnowledge,
      (input: BuildValidationSnapshotInput) => {
        input.records = [...input.records, hiddenKnownSecret()];
      }
    ],
    [
      "offstage interruption missing route",
      DIAGNOSTIC_CODES.offstageInterruptionMissingRoute,
      (input: BuildValidationSnapshotInput) => {
        input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = ["offstage_interruption_possible"];
        input.generationSession.current_authoritative_state!.routes_and_exits = [];
      }
    ],
    [
      "physical action missing context",
      DIAGNOSTIC_CODES.impossibleActionPhysicalContext,
      (input: BuildValidationSnapshotInput) => {
        input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = ["physical_interaction_expected"];
        input.generationSession.current_authoritative_state!.consent_or_force_conditions = "";
      }
    ],
    [
      "current voice pressure contradicts content envelope",
      DIAGNOSTIC_CODES.contentEnvelopeContradiction,
      (input: BuildValidationSnapshotInput) => {
        input.generationSession.current_cast_voice_pressure[0]!.current_voice_pressure = "Render graphic gore in the voice.";
      }
    ],
    [
      "content envelope contradiction",
      DIAGNOSTIC_CODES.contentEnvelopeContradiction,
      (input: BuildValidationSnapshotInput) => {
        input.storyConfig.universalContentPolicy!.allowed_content_scope = "No explicit sex or non-graphic violence.";
        input.generationSession.manual_moment_directive!.must_render = ["Render explicit sex."];
      }
    ],
    [
      "prompt-facing prose contamination",
      DIAGNOSTIC_CODES.promptFacingProseContamination,
      (input: BuildValidationSnapshotInput) => {
        input.generationSession.immediate_handoff!.recent_causal_context = "This is copied accepted prose from the last scene.";
      }
    ],
    [
      "missing constitutional section source",
      DIAGNOSTIC_CODES.missingConstitutionalSection,
      (input: BuildValidationSnapshotInput) => {
        input.versions.template = "";
      }
    ]
  ])("blocks %s", (_name, code, mutate) => {
    const input = cleanInput();
    mutate(input);

    const diagnostic = runValidation(buildValidationSnapshot(input)).blockers.find((item) => item.code === code);

    expect(diagnostic?.severity).toBe("blocker");
  });

  it("blocks first segment continuation phrasing and preserves the clean no-accepted-prose note", () => {
    const input = cleanInput();

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.promptFacingProseContamination);

    input.generationSession.immediate_handoff!.begin_after = "Continue from last time.";

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.promptFacingProseContamination);
  });

  it.each([
    ["absent", undefined, true],
    ["empty", "", true],
    ["clean sentinel", "None. No accepted prose is included.", true],
    ["literal none", "none", true],
    ["real handoff note", "A user-authored continuation bridge.", false]
  ])("classifies %s prior-prose notes", (_name, text, expected) => {
    expect(isCleanNoAcceptedProseNote(text)).toBe(expected);
  });

  it("does not block first-segment handoff when the prior-prose note is absent", () => {
    const input = cleanInput();
    input.generationSession.immediate_handoff = {
      recent_causal_context: "A arrived with the key.",
      last_visible_moment: "B noticed the key.",
      begin_after: "B noticing the key."
    } as BuildValidationSnapshotInput["generationSession"]["immediate_handoff"];

    expect(() => runValidation(buildValidationSnapshot(input))).not.toThrow();
    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.promptFacingProseContamination);
  });

  it("names the missing current-state fields in the universal blocker", () => {
    const input = cleanInput();
    input.generationSession.current_authoritative_state = {
      ...input.generationSession.current_authoritative_state!,
      current_time: "Night.",
      current_location: "",
      onstage_entities: [],
      immediate_situation_summary: ""
    };

    const diagnostic = runValidation(buildValidationSnapshot(input)).blockers.find(
      (item) => item.code === DIAGNOSTIC_CODES.missingCurrentAuthoritativeState
    );

    expect(diagnostic?.message).toBe(
      "Current authoritative state is missing: current location, onstage entities, immediate situation summary."
    );
  });

  it("does not emit the current-state blocker when all current-state required fields are present", () => {
    const input = cleanInput();

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.missingCurrentAuthoritativeState);
  });

  it("does not block a holder POV protected by all_except_holders", () => {
    const input = cleanInput();
    input.records = [
      ...input.records,
      {
        id: recordA,
        type: "SECRET",
        payload: {
          id: recordA,
          status: "hidden",
          holders: [povId],
          non_holders_to_protect: "all_except_holders",
          pov_access: "knows",
          forbidden_reveals: ["Do not reveal the motive to non-holders."],
          reveal_permission: "locked",
          allowed_surface_cues: ["a careful pause"]
        }
      }
    ];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.secretRevealContradiction);
  });

  it("blocks contaminated continuation handoff", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.generation_context = ["continuation_after_accepted_segment"];
    input.generationSession.immediate_handoff!.prior_accepted_prose_status_or_handoff_note = "Rejected candidate: she opened the door.";

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.promptFacingProseContamination);
  });
});

function blockerCodes(input: BuildValidationSnapshotInput): readonly string[] {
  return runValidation(buildValidationSnapshot(input)).blockers.map((diagnostic) => diagnostic.code);
}

function cleanInput(): BuildValidationSnapshotInput {
  return {
    records: [
      {
        id: povId,
        type: "ENTITY",
        payload: {
          id: povId,
          entity_kind: "person"
        }
      },
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
        selected_records: [povId, castId, factId],
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
        setting_baseline: "Rainy districts under old bargains.",
        content_intensity: "mature",
        explicitness: "Render mature material only when earned.",
        language_register: "controlled contemporary prose",
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

function hiddenKnownSecret() {
  return {
    id: recordA,
    type: "SECRET",
    payload: {
      id: recordA,
      status: "hidden",
      holders: [povId],
      non_holders_to_protect: [povId],
      pov_access: "hidden",
      forbidden_reveals: ["Do not state the name."],
      reveal_permission: "locked",
      allowed_surface_cues: ["a chill"]
    }
  };
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
