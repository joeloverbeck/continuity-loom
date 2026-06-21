import { describe, expect, it } from "vitest";

import {
  DIAGNOSTIC_CODES,
  buildValidationSnapshot,
  runValidation,
  type BuildValidationSnapshotInput,
  type ValidationRecord
} from "../src/index.js";
import { castBandRules } from "../src/validation/rules/cast-band.js";
import { securityRules } from "../src/validation/rules/security.js";
import { warningRules } from "../src/validation/rules/warnings.js";

const keyLikeValue = "sk-or-v1-abcdefghijklmnopqrstuvwxyz123456";
type CurrentAuthoritativeState = NonNullable<BuildValidationSnapshotInput["generationSession"]["current_authoritative_state"]>;
type ExpectedLocalMode = NonNullable<
  NonNullable<BuildValidationSnapshotInput["generationSession"]["generation_validation_focus"]>["validation_focus_tags"]
>["expected_local_modes"][number];

describe("warnings and security validation", () => {
  it.each([
    [DIAGNOSTIC_CODES.promptMiddleSalienceRisk, (input: BuildValidationSnapshotInput) => {
      input.records = [record("big", "FACT", { statement: "x".repeat(6000) })];
    }],
    [DIAGNOSTIC_CODES.manyHighSalienceRecords, (input: BuildValidationSnapshotInput) => {
      input.records = Array.from({ length: 7 }, (_, index) => record(`high-${index}`, "FACT", { salience: "critical" }));
    }],
    [DIAGNOSTIC_CODES.noSampleUtterances, (input: BuildValidationSnapshotInput) => {
      input.records = [record("cast", "CAST MEMBER", { voice_anchor: {}, identity: {} }, "active_onstage_cast_full")];
    }],
    [DIAGNOSTIC_CODES.sparseSettingTexture, (input: BuildValidationSnapshotInput) => {
      input.generationSession.current_authoritative_state = {
        ...input.generationSession.current_authoritative_state!,
        environmental_conditions: "Bare."
      };
    }],
    [DIAGNOSTIC_CODES.noActiveClockPressure, (input: BuildValidationSnapshotInput) => {
      input.generationSession.manual_moment_directive = manualDirective("Ask for the key.");
    }],
    [DIAGNOSTIC_CODES.localVoicePressureMayHelp, (input: BuildValidationSnapshotInput) => {
      input.records = [record("cast", "CAST MEMBER", { voice_anchor: {}, identity: {} }, "active_onstage_cast_full")];
      input.generationSession.active_working_set = {
        selected_records: ["cast"],
        active_onstage_cast_full: [{ cast_member_id: "cast", local_function: "active_speaker" }],
        present_minor_cast_compressed: [],
        offstage_relevant_cast: []
      };
      input.generationSession.generation_validation_focus = {
        validation_focus_tags: {
          generation_context: ["first_segment"],
          expected_local_modes: ["dialogue_expected"],
          possible_durable_changes: []
        }
      };
    }],
    [DIAGNOSTIC_CODES.ensembleVoiceDistinctionRisk, (input: BuildValidationSnapshotInput) => {
      input.records = [
        record("cast-a", "CAST MEMBER", { voice_anchor: {}, identity: {} }, "active_onstage_cast_full"),
        record("cast-b", "CAST MEMBER", { voice_anchor: {}, identity: {} }, "active_onstage_cast_full"),
        record("cast-c", "CAST MEMBER", { voice_anchor: {}, identity: {} }, "active_onstage_cast_full")
      ];
      input.generationSession.active_working_set = {
        selected_records: ["cast-a", "cast-b", "cast-c"],
        active_onstage_cast_full: [
          { cast_member_id: "cast-a", local_function: "active_speaker" },
          { cast_member_id: "cast-b", local_function: "active_speaker" },
          { cast_member_id: "cast-c", local_function: "active_speaker" }
        ],
        present_minor_cast_compressed: [],
        offstage_relevant_cast: []
      };
      input.generationSession.generation_validation_focus = {
        validation_focus_tags: {
          generation_context: ["first_segment"],
          expected_local_modes: ["ensemble_dialogue_expected"],
          possible_durable_changes: []
        }
      };
    }],
    [DIAGNOSTIC_CODES.castSalienceRisk, (input: BuildValidationSnapshotInput) => {
      input.records = [record("cast", "CAST MEMBER", { biography: "x".repeat(1300) })];
    }],
    [DIAGNOSTIC_CODES.lowDramaScenePressure, (input: BuildValidationSnapshotInput) => {
      input.generationSession.manual_moment_directive = manualDirective("Pause.");
    }],
    [DIAGNOSTIC_CODES.staleSelectedRecord, (input: BuildValidationSnapshotInput) => {
      input.records = [record("old", "EVENT", { status: "resolved" })];
    }]
  ])("emits non-blocking warning %s", (code, mutate) => {
    const input = baseInput();
    mutate(input);
    const result = runValidation(buildValidationSnapshot(input), warningRules);

    expect(result.warnings.map((warning) => warning.code)).toContain(code);
    expect(result.blockers).toEqual([]);
    expect(result.isBlocked).toBe(false);
    expect(result.warnings.every((warning) => warning.severity === "warning")).toBe(true);
  });

  it("blocks when the resolved POV id is not selected", () => {
    const input = baseInput();
    input.generationSession.active_working_set = {
      selected_records: [],
      active_onstage_cast_full: [],
      present_minor_cast_compressed: [],
      offstage_relevant_cast: [],
      selected_pov: "missing-pov"
    };
    input.storyConfig.proseMode = proseMode("variable");
    input.projectRecordIndex = {
      "missing-pov": "ENTITY"
    };

    const result = runValidation(buildValidationSnapshot(input), castBandRules);
    const blockers = result.blockers.filter((blocker) => blocker.code === DIAGNOSTIC_CODES.selectedPovReferenceInvalid);

    expect(blockers).toHaveLength(1);
    expect(blockers[0]?.severity).toBe("blocker");
    expect(blockers[0]?.message).toContain("missing-pov");
    expect(result.warnings).toEqual([]);
    expect(result.isBlocked).toBe(true);
  });

  it("does not block when the resolved POV is selected, literal, or undefined", () => {
    const selected = baseInput();
    selected.records = [record("pov", "ENTITY", { display_name: "Mara" })];
    selected.generationSession.active_working_set = {
      selected_records: ["pov"],
      active_onstage_cast_full: [],
      present_minor_cast_compressed: [],
      offstage_relevant_cast: [],
      selected_pov: "pov"
    };
    selected.storyConfig.proseMode = proseMode("variable");

    const omniscient = baseInput();
    omniscient.generationSession.active_working_set = {
      selected_records: [],
      active_onstage_cast_full: [],
      present_minor_cast_compressed: [],
      offstage_relevant_cast: [],
      selected_pov: "omniscient"
    };
    omniscient.storyConfig.proseMode = proseMode("omniscient");

    const variable = baseInput();
    variable.storyConfig.proseMode = proseMode("variable");
    variable.generationSession.active_working_set = {
      selected_records: [],
      active_onstage_cast_full: [],
      present_minor_cast_compressed: [],
      offstage_relevant_cast: [],
      selected_pov: "omniscient"
    };

    const undefinedPov = baseInput();

    for (const input of [selected, omniscient, variable, undefinedPov]) {
      const result = runValidation(buildValidationSnapshot(input), castBandRules);

      expect(result.blockers.map((blocker) => blocker.code)).not.toContain(DIAGNOSTIC_CODES.selectedPovReferenceInvalid);
    }
  });

  it("groups multiple long active cast dossier salience risks into one warning", () => {
    const input = baseInput();
    input.records = [
      record("cast-a", "CAST MEMBER", { biography: "x".repeat(1300) }, "active_onstage_cast_full"),
      record("cast-b", "CAST MEMBER", { biography: "y".repeat(1300) }, "active_onstage_cast_full")
    ];

    const result = runValidation(buildValidationSnapshot(input), warningRules);
    const salienceWarnings = result.warnings.filter((warning) => warning.code === DIAGNOSTIC_CODES.castSalienceRisk);

    expect(salienceWarnings).toHaveLength(1);
    expect(salienceWarnings[0]?.severity).toBe("warning");
    expect(result.blockers).toEqual([]);
    expect(result.isBlocked).toBe(false);
  });

  it("pins warning thresholds, affected fields, and message text for salience and setting risks", () => {
    const exactMiddleBoundary = baseInput();
    exactMiddleBoundary.records = [record("big", "FACT", { statement: "" })];
    exactMiddleBoundary.records = [
      record("big", "FACT", { statement: "x".repeat(5000 - promptSize(exactMiddleBoundary)) })
    ];
    expect(warningCodes(exactMiddleBoundary)).not.toContain(DIAGNOSTIC_CODES.promptMiddleSalienceRisk);

    const sixHigh = baseInput();
    sixHigh.records = Array.from({ length: 6 }, (_, index) =>
      record(`high-${index}`, "FACT", { statement: `High salience fact ${index}.`, salience: "critical" })
    );
    expect(warningCodes(sixHigh)).not.toContain(DIAGNOSTIC_CODES.manyHighSalienceRecords);

    const sevenHigh = baseInput();
    sevenHigh.records = Array.from({ length: 7 }, (_, index) =>
      record(`high-${index}`, "FACT", { statement: `High salience fact ${index}.` }, undefined, { salience: "high" })
    );
    expect(warningByCode(sevenHigh, DIAGNOSTIC_CODES.manyHighSalienceRecords)).toMatchObject({
      severity: "warning",
      message: "Many high-salience records are selected for one local unit.",
      affected: [{ field: "records" }]
    });

    const locationPresent = baseInput();
    locationPresent.records = [record("loc", "LOCATION", { name: "Warehouse" })];
    locationPresent.generationSession.current_authoritative_state = currentState({ environmental_conditions: "Bare." });
    expect(warningCodes(locationPresent)).not.toContain(DIAGNOSTIC_CODES.sparseSettingTexture);

    const shortEnvironment = baseInput();
    shortEnvironment.generationSession.current_authoritative_state = currentState({ environmental_conditions: "x".repeat(23) });
    expect(warningByCode(shortEnvironment, DIAGNOSTIC_CODES.sparseSettingTexture)).toMatchObject({
      message: "Setting texture is sparse for the current local unit.",
      affected: [{ field: "generationSession.current_authoritative_state.environmental_conditions" }]
    });

    const exactBoundary = baseInput();
    exactBoundary.generationSession.current_authoritative_state = currentState({ environmental_conditions: "x".repeat(24) });
    expect(warningCodes(exactBoundary)).not.toContain(DIAGNOSTIC_CODES.sparseSettingTexture);
  });

  it("pins active-cast sample utterance and local voice-pressure warning gates", () => {
    const activeWithoutSamples = baseInput();
    activeWithoutSamples.records = [record("cast", "CAST MEMBER", { voice_anchor: {}, identity: {} }, "active_onstage_cast_full")];
    expect(warningByCode(activeWithoutSamples, DIAGNOSTIC_CODES.noSampleUtterances)).toMatchObject({
      message: "Active cast has no sample utterances selected.",
      affected: [{ field: "CAST MEMBER.sample_utterances" }]
    });

    const presentMinorWithoutSamples = baseInput();
    presentMinorWithoutSamples.records = [record("cast", "CAST MEMBER", { voice_anchor: {}, identity: {} }, "present_minor_cast_compressed")];
    expect(warningCodes(presentMinorWithoutSamples)).not.toContain(DIAGNOSTIC_CODES.noSampleUtterances);

    const activeWithSamples = baseInput();
    activeWithSamples.records = [
      record("cast", "CAST MEMBER", { voice_anchor: {}, identity: {}, sample_utterances: ["Say it plainly."] }, "active_onstage_cast_full")
    ];
    expect(warningCodes(activeWithSamples)).not.toContain(DIAGNOSTIC_CODES.noSampleUtterances);

    const dialogueExpected = voiceInput(["dialogue_expected"]);
    dialogueExpected.generationSession.current_cast_voice_pressure = [];
    expect(warningByCode(dialogueExpected, DIAGNOSTIC_CODES.localVoicePressureMayHelp)).toMatchObject({
      message: "Dialogue is structurally ready, but local voice pressure may help keep active speakers salient.",
      affected: [{ field: "generationSession.current_cast_voice_pressure" }]
    });

    const noDialogueFocus = voiceInput([]);
    noDialogueFocus.generationSession.current_cast_voice_pressure = [];
    expect(warningCodes(noDialogueFocus)).not.toContain(DIAGNOSTIC_CODES.localVoicePressureMayHelp);

    const narratorFocus = voiceInput(["dialogue_expected"], ["cast-a"]);
    narratorFocus.generationSession.active_working_set = {
      selected_records: ["cast-a"],
      active_onstage_cast_full: [{ cast_member_id: "cast-a", local_function: "pov_narrator" }],
      present_minor_cast_compressed: [],
      offstage_relevant_cast: []
    };
    narratorFocus.generationSession.current_cast_voice_pressure = [];
    expect(warningCodes(narratorFocus)).toContain(DIAGNOSTIC_CODES.localVoicePressureMayHelp);

    const noVoiceAnchor = voiceInput(["dialogue_expected"], ["cast-a"]);
    noVoiceAnchor.records = [record("cast-a", "CAST MEMBER", { identity: {} }, "active_onstage_cast_full")];
    noVoiceAnchor.generationSession.current_cast_voice_pressure = [];
    expect(warningCodes(noVoiceAnchor)).not.toContain(DIAGNOSTIC_CODES.localVoicePressureMayHelp);

    const dialoguePressureOnly = voiceInput(["dialogue_expected"]);
    dialoguePressureOnly.generationSession.current_cast_voice_pressure = [
      castPressure("cast-a", "", "Pinned dialogue pressure.", "none"),
      castPressure("cast-b", "", "Pinned dialogue pressure.", "none"),
      castPressure("cast-c", "", "Pinned dialogue pressure.", "none")
    ];
    expect(warningCodes(dialoguePressureOnly)).not.toContain(DIAGNOSTIC_CODES.localVoicePressureMayHelp);
  });

  it("pins ensemble voice distinction gates and duplicate pressure normalization", () => {
    const twoSpeakers = voiceInput(["ensemble_dialogue_expected"], ["cast-a", "cast-b"]);
    twoSpeakers.generationSession.current_cast_voice_pressure = [];
    expect(warningCodes(twoSpeakers)).not.toContain(DIAGNOSTIC_CODES.ensembleVoiceDistinctionRisk);

    const missingPins = voiceInput(["ensemble_dialogue_expected"]);
    missingPins.generationSession.current_cast_voice_pressure = [
      castPressure("cast-a", "A is clipped.", "A asks.", "none"),
      castPressure("cast-b", "B is guarded.", "B answers.", "none")
    ];
    expect(warningByCode(missingPins, DIAGNOSTIC_CODES.ensembleVoiceDistinctionRisk)).toMatchObject({
      affected: [{ field: "generationSession.current_cast_voice_pressure" }]
    });

    const repeatedPins = voiceInput(["ensemble_dialogue_expected"]);
    repeatedPins.generationSession.current_cast_voice_pressure = [
      castPressure("cast-a", " Same ", "A asks.", "none"),
      castPressure("cast-b", "same", "B answers.", "none"),
      castPressure("cast-c", "Distinct", "C answers.", "none")
    ];
    expect(warningCodes(repeatedPins)).toContain(DIAGNOSTIC_CODES.ensembleVoiceDistinctionRisk);

    const distinctPins = voiceInput(["ensemble_dialogue_expected"]);
    distinctPins.generationSession.current_cast_voice_pressure = [
      castPressure("cast-a", "A is clipped.", "A asks.", "none"),
      castPressure("cast-b", "B is guarded.", "B answers.", "none"),
      castPressure("cast-c", "C is formal.", "C interrupts.", "none")
    ];
    expect(warningCodes(distinctPins)).not.toContain(DIAGNOSTIC_CODES.ensembleVoiceDistinctionRisk);
  });

  it("pins pressure-record suppressors and low-drama directive boundary", () => {
    const noPressure = baseInput();
    noPressure.generationSession.manual_moment_directive = manualDirective("Ask for the key.");
    expect(warningByCode(noPressure, DIAGNOSTIC_CODES.noActiveClockPressure)).toMatchObject({
      message: "Directive has local pressure but no active clock, obligation, or open thread selected.",
      affected: [{ field: "records" }]
    });

    for (const type of ["CLOCK", "OBLIGATION", "OPEN THREAD"]) {
      const input = baseInput();
      input.records = [record(type.toLowerCase(), type, { status: "active" })];
      input.generationSession.manual_moment_directive = manualDirective("Ask for the key.");
      expect(warningCodes(input), type).not.toContain(DIAGNOSTIC_CODES.noActiveClockPressure);
    }

    const emptyDirective = baseInput();
    emptyDirective.generationSession.manual_moment_directive = {
      must_render: [],
      may_render_if_naturally_caused: [],
      do_not_force: []
    };
    expect(warningCodes(emptyDirective)).not.toContain(DIAGNOSTIC_CODES.noActiveClockPressure);

    const lowDrama = baseInput();
    lowDrama.generationSession.manual_moment_directive = manualDirective("x".repeat(79));
    expect(warningByCode(lowDrama, DIAGNOSTIC_CODES.lowDramaScenePressure)).toMatchObject({
      message: "Low-drama scene may need sharper prose-craft pressure.",
      affected: [{ field: "generationSession.manual_moment_directive.must_render" }]
    });

    const boundary = baseInput();
    boundary.generationSession.manual_moment_directive = manualDirective("x".repeat(80));
    expect(warningCodes(boundary)).not.toContain(DIAGNOSTIC_CODES.lowDramaScenePressure);

    for (const type of ["SECRET", "RELATIONSHIP", "EMOTION"]) {
      const input = baseInput();
      input.records = [record(type.toLowerCase(), type, { status: "active" })];
      input.generationSession.manual_moment_directive = manualDirective("Pause.");
      expect(warningCodes(input), type).not.toContain(DIAGNOSTIC_CODES.lowDramaScenePressure);
    }
  });

  it("pins optional-reference warning classifiers and required-reference suppressors", () => {
    const offstageOptional = baseInput();
    offstageOptional.projectRecordIndex = { offstage: "ENTITY" };
    offstageOptional.generationSession.active_working_set = { selected_records: [], active_onstage_cast_full: [], present_minor_cast_compressed: [], offstage_relevant_cast: [] };
    offstageOptional.generationSession.current_authoritative_state = currentState({ offstage_pressuring_entities: ["offstage"] });
    expect(warningByCode(offstageOptional, DIAGNOSTIC_CODES.offstageEntityReferenceUnselectedOptional)).toMatchObject({
      message: "Offstage pressure reference offstage exists but is not selected, so it will not render unless selected into the active working set.",
      affected: [{ field: "generationSession.current_authoritative_state.offstage_pressuring_entities" }]
    });

    const offstageDangling = baseInput();
    offstageDangling.generationSession.current_authoritative_state = currentState({ offstage_pressuring_entities: ["missing"] });
    expect(warningCodes(offstageDangling)).not.toContain(DIAGNOSTIC_CODES.offstageEntityReferenceUnselectedOptional);

    const offstageWrongType = baseInput();
    offstageWrongType.projectRecordIndex = { fact: "FACT" };
    offstageWrongType.generationSession.active_working_set = { selected_records: [], active_onstage_cast_full: [], present_minor_cast_compressed: [], offstage_relevant_cast: [] };
    offstageWrongType.generationSession.current_authoritative_state = currentState({ offstage_pressuring_entities: ["fact"] });
    expect(warningCodes(offstageWrongType)).not.toContain(DIAGNOSTIC_CODES.offstageEntityReferenceUnselectedOptional);

    const offstageRequired = baseInput();
    offstageRequired.projectRecordIndex = { offstage: "ENTITY" };
    offstageRequired.generationSession.active_working_set = { selected_records: [], active_onstage_cast_full: [], present_minor_cast_compressed: [], offstage_relevant_cast: [] };
    offstageRequired.generationSession.generation_validation_focus = {
      validation_focus_tags: {
        generation_context: [],
        expected_local_modes: ["offstage_interruption_possible"],
        possible_durable_changes: []
      }
    };
    offstageRequired.generationSession.current_authoritative_state = currentState({ offstage_pressuring_entities: ["offstage"] });
    expect(warningCodes(offstageRequired)).not.toContain(DIAGNOSTIC_CODES.offstageEntityReferenceUnselectedOptional);

    const entityStatusOptional = baseInput();
    entityStatusOptional.projectRecordIndex = { status: "ENTITY STATUS" };
    entityStatusOptional.generationSession.active_working_set = { selected_records: [], active_onstage_cast_full: [], present_minor_cast_compressed: [], offstage_relevant_cast: [] };
    entityStatusOptional.generationSession.current_authoritative_state = currentState({ entity_statuses: ["status"] });
    expect(warningByCode(entityStatusOptional, DIAGNOSTIC_CODES.entityStatusesReferenceUnselectedOptional)).toMatchObject({
      affected: [{ field: "generationSession.current_authoritative_state.entity_statuses" }]
    });

    const entityStatusRequired = baseInput();
    entityStatusRequired.projectRecordIndex = { status: "ENTITY STATUS" };
    entityStatusRequired.generationSession.active_working_set = { selected_records: [], active_onstage_cast_full: [], present_minor_cast_compressed: [], offstage_relevant_cast: [] };
    entityStatusRequired.generationSession.generation_validation_focus = { validation_focus_tags: { generation_context: [], expected_local_modes: ["physical_interaction_expected"], possible_durable_changes: [] } };
    entityStatusRequired.generationSession.current_authoritative_state = currentState({ entity_statuses: ["status"] });
    expect(warningCodes(entityStatusRequired)).not.toContain(DIAGNOSTIC_CODES.entityStatusesReferenceUnselectedOptional);
  });

  it("pins orphaned voice pressure, cast salience, and stale-record warning details", () => {
    const orphan = baseInput();
    orphan.records = [record("cast", "CAST MEMBER", { voice_anchor: {}, identity: {} })];
    orphan.projectRecordIndex = { cast: "CAST MEMBER" };
    orphan.generationSession.current_cast_voice_pressure = [castPressure("cast", "Pin", "Line", "none")];
    expect(warningByCode(orphan, DIAGNOSTIC_CODES.voicePressureOrphanedAttachment)).toMatchObject({
      message: "Voice-pressure attachment cast resolves to a CAST MEMBER but is not attached to any rendered cast band.",
      affected: [{ field: "generationSession.current_cast_voice_pressure" }]
    });

    const overrideOrphan = baseInput();
    overrideOrphan.projectRecordIndex = { cast: "CAST MEMBER" };
    overrideOrphan.generationSession.cast_voice_overrides = [castOverride("cast")];
    expect(warningByCode(overrideOrphan, DIAGNOSTIC_CODES.voicePressureOrphanedAttachment)).toMatchObject({
      affected: [{ field: "generationSession.cast_voice_overrides" }]
    });

    const wrongTypeOverride = baseInput();
    wrongTypeOverride.projectRecordIndex = { fact: "FACT" };
    wrongTypeOverride.generationSession.cast_voice_overrides = [castOverride("fact")];
    expect(warningCodes(wrongTypeOverride)).not.toContain(DIAGNOSTIC_CODES.voicePressureOrphanedAttachment);

    const attachedCast = baseInput();
    attachedCast.records = [record("cast", "CAST MEMBER", { voice_anchor: {}, identity: {} }, "active_onstage_cast_full")];
    attachedCast.projectRecordIndex = { cast: "CAST MEMBER" };
    attachedCast.generationSession.active_working_set = {
      selected_records: ["cast"],
      active_onstage_cast_full: [{ cast_member_id: "cast", local_function: "active_speaker" }],
      present_minor_cast_compressed: [],
      offstage_relevant_cast: []
    };
    attachedCast.generationSession.current_cast_voice_pressure = [castPressure("cast", "Pin", "Line", "none")];
    expect(warningCodes(attachedCast)).not.toContain(DIAGNOSTIC_CODES.voicePressureOrphanedAttachment);

    const pinnedLongCast = baseInput();
    pinnedLongCast.records = [record("cast", "CAST MEMBER", { biography: "x".repeat(1300) })];
    pinnedLongCast.generationSession.current_cast_voice_pressure = [castPressure("cast", "Pin", "Line", "none")];
    expect(warningCodes(pinnedLongCast)).not.toContain(DIAGNOSTIC_CODES.castSalienceRisk);

    const labeledLongCast = baseInput();
    labeledLongCast.records = [
      record("cast", "CAST MEMBER", { biography: "x".repeat(1301) }, undefined, { displayLabel: "Mara Vale" })
    ];
    const salienceWarning = warningByCode(labeledLongCast, DIAGNOSTIC_CODES.castSalienceRisk);
    expect(salienceWarning.message).toContain("Mara Vale");
    expect(salienceWarning.message).not.toContain("record:cast");

    const longNonCast = baseInput();
    longNonCast.records = [record("fact", "FACT", { statement: "x".repeat(1300) })];
    expect(warningCodes(longNonCast)).not.toContain(DIAGNOSTIC_CODES.castSalienceRisk);

    const staleMetadata = baseInput();
    staleMetadata.records = [record("old", "EVENT", { status: "active" }, undefined, { status: "superseded" })];
    expect(warningByCode(staleMetadata, DIAGNOSTIC_CODES.staleSelectedRecord)).toMatchObject({
      message: "Selected record is old or resolved but may still be relevant.",
      affected: [{ field: "record:old" }]
    });

    const stalePayload = baseInput();
    stalePayload.records = [record("abandoned", "PLAN", { status: "abandoned" })];
    expect(warningByCode(stalePayload, DIAGNOSTIC_CODES.staleSelectedRecord)).toMatchObject({
      affected: [{ field: "record:abandoned" }]
    });
  });

  it("keeps warning diagnostics non-blocking with the shared warning payload", () => {
    const input = baseInput();
    input.generationSession.manual_moment_directive = manualDirective("Ask for the key.");

    const warning = warningByCode(input, DIAGNOSTIC_CODES.noActiveClockPressure);

    expect(warning).toMatchObject({
      severity: "warning",
      whyItMatters: "This warning helps improve curation without blocking generation.",
      suggestedActions: ["revise", "deselect"]
    });
  });

  it("blocks API-key-like prompt-facing text without echoing the matched key", () => {
    const input = baseInput();
    input.generationSession.manual_moment_directive = {
      must_render: [`Do not include ${keyLikeValue} in prose.`],
      may_render_if_naturally_caused: [],
      do_not_force: []
    };

    const result = runValidation(buildValidationSnapshot(input), securityRules);
    const serializedDiagnostics = JSON.stringify(result);

    expect(result.blockers).toHaveLength(1);
    expect(result.blockers[0]?.severity).toBe("blocker");
    expect(result.blockers[0]?.code).toBe(DIAGNOSTIC_CODES.apiKeyLikePromptFacingText);
    expect(result.isBlocked).toBe(true);
    expect(serializedDiagnostics).not.toContain(keyLikeValue);
  });
});

