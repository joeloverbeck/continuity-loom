# SPEC026MUTDRIROB-002: Add scoped Vitest V8 coverage as a reachability floor

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — adds a disabled-by-default coverage block to `vitest.config.ts`, a `test:coverage:core` script, and a `core-coverage` CI job; no production behavior change.
**Deps**: SPEC026MUTDRIROB-001

## Problem

Coverage is a reachability floor, not an adequacy measure — but the repo currently has no coverage instrumentation (`vitest.config.ts` has no coverage block, confirmed this session). This ticket adds scoped V8 coverage for the compiler and validation surfaces so a test-unreachable line is visible, without letting coverage percentage masquerade as assertion strength (mutation, added in later phases, is the adequacy anchor). Coverage stays disabled by default so `npm test` is unchanged.

## Assumption Reassessment (2026-06-20)

1. `vitest.config.ts` exists at repo root with test globs/timeout/`passWithNoTests` and **no** coverage block (confirmed this session); `@vitest/coverage-v8@4.1.9` is installed by SPEC026MUTDRIROB-001.
2. SPEC-026 §Deliverables A2 + report §9.5 define the exact coverage block (provider `v8`, `enabled: false`, scoped `include`, global 95/95/95/90 thresholds, `validation/**` 97/97/97/95, `autoUpdate: false`, no global `perFile`); `.github/workflows/ci.yml` exists and runs the established lint/typecheck/test/build gates.
3. Cross-artifact boundary under audit: the CI gate contract in `.github/workflows/ci.yml` — the new `core-coverage` job must be additive and must not alter the default `npm test` job.
4. FOUNDATIONS principle restated: §29.11 (workflow quality) — fast local tests stay unchanged; coverage runs only through the dedicated script/CI job, never by default.

## Architecture Check

1. A single disabled-by-default coverage block plus a dedicated `test:coverage:core` script keeps coverage opt-in and scoped to the locked surfaces, cleaner than enabling coverage globally (which would slow every run and pull in unrelated files). Per-file thresholds are deliberately omitted in this first tranche (small renderer files yield misleading percentages from one synthetic branch).
2. No backwards-compatibility shims; the default `test` script is untouched.

## Verification Layers

1. Default test loop unchanged -> `npm test` runs with coverage disabled (grep `enabled: false` in `vitest.config.ts`).
2. Coverage scoped to locked surfaces -> `npm run test:coverage:core` emits a report covering only `compiler/**` + `validation/**`.
3. CI gate additive -> `.github/workflows/ci.yml` diff adds a `core-coverage` job without modifying the existing test job.

## What to Change

### 1. Coverage block in `vitest.config.ts`

Add a `coverage` block: `provider: 'v8'`, `enabled: false`, `include: ['packages/core/src/compiler/**/*.ts', 'packages/core/src/validation/**/*.ts']`, `exclude: ['**/*.test.ts', '**/*.test.tsx']` (add only verified type-only files later), reporters `['text','text-summary','html','json-summary','lcov']`, thresholds global `lines/statements/functions 95, branches 90` with a `packages/core/src/validation/**` override of `97/97/97/95`, and `autoUpdate: false`.

### 2. Package script

Add `test:coverage:core`: `npm run build --workspace @loom/core && vitest run --coverage packages/core`.

### 3. CI job

Add a `core-coverage` job to `.github/workflows/ci.yml` that runs `npm run test:coverage:core` and fails on threshold violation. It is a normal (not-yet-required) job; making it a required status check is SPEC026MUTDRIROB-022.

## Files to Touch

- `vitest.config.ts` (modify)
- `package.json` (modify) — `test:coverage:core` script
- `.github/workflows/ci.yml` (modify) — `core-coverage` job

## Out of Scope

- Per-file coverage thresholds (revisit only after a baseline shows a reachability blind spot).
- Excluding type-only files (only after a report proves a file is non-executable).
- Marking the job a required status check (SPEC026MUTDRIROB-022).
- Mutation configuration (SPEC026MUTDRIROB-001).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test` runs unchanged with coverage disabled.
2. `npm run test:coverage:core` produces a scoped V8 report and enforces the configured thresholds.
3. `npm run lint && npm run typecheck` pass.

### Invariants

1. Coverage is `enabled: false` by default; only `test:coverage:core` / the `core-coverage` CI job enable it.
2. `autoUpdate` is `false` — thresholds are reviewed policy, never auto-edited.

## Test Plan

### New/Modified Tests

1. `None — config + CI-wiring ticket; verification is command-based via test:coverage:core and the unchanged default test run.`

### Commands

1. `npm run test:coverage:core` — scoped coverage report + threshold enforcement.
2. `npm test` — confirm default loop unchanged (coverage off).
3. A scoped-coverage command is the correct boundary: coverage is a reachability floor here, not the adequacy gate (mutation, later phases).
