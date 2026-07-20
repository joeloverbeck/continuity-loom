# Playtest PRD Prep: The Unbidden Oath

## Header And Freshness

Prep contract version: 2
Source report path: reports/playtest-the-unbidden-oath-2026-07-18T145754Z.md
Source validation: passed
Source durability: durable - tracked, clean, visible on origin/main, and content-identical at blob 151177678a87092b4b5d65bc62f01bc46b578bf8; the frozen source and predecessor inputs also matched the run manifest
Authored artifact durability: dirty - the tracked same-stem path was removed by the frozen trial harness before intake and is rewritten only by this run
Live checkout: detached HEAD at 7e8a545860c0d70f25be429d0a02b37d44be8bbc; baseline dirt was the candidate skill overlay at .claude/skills/playtest-prd-prep/SKILL.md and .claude/skills/playtest-prd-prep/references/prep-format.md plus the harness removal of this source's tracked same-stem prep
Tracker freshness: live GitHub reads on 2026-07-20 found closed owners #91-#108 for prior and current findings except F013; exact Ideate count, partial-slate, four-of-five, and slot-completeness searches found no current owner
Existing same-stem prep classification: missing at intake
Prior-report prep path: reports/playtest-the-unbidden-oath-2026-07-17T104952Z-prd-prep.md
Prior-report prep classification: partially consumed
Prior-report traversal: not needed - the current report and frozen prior prep contain decision-relevant detail for every open, repeated, and not-retested row; the predecessor report body was not reread
Deliverable status: PRD-ready determination only; prep artifact write only
External research: skipped - repo-local prep

## Reassessment Verdict

First operational action: create the narrow Validate Ideate Responses Against the Assigned Slate bug ticket after an exact-title duplicate guard
No-new-PRD verdict: all broad or risky findings already have completed PRD or ticket ownership; the sole live gap is a bounded Ideate response-validation and result-state defect
Publication package: no new PRD

The current compiler deterministically assigns the grounded slate, but the server parser accepts any nonempty set of syntactically valid IDEA blocks without checking the exact assigned slots. The repeated four-of-five result therefore has a stable, narrow product seam: incomplete output must not appear as a complete slate. This does not require a new prompt source, storage rule, provider action, schema, or constitutional decision.

## Source Inventory

Source prioritized findings: 5
Source cumulative ledger rows: 27
Source strength rows: 12
Disposition rows: 27
Strength constraint rows: 12

### Prior Recommendation Consumption Ledger

