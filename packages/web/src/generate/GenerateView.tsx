import type { CompileResult, GenerationReadiness, ReadinessDiagnostic } from "@loom/core";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  acceptCandidate,
  compile,
  generate,
  type ApiFailure,
  type CompileBlocked,
  type CompileResponse,
  type GenerationMetadata,
  type GenerateResponse,
  type TransportFailure,
  readiness
} from "../api.js";
import { PromptInspector } from "../prompt/PromptInspector.js";
import { ReadinessChecklist } from "../readiness/ReadinessChecklist.js";
import { useReminderRefresh } from "../shell/reminder-refresh.js";

type GenerateSurfaceState =
  | { status: "loading" }
  | { status: "idle" }
  | { status: "ready"; result: CompileResult; readiness: GenerationReadiness }
  | { status: "blocked"; readiness: GenerationReadiness }
  | { status: "error"; kind: string; message: string };

type CandidateState =
  | { status: "idle" }
  | { status: "sending" }
  | {
      status: "candidate";
      text: string;
      originalText: string;
      generationMetadata: GenerationMetadata;
      acceptStatus: "idle" | "accepting";
      acceptError?: string;
    }
  | { status: "error"; message: string };

export function GenerateView(): React.JSX.Element {
  const [state, setState] = useState<GenerateSurfaceState>({ status: "loading" });
  const [candidateState, setCandidateState] = useState<CandidateState>({ status: "idle" });
  const [searchTerm, setSearchTerm] = useState("");
  const [acceptNotice, setAcceptNotice] = useState<string | null>(null);
  const { refreshReminder } = useReminderRefresh();
  const navigate = useNavigate();

  useEffect(() => {
    void refreshPrompt();
  }, []);

  async function refreshPrompt(): Promise<void> {
    setState({ status: "loading" });
    setCandidateState({ status: "idle" });
    setSearchTerm("");
    setAcceptNotice(null);

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

  async function generateCandidate(): Promise<void> {
    if (candidateState.status === "candidate" && candidateState.text !== candidateState.originalText) {
      const shouldReplace = window.confirm("Regenerate and replace your edited draft candidate?");
      if (!shouldReplace) {
        return;
      }
    }

    setCandidateState({ status: "sending" });
    setAcceptNotice(null);

    try {
      const result = await generate();

      if (result.ok) {
        setCandidateState({
          status: "candidate",
          text: result.candidate.text,
          originalText: result.candidate.text,
          generationMetadata: result.metadata,
          acceptStatus: "idle"
        });
        return;
      }

      if (isGenerateBlocked(result)) {
        setCandidateState({ status: "idle" });
        await refreshPrompt();
        return;
      }

      setCandidateState({ status: "error", message: generateErrorMessage(result) });
    } catch {
      setCandidateState({ status: "error", message: "Could not generate candidate prose." });
    }
  }

  function copyTechnicalJson(diagnostic: ReadinessDiagnostic): void {
    void navigator.clipboard?.writeText(JSON.stringify(diagnostic, null, 2));
  }

  const checklistActions = {
    onFocusField: (field: string) => {
      void navigate(`/generation-brief?field=${encodeURIComponent(field)}`);
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

  function updateCandidateText(text: string): void {
    setCandidateState((current) => {
      if (current.status !== "candidate") {
        return current;
      }

      return {
        ...withoutAcceptError(current),
        text
      };
    });
  }

  function discardCandidate(): void {
    setCandidateState({ status: "idle" });
    setAcceptNotice(null);
  }

  async function acceptCurrentCandidate(): Promise<void> {
    if (candidateState.status !== "candidate") {
      return;
    }

    const candidate = candidateState;
    setCandidateState({ ...withoutAcceptError(candidate), acceptStatus: "accepting" });

    try {
      const result = await acceptCandidate({
        text: candidate.text,
        generationMetadata: candidate.generationMetadata
      });

      if (result.ok) {
        setCandidateState({ status: "idle" });
        setAcceptNotice(`Accepted as segment ${result.segment.sequence}.`);
        refreshReminder();
        return;
      }

      setCandidateState({ ...candidate, acceptStatus: "idle", acceptError: errorMessage(result.kind, result.message) });
    } catch {
      setCandidateState({ ...candidate, acceptStatus: "idle", acceptError: "Could not accept candidate prose." });
    }
  }

  return (
    <section className="surface previewSurface" aria-labelledby="generate-title">
      <div className="projectHeader">
        <p className="eyebrow">Candidate workflow</p>
        <h2 id="generate-title">Generate / Candidate</h2>
      </div>

      {state.status === "loading" ? <p className="muted" role="status">Compiling prompt...</p> : null}

      {state.status === "idle" ? (
        <section className="configPanel">
          <p className="muted">No prompt is currently compiled.</p>
          <button type="button" onClick={() => void refreshPrompt()}>Refresh prompt</button>
        </section>
      ) : null}

      {state.status === "blocked" ? (
        <section className="previewStack">
          <p className="status statusError" role="alert">
            Generate is blocked.
          </p>
          <section className="configPanel validationPanel" aria-labelledby="generate-validation-title">
            <h3 id="generate-validation-title">READINESS</h3>
            <ReadinessChecklist readiness={state.readiness} actions={checklistActions} />
          </section>
          <button type="button" onClick={() => void refreshPrompt()}>Refresh prompt</button>
        </section>
      ) : null}

      {state.status === "error" ? (
        <section className="previewStack">
          <p className="status statusError" role="alert">{errorMessage(state.kind, state.message)}</p>
          <button type="button" onClick={() => void refreshPrompt()}>Refresh prompt</button>
        </section>
      ) : null}

      {state.status === "ready" ? (
        <ReadyGenerate
          result={state.result}
          readiness={state.readiness}
          searchTerm={searchTerm}
          candidateState={candidateState}
          acceptNotice={acceptNotice}
          onSearchTermChange={setSearchTerm}
          onRefresh={() => void refreshPrompt()}
          onGenerate={() => void generateCandidate()}
          onCandidateTextChange={updateCandidateText}
          onDiscardCandidate={discardCandidate}
          onAcceptCandidate={() => void acceptCurrentCandidate()}
          onChecklistAction={checklistActions}
        />
      ) : null}
    </section>
  );
}

function withoutAcceptError(candidate: Extract<CandidateState, { status: "candidate" }>): Omit<
  Extract<CandidateState, { status: "candidate" }>,
  "acceptError"
> {
  return {
    status: candidate.status,
    text: candidate.text,
    originalText: candidate.originalText,
    generationMetadata: candidate.generationMetadata,
    acceptStatus: candidate.acceptStatus
  };
}

function ReadyGenerate({
  result,
  readiness,
  searchTerm,
  candidateState,
  acceptNotice,
  onSearchTermChange,
  onRefresh,
  onGenerate,
  onCandidateTextChange,
  onDiscardCandidate,
  onAcceptCandidate,
  onChecklistAction
}: {
  result: CompileResult;
  readiness: GenerationReadiness;
  searchTerm: string;
  candidateState: CandidateState;
  acceptNotice: string | null;
  onSearchTermChange: (value: string) => void;
  onRefresh: () => void;
  onGenerate: () => void;
  onCandidateTextChange: (value: string) => void;
  onDiscardCandidate: () => void;
  onAcceptCandidate: () => void;
  onChecklistAction: React.ComponentProps<typeof ReadinessChecklist>["actions"];
}): React.JSX.Element {
  const canGenerate = readiness.canGenerate && candidateState.status !== "sending";
  const showReadinessChecklist = readiness.provider.blockers.length > 0 || readiness.warnings.length > 0;

  return (
    <section className="previewStack">
      {showReadinessChecklist ? (
        <section className="configPanel validationPanel" aria-labelledby="generate-readiness-title">
          <h3 id="generate-readiness-title">READINESS</h3>
          <ReadinessChecklist readiness={readiness} actions={onChecklistAction} />
        </section>
      ) : (
        <p className="status statusSuccess" role="status">Ready to generate.</p>
      )}
      <p className="status statusWarning" role="note">
        This prompt is temporary and not canon.
      </p>

      <div className="previewToolbar">
        {candidateState.status !== "candidate" ? (
          <button type="button" onClick={onGenerate} disabled={!canGenerate}>Generate</button>
        ) : null}
        <button type="button" onClick={onRefresh}>Refresh prompt</button>
      </div>
      {candidateState.status === "sending" ? <p className="muted" role="status">Generating...</p> : null}
      {candidateState.status === "error" ? (
        <p className="status statusError" role="alert">{candidateState.message}</p>
      ) : null}
      {acceptNotice ? <p className="status statusSuccess" role="status">{acceptNotice}</p> : null}

      <PromptInspector result={result} searchTerm={searchTerm} onSearchTermChange={onSearchTermChange} />

      {candidateState.status === "candidate" ? (
        <section className="candidatePanel" aria-label="Draft candidate">
          <div className="candidateHeader">
            <div>
              <h3>Draft candidate</h3>
              <p className="muted">Draft candidate - not accepted, not canon.</p>
            </div>
          </div>
          <label className="candidateEditorLabel">
            Candidate text
            <textarea
              className="candidateEditor"
              value={candidateState.text}
              onChange={(event) => onCandidateTextChange(event.target.value)}
            />
          </label>
          {candidateState.acceptError ? (
            <p className="status statusError" role="alert">{candidateState.acceptError}</p>
          ) : null}
          <div className="candidateActions">
            <button type="button" onClick={onGenerate} disabled={candidateState.acceptStatus === "accepting"}>
              Regenerate
            </button>
            <button type="button" onClick={onDiscardCandidate} disabled={candidateState.acceptStatus === "accepting"}>
              Discard
            </button>
            <button type="button" onClick={onAcceptCandidate} disabled={candidateState.acceptStatus === "accepting"}>
              Accept
            </button>
          </div>
          {candidateState.acceptStatus === "accepting" ? <p className="muted" role="status">Accepting...</p> : null}
        </section>
      ) : null}
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

function isGenerateBlocked(result: Exclude<GenerateResponse, { ok: true }>): result is CompileBlocked {
  return "kind" in result && result.kind === "validation-blocked" && "validation" in result;
}

function errorMessage(kind: string, message: string): string {
  if (kind === "no-open-project") {
    return "Open a project first.";
  }

  return message;
}

function generateErrorMessage(result: ApiFailure | TransportFailure): string {
  if ("category" in result) {
    switch (result.category) {
      case "missing-key":
        return "API key missing. Configure it in Settings.";
      case "insufficient-credits":
        return "Insufficient OpenRouter credits.";
      case "rate-limit":
        return "Rate limited. Wait before retrying.";
      case "provider-unavailable":
        return "Provider or model unavailable.";
      case "moderation-refusal":
        return "Provider refused the request for policy reasons.";
      default:
        return result.message;
    }
  }

  return errorMessage(result.kind, result.message);
}
