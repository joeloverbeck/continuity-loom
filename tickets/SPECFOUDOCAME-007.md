# SPECFOUDOCAME-007: Register active specs in ACTIVE-DOCS.md

**Status**: PENDING
**Priority**: LOW
**Effort**: Small
**Engine Changes**: Yes — `docs/ACTIVE-DOCS.md` ("Active tickets and specs" section); no production behavior change.
**Deps**: None

<!-- Related: specs/SPEC-foundational-doc-amendments-for-generation-readiness.md §4.10. -->

## Problem

`docs/ACTIVE-DOCS.md` — the change-intake index that CLAUDE.md requires changes to route through — currently asserts "There is no active `specs/` directory at the post-v1 target commit." That is now false: `specs/` holds three active specs (`SPEC-foundational-doc-amendments-for-generation-readiness.md`, `SPEC-implementation-order-and-regression-plan.md`, `IMPLEMENTATION-ORDER.md`). The index is silently incomplete, so change-intake cannot route through it correctly.

## Assumption Reassessment (2026-06-08)

1. `docs/ACTIVE-DOCS.md` has an `## Active tickets and specs` section (line ~79) whose closing line reads "There is no active `specs/` directory at the post-v1 target commit," and a `## Historical material` section (line ~62) already pointing completed specs to `archive/specs/`. Confirmed this session.
2. The active `specs/` directory holds exactly three files — `SPEC-foundational-doc-amendments-for-generation-readiness.md`, `SPEC-implementation-order-and-regression-plan.md`, `IMPLEMENTATION-ORDER.md` (`ls specs/` this session) — while the three behavioral predecessor specs are completed and archived under `archive/specs/`. The amendment plan is `specs/SPEC-foundational-doc-amendments-for-generation-readiness.md` §4.10.
3. Cross-artifact boundary under audit: `ACTIVE-DOCS.md` is the index that lists active vs historical specs; the boundary is between the active `specs/` set and the archived `archive/specs/` set. This ticket only corrects the index's claim and registers the active set; it does not move or edit the specs themselves.

## Architecture Check

1. Correcting the false claim and registering the active specs makes change-intake routing (per CLAUDE.md) work as designed — cleaner than leaving the index self-contradictory or silently incomplete.
2. No backwards-compatibility aliasing: the stale "no active `specs/` directory" line is corrected in place; the behavioral specs stay under the existing `Historical material → archive/specs/` entry (not re-listed as active).

## Verification Layers

1. The false "no active `specs/` directory" claim is gone → codebase grep-proof (`grep -c "no active .specs. directory" docs/ACTIVE-DOCS.md` → 0).
2. The three active specs are registered under "Active tickets and specs" → grep-proof (`grep -nE "SPEC-foundational-doc-amendments|SPEC-implementation-order-and-regression-plan|IMPLEMENTATION-ORDER" docs/ACTIVE-DOCS.md`).
3. The behavioral specs are NOT re-listed as active (they remain under Historical material) → manual review of the two sections.

## What to Change

### 1. Correct the stale claim and register active specs

In `docs/ACTIVE-DOCS.md` "Active tickets and specs":
- Replace the "There is no active `specs/` directory at the post-v1 target commit" statement with an accurate one naming the active `specs/` directory.
- Register the three active specs (`SPEC-foundational-doc-amendments-for-generation-readiness.md`, `SPEC-implementation-order-and-regression-plan.md`, `IMPLEMENTATION-ORDER.md`) so change-intake routes through the index per CLAUDE.md.
- Leave the three completed behavioral specs under the existing `Historical material → archive/specs/` entry; do not list them as active. (Spec §4.10.)

## Files to Touch

- `docs/ACTIVE-DOCS.md` (modify)

## Out of Scope

- Editing, moving, or archiving any spec file (only the index is touched).
- Reconciling `IMPLEMENTATION-ORDER.md`'s internal stale path / registering this spec inside `IMPLEMENTATION-ORDER.md` (cross-spec follow-up).
- The doctrine content of the other active docs (SPECFOUDOCAME-001…006).

## Acceptance Criteria

### Tests That Must Pass

1. `grep -c "no active .specs. directory" docs/ACTIVE-DOCS.md` returns `0`.
2. `grep -nE "SPEC-foundational-doc-amendments|SPEC-implementation-order-and-regression-plan|IMPLEMENTATION-ORDER" docs/ACTIVE-DOCS.md` returns the three registered active specs.

### Invariants

1. The behavioral predecessor specs are not listed as active (they stay under Historical material → `archive/specs/`).
2. Index-consistency invariant: the "Active tickets and specs" section's statements match the actual `specs/` directory contents.

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based (greps below). The index has no automated test; correctness is the grep-proofs plus manual review.`

### Commands

1. `grep -nE "Active tickets and specs|specs/" docs/ACTIVE-DOCS.md` — confirm the active specs are registered and the stale claim is corrected.
2. `ls specs/` cross-checked against the registered list — confirm the index matches the actual active `specs/` contents (the correct boundary — index-vs-filesystem agreement).
