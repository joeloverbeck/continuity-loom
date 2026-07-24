import type {
  CastPossibilitiesCard,
  CastPossibilitiesCharacterResult,
  CastPossibilitiesOutput,
  CompileResult
} from "@loom/core";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  castPossibilitiesAnalyze,
  castPossibilitiesCompile,
  refreshModels,
  type CastPossibilitiesAnalyzeResponse,
  type CastPossibilitiesCompileRequest,
  type CastPossibilitiesCompileResponse,
  type RefreshModelsResponse
} from "../api.js";
import { presentOpenRouterFailure, presentThrownOpenRouterFailure } from "../openrouter-failure.js";
import { isTransportFailure } from "../openrouter-transport.js";
import { PromptInspector } from "../prompt/PromptInspector.js";
import {
  clearCastPossibilitiesScratch,
  loadCastPossibilitiesScratch,
  loadLatestCastPossibilitiesScratch,
  saveCastPossibilitiesScratch,
  type CastPossibilitiesScratch
} from "./session-scratch.js";

export interface CastPossibilitiesClient {
  compile(this: void, request?: CastPossibilitiesCompileRequest): Promise<CastPossibilitiesCompileResponse>;
  analyze(
    this: void,
    request: CastPossibilitiesCompileRequest & { expectedPromptFingerprint: string }
  ): Promise<CastPossibilitiesAnalyzeResponse>;
  refreshModels(this: void): Promise<RefreshModelsResponse>;
}

const defaultClient: CastPossibilitiesClient = {
  compile: castPossibilitiesCompile,
  analyze: castPossibilitiesAnalyze,
  refreshModels
};

type ReadyCompile = Extract<CastPossibilitiesCompileResponse, { ok: true }>;
type CompileState =
  | { status: "loading" }
  | { status: "ready"; result: ReadyCompile }
  | { status: "unavailable"; message: string };
type SendState =
  | { status: "idle" }
  | { status: "analyzing" | "regenerating" }
  | {
      status:
        | "quarantined"
        | "capabilityStale"
        | "incompatibleModel"
        | "provider"
        | "local"
        | "cleared";
      message: string;
    };
type ModelRefreshState =
  | { status: "idle" | "refreshing" }
  | { status: "done"; modelCount: number }
  | { status: "error"; message: string };
type RegenerationPreview = {
  targetCharacterId: string;
  label: string;
  avoidList: readonly string[];
  compile: ReadyCompile;
  confirmed: boolean;
};

