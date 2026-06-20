import { describe, expect, it } from "vitest";

import {
  DIAGNOSTIC_CODES,
  buildValidationSnapshot,
  runValidation,
  type BuildValidationSnapshotInput
} from "../src/index.js";

type ExpectedLocalMode = NonNullable<
  BuildValidationSnapshotInput["generationSession"]["generation_validation_focus"]
>["validation_focus_tags"]["expected_local_modes"][number];

const povId = "019b0298-5c00-7000-8000-000000000001";
const castId = "019b0298-5c00-7000-8000-000000000002";
const factId = "019b0298-5c00-7000-8000-000000000003";
const entityId = "019b0298-5c00-7000-8000-000000000004";
const institutionId = "019b0298-5c00-7000-8000-000000000005";
const statusId = "019b0298-5c00-7000-8000-000000000006";

describe("physical/perception/offstage matrix validation", () => {
  it("stays silent when physical matrix tags are absent", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [];
    input.generationSession.current_authoritative_state!.routes_and_exits = [];

    expect(blockerCodes(input)).not.toEqual(
      expect.arrayContaining([
        DIAGNOSTIC_CODES.matrixPhysicalInteractionIncomplete,
        DIAGNOSTIC_CODES.matrixOffstageInterruptionIncomplete,
        DIAGNOSTIC_CODES.matrixNonhumanPressureIncomplete
      ])
    );
  });

  it("stays silent when all physical matrix tags are satisfied", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      "physical_interaction_expected",
      "offstage_interruption_possible",
      "nonhuman_or_institutional_pressure_expected"
    ];

    expect(blockerCodes(input)).not.toEqual(
      expect.arrayContaining([
        DIAGNOSTIC_CODES.matrixPhysicalInteractionIncomplete,
        DIAGNOSTIC_CODES.matrixOffstageInterruptionIncomplete,
        DIAGNOSTIC_CODES.matrixNonhumanPressureIncomplete
      ])
    );
  });

  it.each([
    [
      "physical_interaction_expected",
      DIAGNOSTIC_CODES.matrixPhysicalInteractionIncomplete,
      (input: BuildValidationSnapshotInput) => {
        input.generationSession.current_authoritative_state!.positions = [];
      }
    ],
    [
      "offstage_interruption_possible",
      DIAGNOSTIC_CODES.matrixOffstageInterruptionIncomplete,
      (input: BuildValidationSnapshotInput) => {
        input.generationSession.current_authoritative_state!.offstage_pressuring_entities = [];
      }
    ],
    [
      "nonhuman_or_institutional_pressure_expected",
      DIAGNOSTIC_CODES.matrixNonhumanPressureIncomplete,
      (input: BuildValidationSnapshotInput) => {
        input.records = input.records.filter((record) => record.id !== institutionId);
      }
    ]
  ])("blocks %s when required physical matrix state is missing", (tag, code, mutate) => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      tag as ExpectedLocalMode
    ];
    mutate(input);

    expect(blockerCodes(input)).toContain(code);
  });
});

function blockerCodes(input: BuildValidationSnapshotInput): readonly string[] {
  return runValidation(buildValidationSnapshot(input)).blockers.map((diagnostic) => diagnostic.code);
}

function cleanInput(): BuildValidationSnapshotInput {
  return {
    records: [
      {
        id: entityId,
        type: "ENTITY",
        payload: { id: entityId, entity_kind: "person" }
      },
      {
        id: institutionId,
        type: "ENTITY",
        payload: {
          id: institutionId,
          entity_kind: "institution",
          short_description: "A local office that can apply immediate pressure."
        }
      },
      {
        id: statusId,
        type: "ENTITY STATUS",
        payload: {
          entity_id: institutionId,
          life: "not_applicable",
          agency: "not_applicable",
          location: "019b0298-5c00-7000-8000-000000000111",
          visibility_to_pov: "audible"
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
        payload: { id: factId, status: "active", known_by: [povId] }
      }
    ],
    generationSession: {
      active_working_set: {
        selected_records: [castId, factId, institutionId, statusId],
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
        offstage_pressuring_entities: [institutionId],
        positions: "A and B stand near the loading door.",
        possessions: "The key is in A's hand.",
        visible_conditions: ["dim", "phone buzzing"],
        environmental_conditions: "Rain outside.",
        entity_statuses: "A is awake.",
        line_of_sight_and_visibility: "They can see each other.",
        routes_and_exits: ["loading door", "phone call"],
        available_time: "A few seconds.",
        consent_or_force_conditions: "none",
        current_locks: [
          "The roof exit is blocked.",
          "Awareness mechanism: the phone buzzes.",
          "Interruption route: phone call.",
          "Pressure mechanism: institutional warning.",
          "Agency limit: institution has no interiority."
        ]
      },
      immediate_handoff: {
        recent_causal_context: "A arrived with the key.",
        last_visible_moment: "B noticed the key.",
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
      stop_guidance: { soft_unit_guidance: "Stop after B's first response point." }
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
    versions: { template: "0.0.0", compiler: "0.0.0", contract: "1.0.0" }
  };
}

function fullCastPayload(entityIdValue: string) {
  return {
    entity_id: entityIdValue,
    identity: { one_line: "A careful operator.", public_face: "Composed.", private_pressure: "Fearful." },
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
    agency_core: { default_strategy: "delay", risk_style: "calculated" }
  };
}
