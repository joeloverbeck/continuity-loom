import type { CompileResult } from "@loom/core";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  recordHygieneAnalyze,
  recordHygieneCompile,
  type ApiFailure,
  type ParsedRecordHygieneFinding,
  type RecordHygieneAnalyzeResponse,
  type RecordHygieneCompileMetadata,
  type RecordHygieneCompileResponse,
  type TransportFailure
} from "../api.js";
import { PromptInspector } from "../prompt/PromptInspector.js";
import { HygieneFindingCard } from "./HygieneFindingCard.js";
import { addKeeper, clearKeepers, keeperKey, listKeepers, removeKeeper, type RecordHygieneKeeper } from "./keepers.js";

type CompileState =
  | { status: "loading" }
  | { status: "ready"; prompt: string; metadata: RecordHygieneCompileMetadata; citations: Record<string, string> }
  | { status: "error"; message: string };

type ScratchState =
  | { status: "empty" }
  | { status: "sending" }
  | { status: "findings"; findings: readonly ParsedRecordHygieneFinding[] }
  | { status: "malformed"; raw: string }
  | { status: "error"; message: string };

export function RecordHygieneView(): React.JSX.Element {
  const [compileState, setCompileState] = useState<CompileState>({ status: "loading" });
  const [scratchState, setScratchState] = useState<ScratchState>({ status: "empty" });
  const [keepers, setKeepers] = useState<readonly RecordHygieneKeeper[]>(() => listKeepers());
  const [searchTerm, setSearchTerm] = useState("");
  const [sendConfirmed, setSendConfirmed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    void refreshPrompt();
  }, []);

  async function refreshPrompt(): Promise<void> {
    setCompileState({ status: "loading" });
    setSearchTerm("");

    try {
      const result = await recordHygieneCompile();
      if (!result.ok) {
        setCompileState({ status: "error", message: errorMessage(result) });
        return;
      }

      setCompileState({
        status: "ready",
        prompt: result.prompt,
        metadata: result.metadata,
        citations: result.citations
      });
    } catch {
      setCompileState({ status: "error", message: "Could not compile the record hygiene prompt." });
    }
  }

  async function analyze(): Promise<void> {
    setScratchState({ status: "sending" });

    try {
      const result = await recordHygieneAnalyze();
      if (result.ok) {
        if ("malformed" in result) {
          setScratchState({ status: "malformed", raw: result.raw });
          return;
        }

        setScratchState({ status: "findings", findings: result.findings });
        return;
      }

      setScratchState({ status: "error", message: errorMessage(result) });
    } catch {
      setScratchState({ status: "error", message: "Could not request record hygiene analysis." });
    }
  }

  function clearAll(): void {
    setScratchState({ status: "empty" });
    clearKeepers();
    setKeepers([]);
  }

  function keepFinding(finding: ParsedRecordHygieneFinding): void {
    setKeepers(addKeeper(finding));
  }

  function unkeepFinding(finding: RecordHygieneKeeper): void {
    setKeepers(removeKeeper(finding));
  }

  function copyText(text: string): void {
    void navigator.clipboard?.writeText(text);
  }

  const promptResult = compileState.status === "ready" ? toCompileResult(compileState.prompt, compileState.metadata) : null;

  return (
    <section className="surface previewSurface ideateSurface" aria-labelledby="record-hygiene-title">
      <div className="projectHeader">
        <p className="eyebrow">Assistance scratch</p>
        <h2 id="record-hygiene-title">Record Hygiene</h2>
      </div>

      <p className="status statusWarning ideateQuarantine" role="note">
        AI-suggested review scratch - not story state.
      </p>

      {compileState.status === "loading" ? <p className="muted" role="status">Compiling record hygiene prompt...</p> : null}
      {compileState.status === "error" ? (
        <section className="previewStack">
          <p className="status statusError" role="alert">{compileState.message}</p>
          <button type="button" onClick={() => void refreshPrompt()}>Refresh prompt</button>
        </section>
      ) : null}

      {compileState.status === "ready" && promptResult ? (
        <section className="previewStack">
          <section className="configPanel" aria-labelledby="hygiene-source-title">
            <h3 id="hygiene-source-title">Source Disclosure</h3>
            <p className="muted">Full active atomic story-record review. Excludes archived records, terminal records, ENTITY payloads, CAST MEMBER payloads, accepted prose, candidates, and private notes.</p>
            <dl className="metadataGrid">
              <div>
                <dt>Records</dt>
                <dd>{compileState.metadata.recordCount}</dd>
              </div>
              {Object.entries(compileState.metadata.countsByType).map(([recordType, count]) => (
                count > 0 ? (
                  <div key={recordType}>
                    <dt>{recordType}</dt>
                    <dd>{count}</dd>
                  </div>
                ) : null
              ))}
            </dl>
          </section>

          <div className="previewToolbar">
            <button type="button" className="secondaryButton" onClick={() => void refreshPrompt()}>Refresh prompt</button>
            <button type="button" className="secondaryButton" onClick={() => copyText(compileState.prompt)}>Copy prompt</button>
          </div>

          <PromptInspector result={promptResult} searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />

          <section className="configPanel" aria-labelledby="hygiene-send-title">
            <h3 id="hygiene-send-title">OpenRouter Send</h3>
            <p className="muted">Analyze sends the compiled active record payload, including hidden SECRET content, to the configured OpenRouter model.</p>
            <label className="checkboxLabel">
              <input
                type="checkbox"
                checked={sendConfirmed}
                onChange={(event) => setSendConfirmed(event.target.checked)}
              />
              Confirm this one-time send
            </label>
            <button type="button" disabled={!sendConfirmed || scratchState.status === "sending"} onClick={() => void analyze()}>
              Analyze with OpenRouter
            </button>
          </section>

          {scratchState.status === "sending" ? <p className="muted" role="status">Requesting record hygiene analysis...</p> : null}
          {scratchState.status === "error" ? <p className="status statusError" role="alert">{scratchState.message}</p> : null}

          <ScratchPanel
            state={scratchState}
            keepers={keepers}
            citationMap={compileState.citations}
            onCopy={copyText}
            onClearAll={clearAll}
            onKeepFinding={keepFinding}
            onRemoveKeeper={unkeepFinding}
            onOpenRecord={(recordId) => {
              void navigate(`/records?recordId=${encodeURIComponent(recordId)}`);
            }}
          />
        </section>
      ) : null}
    </section>
  );
}

