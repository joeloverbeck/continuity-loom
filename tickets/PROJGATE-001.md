# PROJGATE-001: Shared project-open state, navigation gating, and route guards

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — `@loom/web` shell (new project-open context, `AppShell` nav/routes, `ProjectPicker`, `DurableChangeReminder`). No `@loom/core` or `@loom/server` changes.
**Deps**: None (`archive/tickets/PROJGATE-002.md` and `archive/tickets/PROJGATE-003.md` have landed)

## Problem

With no project open, the seven project-scoped menu items — Records, Active Working Set, Generation Brief, Validation / Prompt Preview, Generate / Candidate, Accepted Segments, Story Configuration — are fully reachable and immediately fire project-scoped API calls on mount. The server fails closed with HTTP 409 `no-open-project`, which surfaces as console errors on every one of those views (live-reproduced 2026-06-06). The web app has **no shared notion of whether a project is open**: `ProjectPicker` (`packages/web/src/ProjectPicker.tsx`) and `DurableChangeReminder` (`packages/web/src/shell/DurableChangeReminder.tsx:48`) each call `getProject()` independently, and `AppShell` renders all routes unconditionally. This structural gap is the root cause of the mount-time 409s and the precondition for the Generation Brief crash tracked in `archive/tickets/PROJGATE-002.md` / `archive/tickets/PROJGATE-003.md`.

This ticket introduces a single source of truth for project-open state, gates the project-scoped navigation when no project is open (disabled-but-visible per the approved UX), and guards the routes so a typed URL or programmatic `navigate()` cannot mount a data-fetching view with no project.

## Assumption Reassessment (2026-06-06)

