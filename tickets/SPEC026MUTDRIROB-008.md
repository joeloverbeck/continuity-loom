# SPEC026MUTDRIROB-008: Mutation-tighten P1 prose section renderers

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — adds section-renderer branch/boundary tests; no production behavior change.
**Deps**: SPEC026MUTDRIROB-001

## Problem

The prose compiler renders fixed front, cast, pressure, and record-tail sections, conditionally emitting hard-canon, present-minor, and offstage material with cast-band distinctions and sample boundaries. Mutants here — truncating a cast sample at the wrong boundary, collapsing onstage/present-minor/offstage bands, changing field labels, dropping an output line a broad snapshot does not localize — alter the prompt while staying green. This ticket covers each renderer's branches and classifies survivors, preserving all existing output.

## Assumption Reassessment (2026-06-20)

1. `packages/core/src/compiler/sections/{front,cast,pressure,records-tail}.ts` exist (confirmed this session) and are inside the P1 mutation glob; `sections/ideation.ts` is excluded (it is P2's surface).
2. SPEC-026 §Deliverables B4 + report §6.3 (mapping/rendering mutant classes) define the branches to cover (cast-band distinctions, sample boundaries, label/section integrity); the existing prose golden (`packages/core/test/compiler-golden.test.ts` → `golden-first-segment.prompt.txt`) must remain byte-for-byte unchanged.
3. Cross-artifact boundary under audit: the prose golden is the high-level contract; this ticket adds *section-level* exact assertions around it without modifying the golden file.
4. FOUNDATIONS principle restated: §8 / §9 — section order, labels, and band distinctions are contract surfaces; tests pin them without changing production renderers.
5. Deterministic-compilation surface (§8): tests mutate the section renderers in the sandbox only. Any band/label/sample mismatch against the documented contract is a behavior-fix ticket, not a test relaxation; the existing golden stays unchanged.

## Architecture Check

1. Section-level exact assertions localize which renderer branch a mutant broke far better than the single full golden, which would only show a diff without naming the failing band/boundary.
2. No backwards-compatibility shims; tests only. Existing golden untouched.

## Verification Layers

1. Cast-band integrity -> exact assertions distinguishing onstage / present-minor / offstage bands and the cast sample boundary.
2. Front/pressure/records-tail branches -> exact section-content assertions for populated and empty inputs.
3. Output preserved -> the existing prose golden test passes unchanged.
4. Mutants killed -> `npm run mutation:prose` over `sections/{front,cast,pressure,records-tail}.ts` reports zero unclassified survivors.

## What to Change

### 1. Section-renderer tests

Add `packages/core/test/compiler-sections.contract.test.ts`: exact assertions for front, cast (band distinctions + sample boundary), pressure, and record-tail renderers, covering populated and empty branches. Build any record inputs with self-contained generators (`packages/core/test/support/arbitraries/section-records.ts`) — no dependency on sibling arbitraries.

### 2. Survivor classification

Run `npm run mutation:prose` scoped to the four section files; classify every survivor. Any contract mismatch → separate behavior-fix ticket; do not change the golden to accommodate a defect.

## Files to Touch

- `packages/core/test/compiler-sections.contract.test.ts` (new)
- `packages/core/test/support/arbitraries/section-records.ts` (new) — self-contained section-record generators

## Out of Scope

- Ordering, fingerprint, placeholder/empty-state, contamination properties (other Phase B tickets).
- `sections/ideation.ts` (P2 surface).
- Any change to renderer production logic or the existing golden.

## Acceptance Criteria

### Tests That Must Pass

1. `vitest run packages/core/test/compiler-sections.contract.test.ts` passes.
2. The existing prose golden test passes byte-for-byte unchanged.
3. `npm run mutation:prose` shows zero unclassified survivors in the four section files.
4. `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. The prose golden file is not modified.
2. Cast-band distinctions and the sample boundary are each pinned by at least one exact assertion.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-sections.contract.test.ts` — front/cast/pressure/records-tail branch + boundary assertions.
2. `packages/core/test/support/arbitraries/section-records.ts` — self-contained section-record generators (new).

### Commands

1. `vitest run packages/core/test/compiler-sections.contract.test.ts` — targeted section run.
2. `npm run mutation:prose` — survivor classification for the section renderers.
3. Section-level assertions plus the unchanged golden are the correct boundary: the golden guards the whole, the assertions localize each band/branch.
