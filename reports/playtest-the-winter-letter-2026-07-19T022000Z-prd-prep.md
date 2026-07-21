# Playtest PRD Prep: The Winter Letter

## Header And Freshness

Source report path: reports/playtest-the-winter-letter-2026-07-19T022000Z.md
Source validation: passed
Source inspection: 6 prioritized findings, 14 cumulative rows, and 6 strengths with no errors or warnings
Source durability: summarized, not cited - untracked, present in the worktree, absent from origin/main, and content identity is N/A because no publication-ref blob exists
Authored artifact durability: new/untracked - absent at intake and not visible on origin/main
Live checkout: main at ca861e8301e5d98d6fced5bdd93de4d710f206bd, identical to the report launch HEAD and origin/main; 26 baseline worktree rows were pre-existing, one later skill-doc row is concurrent/unowned, and no product or active-doc path differed from HEAD
Tracker freshness: GitHub read on 2026-07-19; no open issues; exact likely-owner bodies read for closed #100, #103, #105, #106, #86, and #83, with current HEAD containing the #100-#108 implementation commit
Existing same-stem prep classification: missing at intake
Prior-report prep path: not applicable
Prior-report prep classification: not applicable
Prior-report traversal: not applicable - new-story source declares no prior report
Deliverable status: PRD-ready determination only; prep artifact write only
External research: skipped - repo-local prep

## Reassessment Verdict

First operational action: run the F003 offstage CAST MEMBER coverage comparison before adopting or rejecting any role-gated dossier-completeness rule
No-new-PRD verdict: current evidence supports four narrow browser-visible tickets, one bounded coverage follow-up, one completed-work disposition, two resolved harness no-ops, and six preservation constraints; no broad product rule is ready for PRD publication
Publication package: no new PRD

The source's highest-severity unresolved product observation is F003, but its independent challenge explicitly limits the evidence to one story. Live inspection confirms 23 unconditionally required non-list CAST MEMBER values and three required list fields, while also correcting the source's claim that those lists require entries: the current schema accepts all three as empty. The offstage compiler slice uses only the dossier's one-line identity and core voice. That mismatch merits a controlled comparison, not an immediate storage-schema or readiness redesign.

F006 does not justify a reopen. The current parser rejects a literal or stale fingerprint as a source mismatch, and the result UI labels a structurally valid all-empty response as an unverified no-change result with manual comparison and explicit, user-initiated retry guidance. Closed issue #100 owns that behavior and its implementation is an ancestor of the tested HEAD.

## Source Inventory

Source prioritized findings: 6
Source cumulative ledger rows: 14
Source strength rows: 6
Disposition rows: 14
Strength constraint rows: 6

Run mode is `new_story`; the source declares no prior report. The launch commit, current commit, and publication ref are identical, so there is no relevant committed drift. Current worktree drift is confined to pre-existing report and skill/process surfaces; product code and active authorities match the tested commit.

## Evidence Disposition Ledger

