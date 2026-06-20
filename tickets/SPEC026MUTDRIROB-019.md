# SPEC026MUTDRIROB-019: Add cross-pillar generated contracts

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — adds cross-pillar validation→compilation contract tests; no production behavior change.
**Deps**: SPEC026MUTDRIROB-009, SPEC026MUTDRIROB-012, SPEC026MUTDRIROB-018

## Problem

The three pillars can each be internally tight yet still mis-cooperate at their seams: a clean snapshot must compile, a blocker must prevent the documented send action and never become prompt text, a warning-only transform must leave compilation available and stay out of the prompt, and compilation must never mutate the snapshot validation just evaluated. This ticket adds a small generated cross-pillar suite asserting those relations, without duplicating server behavior.

## Assumption Reassessment (2026-06-20)

1. The prose compiler (`compile-prompt.ts`), ideation compiler, and validation engine exist and are individually hardened by SPEC026MUTDRIROB-009 (P1), -012 (P2), -018 (P3) — hence the Deps on those three pillar-completion tickets.
2. SPEC-026 §Deliverables D7 + report §8.8 define the cross-pillar relations (clean-prose-readiness → compiles; blocker → prevents send + not prompt text; warning-only → compilation available + not in prompt; clean ideation-ready → deterministic grounded prompt; compilation never mutates the validated snapshot).
3. Cross-artifact boundary under audit: this suite crosses the locked pillars **without duplicating server behavior** — it exercises `@loom/core` validation + compilation only, reusing the self-contained snapshot generators from Phase B/D.
4. FOUNDATIONS principle restated: §8 determinism + §11 fail-closed gating + §10 context firewall — a blocker is not converted to prompt text and a warning never enters the prompt; properties pin the seam without changing production source.
5. Determinism + fail-closed surfaces (§8, §11): the tests exercise the real pillars but add no production change; "compilation never mutates the validated snapshot" is asserted via deep-freeze. Any seam defect → behavior-fix ticket.

## Architecture Check

1. A small generated cross-pillar suite catches integration mutants (a blocker leaking into prompt text, compilation mutating the snapshot) that single-pillar campaigns cannot; reusing core-only generators keeps it free of server duplication.
2. No backwards-compatibility shims; tests + generator reuse only.

## Verification Layers

1. Clean → compiles -> every generated snapshot clean for prose readiness compiles without an internal error.
2. Blocker gating -> a blocker-producing defect prevents the documented preview/send action and is not converted into prompt text.
3. Warning non-instruction -> a warning-only transform leaves prompt compilation available and does not insert the warning into the prompt.
4. Ideation determinism + snapshot purity -> a clean ideation-ready snapshot yields a deterministic grounded prompt; compilation never mutates the validated snapshot (deep-freeze assertion).

## What to Change

### 1. Cross-pillar contract suite

Add `packages/core/test/cross-pillar-contracts.test.ts`: the five relations above over generated valid/defective snapshots (reuse `validation-snapshots.ts` + `prose-snapshots.ts`). Assert clean-validation→compilation, blocker-gate (not prompt text), warning-non-instruction, ideation determinism, and snapshot non-mutation.

### 2. Classification

Any survivor surfaced by the existing pillar campaigns over these seams is classified under the relevant pillar ticket; this ticket adds the cross-pillar relations and is gated by the full-pillar campaigns (D7 follows B5/C3/D6).

## Files to Touch

- `packages/core/test/cross-pillar-contracts.test.ts` (new)

## Out of Scope

- Server snapshot-builder behavior (deferred S1 follow-up — report §4).
- Activating floors/ratchets (SPEC026MUTDRIROB-022).
- Any change to compiler/validator production logic.

## Acceptance Criteria

### Tests That Must Pass

1. `vitest run packages/core/test/cross-pillar-contracts.test.ts` passes with the fixed seed.
2. `npm run lint && npm run typecheck && npm test` pass.
3. The prose and ideation goldens remain unchanged.

### Invariants

1. A blocker never becomes prompt text; a warning never enters the prompt.
2. Compilation never mutates the snapshot validation evaluated (deep-freeze holds).

## Test Plan

### New/Modified Tests

1. `packages/core/test/cross-pillar-contracts.test.ts` — clean→compiles, blocker-gate, warning-non-instruction, ideation-determinism, snapshot-purity relations.

### Commands

1. `vitest run packages/core/test/cross-pillar-contracts.test.ts` — targeted cross-pillar run.
2. `npm test` — full suite incl. unchanged goldens.
3. A core-only cross-pillar suite is the correct boundary: it proves the validation↔compilation seam without duplicating server behavior.
