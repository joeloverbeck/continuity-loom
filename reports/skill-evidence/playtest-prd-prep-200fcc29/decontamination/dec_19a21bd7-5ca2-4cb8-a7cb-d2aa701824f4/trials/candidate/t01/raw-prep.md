# Playtest PRD Prep: The Unbidden Oath

## Header And Freshness

Prep contract version: 2
Source report path: reports/playtest-the-unbidden-oath-2026-07-17T104952Z.md
Source validation: passed
Source durability: durable - tracked, clean, publication-ref-visible, and content-identical at HEAD and origin/main with SHA-256 b8bad94a76e92201e474b81c6a0780ba34a4e71dff2f9aa3563badb656f18694
Authored artifact durability: dirty
Live checkout: detached HEAD 7e8a545860c0d70f25be429d0a02b37d44be8bbc; report launch HEAD 6645191ee73f41787757953232831cf692d0ac80; baseline dirt is the installed candidate skill snapshot and the harness-removed same-stem prep
Tracker freshness: read 2026-07-20 - #91, #93, #94, #96, #100-#108, and #116 are CLOSED; enhancement, needs-triage, and ready-for-agent labels are present
Existing same-stem prep classification: missing at intake
Prior-report prep path: not applicable
Prior-report prep classification: not applicable
Prior-report traversal: not applicable - new-story source declares prior_report null
Deliverable status: PRD-ready determination only; prep artifact write only
External research: skipped - repo-local prep

## Reassessment Verdict

First operational action: stage ticket packet Author-facing unopened-project runtime status
No-new-PRD verdict: broad and risky findings already have closed owners and passing current proof; the only live product gap is one narrow presentation ticket
Publication package: no new PRD

## Source Inventory

Source prioritized findings: 12
Source cumulative ledger rows: 21
Source strength rows: 7
Disposition rows: 21
Strength constraint rows: 7

The source inspector accepted the historical schema-v1 report. It also warned that one declared counterfactual probe predates the later disclosure block, so compatibility mode cannot reconstruct that block. The warning is disclosed here and routed to a bounded skill audit; it does not invalidate the report or authorize a source rewrite.

## Evidence Disposition Ledger

| Report item | Report summary | Disposition | Current evidence | Change/PRD impact |
| ----------- | -------------- | ----------- | ---------------- | ----------------- |
| F001 | Voice-pressure cast field required a raw UUID | covered | Closed #101 and current Generation Brief tests use complete human labels while storing only the CAST MEMBER id | No new scope |
| F002 | Reconciliation prompt carried a disproportionate schema catalog | covered | Closed #91/#93; the active contract and golden test lock one complete compact catalog at 18,696 UTF-16 units versus the 136,328 baseline | No new scope |
| F003 | Identical reconciliation input produced a false-negative no-op and useful deltas | covered | Closed #100; current UI labels an all-empty result unverified, directs manual comparison, and requires explicit confirmation before retry | No new scope; model variability is not claimed eliminated |
| F004 | One Private Note journey persisted a blank duplicate | covered | Closed #107/#108; root integration tests prove one identity through an in-flight first create, retry, later edits, and one-row readback | No new scope |
| F005 | Primary routes were clipped in the desktop sidebar | covered | Closed #102; the sidebar is independently scrollable, keyboard-focusable, and component-tested with the complete ordered route list | No new scope |
| F006 | Accepted prose left generation context at first segment | covered | Closed #94/#96; accepted-segment count now determines the required context and a mismatch fails closed until explicit saved repair | No new scope |
| F007 | CAST MEMBER creation hid its ENTITY prerequisite | covered | Closed #103/#116; Records now guides ENTITY-first creation and offers explicit linked CAST MEMBER creation and activation handoff | No new scope |
| F008 | Record Hygiene excluded ENTITY and CAST MEMBER payloads | covered | The active atomic-review authority deliberately excludes both payload types, and Source Disclosure names the exclusions and selected-scope effect before send | Preserve the bounded hygiene profile; no expansion |
| F009 | Prompt search counted matches without navigation | covered | Closed #104; Prompt Inspector highlights the active match and provides accessible Previous/Next wraparound navigation | No new scope |
| F010 | Saved configuration banners coexisted with no-saved summaries | covered | Closed #105; current component tests replace the missing state with one truthful saved status and reload server state | No new scope |
| F011 | Cast rows and raw JSON hindered record scanning | covered | Closed #106; Records leads CAST MEMBER rows with linked human identity and keeps exact payload behind a collapsed disclosure | No new scope |
| F012 | Unopened-project status rail led with unexplained component terms | ticket-candidate | Current RuntimePanel still presents Health, App version, Templates, and Compiler without author consequence or a technical-details hierarchy; no projected tracker title owns this gap | Stage the narrow Author-facing unopened-project runtime status ticket |
| F013 | Ideate returned four ideas when five were requested | no-op/rejected | One cold evaluation did not exercise the configured provider; the active ideation contract intentionally shrinks a slate when fewer grounded operators are eligible rather than padding unsupported output | No product mandate or PRD scope |
| F014 | Prose asserted an unearned translation phenomenon | no-op/rejected | The author removed the isolated assertion before acceptance; knowledge locks, visible candidate editing, and the accepted boundary otherwise worked | Resolved run-local model output; no current change |
| F015 | Create/Open onboarding and project-first model were clear | preserve-strength | Current Project Library component coverage preserves distinct Create/Open entry points | Constrains F012 ticket |
| F016 | Exact path, title, compatibility, and backup reinforced custody | preserve-strength | Project ownership remains explicit in the Project Library and user guide | Constrains F012 ticket |
| F017 | Field help explained stable authority and prompt destination | preserve-strength | Active schema guidance and field-help tests keep continuity roles visible | Global preservation constraint |
| F018 | CAST MEMBER guidance separated durable identity from current pressure | preserve-strength | Active schema authority and named-picker tests retain that separation | Global preservation constraint |
| F019 | Private Notes stated inert/private consequences up front | preserve-strength | User guide, isolation tests, and note-persistence tests preserve the boundary | Global preservation constraint |
| F020 | Readiness blockers mapped to canonical fixes | preserve-strength | Compiler contract and cross-page readiness tests retain actionable fail-closed repair | Global preservation constraint |
| F021 | All 22 authored brief fields were present and influential | preserve-strength | Generation Brief/compiler coverage preserves deterministic field mapping | Global preservation constraint |

