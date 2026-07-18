---
name: playtest-prd-prep
description: Reconcile one validated Continuity Loom author-playtest report against live repo and tracker state, preserve proven strengths, and write one same-stem PRD-ready change portfolio for a later /to-prd pass. Invoke explicitly with a reports/playtest-*.md path; this skill diagnoses and prepares but does not implement or publish.
disable-model-invocation: true
---

# Playtest PRD Prep

Reconcile a `.claude/skills/playtest` report into one PRD-ready portfolio. The stopping point is
`reports/<playtest-report-stem>-prd-prep.md`. Do not edit the source report, product code, tests,
docs, skills, specs, tickets, or tracker state; do not invoke `/to-prd` or satisfy its seam
checkpoint.

## Input

Require one canonical `reports/playtest-<story-slug>-<timestamp>.md` path or an unambiguous glob.
Exclude evidence assets and derivative `*-prd-prep.md` files. If the path does not resolve, search
case-insensitively under `reports/` and proceed only when one report resolves.

Validate the report and inspect its downstream inventory before trusting it:

```bash
node .claude/skills/playtest/scripts/validate-report.mjs --report <report>
node .claude/skills/playtest-prd-prep/scripts/validate-prd-prep.mjs --inspect-source <report>
```

If schema, privacy, or ledger errors make exhaustive disposition unsafe, stop without writing or
updating the prep artifact. The source inspector may downgrade a bounded prompt-evaluation metadata
or disclosure mismatch to a non-blocking validator defect when the finding inventory remains
complete; carry that defect into source validation and skill-maintenance follow-up. Identify every
report or `playtest`-methodology repair and route skill repair through `$skill-audit`; never repair
the source during prep. Missing optional evidence, stale commits, unavailable tracker reads, or
failed reproduction do not invalidate the source: continue with explicit limitations and classify
affected items as verification work.

Complete intake only when the canonical source path, source validation, report inventory, run
mode, prior-report pointer, same-stem prep state, branch, HEAD, and baseline worktree dirt are
known.

## Reconcile

### 1. Establish live provenance

1. Retain exact `git status --short`, `git branch --show-current`, and `git rev-parse HEAD` output.
   Treat pre-existing dirt as unowned unless this invocation explicitly adopts it.
2. Read `AGENTS.md`, `docs/ACTIVE-DOCS.md`, `docs/FOUNDATIONS.md`, and the active domain authorities
   for every affected surface. Read `docs/agents/issue-tracker.md`,
   `docs/agents/triage-labels.md`, and `tickets/README.md` before assigning destinations or label
   posture. Treat `archive/**` only as explicitly routed historical evidence.
3. Read the complete named report. Use its Cumulative Finding Ledger as the inventory frontier.
   Follow the explicit `prior_report` chain only for `open`, `repeated`, or `not-retested` rows
   whose decision-relevant detail is absent from the frontier report. Never scan unrelated reports.
4. Compare the report's launch HEAD with the current tree over affected paths. A changed HEAD is
   not itself drift; distinguish relevant committed drift, relevant worktree drift, and unrelated
   report/skill drift.
5. Classify the source report's durability using tracked, clean, publication-ref-visible, and
   publication-ref-content-identical evidence. Summarize machine-local evidence; never cite its
   path as durable.
6. Check the default same-stem prep path. If it exists, classify it as current, partially consumed,
   stale, superseded, or not relevant. Reconcile every prior recommendation as `consumed`,
   `still live`, `rejected`, or `superseded` before reusing it.
7. Search current open work and relevant closed tracker work from exact report terms and IDs.
   Start with projected metadata; fetch full bodies or comments only for likely owners. If tracker
   access is unavailable, record the limitation and do not claim AFK-ready label certainty.

This step is complete only when every authority and freshness source needed to judge the report is
checked or explicitly unavailable, and any existing prep recommendation has a current disposition.

### 2. Disposition every report row

Give every Cumulative Finding Ledger row exactly one disposition from the output contract. Current
Prioritized Findings must already occur in that cumulative ledger; never invent a parallel ID.

Treat report rows as credible observations, not automatic mandates. Promote an observation into a
stable change only when current source, tests, repeated evidence, deterministic reproduction, or a
governing authority supports the desired rule. Preserve one-run ambiguity and model variability as
verification, coverage, or research follow-up unless a safe deterministic mitigation is justified.

Use this evidence ladder:

1. report detail and privacy-safe retained evidence;
2. current authorities, implementation, and focused tests;
3. exact open/closed tracker overlap and closeout evidence;
4. focused read-only probes; then
5. a targeted browser reproduction only when drift or contradiction still blocks classification.

For a targeted browser reproduction, read
[`../playtest/references/browser-driver.md`](../playtest/references/browser-driver.md), reuse the
blank-key guarded localhost boundary, and keep diagnostic state under `/tmp`. Do not start another
full author journey, accept prose, click provider controls, or make OpenRouter requests.

Every `strength` / `preserve-strength` row is a preservation constraint. Map it to `global` or to
the candidates it constrains and name regression evidence. Do not turn a strength into new scope.

