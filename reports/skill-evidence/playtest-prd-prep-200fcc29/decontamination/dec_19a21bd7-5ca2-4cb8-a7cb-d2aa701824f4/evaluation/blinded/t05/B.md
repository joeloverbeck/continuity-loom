# Playtest PRD Prep: Ash at Low Water

## Header And Freshness

Prep contract version: 2
Source report path: reports/playtest-ash-at-low-water-2026-07-19T102650Z.md
Source validation: passed
Source durability: durable - tracked and clean, visible on `origin/main`, and content-identical there at blob `82d11f4506a7217a5b4d729515950f8d1e82bfd3`
Authored artifact durability: dirty - the tracked same-stem path is intentionally rewritten only in this isolated trial
Live checkout: branch `trial-t05-baseline`, HEAD `7e8a545860c0d70f25be429d0a02b37d44be8bbc`; baseline dirt was only the harness-required deletion of the source's same-stem prep
Tracker freshness: live read at `2026-07-20T11:19:36Z`; #100 and #113-#116 are closed, and an open-issue search for `Ash at Low Water` returned none
Existing same-stem prep classification: missing at intake
Prior-report prep path: not applicable
Prior-report prep classification: not applicable
Prior-report traversal: not applicable - source declares `prior_report: null`
Deliverable status: PRD-ready determination only; prep artifact write only
External research: skipped - repo-local prep

## Reassessment Verdict

First operational action: none - every non-strength source finding is covered by current implementation and closed tracker work
No-new-PRD verdict: the source's bounded no-create conclusion still holds; current code resolves F003, F004, F005, F008, and F009 while F001, F002, F006, F007, and F010 remain preservation constraints rather than new scope
Publication package: no new PRD

The source asked whether pressure-only offstage people need an up-front CAST MEMBER dossier. Its direct evidence supports the existing staged ENTITY-first route, not a new completeness rule. Committed drift after the playtest closed the four Ash-specific follow-ups, while the already-shipped all-empty reconciliation warning covers the separate author-trust risk without pretending to verify model completeness.

## Source Inventory

Source prioritized findings: 5
Source cumulative ledger rows: 10
Source strength rows: 5
Disposition rows: 10
Strength constraint rows: 5

Run mode: new_story
Prior report pointer: null
Source inspector result: passed with no warnings or nonblocking defects
Report launch HEAD: `dafea24f08bb1ccb998b051ddce2ad85c842e133`
Current baseline HEAD: `7e8a545860c0d70f25be429d0a02b37d44be8bbc`
Relevant committed drift: `407fe82904dc5819aab9e8585cc8c83bb316a59e` implements #113-#116 for F004, F003, F005, and F009; #100's all-empty-result mitigation is also an ancestor of both the report launch HEAD and the current baseline
Focused current proof: after the fresh checkout was built, 10 targeted test files passed with 176 tests covering field guidance and compilation, list requiredness, readiness copy, linked CAST workflow, and all-empty reconciliation behavior

## Evidence Disposition Ledger

