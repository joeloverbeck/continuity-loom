import { describe, expect, it } from "vitest";

import {
  DIAGNOSTIC_CODES,
  buildValidationSnapshot,
  runValidation,
  type BuildValidationSnapshotInput,
  type ValidationRecord
} from "../src/index.js";
import { securityRules } from "../src/validation/rules/security.js";
import { warningRules } from "../src/validation/rules/warnings.js";

const keyLikeValue = "sk-or-v1-abcdefghijklmnopqrstuvwxyz123456";

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
