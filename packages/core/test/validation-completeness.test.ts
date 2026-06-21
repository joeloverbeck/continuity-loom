import { describe, expect, it } from "vitest";

import {
  DIAGNOSTIC_CODES,
  buildValidationSnapshot,
  runValidation,
  type BuildValidationSnapshotInput,
  type Diagnostic
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
        delete input.storyConfig.storyContract;
      }
    ],
    [
      "current state",
      DIAGNOSTIC_CODES.missingCurrentAuthoritativeState,
      (input: BuildValidationSnapshotInput) => {
        delete input.generationSession.current_authoritative_state;
      }
    ],
    [
      "manual directive",
      DIAGNOSTIC_CODES.missingManualDirective,
      (input: BuildValidationSnapshotInput) => {
        input.generationSession.manual_moment_directive = {
          must_render: [],
          may_render_if_naturally_caused: [],
          do_not_force: []
        };
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

  it.each([
    ["missing content policy", (input: BuildValidationSnapshotInput) => {
      delete input.storyConfig.universalContentPolicy;
    }, "storyConfig.universalContentPolicy"],
    ["blank content policy rating", (input: BuildValidationSnapshotInput) => {
      input.storyConfig.universalContentPolicy!.rating_label = "";
    }, "storyConfig.universalContentPolicy"],
    ["blank allowed scope", (input: BuildValidationSnapshotInput) => {
      input.storyConfig.universalContentPolicy!.allowed_content_scope = "";
    }, "storyConfig.universalContentPolicy"],
    ["blank tonal handling", (input: BuildValidationSnapshotInput) => {
      input.storyConfig.universalContentPolicy!.tonal_handling = "";
    }, "storyConfig.universalContentPolicy"],
    ["blank bias handling", (input: BuildValidationSnapshotInput) => {
      input.storyConfig.universalContentPolicy!.character_bias_handling = "";
    }, "storyConfig.universalContentPolicy"],
    ["missing prose mode", (input: BuildValidationSnapshotInput) => {
      delete input.storyConfig.proseMode;
    }, "storyConfig.proseMode"],
    ["blank prose mode POV", (input: BuildValidationSnapshotInput) => {
      input.storyConfig.proseMode!.pov_character = "";
    }, "storyConfig.proseMode"],
    ["blank language output", (input: BuildValidationSnapshotInput) => {
      input.storyConfig.proseMode!.language_output = "";
    }, "storyConfig.proseMode"]
  ])("blocks story configuration when %s", (_name, mutate, field) => {
    const input = cleanInput();
    mutate(input);

    const diagnostic = missingStoryConfigBlocker(input, field);

    expect(diagnostic?.severity).toBe("blocker");
    expect(diagnostic?.affected[0]?.field).toBe(field);
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
      ...input.generationSession.current_authoritative_state!,
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

  it("blocks continuation generation without a complete handoff", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.generation_context = [
      "continuation_after_accepted_segment"
    ];
    delete input.generationSession.immediate_handoff;

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.missingImmediateHandoff);
  });

  it.each([
    ["missing recent context", { recent_causal_context: "", last_visible_moment: "B saw the key.", begin_after: "" }],
    ["missing both launch anchors", { recent_causal_context: "A arrived with the key.", last_visible_moment: "", begin_after: "" }]
  ])("blocks continuation handoff with %s", (_name, handoff) => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.generation_context = [
      "continuation_after_accepted_segment"
    ];
    input.generationSession.immediate_handoff = handoff;

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.missingImmediateHandoff);
  });

  it.each([
    ["last visible moment", { recent_causal_context: "A arrived with the key.", last_visible_moment: "B saw the key.", begin_after: "" }],
    ["begin-after point", { recent_causal_context: "A arrived with the key.", last_visible_moment: "", begin_after: "B seeing the key." }]
  ])("allows continuation handoff with recent context plus %s", (_name, handoff) => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.generation_context = [
      "continuation_after_accepted_segment"
    ];
    input.generationSession.immediate_handoff = handoff;

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.missingImmediateHandoff);
  });

  it("flags only malformed multiple generation contexts", () => {
    const missingContextInput = cleanInput();
    delete missingContextInput.generationSession.generation_validation_focus;
    expect(blockerCodes(missingContextInput)).not.toContain(DIAGNOSTIC_CODES.focusTagCountInvalid);

    const malformedInput = cleanInput();
    malformedInput.generationSession.generation_validation_focus!.validation_focus_tags.generation_context = [
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

  it("names the specific active-secret field that is missing", () => {
    const input = cleanInput();
    input.records = [
      ...input.records,
      {
        id: secretId,
        type: "SECRET",
        payload: {
          id: secretId,
          status: "partially_revealed",
          holders: [povId],
          non_holders_to_protect: "none",
          forbidden_reveals: [],
          reveal_permission: "locked",
          allowed_surface_cues: ["A flinch at the old name."]
        }
      }
    ];
    selectRecord(input, secretId);

    const diagnostic = activeSecretBlocker(input);

    expect(diagnostic?.affected[0]?.field).toBe("forbidden_reveals");
    expect(diagnostic?.message).toContain("forbidden reveals");
    expect(diagnostic?.message).not.toContain("holders");
    expect(diagnostic?.message).not.toContain("protected non-holders");
    expect(diagnostic?.message).not.toContain("reveal permission");
    expect(diagnostic?.message).not.toContain("allowed surface cues");
  });

  it("does not block a fully populated active secret", () => {
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
          reveal_permission: "locked",
          allowed_surface_cues: ["A flinch at the old name."]
        }
      }
    ];
    selectRecord(input, secretId);

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.activeSecretIncomplete);
  });

  it("does not block resolved secrets with missing reveal-boundary fields", () => {
    const input = cleanInput();
    input.records = [
      ...input.records,
      {
        id: secretId,
        type: "SECRET",
        payload: {
          id: secretId,
          status: "resolved",
          holders: [],
          non_holders_to_protect: [],
          forbidden_reveals: [],
          reveal_permission: ""
        }
      }
    ];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.activeSecretIncomplete);
  });

  it("does not block an active secret with an affirmative no-forbidden-reveals sentinel", () => {
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
          forbidden_reveals: "none",
          reveal_permission: "natural_reveal_allowed",
          allowed_surface_cues: ["A flinch at the old name."]
        }
      }
    ];
    selectRecord(input, secretId);

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.activeSecretIncomplete);
  });

  it("lists every missing active-secret reveal-boundary field", () => {
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
          non_holders_to_protect: [],
          forbidden_reveals: [],
          reveal_permission: "",
          allowed_surface_cues: ["A flinch at the old name."]
        }
      }
    ];
    selectRecord(input, secretId);

    const diagnostic = activeSecretBlocker(input);

    expect(diagnostic?.affected[0]?.field).toBe("holders");
    expect(diagnostic?.message).toBe(
      "Active secret is missing: holders, protected non-holders, forbidden reveals, reveal permission."
    );
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

  it("does not require allowed cues without clue pressure", () => {
    const input = cleanInput();
    input.records = [
      ...input.records,
      {
        id: secretId,
        type: "SECRET",
        payload: {
          id: secretId,
          status: "partially_revealed",
          holders: [povId],
          non_holders_to_protect: [entityId],
          forbidden_reveals: ["Do not state the true name."],
          reveal_permission: "locked",
          allowed_surface_cues: []
        }
      }
    ];
    selectRecord(input, secretId);

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.activeSecretIncomplete);
  });

  it.each([
    ["public fact", (input: BuildValidationSnapshotInput) => {
      input.records = input.records.map((record) =>
        record.id === factId ? { ...record, payload: { id: factId, known_by: "public" } } : record
      );
    }],
    ["POV belief", (input: BuildValidationSnapshotInput) => {
      input.records = [
        ...input.records.filter((record) => record.id !== factId),
        { id: "belief", type: "BELIEF", payload: { holder: povId, claim: "The door is watched." } }
      ];
    }],
    ["POV secret holder", (input: BuildValidationSnapshotInput) => {
      input.records = [
        ...input.records.filter((record) => record.id !== factId),
        { id: "secret", type: "SECRET", payload: { status: "hidden", holders: [povId], non_holders_to_protect: [entityId], forbidden_reveals: ["x"], reveal_permission: "locked" } }
      ];
    }],
    ["POV entity status", (input: BuildValidationSnapshotInput) => {
      input.records = [
        ...input.records.filter((record) => record.id !== factId),
        { id: "status", type: "ENTITY STATUS", payload: { entity_id: povId, life: "alive", agency: "free", location: "warehouse" } }
      ];
    }]
  ])("accepts POV knowledge carried by %s", (_name, mutate) => {
    const input = cleanInput();
    mutate(input);

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.povKnowledgeMissing);
  });

  it("does not require POV knowledge for omniscient prose mode", () => {
    const input = cleanInput();
    input.records = input.records.filter((record) => record.id !== factId);
    input.generationSession.active_working_set!.selected_pov = "omniscient";
    input.storyConfig.proseMode!.pov_character = "omniscient";

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.povKnowledgeMissing);
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
    input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [
      "object_use_possible"
    ];
    input.generationSession.current_authoritative_state = {
      ...input.generationSession.current_authoritative_state!,
      possessions: []
    };

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.activePhysicalContextIncomplete);
  });

  it.each([
    "physical_interaction_expected",
  ] as const)("blocks active physical context for expected local mode %s", (tag) => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [tag];
    input.generationSession.current_authoritative_state = {
      ...input.generationSession.current_authoritative_state!,
      routes_and_exits: []
    };

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.activePhysicalContextIncomplete);
  });

  it.each([
    "object_transfer_possible",
    "location_change_possible",
    "restraint_or_coercion_possible",
    "intimacy_or_sex_possible",
    "violence_or_injury_possible"
  ] as const)("blocks active physical context for durable-change tag %s", (tag) => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [tag];
    input.generationSession.current_authoritative_state = {
      ...input.generationSession.current_authoritative_state!,
      routes_and_exits: []
    };

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.activePhysicalContextIncomplete);
  });

  it("does not require possessions for physical interaction when objects do not matter", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      "physical_interaction_expected"
    ];
    input.generationSession.current_authoritative_state = {
      ...input.generationSession.current_authoritative_state!,
      possessions: []
    };

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.activePhysicalContextIncomplete);
  });

  it("blocks active onstage cast missing core dossier or local function", () => {
    const input = cleanInput();
    input.records = input.records.map((record) =>
      record.id === castId
        ? (() => {
            const recordWithoutLocalFunction = { ...record };
            delete recordWithoutLocalFunction.localFunction;
            return {
              ...recordWithoutLocalFunction,
              payload: {
                entity_id: entityId,
                identity: { one_line: "A" }
              }
            };
          })()
        : record
    );

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.activeCastIncomplete);
  });

  it.each([
    ["identity", { identity: undefined }],
    ["voice", { voice_anchor: undefined }],
    ["pressure behavior", { pressure_behavior_core: undefined }],
    ["body presence", { body_presence_core: undefined }],
    ["agency", { agency_core: undefined }]
  ])("blocks active cast missing %s dossier", (_name, patch) => {
    const input = cleanInput();
    input.records = input.records.map((record) =>
      record.id === castId
        ? { ...record, payload: { ...fullCastPayload(entityId), ...patch } }
        : record
    );

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.activeCastIncomplete);
  });

  it("does not require a core cast dossier for active institutional cast records", () => {
    const input = cleanInput();
    input.records = input.records.map((record) => {
      if (record.id === entityId) {
        return { ...record, payload: { id: entityId, entity_kind: "institution" } };
      }
      if (record.id === castId) {
        return {
          ...record,
          payload: { entity_id: entityId }
        };
      }
      return record;
    });

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.activeCastIncomplete);
  });
});

function blockerCodes(input: BuildValidationSnapshotInput): readonly string[] {
  return runValidation(buildValidationSnapshot(input)).blockers.map((diagnostic) => diagnostic.code);
}

function activeSecretBlocker(input: BuildValidationSnapshotInput): Diagnostic | undefined {
  return runValidation(buildValidationSnapshot(input)).blockers.find(
    (diagnostic) => diagnostic.code === DIAGNOSTIC_CODES.activeSecretIncomplete
  );
}

function missingStoryConfigBlocker(input: BuildValidationSnapshotInput, field: string): Diagnostic | undefined {
  return runValidation(buildValidationSnapshot(input)).blockers.find(
    (diagnostic) => diagnostic.code === DIAGNOSTIC_CODES.missingStoryConfig && diagnostic.affected[0]?.field === field
  );
}

function selectRecord(input: BuildValidationSnapshotInput, recordId: string): void {
  input.generationSession.active_working_set!.selected_records.push(recordId);
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
