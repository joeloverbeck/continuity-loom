import type {
  ParsedBriefProposal,
  ParsedRecordChangeProposal,
  ParsedRecordCreationProposal
} from "@loom/core";

import type { SegmentReconciliationKeeper } from "./keepers.js";

export type ReconciliationProposal =
  | { kind: "brief"; proposal: ParsedBriefProposal }
  | { kind: "record-change"; proposal: ParsedRecordChangeProposal }
  | { kind: "record-creation"; proposal: ParsedRecordCreationProposal };

interface ReconciliationProposalCardProps {
  item: ReconciliationProposal;
  isKept: boolean;
  onKeep: (keeper: SegmentReconciliationKeeper) => void;
  onCopy: (text: string) => void;
  onOpenRecord: (recordId: string) => void;
  onOpenBrief: () => void;
  onOpenBlankRecordEditor: (recordType: string) => void;
}

export function ReconciliationProposalCard({
  item,
  isKept,
  onKeep,
  onCopy,
  onOpenRecord,
  onOpenBrief,
  onOpenBlankRecordEditor
}: ReconciliationProposalCardProps): React.JSX.Element {
  const title = titleFor(item);

  return (
    <article className="candidateCard reconciliationProposalCard" aria-labelledby={`reconciliation-${item.kind}-${item.proposal.id}`}>
      <div className="candidateHeader">
        <div>
          <p className="eyebrow">{labelFor(item)}</p>
          <h3 id={`reconciliation-${item.kind}-${item.proposal.id}`}>{title}</h3>
        </div>
        <span className="status statusWarning">Suggestion only</span>
      </div>

      <dl className="metadataGrid">
        <div>
          <dt>Proposal</dt>
          <dd>{item.proposal.id}</dd>
        </div>
        <div>
          <dt>Action</dt>
          <dd>{actionFor(item)}</dd>
        </div>
      </dl>

      <section className="citationChipList" aria-label={`Evidence for ${title}`}>
        {item.proposal.evidence.map((citation) => (
          <span className="citationChip" key={`evidence-${citation}`}>{citation}</span>
        ))}
      </section>
      <section className="citationChipList" aria-label={`Contrast for ${title}`}>
        {item.proposal.contrast.map((citation) => (
          <span className="citationChip" key={`contrast-${citation}`}>{citation}</span>
        ))}
      </section>

      <div className="slateCardBody">
        {item.kind === "brief" ? (
          <>
            <p><strong>Field:</strong> {item.proposal.fieldPath}</p>
            <p><strong>Proposed value:</strong> {formatValue(item.proposal.proposedValue)}</p>
          </>
        ) : null}
        {item.kind === "record-change" ? (
          <>
            <p><strong>Record key:</strong> {item.proposal.recordKey}</p>
            <p><strong>Patch:</strong> {formatValue(item.proposal.patches)}</p>
            {item.proposal.lifecycleDestination ? <p><strong>Lifecycle destination:</strong> {item.proposal.lifecycleDestination}</p> : null}
          </>
        ) : null}
        {item.kind === "record-creation" ? (
          <>
            <p><strong>Record type:</strong> {item.proposal.recordType}</p>
            <p><strong>Payload:</strong> {formatValue(item.proposal.payload)}</p>
            <p><strong>Dependencies:</strong> {item.proposal.dependencies.length === 0 ? "none" : item.proposal.dependencies.join(", ")}</p>
          </>
        ) : null}
        <p><strong>Rationale:</strong> {item.proposal.rationale}</p>
      </div>

      <div className="previewToolbar" aria-label={`Review controls for ${title}`}>
        <button type="button" className="secondaryButton" onClick={() => onCopy(JSON.stringify(item.proposal, null, 2))}>
          Copy proposal
        </button>
        {item.kind === "brief" ? (
          <button type="button" className="secondaryButton" onClick={onOpenBrief}>
            Open Generation Brief
          </button>
        ) : null}
        {item.kind === "record-change" ? (
          <button type="button" className="secondaryButton" onClick={() => onOpenRecord(item.proposal.recordId)}>
            Open record
          </button>
        ) : null}
        {item.kind === "record-creation" ? (
          <button type="button" className="secondaryButton" onClick={() => onOpenBlankRecordEditor(item.proposal.recordType)}>
            Open blank typed editor
          </button>
        ) : null}
        <button type="button" className="secondaryButton" onClick={() => onKeep(item)} disabled={isKept}>
          {isKept ? "Kept" : "Keep"}
        </button>
      </div>
    </article>
  );
}

function titleFor(item: ReconciliationProposal): string {
  switch (item.kind) {
    case "brief":
      return item.proposal.fieldPath;
    case "record-change":
      return item.proposal.recordKey;
    case "record-creation":
      return item.proposal.recordType;
  }
}

function labelFor(item: ReconciliationProposal): string {
  switch (item.kind) {
    case "brief":
      return "Generation brief proposal";
    case "record-change":
      return "Existing record proposal";
    case "record-creation":
      return "New record proposal";
  }
}

function actionFor(item: ReconciliationProposal): string {
  return item.kind === "record-creation" ? "NEW_RECORD_REVIEW" : item.proposal.action;
}

function formatValue(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}
