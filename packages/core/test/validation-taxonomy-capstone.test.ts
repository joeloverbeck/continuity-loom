import { describe, expect, it } from "vitest";

import {
  DIAGNOSTIC_CODES,
  buildValidationSnapshot,
  compilePrompt,
  demoGenerationSession,
  demoRecords,
  demoStoryConfig,
  deriveGenerationContextDefault,
  runValidation,
  type BuildValidationSnapshotInput
} from "../src/index.js";

describe("validation taxonomy capstone", () => {
  it("allows a first segment with minimum current state, blank stop guidance, and no handoff", () => {
    const input = demoInput();
    input.generationSession.current_authoritative_state = minimumCurrentState();
    input.generationSession.immediate_handoff = undefined;
    input.generationSession.stop_guidance = { soft_unit_guidance: "" };
    input.generationSession.generation_validation_focus!.validation_focus_tags.generation_context = ["first_segment"];
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [];
    input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [];

    const result = runValidation(buildValidationSnapshot(input));

    expect(result.blockers).toEqual([]);
    expect(result.isBlocked).toBe(false);
  });

  it("keeps the required blockers after the taxonomy correction", () => {
    const continuation = demoInput();
    continuation.generationSession.immediate_handoff = undefined;
    continuation.generationSession.generation_validation_focus!.validation_focus_tags.generation_context = [
      "continuation_after_accepted_segment"
    ];
    expect(blockerCodes(continuation)).toContain(DIAGNOSTIC_CODES.missingImmediateHandoff);

    const missingDirective = demoInput();
    missingDirective.generationSession.manual_moment_directive = { must_render: [] };
    expect(blockerCodes(missingDirective)).toContain(DIAGNOSTIC_CODES.missingManualDirective);

    const nonlocalStop = demoInput();
    nonlocalStop.generationSession.stop_guidance = {
      soft_unit_guidance: "Write the whole chapter and downstream consequence summary."
    };
    expect(blockerCodes(nonlocalStop)).toContain(DIAGNOSTIC_CODES.localProseScopeViolation);
  });

  it("defaults generation context from accepted segment count and flags only malformed context", () => {
    expect(deriveGenerationContextDefault(0)).toBe("first_segment");
    expect(deriveGenerationContextDefault(1)).toBe("continuation_after_accepted_segment");

    const missingContext = demoInput();
    missingContext.generationSession.generation_validation_focus = undefined;
    expect(blockerCodes(missingContext)).not.toContain(DIAGNOSTIC_CODES.focusTagCountInvalid);

    const malformedContext = demoInput();
    malformedContext.generationSession.generation_validation_focus!.validation_focus_tags.generation_context = [
      "first_segment",
      "continuation_after_accepted_segment"
    ];
    expect(blockerCodes(malformedContext)).toContain(DIAGNOSTIC_CODES.focusTagCountInvalid);
  });

  it("treats missing voice pins and salience risks as warnings, not blockers", () => {
    const input = demoInput();
    input.generationSession.current_cast_voice_pressure = [];
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      "dialogue_expected"
    ];
    input.records = [
      ...input.records,
      {
        id: "019b0298-5c00-7000-8000-099999999001",
        type: "CAST MEMBER",
        payload: { biography: "x".repeat(1300) },
        metadata: { displayLabel: "Long dossier cast" }
      }
    ];

    const result = runValidation(buildValidationSnapshot(input));
    const warningCodes = result.warnings.map((warning) => warning.code);

    expect(result.blockers.map((blocker) => blocker.code)).not.toContain(DIAGNOSTIC_CODES.matrixDialogueIncomplete);
    expect(warningCodes).toContain(DIAGNOSTIC_CODES.localVoicePressureMayHelp);
    expect(warningCodes).toContain(DIAGNOSTIC_CODES.castSalienceRisk);
    expect(result.isBlocked).toBe(false);
  });

  it("does not activate physical blockers from selected object records alone", () => {
    const input = demoInput();
    input.generationSession.current_authoritative_state = minimumCurrentState();
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [];
    input.generationSession.generation_validation_focus!.validation_focus_tags.possible_durable_changes = [];

    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.activePhysicalContextIncomplete);
    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.matrixObjectUseIncomplete);
    expect(blockerCodes(input)).not.toContain(DIAGNOSTIC_CODES.matrixObjectTransferIncomplete);
  });

  it("keeps warning diagnostics out of the compiled prompt", () => {
    const input = demoInput();
    input.generationSession.current_cast_voice_pressure = [];
    input.generationSession.generation_validation_focus!.validation_focus_tags.expected_local_modes = [
      "dialogue_expected"
    ];
    const snapshot = buildValidationSnapshot(input);
    const validation = runValidation(snapshot);
    const prompt = compilePrompt(snapshot).prompt;

    expect(validation.warnings.length).toBeGreaterThan(0);
    for (const warning of validation.warnings) {
      expect(prompt).not.toContain(warning.code);
      expect(prompt).not.toContain(warning.message);
    }
  });
});

function demoInput(): BuildValidationSnapshotInput {
  return {
    records: structuredClone(demoRecords),
    generationSession: structuredClone(demoGenerationSession),
    storyConfig: structuredClone(demoStoryConfig),
    versions: { template: "1.0.0", compiler: "1.1.0", contract: "1.1.0" }
  };
}

function minimumCurrentState() {
  return {
    current_time: demoGenerationSession.current_authoritative_state.current_time,
    current_location: demoGenerationSession.current_authoritative_state.current_location,
    onstage_entities: demoGenerationSession.current_authoritative_state.onstage_entities,
    immediate_situation_summary: demoGenerationSession.current_authoritative_state.immediate_situation_summary,
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
}

function blockerCodes(input: BuildValidationSnapshotInput): readonly string[] {
  return runValidation(buildValidationSnapshot(input)).blockers.map((blocker) => blocker.code);
}
