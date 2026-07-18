import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  DIAGNOSTIC_CODES,
  buildValidationSnapshot,
  deriveReadiness,
  ideationApplicabilityFor,
  runValidation,
  type Diagnostic,
  type Severity,
  type ValidationResult
} from "../src/index.js";
import { cleanValidationInput } from "./support/arbitraries/validation-snapshots.js";

const proseOnlyCodes = [
  DIAGNOSTIC_CODES.missingManualDirective,
  DIAGNOSTIC_CODES.missingImmediateHandoff,
  DIAGNOSTIC_CODES.localProseScopeViolation,
  DIAGNOSTIC_CODES.directiveStopGuidanceDisagreement,
  DIAGNOSTIC_CODES.focusTagCountInvalid,
  DIAGNOSTIC_CODES.generationContextAcceptedSegmentMismatch,
  DIAGNOSTIC_CODES.povKnowledgeMissing,
  DIAGNOSTIC_CODES.activeCastIncomplete,
  DIAGNOSTIC_CODES.matrixDialogueIncomplete,
  DIAGNOSTIC_CODES.matrixEnsembleDialogueIncomplete,
  DIAGNOSTIC_CODES.matrixActiveSilentPresenceIncomplete,
  DIAGNOSTIC_CODES.matrixPresentMinorSpeechIncomplete,
  DIAGNOSTIC_CODES.matrixIntrospectionIncomplete
] as const;

function runProperty<T>(property: fc.IProperty<T>, seed: number, runs = 48): void {
  fc.assert(property, { seed, numRuns: runs, verbose: true });
}

