# SPEC002LOCPROFOL-005: `@loom/web` minimal project picker

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — new `@loom/web` project-picker UI + API client functions for `/api/project/*`
**Deps**: SPEC002LOCPROFOL-004

## Problem

The user needs a bare functional surface to create a project in an explicit
folder, open an existing folder, see project status (path, title, schema/app
version compatibility, open state), create a backup, and read an actionable
diagnostic when a folder can't be opened — wired to the SPEC002LOCPROFOL-004 API.
This is the minimal Phase-2 picker, not the dense-record UI of later phases.

## Assumption Reassessment (2026-06-05)

1. `packages/web/src/api.ts` currently exposes `fetchRuntimeStatus()` over
   `/api/health` + `/api/version` with a private `fetchJson<T>` helper; `App.tsx`
   renders runtime status and has a co-located `App.test.tsx`
   (`vitest run --environment jsdom`). No project UI/client exists yet.
2. SPEC-002 Deliverable 4 + `LOCAL-FIRST-STORAGE.md` "User-facing behavior" govern:
   create form (parent path + folder name + title/description), open form
   (existing folder path), a status panel (path, title, version compatibility,
   open state), a "Create Backup Copy" action surfacing the backup path, and
   inline rendering of the diagnostic `kind` + message on failure. A native
   folder dialog is out of scope (typed absolute paths — SPEC-002 §Out of Scope).
3. Shared boundary under audit: the UI consumes the SPEC002LOCPROFOL-004 routes
   and the `ProjectStatus` / `OpenProjectResult` / `OpenFailureKind` shapes
   originating in `@loom/core` (SPEC002LOCPROFOL-001). The web app may import those
   types from `@loom/core` (as `api.ts` already imports `VersionInfo`) to avoid
   re-declaring drift-prone duplicates.
4. FOUNDATIONS motivating this ticket: §27 (UI makes the workflow tractable;
   dangerous actions are not accidental — backup copies are not branches) and
   §24 (explicit user-owned folders; no opaque silo). The picker surfaces
   open-failure diagnostics rather than crashing/blanking.

## Architecture Check

1. Reusing `api.ts`'s `fetchJson` pattern (extended for POST bodies) and adding a
   single `ProjectPicker` component keeps the minimal picker consistent with the
   existing web shell rather than introducing a router/state library prematurely.
   Importing the result/status types from `@loom/core` keeps one source of truth.
2. No backwards-compatibility aliasing/shims: net-new client functions and
   component; `App.tsx` is extended to render the picker, not forked.

## Verification Layers

1. Create + status render -> component test (jsdom): submitting the create form
   calls the create client and renders the returned path/title/version/open state.
2. Open-failure diagnostic -> component test: an `{ ok: false, kind, message }`
   response renders the kind + message inline (no crash/blank).
3. Backup action -> component test: clicking "Create Backup Copy" calls the backup
   client and surfaces the returned `backupPath`.
4. Client wiring -> manual dry-run runbook (SPEC-002 §Verification "Manual"):
   launch the app, create a project in an explicit folder, confirm
   `continuity-loom.project.json` + `loom.sqlite` exist on disk, reopen it, view
   status, create a backup, and open a non-project folder to see the diagnostic.

## What to Change

### 1. Project API client

Extend `packages/web/src/api.ts` with `createProject`, `openProject`,
`getProject`, `createBackup`, `closeProject` (POST/GET helpers; add a `postJson`
sibling to `fetchJson`). Reuse `@loom/core` types for request/response shapes.

### 2. Project picker UI

Add `packages/web/src/ProjectPicker.tsx`: a create form (parent path, folder
name, title, optional description), an open form (folder path), a status panel
(path, title, compatibility, open state), a "Create Backup Copy" button showing
the resulting `backupPath`, and inline rendering of an open/create failure's
`kind` + message. Render it from `packages/web/src/App.tsx`.

## Files to Touch

- `packages/web/src/api.ts` (modify) — project client functions
- `packages/web/src/ProjectPicker.tsx` (new)
- `packages/web/src/App.tsx` (modify) — render the picker
- `packages/web/src/ProjectPicker.test.tsx` (new) — jsdom component tests

## Out of Scope

- Native OS folder-picker dialog (future Tauri affordance — SPEC-002 §Out of Scope).
- Record editing / dense-record UI (Phase 4+).
- Backup retention/pruning UI; settings/OpenRouter UI.

## Acceptance Criteria

### Tests That Must Pass

1. `npm run test --workspace @loom/web` — `ProjectPicker.test.tsx` passes:
   create renders status; open-failure renders the `kind` + message inline;
   backup surfaces the returned `backupPath`.
2. `npm run typecheck && npm test && npm run build` — all green.

### Invariants

1. An open/create failure renders the structured diagnostic — the UI never
   crashes or blanks on a `{ ok: false }` response.
2. The picker accepts typed absolute paths only (no native dialog dependency).

## Test Plan

### New/Modified Tests

1. `packages/web/src/ProjectPicker.test.tsx` — jsdom tests for create-status,
   open-failure diagnostic, and backup-path surfacing (API client mocked).

### Commands

1. `npm run test --workspace @loom/web`
2. `npm run typecheck && npm test && npm run build`
3. Manual dry-run (SPEC-002 §Verification "Manual"): `npm start`, then create /
   reopen / back up / open-a-bad-folder against an explicit project folder.
