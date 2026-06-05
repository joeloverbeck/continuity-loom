# SPEC002LOCPROFOL-004: Local API routes for project create/open/status/backup/close

**Status**: ✅ COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new Fastify loopback routes under `/api/project/*` wired to the storage manager; per-instance manager constructed in `createServer`
**Deps**: SPEC002LOCPROFOL-002, SPEC002LOCPROFOL-003

## Problem

The web picker needs a localhost-only API to drive the storage lifecycle:
create a project, open one (surfacing the full open-failure taxonomy), read
active status, create a backup, and close. The routes must validate their I/O
with Zod, bind loopback-only (inherited from SPEC-001), and log results only.

## Assumption Reassessment (2026-06-05)

1. `packages/server/src/server.ts` `createServer()` currently registers routes
   inline (`app.get("/api/health", …)`, `app.get("/api/version", …)`) and
   configures the SPEC-001 logger `redact` allowlist; `startServer` binds
   `LOOPBACK_HOST = "127.0.0.1"`. This ticket adds a per-instance storage manager
   and the `/api/project/*` routes here. `zod@^4.1.13` is already a server dep and
   is used via `version-schema.ts`.
2. SPEC-002 Deliverable 3 governs the five routes and payloads:
   `POST /api/project/create {parentPath, folderName, title, description?}`,
   `POST /api/project/open {folderPath}`, `GET /api/project`,
   `POST /api/project/backup`, `POST /api/project/close`.
3. Shared boundary under audit: the routes consume
   `createProjectStoreManager()` (SPEC002LOCPROFOL-002) and serialize
   `ProjectStatus` / `OpenProjectResult` (SPEC002LOCPROFOL-001 contract, taxonomy
   finalized in -003). One manager is created per `createServer()` call so test
   servers and the dev/prod launcher stay isolated (M3).
4. FOUNDATIONS motivating this ticket: §23/§29.9 (no key/payload logging; loopback
   only) and §24/§29.10 (the API is the only client-facing path to local
   user-owned storage — no remote authority introduced).
5. Enforcement surfaces: secret firewall / logging discipline (§29.9) — route
   handlers log only operation results (status/kind/`backupPath`); request bodies
   (which contain folder paths) are not logged with payloads, and the existing
   redact allowlist already censors `apiKey`/`prompt`/prose/`recordPayload`. No
   new authority or nondeterministic input is added (§8 unaffected — no
   compilation here). Loopback binding is unchanged from SPEC-001.

## Architecture Check

1. A small `registerProjectRoutes(app, manager)` plugin (new file) keeps the
   route surface cohesive and lets `createServer()` own manager lifetime, rather
   than scattering project state across handlers or using a module singleton.
   Reusing the existing inline-route style of `server.ts` keeps the server
   minimal and consistent with `/api/health` / `/api/version`.
2. No backwards-compatibility aliasing/shims: net-new routes; existing routes and
   the loopback/logging config are unchanged except for the manager wiring.

## Verification Layers

1. Create→open→status→backup→close happy path -> integration test driving the
   Fastify instance via `app.inject` against a temp dir.
2. Open-failure passthrough -> integration test: `POST /api/project/open` on a
   non-project folder returns the structured `{ ok: false, kind, message }`
   (HTTP 200 with the typed body, not a 500).
3. Request validation -> integration test: a malformed create body (missing
   `title`) is rejected by the Zod request schema with a 4xx.
4. Loopback + no-leak logging -> codebase grep-proof: `server.ts` still binds
   `LOOPBACK_HOST` and the redact allowlist is intact; handlers reference no
   `app.log` call carrying a request body/metadata.

## What to Change

### 1. Route plugin

Add `packages/server/src/project-routes.ts` exporting
`registerProjectRoutes(app: FastifyInstance, manager: ProjectStoreManager): void`,
registering:

- `POST /api/project/create` — Zod-parse `{ parentPath, folderName, title,
  description? }`; return `ProjectStatus` (201) or a structured failure.
- `POST /api/project/open` — Zod-parse `{ folderPath }`; return `OpenProjectResult`.
- `GET  /api/project` — return active `ProjectStatus` or `{ open: false }`.
- `POST /api/project/backup` — return `{ backupPath }` or a structured failure
  (e.g. no open project).
- `POST /api/project/close` — return `{ open: false }`.

### 2. Wire a per-instance manager

In `packages/server/src/server.ts` `createServer()`, construct one
`createProjectStoreManager()` and call `registerProjectRoutes(app, manager)`.
Leave the loopback binding and redact config unchanged; ensure no handler logs
request bodies or store contents.

## Files to Touch

- `packages/server/src/project-routes.ts` (new)
- `packages/server/src/server.ts` (modify) — construct manager + register routes
- `packages/server/src/project-routes.test.ts` (new) — `app.inject` integration tests

## Out of Scope

- Web UI (SPEC002LOCPROFOL-005) and requirements-doc updates (SPEC002LOCPROFOL-006).
- Storage mechanics themselves (owned by SPEC002LOCPROFOL-002/003).
- OpenRouter/settings routes — settings boundary stays the inert SPEC-001 stub.

## Acceptance Criteria

### Tests That Must Pass

1. `npm run test --workspace @loom/server` — `project-routes.test.ts` passes:
   full create→open→status→backup→close happy path; open of a non-project folder
   returns the typed `{ ok: false, kind }` body; malformed create body → 4xx.
2. `npm run typecheck && npm test && npm run build` — all green.

### Invariants

1. All `/api/project/*` routes bind loopback-only (inherited; never LAN-exposed).
2. No route logs request bodies, metadata, or store contents — results only (§29.9).

## Test Plan

### New/Modified Tests

1. `packages/server/src/project-routes.test.ts` — `app.inject` over the five
   routes against temp dirs (happy path, failure passthrough, request validation).

### Commands

1. `npm run test --workspace @loom/server`
2. `npm run typecheck && npm test && npm run build`

## Outcome

Completed: 2026-06-05.

- Added `/api/project/*` Fastify routes for create, open, status, backup, and close, with one project-store manager per server instance.
- Added route tests for the happy path, structured open-failure passthrough, and malformed create request validation.
- Deviation from plan: create/backup operational failures are returned as structured `ok: false` responses with HTTP conflict status where appropriate.
- Verification: `npm run test --workspace @loom/server`, `npm run lint --workspace @loom/server`, `npm run typecheck --workspace @loom/server`, and `npm run build --workspace @loom/server` passed before archival.
