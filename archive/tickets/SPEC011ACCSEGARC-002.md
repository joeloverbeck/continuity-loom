# SPEC011ACCSEGARC-002: Web API clients for accepted-segment list/delete

**Status**: ✅ COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — adds `listAcceptedSegments` / `deleteAcceptedSegment` clients and a web `AcceptedSegment` view type to `@loom/web`'s `api.ts`
**Deps**: SPEC011ACCSEGARC-001

## Problem

The browser UI (003) needs typed client functions to read and delete accepted segments, but
`packages/web/src/api.ts` exposes only `acceptCandidate()` (the SPEC-010 write) — there is no
list or delete client, and `AcceptedSegmentRef` (`{ id, sequence, createdAt }`) carries neither
`text` nor `metadata`, so it cannot type a readable list row. This ticket adds the two clients and
a web `AcceptedSegment` view type over the routes 001 introduced, so the UI consumes a typed,
discriminated success/failure contract.

## Assumption Reassessment (2026-06-06)

1. **`api.ts` has the shared failure shape and the request helper, but no accepted-list/delete client.** Verified: `ApiFailure = { ok: false; kind: string; message: string; … }` at `packages/web/src/api.ts:40`; the `requestJson<T>(path, method, body?)` helper underpins existing clients (e.g. `putOpenRouterSettings` at `:314`, `acceptCandidate` at `:326`); `grep -n "listAcceptedSegments\|deleteAcceptedSegment" api.ts` returns zero. `kind` is an open `string`, so `no-open-project` / `not-found` / `invalid-id` from 001 flow through `ApiFailure` without an enum change.
2. **`AcceptedSegmentRef` lacks `text`/`metadata`; a new view type is required (the spec's own conclusion).** Verified: `AcceptedSegmentRef { id: number; sequence: number; createdAt: string }` at `api.ts:99` — used by `AcceptResponse` (`:105`). It stays as-is for the write path; the read path needs a distinct `AcceptedSegment` view type carrying `text` + `metadata`.
3. **Shared boundary under audit: the `GET`/`DELETE /api/accepted-segments` response contracts from 001.** `ListAcceptedSegmentsResponse` must mirror 001's `{ ok: true, segments: [{ id, sequence, text, metadata, createdAt }] }`; `DeleteAcceptedSegmentResponse` must mirror `{ ok: true, deleted: { id } }`. A drift here silently breaks 003.
4. **FOUNDATIONS principle motivating this ticket (§21/§6.5, §10/§28.1):** the clients expose read-back and delete only — there is deliberately **no** "use as prompt context" / "send to /generate" client method. The read client is a reading affordance, never a prompt source.
5. **Schema/type relationship is additive (§ accepted-segment archive entry):** the new web `AcceptedSegment` view type is purely additive — `AcceptedSegmentRef` and `AcceptResponse` are unchanged, so the SPEC-010 write path keeps its narrow ref. The view type's `metadata` carries the `GenerationMetadata` shape SPEC-010 persists (`model`, `provider`, `temperature`, `maxOutputTokens`, `topP?`, `versions: { template, compiler, contract }`), but arrives as parsed JSON; type it as `GenerationMetadata` for the panel while the UI (003) reads it defensively.
6. **Mismatch + correction:** the web api test file is `packages/web/src/api.test.tsx` (`.tsx`), not `api.test.ts`; the new client tests land there.

## Architecture Check

1. Reusing `requestJson<T>` and the discriminated `{ ok: true; … } | ApiFailure` union matches every existing client in `api.ts`, so callers branch on `result.ok` uniformly. A dedicated read-only `AcceptedSegment` view type (rather than widening `AcceptedSegmentRef`) keeps the write-path ref minimal and the read-path row self-describing.
2. No backwards-compatibility shims. `AcceptedSegmentRef` is not modified or aliased; the new type and clients are additive.

## Verification Layers

1. List-client contract (success returns `{ ok: true; segments: AcceptedSegment[] }`; `no-open-project` surfaces as `ApiFailure`) -> `api.test.tsx` with a mocked `fetch` for `GET /api/accepted-segments`.
2. Delete-client contract (success `{ ok: true; deleted: { id } }`; `not-found` surfaces as `ApiFailure`) -> `api.test.tsx` with mocked `fetch` for `DELETE /api/accepted-segments/:id`.
3. Type-shape invariant (`AcceptedSegment` carries `text` + `metadata`; `AcceptedSegmentRef` unchanged) -> `npm run typecheck` (compile-time) + grep-proof that `AcceptedSegmentRef` still reads `{ id, sequence, createdAt }`.

## What to Change

### 1. Types in `api.ts`

Add a web view type `AcceptedSegment = { id: number; sequence: number; text: string; metadata: GenerationMetadata; createdAt: string }` (reusing the existing `GenerationMetadata` at `api.ts:84`). Add response unions `ListAcceptedSegmentsResponse = { ok: true; segments: AcceptedSegment[] } | ApiFailure` and `DeleteAcceptedSegmentResponse = { ok: true; deleted: { id: number } } | ApiFailure`. Leave `AcceptedSegmentRef` and `AcceptResponse` untouched.

### 2. Clients in `api.ts`

`listAcceptedSegments(): Promise<ListAcceptedSegmentsResponse>` over `GET /api/accepted-segments`; `deleteAcceptedSegment(id: number): Promise<DeleteAcceptedSegmentResponse>` over `DELETE /api/accepted-segments/${id}` — both via `requestJson`, mirroring the existing client style. No prompt-context / generate method is added.

### 3. Tests in `api.test.tsx`

Mocked-`fetch` tests: list success (segments with `text`+`metadata`), list `no-open-project` failure; delete success (`deleted.id`), delete `not-found` failure. Assert the discriminated `ok` branch and the failure `kind` pass-through.

## Files to Touch

- `packages/web/src/api.ts` (modify)
- `packages/web/src/api.test.tsx` (modify)

## Out of Scope

- Any UI rendering, nav, filter, export, or delete-confirmation — that is 003/004.
- Modifying `AcceptedSegmentRef` or the `acceptCandidate` write path.
- Any "use as prompt context" / send-to-`/generate` client (§10/§28.1).
- Server route behavior (owned by 001).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -w @loom/web -- api` — list success returns typed `segments` with `text`+`metadata`; list `no-open-project` returns `ApiFailure`; delete success returns `{ ok: true, deleted: { id } }`; delete `not-found` returns `ApiFailure`.
2. `npm run typecheck` — the new `AcceptedSegment` view type and response unions compile; `AcceptedSegmentRef` is unchanged.
3. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. Failure responses from both clients are the shared `ApiFailure` discriminated union (callers branch on `result.ok`), with `kind` carrying `no-open-project` / `not-found` verbatim from 001.
2. `AcceptedSegmentRef` remains `{ id, sequence, createdAt }` — the write path is not widened.

## Test Plan

### New/Modified Tests

1. `packages/web/src/api.test.tsx` — list/delete client success + failure cases with mocked `fetch`.

### Commands

1. `npm test -w @loom/web -- api`
2. `npm run typecheck && npm run lint && npm test && npm run build`

## Outcome

Completed: 2026-06-06

Added the read-path `AcceptedSegment` web type carrying `text` and `metadata`, plus `ListAcceptedSegmentsResponse` and `DeleteAcceptedSegmentResponse`. `AcceptedSegmentRef` and the `acceptCandidate` write response stayed unchanged. Added `listAcceptedSegments()` over `GET /api/accepted-segments` and `deleteAcceptedSegment(id)` over `DELETE /api/accepted-segments/:id`, both using the shared `ApiFailure` union and no prompt-context affordance.

Tests were added in `api.test.tsx` for list success with text and metadata, list `no-open-project`, delete success, and delete `not-found`.

Verification:

- `npm test -w @loom/web -- api` — passed (1 file, 22 tests)
- `npm run typecheck` — passed
- `npm run lint` — passed
- `npm test` — passed (60 files, 347 tests)
- `npm run build` — passed
