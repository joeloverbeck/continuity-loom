# SPEC029PRINOTUSA-004: Notes/clip/batch routes + typed client

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — `@loom/server` `story-note-routes` (extended `GET/POST/PUT/DELETE /api/notes`, new tray routes, `POST /api/notes/delete-batch`, new error kinds, safe logging), `@loom/web` `api.ts` typed client fns + `StoryNoteSummary.mode`; production behavior change
**Deps**: SPEC029PRINOTUSA-002, SPEC029PRINOTUSA-003

## Problem

The find/source/prep UI needs an HTTP surface over the new repository search and clip
operations. SPEC-029 Deliverable 5 extends the existing notes routes with query/mode/relevance
params and adds tray + batch-delete routes, all on the localhost-only API with the existing
discriminated envelope, plus the typed web client functions that call them — including the web
mirror of the `StoryNoteSummary.mode` field (reassessment finding M1, web side).

## Assumption Reassessment (2026-06-22)

1. Verified against `packages/server/src/story-note-routes.ts`: `registerStoryNoteRoutes`
   (`:50`) registered at `server.ts:85`, repo reached via `manager.getStoryNotesRepository()`
   (`:38`, accessor `project-store.ts:436`); envelope `{ ok:false, kind:"no-open-project" }`
   (`:22`); handlers `GET /api/notes:51`, `GET :id:73`, `POST:88`, `PUT :id:106`,
   `DELETE :id:130`. New tray routes + `delete-batch` are added **inside** this already-registered
   plugin, so no `server.ts` wiring change.
2. Verified against `packages/web/src/api.ts`: native-fetch client `listNotes:401`,
   `getNote:412`, `createNote:416`, `updateNote:420`, `deleteNote:424`; `StoryNoteSummary`
   (`:269`, no `mode`); discriminated `ListNotesResponse`/`SaveNoteResponse`/`DeleteNoteResponse`
   (`:273–276`). Repository search (002) + clip ops (003) are the dependencies this surface calls.
3. Boundary under audit: the HTTP envelope contract crosses `@loom/server` → `@loom/web`. New
   error kinds (`404 clip-not-found|prep-not-found`, `409 not-a-prep-note|prep-has-clips|
   stale-source|stale-tray`) must be mirrored in the client's discriminated response types.
4. FOUNDATIONS restated (§29.9 / §15 secret firewall + §29.4): the routes make no binding
   change (`127.0.0.1` only), read no API key, and place no OpenRouter call; logs carry
   method/route/IDs/counts/status only — never bodies, clip content, selected text, snippets,
   raw results, or FTS rows. No client fn accepts a record reference, scene ID, generation
   payload, API key, or model option. Cross-surface non-leakage is proven by
   SPEC029PRINOTUSA-005.
5. Schema extension (§20 additive): `StoryNoteSummary` in `web/src/api.ts` gains `mode` (the
   server side landed in 002) plus the new query/response fields — additive client types whose
   only consumers are the notes panes (SPEC029PRINOTUSA-006). Existing `listNotes`/CRUD
   signatures are extended, not aliased.

## Architecture Check

1. Extending the existing route module and client keeps one notes API authority; the
   discriminated envelope is continued rather than introducing a second error shape. Atomic
   capture (validate-all-before-insert) and exact-set reorder push correctness into the route
   contract, not the client.
2. No backwards-compatibility shim: `mode`/`relevance` are new optional params with defined
   defaults (`mode=all`, relevance valid only with non-empty `q`); no legacy parameter alias.

## Verification Layers

1. Route envelope + error kinds -> server route test (`fastify.inject()`): each new route
   returns `409 no-open-project` with no open project; `409 prep-has-clips` on a scene-prep→
   scratch downgrade with clips; `409 stale-source`/`stale-tray`; `404 clip-not-found`.
2. Safe logging/no-leak -> server route test (no body/clip/selected-text/snippet in any error
   message or log line).
3. Client/server type parity -> typecheck + web client test (discriminated responses cover the
   new kinds; `StoryNoteSummary.mode` present).

## What to Change

### 1. Routes (`story-note-routes.ts`)

