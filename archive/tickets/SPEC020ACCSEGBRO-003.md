# SPEC020ACCSEGBRO-003: Bulk disclosure and jump/back navigation controls

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — `@loom/web` `AcceptedSegmentsView` (Expand/Collapse-all toolbar controls, Jump-to-latest / Back-to-top navigation controls), `packages/web/src/styles.css` (floating-nav CSS), and its component test; no `@loom/core`/`@loom/server`/schema/storage change
**Deps**: `archive/tickets/SPEC020ACCSEGBRO-001.md`, `archive/tickets/SPEC020ACCSEGBRO-002.md`

## Problem

With collapsed-by-default disclosure (`archive/tickets/SPEC020ACCSEGBRO-001.md`) and land-on-latest (`archive/tickets/SPEC020ACCSEGBRO-002.md`) in place, two access affordances remain: whole-story reading and in-page find (Ctrl+F) require re-expanding everything at once, and on a tall archive the user needs quick ways to return to the latest segment or the top. This ticket adds "Expand all" / "Collapse all" toolbar controls and "Jump to latest" / "Back to top" navigation controls with proper focus management. SPEC-020 Deliverable D3 (and the floating-nav portion of D5).

## Assumption Reassessment (2026-06-10)

1. Current code checked: the archive toolbar lives in `<div className="acceptedArchiveToolbar">` (`packages/web/src/accepted-segments/AcceptedSegmentsView.tsx:107-125`) holding the filter input and the export buttons (`acceptedExportActions`). After `archive/tickets/SPEC020ACCSEGBRO-001.md` the component owns a per-`id` expansion-state model; after `archive/tickets/SPEC020ACCSEGBRO-002.md` it owns a focus-the-target helper for the latest/anchor segment. This ticket reuses both. `styles.css` carries the existing `acceptedArchiveToolbar` rules at `packages/web/src/styles.css:1095` and a responsive block at `:1415`.
2. Current specs/docs checked: `specs/SPEC-020-...md` §Approach (Structure §5-§6), Deliverable D3; `docs/FOUNDATIONS.md` §21 (whole-story reading in order), §27 (UI affordances, no new editing affordance on the read-only archive).
3. Shared boundary under audit: this ticket mutates `archive/tickets/SPEC020ACCSEGBRO-001.md`'s expansion-state map (Expand/Collapse all set every segment's tracked state) and reuses `archive/tickets/SPEC020ACCSEGBRO-002.md`'s scroll+focus-the-target logic (Jump-to-latest). Both are the contracts under audit; this ticket adds no new state authority, only bulk operations over the existing map and reuse of the existing focus helper.
4. FOUNDATIONS principle restated: §21 — "Expand all" restores reading the whole story in order and in-page find over the full prose; §27 — the controls are read/navigation affordances only and introduce no editing of accepted prose, keeping the archive a read-only "archive of cloth". Jump/Back move **focus**, not just the viewport, so keyboard and screen-reader users are not stranded.
5. Mismatch + correction: none — the find-in-page contract (collapsed rows hold no prose in the DOM, so "Expand all" is the deliberate find path) was settled in SPEC-020 §Approach §2/§5 during the in-session `/reassess-spec`; this ticket implements "Expand all" as that path.

## Architecture Check

1. Implementing Expand/Collapse all as a bulk write over `archive/tickets/SPEC020ACCSEGBRO-001.md`'s existing per-`id` expansion map (rather than a separate "all expanded" boolean) keeps a single source of truth for expansion and composes correctly with per-segment toggles and the filter override. Jump-to-latest reusing `archive/tickets/SPEC020ACCSEGBRO-002.md`'s scroll+focus helper avoids a second, divergent focus path. The Jump/Back controls are gated on usefulness (list taller than viewport / scrolled away) so they do not clutter a short archive.
2. No backwards-compatibility shims: the controls are additive UI over existing state; no alternate expansion model or duplicate focus path is introduced.

## Verification Layers

1. Expand all / Collapse all affect every segment (§21 whole-story reading) -> component test: after "Expand all" every segment's prose is in the DOM; after "Collapse all" only summary rows remain.
2. Jump-to-latest moves focus to the latest segment -> component test: activating it sets `document.activeElement` to the latest segment's heading/trigger (reusing the 002 helper).
3. Back-to-top moves focus to the top of the archive -> component test: activating it moves focus to the archive top target, not only the viewport.
4. Controls carry accessible names and appear only when useful -> component test / manual review: buttons have accessible names; Jump/Back are conditionally rendered on a tall/scrolled list.

