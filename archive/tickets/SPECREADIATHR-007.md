# SPECREADIATHR-007: Cross-page readiness capstone and `ValidationResultView` retirement

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — new cross-page readiness test exercising the spec's §Test requirements end-to-end; removes the now-orphaned `ValidationResultView` (+ its test). No production behavior change beyond dead-code removal.
**Deps**: SPECREADIATHR-004, SPECREADIATHR-005, SPECREADIATHR-006

## Problem

The spec's §Test requirements and §Accessibility demand that the same readiness result renders consistently across the Generation Brief, Prompt Preview, and Generate pages, with a specific gating matrix (warnings never gate; blockers gate Preview/Generate; provider gates Generate only; Save never gated). This trailing ticket verifies that matrix end-to-end once all three pages have migrated, and retires `ValidationResultView`, which becomes dead code after the last page migration.

## Assumption Reassessment (2026-06-07)

1. After SPECREADIATHR-004/005/006, the only remaining importers of `ValidationResultView` (`packages/web/src/generation-brief/ValidationResultView.tsx`) are gone — at implementation time a repo-wide grep must show zero `ValidationResultView` references outside its own `.tsx`/`.test.tsx` before deletion. The file and its test currently exist (`test -f` confirmed); they are deleted here, not earlier, because Preview (005) and Generate (006) still import them until they migrate.
2. The spec (`specs/SPEC-readiness-diagnostics-and-three-page-ux.md`, §Test requirements, §Accessibility) enumerates the capstone sub-cases: warning-only stays `ready-with-warnings` with Preview/Generate available; provider-missing blocks Generate but not Preview; missing launch directive blocks Preview/Generate but not Save; unsaved changes show the stale-readiness notice; grouped cast-salience warning shows display labels with raw IDs only in technical details; raw-code buttons replaced by user-facing action labels; keyboard focus actions work; the same readiness result renders consistently on all three pages.
3. Cross-artifact boundary under audit: this ticket exercises the composed pipeline (core `deriveReadiness` → `/api/readiness` → `ReadinessChecklist` → the three pages) end-to-end. It introduces no production logic except the orphan removal; it does not modify the upstream tickets' files.
4. FOUNDATIONS restated before trusting the spec: §11 — warnings never gate; blockers gate Preview and Generate; provider blockers gate Generate only; Save is never gated (`canSaveDraft` always true). §10 — warnings/technical text never enter the compiled prompt body. The cross-page assertions encode exactly this matrix.
5. Rename/removal blast radius (`ValidationResultView`): grep repo-wide (`packages/web/src`, and confirm none in `packages/server`, `docs/`, `specs/`) — after 004–006 the only matches must be its own two files. Any other surviving match joins this ticket's deletion scope or blocks it; `dist/` build artifacts are regenerated and excluded.
6. Adjacent contradictions: the orphan removal is a required consequence of the three page migrations, not a separate bug or speculative cleanup — it is in-scope for this trailing ticket.

## Architecture Check

1. A single trailing capstone both proves cross-page consistency from one fixture and lands the orphan deletion atomically once every consumer is gone — cleaner than scattering the deletion into whichever page migrates last (which would force an artificial 006→{004,005} dependency) or leaving dead code behind.
2. No backwards-compatibility shims: `ValidationResultView` is removed outright, with grep-proof that nothing references it — no deprecation alias is kept.

## Verification Layers

1. §Test requirements behaviors -> `readiness-cross-page.test.tsx` (RTL), re-enumerating expected blocker/warning counts from the shared fixture rather than hardcoding.
2. `ValidationResultView` fully retired -> codebase grep-proof (`grep -rn "ValidationResultView" packages/web/src` returns nothing) + `test ! -f` on both files.
3. Accessibility (counts in headings, `aria-live` summary, keyboard focus actions, default-collapsed disclosure) -> cross-page test role/focus queries.
4. Same readiness result renders consistently on all three pages -> test mounting all three surfaces against one fixture and asserting identical checklist content.

## What to Change

### 1. New `packages/web/src/readiness/readiness-cross-page.test.tsx`

Mount the Generation Brief readiness panel, Prompt Preview, and Generate views against a shared mocked `readiness()` (plus `compile()` / `generate()` where a surface needs them) and assert the §Test requirements matrix: warning-only availability, provider-missing gating Generate-not-Preview, missing-launch-directive gating Preview/Generate-not-Save, stale-readiness notice on unsaved changes, grouped cast-salience display labels with raw IDs only in technical details, user-facing action labels (no raw codes), keyboard focus actions, and identical checklist rendering across the three pages. Re-enumerate expected counts from the fixture at test start.

### 2. Retire `ValidationResultView`

Delete `packages/web/src/generation-brief/ValidationResultView.tsx` and `packages/web/src/generation-brief/ValidationResultView.test.tsx`. Confirm no remaining import references.

## Files to Touch

- `packages/web/src/readiness/readiness-cross-page.test.tsx` (new)
- `packages/web/src/generation-brief/ValidationResultView.tsx` (delete)
- `packages/web/src/generation-brief/ValidationResultView.test.tsx` (delete)

## Out of Scope

- Any new production logic — this ticket is verification plus orphan removal only.
- Per-page wiring (owned by SPECREADIATHR-004/005/006).
- Doc amendments and the demo smoke path — `cross-spec: SPEC-foundational-doc-amendments-for-generation-readiness` (Phase 7) and the regression-plan Phase 8 cross-cutting work.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- packages/web/src/readiness/readiness-cross-page.test.tsx` — the full §Test requirements matrix across the three pages.
2. `npm test` — the full suite is green with `ValidationResultView` removed (proves no dangling importer).
3. `npm run typecheck && npm run lint`.

### Invariants

1. `grep -rn "ValidationResultView" packages/web/src` returns nothing and both `ValidationResultView` files are gone (`test ! -f`).
2. The gating matrix holds across all three pages: warnings never gate; blockers gate Preview and Generate; provider gates Generate only; Save is never gated.

## Test Plan

### New/Modified Tests

1. `packages/web/src/readiness/readiness-cross-page.test.tsx` — new: the cross-page §Test requirements + accessibility capstone, counts re-enumerated from a shared fixture.

### Commands

1. `npm test -- packages/web/src/readiness/readiness-cross-page.test.tsx`
2. `grep -rn "ValidationResultView" packages/web/src ; test ! -f packages/web/src/generation-brief/ValidationResultView.tsx`
3. `npm test && npm run typecheck && npm run lint` — full-suite verification is the correct boundary for a capstone that proves the composed pipeline and confirms the orphan removal broke nothing.

## Outcome

Completed: 2026-06-08

What changed:

- Added `packages/web/src/readiness/readiness-cross-page.test.tsx` covering warning-only non-gating across Generation Brief, Preview, and Generate; provider blocking Generate but not Preview; launch directive blockers gating Preview/Generate but not draft Save; stale readiness notices; display labels and technical raw-code/record details; keyboard-reachable field actions; and consistent checklist content across pages.
- Deleted `packages/web/src/generation-brief/ValidationResultView.tsx` and `packages/web/src/generation-brief/ValidationResultView.test.tsx` after all page consumers migrated.

Deviations from original plan:

- None. No production logic was changed in this capstone.

Verification:

- `npm test -- packages/web/src/readiness/readiness-cross-page.test.tsx` — passed.
- `rg -n "ValidationResultView" packages/web/src` — no matches.
- `test ! -f packages/web/src/generation-brief/ValidationResultView.tsx` — passed.
- `test ! -f packages/web/src/generation-brief/ValidationResultView.test.tsx` — passed.
- `npm test` — passed, 99 files / 597 tests.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
