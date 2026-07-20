# Playtest PRD Prep: The Winter Letter

## Header And Freshness

Prep contract version: 2
Source report path: reports/playtest-the-winter-letter-2026-07-19T022000Z.md
Source validation: passed
Source durability: durable - tracked, clean, content-identical to HEAD, and visible on published main at 7e8a545860c0d70f25be429d0a02b37d44be8bbc
Authored artifact durability: dirty
Live checkout: detached HEAD at 7e8a545860c0d70f25be429d0a02b37d44be8bbc; baseline dirt was the installed candidate skill plus the harness-removed same-stem prep
Tracker freshness: exact 2026-07-20 reads found #100, #109, #110, #111, #112, and #117 CLOSED; their delivered seams remain present at checkout HEAD
Existing same-stem prep classification: missing at intake
Prior-report prep path: not applicable
Prior-report prep classification: not applicable
Prior-report traversal: not applicable - source run mode is new_story and prior_report is null
Deliverable status: PRD-ready determination only; prep artifact write only
External research: skipped - repo-local prep

## Reassessment Verdict

First operational action: none - every report-scoped product finding is covered by current delivered work and both harness rows are resolved
No-new-PRD verdict: all product findings are covered by closed issue #100, closed issues #109-#112, or delivered closed PRD #117; no uncustodied report scope remains
Publication package: no new PRD

## Source Inventory

Source prioritized findings: 6
Source cumulative ledger rows: 14
Source strength rows: 6
Disposition rows: 14
Strength constraint rows: 6

## Evidence Disposition Ledger

| Report item | Report summary | Disposition | Current evidence | Change/PRD impact |
| ----------- | -------------- | ----------- | ---------------- | ----------------- |
| F007 | Initial CDP connection needed a bounded retry. | no-op/rejected | The report records successful recovery with no product action on failure. | Resolved harness friction; no product scope. |
| F001 | Local project path semantics were underexplained. | covered | Closed #109 names this report and F001; `ProjectPicker` now explains absolute parent paths and child folders, with associated recovery tests. | Existing owner consumed the row; no new issue or PRD. |
| F008 | Project creation exposes exact local custody and compatibility. | preserve-strength | `ProjectPicker` still presents open state, title, compatibility, store version, and local project path together. | Preserve globally and around F001-adjacent presentation. |
| F002 | Story Configuration led with schema-shaped labels. | covered | Closed #110 names this report and F002; `StoryConfigEditor` now leads every field with an author label while retaining schema keys as secondary metadata. | Existing owner consumed the row; no new issue or PRD. |
| F003 | Rich CAST MEMBER core dominated first-segment setup. | covered | Delivered closed PRD #117 adds a static copy-and-paste dossier drafting and tolerant import loop; current guidance also states that an offstage-pressure person may remain ENTITY-first until durable deepening is useful. | The clerical-cost outcome is delivered without weakening rich active-cast authority; no new PRD. |
| F009 | Private Notes are visibly inert and excluded from prompt and assistance sources. | preserve-strength | `docs/FOUNDATIONS.md` and `docs/user-guide.md` retain the explicit isolation boundary. | Preserve globally; no scope created. |
| F004 | Working Set CAST MEMBER rows obscured linked names. | covered | Closed #111 names this report and F004; Working Set rows and cast controls now lead with linked ENTITY identity, with available, archived, and missing-link tests. | Existing owner consumed the row; no new issue or PRD. |
| F010 | Readiness distinguishes blockers from warnings and routes fixes. | preserve-strength | Constitutional and user-guide readiness rules remain fail-closed and author-actionable while warnings stay nonblocking. | Preserve globally, especially around manual candidate recovery. |
| F011 | The first browser holder exited during the journey. | no-op/rejected | The report records lossless recovery in the unchanged project and classifies the event as harness friction. | Resolved harness event; no product scope. |
| F012 | Prompt search made field placement auditable and supported bounded prose. | preserve-strength | Prompt inspection remains deterministic and current tests retain search/navigation coverage without changing prompt bytes. | Preserve globally, especially around assistance inspection. |
| F005 | Manual candidate entry was distant from the provider blocker. | covered | Closed #112 names this report and F005; Generate now exposes a provider-blocker recovery action that scrolls to and focuses the sole manual-entry control without sending or opening a draft. | Existing owner consumed the row; no new issue or PRD. |
| F013 | Acceptance preserves prose-to-canon boundaries and lifecycle coherence. | preserve-strength | `docs/FOUNDATIONS.md` and the candidate lifecycle retain explicit acceptance, durable-change reminder, and manual record-update gates. | Preserve globally, especially around candidate and reconciliation surfaces. |
| F006 | Reconciliation produced one empty/provenance-invalid draw and one cited draw. | covered | Closed #100 delivers an announced unverified-no-change state, manual comparison, and explicit retry only; parser and route tests reject stale fingerprints and preserve zero-write quarantine. | Current guard and provenance enforcement cover the desired outcome; no new issue or PRD. |
| F014 | Record Hygiene was sparse, type-aware, and safe across authority types. | preserve-strength | The active user guide and prompt authority retain complete scoped atomic-record review with suggestion-only scratch and no apply path. | Preserve globally; no scope created. |

