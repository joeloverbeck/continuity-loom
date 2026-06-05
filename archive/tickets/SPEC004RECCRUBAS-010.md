# SPEC004RECCRUBAS-010: Web active-working-set membership surface and browser quick-toggle

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — `@loom/web` active-working-set surface + browser working-set column/filter/toggle
**Deps**: SPEC004RECCRUBAS-006, SPEC004RECCRUBAS-004

## Problem

The Phase-4 gate requires "active working set inclusion can be toggled manually." This ticket adds the minimal, manual-authority-first working-set membership surface: a dedicated view listing selected records by type with quick toggle, plus a working-set column / filter / quick select-deselect on the record browser. Membership is read/written through the working-set routes (-004) over `generation_session.active_working_set.selected_records`. The full curation workflow (cast inclusion bands, local function, POV, voice pressure, focus tags, stop guidance, "what will compile" preview) is Phase 5; this ticket delivers membership only.

## Assumption Reassessment (2026-06-05)

1. Foundations exist: the record browser from SPEC004RECCRUBAS-006 (`packages/web/src/records/RecordBrowser.tsx`); the working-set get/set routes + api wrappers from SPEC004RECCRUBAS-004/-005 (`GET/PUT /api/working-set`, membership-only over the SPEC004RECCRUBAS-002-relaxed schema). Browser quick-toggle and working-set filter were deliberately deferred from -006 to this ticket because they require the working-set read route.
2. Spec `specs/SPEC-004-...md` (Approach → minimal active-working-set surface; UI-WORKFLOWS.md "Active working set curation") requires explicit, manual selection — selected records visible by type, quick toggle, no hidden auto-selection, no silent add/remove. Cast bands and `local_function` are explicitly Phase 5.
3. Shared boundary under audit: the **working-set route contract** (-004) and the **browser component** (-006, which this ticket modifies to add the working-set column/filter/toggle — a create-then-modify chain, hence `Deps: -006`). Membership state is the single `active_working_set.selected_records` list; this surface never writes other brief fields.
4. FOUNDATIONS §7 (active working set supremacy — a first-class manual authorial decision) and §29.3 (no silent add/remove of selected records) motivate a surface where every membership change is an explicit user toggle; no deterministic "helper" adds or removes records, and the UI never auto-includes globally-important records.

## Architecture Check

1. Building membership on the single canonical `selected_records` list (via -004) means Phase 5's full curation extends the same state with no migration and no parallel "selected" representation to reconcile. Adding the toggle to the existing browser (rather than a separate list) keeps selection where the user already compares records.
2. No backwards-compatibility shim: net-new surface + an additive browser column/filter; no alias over a prior selection mechanism (none existed).

## Verification Layers

1. Toggling a record's membership persists via the working-set route and is reflected in both the browser column and the dedicated surface -> web component test with mocked working-set routes.
2. The working-set filter shows only selected records; deselect removes membership -> component test.
3. No membership change occurs without an explicit user toggle (no auto-inclusion on load/filter) -> component test asserting load issues only a GET, never a PUT.

## What to Change

### 1. Working-set membership surface

Add `packages/web/src/working-set/WorkingSetView.tsx` under the shell's Active Working Set route: lists currently-selected records grouped by type (resolved from the records list + the working-set membership), each with a remove/toggle control; empty state when none selected.

### 2. Browser working-set column / filter / quick-toggle

Extend `RecordBrowser.tsx` with an active-working-set column (in/out indicator), an active-working-set filter, and a quick select/deselect control per row, all writing through `PUT /api/working-set`.

## Files to Touch

- `packages/web/src/working-set/WorkingSetView.tsx` (new)
- `packages/web/src/records/RecordBrowser.tsx` (modify) — working-set column/filter/quick-toggle (created by SPEC004RECCRUBAS-006; `Deps` declared)
- `packages/web/src/shell/` (modify) — register the Active Working Set route (shared with sibling web tickets; mechanical merge)
- `packages/web/src/working-set/WorkingSetView.test.tsx` (new)
- `packages/web/src/records/RecordBrowser.test.tsx` (modify) — quick-toggle + working-set filter cases

## Out of Scope

- Full working-set curation: cast inclusion bands, `local_function`, POV selection, current voice pressure, voice overrides, validation focus tags, stop guidance, "what will compile" preview — Phase 5.
- Continuity validation / risky-omission warnings/blockers — Phase 6.
- Compilation of the working set into a prompt — Phase 7.

## Acceptance Criteria

### Tests That Must Pass

1. Quick-toggling a record in the browser persists membership via `PUT /api/working-set` and updates both the browser column and the Active Working Set view.
2. The working-set filter shows only selected records; the dedicated view lists selected records grouped by type with a working remove control.
3. Loading either surface issues only a working-set GET (never an implicit PUT) — no auto-inclusion.
4. `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` pass.

### Invariants

1. Every working-set membership change is an explicit user action — no silent/auto add or remove (FOUNDATIONS §7/§29.3).
2. The surface writes only `selected_records`; it never fabricates other generation-time-brief fields.

## Test Plan

### New/Modified Tests

1. `packages/web/src/working-set/WorkingSetView.test.tsx` — selected-by-type listing, remove/toggle, empty state, GET-only-on-load.
2. `packages/web/src/records/RecordBrowser.test.tsx` (modify) — working-set column/filter + quick-toggle persistence.

### Commands

1. `npx vitest run --environment jsdom packages/web/src/working-set/WorkingSetView.test.tsx packages/web/src/records/RecordBrowser.test.tsx`
2. `npm test && npm run typecheck && npm run lint && npm run build`
