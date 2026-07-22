---
name: playtest
description: Playtest Continuity Loom as a source-and-doc-blind author in the real browser, creating a new story or continuing from a supplied playtest report through one accepted local prose segment. Use when the user asks to playtest the app with a story premise, asks to create a story through the app, or supplies a prior playtest report and asks to continue it. Evaluates the prose prompt and any naturally invoked Ideate, Record Hygiene, or Segment Reconciliation prompts with cold-context subagents without making OpenRouter requests, then writes a cumulative evidence-backed report.
---

# Continuity Loom Author Playtest

Run one sincere author journey through the visible app. End after exactly one
new accepted segment plus deliberate post-acceptance continuity work, or after
bounded recovery fails. Always publish a truthful report. Observe the product;
never repair it during the run.

## Hard boundaries

- Be instructed but source-and-doc blind: learn the product from visible UI and
  field help, not source, tests, app docs, APIs, SQLite, project files, hidden
  state, DOM mutation, or runtime evaluation. Seal a new story's intent and
  expectations before opening the app.
- For a continuation, read only the supplied playtest report, reopen its named
  `/tmp` project through the UI, and verify the latest accepted segment in the
  archive. Never reconstruct a missing continuation project.
- Create and edit project data only through controls a person can see.
- Use a fresh isolated app with a blank `OPENROUTER_API_KEY`, temporary settings,
  loopback binding, and a guarded browser started before navigation. Never click
  Generate or any Ideate, Analyze, Review, or model-refresh send control. A send
  attempt ends the run even when the guard blocks it.
- Extract only prompts visibly open in the inspector. Give each exact prompt to
  a fresh no-parent-context subagent with no story brief, expected answer,
  suspected defect, prior response, or repository context.
- Judge raw assistance before manually re-authoring anything in canonical
  editors. Judge raw prose before pasting it through **Write or paste
  candidate**, visibly editing it, and explicitly accepting it. Assistance and
  accepted prose never become continuity authority automatically.
- Use Private Notes and assistance surfaces only when a sincere author need
  arises. Explain every naturalistic skip; never manufacture coverage.
- Keep projects, prompts, raw responses, candidate prose, settings, routine
  screenshots, and the scratchpad under `/tmp`. Durable reports may retain only
  privacy-safe counts, fingerprints, assessments, minimal excerpts, and selected
  evidence.
- Preserve worktree custody. A run may add only its new report and evidence
  directory; never overwrite a prior report or alter source, tests, docs,
  dependencies, configuration, or unrelated dirt.

## Workflow

1. Read [Run setup](references/run-setup.md). Run `scripts/prepare-run.mjs`,
   capture the worktree baseline, and complete the pre-use charter. Read
   [Observation log](references/observation-log.md) only when the user explicitly
   requests action/field counts or a quantitative comparison.
2. Read [Browser driver](references/browser-driver.md). Build and launch the
   isolated app, then the guarded 1440×900 browser before first navigation.
3. Read [Author journey](references/author-journey.md). Create a new project or
   reopen the supplied continuation, author through readiness, and preserve the
   task's physical, knowledge, presence, voice, content, and stopping bounds.
4. Read [Cold prompt evaluation](references/prompt-evaluation.md). Evaluate the
   exact visible prose prompt and every naturally invoked assistance prompt in
   fresh contexts without OpenRouter. Record field influence and response burden.
5. Paste the preferred prose locally, make ordinary visible edits, accept once,
   verify the sequence, inspect the durable-change reminder, and manually update
   only the continuity the author chooses.
6. When a probable defect or blocker appears, follow
   [Blockers and diagnostics](references/blockers-and-diagnostics.md). Never
   silently retry past its limits.
7. End the source-and-doc-blind journey. Before writing repository artifacts,
   read root `AGENTS.md` and `docs/ACTIVE-DOCS.md` only for write routing; do not
   revise sealed expectations or observations from them. Read
   [Report format](references/report-format.md), write the cumulative report, shut down run-owned
   processes, clean forbidden evidence, validate, delete the temporary exchange
   and scratchpad after the first pass, validate again, and compare final status
   with the baseline.

Completion requires one visibly verified new accepted sequence or a specific
terminal blocker, zero provider-request attempts for a completed run, a passing
report validator, stopped run-owned processes, preserved continuation project,
and no repository delta outside the new report and cited evidence.
