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
const nonPovId = "019b0298-5c00-7000-8000-000000000005";
const secretId = "019b0298-5c00-7000-8000-000000000006";
const beliefId = "019b0298-5c00-7000-8000-000000000007";
const emotionId = "019b0298-5c00-7000-8000-000000000008";
const planId = "019b0298-5c00-7000-8000-000000000009";
const statusId = "019b0298-5c00-7000-8000-000000000010";

describe("knowledge/secret/POV matrix validation", () => {
  it("stays silent when knowledge matrix tags are absent", () => {
    const input = cleanInput();
    input.records = input.records.filter((record) => !["BELIEF", "EMOTION", "SECRET", "PLAN"].includes(record.type));
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [];

    expect(blockerCodes(input)).not.toEqual(
      expect.arrayContaining([
        DIAGNOSTIC_CODES.matrixIntrospectionIncomplete,
        DIAGNOSTIC_CODES.matrixAmbiguousPerceptionIncomplete,
        DIAGNOSTIC_CODES.matrixSecretClueIncomplete,
        DIAGNOSTIC_CODES.matrixHiddenPlanIncomplete
      ])
    );
  });

  it("stays silent when all four knowledge matrix tags are satisfied", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      "introspection_expected",
      "ambiguous_perception_expected",
      "secret_or_clue_pressure",
      "non_pov_hidden_plan_behavior"
    ];

    expect(blockerCodes(input)).not.toEqual(
      expect.arrayContaining([
        DIAGNOSTIC_CODES.matrixIntrospectionIncomplete,
        DIAGNOSTIC_CODES.matrixAmbiguousPerceptionIncomplete,
        DIAGNOSTIC_CODES.matrixSecretClueIncomplete,
        DIAGNOSTIC_CODES.matrixHiddenPlanIncomplete
      ])
    );
  });

  it("accepts an affirmative no-forbidden-reveals sentinel under secret clue pressure", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      "secret_or_clue_pressure"
    ];
    input.records = input.records.map((record) =>
      record.id === secretId
        ? {
            ...record,
            payload: {
              id: secretId,
              status: "hidden",
              secret_claim: "The watcher is behind the glass.",
              holders: [nonPovId],
              non_holders_to_protect: [povId],
              pov_access: "can_suspect",
              audience_visibility: "ambiguous",
              allowed_surface_cues: ["A faint reflection."],
              forbidden_reveals: "none",
              reveal_permission: "clue_only"
            }
          }
        : record
    );

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.matrixSecretClueIncomplete);
  });

  it("still blocks a blank forbidden-reveals list under secret clue pressure", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      "secret_or_clue_pressure"
    ];
    input.records = input.records.map((record) =>
      record.id === secretId
        ? {
            ...record,
            payload: {
              id: secretId,
              status: "hidden",
              secret_claim: "The watcher is behind the glass.",
              holders: [nonPovId],
              non_holders_to_protect: [povId],
              pov_access: "can_suspect",
              audience_visibility: "ambiguous",
              allowed_surface_cues: ["A faint reflection."],
              forbidden_reveals: [],
              reveal_permission: "clue_only"
            }
          }
        : record
    );

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.matrixSecretClueIncomplete);
  });

  it.each([
    [
      "introspection_expected",
      DIAGNOSTIC_CODES.matrixIntrospectionIncomplete,
      (input: BuildValidationSnapshotInput) => {
        input.records = input.records.filter((record) => record.type !== "EMOTION");
      }
    ],
    [
      "ambiguous_perception_expected",
      DIAGNOSTIC_CODES.matrixAmbiguousPerceptionIncomplete,
      (input: BuildValidationSnapshotInput) => {
        input.generationSession.current_authoritative_state!.current_locks = ["No non-POV interiority leak."];
      }
    ],
    [
      "secret_or_clue_pressure",
      DIAGNOSTIC_CODES.matrixSecretClueIncomplete,
      (input: BuildValidationSnapshotInput) => {
        input.records = input.records.map((record) =>
          record.id === secretId
            ? {
                ...record,
                payload: {
                  id: secretId,
                  status: "hidden",
                  secret_claim: "The watcher is behind the glass.",
                  holders: [nonPovId],
                  non_holders_to_protect: [povId],
                  pov_access: "can_suspect",
                  audience_visibility: "ambiguous",
                  allowed_surface_cues: [],
                  forbidden_reveals: ["Do not name the watcher."],
                  reveal_permission: "clue_only"
                }
              }
            : record
        );
      }
    ],
    [
      "non_pov_hidden_plan_behavior",
      DIAGNOSTIC_CODES.matrixHiddenPlanIncomplete,
      (input: BuildValidationSnapshotInput) => {
        input.records = input.records.filter((record) => record.id !== statusId);
      }
    ]
  ])("blocks %s when required matrix state is missing", (tag, code, mutate) => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      tag as ExpectedLocalMode
    ];
    mutate(input);

    expect(blockerCodes(input)).toContain(code);
  });

  it.each([
    ["missing POV belief", "introspection_expected", DIAGNOSTIC_CODES.matrixIntrospectionIncomplete, (input: BuildValidationSnapshotInput) => setRecordPayload(input, beliefId, { holder: nonPovId })],
    ["blank POV belief claim", "introspection_expected", DIAGNOSTIC_CODES.matrixIntrospectionIncomplete, (input: BuildValidationSnapshotInput) => setRecordPayload(input, beliefId, { claim: "" })],
    ["missing POV emotion", "introspection_expected", DIAGNOSTIC_CODES.matrixIntrospectionIncomplete, (input: BuildValidationSnapshotInput) => setRecordPayload(input, emotionId, { holder: nonPovId })],
    ["blank emotion surface", "introspection_expected", DIAGNOSTIC_CODES.matrixIntrospectionIncomplete, (input: BuildValidationSnapshotInput) => setRecordPayload(input, emotionId, { surface_expression: "" })],
    ["missing prose mode", "introspection_expected", DIAGNOSTIC_CODES.matrixIntrospectionIncomplete, (input: BuildValidationSnapshotInput) => {
      delete input.storyConfig.proseMode;
    }],
    ["missing non-POV lock", "introspection_expected", DIAGNOSTIC_CODES.matrixIntrospectionIncomplete, (input: BuildValidationSnapshotInput) => removeLock(input, "non-pov interiority")]
  ])("blocks introspection when %s", (_name, tag, code, mutate) => {
    expectKnowledgeBlock(tag, code, mutate);
  });

  it.each([
    ["missing state", "ambiguous_perception_expected", DIAGNOSTIC_CODES.matrixAmbiguousPerceptionIncomplete, (input: BuildValidationSnapshotInput) => {
      delete input.generationSession.current_authoritative_state;
    }],
    ["blank line of sight", "ambiguous_perception_expected", DIAGNOSTIC_CODES.matrixAmbiguousPerceptionIncomplete, (input: BuildValidationSnapshotInput) => setStateField(input, "line_of_sight_and_visibility", "")],
    ["empty visible conditions", "ambiguous_perception_expected", DIAGNOSTIC_CODES.matrixAmbiguousPerceptionIncomplete, (input: BuildValidationSnapshotInput) => setStateField(input, "visible_conditions", [])],
    ["missing uncertainty lock", "ambiguous_perception_expected", DIAGNOSTIC_CODES.matrixAmbiguousPerceptionIncomplete, (input: BuildValidationSnapshotInput) => {
      input.generationSession.current_authoritative_state!.current_locks = ["No non-POV interiority leak."];
    }],
    ["secret already known by POV", "ambiguous_perception_expected", DIAGNOSTIC_CODES.matrixAmbiguousPerceptionIncomplete, (input: BuildValidationSnapshotInput) => {
      input.records = input.records.filter((record) => record.type !== "BELIEF");
      setRecordPayload(input, secretId, { pov_access: "knows" });
    }],
    ["secret lacks audience visibility", "ambiguous_perception_expected", DIAGNOSTIC_CODES.matrixAmbiguousPerceptionIncomplete, (input: BuildValidationSnapshotInput) => {
      input.records = input.records.filter((record) => record.type !== "BELIEF");
      setRecordPayload(input, secretId, { audience_visibility: "" });
    }]
  ])("blocks ambiguous perception when %s", (_name, tag, code, mutate) => {
    expectKnowledgeBlock(tag, code, mutate);
  });

  it.each([
    ["no active secret", "secret_or_clue_pressure", DIAGNOSTIC_CODES.matrixSecretClueIncomplete, (input: BuildValidationSnapshotInput) => setRecordPayload(input, secretId, { status: "resolved" })],
    ["partially revealed secret with blank claim", "secret_or_clue_pressure", DIAGNOSTIC_CODES.matrixSecretClueIncomplete, (input: BuildValidationSnapshotInput) => setRecordPayload(input, secretId, { status: "partially_revealed", secret_claim: "" })],
    ["missing holders", "secret_or_clue_pressure", DIAGNOSTIC_CODES.matrixSecretClueIncomplete, (input: BuildValidationSnapshotInput) => setRecordPayload(input, secretId, { holders: [] })],
    ["missing protected non-holders", "secret_or_clue_pressure", DIAGNOSTIC_CODES.matrixSecretClueIncomplete, (input: BuildValidationSnapshotInput) => setRecordPayload(input, secretId, { non_holders_to_protect: [] })],
    ["missing POV access", "secret_or_clue_pressure", DIAGNOSTIC_CODES.matrixSecretClueIncomplete, (input: BuildValidationSnapshotInput) => setRecordPayload(input, secretId, { pov_access: "" })],
    ["missing allowed cues", "secret_or_clue_pressure", DIAGNOSTIC_CODES.matrixSecretClueIncomplete, (input: BuildValidationSnapshotInput) => setRecordPayload(input, secretId, { allowed_surface_cues: [] })],
    ["missing reveal permission", "secret_or_clue_pressure", DIAGNOSTIC_CODES.matrixSecretClueIncomplete, (input: BuildValidationSnapshotInput) => setRecordPayload(input, secretId, { reveal_permission: "" })]
  ])("blocks secret pressure when %s", (_name, tag, code, mutate) => {
    expectKnowledgeBlock(tag, code, mutate);
  });

  it.each([
    ["plan belongs to POV", "non_pov_hidden_plan_behavior", DIAGNOSTIC_CODES.matrixHiddenPlanIncomplete, (input: BuildValidationSnapshotInput) => setRecordPayload(input, planId, { holder: povId })],
    ["plan holder blank", "non_pov_hidden_plan_behavior", DIAGNOSTIC_CODES.matrixHiddenPlanIncomplete, (input: BuildValidationSnapshotInput) => setRecordPayload(input, planId, { holder: "" })],
    ["plan visible to POV", "non_pov_hidden_plan_behavior", DIAGNOSTIC_CODES.matrixHiddenPlanIncomplete, (input: BuildValidationSnapshotInput) => setRecordPayload(input, planId, { visibility_to_pov: "known" })],
    ["plan current step blank", "non_pov_hidden_plan_behavior", DIAGNOSTIC_CODES.matrixHiddenPlanIncomplete, (input: BuildValidationSnapshotInput) => setRecordPayload(input, planId, { current_step: "" })],
    ["plan has no means", "non_pov_hidden_plan_behavior", DIAGNOSTIC_CODES.matrixHiddenPlanIncomplete, (input: BuildValidationSnapshotInput) => setRecordPayload(input, planId, { resources: [], blockers: [], fallback_steps: [] })],
    ["holder status unknown location", "non_pov_hidden_plan_behavior", DIAGNOSTIC_CODES.matrixHiddenPlanIncomplete, (input: BuildValidationSnapshotInput) => setRecordPayload(input, statusId, { location: "unknown" })],
    ["holder status not applicable location", "non_pov_hidden_plan_behavior", DIAGNOSTIC_CODES.matrixHiddenPlanIncomplete, (input: BuildValidationSnapshotInput) => setRecordPayload(input, statusId, { location: "not_applicable" })],
    ["status missing entity id", "non_pov_hidden_plan_behavior", DIAGNOSTIC_CODES.matrixHiddenPlanIncomplete, (input: BuildValidationSnapshotInput) => setRecordPayload(input, statusId, { entity_id: "" })],
    ["missing non-POV lock", "non_pov_hidden_plan_behavior", DIAGNOSTIC_CODES.matrixHiddenPlanIncomplete, (input: BuildValidationSnapshotInput) => removeLock(input, "non-pov interiority")]
  ])("blocks hidden-plan behavior when %s", (_name, tag, code, mutate) => {
    expectKnowledgeBlock(tag, code, mutate);
  });

  it.each([
    {
      name: "introspection",
      tag: "introspection_expected",
      code: DIAGNOSTIC_CODES.matrixIntrospectionIncomplete,
      mutate: (input: BuildValidationSnapshotInput) => {
        input.records = input.records.filter((record) => record.type !== "EMOTION");
      },
      expected: {
        affected: [{ field: "generationSession.generation_validation_focus.validation_focus_tags.expected_local_modes" }],
        message: "Introspection focus lacks POV belief, emotion pressure, prose-mode, or non-POV interiority constraints.",
        whyItMatters: "Introspection must be bounded by what the POV believes, feels, and is allowed to know without leaking non-POV interiority.",
        suggestedActions: ["add-knowledge-constraint", "add-current-state"]
      }
    },
    {
      name: "ambiguous perception",
      tag: "ambiguous_perception_expected",
      code: DIAGNOSTIC_CODES.matrixAmbiguousPerceptionIncomplete,
      mutate: (input: BuildValidationSnapshotInput) => {
        input.generationSession.current_authoritative_state!.line_of_sight_and_visibility = "";
      },
      expected: {
        affected: [{ field: "generationSession.current_authoritative_state" }],
        message: "Ambiguous perception focus lacks line-of-sight, uncertainty, POV perception limits, or audience/writer knowledge difference.",
        whyItMatters: "Ambiguous perception must identify what can be perceived, what cannot, and where the audience or writer may know more than the POV.",
        suggestedActions: ["add-current-state", "add-knowledge-constraint"]
      }
    },
    {
      name: "secret or clue pressure",
      tag: "secret_or_clue_pressure",
      code: DIAGNOSTIC_CODES.matrixSecretClueIncomplete,
      mutate: (input: BuildValidationSnapshotInput) => {
        setRecordPayload(input, secretId, { reveal_permission: "" });
      },
      expected: {
        affected: [{ field: "SECRET" }],
        message: "Secret or clue pressure focus lacks a complete active secret/reveal lane.",
        whyItMatters: "Secret pressure needs claim, holders, protected non-holders, POV access, audience visibility, allowed clues, forbidden reveals, and reveal permission.",
        suggestedActions: ["add-knowledge-constraint", "add-reveal-permission"]
      }
    },
    {
      name: "hidden non-POV plan",
      tag: "non_pov_hidden_plan_behavior",
      code: DIAGNOSTIC_CODES.matrixHiddenPlanIncomplete,
      mutate: (input: BuildValidationSnapshotInput) => {
        setRecordPayload(input, planId, { current_step: "" });
      },
      expected: {
        affected: [{ field: "PLAN" }],
        message: "Non-POV hidden plan focus lacks holder status, means, current step, POV visibility, or non-interiority constraint.",
        whyItMatters: "A hidden non-POV plan can shape behavior only through deterministic external cues, not leaked interiority.",
        suggestedActions: ["add-knowledge-constraint", "add-current-state"]
      }
    }
  ])("emits exact diagnostic contract for $name", ({ tag, code, mutate, expected }) => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      tag as ExpectedLocalMode
    ];
    mutate(input);

    const diagnostic = runValidation(buildValidationSnapshot(input)).blockers.find((item) => item.code === code);

    expect(diagnostic).toEqual({
      severity: "blocker",
      code,
      ...expected
    });
  });

  it.each([
    ["POV cannot perceive", "POV cannot perceive the figure behind the glass."],
    ["misread", "A may misread the reflection."],
    ["uncertain", "The reflection is uncertain."]
  ])("accepts ambiguous perception boundary from %s lock", (_name, lock) => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      "ambiguous_perception_expected"
    ];
    input.generationSession.current_authoritative_state!.current_locks = [lock, "No non-POV interiority leak."];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.matrixAmbiguousPerceptionIncomplete);
  });

  it.each([
    ["secret audience visibility only", (input: BuildValidationSnapshotInput) => {
      input.records = input.records.filter((record) => record.type !== "BELIEF");
    }],
    ["belief truth relation only", (input: BuildValidationSnapshotInput) => {
      input.records = input.records.filter((record) => record.type !== "SECRET");
    }]
  ])("accepts ambiguous perception knowledge difference from %s", (_name, mutate) => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      "ambiguous_perception_expected"
    ];
    mutate(input);

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.matrixAmbiguousPerceptionIncomplete);
  });

  it.each([
    ["resources", { resources: ["reflection"], blockers: [], fallback_steps: [] }],
    ["blockers", { resources: [], blockers: ["must wait for the door"], fallback_steps: [] }],
    ["fallback steps", { resources: [], blockers: [], fallback_steps: ["signal later"] }]
  ])("accepts hidden non-POV plan means from %s", (_name, patch) => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      "non_pov_hidden_plan_behavior"
    ];
    setRecordPayload(input, planId, patch);

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.matrixHiddenPlanIncomplete);
  });
});

