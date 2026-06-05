import { describe, expect, it } from "vitest";

import {
  DIAGNOSTIC_CODES,
  buildValidationSnapshot,
  runValidation,
  type BuildValidationSnapshotInput
} from "../src/index.js";

const entityId = "019b0298-5c00-7000-8000-000000000001";
const povId = "019b0298-5c00-7000-8000-000000000002";

describe("validation stress-suite mapping", () => {
  it.each([
    ["two current locations", DIAGNOSTIC_CODES.entityCurrentLocationContradiction, twoLocations],
    ["two object holders", DIAGNOSTIC_CODES.objectCurrentHolderContradiction, twoObjectHolders],
    ["secret leakage", DIAGNOSTIC_CODES.secretRevealContradiction, secretLeakage],
    ["impossible physical action", DIAGNOSTIC_CODES.impossibleActionPhysicalContext, impossiblePhysicalAction],
    ["non-local directive", DIAGNOSTIC_CODES.localProseScopeViolation, nonLocalDirective],
    ["accepted-prose contamination", DIAGNOSTIC_CODES.promptFacingProseContamination, acceptedProseContamination]
  ])("blocks representative hard-fail stress case: %s", (_name, code, mutate) => {
    const input = baseInput();
    mutate(input);
    const snapshot = buildValidationSnapshot(input);
    const first = runValidation(snapshot);
    const second = runValidation(snapshot);

    expect(first).toEqual(second);
    expect(first.isBlocked).toBe(true);
    expect(first.blockers.map((diagnostic) => diagnostic.code)).toContain(code);
  });
});

function baseInput(): BuildValidationSnapshotInput {
  return {
    records: [],
    generationSession: {
      current_authoritative_state: {
        current_time: "Night.",
        current_location: "Warehouse.",
        onstage_entities: [entityId],
        offstage_pressuring_entities: [],
        positions: "A stands near the loading door.",
        possessions: "The key is in A's hand.",
        visible_conditions: ["dim"],
        environmental_conditions: "Rain outside.",
        entity_statuses: "A is awake.",
        line_of_sight_and_visibility: "A can see the door.",
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
      current_cast_voice_pressure: [],
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
    versions: { template: "0.0.0", compiler: "0.0.0" }
  };
}

function twoLocations(input: BuildValidationSnapshotInput): void {
  input.records = [
    entityStatus("019b0298-5c00-7000-8000-000000000101", "019b0298-5c00-7000-8000-000000000201"),
    entityStatus("019b0298-5c00-7000-8000-000000000102", "019b0298-5c00-7000-8000-000000000202")
  ];
}

function twoObjectHolders(input: BuildValidationSnapshotInput): void {
  input.records = [
    {
      id: "019b0298-5c00-7000-8000-000000000103",
      type: "OBJECT",
      payload: {
        owner: "019b0298-5c00-7000-8000-000000000301",
        carried_by: "019b0298-5c00-7000-8000-000000000302"
      }
    }
  ];
}

function secretLeakage(input: BuildValidationSnapshotInput): void {
  input.generationSession.active_working_set = {
    selected_records: [],
    active_onstage_cast_full: [],
    present_minor_cast_compressed: [],
    offstage_relevant_cast: [],
    selected_pov: povId
  };
  input.records = [
    {
      id: "019b0298-5c00-7000-8000-000000000104",
      type: "SECRET",
      payload: {
        status: "hidden",
        secret_claim: "The watcher is behind the glass.",
        holders: [povId],
        non_holders_to_protect: [povId],
        pov_access: "hidden",
        audience_visibility: "hidden",
        allowed_surface_cues: ["a chill"],
        forbidden_reveals: ["Do not name the watcher."],
        reveal_permission: "locked"
      }
    }
  ];
}

function impossiblePhysicalAction(input: BuildValidationSnapshotInput): void {
  input.generationSession.generation_validation_focus = {
    validation_focus_tags: {
      generation_context: ["first_segment"],
      expected_local_modes: ["physical_interaction_expected"],
      possible_durable_changes: []
    }
  };
  input.generationSession.current_authoritative_state = {
    ...input.generationSession.current_authoritative_state,
    consent_or_force_conditions: ""
  };
}

function nonLocalDirective(input: BuildValidationSnapshotInput): void {
  input.generationSession.manual_moment_directive = {
    must_render: ["Write the whole chapter outline."],
    may_render_if_naturally_caused: [],
    do_not_force: []
  };
}

function acceptedProseContamination(input: BuildValidationSnapshotInput): void {
  input.generationSession.immediate_handoff = {
    ...input.generationSession.immediate_handoff,
    recent_causal_context: "This includes copied accepted prose from the prior candidate."
  };
}

function entityStatus(id: string, location: string) {
  return {
    id,
    type: "ENTITY STATUS",
    payload: {
      entity_id: entityId,
      life: "alive",
      agency: "free",
      location
    }
  };
}
