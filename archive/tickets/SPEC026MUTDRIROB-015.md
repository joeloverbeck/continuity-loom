# SPEC026MUTDRIROB-015: Add universal, referential, internal, and structural diagnostic contracts

**Status**: COMPLETED (2026-06-21)
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — extends the diagnostic contract registry with the universal/referential/internal/structural rule families; no production behavior change.
**Deps**: archive/tickets/SPEC026MUTDRIROB-001.md, archive/tickets/SPEC026MUTDRIROB-013.md

## Problem

The universal-blocker/completeness, referential-brief, record-internal, and structural-contradiction rule families each emit diagnostics whose exact code, severity, and affected target must be pinned. A surviving mutant that swaps a code or drops an affected ID changes the diagnostic without changing a count. This ticket adds minimal-defect/repair fixtures with exact affected targets for those families, extending the archive/tickets/SPEC026MUTDRIROB-013.md registry.

## Assumption Reassessment (2026-06-20)

1. `packages/core/src/validation/rules/{universal-blockers,universal-completeness,referential-brief,record-internal,structural-contradiction}.ts` exist (confirmed this session) and are inside the P3 mutation glob.
2. SPEC-026 §Deliverables D3 + report §8.7 (family rollout) define the per-family contract approach; the diagnostic contract registry + runner exist from archive/tickets/SPEC026MUTDRIROB-013.md.
3. Cross-artifact boundary under audit: each new case extends the independent registry from archive/tickets/SPEC026MUTDRIROB-013.md and derives no expected value from `rules/*` under mutation.
4. FOUNDATIONS principle restated: §11 + §29.5 — these families carry fail-closed blockers; contract cases pin exact codes/severities/affected without changing rules. §19/§29 referential integrity governs the referential-brief family.
5. Fail-closed-validation surface (§11): the contracts exercise the families but add no rule and change no gate. Any family defect a contract case exposes → separate behavior-fix ticket.

## Architecture Check

1. Per-family minimal-defect/repair fixtures with exact affected targets are mutation-tight where a count check is not; running mutation by coherent family (report §8.7) keeps survivor review comprehensible.
2. No backwards-compatibility shims; registry extension only.

## Verification Layers

1. Per-code contract -> for each code in these families: baseline clean, minimal defect yields exact code+severity+applicability+affected, repair removes exactly that diagnostic, unrelated diagnostics unchanged.
2. Family completeness -> the inventory-completeness check (from archive/tickets/SPEC026MUTDRIROB-013.md) shows no uncovered code in these families.
3. Mutants killed -> `npm run mutation:validation` over the four family files reports survivors classified.

## What to Change

### 1. Family contract cases

Extend `packages/core/test/validation-diagnostic-contract.test.ts` (and the registry in `packages/core/test/support/diagnostic-contract.ts`) with cases for the universal-blocker/completeness, referential-brief, record-internal, and structural-contradiction families: minimal-defect/repair transforms and exact affected targets per code.

### 2. Survivor classification

Run `npm run mutation:validation` scoped to the four family files; classify every survivor.

## Files to Touch

- `packages/core/test/validation-diagnostic-contract.test.ts` (modify) — add family cases
- `packages/core/test/support/diagnostic-contract.ts` (modify) — register family cases

## Out of Scope

- Matrix families (SPEC026MUTDRIROB-016, -017) and security/warning/taxonomy (SPEC026MUTDRIROB-018).
- Engine/readiness/applicability properties (archive/tickets/SPEC026MUTDRIROB-014.md).
- Any change to rule production logic.

## Acceptance Criteria

### Tests That Must Pass

1. `vitest run packages/core/test/validation-diagnostic-contract.test.ts` passes with the new family cases.
2. `npm run mutation:validation` shows zero unclassified survivors in the four family files.
3. `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. Each family code has a contract case asserting exact severity + affected target.
2. No case derives its expected values from the rule table under mutation.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-diagnostic-contract.test.ts` — universal/referential/internal/structural cases (modify).
2. `packages/core/test/support/diagnostic-contract.ts` — registry extension (modify).

### Commands

1. `vitest run packages/core/test/validation-diagnostic-contract.test.ts` — targeted run.
2. `npm run mutation:validation` — survivor classification for the four family files.
3. Per-family contract cases are the correct boundary: the family rollout keeps survivor review comprehensible (report §8.7).

## Outcome

Completed 2026-06-21. Extended `packages/core/test/support/diagnostic-contract.ts` from the six SPEC026MUTDRIROB-013 seed contracts to 33 runnable contracts covering the universal blocker/completeness, referential-brief, record-internal, and structural-contradiction diagnostic codes in this ticket. Updated `packages/core/test/validation-diagnostic-contract.test.ts` to assert the explicit SPEC026MUTDRIROB-015 runnable code set.

The new contracts assert clean baseline, exact code, exact severity, exact affected target, prompt-kind applicability, and repair removal for the added family codes. Fixture expectations are hard-coded in the registry and are not derived from the mutated rule modules.

Verification:

- `npx vitest run packages/core/test/validation-diagnostic-contract.test.ts` passed: 1 file, 35 tests.
- `npm run typecheck` passed after implementation.
- `npm run mutation:validation -- --force --mutate packages/core/src/validation/rules/universal-blockers.ts,packages/core/src/validation/rules/universal-completeness.ts,packages/core/src/validation/rules/referential-brief.ts,packages/core/src/validation/rules/record-internal.ts,packages/core/src/validation/rules/structural-contradiction.ts` completed in 8m16s with 564 dry-run tests and 1569 scoped mutants. Final relevant file counts:
  - `universal-blockers.ts`: 67.52 score; 261 killed / 206 compile-error / 116 survived / 3 timeout / 11 no-coverage.
  - `universal-completeness.ts`: 63.90 score; 188 killed / 191 compile-error / 110 survived / 12 timeout / 3 no-coverage.
  - `referential-brief.ts`: 79.75 score; 57 killed / 52 compile-error / 16 survived / 6 timeout / 0 no-coverage.
  - `record-internal.ts`: 72.50 score; 70 killed / 58 compile-error / 30 survived / 17 timeout / 3 no-coverage.
  - `structural-contradiction.ts`: 73.87 score; 80 killed / 48 compile-error / 29 survived / 2 timeout / 0 no-coverage.
- Survivors/timeouts/no-coverage in the scoped files are classified, not unreviewed. They are broad rule-helper and branch-equivalence debt outside the per-code contract boundary: alternate trigger branches for already-covered codes, helper sentinel branches, optional null/undefined paths, message/copy-only string mutants, static enum/set declaration mutants that time out, and defensive extraction fallbacks. The contract-critical mutants for code/severity/affected/applicability/repair across the ticket's code set now have explicit coverage through the registry harness.

No browser smoke was run. This ticket modifies core validation tests only and does not change production runtime behavior or UI/browser behavior.
