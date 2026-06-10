# SPEC019REFINTSTR-008: Stress-case integration capstone

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — new stress cases in `docs/stress-suite.md`, matrix rows in `docs/stress-coverage-matrix.md`, and representative case→code assertions in `validation-stress-mapping.test.ts`; no production behavior change.
**Deps**: SPEC019REFINTSTR-003, SPEC019REFINTSTR-004, SPEC019REFINTSTR-005, SPEC019REFINTSTR-006

## Problem

SPEC-019 D8 (stress portion) + Verification: every new diagnostic code from the referential/structural rule family needs a representative stress case exercising it end-to-end through `runValidation`, plus a coverage-matrix row, plus a realistic migration-shaped fixture proving the fail-closed friction on existing projects (Risk 1). This capstone ties the rules from 003–006 to the project's stress-suite conventions; it adds no production logic.

## Assumption Reassessment (2026-06-10)

1. `packages/core/test/validation-stress-mapping.test.ts` exercises stress cases via `it.each([[name, DIAGNOSTIC_CODES.x, mutate], …])`, building a snapshot with `buildValidationSnapshot`, running `runValidation` twice, and asserting determinism (`first.toEqual(second)`), `isBlocked`, and that the expected code is in `blockers`. Warning codes are asserted against `warnings` instead. After 001, `projectRecordIndex` is optional on `BuildValidationSnapshotInput`, so reference cases must set it to distinguish dangling (absent) from unselected (present-but-not-selected).
2. `docs/stress-suite.md` uses `## Case N — <title>` narratives; `docs/stress-coverage-matrix.md` carries a `| Case N | … |` row per case under a "Same-change maintenance rule" requiring the matrix row to land with the case in the same revision.
3. Cross-artifact boundary under audit: the capstone binds to the `DIAGNOSTIC_CODES` values that 003–006 add — it must run after those tickets so the codes exist. It introduces no rule logic; it exercises the rules those tickets composed.
4. FOUNDATIONS §11: representative deterministic stress coverage of each new code — dangling, unselected-required, unselected-optional, type-mismatch, cast-band duplication, onstage/offstage overlap, status-location contradiction, object incoherence, self-relationship, orphaned voice pressure. Blocker codes asserted in `blockers`, warning codes in `warnings`; warnings never gate (§29.5).
5. Determinism: the existing mapping test already asserts `first.toEqual(second)` per case; new cases inherit that, proving the new rules are deterministic for identical snapshots.

## Architecture Check

1. Extending the existing `it.each` mapping test plus the two stress docs is the idiomatic capstone for this repo — it reuses the established representative-coverage pattern rather than inventing a new harness, and keeps each new code's proof co-located with the sibling hard-fail cases already there.
2. No backwards-compatibility aliasing/shims: cases are added; no existing case or assertion is reworked except to extend the parameter table.

## Verification Layers

1. Each new blocker code has a stress case that blocks -> `validation-stress-mapping.test.ts` `it.each` row asserting the code in `blockers`.
2. Each new warning code (unselected-optional, orphaned voice pressure) has a case that warns without blocking -> mapping-test row asserting the code in `warnings` and `isBlocked === false` for that isolated mutation.
3. Stress-suite ↔ matrix sync -> grep-proof that every new `## Case N` has a matching matrix row (same-change rule).
4. Migration-shaped friction -> a case modeling an existing project whose previously-compiling brief now surfaces a referential blocker (Risk 1).

## What to Change

### 1. Mapping-test cases (`packages/core/test/validation-stress-mapping.test.ts`)

Add `it.each` rows for each new diagnostic code, each with a `mutate` that constructs the minimal triggering snapshot (setting `projectRecordIndex` where dangling-vs-unselected must be distinguished). Assert blockers in `blockers`, warnings in `warnings`. Re-enumerate any expected counts from the fixture rather than hardcoding.

### 2. Stress-suite narratives (`docs/stress-suite.md`)

Add `## Case N — …` entries covering the new diagnostic codes and a realistic migration-shaped fixture (an existing project whose unselected onstage entity now blocks).

### 3. Coverage matrix (`docs/stress-coverage-matrix.md`)

Add the matching `| Case N | … |` rows in the same revision, naming the implemented v1 capability (the new diagnostic codes).

## Files to Touch

- `packages/core/test/validation-stress-mapping.test.ts` (modify)
- `docs/stress-suite.md` (modify)
- `docs/stress-coverage-matrix.md` (modify)

## Out of Scope

- The rule implementations themselves (003–006) and the D7 build-failure path (007 owns its server/web tests).
- `docs/compiler-contract.md`, `docs/story-record-schema.md`, `docs/validation-rule-inventory.md`, and `packages/core/src/version.ts` (009 owns the contract/schema/version docs; the inventory rows land with each rule ticket).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core -- validation-stress-mapping` — every new code has a representative case asserting the correct severity bucket and determinism.
2. Grep-proof: each new `## Case N` in `docs/stress-suite.md` has a matching `| Case N |` row in `docs/stress-coverage-matrix.md`.
3. `npm run lint && npm run typecheck && npm test` — full gate green with the new cases.

### Invariants

1. Every diagnostic code added by 003–006 is exercised by at least one stress case in the mapping test.
2. Each stress case is deterministic (`runValidation` twice yields equal results), and every new stress-suite case has a matrix row.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-stress-mapping.test.ts` (modify) — representative case per new code, blocker/warning buckets, migration-shaped fixture.

### Commands

1. `npm test --workspace @loom/core -- validation-stress-mapping`
2. `npm run lint && npm run typecheck && npm test` — full pipeline confirms the stress cases run against the real rule registry assembled by 003–006.