describe("validation engine and readiness properties", () => {
  it("sets isBlocked exactly when blocker diagnostics are present", () => {
    runProperty(
      fc.property(fc.array(diagnosticArbitrary(), { maxLength: 8 }), (diagnostics) => {
        const result = runValidation(buildValidationSnapshot(cleanValidationInput()), [
          () => diagnostics
        ]);
        const expectedBlockers = diagnostics.filter((diagnostic) => diagnostic.severity === "blocker");
        const expectedWarnings = diagnostics.filter((diagnostic) => diagnostic.severity === "warning");

        expect(result.isBlocked).toBe(expectedBlockers.length > 0);
        expect(result.blockers.map((diagnostic) => diagnostic.code)).toEqual(
          expectedBlockers.map((diagnostic) => diagnostic.code).sort()
        );
        expect(result.warnings.map((diagnostic) => diagnostic.code)).toEqual(
          expectedWarnings.map((diagnostic) => diagnostic.code).sort()
        );
      }),
      0x26020
    );
  });

  it("keeps warning-only readiness open and provider configuration scoped to generate", () => {
    const warningOnly = validationResult({
      warnings: [diagnostic("warning", DIAGNOSTIC_CODES.castSalienceRisk, "CAST MEMBER", "cast-a")]
    });
    const missingProvider = deriveReadiness(warningOnly, { configured: false }, { hasUnsavedChanges: false }, new Map());
    const configured = deriveReadiness(warningOnly, { configured: true }, { hasUnsavedChanges: false }, new Map());

    expect(configured.status).toBe("ready-with-warnings");
    expect(configured.canSaveDraft).toBe(true);
    expect(configured.canPreview).toBe(true);
    expect(configured.canGenerate).toBe(true);
    expect(missingProvider.canPreview).toBe(true);
    expect(missingProvider.canGenerate).toBe(false);
    expect(missingProvider.provider.blockers).toHaveLength(1);
  });

  it("blocks preview and generate for validation blockers while save remains open", () => {
    const readiness = deriveReadiness(validationResult({
      blockers: [diagnostic("blocker", DIAGNOSTIC_CODES.missingCurrentAuthoritativeState, "generationSession.current_authoritative_state")]
    }), { configured: true }, { hasUnsavedChanges: false }, new Map());

    expect(readiness.status).toBe("blocked");
    expect(readiness.canSaveDraft).toBe(true);
    expect(readiness.canPreview).toBe(false);
    expect(readiness.canGenerate).toBe(false);
  });

  it("uses an independent prompt-kind applicability table for ideation readiness", () => {
    const allCodes = Object.values(DIAGNOSTIC_CODES);

    for (const code of allCodes) {
      expect(ideationApplicabilityFor(code), code).toBe(proseOnlyCodes.includes(code as (typeof proseOnlyCodes)[number]) ? "prose-only" : "applies");
    }

    const result = validationResult({
      blockers: [
        diagnostic("blocker", DIAGNOSTIC_CODES.missingManualDirective, "generationSession.manual_moment_directive.must_render"),
        diagnostic("blocker", DIAGNOSTIC_CODES.missingCurrentAuthoritativeState, "generationSession.current_authoritative_state")
      ]
    });
    const ideationReadiness = deriveReadiness(result, { configured: true }, { hasUnsavedChanges: false }, new Map(), "ideation");

    expect(ideationReadiness.blockers.map((item) => item.technical.legacyCode)).toEqual([
      DIAGNOSTIC_CODES.missingCurrentAuthoritativeState
    ]);
  });

  it("sorts diagnostics deterministically, repeats exactly, and freezes returned arrays", () => {
    const diagnostics = [
      diagnostic("blocker", "z-code", "z.field"),
      diagnostic("blocker", "a-code", "b.field"),
      diagnostic("blocker", "a-code", "a.field"),
      diagnostic("warning", "w-code", "w.field")
    ];
    const rules = [() => diagnostics] as const;
    const snapshot = buildValidationSnapshot(cleanValidationInput());
    const first = runValidation(snapshot, rules);
    const second = runValidation(snapshot, rules);

    expect(first).toEqual(second);
    expect(first.blockers.map((item) => [item.code, item.affected[0]?.field])).toEqual([
      ["a-code", "a.field"],
      ["a-code", "b.field"],
      ["z-code", "z.field"]
    ]);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.blockers)).toBe(true);
    expect(Object.isFrozen(first.blockers[0])).toBe(true);
    expect(Object.isFrozen(first.blockers[0]?.affected)).toBe(true);
    expect(Object.isFrozen(first.blockers[0]?.affected[0])).toBe(true);
  });

  it("sorts diagnostics with empty affected entries before populated affected entries", () => {
    const result = runValidation(buildValidationSnapshot(cleanValidationInput()), [
      () => [
        { ...diagnostic("blocker", "same-code", "z.field"), affected: [{ field: "z.field" }] },
        { ...diagnostic("blocker", "same-code", "empty"), affected: [{}] },
        { ...diagnostic("blocker", "same-code", "record", "record-a"), affected: [{ recordId: "record-a" }] },
        { ...diagnostic("blocker", "same-code", "record", "record-a"), affected: [{ recordId: "record-a", field: "0.field" }] }
      ]
    ]);

    expect(result.blockers.map((item) => item.affected)).toEqual([
      [{}],
      [{ field: "z.field" }],
      [{ recordId: "record-a" }],
      [{ recordId: "record-a", field: "0.field" }]
    ]);
  });

  it("normalizes validation snapshots by record id and type when ids tie", () => {
    const input = cleanValidationInput();
    input.records = [
      { id: "same", type: "SECRET", payload: {} },
      { id: "later", type: "FACT", payload: {} },
      { id: "same", type: "FACT", payload: {} },
      { id: "earlier", type: "OBJECT", payload: {} }
    ];

    expect(buildValidationSnapshot(input).records.map((record) => `${record.id}:${record.type}`)).toEqual([
      "earlier:OBJECT",
      "later:FACT",
      "same:FACT",
      "same:SECRET"
    ]);
  });

  it("deduplicates readiness warnings across duplicate traversal paths", () => {
    const readiness = deriveReadiness(validationResult({
      warnings: [
        diagnostic("warning", DIAGNOSTIC_CODES.castSalienceRisk, "CAST MEMBER", "cast-a"),
        diagnostic("warning", DIAGNOSTIC_CODES.castSalienceRisk, "CAST MEMBER", "cast-b")
      ]
    }), { configured: true }, { hasUnsavedChanges: false }, new Map([["cast-a", "A"]]));

    expect(readiness.warnings).toHaveLength(1);
    expect(readiness.warnings[0]?.affected.map((target) => target.recordId)).toEqual(["cast-a", "cast-b"]);
  });
});

function diagnosticArbitrary(): fc.Arbitrary<Diagnostic> {
  return fc.record({
    severity: fc.constantFrom<Severity>("blocker", "warning"),
    code: fc.constantFrom("a-code", "b-code", "c-code"),
    field: fc.constantFrom("a.field", "b.field", "generationSession.current_authoritative_state")
  }).map(({ severity, code, field }) => diagnostic(severity, code, field));
}

function diagnostic(severity: Severity, code: string, field: string, recordId?: string): Diagnostic {
  return {
    severity,
    code,
    message: `${code} message`,
    affected: [recordId ? { recordId, field } : { field }],
    whyItMatters: `${code} matters`,
    suggestedActions: ["revise"]
  };
}

function validationResult(input: { blockers?: readonly Diagnostic[]; warnings?: readonly Diagnostic[] }): ValidationResult {
  const blockers = input.blockers ?? [];
  const warnings = input.warnings ?? [];

  return Object.freeze({
    blockers,
    warnings,
    isBlocked: blockers.length > 0
  });
}
