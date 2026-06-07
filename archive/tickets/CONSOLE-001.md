# CONSOLE-001: Stop the durable-change-reminder from logging a 409 on app load with no project open

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `packages/web` only: `src/shell/DurableChangeReminder.tsx`, `src/shell/DurableChangeReminder.test.tsx`, `src/ProjectPicker.tsx` (and its test). No server, core, schema, or compiler changes.
**Deps**: None

## Problem

On a fresh launch of the dev server (`http://127.0.0.1:5173/`), the browser console shows two `Failed to load resource: status 409 (Conflict)` errors before the user does anything.

Root cause: `DurableChangeReminder` is mounted globally in the content pane (`packages/web/src/shell/AppShell.tsx:84`, inside `ReminderRefreshProvider`) and fetches `GET /api/durable-change-reminder` on mount. When no project is open the server returns HTTP **409** with `{ ok: false, kind: "no-open-project" }`. The component handles this correctly (renders `null`), but the browser logs every 4xx response to the console regardless of how JS consumes it — this cannot be suppressed from application code. The error appears **twice** in dev because `<StrictMode>` (`packages/web/src/main.tsx:13`) double-invokes effects; a production build fires it once, but the 409 still appears.

The server's `409 + no-open-project` response is the **correct, uniform fail-closed convention** used by every route and must not be changed. The fix belongs in the client: do not issue the reminder request until a project is open.

## Assumption Reassessment (2026-06-06)

1. `DurableChangeReminder` (`packages/web/src/shell/DurableChangeReminder.tsx:39`) calls `getDurableChangeReminder()` unconditionally inside a `useEffect` keyed on `refreshSignal`, and is mounted globally at `packages/web/src/shell/AppShell.tsx:84` (not behind a route), so it fires on every fresh load including the `/` ProjectPicker route. Confirmed.
2. `getDurableChangeReminder()` (`packages/web/src/api.ts:370`) uses `requestJson`, which does **not** throw on non-2xx (`packages/web/src/api.ts:197-216`); it parses and returns the body. So the failure is handled in JS, and the only visible symptom is the browser's own console log of the 409. Confirmed via Puppeteer (`console://logs`) and curl (`/api/durable-change-reminder` → 409, body `{"ok":false,"kind":"no-open-project","message":"No project is open."}`).
3. Shared boundary under audit: the project-open contract. `getProject()` (`packages/web/src/api.ts:256`) returns `ProjectOpenState = ProjectStatus | { open: false }` via `fetchJson` against `GET /api/project`, which returns **200** in both open and closed states (verified by curl). Reading it produces no console error. `ProjectPicker` (`packages/web/src/ProjectPicker.tsx:30,34,55`) already uses this exact shape (`"open" in value`).
4. FOUNDATIONS principle motivating the reminder: §29.8 / line 678 / line 910 — "After acceptance, the app should remind the user that durable changes likely require manual record updates" and the §29 hard-fail "Does it fail to remind the user to update records after accepted durable changes?". Gating the fetch on project-open does **not** weaken this: when no project is open there are no accepted segments to remind about. The reminder must still surface whenever a project is open and has an unacknowledged latest segment.
5. Enforcement surface check: the server `409 + no-open-project` gate (`packages/server/src/reminder-routes.ts:40`) is the same fail-closed convention used by `working-set-routes.ts`, `story-config-routes.ts`, `accepted-routes.ts`, `generation-brief-routes.ts`, and `record-routes.ts`. This ticket changes **no** server code and must not. Deterministic compilation (§8) and the secret firewall (§15) are untouched.
6. Reminder refresh transport: `refreshReminder()` (`packages/web/src/shell/reminder-refresh.tsx:18`) is currently called **only** by `GenerateView` after accept (`packages/web/src/generate/GenerateView.tsx:148`). It is **not** called when a project is opened. Therefore, once the fetch is gated on project-open, opening a project that already has an unacknowledged accepted segment would not surface the reminder until a later generate/accept. This ticket must also trigger `refreshReminder()` on successful project open so the gate is behaviorally complete. This is a required consequence of the gating change, not separate scope.
7. Adjacent contradiction classification: the missing refresh-on-open (item 6) is a pre-existing latent gap exposed by this change; it is folded in here because the gate is incorrect without it. No other adjacent contradictions found.

## Architecture Check

1. Client-side gating is cleaner than the alternatives:
   - *Server returns 200 instead of 409 for this one route* — rejected: breaks the uniform `no-open-project` 409 contract shared by all routes and weakens fail-closed gating (a non-negotiable invariant in `docs/ACTIVE-DOCS.md`).
   - *Lift project-open state into a global React context consumed by the shell and reminder* — rejected as over-scoped (YAGNI) for a console-noise fix; the component reusing the existing `getProject()` is self-contained and matches the pattern already in `ProjectPicker`.
   The chosen approach reuses the existing 200-returning `/api/project` read, adds no new API surface, and keeps the reminder logic local.
2. No backwards-compatibility aliases or shims introduced. No duplicate authority path: project-open state continues to come solely from `GET /api/project`.

