import type {
  AffectedTarget,
  DiagnosticAction,
  GenerationReadiness,
  ReadinessDiagnostic,
  ReadinessDiagnosticGroup
} from "@loom/core";

export interface ReadinessChecklistActions {
  onFocusField: (field: string) => void;
  onOpenRecord: (recordId: string) => void;
  onOpenProviderSettings: () => void;
  onOpenWorkingSet: () => void;
  onCopyTechnicalJson: (diagnostic: ReadinessDiagnostic) => void;
}

interface ReadinessChecklistProps {
  readiness: GenerationReadiness;
  actions: ReadinessChecklistActions;
}

const groups: readonly {
  id: ReadinessDiagnosticGroup;
  title: string;
  empty: string;
}[] = [
  {
    id: "required-before-prompt-generation",
    title: "Required before prompt generation",
    empty: "No required readiness items."
  },
  {
    id: "recommended-for-stronger-output",
    title: "Recommended for stronger output",
    empty: "No recommendations."
  },
  {
    id: "prompt-length-salience-risk",
    title: "Prompt length / salience risks",
    empty: "No prompt length or salience risks."
  }
];

export function ReadinessChecklist({ readiness, actions }: ReadinessChecklistProps): React.JSX.Element {
  const diagnostics = [...readiness.blockers, ...readiness.provider.blockers, ...readiness.warnings];

  return (
    <section className="readinessChecklist" aria-labelledby="readiness-checklist-title">
      <div className="readinessSummary" role="status" aria-live="polite">
        <h3 id="readiness-checklist-title">{readiness.summary.headline}</h3>
        <p>{readiness.summary.nextAction}</p>
        <p className="muted">
          Blockers: {readiness.blockers.length + readiness.provider.blockers.length}. Warnings: {readiness.warnings.length}.
        </p>
        {readiness.unsavedDraft.readinessMayBeStale ? (
          <p className="status statusWarning">This draft has unsaved changes. The readiness checklist may be stale.</p>
        ) : null}
      </div>

      <div className="readinessGroups">
        {groups.map((group) => {
          const groupDiagnostics = diagnostics.filter((diagnostic) => diagnostic.group === group.id);
          const heading = `${group.title} (${groupDiagnostics.length})`;

          return (
            <section className="readinessGroup" aria-labelledby={`readiness-group-${group.id}`} key={group.id}>
              <h4 id={`readiness-group-${group.id}`}>{heading}</h4>
              <DiagnosticGroup
                diagnostics={groupDiagnostics}
                empty={group.empty}
                actions={actions}
              />
            </section>
          );
        })}
      </div>
    </section>
  );
}

function DiagnosticGroup({
  diagnostics,
  empty,
  actions
}: {
  diagnostics: readonly ReadinessDiagnostic[];
  empty: string;
  actions: ReadinessChecklistActions;
}): React.JSX.Element {
  if (diagnostics.length === 0) {
    return <p className="muted">{empty}</p>;
  }

  return (
    <ul className="readinessDiagnosticList">
      {diagnostics.map((diagnostic) => (
        <li key={diagnostic.dedupeKey}>
          <DiagnosticCard diagnostic={diagnostic} actions={actions} />
        </li>
      ))}
    </ul>
  );
}

