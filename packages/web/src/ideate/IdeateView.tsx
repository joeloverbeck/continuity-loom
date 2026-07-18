import {
  ideationFocusState,
  type CompileResult,
  type GenerationReadiness,
  type IdeationRequest,
  type ReadinessDiagnostic
} from "@loom/core";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  compileIdeation,
  ideate,
  readiness,
  type ApiFailure,
  type CompileBlocked,
  type CompileResponse,
  type IdeateResponse,
  type ParsedIdeationIdea,
  type TransportFailure
} from "../api.js";
import { PromptInspector } from "../prompt/PromptInspector.js";
import { ReadinessChecklist } from "../readiness/ReadinessChecklist.js";
import { IdeateControls } from "./IdeateControls.js";
import { SlateCard } from "./SlateCard.js";
import { addKeeper, clearKeepers, keeperKey, listKeepers, removeKeeper, type IdeationKeeper } from "./keepers.js";

type IdeateSurfaceState =
  | { status: "loading" }
  | { status: "idle" }
  | { status: "ready"; result: CompileResult; readiness: GenerationReadiness; requestRevision: number }
  | { status: "blocked"; readiness: GenerationReadiness }
  | { status: "error"; kind: string; message: string };

type PreviewStatus = "compiling" | "ready" | "stale";

type ScratchState =
  | { status: "empty" }
  | { status: "sending" }
  | { status: "ideas"; ideas: readonly ParsedIdeationIdea[]; citations: Record<string, string> }
  | { status: "malformed"; raw: string }
  | { status: "error"; message: string };

const defaultIdeationRequest: IdeationRequest = {
  mode: "ideas",
  count: 5,
  dormantSlot: true,
  focus: "",
  avoidList: []
};

