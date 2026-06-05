import type { Diagnostic, ValidationResult } from "@loom/core";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { validate } from "../api.js";

interface ValidationPanelProps {
  validationKey: number;
  onFocusField?: (field: string) => void;
}

type ValidationState =
  | { status: "loading" }
  | { status: "ready"; result: ValidationResult }
  | { status: "error"; message: string };

export function ValidationPanel({ validationKey, onFocusField }: ValidationPanelProps): React.JSX.Element {
  const navigate = useNavigate();
  const [state, setState] = useState<ValidationState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    void validate()
      .then((result) => {
        if (active) {
          setState({ status: "ready", result });
        }
      })
      .catch(() => {
        if (active) {
          setState({ status: "error", message: "Could not run validation." });
        }
      });

    return () => {
      active = false;
    };
  }, [validationKey]);

  if (state.status === "loading") {
    return (
      <section className="configPanel validationPanel" aria-labelledby="validation-panel-title">
        <h3 id="validation-panel-title">VALIDATION</h3>
        <p className="muted" role="status">Checking readiness.</p>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="configPanel validationPanel" aria-labelledby="validation-panel-title">
        <h3 id="validation-panel-title">VALIDATION</h3>
        <p className="status statusError" role="alert">{state.message}</p>
      </section>
    );
  }

  const { blockers, warnings, isBlocked } = state.result;

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
    <section className="configPanel validationPanel" aria-labelledby="validation-panel-title">
      <h3 id="validation-panel-title">VALIDATION</h3>
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
    </section>
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