export function CastPossibilitiesView({
  client = defaultClient
}: { client?: CastPossibilitiesClient } = {}): React.JSX.Element {
  const [compileState, setCompileState] = useState<CompileState>({ status: "loading" });
  const [scratchState, setScratchState] = useState<{ scratch: CastPossibilitiesScratch; stale: boolean } | null>(null);
  const [sendState, setSendState] = useState<SendState>({ status: "idle" });
  const [sendConfirmed, setSendConfirmed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedCard, setCopiedCard] = useState<string | null>(null);
  const [regeneration, setRegeneration] = useState<RegenerationPreview | null>(null);
  const [modelRefresh, setModelRefresh] = useState<ModelRefreshState>({ status: "idle" });
  const slateHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let active = true;
    void client.compile()
      .then((result) => {
        if (!active) {
          return;
        }
        if (!result.ok) {
          const message = "blockers" in result
            ? result.blockers.map((blocker) => blocker.message).join(" ")
            : result.message;
          setCompileState({ status: "unavailable", message });
          if (result.kind === "cast-possibilities-not-ready" && "projectIdentity" in result) {
            setScratchState(loadLatestCastPossibilitiesScratch(
              sessionStorage,
              result.projectIdentity
            ));
          }
          return;
        }
        setCompileState({ status: "ready", result });
        setScratchState(loadCastPossibilitiesScratch(
          sessionStorage,
          result.projectIdentity,
          result.disclosure.fingerprint
        ));
      })
      .catch(() => {
        if (active) {
          setCompileState({
            status: "unavailable",
            message: "The saved Cast Possibilities source could not be compiled locally."
          });
        }
      });
    return () => {
      active = false;
    };
  }, [client]);

  useEffect(() => {
    if (scratchState) {
      slateHeadingRef.current?.focus();
    }
  }, [scratchState?.scratch.possibilities]);

  async function analyze(): Promise<void> {
    if (compileState.status !== "ready") {
      return;
    }
    setSendConfirmed(false);
    setModelRefresh({ status: "idle" });
    setSendState({ status: "analyzing" });
    await handleAnalyze(
      { expectedPromptFingerprint: compileState.result.disclosure.fingerprint },
      compileState.result,
      undefined
    );
  }

  async function previewRegeneration(
    character: ReadyCompile["disclosure"]["eligibleCharacters"][number],
    result: CastPossibilitiesCharacterResult
  ): Promise<void> {
    if (!scratchState || scratchState.stale) {
      return;
    }
    const avoidList = result.cards.map((card) => card.observable_move);
    setSendState({ status: "regenerating" });
    try {
      const compiled = await client.compile({
        targetCharacterId: character.castMemberId,
        avoidList,
        baseSourceFingerprint: scratchState.scratch.sourceFingerprint
      });
      if (!compiled.ok) {
        if (
          compiled.kind === "cast-possibilities-source-changed" ||
          "blockers" in compiled
        ) {
          setScratchState({ ...scratchState, stale: true });
          setRegeneration(null);
        }
        setSendState({
          status: "local",
          message: "blockers" in compiled
            ? compiled.blockers.map((blocker) => blocker.message).join(" ")
            : compiled.message
        });
        return;
      }
      setRegeneration({
        targetCharacterId: character.castMemberId,
        label: character.label,
        avoidList,
        compile: compiled,
        confirmed: false
      });
      setSendState({ status: "idle" });
    } catch {
      setSendState({ status: "local", message: "The target regeneration source could not be compiled locally." });
    }
  }

  async function sendRegeneration(): Promise<void> {
    if (
      !regeneration?.confirmed ||
      sendState.status === "analyzing" ||
      sendState.status === "regenerating" ||
      !scratchState ||
      scratchState.stale
    ) {
      return;
    }
    setRegeneration({ ...regeneration, confirmed: false });
    setSendState({ status: "regenerating" });
    await handleAnalyze({
      expectedPromptFingerprint: regeneration.compile.disclosure.fingerprint,
      targetCharacterId: regeneration.targetCharacterId,
      avoidList: regeneration.avoidList,
      baseSourceFingerprint: scratchState.scratch.sourceFingerprint
    }, regeneration.compile, regeneration.targetCharacterId);
  }

  async function handleAnalyze(
    request: CastPossibilitiesCompileRequest & { expectedPromptFingerprint: string },
    inspected: ReadyCompile,
    targetCharacterId: string | undefined
  ): Promise<void> {
    let result: CastPossibilitiesAnalyzeResponse;
    try {
      result = await client.analyze(request);
    } catch {
      setSendState({
        status: "local",
        message: "The local request failed. No automatic retry was attempted."
      });
      return;
    }

    if (!result.ok) {
      if (isTransportFailure(result)) {
        if (result.category === "structured-output-capability-unknown") {
          setSendState({ status: "capabilityStale", message: presentOpenRouterFailure(result) });
        } else if (result.category === "structured-output-incompatible-model") {
          setSendState({ status: "incompatibleModel", message: presentOpenRouterFailure(result) });
        } else {
          setSendState({ status: "provider", message: presentOpenRouterFailure(result) });
        }
      } else {
        if (
          (result.kind === "cast-possibilities-source-changed" || "blockers" in result) &&
          scratchState
        ) {
          setScratchState({ ...scratchState, stale: true });
          setRegeneration(null);
        }
        setSendState({
          status: "local",
          message: "blockers" in result
            ? result.blockers.map((blocker) => blocker.message).join(" ")
            : result.message
        });
      }
      return;
    }
    if ("quarantined" in result) {
      setSendState({ status: "quarantined", message: `${result.summary} No partial cards were kept.` });
      return;
    }
    const current = scratchState?.scratch;
    const possibilities = "possibilities" in result
      ? result.possibilities
      : replaceCharacter(current?.possibilities, result.replacement);
    if (!possibilities) {
      setSendState({ status: "local", message: "No active full-cast slate exists for this replacement." });
      return;
    }
    const next: CastPossibilitiesScratch = {
      projectIdentity: targetCharacterId && current
        ? current.projectIdentity
        : inspected.projectIdentity,
      sourceFingerprint: targetCharacterId && current
        ? current.sourceFingerprint
        : inspected.disclosure.fingerprint,
      disclosure: targetCharacterId && current
        ? current.disclosure
        : inspected.disclosure,
      possibilities,
      keptCardIds: targetCharacterId && current ? current.keptCardIds : []
    };
    setScratchState({ scratch: next, stale: false });
    setRegeneration(null);
    try {
      saveCastPossibilitiesScratch(sessionStorage, next);
    } catch {
      setSendState({
        status: "local",
        message: "The provider request completed, but the result could not be stored in session scratch. The visible result remains non-canonical; no automatic retry was attempted."
      });
      return;
    }
    setSendState({ status: "idle" });
  }

  async function refreshModelsForRecovery(): Promise<void> {
    setModelRefresh({ status: "refreshing" });
    try {
      const result = await client.refreshModels();
      if (result.ok) {
        setModelRefresh({ status: "done", modelCount: result.models.length });
        return;
      }
      setModelRefresh({ status: "error", message: presentOpenRouterFailure(result) });
    } catch (error) {
      setModelRefresh({
        status: "error",
        message: presentThrownOpenRouterFailure(
          error,
          "The model list could not be refreshed. Open Settings to refresh manually."
        )
      });
    }
  }

  function toggleKeep(cardId: string): void {
    if (!scratchState) {
      return;
    }
    const kept = new Set(scratchState.scratch.keptCardIds);
    if (kept.has(cardId)) {
      kept.delete(cardId);
    } else {
      kept.add(cardId);
    }
    const next = { ...scratchState.scratch, keptCardIds: [...kept] };
    saveCastPossibilitiesScratch(sessionStorage, next);
    setScratchState({ ...scratchState, scratch: next });
  }

  function clearScratch(): void {
    if (scratchState) {
      clearCastPossibilitiesScratch(sessionStorage, scratchState.scratch);
    }
    setScratchState(null);
    setRegeneration(null);
    setCopiedCard(null);
    setSendState({ status: "cleared", message: "Session scratch cleared." });
  }

  return (
    <section className="surface previewSurface" aria-labelledby="cast-possibilities-title">
      <div className="projectHeader">
        <div>
          <p className="eyebrow">Premise-level assistance</p>
          <h2 id="cast-possibilities-title">Cast Possibilities</h2>
        </div>
      </div>
      <p>
        Explore how the other active characters might act in this moment. The result contains exactly three
        grounded, distinct possibilities for every eligible non-POV active character.
        These are disposable, non-canonical suggestions—not prose, scene branches, or record changes.
      </p>
      <p className="status statusWarning" role="note">
        This view uses the most recently saved Generation Brief. Unsaved edits in another browser view are not included.
        {" "}<Link to="/generation-brief">Open Generation Brief</Link>
      </p>

      {compileState.status === "loading" ? <p role="status">Compiling complete saved source…</p> : null}
      {compileState.status === "unavailable" ? (
        <p className="status statusError" role="alert">{compileState.message} No provider call was made.</p>
      ) : null}
      {compileState.status === "ready" ? (
        <>
          <section className="configPanel" aria-labelledby="cast-source-title">
            <h3 id="cast-source-title">Complete source disclosure</h3>
            <p>Saved draft: {compileState.result.disclosure.savedDraftIdentity}</p>
            <p>POV: {compileState.result.disclosure.selectedPov.label}</p>
            <p>Eligible cast: {compileState.result.disclosure.eligibleCharacters.map((item) => item.label).join(", ")}</p>
            <p>{compileState.result.disclosure.includesSecrets ? "SECRET records are included." : "No SECRET records are included."}</p>
            <dl className="metadataGrid">
              {Object.entries(compileState.result.disclosure.recordCountsByType).map(([type, count]) => (
                <div key={type}><dt>{type}</dt><dd>{count}</dd></div>
              ))}
            </dl>
          </section>
          <PromptInspector
            result={toInspectorResult(compileState.result)}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
          />
          <section className="configPanel" aria-labelledby="cast-send-title">
            <h3 id="cast-send-title">OpenRouter Send</h3>
            <p>Analyze makes one external provider request using only the currently inspected prompt.</p>
            <label className="checkboxLabel">
              <input
                type="checkbox"
                checked={sendConfirmed}
                disabled={sendState.status === "analyzing" || sendState.status === "regenerating"}
                onChange={(event) => setSendConfirmed(event.target.checked)}
              />
              I inspected the complete source and confirm this one-time send
            </label>
            <button
              type="button"
              disabled={!sendConfirmed || sendState.status === "analyzing" || sendState.status === "regenerating"}
              onClick={() => void analyze()}
            >
              Analyze with OpenRouter
            </button>
          </section>
        </>
      ) : null}

      {sendState.status === "analyzing" ? <p role="status">Analyzing all eligible characters with one request…</p> : null}
      {sendState.status === "regenerating" ? <p role="status">Preparing or sending one target-character request…</p> : null}
      {sendState.status === "quarantined" ? <p className="status statusError" role="alert">{sendState.message}</p> : null}
      {sendState.status === "capabilityStale" ? (
        <section className="status statusError" aria-labelledby="cast-capability-stale-title">
          <h3 id="cast-capability-stale-title">Model capability data needs a refresh</h3>
          <p role="alert">{sendState.message}</p>
          <button
            type="button"
            disabled={modelRefresh.status === "refreshing"}
            onClick={() => void refreshModelsForRecovery()}
          >
            Refresh model list
          </button>
          {modelRefresh.status === "refreshing" ? <p role="status">Refreshing model capabilities…</p> : null}
          {modelRefresh.status === "done"
            ? <p role="status">Refreshed {modelRefresh.modelCount} models with capability data. Inspect and Analyze again manually.</p>
            : null}
          {modelRefresh.status === "error" ? <p role="alert">{modelRefresh.message}</p> : null}
        </section>
      ) : null}
      {sendState.status === "incompatibleModel" ? (
        <section className="status statusError" aria-labelledby="cast-incompatible-model-title">
          <h3 id="cast-incompatible-model-title">Strict structured output unavailable</h3>
          <p role="alert">{sendState.message}</p>
          <Link to="/settings">Open Settings</Link>
        </section>
      ) : null}
      {sendState.status === "provider" || sendState.status === "local"
        ? <p className="status statusError" role="alert">{sendState.message}</p>
        : null}
      {sendState.status === "cleared" ? <p role="status">{sendState.message}</p> : null}

      {scratchState ? (
        <Slate
          state={scratchState}
          headingRef={slateHeadingRef}
          copiedCard={copiedCard}
          busy={sendState.status === "analyzing" || sendState.status === "regenerating"}
          onKeep={toggleKeep}
          onCopy={(cardId, card) => {
            setCopiedCard(cardId);
            void navigator.clipboard?.writeText(formatCard(card));
          }}
          onRegenerate={(character, result) => void previewRegeneration(character, result)}
          onClear={clearScratch}
        />
      ) : null}

      {regeneration ? (
        <section className="configPanel" aria-labelledby="regeneration-preview-title">
          <h3 id="regeneration-preview-title">Inspect regeneration for {regeneration.label}</h3>
          <p>This one target-only request includes the character’s current three observable-move summaries as an avoid list.</p>
          <pre className="promptBody">{regeneration.compile.prompt}</pre>
          <label className="checkboxLabel">
            <input
              type="checkbox"
              checked={regeneration.confirmed}
              disabled={sendState.status === "analyzing" || sendState.status === "regenerating"}
              onChange={(event) => setRegeneration({ ...regeneration, confirmed: event.target.checked })}
            />
            I inspected this target-only source and confirm one regeneration request
          </label>
          <button
            type="button"
            disabled={
              !regeneration.confirmed ||
              sendState.status === "analyzing" ||
              sendState.status === "regenerating"
            }
            onClick={() => void sendRegeneration()}
          >
            Send regeneration
          </button>
          <button
            type="button"
            className="secondaryButton"
            disabled={sendState.status === "analyzing" || sendState.status === "regenerating"}
            onClick={() => setRegeneration(null)}
          >
            Cancel
          </button>
        </section>
      ) : null}
      {copiedCard ? <p className="muted" role="status" aria-live="polite">Copied card to clipboard.</p> : null}
    </section>
  );
}

