# SPECVALGATTAX-005: Validation-taxonomy capstone — end-to-end tests and web-test reconciliation

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — adds an end-to-end validation-taxonomy test surface and updates Readiness/UX-owned web tests that assert retired/renamed diagnostic codes; no production behavior change.
**Deps**: SPECVALGATTAX-002, SPECVALGATTAX-003, SPECVALGATTAX-004 (SPECVALGATTAX-001 reached transitively via 002)

## Problem

The spec's §Tests section lists twelve cross-cutting acceptance behaviors the corrected taxonomy must exhibit together (blank stop guidance does not block, nonlocal stop guidance still blocks, first-segment-no-handoff compiles, continuation-no-handoff blocks, missing `must_render` blocks, voice-anchor-without-pin does not block, contradictory voice pressure blocks, length/cast-salience warnings do not block, selected records alone do not over-trigger, each focus tag activates only its matrix, context defaulting uses accepted-segment count, no warning appears in the compiled prompt). These span the three implementation tickets and must be exercised end-to-end against the assembled validator. Separately, the diagnostic-code removals/renames in 002–004 break Readiness/UX-owned web tests that assert the old codes; those must be reconciled so the branch's full test suite passes (flag F2, disposition (a) — folded here).

## Assumption Reassessment (2026-06-07)

1. The §Tests behaviors are produced by the rules changed in SPECVALGATTAX-002 (`universal-completeness.ts`, `universal-blockers.ts`), 003 (`matrix-voice.ts`, `warnings.ts`, `universal-blockers.ts`), and 004 (`warnings.ts`); the context-defaulting behavior is produced by the landed `deriveGenerationContextDefault`. This ticket introduces **no** production logic — it exercises the pipeline those tickets compose (capstone shape per `references/decomposition-patterns.md`).
2. The spec (`specs/SPEC-validation-gating-taxonomy-and-focus-matrix.md` §Tests) is the acceptance carrier; each bullet maps to a capstone sub-case. The demo fixture `packages/core/src/demo/letter-under-flour-bin.ts` (updated in 001) is the natural end-to-end fixture; re-enumerate expected counts from the fixture at test start rather than hardcoding.
3. Cross-artifact boundary under audit: this ticket touches **Readiness/Three-Page UX-owned** web tests (`packages/web/src/generation-brief/ValidationPanel.test.tsx`, `ValidationResultView.test.tsx`, `packages/web/src/generate/GenerateView.test.tsx`, `packages/web/src/preview/PromptPreviewView.test.tsx`) that assert `missing-stop-guidance` (retired by 002), `prompt-length-risk` (renamed by 004), and `missing-current-authoritative-state` (semantics changed by 002). The shared boundary is the diagnostic-code vocabulary in `DIAGNOSTIC_CODES`; the web tests consume codes, the validator produces them. These web edits keep CI green on this branch (disposition F2(a)); the web *views* are not changed here (they are data-driven — grep shows only `*.test.tsx` reference the codes, not the view sources).
4. FOUNDATIONS principle restated: §11 — validation is deterministic and blocking, warnings are advisory and never enter the prompt. The capstone's assertions are the executable proof of the §11 correction: blockers gate, warnings do not, and `grep`-style negative assertions confirm no warning text reaches the compiled prompt (§11, §28.2).

## Architecture Check

1. A single trailing capstone re-enumerating expected diagnostics from the demo fixture is more robust than hardcoded counts scattered across the per-rule tests — it catches cross-rule interaction (e.g. a focus tag that should activate only its matrix but leaks a universal blocker) that per-file unit tests miss.
2. No backwards-compatibility aliasing: the web tests are updated to the new codes outright (not asserting both old and new). The capstone adds a new test file rather than overloading an existing per-rule test.

## Verification Layers

1. Each §Tests bullet holds against the assembled validator -> capstone e2e test (`validation-taxonomy-capstone.test.ts`), one sub-case per bullet.
2. No warning string appears in the compiled prompt -> compiler grep-proof inside the capstone (compile the fixture, assert warning messages absent from output).
3. Web tests assert only current diagnostic codes -> codebase grep-proof (`grep -rn "missing-stop-guidance\|prompt-length-risk" packages/web/src` returns nothing) + the web test suites pass.
4. Context defaulting uses accepted-segment count -> capstone sub-case driving 0 vs ≥1 accepted segments through `deriveGenerationContextDefault`.

