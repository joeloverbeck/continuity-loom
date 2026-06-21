import { describe, expect, it } from "vitest";

import {
  DIAGNOSTIC_CODES,
  buildValidationSnapshot,
  deriveReadiness,
  runValidation,
  type Diagnostic,
  type ValidationResult
} from "../src/index.js";
import {
  diagnosticContractRegistry,
  expectedRunnableDiagnosticCodes,
  runnableDiagnosticContracts,
  type RunnableDiagnosticContract
} from "./support/diagnostic-contract.js";

describe("validation diagnostic contract harness", () => {
  it("has an explicit registry entry for every exported diagnostic code", () => {
    const exportedCodes = Object.values(DIAGNOSTIC_CODES).sort();
    const registryCodes = [...diagnosticContractRegistry.keys()].sort();

    expect(registryCodes).toEqual(exportedCodes);
  });

  it("seeds runnable contracts for the SPEC026MUTDRIROB-015 diagnostic families", () => {
    expect(runnableDiagnosticContracts.map((contract) => contract.code).sort()).toEqual(
      [...expectedRunnableDiagnosticCodes].sort()
    );
  });

  it.each(runnableDiagnosticContracts)("satisfies the defect -> exact diagnostic -> repair relation for $code", (contract) => {
    const baseline = contract.buildValidBaseline();
    const baselineResult = runValidation(buildValidationSnapshot(baseline));

    expect(allDiagnostics(baselineResult).map((diagnostic) => diagnostic.code), `${contract.code} baseline`).not.toContain(
      contract.code
    );

    contract.introduceMinimalDefect(baseline);
    const defectResult = runValidation(buildValidationSnapshot(baseline));
    const defectDiagnostics = allDiagnostics(defectResult).filter((diagnostic) => diagnostic.code === contract.code);

    expect(defectDiagnostics, contract.code).toHaveLength(1);
    expect(defectDiagnostics[0]).toMatchObject({
      code: contract.code,
      severity: contract.severity,
      affected: contract.expectedAffected
    });

    expectReadinessApplicability(contract, defectDiagnostics[0]!);

    contract.repairDefect(baseline);
    const repairedResult = runValidation(buildValidationSnapshot(baseline));

    expect(allDiagnostics(repairedResult).map((diagnostic) => diagnostic.code), `${contract.code} repaired`).not.toContain(
      contract.code
    );
  });
});

function allDiagnostics(result: ValidationResult): readonly Diagnostic[] {
  return [...result.blockers, ...result.warnings];
}

function expectReadinessApplicability(contract: RunnableDiagnosticContract, diagnostic: Diagnostic): void {
  const validation = validationResultFor(diagnostic);
  const proseReadiness = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map(), "prose");
  const ideationReadiness = deriveReadiness(validation, { configured: true }, { hasUnsavedChanges: false }, new Map(), "ideation");

  expect(proseReadiness.blockers.map((item) => item.technical.legacyCode)).toContain(contract.code);

  if (contract.promptKinds === "applies") {
    expect(ideationReadiness.blockers.map((item) => item.technical.legacyCode)).toContain(contract.code);
  } else {
    expect(ideationReadiness.blockers.map((item) => item.technical.legacyCode)).not.toContain(contract.code);
  }
}

function validationResultFor(diagnostic: Diagnostic): ValidationResult {
  const blockers = diagnostic.severity === "blocker" ? [diagnostic] : [];
  const warnings = diagnostic.severity === "warning" ? [diagnostic] : [];

  return Object.freeze({
    blockers,
    warnings,
    isBlocked: blockers.length > 0
  });
}
