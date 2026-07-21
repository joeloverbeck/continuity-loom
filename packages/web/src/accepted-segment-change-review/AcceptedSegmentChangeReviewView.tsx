import type {
  AcceptedSegmentChangeReviewItem,
  AcceptedSegmentChangeReviewRecordScope,
  AcceptedSegmentChangeReviewRequest,
  ConsumedGenerationGuidanceEntry
} from "@loom/core";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  acceptedSegmentChangeReviewAnalyze,
  acceptedSegmentChangeReviewCompile,
  type AcceptedSegmentChangeReviewAnalyzeResponse,
  type AcceptedSegmentChangeReviewCompileResponse
} from "../api.js";
import { isTransportFailure } from "../openrouter-transport.js";
import { presentOpenRouterFailure } from "../openrouter-failure.js";

export interface AcceptedSegmentChangeReviewClient {
  compile(request: AcceptedSegmentChangeReviewRequest): Promise<AcceptedSegmentChangeReviewCompileResponse>;
  analyze(
    request: AcceptedSegmentChangeReviewRequest & { expectedPromptFingerprint: string }
  ): Promise<AcceptedSegmentChangeReviewAnalyzeResponse>;
}

interface NavigationOptions {
  state: { acceptedSegmentChangeReviewConsumedGuidanceIds: readonly string[] };
}

export interface AcceptedSegmentChangeReviewViewProps {
  client?: AcceptedSegmentChangeReviewClient;
  onNavigate?: (target: string, options?: NavigationOptions) => void;
}

const defaultClient: AcceptedSegmentChangeReviewClient = {
  compile: acceptedSegmentChangeReviewCompile,
  analyze: acceptedSegmentChangeReviewAnalyze
};

type ReadyCompile = Extract<AcceptedSegmentChangeReviewCompileResponse, { ok: true }>;
type ValidReview = Extract<AcceptedSegmentChangeReviewAnalyzeResponse, { ok: true; review: unknown }>;

type CompileState =
  | { status: "loading" }
  | { status: "ready"; result: ReadyCompile }
  | { status: "error"; message: string };

type ReviewState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "success"; result: ValidReview }
  | { status: "quarantined"; reasonCode: string; summary: string }
  | { status: "stale"; message: string }
  | { status: "incompatibleModel"; message: string; recovery: string }
  | { status: "provider"; message: string }
  | { status: "oversize"; message: string }
  | { status: "local"; message: string };

