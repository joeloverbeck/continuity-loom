# Playtest PRD Prep: The Unbidden Oath

## Header And Freshness

Source report path: reports/playtest-the-unbidden-oath-2026-07-17T104952Z.md
Source validation: nonblocking defects - the source inspector safely inventoried all 21 rows, while the report validator found one missing Targeted Counterfactual disclosure for the declared reconciliation probe
Source durability: durable - tracked, clean, visible on origin/main, and content-identical at blob eaaec0d18e732cd6aa005f7e63ca2b3145a36cb4
Authored artifact durability: new/untracked - this prep file is not yet committed or visible on origin/main
Live checkout: main at a1508fe10c86751fb6e77d662ee2c9f519bda921; launch HEAD was 6645191ee73f41787757953232831cf692d0ac80; no relevant committed or worktree drift exists under packages, docs, tickets, or specs; intake dirt was the untracked playtest-prd-prep skill bridge and source tree, and concurrent unowned writing-great-skills edits appeared later
Tracker freshness: live GitHub reads on 2026-07-17 found no open work or exact finding-term owner; closed issues #84, #88, #89, and #90 were inspected and do not own this portfolio
Existing same-stem prep classification: missing at intake
Prior-report traversal: not applicable - run mode is new_story and prior_report is null
Deliverable status: PRD-ready determination only; prep artifact write only
External research: skipped - repo-local prep

## Reassessment Verdict

First operational action: run /to-prd for Bounded Segment Reconciliation Schema Catalog, reuse the existing compiler and route seams, and satisfy the still-owed seam checkpoint before publication
Recommended first new PRD: Bounded Segment Reconciliation Schema Catalog
Publication package: first PRD plus deferred follow-ons

The deterministic prompt-size defect is ready for a first PRD without relying on model-quality claims. Accepted-segment generation-context coherence is a separate, riskier rule and remains a deferred PRD candidate. Narrow UI defects stay ticket-sized, while one-run assistance and note-identity observations stay at coverage until their in-app paths are proven.

## Source Inventory

Source prioritized findings: 12
Source cumulative ledger rows: 21
Source strength rows: 7
Disposition rows: 21
Strength constraint rows: 7

The inventory frontier is the source report's Cumulative Finding Ledger. No unrelated playtest report was scanned.

## Evidence Disposition Ledger