export function IdeateView(): React.JSX.Element {
  const [state, setState] = useState<IdeateSurfaceState>({ status: "loading" });
  const [scratchState, setScratchState] = useState<ScratchState>({ status: "empty" });
  const [ideationRequest, setIdeationRequest] = useState<IdeationRequest>(defaultIdeationRequest);
  const [requestRevision, setRequestRevision] = useState(0);
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>("compiling");
  const [keepers, setKeepers] = useState<readonly IdeationKeeper[]>(() => listKeepers());
  const [searchTerm, setSearchTerm] = useState("");
  const requestRevisionRef = useRef(0);
  const compileAttemptRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    void refreshPrompt(ideationRequest, requestRevision);
  }, [ideationRequest, requestRevision]);

  useEffect(() => () => {
    compileAttemptRef.current += 1;
  }, []);

  async function refreshPrompt(requestInput: IdeationRequest, revision: number): Promise<void> {
    const focusedRequest = normalizedIdeationRequest(requestInput);
    const focusState = ideationFocusState(requestInput.focus);
    if (focusState.error) {
      compileAttemptRef.current += 1;
      setPreviewStatus("stale");
      return;
    }

    const attempt = ++compileAttemptRef.current;
    setPreviewStatus("compiling");
    setSearchTerm("");

    try {
      const [compileResult, readinessResult] = await Promise.all([
        compileIdeation(focusedRequest),
        readiness({ promptKind: "ideation" })
      ]);

      if (attempt !== compileAttemptRef.current || revision !== requestRevisionRef.current) {
        return;
      }

      if (isReadinessFailure(readinessResult)) {
        setPreviewStatus("stale");
        setState({ status: "error", kind: readinessResult.kind, message: readinessResult.message });
        return;
      }

      if (!readinessResult.canPreview) {
        setPreviewStatus("stale");
        setState({ status: "blocked", readiness: readinessResult });
        return;
      }

      if (isFailure(compileResult)) {
        if (isValidationBlocked(compileResult)) {
          const blockedReadiness = compileResult.readiness ?? readinessResult;
          setPreviewStatus("stale");
          setState({ status: "blocked", readiness: blockedReadiness });
          return;
        }

        setPreviewStatus("stale");
        setState({ status: "error", kind: compileResult.kind, message: compileResult.message });
        return;
      }

      setState({ status: "ready", result: compileResult, readiness: readinessResult, requestRevision: revision });
      setPreviewStatus("ready");
    } catch {
      if (attempt !== compileAttemptRef.current || revision !== requestRevisionRef.current) {
        return;
      }
      setPreviewStatus("stale");
      setState({ status: "error", kind: "compile-request-failed", message: "Could not compile the ideation prompt." });
    }
  }

  function changeIdeationRequest(requestInput: IdeationRequest): void {
    compileAttemptRef.current += 1;
    const nextRevision = requestRevisionRef.current + 1;
    requestRevisionRef.current = nextRevision;
    setRequestRevision(nextRevision);
    setIdeationRequest(requestInput);
    setPreviewStatus(ideationFocusState(requestInput.focus).error ? "stale" : "compiling");
    setSearchTerm("");
  }

  async function requestIdeas(
    requestInput: IdeationRequest,
    expectedPromptFingerprint: string,
    replacementSlotNumber?: number
  ): Promise<void> {
    const sendRevision = requestRevisionRef.current;
    const previousIdeas = scratchState.status === "ideas" ? scratchState.ideas : [];
    setScratchState({ status: "sending" });

    try {
      const result = await ideate(requestInput, expectedPromptFingerprint);

      if (sendRevision !== requestRevisionRef.current) {
        setScratchState({ status: "empty" });
        return;
      }

      if (result.ok) {
        if ("malformed" in result) {
          setScratchState({ status: "malformed", raw: result.raw });
          return;
        }

        const replacement = replacementSlotNumber === undefined
          ? undefined
          : result.ideas.find((idea) => idea.slotNumber === replacementSlotNumber) ?? result.ideas[0];
        const nextIdeas = replacementSlotNumber === undefined
          ? result.ideas
          : replacement
            ? previousIdeas.map((idea) => idea.slotNumber === replacementSlotNumber ? replacement : idea)
            : previousIdeas;

        setScratchState({ status: "ideas", ideas: nextIdeas, citations: result.citations });
        changeIdeationRequest({
          ...ideationRequest,
          avoidList: nextIdeas.map(ideaTitle)
        });
        return;
      }

      if (isIdeateBlocked(result)) {
        setScratchState({ status: "empty" });
        await refreshPrompt(ideationRequest, requestRevisionRef.current);
        return;
      }

      if ("kind" in result && result.kind === "stale-ideation-prompt") {
        setScratchState({ status: "empty" });
        setPreviewStatus("stale");
        await refreshPrompt(ideationRequest, requestRevisionRef.current);
        return;
      }

      setScratchState({ status: "error", message: ideateErrorMessage(result) });
    } catch {
      setScratchState({ status: "error", message: "Could not request ideation scratch." });
    }
  }

  function clearAll(): void {
    setScratchState({ status: "empty" });
    clearKeepers();
    setKeepers([]);
    if (ideationRequest.avoidList.length > 0) {
      changeIdeationRequest({ ...ideationRequest, avoidList: [] });
    }
  }

  function keepIdea(idea: ParsedIdeationIdea): void {
    setKeepers(addKeeper(idea, scratchState.status === "ideas" ? scratchState.citations : {}));
  }

  function unkeepIdea(idea: IdeationKeeper): void {
    setKeepers(removeKeeper(idea));
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
  const focusState = ideationFocusState(ideationRequest.focus);
  const previewIsCurrent = state.status === "ready"
    && state.requestRevision === requestRevision
    && previewStatus === "ready"
    && !focusState.error;
  const currentFocusedRequest = normalizedIdeationRequest(ideationRequest);

  return (
    <section className="surface previewSurface ideateSurface" aria-labelledby="ideate-title">
      <div className="projectHeader">
        <p className="eyebrow">Assistance scratch</p>
        <h2 id="ideate-title">Ideate</h2>
      </div>

      <QuarantineBanner />

      {state.status === "loading" ? <p className="muted" role="status">Compiling ideation prompt...</p> : null}

      {state.status === "idle" ? (
        <section className="configPanel">
          <p className="muted">No ideation prompt is currently compiled.</p>
          <button type="button" onClick={() => void refreshPrompt(ideationRequest, requestRevisionRef.current)}>
            Refresh prompt
          </button>
        </section>
      ) : null}

      {state.status === "blocked" ? (
        <section className="previewStack">
          <p className="status statusError" role="alert">
            Ideate is blocked.
          </p>
          <section className="configPanel validationPanel" aria-labelledby="ideate-validation-title">
            <h3 id="ideate-validation-title">READINESS</h3>
            <ReadinessChecklist readiness={state.readiness} actions={checklistActions} />
          </section>
          <button type="button" onClick={() => void refreshPrompt(ideationRequest, requestRevisionRef.current)}>
            Refresh prompt
          </button>
        </section>
      ) : null}

      {state.status === "error" ? (
        <section className="previewStack">
          <p className="status statusError" role="alert">{errorMessage(state.kind, state.message)}</p>
          <button type="button" onClick={() => void refreshPrompt(ideationRequest, requestRevisionRef.current)}>
            Refresh prompt
          </button>
        </section>
      ) : null}

      {state.status === "ready" ? (
        <ReadyIdeate
          result={state.result}
          readiness={state.readiness}
          searchTerm={searchTerm}
          scratchState={scratchState}
          ideationRequest={ideationRequest}
          previewStatus={previewStatus}
          previewIsCurrent={previewIsCurrent}
          keepers={keepers}
          onRequestChange={changeIdeationRequest}
          onSearchTermChange={setSearchTerm}
          onRefresh={() => void refreshPrompt(ideationRequest, requestRevisionRef.current)}
          onIdeate={() => void requestIdeas(currentFocusedRequest, state.result.metadata.fingerprint)}
          onRegenerateAll={() => void requestIdeas(currentFocusedRequest, state.result.metadata.fingerprint)}
          onRegenerateSlot={(idea) => void requestIdeas(
            currentFocusedRequest,
            state.result.metadata.fingerprint,
            idea.slotNumber
          )}
          onClearAll={clearAll}
          onKeepIdea={keepIdea}
          onRemoveKeeper={unkeepIdea}
          onChecklistAction={checklistActions}
        />
      ) : null}
    </section>
  );
}