## Verification Layers

1. Invariant: no `GET /api/durable-change-reminder` request is issued while no project is open → web unit test (jsdom) asserting `getDurableChangeReminder` is not called when `getProject` resolves to `{ open: false }`.
2. Invariant: the reminder still fetches and renders when a project IS open with an unacknowledged latest segment → web unit test asserting `getDurableChangeReminder` is called and the active reminder renders when `getProject` resolves to an open `ProjectStatus`.
3. Invariant: opening a project triggers a reminder refresh → web unit test on `ProjectPicker` asserting `refreshReminder` is invoked after a successful `openProject`.
4. Invariant (manual): a fresh load with no project open shows **zero** `409` console errors → manual review via browser/Puppeteer `console://logs`.
5. FOUNDATIONS alignment: §29.8 reminder behavior preserved → FOUNDATIONS alignment check (reminder still active iff project open and latest segment unacknowledged).

## What to Change

### 1. Gate the reminder fetch on project-open state

In `packages/web/src/shell/DurableChangeReminder.tsx`, change the `useEffect` so it first reads `getProject()`. If the result is not open (`"open" in result` is true and `result.open === false`), set `reminder` to `null` and do **not** call `getDurableChangeReminder()`. Only when a project is open, call `getDurableChangeReminder()` and apply the existing `response.ok ? response.reminder : null` handling. Preserve the existing `active`/cleanup guard pattern and the `refreshSignal` dependency.

### 2. Refresh the reminder when a project is opened

In `packages/web/src/ProjectPicker.tsx`, consume `useReminderRefresh()` and call `refreshReminder()` after a successful `openProject` (in `onOpen`, after `setProject(result.status)`). This causes the globally-mounted `DurableChangeReminder` to re-run its (now project-aware) effect and surface a pending reminder for the freshly opened project.

## Files to Touch

- `packages/web/src/shell/DurableChangeReminder.tsx` (modify)
- `packages/web/src/shell/DurableChangeReminder.test.tsx` (modify)
- `packages/web/src/ProjectPicker.tsx` (modify)
- `packages/web/src/ProjectPicker.test.tsx` (modify)

## Out of Scope

- Any change to server routes or the `409 / no-open-project` convention.
- Lifting project-open state into a shared context/provider.
- Removing `<StrictMode>` (the double-invoke is dev-only and not the defect).
- Refresh-on-open for `createProject` / `createDemoProject` (fresh projects have no accepted segments, so no reminder is possible; adding it would be inert scope).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/web -- DurableChangeReminder` — new cases: (a) `getProject` → `{ open: false }` ⇒ `getDurableChangeReminder` not called and nothing rendered; (b) `getProject` → open status ⇒ `getDurableChangeReminder` called and active reminder rendered.
2. `npm test --workspace @loom/web -- ProjectPicker` — `refreshReminder` invoked after a successful `openProject`.
3. `npm test` — full Vitest suite (builds `@loom/core` first) passes.

### Invariants

1. No request to `/api/durable-change-reminder` is ever issued by the client while `GET /api/project` reports no open project.
2. The durable-change reminder remains active iff a project is open and the latest accepted segment's sequence exceeds the acknowledged sequence (server contract in `reminder-routes.ts` unchanged).

## Test Plan

### New/Modified Tests

1. `packages/web/src/shell/DurableChangeReminder.test.tsx` — add `getProject` to the `vi.mock("../api.js", ...)` factory; add the closed-project (no fetch) and open-project (fetch + render) cases.
2. `packages/web/src/ProjectPicker.test.tsx` — assert `refreshReminder` is called after successful open (mock `reminder-refresh` or assert via spy).

### Commands

1. `npm test --workspace @loom/web -- DurableChangeReminder ProjectPicker`
2. `npm test`
3. Manual: `npm run dev`, open `http://127.0.0.1:5173/` with no project open, confirm DevTools console (or Puppeteer `console://logs`) shows no `409` entries; then open a project that has an unacknowledged accepted segment and confirm the reminder appears.

## Outcome

Completed on 2026-06-06.

What changed:

- `DurableChangeReminder` now reads `GET /api/project` first and skips `GET /api/durable-change-reminder` when no project is open.
- `ProjectPicker` now refreshes the durable-change reminder after a successful existing-project open.
- Web tests cover closed-project gating, open-project reminder fetch, and refresh-on-open behavior; the adjacent `GenerateView` test mock was updated for the new project-open probe.

Deviations from original plan:

- None. Server routes, the `409 no-open-project` convention, core code, schemas, compiler behavior, and secret handling were untouched.

Verification:

- `npm test --workspace @loom/web -- DurableChangeReminder ProjectPicker` passed: 2 files, 17 tests.
- `npm test --workspace @loom/web -- GenerateView` passed: 1 file, 8 tests.
- `npm test` passed: 72 files, 432 tests.
- Localhost browser smoke at `http://127.0.0.1:5173/` with no project open showed no `/api/durable-change-reminder` request and no 409 console entry; only the pre-existing `/favicon.ico` 404 remained for `CONSOLE-002`.