| Source prep | Prior recommendation | Current classification | Evidence | Resulting action |
| ----------- | -------------------- | ---------------------- | -------- | ---------------- |
| reports/playtest-the-unbidden-oath-2026-07-17T104952Z-prd-prep.md | First operational action: run /to-prd for Bounded Segment Reconciliation Schema Catalog, reuse the existing compiler and route seams, and satisfy the still-owed seam checkpoint before publication | consumed | Closed PRD #91 and children #92-#93 completed at 11d9fec29149ac876f958c4ad5d4b6e05e52bdfa | Drop from the live queue |
| reports/playtest-the-unbidden-oath-2026-07-17T104952Z-prd-prep.md | PRD Candidate: Bounded Segment Reconciliation Schema Catalog | consumed | Closed #91-#93 and current compact-catalog authority; the source retest measured the intended reduction | Drop from the live queue |
| reports/playtest-the-unbidden-oath-2026-07-17T104952Z-prd-prep.md | PRD Candidate: Accepted-Segment Generation Context Coherence | consumed | Closed #94-#96 completed at eee76e3450df3734daa8fa55104929171151b48a; current readiness and browser tests cover mismatch and recovery | Drop from the live queue |
| reports/playtest-the-unbidden-oath-2026-07-17T104952Z-prd-prep.md | Non-PRD Follow-Up: F001 - Voice Pressure Cast Picker | consumed | Closed #101 and current named CAST MEMBER picker | Drop from the live queue |
| reports/playtest-the-unbidden-oath-2026-07-17T104952Z-prd-prep.md | Non-PRD Follow-Up: F003 - Reconciliation No-op Reliability Verification | consumed | Closed #100 and current unverified-no-change warning, explicit retry, and zero-write tests | Drop from the live queue |
| reports/playtest-the-unbidden-oath-2026-07-17T104952Z-prd-prep.md | Non-PRD Follow-Up: F004 - Private Note Single-Identity Verification | consumed | Closed verification #107 exposed bug #108; both closed with one-identity integration proof | Drop from the live queue |
| reports/playtest-the-unbidden-oath-2026-07-17T104952Z-prd-prep.md | Non-PRD Follow-Up: F005 - Desktop Navigation Reachability | consumed | Closed #102 and current independently scrollable viewport-contained sidebar | Drop from the live queue |
| reports/playtest-the-unbidden-oath-2026-07-17T104952Z-prd-prep.md | Non-PRD Follow-Up: F007 - Cast Creation Prerequisite Guidance | consumed | Closed #103 and current explicit ENTITY prerequisite journey | Drop from the live queue |
| reports/playtest-the-unbidden-oath-2026-07-17T104952Z-prd-prep.md | Non-PRD Follow-Up: F009 - Prompt Search Match Navigation | consumed | Closed #104 and current Previous, Next, current-ordinal, wrapping, and scroll behavior | Drop from the live queue |
| reports/playtest-the-unbidden-oath-2026-07-17T104952Z-prd-prep.md | Non-PRD Follow-Up: F010 - Story Configuration Save-State Consistency | consumed | Closed #105 and current successful-save state reconciliation | Drop from the live queue |
| reports/playtest-the-unbidden-oath-2026-07-17T104952Z-prd-prep.md | Non-PRD Follow-Up: F011 - Cast Record Scanability | consumed | Closed #106 and current linked-ENTITY browse identity plus collapsed technical payload | Drop from the live queue |
| reports/playtest-the-unbidden-oath-2026-07-17T104952Z-prd-prep.md | Non-PRD Follow-Up: F013 - Ideate Slot Completeness Verification | still live | The finding repeated, the parser is unchanged from report launch, and a current four-block probe returns ok without assigned-slot comparison | Promote to the narrow ticket packet below |
| reports/playtest-the-unbidden-oath-2026-07-17T104952Z-prd-prep.md | Non-PRD Follow-Up: Source validator defect - Playtest Counterfactual Disclosure Contract | consumed | The current validator passes the historical predecessor with an explicit schema-v1 compatibility warning and has disclosure fixtures | Drop from the live queue |

## Evidence Disposition Ledger