function blockerCodes(input: BuildValidationSnapshotInput): readonly string[] {
  return runValidation(buildValidationSnapshot(input)).blockers.map((diagnostic) => diagnostic.code);
}

function expectKnowledgeBlock(
  tag: string,
  code: string,
  mutate: (input: BuildValidationSnapshotInput) => void
): void {
  const input = cleanInput();
  input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
    tag as ExpectedLocalMode
  ];
  mutate(input);

  expect(blockerCodes(input), tag).toContain(code);
}

function setRecordPayload(input: BuildValidationSnapshotInput, id: string, patch: Record<string, unknown>): void {
  input.records = input.records.map((record) =>
    record.id === id ? { ...record, payload: { ...(record.payload as Record<string, unknown>), ...patch } } : record
  );
}

function setStateField(
  input: BuildValidationSnapshotInput,
  field: keyof NonNullable<BuildValidationSnapshotInput["generationSession"]["current_authoritative_state"]>,
  value: unknown
): void {
  input.generationSession.current_authoritative_state = {
    ...input.generationSession.current_authoritative_state!,
    [field]: value
  };
}

function removeLock(input: BuildValidationSnapshotInput, marker: string): void {
  input.generationSession.current_authoritative_state!.current_locks = input.generationSession.current_authoritative_state!.current_locks.filter(
    (lock) => !lock.toLowerCase().includes(marker)
  );
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
        id: nonPovId,
        type: "ENTITY",
        payload: { id: nonPovId, entity_kind: "person" }
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
        payload: { id: factId, known_by: [povId] }
      },
      {
        id: beliefId,
        type: "BELIEF",
        payload: {
          id: beliefId,
          status: "active",
          holder: povId,
          claim: "The doorway may be watched.",
          truth_relation: "unknown"
        }
      },
      {
        id: emotionId,
        type: "EMOTION",
        payload: {
          id: emotionId,
          status: "active",
          holder: povId,
          surface_expression: "A keeps glancing at the door."
        }
      },
      {
        id: secretId,
        type: "SECRET",
        payload: {
          id: secretId,
          status: "hidden",
          secret_claim: "The watcher is behind the glass.",
          holders: [nonPovId],
          non_holders_to_protect: [povId],
          pov_access: "can_suspect",
          audience_visibility: "ambiguous",
          allowed_surface_cues: ["A faint reflection."],
          forbidden_reveals: ["Do not name the watcher."],
          reveal_permission: "clue_only"
        }
      },
      {
        id: statusId,
        type: "ENTITY STATUS",
        payload: {
          entity_id: nonPovId,
          life: "alive",
          agency: "free",
          location: "019b0298-5c00-7000-8000-000000000111"
        }
      },
      {
        id: planId,
        type: "PLAN",
        payload: {
          id: planId,
          plan_status: "active",
          holder: nonPovId,
          current_step: "Signal through the reflection.",
          visibility_to_pov: "hidden",
          resources: ["reflection"],
          blockers: ["must not reveal intent"],
          fallback_steps: []
        }
      }
    ],
    generationSession: {
      active_working_set: {
        selected_records: [castId, factId, beliefId, emotionId, secretId, planId],
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
        offstage_pressuring_entities: [nonPovId],
        positions: "A and B stand near the loading door.",
        possessions: "The key is in A's hand.",
        visible_conditions: ["dim", "reflection in glass"],
        environmental_conditions: "Rain outside.",
        entity_statuses: "A is awake.",
        line_of_sight_and_visibility: "A can see the glass but not behind it.",
        routes_and_exits: ["loading door"],
        available_time: "A few seconds.",
        consent_or_force_conditions: "none",
        current_locks: [
          "POV cannot perceive behind the glass and may misread the reflection.",
          "No non-POV interiority leak."
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
