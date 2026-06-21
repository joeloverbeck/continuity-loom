import type { ParsedRecordHygieneFinding } from "../api.js";

interface HygieneFindingCardProps {
  finding: ParsedRecordHygieneFinding;
  citationMap: Readonly<Record<string, string>>;
  isKept: boolean;
  onKeep: (finding: ParsedRecordHygieneFinding) => void;
  onOpenRecord: (recordId: string) => void;
}

export function HygieneFindingCard({
  finding,
  citationMap,
  isKept,
  onKeep,
  onOpenRecord
}: HygieneFindingCardProps): React.JSX.Element {
  const actionTone = toneForAction(finding.action);

  return (
    <article className={`candidateCard hygieneFindingCard hygieneFindingCard-${actionTone}`} aria-labelledby={`hygiene-finding-${finding.number}`}>
      <div className="candidateHeader">
        <div>
          <p className="eyebrow">{actionLabel(finding.action)}</p>
          <h3 id={`hygiene-finding-${finding.number}`}>{finding.cluster}</h3>
        </div>
        <button type="button" className="secondaryButton" onClick={() => onKeep(finding)} disabled={isKept}>
          {isKept ? "Kept" : "Keep"}
        </button>
      </div>

      <dl className="metadataGrid">
        <div>
          <dt>Relation</dt>
          <dd>{finding.relation}</dd>
        </div>
        <div>
          <dt>Confidence</dt>
          <dd>{finding.confidence}</dd>
        </div>
        <div>
          <dt>Survivor</dt>
          <dd>{finding.survivor ?? "none"}</dd>
        </div>
      </dl>

      <section aria-label={`Citations for ${finding.cluster}`} className="citationChipList">
        {finding.citations.map((citation) => {
          const recordId = citationMap[citation];

          return recordId ? (
            <button
              type="button"
              className="citationChip"
              key={citation}
              onClick={() => onOpenRecord(recordId)}
            >
              {citation}
            </button>
          ) : (
            <span className="citationChip citationChip-warning" key={citation}>{citation}</span>
          );
        })}
      </section>

      <div className="slateCardBody">
        <p><strong>Shared core:</strong> {finding.sharedCore}</p>
        <p><strong>Material differences:</strong> {finding.materialDifferences}</p>
        <p><strong>Why it matters:</strong> {finding.whyItMatters}</p>
        <p><strong>Manual recommendation:</strong> {finding.manualRecommendation}</p>
        <p><strong>Reference caution:</strong> {finding.referenceCaution}</p>
      </div>
    </article>
  );
}

function toneForAction(action: string): string {
  switch (action) {
    case "KEEP_DISTINCT":
      return "protective";
    case "REMOVE":
      return "caution";
    case "HUMAN_REVIEW":
      return "review";
    default:
      return "standard";
  }
}

function actionLabel(action: string): string {
  switch (action) {
    case "KEEP_DISTINCT":
      return "Protective action: KEEP_DISTINCT";
    case "REMOVE":
      return "High caution action: REMOVE";
    case "HUMAN_REVIEW":
      return "Review required action: HUMAN_REVIEW";
    default:
      return `Suggested action: ${action}`;
  }
}
