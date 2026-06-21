import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  buildValidationSnapshot,
  compilePrompt,
  deriveReadiness,
  runValidation,
  type BuildValidationSnapshotInput
} from "../src/index.js";
import {
  proseSnapshotInput,
  proseSnapshotInputArbitrary
} from "./support/arbitraries/prose-snapshots.js";

function runProperty<T>(property: fc.IProperty<T>, seed: number, runs = 12): void {
  fc.assert(property, { seed, numRuns: runs, verbose: true });
}

function readinessFor(input: BuildValidationSnapshotInput, promptKind: "prose" | "ideation" = "prose") {
  return deriveReadiness(
    runValidation(buildValidationSnapshot(input)),
    { configured: true },
    { hasUnsavedChanges: false },
    new Map(),
    promptKind
  );
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object") {
    return value;
  }

  Object.freeze(value);
  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }

  return value;
}

describe("cross-pillar validation and compilation contracts", () => {
  it("compiles every generated prose-ready snapshot without introducing blockers", () => {
    runProperty(
      fc.property(proseSnapshotInputArbitrary, (input) => {
        const readyInput = generatedReadyInput(input);
        const readiness = readinessFor(readyInput, "prose");
        const result = compilePrompt(buildValidationSnapshot(readyInput));

        expect(readiness.blockers).toEqual([]);
        expect(readiness.canPreview).toBe(true);
        expect(readiness.canGenerate).toBe(true);
        expect(result.prompt.length).toBeGreaterThan(0);
        expect(result.metadata.fingerprint).not.toBe("");
      }),
      0x26013
    );
  });

  it("keeps blocker diagnostics as readiness gates instead of prompt text", () => {
    const input = generatedReadyInput(proseSnapshotInput("material"));
    input.generationSession.manual_moment_directive!.must_render = ["Write the whole chapter outline."];
    const snapshot = buildValidationSnapshot(input);
    const validation = runValidation(snapshot);
    const blocker = validation.blockers.find((diagnostic) => diagnostic.code === "local-prose-scope-violation");
    const readiness = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map(), "prose");
    const prompt = compilePrompt(snapshot).prompt;

    expect(blocker).toBeDefined();
    expect(readiness.canPreview).toBe(false);
    expect(readiness.canGenerate).toBe(false);
    expect(prompt).not.toContain(blocker!.code);
    expect(prompt).not.toContain(blocker!.message);
  });

  it("keeps warning-only diagnostics non-gating and out of prompt text", () => {
    const input = generatedReadyInput(proseSnapshotInput("material"));
    input.records = [
      ...input.records,
      ...Array.from({ length: 7 }, (_, index) => ({
        id: `019b0298-5c00-7000-8000-00000000110${index}`,
        type: "FACT",
        payload: {
          statement: `Warning-only high salience fact ${index}.`,
          salience: "critical"
        }
      }))
    ];
    const snapshot = buildValidationSnapshot(input);
    const validation = runValidation(snapshot);
    const warning = validation.warnings.find((diagnostic) => diagnostic.code === "many-high-salience-records");
    const readiness = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map(), "prose");
    const prompt = compilePrompt(snapshot).prompt;

    expect(validation.blockers).toEqual([]);
    expect(warning).toBeDefined();
    expect(readiness.canPreview).toBe(true);
    expect(readiness.canGenerate).toBe(true);
    expect(readiness.status).toBe("ready-with-warnings");
    expect(prompt).not.toContain(warning!.code);
    expect(prompt).not.toContain(warning!.message);
  });

  it("compiles generated ideation-ready snapshots deterministically", () => {
    runProperty(
      fc.property(proseSnapshotInputArbitrary, (input) => {
        const readyInput = generatedReadyInput(input);
        const readiness = readinessFor(readyInput, "ideation");
        const snapshot = buildValidationSnapshot(readyInput);
        const first = compilePrompt(snapshot, {
          promptKind: "ideation",
          ideationRequest: { mode: "ideas", count: 4, dormantSlot: true }
        });
        const second = compilePrompt(snapshot, {
          promptKind: "ideation",
          ideationRequest: { mode: "ideas", count: 4, dormantSlot: true }
        });

        expect(readiness.blockers).toEqual([]);
        expect(readiness.canPreview).toBe(true);
        expect(readiness.canGenerate).toBe(true);
        expect(second.prompt).toBe(first.prompt);
        expect(second.metadata).toEqual(first.metadata);
      }),
      0x26014
    );
  });

  it("does not mutate the validated snapshot while validating and compiling", () => {
    runProperty(
      fc.property(proseSnapshotInputArbitrary, (input) => {
        const snapshot = buildValidationSnapshot(generatedReadyInput(input));
        const before = structuredClone(snapshot);
        const frozen = deepFreeze(snapshot);

        const validation = runValidation(frozen);
        const result = compilePrompt(frozen);

        expect(validation.isBlocked).toBe(false);
        expect(result.prompt.length).toBeGreaterThan(0);
        expect(frozen).toEqual(before);
      }),
      0x26015
    );
  });
});