1. `packages/web/src/shell/AppShell.tsx:23-33` defines `primaryRoutes` (nine entries) and `:86-96` renders all nine `<Route>`s unconditionally; nav links at `:75-81` are plain `NavLink`s with no project-state awareness. Verified by read.
2. Project-open state is detected via `getProject()` (`packages/web/src/api.ts:256`) returning `ProjectOpenState = ProjectStatus | { open: false }` (`api.ts:23`). `ProjectStatus` (`packages/core/src/project-storage.ts:40-49`) has **no `open` field**; a project is therefore open exactly when `!("open" in project)`. `DurableChangeReminder.tsx:54` already uses the inverse idiom `"open" in project && !project.open` to detect *closed*. Verified by read.
3. Shared boundary under audit: the **project-open truth** consumed by navigation, route guarding, `ProjectPicker`, and `DurableChangeReminder`. Today there is no single owner; this ticket makes the shell the owner via a new context, mirroring the existing `ReminderRefreshProvider` pattern at `packages/web/src/shell/reminder-refresh.tsx`.
4. FOUNDATIONS principle under audit: §27 (UI and workflow). The fix advances "clear distinction between [surfaces]," "make dangerous actions hard to do accidentally," and "respect power users without punishing ordinary users." Disabled-but-visible nav (rather than hiding) keeps surfaces discoverable; route guards keep the no-project state safe. No principle is tensioned. §4.10 / §24 local-first ownership is untouched (no storage or network change).
5. Adjacent contradiction (classified as a **required consequence** of this ticket): once the shell owns project-open truth, `DurableChangeReminder`'s independent `getProject()` open-check (`DurableChangeReminder.tsx:48-57`) becomes a duplicate authority path, which the project bans. This ticket replaces that inline open-check with consumption of the new context; the reminder's own `getDurableChangeReminder()` fetch is retained. (`ProjectPicker`'s `getProject()` read is the library surface itself and stays, but it must trigger a context refresh after open/create/close.)

## Architecture Check

1. A single shell-level `ProjectOpenProvider` (one fetch, one refresh signal) is cleaner than the status quo of three independent `getProject()` callers and a fourth-and-fifth that would be added by gating + guarding. It mirrors the already-accepted `ReminderRefreshProvider` shape, so it introduces no novel pattern. Disabled-but-visible nav + a shared `RequireProject` route wrapper centralizes the precondition in one place instead of duplicating "open a project first" handling inside each view.
2. No backwards-compatibility aliasing or shims. The new context replaces — does not duplicate — `DurableChangeReminder`'s inline open-check; no parallel/legacy project-open path is left behind.

## Verification Layers

1. Project-open truth has exactly one owner (no duplicate `getProject()` open-checks outside the provider and `ProjectPicker`) -> codebase grep-proof.
2. Project-scoped nav items are inert when no project is open and active when one is -> manual review + RTL test (`AppShell` rendered with provider in both states).
3. Direct navigation to a guarded route with no project renders the shared "open a project first" panel, not the data view (no project-scoped fetch fires) -> RTL test asserting the view's data-fetch API is not called.
4. Opening/creating/closing a project updates nav and guards without a full reload -> RTL test driving `ProjectPicker` open → guarded view becomes reachable.
5. §27 alignment (discoverable, hard-to-misuse navigation) -> FOUNDATIONS alignment check.

## What to Change

### 1. New shared project-open context

Add `packages/web/src/shell/project-open.tsx`, modeled on `reminder-refresh.tsx`:
- `ProjectOpenProvider` fetches `getProject()` on mount, derives `isProjectOpen` (`!("open" in project)`), and exposes `{ isProjectOpen: boolean | undefined, refreshProjectOpen() }`. `undefined` represents the not-yet-loaded state so nav can avoid flicker.
- `useProjectOpen()` hook for consumers.

### 2. Gate navigation in `AppShell`

- Tag each entry in `primaryRoutes` with whether it requires an open project. Project Library (`/`) and Settings (`/settings`) never require one; the other seven do.
- When `isProjectOpen` is false, render the seven project-scoped links as disabled-but-visible: `aria-disabled="true"`, removed from tab order, a `title`/hint conveying "Open a project first," and a CSS class for the dimmed style. They must not navigate when activated.
- Wrap the shell content in `ProjectOpenProvider` (alongside the existing `ReminderRefreshProvider`).

### 3. Route guards

- Add a `RequireProject` wrapper component that, when `isProjectOpen` is false, renders a shared "Open a project first" panel containing a `Link` to `/` (Project Library) instead of its children; while `isProjectOpen` is `undefined`, render a neutral loading placeholder.
- Wrap the seven project-scoped route elements in `RequireProject`. Leave `/` and `/settings` unguarded.

### 4. Refresh on project change

- `ProjectPicker` calls `refreshProjectOpen()` after a successful create, open, or close so nav/guards update without a page reload.

### 5. Collapse the duplicate open-check in `DurableChangeReminder`

- Replace the inline `getProject()` open-check with `useProjectOpen()`; only call `getDurableChangeReminder()` when `isProjectOpen` is true. Keep all reminder-fetch and acknowledgement behavior otherwise unchanged.

## Files to Touch

- `packages/web/src/shell/project-open.tsx` (new)
- `packages/web/src/shell/AppShell.tsx` (modify)
- `packages/web/src/ProjectPicker.tsx` (modify)
- `packages/web/src/shell/DurableChangeReminder.tsx` (modify)
- `packages/web/src/styles.css` (modify — disabled-nav style)
- `packages/web/src/shell/project-open.test.tsx` (new)
- `packages/web/src/shell/AppShell.test.tsx` (new or modify, if present)

## Out of Scope

- The Generation Brief crash and its render-safety net (`archive/tickets/PROJGATE-002.md`) and the unsound `validate()` transport typing (`archive/tickets/PROJGATE-003.md`). This ticket prevents the *no-project* trigger by guarding the route, but the latent crash is fixed in those tickets.
- Any change to per-view empty-state copy beyond the shared `RequireProject` panel.
- Any server, schema, compiler, or validation behavior change.

## Acceptance Criteria

### Tests That Must Pass

1. `AppShell` rendered with `isProjectOpen=false`: the seven project-scoped nav links are `aria-disabled` and do not navigate when activated; Project Library and Settings remain active.
2. Navigating directly to each of the seven guarded routes with no project open renders the shared "Open a project first" panel and does **not** call that view's project-scoped API (assert the mocked API fn is not invoked).
3. After `ProjectPicker` reports a successful open, a previously-guarded route renders its real view and nav links become active — without a remount of the whole app.
4. `DurableChangeReminder` does not call `getDurableChangeReminder()` when `isProjectOpen` is false (project-open truth sourced from the context, not its own `getProject()`).
5. `npm test --workspace @loom/web` passes; `npm run lint` and `npm run typecheck` pass.

### Invariants

1. Exactly one component fetches project-open state for gating/guarding purposes (the provider); no view re-derives it independently except `ProjectPicker` as the library surface.
2. No project-scoped API call is issued from a guarded view while no project is open.

## Test Plan

### New/Modified Tests

1. `packages/web/src/shell/project-open.test.tsx` — provider derives `isProjectOpen` from `getProject()` for both open and closed responses, and `refreshProjectOpen()` re-fetches.
2. `packages/web/src/shell/AppShell.test.tsx` — nav gating + route guarding in open/closed states; guarded view does not fetch when closed.

### Commands

1. `npm test --workspace @loom/web -- src/shell/project-open.test.tsx src/shell/AppShell.test.tsx`
2. `npm run lint && npm run typecheck && npm test`
3. Targeted web run is the correct boundary for the new behavior; the full `npm test` confirms no cross-package regression (core/server untouched).