| Report item | Report summary | Disposition | Current evidence | Change/PRD impact |
| ----------- | -------------- | ----------- | ---------------- | ----------------- |
| F007 | First browser connection needed a narrow permission retry. | no-op/rejected | The retry occurred before product action and the unchanged journey then completed; no product path, stored state, or author recovery behavior failed. | Resolved harness-only event; no issue or PRD. |
| F001 | Local project path semantics are underexplained. | ticket-candidate | The current Project Picker presents `Parent path` and `Folder name` as bare required labels with no example or local-folder explanation; server-side missing-path and permission errors are already actionable. Tracker title/body searches found no owner. | Local Project Path Guidance ticket; preserve the direct Create/Open fork and exact custody readback. |
| F008 | Project creation gives exact local custody and compatibility readback. | preserve-strength | The source observed the opened project state, compatibility, store version, and exact local custody together; current Project Picker and project-route seams preserve this readback. | Constrains F001; guidance must not obscure or replace local ownership evidence. |
| F002 | Story Configuration leads with schema keys. | ticket-candidate | Story Configuration descriptors expose keys such as `genre_mode`, `setting_baseline`, and `character_bias_handling`, and the shared field shell renders the descriptor name as the primary visible and accessible label. No tracker owner exists. | Author-Facing Story Configuration Labels ticket; schema keys remain stable secondary metadata. |
| F003 | Full CAST MEMBER core dominated first-segment setup, including an offstage-only character. | coverage-follow-up | Live schema inspection finds 26 unconditional required leaves: 23 non-list values and 3 list fields. Empty arrays satisfy those list fields, correcting the source's nonempty-list interpretation. The offstage render slice consumes one-line identity and core voice, while authorities reserve full richness for materially active/onstage cast. One run does not establish whether up-front cost is disproportionate or repaid later. | Offstage CAST MEMBER Cost Verification; a role-gated schema/readiness PRD may be considered only if the comparison confirms a stable author need. |
| F009 | Private Notes remain visibly inert and outside prompts and assistance. | preserve-strength | Source disclosure and the accepted journey excluded the pinned note; FOUNDATIONS and isolation tests enforce the same boundary. | Global constraint; no follow-up may read, promote, stage, or compile notes. |
| F004 | Working Set CAST MEMBER rows hide linked character names. | ticket-candidate | The record API now exposes linked-ENTITY browse identity from closed #106, but Active Working Set still renders `displayLabel` in the row, control accessible names, and What Will Compile list. #106's body covered Records browsing, not this consumer. | Working Set Cast Identity ticket; reuse existing browse identity without changing stored IDs, payloads, prompt bytes, or compiler ordering. |
| F010 | Readiness distinguishes blockers from warnings and routes fixes. | preserve-strength | Current readiness and Generate component seams preserve prompt blockers, provider-only blockers, warning behavior, and direct fix actions; focused tests passed. | Constrains F003 and F005; neither may weaken fail-closed readiness or hide provider/manual-path distinctions. |
| F011 | The first browser holder exited before the journey ended. | no-op/rejected | A bounded fresh holder reopened the unchanged project and no work was lost; the event produced no product-state contradiction. | Resolved harness-only event; no issue or PRD. |
| F012 | Prompt search exposes field placement and supported strong bounded prose. | preserve-strength | The source traced all writer-facing fields, and current Prompt Inspector, compile metadata, and freshness seams remain present at the tested HEAD. | Global prompt-adjacent constraint, especially for F005; no prompt content, fingerprint, or inspection regression. |
| F005 | Manual candidate entry is outside the initial provider-blocked viewport. | ticket-candidate | The existing button is DOM-ordered after the full readiness checklist and before Prompt Inspector. Closed #86 proves availability and zero-provider behavior, but not first-viewport discovery beside the provider blocker; the source measured the control below the initial viewport at the declared desktop size. | Manual Candidate Escape-Hatch Visibility ticket; add near-blocker guidance or focus navigation to the existing action without duplicating the candidate lifecycle. |
| F013 | Acceptance preserves the prose-to-canon boundary and lifecycle coherence. | preserve-strength | The source observed one explicit acceptance, a manual durable-change reminder, and fail-closed lifecycle repair; current candidate, accepted-route, reminder, and context-coherence seams retain those boundaries. | Global constraint for F005 and reconciliation-related handling; no automatic record update, reminder acknowledgement, or accepted-prose prompt authority. |
| F006 | Two cold reconciliation draws diverged from provenance-invalid empty output to cited deltas. | covered | Current output parsing requires the exact inspected fingerprint and quarantines source mismatch. A valid all-empty result receives the explicit unverified/manual-compare/no-auto-retry state delivered by closed #100. Focused parser, route, and result-view tests passed. Provider transport and model-rate claims remain outside the source evidence. | Desired guard is complete; retain #100 as owner and do not create or reopen work from this pair. |
| F014 | Record Hygiene was sparse, type-aware, and safe across record types. | preserve-strength | The source adopted one bounded reword and kept two legitimate cross-type distinctions; current hygiene source, parser, route, and quarantine contracts preserve advisory-only handling. | Global constraint; unrelated follow-ups must not broaden hygiene scope or add automatic mutation. |

## Strength Preservation Ledger

