# SPEC026MUTDRIROB-013: Introduce the P3 diagnostic contract harness

**Status**: COMPLETED (2026-06-21)
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — adds the independent diagnostic-contract fixture schema, an inventory-completeness check, and first contract cases; no production behavior change.
**Deps**: archive/tickets/SPEC026MUTDRIROB-001.md

## Problem

The validation engine's primary risks are silently-wrong diagnostics — a severity flip, a substituted/omitted code, a wrong affected target. Checking a total blocker count or a message substring does not catch these. This ticket introduces the diagnostic contract harness: an implementation-independent registry of `code → {severity, promptKinds, buildValidBaseline, introduceMinimalDefect, repairDefect, expectedAffected}` cases plus an inventory-completeness check, and seeds the first cases for engine/readiness/universal diagnostics. It is the foundation every later P3 family ticket extends.

## Assumption Reassessment (2026-06-20)

1. The validation tree exists at `packages/core/src/validation/**` (confirmed this session); the diagnostic-code inventory drift test `packages/core/test/validation-rule-inventory.test.ts` and `docs/validation-rule-inventory.md` exist and enforce one severity per code (warnings.ts → warning, every other rule module → blocker).
2. SPEC-026 §Deliverables D1 + report §8.3 define the fixture schema and the defect→exact-diagnostic→repair relation; SPEC-026 §Risks resolves the open question — the completeness check reads the **exported** diagnostic-code inventory used by the existing drift test, but must **not** derive expected severity/applicability/affected from the production rule table.
3. Cross-artifact boundary under audit: the registry is independent of rule implementation; it may compare its keys with the exported inventory (to fail when a new code lacks a contract case) but derives no expected values from `rules/*`.
4. FOUNDATIONS principle restated: §11 / §28.8 — fail-closed validate-and-block is the product differentiator; the harness pins exact severity/applicability/affected without changing any rule. §29.5 (validation + gating) governs.
5. Fail-closed-validation surface (§11): the harness exercises the validator but adds no rule and changes no gate; confirm it introduces no path that weakens fail-closed behavior. Any code whose contract case exposes a real defect → separate behavior-fix ticket.

## Architecture Check

1. A manually-curated, implementation-independent contract registry with a minimal-defect/repair transform per code is far more mutation-tight than count/substring checks, and the inventory-completeness check forces every future code to carry a contract case — cleaner than ad-hoc per-rule tests.
2. No backwards-compatibility shims; the registry derives no expected value from the rule table under mutation.

## Verification Layers

1. Harness shape -> the fixture schema compiles and each case exposes `buildValidBaseline`/`introduceMinimalDefect`/`repairDefect`/`expectedAffected`.
2. Inventory completeness -> the harness compares its keys against the exported diagnostic-code inventory and fails when a code lacks a contract case.
3. First cases pass the defect→diagnostic→repair relation -> for each seeded code: baseline clean, minimal defect yields the exact code+severity+applicability+affected, repair removes exactly that diagnostic, unrelated diagnostics unchanged.
4. Mutants killed -> `npm run mutation:validation` over `engine.ts`/`readiness.ts` (seeded portion) reports survivors classified.

## What to Change

### 1. Diagnostic contract fixture schema + registry

Add `packages/core/test/support/diagnostic-contract.ts`: the fixture type and a registry keyed by code. Add `packages/core/test/validation-diagnostic-contract.test.ts`: the inventory-completeness check (keys vs the exported inventory) and the per-case defect→exact-diagnostic→repair runner. Build inputs with self-contained generators (`packages/core/test/support/arbitraries/validation-snapshots.ts`).

### 2. First cases

Seed contract cases for engine/readiness/universal diagnostics; assert exact code, severity, prompt-kind applicability, and affected target per case. Classify the survivors in the seeded portion; later family tickets extend the registry.

## Files to Touch

