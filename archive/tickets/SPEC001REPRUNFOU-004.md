# SPEC001REPRUNFOU-004: `@loom/web` React + Vite UI shell and dev proxy

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `packages/web` (`@loom/web`) React + Vite app depending on `@loom/core` for types; Vite `/api` dev proxy
**Deps**: SPEC001REPRUNFOU-002

## Problem

Phase 1 needs a minimal browser cockpit so the launch gate is observably pass/fail: a placeholder screen showing the app name and the health/version values fetched from the stub API, plus a clear "cannot reach local server" state. This ticket adds `@loom/web` (React + Vite) and the dev-mode `/api` proxy to the Node server.

## Assumption Reassessment (2026-06-05)

1. `packages/web` does not exist; `@loom/core` (002) provides shared types. `react`, `react-dom`, `vite` are net-new deps of this package only.
2. `archive/specs/SPEC-001-repository-and-runtime-foundation.md` §`packages/web` requires: React + Vite TS, a placeholder screen (app name + health/version), no routing/state/design-system libraries, depends on `core` for types only, and must not import `server`; §Edge cases require a "cannot reach local server" state, not a blank page. `docs/requirements-version-1/TECHNOLOGY-DECISIONS.md` confirms React + Vite and that TanStack Table/Form are deferred to later phases.
3. Shared boundary under audit: `web → core` (types only) and `web ↛ server`. Confirm `web` imports no `server` symbol (it talks to the server only over HTTP `/api`).
4. The Phase-1 UI is intentionally pre-`UI-WORKFLOWS.md` (per the spec's §Non-goals note) — placeholder only; none of the record-editing/working-set workflows are realized here.

## Architecture Check

1. A Vite dev server with the `/api` proxy to the Node server keeps dev HMR fast while the production single-port serve (006) reuses the same built assets — one UI, two delivery modes, no duplicated transport assumptions. No routing/state library is added: there is no product behavior yet to justify the weight (spec §Non-goals).
2. No backwards-compatibility aliasing/shims — net-new package.

## Verification Layers

1. `web → core` types-only, no `server` import -> codebase grep-proof: grep `web/src` for any `@loom/server` import (must be zero).
2. Placeholder renders health/version -> component test / manual review: the screen shows the app name and the fetched values.
3. Unreachable-API state -> component test / manual review: with the API down, the screen shows the "cannot reach local server" message, not a blank page.
4. Dev proxy routes `/api` -> manual review of `vite.config.ts` proxy target (the Node loopback port).

## What to Change

### 1. `@loom/web` package

`packages/web/package.json` (`@loom/web`, dep `@loom/core` for types + `react`/`react-dom`/`vite`), `tsconfig.json` extending base, `vite.config.ts` with the `/api` → Node-server proxy.

### 2. Placeholder cockpit

`src/` React app: fetches `/api/health` and `/api/version`, renders the app name + values; renders a clear error state when the API is unreachable.

## Files to Touch

- `packages/web/package.json` (new)
- `packages/web/tsconfig.json` (new)
- `packages/web/vite.config.ts` (new)
- `packages/web/index.html` (new)
- `packages/web/src/main.tsx` (new)
- `packages/web/src/App.tsx` (new)
- `packages/web/src/App.test.tsx` (new)

## Out of Scope

- Production single-port serving + browser open (006).
- Any routing, global state, or design system (spec §Non-goals).
- Records, editors, working-set UI (Phases 4–5).

## Acceptance Criteria

### Tests That Must Pass

1. `npm run test --workspace @loom/web` — component test renders the app name + health/version; the unreachable-API path shows the error state.
2. `npm run build --workspace @loom/web` produces a `dist/` the server can serve.
3. `npm run typecheck --workspace @loom/web` green.

### Invariants

1. `web` imports no `@loom/server` symbol.
2. No routing/state/design-system dependency is added in Phase 1.

## Test Plan

### New/Modified Tests

1. `packages/web/src/App.test.tsx` — renders the placeholder with a mocked API; asserts both the success and unreachable states.

### Commands

1. `npm run test --workspace @loom/web`
2. `npm run build --workspace @loom/web && npm run typecheck --workspace @loom/web`

## Outcome

Implemented `@loom/web` as a React + Vite placeholder cockpit with a `/api`
dev proxy to the loopback server, health/version fetching, and a clear
unreachable-server state. Added component tests for the success and failure
paths. Verified with `npm run test --workspace @loom/web`, `npm run build
--workspace @loom/web`, `npm run typecheck --workspace @loom/web`, `npm run
lint --workspace @loom/web`, and a grep check confirming no `@loom/server`
imports or deferred routing/state/design-system dependencies.