| Report item | Report summary | Disposition | Current evidence | Change/PRD impact |
| ----------- | -------------- | ----------- | ---------------- | ----------------- |
| F001 | Voice-pressure cast selection exposed a raw UUID | covered | Closed #101; Generation Brief now displays eligible CAST MEMBER names, preserves stored IDs, and explains stale or unavailable selections | No new work |
| F002 | Reconciliation prompt scale was disproportionate | covered | The source retest measured a 69 percent reduction; closed #91-#93 and the compact catalog contract own the completed rule | No new work |
| F003 | Byte-identical reconciliation prompts produced a false no-op then useful deltas | covered | Closed #100; a valid all-empty response is now labeled an unverified no-change result with manual comparison and explicit retry, while the parser remains truthful that empty output is structurally valid | Preserve the completed warning; no new PRD |
| F004 | A Private Note journey produced a blank duplicate | covered | Closed #107 deterministically reproduced the lifecycle and #108 repaired the delayed-first-save identity; the focused integration proves one create identity and later updates | No new work |
| F005 | Lower desktop navigation routes were clipped | covered | Closed #102; the sticky sidebar is border-box bounded to the viewport with independent scrolling, and focused App Shell coverage passes | No new work |
| F006 | Accepted prose could leave generation context at first segment | covered | Closed #94-#96; accepted-segment count now drives a fail-closed coherence diagnostic while draft persistence remains author-controlled | No new work |
| F007 | CAST MEMBER creation hid its ENTITY prerequisite | covered | Closed #103; the empty-project flow explains the dependency, offers Create ENTITY, and returns to explicit CAST creation | No new work |
| F008 | Record Hygiene excludes ENTITY and CAST MEMBER payloads | covered | FOUNDATIONS, compiler contract, user guide, and current UI intentionally preserve the disclosed bounded atomic-record profile | Preserve the exclusion; no payload expansion |
| F009 | Prompt search counted without match navigation | covered | Closed #104; shared Prompt Inspector now identifies the current ordinal, wraps Previous and Next, and scrolls the active mark into view | No new work |
| F010 | Saved and no-saved Story Configuration messages could coexist | covered | Closed #105; successful save reconciles the panel's loaded state, and focused component coverage passes | No new work |
| F011 | CAST MEMBER records were hard to scan | covered | Closed #106; Records uses the linked ENTITY's complete human name and secondary context, with raw payload behind disclosure | No new work |
| F012 | Runtime status terminology felt component-oriented | no-op/rejected | The repeated observation still identifies no blocked task, incorrect state, authority conflict, or stronger evidence than a presentation preference | Reject product work without a concrete usability failure |
| F013 | Ideate returned four blocks for five assigned slots | ticket-candidate | The observation repeated across two reports; current parsing accepts any nonempty valid block set, a four-block probe returns ok, and no exact tracker owner exists | Validate response completeness against the deterministic assigned slate and quarantine incomplete results truthfully |
| F014 | Prose asserted an unearned translation phenomenon | covered | The source reports the current prose retest preserved the language lock, and the existing editable candidate plus explicit acceptance gate prevented the earlier defect from becoming durable | Preserve the human gate; no product work |
| F015 | Create/Open onboarding and the project-first model are clear | preserve-strength | Current Project Library and closed follow-up evidence retain project selection before project-scoped work | Global preservation constraint |
| F016 | Path, title, compatibility, and backup reinforce custody | preserve-strength | Current project surfaces and user guidance retain local ownership and recoverability | Global preservation constraint |
| F017 | Field help explains stable authority and prompt destination | preserve-strength | Current field guidance and focused component coverage keep durable and generation-local meanings distinct | Preserve across any result-state copy |
| F018 | CAST MEMBER guidance separates durable identity from current pressure | preserve-strength | The named picker stores only the reference while temporary pressure remains generation-local | Global preservation constraint |
| F019 | Private Notes explain their inert and private boundary | preserve-strength | FOUNDATIONS and isolation tests exclude notes from records, prompts, and assistance | Global preservation constraint |
| F020 | Readiness blockers map to canonical fixes | preserve-strength | Current cross-page readiness behavior names canonical repair actions and clears deterministically | Global preservation constraint |
| F021 | Authored Generation Brief fields compile and influence prose | preserve-strength | Current compiler contract and tests preserve complete declared source without token eviction | Assigned-slate validation must not change source selection or prompt bytes |
| F022 | Ideate lacked an author-focus input | covered | Closed PRD #97 and children #98-#99; current UI, compiler, server fingerprint gate, docs, and tests implement bounded non-canonical Author focus | Preserve completed behavior; no reopen |
| F023 | Continuation state survives a fresh isolated process | preserve-strength | Current persistence and source evidence retain selected records, cast bands, handoff, and validation state | Global preservation constraint |
| F024 | Accepted archive states that prose is not continuity canon | preserve-strength | Current archive and reconciliation authorities keep accepted prose readable but non-authoritative | Global preservation constraint |
| F025 | Candidate and acceptance states form a clear human gate | preserve-strength | Current candidate lifecycle remains editable, non-canonical, and accepted only by explicit action | Global preservation constraint |
| F026 | Durable-change reminder covers canonical reconciliation categories | preserve-strength | Current reminder and reconciliation tests preserve manual review and do not acknowledge the reminder automatically | Global preservation constraint |
| F027 | Record Hygiene preserves type boundaries while finding drift | preserve-strength | Current bounded source profile and type-aware tests keep near matches distinct | Global preservation constraint |

