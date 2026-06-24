# SPEC032SEGRECASS-001: FOUNDATIONS amendment for the `segment-reconciliation` assistance source profile

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — amends `docs/FOUNDATIONS.md` §8, §9.1, §10, §21, §28.1–§28.2, §29.2, §29.3, §29.4, §29.8, §29.9 (constitutional text only); no production-code behavior change in this ticket
**Deps**: None

## Problem

Continuity Loom's constitution currently forbids the exact source the Segment Reconciliation feature (SPEC-032) needs. Several sentences make the proposed single-accepted-segment evidence lane illegal: §8 forbids inferring source material from accepted prose and including accepted prose in prompts; §9.1 recognizes exactly two assistance source profiles and forbids inferring assistance selection from accepted prose; §10 makes accepted-prose exclusion a hard rule for generated prompts; §21 says segment browsing is not a prompt source; §28.1 excludes accepted prose entirely; §29.4 and §29.8 reject any prompt context containing accepted segments. Per FOUNDATIONS §1.1 the feature is wrong unless the constitution is deliberately amended first. This ticket lands that amendment — a third `segment-reconciliation` source profile plus one narrow accepted-prose exception (exactly one explicitly-selected accepted segment, as bounded evidence for quarantined advisory proposals only) — with the prohibition intact everywhere else.

This is the SPEC-032 Deliverable 0. The exact replacement wording is fixed by the source proposal `reports/segment-reconciliation-assistance-change-proposal.md` §10.1–§10.10 and requires explicit owner sign-off before this ticket lands.

## Assumption Reassessment (2026-06-24)

1. The amendment's target sections exist at the cited numbering in `docs/FOUNDATIONS.md` (verified this session at reassessment): `## 8. Deterministic prompt compilation` (L264), `### 9.1 Assistance prompt class` (L313), `## 10. No accepted prose in generated prompts` (L382), `## 21. Accepted segment archive` (L763), `### 28.1` (L945) / `### 28.2` (L949), `### 29.2` (L1002), `### 29.3` (L1011), `### 29.4` (L1020), `### 29.8` (L1062), `### 29.9` (L1070). §29.1/§29.5/§29.12 need no wording change (proposal §10.11) but still apply and are tested by sibling tickets.
2. The replacement text is the proposal `reports/segment-reconciliation-assistance-change-proposal.md` §10.1–§10.10, reproduced verbatim. The spec `specs/SPEC-032-segment-reconciliation-assistance-prompt.md` Deliverable 0 fences this as sign-off-gated and not-yet-approved (scope decisions D3/D4).
3. **Cross-artifact boundary under audit**: this amendment is the shared contract that `docs/compiler-contract.md` (§2.3 new source profile), `docs/story-record-schema.md` (§9.4 projection), and `docs/ACTIVE-DOCS.md` (new authority row) restate downstream. Those doc edits land with the compiler ticket (SPEC032SEGRECASS-004); this ticket touches `docs/FOUNDATIONS.md` only. The §9.1 "exactly two source profiles" → "three source profiles" change is the recurring term whose every occurrence must move together (see Verification Layer 2).
4. **FOUNDATIONS principle restated before trusting the spec narrative**: the amendment relaxes §10/§28.1 (accepted-prose firewall) by exactly one lane. Per FOUNDATIONS §1 this is a sanctioned deliberate amendment, not a violation. The relaxation's intent: accepted prose remains forbidden from every prose prompt, every other assistance prompt, every stored continuity field, and every automatic summary; the sole exception is one explicitly-user-selected accepted segment read as bounded, non-canonical evidence into the `segment-reconciliation` assistance prompt. The amended §10/§28.1/§21 must preserve the firewall's spirit everywhere outside that one lane.
5. **Enforcement-surface intent preserved (§8/§15)**: the amended §8/§9.1/§29.4 must keep deterministic compilation with no LLM intermediary (the reconciliation compiler only normalizes/escapes/sorts/keys/generates-schema — it never selects, summarizes, or repairs), and the amended §29.6/§29.9 must keep the secret firewall (whole-project scope discloses secret-bearing records explicitly with opt-in send; no secret leaks into a narrator the records forbid). The amendment adds no LLM-in-compilation path and no nondeterminism; it authorizes a *read* of one segment, not a model-chosen one.

## Architecture Check

1. The amendment is authored as exact full-section replacements (proposal §10.1–§10.10) rather than piecemeal sentence edits, so the constitution stays internally coherent — every restated rule across §8/§9.1/§10/§21/§28/§29 moves together with no orphaned bullet left asserting the old two-profile doctrine. A coherent constitution is the only safe substrate for the dependent feature tickets.
2. No backwards-compatibility aliasing or shims: the old §9.1 two-profile text is replaced, not deprecated-in-place; there is no parallel "legacy prohibition" path retained.

## Verification Layers

1. New-profile doctrine present → codebase grep-proof: `grep -n "segment-reconciliation" docs/FOUNDATIONS.md` returns matches in §8, §9.1, §10, §21, §28.1, and the touched §29 subsections.
2. No orphaned old-doctrine bullet (recurring-term sweep) → codebase grep-proof: `grep -niE "exactly two (source )?profiles|two assistance" docs/FOUNDATIONS.md` returns zero — every "two profiles" occurrence is updated to three.
3. Firewall intent preserved outside the one lane → FOUNDATIONS alignment check (manual): each amended §29 hard-fail still answers "no" for prose prompts and for every assistance profile other than `segment-reconciliation`; §29.4 still forbids an LLM intermediary in compilation; §29.6/§29.9 still forbid secret leakage and key exposure.

