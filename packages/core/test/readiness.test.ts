import { describe, expect, it } from "vitest";

import {
  DIAGNOSTIC_CODES,
  deriveReadiness,
  type Diagnostic,
  type ValidationResult
} from "../src/index.js";

describe("deriveReadiness", () => {
  it("is deterministic for identical validation, provider, draft, and label inputs", () => {
    const validation = validationResult({
      blockers: [diagnostic("blocker", DIAGNOSTIC_CODES.missingManualDirective, "generationSession.manual_moment_directive.must_render")],
      warnings: [diagnostic("warning", DIAGNOSTIC_CODES.castSalienceRisk, "CAST MEMBER", "cast-a")]
    });
    const labels = new Map([["cast-a", "Mara Vale"]]);

    expect(deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, labels)).toEqual(
      deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, labels)
    );
  });

  it.each([
    [DIAGNOSTIC_CODES.missingManualDirective, "missing-launch-directive"],
    [DIAGNOSTIC_CODES.missingImmediateHandoff, "missing-continuation-handoff"],
    [DIAGNOSTIC_CODES.localProseScopeViolation, "stop-guidance-nonlocal"],
    [DIAGNOSTIC_CODES.castSalienceRisk, "cast-salience-risk"]
  ])("keeps %s as technical legacy code while exposing author-facing code %s", (legacyCode, readinessCode) => {
    const severity = legacyCode === DIAGNOSTIC_CODES.castSalienceRisk ? "warning" : "blocker";
    const validation = validationResult({
      blockers: severity === "blocker" ? [diagnostic(severity, legacyCode, fieldFor(legacyCode))] : [],
      warnings: severity === "warning" ? [diagnostic(severity, legacyCode, "CAST MEMBER", "cast-a")] : []
    });

    const readiness = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map([["cast-a", "Mara Vale"]]));
    const derived = [...readiness.blockers, ...readiness.warnings][0];

    expect(derived?.code).toBe(readinessCode);
    expect(derived?.technical.legacyCode).toBe(legacyCode);
    expect(derived?.technical.ruleId).toBe(legacyCode);
  });

  it("does not let warnings gate save, preview, or generate", () => {
    const validation = validationResult({
      warnings: [diagnostic("warning", DIAGNOSTIC_CODES.castSalienceRisk, "CAST MEMBER", "cast-a")]
    });

    const readiness = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map([["cast-a", "Mara Vale"]]));

    expect(readiness.status).toBe("ready-with-warnings");
    expect(readiness.canSaveDraft).toBe(true);
    expect(readiness.canPreview).toBe(true);
    expect(readiness.canGenerate).toBe(true);
  });

  it("blocks preview and generate for validation blockers while save remains available", () => {
    const validation = validationResult({
      blockers: [diagnostic("blocker", DIAGNOSTIC_CODES.missingManualDirective, "generationSession.manual_moment_directive.must_render")]
    });

    const readiness = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map());

    expect(readiness.status).toBe("blocked");
    expect(readiness.canSaveDraft).toBe(true);
    expect(readiness.canPreview).toBe(false);
    expect(readiness.canGenerate).toBe(false);
  });

  it("uses current-state blocker copy while preserving the dynamic missing-field summary", () => {
    const validation = validationResult({
      blockers: [
        {
          ...diagnostic("blocker", DIAGNOSTIC_CODES.missingCurrentAuthoritativeState, "generationSession.current_authoritative_state"),
          message: "Current authoritative state is missing: current location, onstage entities, immediate situation summary."
        }
      ]
    });

    const readiness = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map());

    expect(readiness.blockers[0]).toMatchObject({
      code: "missing-current-state",
      title: "Complete the current state",
      group: "required-before-prompt-generation",
      summary: "Current authoritative state is missing: current location, onstage entities, immediate situation summary.",
      fastestFix: "In CURRENT AUTHORITATIVE STATE, fill current_time, current_location, onstage_entities, and immediate_situation_summary."
    });
  });

  it("uses provider configuration only for generate gating", () => {
    const readiness = deriveReadiness(validationResult({}), { configured: false }, { hasUnsavedChanges: false }, new Map());

    expect(readiness.canPreview).toBe(true);
    expect(readiness.canGenerate).toBe(false);
    expect(readiness.provider.configured).toBe(false);
    expect(readiness.provider.blockers[0]?.affected[0]?.kind).toBe("provider-setting");
  });

  it("routes fallback blockers to required readiness items", () => {
    const validation = validationResult({
      blockers: [diagnostic("blocker", "new-validator-code", "versions")]
    });

    const readiness = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map());

    expect(readiness.blockers[0]).toMatchObject({
      code: "new-validator-code",
      title: "New Validator Code",
      group: "required-before-prompt-generation",
      technical: {
        legacyCode: "new-validator-code",
        rawPaths: ["versions"]
      }
    });
  });

  it("routes fallback warnings to recommended readiness items", () => {
    const validation = validationResult({
      warnings: [diagnostic("warning", "new-warning-code", "versions")]
    });

    const readiness = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map());

    expect(readiness.warnings[0]).toMatchObject({
      code: "new-warning-code",
      title: "New Warning Code",
      group: "recommended-for-stronger-output"
    });
  });

  it("enriches affected records with injected display labels and groups salience warnings", () => {
    const validation = validationResult({
      warnings: [
        diagnostic("warning", DIAGNOSTIC_CODES.castSalienceRisk, "CAST MEMBER", "cast-a"),
        diagnostic("warning", DIAGNOSTIC_CODES.castSalienceRisk, "CAST MEMBER", "cast-b")
      ]
    });

    const readiness = deriveReadiness(
      validation,
      { configured: true },
      { hasUnsavedChanges: false },
      new Map([["cast-a", "Mara Vale"]])
    );

    expect(readiness.warnings).toHaveLength(1);
    expect(readiness.warnings[0]?.affected).toEqual([
      expect.objectContaining({ recordId: "cast-a", recordType: "CAST MEMBER", displayLabel: "Mara Vale" }),
      expect.objectContaining({ recordId: "cast-b", recordType: "CAST MEMBER", displayLabel: "CAST MEMBER cast-b" })
    ]);
  });

  it("marks unsaved drafts as stale without making the draft unsaveable", () => {
    const readiness = deriveReadiness(validationResult({}), { configured: true }, { hasUnsavedChanges: true }, new Map());

    expect(readiness.status).toBe("draft");
    expect(readiness.canSaveDraft).toBe(true);
    expect(readiness.unsavedDraft).toEqual({
      hasUnsavedChanges: true,
      readinessMayBeStale: true
    });
  });
});

function validationResult(input: {
  blockers?: readonly Diagnostic[];
  warnings?: readonly Diagnostic[];
}): ValidationResult {
  const blockers = input.blockers ?? [];
  const warnings = input.warnings ?? [];

  return {
    blockers,
    warnings,
    isBlocked: blockers.length > 0
  };
}

function diagnostic(
  severity: "blocker" | "warning",
  code: string,
  field: string,
  recordId?: string
): Diagnostic {
  return {
    severity,
    code,
    message: `${code} message`,
    affected: [recordId ? { recordId, field } : { field }],
    whyItMatters: `${code} matters`,
    suggestedActions: severity === "warning" ? ["revise"] : ["change-directive"]
  };
}

function fieldFor(code: string): string {
  if (code === DIAGNOSTIC_CODES.missingImmediateHandoff) {
    return "generationSession.immediate_handoff";
  }
  if (code === DIAGNOSTIC_CODES.localProseScopeViolation) {
    return "generationSession.stop_guidance.soft_unit_guidance";
  }

  return "generationSession.manual_moment_directive.must_render";
}
