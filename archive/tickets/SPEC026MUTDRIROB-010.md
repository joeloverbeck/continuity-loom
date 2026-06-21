# SPEC026MUTDRIROB-010: Mutation-tighten P2 ideation operator eligibility

**Status**: COMPLETED (2026-06-21)
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — adds an independent operator-eligibility truth table and presence-vector property tests; no production behavior change.
**Deps**: SPEC026MUTDRIROB-001

## Problem

The ideation compiler defines fixed operators with record-type eligibility, minimum-record requirements, conjunctions, reveal-permission requirements, and dormant-slot eligibility. Mutants here — `AND` weakened to `OR`, a minimum record count reduced, a reveal-permission fallback inverted, an operator's required type dropped — silently change which operators are offered while example tests stay green. This ticket pins eligibility with an independent truth table and generated presence-vector properties, and classifies survivors.

## Assumption Reassessment (2026-06-20)

1. `packages/core/src/compiler/ideation/operators.ts` and `ideation/types.ts` exist (confirmed this session) and are inside the P2 mutation glob; `sections/ideation.ts` is also P2 scope.
2. SPEC-026 §Deliverables C1 + report §7.3.C define the truth-table dimensions (required types, minimum records per type, conjunctions, reveal-permission, dormant eligibility); `docs/ideation-prompt-template.md` is the operator authority.
3. Cross-artifact boundary under audit: the operator truth table is **test authority derived from `docs/ideation-prompt-template.md`**, not generated from `operators.ts` — deriving it from the code under mutation would make the mutant equivalent.
4. FOUNDATIONS principle restated: §9.1 — the ideation prompt is a distinct deterministic assistance-prompt contract; eligibility predicates are part of that contract and are pinned without changing production source.
5. Deterministic-compilation / reveal surface (§8, §15): the tests mutate `operators.ts` in the sandbox only and add no production change; confirm the eligibility and reveal-permission predicates stay deterministic and introduce no secret-leak path. Any mismatch against the documented template → separate behavior-fix ticket.

## Architecture Check

1. An independent operator truth table built from the documented template is the only oracle that can catch a weakened conjunction or a reduced minimum; the presence-vector property exhaustively exercises it.
2. No backwards-compatibility shims; tests + self-contained generators only.

## Verification Layers

1. Eligibility correctness -> for generated record-presence vectors, the eligible operator set equals the independent truth table.
2. Per-operator minima -> named minimal examples for every operator and every multi-condition boundary.
3. Mutants killed -> `npm run mutation:ideation` over `operators.ts` reports zero unclassified survivors.

## What to Change

### 1. Operator truth table + properties

Add `packages/core/test/ideation-operator-eligibility.test.ts`: an independent truth table (one row per fixed operator: required types, minimum records per type, conjunctions, reveal-permission, dormant eligibility) derived from `docs/ideation-prompt-template.md`. For generated presence vectors (self-contained generators in `packages/core/test/support/arbitraries/ideation-records.ts`), assert the eligible operator set equals the table. Add named minimal examples per operator and per multi-condition boundary.

### 2. Survivor classification

Run `npm run mutation:ideation` scoped to `operators.ts`; classify every survivor. Any mismatch against the documented template → separate behavior-fix ticket.

## Files to Touch

- `packages/core/test/ideation-operator-eligibility.test.ts` (new)
- `packages/core/test/support/arbitraries/ideation-records.ts` (new) — self-contained ideation-record generators

## Out of Scope

- Slot assignment, citation keys, request rendering, full campaign (SPEC026MUTDRIROB-011, -012).
- Any change to `operators.ts` production logic.

## Acceptance Criteria

### Tests That Must Pass

1. `vitest run packages/core/test/ideation-operator-eligibility.test.ts` passes with the fixed seed.
2. `npm run mutation:ideation` shows zero unclassified survivors in `operators.ts`.
3. `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. The truth table is derived from `docs/ideation-prompt-template.md`, not from `operators.ts`.
2. The eligible-operator-set property holds for every generated presence vector.

## Test Plan

### New/Modified Tests

1. `packages/core/test/ideation-operator-eligibility.test.ts` — independent truth table + presence-vector property + minimal examples.
2. `packages/core/test/support/arbitraries/ideation-records.ts` — self-contained ideation-record generators (new).

### Commands

1. `vitest run packages/core/test/ideation-operator-eligibility.test.ts` — targeted run.
2. `npm run mutation:ideation` — survivor classification for `operators.ts`.
3. The doc-derived truth table is the correct boundary: it is the only eligibility oracle independent of the mutated code.

## Outcome

Completed 2026-06-21. Added `packages/core/test/ideation-operator-eligibility.test.ts` and `packages/core/test/support/arbitraries/ideation-records.ts`.

The new contract test defines an independent operator truth table derived from `docs/ideation-prompt-template.md`, generates ideation record presence vectors, and checks assigned operator IDs, names, definitions, multi-condition boundaries, revealable-secret preference, and dormant-slot eligibility for every documented dormant record type. No production code changed.

Verification:

1. `npx vitest run packages/core/test/ideation-operator-eligibility.test.ts` — passed, 27 tests.
2. `npm run mutation:ideation -- --force --mutate packages/core/src/compiler/ideation/operators.ts` — passed with `operators.ts` at 100.00 mutation score: 69 killed, 19 compile-error mutants, 0 survived, 0 no-coverage, 0 timeout. No unclassified survivors remain in `operators.ts`.
3. `npm run lint` — passed.
4. `npm run typecheck` — passed.
5. `npm test` — passed, 143 files / 1118 tests.
6. `npm run build` — passed under escalation due prior sandbox write restrictions; Vite emitted the existing chunk-size warning.

No browser smoke was run because this ticket changes only core test coverage and self-contained test arbitraries.
