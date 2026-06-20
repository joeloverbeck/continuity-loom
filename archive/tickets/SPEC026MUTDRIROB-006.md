# SPEC026MUTDRIROB-006: Mutation-tighten P1 fingerprint and token estimate

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — adds fixed-vector fingerprint and token-boundary contract tests; no production behavior change.
**Deps**: SPEC026MUTDRIROB-001

## Problem

The prose compiler emits prompt metadata including an FNV-1a fingerprint and a token estimate. Mutants here — wrong FNV initialization/multiplication/unsigned conversion, floor-vs-ceiling at token boundaries, zero-token output for an empty prompt, metadata derived from an intermediate rather than the emitted prompt — change contract-relevant metadata while staying green under a single example. This ticket pins them with independently-calculated fixed vectors and exact boundary cases, and classifies survivors.

## Assumption Reassessment (2026-06-20)

1. `packages/core/src/compiler/fingerprint.ts` exists (confirmed this session) and is inside the P1 mutation glob; the token-estimate logic lives in the compiler metadata path (`compile-prompt.ts` / `fingerprint.ts`).
2. SPEC-026 §Deliverables B2 + report §6.3.F define the required vectors (FNV-1a fixed vectors; token lengths 0, 1, 4, 5 + a non-ASCII case) and the negative constraint (do **not** assert universal collision-freedom).
3. Cross-artifact boundary under audit: the metadata-derivation contract — the fingerprint/estimate must be derived from the *emitted* prompt, not an intermediate representation; the test asserts that derivation point.
4. FOUNDATIONS principle restated: §8 deterministic compilation — same prompt → same fingerprint; known prompt → known fingerprint. The vectors are computed independently of `fingerprint.ts`.
5. Deterministic-compilation surface (§8): tests mutate `fingerprint.ts` in the sandbox only; confirm the algorithm consults no ambient/random/clock state. Any discovered algorithm defect is a separate behavior-fix ticket — do not change `packages/core/src/version.ts`.

## Architecture Check

1. Independent fixed FNV-1a vectors + exact token boundaries are stronger than a single golden because they localize which arithmetic step a mutant broke; they avoid the mathematically-false universal-collision assertion.
2. No backwards-compatibility shims; contract tests only.

## Verification Layers

1. Fingerprint correctness -> fixed independent FNV-1a vectors (known prompt → known fingerprint; same prompt → same fingerprint).
2. Token-estimate boundaries -> exact assertions at lengths 0, 1, 4, 5 and a non-ASCII prompt.
3. Metadata derivation point -> assert metadata is derived from the emitted prompt string.
4. Mutants killed -> `npm run mutation:prose` over `fingerprint.ts` reports zero unclassified survivors.

## What to Change

### 1. Fingerprint + token contract test

Add `packages/core/test/compiler-fingerprint.contract.test.ts`: independently-computed FNV-1a vectors; exact token-estimate assertions at boundary lengths 0/1/4/5 and a non-ASCII case; assert prompt metadata is derived from the emitted prompt, not an intermediate. Do **not** assert universal collision-freedom.

### 2. Survivor classification

Run `npm run mutation:prose` scoped to `fingerprint.ts` (and the token-estimate seam); classify every survivor. Any algorithm defect → separate behavior-fix ticket with a reproducing test; never adjust the expectation to match a defect.

## Files to Touch

- `packages/core/test/compiler-fingerprint.contract.test.ts` (new)

## Out of Scope

- Ordering, empty-state/placeholder, section-renderer, contamination properties (other Phase B tickets).
- Any change to `fingerprint.ts` algorithm or `packages/core/src/version.ts`.

## Acceptance Criteria

### Tests That Must Pass

1. `vitest run packages/core/test/compiler-fingerprint.contract.test.ts` passes against the independent vectors.
2. `npm run mutation:prose` shows zero unclassified survivors in `fingerprint.ts`.
3. `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. Vectors are computed independently of `fingerprint.ts`.
2. No universal-collision assertion exists (false for a fixed-width hash).

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-fingerprint.contract.test.ts` — fixed FNV-1a vectors + exact token boundaries + derivation-point assertion.

### Commands

1. `vitest run packages/core/test/compiler-fingerprint.contract.test.ts` — targeted contract run.
2. `npm run mutation:prose` — survivor classification for `fingerprint.ts`.
3. Fixed independent vectors are the correct boundary: they pin the algorithm without re-implementing it in the test.

## Outcome

Completed: 2026-06-20

Added `packages/core/test/compiler-fingerprint.contract.test.ts` with fixed FNV-1a vectors, exact token-estimate boundary cases for lengths 0, 1, 4, 5 and non-ASCII input, and a public `compilePrompt` metadata assertion that derives fingerprint, length, and token estimate from the emitted prompt string.

Survivor classification for `packages/core/src/compiler/fingerprint.ts`: the focused P1 mutation run killed 7 mutants, timed out 2 mutants, and left 0 survivors in `fingerprint.ts`. An initial run exposed a live `padStart(8, "0")` survivor because all first-pass vectors had eight-digit hashes; the test now includes the `"f8"` vector with expected `fnv1a32:0d226273`, which makes the leading-zero padding contract observable. The mutation report still lists the two previously classified equivalent `ordering.ts` fallback-key survivors from `SPEC026MUTDRIROB-005`; they are outside this ticket's implementation surface.

Deviations from the plan: none for production behavior. The test imports the existing `fingerprint.ts` helpers directly for helper-contract vectors and verifies `compilePrompt` metadata through the public compiler result.

Verification:

- `npx vitest run packages/core/test/compiler-fingerprint.contract.test.ts` passed: 1 file, 13 tests.
- `npm run mutation:prose -- --mutate packages/core/src/compiler/fingerprint.ts` completed: `fingerprint.ts` 100.00 mutation score, 7 killed, 2 timeout, 0 survived, 0 no coverage, 2 compile errors.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 138 files, 1062 tests.
