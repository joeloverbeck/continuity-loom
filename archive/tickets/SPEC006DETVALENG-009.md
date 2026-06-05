# SPEC006DETVALENG-009: Server `POST /api/validate` route

**Status**: ✅ COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `packages/server/src/validation-routes.ts`; registered in `packages/server/src/server.ts`. No new tables, no DDL, no `user_version` bump.
**Deps**: SPEC006DETVALENG-002, SPEC006DETVALENG-003

## Problem

Deliverable 2: a localhost `POST /api/validate` endpoint that owns I/O resolution and exposes the engine's `ValidationResult` to the web layer. It requires an open project; loads the current records, `generation_session`, and the three story-config singletons; resolves `active_working_set.selected_records` to payloads; builds the core snapshot; runs the engine; and returns `ValidationResult`. It never mutates project data and returns the same result for the same state. Request/response bodies carry brief/directive/voice text and must not be logged.

## Assumption Reassessment (2026-06-05)

1. The engine public API (`runValidation`, `buildValidationSnapshot`, `ValidationResult`) is exported from `@loom/core` by SPEC006DETVALENG-001; meaningful blockers exist once 002 (completeness) and 003 (universal blockers, incl. two-location/two-holder/accepted-prose/non-local-directive) land — this route's integration tests assert those blocker codes, hence the `Deps`. The repository exposes the loaders this route needs: `listRecords({type?, includeArchived?})`, `getRecord(id)`, `getStoryConfig(kind)`, `getGenerationSession()` (`packages/server/src/record-repository.ts`).
2. Binding source: SPEC-006 §"`@loom/server` — localhost validation endpoint" + §Deliverables 2 + `VALIDATION-ENGINE.md` "Data/logic implications" (snapshot resolution before the pure engine runs). The `no-open-project` convention is `{ ok: false, kind: "no-open-project", message: "No project is open." }` at HTTP 409 (`packages/server/src/generation-brief-routes.ts:7`). The registration convention is `registerXxxRoutes(app, projectStoreManager)` called in `server.ts` (lines 61–65).
3. Cross-artifact boundary under audit: the snapshot-resolution boundary (SPEC-006 §Risks) — the server resolves selected-record IDs to payloads via the repository **before** the pure engine runs; `@loom/core` receives resolved data, never IDs-to-fetch, preserving the core `node:*`/framework boundary. The shared contract is `buildValidationSnapshot`'s input shape (from ticket 001).
4. FOUNDATIONS §11 (the engine is the gatekeeper; domain validation enforces the rule even if UI controls fail) and §23 (no key/payload logging) restated. The SPEC-001 `req` serializer already emits only method/url/hostname/ip; this handler logs no request/response payloads.
5. Fail-closed/secret-firewall/determinism surface named: the route is read-only — it calls only repository getters and `runValidation`; it performs no `setStoryConfig`/`setGenerationSession`/record write. Determinism is preserved because the route passes already-loaded, order-normalized data to the pure engine; identical project state yields an identical `ValidationResult`. No key-like value is logged (the engine's security blocker, ticket 008, names the field without echoing the value; the route does not log the response body).
6. Mismatch + correction: the snapshot version identifiers are template + compiler only (`versionInfo.templates.version`/`versionInfo.compiler.version` from `@loom/core`), matching the post-reassessment spec — there is no `contract` version key in `VersionInfo` (`packages/core/src/version.ts`).

## Architecture Check

1. Resolving IDs→payloads in the server (not the engine) keeps `@loom/core` pure and makes the route the single I/O owner, mirroring how `generation-brief-routes.ts`/`working-set-routes.ts` read the repository and return structured results. The handler is a thin compose-and-run, so all validation logic stays unit-tested in core.
2. No backwards-compatibility aliasing/shims: net-new route module following the existing `register*Routes` convention.

## Verification Layers

1. Clean state → empty blockers; contradictory state → expected blocker codes -> server integration test (Fastify `inject`) against a temp project.
2. Warning-only state → `isBlocked: false` with warnings present -> integration test.
3. No open project → `409 { ok: false, kind: "no-open-project", ... }` -> integration test.
4. Validation mutates nothing -> integration test: record + `generation_session` round-trip unchanged after a validate call (re-read and deep-equal).
5. No payload/key logging -> manual review of the handler + grep-proof that the handler passes no request/response body to `app.log`/`request.log`.

## What to Change

### 1. Validation route

`packages/server/src/validation-routes.ts` — `registerValidationRoutes(app, projectStoreManager)` exposing `POST /api/validate`: if no open project → 409 `no-open-project`; else load records (`listRecords`), `getGenerationSession()`, the three `getStoryConfig(kind)` singletons; resolve `active_working_set.selected_records` to payloads via `getRecord`; call `buildValidationSnapshot(...)` then `runValidation(...)`; return `ValidationResult`. Log no brief/directive/voice/key text.

### 2. Register the route

`packages/server/src/server.ts` (modify) — `import { registerValidationRoutes }` and call `registerValidationRoutes(app, projectStoreManager)` alongside the existing `register*Routes` calls.

## Files to Touch

- `packages/server/src/validation-routes.ts` (new)
- `packages/server/src/server.ts` (modify)
- `packages/server/src/validation-routes.test.ts` (new)

## Out of Scope

- Engine rule logic — tickets 001–008 (the route composes them, it does not define rules).
- The web panel and `api.ts` wrapper — ticket 010.
- Any DDL / new table / `user_version` bump — none (read-only over existing storage, SPEC-006 §Out of Scope).
- Prompt preview / send gating that consumes `isBlocked` — Phases 8–9 (out of SPEC-006 scope).

## Acceptance Criteria

### Tests That Must Pass

1. `POST /api/validate` on a clean temp project → `{ blockers: [], ..., isBlocked: false }`.
2. Contradictory state (two locations / two holders / accepted-prose contamination / non-local directive) → response contains the expected blocker codes with `isBlocked: true`.
3. Warning-only state → `isBlocked: false` with warnings present; no open project → `409` structured `no-open-project`.
4. A validate call leaves records and `generation_session` byte-identical (re-read round-trip).
5. `npm test -- validation-routes` and `npm run typecheck && npm run lint && npm test && npm run build` all green.

### Invariants

1. The route never writes project data and returns identical `ValidationResult` for identical state.
2. Request/response bodies (brief/directive/voice/key text) are never logged.

## Test Plan

### New/Modified Tests

1. `packages/server/src/validation-routes.test.ts` — clean/contradictory/warning-only/no-open-project cases, no-mutation round-trip, and a log-capture assertion that no payload text is logged.

### Commands

1. `npm test -- validation-routes`
2. `npm run typecheck && npm run lint && npm test && npm run build`

## Outcome

Completed: 2026-06-05

Implemented the server validation endpoint:

- Added `packages/server/src/validation-routes.ts` with `POST /api/validate`.
- Registered the route in `packages/server/src/server.ts`.
- The route requires an open project, loads generation session and story-config singletons, resolves selected records to validation records with metadata/cast-band assignments, builds a core validation snapshot, runs the engine, and returns `ValidationResult`.
- The route performs no project writes and does not log request/response payloads.
- Added `packages/server/src/validation-routes.test.ts` covering no-open-project, clean/warning validation response, blocker response, no mutation, and no payload-text logging.

Deviation from original plan: integration tests assert prompt-facing blocker behavior rather than every core contradiction shape; exhaustive rule behavior remains covered by the core rule tests from tickets 002–008.

Verification:

- `npm test -- validation-routes` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed.
- `npm run build` — passed.
