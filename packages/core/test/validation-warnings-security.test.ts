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
    [DIAGNOSTIC_CODES.promptLengthRisk, (input: BuildValidationSnapshotInput) => {
      input.records = [record("big", "FACT", { statement: "x".repeat(6000) })];
    }],
    [DIAGNOSTIC_CODES.manyHighSalienceRecords, (input: BuildValidationSnapshotInput) => {
      input.records = Array.from({ length: 7 }, (_, index) => record(`high-${index}`, "FACT", { salience: "critical" }));
    }],
    [DIAGNOSTIC_CODES.noSampleUtterances, (input: BuildValidationSnapshotInput) => {
      input.records = [record("cast", "CAST MEMBER", { voice_anchor: {}, identity: {} }, "active_onstage_cast_full")];
    }],
    [DIAGNOSTIC_CODES.sparseSettingTexture, (input: BuildValidationSnapshotInput) => {
      input.generationSession.current_authoritative_state = { environmental_conditions: "Bare." };
    }],
    [DIAGNOSTIC_CODES.noActiveClockPressure, (input: BuildValidationSnapshotInput) => {
      input.generationSession.manual_moment_directive = { must_render: ["Ask for the key."] };
    }],
    [DIAGNOSTIC_CODES.longDossierNeedsPin, (input: BuildValidationSnapshotInput) => {
      input.records = [record("cast", "CAST MEMBER", { biography: "x".repeat(1300) })];
    }],
    [DIAGNOSTIC_CODES.lowDramaScenePressure, (input: BuildValidationSnapshotInput) => {
      input.generationSession.manual_moment_directive = { must_render: ["Pause."] };
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

  it("blocks API-key-like prompt-facing text without echoing the matched key", () => {
    const input = baseInput();
    input.generationSession.manual_moment_directive = {
      must_render: [`Do not include ${keyLikeValue} in prose.`]
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
    versions: { template: "0.0.0", compiler: "0.0.0" }
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
