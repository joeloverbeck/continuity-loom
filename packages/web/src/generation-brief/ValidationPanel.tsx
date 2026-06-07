import type { ValidationResult } from "@loom/core";
import { useEffect, useState } from "react";

import { type ApiFailure, validate } from "../api.js";
import { ValidationResultView } from "./ValidationResultView.js";

interface ValidationPanelProps {
  validationKey: number;
  onFocusField?: (field: string) => void;
}

type ValidationState =
  | { status: "loading" }
  | { status: "ready"; result: ValidationResult }
  | { status: "error"; message: string };

export function ValidationPanel({ validationKey, onFocusField }: ValidationPanelProps): React.JSX.Element {
  const [state, setState] = useState<ValidationState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    void validate()
      .then((result) => {
        if (active) {
          if (isApiFailure(result)) {
            setState({ status: "error", message: validationFailureMessage(result) });
            return;
          }

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

  return (
    <section className="configPanel validationPanel" aria-labelledby="validation-panel-title">
      <h3 id="validation-panel-title">VALIDATION</h3>
      <ValidationResultView result={state.result} {...(onFocusField ? { onFocusField } : {})} />
    </section>
  );
}

function isApiFailure(result: ValidationResult | ApiFailure): result is ApiFailure {
  return "ok" in result && result.ok === false;
}

function validationFailureMessage(failure: ApiFailure): string {
  if (failure.kind === "no-open-project") {
    return "Open a project first.";
  }

  return failure.message || "Could not run validation.";
}