| Report item | Report summary | Disposition | Current evidence | Change/PRD impact |
| ----------- | -------------- | ----------- | ---------------- | ----------------- |
| F001 | Voice-pressure editing required a raw cast UUID | ticket-candidate | The current Generation Brief renders the cast reference as a free-text input, while the saved draft schema requires a record UUID; the retained run produced the corresponding visible 400 | Voice Pressure Cast Picker ticket; keep the UUID as storage identity but expose selected CAST MEMBER labels |
| F002 | Reconciliation prompt was disproportionate to one short segment | fresh-prd-scope | The report measured 170,969 characters and 42,743 estimated tokens. A current minimal read-only compile measured 144,269 characters, of which the rendered schema-catalog section was 136,328; the catalog currently carries both JSON Schema and a second field-descriptor tree | First PRD candidate: Bounded Segment Reconciliation Schema Catalog |
| F003 | Byte-identical reconciliation prompts produced a no-op and ten useful deltas | coverage-follow-up | The two responses were cold external evaluations, not the configured provider/parser/result-card path. Current UI accepts structurally valid empty proposal arrays without a reliability warning, but a true no-change result is also legal | Verify the real send, parser, and empty-result presentation before adopting a product rule; do not bundle model variability into F002 |
| F004 | One private-note journey created a blank duplicate | coverage-follow-up | One journey observed the duplicate. Current autosave, blur save, and retry paths share an in-flight guard, but creation identity becomes stateful only after the create response; existing tests do not cover that staged title-to-body race | Add a deterministic single-create identity regression and promote to a bug ticket only if it fails |
| F005 | Primary navigation was clipped at 1440x900 | ticket-candidate | Durable screenshot evidence shows the last routes absent after Page End. The current sidebar has viewport height plus padding and scrolling without sidebar border-box sizing | Desktop Navigation Reachability ticket with a 1440x900 keyboard and accessibility regression |
| F006 | Generation context remained first_segment after acceptance | fresh-prd-scope | Current defaults use accepted-segment count only when no value is persisted; snapshot tests explicitly preserve persisted first_segment with three accepted segments. The continuation matrix requires a different handoff contract | Deferred PRD candidate: Accepted-Segment Generation Context Coherence |
| F007 | CAST MEMBER creation exposed an empty required ENTITY selector | ticket-candidate | The create rail enables CAST MEMBER for every project state, while its entity reference options come from existing ENTITY records and no prerequisite explanation is rendered | Cast Creation Prerequisite Guidance ticket |
| F008 | Hygiene excluded selected ENTITY and CAST MEMBER payloads | covered | The active prompt contract and user guide intentionally exclude those payloads, and the current UI explicitly discloses both exclusions and the hygiene-active count before send | Preserve the bounded source profile; reject payload expansion |
| F009 | Prompt search seemed count-only | ticket-candidate | Current source and focused tests prove that every match is already marked, contradicting the no-highlight portion of the report. There is still no current-match state, next/previous control, or scroll-to-match behavior | Narrow ticket to Prompt Search Match Navigation; preserve existing all-match highlighting |
| F010 | Saved and no-saved Story Configuration messages coexisted | ticket-candidate | Current component state can remain missing after a successful local save while an independent saved flag renders success, deterministically allowing both messages | Story Configuration Save-State Consistency ticket |
| F011 | CAST MEMBER rows and raw JSON hindered routine scanning | ticket-candidate | The current browser uses projected list columns but leads CAST MEMBER detail with generic metadata and raw payload JSON; issue #84 explicitly left browse/editor presentation out of scope | Cast Record Scanability enhancement ticket, separate from closed prompt-label work |
| F012 | Runtime status rail used unexplained component terms | no-op/rejected | One first-view preference observation found no blocked action, incorrect state, or authority conflict; the project-first entry path remained clear | No product work without repeated usability evidence |
| F013 | Ideate returned four ideas for five assigned slots | coverage-follow-up | The cold response did not traverse the configured provider route. The current parser validates each present block but receives no expected slot set or count, so partial output is accepted; focused parser tests pass their existing contract | Add expected-slot completeness fixtures and decide partial-slate handling from in-app evidence before product scope |
| F014 | Prose asserted an unearned translation phenomenon | no-op/rejected | The author removed the two sentences before acceptance; the visible candidate edit and acceptance gate prevented the defect from entering accepted prose | Resolved in the intended human review path; preserve that gate |
| F015 | Create/Open onboarding and project-first model were clear | preserve-strength | Current project entry behavior and the run both make project selection precede project-scoped tools | Global preservation constraint |
| F016 | Path, title, compatibility, and backup reinforced custody | preserve-strength | Current project confirmation and backup surfaces expose local ownership and recoverability without a cloud-account model | Global preservation constraint |
| F017 | Field help explained stable authority and prompt destination | preserve-strength | Current field-help affordances distinguish durable configuration from generation-local pressure | Preserve across voice-picker and generation-context changes |
| F018 | CAST MEMBER guidance separated durable profile from current pressure | preserve-strength | Current dossier guidance and Generation Brief descriptions maintain the durable-versus-local boundary | Preserve across CAST MEMBER tickets |
| F019 | Private Notes explained inert and private consequences up front | preserve-strength | Current note and assistance boundaries exclude private notes from prompts and canon | Preserve across note verification and reconciliation work |
| F020 | Readiness blockers named canonical fixes and cleared deterministically | preserve-strength | The run cleared each blocker through visible canonical editors, and focused readiness/component coverage remains green | Preserve for any generation-context diagnostic and fix path |
| F021 | All 22 authored brief fields were visibly present and influential | preserve-strength | The report audited all authored fields; current compiler and field-help authorities require complete declared source rather than budget eviction | Preserve complete brief-field coverage in prompt-size work and validation changes |

