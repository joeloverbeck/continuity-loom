import type { BuildValidationSnapshotInput } from "../../../src/index.js";

export const validationIds = Object.freeze({
  pov: "019b0298-5c00-7000-8000-000000000001",
  cast: "019b0298-5c00-7000-8000-000000000002",
  fact: "019b0298-5c00-7000-8000-000000000003",
  secret: "019b0298-5c00-7000-8000-000000000004",
  entity: "019b0298-5c00-7000-8000-000000000005"
});

export function cleanValidationInput(): BuildValidationSnapshotInput {
  return {
    records: [
      {
        id: validationIds.entity,
        type: "ENTITY",
        payload: {
          id: validationIds.entity,
          entity_kind: "person"
        }
      },
      {
        id: validationIds.cast,
        type: "CAST MEMBER",
        castBand: "active_onstage_cast_full",
        localFunction: "active_speaker",
        payload: fullCastPayload(validationIds.entity)
      },
      {
        id: validationIds.fact,
        type: "FACT",
        payload: {
          id: validationIds.fact,
          statement: "The narrator knows the warehouse door is locked.",
          known_by: [validationIds.pov]
        }
      }
    ],
    generationSession: {
      active_working_set: {
        selected_records: [validationIds.cast, validationIds.fact],
        active_onstage_cast_full: [{ cast_member_id: validationIds.cast, local_function: "active_speaker" }],
        present_minor_cast_compressed: [],
        offstage_relevant_cast: [],
        selected_pov: validationIds.pov
      },
      current_authoritative_state: {
        current_time: "Night.",
        current_location: "Warehouse.",
        onstage_entities: [validationIds.entity],
        immediate_situation_summary: "A witness waits beside the loading door.",
        offstage_pressuring_entities: [],
        positions: "The witness stands by the loading door.",
        possessions: "No one is holding a weapon.",
        visible_conditions: ["dim"],
        environmental_conditions: "Rain outside.",
        entity_statuses: "The witness is awake.",
        line_of_sight_and_visibility: "The room is visible from the door.",
        routes_and_exits: ["loading door"],
        available_time: "A few seconds.",
        consent_or_force_conditions: "none",
        current_locks: ["The roof exit is blocked."]
      },
      immediate_handoff: {
        recent_causal_context: "The witness heard the lock turn.",
        last_visible_moment: "The witness looked at the loading door.",
        begin_after: "The witness looking at the loading door."
      },
      manual_moment_directive: {
        must_render: ["The witness tests whether the loading door opens."],
        may_render_if_naturally_caused: [],
        do_not_force: []
      },
      current_cast_voice_pressure: [
        {
          cast_member_id: validationIds.cast,
          current_voice_pressure: "The witness is clipped and afraid.",
          dialogue_pressure: "Direct question.",
          pov_narration_pressure: "No extra interiority.",
          nonverbal_or_silence_pressure: "Hands stay visible.",
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
        soft_unit_guidance: "Stop after the witness gets a first response point."
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
        language_register: "controlled contemporary prose"
      },
      universalContentPolicy: {
        rating_label: "Mature",
        allowed_content_scope: "Tense but non-graphic.",
        tonal_handling: "Grounded.",
        character_bias_handling: "Render bias as character belief, not endorsement."
      },
      proseMode: {
        pov_character: validationIds.pov,
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
      template: "1.1.0",
      compiler: "1.3.0",
      contract: "1.4.0"
    }
  };
}

function fullCastPayload(entityId: string): Record<string, unknown> {
  return {
    entity_id: entityId,
    role_in_story: "witness",
    stable_traits: ["observant"],
    voice_anchor: {
      core_voice: "formal",
      vocabulary: "plain",
      syntax: "short",
      rhythm: "clipped",
      forbidden_tics: [],
      sample_utterances: ["I heard it turn."]
    },
    relationship_dynamics: ["guarded"],
    current_local_pressure: "Wants the door open.",
    body_presence_core: {
      posture: "still",
      movement_style: "precise",
      tactile_details: "cold fingers",
      physicality: "still"
    },
    continuity_notes: "Keeps track of exits.",
    status: "active"
  };
}