## Strength Preservation Ledger

| Strength ID | Applies to | Preservation constraint | Regression evidence |
| ----------- | ---------- | ----------------------- | ------------------- |
| F015 | Author-facing unopened-project runtime status | Keep Create and Open as the primary first actions; runtime copy must not displace them | ProjectPicker and AppShell component tests plus the no-project desktop browser scenario |
| F016 | Author-facing unopened-project runtime status | Keep exact local folder, title, compatibility, backup, and close controls visible after a project opens | ProjectPicker component tests and Project Ownership guide review |
| F017 | global | Keep field help explicit about authority and prompt consequences | Field-help component coverage and story-record schema review |
| F018 | global | Keep durable CAST MEMBER identity separate from moment-only voice pressure | Generation Brief named-picker tests and schema contract review |
| F019 | global | Keep Private Notes visibly inert, private, and outside continuity/prompt authority | Note isolation and persistence integration tests |
| F020 | global | Keep readiness diagnostics actionable and tied to canonical repair surfaces | Generation-context and cross-page readiness coverage |
| F021 | global | Keep deterministic Generation Brief field mapping and prompt inspectability | Generation Brief, compiler, and Prompt Inspector coverage |

## Authority And Change-Surface Map

| Candidate or follow-up | Governing authority | Code/test impact | Doc/skill impact | Required artifact type |
| ---------------------- | ------------------- | ---------------- | ---------------- | ---------------------- |
| Author-facing unopened-project runtime status | FOUNDATIONS section 27; docs/user-guide.md local runtime and project ownership | packages/web/src/shell/AppShell.tsx, styles, AppShell component coverage, and a no-project 1440x900 browser scenario | No domain-authority change; align visible terminology with the user guide | ticket |
| Historical counterfactual disclosure compatibility | Playtest report schema and validator contract | Audit validate-report compatibility warning and inspector classification consistency | .claude/skills/playtest report-format/validator maintenance only if the audit proves drift | skill-audit |
| Bounded hygiene scope | FOUNDATIONS section 9.1 and docs/story-record-hygiene-prompt-template.md | No change; current Source Disclosure coverage is the proof | No change | none - covered |
| Grounded Ideate slate cardinality | docs/ideation-prompt-template.md | No change; deterministic slot-assignment coverage is the proof | No change | none - rejected |

## Recommended PRD Package

No PRD candidate is recommended. Current closed owners and focused tests cover every broad or risky report outcome; F012 is independently ticket-sized.

## Non-PRD Follow-Up

| Item | Destination | Trigger or next action | Evidence required |
| ---- | ----------- | ---------------------- | ----------------- |
| F012 | ticket - Author-facing unopened-project runtime status | Stage one narrow browser-visible presentation issue | AppShell component proof plus production 1440x900 no-project keyboard and hierarchy evidence |
| Historical schema-v1 counterfactual warning | skill-audit - Historical counterfactual disclosure compatibility | Audit whether report validation and source inspection should expose one common explicit nonblocking classification | Historical fixture proving warning behavior without source repair or changed finding counts |

