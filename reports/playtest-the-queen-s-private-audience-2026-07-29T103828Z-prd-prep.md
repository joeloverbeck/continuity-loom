# Playtest PRD Prep: The Queen's Private Audience

## Header And Freshness

Prep contract version: 2
Source report path: reports/playtest-the-queen-s-private-audience-2026-07-29T103828Z.md
Source validation: passed
Source durability: durable - tracked and clean; publication ref `origin/main` contains the source at `b43114d2804b7c31954b99597e01a0854c227b8b`, and the checkout blob is content-identical
Authored artifact durability: new/untracked - intentionally created by this prep run and not publication-ref-visible
Live checkout: `main` at `41062d521240e7afb0211dd329b35794f841e34c`; baseline dirt was the two untracked `reports/skill-evidence/playtest-prd-prep/` receipt files listed in the final ledger
Tracker freshness: live GitHub reads on 2026-07-29; closed issue #217 owns and has consumed the schema-v4 source-inspection prerequisite; exact F001/F002 term searches found no current owner; open issue #212 is unrelated
Existing same-stem prep classification: missing at intake
Prior-report prep path: not applicable
Prior-report prep classification: not applicable
Prior-report traversal: not applicable - source run mode is `new_story` and `prior_report` is null
Deliverable status: PRD-ready determination only; prep artifact write only
External research: skipped - repo-local prep

## Reassessment Verdict

First operational action: Resolve the content-envelope validation contract so structurally negative constraints cannot prove an affirmative prohibited request, while true affirmative contradictions remain fail-closed and point to the exact conflicting clause.
Recommended first new PRD: Negation-Aware Content-Envelope Validation
Publication package: single intended PRD

F001 is current, reproducible, and constitutionally material. The report reproduced the blocker twice by changing only a negative safety constraint. At the live fixed point, content-envelope validation still joins `must_render`, `may_render_if_naturally_caused`, `do_not_force`, current voice-pressure lanes, must-preserve/must-avoid lanes, and temporary overrides before matching policy and prohibited-content markers. The implementation therefore has no structural distinction between a prohibition and an affirmative request. No affected product, test, or active-authority path changed between the report's launch commit and the live fixed point.

The correction belongs in one PRD because it changes a fail-closed blocker, author-visible readiness behavior, and the deterministic rule that distinguishes safe from contradictory prompt-facing instructions. It must preserve real content-policy gating rather than demote or remove the blocker.

F002 does not justify product scope. The underlying browser resource failure and Chromium termination remain unattributed. A narrower harness defect is established: a fresh guarded-browser attempt truncates all existing diagnostic streams before browser launch succeeds, so a failed recovery can erase the prior attempt's retained diagnostics. That work routes to skill maintenance and bounded continuation verification, not into the validation PRD.

## Source Inventory

Source prioritized findings: 2
Source cumulative ledger rows: 8
Source strength rows: 4
Disposition rows: 8
Strength constraint rows: 4

The source is a new-story run with no prior report or prior prep. The same-stem prep was absent at intake, so there are no historical recommendations to consume or migrate. The current fixed point includes the completed local-only source-inspector fix from issue #217; the named validator and inspector now agree on the 2 prioritized findings, 8 cumulative rows, and 4 strengths without changing the source report.

## Evidence Disposition Ledger

| Report item | Report summary | Disposition | Current evidence | Change/PRD impact |
| ----------- | -------------- | ----------- | ---------------- | ----------------- |
| F001 | Negative safety constraints trigger a content-envelope contradiction | fresh-prd-scope | Two one-field report reproductions; independent challenge retained the run-scoped claim; live validation still performs marker matching across affirmative and negative lanes, including `do_not_force`; affected source and tests are unchanged from the launch fixed point | Sole source for PRD Candidate: Negation-Aware Content-Envelope Validation |
| F002 | Browser resource exhaustion prevented Preview and fresh recovery | skill-maintenance | The resource cause and product attribution remain unproven; live harness source deterministically truncates prior diagnostic streams before a recovery browser has launched, and focused browser-session tests do not cover evidence preservation across failed recovery | Route the proven diagnostic-custody defect to skill audit, then require bounded attribution evidence before any product issue |
| F003 | Project entry and creation make local custody verifiable | preserve-strength | Direct-visible path, compatibility, and store-version readback in the report; no relevant live drift | Global preservation constraint; no new scope |
| F004 | Private Notes state their inert boundary prominently | preserve-strength | Direct-visible boundary before and after note save; FOUNDATIONS §§6.6 and 29.12 and the user guide require the same separation | Global preservation constraint; no new scope |
| F005 | Readiness gives actionable dependency repairs | preserve-strength | Missing Entity-reference and POV-knowledge blockers led to successful canonical repairs; live readiness contracts require author-first wording and affected-field guidance | Constrains the F001 PRD's diagnostic and recovery acceptance |
| F006 | Cast Possibilities produced grounded, distinct local options | preserve-strength | One structurally compliant cold draw produced distinct local options without entering continuity authority; no relevant live drift | Global preservation constraint; no new scope |
| F007 | Loopback permission blocked initial holders | covered | The exact narrow retry succeeded, and the active browser-driver authority already classifies this boundary and permits one exact host-permission retry | No issue; retain the existing bounded recovery rule |
| F008 | Note save driver timed out after the save had succeeded | no-op/rejected | Visible saved state prevented duplicate activation; the event resolved in-run, was not repeated, and does not establish a stable product or harness defect | No issue unless a later run reproduces loss, duplication, or misleading saved state |

