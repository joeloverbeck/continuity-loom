# STORYCFGUX-001: Stop emitting 404 console errors for unauthored story-config kinds

**Status**: COMPLETED
**Priority**: LOW
**Effort**: Small
**Engine Changes**: Yes — additive `GET /api/story-config` list route (`packages/server/src/story-config-routes.ts`), new `listStoryConfig` web client (`packages/web/src/api.ts`), and two web consumers switched to it. No change to the existing per-kind `GET /api/story-config/:kind` 404 contract, no schema change, no compiler/validation change.
**Deps**: None.

## Problem

Opening `/story-config` for a project that has not authored every story-config kind produces browser console errors for normal use. For red-bunny, `GET /api/story-config/PROSE MODE` returns `404` (no prose mode authored), and the browser logs a "Failed to load resource: 404" line. The page itself handles this correctly — `ConfigPanel` maps the `not-found` result to a benign "No saved PROSE MODE yet" state with no `role=alert` (`packages/web/src/config/StoryConfigEditor.tsx:126-127,153`) — so this is **not** a functional defect, but the red console noise is undesirable for the ordinary act of not having filled in a config section yet.

The same `getStoryConfig("PROSE MODE")` call is made on the generation-brief page (`packages/web/src/generation-brief/GenerationBriefView.tsx:52`), so the identical 404 console line appears there too once WSINTEGRITY-001/002 unblock that page.

`requestJson` does not throw on non-2xx — it parses the JSON body (`packages/web/src/api.ts:197-216`) — so there is no JS exception or unhandled rejection; the noise is purely the browser's automatic network-error log for the 404 response. The fix is to avoid *issuing* a request that 404s for the normal "kind not authored yet" case.

This is issue 4 from the bug report and is unrelated to the working-set dangling-reference root cause (WSINTEGRITY-001/002).

## Assumption Reassessment (2026-06-07)

1. **Console noise source confirmed.** `getStoryConfig(kind)` (`api.ts:306-308`) calls `requestJson("/api/story-config/:kind", "GET")`; the server route (`packages/server/src/story-config-routes.ts:32`) returns `404 { ok:false, kind:"not-found" }` for an unauthored kind. `requestJson` (`api.ts:197-216`) returns the parsed body without throwing — the only error is the browser's network-level 404 log. Verified live: red-bunny `/story-config` shows STORY CONTRACT `200`, UNIVERSAL CONTENT POLICY `200`, PROSE MODE `404`, no `role=alert`, no `console.error`.
2. **Consumers of the per-kind GET.** Web: `StoryConfigEditor.tsx:118` (one panel per kind) and `GenerationBriefView.tsx:52` (PROSE MODE only). The server-side compiler/snapshot path uses `RecordRepository.getStoryConfig` directly (`snapshot-builder.ts:66-88`), **not** the HTTP route, so changing the web fetch strategy does not affect compilation. Tests reference `getStoryConfig` in `StoryConfigEditor.test.tsx`, `GenerationBriefView.test.tsx`, and `api.test.tsx`.
3. **Shared boundary under audit:** the `/api/story-config` HTTP surface consumed by the web config and generation-brief pages. The change is **additive** — a new `GET /api/story-config` (no `:kind`) list route that returns only the authored kinds (absent kinds omitted), so the page renders "missing" states without issuing a 404-producing request. The existing per-kind `GET`/`PUT` routes and their 404 not-found contract are left intact.
4. **FOUNDATIONS principles restated:** §27 (UI and workflow principles — the app should make normal authoring pleasant and not surface spurious errors) and §29.11 (quality and workflow checks). No non-negotiable principle is engaged: this changes no stored data, no prompt compilation, no validation gate, and no API-key/secret handling. The `story_config` table remains the single authority for these kinds (the CONFIGDEDUP invariant is untouched).
5. **No schema extension.** The new route returns existing `story_config` payloads (already validated by `getStoryConfig` against the per-kind schemas); it introduces no new persisted field. Response shape is additive client surface only.
6. **Adjacent contradiction classification:** none. This is an isolated UX-noise fix; it does not depend on or block the WSINTEGRITY tickets (they fix a different page failure).

## Architecture Check

1. A single additive list endpoint that returns authored kinds (absent kinds omitted) is cleaner than: (a) changing the per-kind `GET` to return `200` for an absent kind — that breaks the not-found contract other call sites and tests rely on; or (b) a web-only hack that swallows the fetch — the browser still issues the 404 request. Reading all kinds in one `200` response means no request 404s for the normal unauthored case, and both pages share one client function.
2. No backwards-compatibility aliasing/shims. The existing per-kind routes stay exactly as they are; the new route is independent and additive.

## Verification Layers

1. The new list route returns only authored kinds → test (`story-config-routes` test: seed STORY CONTRACT + UNIVERSAL CONTENT POLICY, assert the list response contains those two and omits PROSE MODE, status `200`).
2. `/story-config` issues no 404-producing request for an unauthored kind → schema/UI test (`StoryConfigEditor.test.tsx`: mock `listStoryConfig`, assert no per-kind `getStoryConfig` 404 fetch is made and the absent kind renders "No saved … yet").
3. The generation-brief page no longer 404s on absent PROSE MODE → test (`GenerationBriefView.test.tsx`: drive prose-mode presence/absence through `listStoryConfig`).
4. The per-kind not-found contract is unchanged → codebase grep-proof + existing `api.test.tsx`/`story-config-routes` tests for `GET /api/story-config/:kind` still pass (still `404` for an absent kind).

