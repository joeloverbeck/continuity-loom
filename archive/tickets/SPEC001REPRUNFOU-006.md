# SPEC001REPRUNFOU-006: Single-port production launch and dev orchestration

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — root `dev`/`build`/`start` scripts; single-port production launch (Node serves built web + opens browser); port-in-use handling
**Deps**: SPEC001REPRUNFOU-001, SPEC001REPRUNFOU-003, SPEC001REPRUNFOU-004

## Problem

Phase 1's gate is "app launches locally from Node and opens in browser." This ticket wires the one-command launch experience: production mode builds `core`/`web`, the Node server serves the static assets and the API on one localhost port, prints the URL prominently, and best-effort-opens the browser (WSL2-safe); dev mode runs the Vite dev server with HMR plus the Node API server with the `/api` proxy. It also adds the root `dev`/`build`/`start` scripts that 001 deferred until the packages existed.

## Assumption Reassessment (2026-06-05)

1. Root `package.json` exists (created `(new)` by 001) with `typecheck`/`lint`/`test`; this ticket adds `dev`/`build`/`start` to it — a create-then-modify chain, hence the explicit `Deps: 001`. `@loom/server` (003) serves assets; `@loom/web` (004) provides the built `dist/`. `.gitignore` already ignores `dist/` (added by 001), so this ticket does not re-touch it.
2. `specs/SPEC-001-repository-and-runtime-foundation.md` §Key decisions #3 (single-port production, dual-port dev), §Edge cases, and §Done Means require: print the localhost URL prominently; **best-effort** browser auto-open (on WSL2 without a default browser, opening the printed URL manually still satisfies the gate); port-in-use fails with a clear, actionable message naming the port and must not silently bind elsewhere.
3. Shared boundary under audit: the launch couples `server` (serves `web/dist` + `/api`) and `web` (built assets). Confirm the server's static root points at `@loom/web`'s build output and the dev proxy target matches the server's loopback port.
4. FOUNDATIONS principle motivating: §29.10 / §24 local-first — the launch binds localhost only and opens a local browser; no cloud, account, or remote authority. Restated before implementation.

## Architecture Check

1. One built UI served two ways (Vite dev server in dev, Node static serve in production) avoids divergent transport assumptions. Best-effort browser-open with a guaranteed printed URL makes the gate robust on the primary WSL2 target, where programmatic open routinely fails — the URL is the durable contract, the open is a convenience.
2. No backwards-compatibility aliasing/shims — net-new launch path.

## Verification Layers

1. Single-port production serve -> manual review / smoke: `npm start` builds, the Node server serves the placeholder at one loopback port, and `/api/*` responds on the same origin.
2. URL always printed + best-effort open -> manual review: the launch prints the `http://127.0.0.1:<port>` URL prominently; a failed auto-open does not fail the process.
3. Port-in-use UX -> manual review / test: starting with the port occupied yields a clear message naming the port and a non-zero exit, never a silent rebind.
4. Dev proxy -> manual review: `npm run dev` runs Vite + Node concurrently; `/api` proxies to the Node loopback port.

## What to Change

### 1. Root launch scripts

Add `dev` (Vite + Node concurrently), `build` (build `core` then `web`), and `start` (build if needed, then run the Node server in production/static mode) to the root `package.json`.

### 2. Production single-port serve + browser open

The server's production mode serves `@loom/web`'s `dist/` and the API on one loopback port; the launch prints the URL prominently and best-effort-opens the default browser (degrading silently on WSL2).

### 3. Port-in-use handling

On `EADDRINUSE`, fail with a clear message naming the port; never silently bind elsewhere.

## Files to Touch

- `package.json` (modify) — add `dev`/`build`/`start` (file created `(new)` by 001; Deps:001)
- `packages/server/src/launch.ts` (new) — production launch entry: serve dist + print URL + best-effort open + port-in-use UX
- `packages/server/src/launch.test.ts` (new) — URL-print + port-in-use assertions

## Out of Scope

- The capstone gate verification across all scripts (007).
- Desktop packaging / Tauri (spec §Non-goals).
- Any secret handling in launch.

## Acceptance Criteria

### Tests That Must Pass

1. `npm run build` produces `core` + `web` build output; `npm start` serves the placeholder + `/api` on one loopback port.
2. With the port occupied, `npm start` exits non-zero with a message naming the port (no silent rebind).
3. `npm run dev` starts Vite + Node; the placeholder loads via the `/api` proxy.

### Invariants

1. The launch binds localhost only and never logs a secret.
2. The localhost URL is always printed; browser auto-open is best-effort and never fails the launch.

## Test Plan

### New/Modified Tests

1. `packages/server/src/launch.test.ts` — asserts URL-printing and the port-in-use error path (best-effort open is a manual dry-run, not CI-asserted).

### Commands

1. `npm run build && npm start` (manual: confirm the placeholder shows health/version; confirm the printed URL)
2. `npm run dev` (manual: confirm HMR + `/api` proxy)

## Outcome

Implemented root `dev`, `build`, and `start` scripts; a two-process dev helper;
and a production launch path in `@loom/server` that serves built web assets and
the stub API on one loopback origin. The launcher prints the localhost URL,
best-effort opens the browser unless `--no-open` is supplied, and fails clearly
when the requested port is occupied. Verified with `npm run test --workspace
@loom/server`, `npm run typecheck --workspace @loom/server`, `npm run lint
--workspace @loom/server`, `npm run build`, `npm audit --omit=dev`, root script
inspection, and an escalated localhost smoke of `node packages/server/dist/launch.js
--port 0 --no-open` showing the built page and `/api/health` on the same origin.
