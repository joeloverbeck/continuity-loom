# SPEC005CUSCASGEN-003: Server generation-brief routes + extended working-set write

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `packages/server/src/generation-brief-routes.ts`, registered in `server.ts`; full `active_working_set` surface persisted via the partial-merge brief write
**Deps**: None

## Problem

Seven of the eight generation-brief surfaces, plus the full `active_working_set` surface (cast inclusion bands, `local_function`, `selected_pov`, `manual_directive_id`), have no HTTP route — only `selected_records` membership is writable today (`packages/server/src/working-set-routes.ts`). The web brief workflow (SPEC005CUSCASGEN-006) and curation extension (SPEC005CUSCASGEN-007) need a full-session read and a partial-merge write over the existing repository methods.

## Assumption Reassessment (2026-06-05)

1. `RecordRepository.getGenerationSession()` returns a `JsonReadResult` (`not-found` | `malformed-json` | `{ok, payload}`) and `setGenerationSession(payloadInput)` calls `generationSessionSchema.parse(...)` which **throws `ZodError`** on a malformed payload — `packages/server/src/record-repository.ts:318-339`. The route pattern is `registerWorkingSetRoutes(app, manager)` in `packages/server/src/working-set-routes.ts:20-79` (uses `manager.getRecordRepository()` → 409 `no-open-project` when null; 422 on non-`not-found` read failure; 400 with `error.issues` on `ZodError`), registered in `packages/server/src/server.ts:63`.
2. `generationSessionSchema` (`packages/core/src/records/generation-brief.ts:158-169`): six `.optional()` surfaces plus `current_cast_voice_pressure` / `cast_voice_overrides` as `z.array(...).default([])`; `active_working_set` fields per `activeWorkingSetSchema:5-28` (`selected_records`, `active_onstage_cast_full` of `{cast_member_id, local_function}`, `present_minor_cast_compressed`, `offstage_relevant_cast`, `selected_pov`, `manual_directive_id`). This matches SPEC-005 §Approach (post-reassessment, corrected from the earlier "all surfaces `.optional()`" wording).
3. Shared boundary under audit: the HTTP contract consumed by the web api client (SPEC005CUSCASGEN-004). Validation stays at the repository boundary (the single `setGenerationSession` Zod parse); routes are thin. The existing `GET/PUT /api/working-set` membership round-trip (`packages/server/src/working-set-routes.test.ts`) must keep passing.
4. (FOUNDATIONS §11 / §29.5 + §7 / §29.3) These routes add **no** validation engine — they persist user-authored brief inputs. A malformed payload returns a structured 400 with Zod field issues, which is schema-shape validation, **not** the fail-closed generation gate (Phase 6). The extended `active_working_set` write persists explicit user band/`local_function` choices; there is no silent add/remove/compress.
5. (Secret-firewall / deterministic-compilation substrate) These routes persist generation-brief data that the Phase-7 compiler will consume. Brief prose, directive text, and voice-pressure text are **not logged**: routes log no request bodies and the `req` serializer (`packages/server/src/server.ts:42-51`) emits only method/url/hostname/ip; the existing redact paths cover `apiKey`/`prompt`/`candidateProse`/`acceptedProse`/`recordPayload`, none of which exist in these schemas. No secret value is read or echoed.
6. (Adjacent contradiction — resolved here) SPEC-005 §Risks leaves "extend `/api/working-set` vs. fold into the brief route" to the ticket phase. This ticket **keeps `GET/PUT /api/working-set` unchanged** (SPEC-004 membership round-trip) and routes the extended `active_working_set` write through `PUT /api/generation-brief`'s partial-merge (the `active_working_set` surface), avoiding duplicated AWS write logic. This is a required consequence of the ticket, not a separate bug.

## Architecture Check

