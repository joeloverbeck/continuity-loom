# SPEC014POLREGHAR-001: Compiler golden frozen baseline

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — adds a checked-in golden prompt fixture under `packages/core/test/` and extends `packages/core/test/compiler-golden.test.ts`; no production code changes.
**Deps**: None

## Problem

`packages/core/test/compiler-golden.test.ts` asserts determinism only *within a single run* — it compiles a synthetic `goldenInput()` twice and checks `second.prompt === first.prompt` plus equal fingerprint (lines 148–149), section order, and fixed `metadata.versions`. There is **no checked-in canonical golden prompt artifact**, so a silent prompt change that is internally consistent (compiles identically twice within the changed code) passes undetected across commits. SPEC-014 D1 closes this: freeze a realistic compiled prompt as a checked-in fixture and assert byte-identical output against it, so any drift in the template/compiler/contract fails loudly and is re-baselined only deliberately.

## Assumption Reassessment (2026-06-06)

1. The in-run determinism test exists at `packages/core/test/compiler-golden.test.ts` and uses a synthetic `goldenInput(): BuildValidationSnapshotInput` (line 4); its assertions `expect(second.prompt).toBe(first.prompt)` and `expect(second.metadata.fingerprint).toBe(first.metadata.fingerprint)` are at lines 148–149, plus `promptSectionOrder(first.prompt) === SECTION_ORDER` and `metadata.versions === { template: "1.0.0", compiler: "1.0.0", contract: "1.0.0" }`. Compiler entry is `compilePrompt(snapshot: ValidationSnapshot)` at `packages/core/src/compiler/compile-prompt.ts:11`.
2. The tame demo exports `demoRecords`, `demoGenerationSession`, `demoStoryConfig` (re-exported from `packages/core/src/index.ts:18,20,21`) and `buildValidationSnapshot` (`packages/core/src/index.ts:126`), so a deterministic, schema-valid first-segment snapshot is buildable from the demo without touching production code — confirming SPEC-014 §Approach #1 / R-1. `docs/requirements-version-1/TESTING-STRATEGY.md §"Deterministic compiler tests"` governs the re-baseline doctrine.
3. Cross-artifact boundary under audit: the golden fixture is consumed only by `@loom/core` test code and must respect the `@loom/core` purity boundary (no `fastify`/`react`/`vite`/`node:*`) — a plain text/data fixture has no imports, so it cannot breach the boundary; `packages/core/test/boundary.test.ts` and `npm run lint` remain the guard.
4. FOUNDATIONS principle under audit: §8 / §4.4 deterministic compilation — "given the same story configuration, active working set, generation-time fields, template version, and compiler version, the generated prompt must be identical." The golden pins exactly this contract; the test is the regression armor, not a behavior change.
5. Deterministic-compilation surface: the change adds no LLM intermediary, no wall-clock input, and no nondeterministic ordering to the compilation path (§29.4). `metadata.fingerprint` derives from `fingerprintPrompt(prompt)` (`compile-prompt.ts`), a pure function of the rendered string; the golden assertion strengthens, never weakens, the secret firewall and determinism guarantees. Re-baselining is gated on a deliberate template/compiler/contract version bump.
6. No mismatch: every symbol and path in this ticket was confirmed against the working tree during the SPEC-014 reassessment and the spec-to-tickets spot-check on 2026-06-06.

## Architecture Check

1. A checked-in frozen golden is the only mechanism that detects *cross-commit* drift; an in-run double-compile (the current test) cannot, because a changed compiler still agrees with itself. Sourcing the golden from the tame demo (a realistic, all-sections snapshot) rather than a hand-written toy keeps the fixture representative and avoids a second synthetic divergent from real usage.
2. No backwards-compatibility shims or aliases: the existing `goldenInput()` assertions are retained as-is; the new assertion is additive. No alternate "legacy golden" path is introduced.

## Verification Layers

1. Byte-identical output → test assertion `expect(compilePrompt(demoFirstSegmentSnapshot).prompt).toBe(<stored golden>)`; fails on any single-byte drift.
2. In-run determinism preserved → retained existing `second.prompt === first.prompt` + fingerprint assertions (lines 148–149).
3. `@loom/core` purity (fixture introduces no forbidden import) → `npm run lint` (core import-boundary rule) + `packages/core/test/boundary.test.ts`.
4. FOUNDATIONS §8 determinism intent → FOUNDATIONS alignment check (no LLM/wall-clock/unordered input added to the compile path).

## What to Change

### 1. Add the checked-in golden fixture

Compile the tame demo's first-segment snapshot once and freeze the exact prompt string as a checked-in artifact at `packages/core/test/golden-first-segment.prompt.txt`. The snapshot is assembled from the exported demo symbols: `buildValidationSnapshot({ records: demoRecords, generationSession: demoGenerationSession, storyConfig: demoStoryConfig })` (use the exact field names the existing `goldenInput()` consumer / `BuildValidationSnapshotInput` requires). The fixture is generated once by the implementer (e.g. a throwaway log of `compilePrompt(snapshot).prompt`) and committed verbatim.

### 2. Extend `compiler-golden.test.ts`

Add a test case that builds the demo first-segment snapshot, calls `compilePrompt`, reads the stored golden fixture, and asserts `result.prompt` is byte-identical to it. Read the fixture with a relative import/read that keeps `@loom/core` framework-free (a string import or test-time file read consistent with existing core test conventions). Keep the existing `goldenInput()` in-run determinism, fingerprint, section-order, and version assertions untouched. Add an in-file comment stating the golden is re-baselined **only** on a deliberate template/compiler/contract version change (per TESTING-STRATEGY §"Deterministic compiler tests").

## Files to Touch

- `packages/core/test/compiler-golden.test.ts` (modify)
- `packages/core/test/golden-first-segment.prompt.txt` (new)

## Out of Scope

- Any change to `compilePrompt`, the template, the compiler-contract, or `metadata.versions` (a golden change without a version bump is a drift signal, not a deliverable here).
- A second golden from `goldenInput()` — full-section coverage stays guarded by the existing section-order assertion (per SPEC-014 Q1 disposition (a)).
- Validation-rule, schema, or prompt-section changes.

## Acceptance Criteria

### Tests That Must Pass

1. `npm run build --workspace @loom/core && npx vitest run packages/core/test/compiler-golden.test.ts` — the new byte-identical golden assertion and all retained in-run assertions pass.
2. Mutating one character of the stored golden fixture (local experiment) makes the test fail — confirming the assertion actually compares against the frozen artifact.
3. `npm test` — full core build + suite green (no regression in sibling compiler tests).

### Invariants

1. `compilePrompt` of the fixed demo first-segment snapshot is byte-identical to `golden-first-segment.prompt.txt` for identical template/compiler/contract versions.
2. The golden fixture contains no API key, secret, or accepted-prose text (it is a compiled prompt of user-authored records only).

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-golden.test.ts` — add the demo-sourced frozen-baseline assertion; retain existing in-run/section/version assertions.
2. `packages/core/test/golden-first-segment.prompt.txt` — the checked-in canonical golden artifact.

### Commands

1. `npm run build --workspace @loom/core && npx vitest run packages/core/test/compiler-golden.test.ts`
2. `npm run lint && npm run typecheck && npm test`
3. A targeted vitest run on the single golden test file is the correct boundary because the deliverable is a self-contained determinism regression; the full `npm test` confirms no cross-package fallout.
