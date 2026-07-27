import { useState } from "react";

import type { ParsedIdeationIdea } from "../api.js";
import { citationKeyText } from "./citation-key.js";

export interface SlateCardProps {
  idea: ParsedIdeationIdea;
  citations?: Readonly<Record<string, string>>;
  isKept: boolean;
  canKeep?: boolean;
  canRegenerate?: boolean;
  onKeep: (idea: ParsedIdeationIdea) => void;
  onRegenerate: (idea: ParsedIdeationIdea) => void;
}

export function SlateCard({
  idea,
  citations = {},
  isKept,
  canKeep = true,
  canRegenerate = true,
  onKeep,
  onRegenerate
}: SlateCardProps): React.JSX.Element {
  const [showFullGrounds, setShowFullGrounds] = useState(false);
  const title = slateCardTitle(idea);
  const headingId = `ideation-idea-${idea.slotNumber}`;
  const hasResolvedLabel = idea.grounds.some((ground) => Boolean(citations[ground]));

  return (
    <article className={cardClassName(idea, isKept)} aria-labelledby={headingId}>
      <header className="scratchCardHeader">
        <span className="operatorBadge">{idea.operator}</span>
        <div className="scratchBadgeRow">
          <span className="scratchBadge">Slot {idea.slotNumber}</span>
          {idea.skipped ? <span className="scratchBadge scratchBadge-uncertain">Skipped</span> : null}
          {isKept ? <span className="scratchBadge scratchBadge-session">Kept</span> : null}
        </div>
      </header>

      <div className="slateCardLayout">
        <div className="scratchCardBody">
          <h4 id={headingId} className="slateCardStatement">{title}</h4>
          {idea.skipped ? <p className="slateCardWhy">No compiled record supports this slot.</p> : null}
          {idea.why ? <p className="slateCardWhy">{idea.why}</p> : null}
        </div>

        {idea.grounds.length > 0 ? (
          <section className="groundRail">
            <p className="scratchFieldLabel">Grounded in</p>
            <div
              className={showFullGrounds ? "groundList groundList-expanded" : "groundList"}
              aria-label={`Grounds for ${title}`}
            >
              {idea.grounds.map((ground) => {
                const label = citations[ground];
                return (
                  <span
                    className={idea.unknownCitations.includes(ground) ? "groundChip groundChip-warning" : "groundChip"}
                    key={ground}
                  >
                    <span className="groundChipKey">{citationKeyText(ground)}</span>
                    {label ? <span className="groundChipLabel">{label}</span> : null}
                  </span>
                );
              })}
            </div>
            {hasResolvedLabel ? (
              <button
                type="button"
                className="groundToggle"
                aria-expanded={showFullGrounds}
                onClick={() => setShowFullGrounds((shown) => !shown)}
              >
                {showFullGrounds ? "Hide full grounds" : "Show full grounds"}
              </button>
            ) : null}
          </section>
        ) : null}
      </div>

      {idea.unknownCitations.length > 0 ? (
        <p className="status statusWarning">
          Unknown citations: {idea.unknownCitations.map(citationKeyText).join(", ")}
        </p>
      ) : null}

      <footer className="scratchCardFooter">
        <div className="scratchCardActions">
          {/* A skipped slot carries no headline, rationale, or grounds, so there is nothing to keep. */}
          {idea.skipped ? null : (
            <button type="button" onClick={() => onKeep(idea)} disabled={isKept || !canKeep}>
              {isKept ? "Kept" : "Keep"}
            </button>
          )}
          <button
            type="button"
            className="secondaryButton"
            onClick={() => onRegenerate(idea)}
            disabled={!canRegenerate}
          >
            Regenerate slot
          </button>
        </div>
      </footer>
    </article>
  );
}

export function slateCardTitle(
  idea: Pick<ParsedIdeationIdea, "headline" | "question" | "slotNumber"> & { skipped?: true }
): string {
  if (idea.skipped) {
    return `Skipped slot ${idea.slotNumber}`;
  }

  return idea.headline ?? idea.question ?? `Idea ${idea.slotNumber}`;
}

function cardClassName(idea: ParsedIdeationIdea, isKept: boolean): string {
  if (idea.skipped) {
    return "candidateCard candidateCard-skipped";
  }

  return isKept ? "candidateCard candidateCard-kept" : "candidateCard";
}