1. A thin route module mirroring `registerWorkingSetRoutes` keeps validation at the repository boundary (a single Zod parse inside `setGenerationSession`), so routes never re-implement schema logic. Partial-merge read-modify-write means a one-surface write never fabricates the others. Keeping membership on `/api/working-set` preserves the SPEC-004 contract without a shim.
2. No backwards-compatibility aliasing or shims; reuses existing repository methods and the established route conventions.

## Verification Layers

1. Full-session round-trip → integration test: `GET /api/generation-brief` after a `PUT` returns all written surfaces.
2. Partial-surface write persists one surface without fabricating others → integration test: writing only `stop_guidance` leaves previously-written surfaces unchanged.
3. Cast-band / `local_function` / `selected_pov` / `manual_directive_id` persistence → integration test on the `active_working_set` surface.
4. Malformed surface → 400 with field-level issues → integration test posting a bad-shape surface.
5. No open project → structured `no-open-project` (409) → integration test with no project open.
6. SPEC-004 membership round-trip preserved → existing `working-set-routes.test.ts` still green.
7. Brief/directive/voice text not logged → integration test asserting captured logs exclude the written brief text.

## What to Change

### 1. Generation-brief routes

Add `packages/server/src/generation-brief-routes.ts` exporting `registerGenerationBriefRoutes(app, manager)`:
- `GET /api/generation-brief` → `repo.getGenerationSession()`; `not-found` → `{ok: true, session: {}}`; `malformed-json` → 422 (passthrough result); ok → `{ok: true, session: payload}`.
- `PUT /api/generation-brief` → body is any subset of brief surfaces; read the existing (parsed) session, merge the provided surfaces, call `setGenerationSession(merged)`; catch `ZodError` → 400 with `error.issues`.

### 2. Extended active-working-set write

The `PUT /api/generation-brief` handler accepts the full `active_working_set` surface (cast bands, `local_function`, `selected_pov`, `manual_directive_id`) through the same partial-merge. `GET/PUT /api/working-set` membership routes are left unchanged.

### 3. Register in server.ts

Add `registerGenerationBriefRoutes(app, projectStoreManager)` alongside the existing `registerWorkingSetRoutes` call in `packages/server/src/server.ts`.

## Files to Touch

- `packages/server/src/generation-brief-routes.ts` (new)
- `packages/server/src/generation-brief-routes.test.ts` (new)
- `packages/server/src/server.ts` (modify)

## Out of Scope

- The deterministic validation engine / fail-closed generation gate (Phase 6).
- Prompt compilation and prompt preview (Phase 7/8).
- Web UI and API client (SPEC005CUSCASGEN-004/006/007).
- Any new table, DDL change, or `user_version` bump.
- Modifying `working-set-routes.ts` (membership route stays as-is).

## Acceptance Criteria

### Tests That Must Pass

1. New `generation-brief-routes.test.ts`: full + partial round-trip, cast-band/`local_function`/`selected_pov`/`manual_directive_id` persistence, malformed-surface → 400 with issues, no-open-project → 409, and brief text absent from logs.
2. Existing `packages/server/src/working-set-routes.test.ts` still green (membership round-trip preserved).
3. `npm run typecheck && npm run lint && npm test && npm run build` all green.

### Invariants

1. All schema validation stays at the repository boundary (single `setGenerationSession` parse); routes are thin.
2. A partial-surface write never fabricates the other surfaces.
3. The SPEC-004 `/api/working-set` membership round-trip is unchanged; brief/directive/voice text never reaches the log stream.

## Test Plan

### New/Modified Tests

1. `packages/server/src/generation-brief-routes.test.ts` — full/partial round-trip, persistence, 400/409/redaction, against a temp project.

### Commands

1. `npm test` — builds `@loom/core`, then runs Vitest (includes the new server test + existing `working-set-routes.test.ts`).
2. `npm run typecheck && npm run lint && npm test && npm run build` — full CI gate.
3. Narrower boundary: server route behavior is proven by the integration test in `npm test`; `npx vitest run packages/server/src/generation-brief-routes.test.ts` (from `packages/server`) filters to it during development.