## Strength Preservation Ledger

| Strength ID | Applies to | Preservation constraint | Regression evidence |
| ----------- | ---------- | ----------------------- | ------------------- |
| F003 | global | Keep project creation and opening explicitly local, with visible path, compatibility, and store-version readback before authoring proceeds | Existing project workflow coverage plus a browser scenario that verifies the same visible custody readback |
| F004 | global | Keep Private Notes visibly inert and excluded from records, readiness, every prompt, provider requests, and continuity authority | FOUNDATIONS §6.6/§29.12 conformance, note-boundary tests, and browser copy/readback review |
| F005 | PRD Candidate: Negation-Aware Content-Envelope Validation | Preserve one readiness model across Generation Brief and Prompt Preview; every true blocker must identify the affected author field, explain the contradiction, and offer a safe repair without erasing the saved draft | Core diagnostic-contract assertions, route/component readiness tests, and a browser-visible blocked/recovered Preview scenario |
| F006 | global | Keep Cast Possibilities opt-in, source-disclosing, grounded, non-prose, non-canonical, and unable to mutate the final directive or records automatically | Existing Cast Possibilities core/server/browser contract tests and a cold-context playtest comparison when naturally eligible |

## Authority And Change-Surface Map

| Candidate or follow-up | Governing authority | Code/test impact | Doc/skill impact | Required artifact type |
| ---------------------- | ------------------- | ---------------- | ---------------- | ---------------------- |
| Negation-Aware Content-Envelope Validation | FOUNDATIONS §§4.5, 11, 25, and 29.5; `docs/specs/compiler-contract.md` §§5-7 and 10; `docs/specs/validation-rule-inventory.md`; `docs/specs/story-record-schema.md` §§3.4 and 11 | Content-envelope rule at `packages/core/src/validation/rules/universal-blockers.ts`; polarity and affected-field contract tests at the core validation seam; server readiness and web Preview recovery coverage where behavior is exposed | Coordinate the validation inventory, compiler validation bridge, schema blocker text, stress cases/matrix, demo recipe, and user-facing readiness guidance in the same governed change; no playtest-skill behavior change is required | PRD followed by coordinated implementation/spec/test/doc work |
| Guarded-browser recovery evidence preservation and resource attribution | `.claude/skills/playtest/SKILL.md`, `references/browser-driver.md`, and `references/blockers-and-diagnostics.md` | `browser-session.mjs` attempt-start/launch-failure evidence behavior and focused tests proving prior streams survive an unsuccessful recovery | Skill audit must decide attempt-scoped or append-safe evidence ownership; a later continuation may run the report's bounded control-versus-Preview discriminator without provider calls | skill-audit plus coverage |
| Existing loopback permission recovery | `references/browser-driver.md` host-permission recovery rule | No current code change | Preserve exact-command, single-retry wording | coverage; no new artifact |

## Recommended PRD Package

### PRD Candidate: Negation-Aware Content-Envelope Validation

