# Playtest PRD Prep Artifact Contract

Use this contract only while writing or validating
`reports/<playtest-report-stem>-prd-prep.md`. `SKILL.md` owns the reconciliation process; this file
owns the exact artifact shape.

## Contents

- [Title and section order](#title-and-section-order)
- [Required fields](#required-fields)
- [Evidence disposition ledger](#evidence-disposition-ledger)
- [Strength preservation ledger](#strength-preservation-ledger)
- [Authority and change-surface map](#authority-and-change-surface-map)
- [PRD candidates](#prd-candidates)
- [Non-PRD follow-up](#non-prd-follow-up)
- [Prior recommendation consumption](#prior-recommendation-consumption)
- [Final worktree ledger](#final-worktree-ledger)
- [Privacy and durability](#privacy-and-durability)
- [Completion language](#completion-language)

## Title and section order

Begin with:

```markdown
# Playtest PRD Prep: <story title>
```

Use these sections exactly and in order:

1. `## Header And Freshness`
2. `## Reassessment Verdict`
3. `## Source Inventory`
4. `## Evidence Disposition Ledger`
5. `## Strength Preservation Ledger`
6. `## Authority And Change-Surface Map`
7. `## Recommended PRD Package`
8. `## Non-PRD Follow-Up`
9. `## Rejected Or No-Op Alternatives`
10. `## PRD Publication Inputs`
11. `## Completion Self-Check`
12. `## Freshness And Boundaries`

## Required fields

Write each field as one bare line-start `Key: value` line, never as a bullet or bold label.

Under `## Header And Freshness`:

```markdown
Source report path: reports/<playtest-report>.md
Source validation: passed
Source durability: <durable / pending local publication / summarized, not cited, with proof>
Authored artifact durability: <new/untracked / dirty / tracked-clean / publication-ref-visible>
Live checkout: <branch, HEAD, and relevant baseline dirt>
Tracker freshness: <reads and issue IDs, or unavailable with reason>
Existing same-stem prep classification: <missing at intake / current / partially consumed / stale / superseded / not relevant>
Prior-report prep path: <reports/<prior-report-stem>-prd-prep.md / not applicable>
Prior-report prep classification: <not applicable / missing at intake / current / partially consumed / stale / superseded / not relevant>
Prior-report traversal: <not applicable, not needed with reason, or exact followed paths>
Deliverable status: PRD-ready determination only; prep artifact write only
External research: skipped - repo-local prep
```

Use `External research: used - explicit user request: <scope>` only when the user explicitly
expanded the run.

For a clean source, use exactly `Source validation: passed`; do not append a summary. Put clean-run
inspection detail in `## Source Inventory` or adjacent prose.

Use this separate form only when the source inspector classifies a report-validator defect as safe
for exhaustive disposition:

```markdown
Source validation: nonblocking defects - <concise summary>
```

Add the repair to Non-PRD Follow-Up as skill maintenance. Any blocking source error prevents
writing or updating this artifact.

Under `## Reassessment Verdict`:

```markdown
First operational action: <action, or none - reason>
```

Then write exactly one verdict field:

```markdown
Recommended first new PRD: <name>
Recommended multi-PRD program: <name>
No-new-PRD verdict: <reason>
```

Write one matching package field:

```markdown
Publication package: single intended PRD
Publication package: first PRD plus deferred follow-ons
Publication package: multi-PRD program
Publication package: no new PRD
```

Under `## Source Inventory`, use the counts printed by `--inspect-source`:

```markdown
Source prioritized findings: <integer>
Source cumulative ledger rows: <integer>
Source strength rows: <integer>
Disposition rows: <integer>
Strength constraint rows: <integer>
```

Under `## PRD Publication Inputs`:

```markdown
Recommended testing seam: <highest existing behavior seam, or N/A - reason>
/to-prd consultation: house style only; seam checkpoint still owed
Likely label: <label and evidence, or unresolved>
Label downgrade conditions: <conditions, or none>
Browser-visible guidance checklist: <applies with mapping needs, or N/A - reason>
```

Under `## Completion Self-Check`:

During the initial artifact write and draft validation, use exactly:

```markdown
Prep validator: pending
Manual semantic review: pending
Privacy and stale-language scan: pending
```

Run the validator with `--draft` while these values are present. A draft-valid artifact is not
complete and must not be handed off. After draft validation passes and the manual semantic review
and privacy/stale-language scan actually complete, replace the draft values with exactly:

```markdown
Prep validator: passed
Manual semantic review: completed
Privacy and stale-language scan: clear
```

The final validator accepts only the final values.

## Evidence disposition ledger

Use exactly:

```markdown
| Report item | Report summary | Disposition     | Current evidence | Change/PRD impact     |
| ----------- | -------------- | --------------- | ---------------- | --------------------- |
| F001        | <summary>      | fresh-prd-scope | <evidence>       | <candidate or impact> |
```

The `Report item` cell is the bare stable ID. Include every Cumulative Finding Ledger row exactly
once. Use one of these dispositions:

- `preserve-strength` — proven value that constrains change;
- `covered` — current behavior or completed work already satisfies the desired outcome;
- `verification/reopen` — current evidence conflicts with claimed completed behavior;
- `fresh-prd-scope` — broad or risky product behavior needing a PRD;
- `ticket-candidate` — narrow and already-scoped product work;
- `skill-maintenance` — pure playtest methodology, report-schema, or agent-process work;
- `doc-correction` — an active authority misstates current behavior;
- `coverage-follow-up` — replay, test, audit, or evidence work before product scope;
- `research-follow-up` — external evidence is needed before adopting doctrine; or
- `no-op/rejected` — resolved, preference-only, disproportional, duplicate, or unsupported work.

Every source strength uses `preserve-strength`; no non-strength may use it. Explain uncertainty in
`Current evidence`, not by inventing another disposition.

When the validated source has zero cumulative rows, retain the header and divider with no data row
and record `Disposition rows: 0`.

## Strength preservation ledger

Use exactly:

```markdown
| Strength ID | Applies to | Preservation constraint | Regression evidence              |
| ----------- | ---------- | ----------------------- | -------------------------------- |
| F015        | global     | <behavior to preserve>  | <test, browser, or review proof> |
```

Include every source row whose classification is `strength` or status is `preserve-strength`
exactly once. `Applies to` is `global` or a comma-separated list of exact PRD candidate names and
non-PRD follow-ups. A strength may constrain several changes without becoming scope itself.

When the source has zero strengths, retain the header and divider with no data row and record
`Strength constraint rows: 0`.

## Authority and change-surface map

Use exactly:

```markdown
| Candidate or follow-up | Governing authority            | Code/test impact         | Doc/skill impact                 | Required artifact type                         |
| ---------------------- | ------------------------------ | ------------------------ | -------------------------------- | ---------------------------------------------- |
| <name>                 | <FOUNDATIONS/domain authority> | <affected behavior seam> | <coordinated or separate impact> | <PRD/spec/ticket/ADR/doc/skill-audit/coverage> |
```

Name stable paths and public seams when live inspection supports them. Do not prescribe patch
order or volatile private symbols. State directly when no authority, doc, or skill change is owed.

## PRD candidates

Under `## Recommended PRD Package`, give every intended or deferred PRD its own subsection:

```markdown
### PRD Candidate: <exact candidate name>

Candidate role: first
Purpose: <author-visible outcome>
Sources: <one or more report IDs>
Problem: <current behavior and impact>
Product rule or seam: <codebase-wide behavior statement and existing seam>
Affected surfaces: <code, tests, active docs, and skills>
Scope: <included outcomes>
Acceptance: <observable proof>
Preserved strengths: <strength IDs, or N/A - no affected source strength>
Testing seam: <highest existing seam>
Out of scope: <explicit exclusions>
```

Allowed roles are:

- `first` for the sole intended PRD in a `single intended PRD` or
  `first PRD plus deferred follow-ons` package;
- `deferred` for candidates not included in the current publication package; and
- `program <n>` for a contiguous, dependency-ordered multi-PRD program beginning at 1.

Package rules:

- `single intended PRD` has exactly one `first` candidate and no deferred candidate;
- `first PRD plus deferred follow-ons` has exactly one `first` and at least one `deferred`;
- `multi-PRD program` has at least two contiguous `program <n>` candidates and may also carry
  deferred candidates; and
- `no new PRD` has no PRD candidate subsection.

Every candidate must cite a source report ID. `Preserved strengths` must name affected strength IDs
or the explicit N/A reason; the Strength Preservation Ledger remains the detailed constraint home.

## Non-PRD follow-up

Use exactly:

```markdown
| Item                        | Destination                                                                         | Trigger or next action | Evidence required |
| --------------------------- | ----------------------------------------------------------------------------------- | ---------------------- | ----------------- |
| <report ID or grouped name> | <ticket / skill-audit / doc correction / verification-reopen / coverage / research> | <bounded action>       | <proof>           |
```

When none exists, include one row beginning `None` and explain why. Do not create these artifacts or
run their mutation checkpoints during prep.

## Prior recommendation consumption

Include this subsection under `## Source Inventory` when either:

- `Existing same-stem prep classification` is anything other than `missing at intake`; or
- `Prior-report prep classification` is anything other than `not applicable` or
  `missing at intake`.

```markdown
### Prior Recommendation Consumption Ledger

| Source prep                       | Prior recommendation                  | Current classification | Evidence              | Resulting action                      |
| --------------------------------- | ------------------------------------- | ---------------------- | --------------------- | ------------------------------------- |
| reports/<source-stem>-prd-prep.md | First operational action: <old value> | consumed               | <issue/code evidence> | <drop, retain, reject, or resequence> |
| reports/<source-stem>-prd-prep.md | PRD Candidate: <exact name>           | still live             | <issue/code evidence> | <drop, retain, reject, or resequence> |
| reports/<source-stem>-prd-prep.md | Non-PRD Follow-Up: <exact item>       | superseded             | <issue/code evidence> | <drop, retain, reject, or resequence> |
```

Allowed current classifications are `consumed`, `still live`, `rejected`, and `superseded`.
For each applicable source prep, account for the former first action, every former PRD candidate,
and every former Non-PRD Follow-Up row other than a `None` sentinel. Use the exact repo-relative
source prep path and the exact recommendation forms shown above; escape table separators when
needed. A prior-report prep is historical recommendation input, not product authority, and every
classification still requires current evidence.

## Final worktree ledger

Under `## Freshness And Boundaries`, write:

```markdown
Final branch: <exact git branch --show-current output>
Final worktree rows: <integer>

### Final Worktree Ledger

| Path                                    | Classification            |
| --------------------------------------- | ------------------------- |
| reports/<source-stem>-prd-prep.md       | intentional prep artifact |
| <repo-relative remaining worktree path> | pre-existing              |
| <repo-relative remaining worktree path> | concurrent/unowned        |
```

Include every path from the final `git status --short` snapshot exactly once. Allowed
classifications are `intentional prep artifact`, `pre-existing`, and `concurrent/unowned`. Use an
empty table after the header and divider when the final worktree is clean, and record
`Final worktree rows: 0`. At most one row may be `intentional prep artifact`, and that row must name
the authored same-stem prep path. The validator proves table shape, count, uniqueness, allowed
classifications, and authored-path identity; the manual freshness scan proves equality with live
Git output.

Take the snapshot immediately before final validation. Immediately after a validation pass, run
the same branch and status commands again. If either output changed, update this ledger, repeat the
affected freshness and privacy review, rerun final validation, and compare again until the live
outputs match the validated snapshot exactly.

## Privacy and durability

Do not include:

- machine-local `/tmp` or home-directory paths;
- localhost URLs;
- full prompts or record payloads;
- raw assistance responses;
- candidate or accepted prose;
- API keys or key-like values; or
- temporary browser/session plumbing.

For durable local sources, record tracked, clean, publication-ref path visibility, and content
identity. Otherwise use `pending local publication` or `summarized, not cited`. The prep artifact
itself remains new/untracked or dirty until separately committed and published.

## Completion language

Outside the three draft self-check values used only during `--draft` validation, write
completed-state evidence, not reminders. Do not leave `TBD`, “should be checked,” “must be checked
before publication,” or “if the body passes” language. Open product decisions remain explicit in
candidate or label-downgrade fields and must not masquerade as completed checks. A final artifact
must contain no `pending` self-check value.

The artifact is complete when every source ID and strength passes the structural validator, every
semantic disposition has been manually reviewed, the publication verdict and package agree, and a
later `$playtest-to-issues` custody pass can resolve every non-PRD row and return the residual queue
without reconstructing provenance or scope from the source report. `/to-prd` follows that custody
pass, never the prep artifact directly. The final branch and worktree ledger must also match the
post-validation Git comparison.