function QuarantineBanner(): React.JSX.Element {
  return (
    <p className="status statusWarning ideateQuarantine" role="note">
      AI-suggested scratch - not story state.
    </p>
  );
}

function ReadyIdeate({
  result,
  readiness,
  searchTerm,
  scratchState,
  ideationRequest,
  previewStatus,
  previewIsCurrent,
  keepers,
  onRequestChange,
  onSearchTermChange,
  onRefresh,
  onIdeate,
  onRegenerateAll,
  onRegenerateSlot,
  onClearAll,
  onKeepIdea,
  onRemoveKeeper,
  onChecklistAction
}: {
  result: CompileResult;
  readiness: GenerationReadiness;
  searchTerm: string;
  scratchState: ScratchState;
  ideationRequest: IdeationRequest;
  previewStatus: PreviewStatus;
  previewIsCurrent: boolean;
  keepers: readonly IdeationKeeper[];
  onRequestChange: (request: IdeationRequest) => void;
  onSearchTermChange: (value: string) => void;
  onRefresh: () => void;
  onIdeate: () => void;
  onRegenerateAll: () => void;
  onRegenerateSlot: (idea: ParsedIdeationIdea) => void;
  onClearAll: () => void;
  onKeepIdea: (idea: ParsedIdeationIdea) => void;
  onRemoveKeeper: (idea: IdeationKeeper) => void;
  onChecklistAction: React.ComponentProps<typeof ReadinessChecklist>["actions"];
}): React.JSX.Element {
  const canIdeate = readiness.canGenerate && previewIsCurrent && scratchState.status !== "sending";
  const showReadinessChecklist = readiness.blockers.length > 0 || readiness.provider.blockers.length > 0 || readiness.warnings.length > 0;
  const hasSlate = scratchState.status === "ideas" || scratchState.status === "malformed";

  return (
    <section className="previewStack">
      {previewStatus === "compiling" ? (
        <p className="muted" role="status">Compiling ideation prompt...</p>
      ) : null}
      {previewStatus === "stale" ? (
        <p className="status statusWarning" role="status">
          The prompt preview is stale. Finish editing Author focus to compile the current request.
        </p>
      ) : null}
      {previewStatus === "ready" && showReadinessChecklist ? (
        <section className="configPanel validationPanel" aria-labelledby="ideate-readiness-title">
          <h3 id="ideate-readiness-title">READINESS</h3>
          <ReadinessChecklist readiness={readiness} actions={onChecklistAction} />
        </section>
      ) : previewStatus === "ready" ? (
        <p className="status statusSuccess" role="status">Ready to ideate.</p>
      ) : null}

      <IdeateControls
        request={ideationRequest}
        canIdeate={canIdeate}
        hasSlate={hasSlate}
        isSending={scratchState.status === "sending"}
        onRequestChange={onRequestChange}
        onGenerate={onIdeate}
        onRegenerateAll={onRegenerateAll}
        onClearAll={onClearAll}
      />
      <div className="previewToolbar">
        <button type="button" className="secondaryButton" onClick={onRefresh}>Refresh prompt</button>
      </div>

      {scratchState.status === "sending" ? <p className="muted" role="status">Requesting ideas...</p> : null}
      {scratchState.status === "error" ? (
        <p className="status statusError" role="alert">{scratchState.message}</p>
      ) : null}

      {previewIsCurrent ? (
        <PromptInspector result={result} searchTerm={searchTerm} onSearchTermChange={onSearchTermChange} />
      ) : (
        <p className="muted" role="status">The current prompt is not ready for inspection or sending.</p>
      )}
      <ScratchPanel
        state={scratchState}
        keepers={keepers}
        canRegenerate={canIdeate}
        onRegenerateSlot={onRegenerateSlot}
        onKeepIdea={onKeepIdea}
        onRemoveKeeper={onRemoveKeeper}
      />
    </section>
  );
}

