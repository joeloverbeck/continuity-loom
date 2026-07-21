---
name: playtest-prd-prep
description: Reconcile one validated Continuity Loom author-playtest report against live repo and tracker state, preserve proven strengths, and write one same-stem change portfolio for playtest-to-issues custody before any later /to-prd pass. Invoke explicitly with a reports/playtest-*.md path; this skill diagnoses and prepares but does not implement or publish.
disable-model-invocation: true
---

# Playtest PRD Prep

Turn one `.claude/skills/playtest` report into
`reports/<playtest-report-stem>-prd-prep.md`. This run may write only that prep artifact. Never
edit the source report, product code, tests, docs, skills, specs, tickets, or tracker; never invoke
`/to-prd` or satisfy its seam checkpoint. The validated artifact goes through
`$playtest-to-issues` before any later `/to-prd` pass.

## Intake

Require one canonical `reports/playtest-<story-slug>-<timestamp>.md` path or an unambiguous glob.
Exclude assets and derivative `*-prd-prep.md` files. If needed, search `reports/`
case-insensitively and proceed only when exactly one report resolves.

Run:

```bash
node .claude/skills/playtest/scripts/validate-report.mjs --report <report>
node .claude/skills/playtest-prd-prep/scripts/validate-prd-prep.mjs --inspect-source <report>
```

Stop without writing when schema, privacy, or ledger failures make exhaustive disposition unsafe.
Continue when the inspector explicitly classifies a bounded historical prompt-evaluation mismatch
as nonblocking; disclose it and add the required `$skill-audit` maintenance follow-up without
repairing the source. Missing optional evidence, stale commits, unavailable tracker reads, and
failed reproduction are limitations, not source invalidation; affected items become verification
work.

Before analysis, record the canonical path, validation and inventory, run mode, prior-report
pointer and prior prep state, current same-stem prep state, branch, HEAD, and baseline worktree.

## Reconcile

### 1. Establish live evidence

1. Retain exact `git status --short --untracked-files=all`,
   `git branch --show-current`, and `git rev-parse HEAD` output. Pre-existing dirt remains
   unowned unless this run explicitly adopts it.
2. Read `AGENTS.md`, `docs/ACTIVE-DOCS.md`, `docs/principles/FOUNDATIONS.md`, affected active authorities,
   `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`, and `tickets/README.md`.
   Use `archive/**` only when explicitly routed as historical evidence.
3. Read the complete report and use its Cumulative Finding Ledger as the frontier. Follow only its
   explicit `prior_report` chain, and only when an `open`, `repeated`, or `not-retested` row
   lacks decision-relevant detail. Never scan unrelated reports.
4. Compare the launch HEAD with the current affected paths. Distinguish relevant committed drift,
   relevant worktree drift, and unrelated dirt. Classify report durability with tracked, clean,
   publication-ref-visible, and content-identical evidence; summarize but never cite machine-local
   evidence.
5. For a continuation, derive the prior report's same-stem prep. Treat it as historical
   recommendations, not authority. If present, reconcile its first action, every PRD candidate,
   and every non-PRD item as `consumed`, `still live`, `rejected`, or `superseded`; otherwise
   record `missing at intake`.
6. Apply the same reconciliation to any current same-stem prep before reusing it.
7. Search exact report terms and IDs across current open and relevant closed tracker work. Start
   with projected metadata; fetch bodies/comments only for likely owners. If unavailable, record
   that limitation and do not claim AFK-ready label certainty.

### 2. Disposition the report

Give every cumulative row exactly one disposition from the artifact contract; every prioritized ID
must already occur there. Treat observations as evidence, not mandates. Promote a stable rule only
when supported by current source/tests, repeated evidence, deterministic reproduction, or governing
authority. Preserve one-run ambiguity and model variability as verification, coverage, or research
unless a safe deterministic mitigation is justified.

Use evidence in this order: report and privacy-safe evidence; current authorities, implementation,
and focused tests; exact tracker overlap/closeout; focused read-only probes; then a browser
reproduction only if contradiction still blocks classification. For that last case, read
[`browser-driver.md`](../playtest/references/browser-driver.md), keep blank-key guarded localhost
state under `/tmp`, and do not start a full journey, accept prose, click provider controls, or make
OpenRouter requests.

