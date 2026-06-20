# SPEC026MUTDRIROB-014: Mutation-tighten P3 engine, readiness, applicability, and reference classification

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Large
**Engine Changes**: Yes — adds gate/sort/dedupe/immutability/applicability/reference-classification property tests; no production behavior change.
**Deps**: SPEC026MUTDRIROB-001, SPEC026MUTDRIROB-013

## Problem

The validation engine splits blockers from warnings, derives preview/generate gating, filters by prompt kind, classifies references, sorts and freezes diagnostics. Mutants here — a warning closing a gate, provider config blocking preview as well as generate, a reference class confused, dedupe/stable-sort weakened, diagnostics returned mutable — silently open or close a generation gate while staying green. This ticket pins the gate, applicability, reference, ordering, dedupe, and immutability behavior with properties and classifies survivors.

## Assumption Reassessment (2026-06-20)

1. `packages/core/src/validation/{engine,readiness,kind-applicability,reference-classification,snapshot}.ts` exist (confirmed this session) and are inside the P3 mutation glob.
2. SPEC-026 §Deliverables D2 + report §8.4/§8.6 define the required properties (every blocker ⇒ `isBlocked`; warning-only never blocks; preview/generate distinction; provider config affects generation not preview; prompt-kind applicability; stable sort; dedupe across duplicate traversal paths; immutability; deterministic repeat-validation; exact reference classes).
3. Cross-artifact boundary under audit: the prompt-kind applicability matrix is built **independently** from `docs/validation-rule-inventory.md` + `docs/compiler-contract.md` + `docs/ideation-prompt-template.md`, not from `kind-applicability.ts`.
4. FOUNDATIONS principle restated: §11 fail-closed validation + §29.5 gating — blockers gate preview and send; warnings never become prompt instructions; properties pin this without changing rules.
5. Fail-closed-validation surface (§11): the tests mutate engine/readiness/applicability/reference-classification in the sandbox only; no rule or gate changes. A surviving gate mutant that reflects a real defect → CRITICAL behavior-fix ticket.

## Architecture Check

1. Exact gate properties (every blocker ⇒ `isBlocked`; warning-only never blocks; provider config affects generation not preview) plus an independent applicability matrix directly attack the boolean/comparison mutants in the gating path — stronger than checking a blocker count.
2. No backwards-compatibility shims; tests + harness reuse only.

## Verification Layers

1. Gate exactness -> properties: every blocker makes `isBlocked` true; warning-only never makes `isBlocked` true; preview/generate gates follow the documented distinction; missing provider config affects generation where documented, not preview.
2. Applicability matrix -> independent prose/ideation table asserts universal blockers apply to both kinds; prose-only continuation blockers do not block ideation; ideation readiness does not require prose-only fields.
3. Ordering/dedupe/immutability -> properties: storage-order permutation leaves the sorted diagnostic value unchanged; duplicate traversal paths do not create duplicate diagnostics; arrays/entries immutable to the documented depth; repeated validation deeply equal; affected identifiers stably ordered.
4. Reference classification -> exact class + downstream code for selected+correct / unselected / dangling / wrong-target-type / permutations / archive-remove.
5. Mutants killed -> `npm run mutation:validation` over the five modules reports survivors classified.

## What to Change

### 1. Engine/readiness/applicability/reference property tests

Add `packages/core/test/validation-engine.property.test.ts` (gate/sort/dedupe/immutability + applicability matrix) and `packages/core/test/validation-reference-classification.property.test.ts` (exact reference classes + downstream codes), over generated snapshots within practical size limits (reuse `validation-snapshots.ts` from SPEC026MUTDRIROB-013). "No exception" is only a baseline property combined with exact diagnostics for invalid states, never the sole assertion.

### 2. Survivor classification

Run `npm run mutation:validation` scoped to the five modules; classify every survivor. Any gate/classification defect → CRITICAL behavior-fix ticket.

## Files to Touch

- `packages/core/test/validation-engine.property.test.ts` (new)
- `packages/core/test/validation-reference-classification.property.test.ts` (new)

## Out of Scope

- The diagnostic contract harness itself (SPEC026MUTDRIROB-013).
- Per-family diagnostic contracts (SPEC026MUTDRIROB-015..018) and cross-pillar contracts (SPEC026MUTDRIROB-019).
- Any change to validation production logic.

## Acceptance Criteria

### Tests That Must Pass

1. `vitest run packages/core/test/validation-engine.property.test.ts packages/core/test/validation-reference-classification.property.test.ts` passes with the fixed seed.
2. `npm run mutation:validation` shows zero unclassified survivors in the five modules.
3. `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. Warning-only results never make `isBlocked` true; every blocker does.
2. The applicability matrix is derived from the docs, not from `kind-applicability.ts`.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-engine.property.test.ts` — gate/sort/dedupe/immutability + applicability matrix.
2. `packages/core/test/validation-reference-classification.property.test.ts` — exact reference classes + downstream codes.

### Commands

1. `vitest run packages/core/test/validation-engine.property.test.ts packages/core/test/validation-reference-classification.property.test.ts` — targeted run.
2. `npm run mutation:validation` — survivor classification for the five modules.
3. Gate properties + the independent applicability matrix are the correct boundary: they assert exact gating behavior, not a diagnostic count.
