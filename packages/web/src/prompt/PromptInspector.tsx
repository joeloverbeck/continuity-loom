import type { CompileResult } from "@loom/core";
import { useMemo } from "react";

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
  const highlightedPrompt = useMemo(() => highlightPrompt(result.prompt, searchTerm), [result.prompt, searchTerm]);
  const matchCount = countMatches(result.prompt, searchTerm);

  return (
    <>
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
    </>
  );
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
