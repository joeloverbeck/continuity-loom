# SPEC013TAMDEMPRO-005: Stress coverage matrix doc + per-risk-area capability tests

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — new `docs/stress-coverage-matrix.md`; new core capability test backing each risk area (no production logic)
**Deps**: SPEC013TAMDEMPRO-001

## Problem

SPEC-013 D5 requires an auditable mapping of all 26 conceptual stress-suite cases to the implemented v1 capability / validation rule that supports each, backed by a per-risk-area capability test. This proves the implemented system actually covers the conceptual stress suite rather than only the happy path (`docs/stress-suite.md` failure mode: "demo validates only happy path"; "stress suite treated as implementation tickets").

## Assumption Reassessment (2026-06-06)

1. `docs/stress-suite.md` defines Case 1–26 and a 14-row risk/validation-surface matrix (`docs/stress-suite.md:20-35`). The supporting v1 capabilities already exist: validation rule codes in `packages/core/src/validation/types.ts`; the deterministic compiler `compilePrompt` + `SECTION_ORDER` (`packages/core/src/compiler/compile-prompt.ts`, exported at `packages/core/src/index.ts:16`); record/brief schema fields in `packages/core/src/records/*`. The matrix maps the 26 cases; capability tests are organized per the 14 risk areas (the spec's chosen test granularity — the demo "does not need to instantiate every case," `DEMO-PROJECT-AND-STRESS-COVERAGE.md:168`).
2. SPEC-013 (reassessed in-session 2026-06-06) §Approach 5 + §Deliverables fix this as `docs/stress-coverage-matrix.md` (26-case → v1-capability audit) plus a per-risk-area capability test. The matrix's source of truth is `docs/stress-suite.md` (not the versioned `stress-suite(8).md` filename the source doc cites — reassessment already normalized the path).
3. Shared boundary under audit: the matrix's "v1 capability" column references concrete engine surfaces (validation rule codes, schema fields, compiler sections). Each referenced capability must resolve in the codebase, and each risk area must have a backing test — matrix↔engine↔test parity. The demo fixture (SPEC013TAMDEMPRO-001) is the valid baseline several risk-area assertions reuse (physical continuity, POV/secrets, object use).
4. FOUNDATIONS principles motivating the audit: §11 (fail-closed validation surfaces back most risk areas) and §8 (deterministic compilation backs the no-prose / stop-boundary / salience areas). Restated before trusting spec narrative.
5. Deterministic-compilation / secret-firewall surfaces exercised: capability assertions touch `compilePrompt` determinism (§8) and the POV/secrets separation rules (§15, `matrix-knowledge.ts`/`universal-blockers.ts`). This ticket adds no validator/compiler and weakens nothing — it asserts existing capabilities; the deterministic compile path and secret firewall are proven, not modified.

## Architecture Check

1. A standalone audit doc + per-risk-area tests (rather than 26 one-per-case tests or no tests) matches the spec's conceptual-coverage intent while keeping the suite reviewable and resistant to drift: if a capability is removed, its risk-area test fails. Sourcing the matrix from `docs/stress-suite.md` keeps a single canonical case list.
2. No backwards-compatibility aliasing/shims: net-new doc + test; no production changes.

## Verification Layers

1. All 26 cases mapped, no gaps -> codebase grep-proof: `docs/stress-coverage-matrix.md` references Case 1…26; a test/grep asserts the full case set is present.
2. Each named v1 capability resolves -> codebase grep-proof / schema validation: every validation code cited resolves in `validation/types.ts`; every compiler section cited is in `SECTION_ORDER`; every schema field cited exists in `packages/core/src/records/*`.
3. Per-risk-area behavioral capability -> validation/compile behavior: each of the 14 risk areas has a representative assertion (e.g. POV/secrets separation blocks a forbidden leak; no-accepted-prose blocks contamination; stop-boundary blocks a chapter request).
4. Compilation determinism -> FOUNDATIONS alignment check (§8): compiling a fixed snapshot twice yields identical output.

## What to Change

### 1. Stress coverage matrix doc

Add `docs/stress-coverage-matrix.md`: a table mapping each of the 26 `docs/stress-suite.md` cases to the implemented v1 capability/validation rule that supports it (citing concrete codes/sections/fields), grouped by the 14 risk areas, with a short coverage note per case. State explicitly that this is conceptual coverage (the demo need not instantiate every case).

### 2. Per-risk-area capability test

Add `packages/core/src/demo/stress-coverage.test.ts`: for each of the 14 risk areas, assert the backing capability exists (code/section/field resolves) and behaves (a representative validate/compile assertion), reusing the demo fixture as the valid baseline where natural. Include a determinism re-compile assertion.

## Files to Touch

- `docs/stress-coverage-matrix.md` (new)
- `packages/core/src/demo/stress-coverage.test.ts` (new)

## Out of Scope

- Turning stress cases into implementation tickets or plot templates (spec §Non-goals / §Out of Scope).
- Adding or changing any validation rule, compiler section, or schema field — coverage audit only (spec §Out of Scope).
- Blocker recipes and their tests (SPEC013TAMDEMPRO-004).
- End-to-end accept/reminder capstone (SPEC013TAMDEMPRO-006).

## Acceptance Criteria

### Tests That Must Pass

1. `npx vitest run packages/core/src/demo/stress-coverage.test.ts` — each risk area's capability resolves and behaves; compilation is deterministic.
2. `grep -c '^| Case' docs/stress-coverage-matrix.md` (or equivalent) confirms all 26 cases are present, and every cited validation code resolves in `packages/core/src/validation/types.ts`.
3. `npm run lint && npm run typecheck && npm test` — full pipeline green.

### Invariants

1. Every one of the 26 stress cases maps to at least one named, resolvable v1 capability; no case is unmapped.
2. Each cited capability reference (code/section/field) exists in the current codebase — no stale references in the matrix.

## Test Plan

### New/Modified Tests

1. `packages/core/src/demo/stress-coverage.test.ts` — per-risk-area capability existence + behavior, plus a determinism re-compile check.

### Commands

1. `npx vitest run packages/core/src/demo/stress-coverage.test.ts`
2. `npm run lint && npm run typecheck && npm test`
3. Core is the correct boundary (the capabilities under audit are validation rules + the deterministic compiler in `@loom/core`); `npm test` confirms no regression in dependent packages.

## Outcome

Completed: 2026-06-06

What changed:
- Added `docs/stress-coverage-matrix.md`, mapping all 26 conceptual stress-suite cases to implemented v1 validation/compiler/schema capabilities.
- Added `packages/core/src/demo/stress-coverage.test.ts`, covering matrix/code integrity, a blocker-free deterministic demo compile, and representative behavior for the 14 risk areas.

Deviations from original plan:
- The core test keeps doc-file checks out of `@loom/core/src` because the package boundary forbids Node built-in imports there. The documented shell grep remains the file-level proof for the matrix document.

Verification:
- `npx vitest run packages/core/src/demo/stress-coverage.test.ts` passed.
- `grep -c '^| Case' docs/stress-coverage-matrix.md` returned 26, and every extracted diagnostic code resolved in `packages/core/src/validation/types.ts`.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed.
