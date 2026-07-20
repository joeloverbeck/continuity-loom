# Playtest PRD Prep Artifact Contract

Use only for `reports/<playtest-report-stem>-prd-prep.md`. `SKILL.md` owns reconciliation; this
file owns the exact artifact shape.

## Title and section order

Begin with:

```markdown
# Playtest PRD Prep: <story title>
```

Use these sections exactly, in order:

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

Fields are bare line-start `Key: value` lines, never bullets or bold labels.

Under `## Header And Freshness`:

```markdown
Prep contract version: 2
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

Version 2 is current. Unversioned historical artifacts are implicit version 1. The producer
rewrites older same-stem artifacts at version 2 after accounting for every recommendation;
`$playtest-to-issues` never migrates producer fields. External research may instead be
`used - explicit user request: <scope>` only when the user explicitly expanded the run.

For a clean source, `Source validation` is exactly `passed`. Only an inspector-approved
nonblocking report-validator defect uses:

```markdown
Source validation: nonblocking defects - <concise summary>
```

That defect also needs a skill-maintenance follow-up. Blocking errors produce no artifact.

Under `## Reassessment Verdict`:

```markdown
First operational action: <substantive action, or none - reason>
```

It is never the mandatory custody or publication handoff. Then include exactly one verdict and its
matching package:

```markdown
Recommended first new PRD: <name>
Recommended multi-PRD program: <name>
No-new-PRD verdict: <reason>

Publication package: single intended PRD
Publication package: first PRD plus deferred follow-ons
Publication package: multi-PRD program
Publication package: no new PRD
```

Under `## Source Inventory`, use `--inspect-source` counts:

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

Under `## Completion Self-Check`, draft validation requires:

```markdown
Prep validator: pending
Manual semantic review: pending
Privacy and stale-language scan: pending
```

After draft validation and the named reviews actually complete, final validation requires:

```markdown
Prep validator: passed
Manual semantic review: completed
Privacy and stale-language scan: clear
```

## Evidence disposition ledger

```markdown
| Report item | Report summary | Disposition     | Current evidence | Change/PRD impact     |
| ----------- | -------------- | --------------- | ---------------- | --------------------- |
| F001        | <summary>      | fresh-prd-scope | <evidence>       | <candidate or impact> |
```

Include every cumulative ID exactly once; prioritized IDs must be in that inventory. Allowed
dispositions:

- `preserve-strength` — proven value constraining change;
- `covered` — current behavior/completed work satisfies the outcome;
- `verification/reopen` — current evidence conflicts with claimed completion;
- `fresh-prd-scope` — broad/risky product behavior needing a PRD;
- `ticket-candidate` — narrow scoped product work;
- `skill-maintenance` — playtest methodology, report schema, or agent process;
- `doc-correction` — active authority misstates behavior;
- `coverage-follow-up` — replay/test/audit/evidence before product scope;
- `research-follow-up` — external evidence before doctrine; or
- `no-op/rejected` — resolved, preference-only, disproportional, duplicate, or unsupported.

Every source strength uses `preserve-strength`; no other row may. Put uncertainty in current
evidence. For zero cumulative rows, keep only header/divider and record `Disposition rows: 0`.

## Strength preservation ledger

```markdown
| Strength ID | Applies to | Preservation constraint | Regression evidence              |
| ----------- | ---------- | ----------------------- | -------------------------------- |
| F015        | global     | <behavior to preserve>  | <test, browser, or review proof> |
```

Include each source `strength`/`preserve-strength` row exactly once. `Applies to` is `global`
or exact candidate/follow-up names. Strengths constrain scope; they do not create it. For zero
strengths, keep only header/divider and record `Strength constraint rows: 0`.

## Authority and change-surface map

```markdown
| Candidate or follow-up | Governing authority            | Code/test impact         | Doc/skill impact                 | Required artifact type                         |
| ---------------------- | ------------------------------ | ------------------------ | -------------------------------- | ---------------------------------------------- |
| <name>                 | <FOUNDATIONS/domain authority> | <affected behavior seam> | <coordinated or separate impact> | <PRD/spec/ticket/ADR/doc/skill-audit/coverage> |
```

Use stable paths/public seams when supported; state when no authority, doc, or skill change is owed.

## PRD candidates

Under `## Recommended PRD Package`, each intended/deferred PRD gets:

```markdown
### PRD Candidate: <exact candidate name>

Candidate role: <first / deferred / program n>
Purpose: <author-visible outcome>
Sources: <source IDs>
Problem: <current behavior and impact>
Product rule or seam: <stable rule and existing seam>
Affected surfaces: <code, tests, active docs, and skills>
Scope: <included outcomes>
Acceptance: <observable proof>
Preserved strengths: <strength IDs, or N/A - no affected source strength>
Testing seam: <highest existing seam>
Out of scope: <explicit exclusions>
```