## Strength Preservation Ledger

| Strength ID | Applies to | Preservation constraint | Regression evidence |
| ----------- | ---------- | ----------------------- | ------------------- |
| F008 | global | Keep Create/Open direct and retain exact local custody, compatibility, and store-version readback after project creation. | `ProjectPicker` component coverage and closed #109 acceptance evidence. |
| F009 | global | Keep Private Notes outside records, readiness, working sets, every prompt, and assistance output. | Constitutional isolation rules plus Private Notes user guidance and server isolation coverage. |
| F010 | global | Keep readiness author-readable, blockers fail-closed, warnings nonblocking, and provider blockers distinct from prompt blockers. | Readiness authorities and Generate component coverage. |
| F012 | global | Keep prompt bytes, fingerprint, metadata, and searchable inspection visible before any send. | Prompt Inspector consumer coverage and unchanged compiler contract. |
| F013 | global | Keep candidates non-canonical until explicit acceptance and keep continuity updates manual after acceptance. | Candidate lifecycle and Segment Reconciliation zero-write tests. |
| F014 | global | Keep Record Hygiene scoped, type-aware, advisory, and incapable of applying record changes. | Record Hygiene prompt authority and user-guide quarantine contract. |

## Authority And Change-Surface Map

| Candidate or follow-up | Governing authority | Code/test impact | Doc/skill impact | Required artifact type |
| ---------------------- | ------------------- | ---------------- | ---------------- | ---------------------- |
| Covered authoring UX: F001, F002, F004, F005 | `docs/FOUNDATIONS.md` sections 24 and 27; `docs/story-record-schema.md` | Current Project Picker, Story Configuration, Working Set, and Generate component seams with regression tests | Current user guidance already describes the delivered behavior; no skill change | covered - closed issues #109-#112; no new artifact |
| Covered CAST MEMBER authoring cost: F003 | `docs/FOUNDATIONS.md` sections 17 and 26.2; `docs/story-record-schema.md` section 5 | Current core draft parser/template and Cast Member editor component seams | `docs/cast-member-draft-prompt-template.md` is active authority; no further doc change | covered - delivered closed PRD #117; no new artifact |
| Covered reconciliation reliability: F006 | `docs/FOUNDATIONS.md` sections 9.1, 20-22, and 26.1; `docs/segment-reconciliation-prompt-template.md` | Current core parser, server route, and Segment Reconciliation result component seams | Current reconciliation authority already requires full quarantine and provenance validation | covered - closed issue #100; no new artifact |
| Resolved harness events: F007, F011 | Source report recovery evidence | No product seam implicated | No doc or skill change | no-op/rejected |
| Preservation constraints: F008-F010, F012-F014 | `docs/FOUNDATIONS.md` and affected domain authorities | Existing component, route, compiler, and isolation regressions | No change owed | covered preservation review |

## Recommended PRD Package

No PRD candidate is recommended. The six prioritized product findings have current delivered owners, and the remaining rows are preserved strengths or resolved harness events.

## Non-PRD Follow-Up

| Item | Destination | Trigger or next action | Evidence required |
| ---- | ----------- | ---------------------- | ----------------- |
| None - no outstanding report-derived work | none - all product rows have closed delivered owners | No action | Closed owner readback plus focused current regression evidence already reviewed |

## Rejected Or No-Op Alternatives

- Reopening #109-#112 is rejected because their exact source rows, acceptance contracts, current code, and closeout SHAs align.
- A second CAST MEMBER authoring PRD is rejected because #117 delivered the bounded clipboard round-trip while preserving rich dossier authority.
- A new reconciliation PRD is rejected because #100 supplies the unverified-empty guard and the existing parser rejects stale provenance.
- Product work for F007 or F011 is rejected because both were bounded, lossless harness recoveries with no contradictory current evidence.

## PRD Publication Inputs

Recommended testing seam: N/A - no new PRD; reviewed seams are existing web components plus the Segment Reconciliation core-parser and server-route boundaries
/to-prd consultation: house style only; seam checkpoint still owed
Likely label: N/A - no issue or PRD is proposed
Label downgrade conditions: none
Browser-visible guidance checklist: N/A - no browser-visible change is proposed

## Completion Self-Check

Prep validator: passed
Manual semantic review: completed
Privacy and stale-language scan: clear

## Freshness And Boundaries

Final branch: detached HEAD
Final worktree rows: 3

### Final Worktree Ledger

| Path | Classification |
| ---- | -------------- |
| `.claude/skills/playtest-prd-prep/SKILL.md` | pre-existing |
| `.claude/skills/playtest-prd-prep/references/prep-format.md` | pre-existing |
| `reports/playtest-the-winter-letter-2026-07-19T022000Z-prd-prep.md` | intentional prep artifact |