function generatedReadyInput(generatedInput: BuildValidationSnapshotInput): BuildValidationSnapshotInput {
  const input = readyValidationInput();
  const supplementalRecords = generatedInput.records.filter((record) => record.type === "LOCATION");

  input.records = [
    ...input.records,
    ...supplementalRecords
  ];

  return input;
}

function readyValidationInput(): BuildValidationSnapshotInput {
  const povId = "019b0298-5c00-7000-8000-000000001000";
  const entityId = "019b0298-5c00-7000-8000-000000001003";
  const castId = "019b0298-5c00-7000-8000-000000001004";
  const factId = "019b0298-5c00-7000-8000-000000001005";
  const locationId = "019b0298-5c00-7000-8000-000000001001";
  const clockId = "019b0298-5c00-7000-8000-000000001002";

  return {
    records: [
      {
        id: povId,
        type: "ENTITY",
        payload: { id: povId, entity_kind: "person" }
      },
      {
        id: entityId,
        type: "ENTITY",
        payload: { id: entityId, entity_kind: "person" }
      },
      {
        id: castId,
        type: "CAST MEMBER",
        castBand: "active_onstage_cast_full",
        localFunction: "active_speaker",
        payload: completeCastPayload(entityId)
      },
      {
        id: factId,
        type: "FACT",
        payload: {
          id: factId,
          statement: "The witness knows the warehouse door is locked.",
          known_by: [povId]
        }
      },
      {
        id: locationId,
        type: "LOCATION",
        payload: {
          id: locationId,
          status: "active",
          label: "Warehouse",
          description: "A narrow warehouse room.",
          layout_relevant_now: "one loading door and one table"
        }
      },
      {
        id: clockId,
        type: "CLOCK",
        payload: {
          id: clockId,
          status: "active",
          current_pressure: "The alarm is close.",
          tick_trigger: "Door opens.",
          next_threshold: "Alarm sounds.",
          possible_effects: ["guards arrive"]
        }
      }
    ],
    generationSession: {
      active_working_set: {
        selected_records: [povId, entityId, castId, factId, locationId, clockId],
        active_onstage_cast_full: [{ cast_member_id: castId, local_function: "active_speaker" }],
        present_minor_cast_compressed: [],
        offstage_relevant_cast: [],
        selected_pov: povId
      },
      current_authoritative_state: {
        current_time: "Night.",
        current_location: locationId,
        onstage_entities: [entityId],
        immediate_situation_summary: "A witness waits beside the loading door.",
        offstage_pressuring_entities: [],
        positions: "The witness stands by the loading door.",
        possessions: "The key is on the table.",
        visible_conditions: ["dim"],
        environmental_conditions: "Rain outside the warehouse.",
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
          cast_member_id: castId,
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
    versions: { template: "1.1.0", compiler: "1.3.0", contract: "1.4.0" }
  };
}

function completeCastPayload(entityId: string): Record<string, unknown> {
  return {
    entity_id: entityId,
    identity: {
      one_line: "A careful witness.",
      public_face: "Composed.",
      private_pressure: "Afraid."
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
    sample_utterances: ["I heard it turn."],
    pressure_behavior_core: {
      cornered: "narrows choices",
      tempted_or_offered_power: "bargains",
      protecting_attachment: "deflects"
    },
    body_presence_core: {
      posture: "still",
      movement_style: "precise",
      tactile_details: "cold fingers",
      physicality: "still hands"
    },
    agency_core: {
      default_agency_level: "active",
      initiative_pattern: "waits for openings",
      constraint_response: "works around locks"
    },
    relationship_dynamics: ["guarded"],
    current_local_pressure: "Wants the door open.",
    continuity_notes: "Keeps track of exits.",
    status: "active"
  };
}