## Strength Preservation Ledger

| Strength ID | Applies to | Preservation constraint | Regression evidence |
| ----------- | ---------- | ----------------------- | ------------------- |
| F015 | global | Keep Create/Open and project-first availability legible before project-scoped routes activate | Project Picker and App Shell component coverage |
| F016 | global | Keep local path, title, compatibility, backup, and ownership visible without account or cloud-custody implications | Project creation/open/backup tests and user-guide review |
| F017 | Validate Ideate Responses Against the Assigned Slate | Explain response completeness in author language without blurring durable state, prompt input, or scratch output | Ideate component assertions for quarantine copy and absence of canonical actions |
| F018 | global | Preserve durable CAST MEMBER dossier authority versus temporary generation-only pressure | Generation Brief named-picker and CAST editor coverage |
| F019 | global | Keep Private Notes excluded from every prompt, record, working-set, and assistance source | Private Note isolation capstone and FOUNDATIONS review |
| F020 | global | Keep blockers author-actionable and clear them only through canonical fixes | Cross-page readiness and generation-context recovery tests |
| F021 | Validate Ideate Responses Against the Assigned Slate | Preserve every compiled source and deterministic slot assignment; response validation must not alter prompt bytes or invent replacement slots | Core ideation assignment/rendering tests plus route fingerprint assertions |
| F023 | global | Preserve fresh-process project persistence for records, cast bands, handoff, and validation | Repository persistence and reopen coverage |
| F024 | global | Keep accepted prose readable but never continuity or prose-prompt authority | Accepted archive, compiler exclusion, and reconciliation source-boundary tests |
| F025 | global | Keep ideas and candidates non-canonical until separate explicit human actions | Ideate quarantine and Draft Candidate lifecycle tests |
| F026 | global | Keep durable-change review manual and keep reminder acknowledgement separate from assistance | Durable reminder and Segment Reconciliation component tests |
| F027 | global | Keep Record Hygiene bounded, type-aware, and conservative | Hygiene golden and type-distinction tests |

## Authority And Change-Surface Map

| Candidate or follow-up | Governing authority | Code/test impact | Doc/skill impact | Required artifact type |
| ---------------------- | ------------------- | ---------------- | ---------------- | ---------------------- |
| Validate Ideate Responses Against the Assigned Slate | docs/FOUNDATIONS.md Sections 9.1, 26.1, 27, and 29; docs/ideation-prompt-template.md output and UI contracts; docs/compiler-contract.md ideation slot and output-format bridge | Existing server ideation response parser and send route; Ideate result state; parser, route, and component regressions | Synchronize ideation output/result-state wording in docs/ideation-prompt-template.md, docs/compiler-contract.md, and docs/user-guide.md; no skill change | ticket |

## Recommended PRD Package

No PRD candidate remains. F013 is a narrow truthfulness defect at an existing parser, route, and browser result seam. It does not alter prompt sources, deterministic assignment, story-state authority, storage, accepted prose, or the user-initiated provider boundary.

## Non-PRD Follow-Up

| Item | Destination | Trigger or next action | Evidence required |
| ---- | ----------- | ---------------------- | ----------------- |
| F013 - Ideate assigned-slot completeness | ticket - Validate Ideate Responses Against the Assigned Slate | Stage one bug issue after an exact-title and exact-rule duplicate guard | Exact assigned-versus-returned slot fixtures at parser and route seams plus accessible partial-result browser proof |

### Ticket Packet: Validate Ideate Responses Against the Assigned Slate