## What to Change

### 1. Replace the §8 prompt-class source/prohibition paragraphs

Apply proposal §10.1 verbatim: add the segment-reconciliation compile clause; clarify that the profile's direct explicit read of one selected accepted segment is *not* inference; forbid accepted-prose text in any prose prompt or any assistance prompt other than the exact `segment-reconciliation` profile. All other §8 paragraphs unchanged.

### 2. Replace §9.1 in full

Apply proposal §10.2 verbatim: three source profiles (`prose-aligned`, `project-review`, `segment-reconciliation`); the additional segment-reconciliation source constraints (one segment, latest-only v1, complete-segment evidence spans, registered-validator schema/enum only, oversize-fails-visibly); the determinism/inspectability/diagnostic-gating/no-LLM-intermediary/never-prose obligations; and the additional segment-reconciliation *output* obligations (span provenance, contrast keys, registered types/enums/destinations, paraphrase + verbatim-echo guard, full-response quarantine, ephemeral scratch). The universal-prose section list and following §9 text remain after the replacement.

### 3. Replace §10, §21, §28.1–§28.2 in full

Apply proposal §10.3 (§10 — sole one-segment exception, non-canon, no quote-through, paraphrase + echo guard), §10.4 (§21 — segment browsing non-source; reminder may link to Segment Reconciliation without acknowledging it), and §10.5 (§28.1/§28.2 — the one narrow v1 exception; one-complete-segment-only, no range/retrieval/summary/truncation, oversize fails) verbatim.

### 4. Replace the touched §29 hard-fail checklists

Apply proposal §10.6–§10.10 verbatim to §29.2, §29.3, §29.4, §29.8, §29.9 — the segment-reconciliation-aware hard-fail questions. Leave §29.1, §29.5, §29.12 unchanged (proposal §10.11).

## Files to Touch

- `docs/FOUNDATIONS.md` (modify)

## Out of Scope

- Any code change, new module, route, or UI. This ticket is the constitutional text only.
- The downstream doc cascade: `docs/compiler-contract.md`, `docs/story-record-schema.md`, `docs/ACTIVE-DOCS.md`, `docs/user-guide.md`, and the new `docs/segment-reconciliation-prompt-template.md` land with their owning code tickets (SPEC032SEGRECASS-004 and -008), not here.
- The §7.4 lifecycle-destination table and the visible-name/exclusion-boundary assumptions (proposal §7.4 / A1 / A2): those are signed off alongside this amendment but encoded in the domain-authority doc (SPEC032SEGRECASS-004), not in `docs/FOUNDATIONS.md`.

## Acceptance Criteria

### Tests That Must Pass

1. `grep -n "segment-reconciliation" docs/FOUNDATIONS.md` — matches present in §8, §9.1, §10, §21, §28.1, §29.2, §29.4, §29.8 (the amended sections).
2. `grep -niE "exactly two (source )?profiles" docs/FOUNDATIONS.md` — returns nothing (no orphaned two-profile bullet).
3. `npm run lint && npm run typecheck && npm test` — green (a docs-only change must not regress any existing suite; no version bump occurs in this ticket).

### Invariants

1. **Owner sign-off gate**: the exact §10.1–§10.10 wording (and the §7.4 lifecycle table / A1 / A2 assumptions carried by SPEC032SEGRECASS-004) is explicitly approved by the owner before this ticket is implemented. The PR description records the sign-off.
2. **Same revision; never merge standalone (§1.1)**: this amendment lands in the *same revision* as the first dependent feature code (SPEC032SEGRECASS-002, which declares `Deps:` on this ticket). It must never merge standalone ahead of the code it authorizes — a constitution declaring behavior the code does not yet implement is the doc-ahead-of-code contradiction §29 itself flags.
3. The accepted-prose firewall remains intact for every prose prompt, every other assistance profile, every stored continuity field, and every automatic summary; only the one explicitly-selected-segment `segment-reconciliation` lane is excepted.

## Test Plan

### New/Modified Tests

1. `None — documentation-only (constitutional) ticket; verification is the grep-proofs above plus a manual FOUNDATIONS coherence review. No production behavior changes, so existing pipeline coverage (lint/typecheck/test) is the regression guard.`

### Commands

1. `grep -n "segment-reconciliation" docs/FOUNDATIONS.md` then `grep -niE "exactly two (source )?profiles|two assistance" docs/FOUNDATIONS.md`
2. `npm run lint && npm run typecheck && npm test`
3. A targeted grep-pair is the correct verification boundary here because the deliverable is constitutional prose, not executable behavior; coherence (no orphaned old-doctrine bullet, firewall intact outside the one lane) is confirmed by manual review against proposal §10, which the full test suite cannot assert.

## Outcome

Completed: 2026-06-24

Implemented the signed-off FOUNDATIONS alignment for the segment-reconciliation assistance profile and kept the accepted-prose exception bounded to that profile.

Verification: `npm run typecheck`; `npm run lint`; `npm test`; `npm run build`; `git diff --check`.
