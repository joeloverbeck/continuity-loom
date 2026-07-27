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
    <article
      className={`candidateCard hygieneFindingCard hygieneFindingCard-${actionTone}${isKept ? " candidateCard-kept" : ""}`}
      aria-labelledby={`hygiene-finding-${finding.number}`}
    >
      <div className="scratchCardHeader">
        <div className="scratchCardHeading">
          <p className="eyebrow">{actionLabel(finding.action)}</p>
          <h3 id={`hygiene-finding-${finding.number}`}>{finding.cluster}</h3>
        </div>
        <div className="scratchBadgeRow">
          <span className={`scratchBadge scratchBadge-${actionTone}`}>{finding.action}</span>
          <button type="button" className="secondaryButton" onClick={() => onKeep(finding)} disabled={isKept}>
            {isKept ? "Kept" : "Keep"}
          </button>
        </div>
      </div>

      <div className="scratchCardLayout">
        <dl className="scratchCardMeta">
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

        <div className="scratchCardBody">
          <HygieneField label="Shared core" value={finding.sharedCore} />
          <HygieneField label="Material differences" value={finding.materialDifferences} />
          <HygieneField label="Why it matters" value={finding.whyItMatters} />
          <HygieneField label="Manual recommendation" value={finding.manualRecommendation} />
          <HygieneField label="Reference caution" value={finding.referenceCaution} />

          <div className="citationGroup">
            <span className="citationGroupLabel">Citations</span>
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
          </div>
        </div>
      </div>
    </article>
  );
}

function HygieneField({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="scratchCardField">
      <span className="scratchFieldLabel">{label}</span>
      <p>{value}</p>
    </div>
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
