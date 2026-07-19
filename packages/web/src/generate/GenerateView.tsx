import type { CompileResult, GenerationReadiness, ReadinessDiagnostic } from "@loom/core";
import { useEffect, useRef, useState } from "react";
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

interface PromptSourceContext {
  fingerprint: string;
  versions: CompileResult["metadata"]["versions"];
}

type CandidateDraftSource =
  | { source: "openrouter"; generationMetadata: GenerationMetadata }
  | { source: "user_supplied" };

interface CandidateCommon {
  status: "candidate";
  text: string;
  sourceContext: PromptSourceContext;
  acceptStatus: "idle" | "accepting";
  acceptError?: string | undefined;
  replacementStatus: "idle" | "sending";
  replacementError?: string | undefined;
}

type Candidate = CandidateCommon & CandidateDraftSource;

type CandidateState =
  | { status: "idle" }
  | { status: "sending" }
  | Candidate
  | { status: "error"; message: string };

type PendingDiscardAction = "refresh" | "replace";

export function GenerateView(): React.JSX.Element {
  const [state, setState] = useState<GenerateSurfaceState>({ status: "loading" });
  const [candidateState, setCandidateState] = useState<CandidateState>({ status: "idle" });
  const [searchTerm, setSearchTerm] = useState("");
  const [acceptNotice, setAcceptNotice] = useState<string | null>(null);
  const [pendingDiscardAction, setPendingDiscardAction] = useState<PendingDiscardAction | null>(null);
  const { refreshReminder } = useReminderRefresh();
  const navigate = useNavigate();

  useEffect(() => {
    void refreshPrompt();
  }, []);

  async function refreshPrompt(options: { preserveAcceptNotice?: boolean } = {}): Promise<void> {
    setState({ status: "loading" });
    setCandidateState({ status: "idle" });
    setPendingDiscardAction(null);
    setSearchTerm("");
    if (!options.preserveAcceptNotice) {
      setAcceptNotice(null);
    }

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
    if (state.status !== "ready" || !state.readiness.canGenerate) {
      return;
    }

    const replacedCandidate = candidateState.status === "candidate" ? candidateState : null;
    const sourceContext = promptSourceContext(state.result);
    setCandidateState(replacedCandidate
      ? updateCandidate(replacedCandidate, { replacementStatus: "sending", replacementError: undefined })
      : { status: "sending" });
    setAcceptNotice(null);

    try {
      const result = await generate({ expectedPromptFingerprint: sourceContext.fingerprint });

      if (result.ok) {
        setCandidateState({
          status: "candidate",
          text: result.candidate.text,
          source: "openrouter",
          sourceContext: { ...sourceContext, versions: result.metadata.versions },
          generationMetadata: result.metadata,
          acceptStatus: "idle",
          replacementStatus: "idle"
        });
        return;
      }

      if (isGenerateBlocked(result)) {
        setCandidateState({ status: "idle" });
        await refreshPrompt();
        return;
      }

      const message = generateErrorMessage(result);
      setCandidateState(replacedCandidate
        ? updateCandidate(replacedCandidate, { replacementStatus: "idle", replacementError: message })
        : { status: "error", message });
    } catch {
      const message = "Could not generate candidate prose.";
      setCandidateState(replacedCandidate
        ? updateCandidate(replacedCandidate, { replacementStatus: "idle", replacementError: message })
        : { status: "error", message });
    }
  }

  function requestPromptRefresh(): void {
    if (isCandidateTransitionUnavailable(candidateState, pendingDiscardAction)) {
      return;
    }

    if (hasNonWhitespaceDraft(candidateState)) {
      setPendingDiscardAction("refresh");
      return;
    }

    void refreshPrompt();
  }

  function requestGeneration(): void {
    if (isCandidateTransitionUnavailable(candidateState, pendingDiscardAction)) {
      return;
    }

    if (hasNonWhitespaceDraft(candidateState)) {
      setPendingDiscardAction("replace");
      return;
    }

    void generateCandidate();
  }

  function confirmDiscardAndContinue(): void {
    const action = pendingDiscardAction;
    setPendingDiscardAction(null);

    if (action === "refresh") {
      void refreshPrompt();
      return;
    }

    if (action === "replace") {
      void generateCandidate();
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
    if (pendingDiscardAction !== null) {
      return;
    }

    setCandidateState((current) => {
      if (current.status !== "candidate") {
        return current;
      }

      return updateCandidate(current, { text, acceptError: undefined, replacementError: undefined });
    });
  }

  function discardCandidate(): void {
    if (pendingDiscardAction !== null) {
      return;
    }

    setCandidateState({ status: "idle" });
    setPendingDiscardAction(null);
    setAcceptNotice(null);
  }

  function writeOrPasteCandidate(): void {
    if (state.status !== "ready" || isCandidateOperationPending(candidateState)) {
      return;
    }

    setCandidateState({
      status: "candidate",
      source: "user_supplied",
      text: "",
      sourceContext: promptSourceContext(state.result),
      acceptStatus: "idle",
      replacementStatus: "idle"
    });
    setAcceptNotice(null);
  }

  async function acceptCurrentCandidate(): Promise<void> {
    if (candidateState.status !== "candidate" || pendingDiscardAction !== null) {
      return;
    }

    const candidate = candidateState;
    setCandidateState(updateCandidate(candidate, { acceptStatus: "accepting", acceptError: undefined }));

    try {
      const result = await acceptCandidate({
        text: candidate.text,
        generationMetadata: candidate.source === "openrouter"
          ? { source: "openrouter", ...candidate.generationMetadata }
          : { source: "user_supplied", versions: candidate.sourceContext.versions }
      });

      if (result.ok) {
        setCandidateState({ status: "idle" });
        setPendingDiscardAction(null);
        setAcceptNotice(`Accepted as segment ${result.segment.sequence}.`);
        refreshReminder();
        await refreshPrompt({ preserveAcceptNotice: true });
        return;
      }

      setCandidateState(updateCandidate(candidate, {
        acceptStatus: "idle",
        acceptError: errorMessage(result.kind, result.message)
      }));
    } catch {
      setCandidateState(updateCandidate(candidate, {
        acceptStatus: "idle",
        acceptError: "Could not accept candidate prose."
      }));
    }
  }

  return (
    <section className="surface previewSurface" aria-labelledby="generate-title">
      <div className="projectHeader">
        <p className="eyebrow">Candidate workflow</p>
        <h2 id="generate-title">Generate / Candidate</h2>
      </div>

      {acceptNotice && state.status !== "ready" ? (
        <p className="status statusSuccess" role="status">{acceptNotice}</p>
      ) : null}

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
          pendingDiscardAction={pendingDiscardAction}
          acceptNotice={acceptNotice}
          onSearchTermChange={setSearchTerm}
          onRefresh={requestPromptRefresh}
          onGenerate={requestGeneration}
          onWriteOrPaste={writeOrPasteCandidate}
          onCandidateTextChange={updateCandidateText}
          onDiscardCandidate={discardCandidate}
          onAcceptCandidate={() => void acceptCurrentCandidate()}
          onCancelDiscard={() => setPendingDiscardAction(null)}
          onConfirmDiscard={confirmDiscardAndContinue}
          onChecklistAction={checklistActions}
        />
      ) : null}
    </section>
  );
}