function DiagnosticCard({
  diagnostic,
  actions
}: {
  diagnostic: ReadinessDiagnostic;
  actions: ReadinessChecklistActions;
}): React.JSX.Element {
  return (
    <article className={`readinessDiagnostic readinessDiagnostic-${diagnostic.severity}`}>
      <header className="readinessDiagnosticHeader">
        <span className="readinessSeverity">{diagnostic.severity === "blocker" ? "Blocker" : "Warning"}</span>
        <h5>{diagnostic.title}</h5>
      </header>
      <p>{diagnostic.summary}</p>
      <p>{diagnostic.whyItMatters}</p>
      <p>
        <strong>Fastest fix:</strong> {diagnostic.fastestFix}
      </p>
      {diagnostic.whenItBecomesBlocking ? (
        <p>
          <strong>When it blocks:</strong> {diagnostic.whenItBecomesBlocking}
        </p>
      ) : null}
      {diagnostic.whyThisIsNotBlocking ? (
        <p>
          <strong>Why this is not blocking:</strong> {diagnostic.whyThisIsNotBlocking}
        </p>
      ) : null}
      {diagnostic.ignoringIsReasonableWhen ? (
        <p>
          <strong>Ignoring is reasonable when:</strong> {diagnostic.ignoringIsReasonableWhen}
        </p>
      ) : null}

      {diagnostic.affected.length > 0 ? <AffectedTargets affected={diagnostic.affected} /> : null}
      <DiagnosticActions diagnostic={diagnostic} actions={actions} />
      <TechnicalDetails diagnostic={diagnostic} onCopy={actions.onCopyTechnicalJson} />
    </article>
  );
}

function AffectedTargets({ affected }: { affected: readonly AffectedTarget[] }): React.JSX.Element {
  return (
    <div className="readinessAffected">
      <strong>Affected</strong>
      <ul>
        {affected.map((target) => (
          <li key={`${target.kind}:${target.recordId ?? ""}:${target.fieldPath ?? ""}`}>
            {target.displayLabel ?? target.fieldPath ?? target.recordId ?? target.kind}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DiagnosticActions({
  diagnostic,
  actions
}: {
  diagnostic: ReadinessDiagnostic;
  actions: ReadinessChecklistActions;
}): React.JSX.Element {
  const visibleActions = diagnostic.actions.filter((action) => action.kind !== "copy-technical-json");

  if (visibleActions.length === 0) {
    return <div className="readinessActions" />;
  }

  return (
    <div className="readinessActions">
      {visibleActions.map((action) => (
        <button type="button" className="secondaryButton" key={`${action.kind}:${action.label}:${action.target ?? ""}`} onClick={() => runAction(action, actions)}>
          {action.label}
        </button>
      ))}
    </div>
  );
}

function TechnicalDetails({
  diagnostic,
  onCopy
}: {
  diagnostic: ReadinessDiagnostic;
  onCopy: (diagnostic: ReadinessDiagnostic) => void;
}): React.JSX.Element {
  return (
    <details className="readinessTechnical">
      <summary>Technical details</summary>
      <dl>
        <div>
          <dt>Legacy code</dt>
          <dd>{diagnostic.technical.legacyCode ?? "none"}</dd>
        </div>
        <div>
          <dt>Rule ID</dt>
          <dd>{diagnostic.technical.ruleId ?? "none"}</dd>
        </div>
        <div>
          <dt>Severity</dt>
          <dd>{diagnostic.severity}</dd>
        </div>
        <div>
          <dt>Raw paths</dt>
          <dd>{diagnostic.technical.rawPaths.length > 0 ? diagnostic.technical.rawPaths.join(", ") : "none"}</dd>
        </div>
        <div>
          <dt>Raw record IDs</dt>
          <dd>{rawRecordIds(diagnostic).join(", ") || "none"}</dd>
        </div>
      </dl>
      <button type="button" className="secondaryButton" onClick={() => onCopy(diagnostic)}>
        Copy technical JSON
      </button>
    </details>
  );
}

function runAction(action: DiagnosticAction, actions: ReadinessChecklistActions): void {
  switch (action.kind) {
    case "focus-field":
      if (action.target) {
        actions.onFocusField(action.target);
      }
      return;
    case "open-record":
      if (action.target) {
        actions.onOpenRecord(action.target);
      }
      return;
    case "open-provider-settings":
      actions.onOpenProviderSettings();
      return;
    case "open-working-set":
      actions.onOpenWorkingSet();
      return;
    case "copy-technical-json":
      return;
  }
}

function rawRecordIds(diagnostic: ReadinessDiagnostic): readonly string[] {
  return diagnostic.affected.flatMap((target) => target.recordId ? [target.recordId] : []);
}
