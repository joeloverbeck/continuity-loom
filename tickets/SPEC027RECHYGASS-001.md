# SPEC027RECHYGASS-001: FOUNDATIONS amendment — assistance source profiles

**Status**: PENDING
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — amends `docs/FOUNDATIONS.md` §6.4, §8, §9.1, §29.3–§29.5 (constitutional doctrine surface); authorizes the project-review assistance source profile. No production code changes in this ticket and no runtime behavior change on its own.
**Deps**: None

> **SIGN-OFF GATED.** This is a deliberate constitutional amendment (FOUNDATIONS §1). The exact wording below must receive explicit user sign-off before this ticket is implemented. Per FOUNDATIONS §1.1 the amendment must land **in the same revision** as its first dependent behavior (SPEC027RECHYGASS-002) and **never standalone ahead of it**.

## Problem

The record-hygiene feature (SPEC-027) introduces a second assistance prompt class — a whole-project, records-only `record_hygiene` prompt. The current literal `docs/FOUNDATIONS.md` §9.1 defines *every* assistance prompt as "compiled from the **same authority sources as the prose prompt** (story configuration, active working set, generation-time fields)". A project-review prompt that compiles from a deterministic whole-project record projection is therefore unconstitutional until §9.1 (and the supporting §6.4/§8 doctrine and §29 checklist) is deliberately amended to recognize named assistance **source profiles**. This ticket performs that amendment; no dependent behavior may land before it.

## Assumption Reassessment (2026-06-21)

1. **Replace-targets exist verbatim (codebase).** `docs/FOUNDATIONS.md:223` `### 6.4 Generated prompt`; `:264` `## 8. Deterministic prompt compilation`; `:308` `### 9.1 Assistance prompt class` whose first sentence reads "compiled from the same authority sources as the prose prompt (story configuration, active working set, generation-time fields)"; `:1009` `### 29.3` first bullet is exactly `Does it silently include records the user did not select?`; `### 29.4` (`:1015`) and `### 29.5` (`:1023`) exist. All verified by direct grep this session.
2. **Spec authority (docs).** `specs/SPEC-027-record-hygiene-assistance-prompt.md` Deliverable 0 + the source proposal §10 carry the exact replacement wording. §26/§26.1 (`docs/FOUNDATIONS.md:862/882`) already codify opt-in, quarantine, provenance, ephemeral-by-default assistance-output rules the amendment references unchanged.
3. **Cross-artifact shared boundary under audit.** The doctrine moves across `docs/FOUNDATIONS.md` §6.4 + §8 + §9.1 + §29.3/29.4/29.5; sibling-doc synchronization (ACTIVE-DOCS registry, the new hygiene authority doc, `docs/compiler-contract.md`, `docs/story-record-schema.md`, the ideation-template opening) happens in SPEC027RECHYGASS-003/004/008 — they are NOT in this ticket but must stay coherent with this wording (constitutional-amendment coherence: every restated rule moves together).
4. **FOUNDATIONS principle motivating this ticket (restated before trusting the spec narrative).** §9.1 assistance prompt class + §1.1 deliberate-amendment rule. Intent: an assistance prompt is deterministic, inspectable, non-canonical, and never produces story prose; the amendment *adds* a named `project-review` source profile alongside the existing `prose-aligned` one — it does not loosen determinism, quarantine, or the no-prose rule. The §29 additions are auditable hard-fails that make the new profile *harder* to misuse, not easier.
5. **Determinism / secret-firewall enforcement surface (§8/§15) — confirm no weakening.** The amendment to §8 keeps every "must not" (no LLM intermediary selecting/ranking/summarizing/repairing records during compilation; identical inputs → identical output) and *extends* it to the project-review compiler ("a project-review assistance compiler receives its own typed deterministic snapshot"). It adds no path for secret leakage: secrets travel only inside an explicit, inspectable, user-initiated send (governed by §26/§22/§23, unchanged). The new §29.4/29.5 bullets forbid keyword/probabilistic/model-selected/token-evicted source selection and forbid blocking a diagnostic prompt on the condition it inspects — both strengthen the firewall and fail-closed discipline.
6. **Adjacent contradictions classified.** After the edit, no surviving §-bullet may still assert "every assistance prompt compiles from the prose-prompt sources." The §29.3 first-bullet replacement + the two new §29.4 bullets are *required consequences* of this amendment (not separate bugs); a stale bullet left contradicting the new doctrine would be an orphaned hard-fail and must be caught by the coherence grep in Verification Layers.

## Architecture Check