function baseInput(): BuildValidationSnapshotInput {
  return {
    records: [],
    generationSession: {
      current_cast_voice_pressure: [],
      cast_voice_overrides: []
    },
    storyConfig: {},
    versions: { template: "0.0.0", compiler: "0.0.0", contract: "1.0.0" }
  };
}

function manualDirective(mustRender: string) {
  return {
    must_render: [mustRender],
    may_render_if_naturally_caused: [],
    do_not_force: []
  };
}

function proseMode(pov_character: string): NonNullable<BuildValidationSnapshotInput["storyConfig"]["proseMode"]> {
  return {
    pov_character,
    person: "third",
    tense: "past",
    psychic_distance: "close",
    interiority_mode: "filtered",
    dialogue_density: "balanced",
    paragraphing: "mixed",
    language_output: "English",
    special_style_constraints: []
  };
}

function currentState(overrides: Partial<CurrentAuthoritativeState>): CurrentAuthoritativeState {
  return {
    current_time: "Night.",
    current_location: "Warehouse",
    onstage_entities: [],
    immediate_situation_summary: "The room is quiet.",
    offstage_pressuring_entities: [],
    positions: "Near the door.",
    possessions: "None.",
    visible_conditions: [],
    environmental_conditions: "Dry concrete, dust, and a low electric hum.",
    entity_statuses: [],
    line_of_sight_and_visibility: "Clear.",
    routes_and_exits: ["door"],
    available_time: "One exchange.",
    consent_or_force_conditions: "none",
    current_locks: [],
    ...overrides
  };
}

