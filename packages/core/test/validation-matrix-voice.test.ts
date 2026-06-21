import { describe, expect, it } from "vitest";

import {
  DIAGNOSTIC_CODES,
  buildValidationSnapshot,
  runValidation,
  type BuildValidationSnapshotInput,
  type ValidationRecord
} from "../src/index.js";

type ExpectedLocalMode = NonNullable<
  BuildValidationSnapshotInput["generationSession"]["generation_validation_focus"]
>["validation_focus_tags"]["expected_local_modes"][number];
type CastVoiceOverride = BuildValidationSnapshotInput["generationSession"]["cast_voice_overrides"][number];

const povId = "019b0298-5c00-7000-8000-000000000001";
const castA = "019b0298-5c00-7000-8000-000000000002";
const castB = "019b0298-5c00-7000-8000-000000000003";
const castC = "019b0298-5c00-7000-8000-000000000004";
const minorId = "019b0298-5c00-7000-8000-000000000005";
const secondMinorId = "019b0298-5c00-7000-8000-000000000015";
const entityId = "019b0298-5c00-7000-8000-000000000006";
const factId = "019b0298-5c00-7000-8000-000000000007";
const statusId = "019b0298-5c00-7000-8000-000000000008";
const relationshipId = "019b0298-5c00-7000-8000-000000000009";

