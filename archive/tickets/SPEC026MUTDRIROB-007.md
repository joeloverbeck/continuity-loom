# SPEC026MUTDRIROB-007: Mutation-tighten P1 empty states and placeholder mapping

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — adds independent placeholder/empty-state contract tables and no-unresolved-placeholder assertions; no production behavior change.
**Deps**: SPEC026MUTDRIROB-001

## Problem

The prose compiler resolves a placeholder map and applies explicit empty-state text. Mutants here — dropping a placeholder line, mapping a placeholder to the wrong field, reusing the wrong empty-state string, emitting an optional section when its source is empty (or omitting it when populated), or rendering an accidental blank instead of the documented empty state — change generation semantics while a broad golden stays green. This ticket pins them with an independent placeholder/empty-state table and exact omission/render behavior, and classifies survivors.

## Assumption Reassessment (2026-06-20)

1. `packages/core/src/compiler/placeholder-map.ts`, `empty-states.ts`, and `template-constants.ts` exist (confirmed this session) and are inside the P1 mutation glob.
2. SPEC-026 §Deliverables B3 + report §6.3.D define the required assertions (each placeholder resolves exactly once; no known token survives; required sections in documented order; optional sections present iff source non-empty; documented empty-state vs omission); `docs/prompt-template.md` + `docs/compiler-contract.md` are the placeholder authority.
3. Cross-artifact boundary under audit: the placeholder/empty-state contract table must be built **independently** from the documented template, not generated from the resolver map under test (`placeholder-map.ts`).
4. FOUNDATIONS principle restated: §8 deterministic compilation + §9 universal prompt contract — placeholder mapping, section order, and empty states are contract surfaces; properties pin them without changing production source.
5. Deterministic-compilation surface (§8): tests mutate the placeholder/empty-state modules in the sandbox only; no production change. Any documented-contract mismatch is a behavior-fix ticket, not a test relaxation.

## Architecture Check

1. An independent placeholder/empty-state table derived from the docs (not from `placeholder-map.ts`) is the only oracle that can catch a wrong-field mapping; deriving it from the resolver under test would make the mutant equivalent.
2. No backwards-compatibility shims; contract tests only.

## Verification Layers

1. Placeholder resolution -> each registered placeholder resolves exactly once; no known placeholder token survives in the final prompt.
2. Section order/presence -> required sections appear in documented order; optional sections present exactly when their documented source set is non-empty.
3. Empty-state vs omission -> every empty source renders its documented empty state or documented omission, never an accidental blank; adding one record to an empty category changes only that section plus prompt-derived metadata.
4. Mutants killed -> `npm run mutation:prose` over `placeholder-map.ts` + `empty-states.ts` reports zero unclassified survivors.

## What to Change

### 1. Independent placeholder/empty-state table + assertions

Add `packages/core/test/compiler-placeholder-emptystate.contract.test.ts`: a table built from the documented template placeholders (not from `placeholder-map.ts`); assertions that each placeholder resolves exactly once, no known token survives, required sections appear in documented order, optional sections appear iff their source is non-empty, and each empty source renders its documented empty state/omission. Include the "add one record to an empty category changes only that section + metadata" relation.

### 2. Survivor classification

Run `npm run mutation:prose` scoped to `placeholder-map.ts`, `empty-states.ts`, `template-constants.ts`; classify every survivor. Any documented-contract mismatch → separate behavior-fix ticket.

## Files to Touch

- `packages/core/test/compiler-placeholder-emptystate.contract.test.ts` (new)
- `packages/core/test/support/arbitraries/empty-categories.ts` (new) — self-contained empty-category generators (no dependency on sibling arbitraries)

## Out of Scope

- Ordering, fingerprint, section-renderer, contamination properties (other Phase B tickets).
- Any change to placeholder/empty-state production logic (real mismatches route to their own behavior-fix ticket).

## Acceptance Criteria

### Tests That Must Pass

1. `vitest run packages/core/test/compiler-placeholder-emptystate.contract.test.ts` passes.
2. `npm run mutation:prose` shows zero unclassified survivors in `placeholder-map.ts` and `empty-states.ts`.
3. `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. The expected table is not generated from the resolver map under test.
2. No known placeholder token survives the final prompt.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-placeholder-emptystate.contract.test.ts` — independent placeholder/empty-state contract table + assertions.
2. `packages/core/test/support/arbitraries/empty-categories.ts` — self-contained empty-category generators (new).

### Commands

1. `vitest run packages/core/test/compiler-placeholder-emptystate.contract.test.ts` — targeted contract run.
2. `npm run mutation:prose` — survivor classification for the placeholder/empty-state modules.
3. The independent doc-derived table is the correct boundary: it is the only oracle independent of the code under mutation.

## Outcome

Completed: 2026-06-20

Added `packages/core/test/compiler-placeholder-emptystate.contract.test.ts` and `packages/core/test/support/arbitraries/empty-categories.ts`. The contract test carries a hard-coded doc-derived placeholder and empty-state table, asserts prompt-template placeholder exhaustiveness, exact exported empty-state constants, unknown-placeholder fail-closed behavior, unresolved-placeholder absence in emitted prompts, required section order, documented empty-state/omission behavior, optional section presence for hard canon / present minor cast / offstage relevance, and the one-record optional cast-category relation.

Survivor classification for `packages/core/src/compiler/placeholder-map.ts`, `packages/core/src/compiler/empty-states.ts`, and `packages/core/src/compiler/template-constants.ts`: the final forced focused P1 mutation run killed all mutants in those three ticket-owned files and left 0 survivors / 0 no-coverage mutants for them. The run still reports the two previously classified equivalent `ordering.ts` fallback-key survivors from `SPEC026MUTDRIROB-005`; they are outside this ticket's surface.

Deviations from the plan: the "add one record changes only that section plus metadata" assertion is applied to the present-minor and offstage cast optional categories. A hard-canon FACT correctly changes dependent knowledge/detail sections as well as `<hard_canon>`, so the test asserts hard-canon optional-section presence without treating dependent sections as a defect.

Verification:

- `npx vitest run packages/core/test/compiler-placeholder-emptystate.contract.test.ts` passed: 1 file, 8 tests.
- `npm run mutation:prose -- --force --mutate packages/core/src/compiler/placeholder-map.ts,packages/core/src/compiler/empty-states.ts,packages/core/src/compiler/template-constants.ts` completed: `empty-states.ts` 100.00, `placeholder-map.ts` 100.00, `template-constants.ts` 100.00; 0 survivors / 0 no coverage in those files.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 139 files, 1070 tests.
