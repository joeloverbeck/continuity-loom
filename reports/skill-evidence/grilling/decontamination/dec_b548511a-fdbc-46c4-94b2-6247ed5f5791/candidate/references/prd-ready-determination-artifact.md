# PRD-Ready Determination Artifact

Load this reference only when the user asks `grilling` to prepare a report-cited or determination run for a later `to-prd` pass.

## Quick path

1. Apply the read-only guardrail first. `No file` or `recap only` means return the determination in conversation.
2. Inspect the cited source, current authorities, implementation, and narrow tracker overlap. Reconcile stale claims and classify findings as fixed, fresh scope, follow-on, coverage-only, or no-op.
3. Classify local sources as durable, dirty, untracked, or temporary. Prove tracked and publication-ref-visible status before promising stable citations; otherwise mark them pending publication or summarize them without citation.
4. Package coupled findings together only when they share the same decision, seam, and acceptance proof. Keep independently implementable outcomes separate.
5. When writing is permitted but the artifact home is unresolved, ask one question naming the recommended path and a `recap only, no file` alternative.
6. Consult `to-prd` for house style only. Its publication and testing-seam checkpoints remain owed.
7. Read repository tracker and label guidance when the artifact proposes labels, issue slices, or guidance-checklist mappings.

If priorities remain tied, prefer blocker severity, direct field evidence, dependency order, and proof readiness; otherwise ask the user which candidate goes first.

## Artifact skeleton

### Header

- Source and selected section.
- Source durability and publication visibility.
- Authored artifact status.
- Checkout and tracker freshness.
- Deliverable boundary: determination only unless another action actually occurred.

### Verdict

- What current evidence closes.
- What remains product work.
- Recommended first PRD or program shape.
- Follow-ons and coverage-only work.

### Evidence and authorities

For each material finding, record its status and PRD impact. Name current authorities, implementation checks, prior work, tracker overlap, and any supporting-skill result that shaped the verdict.

### Recommended first PRD

State purpose, problem, governing sources, recommended seam or product rule, scope, acceptance, likely issue slices when useful, and out-of-scope boundaries.

### Follow-ons and coverage

Keep deferred candidates separate. For each, state purpose, evidence, open design point, scope, acceptance, and the trigger that would promote coverage or research into product work.

### Rejected or no-op alternatives

Name consequential alternatives and why they lose. Do not preserve incidental exploration.

### Publication inputs

Include:

- suggested title and one-PRD/program posture;
- recommended testing seam, explicitly still owed at `to-prd`;
- governing principles, ADRs, specs, tracker IDs, and stable sources;
- likely verification modes and canonical gates;
- label or issue-shape guidance when supported by current repo authorities; and
- source-durability warnings.

### Freshness and boundaries

State what was refreshed, what was not checked, tests or app runs skipped and why, pre-existing worktree dirt, and files intentionally changed.

## Before close

Verify that the artifact:

- does not treat consultation as publication;
- distinguishes stable citations from pending or temporary evidence;
- preserves the selected candidate and unconsumed follow-ons;
- leaves the later testing-seam checkpoint open;
- contains no accidental machine-local source reference; and
- reports its current worktree/durability posture.