describe("voice/dialogue/presence matrix validation", () => {
  it("stays silent when voice matrix tags are absent", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [];
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

  it("stays silent when voice focus containers are absent or malformed", () => {
    const absentFocus = cleanInput();
    delete absentFocus.generationSession.generation_validation_focus;
    removeRecord(absentFocus, castA);
    expect(blockerCodes(absentFocus)).not.toContain(DIAGNOSTIC_CODES.matrixDialogueIncomplete);

    const missingTags = cleanInput();
    missingTags.generationSession.generation_validation_focus = {} as never;
    removeRecord(missingTags, castA);
    expect(blockerCodes(missingTags)).not.toContain(DIAGNOSTIC_CODES.matrixDialogueIncomplete);

    const missingExpectedLane = cleanInput();
    missingExpectedLane.generationSession.generation_validation_focus = {
      validation_focus_tags: {
        generation_context: [],
        possible_durable_changes: []
      }
    } as never;
    removeRecord(missingExpectedLane, castA);
    expect(blockerCodes(missingExpectedLane)).not.toContain(DIAGNOSTIC_CODES.matrixDialogueIncomplete);
  });

  it.each([
    ["generation context", "generation_context"],
    ["expected local modes", "expected_local_modes"],
    ["possible durable changes", "possible_durable_changes"]
  ])("activates voice gates from %s focus tags", (_name, lane) => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags = {
      generation_context: [],
      expected_local_modes: [],
      possible_durable_changes: [],
      [lane]: ["dialogue_expected" as never]
    };
    removeRecord(input, castA);

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.matrixDialogueIncomplete);
  });

  it("handles missing active working set as incomplete tagged voice state", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      "active_silent_presence_expected",
      "present_minor_speech_possible"
    ];
    (input.generationSession as { active_working_set?: unknown }).active_working_set = undefined;

    expect(blockerCodes(input)).toEqual(
      expect.arrayContaining([
        DIAGNOSTIC_CODES.matrixActiveSilentPresenceIncomplete,
        DIAGNOSTIC_CODES.matrixPresentMinorSpeechIncomplete
      ])
    );
  });

  it("stays silent when all voice matrix tags are satisfied", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
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
        input.records = input.records.map((record) =>
      record.id === castB
            ? { ...record, payload: { ...(record.payload as Record<string, unknown>), voice_anchor: undefined } }
            : record
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
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      tag as ExpectedLocalMode
    ];
    mutate(input);

    expect(blockerCodes(input)).toContain(code);
  });

  it.each([
    ["there are no active speakers", (input: BuildValidationSnapshotInput) => setActiveCast(input, [
      { cast_member_id: castA, local_function: "active_silent" }
    ])],
    ["language output is blank", (input: BuildValidationSnapshotInput) => {
      input.storyConfig.proseMode!.language_output = " ";
    }],
    ["POV knowledge context is absent", (input: BuildValidationSnapshotInput) => {
      input.records = input.records.filter((record) => record.id !== factId);
    }],
    ["active speaker record is missing", (input: BuildValidationSnapshotInput) => removeRecord(input, castA)],
    ["active speaker record has wrong type", (input: BuildValidationSnapshotInput) => setRecord(input, castA, { type: "FACT" })],
    ["active speaker voice anchor is not an object", (input: BuildValidationSnapshotInput) => setRecordPayload(input, castA, { voice_anchor: "formal" })]
  ])("blocks dialogue when %s", (_name, mutate) => {
    expectMatrixBlock("dialogue_expected", DIAGNOSTIC_CODES.matrixDialogueIncomplete, mutate);
  });

  it.each([
    ["only two speakers are active", (input: BuildValidationSnapshotInput) => setActiveCast(input, [
      { cast_member_id: castA, local_function: "active_speaker" },
      { cast_member_id: castB, local_function: "pov_narrator" }
    ])],
    ["relationship and status context are absent", (input: BuildValidationSnapshotInput) => {
      input.records = input.records.filter((record) => record.id !== relationshipId && record.id !== statusId);
    }],
    ["current state is absent", (input: BuildValidationSnapshotInput) => {
      delete input.generationSession.current_authoritative_state;
    }],
    ["visibility is blank", (input: BuildValidationSnapshotInput) => {
      input.generationSession.current_authoritative_state!.line_of_sight_and_visibility = "";
    }],
    ["positions are absent", (input: BuildValidationSnapshotInput) => {
      input.generationSession.current_authoritative_state!.positions = [];
    }]
  ])("blocks ensemble dialogue when %s", (_name, mutate) => {
    setAllActiveSpeakersAndExpectBlock("ensemble_dialogue_expected", DIAGNOSTIC_CODES.matrixEnsembleDialogueIncomplete, mutate);
  });

  it.each([
    ["no active silent cast member is present", (input: BuildValidationSnapshotInput) => setActiveCast(input, [
      { cast_member_id: castA, local_function: "active_speaker" }
    ])],
    ["silent cast body presence is missing", (input: BuildValidationSnapshotInput) => {
      setRecordPayload(input, castC, { body_presence_core: undefined });
    }],
    ["silent pressure is blank", (input: BuildValidationSnapshotInput) => {
      setVoicePressure(input, castC, { nonverbal_or_silence_pressure: " " });
    }],
    ["current state is absent", (input: BuildValidationSnapshotInput) => {
      delete input.generationSession.current_authoritative_state;
    }],
    ["positions are empty", (input: BuildValidationSnapshotInput) => {
      input.generationSession.current_authoritative_state!.positions = [];
    }],
    ["visibility is empty", (input: BuildValidationSnapshotInput) => {
      input.generationSession.current_authoritative_state!.line_of_sight_and_visibility = "";
    }],
    ["current locks are empty", (input: BuildValidationSnapshotInput) => {
      input.generationSession.current_authoritative_state!.current_locks = [];
    }]
  ])("blocks active silent presence when %s", (_name, mutate) => {
    expectMatrixBlock("active_silent_presence_expected", DIAGNOSTIC_CODES.matrixActiveSilentPresenceIncomplete, mutate);
  });

  it.each([
    ["minor list is empty", (input: BuildValidationSnapshotInput) => {
      input.generationSession.active_working_set!.present_minor_cast_compressed = [];
    }],
    ["minor pressure has no dialogue guidance", (input: BuildValidationSnapshotInput) => {
      setVoicePressure(input, minorId, { dialogue_pressure: "", current_voice_pressure: "waits nearby" });
    }],
    ["minor override points at a different cast member", (input: BuildValidationSnapshotInput) => {
      input.generationSession.current_cast_voice_pressure = [];
      input.generationSession.cast_voice_overrides = [dialogueOverride(castA, "Minor may answer.")];
    }],
    ["minor override has the wrong target", (input: BuildValidationSnapshotInput) => {
      input.generationSession.current_cast_voice_pressure = [];
      input.generationSession.cast_voice_overrides = [{
        ...dialogueOverride(minorId, "Minor may answer."),
        applies_to: ["pov_narration"]
      }];
    }],
    ["minor override text is blank", (input: BuildValidationSnapshotInput) => {
      input.generationSession.current_cast_voice_pressure = [];
      input.generationSession.cast_voice_overrides = [dialogueOverride(minorId, " ")];
    }]
  ])("blocks present minor speech when %s", (_name, mutate) => {
    expectMatrixBlock("present_minor_speech_possible", DIAGNOSTIC_CODES.matrixPresentMinorSpeechIncomplete, mutate);
  });

  it.each([
    {
      tag: "dialogue_expected",
      code: DIAGNOSTIC_CODES.matrixDialogueIncomplete,
      mutate: (input: BuildValidationSnapshotInput) => {
        input.storyConfig.proseMode!.language_output = "";
      },
      expected: {
        affected: [{ field: "generationSession.active_working_set.active_onstage_cast_full" }],
        message: "Dialogue focus lacks active speaker voice anchors, language, knowledge, or relationship/status context.",
        whyItMatters: "Dialogue needs current speaker functions, durable voice anchors, and relationship/status context so active cast do not flatten into generic speech.",
        suggestedActions: ["add-voice-or-body-pressure", "add-knowledge-constraint"]
      }
    },
    {
      tag: "ensemble_dialogue_expected",
      code: DIAGNOSTIC_CODES.matrixEnsembleDialogueIncomplete,
      mutate: (input: BuildValidationSnapshotInput) => {
        setActiveCast(input, [
          { cast_member_id: castA, local_function: "active_speaker" },
          { cast_member_id: castB, local_function: "pov_narrator" }
        ]);
      },
      expected: {
        affected: [{ field: "generationSession.active_working_set.active_onstage_cast_full" }],
        message: "Ensemble dialogue focus lacks three anchored speakers or audibility/relationship context.",
        whyItMatters: "Three or more speakers need durable voice anchors plus clear interruptibility/audibility and relationship/status state.",
        suggestedActions: ["add-voice-or-body-pressure", "add-current-state"]
      }
    },
    {
      tag: "active_silent_presence_expected",
      code: DIAGNOSTIC_CODES.matrixActiveSilentPresenceIncomplete,
      mutate: (input: BuildValidationSnapshotInput) => {
        setVoicePressure(input, castC, { nonverbal_or_silence_pressure: "none" });
      },
      expected: {
        affected: [{ field: "generationSession.current_cast_voice_pressure" }],
        message: "Active silent presence focus lacks body dossier, position/visibility, silence pressure, or POV/action limits.",
        whyItMatters: "A silent onstage character still needs body presence and allowed nonverbal pressure to remain continuity-bearing.",
        suggestedActions: ["add-voice-or-body-pressure", "add-current-state"]
      }
    },
    {
      tag: "present_minor_speech_possible",
      code: DIAGNOSTIC_CODES.matrixPresentMinorSpeechIncomplete,
      mutate: (input: BuildValidationSnapshotInput) => {
        input.generationSession.current_cast_voice_pressure = input.generationSession.current_cast_voice_pressure.filter((entry) => entry.cast_member_id !== minorId);
      },
      expected: {
        affected: [{ field: "generationSession.active_working_set.present_minor_cast_compressed" }],
        message: "Present minor speech focus lacks deliverable dialogue guidance or active/onstage promotion.",
        whyItMatters: "A present minor cast member should not receive material speech unless the prompt carries compressed speech guidance, current dialogue pressure, or a dialogue-targeted current override.",
        suggestedActions: ["promote-cast", "add-voice-or-body-pressure"]
      }
    }
  ])("emits exact diagnostic contract for $tag", ({ tag, code, mutate, expected }) => {
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

  it("blocks ensemble dialogue when only some of three speakers have voice anchors", () => {
    expectMatrixBlock("ensemble_dialogue_expected", DIAGNOSTIC_CODES.matrixEnsembleDialogueIncomplete, (input) => {
      setActiveCast(input, [
        { cast_member_id: castA, local_function: "active_speaker" },
        { cast_member_id: castB, local_function: "pov_narrator" },
        { cast_member_id: castC, local_function: "active_speaker" }
      ]);
      setRecordPayload(input, castC, { voice_anchor: undefined });
    });
  });

  it("blocks active silent presence when only one of multiple silent cast members is complete", () => {
    expectMatrixBlock("active_silent_presence_expected", DIAGNOSTIC_CODES.matrixActiveSilentPresenceIncomplete, (input) => {
      input.records = [...input.records, castRecord(secondMinorId, entityId)];
      setActiveCast(input, [
        { cast_member_id: castC, local_function: "active_silent" },
        { cast_member_id: secondMinorId, local_function: "active_silent" }
      ]);
      input.generationSession.current_cast_voice_pressure = [
        pressure(castC, "C is watchful.", "none", "C grips the doorframe."),
        pressure(secondMinorId, "Second silent watches.", "none", "none")
      ];
    });
  });

  it("blocks present minor speech when only one compressed minor is promoted or guided", () => {
    expectMatrixBlock("present_minor_speech_possible", DIAGNOSTIC_CODES.matrixPresentMinorSpeechIncomplete, (input) => {
      input.generationSession.active_working_set!.present_minor_cast_compressed = [minorId, secondMinorId];
      input.generationSession.active_working_set!.active_onstage_cast_full.push({
        cast_member_id: minorId,
        local_function: "active_speaker"
      });
      input.generationSession.current_cast_voice_pressure = [];
    });
  });

  it.each([
    ["public fact", { type: "FACT", payload: { known_by: "public" } }],
    ["belief held by another entity", { type: "BELIEF", payload: { holder: entityId } }],
    ["secret held by another entity", { type: "SECRET", payload: { holders: [entityId] } }]
  ])("does not accept dialogue knowledge context from %s", (_label, knowledgeRecord) => {
    expectMatrixBlock("dialogue_expected", DIAGNOSTIC_CODES.matrixDialogueIncomplete, (input) => {
      input.records = input.records
        .filter((record) => record.id !== factId)
        .concat({ id: factId, type: knowledgeRecord.type, payload: { id: factId, ...knowledgeRecord.payload } });
    });
  });

  it("does not block dialogue when speakers have durable voice anchors but no local pressure pins", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = ["dialogue_expected"];
    input.generationSession.current_cast_voice_pressure = [];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.matrixDialogueIncomplete);
    expect(warningCodes(input)).toContain(DIAGNOSTIC_CODES.localVoicePressureMayHelp);
  });

  it("still blocks dialogue when an active speaker lacks a durable voice anchor", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = ["dialogue_expected"];
    input.records = input.records.map((record) =>
      record.id === castA
        ? { ...record, payload: { ...(record.payload as Record<string, unknown>), voice_anchor: undefined } }
        : record
    );

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.matrixDialogueIncomplete);
  });

  it("treats array cast payloads as missing voice and body dossiers", () => {
    const dialogueInput = cleanInput();
    dialogueInput.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = ["dialogue_expected"];
    dialogueInput.records = dialogueInput.records.map((record) =>
      record.id === castA ? { ...record, payload: [castA] } : record
    );
    expect(blockerCodes(dialogueInput)).toContain(DIAGNOSTIC_CODES.matrixDialogueIncomplete);

    const silentInput = cleanInput();
    silentInput.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      "active_silent_presence_expected"
    ];
    silentInput.records = silentInput.records.map((record) =>
      record.id === castC ? { ...record, payload: [castC] } : record
    );
    expect(blockerCodes(silentInput)).toContain(DIAGNOSTIC_CODES.matrixActiveSilentPresenceIncomplete);
  });

  it.each([
    ["belief known by POV", { type: "BELIEF", payload: { holder: povId } }],
    ["secret held by POV", { type: "SECRET", payload: { holders: [povId] } }]
  ])("accepts dialogue knowledge context from %s records", (_label, knowledgeRecord) => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = ["dialogue_expected"];
    input.records = input.records
      .filter((record) => record.id !== factId)
      .concat({ id: factId, type: knowledgeRecord.type, payload: { id: factId, ...knowledgeRecord.payload } });

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.matrixDialogueIncomplete);
  });

  it.each([
    ["FACT records without a known-by list", { type: "FACT", payload: { known_by: povId } }],
    ["BELIEF records without the POV holder", { type: "BELIEF", payload: { known_by: [povId] } }],
    ["SECRET records without a holders list", { type: "SECRET", payload: { holders: povId } }]
  ])("does not accept dialogue knowledge context from %s", (_label, knowledgeRecord) => {
    expectMatrixBlock("dialogue_expected", DIAGNOSTIC_CODES.matrixDialogueIncomplete, (input) => {
      input.records = input.records
        .filter((record) => record.id !== factId)
        .concat({ id: factId, type: knowledgeRecord.type, payload: { id: factId, ...knowledgeRecord.payload } });
    });
  });

  it("accepts dialogue when no specific POV constrains knowledge", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = ["dialogue_expected"];
    input.records = input.records.filter((record) => record.id !== factId);
    (input.storyConfig.proseMode as { pov_character?: unknown }).pov_character = undefined;

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.matrixDialogueIncomplete);
  });

  it("warns but does not block when ensemble voice pins are absent or repeated", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      "ensemble_dialogue_expected"
    ];
    input.generationSession.active_working_set!.active_onstage_cast_full = [
      { cast_member_id: castA, local_function: "active_speaker" },
      { cast_member_id: castB, local_function: "active_speaker" },
      { cast_member_id: castC, local_function: "active_speaker" }
    ];
    input.generationSession.current_cast_voice_pressure = input.generationSession.current_cast_voice_pressure.map((entry) =>
      [castA, castB].includes(entry.cast_member_id) ? { ...entry, current_voice_pressure: "same" } : entry
    );

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.matrixEnsembleDialogueIncomplete);
    expect(warningCodes(input)).toContain(DIAGNOSTIC_CODES.ensembleVoiceDistinctionRisk);
  });

  it("accepts present minor speech through dialogue overrides", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      "present_minor_speech_possible"
    ];
    input.generationSession.current_cast_voice_pressure = input.generationSession.current_cast_voice_pressure.filter((entry) => entry.cast_member_id !== minorId);
    input.generationSession.cast_voice_overrides = [
      {
        cast_member_id: minorId,
        reason: "Minor can answer one direct question.",
        applies_to: ["dialogue"],
        override_text: "Let the minor answer in one clipped factual line."
      }
    ];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.matrixPresentMinorSpeechIncomplete);
  });

  it("accepts present minor speech through all-prompted voice overrides", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      "present_minor_speech_possible"
    ];
    input.generationSession.current_cast_voice_pressure = [];
    input.generationSession.cast_voice_overrides = [{
      ...dialogueOverride(minorId, "Let the minor answer in one clipped factual line."),
      applies_to: ["all_prompted_voice"]
    }];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.matrixPresentMinorSpeechIncomplete);
  });

  it("accepts present minor speech when the minor is promoted onstage", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      "present_minor_speech_possible"
    ];
    input.generationSession.current_cast_voice_pressure = [];
    input.generationSession.active_working_set!.active_onstage_cast_full.push({
      cast_member_id: minorId,
      local_function: "active_speaker"
    });

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.matrixPresentMinorSpeechIncomplete);
  });

  it("accepts present minor speech when current pressure asks for a reply", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      "present_minor_speech_possible"
    ];
    input.generationSession.current_cast_voice_pressure = input.generationSession.current_cast_voice_pressure.map((entry) =>
      entry.cast_member_id === minorId
        ? { ...entry, dialogue_pressure: "", current_voice_pressure: "The minor replies once if questioned." }
        : entry
    );

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.matrixPresentMinorSpeechIncomplete);
  });

  it("does not require local silent pressure for speaking cast members", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      "active_silent_presence_expected"
    ];
    input.generationSession.active_working_set!.active_onstage_cast_full = [
      { cast_member_id: castA, local_function: "active_speaker" },
      { cast_member_id: castC, local_function: "active_silent" }
    ];
    input.generationSession.current_cast_voice_pressure = [
      pressure(castA, "A speaks.", "A answers.", "none"),
      pressure(castC, "C is watchful.", "none", "C grips the doorframe.")
    ];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.matrixActiveSilentPresenceIncomplete);
  });

  it("accepts active silent presence when state positions and locks are non-string values", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      "active_silent_presence_expected"
    ];
    input.generationSession.current_authoritative_state!.positions = { castC: "doorframe" } as never;
    input.generationSession.current_authoritative_state!.current_locks = { castC: "visible only" } as never;

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.matrixActiveSilentPresenceIncomplete);
  });

  it("does not treat pressure for absent minor IDs as present-minor speech guidance", () => {
    const input = cleanInput();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      "present_minor_speech_possible"
    ];
    input.generationSession.active_working_set!.present_minor_cast_compressed = [minorId];
    input.generationSession.current_cast_voice_pressure = [pressure(castA, "A says no.", "A answers.", "none")];

    expect(blockerCodes(input)).toContain(DIAGNOSTIC_CODES.matrixPresentMinorSpeechIncomplete);
  });
});