This step is complete only when every source row has one disposition, current evidence, a change
destination, and PRD impact; every strength has one preservation row; and no uncategorized blocker
remains.

### 3. Determine the change portfolio

Follow each report-derived rule across every mechanically affected code, test, active-doc, and
skill surface. Exclude adjacent issues that do not trace to a report row, preserved strength, or
required consistency consequence.

Route work to its smallest governed destination:

- broad or risky product behavior becomes a PRD candidate and names any required spec, ADR, active
  doc, test, or skill changes;
- narrow, already-scoped product work becomes a ticket candidate;
- pure playtest-methodology or report-schema work becomes skill maintenance;
- an active authority that misstates current behavior becomes a doc correction;
- contradictions with closed work become verification/reopen work;
- insufficient evidence becomes coverage or research follow-up; and
- covered, resolved, preference-only, or disproportional work becomes covered or rejected.

Bundle PRD rows only when they share the same product rule, decision point, implementation seam,
and acceptance proof. Default to one recommended first PRD plus deferred follow-ons. Use a
multi-PRD program only when independently implementable outcomes have a real dependency or require
one shared ratified direction. It is valid to recommend no new PRD.

Rank the first PRD by constitutional/invariant risk, blocker or author-trust impact, core-loop
severity, dependency order, evidence strength, proof readiness, and strength-regression risk.
Keep `First operational action` separate from the first new PRD when verification, a reopen, or
skill maintenance must happen first.

Describe behavior, authority, the existing seam, affected surfaces, acceptance, and testing at
PRD-ready depth. Do not prescribe patch order, volatile symbols, components, or new abstractions
unless current architecture makes the constraint unavoidable.

If one material product-scope, sequence, or stewardship choice remains after the evidence ladder,
ask one focused question with a recommendation. Do not conduct a routine requirements interview or
offload classifications to the user.

This step is complete only when the portfolio has one publication verdict, one first operational
action, explicit non-PRD destinations, deferred work, rejected alternatives, and preservation
constraints.

### 4. Write the same-stem prep artifact

Read [Prep artifact contract](references/prep-format.md) in full immediately before writing. Write
or update the default same-stem artifact; never fork numbered or timestamped copies. On rerun, carry
the prior-recommendation consumption ledger into the updated artifact.

Consult `/to-prd` for house style only: publication-package vocabulary, source durability, label
posture, browser-visible checklist mapping, and recommended testing seams. Do not draft or stage a
PRD body, create an issue, apply labels, or ask `/to-prd`'s seam-confirmation question. Record that
the seam checkpoint remains owed.

Keep the artifact privacy-safe. Do not copy full prompts, record payloads, raw assistance output,
candidate or accepted prose, API keys, localhost URLs, or machine-local paths. Summarize temporary
evidence and classify it as `summarized, not cited`.

This step is complete only when `/to-prd` could select and draft the intended package without
re-reading the full playtest report to recover provenance, scope, preserved strengths, authority
impact, sequencing, or deferred work.

### 5. Validate and close

Keep the `## Completion Self-Check` fields at their draft `pending` values while validating shape.
Run:

```bash
node .claude/skills/playtest-prd-prep/scripts/validate-prd-prep.mjs --draft <report> <prep-artifact>
```

Fix every structural or privacy error. Compare the emitted source and output counts with the report
tables; the helper proves shape and coverage, never semantic correctness. Manually review each
disposition, candidate grouping, authority impact, preservation constraint, and evidence claim,
then complete the privacy and freshness scans. Only after those checks actually complete, replace
the three draft self-check values with the final values from the artifact contract and run:

```bash
node .claude/skills/playtest-prd-prep/scripts/validate-prd-prep.mjs <report> <prep-artifact>
```

Fix every final-validation error and rerun until it passes. Never leave final completion claims in
an artifact that has not passed the final command.

Re-run `git status --short` and `git branch --show-current`. Classify every remaining path as the
intentional prep artifact, pre-existing, or concurrent/unowned. Do not run root gates merely for a
report-only prep; report focused tests, probes, browser checks, and broader gates skipped.

Before sending the final response, complete this closeout checklist from the validated artifact:

- `Source report`: name the canonical source.
- `Prep artifact`: name the same-stem deliverable.
- `First operational action`: state the selected next action.
- `Publication verdict`: state the package and intended first PRD or no-new-PRD result.
- `Deferred work`: name every deferred PRD candidate, or `none`.
- `Non-PRD work`: name every Non-PRD Follow-Up item with its destination, or `none`.
- `Tracker and durability`: state tracker limitations and both source and artifact durability.
- `Intentional change`: name the authored prep artifact.
- `Remaining dirt`: name and classify every remaining path individually.
- `Non-actions`: state explicitly that no implementation, source-report edit, tracker mutation, PRD
  publication, or `/to-prd` seam checkpoint occurred.

The run is complete only when the source inspector reports `passed` or `nonblocking-defects` with
the required skill-maintenance follow-up, every source row and strength is covered, the final prep
validator passes, semantic review is recorded, privacy and freshness scans are clear, and the final
worktree boundary is reconciled.