## Strength Preservation Ledger

| Strength ID | Applies to | Preservation constraint | Regression evidence |
| ----------- | ---------- | ----------------------- | ------------------- |
| F015 | global | Keep Create/Open and project-first availability legible before project-scoped routes become active | Existing Project Picker and App Shell component behavior plus a project-open browser walkthrough |
| F016 | global | Keep local path, title, compatibility, backup, and ownership visible; do not add account or cloud custody implications | Existing project creation/open/backup route tests and user-guide conformance review |
| F017 | Accepted-Segment Generation Context Coherence, Voice Pressure Cast Picker | Keep field help explicit about durable authority, local pressure, defaults, and prompt destination at the point of editing | Generation Brief component assertions for help text, selected labels, resolved context, and saved value |
| F018 | Voice Pressure Cast Picker, Cast Creation Prerequisite Guidance, Cast Record Scanability | Preserve the distinction between durable CAST MEMBER dossier data and generation-local voice pressure | CAST MEMBER editor and Generation Brief component tests plus a focused browser review |
| F019 | Bounded Segment Reconciliation Schema Catalog, Private Note Single-Identity Verification | Private Notes remain inert, private, and excluded from all prompt source and canon paths | Note-boundary tests and reconciliation golden assertions that no note source enters the prompt |
| F020 | Accepted-Segment Generation Context Coherence, Story Configuration Save-State Consistency | Diagnostics remain author-language-first, point to the canonical editor, and clear deterministically after the canonical fix | Existing readiness route/component tests extended through the mismatch and recovery transition |
| F021 | Bounded Segment Reconciliation Schema Catalog, Accepted-Segment Generation Context Coherence, Voice Pressure Cast Picker | Preserve every authored Generation Brief field and its declared influence; size work must not omit or summarize source | Compiler golden field inventory, route metadata, and prompt-inspector readback of complete declared fields |

## Authority And Change-Surface Map

| Candidate or follow-up | Governing authority | Code/test impact | Doc/skill impact | Required artifact type |
| ---------------------- | ------------------- | ---------------- | ---------------- | ---------------------- |
| Bounded Segment Reconciliation Schema Catalog | docs/principles/FOUNDATIONS.md prompt completeness and assistance boundaries; docs/specs/compiler-contract.md Segment Reconciliation source and change-control rules; docs/specs/segment-reconciliation-prompt-template.md; docs/specs/story-record-schema.md | Core reconciliation compile-result and catalog contract, server compile/analyze route metadata and freshness, prompt-inspector readback, golden and schema-completeness tests | New active spec; coordinated compiler contract, reconciliation template, schema, version, golden, and robustness-testing updates; no playtest skill change | PRD plus spec and active-doc updates |
| Accepted-Segment Generation Context Coherence | docs/principles/FOUNDATIONS.md accepted-segment and manual-update boundaries; docs/specs/compiler-contract.md validation matrix; docs/specs/story-record-schema.md; docs/user-guide.md | Accepted-segment route, generation draft/default API, snapshot/readiness/compile boundary, Generation Brief UI, deletion and recovery tests | New active spec plus coordinated validation, schema, and user-guide updates | Deferred PRD plus spec and active-doc updates |
| Voice Pressure Cast Picker | docs/specs/story-record-schema.md Generation Brief reference shape and docs/user-guide.md field behavior | Generation Brief reference-selection UI, draft route, and component coverage | No authority change; user guide only if visible instructions materially change | Ticket |
| Reconciliation No-op Reliability Verification | docs/specs/segment-reconciliation-prompt-template.md strict output and docs/user-guide.md advisory-scratch boundary | Provider-route/parser fixtures and result-card empty-state coverage; optional later guarded browser replay | No doc change until a deterministic rule is selected | Coverage |
| Private Note Single-Identity Verification | docs/principles/FOUNDATIONS.md private-note boundary and docs/user-guide.md note lifecycle | Note editor autosave, blur, retry, and one-create identity regression | No doc change unless current persistence behavior proves incorrect | Coverage |
| Desktop Navigation Reachability | docs/user-guide.md primary-route availability and browser-visible guidance checklist | App shell layout plus 1440x900 keyboard, focus, and scroll regression | User guide only if navigation structure changes | Ticket |
| Cast Creation Prerequisite Guidance | docs/specs/story-record-schema.md CAST MEMBER entity reference requirement and browser-visible guidance checklist | Record create availability, empty prerequisite state, direct recovery action, component/browser coverage | User guide update for the visible prerequisite path | Ticket |
| Prompt Search Match Navigation | docs/user-guide.md prompt inspection and browser-visible guidance checklist | Existing prompt inspector search state, accessible current-match navigation, scroll/focus component coverage | User guide update for next/previous behavior | Ticket |
| Story Configuration Save-State Consistency | docs/specs/story-record-schema.md story configuration ownership and browser-visible guidance checklist | Story Configuration load/save state transition and component coverage | No authority change | Ticket |
| Cast Record Scanability | docs/specs/story-record-schema.md CAST MEMBER display semantics and browser-visible guidance checklist | Record list/detail projections, progressive disclosure of raw payload, component/browser coverage | User guide update if detail presentation changes | Ticket |
| Ideate Slot Completeness Verification | docs/specs/ideation-prompt-template.md slot/output contract and docs/specs/compiler-contract.md Ideate source profile | Ideate parser and route fixtures for expected slots, missing blocks, SKIPPED blocks, and partial output | No doc change until partial-slate policy is selected | Coverage |
| Playtest Counterfactual Disclosure Contract | playtest report validator and report-format methodology | Validator/fixture alignment only; no product code or product test change | Repair through $skill-audit so declared counterfactual probes and required disclosure headings cannot disagree | Skill-audit |