function blockerCodes(input: BuildValidationSnapshotInput): readonly string[] {
  return runValidation(buildValidationSnapshot(input)).blockers.map((diagnostic) => diagnostic.code);
}

function warningCodes(input: BuildValidationSnapshotInput): readonly string[] {
  return runValidation(buildValidationSnapshot(input)).warnings.map((diagnostic) => diagnostic.code);
}

function expectMatrixBlock(
  tag: ExpectedLocalMode,
  code: string,
  mutate: (input: BuildValidationSnapshotInput) => void
): void {
  const input = cleanInput();
  input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [tag];
  mutate(input);

  expect(blockerCodes(input), tag).toContain(code);
}

function setAllActiveSpeakersAndExpectBlock(
  tag: ExpectedLocalMode,
  code: string,
  mutate: (input: BuildValidationSnapshotInput) => void
): void {
  expectMatrixBlock(tag, code, (input) => {
    setActiveCast(input, [
      { cast_member_id: castA, local_function: "active_speaker" },
      { cast_member_id: castB, local_function: "pov_narrator" },
      { cast_member_id: castC, local_function: "active_speaker" }
    ]);
    mutate(input);
  });
}

function setActiveCast(
  input: BuildValidationSnapshotInput,
  activeCast: NonNullable<BuildValidationSnapshotInput["generationSession"]["active_working_set"]>["active_onstage_cast_full"]
): void {
  input.generationSession.active_working_set!.active_onstage_cast_full = activeCast;
}

