# SPEC013TAMDEMPRO-003: Web "Create demo project" entry point

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — new `@loom/web` `createDemoProject` API client + "Create demo project" affordance in `ProjectPicker`
**Deps**: SPEC013TAMDEMPRO-002

## Problem

SPEC-013 D3 needs a discoverable "Create demo project" affordance in the project picker that creates the bundled demo and lands the user in the normal app shell, with the project clearly reading as sample data. Today `ProjectPicker` only offers regular create/open (`onCreate`/`onOpen`, `packages/web/src/ProjectPicker.tsx:72,93`) and `api.ts` has no demo client.

## Assumption Reassessment (2026-06-06)

1. `ProjectPicker.onCreate` (`packages/web/src/ProjectPicker.tsx:72`) calls `createProject(...)` (`packages/web/src/api.ts:239`, via `postJson`) and on success calls `setProject(result)` — which makes the created project active and lands the user in the app shell; `createProject`/`create-demo` set the active project server-side, so no separate `openProject` call is required (mirrors the existing `onCreate` flow). The picker is the `/` route (`packages/web/src/shell/AppShell.tsx:87`).
2. SPEC-013 (reassessed in-session 2026-06-06) §Approach 3 + §Deliverables fix the deliverable: a client function in `api.ts` plus the affordance; the new server route is `POST /api/project/create-demo` (owned by SPEC013TAMDEMPRO-002, body `{ parentPath, folderName }`). Existing web tests `packages/web/src/ProjectPicker.test.tsx` and `packages/web/src/api.test.tsx` are the modify targets for coverage.
3. Shared boundary under audit: the `create-demo` HTTP contract between `@loom/web` (`createDemoProject` client) and `@loom/server` (route from SPEC013TAMDEMPRO-002) — request `{ parentPath, folderName }`, response the created `ProjectStatus`/failure union, consumed exactly like `createProject`'s response (`isFailure` guard + `setProject`). This ticket adds a UI affordance only; it changes no existing create/open behavior (§20: additive affordance, rationale = demo onboarding entry point).

## Architecture Check

1. Reusing the existing `postJson` client helper and the `onCreate` success/failure pattern (`isFailure` → notice; success → `setProject`) keeps the demo path consistent with the regular create path and avoids a bespoke navigation mechanism; the affordance reads the picker's existing parent-path input plus a fixed demo folder name, so no new form surface is needed.
2. No backwards-compatibility aliasing/shims: net-new client function and button; existing create/open handlers untouched.

## Verification Layers

1. Client posts to the right endpoint -> test (`api.test.tsx`): `createDemoProject` issues `POST /api/project/create-demo` with `{ parentPath, folderName }` and returns the typed response.
2. Affordance lands the user in the app -> test (`ProjectPicker.test.tsx`): activating "Create demo project" calls the client and, on success, calls `setProject` (the user leaves the picker for the shell); on failure it renders the existing error notice.
3. Two distinct invariants (transport contract vs. UI navigation) are mapped to their own test surfaces above; not collapsed.

## What to Change

### 1. API client

In `packages/web/src/api.ts`, add `export async function createDemoProject(request: { parentPath: string; folderName: string }): Promise<CreateProjectResponse>` delegating to `postJson("/api/project/create-demo", request)` (reusing the `CreateProjectResponse` union already used by `createProject`).

### 2. ProjectPicker affordance

In `packages/web/src/ProjectPicker.tsx`, add a "Create demo project" control (clearly labeled as sample data) with an `onCreateDemo` handler that calls `createDemoProject` using the picker's parent-path value and a fixed demo folder name, then mirrors `onCreate`: `isFailure` → set error notice; success → `setProject(result)`.

### 3. Tests

Extend `packages/web/src/api.test.tsx` (client endpoint/shape) and `packages/web/src/ProjectPicker.test.tsx` (affordance triggers client + navigates / surfaces failure).

## Files to Touch

- `packages/web/src/api.ts` (modify)
- `packages/web/src/ProjectPicker.tsx` (modify)
- `packages/web/src/api.test.tsx` (modify)
- `packages/web/src/ProjectPicker.test.tsx` (modify)

## Out of Scope

- The server route/orchestration and `isDemoFixture` threading (SPEC013TAMDEMPRO-002).
- The fixture data (SPEC013TAMDEMPRO-001).
- Auto-loading the demo on first launch or bundling beyond the picker entry point (spec §Out of Scope).
- Any change to the regular create/open handlers.

## Acceptance Criteria

### Tests That Must Pass

1. `npx vitest run packages/web/src/api.test.tsx` — `createDemoProject` calls `POST /api/project/create-demo` with the correct body and parses the response.
2. `npx vitest run packages/web/src/ProjectPicker.test.tsx` — the demo affordance invokes the client and, on success, transitions out of the picker; on failure shows the error notice.
3. `npm run lint && npm run typecheck && npm test` — full pipeline green.

### Invariants

1. The demo affordance reuses the existing success/failure handling (`isFailure` → notice, success → `setProject`); no parallel navigation path is introduced.
2. Existing `onCreate`/`onOpen` behavior is unchanged.

## Test Plan

### New/Modified Tests

1. `packages/web/src/api.test.tsx` — assert `createDemoProject` endpoint, method, and body.
2. `packages/web/src/ProjectPicker.test.tsx` — assert affordance → client call → navigation/failure rendering.

### Commands

1. `npx vitest run packages/web/src/api.test.tsx packages/web/src/ProjectPicker.test.tsx`
2. `npm run lint && npm run typecheck && npm test`
3. The targeted web tests are the correct boundary (UI + client only); `npm test` confirms no cross-package regression.