## Recommended PRD Package

### PRD Candidate: Bounded Segment Reconciliation Schema Catalog

Candidate role: first
Purpose: let an author inspect and intentionally send a materially smaller Segment Reconciliation prompt without losing any accepted-segment evidence, brief state, record data, creation schema, lifecycle rule, reference rule, or advisory boundary
Sources: F002
Problem: a minimal current reconciliation compile is 144,269 characters before meaningful project records are added, and 136,328 characters come from the rendered creation-schema catalog. The catalog serializes overlapping JSON Schema and field-descriptor representations for every record type, so a short bounded review inherits a large fixed cost that raises delay, cost, and model compatibility risk.
Product rule or seam: the existing Segment Reconciliation compile-result seam emits one deterministic, compact, human-inspectable schema-catalog representation that completely describes every registered record type, nested field, requiredness rule, enum, reference role and target, lifecycle destination, and repository-managed or forbidden field. Prompt budgets may remove representational duplication and formatting bloat, but may not filter, summarize, rank, truncate, or evict declared source.
Affected surfaces: core reconciliation compiler and catalog tests; server compile/analyze route and prompt-fingerprint freshness tests; existing prompt inspector readback; a new active spec; docs/specs/compiler-contract.md, docs/specs/segment-reconciliation-prompt-template.md, docs/specs/story-record-schema.md, relevant version and golden fixtures, and docs/specs/robustness-testing.md assurance mapping. No provider implementation, storage schema, playtest skill, or new test seam is required.
Scope: replace the dual schema encodings with one canonical compact representation; reduce avoidable whitespace; preserve all record types and all semantic constraints; keep deterministic ordering, escaping, fingerprinting, complete accepted-segment and record sources, explicit missing/blank brief states, strict output validation, and visible oversize failure; expose truthful updated length and token estimates.
Acceptance: for the checked current-registry zero-record fixture, reduce the 136,328-character rendered schema-catalog section by at least 50 percent and lock the resulting ceiling in a named regression; prove semantic coverage of every registry type, field path, requiredness/enum, reference cardinality/role/target, lifecycle value/destination, and forbidden/repository-managed field; prove identical inputs yield identical bytes and fingerprints; prove the latest accepted segment, all nineteen reconciliation brief fields, every in-scope complete record, and every required stub remain byte-visible without truncation or summarization; prove compile and analyze use the same fresh fingerprint and still fail closed when source changes or cannot fit; update the visible metadata and active authorities in the same revision.
Preserved strengths: F019, F021
Testing seam: reuse the existing server Segment Reconciliation compile/analyze route as the highest behavior seam, backed by the existing core compiler golden and catalog-completeness seam; add no new public interface and make no external model call
Out of scope: source filtering by selected or guessed delta type; accepted-segment excerpting or summaries; record ranking or eviction; changing the nineteen allowed brief fields; model selection, automatic retry, response-quality claims, or F003 remediation; provider transport; proposal application; accepted-prose authority; record storage/schema migration; prompt compatibility aliases that preserve both old and new catalog encodings