Sources: F013
Type and readiness: proposed bug with ready-for-agent posture; the repeated report evidence, current deterministic parser probe, existing seams, and live no-owner search bound the work
Problem: Ideate can assign five grounded slots and receive only four IDEA blocks, yet the current parser returns success and the browser presents four cards without saying the response is incomplete. The author cannot distinguish a complete intentionally shrunk slate from model omission.
Product rule: validate a provider response against the exact deterministic assigned slate, not the visible requested Count. Every assigned slot must appear exactly once as a contract-valid idea, question, or SKIPPED block. A missing, duplicate, unexpected, wrong-mode, or otherwise incomplete slot set is quarantined as incomplete output with expected and received counts and an explicit manual retry path; it is never padded, silently accepted, or retried automatically.
Affected surfaces: existing ideation assignment output available to the server send path; server response parser and route result shape; Ideate scratch result state; focused parser, route, provider-call, and component tests; docs/ideation-prompt-template.md, docs/compiler-contract.md, and docs/user-guide.md
Scope: compare returned slot numbers and modes with the server-rebuilt assigned slate; accept contract-valid SKIPPED blocks; quarantine the whole incomplete response as ephemeral scratch with plain-language expected-versus-received detail; preserve an explicit one-send retry; keep intentional compiler shrinkage authoritative
Acceptance:

- A compile with five assigned slots followed by valid blocks for slots 1-4 does not return or render a complete slate; it renders one accessible incomplete-output warning naming five expected and four received.
- A request whose deterministic assignment intentionally shrinks from five requested slots to four assigned slots accepts exactly four valid returned blocks without warning.
- Missing, duplicate, out-of-range, wrong-mode, and malformed assigned-slot blocks are quarantined; a well-formed SKIPPED block satisfies its one assigned slot without inventing an idea.
- Quarantined output exposes no Keep or Regenerate-slot action, writes no project or browser storage, and cannot enter records, the Generation Brief, accepted prose, or a prose prompt.
- Retry remains a separate explicit provider action against the current inspected fingerprint; no parser path makes a second provider call or changes prompt bytes, focus, slot assignment, or grounding.
- Parser and route fixtures cover exact assigned-set comparison and one-call behavior; Ideate component coverage proves warning copy, keyboard/assistive-technology discoverability, clear/retry recovery, and scratch quarantine.

Preserved strengths: F017, F021, F025
Testing seam: existing POST /api/ideate route with instrumented transport over the core deterministic assignment, backed by the current response-parser unit seam and Ideate component seam
Out of scope: changing requested Count, operator eligibility, grounding, dormant-slot shrinkage, Author focus, prompt bytes or versions solely for parser behavior, provider/model choice, automatic retry, padding, applying ideas, story-state writes, or reopening #97-#100
Browser-visible guidance checklist mapping:

- `entry point and availability`: the existing Ideate send and scratch panel remain the entry point; the incomplete state appears only after an explicit provider response fails assigned-slot completeness.
- `user-visible states, actions, and outcomes`: the issue body owns complete, intentionally shrunk, SKIPPED, incomplete, malformed, cleared, and explicit-retry states with expected and received counts.
- `validation, warning, error, and recovery behavior`: the issue body owns missing, duplicate, unexpected, wrong-mode, and malformed slot handling plus clear and explicit retry recovery.
- `prompt preview contents and freshness`: N/A - response completeness changes no prompt content; the existing inspected fingerprint gate remains unchanged and is asserted as a regression.
- `user-initiated external LLM boundary`: the issue body keeps one current explicit send and makes any retry another explicit action; validation never sends automatically.
- `canon and prose boundary visibility`: incomplete and SKIPPED output remain labeled assistance scratch with no apply, insert, accept, or use-as-prose action.
- `persistence, migration, export, and provenance`: N/A - the result remains ephemeral scratch; no project schema, migration, backup, export, accepted provenance, or browser persistence changes.
- `browser and accessibility regression scenario`: Ideate component coverage asserts an announced incomplete warning, truthful counts, unavailable scratch actions, keyboard-reachable clear/retry recovery, and unchanged quarantine.

## Rejected Or No-Op Alternatives

