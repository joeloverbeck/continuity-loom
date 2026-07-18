---
name: playtest
description: Playtest Continuity Loom as a source-and-doc-blind author in the real browser, creating a new story or continuing from a supplied playtest report through one accepted local prose segment. Use when the user asks to playtest the app with a story premise, asks to create a story through the app, or supplies a prior playtest report and asks to continue it. Evaluates prose, Ideate, Record Hygiene, and Segment Reconciliation prompts with cold-context subagents without making OpenRouter requests, then writes a cumulative evidence-backed report.
---

# Continuity Loom Author Playtest

One invocation is one sincere author journey through the visible app, ending after exactly one
new accepted segment and post-acceptance continuity work, or after the blocker policy is
exhausted. Always produce a report. Observe and report; never fix the app during the run.

## Non-negotiables

- **Instructed, source-and-doc-blind.** Follow this workflow, but learn the product itself through
  visible UI and field help—not source, tests, app docs, APIs, SQLite, or hidden state. For a new
  story, seal the intended story, expectations, and initial mental model before opening the app.
  This method does not establish uninstructed human discoverability. A Cold First-View Witness
  measures only first-screen comprehension and never human transfer or a full unaided journey.
- **Returning author on continuation.** Read only the report the user supplied, reopen its
  `/tmp` project through the UI, and verify the latest accepted segment in Accepted Segments.
  Do not search for or read unrelated earlier reports.
- **Visible UI only.** Create and edit project data through controls a human sees. Do not call
  app APIs directly, mutate the DOM, inject state, edit project files, or use console/runtime
  evaluation to advance the story.
- **No paid requests.** Start an isolated app process with an explicitly blank
  `OPENROUTER_API_KEY` and temporary settings directory. Start the guarded browser before the
  first navigation. Never click Generate, Ideate, Analyze, Review, refresh-model, or any other
  control that sends to OpenRouter. A provider request attempt is a run defect even when the
  guard blocks it.
- **Cold prompt proof.** Extract only a prompt visibly exposed by the app, pass that exact prompt
  to a fresh cold-context subagent, and receive its raw response. Give the subagent no story
  brief, expected answer, suspected defect, prior response, or repository context beyond the
  prompt file.
- **Human gatekeeping.** Judge raw assistance before manually re-authoring useful suggestions in
  Records or Generation Brief. Judge raw prose before pasting it through **Write or paste
  candidate**, visibly editing it, and accepting it. Never treat assistance output or accepted
  prose as automatic continuity authority.
- **Naturalistic coverage.** Fill fields and use Private Notes, Ideate, Record Hygiene, and
  Segment Reconciliation when a sincere author would. Do not manufacture irrelevant data merely
  to tick a feature box; record every skipped surface and why it was not naturally needed.
- **Transient story data.** New projects, prompts, raw subagent responses, candidate prose,
  routine screenshots, settings, and the structured scratchpad stay under `/tmp`. Continuation
  works only while the project path named by the supplied report still exists.
- **Privacy-safe reports.** Never put full prompts, full record payloads, candidate prose,
  accepted prose, API keys, or raw assistance responses in `reports/`. Retain fingerprints,
  counts, short necessary excerpts, assessments, and carefully selected screenshots only.
- **Custody.** The run may add its report and evidence directory, update the method register's
  privacy-safe coverage and method-signal rows after final report validation, advance only the
  bounded-pilot state table below at that same post-validation point, and create `/tmp` data. It
  must not edit any other source, tests, docs, dependencies, configuration, existing reports, or
  unrelated worktree changes. Never overwrite an earlier report or evidence directory.

## Bounded method pilots

These instruments are temporary pilots, not permanent coverage claims:

- On the next naturally occurring new-story run, capture at most one sealed Cold First-View
  Witness before the main operator inspects the first screen, then stop for an explicit `keep`,
  `revise`, or `retire` decision.
- On at most one naturally qualifying assistance prompt per run, collect two byte-identical fresh
  draws. The initial eligible kind is Segment Reconciliation. The pilot stops for an explicit
  `keep`, `revise`, or `retire` decision after two qualifying pairs.
- Before finalizing each of the first two reports that contain decision-driving claims, challenge
  at most three such claims independently and resolve them as `supported`, `narrowed`,
  `contradicted`, or `insufficient`.
- The privacy-safe method register stops after its third natural-run row for an explicit `keep`,
  `revise`, or `retire` decision. Never read it before or during the author journey.

If a pilot does not trigger naturally, record it as pending rather than manufacturing eligibility.
At a pilot's sunset, do not claim saturation, reliability, or method validity; route the explicit
disposition through skill maintenance.

### Authoritative pilot state

This table is the sole pre-journey state source. Do not inspect the method register or unrelated
reports to reconstruct counts.

| Instrument                         | State  | Completed | Sunset |
| ---------------------------------- | ------ | --------: | -----: |
| Cold First-View Witness            | active |         0 |      1 |
| Paired-Draw Check                  | active |         0 |      2 |
| Independent Claim Challenge report | active |         0 |      2 |
| Method-register natural-run row    | active |         2 |      3 |

