# SPEC016RECGRITYP-005: Records grid presentation / CSS

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — adds records-grid presentation rules to `packages/web/src/styles.css` (label line-clamp + bounded width, horizontal-scroll container, sticky primary columns + sticky header). Styling only; no logic/schema change.
**Deps**: SPEC016RECGRITYP-003

## Problem

Even with per-type columns, the long primary-label cell wraps into a tall, narrow block, and the side detail pane squeezes the table so the rightmost columns clip off-screen. SPEC-016 §Primary-label and layout fixes specifies optical truncation (CSS line-clamp, never trimming the string), a horizontally-scrollable table container, and sticky primary columns + sticky header.

## Assumption Reassessment (2026-06-09)

1. Current CSS: `.recordTable th,td` has `vertical-align: top` with no overflow control (`styles.css:480–485`); `.recordTable { width: 100% }` (474–478); `.browserLayout` is a grid `minmax(0, 1fr) minmax(260px, 320px)` (373–377) with no horizontal-scroll container — these are the clip cause. `.linkButton` (486+) is the primary-label control reused by the grid.
2. The grid markup that these rules target (the per-type cells, the Label `linkButton`, the table within `.browserMain`) is produced by SPEC016RECGRITYP-003; this ticket only styles it. Class names introduced by 003 (e.g. a scroll-container wrapper / sticky-cell class) are the contract — keep them in sync with 003's markup.
3. Cross-artifact boundary under audit: the class names emitted by `RecordBrowser.tsx` (003/004) ↔ the selectors in `styles.css`. A renamed/absent class silently renders unstyled, so the selectors must match the markup 003 ships.
4. Modifies existing behavior (§20 no silent retcon): rationale is SPEC-016 §Problem (3) — the unbounded label block and the side-pane squeeze. Truncation is **optical only** (CSS `-webkit-line-clamp` / `overflow: hidden`); the underlying `displayLabel` string is never trimmed (the full text remains in the `title` attribute and the detail pane), preserving the records-as-authority principle.

## Architecture Check

1. Solving the clip with an `overflow-x: auto` container plus `position: sticky` on the Working-Set + Label columns and the header is the standard data-table pattern (NN/G, IBM Carbon, Polaris) and keeps the fix in CSS — no JS layout measurement. Bounding the Label column width with a 2-line clamp prevents the tall-block render while keeping full text available via `title`/detail.
2. No backwards-compatibility aliasing/shims: pure additive CSS; no override of unrelated table styling beyond the records grid.

## Verification Layers

1. Label cell is a 2-line optical clamp with bounded width, full text in `title` -> manual review against the running app (red-bunny EMOTION) + grep-proof of `-webkit-line-clamp: 2` on the label selector.
2. No off-screen clipping (table scrolls horizontally; Working-Set + Label columns stay sticky; header sticky on vertical scroll) -> manual review (SPEC016RECGRITYP-006 runbook) + grep-proof of `overflow-x: auto` + `position: sticky`.
3. Underlying string never trimmed -> FOUNDATIONS/records-authority review: truncation selectors are visual only; no JS `.slice` added in this ticket.

## What to Change

### 1. Label column presentation

Add a selector for the primary-label cell: bounded width (min ~280px, max ~440px), `display: -webkit-box; -webkit-line-clamp: 2; overflow: hidden`, top-aligned. (The `title` attribute and the `linkButton` link are emitted by 003.)

### 2. Horizontal-scroll container + sticky columns/header

Wrap-container selector with `overflow-x: auto`; `position: sticky` (with appropriate `left`/background) on the Working-Set and Label columns; keep the `thead` sticky on vertical scroll. Ensure empty cells ("—") inherit consistent alignment.

## Files to Touch

- `packages/web/src/styles.css` (modify)

## Out of Scope

- The grid markup / column construction (SPEC016RECGRITYP-003) and default-view logic (SPEC016RECGRITYP-004).
- Any new badge component for severity enums — spec §Risks assumes plain compact cells.
- The `RecordBrowser.test.tsx` / manual runbook (SPEC016RECGRITYP-006).

## Acceptance Criteria

### Tests That Must Pass

1. `npm run lint` — CSS/lint gates pass.
2. `npm run build` — the web bundle builds with the new styles.
3. `npm test` — full gates pass (no behavior regression).

### Invariants

1. The primary-label cell truncates **optically** (2-line clamp, bounded width); the `displayLabel` string is never shortened in code by this ticket.
2. The records table scrolls horizontally within its container and the Working-Set + Label columns plus the header remain visible (no off-screen clip) at the spec's layout.
3. Selectors target only the records grid; unrelated table styling is unchanged.

## Test Plan

### New/Modified Tests

1. `None — styling-only ticket; verification is manual (visual) per the SPEC016RECGRITYP-006 runbook plus build/lint gates. No component logic changes, so existing `RecordBrowser.test.tsx` coverage is the behavioral guard.`

### Commands

1. `npm run lint`
2. `npm run build`
3. A visual/manual check is the correct boundary for CSS because the project has no browser-automation harness for layout assertions; the clip/clamp behavior is confirmed in the SPEC016RECGRITYP-006 manual runbook against the red-bunny project.

## Outcome

Completed: 2026-06-09

What changed:
- Added records-table horizontal scrolling.
- Added sticky Working Set and Label columns plus sticky table headers.
- Added compact cell styling and a two-line optical clamp for the primary label button while preserving the full `displayLabel` string in the DOM/title.

Deviations from original plan:
- Kept this ticket CSS-only by making `.recordTable` the scroll container instead of adding a new wrapper element in `RecordBrowser.tsx`.

Verification:
- `npm run lint` — passed.
- `npm run build` — passed.
- `npm test` — passed.
- `rg -n --fixed-strings -- "-webkit-line-clamp: 2" packages/web/src/styles.css` — found the clamp rule.
- `rg -n "\\.slice\\(|substring\\(|substr\\(" packages/web/src/records/RecordBrowser.tsx packages/web/src/styles.css` — no matches.
