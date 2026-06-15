# SPEC023AUTPRISTO-005: `/api/notes` routes, registration, and redaction

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `/api/notes` routes module + `server.ts` registration + route tests; no change to existing routes
**Deps**: 004

## Problem

The web UI needs a project-scoped REST surface for notes: list (with query filters), get, create, update, delete — each going through Zod request validation, discriminated error envelopes (no raw thrown Zod errors), the canonical `no-open-project` 409, and log-redaction so note titles/bodies/tags never reach logs. Routes must add no network binding and no OpenRouter traffic, and must register separately from record routes.

## Assumption Reassessment (2026-06-15)

1. Route modules follow `export function registerRecordRoutes(app: FastifyInstance, manager: ProjectStoreManager): void` (`packages/server/src/record-routes.ts:127`), are wired in `packages/server/src/server.ts` (`registerRecordRoutes(app, projectStoreManager)` at `:75`, beside `registerStoryConfigRoutes`/`registerWorkingSetRoutes`/etc.), and obtain their repository via the manager accessor (here `getStoryNotesRepository()`, added by ticket 004). When the accessor returns `null`, the route returns the canonical no-open-project envelope at HTTP 409 (`record-routes.ts:42` `{ ok: false, kind: "no-open-project", message: "No project is open." }`; `reply.code(409)` at `:131` etc.).
2. SPEC-023 §"Server API" prescribes the five routes (`GET /api/notes`, `GET /api/notes/:id`, `POST /api/notes` → 201, `PUT /api/notes/:id` → 200, `DELETE /api/notes/:id`), the `NotesRouteError` discriminated union (`no-open-project` | `invalid-request` | `malformed-payload` | `not-found`), the query params for the list route (`q`, `tag`, `pinned`, `sort` with defaults), and the rule that request bodies containing note text must not be logged.
3. **Cross-artifact boundary under audit**: the routes consume only `StoryNotesRepository` (ticket 004) and the core schemas (ticket 002) for request validation. They touch no record/working-set/generation route surface. Registration is additive in `server.ts` and parallel to existing `register*Routes` calls.
4. **FOUNDATIONS principle under audit (§22 / §23 / §29.9)**: §23 secret rules and §22 audit boundaries — the routes introduce no API key handling, no prompt surface, and must not log note content. Loopback-only (§ server binds `127.0.0.1`) is preserved: `LOOPBACK_HOST = "127.0.0.1"` (`server.ts:21`) is unchanged and no new `listen`/binding is added.
5. **Secret/audit surface confirmation (§22/§23)**: the routes add no OpenRouter call and no remote service call (grep-proof: no `openrouter`/`fetch`-to-remote in the module). Note `title`/`body`/`tags` are excluded from any log line on both success and validation-failure paths; field-level issues may be returned to the UI in a structured form but are not logged. No new network binding is introduced.
6. **Adjacent wiring (required consequence)**: the `server.ts` `registerStoryNoteRoutes(app, projectStoreManager)` call is a required consequence of shipping the routes, not a separate feature.

## Architecture Check

1. A dedicated `story-note-routes.ts` registered alongside the existing route modules keeps the notes HTTP surface parallel to, and mechanically independent of, record routes — matching the one-module-per-surface server convention and reinforcing isolation.
2. No backwards-compatibility aliasing/shims: PUT (not PATCH) mirrors the existing explicit-validated-replacement convention; the error union reuses the existing discriminated-envelope style without adding a compatibility layer.
3. **Same revision; co-lands with the feature (§1.1)** — transitively after 001.

## Verification Layers

1. Every notes route returns 409 `kind: "no-open-project"` when no project is open -> route test (`fastify.inject`, no project opened).
2. CRUD happy paths + error paths (`malformed-payload` 400 on invalid body, `not-found` 404 on missing id, `invalid-request` on bad query) -> route tests.
3. Note `title`/`body`/`tags` never appear in logs on success or validation failure -> redaction test (capture logger output) + codebase grep-proof that bodies are not passed to log calls.
4. Routes register separately from record routes; no OpenRouter/remote call; no new network binding -> codebase grep-proof over `story-note-routes.ts` + `server.ts`.