Only after the final report validation passes:

1. increment Cold First-View when `cold_first_view_witnesses` is `1`;
2. increment Paired-Draw when `paired_draw_checks` is `1`;
3. increment Independent Claim Challenge report once when
   `independent_claim_challenges` is greater than `0`;
4. increment the method-register row only after that row is appended; and
5. change any instrument reaching its sunset from `active` to `awaiting-disposition`.

No historical run increments the three prospective witness pilots. An `awaiting-disposition`,
`kept`, `revised`, or `retired` instrument does not run again unless its explicit owner disposition
changes this table and, when needed, its sunset. Apart from those cells, a playtest invocation must
not edit this skill. Reaching a sunset does not interrupt report validation or cleanup: mark the
state `awaiting-disposition`, finish custody, and request the owner's `keep`, `revise`, or `retire`
decision in the final response.

## Process

### 1. Prepare the author journey

Read [Run setup](references/run-setup.md) and [Observation scratchpad](references/observation-log.md).
Run `scripts/prepare-run.mjs`, capture the worktree baseline, and fill the scratchpad's story
intent, author expectations, sealed mental model, and run plan before launching the app. For a
continuation, confirm the supplied report resolves to an existing `/tmp` project. Done when all
run paths exist, the baseline is recorded, and the pre-use expectations are complete.

### 2. Launch the isolated app and guarded browser

Read [Browser driver](references/browser-driver.md). Build the app, start `safe-app-session.mjs`,
then start `browser-session.mjs` before the first navigation. Do not reuse an existing server or
browser. Done when the app holder reports its loopback URL, the 1440x900 browser session reports
its safety state, and provider-request capture began before navigation. For a pending new-story
first-view witness, defer all parent-context screen inspection until Step 3.

### 3. Enter as a new or returning author

Read [Author journey](references/author-journey.md). On a new run, capture the sealed first-view
witness when its authoritative state is `active`, then independently assess the unopened project screen before
creating the planned `/tmp` project. On a continuation, open the supplied project,
visit Accepted Segments, and establish the latest accepted sequence without copying accepted
prose into prompt-facing fields. Done when the scratchpad records what the UI confirmed,
corrected, or left unclear about the initial mental model and continuation state.

### 4. Author the next local segment

Follow the authoring loop in [Author journey](references/author-journey.md): configure the story,
create and curate records, use Private Notes only as inert scratch, curate the active working set
and cast functions, fill a natural Generation Brief, and resolve readiness through the UI.
Record the intended influence of every deliberately populated Generation Brief field before
compiling. Done when readiness permits prompt inspection or the blocker policy terminates the
run.

### 5. Evaluate prompts without OpenRouter

Read [Cold prompt evaluation](references/prompt-evaluation.md). Extract the visible prose prompt
to `/tmp`, dispatch one fresh cold subagent, assess its untouched response, and allow at most one
fresh retry. When a naturally qualifying assistance prompt reaches the active paired-draw pilot,
predeclare the useful output classes and collect exactly two fresh byte-identical draws regardless
of Draw A's result; assess them separately and do not take a third draw. Use one targeted
counterfactual probe only when it can clarify a high-impact ignored field; never use that
diagnostic response in the app. Evaluate Ideate, Record Hygiene, and Segment Reconciliation the
same way when naturally invoked. Done when every invoked prompt has a structured usefulness
verdict and every populated Generation Brief field has an influence verdict or `not assessable`.

### 6. Accept one segment and reconcile continuity

Paste the chosen raw prose through **Write or paste candidate**, make ordinary author edits in
the visible editor, and record the intervention burden before accepting exactly one segment.
Inspect the durable-change reminder. Use Segment Reconciliation and Record Hygiene when the
accepted segment or record set makes them useful; re-author adopted suggestions manually. Done
when the accepted sequence is visibly confirmed and records, Generation Brief, and working set
represent the author's chosen continuity for a later run, or a post-acceptance blocker is logged.

### 7. Report and close

Read [Blockers and diagnostics](references/blockers-and-diagnostics.md) when any probable blocker
or visible defect appears, then read [Report format](references/report-format.md). Consolidate the
scratchpad into a new schema-v2 cumulative report. Before publication, independently challenge up
to three eligible decision-driving claims when that pilot state is `active`, and let the main
operator retain resolution authority.
Close browser and app sessions, remove session plumbing and uncited evidence, then validate with
`scripts/validate-report.mjs`. Keep the scratchpad and temporary exchange files until the report
passes; then delete them, rerun the validator, and compare final worktree status with the baseline.
Only after that final pass, open and update `reports/playtest-method-register.md` when its pilot is
still active, then advance the report-derived authoritative pilot-state cells above. Advance the
method-register counter only when its row was successfully appended. Compare final worktree status
with the baseline again, allowing only the declared custody deltas. On successful close, remove the
exact run root created under
`/tmp/continuity-loom-playtest/` but preserve the separate `/tmp` story project. Done only when the
report validator passes, no OpenRouter request was attempted, run-owned processes are stopped, and
the final response names the report and custody result.
