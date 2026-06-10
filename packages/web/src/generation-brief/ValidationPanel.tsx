import type { GenerationReadiness, ReadinessDiagnostic } from "@loom/core";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { type ApiFailure, readiness } from "../api.js";
import { ReadinessChecklist } from "../readiness/ReadinessChecklist.js";

interface ValidationPanelProps {
  validationKey: number;
  hasUnsavedChanges: boolean;
  onFocusField?: (field: string) => void;
}

type ValidationState =
  | { status: "loading" }
  | { status: "ready"; result: GenerationReadiness }
  | { status: "error"; message: string };

export function ValidationPanel({ validationKey, hasUnsavedChanges, onFocusField }: ValidationPanelProps): React.JSX.Element {
  const [state, setState] = useState<ValidationState>({ status: "loading" });
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    void readiness()
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

  function copyTechnicalJson(diagnostic: ReadinessDiagnostic): void {
    void navigator.clipboard?.writeText(JSON.stringify(diagnostic, null, 2));
  }

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
      <ReadinessChecklist
        readiness={withUnsavedDraftState(state.result, hasUnsavedChanges)}
        actions={{
          onFocusField: (field) => onFocusField?.(field),
          onOpenRecord: (recordId) => {
            void navigate(`/records?recordId=${encodeURIComponent(recordId)}`);
          },
          onOpenProviderSettings: () => {
            void navigate("/settings");
          },
          onOpenWorkingSet: () => {
            void navigate("/working-set");
          },
          onCopyTechnicalJson: copyTechnicalJson
        }}
      />
    </section>
  );
}

function isApiFailure(result: GenerationReadiness | ApiFailure): result is ApiFailure {
  return "ok" in result && result.ok === false;
}

function validationFailureMessage(failure: ApiFailure): string {
  if (failure.kind === "no-open-project") {
    return "Open a project first.";
  }

  if (failure.kind === "malformed-validation-source" && failure.danglingSelectedRecordIds?.length) {
    return `Active working set contains stale selected record id(s): ${failure.danglingSelectedRecordIds.join(", ")}. ${failure.suggestedAction ?? "Remove these ids from the active working set."}`;
  }

  return failure.message || "Could not run validation.";
}

function withUnsavedDraftState(readinessResult: GenerationReadiness, hasUnsavedChanges: boolean): GenerationReadiness {
  if (!hasUnsavedChanges) {
    return readinessResult;
  }

  return {
    ...readinessResult,
    status: "draft",
    unsavedDraft: {
      hasUnsavedChanges: true,
      readinessMayBeStale: true
    },
    summary: {
      headline: "Draft has unsaved changes",
      nextAction: "Save the draft before trusting this readiness result."
    }
  };
}
