import type { CompileResult, GenerationReadiness, ReadinessDiagnostic } from "@loom/core";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  compile,
  type ApiFailure,
  type CompileBlocked,
  type CompileResponse,
  readiness
} from "../api.js";
import { PromptInspector } from "../prompt/PromptInspector.js";
import { ReadinessChecklist } from "../readiness/ReadinessChecklist.js";

type PreviewState =
  | { status: "loading" }
  | { status: "idle" }
  | { status: "ready"; result: CompileResult; readiness: GenerationReadiness }
  | { status: "blocked"; readiness: GenerationReadiness }
  | { status: "error"; kind: string; message: string };

export function PromptPreviewView(): React.JSX.Element {
  const [state, setState] = useState<PreviewState>({ status: "loading" });
  const [searchTerm, setSearchTerm] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const navigate = useNavigate();

  useEffect(() => {
    void refreshPreview();
  }, []);

  async function refreshPreview(): Promise<void> {
    setState({ status: "loading" });
    setCopyStatus("idle");
    setSearchTerm("");

    try {
      const [compileResult, readinessResult] = await Promise.all([compile(), readiness()]);

      if (isReadinessFailure(readinessResult)) {
        setState({ status: "error", kind: readinessResult.kind, message: readinessResult.message });
        return;
      }

      if (!readinessResult.canPreview) {
        setState({ status: "blocked", readiness: readinessResult });
        return;
      }

      if (isFailure(compileResult)) {
        if (isValidationBlocked(compileResult)) {
          setState({ status: "blocked", readiness: readinessResult });
          return;
        }

        setState({ status: "error", kind: compileResult.kind, message: compileResult.message });
        return;
      }

      setState({ status: "ready", result: compileResult, readiness: readinessResult });
    } catch {
      setState({ status: "error", kind: "compile-request-failed", message: "Could not compile the prompt." });
    }
  }

  function clearPreview(): void {
    setState({ status: "idle" });
    setSearchTerm("");
    setCopyStatus("idle");
  }

  async function copyPrompt(prompt: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  function copyTechnicalJson(diagnostic: ReadinessDiagnostic): void {
    void navigator.clipboard?.writeText(JSON.stringify(diagnostic, null, 2));
  }

  const checklistActions = {
    onFocusField: () => {
      void navigate("/generation-brief");
    },
    onOpenRecord: (recordId: string) => {
      void navigate(`/records?recordId=${encodeURIComponent(recordId)}`);
    },
    onOpenProviderSettings: () => {
      void navigate("/settings");
    },
    onOpenWorkingSet: () => {
      void navigate("/working-set");
    },
    onCopyTechnicalJson: copyTechnicalJson
  };

  return (
    <section className="surface previewSurface" aria-labelledby="prompt-preview-title">
      <div className="projectHeader">
        <p className="eyebrow">Validation gated</p>
        <h2 id="prompt-preview-title">Validation / Prompt Preview</h2>
      </div>

      {state.status === "loading" ? <p className="muted" role="status">Compiling prompt...</p> : null}

      {state.status === "idle" ? (
        <section className="configPanel">
          <p className="muted">No prompt is currently compiled.</p>
          <button type="button" onClick={() => void refreshPreview()}>Refresh preview</button>
        </section>
      ) : null}

      {state.status === "blocked" ? (
        <section className="previewStack">
          <p className="status statusError" role="alert">
            Prompt preview is blocked.
          </p>
          <section className="configPanel validationPanel" aria-labelledby="preview-validation-title">
            <h3 id="preview-validation-title">READINESS</h3>
            <ReadinessChecklist readiness={state.readiness} actions={checklistActions} />
          </section>
          <button type="button" onClick={() => void refreshPreview()}>Refresh preview</button>
        </section>
      ) : null}

      {state.status === "error" ? (
        <section className="previewStack">
          <p className="status statusError" role="alert">{errorMessage(state.kind, state.message)}</p>
          <button type="button" onClick={() => void refreshPreview()}>Refresh preview</button>
        </section>
      ) : null}

      {state.status === "ready" ? (
        <ReadyPreview
          result={state.result}
          readiness={state.readiness}
          searchTerm={searchTerm}
          copyStatus={copyStatus}
          onSearchTermChange={setSearchTerm}
          onCopy={() => void copyPrompt(state.result.prompt)}
          onClear={clearPreview}
          onRefresh={() => void refreshPreview()}
          onChecklistAction={checklistActions}
        />
      ) : null}
    </section>
  );
}

function ReadyPreview({
  result,
  readiness,
  searchTerm,
  copyStatus,
  onSearchTermChange,
  onCopy,
  onClear,
  onRefresh,
  onChecklistAction
}: {
  result: CompileResult;
  readiness: GenerationReadiness;
  searchTerm: string;
  copyStatus: "idle" | "copied" | "failed";
  onSearchTermChange: (value: string) => void;
  onCopy: () => void;
  onClear: () => void;
  onRefresh: () => void;
  onChecklistAction: React.ComponentProps<typeof ReadinessChecklist>["actions"];
}): React.JSX.Element {
  return (
    <section className="previewStack">
      {readiness.status === "ready-with-warnings" ? (
        <section className="configPanel validationPanel" aria-labelledby="preview-recommended-title">
          <h3 id="preview-recommended-title">Recommended before sending</h3>
          <ReadinessChecklist readiness={readiness} actions={onChecklistAction} />
        </section>
      ) : (
        <p className="status statusSuccess" role="status">Ready to generate.</p>
      )}
      <p className="status statusWarning" role="note">This prompt is temporary and not canon.</p>

      <div className="previewToolbar">
        <button type="button" onClick={onCopy}>Copy prompt</button>
        <button type="button" onClick={onRefresh}>Refresh preview</button>
        <button type="button" onClick={onClear}>Clear</button>
      </div>
      {copyStatus === "copied" ? <p className="muted" role="status">Prompt copied.</p> : null}
      {copyStatus === "failed" ? <p className="status statusError" role="alert">Could not copy prompt.</p> : null}

      <PromptInspector result={result} searchTerm={searchTerm} onSearchTermChange={onSearchTermChange} />
    </section>
  );
}

function isFailure(result: CompileResponse): result is Extract<CompileResponse, { ok: false }> {
  return "ok" in result && result.ok === false;
}

function isReadinessFailure(result: GenerationReadiness | ApiFailure): result is ApiFailure {
  return "ok" in result && result.ok === false;
}

function isValidationBlocked(result: ApiFailure | CompileBlocked): result is CompileBlocked {
  return result.kind === "validation-blocked" && "validation" in result;
}

function errorMessage(kind: string, message: string): string {
  if (kind === "no-open-project") {
    return "Open a project first.";
  }

  return message;
}