| Report item | Report summary | Disposition | Current evidence | Change/PRD impact |
| ----------- | -------------- | ----------- | ---------------- | ----------------- |
| F001 | Local project create/open custody was clear and Description could remain empty. | preserve-strength | Durable direct-visible report evidence; current authorities retain local-first, user-owned project custody and no contradictory open work was found. | Preserve globally; no new scope. |
| F002 | ENTITY-first was sufficient for a pressure-only offstage person. | preserve-strength | The durable report reached readiness and acceptance with the staged route; current schema keeps person ENTITY descriptions out of material pressure and #113 explicitly preserves Generation Brief pressure with optional later dossier deepening. | Preserve globally; rejects an up-front dossier gate. |
| F003 | Required markers on list fields obscured that several lists may be empty. | covered | Closed #114 and commit `407fe82` add editor-only `minItems` guidance and accessible may-be-empty copy without changing schema, validation, or prompt behavior; focused tests pass. | Covered; no PRD or follow-up. |
| F004 | Help implied a selected person ENTITY short description compiled when it did not. | covered | Closed #113 and commit `407fe82` make person versus non-person prompt eligibility explicit, route person pressure to the Generation Brief, and pin unchanged compiler behavior; focused tests pass. | Covered; no compiler change or PRD. |
| F005 | A structured-pressure warning ignored sufficient local pressure and read too strongly. | covered | Closed #115 and commit `407fe82` retain warning code, predicate, severity, and non-gating behavior while using neutral optional-strengthening copy; focused readiness tests pass. | Covered; no validation-rule change. |
| F006 | Cold prose used the paper-order pressure while keeping the person offstage. | preserve-strength | Durable direct-visible report evidence remains consistent with the current local-prose, offstage-relevance, and POV boundaries; no relevant contradiction or open owner was found. | Preserve offstage discipline and local author control. |
| F007 | Acceptance kept prose non-authoritative and required manual continuation reconciliation. | preserve-strength | The durable report and current FOUNDATIONS/user guide retain the accepted-prose firewall, manual durable-change reminder, and explicit canonical edit boundary. | Preserve globally; no new scope. |
| F008 | Two cold reconciliation draws were identically empty and unreasoned. | covered | Closed #100 is implemented in the current tree: a valid all-empty in-app result is labeled `Unverified no-change result`, requires manual comparison, and allows only an explicit confirmed retry with no automatic write or send; focused parser, route, and UI tests pass. The report's external cold draws bypassed that result surface and do not contradict it. | Covered author-trust outcome; no stronger semantic/model contract is justified by one pair. |
| F009 | Later promotion to active cast required a costly disconnected navigation sequence. | covered | Closed #116 and commit `407fe82` add Create/Open linked CAST actions plus explicit post-create Add/Open Working Set handoff while preserving separate membership and band decisions; focused UI tests pass. | Covered; no new workflow PRD. |
| F010 | Full active dossiers render, but downstream repayment was untested. | preserve-strength | The report proves 22 of 22 forced scalar values rendered and explicitly limits the inference; current compiler authority still includes every populated active/full dossier field without silent compression, and focused compiler tests pass. | Preserve full rendering and the no-repayment-inference boundary; no completeness change. |

## Strength Preservation Ledger

| Strength ID | Applies to | Preservation constraint | Regression evidence |
| ----------- | ---------- | ----------------------- | ------------------- |
| F001 | global | Keep local Create/Open custody legible and keep optional project Description genuinely optional. | Durable source observation plus current local-first FOUNDATIONS review; no contradictory current issue found. |
| F002 | global | Keep pressure-only offstage people eligible through ENTITY selection and authored Generation Brief pressure without forcing an up-front CAST MEMBER dossier. | Source readiness/acceptance evidence; #113 closeout; current guidance/compiler regressions in the focused 176-test pass. |
| F006 | global | Keep offstage pressure meaningful without inventing live speech, action, location, or interiority for the absent person. | Source cold-prose evidence and current offstage/compiler contract review. |
| F007 | global | Keep accepted prose as output only; durable continuity changes remain manual record or brief edits. | Source acceptance evidence; FOUNDATIONS §§10, 20-22 and current user-guide reconciliation boundary. |
| F010 | global | Keep every populated active/full dossier field rendered without silent compression, while treating prompt exposure as distinct from proven author value. | Source 22-of-22 audit; compiler contract active/full rule; focused compiler regression pass. |

## Authority And Change-Surface Map

