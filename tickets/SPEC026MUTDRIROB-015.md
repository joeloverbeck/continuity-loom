# SPEC026MUTDRIROB-015: Add universal, referential, internal, and structural diagnostic contracts

**Status**: PENDING
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
- Engine/readiness/applicability properties (SPEC026MUTDRIROB-014).
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
