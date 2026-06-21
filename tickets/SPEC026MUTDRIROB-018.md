# SPEC026MUTDRIROB-018: Add security, warning, and remaining taxonomy contracts; run full validation campaign

**Status**: PENDING
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — extends the diagnostic contract registry with the security/warning/remaining families and completes the full P3 mutation campaign; no production behavior change.
**Deps**: archive/tickets/SPEC026MUTDRIROB-001.md, archive/tickets/SPEC026MUTDRIROB-013.md, SPEC026MUTDRIROB-014, SPEC026MUTDRIROB-015, SPEC026MUTDRIROB-016, SPEC026MUTDRIROB-017

## Problem

The security and warning rule families carry the warning/blocker severity distinction and security canaries; the warning family in particular must stay non-gating. A surviving mutant — a warning flipped to a blocker (or vice versa), a security severity changed, a remaining taxonomy code uncovered — silently changes gating or security posture. This ticket pins severity and non-gating behavior, closes inventory gaps, runs/classifies the full P3 campaign, and completes P3 with the reviewed score recorded for the baseline.

## Assumption Reassessment (2026-06-20)

1. `packages/core/src/validation/rules/{security,warnings}.ts` plus `cast-band.ts` / `onstage-cast-band.ts` / `index.ts` / `types.ts` exist (confirmed this session) and are inside the P3 mutation glob; `validation-rule-inventory.test.ts` enforces warnings.ts → warning, every other module → blocker.
2. SPEC-026 §Deliverables D6 + report §8.7 (full validation tree integration pass) define closing inventory gaps and the full campaign; the registry + runner exist from archive/tickets/SPEC026MUTDRIROB-013.md and are extended by -015/-016/-017.
3. Cross-artifact boundary under audit: the one-severity-per-code inventory model — the warning family must resolve to warning and never close a gate; security codes keep their documented severity. Cases derive no expected value from `rules/*`.
4. FOUNDATIONS principle restated: §11 fail-closed validation + §29.5 gating + §29.9 secrets — warnings never become prompt instructions or close gates; security diagnostics preserve the secret/loopback posture at the validation layer.
5. Fail-closed-validation + secret surfaces (§11, §29.9): the campaign mutates the full validation tree in the sandbox only. A surviving warning/blocker conflation or security mutant that reflects a real defect → CRITICAL behavior-fix ticket.

## Architecture Check

1. Pinning severity + non-gating for the warning/security families and running the full tree as an integration pass closes the inventory and catches cross-family mutants the per-family tickets could not; the inventory-completeness check guarantees no code is left uncovered.
2. No backwards-compatibility shims; registry extension + campaign only.

## Verification Layers

1. Severity + non-gating -> warning-family codes resolve to warning and never close preview/generate; security codes keep documented severity (exact contract cases).
2. Inventory closed -> the completeness check (archive/tickets/SPEC026MUTDRIROB-013.md) reports zero uncovered codes across the whole inventory.
3. Full P3 adequacy -> `npm run mutation:validation` across the full P3 glob meets the 95 break floor with zero unclassified survivors.

## What to Change

### 1. Security/warning/remaining contract cases

Extend `packages/core/test/validation-diagnostic-contract.test.ts` and the registry with security, warning, and any remaining taxonomy codes (cast-band etc.): pin exact severity and, for warnings, non-gating behavior; close all inventory-completeness gaps.

### 2. Full P3 campaign

Run `npm run mutation:validation` across the full P3 glob; classify every survivor. Record the reviewed P3 score for the baseline (consumed by SPEC026MUTDRIROB-022).

## Files to Touch

- `packages/core/test/validation-diagnostic-contract.test.ts` (modify) — add security/warning/remaining cases
- `packages/core/test/support/diagnostic-contract.ts` (modify) — register remaining cases

## Out of Scope

- Cross-pillar contracts (SPEC026MUTDRIROB-019); activating floors/ratchets (SPEC026MUTDRIROB-022).
- Engine/readiness properties (SPEC026MUTDRIROB-014) and other family contracts (SPEC026MUTDRIROB-015..017).
- Any change to rule production logic.

## Acceptance Criteria

### Tests That Must Pass

1. `vitest run packages/core/test/validation-diagnostic-contract.test.ts` passes with the security/warning/remaining cases; the completeness check shows zero uncovered codes.
2. `npm run mutation:validation` over the full P3 glob reports zero unclassified survivors and meets the 95 break floor.
3. `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. Every warning-family code resolves to warning and never closes a gate.
2. Every diagnostic code in the exported inventory has an independent exact contract case or an explicitly justified non-rule classification.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-diagnostic-contract.test.ts` — security/warning/remaining cases (modify).
2. `packages/core/test/support/diagnostic-contract.ts` — registry extension (modify).

### Commands

1. `vitest run packages/core/test/validation-diagnostic-contract.test.ts` — targeted run.
2. `npm run mutation:validation` — full P3 campaign + survivor classification.
3. The full-glob validation campaign is the P3 acceptance boundary; the completeness check guarantees coverage of the whole inventory.