Candidate role: first
Purpose: Let authors state explicit safety prohibitions without readiness falsely treating those prohibitions as requests, while retaining deterministic fail-closed blocking for actual affirmative content-envelope conflicts.
Sources: F001
Problem: The live rule searches one combined prompt-facing text corpus for prohibited-content markers. Structurally negative lanes such as `manual_moment_directive.do_not_force` and current cast `current_must_avoid` therefore contribute the same evidence as affirmative request lanes. In the reported mature scene, making the local safety boundary more explicit created a blocker and forced a less explicit workaround. The diagnostic targets the policy field rather than the exact author clause that supplied the alleged affirmative conflict.
Product rule or seam: `content-envelope-contradiction` may block only when deterministic evidence establishes that a prompt-facing instruction affirmatively requires content excluded by the active policy or governing provider constraints. The mere presence of a prohibited-content term in a structural prohibition, avoidance lane, or neutral reference does not establish a contradiction. Structurally negative lanes must be excluded from affirmative-request evidence. Any remaining free-prose polarity rule must be deterministic, documented, and covered by an explicit positive/negative/neutral corpus; no LLM or hidden semantic classifier may enter validation. A true contradiction remains a blocker and identifies the exact conflicting instruction lane and clause in author-facing diagnostics.
Affected surfaces: Core validation and diagnostic construction; public validation/readiness routes; Generation Brief and Prompt Preview blocker rendering and recovery; validation inventory, compiler contract, story-record schema, mature-fiction stress cases and coverage matrix, demo blocker recipes, user guide, and focused core/server/web/browser tests.
Scope: Define the deterministic affirmative-versus-prohibitive evidence contract; ensure `do_not_force` and other structural avoidance lanes cannot independently trigger the blocker; cover negative, affirmative, and neutral constructions with identical sensitive terms; preserve actual policy/provider contradictions; bind diagnostics to the exact offending instruction and safe repair; keep draft saving available and Preview/Generate blocked only for a true contradiction.
Acceptance: A saved brief with policy-aligned explicit prohibitions in `do_not_force` and current `must_avoid` lanes reaches ready state when no other blocker exists; the same prohibited term in a proven affirmative request lane still produces `content-envelope-contradiction`; matched positive/negative/neutral cases demonstrate deterministic classification; a true blocker names the exact conflicting clause and affected lane, explains why it conflicts, and offers revision without directing the author to weaken the governing policy; Generation Brief and Prompt Preview show the same fresh result after save/recompile; no provider request occurs in either blocked or local recovery paths; active specs, inventory, stress coverage, demo recipe, and user guide agree with runtime behavior.
Preserved strengths: F005
Testing seam: Highest existing behavior seam is the browser-visible Generation Brief to Prompt Preview readiness/recovery journey with an explicitly blank provider credential; pair it with a core polarity matrix and server-route assertions so the public seam and the deterministic rule are both proved.
Out of scope: Demoting or removing the content-envelope blocker; changing the mature-fiction envelope or external provider policy; adding an override; using an LLM, probabilistic NLP, or hidden model judgment in validation; changing prompt bytes, record authority, provider transport, candidate handling, or accepted-prose boundaries; attributing or repairing the F002 browser failure.

## Non-PRD Follow-Up

| Item | Destination | Trigger or next action | Evidence required |
| ---- | ----------- | ---------------------- | ----------------- |
| F002 - Guarded-browser recovery evidence preservation and resource attribution | skill-audit - playtest guarded-browser recovery | First decide and specify append-safe or attempt-scoped diagnostic custody so a failed fresh launch cannot erase the original failure. After that proof exists, resume this saved playtest only through the supplied continuation report and use the bounded same-host control-versus-Preview discriminator if the browser launches. Create product scope only if that evidence attributes the failure to product state. | Focused tests showing pre-existing console/network/guard evidence survives every launch-failure branch; privacy review of retained fields; one bounded continuation report or an explicit unreproduced result with browser/host cause still unclaimed |

No ticket packet is included because no cumulative row is a `ticket-candidate`. F002 is repository-local playtest-method work routed to skill audit, and its possible product consequence remains gated on new attribution evidence.

## Rejected Or No-Op Alternatives

