import { describe, expect, it } from "vitest";

import {
  DIAGNOSTIC_CODES,
  buildValidationSnapshot,
  runValidation,
  type BuildValidationSnapshotInput
} from "../src/index.js";

const povId = "019b0298-5c00-7000-8000-000000000001";
const castA = "019b0298-5c00-7000-8000-000000000002";
const castB = "019b0298-5c00-7000-8000-000000000003";
const castC = "019b0298-5c00-7000-8000-000000000004";
const minorId = "019b0298-5c00-7000-8000-000000000005";
const entityId = "019b0298-5c00-7000-8000-000000000006";
const factId = "019b0298-5c00-7000-8000-000000000007";
const statusId = "019b0298-5c00-7000-8000-000000000008";
const relationshipId = "019b0298-5c00-7000-8000-000000000009";

describe("voice/dialogue/presence matrix validation", () => {
  it("stays silent when voice matrix tags are absent", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus.validation_focus_tags.expected_local_modes = [];
    input.generationSession.current_cast_voice_pressure = [];

    expect(blockerCodes(input)).not.toEqual(
      expect.arrayContaining([
        DIAGNOSTIC_CODES.matrixDialogueIncomplete,
        DIAGNOSTIC_CODES.matrixEnsembleDialogueIncomplete,
        DIAGNOSTIC_CODES.matrixActiveSilentPresenceIncomplete,
        DIAGNOSTIC_CODES.matrixPresentMinorSpeechIncomplete
      ])
    );
  });

  it("stays silent when all voice matrix tags are satisfied", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus.validation_focus_tags.expected_local_modes = [
      "dialogue_expected",
      "ensemble_dialogue_expected",
      "active_silent_presence_expected",
      "present_minor_speech_possible"
    ];

    expect(blockerCodes(input)).not.toEqual(
      expect.arrayContaining([
        DIAGNOSTIC_CODES.matrixDialogueIncomplete,
        DIAGNOSTIC_CODES.matrixEnsembleDialogueIncomplete,
        DIAGNOSTIC_CODES.matrixActiveSilentPresenceIncomplete,
        DIAGNOSTIC_CODES.matrixPresentMinorSpeechIncomplete
      ])
    );
  });

  it.each([
    [
      "dialogue_expected",
      DIAGNOSTIC_CODES.matrixDialogueIncomplete,
      (input: BuildValidationSnapshotInput) => {
        input.records = input.records.filter((record) => record.id !== relationshipId && record.id !== statusId);
      }
    ],
    [
      "ensemble_dialogue_expected",
      DIAGNOSTIC_CODES.matrixEnsembleDialogueIncomplete,
      (input: BuildValidationSnapshotInput) => {
        input.generationSession.current_cast_voice_pressure = input.generationSession.current_cast_voice_pressure.map((entry) =>
          ["019b0298-5c00-7000-8000-000000000002", "019b0298-5c00-7000-8000-000000000003", "019b0298-5c00-7000-8000-000000000004"].includes(entry.cast_member_id)
            ? { ...entry, current_voice_pressure: "same" }
            : entry
        );
      }
    ],
    [
      "active_silent_presence_expected",
      DIAGNOSTIC_CODES.matrixActiveSilentPresenceIncomplete,
      (input: BuildValidationSnapshotInput) => {
        input.generationSession.current_cast_voice_pressure = input.generationSession.current_cast_voice_pressure.map((entry) =>
          entry.cast_member_id === castC ? { ...entry, nonverbal_or_silence_pressure: "none" } : entry
        );
      }
    ],
    [
      "present_minor_speech_possible",
      DIAGNOSTIC_CODES.matrixPresentMinorSpeechIncomplete,
      (input: BuildValidationSnapshotInput) => {
        input.generationSession.current_cast_voice_pressure = input.generationSession.current_cast_voice_pressure.filter((entry) => entry.cast_member_id !== minorId);
      }
    ]
  ])("blocks %s when required voice matrix state is missing", (tag, code, mutate) => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus.validation_focus_tags.expected_local_modes = [tag];
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
      castRecord(castA, entityId),
      castRecord(castB, entityId),
      castRecord(castC, entityId),
      {
        id: factId,
        type: "FACT",
        payload: { id: factId, status: "active", known_by: [povId] }
      },
      {
        id: statusId,
        type: "ENTITY STATUS",
        payload: {
          entity_id: entityId,
          life: "alive",
          agency: "free",
          location: "019b0298-5c00-7000-8000-000000000111",
          visibility_to_pov: "visible"
        }
      },
      {
        id: relationshipId,
        type: "RELATIONSHIP",
        payload: {
          id: relationshipId,
          status: "active",
          from: entityId,
          to: povId,
          pressure_text: "They are testing each other.",
          current_expression: "Tense courtesy."
        }
      }
    ],
    generationSession: {
      active_working_set: {
        selected_records: [castA, castB, castC, factId, statusId, relationshipId],
        active_onstage_cast_full: [
          { cast_member_id: castA, local_function: "active_speaker" },
          { cast_member_id: castB, local_function: "active_speaker" },
          { cast_member_id: castC, local_function: "active_silent" }
        ],
        present_minor_cast_compressed: [minorId],
        offstage_relevant_cast: [],
        selected_pov: povId
      },
      current_authoritative_state: {
        current_time: "Night.",
        current_location: "Warehouse.",
        onstage_entities: [entityId],
        offstage_pressuring_entities: [],
        positions: "A, B, and C stand near the loading door.",
        possessions: "The key is in A's hand.",
        visible_conditions: ["dim"],
        environmental_conditions: "Rain outside.",
        entity_statuses: "A is awake.",
        line_of_sight_and_visibility: "They can see and hear each other.",
        routes_and_exits: ["loading door"],
        available_time: "A few seconds.",
        consent_or_force_conditions: "none",
        current_locks: ["C may only act visibly; no non-POV interiority leak."]
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
        pressure(castA, "active_speaker", "A is clipped.", "A asks directly.", "none"),
        pressure(castB, "active_speaker", "B is evasive.", "B deflects.", "none"),
        pressure(castC, "active_silent", "C is watchful.", "none", "C grips the doorframe."),
        pressure(minorId, "present_minor_speaker", "Minor speaks in short factual fragments.", "one line only", "none")
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
    versions: { template: "0.0.0", compiler: "0.0.0", contract: "1.0.0" }
  };
}

function castRecord(id: string, entityIdValue: string) {
  return {
    id,
    type: "CAST MEMBER",
    castBand: "active_onstage_cast_full",
    localFunction: id === castC ? "active_silent" : "active_speaker",
    payload: {
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
    }
  };
}

function pressure(
  castMemberId: string,
  localFunction: "active_speaker" | "active_silent" | "present_minor_speaker",
  currentVoicePressure: string,
  dialoguePressure: string,
  silencePressure: string
) {
  return {
    cast_member_id: castMemberId,
    local_function: localFunction,
    current_voice_pressure: currentVoicePressure,
    dialogue_pressure: dialoguePressure,
    pov_narration_pressure: "none",
    nonverbal_or_silence_pressure: silencePressure,
    current_must_preserve: [],
    current_must_avoid: []
  };
}
