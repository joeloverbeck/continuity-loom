# SPEC011ACCSEGARC-001: Accepted-segment read + delete server routes

**Status**: ✅ COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — adds `GET`/`DELETE /api/accepted-segments` route handlers to `@loom/server`, a new `RecordRepository.deleteAcceptedSegment` method, and a logging-redaction test
**Deps**: None

## Problem

After SPEC-010 the `accepted_segments` archive is **write-only**: `POST /api/accepted-segments`
appends a row via `appendAcceptedSegment`, but there is no route to read the archive back and no
delete path at all. `listAcceptedSegments()` exists in `record-repository.ts` with no HTTP route;
`deleteAcceptedSegment` does not exist. This ticket adds the server half of SPEC-011's browser: a
read-only `GET` list route, a single-row `DELETE` route backed by a new repository delete method,
and a logging test proving accepted prose never reaches stdout/stderr. It is the foundation that
unblocks the web API clients (002) and the browser UI (003).

## Assumption Reassessment (2026-06-06)

1. **`accepted-routes.ts` registers only `POST` today; `registerAcceptedRoutes` is the single wiring point.** Verified: `packages/server/src/accepted-routes.ts:33` (`app.post("/api/accepted-segments", …)`), exported `registerAcceptedRoutes` at `:32`, registered once in `createServer()` at `packages/server/src/server.ts:80`. The `no-open-project` failure helper (`noOpenProject()`, `:25`/`reply.code(409)`) is reused by the new handlers.
2. **The repository read side exists; the delete side does not.** Verified: `listAcceptedSegments(): AcceptedSegment[]` at `record-repository.ts:357` (`SELECT id, sequence, text, metadata_json, created_at … ORDER BY sequence`); `AcceptedSegment` interface `{ id, sequence, text, metadata, createdAt }` at `:41`; `appendAcceptedSegment` at `:341`. `grep -rn deleteAcceptedSegment packages/` returns zero — the method is new. The `accepted_segments` table (`record-tables.ts:45`) keys on `id INTEGER PRIMARY KEY AUTOINCREMENT` with `sequence INTEGER NOT NULL UNIQUE`, so a single-row delete by `id` is well-defined and leaves `sequence` gaps by design.
3. **Shared boundary under audit: the `accepted-routes.ts` route family + the `RecordRepository` accepted-segment methods.** Both the `GET`/`DELETE` handlers (this ticket) and the `POST` handler (SPEC-010) share `registerAcceptedRoutes` and the same repository instance; the new read route must return the verbatim `listAcceptedSegments()` shape that 002's client and 003's UI consume.
4. **FOUNDATIONS principles motivating this ticket:** §21/§6.5 (the archive is ordered readable output the user may see individually and in order — the `GET` makes it readable); §4.1/§13 (records change only through user record edits — `DELETE` removes one readable-output row and **must not** touch any record table); §12/§4.2/§29.1 (no branch — delete is not a re-sequence, rollback, or branch). Restated before trusting the spec: deletion removes cloth, never the loom.
5. **Secret/prose firewall surface (§23/§29.9):** the `GET` response carries accepted prose under `segments[].text`. The operative protection is that Fastify does not serialize response bodies into logs by default **plus** the discipline that these handlers log only `id`/`sequence`/`createdAt`/model id — never `text`. The existing `redact.paths` (`server.ts:36-50`, incl. `acceptedProse`, `body`, `candidateText`) is defense-in-depth that does **not** match a key named `text`/`segments`; this ticket must NOT add a generic `text` redaction path (it would over-redact app-wide). The logging test is the operative guard.
6. **Mismatch + correction:** the spec's Deliverable 2 implies a `record-repository.test.ts`; no such file exists. The repository is tested in `packages/server/src/record-layer.test.ts` (it covers `appendAcceptedSegment`/`listAcceptedSegments`). The `deleteAcceptedSegment` repo test lands there, not in a new file.

## Architecture Check

1. Co-locating `GET`/`DELETE` with the existing `POST` in `registerAcceptedRoutes` keeps the accepted-segment resource cohesive (one route family, one registration site, one shared `no-open-project` path) and matches the existing route-module convention (`working-set-routes.ts`, `generate-routes.ts`). `deleteAcceptedSegment` mirrors the existing single-statement repository methods (`prepare(...).run(...)`), returning a boolean from `changes > 0`.
2. No backwards-compatibility shims or alias routes. The delete is a plain single-row `DELETE FROM accepted_segments WHERE id = ?`; no re-sequence migration, no soft-delete column, no record-table write.

## Verification Layers

1. Read-back ordering invariant (`GET` returns `sequence ASC` with `text` + full `metadata`) -> server e2e via `fastify.inject` in `accepted-routes.test.ts` (schema validation against the `AcceptedSegment` shape).
2. Delete is single-row and record-inert (only the targeted row leaves `accepted_segments`; no `records`/`record_references` row changes; remaining `sequence` values unchanged) -> repository test in `record-layer.test.ts` (before/after row counts on both tables).
3. Validation/contract invariants (`not-found` for an unmatched id; 4xx for a non-integer/negative `:id`; `no-open-project` when no project is open) -> `fastify.inject` assertions in `accepted-routes.test.ts`.
4. Secret/prose firewall (seeded accepted-prose string never appears in captured stdout/stderr across `GET` and `DELETE`) -> logger-on capture test in `accepted-routes.test.ts` (manual-review-grade secret-firewall check, automated).