1. **Named source profiles beat a blanket relaxation.** The alternative — loosening §9.1 to "an assistance prompt may compile from any records" — would erase the active-working-set firewall for prose generation. Declaring exactly two enumerated, deterministically-specified profiles (`prose-aligned`, `project-review`), each with explicit archive/status predicates, preserves active-working-set supremacy for prose while authorizing the records-only review surface. The amendment is the minimum constitutional change that makes the feature legal.
2. **No backwards-compatibility aliasing/shims.** The §9.1/§8/§6.4 blocks are replaced in full with the new doctrine; no dual "old wording also valid" path is retained. The §29 edits replace/add bullets rather than duplicating them.

## Verification Layers

1. Every restated rule moves together (no orphaned bullet) → codebase grep-proof: after the edit, `grep -n "same authority sources as the prose prompt" docs/FOUNDATIONS.md` returns **only** the new §9.1 `prose-aligned` clause context, not a stranded "every assistance prompt" assertion.
2. §8 determinism intent preserved → FOUNDATIONS alignment check (manual): the amended §8 still forbids LLM record-selection/summarization/repair during compilation and still requires identical-inputs→identical-output, now for both compiler classes.
3. §29 hard-fail intent preserved/strengthened post-amendment → FOUNDATIONS alignment check: §29.3 whole-source-predicate bullet, the three §29.4 source-profile bullets, and the §29.5 diagnostic-not-blocked bullet are present and add no "yes" answer for SPEC-027 (cross-checked against the spec's §13 self-audit).

## What to Change

### 1. Replace §6.4, §8, and §9.1 in full (proposal §10.1–§10.3)

Apply the exact replacement text from `specs/SPEC-027-record-hygiene-assistance-prompt.md` Deliverable 0 / source proposal §10.1–§10.3: §6.4 introduces assistance source profiles and states a project-review prompt grants no prose authority and does not change the active working set; §8 gives every prompt class one explicit source contract and states the project-review compiler receives its own typed snapshot; §9.1 declares the two named deterministic source profiles (`prose-aligned`, `project-review`) with explicit archive/per-type-status predicates and the no-selection/eviction rules.

### 2. Amend the §29 checklist (proposal §10.4–§10.6)

Replace the §29.3 first bullet with the prose-prompt-scoped form and add the project-review whole-source-predicate hard-fail bullet; add the three §29.4 source-profile hard-fail bullets; add the §29.5 diagnostic-not-blocked-by-the-condition-it-inspects bullet. These weaken no existing hard-fail.

## Files to Touch

- `docs/FOUNDATIONS.md` (modify)

## Out of Scope

- All sibling-doc synchronization (`docs/ACTIVE-DOCS.md`, the new hygiene authority doc, `docs/compiler-contract.md`, `docs/story-record-schema.md`, `docs/ideation-prompt-template.md`) — owned by SPEC027RECHYGASS-003/004/008.
- All production code (core/server/web) — SPEC027RECHYGASS-002 onward.
- Any change to ideation behavior or the prose prompt contract.

## Acceptance Criteria

### Tests That Must Pass

1. `grep -n "project-review" docs/FOUNDATIONS.md` returns matches in the amended §6.4, §8, and §9.1 (the new source profile is named in all three).
2. `grep -c "same authority sources as the prose prompt" docs/FOUNDATIONS.md` shows the phrase survives **only** inside the new §9.1 `prose-aligned` clause (no stranded blanket assertion) — manual confirmation the single match is the intended one.
3. The spec's §13 hard-fail self-audit re-checked against the amended §29: every existing and new question still answers **No** for SPEC-027 (manual constitutional review).

### Invariants

1. The amendment names exactly two assistance source profiles (`prose-aligned`, `project-review`); no blanket "any records" relaxation is introduced.
2. No surviving FOUNDATIONS bullet asserts that every assistance prompt compiles from the prose-prompt sources (no orphaned hard-fail).

## Test Plan

### New/Modified Tests

1. `None — documentation-only (constitutional) ticket; verification is grep-based plus manual constitutional review and existing pipeline coverage.` The downstream feature behavior is exercised by SPEC027RECHYGASS-002…009 and the capstone (009).

### Commands

1. `grep -nE "prose-aligned|project-review" docs/FOUNDATIONS.md` — confirm both source profiles are declared in §6.4/§8/§9.1.
2. `grep -nE "^- Does (a project-review|an assistance prompt|a diagnostic assistance)" docs/FOUNDATIONS.md` — confirm the new §29.4/§29.5 source-profile and diagnostic-not-blocked bullets are present.
3. A narrower grep set is the correct verification boundary because this ticket changes only constitutional prose; there is no compiled artifact or runtime path to exercise until SPEC027RECHYGASS-002+ land in the same revision.
