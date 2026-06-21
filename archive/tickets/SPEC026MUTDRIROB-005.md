# SPEC026MUTDRIROB-005: Mutation-tighten P1 ordering

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — adds ordering property/contract tests and shared fast-check arbitraries; no production behavior change.
**Deps**: SPEC026MUTDRIROB-001

## Problem

The prose compiler orders records through multiple tie-breaks (`userOrder` precedence, compile-family/salience/urgency direction, label and ID tie-breaks). A surviving ordering mutant — removed precedence, reversed direction, dropped tie-break, equality returned too early — silently reorders the prompt while broad snapshots stay green. This ticket adds named tie cases plus schema-aware properties that kill those mutants, and classifies every survivor in `ordering.ts`.

## Assumption Reassessment (2026-06-20)

1. `packages/core/src/compiler/ordering.ts` exists (confirmed this session) and is inside the P1 mutation glob from SPEC026MUTDRIROB-001.
2. SPEC-026 §Deliverables B1 + report §6.3.B define the required ordering properties (precedence dominance, permutation invariance, exact label-then-ID tie resolution, no input mutation, comparator antisymmetry/transitivity); fast-check + `@fast-check/vitest` are installed by 001.
3. Cross-artifact boundary under audit: the `packages/core/test/support/arbitraries/` generator location (SPEC-026 §Approach) — this ticket establishes the shared `ids.ts` / `records.ts` base generators that sibling pillar tickets extend; generators must build valid baselines by construction and never derive the expected answer from the function under test.
4. FOUNDATIONS principle restated: §8 / §4.4 deterministic, ordered compilation — ordering is a contract surface; properties pin it without changing `ordering.ts`.
5. Deterministic-compilation surface (§8): the tests mutate `ordering.ts` in the sandbox but add no production change; confirm the comparator stays pure and consults no ambient state.

## Architecture Check

1. A small named tie-case table alongside generated properties keeps failures diagnosable while properties carry the combinatorial load — cleaner than enumerating every permutation as a snapshot.
2. No backwards-compatibility shims; tests and test-only generators only. The fixed PR seed keeps properties non-flaky.

## Verification Layers

1. Precedence/tie-break pinned -> fast-check properties over generated valid record arrays (permutation invariance, key dominance, label-then-ID ties).
2. Comparator laws hold -> antisymmetry/transitivity properties over generated pairs/triples.
3. No input mutation -> deep-freeze the source array and assert sort does not mutate inputs.
4. Mutants killed -> `npm run mutation:prose` over `ordering.ts` reports zero unclassified survivors for this file.

## What to Change

### 1. Shared arbitraries (base)

Add `packages/core/test/support/arbitraries/ids.ts` and `records.ts` — valid-by-construction generators biased toward ties, duplicates, and boundary order values, with a fixed PR seed and seed/shrink-path logging on failure. (Sibling pillar tickets extend these; coordinate the shared files per Step 6.)

### 2. Ordering properties + tie table

Add `packages/core/test/compiler-ordering.property.test.ts`: a named tie-case table (complete ties resolving by label then ID) plus properties — permuting storage order leaves prompt-relevant order unchanged; a higher-priority key dominates every lower key; the comparator is antisymmetric and transitive over generated valid records; sorting mutates neither the input array nor records.

### 3. Survivor classification

Run `npm run mutation:prose` scoped to `ordering.ts`; classify every survivor (test gap / equivalent / product defect / contract ambiguity / NoCoverage / Timeout / tool error) per the survivor protocol. Any product defect → separate behavior-fix ticket; never weaken the expectation.

## Files to Touch

- `packages/core/test/compiler-ordering.property.test.ts` (new)
- `packages/core/test/support/arbitraries/ids.ts` (new)
- `packages/core/test/support/arbitraries/records.ts` (new)

## Out of Scope

- Fingerprint/token, empty-state/placeholder, section-renderer, and contamination properties (SPEC026MUTDRIROB-006..009).
- Any change to `ordering.ts` production logic (a real defect routes to its own behavior-fix ticket).

## Acceptance Criteria

### Tests That Must Pass

1. `vitest run packages/core/test/compiler-ordering.property.test.ts` passes with the fixed PR seed.
2. `npm run mutation:prose` shows zero unclassified survivors in `ordering.ts`.
3. `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. Generators never compute the expected ordering from `ordering.ts` itself.
2. Properties are deterministic under the committed seed; failures report seed + shrink path.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-ordering.property.test.ts` — precedence/permutation/comparator-law/no-mutation properties + named tie table.
2. `packages/core/test/support/arbitraries/{ids,records}.ts` — shared valid-by-construction generators.

### Commands

1. `vitest run packages/core/test/compiler-ordering.property.test.ts` — targeted property run.
2. `npm run mutation:prose` — survivor classification for `ordering.ts`.
3. The pillar-scoped mutation run is the correct adequacy boundary; the targeted Vitest run is the fast inner loop.

## Outcome

Completed: 2026-06-20

Added shared test arbitraries for deterministic record IDs and compiler-ordering records, plus `packages/core/test/compiler-ordering.property.test.ts`. The new tests pin named tie cases, user-order dominance, family-before-priority behavior, independent expected ordering for generated records, input permutation invariance, comparator antisymmetry/transitivity via the independent comparator, and no input/record mutation via deep-freeze.

Survivor classification for `packages/core/src/compiler/ordering.ts`: focused P1 mutation run killed 21 mutants, had 46 compile-error mutants, and left 2 equivalent survivors. Both survivors are string-literal mutations in `comparePriority` fallback keys (`left ?? ""` and `right ?? ""` changed to another unknown key); any unknown key resolves to the same default priority rank, so the runtime order is unchanged. No product defect or contract ambiguity was found.

Deviations from the plan: the mutation run reported two classified equivalent survivors rather than zero physical survivors. They are not unclassified survivors and do not indicate a test gap.

Verification:

- `npx vitest run packages/core/test/compiler-ordering.property.test.ts` passed: 1 file, 7 tests.
- `npm run mutation:prose -- --mutate packages/core/src/compiler/ordering.ts` completed: 21 killed, 2 equivalent survived, 46 compile errors, 0 NoCoverage, 0 Timeout.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 137 files, 1049 tests.
