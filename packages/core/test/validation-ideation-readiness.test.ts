import { describe, expect, it } from "vitest";

import { DIAGNOSTIC_CODES, deriveReadiness, type Diagnostic, type ValidationResult } from "../src/index.js";

describe("ideation readiness", () => {
  it("keeps hard contradictions blocking ideation", () => {
    const validation = validationResult({
      blockers: [diagnostic(DIAGNOSTIC_CODES.entityCurrentLocationContradiction, "ENTITY STATUS.location")]
    });

    const readiness = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map(), "ideation");

    expect(readiness.canPreview).toBe(false);
    expect(readiness.canGenerate).toBe(false);
    expect(readiness.blockers[0]?.technical.legacyCode).toBe(DIAGNOSTIC_CODES.entityCurrentLocationContradiction);
  });

  it("drops prose-launch-only blockers for ideation while preserving prose readiness", () => {
    const validation = validationResult({
      blockers: [diagnostic(DIAGNOSTIC_CODES.missingManualDirective, "generationSession.manual_moment_directive.must_render")]
    });

    const prose = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map(), "prose");
    const ideation = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map(), "ideation");

    expect(prose.canPreview).toBe(false);
    expect(prose.blockers[0]?.technical.legacyCode).toBe(DIAGNOSTIC_CODES.missingManualDirective);
    expect(ideation.canPreview).toBe(true);
    expect(ideation.canGenerate).toBe(true);
    expect(ideation.blockers).toEqual([]);
  });

  it("does not let warnings block either prose or ideation", () => {
    const validation = validationResult({
      warnings: [diagnostic(DIAGNOSTIC_CODES.castSalienceRisk, "CAST MEMBER", "cast-a", "warning")]
    });

    const prose = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map(), "prose");
    const ideation = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map(), "ideation");

    expect(prose.canPreview).toBe(true);
    expect(prose.canGenerate).toBe(true);
    expect(ideation.canPreview).toBe(true);
    expect(ideation.canGenerate).toBe(true);
  });

  it("keeps provider configuration as an ideation send gate", () => {
    const readiness = deriveReadiness(validationResult({}), { configured: false }, { hasUnsavedChanges: false }, new Map(), "ideation");

    expect(readiness.canPreview).toBe(true);
    expect(readiness.canGenerate).toBe(false);
    expect(readiness.provider.blockers[0]?.code).toBe("provider-configuration-missing");
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
  code: string,
  field: string,
  recordId?: string,
  severity: "blocker" | "warning" = "blocker"
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