function record(
  id: string,
  type: string,
  payload: Record<string, unknown>,
  castBand?: ValidationRecord["castBand"],
  metadata?: Partial<NonNullable<ValidationRecord["metadata"]>>
): ValidationRecord {
  return {
    id,
    type,
    payload,
    ...(castBand ? { castBand } : {}),
    ...(metadata ? { metadata: { id, type, displayLabel: id, createdAt: "2026-06-21T00:00:00.000Z", updatedAt: "2026-06-21T00:00:00.000Z", archived: false, ...metadata } } : {})
  };
}

function warningCodes(input: BuildValidationSnapshotInput): string[] {
  return runValidation(buildValidationSnapshot(input), warningRules).warnings.map((warning) => warning.code);
}

function warningByCode(input: BuildValidationSnapshotInput, code: string) {
  const result = runValidation(buildValidationSnapshot(input), warningRules);
  const matches = result.warnings.filter((warning) => warning.code === code);

  expect(result.blockers).toEqual([]);
  expect(result.isBlocked).toBe(false);
  expect(matches, code).toHaveLength(1);
  expect(matches[0], code).toBeDefined();

  return matches[0]!;
}

function promptSize(input: BuildValidationSnapshotInput): number {
  return JSON.stringify({
    records: input.records,
    generationSession: input.generationSession,
    storyConfig: input.storyConfig,
    versions: input.versions
  }).length;
}