| Strength ID | Applies to | Preservation constraint | Regression evidence |
| ----------- | ---------- | ----------------------- | ------------------- |
| F008 | Local Project Path Guidance | Keep Create/Open direct and retain exact open state, local path, compatibility, and store-version custody readback. | Project Picker component coverage, project create/open route coverage, and one unopened-to-open browser scenario. |
| F009 | global | Private Notes remain local inert scratch and never enter records, readiness, prompts, assistance, or OpenRouter requests. | FOUNDATIONS notes firewall plus server isolation and prompt-source tests. |
| F010 | Offstage CAST MEMBER Cost Verification, Manual Candidate Escape-Hatch Visibility | Keep blocker/warning/provider distinctions and actionable fixes; warnings never gate and missing provider configuration never disables a preview-ready manual path. | Readiness route and checklist coverage plus Generate component availability matrix. |
| F012 | global | Preserve deterministic prompt bytes, metadata, search, freshness, and temporary/non-canon inspection while changing adjacent UI. | Compiler goldens, Prompt Inspector component coverage, and prompt-fingerprint tests. |
| F013 | global | Candidate acceptance remains explicit; accepted prose and reconciliation output never mutate continuity automatically; lifecycle mismatch continues to fail closed. | Candidate component, accepted-route, reminder, and accepted-segment context-coherence tests. |
| F014 | global | Record Hygiene remains sparse, type-aware, source-disclosed, advisory-only, and mutation-free. | Hygiene compiler/parser/route tests and the source's keep-distinct review evidence. |

## Authority And Change-Surface Map

| Candidate or follow-up | Governing authority | Code/test impact | Doc/skill impact | Required artifact type |
| ---------------------- | ------------------- | ---------------- | ---------------- | ---------------------- |
| Local Project Path Guidance | `docs/principles/FOUNDATIONS.md` §§24 and 27; `docs/user-guide.md` Project Ownership | Project Picker author copy and accessible-description seam; existing create/open and error-recovery component/browser tests | Update user guidance only if the new explanation adds an operating instruction; no skill change | ticket |
| Author-Facing Story Configuration Labels | `docs/principles/FOUNDATIONS.md` §§6.3, 13, and 27; `docs/specs/story-record-schema.md` §§2-3 | Story Configuration descriptor and shared field-label presentation; component accessibility and unchanged-payload tests | No authority amendment; user-guide wording only if needed for exact labels; no skill change | ticket |
| Offstage CAST MEMBER Cost Verification | `docs/principles/FOUNDATIONS.md` §§13, 17, 27, and 29; `docs/specs/story-record-schema.md` §§5 and 5.5 | Read-only comparison across CAST MEMBER storage completeness, editor effort, offstage selection, readiness, and compressed compiler output | Record a new playtest report; no product/doc/skill mutation during verification | coverage |
| Working Set Cast Identity | `docs/principles/FOUNDATIONS.md` §§7, 17, and 27; `docs/specs/story-record-schema.md` §§3.1 and 5.5 | Existing record-list browse identity consumed by Active Working Set rows, accessible control names, and compile-family preview; component/browser regression | No authority or schema change; no skill change | ticket |
| Manual Candidate Escape-Hatch Visibility | `docs/principles/FOUNDATIONS.md` §§2, 3, 23, and 27; `docs/user-guide.md` Candidate Lifecycle | Generate readiness/checklist and manual-entry presentation; provider-ready/provider-blocked, keyboard, focus, zero-send, and first-viewport tests | Coordinate user-guide wording if the visible recovery instruction changes; no skill change | ticket |
| F006 completed reconciliation guard | `docs/principles/FOUNDATIONS.md` §§9.1, 21, 22, and 26.1; `docs/specs/segment-reconciliation-prompt-template.md`; `docs/specs/compiler-contract.md` | Existing strict parser, server route, all-empty result state, and result-view tests | No change owed; closed #100 remains the tracker owner | none - covered by closed work |

## Recommended PRD Package

No PRD candidate is included. The possible role-gated CAST MEMBER completeness direction is not a deferred publication candidate yet: F003's bounded coverage result is the gate that determines whether a broad schema/readiness rule exists at all. The remaining product changes are narrow, separable UI outcomes with existing component and browser seams.

Deferred PRD candidates: none

## Non-PRD Follow-Up