function updateCandidate(candidate: Candidate, updates: Partial<CandidateCommon>): Candidate {
  if (candidate.source === "openrouter") {
    return { ...candidate, ...updates, source: "openrouter" };
  }

  return { ...candidate, ...updates, source: "user_supplied" };
}

function hasNonWhitespaceDraft(candidate: CandidateState): candidate is Extract<CandidateState, { status: "candidate" }> {
  return candidate.status === "candidate" && candidate.text.trim().length > 0;
}

function isCandidateOperationPending(candidate: CandidateState): boolean {
  return candidate.status === "sending"
    || (candidate.status === "candidate"
      && (candidate.acceptStatus === "accepting" || candidate.replacementStatus === "sending"));
}

function isCandidateTransitionUnavailable(
  candidate: CandidateState,
  pendingDiscardAction: PendingDiscardAction | null
): boolean {
  return pendingDiscardAction !== null || isCandidateOperationPending(candidate);
}

function promptSourceContext(result: CompileResult): PromptSourceContext {
  return {
    fingerprint: result.metadata.fingerprint,
    versions: result.metadata.versions
  };
}

function ReadyGenerate({
  result,
  readiness,
  searchTerm,
  candidateState,
  pendingDiscardAction,
  acceptNotice,
  onSearchTermChange,
  onRefresh,
  onGenerate,
  onWriteOrPaste,
  onCandidateTextChange,
  onDiscardCandidate,
  onAcceptCandidate,
  onCancelDiscard,
  onConfirmDiscard,
  onChecklistAction
}: {
  result: CompileResult;
  readiness: GenerationReadiness;
  searchTerm: string;
  candidateState: CandidateState;
  pendingDiscardAction: PendingDiscardAction | null;
  acceptNotice: string | null;
  onSearchTermChange: (value: string) => void;
  onRefresh: () => void;
  onGenerate: () => void;
  onWriteOrPaste: () => void;
  onCandidateTextChange: (value: string) => void;
  onDiscardCandidate: () => void;
  onAcceptCandidate: () => void;
  onCancelDiscard: () => void;
  onConfirmDiscard: () => void;
  onChecklistAction: React.ComponentProps<typeof ReadinessChecklist>["actions"];
}): React.JSX.Element {
  const candidateTransitionUnavailable = isCandidateTransitionUnavailable(candidateState, pendingDiscardAction);
  const canGenerate = readiness.canGenerate && !candidateTransitionUnavailable;
  const showReadinessChecklist = readiness.provider.blockers.length > 0 || readiness.warnings.length > 0;
  const writeOrPasteRef = useRef<HTMLButtonElement>(null);
  const showManualEntryRecovery =
    readiness.provider.blockers.length > 0 && candidateState.status !== "candidate";

  function focusManualEntry(): void {
    const target = writeOrPasteRef.current;
    if (!target) {
      return;
    }
    target.scrollIntoView?.({ block: "center", behavior: "smooth" });
    target.focus();
  }

  return (
    <section className="previewStack">
      {showReadinessChecklist ? (
        <section className="configPanel validationPanel" aria-labelledby="generate-readiness-title">
          <h3 id="generate-readiness-title">READINESS</h3>
          {showManualEntryRecovery ? (
            <div className="providerRecovery">
              <p className="muted">Manual candidate intake is still available without a configured provider.</p>
              <button type="button" className="secondaryButton" onClick={focusManualEntry}>
                Go to Write or paste candidate
              </button>
            </div>
          ) : null}
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
          <>
            <button type="button" onClick={onGenerate} disabled={!canGenerate}>Generate</button>
            <button type="button" ref={writeOrPasteRef} onClick={onWriteOrPaste} disabled={candidateTransitionUnavailable}>Write or paste candidate</button>
          </>
        ) : null}
        <button type="button" onClick={onRefresh} disabled={candidateTransitionUnavailable}>Refresh prompt</button>
      </div>
      {candidateState.status === "sending" ? <p className="muted" role="status">Generating...</p> : null}
      {candidateState.status === "error" ? (
        <p className="status statusError" role="alert">{candidateState.message}</p>
      ) : null}
      {acceptNotice ? <p className="status statusSuccess" role="status">{acceptNotice}</p> : null}

      {pendingDiscardAction ? (
        <DiscardConfirmation
          action={pendingDiscardAction}
          candidate={candidateState.status === "candidate" ? candidateState : null}
          onCancel={onCancelDiscard}
          onConfirm={onConfirmDiscard}
        />
      ) : null}

      <PromptInspector result={result} searchTerm={searchTerm} onSearchTermChange={onSearchTermChange} />

      {candidateState.status === "candidate" ? (
        <section className="candidatePanel" aria-label="Draft candidate">
          <div className="candidateHeader">
            <div>
              <h3>Draft candidate</h3>
              <p className="muted">Draft candidate - not accepted, not canon.</p>
              <p className="muted">Source: {candidateState.source === "openrouter" ? "OpenRouter" : "User-supplied"}</p>
              <p className="muted">Inspected prompt: {candidateState.sourceContext.fingerprint}</p>
              <p className="muted">
                Template {candidateState.sourceContext.versions.template} · Compiler {candidateState.sourceContext.versions.compiler} · Contract {candidateState.sourceContext.versions.contract}
              </p>
            </div>
          </div>
          <label className="candidateEditorLabel">
            Candidate text
            <textarea
              className="candidateEditor"
              value={candidateState.text}
              onChange={(event) => onCandidateTextChange(event.target.value)}
              disabled={candidateTransitionUnavailable}
            />
          </label>
          {candidateState.acceptError ? (
            <p className="status statusError" role="alert">{candidateState.acceptError}</p>
          ) : null}
          {candidateState.replacementError ? (
            <p className="status statusError" role="alert">{candidateState.replacementError}</p>
          ) : null}
          <div className="candidateActions">
            {candidateState.source === "openrouter" ? (
              <button
                type="button"
                onClick={onGenerate}
                disabled={!readiness.canGenerate || candidateTransitionUnavailable}
              >
                Regenerate
              </button>
            ) : (
              <button
                type="button"
                onClick={onGenerate}
                disabled={!readiness.canGenerate || candidateTransitionUnavailable}
              >
                Replace with OpenRouter generation
              </button>
            )}
            <button
              type="button"
              onClick={onDiscardCandidate}
              disabled={candidateTransitionUnavailable}
            >
              Discard
            </button>
            <button
              type="button"
              onClick={onAcceptCandidate}
              disabled={candidateTransitionUnavailable || candidateState.text.trim().length === 0}
            >
              Accept
            </button>
          </div>
          {candidateState.acceptStatus === "accepting" ? <p className="muted" role="status">Accepting...</p> : null}
          {candidateState.replacementStatus === "sending" ? <p className="muted" role="status">Generating replacement...</p> : null}
        </section>
      ) : null}
    </section>
  );
}

function DiscardConfirmation({
  action,
  candidate,
  onCancel,
  onConfirm
}: {
  action: PendingDiscardAction;
  candidate: Extract<CandidateState, { status: "candidate" }> | null;
  onCancel: () => void;
  onConfirm: () => void;
}): React.JSX.Element {
  const isRefresh = action === "refresh";
  const title = isRefresh ? "Refresh prompt and discard draft?" : "Replace draft candidate?";
  const confirmLabel = isRefresh
    ? "Discard draft and refresh prompt"
    : candidate?.source === "openrouter"
      ? "Discard draft and regenerate"
      : "Discard draft and replace with OpenRouter generation";

  return (
    <section
      className="configPanel"
      role="alertdialog"
      aria-labelledby="candidate-discard-confirmation-title"
      aria-describedby="candidate-discard-confirmation-description"
    >
      <h3 id="candidate-discard-confirmation-title">{title}</h3>
      <p id="candidate-discard-confirmation-description">
        This action discards the current non-empty Draft Candidate. No accepted segment or story record is changed.
      </p>
      <div className="candidateActions">
        <button type="button" onClick={onConfirm}>{confirmLabel}</button>
        <button type="button" onClick={onCancel}>Keep draft</button>
      </div>
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
