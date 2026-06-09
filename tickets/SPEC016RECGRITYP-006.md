# SPEC016RECGRITYP-006: Capstone — web grid tests, manual smoke, docs

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — adds per-type/All-types/default-type/empty-state coverage to `packages/web/src/records/RecordBrowser.test.tsx` and verifies/updates `docs/user-guide.md`; no production behavior change (exercises the surfaces built by 001–005).
**Deps**: SPEC016RECGRITYP-004, SPEC016RECGRITYP-005

## Problem

SPEC-016's §Verification requires that the reworked records grid be proven end-to-end: EMOTION shows Affect kind/Intensity and not empty Salience/Urgency; "All types" shows only the minimal shared set; the default type on load is the most-populated type (URL overrides); the empty state renders; and Working Set + search/group still work. The original live defect (against the `red-bunny` project) must be re-checked by hand since the project has no browser-automation harness. This capstone owns the shared `RecordBrowser.test.tsx` (touched in behavior by 003/004) and the docs verification.

## Assumption Reassessment (2026-06-09)

1. The CI-runnable web tests live in `packages/web/src/records/RecordBrowser.test.tsx` (existing; fixtures at lines 29, 86, `filterFixtures`/`denseRecordFixtures` helpers) — this ticket extends them. The behaviors under test are produced by SPEC016RECGRITYP-003 (per-type columns, All-types minimal set, "—" cells) and -004 (default type, URL sync, default sort, empty state); -005 ships the CSS verified by manual runbook.
2. `docs/user-guide.md` was confirmed during `/reassess-spec` this session to contain **no** column/grid enumeration (grep for `column|grid|salience|urgency|all types` → 0 hits), so the SPEC-016 D6 doc edit is expected to be a **no-op**; this ticket re-verifies that and only adds a records-browsing line if the verification now finds an enumerated column list to correct.
3. Cross-artifact boundary under audit: the component behaviors (003/004) ↔ the test assertions here. The tests must re-enumerate expected columns from the manifest/fixtures at test start rather than hardcoding a column list that would go stale if the manifest changes.
4. This ticket modifies test/doc surfaces only and asserts no production behavior change — it exercises the pipeline 001–005 composed. The red-bunny smoke is a manual runbook because there is no browser-automation harness in the project (consistent with the capstone manual-runbook variant).

## Architecture Check

1. Concentrating the shared `RecordBrowser.test.tsx` edits in one trailing ticket avoids 003 and 004 both editing the same test file (merge-conflict + duplicated fixture churn) and lets the assertions exercise the fully-composed grid. Re-deriving expected columns from the manifest keeps the tests resilient to future manifest edits.
2. No backwards-compatibility aliasing/shims: tests and docs only; no production code path is added or wrapped.

## Verification Layers

1. Per-type columns (EMOTION → Affect kind/Intensity, no empty Salience/Urgency) -> `RecordBrowser.test.tsx` assertion.
2. "All types" minimal set (Working Set, Type, Label, Status, Updated) -> `RecordBrowser.test.tsx` assertion.
3. Default type on load = most-populated; `?type=` overrides; empty state for a zero-record type -> `RecordBrowser.test.tsx` assertions.
4. Working Set toggle + search/group still work -> existing `RecordBrowser.test.tsx` cases re-run.
5. Label clamp / no off-screen clip (CSS, 005) -> manual runbook against the `red-bunny` project (no automation harness).
6. `docs/user-guide.md` records-browsing description accurate (no stale column list) -> grep-proof / manual review.

## What to Change

### 1. Extend `RecordBrowser.test.tsx`

Add cases (deriving expected columns from `recordColumnManifest`/`allTypesColumns`, not hardcoded): (a) selecting EMOTION renders Affect kind + Intensity and **not** Salience/Urgency headers; (b) "All types" renders exactly the minimal shared headers; (c) default type on load is the most-populated fixture type, and mounting with `?type=FACT` selects FACT; (d) a type with zero records renders the three-part empty state with a "Create {TYPE}" action; (e) Working Set toggle and search/group still behave.

### 2. Manual smoke runbook (in this ticket; no automation harness)

Against `/home/joeloverbeck/stories/red-bunny` opened read-only via the standard Open Project flow:
1. Launch the app (`npm run dev` or `npm start`), open the project, navigate to `/records`.
2. Confirm the grid opens on the most-populated type (not "All types").
3. Filter to EMOTION → confirm Affect kind/Intensity columns, no empty Salience/Urgency.
4. Confirm the EMOTION label cell is a 2-line clamped, `title`-tooltipped, clickable link; full text shows in the detail pane.
5. Confirm the table scrolls horizontally with Working Set + Label sticky; no off-screen clipping with the detail pane open.
6. Switch to "All types" → confirm only Working Set, Type, Label, Status, Updated.

### 3. Verify `docs/user-guide.md`

Re-grep for an enumerated column list; if present and now inaccurate, update the records-browsing description; otherwise record the verified no-op.

## Files to Touch

- `packages/web/src/records/RecordBrowser.test.tsx` (modify)
- `docs/user-guide.md` (modify)

## Out of Scope

- All production logic (built in SPEC016RECGRITYP-001…005) — this ticket adds no runtime behavior.
- Reference-field resolution, user-configurable columns, saved views — spec §Out of Scope.

## Acceptance Criteria

### Tests That Must Pass

1. `npx vitest run packages/web/src/records/RecordBrowser.test.tsx` — all new and existing cases pass: EMOTION per-type columns, "All types" minimal set, default-type-on-load (+`?type=` override), empty state, Working Set + search/group.
2. `npm run lint && npm run typecheck && npm test` — full gates pass.
3. Manual runbook steps 1–6 complete with the expected observable results (implementer checklist; not CI-gated).

### Invariants

1. Expected column sets in the tests are derived from the core manifest/fixtures, not hardcoded, so they track manifest changes.
2. `docs/user-guide.md` contains no stale column enumeration after this ticket (verified-empty or corrected).
3. No production behavior is added by this ticket; it only exercises and documents 001–005.

## Test Plan

### New/Modified Tests

1. `packages/web/src/records/RecordBrowser.test.tsx` (modify) — per-type columns, All-types minimal set, default-type-on-load + URL override, empty state, preserved Working Set/search/group.
2. `docs/user-guide.md` (modify) — records-browsing description verification (expected no-op).

### Commands

1. `npx vitest run packages/web/src/records/RecordBrowser.test.tsx`
2. `npm test`
3. The component test plus the manual runbook is the correct verification boundary: the CI-runnable behaviors are asserted in Vitest, while the CSS clip/clamp and the live red-bunny reproduction have no automation harness and are confirmed by the runbook.
