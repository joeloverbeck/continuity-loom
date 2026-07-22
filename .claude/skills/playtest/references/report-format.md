# Final Report Format

Write `reports/<report-stem>.md`. The report is both a current-run usability record and the input
for a later continuation. A downstream coding agent must be able to act on it without seeing the
scratchpad, raw prompt, raw response, candidate, or project database.

## Contents

- [Frontmatter](#frontmatter)
- [Required section order](#required-section-order)
- [Required tables](#required-tables)
- [Method evidence subsections](#method-evidence-subsections)
- [Continuation handoff](#continuation-handoff)
- [Evidence and privacy](#evidence-and-privacy)
- [Challenge, validate, register, and close](#challenge-validate-register-and-close)

## Frontmatter

Use scalar YAML values:

```yaml
---
report_type: continuity-loom-author-playtest
schema_version: 3
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
change_review_comparisons: 0
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

All newly authored reports use schema `3`. Existing schema-v1 and schema-v2 reports remain historical
artifacts; do not rewrite them. The validator accepts them through isolated compatibility paths —
including the retired schema-v2 Paired-Draw Check — and warns, rather than fails, when a v1 report
declares one counterfactual but predates the disclosure block.

Count unchanged-prompt cold attempts separately from diagnostic counterfactuals:

- `cold_prose_attempts` counts initial and retry prose responses produced from the unchanged exact
  prose prompt and eligible for candidate selection;
- `cold_assistance_attempts` counts initial and retry assistance responses produced from unchanged
  exact assistance prompts and evaluated for adoption; and
- `counterfactual_probes` counts only a diagnostic cold response to a prompt copy that changes
  exactly one field under [Targeted counterfactual](prompt-evaluation.md#targeted-counterfactual).

An unchanged-prompt retry increments only its `cold_*_attempts` count. A diagnostic
counterfactual increments only `counterfactual_probes`; its response is never eligible for use in
the app.

Method-evidence counters describe only structurally disclosed instruments:

- `cold_first_view_witnesses`: `0` or `1`;
- `independent_claim_challenges`: `0` through `3`; and
- `change_review_comparisons`: `0`, `1`, or `2`.

Each Change Review delta comparison's single cold draw also counts as one unchanged-prompt
`cold_assistance_attempts`. A missing, unavailable, or naturally ineligible instrument remains `0`
and is explained under Coverage Limitations; never create eligibility merely to increment a counter.
The retired `paired_draw_checks` counter is not authored in new reports; it survives only for
historical schema-v2 validation.

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
| ID   | Severity | Classification | Category         | Summary                                   | Confidence | Status | Evidence basis                            |
| ---- | -------- | -------------- | ---------------- | ----------------------------------------- | ---------- | ------ | ----------------------------------------- |
| F001 | moderate | friction       | generation-brief | Optional field cost exceeds visible value | medium     | new    | direct-visible, single-observer-inference |
```

Use one stable ID namespace across Prioritized Findings and the Cumulative Finding Ledger: `F`
followed by at least three digits, such as `F001`. The `F` identifies a finding-ledger item,
not a defect classification. Strengths, resolved harness friction, snags, blockers, and prompt
findings use the same namespace; do not allocate `S`, `H`, or other category-prefixed IDs. On
continuation, preserve inherited IDs and allocate new IDs after the highest prior number.
Consolidate repeated manifestations of one underlying issue and state frequency.

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

Every prioritized finding is decision-driving and must use one or more comma-separated evidence
tags from this fixed vocabulary:

- `direct-visible`, `reproduced`, `source-confirmed`;
- `independent-supported`, `independent-narrowed`, `independent-contradicted`,
  `independent-insufficient`;
- `paired-concordant`, `paired-discordant`;
- `cross-run-recurrent`, `counterfactual-suggestive`, `single-observer-inference`.

Tags state the basis actually obtained. They are not scores, rates, or substitutes for uncertainty.
The `paired-concordant` and `paired-discordant` tags apply only to historical Paired-Draw Check
evidence; the Change Review delta comparison records its own correspondence and coverage tallies and
never reuses them.

### Prompt usefulness

```markdown
| Prompt | Author need | Contract compliance | Actionable outputs | No-change / low-value outputs | Adopted | Verdict | Confidence |
| ------ | ----------- | ------------------- | -----------------: | ----------------------------: | ------: | ------- | ---------- |
```

Include prose and every invoked assistance prompt. Explain retry selection and any prompt-contract
versus model-output distinction below the table.

When `counterfactual_probes` is `1`, include this disclosure in `## Prompt Usefulness` after the
table. Use the exact labels and lowercase SHA-256 fingerprints:

```markdown
### Targeted Counterfactual

- Base prompt fingerprint: <64-character SHA-256>
- Counterfactual prompt fingerprint: <different 64-character SHA-256>
- Changed field: <one field name>
- One-variable change: <what changed in that field only>
- Result: <concise comparison and limitation>
- App use: diagnostic only; response not used in app
```

Omit this subsection when `counterfactual_probes` is `0`. An unchanged-prompt retry is not a
counterfactual even when its output differs substantially from the first response.

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

When `change_review_comparisons` is `1` or `2`, add this privacy-safe disclosure inside
`## Assistance Evaluation` with exactly one row per comparison:

```markdown
### Change Review Delta Comparison

| Segment sequence | Record scope | Prompt fingerprint | Baseline in-profile | Baseline out-of-profile | Correspondence counts | Coverage disagreements | Substitution verdict | Related finding IDs |
| ---------------- | ------------ | ------------------ | ------------------: | ----------------------: | --------------------- | ---------------------: | -------------------- | ------------------- |
| 1 | active_working_set | <64-character SHA-256> | 3 | 1 | matched=2; baseline-only=1; review-only-accepted=0; review-only-rejected=0; partial=1; unscorable=0 | 1 | independent audit still required | F001 |
```

- `Segment sequence` is the accepted-segment sequence the comparison covers; `Record scope` is
  exactly `active_working_set` or `whole_project`; `Prompt fingerprint` is the lowercase 64-character
  SHA-256 of the exact inspected Change Review prompt.
- `Baseline in-profile` and `Baseline out-of-profile` are the non-negative counts of sealed baseline
  items in each class.
- `Correspondence counts` lists all six classes as `class=<integer>` entries separated by `; `:
  `matched`, `baseline-only`, `review-only-accepted`, `review-only-rejected`, `partial`, and
  `unscorable`.
- `Coverage disagreements` is the count, `0` through `6`, of dimensions whose sealed disposition
  differed from the returned coverage row.
- `Substitution verdict` is exactly one of `discovery-complete for this episode`,
  `materially reduced discovery work`, `independent audit still required`, `unsafe or misleading`, or
  `not assessable`.
- `Related finding IDs` lists the Cumulative Finding Ledger IDs for every material discrepancy, or
  `none - <specific reason>` only when all observed differences are genuinely nonmaterial; every
  listed ID must exist in the Cumulative Finding Ledger.

Omit the subsection entirely when `change_review_comparisons` is `0`. Never place full prompts, raw
responses, or exact story-bearing baseline text in this disclosure.

### Cumulative finding ledger

```markdown
| ID  | First seen | Classification | Summary | Current status | Latest evidence |
| --- | ---------- | -------------- | ------- | -------------- | --------------- |
| F001 | Current run | friction | <concise finding> | new | <current evidence> |
| F002 | Current run | strength | <proven behavior> | preserve-strength | <regression evidence> |
| F003 | Current run | friction | <resolved harness snag> | resolved | <explicit retest> |
```

Carry every prior strength, snag, friction, confusion, defect, blocker, and prompt finding forward
as a concise row. Status is `new`, `open`, `repeated`, `resolved`, `not-retested`, or
`preserve-strength`. Mark `resolved` only after explicit current-run retest. Do not duplicate prior
detailed finding bodies; the ledger plus `prior_report` preserves the chain. Every row uses the
shared `F`-prefixed stable-ID namespace, whether or not it is a current prioritized problem.

## Method evidence subsections

Use a subsection only when its frontmatter counter is nonzero. When a pilot is unavailable or does
not naturally trigger, omit the subsection, leave the counter at `0`, and explain the limitation.
For every independent execution, record the executor host family, exact model identifier only when
the host exposes it (otherwise `unknown`), exposure boolean, UTC timestamp, and lowercase SHA-256
prompt or packet fingerprint. Never infer hidden model details or claim executor independence that
the host does not expose.

### Cold First-View Witness

When `cold_first_view_witnesses` is `1`, place this table inside
`## Story Intent and Expectations` after the main operator's sealed expectations:

```markdown
### Cold First-View Witness

| Packet fingerprint | Timestamp | Executor host | Executor model                   | Model identity exposed | First-action summary | Expectation mismatch | Unclear terms count | Clarity                    | Main-operator comparison | Privacy check |
| ------------------ | --------- | ------------- | -------------------------------- | ---------------------- | -------------------- | -------------------- | ------------------: | -------------------------- | ------------------------ | ------------- |
| <sha256>           | <UTC>     | <host family> | <exact exposed model or unknown> | true/false             | ...                  | ...                  |                   0 | clear/partly-clear/unclear | ...                      | passed        |
```

Report only first-screen comprehension. Do not generalize the witness to human transfer,
uninstructed discoverability, or the later author journey.

### Independent Claim Challenges

After drafting the report but before final validation, select at most three claims that are blockers
or major findings, drive the executive assessment, make a likely-layer/causal inference intended to
drive product work, or preserve a strength that constrains change. Put all eligible claims into one
privacy-safe packet and send it either to the Phase-A witness after its first-view response is frozen
or to one new fresh context. For each claim include the ID and exact proposed wording, observed
visible fact, expected versus actual, reproduction, cited artifact identity or sanitized crop, and
the operator interpretation and confidence. Exclude remedies and all raw story, prompt, response,
candidate, and accepted-prose material. Require one rival explanation and one observable
discriminator per claim. The main operator retains report authority and records the final
resolution; there is no vote, automatic deletion, or semantic-validation claim.

When `independent_claim_challenges` is nonzero, place this table inside
`## Prioritized Findings` after the detailed finding bodies:

```markdown
### Independent Claim Challenges

| Claim ID | Eligibility reason | Timestamp | Executor host | Executor model                   | Model identity exposed | Packet fingerprint | Status   | Rival explanation | Observable discriminator | Operator resolution | Evidence basis                       |
| -------- | ------------------ | --------- | ------------- | -------------------------------- | ---------------------- | ------------------ | -------- | ----------------- | ------------------------ | ------------------- | ------------------------------------ |
| F001     | ...                | <UTC>     | <host family> | <exact exposed model or unknown> | true/false             | <sha256>           | narrowed | ...               | ...                      | ...                 | direct-visible, independent-narrowed |
```

Status is exactly `supported`, `narrowed`, `contradicted`, or `insufficient`, and the row must carry
the matching `independent-*` evidence tag. All rows share the one challenge packet's fingerprint,
timestamp, host, model, and exposure value. Reconcile the challenged claim and its Prioritized
Finding evidence basis before validation. The pilot stops after its first two qualifying reports for
an explicit `keep`, `revise`, or `retire` decision.

### Paired-Draw Check (retired — schema-v2 historical only)

The Segment Reconciliation Paired-Draw Check is retired and is never authored in a new schema-v3
report; the [Change Review delta comparison](#assistance-evaluation) replaces it. This spec remains
only so the validator still accepts historical schema-v2 reports that already carry paired-draw
evidence. When a historical `paired_draw_checks` is `1`, the disclosure sat in `## Prompt Usefulness`
after the main prompt table, and the two rows shared the exact prompt fingerprint:

```markdown
### Paired-Draw Check

- Prompt kind: segment-reconciliation
- Prompt fingerprint: <64-character SHA-256>
- Eligibility reason: <why a naturally legal result difference matters>
- Informative output classes: <predeclared classes>
- Pair class: concordant-substantive | concordant-no-change | discordant | both-poor-or-malformed | blocked
- What the pair supports: <bounded instance-level inference>
- What the pair cannot establish: <no rate, stability, independence, or causal claim>
- Effect on likely-layer attribution: <prompt contract, model execution, source data, or not assessable>
- Counterfactual used: yes | no

| Draw | Timestamp | Executor host | Executor model                   | Model identity exposed | Prompt fingerprint | Structural class | Usefulness verdict | Author adoption | Burden |
| ---- | --------- | ------------- | -------------------------------- | ---------------------- | ------------------ | ---------------- | ------------------ | --------------- | ------ |
| A    | <UTC>     | <host family> | <exact exposed model or unknown> | true/false             | <same sha256>      | ...              | ...                | ...             | ...    |
| B    | <UTC>     | <host family> | <exact exposed model or unknown> | true/false             | <same sha256>      | ...              | ...                | ...             | ...    |
```

Assess the draws separately before adoption. Use `paired-concordant` or `paired-discordant` on any
decision-driving finding the pair actually informs. Do not turn two samples into a frequency or
reliability claim. The pilot stops after two naturally qualifying pairs for an explicit `keep`,
`revise`, or `retire` decision.

## Continuation handoff

Record without reproducing accepted prose or full payloads:

- exact `/tmp` project path and whether it existed at close;
- latest accepted segment sequence;
- story intent and the next unresolved response point;
- intended POV, cast participation, and current local pressure for the next run;
- canonical record/brief work completed after acceptance;
- outstanding author decisions or change-review work;
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

## Challenge, validate, register, and close

Draft the complete report while the scratchpad and temporary exchange files still exist. While its
Authoritative pilot state is `active`, apply the Independent Claim Challenge to eligible
decision-driving claims and reconcile the result into the draft. Copy the needed safety counts and
browser metadata, then close the browser and app holders. Remove session files, run plumbing,
routine screenshots, empty diagnostic streams, and every uncited or forbidden artifact from the
report evidence directory.

Run:

```bash
node .claude/skills/playtest/scripts/validate-report.mjs --report reports/<stem>.md
```

Fix errors until it passes, using the scratchpad and temporary exchange only as needed. Then delete
the exchange directory and scratchpad, rerun validation, and compare worktree status with the
baseline.

Only after that final report pass, open `reports/playtest-method-register.md`. If its pilot remains
active, append one privacy-safe Natural-Run Coverage row, update or add Method Signal rows only for
method-level evidence that actually arose, and update the three-row decision checkpoint. Do not
record story substance, prompts, responses, product findings, or generated prose; do not use the
register to auto-adopt an instrument or claim saturation. The register exists only to test whether a
compact cross-run inventory changes a later method decision. When the third row is present, mark the
register disposition as awaiting the owner, stop extending the pilot, finish cleanup, and request an
explicit `keep`, `revise`, or `retire` decision. Record that disposition only after the owner gives
it; do not infer it from the run.

Finally, use the validated schema-v2 counters to advance only the Completed and State cells in
`SKILL.md`'s Authoritative pilot state. Increment the claim-challenge pilot once per qualifying
report, not once per challenged claim, and increment the method-register counter only when its row
was successfully appended. When a Completed value reaches its Sunset, set State to
`awaiting-disposition`; do not infer an owner decision. This exact table update is the sole permitted
playtest-time edit under `.claude/skills/`.

Re-run `git status --short` after the register and state updates. Compare it with the baseline and
allow only this run's report/evidence, the register update, and exact Authoritative pilot-state cell
changes. Any other run-caused delta is a custody defect.

After those durable updates, remove the remaining exact run root printed by `prepare-run.mjs`,
including isolated settings and browser/app scratch. First verify that the resolved target is a
specific child of `/tmp/continuity-loom-playtest/` and is not the separate `project_path`; preserve
the project for continuation. If report writing or validation never passes, retain the run root and
return its path so evidence is not destroyed during diagnosis.

**Completion criterion:** all frontmatter and sections are present; current findings are
actionable; every prior observation remains represented in the cumulative ledger; prompt and field
verdicts are complete; continuation can locate the still-existing `/tmp` project; privacy rules
hold; evidence links resolve; the validator passes after cleanup; and any permitted method-register
and pilot-state updates happened only afterward; the successful run root is gone; and the separate
story project remains available for continuation.
