# SPEC004RECCRUBAS-003: Server record CRUD HTTP routes

**Status**: PENDING
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — new `packages/server/src/record-routes.ts`; register in `packages/server/src/server.ts`
**Deps**: None

## Problem

After SPEC-003 the `RecordRepository` exposes full record CRUD + reference integrity in-process, but no HTTP surface reaches it — the API (`packages/server/src/project-routes.ts` + `server.ts`) has only project-lifecycle routes. The web UI cannot list, view, create, edit, archive, or delete records. This ticket adds the localhost-only REST surface for durable records: list (with filtering), get, create, update, archive, hard-delete (reference-integrity protected), and a references endpoint. Routes stay thin — all payload validation remains at the repository boundary (`parseRecordPayload`); the routes translate repository results/errors into structured HTTP responses the UI can field-link.

## Assumption Reassessment (2026-06-05)

1. The repository surface exists as assumed in `packages/server/src/record-repository.ts`: `createRecord(input): RecordRepositoryRecord` (:132), `updateRecord` (:188), `getRecord(id): RecordReadResult` (:241) with `{ ok:false, kind:"not-found"|"malformed-record" }`, `listRecords({type?, includeArchived?}): RecordReadResult[]` (:267), `archiveRecord(id)` (:280), `deleteRecord(id)` (:285), `referencesForRecord(id): RecordReference[]` (:366), and `class RecordIntegrityError` (:122) thrown on referenced delete (:408). `ProjectStoreManager.getRecordRepository(): RecordRepository | null` (`project-store.ts:103`).
2. Spec `specs/SPEC-004-...md` (Approach → `@loom/server` record CRUD routes; Deliverable 2) names exactly these endpoints and requires structured `not-found`/`malformed-record`/`reference-integrity` errors with field-level issues. Route registration follows `registerProjectRoutes(app, manager)` (`project-routes.ts:29`), a Fastify `FastifyInstance` pattern; register the new routes the same way from `server.ts:57`.
3. Shared boundary under audit: the **HTTP route contract** (paths, request/response shapes, error envelope) is consumed by the web API client (SPEC004RECCRUBAS-005) and transitively the browser/editors. The error envelope (carrying Zod issues + reference-integrity referrer list) is the load-bearing part the UI field-links against.
4. FOUNDATIONS §29.4 ("no arbitrary unvalidated blobs") and §11 motivate keeping validation at the repository (`parseRecordPayload`) rather than re-validating or coercing in the route; a malformed `POST`/`PUT` body must surface the repository's Zod issues as a structured 400, never persist. §29.10/§24 local-first: routes bind `127.0.0.1` only (inherited from the existing server bind; this ticket adds no new listener) and require an open project, returning a clean structured error otherwise.
5. Adjacent limitation made a required consequence of this ticket: the spec requires delete errors to **list the blocking referrers** and a `/references` endpoint exposing **incoming + outgoing** references, but today `RecordIntegrityError` (record-repository.ts:408) names a single referrer and `referencesForRecord` returns outgoing only. This ticket therefore adds an **incoming-reference query** against `record_references.target_id` (indexed) used by both the delete error and the references route. This modestly extends repository read behavior (rationale per §20: the spec's stated contract requires enumerating all referrers; a single-referrer error cannot drive safe cleanup UI). Classified as a required consequence of this ticket, not a separate bug.

## Architecture Check

1. Thin routes over the existing repository keep validation single-sourced (Zod at the repo) and avoid a parallel HTTP-layer schema that could drift. Structured error envelopes (kind + issues/referrers) let the UI render field-linked diagnostics without parsing prose messages.
2. No backwards-compatibility shim: net-new route file; the incoming-reference query is a new repository read method, not an alias over a renamed one.

## Verification Layers

1. CRUD round-trip over HTTP (create→list→get→update→archive→delete) -> server integration test against a temp project.
2. Malformed payload → structured 400 with Zod issues, nothing persisted -> integration test asserting body + that `listRecords` count is unchanged.
3. Referenced delete → structured reference-integrity error listing all active referrers (incoming query) -> integration test with a referencing fixture.
4. No open project → clean structured error on every route -> integration test with the manager closed.
5. Secret/privacy: record payloads and prose are not logged -> manual review + FOUNDATIONS §23/§29.9 alignment check against existing logging redaction.

## What to Change

### 1. Record routes module

Add `packages/server/src/record-routes.ts` exporting `registerRecordRoutes(app, manager)`:
- `GET /api/records` — `listRecords` + deterministic in-route filtering for `type`, `status`, `includeArchived`, free-text `q` (over display label/searchable fields), and reference filter (`refRole`/`targetId`); returns the common metadata projection per row.
- `GET /api/records/:id` — maps `getRecord` results to 200 / 404 (`not-found`) / 422 (`malformed-record`); returns full payload.
- `POST /api/records` — body `{ type, displayLabel?, payload }`; on repository `ZodError`/validation failure return a structured 400 with field-level issues; never persist on failure.
- `PUT /api/records/:id` — same validation contract; 404 if absent.
- `POST /api/records/:id/archive` — `archiveRecord`.
- `DELETE /api/records/:id` — `deleteRecord`; on `RecordIntegrityError` return a structured 409 listing **all** active inbound referrers.
- `GET /api/records/:id/references` — outgoing (`referencesForRecord`) + incoming (new `target_id` query).
- All routes: 409/400 "no open project" structured error when `getRecordRepository()` is null.

### 2. Incoming-reference query

Add a repository read (e.g. `incomingReferences(id): { fromRecordId, refRole }[]`) querying `record_references` by `target_id`; reuse it in `deleteRecord`'s integrity error so it enumerates every blocking referrer.

### 3. Register

Call `registerRecordRoutes(app, projectStoreManager)` from `server.ts` alongside `registerProjectRoutes`.

## Files to Touch

- `packages/server/src/record-routes.ts` (new)
- `packages/server/src/record-repository.ts` (modify) — incoming-reference query + multi-referrer integrity error
- `packages/server/src/server.ts` (modify) — register routes
- `packages/server/src/record-routes.test.ts` (new)

## Out of Scope

- Story-config + working-set routes — SPEC004RECCRUBAS-004.
- Any web/UI code — SPEC004RECCRUBAS-005+.
- Continuity validation (contradictions/blockers) — Phase 6; routes surface only repository-level structural errors.
- Accepted-segment / candidate / OpenRouter routes — Phases 9–11.

## Acceptance Criteria

### Tests That Must Pass

1. Create→list→get→update→archive→delete round-trip succeeds for a representative atomic type and for CAST MEMBER over HTTP.
2. `POST`/`PUT` with a malformed payload returns a structured 400 carrying Zod field issues and persists nothing (`listRecords` count unchanged).
3. `DELETE` of a record referenced by an active record returns a structured 409 enumerating all blocking referrers; `GET /api/records/:id/references` returns both incoming and outgoing references.
4. Every route returns a clean structured error when no project is open.
5. `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` pass.

### Invariants

1. All payload validation happens at the repository boundary; routes never coerce or bypass `parseRecordPayload`, and never persist a malformed payload (FOUNDATIONS §29.4).
2. No record payload, prose field, or brief text is written to logs (FOUNDATIONS §23/§29.9).
3. Deleting a referenced record can never produce a silent dangling reference — it is blocked with an enumerated referrer list.

## Test Plan

### New/Modified Tests

1. `packages/server/src/record-routes.test.ts` — CRUD round-trips, malformed-400, reference-integrity-409 + references endpoint, no-open-project errors.
2. `packages/server/src/record-repository.ts` change is covered by extending integrity assertions in the route test (incoming-reference enumeration).

### Commands

1. `npx vitest run packages/server/src/record-routes.test.ts`
2. `npm test && npm run typecheck && npm run lint && npm run build`
