import type { CompileResult, SegmentReconciliationRequest, SegmentReconciliationParsedOutput } from "@loom/core";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getProject,
  segmentReconciliationAnalyze,
  segmentReconciliationCompile,
  type ApiFailure,
  type SegmentReconciliationAnalyzeResponse,
  type SegmentReconciliationCompileMetadata,
  type SegmentReconciliationCompileResponse,
  type SegmentReconciliationDisclosure,
  type SegmentReconciliationSourceMetadata,
  type TransportFailure
} from "../api.js";
import { PromptInspector } from "../prompt/PromptInspector.js";
import { ReconciliationProposalCard, type ReconciliationProposal } from "./ReconciliationProposalCard.js";
import {
  addKeeper,
  clearKeepers,
  keeperKey,
  keeperScope,
  listKeepers,
  removeKeeper,
  type SegmentReconciliationKeeper
} from "./keepers.js";

type CompileState =
  | { status: "loading" }
  | {
      status: "ready";
      prompt: string;
      metadata: SegmentReconciliationCompileMetadata;
      citations: Record<string, string>;
      disclosure: SegmentReconciliationDisclosure;
      source: SegmentReconciliationSourceMetadata;
      keeperScope: string;
    }
  | { status: "error"; message: string };

type ScratchState =
  | { status: "empty" }
  | { status: "sending" }
  | { status: "proposals"; proposals: SegmentReconciliationParsedOutput }
  | { status: "malformed"; reasonCode: string; summary: string; raw: string }
  | { status: "stale"; message: string }
  | { status: "error"; message: string };

