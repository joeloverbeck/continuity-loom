# SPEC011ACCSEGARC-004: Promote Accepted Segments nav surface + route

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — promotes the disabled `Accepted Segments` placeholder to a live primary route in `@loom/web`'s `AppShell`
**Deps**: SPEC011ACCSEGARC-003

## Problem

`AppShell.tsx` renders `"Accepted Segments"` as a disabled `<button>` from the `laterPhaseSurfaces`
array — there is no live nav entry or route to the browser. This ticket promotes it to a real
`primaryRoutes` entry with an enabled `NavLink` and a `<Route>` to the `AcceptedSegmentsView` that
003 created, mirroring the `Generate / Candidate` precedent, and updates the shell tests that
currently assert the disabled placeholder.

## Assumption Reassessment (2026-06-06)

1. **`AppShell` keeps `"Accepted Segments"` disabled today; `Generate / Candidate` is the live promotion precedent.** Verified: `packages/web/src/shell/AppShell.tsx:31` `const laterPhaseSurfaces = ["Accepted Segments"] as const;` rendered as `<button disabled>` at `:81-82`; `primaryRoutes` (`:20`) holds `{ to: "/generate", label: "Generate / Candidate" }` (`:26`) with its `<Route path="/generate" element={<GenerateView/>}/>` at `:95`. `"Accepted Segments"` is the **only** entry in `laterPhaseSurfaces`, so promoting it empties that array.
2. **The route target exists after 003.** `AcceptedSegmentsView` is created in `packages/web/src/accepted-segments/AcceptedSegmentsView.tsx` by 003 (intra-batch create-then-modify chain → `Deps: 003`). This ticket imports it and wires the `<Route>`; it adds no component logic.
3. **Cross-artifact boundary under audit: the shell nav/route table and the two shell tests that assert the disabled placeholder.** `AppShell.test.tsx:40,50` ("leaves Accepted Segments disabled" / `…disabled).toBe(true)`) and `App.test.tsx:108,136` ("keeps later-phase surfaces disabled" / `…disabled).toBe(true)`) both assert the placeholder and must be updated. (`GenerateView.test.tsx:69` asserts the *generate view* does not render the text "Accepted Segments" — unaffected by nav promotion, excluded.)
4. **FOUNDATIONS principles motivating this ticket (§6.5/§21/§29.8#4, §27):** the archive that §29.8#4 forbids hiding from review becomes reachable for the first time; §27 requires the browser be a distinct nav surface — this adds exactly one primary route, structurally peer to (not blended with) the record and candidate surfaces.
5. **Rename/removal blast radius:** removing `"Accepted Segments"` from `laterPhaseSurfaces` empties the array; `grep -rn laterPhaseSurfaces` shows it is referenced only in `AppShell.tsx` (def `:31`, render `:81`). Since no other later-phase surface remains and Phase 12's reminder is "not a nav surface" (spec), remove the now-empty `laterPhaseSurfaces` array and its render block rather than leaving dead code. Blast radius beyond `AppShell.tsx`: the two test files in item 3 — both join Files to Touch.

## Architecture Check

1. Reusing the `primaryRoutes` + `NavLink` + `<Route>` triad that `Generate / Candidate` already follows keeps all live surfaces uniform and the nav declarative. Removing the emptied `laterPhaseSurfaces` construct (rather than rendering a zero-length map) avoids dead code and a vestigial disabled-placeholder mechanism.
2. No backwards-compatibility shims. The disabled placeholder is removed outright, not hidden behind a flag; no alias route is kept.

## Verification Layers

1. Enabled nav + reachable route (an enabled `Accepted Segments` `NavLink` exists; navigating to `/accepted-segments` renders `AcceptedSegmentsView`) -> RTL render/navigation test in `AppShell.test.tsx`.
2. No disabled placeholder remains (no `<button disabled>` named `Accepted Segments`; `laterPhaseSurfaces` construct removed) -> updated negative assertions in `AppShell.test.tsx` + `App.test.tsx` and a grep-proof that `laterPhaseSurfaces` no longer appears in `AppShell.tsx`.

## What to Change

### 1. `AppShell.tsx`

Import `AcceptedSegmentsView` from `../accepted-segments/AcceptedSegmentsView.js`. Add `{ to: "/accepted-segments", label: "Accepted Segments" }` to `primaryRoutes` and a `<Route path="/accepted-segments" element={<AcceptedSegmentsView />} />` to `<Routes>`. Remove `"Accepted Segments"` from `laterPhaseSurfaces`; as that empties the array, remove the `laterPhaseSurfaces` declaration and its render block (no disabled placeholders remain).

### 2. `AppShell.test.tsx`

Replace the "leaves Accepted Segments disabled" assertion with: an enabled `Accepted Segments` nav link is present, and the `/accepted-segments` route renders `AcceptedSegmentsView`. Assert no disabled `Accepted Segments` button remains.

### 3. `App.test.tsx`

Update the "keeps later-phase surfaces disabled" expectation so it no longer asserts a disabled `Accepted Segments` button (it is now an enabled surface).

## Files to Touch

- `packages/web/src/shell/AppShell.tsx` (modify)
- `packages/web/src/shell/AppShell.test.tsx` (modify)
- `packages/web/src/App.test.tsx` (modify)

## Out of Scope

- The component's internals (list, metadata, filter, delete, export) — owned by 003.
- Server routes (001) and API clients (002).
- Any new nav surface for the Phase 12 durable-change reminder (it is not a nav surface).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -w @loom/web -- AppShell App` — an enabled `Accepted Segments` nav link is present; `/accepted-segments` renders `AcceptedSegmentsView`; no disabled `Accepted Segments` placeholder button exists in either test.
2. `grep -n laterPhaseSurfaces packages/web/src/shell/AppShell.tsx` returns nothing (construct removed).
3. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. `Accepted Segments` is a live `primaryRoutes` entry peer to the record/candidate/generate surfaces — one distinct nav surface, no blending with the editors (§27).
2. No disabled later-phase placeholder remains in the shell.

## Test Plan

### New/Modified Tests

1. `packages/web/src/shell/AppShell.test.tsx` — enabled link + route-renders assertions; placeholder-absent negative.
2. `packages/web/src/App.test.tsx` — updated later-phase expectation (no disabled `Accepted Segments`).

### Commands

1. `npm test -w @loom/web -- AppShell App`
2. `npm run typecheck && npm run lint && npm test && npm run build`