- `GET /api/notes`: add `q`, repeated `tag` (AND), `mode=all|scratch|scene-prep`, and
  `relevance` (valid only with non-empty `q`). `POST` accepts optional `mode`; `PUT` preserves
  omitted `mode` and returns `409 prep-has-clips` on a scene-prep→scratch downgrade with clips;
  `DELETE` keeps hard-delete semantics and may report cascaded-clip/detached-pointer counts.
- Tray routes: `GET /api/notes/:prepNoteId/clips`, `POST …/clips` (atomic 1–100,
  validate-all-before-insert, append after current max), `PUT …/clips/order` (replace exact
  ordered clip-ID set; stale ⇒ conflict), `DELETE …/clips/:clipId`, and
  `POST /api/notes/delete-batch` (atomic 1–100).
- Continue the discriminated envelope; add `404 clip-not-found|prep-not-found`,
  `409 not-a-prep-note|prep-has-clips|stale-source|stale-tray`. Messages never echo bodies or
  selected text. Logs carry method/route/IDs/counts/status only.

### 2. Typed client (`web/src/api.ts`)

- Add `listNoteClips`, `captureNoteClips`, `reorderNoteClips`, `deleteNoteClip`,
  `deleteNotesBatch`; extend `listNotes` query (`q`/`tag`/`mode`/`relevance`) and responses with
  the new derived fields; add `mode` to `StoryNoteSummary`; add the new error kinds to the
  discriminated response unions. No client fn accepts a record reference, scene ID, generation
  payload, API key, or model option.

## Files to Touch

- `packages/server/src/story-note-routes.ts` (modify)
- `packages/server/src/story-note-routes.test.ts` (modify)
- `packages/web/src/api.ts` (modify)

## Out of Scope

- React panes, highlighting, dialogs (SPEC029PRINOTUSA-006).
- Repository search/clip logic itself (SPEC029PRINOTUSA-002 / -003).
- Cross-surface firewall canaries (SPEC029PRINOTUSA-005).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/server -- story-note-routes` — every new route returns
   `409 no-open-project` with no open project; `409 prep-has-clips`/`stale-source`/`stale-tray`
   and `404 clip-not-found` returned in the discriminated envelope; no body/clip/selected-text
   appears in any error or log.
2. Batch capture and `delete-batch` are atomic (a single invalid item rejects the whole batch).
3. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. The notes API reads no API key, makes no OpenRouter call, and binds `127.0.0.1` only.
2. Client and server discriminated response types stay in parity (typecheck-enforced).

## Test Plan

### New/Modified Tests

1. `packages/server/src/story-note-routes.test.ts` — new-route no-open-project guard, error kinds, atomic batch, safe-logging assertions.

### Commands

1. `npm test --workspace @loom/server -- story-note-routes`
2. `npm run typecheck && npm run lint && npm test && npm run build`

## Outcome

Completed: 2026-06-22

Changed:
- Extended `GET /api/notes` with repeated `tag` params, `mode`, `sort=relevance`, and `relevance=true` validation.
- Exposed route envelopes for note delete effects, clip list/capture/reorder/delete, and atomic batch note delete.
- Mapped repository errors to structured `409` / `404` envelopes including `prep-has-clips`, `stale-source`, `stale-tray`, `source-not-found`, and `clip-not-found`.
- Updated PUT note behavior to surface the prep downgrade gate through the route.
- Added typed web API query fields, summary derived fields, clip read/capture types, tray client functions, and batch-delete client function.
- Expanded route tests for new no-open-project guards, multi-tag query parsing, clip lifecycle, stale-source/stale-tray envelopes, prep downgrade blocking, clip 404, and batch-delete atomicity.

Deviations:
- Delete responses are richer than the prior `{ ok: true }` shape; existing callers remain compatible because they only check `ok`, and tests were updated to provide the additive fields.
- `listTags()` remains the existing string list in `/api/notes`; count data remains repository-local for later UI work.

Verification:
- `npm test --workspace @loom/server -- story-note-routes` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed, 158 files / 1689 tests.
- `npm run build` — passed; Vite emitted the pre-existing large chunk warning.