function voiceInput(focusTags: readonly ExpectedLocalMode[], castIds: readonly string[] = ["cast-a", "cast-b", "cast-c"]): BuildValidationSnapshotInput {
  const input = baseInput();
  input.records = castIds.map((id) => record(id, "CAST MEMBER", { voice_anchor: {}, identity: {} }, "active_onstage_cast_full"));
  input.generationSession.active_working_set = {
    selected_records: [...castIds],
    active_onstage_cast_full: castIds.map((id) => ({ cast_member_id: id, local_function: "active_speaker" })),
    present_minor_cast_compressed: [],
    offstage_relevant_cast: []
  };
  input.generationSession.current_cast_voice_pressure = castIds.map((id, index) =>
    castPressure(id, `Voice ${index}`, `Dialogue ${index}`, "none")
  );
  input.generationSession.generation_validation_focus = {
    validation_focus_tags: {
      generation_context: ["first_segment"],
      expected_local_modes: [...focusTags],
      possible_durable_changes: []
    }
  };
  return input;
}

function castPressure(castMemberId: string, currentVoicePressure: string, dialoguePressure: string, silencePressure: string) {
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

function castOverride(castMemberId: string) {
  return {
    cast_member_id: castMemberId,
    reason: "Temporary read.",
    applies_to: ["dialogue" as const],
    override_text: "Speak more sharply."
  };
}
