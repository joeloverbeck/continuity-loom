# PROJGATE-002: App-level error boundary so a render throw never blanks the app

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `@loom/web` shell (new `ErrorBoundary` component wrapping the content pane). No `@loom/core` or `@loom/server` changes.
**Deps**: None

## Problem

The web app has **no React error boundary anywhere** (grep-confirmed 2026-06-06). When any view throws during render, React unmounts the entire tree and the user is left with a blank white page that requires a manual reload. This was reproduced live: navigating to Generation Brief with no project open throws `TypeError: Cannot read properties of undefined (reading 'length')` (`packages/web/src/generation-brief/ValidationResultView.tsx:33`) and blanks the whole app — sidebar, nav, and all.

Regardless of the specific bug that throws (its data-layer cause is fixed in `archive/tickets/PROJGATE-003.md`), a single view's render failure must never take down the whole application. This ticket adds a boundary so a throw is contained to the content pane with a recoverable fallback, leaving navigation usable.

## Assumption Reassessment (2026-06-06)

1. No `ErrorBoundary`, `componentDidCatch`, or `getDerivedStateFromError` exists anywhere under `packages/web/src` (grep returned nothing). Verified.
2. The content area is rendered in `packages/web/src/shell/AppShell.tsx:83-98`: a `contentPane` div containing `ReminderRefreshProvider` → `DurableChangeReminder` + `<Routes>`. The sidebar/nav (`:73-82`) is a sibling of `contentPane`, so wrapping only the content pane preserves nav when a view throws. Verified by read.
3. The live-reproduced throw originates in `ValidationResultView.tsx:33` (`blockers.length` on an undefined `blockers`); the blank-page symptom is the *absence of a boundary*, which is what this ticket addresses. The data-layer cause is owned by `archive/tickets/PROJGATE-003.md`; this ticket is the render-safety net and is independent of it.
4. FOUNDATIONS principle under audit: §27 — "make dangerous actions hard to do accidentally." A whole-app blank-out on a recoverable view error is a hostile failure mode; a contained, recoverable fallback aligns with §27. No principle is tensioned; no storage, network, compiler, or validation surface is touched.

## Architecture Check

1. A single class-component error boundary wrapping the content pane is the standard React mechanism and the minimal correct fix. Wrapping the *content pane* (rather than the whole app at `App.tsx`) is cleaner because it keeps the sidebar and navigation alive, so the user can recover by navigating away — a whole-app boundary would blank the nav too.
2. No backwards-compatibility aliasing or shims. One new component, wired in one place.

## Verification Layers

1. A child that throws during render yields the fallback UI, not a blank document body -> RTL test rendering a throwing child inside the boundary.
2. The fallback offers recovery (re-render/reset or a route back to Project Library) and the surrounding nav remains mounted -> RTL test asserting nav is still present after a child throw.
3. §27 alignment (no accidental whole-app loss) -> FOUNDATIONS alignment check.

## What to Change

### 1. New error boundary component

Add `packages/web/src/shell/ErrorBoundary.tsx`: a class component implementing `getDerivedStateFromError` (and `componentDidCatch` for dev logging) that renders a recoverable fallback ("Something went wrong in this view") with a reset action and a `Link` to `/`. Resetting (or a route change) clears the error state so the user can continue.

### 2. Wire it into the shell

In `AppShell.tsx`, wrap the content-pane subtree (around `<Routes>`, inside `contentPane`) with `ErrorBoundary` so a thrown view is contained while the sidebar/nav remain mounted.

## Files to Touch

- `packages/web/src/shell/ErrorBoundary.tsx` (new)
- `packages/web/src/shell/AppShell.tsx` (modify)
- `packages/web/src/styles.css` (modify — fallback panel style, if needed)
- `packages/web/src/shell/ErrorBoundary.test.tsx` (new)

## Out of Scope

- Fixing the specific `validate()`/`ValidationPanel` defect that throws (`archive/tickets/PROJGATE-003.md`) and route gating (PROJGATE-001). This ticket is the render-safety net only.
- Global error telemetry, logging to disk, or any network reporting (would conflict with §23/§24 logging restraint; not needed here).

## Acceptance Criteria

### Tests That Must Pass

1. Rendering a component that throws inside `ErrorBoundary` shows the fallback UI; `document.body` is not blank.
2. After a child throw, the surrounding navigation (sidebar) remains mounted and usable.
3. The fallback's reset/recover action restores normal rendering when the underlying condition no longer throws.
4. `npm test --workspace @loom/web` passes; `npm run lint` and `npm run typecheck` pass.

### Invariants

1. A render-time throw in any single view never blanks the entire application; the failure is contained to the content pane.

## Test Plan

### New/Modified Tests

1. `packages/web/src/shell/ErrorBoundary.test.tsx` — throwing child renders fallback; nav survives; reset path recovers.

### Commands

1. `npm test --workspace @loom/web -- src/shell/ErrorBoundary.test.tsx`
2. `npm run lint && npm run typecheck && npm test`
3. The targeted boundary test is the correct verification surface for the new component; full `npm test` confirms the `AppShell` wiring causes no regression.

## Outcome

Completed: 2026-06-07

What changed:
- Added `packages/web/src/shell/ErrorBoundary.tsx`, a content-pane error boundary with a recoverable fallback, reset button, and Project Library link.
- Wrapped the routed content in `packages/web/src/shell/AppShell.tsx` with the boundary while leaving the sidebar and durable-change reminder outside the failure region.
- Added route-key reset behavior so navigation clears a prior view error.
- Added fallback styling in `packages/web/src/styles.css`.
- Added `packages/web/src/shell/ErrorBoundary.test.tsx` for fallback, nonblank body, reset, and surrounding-nav behavior.
- Extended `packages/web/src/shell/AppShell.test.tsx` to verify a throwing routed view is contained while primary navigation remains mounted and usable.

Deviations from original plan:
- The boundary includes a route-derived `resetKey` in addition to the reset button so route changes also recover from a previous view error.
- No telemetry or disk/network logging was added.

Verification results:
- `npm test --workspace @loom/web -- src/shell/ErrorBoundary.test.tsx src/shell/AppShell.test.tsx` passed.
- `npm test --workspace @loom/web` passed: 19 files, 116 tests.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 73 files, 438 tests.
