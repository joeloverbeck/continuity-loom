import type { CompileResult, GenerationReadiness, IdeationRequest, ReadinessDiagnostic } from "@loom/core";
import { useEffect, useState } from "react";
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
  | { status: "ready"; result: CompileResult; readiness: GenerationReadiness }
  | { status: "blocked"; readiness: GenerationReadiness }
  | { status: "error"; kind: string; message: string };

type ScratchState =
  | { status: "empty" }
  | { status: "sending" }
  | { status: "ideas"; ideas: readonly ParsedIdeationIdea[] }
  | { status: "malformed"; raw: string }
  | { status: "error"; message: string };

const defaultIdeationRequest: IdeationRequest = {
  mode: "ideas",
  count: 5,
  dormantSlot: true,
  avoidList: []
};

export function IdeateView(): React.JSX.Element {
  const [state, setState] = useState<IdeateSurfaceState>({ status: "loading" });
  const [scratchState, setScratchState] = useState<ScratchState>({ status: "empty" });
  const [ideationRequest, setIdeationRequest] = useState<IdeationRequest>(defaultIdeationRequest);
  const [keepers, setKeepers] = useState<readonly IdeationKeeper[]>(() => listKeepers());
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    void refreshPrompt(ideationRequest);
  }, [ideationRequest]);

  async function refreshPrompt(requestInput: IdeationRequest): Promise<void> {
    setState({ status: "loading" });
    setSearchTerm("");

    try {
      const [compileResult, readinessResult] = await Promise.all([
        compileIdeation(requestInput),
        readiness({ promptKind: "ideation" })
      ]);

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
          const blockedReadiness = compileResult.readiness ?? readinessResult;
          setState({ status: "blocked", readiness: blockedReadiness });
          return;
        }

        setState({ status: "error", kind: compileResult.kind, message: compileResult.message });
        return;
      }

      setState({ status: "ready", result: compileResult, readiness: readinessResult });
    } catch {
      setState({ status: "error", kind: "compile-request-failed", message: "Could not compile the ideation prompt." });
    }
  }

  async function requestIdeas(requestInput: IdeationRequest = ideationRequest, replacementSlotNumber?: number): Promise<void> {
    setScratchState({ status: "sending" });

    try {
      const result = await ideate(requestInput);

      if (result.ok) {
        if ("malformed" in result) {
          setScratchState({ status: "malformed", raw: result.raw });
          return;
        }

        setScratchState((current) => {
          if (replacementSlotNumber === undefined || current.status !== "ideas") {
            return { status: "ideas", ideas: result.ideas };
          }

          const replacement = result.ideas.find((idea) => idea.slotNumber === replacementSlotNumber) ?? result.ideas[0];
          if (!replacement) {
            return current;
          }

          return {
            status: "ideas",
            ideas: current.ideas.map((idea) => idea.slotNumber === replacementSlotNumber ? replacement : idea)
          };
        });
        return;
      }

      if (isIdeateBlocked(result)) {
        setScratchState({ status: "empty" });
        await refreshPrompt(ideationRequest);
        return;
      }

      setScratchState({ status: "error", message: ideateErrorMessage(result) });
    } catch {
      setScratchState({ status: "error", message: "Could not request ideation scratch." });
    }
  }

  function currentAvoidList(): string[] {
    return scratchState.status === "ideas" ? scratchState.ideas.map(ideaTitle) : [];
  }

  function requestWithCurrentAvoidList(): IdeationRequest {
    return { ...ideationRequest, avoidList: currentAvoidList() };
  }

  function regenerateSlot(idea: ParsedIdeationIdea): void {
    void requestIdeas(requestWithCurrentAvoidList(), idea.slotNumber);
  }

  function clearAll(): void {
    setScratchState({ status: "empty" });
    clearKeepers();
    setKeepers([]);
  }

  function keepIdea(idea: ParsedIdeationIdea): void {
    setKeepers(addKeeper(idea));
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
          <button type="button" onClick={() => void refreshPrompt(ideationRequest)}>Refresh prompt</button>
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
          <button type="button" onClick={() => void refreshPrompt(ideationRequest)}>Refresh prompt</button>
        </section>
      ) : null}

      {state.status === "error" ? (
        <section className="previewStack">
          <p className="status statusError" role="alert">{errorMessage(state.kind, state.message)}</p>
          <button type="button" onClick={() => void refreshPrompt(ideationRequest)}>Refresh prompt</button>
        </section>
      ) : null}

      {state.status === "ready" ? (
        <ReadyIdeate
          result={state.result}
          readiness={state.readiness}
          searchTerm={searchTerm}
          scratchState={scratchState}
          ideationRequest={ideationRequest}
          keepers={keepers}
          onRequestChange={setIdeationRequest}
          onSearchTermChange={setSearchTerm}
          onRefresh={() => void refreshPrompt(ideationRequest)}
          onIdeate={() => void requestIdeas(ideationRequest)}
          onRegenerateAll={() => void requestIdeas(requestWithCurrentAvoidList())}
          onRegenerateSlot={regenerateSlot}
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
  const canIdeate = readiness.canGenerate && scratchState.status !== "sending";
  const showReadinessChecklist = readiness.blockers.length > 0 || readiness.provider.blockers.length > 0 || readiness.warnings.length > 0;
  const hasSlate = scratchState.status === "ideas" || scratchState.status === "malformed";

  return (
    <section className="previewStack">
      {showReadinessChecklist ? (
        <section className="configPanel validationPanel" aria-labelledby="ideate-readiness-title">
          <h3 id="ideate-readiness-title">READINESS</h3>
          <ReadinessChecklist readiness={readiness} actions={onChecklistAction} />
        </section>
      ) : (
        <p className="status statusSuccess" role="status">Ready to ideate.</p>
      )}

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

      <PromptInspector result={result} searchTerm={searchTerm} onSearchTermChange={onSearchTermChange} />
      <ScratchPanel
        state={scratchState}
        keepers={keepers}
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
  onRegenerateSlot,
  onKeepIdea,
  onRemoveKeeper
}: {
  state: ScratchState;
  keepers: readonly IdeationKeeper[];
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
                isKept={keeperKeys.has(keeperKey(idea))}
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