Every strength is a preservation constraint, mapped globally or to the work it constrains with
regression evidence. It never creates scope. Finish with one supported disposition, destination,
and PRD impact for every row.

### 3. Build the smallest governed portfolio

Trace each report-derived rule across mechanically affected code, tests, active docs, and skills;
exclude work that does not trace to a row, strength, or required consistency consequence. Route:

- broad or risky product behavior to a PRD candidate;
- narrow scoped product work to a ticket candidate;
- playtest/report process work to skill maintenance;
- inaccurate active authority to a doc correction;
- conflict with closed work to verification/reopen;
- insufficient evidence to coverage or research; and
- covered, resolved, preference-only, duplicate, or disproportional work to covered/rejected.

Bundle PRD rows only when product rule, decision, implementation seam, and acceptance proof align.
Default to one first PRD plus deferred follow-ons; use a multi-PRD program only for real dependency
or shared ratification. No new PRD is valid.

Rank work by invariant risk, author trust/core-loop impact, severity, dependency, evidence,
testability, and strength-regression risk. `First operational action` is the first substantive
action custody must resolve—not `$playtest-to-issues`, `playtest-to-issues`, or `/to-prd`; use
`none - <reason>` when nothing precedes the remaining portfolio.

Describe behavior, authority, current seam, surfaces, acceptance, and testing at PRD-ready depth.
Avoid patch order, volatile symbols, components, or abstractions unless architecture makes them
unavoidable. If one material scope, sequence, or stewardship choice remains, ask one focused
question with a recommendation; do not run a routine requirements interview.

### 4. Write the artifact

Read [the artifact contract](references/prep-format.md) in full immediately before writing. Write
or rewrite the one default same-stem artifact at the contract's current version; never fork
numbered/timestamped copies. The producer owns migration of older or unversioned prep artifacts and
must account for all prior recommendations.

Consult `/to-prd` only for house style. Do not draft a PRD, create an issue, apply labels, or ask
its seam question; record that the checkpoint remains owed. Keep the artifact privacy-safe: no full
prompts, payloads, raw assistance, candidate/accepted prose, keys, localhost URLs, or machine-local
paths. Summarize temporary evidence as `summarized, not cited`.

The artifact must let `/to-prd` select and draft the intended package without rereading the source
for provenance, scope, strengths, authorities, sequencing, or deferrals.

### 5. Validate and close

Keep the contract's three self-checks at their draft values and run:

```bash
node .claude/skills/playtest-prd-prep/scripts/validate-prd-prep.mjs --draft <report> <prep-artifact>
```

Fix every error and compare emitted counts with the report. The helper proves shape/coverage, not
semantics. Manually review dispositions, grouping, authorities, preservation, evidence, privacy,
and stale language.

Immediately before the freshness check, capture full status and branch again, replace the final
worktree ledger with that exact snapshot, and classify every path. Then set the three final
self-check values and run:

```bash
node .claude/skills/playtest-prd-prep/scripts/validate-prd-prep.mjs <report> <prep-artifact>
```

After a pass, capture status and branch again. If either differs from the validated snapshot,
update the ledger, repeat affected semantic/privacy/freshness review, and revalidate until equal.
Do not run root gates for this report-only change; report focused checks and skipped broader gates.

Completion requires an accepted source inspection, exhaustive row and strength coverage, passing
final validation, completed semantic/privacy/freshness review, an exact worktree boundary, and the
`$playtest-to-issues` handoff.

Render this exact keyed block from the validated artifact as the final content:

```text
Source report: <canonical source report>
Prep artifact: <same-stem prep artifact>
First operational action: <substantive action or none - reason>
Publication verdict: <package and intended first PRD, or no-new-PRD result>
Deferred work: <every deferred PRD candidate, or none>
Non-PRD work: <every item and destination, or none>
Issue-custody handoff: $playtest-to-issues "<prep-artifact>"; required before /to-prd
Tracker and durability: <tracker limitations; source durability; artifact durability>
Intentional change: <authored prep artifact>
Remaining dirt:
- <path>: <pre-existing, concurrent/unowned, or intentional classification>
Non-actions: no implementation, source-report edit, tracker mutation, PRD publication, or /to-prd seam checkpoint occurred
```