| Candidate or follow-up | Governing authority | Code/test impact | Doc/skill impact | Required artifact type |
| ---------------------- | ------------------- | ---------------- | ---------------- | ---------------------- |
| Global preservation constraints F001, F002, F006, F007, F010 | `docs/FOUNDATIONS.md` §§4, 7-10, 17, 20-22, 27; `docs/story-record-schema.md` §§3-5 | Preserve local custody, explicit working-set selection, offstage discipline, accepted-prose firewall, and full active dossier rendering. | No doc or skill change owed. | none - preservation only |
| F003 required-list clarity | `docs/story-record-schema.md`; browser-visible guidance checklist | Current editor descriptor and accessible list-note seams are covered by #114 tests. | No further doc change owed. | none - covered by closed #114 |
| F004 person ENTITY prompt eligibility | `docs/compiler-contract.md` §§4 and 9; `docs/story-record-schema.md` §4.1 | Current field guidance, prompt preview, and pressure-section regressions are covered by #113. | No authority change owed because compiler behavior was already correct. | none - covered by closed #113 |
| F005 structured-pressure warning copy | `docs/FOUNDATIONS.md` §11; `docs/validation-rule-inventory.md` warnings | Current readiness copy preserves the warning predicate, severity, and non-gating behavior; #115 tests cover it. | No diagnostic inventory change owed. | none - covered by closed #115 |
| F008 all-empty reconciliation trust state | `docs/FOUNDATIONS.md` §§9.1 and 26.1; `docs/segment-reconciliation-prompt-template.md` | Current parser/route/UI treat all-empty as valid but visibly unverified, with manual comparison and explicit retry only; #100 tests cover it. | No prompt-contract or skill change owed from this one external pair. | none - covered by closed #100 |
| F009 linked CAST activation handoff | `docs/FOUNDATIONS.md` §§7, 17, 27; `docs/user-guide.md` | Current Records flow links creation and offers explicit membership navigation without automatic band assignment; #116 tests cover it. | User guide is synchronized. | none - covered by closed #116 |

## Recommended PRD Package

No PRD candidate remains. The requested role-gated dossier-completeness change is unsupported by the source's bounded evidence, and every separate non-strength finding has current implementation and closed tracker ownership. Repackaging covered work would duplicate delivered behavior and weaken the report's explicit no-create gate.

## Non-PRD Follow-Up

| Item | Destination | Trigger or next action | Evidence required |
| ---- | ----------- | ---------------------- | ----------------- |
| None | N/A - all non-strength rows are covered and all strength rows are preservation constraints | No custody action beyond confirming the closed owners remains. | Closed issue readback, current source inspection, and focused regressions already recorded. |

## Rejected Or No-Op Alternatives

- Reject an up-front or role-gated CAST MEMBER completeness rule: F002 proves a lawful cheaper staged route, and F010 proves prompt exposure but not repayment.
- Reject compiling a person ENTITY `short_description` as a new fix: current authority assigns active person identity and voice to CAST MEMBER records, while #113 corrected the misleading help and preserved Generation Brief pressure.
- Reject a new reconciliation PRD from F008: #100 already prevents all-empty output from masquerading as a verified audit, and one concordant external pair does not justify deterministic semantic heuristics, forced rationales, automatic retries, or provider changes.
- Do not recreate #113-#116 as tickets: the current baseline contains their implementation, focused tests pass, the issues are closed, and no matching open Ash issue exists.

## PRD Publication Inputs

Recommended testing seam: N/A - no PRD remains; current proof is the focused 10-file, 176-test regression set plus exact closed-issue and implementation readback
/to-prd consultation: house style only; seam checkpoint still owed
Likely label: unresolved - no publication package exists
Label downgrade conditions: none - no issue or PRD publication is proposed
Browser-visible guidance checklist: N/A - all browser-visible findings are already owned by closed #100 and #113-#116

## Completion Self-Check

Prep validator: passed
Manual semantic review: completed
Privacy and stale-language scan: clear

## Freshness And Boundaries

Final branch: trial-t05-baseline
Final worktree rows: 1

### Final Worktree Ledger

| Path | Classification |
| ---- | -------------- |
| reports/playtest-ash-at-low-water-2026-07-19T102650Z-prd-prep.md | intentional prep artifact |

Final HEAD: `7e8a545860c0d70f25be429d0a02b37d44be8bbc`
Baseline scope: the harness removed only the source's same-stem prep before execution; dependency installation and build output are ignored and introduce no worktree row.
Privacy boundary: source report evidence is summarized; no prompt, record payload, assistance response, candidate prose, accepted prose, secret, local project path, browser plumbing, or machine-local evidence path is copied here.
Freshness boundary: the final branch and worktree ledger will be compared with live Git output immediately before and after final validation.