## What to Change

### 1. Expand all / Collapse all (toolbar)

Add "Expand all" and "Collapse all" controls to the `acceptedArchiveToolbar`. Each performs a bulk write over the `archive/tickets/SPEC020ACCSEGBRO-001.md` expansion-state map: "Expand all" marks every segment expanded (restoring whole-story reading and Ctrl+F over the full prose, which is otherwise unavailable because collapsed rows hold no prose in the DOM); "Collapse all" marks every segment collapsed.

### 2. Jump to latest / Back to top (navigation controls)

Add a "Jump to latest" control (reusing the `archive/tickets/SPEC020ACCSEGBRO-002.md` scroll+focus-the-latest helper) and a "Back to top" control that moves focus to the top of the archive. Both move **focus**, not just the viewport, and carry accessible names. Render them only when useful (the list is taller than the viewport / the user has scrolled away) — e.g. floating/sticky.

### 3. Floating-nav CSS (`styles.css`, part of D5)

Add plain-CSS for the floating/sticky navigation controls and any toolbar-button additions, consistent with the existing `acceptedArchiveToolbar` / `acceptedExportActions` rules; no new framework or dependency.

## Files to Touch

- `packages/web/src/accepted-segments/AcceptedSegmentsView.tsx` (modify)
- `packages/web/src/styles.css` (modify)
- `packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx` (modify)

## Out of Scope

- The disclosure unit, expansion-state model, stable index, and filter override — `archive/tickets/SPEC020ACCSEGBRO-001.md`.
- Land-on-latest landing and `#segment-<sequence>` deep links — `archive/tickets/SPEC020ACCSEGBRO-002.md` (this ticket reuses its focus helper).
- User-guide refresh, verification gate, archival — SPEC020ACCSEGBRO-004.
- Any change to export, delete, sequence storage, prompt compilation, or validation.

## Acceptance Criteria

### Tests That Must Pass

1. "Expand all" puts every segment's full prose in the DOM; "Collapse all" leaves only summary rows.
2. "Jump to latest" sets `document.activeElement` to the latest segment's heading/trigger.
3. "Back to top" moves focus to the archive-top target.
4. The Expand/Collapse-all and Jump/Back controls expose accessible names; Jump/Back render only on a tall/scrolled list.

### Invariants

1. Expansion remains governed by the single `archive/tickets/SPEC020ACCSEGBRO-001.md` per-`id` state map; bulk controls write that map and introduce no second expansion authority.
2. The controls are read/navigation affordances only — no editing of accepted prose and no prompt-context affordance is introduced (§27 / §10).

## Test Plan

### New/Modified Tests

1. `packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx` — add Expand-all / Collapse-all (assert prose presence/absence across all segments), Jump-to-latest (focus via `document.activeElement`), Back-to-top (focus target), and accessible-name cases. Reuse the `window.matchMedia` / `Element.prototype.scrollIntoView` stubs introduced in `archive/tickets/SPEC020ACCSEGBRO-002.md`.

### Commands

1. `npx vitest run packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx`
2. `npm run lint && npm run typecheck && npm test && npm run build`
3. The targeted vitest run is the correct inner boundary (single-component control additions); the four-command gate is the outer boundary per SPEC-020 §Verification.

## Outcome

Completed: 2026-06-10

What changed:
- Added toolbar `Expand all` and `Collapse all` controls that bulk-write the existing per-segment expansion map.
- Added conditional accepted-archive navigation with `Back to top` and `Jump to latest` controls when the archive is taller than the viewport or scrolled.
- Reused the segment scroll/focus helper for Jump-to-latest and added top-section focus for Back-to-top.
- Added sticky navigation CSS consistent with the existing accepted archive surface.
- Extended component coverage for expand/collapse-all, hidden navigation on short archives, accessible navigation controls, and focus movement for Back-to-top and Jump-to-latest.

Deviations from original plan:
- None. The controls are additive read/navigation affordances over the existing expansion and focus state.

Verification:
- `npx vitest run packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx` — passed.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed.
- `npm run build` — passed, with Vite's existing large-chunk advisory.
