# SPEC017GENBRIVIS-005: Contextual save bar

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — replaces the bottom-only save button and top-only stale notice with a sticky dirty-state save bar plus its CSS; save semantics unchanged
**Deps**: SPEC017GENBRIVIS-002

## Problem

The only save affordance is a single button at the very bottom of ~7,900 px of scroll, and the only "readiness may be stale" notice is at the very top; a user editing mid-page sees neither (SPEC-017 Problem Statement §6). This ticket adds a sticky contextual save bar that appears only when the form is dirty, carrying the stale-readiness notice and the single Save button, and removes the bottom-only button and top-only notice.

## Assumption Reassessment (2026-06-10)

1. State + handlers (verified in `packages/web/src/generation-brief/GenerationBriefView.tsx`): `hasUnsavedChanges` (`:122`) is set `true` on every edit (via `updateSurface`, `:257`) and `false` on load (`:138`) and after a successful save (`:309`); `save()` (`:286–316`) issues the single partial-merge `PUT` through `setGenerationBrief` and sets the "Draft saved." status (`:308`). The bottom-only button is at `:838`; the top-only stale notice is at `:374–376`; the `status`/`statusSuccess` "Draft saved." line is at `:360–363`.
2. SPEC-017 D4: a sticky bottom bar inside the brief surface appears only when `hasUnsavedChanges` is `true` — "Unsaved changes — readiness shown above may be stale" plus the **Save Generation Brief** button (the same single partial-merge `save()`; no autosave, no per-card saves). It replaces the bottom-only button and the top-only stale notice; the "Draft saved." status notice remains.
3. Shared boundary under audit: this ticket and the rail (SPEC017GENBRIVIS-004) both modify `GenerationBriefView.tsx` and `styles.css` and both depend on the SPEC017GENBRIVIS-002 restructure; they are otherwise independent (coordinate the mechanical merge). The save bar wraps the existing `save()` and changes neither the payload nor the route.
4. FOUNDATIONS §6.3 / §27: draft saving must remain unblocked for a structurally saveable draft and the UI should show whether the draft saved and whether readiness is stale; the bar makes dirty state more visible while preserving partial-merge persistence. §29.5: the bar is informational and never gates save — saving an incomplete draft stays ordinary authoring work.
5. Adjacent-behavior classification: removing the bottom button and the top stale notice is a required consequence of consolidating to one save affordance (§20: cited, no silent retcon) — `save()`'s logic, payload, and the "Draft saved." confirmation are unchanged.

## Architecture Check

1. A single dirty-state bar gives one save mechanism (research-backed contextual save bar) instead of a bottom button plus a detached top notice, and surfaces dirty/stale state where the editing happens. It reuses `hasUnsavedChanges` and `save()` directly — no new state machine.
2. No backwards-compatibility aliasing/shims: the bottom button and top notice are removed, not left as dead alternates beside the new bar.

## Verification Layers

1. The save bar is present iff `hasUnsavedChanges` and disappears after a successful save → `GenerationBriefView.test.tsx` (edit a field → bar appears; resolve a mocked successful save → bar gone, "Draft saved." shown).
2. Save still issues the single partial-merge `PUT` and shows "Draft saved." → updated save test asserting `setGenerationBrief` is called once with the unchanged payload shape.
3. The bottom-only button and top-only stale notice no longer exist → grep-proof they are gone from `GenerationBriefView.tsx`.

## What to Change

### 1. Contextual save bar

In `GenerationBriefView.tsx`, render a sticky bar inside the brief surface, shown only when `hasUnsavedChanges` is `true`: the stale-readiness text plus the **Save Generation Brief** button wired to the existing `void save()`.

### 2. Remove the superseded affordances

Remove the bottom-only `<button>` (`:838`) and the top-only stale `<p className="status statusWarning">` notice (`:374–376`). Keep the "Draft saved." status line and the `shapeIssues` details.

### 3. Save-bar styles

Add the sticky save-bar container, dirty-state visibility, and button styling to `styles.css`.

## Files to Touch

- `packages/web/src/generation-brief/GenerationBriefView.tsx` (modify)
- `packages/web/src/styles.css` (modify)
- `packages/web/src/generation-brief/GenerationBriefView.test.tsx` (modify)

## Out of Scope

- The sticky section rail and fill chips (SPEC017GENBRIVIS-004).
- Autosave and per-section/per-card saves (SPEC-017 Out of Scope).
- Any change to the `PUT /api/generation-brief` payload, `save()` semantics, routes, or readiness logic.

## Acceptance Criteria

### Tests That Must Pass

1. `GenerationBriefView.test.tsx`: editing a field shows the save bar; a successful save hides it and shows "Draft saved."; no bar is shown on initial load.
2. `setGenerationBrief` is invoked exactly once per save with the same payload shape as before (no autosave, no extra calls).
3. `npm test --workspace @loom/web` and `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. There is exactly one save affordance — the contextual bar; the bottom-only button and top-only stale notice are gone.
2. Saving an incomplete-but-structurally-saveable draft is never blocked by the bar.

## Test Plan

### New/Modified Tests

1. `packages/web/src/generation-brief/GenerationBriefView.test.tsx` — save-bar appears-on-dirty / hides-on-save cases; payload-unchanged assertion.

### Commands

1. `npm test --workspace @loom/web -- GenerationBriefView`
2. `npm run lint && npm run typecheck && npm test`
3. `grep -n "Save Generation Brief" packages/web/src/generation-brief/GenerationBriefView.tsx` — confirms the single save affordance is the bar (expect the button text to appear once, inside the bar).
