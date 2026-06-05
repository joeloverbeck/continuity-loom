import { validationRules } from "./rules/index.js";
import type { ValidationRule } from "./rules/types.js";
import type { Diagnostic, ValidationResult } from "./types.js";
import type { ValidationSnapshot } from "./snapshot.js";

export function runValidation(
  snapshot: ValidationSnapshot,
  rules: readonly ValidationRule[] = validationRules
): ValidationResult {
  const diagnostics = rules.flatMap((rule) => rule(snapshot));
  const blockers = stableSortDiagnostics(diagnostics.filter((diagnostic) => diagnostic.severity === "blocker"));
  const warnings = stableSortDiagnostics(diagnostics.filter((diagnostic) => diagnostic.severity === "warning"));

  return Object.freeze({
    blockers,
    warnings,
    isBlocked: blockers.length > 0
  });
}

function stableSortDiagnostics(diagnostics: readonly Diagnostic[]): readonly Diagnostic[] {
  return Object.freeze(
    [...diagnostics]
      .map((diagnostic) => freezeDiagnostic(diagnostic))
      .sort((left, right) => {
        const codeComparison = left.code.localeCompare(right.code);

        if (codeComparison !== 0) {
          return codeComparison;
        }

        return diagnosticAffectedSortKey(left).localeCompare(diagnosticAffectedSortKey(right));
      })
  );
}

function diagnosticAffectedSortKey(diagnostic: Diagnostic): string {
  return JSON.stringify(
    [...diagnostic.affected].map((affected) => ({
      recordId: affected.recordId ?? "",
      field: affected.field ?? ""
    }))
  );
}

function freezeDiagnostic(diagnostic: Diagnostic): Diagnostic {
  return Object.freeze({
    ...diagnostic,
    affected: Object.freeze(diagnostic.affected.map((affected) => Object.freeze({ ...affected }))),
    suggestedActions: Object.freeze([...diagnostic.suggestedActions])
  });
}