- Treat requested Count as the response contract: rejected because deterministic assignment may intentionally shrink the slate; the exact assigned slots are the truthful expected set.
- Pad a missing slot or ask the compiler to invent another ground: rejected because slot selection is deterministic and unsupported ideas must not be fabricated.
- Automatically retry incomplete output or silently fall back to another provider: rejected because every external-model call must remain explicit, inspected, and user initiated.
- Keep returned cards while omitting any incompleteness state: rejected because that reproduces the observed trust defect.
- Bundle F013 into a new Ideate PRD or reopen completed Author Focus PRD #97: rejected as disproportionate; focus, prompt assignment, and fingerprint behavior are already complete and remain unchanged.
- Reopen F003 after #100: rejected because the completed unverified-no-change state directly satisfies the source's safe deterministic mitigation without pretending model recall is validated.
- Expand Record Hygiene to ENTITY or CAST MEMBER payloads for F008: rejected because the bounded source profile is intentional and disclosed.
- Open product work for F012 or F014: rejected because F012 remains preference-only and F014 was resolved by the intended human candidate gate.

## PRD Publication Inputs

Recommended testing seam: existing POST /api/ideate route with instrumented transport over deterministic slot assignment, plus response-parser and Ideate component seams
/to-prd consultation: house style only; seam checkpoint still owed
Likely label: bug plus ready-for-agent; both labels exist, current evidence is deterministic, and live exact-term searches found no owner
Label downgrade conditions: use needs-triage if custody changes the chosen whole-response quarantine rule or cannot keep exact assigned-slot comparison inside the existing route and component seams
Browser-visible guidance checklist: applies with mapping needs - the ticket packet maps every canonical item

## Completion Self-Check

Prep validator: passed
Manual semantic review: completed
Privacy and stale-language scan: clear

Every F001-F027 row has one disposition, all twelve strengths constrain scope, all prior recommendations are accounted for, and the sole live product change has one governed ticket destination. No new PRD is warranted.

## Freshness And Boundaries

The source report is tracked, clean, publication-ref-visible, and byte-identical to origin/main at the recorded blob. HEAD and origin/main both resolve to 7e8a545860c0d70f25be429d0a02b37d44be8bbc. Relevant drift since the report launch consumed F022 and the prior prep portfolio through closed #91-#108; packages/server/src/ideation-parse.ts itself is unchanged from the report launch commit, so the F013 response-completeness gap remains current.

Live tracker review found exact closed owners for the completed work: #91-#93 for compact reconciliation, #94-#96 for generation-context coherence, #97-#99 for Author focus, and #100-#108 for the current report's reconciliation warning and authoring UX follow-ups. No open issue or exact-title match owns Ideate assigned-slot response completeness.

Focused evidence completed during prep:

- The canonical source validator passed, and the candidate source inspector accepted 27 cumulative rows, 12 strengths, and five prioritized IDs.
- The predecessor report now passes the current validator with the explicit historical schema-v1 counterfactual compatibility warning.
- After the required core workspace build, eleven focused files passed 133 tests across reconciliation, Generation Brief, navigation, Records, Prompt Inspector, Story Configuration, Private Note identity, Ideate parsing/routes/UI, and ideation rendering. The first focused attempt passed 37 tests but six suites could not resolve the unbuilt core package; the build and exact rerun resolved that harness prerequisite.
- A read-only four-block ideation parser probe returned ok with four ideas and no assigned-slot completeness field, confirming F013 at the current code seam.
- Root lint, root typecheck, the full test suite, and the production build were skipped because this is a report-only prep artifact.

Intentional change: reports/playtest-the-unbidden-oath-2026-07-18T145754Z-prd-prep.md is the only authored artifact.

Final branch: detached HEAD
Final worktree rows: 3

### Final Worktree Ledger

| Path | Classification |
| ---- | -------------- |
| .claude/skills/playtest-prd-prep/SKILL.md | pre-existing |
| .claude/skills/playtest-prd-prep/references/prep-format.md | pre-existing |
| reports/playtest-the-unbidden-oath-2026-07-18T145754Z-prd-prep.md | intentional prep artifact |

No implementation, source-report edit, tracker mutation, ticket/spec/PRD publication, label change, commit, push, or /to-prd seam checkpoint occurred.