## What to Change

### 1. `RecordRepository.deleteAcceptedSegment(id: number): boolean`

Add to `record-repository.ts`: prepare `DELETE FROM accepted_segments WHERE id = ?`, run with `id`, return `result.changes > 0`. No re-sequence, no record-table write, no transaction beyond the single statement. Place it next to `listAcceptedSegments`.

### 2. `GET /api/accepted-segments` (in `registerAcceptedRoutes`)

Resolve the open project's repository (`manager.getRecordRepository()`); on null reply `409` with `noOpenProject()`. Otherwise reply `200` with `{ ok: true, segments: repository.listAcceptedSegments() }` — each segment `{ id, sequence, text, metadata, createdAt }`, already `sequence ASC`. No validation, no compilation, no record-table read. Do not log the segment payload.

### 3. `DELETE /api/accepted-segments/:id` (same function)

Parse `:id`; reject non-integer / non-positive with `400` and a structured error (reuse the module's error-shape convention — e.g. a `invalid-id` kind), performing no write. Resolve the repository (`409` `noOpenProject()` if absent). Call `deleteAcceptedSegment(id)`: `true` → `200 { ok: true, deleted: { id } }`; `false` → `404` structured `not-found`. Log only `id` on the delete path, never `text`.

### 4. Tests

`record-layer.test.ts`: delete removes exactly the targeted row, leaves other `accepted_segments` rows and their `sequence` untouched (gap, not renumber), writes no `records`/`record_references` row; deleting a missing id returns `false` and writes nothing. `accepted-routes.test.ts`: `GET` ordered read-back with text+metadata; empty archive → `{ ok: true, segments: [] }`; `GET`/`DELETE` `no-open-project`; `DELETE` success/`not-found`/bad-`:id`; logger-on test asserting a seeded accepted-prose string is absent from captured stdout/stderr for both `GET` and `DELETE`.

## Files to Touch

- `packages/server/src/record-repository.ts` (modify)
- `packages/server/src/accepted-routes.ts` (modify)
- `packages/server/src/record-layer.test.ts` (modify)
- `packages/server/src/accepted-routes.test.ts` (modify)

## Out of Scope

- Sequence renumbering / re-indexing on delete — forbidden (rewriting meaning); the gap is intentional and `sequence` is immutable.
- Any record-table mutation, branch, or rollback on delete (§12/§29.1).
- Web API clients and UI (002, 003, 004); the persistent durable-change reminder (Phase 12); export and filter (UI-side, 003).
- Any new SQLite table, `user_version` bump, or `@loom/core` change — the table already exists.
- A generic `text` redaction path (over-redacts app-wide).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -w @loom/server -- accepted-routes` — `GET` returns `sequence ASC` with `text`+`metadata`; empty → `{ ok: true, segments: [] }`; `DELETE` success → `{ ok: true, deleted: { id } }`; unmatched id → `not-found`; non-integer/negative `:id` → 4xx with no write; both routes return `no-open-project` when no project is open; seeded accepted prose absent from captured logs for `GET` and `DELETE`.
2. `npm test -w @loom/server -- record-layer` — `deleteAcceptedSegment` removes one row, leaves remaining rows/sequences intact, writes no record table; missing id → `false`, no write.
3. `npm run typecheck && npm run lint && npm test && npm run build` — all green (core import-boundary rule included; core untouched).

### Invariants

1. `DELETE` mutates only `accepted_segments` (one row); `records` and `record_references` are never written in any branch.
2. The `GET` response body shape is exactly `{ ok: true, segments: AcceptedSegment[] }` ordered `sequence ASC`, with `AcceptedSegment = { id, sequence, text, metadata, createdAt }` — the contract 002/003 consume.

## Test Plan

### New/Modified Tests

1. `packages/server/src/accepted-routes.test.ts` — `GET` read-back/empty/no-open-project; `DELETE` success/not-found/bad-id/no-open-project; logging-redaction capture for both routes.
2. `packages/server/src/record-layer.test.ts` — `deleteAcceptedSegment` single-row + record-inertness + missing-id cases.

### Commands

1. `npm test -w @loom/server -- accepted-routes record-layer`
2. `npm run typecheck && npm run lint && npm test && npm run build`

## Outcome

Completed: 2026-06-06

Implemented `GET /api/accepted-segments` and `DELETE /api/accepted-segments/:id` in the existing accepted-segment route module, plus `RecordRepository.deleteAcceptedSegment(id): boolean`. Listing returns the repository's `sequence ASC` rows with text and metadata; deletion removes only the targeted accepted segment row, leaves sequence gaps intact, and returns structured `invalid-id`, `not-found`, and `no-open-project` failures.

Tests were added for route list/delete behavior, empty/no-open-project cases, invalid ids, not-found deletion, sequence-gap preservation, accepted-prose log exclusion, and repository-level record-table inertness. The prior brittle source-count assertion around `accepted_segments` was removed in favor of behavioral table-count checks.

Verification:

- `npm test -w @loom/server -- accepted-routes record-layer` — passed (2 files, 18 tests)
- `npm run typecheck` — passed
- `npm run lint` — passed
- `npm test` — passed (60 files, 343 tests)
- `npm run build` — passed
