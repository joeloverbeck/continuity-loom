# SPEC004RECCRUBAS-004: Server story-config and working-set membership routes

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new server route module(s) for global config + working-set membership; register in `packages/server/src/server.ts`
**Deps**: SPEC004RECCRUBAS-002

## Problem

Two non-record surfaces still have no HTTP access: the three global-config singletons (STORY CONTRACT / UNIVERSAL CONTENT POLICY / PROSE MODE), stored via `getStoryConfig`/`setStoryConfig`, and the minimal active-working-set membership, persisted through the `generation_session`. The web UI needs to read/write the three globals (config editor tickets) and to read/write working-set membership (working-set surface ticket). This ticket adds those routes. The working-set write persists **only** the `selected_records` list inside `active_working_set` — it must not require or fabricate the rest of the generation-time brief, which is why it depends on the SPEC004RECCRUBAS-002 schema relaxation.

## Assumption Reassessment (2026-06-05)

1. Repository surface exists as assumed in `packages/server/src/record-repository.ts`: `setStoryConfig(kind: StoryConfigKind, payloadInput)` (:290) / `getStoryConfig(kind): JsonReadResult` (:301); `setGenerationSession(payloadInput)` (:313, validates with `generationSessionSchema`) / `getGenerationSession(): JsonReadResult` (:324). `ProjectStoreManager.getRecordRepository()` (`project-store.ts:103`). The three `StoryConfigKind` values correspond to STORY CONTRACT / UNIVERSAL CONTENT POLICY / PROSE MODE singletons in `story_config`.
2. Spec `specs/SPEC-004-...md` (Approach → global story-config routes + active-working-set membership routes; Deliverable 2) specifies `GET/PUT /api/story-config/:kind` and `GET/PUT /api/working-set` (membership-only). Registration mirrors `registerProjectRoutes(app, manager)` (`project-routes.ts:29`) from `server.ts:57`.
3. Shared boundary under audit: (a) the **route contract** consumed by the web api client (SPEC004RECCRUBAS-005), config editors (-009), and working-set surface (-010); (b) the **`generation_session` shape** — the working-set write produces `{ active_working_set: { selected_records: [...] } }`, which is valid only after SPEC004RECCRUBAS-002 relaxes `selected_pov`/`manual_directive_id`/`active_onstage_cast_full` to optional. This ticket must `Deps` on -002 and verify against the relaxed schema.
4. FOUNDATIONS §7 (active working set supremacy) and §29.3 (no silent add/remove) motivate a membership write that only adds/removes record IDs on explicit request and never injects records the user did not select; the route is a pass-through of an explicit selected-IDs list, with no server-side "helpful" inclusion.
5. Enforcement-surface note (substrate feeding deferred validation): the working-set membership route writes generation-time-brief substrate that the **Phase-6 validation engine** will later gate (POV/manual-directive presence, contradiction checks). This route must not fabricate `selected_pov`/`manual_directive_id` to satisfy storage — it writes only what the user selected — so it introduces no false-completeness state the Phase-6 fail-closed checks would have to detect and undo. It performs no continuity validation itself (that is Phase 6); it only persists membership.

## Architecture Check

1. Keeping config and working-set routes thin pass-throughs over the existing singleton accessors avoids duplicating the singleton/upsert logic in the HTTP layer. Writing membership through the canonical `active_working_set` object (rather than a parallel store) means Phase 5 extends the same object with no migration.
2. No backwards-compatibility shim: net-new routes over existing accessors; the working-set route relies on the in-place schema relaxation from -002, not an alias schema.

## Verification Layers

1. Story-config singleton round-trip per kind (PUT then GET returns the written payload) -> server integration test.
2. Working-set membership round-trip: PUT `{ selectedRecordIds: [...] }` persists and GET returns it, with no full brief required -> integration test against the relaxed schema.
3. Malformed config payload → structured 400, nothing persisted -> integration test.
4. No open project → clean structured error on every route -> integration test.

## What to Change

### 1. Story-config routes

Add `registerStoryConfigRoutes(app, manager)` (own module, e.g. `packages/server/src/story-config-routes.ts`): `GET /api/story-config/:kind` and `PUT /api/story-config/:kind`, mapping the `:kind` path param to `StoryConfigKind`, delegating to `get/setStoryConfig`; structured 400 on validation failure, 404 on unknown kind / missing config, no-open-project error when the repository is null.

### 2. Working-set membership routes

Add `registerWorkingSetRoutes(app, manager)` (e.g. `packages/server/src/working-set-routes.ts`): `GET /api/working-set` returns the current `active_working_set.selected_records` (empty list when no session); `PUT /api/working-set` accepts an explicit selected-IDs list and writes it through `setGenerationSession`, preserving any other already-persisted brief fields and never injecting unselected records.

### 3. Register

Call both registrars from `server.ts` alongside `registerProjectRoutes` and `registerRecordRoutes`.

## Files to Touch

- `packages/server/src/story-config-routes.ts` (new)
- `packages/server/src/working-set-routes.ts` (new)
- `packages/server/src/server.ts` (modify) — register both (also modified by SPEC004RECCRUBAS-003; mechanical merge)
- `packages/server/src/working-set-routes.test.ts` (new)
- `packages/server/src/story-config-routes.test.ts` (new)

## Out of Scope

- Record CRUD routes — SPEC004RECCRUBAS-003.
- Full generation-time brief editing (POV, cast bands, directive, voice pressure, focus tags, stop guidance) — Phase 5; this ticket writes membership only.
- Continuity validation of the working set — Phase 6.
- Web UI for config/working-set — SPEC004RECCRUBAS-009/-010.

## Acceptance Criteria

### Tests That Must Pass

1. `PUT`/`GET /api/story-config/:kind` round-trips each of the three kinds; malformed config body returns a structured 400 and persists nothing.
2. `PUT /api/working-set` with a selected-IDs list persists and `GET /api/working-set` returns it, with **no** `selected_pov`/`manual_directive_id` supplied (proves the -002 relaxation path).
3. A working-set write preserves other previously-persisted brief fields and never adds an unselected record.
4. Every route returns a clean structured error when no project is open.
5. `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` pass.

### Invariants

1. The working-set membership write adds/removes only the explicitly-provided record IDs — no silent inclusion (FOUNDATIONS §7/§29.3).
2. The route fabricates no brief completeness (`selected_pov`/`manual_directive_id` are written only if the client provides them) — no false-valid state for Phase-6 validation to undo.

## Test Plan

### New/Modified Tests

1. `packages/server/src/story-config-routes.test.ts` — per-kind round-trip, malformed-400, no-open-project.
2. `packages/server/src/working-set-routes.test.ts` — membership round-trip without full brief, preservation of other fields, no-silent-inclusion, no-open-project.

### Commands

1. `npx vitest run packages/server/src/working-set-routes.test.ts packages/server/src/story-config-routes.test.ts`
2. `npm test && npm run typecheck && npm run lint && npm run build`