export function SegmentReconciliationView(): React.JSX.Element {
  const [recordScope, setRecordScope] = useState<SegmentReconciliationRequest["recordScope"]>("active_working_set");
  const [compileState, setCompileState] = useState<CompileState>({ status: "loading" });
  const [scratchState, setScratchState] = useState<ScratchState>({ status: "empty" });
  const [keepers, setKeepers] = useState<readonly SegmentReconciliationKeeper[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sendConfirmed, setSendConfirmed] = useState(false);
  const [projectKey, setProjectKey] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    void getProject()
      .then((project) => {
        if (!active) {
          return;
        }

        setProjectKey("folderPath" in project && typeof project.folderPath === "string" ? project.folderPath : "unknown-project");
      })
      .catch(() => {
        if (active) {
          setProjectKey("unknown-project");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (projectKey !== null) {
      void refreshPrompt();
    }
  }, [recordScope, projectKey]);

  async function refreshPrompt(): Promise<void> {
    if (projectKey === null) {
      return;
    }

    setCompileState({ status: "loading" });
    setScratchState({ status: "empty" });
    setSearchTerm("");
    setSendConfirmed(false);

    const request = requestFor(recordScope);

    try {
      const result = await segmentReconciliationCompile(request);
      if (!result.ok) {
        setCompileState({ status: "error", message: errorMessage(result) });
        return;
      }

      const scope = keeperScope(projectKey, result.metadata.fingerprint);
      setCompileState({
        status: "ready",
        prompt: result.prompt,
        metadata: result.metadata,
        citations: result.citations,
        disclosure: result.disclosure,
        source: result.source,
        keeperScope: scope
      });
      setKeepers(listKeepers(scope));
    } catch {
      setCompileState({ status: "error", message: "Could not compile the segment reconciliation prompt." });
    }
  }

  async function analyze(): Promise<void> {
    if (compileState.status !== "ready") {
      return;
    }

    setSendConfirmed(false);
    setScratchState({ status: "sending" });

    try {
      const result = await segmentReconciliationAnalyze({
        ...requestFor(recordScope),
        expectedPromptFingerprint: compileState.metadata.fingerprint
      });
      if (result.ok) {
        if ("malformed" in result) {
          setScratchState({
            status: "malformed",
            reasonCode: result.reasonCode,
            summary: result.summary,
            raw: result.raw
          });
          return;
        }

        setScratchState({ status: "proposals", proposals: result.proposals });
        return;
      }

      if ("kind" in result && result.kind === "reconciliation-source-changed") {
        setScratchState({ status: "stale", message: result.message });
        return;
      }

      setScratchState({ status: "error", message: errorMessage(result) });
    } catch {
      setScratchState({ status: "error", message: "Could not request segment reconciliation analysis." });
    }
  }

  function changeScope(nextScope: SegmentReconciliationRequest["recordScope"]): void {
    setRecordScope(nextScope);
    setScratchState({ status: "empty" });
    setKeepers([]);
  }

  function clearAll(): void {
    if (compileState.status === "ready") {
      clearKeepers(compileState.keeperScope);
    }
    setKeepers([]);
    setScratchState({ status: "empty" });
  }

  function keepProposal(keeper: SegmentReconciliationKeeper): void {
    if (compileState.status === "ready") {
      setKeepers(addKeeper(compileState.keeperScope, keeper));
    }
  }

  function unkeepProposal(keeper: SegmentReconciliationKeeper): void {
    if (compileState.status === "ready") {
      setKeepers(removeKeeper(compileState.keeperScope, keeper));
    }
  }

  function copyText(text: string): void {
    void navigator.clipboard?.writeText(text);
  }

  const promptResult = compileState.status === "ready" ? toCompileResult(compileState.prompt, compileState.metadata) : null;

  return (
    <section className="surface previewSurface ideateSurface" aria-labelledby="segment-reconciliation-title">
      <div className="projectHeader">
        <p className="eyebrow">Assistance scratch</p>
        <h2 id="segment-reconciliation-title">Segment Reconciliation</h2>
      </div>

      <p className="status statusWarning ideateQuarantine" role="note">
        AI-suggested review scratch - not story state.
      </p>

      {compileState.status === "loading" ? <p className="muted" role="status">Compiling segment reconciliation prompt...</p> : null}
      {compileState.status === "error" ? (
        <section className="previewStack">
          <p className="status statusError" role="alert">{compileState.message}</p>
          <button type="button" onClick={() => void refreshPrompt()}>Refresh prompt</button>
        </section>
      ) : null}

      {compileState.status === "ready" && promptResult ? (
        <section className="previewStack">
          <section className="configPanel" aria-labelledby="reconciliation-source-title">
            <h3 id="reconciliation-source-title">Source Disclosure</h3>
            <p className="muted">
              Latest accepted segment {compileState.disclosure.acceptedSegment.sequence}, {compileState.disclosure.acceptedSegment.spanCount} span(s), accepted at {compileState.disclosure.acceptedSegment.acceptedAt}.
            </p>
            <fieldset className="hygieneScopeControl" aria-label="Record scope">
              <legend>Record scope</legend>
              <label>
                <input
                  type="radio"
                  name="segment-reconciliation-scope"
                  value="active_working_set"
                  checked={recordScope === "active_working_set"}
                  onChange={() => changeScope("active_working_set")}
                />
                Active working set
              </label>
              <label>
                <input
                  type="radio"
                  name="segment-reconciliation-scope"
                  value="whole_project"
                  checked={recordScope === "whole_project"}
                  onChange={() => changeScope("whole_project")}
                />
                Whole project
              </label>
            </fieldset>
            <p className="muted">Active scope: {recordScope === "active_working_set" ? "Active working set" : "Whole project"}. The server rebuilds source from stored project data before send.</p>
            {hasSecretRecords(compileState.metadata) ? (
              <p className="status statusWarning" role="status">Secret exposure warning: this source includes SECRET records that will be sent to OpenRouter after confirmation.</p>
            ) : null}
            <dl className="metadataGrid">
              <div>
                <dt>Records</dt>
                <dd>{compileState.disclosure.recordCount}</dd>
              </div>
              <div>
                <dt>Reference stubs</dt>
                <dd>{compileState.disclosure.referenceStubCount}</dd>
              </div>
              <div>
                <dt>Brief fields</dt>
                <dd>{compileState.disclosure.briefFieldCount}</dd>
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

          <section className="configPanel" aria-labelledby="reconciliation-send-title">
            <h3 id="reconciliation-send-title">OpenRouter Send</h3>
            <p className="muted">Analyze sends the inspected prompt once under the strict segment-reconciliation output policy.</p>
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

          {scratchState.status === "sending" ? <p className="muted" role="status">Requesting segment reconciliation analysis...</p> : null}
          {scratchState.status === "error" ? <p className="status statusError" role="alert">{scratchState.message}</p> : null}
          {scratchState.status === "stale" ? (
            <p className="status statusWarning" role="alert">{scratchState.message}</p>
          ) : null}

          <ScratchPanel
            state={scratchState}
            keepers={keepers}
            onCopy={copyText}
            onClearAll={clearAll}
            onKeepProposal={keepProposal}
            onRemoveKeeper={unkeepProposal}
            onOpenRecord={(recordId) => {
              void navigate(`/records?recordId=${encodeURIComponent(recordId)}`);
            }}
            onOpenBrief={() => {
              void navigate("/generation-brief");
            }}
            onOpenBlankRecordEditor={(recordType) => {
              void navigate(`/records?create=${encodeURIComponent(recordType)}`);
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
  onCopy,
  onClearAll,
  onKeepProposal,
  onRemoveKeeper,
  onOpenRecord,
  onOpenBrief,
  onOpenBlankRecordEditor
}: {
  state: ScratchState;
  keepers: readonly SegmentReconciliationKeeper[];
  onCopy: (text: string) => void;
  onClearAll: () => void;
  onKeepProposal: (keeper: SegmentReconciliationKeeper) => void;
  onRemoveKeeper: (keeper: SegmentReconciliationKeeper) => void;
  onOpenRecord: (recordId: string) => void;
  onOpenBrief: () => void;
  onOpenBlankRecordEditor: (recordType: string) => void;
}): React.JSX.Element {
  const keeperKeys = new Set(keepers.map(keeperKey));
  const hasOutput = state.status === "proposals" || state.status === "malformed";

  return (
    <section className="ideateScratchLayout" aria-label="Segment reconciliation scratch">
      <section className="candidatePanel ideateScratchPanel" aria-labelledby="reconciliation-scratch-title">
        <div className="candidateHeader">
          <div>
            <h3 id="reconciliation-scratch-title">Review Scratch</h3>
            <p className="muted">Session scratch - not story state.</p>
          </div>
          {hasOutput ? (
            <button type="button" className="secondaryButton" onClick={onClearAll}>Clear</button>
          ) : null}
        </div>

        {state.status === "empty" || state.status === "sending" || state.status === "stale" ? <p className="muted">No proposals yet.</p> : null}

        {state.status === "malformed" ? (
          <div className="ideateRawScratch">
            <p className="status statusWarning" role="status">Malformed segment reconciliation output: {state.reasonCode}</p>
            <p className="muted">{state.summary}</p>
            <button type="button" className="secondaryButton" onClick={() => onCopy(state.raw)}>Copy raw output</button>
            <details>
              <summary>Raw output</summary>
              <pre>{state.raw}</pre>
            </details>
          </div>
        ) : null}

        {state.status === "proposals" ? (
          <ProposalGroups
            proposals={state.proposals}
            keeperKeys={keeperKeys}
            onCopy={onCopy}
            onKeepProposal={onKeepProposal}
            onOpenRecord={onOpenRecord}
            onOpenBrief={onOpenBrief}
            onOpenBlankRecordEditor={onOpenBlankRecordEditor}
          />
        ) : null}
      </section>
      <KeepersPanel keepers={keepers} onRemoveKeeper={onRemoveKeeper} />
    </section>
  );
}

function ProposalGroups({
  proposals,
  keeperKeys,
  onCopy,
  onKeepProposal,
  onOpenRecord,
  onOpenBrief,
  onOpenBlankRecordEditor
}: {
  proposals: SegmentReconciliationParsedOutput;
  keeperKeys: ReadonlySet<string>;
  onCopy: (text: string) => void;
  onKeepProposal: (keeper: SegmentReconciliationKeeper) => void;
  onOpenRecord: (recordId: string) => void;
  onOpenBrief: () => void;
  onOpenBlankRecordEditor: (recordType: string) => void;
}): React.JSX.Element {
  const groups: Array<{ title: string; items: ReconciliationProposal[] }> = [
    { title: "Generation Brief", items: proposals.briefProposals.map((proposal) => ({ kind: "brief", proposal })) },
    { title: "Existing Records", items: proposals.recordChangeProposals.map((proposal) => ({ kind: "record-change", proposal })) },
    { title: "New Records", items: proposals.recordCreationProposals.map((proposal) => ({ kind: "record-creation", proposal })) }
  ];
  const allGroupsEmpty = groups.every((group) => group.items.length === 0);

  return (
    <>
      {allGroupsEmpty ? (
        <section
          className="status statusWarning reconciliationEmptyWarning"
          role="alert"
          aria-labelledby="reconciliation-empty-warning-title"
        >
          <h4 id="reconciliation-empty-warning-title">Unverified no-change result</h4>
          <p>
            No proposals were returned, but Continuity Loom cannot verify that the analysis found every durable change.
            Please manually compare the accepted segment with the Generation Brief and existing records.
          </p>
          <p>
            Assistance remains advisory: accepted prose is evidence, not canon. This result writes no project data and
            does not acknowledge the durable-change reminder.
          </p>
          <p>
            To retry, confirm the one-time send again and choose Analyze with OpenRouter. No retry happens automatically.
          </p>
        </section>
      ) : null}
      <div className="previewToolbar">
        <button type="button" className="secondaryButton" onClick={() => onCopy(JSON.stringify(proposals, null, 2))}>Copy proposals</button>
      </div>
      {groups.map((group) => (
        <section key={group.title} aria-labelledby={`reconciliation-group-${group.title.replace(/\s+/g, "-").toLowerCase()}`}>
          <h3 id={`reconciliation-group-${group.title.replace(/\s+/g, "-").toLowerCase()}`}>{group.title}</h3>
          {group.items.length === 0 ? <p className="muted">No proposals in this group.</p> : null}
          <div className="slateGrid">
            {group.items.map((item) => (
              <ReconciliationProposalCard
                key={keeperKey(item)}
                item={item}
                isKept={keeperKeys.has(keeperKey(item))}
                onKeep={onKeepProposal}
                onCopy={onCopy}
                onOpenRecord={onOpenRecord}
                onOpenBrief={onOpenBrief}
                onOpenBlankRecordEditor={onOpenBlankRecordEditor}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function KeepersPanel({
  keepers,
  onRemoveKeeper
}: {
  keepers: readonly SegmentReconciliationKeeper[];
  onRemoveKeeper: (keeper: SegmentReconciliationKeeper) => void;
}): React.JSX.Element {
  return (
    <aside className="candidatePanel keepersPanel" aria-labelledby="reconciliation-keepers-title">
      <h3 id="reconciliation-keepers-title">Keepers</h3>
      <p className="muted">Session scratch - not story state.</p>
      {keepers.length === 0 ? <p className="muted">No keepers yet.</p> : null}
      {keepers.length > 0 ? (
        <ul className="keepersList">
          {keepers.map((keeper) => (
            <li key={keeperKey(keeper)}>
              <span>{keeper.proposal.id}</span>
              <span className="status">{keeper.kind}</span>
              <button type="button" className="secondaryButton" onClick={() => onRemoveKeeper(keeper)}>Unkeep</button>
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}

function requestFor(recordScope: SegmentReconciliationRequest["recordScope"]): SegmentReconciliationRequest {
  return { segmentSelection: "latest", recordScope };
}

function toCompileResult(prompt: string, metadata: SegmentReconciliationCompileMetadata): CompileResult {
  return {
    prompt,
    metadata
  };
}

function hasSecretRecords(metadata: SegmentReconciliationCompileMetadata): boolean {
  return (metadata.countsByType.SECRET ?? 0) > 0;
}

function errorMessage(
  result: ApiFailure | TransportFailure | SegmentReconciliationAnalyzeResponse | SegmentReconciliationCompileResponse
): string {
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
      case "segment-reconciliation-prompt-too-large":
        return "Compiled segment reconciliation prompt is too large for the selected model.";
      default:
        return result.message;
    }
  }

  if ("kind" in result && result.kind === "no-open-project") {
    return "Open a project first.";
  }

  if ("kind" in result && result.kind === "no-accepted-segment") {
    return "Accept a segment before reconciling.";
  }

  return "message" in result ? result.message : "Segment reconciliation request failed.";
}