| Item | Destination | Trigger or next action | Evidence required |
| ---- | ----------- | ---------------------- | ----------------- |
| F003 - Offstage CAST MEMBER Cost Verification | coverage via a new source-and-doc-blind `$playtest` run | Compare a first-segment story with one pressure-only offstage person using the lightest lawful ENTITY/CAST MEMBER path; record author actions, readiness needs, fields actually rendered, promotion cost, and whether later active use repays the setup | One new canonical report with visible field/action counts, deterministic prompt disclosure, an alternate lawful authoring path, and an explicit promote-to-PRD or no-create conclusion |
| F001 - Local Project Path Guidance | ticket | Add a concise local-folder explanation and absolute-parent example at the Create entry point; retain current validation errors and keep a native folder chooser out of this slice | Component and unopened browser proof for accessible guidance, valid/invalid path recovery, unchanged Create/Open behavior, and zero project write before submit |
| F002 - Author-Facing Story Configuration Labels | ticket | Lead Story Configuration fields with stable plain-language author labels while retaining exact schema keys as secondary metadata and unchanged payload keys | Component proof for visible/accessibility labels and secondary keys, byte-equivalent request payloads, help lookup continuity, and keyboard scanning across all three panels |
| F004 - Working Set Cast Identity | ticket | Reuse linked-ENTITY browse identity for CAST MEMBER row identity, control names, and visible compile-family summaries while keeping dossier summary secondary | Component and browser proof with multiple cast members, missing/archived linked-ENTITY fallbacks, unchanged stored IDs and working-set payload, and unchanged compiled prompt/fingerprint |
| F005 - Manual Candidate Escape-Hatch Visibility | ticket | Put a visible manual-entry recovery note or focusable route beside the provider-only blocker and target the existing `Write or paste candidate` action | Generate component and declared desktop browser proof for first-viewport discovery, provider-blocked availability, readiness blocking, keyboard focus, zero OpenRouter requests, and unchanged candidate custody |

## Rejected Or No-Op Alternatives

- F007 and F011 are resolved harness events; turning either into product recovery scope would misattribute non-product failures.
- Reopening F006 or creating a second reconciliation guard is duplicate work. Closed #100 plus current strict provenance parsing already covers both valid-empty and provenance-invalid outcomes.
- Immediate CAST MEMBER schema relaxation is rejected from this portfolio. The report proves substantial work in one run, but not cross-story disproportionality; it also overstates the three list fields as nonempty requirements.
- A native folder chooser is rejected from F001's first slice because it introduces a separate platform/file-access decision; concise path guidance is independently testable.
- Relabeling every generic record editor is rejected from F002. The supported observation is Story Configuration's schema-first hierarchy only.
- Changing prompt-facing CAST MEMBER labels or compiler ordering is rejected from F004. Existing linked browse identity is a presentation seam and must not become prompt authority.
- A second candidate editor, duplicate acceptance path, readiness bypass, or automatic scroll/send behavior is rejected from F005.

## PRD Publication Inputs

Recommended testing seam: N/A - no PRD candidate; the highest existing ticket and coverage seams are named in Non-PRD Follow-Up
/to-prd consultation: house style only; seam checkpoint still owed
Likely label: N/A for PRD publication; the four browser-visible ticket candidates have a verified `enhancement` type-label precedent, with triage posture determined by `$playtest-to-issues` after exact checklist mapping
Label downgrade conditions: use `needs-triage` for any ticket that retains an open behavioral choice or leaves an applicable browser-visible checklist item without a concrete home; F003 remains coverage rather than AFK-ready product work
Browser-visible guidance checklist: applies to F001, F002, F004, and F005; each issue needs explicit mapping for entry/availability, visible states/actions, recovery, prompt freshness where applicable, external-LLM boundary, canon/prose boundary, persistence/provenance, and browser/accessibility regression; F003 coverage and the covered F006 disposition do not publish browser behavior

Focused verification passed 8 test files and 89 tests across Project Picker, Story Configuration, CAST MEMBER editor, Active Working Set, Generate/Candidate, Segment Reconciliation parser/server/result UI. Root lint, typecheck, full test, build, and a new browser journey were skipped because this invocation writes only a report artifact and current code evidence resolved every classification without a contradictory drift reproduction.

## Completion Self-Check

Prep validator: passed
Manual semantic review: completed
Privacy and stale-language scan: clear

## Freshness And Boundaries

Final branch: main
Final worktree rows: 28

### Final Worktree Ledger

