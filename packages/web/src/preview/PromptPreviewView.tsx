import type { CompileResult } from "@loom/core";
import { useEffect, useMemo, useState } from "react";

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

type PreviewState =
  | { status: "loading" }
  | { status: "idle" }
  | { status: "ready"; result: CompileResult }
  | { status: "blocked"; result: CompileBlocked }
  | { status: "error"; kind: string; message: string };

type GenerateState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "candidate"; text: string }
  | { status: "error"; message: string };

export function PromptPreviewView(): React.JSX.Element {
  const [state, setState] = useState<PreviewState>({ status: "loading" });
  const [generateState, setGenerateState] = useState<GenerateState>({ status: "idle" });
  const [searchTerm, setSearchTerm] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    void refreshPreview();
  }, []);

  async function refreshPreview(): Promise<void> {
    setState({ status: "loading" });
    setGenerateState({ status: "idle" });
    setCopyStatus("idle");
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

  function clearPreview(): void {
    setState({ status: "idle" });
    setGenerateState({ status: "idle" });
    setSearchTerm("");
    setCopyStatus("idle");
  }

  async function generateCandidate(): Promise<void> {
    setGenerateState({ status: "sending" });

    try {
      const result = await generate();

      if (result.ok) {
        setGenerateState({ status: "candidate", text: result.candidate.text });
        return;
      }

      if (isGenerateBlocked(result)) {
        setState({ status: "blocked", result });
        setGenerateState({ status: "idle" });
        return;
      }

      setGenerateState({ status: "error", message: generateErrorMessage(result) });
    } catch {
      setGenerateState({ status: "error", message: "Could not generate candidate prose." });
    }
  }

  async function copyPrompt(prompt: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

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
            Prompt preview is unavailable while blockers exist.
          </p>
          <section className="configPanel validationPanel" aria-labelledby="preview-validation-title">
            <h3 id="preview-validation-title">VALIDATION</h3>
            <ValidationResultView result={state.result.validation} />
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
          searchTerm={searchTerm}
          copyStatus={copyStatus}
          generateState={generateState}
          onSearchTermChange={setSearchTerm}
          onCopy={() => void copyPrompt(state.result.prompt)}
          onClear={clearPreview}
          onRefresh={() => void refreshPreview()}
          onGenerate={() => void generateCandidate()}
          onClearCandidate={() => setGenerateState({ status: "idle" })}
        />
      ) : null}
    </section>
  );
}

function ReadyPreview({
  result,
  searchTerm,
  copyStatus,
  generateState,
  onSearchTermChange,
  onCopy,
  onClear,
  onRefresh,
  onGenerate,
  onClearCandidate
}: {
  result: CompileResult;
  searchTerm: string;
  copyStatus: "idle" | "copied" | "failed";
  generateState: GenerateState;
  onSearchTermChange: (value: string) => void;
  onCopy: () => void;
  onClear: () => void;
  onRefresh: () => void;
  onGenerate: () => void;
  onClearCandidate: () => void;
}): React.JSX.Element {
  const highlightedPrompt = useMemo(() => highlightPrompt(result.prompt, searchTerm), [result.prompt, searchTerm]);
  const matchCount = countMatches(result.prompt, searchTerm);

  return (
    <section className="previewStack">
      <p className="status statusWarning" role="note">
        This prompt is temporary and not canon.
      </p>

      <div className="previewToolbar">
        <button type="button" onClick={onGenerate} disabled={generateState.status === "sending"}>Generate</button>
        <button type="button" onClick={onCopy}>Copy prompt</button>
        <button type="button" onClick={onRefresh}>Refresh preview</button>
        <button type="button" onClick={onClear}>Clear</button>
      </div>
      {copyStatus === "copied" ? <p className="muted" role="status">Prompt copied.</p> : null}
      {copyStatus === "failed" ? <p className="status statusError" role="alert">Could not copy prompt.</p> : null}
      {generateState.status === "sending" ? <p className="muted" role="status">Generating...</p> : null}
      {generateState.status === "error" ? (
        <p className="status statusError" role="alert">{generateState.message}</p>
      ) : null}

      <label className="promptSearch">
        Search within prompt
        <input value={searchTerm} onChange={(event) => onSearchTermChange(event.target.value)} />
      </label>
      {searchTerm.trim() ? <p className="muted" role="status">{matchCount} matches</p> : null}

      <section className="promptPreviewLayout" aria-label="Compiled prompt preview">
        <pre className="promptBody" data-testid="prompt-body">{highlightedPrompt}</pre>
        <aside className="metadataPanel" aria-label="Prompt metadata">
          <h3>Metadata</h3>
          <dl className="metadataGrid">
            <div>
              <dt>Template</dt>
              <dd>{result.metadata.versions.template}</dd>
            </div>
            <div>
              <dt>Compiler</dt>
              <dd>{result.metadata.versions.compiler}</dd>
            </div>
            <div>
              <dt>Contract</dt>
              <dd>{result.metadata.versions.contract}</dd>
            </div>
            <div>
              <dt>Fingerprint</dt>
              <dd>{result.metadata.fingerprint}</dd>
            </div>
            <div>
              <dt>Length estimate</dt>
              <dd>{result.metadata.lengthEstimate}</dd>
            </div>
            <div>
              <dt>Token estimate</dt>
              <dd>{result.metadata.tokenEstimate}</dd>
            </div>
          </dl>
        </aside>
      </section>

      {generateState.status === "candidate" ? (
        <section className="candidatePanel" aria-label="Draft candidate">
          <div className="candidateHeader">
            <div>
              <h3>Draft candidate</h3>
              <p className="muted">Draft candidate; not accepted, not canon.</p>
            </div>
            <button type="button" onClick={onClearCandidate}>Clear candidate</button>
          </div>
          <pre className="candidateBody" data-testid="candidate-body">{generateState.text}</pre>
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

function countMatches(prompt: string, searchTerm: string): number {
  const term = searchTerm.trim();

  if (!term) {
    return 0;
  }

  return prompt.toLocaleLowerCase().split(term.toLocaleLowerCase()).length - 1;
}

function highlightPrompt(prompt: string, searchTerm: string): React.ReactNode {
  const term = searchTerm.trim();

  if (!term) {
    return prompt;
  }

  const lowerPrompt = prompt.toLocaleLowerCase();
  const lowerTerm = term.toLocaleLowerCase();
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let matchIndex = lowerPrompt.indexOf(lowerTerm, cursor);

  while (matchIndex !== -1) {
    if (matchIndex > cursor) {
      nodes.push(prompt.slice(cursor, matchIndex));
    }

    const end = matchIndex + term.length;
    nodes.push(<mark key={`${matchIndex}:${end}`}>{prompt.slice(matchIndex, end)}</mark>);
    cursor = end;
    matchIndex = lowerPrompt.indexOf(lowerTerm, cursor);
  }

  if (cursor < prompt.length) {
    nodes.push(prompt.slice(cursor));
  }

  return nodes;
}