function ScratchPanel({
  state,
  keepers,
  citationMap,
  onCopy,
  onClearAll,
  onKeepFinding,
  onRemoveKeeper,
  onOpenRecord
}: {
  state: ScratchState;
  keepers: readonly RecordHygieneKeeper[];
  citationMap: Readonly<Record<string, string>>;
  onCopy: (text: string) => void;
  onClearAll: () => void;
  onKeepFinding: (finding: ParsedRecordHygieneFinding) => void;
  onRemoveKeeper: (finding: RecordHygieneKeeper) => void;
  onOpenRecord: (recordId: string) => void;
}): React.JSX.Element {
  const keeperKeys = new Set(keepers.map(keeperKey));
  const hasOutput = state.status === "findings" || state.status === "malformed";

  return (
    <section className="ideateScratchLayout" aria-label="Record hygiene scratch">
      <section className="candidatePanel ideateScratchPanel" aria-labelledby="hygiene-scratch-title">
        <div className="candidateHeader">
          <div>
            <h3 id="hygiene-scratch-title">Review Scratch</h3>
            <p className="muted">Session scratch - not story state.</p>
          </div>
          {hasOutput ? (
            <button type="button" className="secondaryButton" onClick={onClearAll}>Clear</button>
          ) : null}
        </div>

        {state.status === "empty" || state.status === "sending" ? <p className="muted">No findings yet.</p> : null}

        {state.status === "malformed" ? (
          <div className="ideateRawScratch">
            <p className="status statusWarning" role="status">Non-canonical raw output. The response could not be parsed into hygiene findings.</p>
            <button type="button" className="secondaryButton" onClick={() => onCopy(state.raw)}>Copy raw output</button>
            <pre>{state.raw}</pre>
          </div>
        ) : null}

        {state.status === "findings" ? (
          <>
            <div className="previewToolbar">
              <button type="button" className="secondaryButton" onClick={() => onCopy(JSON.stringify(state.findings, null, 2))}>Copy findings</button>
            </div>
            <div className="slateGrid">
              {state.findings.map((finding) => (
                <HygieneFindingCard
                  key={keeperKey(finding)}
                  finding={finding}
                  citationMap={citationMap}
                  isKept={keeperKeys.has(keeperKey(finding))}
                  onKeep={onKeepFinding}
                  onOpenRecord={onOpenRecord}
                />
              ))}
            </div>
          </>
        ) : null}
      </section>
      <KeepersPanel keepers={keepers} onRemoveKeeper={onRemoveKeeper} />
    </section>
  );
}

function KeepersPanel({
  keepers,
  onRemoveKeeper
}: {
  keepers: readonly RecordHygieneKeeper[];
  onRemoveKeeper: (finding: RecordHygieneKeeper) => void;
}): React.JSX.Element {
  return (
    <aside className="candidatePanel keepersPanel" aria-labelledby="hygiene-keepers-title">
      <h3 id="hygiene-keepers-title">Keepers</h3>
      <p className="muted">Session scratch - not story state.</p>
      {keepers.length === 0 ? <p className="muted">No keepers yet.</p> : null}
      {keepers.length > 0 ? (
        <ul className="keepersList">
          {keepers.map((keeper) => (
            <li key={keeperKey(keeper)}>
              <span>{keeper.cluster}</span>
              <span className="status">{keeper.action}</span>
              <button type="button" className="secondaryButton" onClick={() => onRemoveKeeper(keeper)}>Unkeep</button>
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}

function toCompileResult(prompt: string, metadata: RecordHygieneCompileMetadata): CompileResult {
  return {
    prompt,
    metadata
  };
}

function errorMessage(result: ApiFailure | TransportFailure | RecordHygieneAnalyzeResponse | RecordHygieneCompileResponse): string {
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
      case "prompt-too-large":
        return "Compiled record hygiene prompt is too large for the selected model.";
      default:
        return result.message;
    }
  }

  if ("kind" in result && result.kind === "no-open-project") {
    return "Open a project first.";
  }

  return "message" in result ? result.message : "Record hygiene request failed.";
}
