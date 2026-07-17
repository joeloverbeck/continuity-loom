# Final Report Format

Write `reports/<report-stem>.md`. The report is both a current-run usability record and the input
for a later continuation. A downstream coding agent must be able to act on it without seeing the
scratchpad, raw prompt, raw response, candidate, or project database.

## Frontmatter

Use scalar YAML values:

```yaml
---
report_type: continuity-loom-author-playtest
schema_version: 1
run_id: playtest-example-2026-07-17T120000Z
report_stem: playtest-example-2026-07-17T120000Z
story_title: Example Story
story_slug: example
run_mode: new_story
prior_report: null
project_path: /tmp/continuity-loom-playtest-projects/example-2026-07-17T120000Z
project_exists_at_close: true
started_at: 2026-07-17T12:00:00Z
completed_at: 2026-07-17T13:10:00Z
status: completed
completion_reason: accepted-one-segment
accepted_segment_sequence: 1
base_url: http://127.0.0.1:41731
browser: chromium
viewport: 1440x900
openrouter_send_controls_clicked: 0
provider_request_attempts: 0
provider_requests_blocked: 0
cold_prose_attempts: 1
cold_assistance_attempts: 2
counterfactual_probes: 0
candidate_intervention: light
---
```

Allowed alternatives:

- `run_mode`: `new_story` or `continuation`;
- `prior_report`: repository-relative path or `null`;
- `status`: `completed` or `blocked`;
- `completion_reason`: `accepted-one-segment`, `launch-failed`, `browser-failed`,
  `project-create-failed`, `continuation-project-missing`, `project-open-failed`,
  `ui-dead-end`, `readiness-dead-end`, `prompt-unavailable`, `cold-subagent-unavailable`,
  `prose-quality-blocker`, `candidate-acceptance-failed`, `provider-request-attempt`, or another
  short kebab-case reason;
- unreachable scalar values: `null`;
- `candidate_intervention`: `none`, `light`, `substantial`, `rewrite`, or `not-reached`.

If a provider request was attempted, the browser guard should have blocked it. Record the real
nonzero counts, set `status: blocked`, and use `provider-request-attempt`. Never falsify a zero to
make validation pass.

## Required section order

Begin the body with `# Continuity Loom Author Playtest Report: <Story title>`.

1. `## Run Status`
2. `## Executive Assessment`
3. `## Story Intent and Expectations`
4. `## Run Configuration and Continuation Contract`
5. `## Condensed Author Journey`
6. `## What Worked`
7. `## Prioritized Findings`
8. `## Surface-by-Surface Experience`
9. `## Prompt Usefulness`
10. `## Generation Brief Field Influence`
11. `## Assistance Evaluation`
12. `## Candidate and Accepted Segment`
13. `## Cumulative Finding Ledger`
14. `## Continuation Handoff`
15. `## Diagnostics and Evidence`
16. `## Coverage Limitations`

Every section appears. Use a specific `Not reached — ...` stub when blocked before a section's
phase.

## Required tables

### Prioritized findings

```markdown
| ID   | Severity | Classification | Category         | Summary                                   | Confidence | Status |
| ---- | -------- | -------------- | ---------------- | ----------------------------------------- | ---------- | ------ |
| F001 | moderate | friction       | generation-brief | Optional field cost exceeds visible value | medium     | new    |
```

Use stable IDs. On continuation, preserve inherited IDs; allocate new IDs after the highest prior
number. Consolidate repeated manifestations of one underlying issue and state frequency.

Each detailed current-run finding contains:

- observed fact;
- author interpretation and impact;
- expected versus actual behavior;
- reproduction through visible UI;
- privacy-safe evidence;
- workaround and intervention cost;
- likely layer: UI, prompt contract, model execution, source data, or not assessable;
- desired author-visible outcome / acceptance guidance;
- uncertainty and limitations.

Do not prescribe component names, state libraries, schema changes, or implementation details unless
the visible evidence makes one constraint unavoidable.

### Prompt usefulness

```markdown
| Prompt | Author need | Contract compliance | Actionable outputs | No-change / low-value outputs | Adopted | Verdict | Confidence |
| ------ | ----------- | ------------------- | -----------------: | ----------------------------: | ------: | ------- | ---------- |
```

Include prose and every invoked assistance prompt. Explain retry selection and any prompt-contract
versus model-output distinction below the table.

### Generation Brief field influence

```markdown
| Field | Author need | Intended observable influence | Visible prompt evidence | Response evidence | Verdict | Confidence |
| ----- | ----------- | ----------------------------- | ----------------------- | ----------------- | ------- | ---------- |
```

Include every deliberately populated prompt-facing field. Separately list validation-only or
author-only fields whose purpose was unclear; do not label them ignored prose context.

### Assistance evaluation

```markdown
| Surface | Why invoked or skipped | Cold response result | Useful/adopted | Noise/rejected | Application path | Verdict |
| ------- | ---------------------- | -------------------- | -------------- | -------------- | ---------------- | ------- |
```

For skipped surfaces, give the naturalistic reason. State that provider response parsing/result
cards were not exercised on the cold path.

### Cumulative finding ledger

```markdown
| ID  | First seen | Classification | Summary | Current status | Latest evidence |
| --- | ---------- | -------------- | ------- | -------------- | --------------- |
```

Carry every prior strength, snag, friction, confusion, defect, blocker, and prompt finding forward
as a concise row. Status is `new`, `open`, `repeated`, `resolved`, `not-retested`, or
`preserve-strength`. Mark `resolved` only after explicit current-run retest. Do not duplicate prior
detailed finding bodies; the ledger plus `prior_report` preserves the chain.

## Continuation handoff

Record without reproducing accepted prose or full payloads:

- exact `/tmp` project path and whether it existed at close;
- latest accepted segment sequence;
- story intent and the next unresolved response point;
- intended POV, cast participation, and current local pressure for the next run;
- canonical record/brief work completed after acceptance;
- outstanding author decisions or reconciliation work;
- surfaces and field-influence concerns worth retesting;
- the exact path of this report to supply to the next invocation.

## Evidence and privacy

Index every retained artifact with a one-line purpose. Links must be relative to the report and
remain under `assets/<report-stem>/`. Do not retain routine screenshots, session files, empty
diagnostic streams, prompt/response exchange files, app logs, browser profiles, traces, or uncited
artifacts.

Put the artifact list under `### Evidence Index` inside `## Diagnostics and Evidence`. When no
artifact is retained, write `No retained evidence.` under that subsection.

Reject from the report and evidence: API keys or key-like values, full prompts, full record
payloads, raw assistance responses, candidate prose, accepted prose, SQLite/project files, and
screenshots that expose those bodies without a finding-specific need. A necessary excerpt must be
the minimum that demonstrates the issue.

## Validate and close

Draft the complete report while the scratchpad and temporary exchange files still exist. Copy the
needed safety counts and browser metadata, then close the browser and app holders. Remove session
files, run plumbing, routine screenshots, empty diagnostic streams, and every uncited or forbidden
artifact from the report evidence directory.

Run:

```bash
node .claude/skills/playtest/scripts/validate-report.mjs --report reports/<stem>.md
```

Fix errors until it passes, using the scratchpad and temporary exchange only as needed. Then delete
the exchange directory and scratchpad, rerun validation, and compare worktree status with the
baseline.

**Completion criterion:** all frontmatter and sections are present; current findings are
actionable; every prior observation remains represented in the cumulative ledger; prompt and field
verdicts are complete; continuation can locate the still-existing `/tmp` project; privacy rules
hold; evidence links resolve; and the validator passes after cleanup.
