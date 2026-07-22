# Final Report Format

Write `reports/<report-stem>.md`. It is both the current usability record and the
input to a later continuation. It must stand alone without scratchpad, prompt,
response, prose, or database access.

## Frontmatter

Use scalar YAML and every key below. `null` is allowed only where the run did not
reach a value. The three retained method-evidence compatibility counters are `0`;
ordinary playtests run no method pilots.

```yaml
---
report_type: continuity-loom-author-playtest
schema_version: 2
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
cold_first_view_witnesses: 0
independent_claim_challenges: 0
paired_draw_checks: 0
candidate_intervention: light
---
```

`run_mode` is `new_story` or `continuation`; a continuation requires the supplied
repository-relative `prior_report`. `status` is `completed` or `blocked`.
Completed runs require `accepted-one-segment`, a positive accepted sequence, an
existing `/tmp` project, browser/base URL/viewport, one or two cold prose attempts,
an intervention value (`none`, `light`, `substantial`, or `rewrite`), and zero
send clicks/attempts/blocks. A send event requires blocked
`provider-request-attempt`. Other blockers use a short kebab-case reason and
`not-reached` where appropriate. A counterfactual increments only
`counterfactual_probes`; an unchanged-prompt retry increments only its cold
attempt count.

## Required body

Begin `# Continuity Loom Author Playtest Report: <Story title>` and use this exact
section order:

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

Every section appears; use `Not reached — <blocker>` where needed. Include these
exact validator-owned table headers:

```markdown
| ID | Severity | Classification | Category | Summary | Confidence | Status | Evidence basis |
| --- | -------- | -------------- | -------- | ------- | ---------- | ------ | -------------- |

| Prompt | Author need | Contract compliance | Actionable outputs | No-change / low-value outputs | Adopted | Verdict | Confidence |
| ------ | ----------- | ------------------- | -----------------: | ----------------------------: | ------: | ------- | ---------- |

| Field | Author need | Intended observable influence | Visible prompt evidence | Response evidence | Verdict | Confidence |
| ----- | ----------- | ----------------------------- | ----------------------- | ----------------- | ------- | ---------- |

| Surface | Why invoked or skipped | Cold response result | Useful/adopted | Noise/rejected | Application path | Verdict |
| ------- | ---------------------- | -------------------- | -------------- | -------------- | ---------------- | ------- |

| ID | First seen | Classification | Summary | Current status | Latest evidence |
| --- | ---------- | -------------- | ------- | -------------- | --------------- |
```

Use one stable `F###` namespace for strengths and problems. A current detailed
finding states visible fact, interpretation/impact, expected versus actual,
visible reproduction, privacy-safe evidence, workaround/burden, likely layer,
desired visible outcome, confidence, and limits. Use one primary classification
(`strength`, `friction`, `confusion`, `defect`, `blocker`,
`prompt-contract-mismatch`, `model-output-failure`, or `low-value-output`) and a
clear product category.

Allowed evidence tags are `direct-visible`, `reproduced`, `source-confirmed`,
`independent-supported`, `independent-narrowed`, `independent-contradicted`,
`independent-insufficient`, `paired-concordant`, `paired-discordant`,
`cross-run-recurrent`, `counterfactual-suggestive`, and
`single-observer-inference`. Use only evidence actually obtained.

Carry every prior ledger row forward with its ID and status `new`, `open`,
`repeated`, `resolved`, `not-retested`, or `preserve-strength`. Mark `resolved`
only after explicit retest. The prior report plus ledger carries history; do not
duplicate all old finding bodies.

If `counterfactual_probes: 1`, add this exact disclosure under Prompt Usefulness:

```markdown
### Targeted Counterfactual

- Base prompt fingerprint: <sha256>
- Counterfactual prompt fingerprint: <different sha256>
- Changed field: <one field>
- One-variable change: <one change>
- Result: <comparison and stochastic limitation>
- App use: diagnostic only; response not used in app
```

For every skipped assistance surface, state the naturalistic reason. State that
the cold path did not exercise provider response parsing/result cards.

## Handoff, privacy, and closeout

The continuation handoff records the exact project path/existence, latest
sequence, next unresolved response point, intended POV/cast/current pressure,
canonical post-acceptance work, outstanding author decisions, useful retests,
and this report path—without accepted prose or full payloads.

Under `### Evidence Index` in Diagnostics and Evidence, list every retained
artifact and purpose, using links under `assets/<report-stem>/`. If none, write
`No retained evidence.` Never retain API keys/key-like values, full prompts or
payloads, raw responses, candidate/accepted prose, project files, traces, session
files, routine screenshots, app logs, or uncited artifacts. A necessary excerpt
is the minimum proving the issue.

Draft while scratchpad/exchange files remain. Copy safety counts and metadata,
shut down browser then app, and clean plumbing/forbidden evidence. Run:

```bash
node .claude/skills/playtest/scripts/validate-report.mjs --report reports/<stem>.md
```

Fix until passing; then delete exchange and scratchpad, validate again, and
compare status with the baseline. Allow only the new report and evidence. Remove
the exact successful run root only after confirming it is a specific child of
`/tmp/continuity-loom-playtest/` and is not the separate project path. Preserve
the project for continuation. If validation never passes, retain and return the
run root.