## What to Change

### 1. New `packages/server/src/story-note-routes.ts`

`export function registerStoryNoteRoutes(app: FastifyInstance, manager: ProjectStoreManager): void` registering the five routes. Resolve the repository via `manager.getStoryNotesRepository()`; on `null`, return 409 `no-open-project`. Validate the list query and request bodies with the core Zod schemas (404 `not-found`, 400 `malformed-payload`, `invalid-request` for bad query) — never return a raw thrown Zod error. Emit summaries from `GET /api/notes` (with the `tags` aggregate), full notes from `GET /api/notes/:id`, 201 from `POST`, 200 from `PUT`, `{ ok: true }` from `DELETE`. Ensure no log statement includes note `title`/`body`/`tags`.

### 2. Register in `server.ts`

Import and call `registerStoryNoteRoutes(app, projectStoreManager)` alongside the existing `register*Routes` calls.

## Files to Touch

- `packages/server/src/story-note-routes.ts` (new)
- `packages/server/src/server.ts` (modify — registration)
- `packages/server/src/story-note-routes.test.ts` (new)

## Out of Scope

- Repository internals (ticket 004).
- Web client/UI (006–008).
- The prompt/readiness/ideation/OpenRouter non-leakage sentinel and no-record-graph-touch tests (ticket 009) — this ticket's redaction tests cover route-level log redaction only.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/server` — `story-note-routes.test.ts` (via `fastify.inject`) covers: 409 no-open-project on every route; create→list→get→update→delete; 400 malformed-payload; 404 not-found; list query validation; tag/pinned/sort behavior.
2. `npm test --workspace @loom/server` — a redaction test asserts that submitting a note with a unique body marker produces no log line containing that marker, on both success and validation-failure paths.
3. `npm run typecheck && npm run lint` — route types and the discriminated error union compile and lint clean.

### Invariants

1. No notes route compiles a prompt, calls OpenRouter, opens a network binding, or touches a record/working-set/generation surface.
2. Note `title`/`body`/`tags` are never written to logs; only structured, content-free field issues may be returned to the client.

## Test Plan

### New/Modified Tests

1. `packages/server/src/story-note-routes.test.ts` (new) — full route matrix + no-open-project + redaction, all via `fastify.inject`.

### Commands

1. `npm test --workspace @loom/server -- story-note-routes`
2. `npm test --workspace @loom/server && npm run typecheck && npm run lint`
3. `grep -niE "openrouter|listen\(|api[_-]?key" packages/server/src/story-note-routes.ts` — must return nothing (no remote call / no new binding / no key handling); the narrow grep directly proves the secret/loopback invariant.

## Outcome

Completed: 2026-06-15

What changed:
- Added `packages/server/src/story-note-routes.ts` with project-scoped `/api/notes` list, get, create, update, and delete routes.
- Registered the routes from `packages/server/src/server.ts` without adding any new listener or network binding.
- Added notes-specific redaction field names to the existing server logger redaction list.
- Added `packages/server/src/story-note-routes.test.ts` covering no-open-project behavior, CRUD/list/filter/sort, structured invalid-request and malformed-payload errors, not-found responses, and note-content log non-leakage.

Deviations:
- None. The route layer uses the dedicated `StoryNotesRepository`, returns summaries from list, and does not touch prompt/readiness/OpenRouter surfaces.

Verification:
- `npm test --workspace @loom/server -- story-note-routes` passed.
- `npm test --workspace @loom/server` passed: 44 files, 231 tests.
- `npm run typecheck` passed across core, server, and web workspaces.
- `npm run lint` passed across core, server, and web workspaces.
- `grep -niE "openrouter|listen\\(|api[_-]?key" packages/server/src/story-note-routes.ts` returned no matches.