function Slate({
  state,
  headingRef,
  copiedCard,
  busy,
  onKeep,
  onCopy,
  onRegenerate,
  onClear
}: {
  state: { scratch: CastPossibilitiesScratch; stale: boolean };
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  copiedCard: string | null;
  busy: boolean;
  onKeep: (cardId: string) => void;
  onCopy: (cardId: string, card: CastPossibilitiesCard) => void;
  onRegenerate: (
    character: CastPossibilitiesScratch["disclosure"]["eligibleCharacters"][number],
    result: CastPossibilitiesCharacterResult
  ) => void;
  onClear: () => void;
}): React.JSX.Element {
  const { scratch, stale } = state;
  const byKey = new Map(scratch.disclosure.eligibleCharacters.map((character) => [character.characterKey, character]));
  return (
    <section aria-labelledby="cast-slate-title">
      <h3 id="cast-slate-title" ref={headingRef} tabIndex={-1}>Session scratch</h3>
      {stale ? (
        <p className="status statusWarning" role="status">
          The saved source changed. These older cards remain readable and copyable, but regeneration is disabled.
        </p>
      ) : null}
      {scratch.possibilities.characters.map((result) => {
        const character = byKey.get(result.character_key);
        if (!character) {
          return null;
        }
        return (
          <section key={result.character_key} role="group" aria-label={`${character.label} possibilities`}>
            <div className="projectHeader">
              <h4>{character.label}</h4>
              <button
                type="button"
                disabled={stale || busy}
                onClick={() => onRegenerate(character, result)}
                aria-label={`Regenerate ${character.label} — one OpenRouter request`}
              >
                Regenerate {character.label} — one OpenRouter request
              </button>
            </div>
            <div className="cardGrid">
              {result.cards.map((card, index) => {
                const cardId = `${result.character_key}:${index}`;
                const kept = scratch.keptCardIds.includes(cardId);
                return (
                  <article className="configPanel" key={cardId}>
                    <h5>Card {index + 1}</h5>
                    <dl>
                      <div><dt>Observable move</dt><dd>{card.observable_move}</dd></div>
                      <div><dt>Character fit</dt><dd>{card.character_fit}</dd></div>
                      <div><dt>Moment fit</dt><dd>{card.moment_fit}</dd></div>
                      <div><dt>Local effect</dt><dd>{card.local_effect}</dd></div>
                      <div><dt>Dossier evidence</dt><dd>{card.dossier_keys.join(", ")}</dd></div>
                      <div><dt>Context evidence</dt><dd>{card.context_keys.join(", ")}</dd></div>
                      <div><dt>Distinction</dt><dd>{card.distinction}</dd></div>
                    </dl>
                    <button type="button" aria-pressed={kept} onClick={() => onKeep(cardId)}>
                      {kept ? "Unkeep" : "Keep"} card {index + 1} for {character.label}
                    </button>
                    <button type="button" onClick={() => onCopy(cardId, card)}>
                      Copy card {index + 1} for {character.label}
                    </button>
                    {copiedCard === cardId ? <span className="muted"> Copied</span> : null}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
      <button type="button" className="secondaryButton" onClick={onClear}>Clear session scratch</button>
    </section>
  );
}

function replaceCharacter(
  output: CastPossibilitiesOutput | undefined,
  replacement: CastPossibilitiesCharacterResult
): CastPossibilitiesOutput | undefined {
  if (!output) {
    return undefined;
  }
  let replaced = 0;
  const characters = output.characters.map((character) => {
    if (character.character_key !== replacement.character_key) {
      return character;
    }
    replaced += 1;
    return replacement;
  });
  if (replaced !== 1) {
    return undefined;
  }
  return {
    ...output,
    characters
  };
}

function toInspectorResult(result: ReadyCompile): CompileResult {
  return {
    prompt: result.prompt,
    metadata: {
      versions: result.disclosure.versions,
      fingerprint: result.disclosure.fingerprint,
      lengthEstimate: result.disclosure.promptLength,
      tokenEstimate: result.disclosure.tokenEstimate
    }
  };
}

function formatCard(card: CastPossibilitiesCard): string {
  return [
    `Observable move: ${card.observable_move}`,
    `Character fit: ${card.character_fit}`,
    `Moment fit: ${card.moment_fit}`,
    `Local effect: ${card.local_effect}`,
    `Dossier evidence: ${card.dossier_keys.join(", ")}`,
    `Context evidence: ${card.context_keys.join(", ")}`,
    `Distinction: ${card.distinction}`
  ].join("\n");
}