Package cardinality:

- `single intended PRD`: one `first`, no others;
- `first PRD plus deferred follow-ons`: one `first`, at least one `deferred`;
- `multi-PRD program`: contiguous `program 1..` with at least two, plus optional deferred; and
- `no new PRD`: no candidate subsection.

Every candidate cites source IDs and affected strengths (or the exact N/A reason).

## Non-PRD follow-up

```markdown
| Item                        | Destination                  | Trigger or next action | Evidence required |
| --------------------------- | ---------------------------- | ---------------------- | ----------------- |
| <report ID or grouped name> | ticket - <exact packet name> | <bounded action>       | <proof>           |
```

When none exists, include one `None` row with the reason. Do not execute any destination.
Non-ticket destinations are `skill-audit`, `doc correction`, `verification-reopen`,
`coverage`, and `research`, optionally with a bounded suffix.

Each `ticket - <name>` row has exactly one matching packet, and packets cover every
`ticket-candidate` ID exactly once:

```markdown
### Ticket Packet: <exact packet name>

Sources: <ticket-candidate IDs>
Type and readiness: <proposed type and triage posture with evidence>
Problem: <author-visible gap and impact>
Product rule: <stable behavior rule>
Affected surfaces: <code, tests, active docs, and skills>
Scope: <included outcomes>
Acceptance:

- <observable criterion>

Preserved strengths: <strength IDs, or N/A - no affected source strength>
Testing seam: <highest existing behavior seam>
Out of scope: <explicit exclusions>
Browser-visible guidance checklist mapping:

- `<current canonical checklist item>`: <issue-body home, or N/A - specific reason>
```

Use the live checklist from `docs/agents/issue-tracker.md`. Packets must let
`$playtest-to-issues` assess/stage a ticket without reconstructing source scope.

## Prior recommendation consumption

Include under `## Source Inventory` when the current same-stem prep is not `missing at intake`,
or an existing prior-report prep has a current classification:

```markdown
### Prior Recommendation Consumption Ledger

| Source prep                       | Prior recommendation                  | Current classification | Evidence              | Resulting action                      |
| --------------------------------- | ------------------------------------- | ---------------------- | --------------------- | ------------------------------------- |
| reports/<source-stem>-prd-prep.md | First operational action: <old value> | consumed               | <issue/code evidence> | <drop, retain, reject, or resequence> |
| reports/<source-stem>-prd-prep.md | PRD Candidate: <exact name>           | still live             | <issue/code evidence> | <drop, retain, reject, or resequence> |
| reports/<source-stem>-prd-prep.md | Non-PRD Follow-Up: <exact item>       | superseded             | <issue/code evidence> | <drop, retain, reject, or resequence> |
```

Classifications are `consumed`, `still live`, `rejected`, and `superseded`. For every
applicable prep, account for its first action, every candidate, and every non-`None` follow-up
using exact repo path and recommendation form. Prior prep is evidence, not product authority.

## Final worktree ledger

Under `## Freshness And Boundaries`:

```markdown
Final branch: <exact branch>
Final worktree rows: <integer>

### Final Worktree Ledger

| Path                                    | Classification            |
| --------------------------------------- | ------------------------- |
| reports/<source-stem>-prd-prep.md       | intentional prep artifact |
| <remaining path>                        | pre-existing              |
| <remaining path>                        | concurrent/unowned        |
```

Include every path from `git status --short --untracked-files=all` exactly once. At most one row
is `intentional prep artifact`, naming the authored same-stem prep. A clean tree keeps the empty
table and `Final worktree rows: 0`. The validated ledger must equal the post-validation branch and
status capture.

## Privacy, durability, and completion

Exclude machine-local paths, localhost URLs, full prompts/payloads, raw assistance, candidate or
accepted prose, API keys, and temporary browser/session plumbing. Durable sources need tracked,
clean, publication-ref visibility, and content identity; otherwise use `pending local publication`
or `summarized, not cited`. The prep remains new/untracked or dirty until separately published.

Outside draft self-checks, use completed evidence—not `TBD`, “should be checked,” “must be checked
before publication,” “if the body passes,” or pending completion claims.

Completion means exact ID/strength coverage, semantic review, matching verdict/package, custody-ready
non-PRD and PRD inventories, and a final worktree ledger matching the post-validation comparison.
`$playtest-to-issues` owns follow-up custody; `/to-prd` follows it.