- Treat F001 as a narrow implementation ticket: rejected because changing a fail-closed validation blocker and its browser-visible readiness/recovery contract requires PRD intake under `docs/ACTIVE-DOCS.md`.
- Remove or demote `content-envelope-contradiction`: rejected because FOUNDATIONS §§4.5, 11, 25, and 29.5 require true policy conflicts to remain blocking.
- Solve F001 only by deleting sensitive vocabulary from local constraints: rejected because that reproduces the author-trust failure and weakens explicit safety authoring.
- Add probabilistic language interpretation: rejected because validation and prompt compilation must remain deterministic and inspectable.
- Bundle F002 into the validation PRD or call it a Preview product crash: rejected because the resource cause and product attribution are not established and the affected seam is the playtest browser harness.
- Re-run an unrestricted browser journey during prep: rejected because report, live source, focused tests, and tracker reconciliation were sufficient for disposition; prep permits a browser probe only when a contradiction still blocks classification.
- Reopen issue #217: no-op because the live inspector passes, the source hash remains unchanged, and #217 is closed with the current local fixed point as its completion revision.
- Create work from F003-F006: rejected because strengths constrain regression behavior and do not create scope.
- Create work from F007: no-op because the active recovery rule covers it and the exact retry succeeded.
- Create work from F008: no-op unless later evidence shows duplicate activation, data loss, or misleading saved state.

## PRD Publication Inputs

Recommended testing seam: Browser-visible Generation Brief save, readiness, and Prompt Preview recovery with a blank provider credential, backed by a core positive/negative/neutral polarity matrix and public server validation assertions
/to-prd consultation: house style only; seam checkpoint still owed
Likely label: `bug` plus `needs-triage` - both labels exist live; F001 is a current behavior defect, while the PRD's exact deterministic polarity and diagnostic contract still needs maintainer ratification before any `ready-for-agent` posture
Label downgrade conditions: keep `needs-triage` if the issue does not define all instruction lanes, positive/negative/neutral cases, exact diagnostic targeting, active-doc coordination, or the browser-visible recovery proof; use `needs-info` only if owner policy intent is unavailable after the seam checkpoint
Browser-visible guidance checklist: applies - map entry and availability to saved Generation Brief readiness and Prompt Preview; user-visible states/actions/outcomes to policy-aligned prohibitions versus true conflicts; validation/error/recovery to exact affected-clause diagnostics and fresh recompile; prompt freshness to withholding stale Preview after edits; external-LLM boundary to zero provider calls during validation and local recovery; canon/prose boundary N/A with a specific no-authority-change reason; persistence/provenance to saved-draft preservation and no migration; browser/accessibility regression to keyboard-operable blocker repair and consistent accessible diagnostics

PRD drafting inputs:

- State the constitutional alignment explicitly: the change reduces false blockers without weakening fail-closed enforcement, preserves deterministic compilation, and introduces no hidden model judgment.
- Name the behavior seam, not an implementation strategy: distinguish affirmative requirements from structural prohibitions and neutral mentions before a content-envelope contradiction can be proven.
- Make the lane inventory exhaustive. At minimum it must decide `must_render`, `may_render_if_naturally_caused`, `do_not_force`, current voice pressure, must-preserve, must-avoid, and temporary overrides.
- Require exact author-facing provenance for a blocker: affected lane and conflicting clause, active policy rule, plain-language reason, and a safe revision path.
- Require same-change agreement among runtime, diagnostic inventory, compiler validation bridge, schema, stress suite/matrix, demo recipe, user guide, and focused tests.
- Keep F002 wholly outside this PRD.

## Completion Self-Check

Prep validator: passed
Manual semantic review: completed
Privacy and stale-language scan: clear

## Freshness And Boundaries

Final branch: main
Final worktree rows: 3

### Final Worktree Ledger

| Path | Classification |
| ---- | -------------- |
| reports/playtest-the-queen-s-private-audience-2026-07-29T103828Z-prd-prep.md | intentional prep artifact |
| reports/skill-evidence/playtest-prd-prep/events.jsonl | pre-existing |
| reports/skill-evidence/playtest-prd-prep/gate-status.json | pre-existing |

Relevant committed drift from the report's launch revision is limited to the report/evidence publication and the source-inspector correction for issue #217; no affected product validation, browser-harness, active-spec, or focused-test path changed. The source report and its retained finding image are tracked, clean, publication-ref-visible, and content-identical to `origin/main`. The authored prep remains an intentional untracked artifact until separately published.

Semantic review boundary: every F001-F008 row has exactly one disposition; every F003-F006 strength has exactly one preservation constraint; no unsupported product attribution was promoted; F001 and F002 remain separate by authority, implementation seam, and proof requirement.

Privacy boundary: this artifact contains no full prompt, payload, raw assistance, candidate prose, accepted prose, key, localhost URL, temporary project path, or temporary session path. Machine-local evidence was summarized, not cited.

Non-actions: no implementation, source-report edit, tracker mutation, PRD publication, or `/to-prd` seam checkpoint occurred.