export function AcceptedSegmentChangeReviewView({
  client = defaultClient,
  onNavigate
}: AcceptedSegmentChangeReviewViewProps = {}): React.JSX.Element {
  const routerNavigate = useNavigate();
  const [recordScope, setRecordScope] = useState<AcceptedSegmentChangeReviewRecordScope>("active_working_set");
  const [compileState, setCompileState] = useState<CompileState>({ status: "loading" });
  const [reviewState, setReviewState] = useState<ReviewState>({ status: "idle" });
  const [sendConfirmed, setSendConfirmed] = useState(false);
  const [kept, setKept] = useState<ReadonlySet<string>>(() => new Set());
  const [reviewed, setReviewed] = useState<ReadonlySet<string>>(() => new Set());
  const [selectedGuidance, setSelectedGuidance] = useState<ReadonlySet<string>>(() => new Set());
  const sourceIdentity = useRef(0);

  useEffect(() => {
    const identity = sourceIdentity.current + 1;
    sourceIdentity.current = identity;
    let active = true;
    setCompileState({ status: "loading" });
    clearReviewState();

    void client.compile(requestFor(recordScope))
      .then((result) => {
        if (!active) {
          return;
        }
        if (result.ok) {
          setCompileState({ status: "ready", result });
        } else {
          setCompileState({ status: "error", message: result.message });
        }
      })
      .catch(() => {
        if (active) {
          setCompileState({ status: "error", message: "Could not compile the complete local review source." });
        }
      });

    return () => {
      active = false;
      if (sourceIdentity.current === identity) {
        sourceIdentity.current += 1;
      }
    };
  }, [client, recordScope]);

  function clearReviewState(): void {
    setReviewState({ status: "idle" });
    setSendConfirmed(false);
    setKept(new Set());
    setReviewed(new Set());
    setSelectedGuidance(new Set());
  }

  async function analyze(): Promise<void> {
    if (compileState.status !== "ready") {
      return;
    }

    setSendConfirmed(false);
    setReviewState({ status: "sending" });
    const identity = sourceIdentity.current;
    const inspectedRequest = requestFor(compileState.result.disclosure.recordScope);
    const inspectedFingerprint = compileState.result.disclosure.fingerprint;

    try {
      const result = await client.analyze({
        ...inspectedRequest,
        expectedPromptFingerprint: inspectedFingerprint
      });

      if (identity !== sourceIdentity.current) {
        return;
      }

      if (result.ok) {
        if ("quarantined" in result) {
          setReviewState({
            status: "quarantined",
            reasonCode: result.reasonCode,
            summary: result.summary
          });
        } else {
          setReviewState({ status: "success", result });
        }
        return;
      }

      if (isTransportFailure(result)) {
        if (
          result.category === "structured-output-incompatible-model" ||
          result.category === "structured-output-capability-unknown"
        ) {
          setReviewState({
            status: "incompatibleModel",
            message: result.message,
            recovery: result.recovery ?? presentOpenRouterFailure(result)
          });
          return;
        }
        setReviewState({ status: "provider", message: presentOpenRouterFailure(result) });
        return;
      }

      if (result.kind === "accepted-segment-change-review-source-changed") {
        setReviewState({ status: "stale", message: result.message });
        return;
      }

      if (result.kind === "accepted-segment-change-review-prompt-too-large") {
        setReviewState({ status: "oversize", message: result.message });
        return;
      }

      setReviewState({ status: "local", message: result.message });
    } catch {
      setReviewState({
        status: "local",
        message: "The local Analyze request failed. Inspect the source and try again manually. No retry is automatic."
      });
    }
  }

  function navigate(target: string, options?: NavigationOptions): void {
    if (onNavigate) {
      if (options) {
        onNavigate(target, options);
      } else {
        onNavigate(target);
      }
      return;
    }
    void routerNavigate(target, options);
  }

  function toggle(setter: React.Dispatch<React.SetStateAction<ReadonlySet<string>>>, id: string): void {
    setter((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <section className="surface previewSurface" aria-labelledby="accepted-segment-change-review-title">
      <div className="projectHeader">
        <div>
          <p className="eyebrow">Comparison candidate</p>
          <h2 id="accepted-segment-change-review-title">Accepted-Segment Change Review</h2>
        </div>
      </div>
      <p className="status statusWarning" role="note">
        Unverified, noncanonical advice. Accepted prose is bounded evidence, never canon or prose-prompt authority.
      </p>

      {compileState.status === "loading" ? <p role="status">Compiling complete local source...</p> : null}
      {compileState.status === "error" ? (
        <section aria-labelledby="change-review-local-compile-error">
          <h3 id="change-review-local-compile-error">Local request failed</h3>
          <p className="status statusError" role="alert">{compileState.message}</p>
          <p>No provider call was made. Change scope or reopen the comparison harness to retry manually.</p>
        </section>
      ) : null}

      {compileState.status === "ready" ? (
        <>
          <SourcePanel
            result={compileState.result}
            recordScope={recordScope}
            sendConfirmed={sendConfirmed}
            sending={reviewState.status === "sending"}
            onScopeChange={setRecordScope}
            onConfirm={setSendConfirmed}
            onAnalyze={() => void analyze()}
          />
          <ReviewPanel
            state={reviewState}
            compile={compileState.result}
            kept={kept}
            reviewed={reviewed}
            onToggleKept={(id) => toggle(setKept, id)}
            onToggleReviewed={(id) => toggle(setReviewed, id)}
            onCopy={(item) => void navigator.clipboard?.writeText(formatItemForCopy(item))}
            onCitation={(citation) => navigate(citationTarget(
              citation,
              compileState.result.citations,
              compileState.result.disclosure.acceptedSegmentSequence
            ))}
            onClear={clearReviewState}
          />
          <ConsumedGuidancePanel
            entries={compileState.result.consumedGuidance}
            selected={selectedGuidance}
            onToggle={(id) => toggle(setSelectedGuidance, id)}
            onOpen={() => navigate("/generation-brief", {
              state: { acceptedSegmentChangeReviewConsumedGuidanceIds: [...selectedGuidance] }
            })}
          />
        </>
      ) : null}
    </section>
  );
}

function SourcePanel({
  result,
  recordScope,
  sendConfirmed,
  sending,
  onScopeChange,
  onConfirm,
  onAnalyze
}: {
  result: ReadyCompile;
  recordScope: AcceptedSegmentChangeReviewRecordScope;
  sendConfirmed: boolean;
  sending: boolean;
  onScopeChange: (scope: AcceptedSegmentChangeReviewRecordScope) => void;
  onConfirm: (confirmed: boolean) => void;
  onAnalyze: () => void;
}): React.JSX.Element {
  const disclosure = result.disclosure;
  return (
    <section className="configPanel" aria-labelledby="change-review-source-title">
      <h3 id="change-review-source-title">Complete source disclosure</h3>
      <p>Latest accepted segment {disclosure.acceptedSegmentSequence}</p>
      <p>Accepted {disclosure.acceptedSegmentAcceptedAt}</p>
      <fieldset aria-label="Record scope">
        <legend>Record scope</legend>
        <label>
          <input
            type="radio"
            name="accepted-segment-change-review-scope"
            disabled={sending}
            checked={recordScope === "active_working_set"}
            onChange={() => onScopeChange("active_working_set")}
          />
          Active Working Set
        </label>
        <label>
          <input
            type="radio"
            name="accepted-segment-change-review-scope"
            disabled={sending}
            checked={recordScope === "whole_project"}
            onChange={() => onScopeChange("whole_project")}
          />
          Whole Project
        </label>
      </fieldset>
      <p>{disclosure.fullRecordCount} records</p>
      <p>{disclosure.includesSecrets ? "SECRET records are included and will be sent after confirmation." : "No SECRET records are included."}</p>
      <dl className="metadataGrid">
        {Object.entries(disclosure.countsByType).map(([type, count]) => (
          <div key={type}><dt>{type}</dt><dd>{count}</dd></div>
        ))}
        <div><dt>Prompt characters</dt><dd>{disclosure.promptLength}</dd></div>
        <div><dt>Token estimate</dt><dd>{disclosure.tokenEstimate}</dd></div>
        <div><dt>Fingerprint</dt><dd>{disclosure.fingerprint}</dd></div>
        <div><dt>Versions</dt><dd>{disclosure.versions.template} / {disclosure.versions.compiler} / {disclosure.versions.contract}</dd></div>
      </dl>
      <details open>
        <summary>Complete prompt source</summary>
        <pre>{result.prompt}</pre>
      </details>
      <label className="checkboxLabel">
        <input
          type="checkbox"
          disabled={sending}
          checked={sendConfirmed}
          onChange={(event) => onConfirm(event.target.checked)}
        />
        I inspected the complete source and confirm this one-time send
      </label>
      <button type="button" disabled={!sendConfirmed || sending} onClick={onAnalyze}>Analyze with OpenRouter</button>
    </section>
  );
}

function ReviewPanel({
  state,
  compile,
  kept,
  reviewed,
  onToggleKept,
  onToggleReviewed,
  onCopy,
  onCitation,
  onClear
}: {
  state: ReviewState;
  compile: ReadyCompile;
  kept: ReadonlySet<string>;
  reviewed: ReadonlySet<string>;
  onToggleKept: (id: string) => void;
  onToggleReviewed: (id: string) => void;
  onCopy: (item: AcceptedSegmentChangeReviewItem) => void;
  onCitation: (citation: string) => void;
  onClear: () => void;
}): React.JSX.Element {
  const hasScratch = state.status !== "idle" && state.status !== "sending";
  return (
    <section className="candidatePanel" aria-labelledby="change-review-output-title">
      <div className="candidateHeader">
        <h3 id="change-review-output-title">Review scratch</h3>
        {hasScratch ? <button type="button" onClick={onClear}>Clear review scratch</button> : null}
      </div>
      {state.status === "idle" ? <p>No review output yet.</p> : null}
      {state.status === "sending" ? <p role="status">Requesting one review from OpenRouter...</p> : null}
      {state.status === "quarantined" ? (
        <Recovery title="Quarantined response" message={`${state.reasonCode}: ${state.summary}`} guidance="Inspect the complete source and response classification, then explicitly Analyze again. No repair or retry is automatic." />
      ) : null}
      {state.status === "stale" ? (
        <Recovery title="Source changed" message={state.message} guidance="Refresh the source manually before another explicit Analyze. No retry is automatic." />
      ) : null}
      {state.status === "incompatibleModel" ? (
        <Recovery title="Strict structured output unavailable" message={state.message} guidance={state.recovery} />
      ) : null}
      {state.status === "provider" ? (
        <Recovery title="OpenRouter request failed" message={state.message} guidance="No result was kept or written." />
      ) : null}
      {state.status === "oversize" ? (
        <Recovery title="Complete source is too large" message={state.message} guidance="Use Active Working Set or a compatible model. Nothing was trimmed." />
      ) : null}
      {state.status === "local" ? (
        <Recovery title="Local request failed" message={state.message} guidance="Inspect local project state and retry manually. No provider fallback or automatic retry is used." />
      ) : null}
      {state.status === "success" ? (
        <>
          {state.result.review.items.length === 0 ? (
            <Recovery
              title="Unverified no-change result"
              message="No change items were returned. Six reasoned coverage rows are present, but this is not proof that canonical state is current."
              guidance="Manually compare the accepted segment and current state before continuing."
            />
          ) : (
            <div className="slateGrid">
              {state.result.review.items.map((item) => (
                <ChangeCard
                  key={item.id}
                  item={item}
                  kept={kept.has(item.id)}
                  reviewed={reviewed.has(item.id)}
                  onToggleKept={() => onToggleKept(item.id)}
                  onToggleReviewed={() => onToggleReviewed(item.id)}
                  onCopy={() => onCopy(item)}
                  onCitation={onCitation}
                />
              ))}
            </div>
          )}
          <CoverageTable rows={state.result.review.coverage} />
          <section aria-labelledby="retention-guidance-title">
            <h4 id="retention-guidance-title">Retention guidance</h4>
            <ul>
              <li>Use an EVENT only when the change is independently reusable as an event; do not create an EVENT for every accepted segment.</li>
              <li>Use a FACT for independently reusable truth, or a typed current-state or pressure record when that existing record kind owns the change.</li>
              <li>An immediate handoff belongs only in the next Generation Brief and should not become durable canon by default.</li>
              <li>Incidental texture needs no storage and should leave no canonical trace.</li>
              <li>Author decision required: inspect the evidence before choosing any destination.</li>
            </ul>
          </section>
          <p>Trusted source fingerprint: {compile.disclosure.fingerprint}</p>
        </>
      ) : null}
    </section>
  );
}

function ChangeCard({
  item,
  kept,
  reviewed,
  onToggleKept,
  onToggleReviewed,
  onCopy,
  onCitation
}: {
  item: AcceptedSegmentChangeReviewItem;
  kept: boolean;
  reviewed: boolean;
  onToggleKept: () => void;
  onToggleReviewed: () => void;
  onCopy: () => void;
  onCitation: (citation: string) => void;
}): React.JSX.Element {
  return (
    <article className="candidateCard" aria-labelledby={`change-review-item-${item.id}`}>
      <h4 id={`change-review-item-${item.id}`}>Possible change {item.id}</h4>
      <p>{item.changeStatement}</p>
      <dl>
        <dt>Epistemic status</dt><dd>{item.epistemicStatus}</dd>
        <dt>Retention horizon</dt><dd>{item.retentionHorizon}</dd>
        <dt>Likely destinations</dt><dd>{item.affectedTargetHints.join(", ")}</dd>
        <dt>Uncertainty or rival reading</dt><dd>{item.uncertaintyOrRivalReading}</dd>
      </dl>
      <div>
        <p>Evidence citations</p>
        <div className="previewToolbar">
          {item.evidence.map((citation) => (
            <button key={citation} type="button" onClick={() => onCitation(citation)}>
              Open evidence {citation} for {item.id}
            </button>
          ))}
        </div>
        <p>Contrast citations</p>
        <div className="previewToolbar">
          {item.contrast.map((citation) => (
            <button key={citation} type="button" onClick={() => onCitation(citation)}>
              Open contrast {citation} for {item.id}
            </button>
          ))}
        </div>
      </div>
      <p>Unverified, noncanonical advice. Independently author any real change in its normal editor.</p>
      <div className="previewToolbar">
        <button type="button" onClick={onToggleKept}>{kept ? `Unkeep ${item.id}` : `Keep ${item.id}`}</button>
        <button type="button" onClick={onToggleReviewed}>{reviewed ? `Mark ${item.id} unreviewed` : `Mark ${item.id} reviewed`}</button>
        <button type="button" onClick={onCopy}>Copy {item.id}</button>
      </div>
      {kept ? <p>Kept for this session</p> : null}
      {reviewed ? <p>Reviewed for this session</p> : null}
    </article>
  );
}

function CoverageTable({ rows }: { rows: ValidReview["review"]["coverage"] }): React.JSX.Element {
  return (
    <section aria-labelledby="change-review-coverage-title">
      <h4 id="change-review-coverage-title">Six-dimension coverage</h4>
      <table>
        <thead><tr><th>Dimension</th><th>Status</th><th>Reason</th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.dimension}><th scope="row">{row.dimension}</th><td>{row.status}</td><td>{row.reason}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ConsumedGuidancePanel({
  entries,
  selected,
  onToggle,
  onOpen
}: {
  entries: readonly ConsumedGenerationGuidanceEntry[];
  selected: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onOpen: () => void;
}): React.JSX.Element {
  return (
    <section className="configPanel" aria-labelledby="consumed-guidance-title">
      <h3 id="consumed-guidance-title">Consumed guidance check</h3>
      <p>This deterministic list does not infer what the accepted prose consumed. Nothing is preselected.</p>
      {entries.length === 0 ? <p>No nonblank allowlisted guidance is present.</p> : null}
      {entries.map((entry) => (
        <label key={entry.id} className="checkboxLabel">
          <input
            type="checkbox"
            aria-label={`Consumed guidance: ${entry.value}`}
            checked={selected.has(entry.id)}
            onChange={() => onToggle(entry.id)}
          />
          <span><strong>{entry.fieldPath}</strong>: {entry.value}</span>
        </label>
      ))}
      <button type="button" disabled={selected.size === 0} onClick={onOpen}>
        Open Generation Brief with selected removals
      </button>
      <p>The handoff changes only the editable draft. Save Generation Brief remains the sole project-store mutation.</p>
    </section>
  );
}

function Recovery({ title, message, guidance }: { title: string; message: string; guidance: string }): React.JSX.Element {
  const id = `change-review-recovery-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <section className="status statusWarning" role="alert" aria-labelledby={id}>
      <h4 id={id}>{title}</h4>
      <p>{message}</p>
      <p>{guidance}</p>
    </section>
  );
}

function requestFor(recordScope: AcceptedSegmentChangeReviewRecordScope): AcceptedSegmentChangeReviewRequest {
  return { segmentSelection: "latest", recordScope };
}

function citationTarget(
  citation: string,
  citations: Readonly<Record<string, string>>,
  acceptedSegmentSequence: number
): string {
  if (citation.startsWith("[SEG-") && citation.endsWith("]")) {
    return `/accepted-segments#segment-${acceptedSegmentSequence}`;
  }
  if (citation.startsWith("[BRIEF:") && citation.endsWith("]")) {
    return `/generation-brief?field=${encodeURIComponent(citation.slice(7, -1))}`;
  }
  const recordId = citations[citation];
  return recordId ? `/records?recordId=${encodeURIComponent(recordId)}` : "/records";
}

function formatItemForCopy(item: AcceptedSegmentChangeReviewItem): string {
  return [
    item.changeStatement,
    `Epistemic status: ${item.epistemicStatus}`,
    `Retention horizon: ${item.retentionHorizon}`,
    `Evidence: ${item.evidence.join(", ")}`,
    `Contrast: ${item.contrast.join(", ")}`,
    `Likely destinations: ${item.affectedTargetHints.join(", ")}`,
    `Uncertainty: ${item.uncertaintyOrRivalReading}`
  ].join("\n");
}
