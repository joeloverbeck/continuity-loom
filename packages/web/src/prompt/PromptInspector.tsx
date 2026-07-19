import type { CompileResult } from "@loom/core";
import { useEffect, useMemo, useRef, useState } from "react";

export interface PromptInspectorProps {
  result: CompileResult;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
}

export function PromptInspector({
  result,
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
    </>
  );
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