| Path | Classification |
| ---- | -------------- |
| `.agents/skills/implement` | pre-existing |
| `.claude/skills/code-review/SKILL.md` | pre-existing |
| `.claude/skills/code-review/fallback-evidence.md` | pre-existing |
| `.claude/skills/code-review/scripts/validate-review-fallback-body.test.mjs` | pre-existing |
| `.claude/skills/code-review/scripts/validate-review-normal-body.test.mjs` | pre-existing |
| `.claude/skills/grilling/references/recap-contracts.md` | concurrent/unowned |
| `.claude/skills/implement/SKILL.md` | pre-existing |
| `.claude/skills/implement/references/child-family-closeout.md` | pre-existing |
| `.claude/skills/implement/references/closeout-templates.md` | pre-existing |
| `.claude/skills/implement/references/review-evidence.md` | pre-existing |
| `.claude/skills/implement/references/tracker-closeout-gates.md` | pre-existing |
| `.claude/skills/implement/scripts/build-closeout-body.mjs` | pre-existing |
| `.claude/skills/implement/scripts/build-closeout-body.test.mjs` | pre-existing |
| `.claude/skills/implement/scripts/validate-closeout-body.mjs` | pre-existing |
| `.claude/skills/implement/scripts/validate-closeout-body.test.mjs` | pre-existing |
| `.claude/skills/playtest/SKILL.md` | pre-existing |
| `.claude/skills/playtest/references/browser-driver.md` | pre-existing |
| `.claude/skills/playtest/references/report-format.md` | pre-existing |
| `.claude/skills/playtest/scripts/browser-session.mjs` | pre-existing |
| `.claude/skills/playtest/scripts/browser-session.test.mjs` | pre-existing |
| `.claude/skills/playtest/scripts/validate-report.mjs` | pre-existing |
| `.claude/skills/playtest/scripts/validate-report.test.mjs` | pre-existing |
| `.claude/skills/tdd/closeout-evidence.md` | pre-existing |
| `.claude/skills/tdd/scripts/validate-tdd-closeout-body.test.mjs` | pre-existing |
| `reports/playtest-method-register.md` | pre-existing |
| `reports/assets/playtest-the-winter-letter-2026-07-19T022000Z/` | pre-existing |
| `reports/playtest-the-winter-letter-2026-07-19T022000Z-prd-prep.md` | intentional prep artifact |
| `reports/playtest-the-winter-letter-2026-07-19T022000Z.md` | pre-existing |

### Durability Ledger

| Path | Clean | Tracked | Visible on origin/main | Content matches origin/main | Posture |
| ---- | ----- | ------- | ---------------------- | --------------------------- | ------- |
| `reports/playtest-the-winter-letter-2026-07-19T022000Z.md` | no | no | no | N/A - no publication-ref blob | summarized, not cited |
| `reports/playtest-the-winter-letter-2026-07-19T022000Z-prd-prep.md` | no | no | no | N/A - no publication-ref blob | new local artifact |
| `AGENTS.md` | yes | yes | yes | yes | durable authority |
| `docs/ACTIVE-DOCS.md` | yes | yes | yes | yes | durable authority |
| `docs/principles/FOUNDATIONS.md` | yes | yes | yes | yes | durable authority |
| `docs/specs/story-record-schema.md` | yes | yes | yes | yes | durable authority |
| `docs/specs/compiler-contract.md` | yes | yes | yes | yes | durable authority |
| `docs/specs/segment-reconciliation-prompt-template.md` | yes | yes | yes | yes | durable authority |
| `docs/user-guide.md` | yes | yes | yes | yes | durable support source |
| `docs/agents/issue-tracker.md` | yes | yes | yes | yes | durable tracker authority |
| `docs/agents/triage-labels.md` | yes | yes | yes | yes | durable label authority |
| `tickets/README.md` | yes | yes | yes | yes | durable ticket authority |

The source report and its evidence were used only as summarized local observations. No evidence-asset path, machine-local project path, localhost address, full prompt, raw assistance response, record payload, candidate prose, accepted prose, provider secret, or browser-session plumbing is reproduced here.

Intentional mutation is limited to this same-stem prep artifact. No product code, test, active doc, source report, skill, spec, ticket, or tracker state was changed. No PRD was drafted or published, and the `/to-prd` seam checkpoint was not asked or satisfied. Issue custody must precede any later `/to-prd` pass.