function setRecordPayload(input: BuildValidationSnapshotInput, id: string, patch: Record<string, unknown>): void {
  input.records = input.records.map((record) =>
    record.id === id ? { ...record, payload: { ...(record.payload as Record<string, unknown>), ...patch } } : record
  );
}

function setRecord(
  input: BuildValidationSnapshotInput,
  id: string,
  patch: Partial<BuildValidationSnapshotInput["records"][number]>
): void {
  input.records = input.records.map((record) => record.id === id ? { ...record, ...patch } : record);
}

function removeRecord(input: BuildValidationSnapshotInput, id: string): void {
  input.records = input.records.filter((record) => record.id !== id);
}

function setVoicePressure(
  input: BuildValidationSnapshotInput,
  castMemberId: string,
  patch: Partial<ReturnType<typeof pressure>>
): void {
  input.generationSession.current_cast_voice_pressure = input.generationSession.current_cast_voice_pressure.map((entry) =>
    entry.cast_member_id === castMemberId ? { ...entry, ...patch } : entry
  );
}

function dialogueOverride(castMemberId: string, overrideText: string): CastVoiceOverride {
  return {
    cast_member_id: castMemberId,
    reason: "Minor can answer one direct question.",
    applies_to: ["dialogue"],
    override_text: overrideText
  };
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
        payload: { id: factId, known_by: [povId] }
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
        immediate_situation_summary: "A, B, and C are at the loading door while the key changes hands.",
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
        begin_after: "B noticing the key."
      },
      manual_moment_directive: {
        must_render: ["B asks for the key."],
        may_render_if_naturally_caused: [],
        do_not_force: []
      },
      current_cast_voice_pressure: [
        pressure(castA, "A is clipped.", "A asks directly.", "none"),
        pressure(castB, "B is evasive.", "B deflects.", "none"),
        pressure(castC, "C is watchful.", "none", "C grips the doorframe."),
        pressure(minorId, "Minor speaks in short factual fragments.", "one line only", "none")
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

function castRecord(id: string, entityIdValue: string): ValidationRecord {
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
  currentVoicePressure: string,
  dialoguePressure: string,
  silencePressure: string
) {
  return {
    cast_member_id: castMemberId,
    current_voice_pressure: currentVoicePressure,
    dialogue_pressure: dialoguePressure,
    pov_narration_pressure: "none",
    nonverbal_or_silence_pressure: silencePressure,
    current_must_preserve: [],
    current_must_avoid: []
  };
}