### PRD Candidate: Accepted-Segment Generation Context Coherence

Candidate role: deferred
Purpose: prevent an author from unknowingly validating or generating a continuation under the first-segment rule set after accepted prose exists
Sources: F006
Problem: accepted-segment count supplies a context default only while no context is persisted. A previously saved first_segment value therefore survives acceptance and bypasses continuation-specific handoff validation until the author notices and changes it manually.
Product rule or seam: at the existing snapshot/readiness boundary, accepted-segment archive state and generation context must be coherent. The recommended rule is to retain structurally saveable draft state but block preview and generation when a persisted context contradicts the archive, explain the mismatch in author language, and offer the canonical context fix; no prose or record content is inferred or rewritten.
Affected surfaces: accepted-segment creation and final-segment deletion transitions; Generation Brief defaults and visible resolved source; snapshot normalization, readiness diagnostics, compile/generate gates, API and component/browser coverage; a new active spec plus docs/principles/FOUNDATIONS.md conformance review, docs/specs/compiler-contract.md, docs/specs/story-record-schema.md, and docs/user-guide.md updates.
Scope: define zero-segment and one-or-more-segment coherence; show the resolved archive fact and persisted value; block stale mismatches only at preview/generate boundaries; provide a canonical user-controlled fix; clear the diagnostic deterministically; cover deleting the final accepted segment; preserve ordinary incomplete-draft saving.
Acceptance: after accepting the first segment, a persisted first_segment draft cannot pass preview or generation and the author sees a direct continuation-context fix; applying it yields continuation_after_accepted_segment and activates the existing handoff rules; deleting the final accepted segment produces the symmetric first-segment requirement; no accepted prose enters a future prompt, no record or story field is derived from prose, incomplete drafts still save, and route/readiness/component tests cover mismatch, fix, reload, and deletion recovery.
Preserved strengths: F017, F020, F021
Testing seam: reuse the accepted-segment API through the existing snapshot/readiness/compile route seam, with Generation Brief component coverage for the visible diagnosis and fix; the exact seam remains subject to /to-prd confirmation
Out of scope: changing Segment Reconciliation; extracting canon from accepted prose; auto-populating handoff text; automatically updating story records; changing accepted-segment text, provenance, export, or sequence; provider transport; bundling this lifecycle decision into the schema-catalog PRD

## Non-PRD Follow-Up

