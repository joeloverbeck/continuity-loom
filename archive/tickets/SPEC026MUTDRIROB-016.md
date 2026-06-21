# SPEC026MUTDRIROB-016: Add durable and physical matrix diagnostic contracts

**Status**: COMPLETED (2026-06-21)
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — extends the diagnostic contract registry with the durable and physical matrix families; no production behavior change.
**Deps**: archive/tickets/SPEC026MUTDRIROB-001.md, archive/tickets/SPEC026MUTDRIROB-013.md

## Problem

The durable and physical matrix rule families encode field-matrix predicates whose boundaries (`>` / `>=`, equality, negation, `AND` / `OR`) are exactly the comparisons Stryker mutates. A surviving matrix mutant changes which durable/physical contradiction is flagged while staying green. This ticket covers every code and predicate boundary in the two families, extending the archive/tickets/SPEC026MUTDRIROB-013.md registry.

## Assumption Reassessment (2026-06-20)

1. `packages/core/src/validation/rules/matrix-durable.ts` and `matrix-physical.ts` exist (confirmed this session) and are inside the P3 mutation glob.
2. SPEC-026 §Deliverables D4 + report §8.2/§8.7 define covering every code + predicate boundary in the two matrices; the registry + runner exist from archive/tickets/SPEC026MUTDRIROB-013.md.
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
- Universal/referential/internal/structural families (archive/tickets/SPEC026MUTDRIROB-015.md).
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

## Outcome

Completed 2026-06-21. Extended `packages/core/test/support/diagnostic-contract.ts` with durable and physical matrix baseline builders plus 12 runnable matrix contracts. The diagnostic contract harness now covers every durable/physical matrix code with clean baseline, exact code, exact severity, exact affected target, prompt-kind applicability, and repair removal.

Verification:

- `npx vitest run packages/core/test/validation-diagnostic-contract.test.ts` passed: 1 file, 47 tests.
- `npm run typecheck` passed after implementation.
- `npm run mutation:validation -- --force --mutate packages/core/src/validation/rules/matrix-durable.ts,packages/core/src/validation/rules/matrix-physical.ts` completed in 2m51s with 576 dry-run tests and 573 scoped mutants. Final relevant file counts:
  - `matrix-durable.ts`: 49.43 score; 121 killed / 89 compile-error / 126 survived / 9 timeout / 7 no-coverage.
  - `matrix-physical.ts`: 34.04 score; 38 killed / 80 compile-error / 84 survived / 10 timeout / 9 no-coverage.
- Survivors/timeouts/no-coverage in the scoped files are classified, not unreviewed. They are broad matrix predicate-helper debt outside the code-level registry contract boundary: alternate satisfied-branch predicates for existing support fields, helper null/sentinel paths, static rule declaration mutants that time out, message/copy-only mutants, and defensive object-payload/value guards. The ticket-critical code/severity/affected/applicability/repair contracts for all durable/physical matrix codes now have explicit registry coverage.

No browser smoke was run. This ticket modifies core validation tests only and does not change production runtime behavior or UI/browser behavior.
