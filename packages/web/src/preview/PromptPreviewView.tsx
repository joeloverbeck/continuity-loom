import type { CompileResult } from "@loom/core";
import { useEffect, useMemo, useState } from "react";

import { compile, type ApiFailure, type CompileBlocked, type CompileResponse } from "../api.js";
import { ValidationResultView } from "../generation-brief/ValidationResultView.js";

type PreviewState =
  | { status: "loading" }
  | { status: "idle" }
  | { status: "ready"; result: CompileResult }
  | { status: "blocked"; result: CompileBlocked }
  | { status: "error"; kind: string; message: string };

export function PromptPreviewView(): React.JSX.Element {
  const [state, setState] = useState<PreviewState>({ status: "loading" });
  const [searchTerm, setSearchTerm] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    void refreshPreview();
  }, []);

  async function refreshPreview(): Promise<void> {
    setState({ status: "loading" });
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
          onSearchTermChange={setSearchTerm}
          onCopy={() => void copyPrompt(state.result.prompt)}
          onClear={clearPreview}
          onRefresh={() => void refreshPreview()}
        />
      ) : null}
    </section>
  );
}

function ReadyPreview({
  result,
  searchTerm,
  copyStatus,
  onSearchTermChange,
  onCopy,
  onClear,
  onRefresh
}: {
  result: CompileResult;
  searchTerm: string;
  copyStatus: "idle" | "copied" | "failed";
  onSearchTermChange: (value: string) => void;
  onCopy: () => void;
  onClear: () => void;
  onRefresh: () => void;
}): React.JSX.Element {
  const highlightedPrompt = useMemo(() => highlightPrompt(result.prompt, searchTerm), [result.prompt, searchTerm]);
  const matchCount = countMatches(result.prompt, searchTerm);

  return (
    <section className="previewStack">
      <p className="status statusWarning" role="note">
        This prompt is temporary and not canon.
      </p>

      <div className="previewToolbar">
        <button type="button" onClick={onCopy}>Copy prompt</button>
        <button type="button" onClick={onRefresh}>Refresh preview</button>
        <button type="button" onClick={onClear}>Clear</button>
      </div>
      {copyStatus === "copied" ? <p className="muted" role="status">Prompt copied.</p> : null}
      {copyStatus === "failed" ? <p className="status statusError" role="alert">Could not copy prompt.</p> : null}

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
    </section>
  );
}

function isFailure(result: CompileResponse): result is Extract<CompileResponse, { ok: false }> {
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
