---
name: playtest
description: Playtest Continuity Loom as a source-and-doc-blind author in the real browser, creating a new story or continuing from a supplied playtest report through one accepted local prose segment. Use when the user asks to playtest the app with a story premise, asks to create a story through the app, or supplies a prior playtest report and asks to continue it. Evaluates the prose prompt and any naturally invoked Ideate, Record Hygiene, or Accepted-Segment Change Review prompts with cold-context subagents without making OpenRouter requests, then writes a cumulative evidence-backed report.
---

# Continuity Loom Author Playtest

One invocation is one sincere author journey through the visible app, ending after exactly one
new accepted segment and post-acceptance continuity work, or after the blocker policy is
exhausted. Always produce a report. Observe and report; never fix the app during the run.

## Non-negotiables

- **Instructed, source-and-doc-blind.** Follow this workflow, but learn the product itself through
  visible UI and field help—not source, tests, app docs, APIs, SQLite, or hidden state. For a new
  story, seal the intended story, expectations, and initial mental model before opening the app.
  This method does not establish uninstructed human discoverability or a fully unaided journey.
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
  Accepted-Segment Change Review when a sincere author would. Do not manufacture irrelevant data
  merely to tick a feature box; record every skipped surface and why it was not naturally needed.
- **Transient story data.** New projects, prompts, raw subagent responses, candidate prose,
  routine screenshots, settings, and the structured scratchpad stay under `/tmp`. Continuation
  works only while the project path named by the supplied report still exists.
- **Privacy-safe reports.** Never put full prompts, full record payloads, candidate prose,
  accepted prose, API keys, or raw assistance responses in `reports/`. Retain fingerprints,
  counts, short necessary excerpts, assessments, and carefully selected screenshots only.
- **Custody.** The run may add its report and evidence directory and create `/tmp` data. It
  must not edit any other source, tests, docs, dependencies, configuration, existing reports, or
  unrelated worktree changes. Never overwrite an earlier report or evidence directory.

## Bounded method pilots

All three original bounded pilots reached their sunsets and received explicit owner dispositions on
2026-07-22:

- **Independent Claim Challenge — KEPT as a standing method.** It is no longer a sunset-bounded
  pilot: apply it to every future report that contains decision-driving claims. Before finalizing
  such a report, challenge at most three of those claims independently and resolve each as
  `supported`, `narrowed`, `contradicted`, or `insufficient`. Across its two trial reports it
  narrowed two over-broad claims and supported four; the check earns its place as standing
  report-calibration rigor. Its frozen Completed/Sunset counts below are historical pilot totals
  only and no longer gate whether it runs.
- **Cold First-View Witness — RETIRED.** It no longer runs. Its single trial was mostly concordant
  with the operator's own required doc-blind first-view assessment; its scope is explicitly narrow
  (first-screen comprehension only, never human transfer or uninstructed discoverability); and it
  fires only on rare new-story runs. The sealed-packet and perception-order protocol was not worth
  the marginal independent signal.
- **Method register — RETIRED.** It is no longer opened or updated after a run. It served its
  routing purpose (it promoted the adopted first-view/challenge and paired-draw method changes) and
  its own third-row checkpoint returned only thin forward value against a per-run update cost.
  `reports/playtest-method-register.md` survives as historical method evidence only.