## What to Change

### 1. Capstone e2e test (`packages/core/test/validation-taxonomy-capstone.test.ts`, new)

Add one sub-case per §Tests bullet, built from the demo fixture and minimal mutations of it. Re-enumerate expected blocker/warning counts from the fixture at test start. Include the negative assertion that no warning message appears in the compiled prompt output.

### 2. Web-test reconciliation (Readiness/UX-owned `*.test.tsx`)

Update the four web test files to assert the corrected codes: replace `missing-stop-guidance` assertions (now non-blocking) and `prompt-length-risk` (now `prompt-middle-salience-risk`); adjust `missing-current-authoritative-state` expectations to the minimum-state semantics. Change test expectations only — do not alter view component behavior.

## Files to Touch

- `packages/core/test/validation-taxonomy-capstone.test.ts` (new)
- `packages/web/src/generation-brief/ValidationPanel.test.tsx` (modify)
- `packages/web/src/generation-brief/ValidationResultView.test.tsx` (modify)
- `packages/web/src/generate/GenerateView.test.tsx` (modify)
- `packages/web/src/preview/PromptPreviewView.test.tsx` (modify)

## Out of Scope

- Any production rule/schema/compiler change (SPECVALGATTAX-001 through 004).
- Web *view component* behavior (Readiness/Three-Page UX spec) — only the breaking test expectations are reconciled here.
- `docs/stress-coverage-matrix.md` / `docs/demo-blocker-recipes.md` / `docs/stress-suite.md` sync (cross-spec: `SPEC-foundational-doc-amendments-for-generation-readiness.md`, Phase 7).

## Acceptance Criteria

### Tests That Must Pass

1. The capstone test asserts all twelve §Tests behaviors against the assembled validator and passes.
2. `grep -rn "missing-stop-guidance\|prompt-length-risk" packages/web/src packages/core/src` returns nothing.
3. `npm test` passes for `@loom/core`, `@loom/server`, and `@loom/web` (full suite green on the branch).

### Invariants

1. The capstone introduces no production logic — its Files to Touch are test surfaces only.
2. Expected diagnostic counts are re-enumerated from the fixture at test start, not hardcoded.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-taxonomy-capstone.test.ts` — one sub-case per §Tests bullet; warning-absent-from-prompt negative assertion.
2. `packages/web/src/generation-brief/ValidationPanel.test.tsx`, `ValidationResultView.test.tsx`, `packages/web/src/generate/GenerateView.test.tsx`, `packages/web/src/preview/PromptPreviewView.test.tsx` — reconcile to corrected diagnostic codes.

### Commands

1. `npm run -w @loom/core build && npx vitest run packages/core/test/validation-taxonomy-capstone.test.ts`
2. `npm test`

## Outcome

Completion date: 2026-06-07

Added `packages/core/test/validation-taxonomy-capstone.test.ts` covering the assembled taxonomy: blank stop guidance, first-segment no-handoff, continuation handoff blocking, missing directive blocking, malformed context count, voice/salience warnings, selected-record non-overtrigger, and warning text exclusion from compiled prompts. Reconciled web validation tests to current diagnostic codes.

Deviations from original plan: made one production correction in `universal-completeness.ts` because the capstone exposed that selected `OBJECT` / `VISIBLE AFFORDANCE` records alone still activated physical blockers. The fixed behavior now matches the spec: physical blockers activate from explicit focus tags, not selected records by mere existence.

Verification results:

- `npm run -w @loom/core build` passed.
- `npx vitest run packages/core/test/validation-taxonomy-capstone.test.ts packages/web/src/generation-brief/ValidationPanel.test.tsx packages/web/src/generation-brief/ValidationResultView.test.tsx packages/web/src/generate/GenerateView.test.tsx packages/web/src/preview/PromptPreviewView.test.tsx packages/core/test/validation-completeness.test.ts` passed.
- `npm test` passed: 96 test files, 571 tests.
- `rg -n "missing-stop-guidance|prompt-length-risk" packages/web/src packages/core/src` returned no matches.
