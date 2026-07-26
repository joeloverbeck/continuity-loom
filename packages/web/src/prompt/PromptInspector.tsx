import type { CompileResult } from "@loom/core";
import { useEffect, useMemo, useRef, useState } from "react";

import type { OpenRouterRequestInspection } from "../api.js";

export interface PromptInspectorProps {
  result: CompileResult;
  providerRequest?: OpenRouterRequestInspection;
  canNarrowScope?: boolean;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
}

export function PromptInspector({
  result,
  providerRequest,
  canNarrowScope = false,
  searchTerm,
  onSearchTermChange
}: PromptInspectorProps): React.JSX.Element {
  const term = searchTerm.trim();
  const matches = useMemo(() => findMatches(result.prompt, term), [result.prompt, term]);
  const [navigation, setNavigation] = useState({ prompt: result.prompt, term, index: 0 });
  const activeMarkRef = useRef<HTMLElement | null>(null);
  const activeMatchIndex = matches.length === 0
    ? -1
    : navigation.prompt === result.prompt && navigation.term === term
      ? Math.min(navigation.index, matches.length - 1)
      : 0;
  const highlightedPrompt = highlightPrompt(result.prompt, matches, activeMatchIndex, activeMarkRef);
  const contextWindowAdvisory = providerRequest === undefined
    ? undefined
    : buildContextWindowAdvisory(result.metadata.tokenEstimate, providerRequest, canNarrowScope);
  const showCeilingAdvisory = providerRequest !== undefined && providerRequest.maxOutputTokens <
    (providerRequest.completionCeilingClass === "prose" ? 2048 : 8192);

  useEffect(() => {
    activeMarkRef.current?.scrollIntoView?.({ block: "center" });
  }, [activeMatchIndex, result.prompt, term]);

  function navigate(delta: -1 | 1): void {
    if (matches.length === 0) {
      return;
    }

    setNavigation({
      prompt: result.prompt,
      term,
      index: (activeMatchIndex + delta + matches.length) % matches.length
    });
  }

  return (
    <>
      <label className="promptSearch">
        Search within prompt
        <input value={searchTerm} onChange={(event) => onSearchTermChange(event.target.value)} />
      </label>
      {term ? (
        <div className="promptSearchResults">
          <p className="muted" role="status" aria-live="polite">
            <span>{matches.length} {matches.length === 1 ? "match" : "matches"}</span>
            {activeMatchIndex >= 0 ? <span> · Current match {activeMatchIndex + 1} of {matches.length}</span> : null}
          </p>
          <div className="promptSearchNavigation" aria-label="Prompt match navigation">
            <button type="button" onClick={() => navigate(-1)} disabled={matches.length === 0}>Previous</button>
            <button type="button" onClick={() => navigate(1)} disabled={matches.length === 0}>Next</button>
          </div>
        </div>
      ) : null}

      {showCeilingAdvisory && providerRequest ? (
        <p
          className="status statusWarning"
          role="status"
          aria-label={`${ceilingClassLabel(providerRequest.completionCeilingClass)}-ceiling suitability advisory`}
        >
          The configured {ceilingClassLabel(providerRequest.completionCeilingClass)} ceiling is {
            providerRequest.maxOutputTokens
          } tokens and is below the fresh default of {
            providerRequest.completionCeilingClass === "prose" ? 2048 : 8192
          }. This preserved setting remains usable; the warning does not block sending. <a href="/settings">Open
          Settings</a> to review it; reading this advisory leaves the configured value unchanged.
        </p>
      ) : null}

      {providerRequest?.admission && !providerRequest.admission.ok ? (
        <p className="status statusError" role="alert" aria-label="OpenRouter capability blocker">
          {providerRequest.admission.message} {providerRequest.admission.recovery} <a href="/settings">Open
          Settings</a> to refresh the model list or choose an explicit model and effort.
        </p>
      ) : null}

      {contextWindowAdvisory ? (
        <p
          className="status statusContextAdvisory"
          role="status"
          aria-label="Context-window advisory"
        >
          {contextWindowAdvisory}
        </p>
      ) : null}

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
            {providerRequest ? (
              <>
                <div>
                  <dt>Provider model</dt>
                  <dd>{providerRequest.model}</dd>
                </div>
                <div>
                  <dt>Temperature</dt>
                  <dd>
                    {providerRequest.temperatureMode === "explicit"
                      ? `Explicit: ${providerRequest.temperature}`
                      : "Provider default"}
                  </dd>
                </div>
                {providerRequest.topP === undefined ? null : (
                  <div>
                    <dt>Top P</dt>
                    <dd>{providerRequest.topP}</dd>
                  </div>
                )}
                <div>
                  <dt>{ceilingClassLabel(providerRequest.completionCeilingClass)} ceiling</dt>
                  <dd>{providerRequest.maxOutputTokens}</dd>
                </div>
                <div>
                  <dt>Output class</dt>
                  <dd>{ceilingClassLabel(providerRequest.completionCeilingClass)}</dd>
                </div>
                <div>
                  <dt>Reasoning enabled</dt>
                  <dd>{providerRequest.reasoningEnabled ? "Yes (mandatory)" : "Unavailable"}</dd>
                </div>
                <div>
                  <dt>Reasoning effort</dt>
                  <dd>{providerRequest.reasoningEffort}</dd>
                </div>
                <div>
                  <dt>Reasoning content</dt>
                  <dd>{providerRequest.reasoningExcluded ? "Excluded" : "Unavailable"}</dd>
                </div>
                <div>
                  <dt>Supported efforts</dt>
                  <dd>{supportedEffortsLabel(providerRequest.capabilitySnapshot?.supportedEfforts)}</dd>
                </div>
                <div>
                  <dt>Request fingerprint</dt>
                  <dd>{providerRequest.requestFingerprint}</dd>
                </div>
              </>
            ) : null}
          </dl>
        </aside>
      </section>
    </>
  );
}