The retired Segment Reconciliation Paired-Draw Check no longer runs. The
[Change Review delta comparison](references/prompt-evaluation.md#change-review-delta-comparison) is
its replacement, but it is a standing part of the post-acceptance method rather than a sunset-bounded
pilot: it does not reuse the paired-draw counter, evidence tags, or bounded-pilot machinery, and its
per-comparison work is recorded through `change_review_comparisons` and the schema-v3 report
disclosure.

If a pilot does not trigger naturally, record it as pending rather than manufacturing eligibility.
At a pilot's sunset, do not claim saturation, reliability, or method validity; route the explicit
disposition through skill maintenance.

### Authoritative pilot state

This table is the sole pre-journey state source. Do not inspect the method register or unrelated
reports to reconstruct counts.

| Instrument                         | State  | Completed | Sunset |
| ---------------------------------- | ------ | --------: | -----: |
| Cold First-View Witness            | retired |         1 |      1 |
| Paired-Draw Check                  | retired |         2 |      2 |
| Independent Claim Challenge report | kept (standing) |         2 |      2 |
| Method-register natural-run row    | retired |         3 |      3 |

All bounded pilots are now resolved, so a playtest run no longer advances any Completed/Sunset
count. The Cold First-View Witness, Paired-Draw Check, and Method-register rows are `retired` and
never run. The Independent Claim Challenge is a `kept (standing)` method whose per-report use is
recorded only through the `independent_claim_challenges` frontmatter counter and its report
subsection, not through this table. The Change Review delta comparison remains a standing method
with no row here.

The Independent Claim Challenge is `kept (standing)`: it runs on every future report with
decision-driving claims, regardless of its frozen historical counts. A `retired` or
`awaiting-disposition` instrument does not run again unless an explicit owner disposition changes
this table and, when needed, its sunset. Apart from recording such an owner disposition, a playtest
invocation must not edit this skill. Should a future bounded pilot be added and reach its sunset,
do not claim saturation or method validity: mark its state `awaiting-disposition`, finish custody,
and request the owner's `keep`, `revise`, or `retire` decision in the final response.

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
its safety state, and provider-request capture began before navigation.

### 3. Enter as a new or returning author

Read [Author journey](references/author-journey.md). On a new run, independently assess the
unopened project screen before creating the planned `/tmp` project. On a continuation, open the supplied project,
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
fresh prose retry. Use one targeted counterfactual probe only when it can clarify a high-impact
ignored field; never use that diagnostic response in the app. Evaluate Ideate, Record Hygiene, and
Accepted-Segment Change Review the same way when naturally invoked. Unlike the prose prompt, the
Accepted-Segment Change Review draw is single-draw: run its exact visible prompt once in one fresh
cold context and take no quality retry for weak, empty, malformed, or misleading output. Done when
every invoked prompt has a structured usefulness verdict and every populated Generation Brief field
has an influence verdict or `not assessable`.

### 6. Accept one segment and review accepted-segment changes

Paste the chosen raw prose through **Write or paste candidate**, make ordinary author edits in
the visible editor, and record the intervention burden before accepting exactly one segment.
Inspect the durable-change reminder. When the accepted segment or record set makes Accepted-Segment
Change Review useful, seal an independent canonical-update baseline under the run's scratch directory
**before** compiling the Change Review prompt or making any segment-derived canonical edit, then run
the [Change Review delta comparison](references/prompt-evaluation.md#change-review-delta-comparison).
Use Record Hygiene when the record set makes it useful; re-author adopted suggestions manually and
save every canonical change independently through the visible editors. Done when the accepted
sequence is visibly confirmed and records, Generation Brief, and working set represent the author's
chosen continuity for a later run, or a post-acceptance blocker is logged.

### 7. Report and close

The source-and-doc-blind product journey ends before closeout. Before drafting any repository
artifact, read root `AGENTS.md` and `docs/ACTIVE-DOCS.md`, then follow only the post-journey
authorities they select for those writes. Do not use those reads to revise the sealed mental model,
contemporaneous observations, product findings, or evidence tags.

Read [Blockers and diagnostics](references/blockers-and-diagnostics.md) when any probable blocker
or visible defect appears, then read [Report format](references/report-format.md). Consolidate the
scratchpad into a new schema-v3 cumulative report. Before publication, independently challenge up
to three eligible decision-driving claims (a standing check on every report that has them), and let
the main operator retain resolution authority.
Close browser and app sessions, remove session plumbing and uncited evidence, then validate with
`scripts/validate-report.mjs`. Keep the scratchpad and temporary exchange files until the report
passes; then delete them, rerun the validator, and compare final worktree status with the baseline.
The method register and all bounded pilots are retired, so this run updates neither the register nor
the pilot-state table. Compare final worktree status
with the baseline again, allowing only the declared custody deltas. On successful close, remove the
exact run root created under
`/tmp/continuity-loom-playtest/` but preserve the separate `/tmp` story project. Done only when the
report validator passes, no OpenRouter request was attempted, run-owned processes are stopped, and
the final response names the report and custody result.
