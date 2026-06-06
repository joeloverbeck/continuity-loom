# SPEC014POLREGHAR-008: Phase-14 gate capstone + bookkeeping

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — updates `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (governing-doc bookkeeping); no production code.
**Deps**: SPEC014POLREGHAR-001, SPEC014POLREGHAR-002, SPEC014POLREGHAR-003, SPEC014POLREGHAR-004, SPEC014POLREGHAR-005, SPEC014POLREGHAR-006, SPEC014POLREGHAR-007

## Problem

SPEC-014 §Verification requires that, after all hardening tickets land, the full Phase-14 gate is exercised end-to-end and the implementation-order ledger records Phase 14 as done. This capstone introduces no new production logic; it runs the verification SPEC-014 enumerates (lint, typecheck, the new regression suites, the docs proofs) and flips the Phase 14 status in `docs/requirements-version-1/IMPLEMENTATION-ORDER.md`, marking its gate items satisfied. It is the single trailing ticket whose passing means "Phase 14 — the final v1 phase — is complete."

## Assumption Reassessment (2026-06-06)

1. `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` has a `## Phase 14 — Polish, regression hardening, and documentation` section (line 269) whose **Phase gate** lists exactly seven items: compiler golden outputs stabilized; validation diagnostics refined for clarity; storage backup/migration documented and hardened; UI performance acceptable for dense record projects; API-key leakage tests pass; accepted-prose exclusion regressions pass; user-facing documentation explains the loop/ownership/preview/OpenRouter/lifecycle/manual updates. These map 1:1 onto tickets 001–007 (validation-diagnostics→002, golden→001, storage→003+007, UI→004, leakage→005, accepted-prose→006, docs→007).
2. Completed phases use a `Status: ✅ Implemented via SPEC-0NN (YYYY-MM-DD).` line (e.g. Phase 13 → `✅ Implemented via SPEC-013 (2026-06-06)`); this ticket follows that exact convention for Phase 14 and marks the gate items satisfied in the doc's completed-phase style. The current Phase 14 section carries no implemented marker (confirmed 2026-06-06).
3. Cross-artifact boundary under audit: the capstone exercises (does not modify) the surfaces tickets 001–006 add and the docs ticket 007 adds; its only writable surface is the implementation-order ledger. Per the capstone shape, it does **not** list the upstream tickets' files in Files to Touch. `Deps` enumerates the full leaf set 001–007 because they are mutually-independent parallel siblings (no single transitive head reaches all).
4. FOUNDATIONS principle under audit: §29 alignment checklist — Phase 14 is terminal and armors the §29 hard rules (§29.4 determinism, §29.5 validation, §29.8 accepted-prose, §29.9 secrets, §29.10 data ownership) with regressions rather than deferring any clearance. The capstone confirms that armor is in place (the suites pass) before recording completion; no §29 hard-fail is introduced.
5. No mismatch: the Phase 14 heading/gate-item wording and the Phase 13 status-line convention were read from `IMPLEMENTATION-ORDER.md` on 2026-06-06.

## Architecture Check

1. A single trailing capstone is cleaner than scattering "mark done" edits across the implementation tickets: the ledger flip must be gated on *every* upstream surface existing coherently, which only this ticket (depending on all of 001–007) can guarantee. Merging the docs-bookkeeping (status flip) into the capstone avoids a needless extra ticket since both gate on the same leaf set.
2. No backwards-compatibility shims: the capstone runs the real `npm run lint/typecheck/test` and real grep-proofs; it adds no bespoke verification harness or status-tracking machinery.

## Verification Layers

1. Full gate green → `npm run lint && npm run typecheck && npm test` pass (exercises tickets 001–006 suites + the `@loom/core` import-boundary test) — command proof.
2. Each §Verification bullet → targeted proof: golden (001), clarity-invariant (002), recoverability (003), dense-record (004), leakage (005), accepted-prose (006) test files each run green — command proofs (distinct surfaces, enumerated in Acceptance).
3. Docs landed → `test -f docs/user-guide.md` and `grep -q user-guide.md README.md` (007) — grep-proof.
4. Ledger updated → `grep -q "Implemented via SPEC-014" docs/requirements-version-1/IMPLEMENTATION-ORDER.md` and Phase 14 gate items marked satisfied — grep-proof.

## What to Change

### 1. Exercise the full Phase-14 gate

Run the SPEC-014 §Verification set and confirm green: `npm run lint`, `npm run typecheck`, `npm test`, plus each new regression file from 001–006 and the docs proofs from 007. This ticket adds no test file — it is the manual/CI runbook that confirms the composed pipeline.

### 2. Flip the implementation-order ledger

In `docs/requirements-version-1/IMPLEMENTATION-ORDER.md`, under `## Phase 14 — Polish, regression hardening, and documentation`:

- Add `Status: ✅ Implemented via SPEC-014 (2026-06-06).` matching the Phase 13 convention (use the actual merge date at implementation time).
- Mark the seven phase-gate items satisfied in the doc's completed-phase style.

## Files to Touch

- `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (modify)

## Out of Scope

- Any production code, test, schema, or doc change beyond the ledger flip (the capstone exercises upstream tickets; it does not modify their files).
- Archiving the spec to `archive/specs/` — follow `docs/archival-workflow.md` separately if/when the repo's archival step is invoked; not required by SPEC-014's gate.
- Re-baselining the golden or relaxing any regression to make the gate pass (a failing gate is a real defect routed to the owning ticket).

## Acceptance Criteria

### Tests That Must Pass

1. `npm run lint && npm run typecheck && npm test` — the full Phase-14 suite (all of 001–006 plus existing coverage) is green.
2. `npx vitest run packages/core/test/compiler-golden.test.ts packages/core/test/validation-clarity-invariants.test.ts packages/core/test/accepted-prose-exclusion.test.ts packages/server/src/project-store.recoverability.test.ts packages/server/src/generate-routes.secret-leakage.test.ts packages/web/src/records/RecordBrowser.test.tsx packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx` — every new/extended regression passes.
3. `test -f docs/user-guide.md && grep -q "user-guide.md" README.md && grep -q "Implemented via SPEC-014" docs/requirements-version-1/IMPLEMENTATION-ORDER.md` — docs and ledger reflect completion.

### Invariants

1. Phase 14 is recorded implemented only when every gate item's verification passes (no ledger flip ahead of green).
2. The capstone modifies only the implementation-order ledger; all behavioral proof comes from exercising the upstream tickets' surfaces.

## Test Plan

### New/Modified Tests

1. `None — verification-only capstone; it exercises the regression suites added by tickets 001–006 and the docs added by 007, and records completion in the implementation-order ledger.`

### Commands

1. `npm run lint && npm run typecheck && npm test`
2. `test -f docs/user-guide.md && grep -q "user-guide.md" README.md && grep -q "Implemented via SPEC-014" docs/requirements-version-1/IMPLEMENTATION-ORDER.md`
3. The full-pipeline `npm test` is the correct verification boundary for a capstone — narrower commands would miss cross-package interactions the phase gate must confirm.

## Outcome

Completed: 2026-06-06

What changed:
- Updated `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` to mark Phase 14 implemented via SPEC-014 on 2026-06-06.
- Marked all seven Phase 14 gate items satisfied.

Deviations from original plan:
- None. The capstone modified only the implementation-order ledger.

Verification results:
- Targeted regression bundle passed: 7 files, 33 tests.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 72 files, 429 tests.
- `test -f docs/user-guide.md && grep -q "user-guide.md" README.md && grep -q "Implemented via SPEC-014" docs/requirements-version-1/IMPLEMENTATION-ORDER.md` passed.
