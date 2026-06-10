# SPEC020ACCSEGBRO-002: Land-on-latest landing and #segment-<sequence> deep links

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — `@loom/web` `AcceptedSegmentsView` (mount + `hashchange` landing/deep-link effect, per-segment `id` anchors) and its component test; no `@loom/core`/`@loom/server`/schema/storage change
**Deps**: SPEC020ACCSEGBRO-001

## Problem

After SPEC020ACCSEGBRO-001 the browser collapses by default with the latest segment expanded, but it still lands at `scrollY 0`, so the dominant task — reviewing the most recent segment — costs a full-archive scroll on every visit. There is also no per-segment anchor, so an older segment cannot be linked or returned to directly. This ticket lands the view on the latest segment (scrolled into view and focused) and adds stable `#segment-<sequence>` deep links that take precedence over the latest-default. SPEC-020 Deliverable D2.

## Assumption Reassessment (2026-06-10)

1. Current code checked: `AcceptedSegmentsView` (`packages/web/src/accepted-segments/AcceptedSegmentsView.tsx`) is a self-contained component with no React Router hooks today; it loads segments in a mount `useEffect` (lines 22-24) and renders the list built by SPEC020ACCSEGBRO-001. The "latest" segment is the highest-`sequence` element of the `sortSegments` result (lines 233-235). The route is mounted at `/accepted-segments` in `packages/web/src/shell/AppShell.tsx:125` under `<RequireProject>`; the app uses `react-router-dom` `^7.17.0` (`packages/web/package.json:22`).
2. Current specs/docs checked: `specs/SPEC-020-...md` §Approach (Structure §3-§4), Deliverable D2, and §Risks ("Hash precedence vs. land-on-latest", "Scroll restoration interplay with React Router"); `docs/FOUNDATIONS.md` §21 (segments visible individually and in order — landing on latest makes the dominant review target more visible without hiding the rest).
3. Shared boundary under audit: this ticket consumes SPEC020ACCSEGBRO-001's programmatic expansion control — landing/deep-linking must be able to force a target segment expanded. It must not regress 001's invariant that every segment stays individually listed in order.
4. FOUNDATIONS principle restated: §21 / §29.8 #4 — moving the viewport/focus to the latest segment and supporting per-segment anchors increases access without removing any segment from the ordered list; nothing is hidden, paginated, or virtualized. No prompt-context or compilation surface is touched.
5. Mismatch + correction: none — the mount-only-vs-`hashchange` gap was already corrected into SPEC-020 (§Approach §4, Deliverable D2) during the in-session `/reassess-spec`; this ticket implements the corrected, hashchange-reactive behavior.

## Architecture Check

1. Resolving the landing target from `window.location.hash` (or a `useLocation()` hash dependency) inside an effect keyed on the hash — rather than only on mount — is necessary because under React Router v7 the view is not remounted when only the hash changes on the same `/accepted-segments` route; a mount-only effect would silently ignore same-route deep-link navigation (in-app anchor click, browser back/forward). Moving focus (not just the viewport) via `tabindex="-1"` + programmatic `focus()` keeps keyboard and screen-reader users landed on the same target as sighted users.
2. No backwards-compatibility shims: no global router scroll-restoration is added or depended upon; the view owns its own landing/anchor resolution and the stale-hash case falls back to the latest-default silently (no error state, no flag).

## Verification Layers

1. Land-on-latest moves focus to the latest segment (§21 dominant-task access) -> component test: on mount with no hash, `document.activeElement` is the latest segment's heading/trigger.
2. Deep-link precedence -> component test: with `#segment-<sequence>` of an older segment, that segment is expanded, targeted, and focused instead of the latest.
3. Stale/unknown hash safety (§Risks) -> component test: a hash for a non-existent sequence falls back to latest-segment behavior with no thrown error / no error UI.
4. `prefers-reduced-motion` honored -> component test: with `matchMedia('(prefers-reduced-motion: reduce)')` stubbed to match, landing uses an instant jump (no smooth-scroll request).
5. Hashchange reactivity (React Router v7 no-remount) -> component test: changing the hash while the view stays mounted re-resolves the target.

## What to Change

### 1. Land-on-latest on mount

When the view becomes ready with no `#segment-<sequence>` hash, ensure the latest segment is expanded (its 001 default), scroll it into view, and move focus to its heading/trigger using `tabindex="-1"` + programmatic `focus()`. Honor `prefers-reduced-motion` via `window.matchMedia('(prefers-reduced-motion: reduce)')` — instant jump (no smooth scroll) when it matches.

### 2. Per-segment anchors

Give each segment element a stable `id="segment-<sequence>"` derived from the immutable stored `sequence` (not the display index), so anchors survive filtering and renumbering.

### 3. Hash-driven deep links with precedence

On an incoming `#segment-<sequence>` hash, expand that segment, scroll to it, and focus it — taking precedence over the latest-default. An unknown or missing hash target falls back to the land-on-latest behavior without error.

### 4. React to hash changes, not only mount

Drive the landing/deep-link resolution from an effect that responds to `location.hash` changes (a `hashchange` listener or a `useLocation()` hash dependency), so same-route deep-link navigation re-applies expand/scroll/focus and the stale-hash fallback on each resolution.

## Files to Touch

- `packages/web/src/accepted-segments/AcceptedSegmentsView.tsx` (modify)
- `packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx` (modify)

## Out of Scope

- The disclosure unit, expansion state model, stable display index, and filter override — delivered in SPEC020ACCSEGBRO-001.
- Expand all / Collapse all and Jump-to-latest / Back-to-top toolbar/floating controls — SPEC020ACCSEGBRO-003 (this ticket provides the focus-target logic those reuse).
- Any global React Router scroll-restoration change — explicitly not in scope (SPEC-020 §Risks); the view manages only its own landing.
- User-guide refresh, verification gate, archival — SPEC020ACCSEGBRO-004.

## Acceptance Criteria

### Tests That Must Pass

1. On mount with no hash, the latest segment is scrolled into view and `document.activeElement` is its heading/trigger.
2. With `/accepted-segments#segment-<sequence>` for an older segment, that segment (not the latest) is expanded, scroll-targeted, and focused.
3. An unknown/stale `#segment-<sequence>` hash falls back to the latest-segment landing with no thrown error and no error UI.
4. With `prefers-reduced-motion` stubbed to match, the landing performs an instant jump (no smooth-scroll behavior requested).
5. Changing the hash while the component stays mounted re-resolves to the new target.

### Invariants

1. Landing and deep-linking only move the viewport/focus and expand a target; no segment is removed from the ordered list and no segment is hidden from review (§21 / §29.8 #4).
2. Anchors key on the immutable stored `sequence`, so a deep link is stable across filtering and display-index changes.

## Test Plan

### New/Modified Tests

1. `packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx` — add land-on-latest (focus via `document.activeElement`), deep-link precedence, stale-hash fallback, reduced-motion instant-jump, and hashchange-reactivity cases. Stub `window.matchMedia` and `Element.prototype.scrollIntoView` in setup (jsdom implements neither), mirroring the existing `Blob`/`URL` stubbing pattern in that file.

### Commands

1. `npx vitest run packages/web/src/accepted-segments/AcceptedSegmentsView.test.tsx`
2. `npm run lint && npm run typecheck && npm test && npm run build`
3. The targeted vitest run is the correct inner boundary (single-component effect change); the four-command gate is the outer boundary per SPEC-020 §Verification.
