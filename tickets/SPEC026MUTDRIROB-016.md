# SPEC026MUTDRIROB-016: Add durable and physical matrix diagnostic contracts

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — extends the diagnostic contract registry with the durable and physical matrix families; no production behavior change.
**Deps**: SPEC026MUTDRIROB-001, SPEC026MUTDRIROB-013

## Problem

The durable and physical matrix rule families encode field-matrix predicates whose boundaries (`>` / `>=`, equality, negation, `AND` / `OR`) are exactly the comparisons Stryker mutates. A surviving matrix mutant changes which durable/physical contradiction is flagged while staying green. This ticket covers every code and predicate boundary in the two families, extending the SPEC026MUTDRIROB-013 registry.

## Assumption Reassessment (2026-06-20)

1. `packages/core/src/validation/rules/matrix-durable.ts` and `matrix-physical.ts` exist (confirmed this session) and are inside the P3 mutation glob.
2. SPEC-026 §Deliverables D4 + report §8.2/§8.7 define covering every code + predicate boundary in the two matrices; the registry + runner exist from SPEC026MUTDRIROB-013.
3. Cross-artifact boundary under audit: each case extends the independent registry and derives no expected value from `matrix-*.ts` under mutation.
4. FOUNDATIONS principle restated: §11 fail-closed validation + §29.7 physical continuity — physical-matrix blockers strengthen existing continuity guarantees without changing them; durable-matrix governs durable-state contradictions.
5. Fail-closed-validation surface (§11): contracts exercise the matrices but add no rule and change no gate. Any matrix defect a case exposes → separate behavior-fix ticket.

## Architecture Check

1. Covering every predicate boundary per matrix code targets the comparison/boolean mutants precisely; a minimal-defect/repair fixture per code is mutation-tight where a count is not.
2. No backwards-compatibility shims; registry extension only.

## Verification Layers

1. Per-code contract -> baseline clean → minimal defect → exact code/severity/affected → repair removes exactly that diagnostic, for every durable and physical matrix code.
2. Predicate boundaries -> each `>` / `>=` / equality / negation / `AND` / `OR` boundary in the two matrices has a discriminating case.
3. Mutants killed -> `npm run mutation:validation` over `matrix-durable.ts` + `matrix-physical.ts` reports survivors classified.

## What to Change

### 1. Matrix contract cases

Extend `packages/core/test/validation-diagnostic-contract.test.ts` and the registry with durable + physical matrix cases: one minimal-defect/repair fixture per code and a discriminating case at each predicate boundary.

### 2. Survivor classification

Run `npm run mutation:validation` scoped to `matrix-durable.ts` + `matrix-physical.ts`; classify every survivor.

## Files to Touch

- `packages/core/test/validation-diagnostic-contract.test.ts` (modify) — add durable/physical matrix cases
- `packages/core/test/support/diagnostic-contract.ts` (modify) — register matrix cases

## Out of Scope

- Knowledge/voice matrices (SPEC026MUTDRIROB-017); security/warning/taxonomy (SPEC026MUTDRIROB-018).
- Universal/referential/internal/structural families (SPEC026MUTDRIROB-015).
- Any change to matrix rule production logic.

## Acceptance Criteria

### Tests That Must Pass

1. `vitest run packages/core/test/validation-diagnostic-contract.test.ts` passes with the new matrix cases.
2. `npm run mutation:validation` shows zero unclassified survivors in `matrix-durable.ts` + `matrix-physical.ts`.
3. `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. Every durable/physical matrix code has a contract case asserting exact severity + affected target.
2. Each predicate boundary in the two matrices has a discriminating case.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-diagnostic-contract.test.ts` — durable/physical matrix cases (modify).
2. `packages/core/test/support/diagnostic-contract.ts` — registry extension (modify).

### Commands

1. `vitest run packages/core/test/validation-diagnostic-contract.test.ts` — targeted run.
2. `npm run mutation:validation` — survivor classification for the two matrix files.
3. Per-boundary cases are the correct boundary: matrix predicates are exactly the comparisons mutation synthesizes.