## What to Change

### 1. Additive list route (server)

In `packages/server/src/story-config-routes.ts`, add `GET /api/story-config` returning `{ ok: true, configs: { <kind>: <payload>, … } }` containing only kinds with a stored, schema-valid row (omit absent kinds; reuse `RecordRepository.getStoryConfig` per kind and skip `not-found`). Return `409 no-open-project` when no project is open, consistent with the sibling routes.

### 2. Web client (api.ts)

Add `listStoryConfig()` calling `requestJson("/api/story-config", "GET")`, typed to return the per-kind payload map. Keep `getStoryConfig` as-is for callers that still need a single kind.

### 3. Switch the two consumers

- `packages/web/src/config/StoryConfigEditor.tsx`: fetch once via `listStoryConfig`; render each kind's panel from the map — present ⇒ editor with payload, absent ⇒ the existing "No saved {kind} yet" state — without a per-kind 404 fetch. Preserve the existing error path for an actual non-404 failure.
- `packages/web/src/generation-brief/GenerationBriefView.tsx`: derive PROSE MODE presence from `listStoryConfig` instead of `getStoryConfig("PROSE MODE")`, eliminating that page's 404 line too.

## Files to Touch

- `packages/server/src/story-config-routes.ts` (modify — add list route)
- `packages/server/src/story-config-routes.test.ts` (modify — list-route coverage)
- `packages/web/src/api.ts` (modify — add `listStoryConfig`)
- `packages/web/src/config/StoryConfigEditor.tsx` (modify — consume list route)
- `packages/web/src/config/StoryConfigEditor.test.tsx` (modify)
- `packages/web/src/generation-brief/GenerationBriefView.tsx` (modify — consume list route)
- `packages/web/src/generation-brief/GenerationBriefView.test.tsx` (modify)
- `packages/web/src/api.test.tsx` (modify — `listStoryConfig` coverage)

## Out of Scope

- Any change to the existing `GET`/`PUT /api/story-config/:kind` routes or their `404` not-found contract.
- The working-set dangling-reference failures on `/generation-brief`, `/preview`, `/generate` — **WSINTEGRITY-001 / WSINTEGRITY-002**.
- Authoring a default PROSE MODE for red-bunny (validation still correctly reports it missing until the user authors one).
- Any change to compilation, validation, or the `story_config` storage authority.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -w @loom/server` — `story-config-routes.test.ts` proves `GET /api/story-config` returns authored kinds only (`200`), omits unauthored kinds, and returns `409` with no open project; the per-kind `GET` still returns `404` for an absent kind.
2. `npm test -w @loom/web` — `StoryConfigEditor.test.tsx`, `GenerationBriefView.test.tsx`, and `api.test.tsx` prove the pages consume the list route and issue no per-kind 404 fetch for an unauthored kind, while the "No saved … yet" rendering is preserved.
3. `npm test` — full suite green.
4. `npm run lint && npm run typecheck` — clean.

### Invariants

1. Loading `/story-config` for a project missing one or more config kinds produces no failing (404) network request for the unauthored kinds.
2. The `story_config` table remains the single authority for STORY CONTRACT / UNIVERSAL CONTENT POLICY / PROSE MODE; the list route is read-only and adds no new persisted field.
3. The per-kind `GET /api/story-config/:kind` not-found behavior is unchanged.

## Test Plan

### New/Modified Tests

1. `packages/server/src/story-config-routes.test.ts` — list-route coverage (authored-only, no-open-project, per-kind 404 unchanged).
2. `packages/web/src/config/StoryConfigEditor.test.tsx` — assert single list fetch, no per-kind 404, missing-state rendering preserved.
3. `packages/web/src/generation-brief/GenerationBriefView.test.tsx` — prose-mode presence/absence via the list route.
4. `packages/web/src/api.test.tsx` — `listStoryConfig` request shape.

### Commands

1. `npm test -w @loom/server`
2. `npm test -w @loom/web`
3. `npm test`
4. `npm run lint && npm run typecheck`

## Outcome

Completion date: 2026-06-07

Implemented an additive `GET /api/story-config` list route returning authored story-config payloads only, added the typed `listStoryConfig` web client, and switched the story-config editor plus generation-brief page to consume the list response instead of issuing normal-missing per-kind `GET` requests.

Deviations from original plan: none. The existing per-kind `GET /api/story-config/:kind` not-found contract remains unchanged.

Verification results:

- `npm test -w @loom/server` — passed; `story-config-routes.test.ts` covers authored-only list results, no-open-project, and unchanged per-kind missing `404`.
- `npm test -w @loom/web` — passed; UI/API tests cover list consumption, missing PROSE MODE rendering, and request shape.
- `npm test` — passed.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