function supportedEffortsLabel(
  supportedEfforts: OpenRouterRequestInspection["capabilitySnapshot"]["supportedEfforts"] | undefined
): string {
  if (supportedEfforts === undefined || supportedEfforts === null) {
    return "Unknown - refresh model list";
  }
  return supportedEfforts.length === 0 ? "None" : supportedEfforts.join(", ");
}

function buildContextWindowAdvisory(
  promptTokenEstimate: number,
  providerRequest: OpenRouterRequestInspection,
  canNarrowScope: boolean
): string | undefined {
  const { contextLength, maxOutputTokens, model } = providerRequest;
  if (
    contextLength === undefined ||
    promptTokenEstimate + maxOutputTokens <= contextLength
  ) {
    return undefined;
  }

  const estimatedTotal = promptTokenEstimate + maxOutputTokens;
  const ceilingLabel = ceilingClassLabel(providerRequest.completionCeilingClass);
  const remedies = [
    ...(canNarrowScope ? ["narrow the selected scope"] : []),
    `reduce the configured ${ceilingLabel} ceiling`,
    "choose a model with a larger context window"
  ];

  return `The compiled prompt is estimated at ${promptTokenEstimate} tokens. ` +
    `With the configured ${ceilingLabel} ceiling of ${maxOutputTokens} tokens, that estimate totals ` +
    `${estimatedTotal} tokens and may exceed ${model}'s cached context window of ` +
    `${contextLength} tokens. You can ${joinRemedies(remedies)}. ` +
    "This is an estimate, not a provider measurement, and it does not block sending.";
}

function ceilingClassLabel(completionCeilingClass: OpenRouterRequestInspection["completionCeilingClass"]): string {
  return completionCeilingClass === "prose" ? "Prose" : "Assistance";
}

function joinRemedies(remedies: readonly string[]): string {
  if (remedies.length === 2) {
    return `${remedies[0]} or ${remedies[1]}`;
  }

  return `${remedies.slice(0, -1).join(", ")}, or ${remedies.at(-1)}`;
}

interface PromptMatch {
  start: number;
  end: number;
}

function findMatches(prompt: string, term: string): PromptMatch[] {
  if (!term) {
    return [];
  }

  const lowerPrompt = prompt.toLocaleLowerCase();
  const lowerTerm = term.toLocaleLowerCase();
  const matches: PromptMatch[] = [];
  let cursor = 0;
  let matchIndex = lowerPrompt.indexOf(lowerTerm, cursor);

  while (matchIndex !== -1) {
    const end = matchIndex + term.length;
    matches.push({ start: matchIndex, end });
    cursor = end;
    matchIndex = lowerPrompt.indexOf(lowerTerm, cursor);
  }

  return matches;
}

function highlightPrompt(
  prompt: string,
  matches: PromptMatch[],
  activeMatchIndex: number,
  activeMarkRef: React.RefObject<HTMLElement | null>
): React.ReactNode {
  if (matches.length === 0) {
    return prompt;
  }

  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    if (match.start > cursor) {
      nodes.push(prompt.slice(cursor, match.start));
    }

    const active = index === activeMatchIndex;
    nodes.push(
      <mark
        key={`${match.start}:${match.end}`}
        ref={active ? activeMarkRef : undefined}
        className={active ? "activePromptMatch" : undefined}
        aria-current={active ? "true" : undefined}
      >
        {prompt.slice(match.start, match.end)}
      </mark>
    );
    cursor = match.end;
  });

  if (cursor < prompt.length) {
    nodes.push(prompt.slice(cursor));
  }

  return nodes;
}
