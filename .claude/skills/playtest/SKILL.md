---
name: playtest
description: Playtest Continuity Loom as a blind-first author in the real browser, creating a new story or continuing from a supplied playtest report through one accepted local prose segment. Use when the user asks to playtest the app with a story premise, asks to create a story through the app, or supplies a prior playtest report and asks to continue it. Evaluates prose, Ideate, Record Hygiene, and Segment Reconciliation prompts with cold-context subagents without making OpenRouter requests, then writes a cumulative evidence-backed report.
---

# Continuity Loom Author Playtest

One invocation is one sincere author journey through the visible app, ending after exactly one
new accepted segment and post-acceptance continuity work, or after the blocker policy is
exhausted. Always produce a report. Observe and report; never fix the app during the run.

## Non-negotiables

- **Blind-first.** For a new story, record the intended story, expectations, and initial mental
  model before opening the app. Learn the product through visible UI and field help, not source,
  tests, app docs, APIs, SQLite, or hidden state. Record confusion before resolving it.
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
- **Custody.** The run may add its report and evidence directory and may create `/tmp` data. It
  must not edit source, tests, docs, dependencies, configuration, existing reports, or unrelated
  worktree changes. Never overwrite an earlier report or evidence directory.

## Process

### 1. Prepare the author journey

Read [Run setup](references/run-setup.md) and [Observation scratchpad](references/observation-log.md).
Run `scripts/prepare-run.mjs`, capture the worktree baseline, and fill the scratchpad's story
intent, author expectations, blind mental model, and run plan before launching the app. For a
continuation, confirm the supplied report resolves to an existing `/tmp` project. Done when all
run paths exist, the baseline is recorded, and the pre-use expectations are complete.

### 2. Launch the isolated app and guarded browser

Read [Browser driver](references/browser-driver.md). Build the app, start `safe-app-session.mjs`,
then start `browser-session.mjs` before the first navigation. Do not reuse an existing server or
browser. Done when Continuity Loom visibly renders at 1440x900, both sessions report their safety
state, and provider-request capture began before navigation.

### 3. Enter as a new or returning author

Read [Author journey](references/author-journey.md). On a new run, assess the unopened project
screen before creating the planned `/tmp` project. On a continuation, open the supplied project,
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
fresh retry. Use one targeted counterfactual probe only when it can clarify a high-impact ignored
field; never use that diagnostic response in the app. Evaluate Ideate, Record Hygiene, and
Segment Reconciliation the same way when naturally invoked. Done when every invoked prompt has a
structured usefulness verdict and every populated Generation Brief field has an influence
verdict or `not assessable`.

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
scratchpad into a new cumulative report, close browser and app sessions, remove session plumbing
and uncited evidence, then validate with `scripts/validate-report.mjs`. Keep the scratchpad and
temporary exchange files until the report passes; then delete them, rerun the validator, and
compare final worktree status with the baseline. Done only when the report validator passes, no
OpenRouter request was attempted, run-owned processes are stopped, and the final response names
the report and custody result.