function ScratchPanel({
  state,
  keepers,
  canRegenerate,
  onRegenerateSlot,
  onKeepIdea,
  onRemoveKeeper
}: {
  state: ScratchState;
  keepers: readonly IdeationKeeper[];
  canRegenerate: boolean;
  onRegenerateSlot: (idea: ParsedIdeationIdea) => void;
  onKeepIdea: (idea: ParsedIdeationIdea) => void;
  onRemoveKeeper: (idea: IdeationKeeper) => void;
}): React.JSX.Element {
  const keeperKeys = new Set(keepers.map(keeperKey));

  return (
    <section className="ideateScratchLayout" aria-label="Ideation scratch">
      <section className="candidatePanel ideateScratchPanel" aria-labelledby="ideate-scratch-title">
        <div className="candidateHeader">
          <div>
            <h3 id="ideate-scratch-title">Scratch slate</h3>
            <p className="muted">AI-suggested scratch - not story state.</p>
          </div>
        </div>
        {state.status === "empty" || state.status === "sending" ? (
          <p className="muted">No ideas yet.</p>
        ) : null}
        {state.status === "malformed" ? (
          <div className="ideateRawScratch">
            <p className="status statusWarning" role="status">The response could not be parsed into idea blocks.</p>
            <pre>{state.raw}</pre>
          </div>
        ) : null}
        {state.status === "ideas" ? (
          <div className="slateGrid">
            {state.ideas.map((idea) => (
              <SlateCard
                key={idea.slotNumber}
                idea={idea}
                citations={state.citations}
                isKept={keeperKeys.has(keeperKey(idea))}
                canRegenerate={canRegenerate}
                onKeep={onKeepIdea}
                onRegenerate={onRegenerateSlot}
              />
            ))}
          </div>
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
  keepers: readonly IdeationKeeper[];
  onRemoveKeeper: (idea: IdeationKeeper) => void;
}): React.JSX.Element {
  return (
    <aside className="candidatePanel keepersPanel" aria-labelledby="keepers-title">
      <h3 id="keepers-title">Keepers</h3>
      <p className="muted">Session scratch - not story state.</p>
      {keepers.length === 0 ? <p className="muted">No keepers yet.</p> : null}
      {keepers.length > 0 ? (
        <ul className="keepersList">
          {keepers.map((keeper) => (
            <li key={keeperKey(keeper)}>
              <span>{ideaTitle(keeper)}</span>
              {keeper.grounds.length > 0 ? (
                <div className="citationChipList" aria-label={`Grounds for kept ${ideaTitle(keeper)}`}>
                  {keeper.grounds.map((ground) => (
                    <span
                      className={keeper.unknownCitations.includes(ground) ? "citationChip citationChip-warning" : "citationChip"}
                      key={ground}
                    >
                      {keeper.groundLabels?.[ground] ?? ground}
                    </span>
                  ))}
                </div>
              ) : null}
              <button type="button" className="secondaryButton" onClick={() => onRemoveKeeper(keeper)}>Remove</button>
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}

function ideaTitle(idea: Pick<ParsedIdeationIdea, "headline" | "question" | "slotNumber">): string {
  return idea.headline ?? idea.question ?? `Idea ${idea.slotNumber}`;
}

function normalizedIdeationRequest(request: IdeationRequest): IdeationRequest {
  return {
    ...request,
    focus: ideationFocusState(request.focus).normalizedValue
  };
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

function isIdeateBlocked(result: Exclude<IdeateResponse, { ok: true }>): result is CompileBlocked {
  return "kind" in result && result.kind === "validation-blocked" && "validation" in result;
}

function errorMessage(kind: string, message: string): string {
  if (kind === "no-open-project") {
    return "Open a project first.";
  }

  return message;
}

function ideateErrorMessage(result: ApiFailure | TransportFailure): string {
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
