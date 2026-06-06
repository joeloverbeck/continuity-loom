import type { CompileResult } from "@loom/core";
import { useEffect, useState } from "react";

import {
  compile,
  generate,
  type ApiFailure,
  type CompileBlocked,
  type CompileResponse,
  type GenerateResponse,
  type TransportFailure
} from "../api.js";
import { ValidationResultView } from "../generation-brief/ValidationResultView.js";
import { PromptInspector } from "../prompt/PromptInspector.js";

type GenerateSurfaceState =
  | { status: "loading" }
  | { status: "idle" }
  | { status: "ready"; result: CompileResult }
  | { status: "blocked"; result: CompileBlocked }
  | { status: "error"; kind: string; message: string };

type CandidateState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "candidate"; text: string }
  | { status: "error"; message: string };

export function GenerateView(): React.JSX.Element {
  const [state, setState] = useState<GenerateSurfaceState>({ status: "loading" });
  const [candidateState, setCandidateState] = useState<CandidateState>({ status: "idle" });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    void refreshPrompt();
  }, []);

  async function refreshPrompt(): Promise<void> {
    setState({ status: "loading" });
    setCandidateState({ status: "idle" });
    setSearchTerm("");

    try {
      const result = await compile();

      if (isFailure(result)) {
        if (isValidationBlocked(result)) {
          setState({ status: "blocked", result });
          return;
        }

        setState({ status: "error", kind: result.kind, message: result.message });
        return;
      }

      setState({ status: "ready", result });
    } catch {
      setState({ status: "error", kind: "compile-request-failed", message: "Could not compile the prompt." });
    }
  }

  async function generateCandidate(): Promise<void> {
    setCandidateState({ status: "sending" });

    try {
      const result = await generate();

      if (result.ok) {
        setCandidateState({ status: "candidate", text: result.candidate.text });
        return;
      }

      if (isGenerateBlocked(result)) {
        setState({ status: "blocked", result });
        setCandidateState({ status: "idle" });
        return;
      }

      setCandidateState({ status: "error", message: generateErrorMessage(result) });
    } catch {
      setCandidateState({ status: "error", message: "Could not generate candidate prose." });
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
            Prompt preview is unavailable while blockers exist.
          </p>
          <section className="configPanel validationPanel" aria-labelledby="generate-validation-title">
            <h3 id="generate-validation-title">VALIDATION</h3>
            <ValidationResultView result={state.result.validation} />
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
          searchTerm={searchTerm}
          candidateState={candidateState}
          onSearchTermChange={setSearchTerm}
          onRefresh={() => void refreshPrompt()}
          onGenerate={() => void generateCandidate()}
          onClearCandidate={() => setCandidateState({ status: "idle" })}
        />
      ) : null}
    </section>
  );
}

function ReadyGenerate({
  result,
  searchTerm,
  candidateState,
  onSearchTermChange,
  onRefresh,
  onGenerate,
  onClearCandidate
}: {
  result: CompileResult;
  searchTerm: string;
  candidateState: CandidateState;
  onSearchTermChange: (value: string) => void;
  onRefresh: () => void;
  onGenerate: () => void;
  onClearCandidate: () => void;
}): React.JSX.Element {
  return (
    <section className="previewStack">
      <p className="status statusWarning" role="note">
        This prompt is temporary and not canon.
      </p>

      <div className="previewToolbar">
        <button type="button" onClick={onGenerate} disabled={candidateState.status === "sending"}>Generate</button>
        <button type="button" onClick={onRefresh}>Refresh prompt</button>
      </div>
      {candidateState.status === "sending" ? <p className="muted" role="status">Generating...</p> : null}
      {candidateState.status === "error" ? (
        <p className="status statusError" role="alert">{candidateState.message}</p>
      ) : null}

      <PromptInspector result={result} searchTerm={searchTerm} onSearchTermChange={onSearchTermChange} />

      {candidateState.status === "candidate" ? (
        <section className="candidatePanel" aria-label="Draft candidate">
          <div className="candidateHeader">
            <div>
              <h3>Draft candidate</h3>
              <p className="muted">Draft candidate; not accepted, not canon.</p>
            </div>
            <button type="button" onClick={onClearCandidate}>Clear candidate</button>
          </div>
          <pre className="candidateBody" data-testid="candidate-body">{candidateState.text}</pre>
        </section>
      ) : null}
    </section>
  );
}

function isFailure(result: CompileResponse): result is Extract<CompileResponse, { ok: false }> {
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