- `packages/core/test/support/diagnostic-contract.ts` (new)
- `packages/core/test/validation-diagnostic-contract.test.ts` (new)
- `packages/core/test/support/arbitraries/validation-snapshots.ts` (new) — self-contained validation-snapshot generators

## Out of Scope

- Engine/readiness/applicability/reference property tests (SPEC026MUTDRIROB-014).
- Family contracts for universal/referential/internal/structural/matrix/security (SPEC026MUTDRIROB-015..018).
- Any change to validation rule production logic.

## Acceptance Criteria

### Tests That Must Pass

1. `vitest run packages/core/test/validation-diagnostic-contract.test.ts` passes; the inventory-completeness check fails if a code lacks a contract case.
2. The seeded engine/readiness/universal cases satisfy the defect→exact-diagnostic→repair relation.
3. `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. The registry derives no expected severity/applicability/affected from the production rule table.
2. The completeness check covers every code in the exported inventory.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-diagnostic-contract.test.ts` — completeness check + defect→diagnostic→repair runner.
2. `packages/core/test/support/diagnostic-contract.ts` — fixture schema + registry (new).
3. `packages/core/test/support/arbitraries/validation-snapshots.ts` — self-contained snapshot generators (new).

### Commands

1. `vitest run packages/core/test/validation-diagnostic-contract.test.ts` — targeted harness run.
2. `npm run mutation:validation` — survivor classification for the seeded engine/readiness portion.
3. The contract harness is the foundational P3 oracle; later family tickets extend the same registry, so it is built and verified first.

## Outcome

Completed 2026-06-21. Added `packages/core/test/support/diagnostic-contract.ts`, `packages/core/test/validation-diagnostic-contract.test.ts`, and `packages/core/test/support/arbitraries/validation-snapshots.ts`.

The new harness has an explicit registry entry for every exported `DIAGNOSTIC_CODES` value. Six runnable seed contracts cover foundational engine/readiness/universal diagnostics: `missing-story-config`, `missing-current-authoritative-state`, `missing-manual-directive`, `missing-immediate-handoff`, `missing-constitutional-section`, and `pov-knowledge-missing`. Non-seeded codes are explicit deferred entries for later P3 family tickets, so a newly exported code without a registry entry fails the completeness check.

Each runnable contract asserts a clean baseline, a minimal defect producing exactly one diagnostic with expected code/severity/affected target, prompt-kind readiness applicability, and repair that removes the diagnostic. The expected severity/applicability/affected values are manually declared in the contract registry, not derived from validation rules.

Verification:

1. `npx vitest run packages/core/test/validation-diagnostic-contract.test.ts` — passed, 8 tests.
2. `npm run mutation:validation -- --force --mutate packages/core/src/validation/engine.ts,packages/core/src/validation/readiness.ts,packages/core/src/validation/rules/universal-completeness.ts,packages/core/src/validation/rules/universal-blockers.ts` — completed as a broad seeded-file baseline: 570 killed, 539 compile-error mutants, 365 survived, 76 timeout, 22 no-coverage.
   - File counts: `engine.ts` 25 killed / 13 compile-error / 3 survived; `readiness.ts` 112 killed / 131 compile-error / 117 survived / 62 timeout / 8 no-coverage; `universal-blockers.ts` 245 killed / 206 compile-error / 132 survived / 3 timeout / 11 no-coverage; `universal-completeness.ts` 188 killed / 189 compile-error / 113 survived / 11 timeout / 3 no-coverage.
   - Classification: this ticket establishes the harness and seed cases; the broad survivors/timeouts are expected baseline debt in rule/readiness branches outside the six seeded contracts and are deferred to SPEC026MUTDRIROB-014 through SPEC026MUTDRIROB-018, which extend this registry by family.
3. `npm run lint` — passed.
4. `npm run typecheck` — passed.
5. `npm test` — passed, 147 files / 1146 tests.
6. `npm run build` — passed under escalation due prior sandbox write restrictions; Vite emitted the existing chunk-size warning.

No browser smoke was run because this ticket changes only core validation test harnesses and test fixtures.
