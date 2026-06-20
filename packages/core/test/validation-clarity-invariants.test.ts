import { describe, expect, it } from "vitest";

import {
  DIAGNOSTIC_CODES,
  buildValidationSnapshot,
  runValidation,
  type BuildValidationSnapshotInput,
  type ValidationRecord
} from "../src/index.js";

const povId = "019b0298-5c00-7000-8000-000000000101";
const castId = "019b0298-5c00-7000-8000-000000000102";
const factId = "019b0298-5c00-7000-8000-000000000103";
const entityId = "019b0298-5c00-7000-8000-000000000104";
const recordA = "019b0298-5c00-7000-8000-000000000105";
const recordB = "019b0298-5c00-7000-8000-000000000106";

type InputMutator = (input: BuildValidationSnapshotInput) => void;

describe("validation clarity invariants", () => {
  it("keeps diagnostic code values unique in the registry", () => {
    const registeredCodes = Object.values(DIAGNOSTIC_CODES);

    // This intentionally does not require every registered code to be emitted.
    expect(new Set(registeredCodes).size).toBe(registeredCodes.length);
  });

  it("emits legible diagnostics and actionable blockers across representative cases", () => {
    const diagnostics = diagnosticCorpus().flatMap(({ label, mutate }) => {
      const input = cleanInput();
      mutate(input);
      const result = runValidation(buildValidationSnapshot(input));

      expect(result.isBlocked).toBe(result.blockers.length > 0);

      return [...result.blockers, ...result.warnings].map((diagnostic) => ({ label, diagnostic }));
    });

    expect(diagnostics.length).toBeGreaterThan(0);

    for (const { label, diagnostic } of diagnostics) {
      expect(trimmed(diagnostic.message), `${label}: ${diagnostic.code} message`).not.toBe("");
      expect(trimmed(diagnostic.whyItMatters), `${label}: ${diagnostic.code} whyItMatters`).not.toBe("");

      if (diagnostic.severity === "blocker") {
        expect(diagnostic.suggestedActions.length, `${label}: ${diagnostic.code} suggestedActions`).toBeGreaterThan(0);
      }
    }
  });

  it("keeps warnings non-gating and blockers gating", () => {
    const warningInput = cleanInput();
    warningInput.records = [
      ...warningInput.records,
      ...Array.from({ length: 7 }, (_, index) =>
        record(`high-${index}`, "FACT", { statement: `High salience fact ${index}.`, salience: "critical" })
      )
    ];
    const warningOnly = runValidation(buildValidationSnapshot(warningInput));

    expect(warningOnly.warnings.length).toBeGreaterThan(0);
    expect(warningOnly.blockers).toEqual([]);
    expect(warningOnly.isBlocked).toBe(false);

    const blockerInput = cleanInput();
    blockerInput.generationSession.manual_moment_directive!.must_render = ["Write the whole chapter outline."];
    const blockerBearing = runValidation(buildValidationSnapshot(blockerInput));

    expect(blockerBearing.blockers.length).toBeGreaterThan(0);
    expect(blockerBearing.isBlocked).toBe(true);
  });
});

function diagnosticCorpus(): Array<{ label: string; mutate: InputMutator }> {
  return [
    {
      label: "warning-only high salience",
      mutate: (input) => {
        input.records = [
          ...input.records,
          ...Array.from({ length: 7 }, (_, index) =>
            record(`high-${index}`, "FACT", { statement: `High salience fact ${index}.`, salience: "critical" })
          )
        ];
      }
    },
    {
      label: "non-local directive",
      mutate: (input) => {
        input.generationSession.manual_moment_directive!.must_render = ["Write the whole chapter outline."];
      }
    },
    {
      label: "directive and stop disagreement",
      mutate: (input) => {
        input.generationSession.manual_moment_directive!.must_render = ["Continue through the later consequence."];
        input.generationSession.stop_guidance!.soft_unit_guidance = "Stop after the first response point.";
      }
    },
    {
      label: "state handoff contradiction",
      mutate: (input) => {
        input.generationSession.immediate_handoff!.last_visible_moment = "This contradicts current state.";
      }
    },
    {
      label: "one entity in two locations",
      mutate: (input) => {
        input.records = [
          ...input.records,
          record(recordA, "ENTITY STATUS", {
            entity_id: entityId,
            life: "alive",
            agency: "free",
            location: "019b0298-5c00-7000-8000-000000000111"
          }),
          record(recordB, "ENTITY STATUS", {
            entity_id: entityId,
            life: "alive",
            agency: "free",
            location: "019b0298-5c00-7000-8000-000000000222"
          })
        ];
      }
    },
    {
      label: "secret hidden from and known by POV",
      mutate: (input) => {
        input.records = [...input.records, hiddenKnownSecret()];
      }
    },
    {
      label: "offstage interruption missing route",
      mutate: (input) => {
        input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
          "offstage_interruption_possible"
        ];
        input.generationSession.current_authoritative_state!.routes_and_exits = [];
      }
    },
    {
      label: "content envelope contradiction",
      mutate: (input) => {
        input.storyConfig.universalContentPolicy!.allowed_content_scope = "No explicit sex or non-graphic violence.";
        input.generationSession.manual_moment_directive!.must_render = ["Render explicit sex."];
      }
    },
    {
      label: "prompt-facing prose contamination",
      mutate: (input) => {
        input.generationSession.immediate_handoff!.recent_causal_context =
          "This is copied accepted prose from the last scene.";
      }
    },
    {
      label: "missing constitutional section source",
      mutate: (input) => {
        input.versions.template = "";
      }
    }
  ];
}

function trimmed(value: string): string {
  return value.trim();
}

function cleanInput(): BuildValidationSnapshotInput {
  return {
    records: [
      record(povId, "ENTITY", {
        id: povId,
        entity_kind: "person"
      }),
      record(entityId, "ENTITY", {
        id: entityId,
        entity_kind: "person"
      }),
      {
        ...record(castId, "CAST MEMBER", fullCastPayload(entityId), "active_onstage_cast_full"),
        localFunction: "active_speaker"
      },
      record(factId, "FACT", {
        id: factId,
        status: "active",
        known_by: [povId]
      })
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

function hiddenKnownSecret(): ValidationRecord {
  return record(recordA, "SECRET", {
    id: recordA,
    status: "hidden",
    holders: [povId],
    non_holders_to_protect: [povId],
    pov_access: "hidden",
    forbidden_reveals: ["Do not state the name."],
    reveal_permission: "locked",
    allowed_surface_cues: ["a chill"]
  });
}

function fullCastPayload(entityIdValue: string): Record<string, unknown> {
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

function record(
  id: string,
  type: string,
  payload: Record<string, unknown>,
  castBand?: ValidationRecord["castBand"]
): ValidationRecord {
  return {
    id,
    type,
    payload,
    ...(castBand ? { castBand } : {})
  };
}