### Ticket Packet: Author-facing unopened-project runtime status

Sources: F012
Type and readiness: enhancement, ready-for-agent - current source confirms the gap, the behavior rule is bounded, and the existing AppShell/browser seams are sufficient
Problem: Before a project is open, the persistent runtime panel foregrounds component vocabulary and a private package version without explaining the author consequence, competing with an otherwise clear Create/Open entry point.
Product rule: Lead with plain local-server readiness and local-data consequence; retain version/template/compiler values as secondary technical diagnostics without hiding failure state.
Affected surfaces: packages/web/src/shell/AppShell.tsx, packages/web/src/styles.css, packages/web/src/shell/AppShell.test.tsx; no API, storage, prompt, record, or schema change
Scope: Reword and visually subordinate ready-state runtime diagnostics, keep loading and unreachable-server states truthful, and preserve keyboard access to any technical disclosure.
Acceptance:

- With no project open, the runtime panel explains in author language whether the local server is ready while Create and Open remain the dominant first actions.
- App, template, and compiler diagnostics remain available as secondary technical detail and retain their exact values.
- Loading and unreachable-server states remain distinct, accessible, and do not claim project or provider readiness.
- A 1440x900 production browser check proves the hierarchy, disclosure keyboard path, primary navigation reachability, and zero new console errors or warnings.

Preserved strengths: F015, F016
Testing seam: AppShell component coverage for state/copy/accessibility plus the existing production 1440x900 shell browser seam
Out of scope: changing package-version semantics, health/version API shapes, project Create/Open behavior, sidebar scrolling, provider readiness, or any story-state authority
Browser-visible guidance checklist mapping:

- `entry point and availability`: Project Library startup before a project is open; the runtime panel remains globally present and Create/Open availability is unchanged.
- `user-visible states, actions, and outcomes`: Specify loading, ready, technical-detail disclosure, and unreachable-server presentation; no new mutating action.
- `validation, warning, error, and recovery behavior`: Preserve the unreachable local-server alert and truthful reconnect-by-reload behavior; do not recast it as project or provider validation.
- `prompt preview contents and freshness`: N/A - the ticket does not compile, inspect, or change prompts.
- `user-initiated external LLM boundary`: N/A - the ticket makes no provider request and changes no send control.
- `canon and prose boundary visibility`: N/A - the ticket touches only runtime orientation before story surfaces.
- `persistence, migration, export, and provenance`: N/A - presentation-only work changes no stored or exported data.
- `browser and accessibility regression scenario`: AppShell component checks plus production Chromium at 1440x900, keyboard access to secondary diagnostics, complete reachable navigation, and console review.

## Rejected Or No-Op Alternatives

- Reopening reconciliation catalog or no-op reliability scope is rejected: #91/#93 and #100 are closed, their final SHAs are ancestors of the live checkout, and focused current tests pass.
- Reopening generation-context, voice-pressure, note, sidebar, cast-prerequisite, prompt-search, configuration-status, or cast-scanability scope is rejected: exact closed owners and current regression seams agree.
- Expanding Record Hygiene to ENTITY or CAST MEMBER payloads is rejected: the active authority defines an atomic-record review and the UI already discloses those exclusions.
- Requiring Ideate to pad every requested count is rejected: the active contract prefers a smaller grounded slate over unsupported ideas.
- Creating product scope from F014 is rejected: the isolated model assertion was visibly removed before acceptance and did not enter canonical continuity.
- A PRD for F012 is rejected as disproportionate to a copy/hierarchy change with an existing component and browser seam.

## PRD Publication Inputs

Recommended testing seam: N/A - no PRD; use the AppShell component and production 1440x900 shell browser seam for the F012 ticket
/to-prd consultation: house style only; seam checkpoint still owed
Likely label: enhancement and ready-for-agent for Author-facing unopened-project runtime status; both labels exist in the live tracker
Label downgrade conditions: use needs-triage if the work expands into package-version semantics, API contracts, or a new global navigation model
Browser-visible guidance checklist: applies - all eight canonical items are mapped in the F012 ticket packet

## Completion Self-Check

Prep validator: passed
Manual semantic review: completed
Privacy and stale-language scan: clear

## Freshness And Boundaries

Final branch: detached HEAD at 7e8a545860c0d70f25be429d0a02b37d44be8bbc
Final worktree rows: 3

### Final Worktree Ledger

| Path | Classification |
| ---- | -------------- |
| .claude/skills/playtest-prd-prep/SKILL.md | pre-existing |
| .claude/skills/playtest-prd-prep/references/prep-format.md | pre-existing |
| reports/playtest-the-unbidden-oath-2026-07-17T104952Z-prd-prep.md | intentional prep artifact |
