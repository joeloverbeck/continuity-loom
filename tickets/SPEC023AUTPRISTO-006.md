# SPEC023AUTPRISTO-006: Web API client helpers for notes

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — adds notes client helpers + types to `packages/web/src/api.ts` and a new client test; no change to existing client functions
**Deps**: 005

## Problem

The Notes UI needs typed native-fetch client helpers mirroring the existing record helpers: `listNotes`, `getNote`, `createNote`, `updateNote`, `deleteNote`, plus the request/response types matching the `/api/notes` contract (ticket 005). They must use the existing client transport convention so error handling stays consistent with the rest of the app.

## Assumption Reassessment (2026-06-15)

1. `packages/web/src/api.ts` exposes per-endpoint exported async helpers (e.g. `createRecord` `:325`, `updateRecord` `:329`, `deleteRecord` `:337`) built on the **private** transports `fetchJson<T>(url)` (GET, `:222`) and `requestJson<T>(url, method, body)` (`:236`, which already implements `"GET" | "POST" | "PUT" | "DELETE"`). There is no exported `fetchJson`/`postJson`, and there is currently no `api.test.ts` — the notes client test is a new file.
2. SPEC-023 §"API client" prescribes `listNotes(query?)`, `getNote(id)`, `createNote(input)`, `updateNote(id, input)`, `deleteNote(id)` returning typed responses, and (corrected by `/reassess-spec` this session) directs reuse of the existing `requestJson` for PUT/DELETE rather than adding new transport helpers, with per-endpoint exported functions matching `createRecord`/`updateRecord`/`deleteRecord`.
3. **Cross-artifact boundary under audit**: the client mirrors the `/api/notes` route contract (ticket 005) — same paths, methods, query params (`q`/`tag`/`pinned`/`sort`), and discriminated success/error envelopes. The shared boundary is the route response shape; the client's response types must match what 005 emits.
4. **Mismatch + correction**: an earlier spec draft said "Add PUT and DELETE helpers only if the current client lacks them" and referenced `fetchJson`/`postJson` as if public. `/reassess-spec` corrected this: `requestJson` already provides PUT/DELETE and the transports are private — so this ticket adds only per-endpoint helpers on top of `requestJson`/`fetchJson`, no new transport.

## Architecture Check

1. Reusing `requestJson`/`fetchJson` and the per-endpoint helper pattern keeps notes calls consistent with every other client surface (shared error convention, no bespoke fetch wrapper) — cleaner than introducing a notes-specific transport.
2. No backwards-compatibility aliasing/shims: additive exports only; no change to existing helpers or transports.
3. **Same revision; co-lands with the feature (§1.1)** — transitively after 001.

## Verification Layers

1. Each helper issues the correct URL + HTTP method, threading list query params (`q`/`tag`/`pinned`/`sort`) into the query string -> client test (mocked `fetch`).
2. PUT/DELETE route through the existing `requestJson`, not a new transport helper -> codebase grep-proof (no new `async function .*Json` transport added to `api.ts`).
3. Response types match the 005 route envelopes -> `npm run typecheck` across `@loom/web`.

## What to Change

### 1. Notes helpers + types in `packages/web/src/api.ts`

Add `listNotes(query?: NoteListQuery): Promise<ListNotesResponse>`, `getNote(id): Promise<GetNoteResponse>`, `createNote(input): Promise<SaveNoteResponse>`, `updateNote(id, input): Promise<SaveNoteResponse>`, `deleteNote(id): Promise<DeleteNoteResponse>`, plus the supporting request/response types. Build GET helpers on `fetchJson`, and POST/PUT/DELETE on `requestJson(url, method, body)`, mirroring `createRecord`/`updateRecord`/`deleteRecord`. Reuse `StoryNoteCreateInput`/`StoryNoteUpdateInput` from `@loom/core` where the input shape matches.

## Files to Touch

- `packages/web/src/api.ts` (modify)
- `packages/web/src/api-notes.test.ts` (new)

## Out of Scope

- Notes components / route / nav (tickets 007–008).
- Server routes (ticket 005).
- Any new fetch transport — PUT/DELETE reuse `requestJson`.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/web` — `api-notes.test.ts` asserts each helper calls the expected URL + method, and that `listNotes` serializes `q`/`tag`/`pinned`/`sort` into the query string.
2. `npm run typecheck` — notes response types align with the 005 route envelopes and `@loom/core` input types.

### Invariants

1. No new transport function is added to `api.ts`; notes helpers use the existing `fetchJson`/`requestJson`.
2. Client response types are a faithful mirror of the server route contract (no client-only fields).

## Test Plan

### New/Modified Tests

1. `packages/web/src/api-notes.test.ts` (new) — per-helper URL/method/query assertions against a mocked `fetch`.

### Commands

1. `npm test --workspace @loom/web -- api-notes`
2. `npm run typecheck`
3. `grep -nE "async function [a-zA-Z]+Json" packages/web/src/api.ts` — count unchanged from baseline (no new transport); the narrow grep proves the reuse invariant.
