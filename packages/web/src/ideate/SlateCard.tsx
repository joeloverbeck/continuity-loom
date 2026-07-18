import type { ParsedIdeationIdea } from "../api.js";

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
  const title = idea.headline ?? idea.question ?? `Idea ${idea.slotNumber}`;

  return (
    <article className="slateCard" aria-labelledby={`ideation-idea-${idea.slotNumber}`}>
      <header className="slateCardHeader">
        <span className="operatorBadge">{idea.operator}</span>
        <h4 id={`ideation-idea-${idea.slotNumber}`}>{title}</h4>
      </header>
      {idea.why ? <p>{idea.why}</p> : null}
      <div className="citationChipList" aria-label={`Grounds for ${title}`}>
        {idea.grounds.map((ground) => (
          <span className={idea.unknownCitations.includes(ground) ? "citationChip citationChip-warning" : "citationChip"} key={ground}>
            {citations[ground] ?? ground}
          </span>
        ))}
      </div>
      {idea.unknownCitations.length > 0 ? (
        <p className="status statusWarning">Unknown citations: {idea.unknownCitations.join(", ")}</p>
      ) : null}
      <div className="slateCardActions">
        <button
          type="button"
          className="secondaryButton"
          onClick={() => onRegenerate(idea)}
          disabled={!canRegenerate}
        >
          Regenerate slot
        </button>
        <button type="button" onClick={() => onKeep(idea)} disabled={isKept || !canKeep}>
          {isKept ? "Kept" : "Keep"}
        </button>
      </div>
    </article>
  );
}
