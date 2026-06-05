import type { Diagnostic, ValidationResult } from "@loom/core";
import { useNavigate } from "react-router-dom";

interface ValidationResultViewProps {
  result: ValidationResult;
  onFocusField?: (field: string) => void;
}

export function ValidationResultView({ result, onFocusField }: ValidationResultViewProps): React.JSX.Element {
  const navigate = useNavigate();
  const { blockers, warnings, isBlocked } = result;

  function activateDiagnostic(diagnostic: Diagnostic): void {
    const affected = diagnostic.affected[0];

    if (affected?.recordId) {
      void navigate(`/records?recordId=${encodeURIComponent(affected.recordId)}`);
      return;
    }

    if (affected?.field) {
      onFocusField?.(affected.field);
    }
  }

  return (
    <>
      <p className={isBlocked ? "status statusError" : "status statusSuccess"} role="status">
        {isBlocked ? "Generation is blocked." : "Generation is not blocked."}
      </p>

      <section aria-labelledby="validation-blockers-title">
        <h4 id="validation-blockers-title">Blockers ({blockers.length})</h4>
        {blockers.length > 0 ? (
          <DiagnosticList diagnostics={blockers} onActivate={activateDiagnostic} />
        ) : (
          <p className="muted">No blockers.</p>
        )}
      </section>

      <details>
        <summary>Warnings ({warnings.length})</summary>
        <section aria-labelledby="validation-warnings-title">
          <h4 id="validation-warnings-title">Warnings</h4>
          {warnings.length > 0 ? (
            <DiagnosticList diagnostics={warnings} onActivate={activateDiagnostic} />
          ) : (
            <p className="muted">No warnings.</p>
          )}
        </section>
      </details>
    </>
  );
}

function DiagnosticList({
  diagnostics,
  onActivate
}: {
  diagnostics: readonly Diagnostic[];
  onActivate: (diagnostic: Diagnostic) => void;
}): React.JSX.Element {
  return (
    <ul className="diagnosticList">
      {diagnostics.map((diagnostic) => (
        <li key={`${diagnostic.code}:${JSON.stringify(diagnostic.affected)}`}>
          <button type="button" className="linkButton diagnosticButton" onClick={() => onActivate(diagnostic)}>
            <strong>{diagnostic.code}</strong>
          </button>
          <p>{diagnostic.message}</p>
          <p className="muted">{diagnostic.whyItMatters}</p>
          <p className="muted">Suggested: {diagnostic.suggestedActions.join(", ")}</p>
          {diagnostic.affected.length > 0 ? (
            <p className="muted">
              Affected: {diagnostic.affected.map((affected) => affected.field ?? affected.recordId ?? "unknown").join(", ")}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