| Item | Destination | Trigger or next action | Evidence required |
| ---- | ----------- | ---------------------- | ----------------- |
| F001 - Voice Pressure Cast Picker | ticket | Specify a selected CAST MEMBER control that displays the full label and stores the existing UUID, including empty and stale-reference states | Component and draft-route tests plus one visible save without raw-ID entry or 400 response |
| F003 - Reconciliation No-op Reliability Verification | coverage | Exercise valid all-empty and populated responses through parser, route, and result cards; use a future guarded provider replay only if deterministic fixtures cannot resolve presentation behavior | Parser/route/UI readback showing valid no-change, malformed, and materially incomplete handling without hidden retry |
| F004 - Private Note Single-Identity Verification | coverage | Add a title-first autosave followed by body/tag edit, blur, and manual retry regression; file a bug ticket only if more than one create identity is observed | Request-count and returned-note-ID assertions proving exactly one create followed by updates |
| F005 - Desktop Navigation Reachability | ticket | Keep every primary route reachable and visibly scrollable at 1440x900 and shorter supported heights | Browser screenshot plus keyboard focus/scroll assertions reaching Segment Reconciliation, Accepted Segments, Story Configuration, and Settings |
| F007 - Cast Creation Prerequisite Guidance | ticket | Disable or intercept CAST MEMBER creation when no ENTITY exists, explain the dependency, and provide a direct Create ENTITY recovery action | Empty-project component/browser test and successful return to CAST MEMBER creation after the prerequisite is saved |
| F009 - Prompt Search Match Navigation | ticket | Add current-match state and accessible next/previous navigation while retaining all existing mark highlights | Component tests for wrap, zero matches, repeated matches, focus/scroll, and accessible names |
| F010 - Story Configuration Save-State Consistency | ticket | Reconcile local loaded state after save so success and missing summaries cannot coexist | Component test covering first save, second save, and reload with one truthful status at each point |
| F011 - Cast Record Scanability | ticket | Make CAST MEMBER identity and role scannable in list/detail views and place raw JSON behind progressive disclosure | Component/browser comparison for two similarly named cast members while preserving exact raw payload access |
| F013 - Ideate Slot Completeness Verification | coverage | Add route/parser fixtures for the exact assigned slot set, missing blocks, duplicate slot numbers, and valid SKIPPED blocks, then select an explicit partial-output policy | Tests proving whether four-of-five is accepted with a visible partial warning or quarantined under the chosen contract |
| Source validator defect - Playtest Counterfactual Disclosure Contract | skill-audit | Audit the playtest report schema and validator so counterfactual_probes metadata and the required Targeted Counterfactual disclosure cannot diverge | $skill-audit finding and repaired validator/report fixtures; no source-report rewrite |

## Rejected Or No-Op Alternatives

- Filter the creation catalog to selected records or guessed delta targets: rejected because creation proposals require complete registered type coverage and the compiler contract forbids source ranking or eviction.
- Shorten, summarize, or excerpt the accepted segment or qualifying records: rejected because those complete sources are the constitutional reconciliation boundary.
- Bundle F002 and F006 into one PRD: rejected because prompt representation and accepted-state validation have different product rules, decision points, seams, and acceptance proof.
- Treat F003 as proof that a specific model, retry policy, or automatic retry is required: rejected because the run used two cold external evaluations and hidden retries would cross the user-initiated provider boundary.
- Expand Record Hygiene to ENTITY or CAST MEMBER payloads for F008: no-op because the active bounded profile and current disclosure intentionally exclude them.
- Rebuild prompt highlighting for F009: rejected because current source and tests already mark every match; only match navigation remains live.
- Remove or rewrite the runtime status rail for F012: rejected as a one-run preference without blocked behavior or repeated evidence.
- Open product work for F014: no-op because candidate editing and the human acceptance gate resolved the prose defect before persistence.
- Reopen closed prompt-label issues #84 and #88-#90: rejected because their completed full-label invariant remains intact and their explicit scope does not own prompt size, record-browser presentation, or the current findings.

## PRD Publication Inputs

Recommended testing seam: existing server Segment Reconciliation compile/analyze route over the current core compiler golden and catalog-completeness seams; no new public seam and no external model call
/to-prd consultation: house style only; seam checkpoint still owed
Likely label: bug plus needs-triage now; both labels exist, and ready-for-agent also exists for use only after /to-prd ratifies the package, the 50-percent catalog reduction rule, and the existing seam
Label downgrade conditions: retain needs-triage if the single-representation rule, measurable catalog ceiling, browser-visible mapping, or testing seam remains open to veto; the deferred generation-context PRD remains unselected and must not inherit first-PRD ratification
Browser-visible guidance checklist: applies with mapping needs - prompt preview contents, metadata freshness, one-time external send, accepted-prose/advisory boundaries, oversize recovery, and component accessibility must be homed in the PRD body

### Browser-Visible Guidance Mapping Inputs

| Canonical item | PRD-ready home |
| -------------- | -------------- |
| entry point and availability | Existing Segment Reconciliation availability after an accepted segment remains unchanged; Solution and User Stories should name compile, inspect, and optional analyze entry points |
| user-visible states, actions, and outcomes | Solution and User Stories should specify a smaller complete prompt, truthful length/token metadata, unchanged local inspection, and unchanged explicit send action |
| validation, warning, error, and recovery behavior | Implementation Decisions should retain fail-closed catalog generation, source-change rejection, visible oversize failure, recompile recovery, and no silent omission |
| prompt preview contents and freshness | Implementation and Testing Decisions should map one complete compact catalog, exact preview/send bytes, fingerprint identity, and stale-source protection |
| user-initiated external LLM boundary | Solution and Principles should preserve local compile/inspect as no-send and the existing confirmed Analyze action as the sole provider boundary |
| canon and prose boundary visibility | Principles and User Stories should preserve exactly one latest accepted segment as bounded evidence and all returned proposals as non-canonical scratch |
| persistence, migration, export, and provenance | N/A - the first PRD changes deterministic prompt representation only; no prompt, proposal, record, accepted segment, migration, or export persistence changes |
| browser and accessibility regression scenario | Testing Decisions should reuse route and Prompt Inspector component coverage for visible metadata and accessible inspection; no new interaction or browser framework is needed |

## Completion Self-Check

Prep validator: passed
Manual semantic review: completed
Privacy and stale-language scan: clear

Every F001-F021 row has one disposition, every source strength has one preservation constraint, and every live product change has a governed destination. The first PRD is based on current deterministic evidence rather than assistance quality, and deferred or uncertain observations remain explicitly outside its scope.

## Freshness And Boundaries

The source report passed the ordered durability gate: its path is tracked, clean, present on origin/main, and its working-tree blob matches the publication-ref blob. HEAD and origin/main both resolve to a1508fe10c86751fb6e77d662ee2c9f519bda921. Comparing the report launch HEAD with the live checkout over packages, docs, tickets, and specs produced no changed path, and the current worktree has no relevant product drift.

Live tracker review found no open owner. Closed PRD #84 and implementation issues #88-#90 concern complete prompt-facing labels; #84 explicitly excludes browse-label presentation and preserves existing oversize behavior. Exact searches for the report's UUID-entry, prompt-size, duplicate-note, navigation, generation-context, prerequisite, prompt-search, and save-status terms returned no issue owner.

Focused evidence completed during prep:

- Ten focused component/server/core files passed 96 tests covering prompt preview, Generation Brief, Story Configuration, notes, App Shell, Records, reconciliation compilation/routes, and snapshot defaults.
- An additional focused run passed 3 tests across the Ideate parser and Prompt Inspector; its prerequisite core TypeScript build also passed.
- A read-only minimal reconciliation probe measured 144,269 prompt characters and 36,068 estimated tokens, with 136,328 characters in the rendered schema-catalog section.
- Current source and durable report evidence were sufficient; no new browser journey, story mutation, acceptance, provider call, or external research was performed.
- Root lint, root typecheck, the full test suite, and the root production build were skipped because this is a report-only prep artifact.

Intentional change: reports/playtest-the-unbidden-oath-2026-07-17T104952Z-prd-prep.md is the only file authored by this run.

Remaining unowned dirt at close is classified, not adopted: .agents/skills/playtest-prd-prep is a pre-existing untracked bridge; .claude/skills/playtest-prd-prep/ is its pre-existing untracked source tree; .claude/skills/writing-great-skills/GLOSSARY.md and .claude/skills/writing-great-skills/SKILL.md are concurrent modified files that appeared after intake. No implementation, source-report edit, tracker mutation, ticket/spec/PRD publication, label change, or /to-prd seam checkpoint occurred.
