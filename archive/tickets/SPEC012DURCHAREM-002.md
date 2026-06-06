# SPEC012DURCHAREM-002: Durable-change reminder routes

**Status**: ✅ COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `packages/server/src/reminder-routes.ts` (`GET /api/durable-change-reminder`, `POST /api/durable-change-reminder/acknowledge`); registered in `createServer()`
**Deps**: SPEC012DURCHAREM-001

## Problem

The web banner needs a derive-only read of reminder state and an advance-threshold acknowledge write, both scoped to the open project. This ticket adds the two HTTP endpoints over the repository methods from SPEC012DURCHAREM-001, reusing the existing `no-open-project` failure path. The endpoints are strictly downstream of acceptance: they never write a record or accepted segment, never run validation/compilation, and carry no accepted prose. (SPEC-012 Deliverable 2.)

## Assumption Reassessment (2026-06-06)

1. **Route-registration convention confirmed.** `packages/server/src/server.ts:30` `export function createServer(...)` registers each surface via `register*Routes(app, projectStoreManager)` at `server.ts:71-80` (e.g. `registerAcceptedRoutes` at `:80`). `reminder-routes.ts` follows the sibling shape of `accepted-routes.ts:44` (`registerAcceptedRoutes(app, manager)`); the `*-routes.ts` filename matches the existing convention.
2. **Repository surface lands in SPEC012DURCHAREM-001.** This ticket consumes `getLatestAcceptedSegment` / `getReminderAcknowledgedSequence` / `acknowledgeRemindersThrough`; per `Deps`, those exist before implementation. The `no-open-project` 409 path is the same one `buildSnapshotFromOpenProject` returns (`snapshot-builder.ts:34`) — resolve the repository via the project store manager and reuse it. SPEC-012 §Deliverables 2 governs.
3. **Shared boundary under audit:** the localhost JSON API contract. Response shape is fixed by the spec: `GET` → `{ ok:true, reminder: { active, latestSegment: { sequence, createdAt } | null, acknowledgedThroughSequence } }`; `POST .../acknowledge` → the recomputed reminder state. The acknowledge body is `z.strictObject({})` so no key/prose-shaped field can be smuggled in (matches the zod-validated body convention used by sibling routes).
4. **FOUNDATIONS principle restated:** §10 / §29.4 — no accepted prose in any generation-bound surface; the reminder responses carry only `sequence` + `createdAt`, never segment `text`. §20 / §29.2 — acknowledge advances an integer threshold only; it mutates no record. §22 / §29.9 — existing `redact` config in `server.ts` suffices because the endpoints emit no prompt/key/prose.
5. **Determinism / firewall:** these endpoints run no validation and no compilation; `active = latest !== null && latest.sequence > acknowledged` is pure integer arithmetic over already-stored values. They add no read of `reminder_state` to the snapshot/compile path.

## Architecture Check

1. A dedicated `reminder-routes.ts` keeps the reminder contract isolated and independently testable, parallel to `accepted-routes.ts`, rather than overloading the accepted-segments routes with a sub-resource. The derive-only `GET` plus advance-only `POST` keep the write surface minimal (one integer threshold).
2. No backwards-compatibility shim: this is a new route module; the Phase-10 ephemeral `acceptNotice` it ultimately supersedes is web-only state and is handled in SPEC012DURCHAREM-006, not aliased here.

## Verification Layers

1. Per-acceptance activation -> `fastify.inject` tests: no segments → `active:false`, `latestSegment:null`; after one accept → `active:true`; after acknowledge → `active:false` with `acknowledgedThroughSequence` == latest; a second accept → `active:true` again.
2. No record/archive write on either endpoint -> test asserts no `records`/`accepted_segments`/`story_config`/brief row changes; only `reminder_state` changes on acknowledge.
3. No prose / no secret in responses or logs -> test asserts responses contain no segment `text`/key/prompt + a logger-capture test asserts no accepted prose/key in stdout/stderr for the reminder paths (FOUNDATIONS §29.9 alignment check).
4. `no-open-project` reuse -> test asserts a structured 409 with the shared error body when no project is open.

## What to Change

### 1. New `reminder-routes.ts`

`registerReminderRoutes(app: FastifyInstance, manager: ProjectStoreManager): void`:

- `GET /api/durable-change-reminder` — resolve the repository (409 `no-open-project` if absent); compute `latest = getLatestAcceptedSegment()`, `acknowledged = getReminderAcknowledgedSequence()`; return `{ ok:true, reminder: { active: latest !== null && latest.sequence > acknowledged, latestSegment: latest, acknowledgedThroughSequence: acknowledged } }`. Writes nothing; runs no validation/compilation.
- `POST /api/durable-change-reminder/acknowledge` — body `z.strictObject({})`; resolve the repository; read `latest`; if present, call `acknowledgeRemindersThrough(latest.sequence)` (no-op-safe when none); return the recomputed reminder state (now `active:false`).

### 2. Register in `createServer()`

Import and call `registerReminderRoutes(app, projectStoreManager)` in `packages/server/src/server.ts` alongside the existing `register*Routes` block (`server.ts:71-80`).

## Files to Touch

- `packages/server/src/reminder-routes.ts` (new)
- `packages/server/src/server.ts` (modify)
- `packages/server/src/reminder-routes.test.ts` (new)

## Out of Scope

- The `reminder_state` table and repository methods — SPEC012DURCHAREM-001 (`Deps`).
- Web API clients, banner, quick-links — SPEC012DURCHAREM-003/004/005.
- Editing accepted-segment storage, the accept write, or the browser — SPEC-010/011 (COMPLETED).
- Any new redaction config — the existing `server.ts` `redact` paths suffice.

## Acceptance Criteria

### Tests That Must Pass

1. `GET` with no segments → `active:false`, `latestSegment:null`; after one accept → `active:true`.
2. `POST .../acknowledge` → `active:false` and `acknowledgedThroughSequence` equals the latest sequence; a second accept → `GET` returns `active:true` again (per-acceptance re-activation).
3. Neither endpoint writes a record, config, brief, cast dossier, or `accepted_segments` row in any branch; only the single `reminder_state` row changes on acknowledge.
4. The `GET`/acknowledge responses contain no accepted-segment text, key, or prompt; a logger-on test captures no accepted prose/key in stdout/stderr for the reminder paths.
5. No open project → structured 409 (`no-open-project`).
6. `npm run typecheck && npm run lint && npm test && npm run build` all green.

### Invariants

1. The reminder endpoints are derive-only (GET) and advance-only (POST); they never run validation or compilation.
2. No accepted prose, prompt, or key crosses the reminder endpoint boundary into responses or logs.

## Test Plan

### New/Modified Tests

1. `packages/server/src/reminder-routes.test.ts` (new) — `fastify.inject` suite for the two endpoints, modeled on `accepted-routes.test.ts`: activation lifecycle, acknowledge threshold, second-accept re-activation, no-record-write assertion, no-prose/no-secret response + logger-capture assertion, `no-open-project` 409.

### Commands

1. `npm test -- reminder-routes` — targeted run of the new route suite.
2. `npm run typecheck && npm run lint && npm test && npm run build` — full pipeline.

## Outcome

Completed: 2026-06-06

Added `packages/server/src/reminder-routes.ts` with `GET /api/durable-change-reminder` and `POST /api/durable-change-reminder/acknowledge`, registered from `createServer()`. The read endpoint derives active state from the latest accepted sequence and the acknowledged-through threshold; the acknowledge endpoint accepts only an empty object body, advances the threshold to the latest accepted sequence when one exists, and returns the recomputed reminder state.

Added `packages/server/src/reminder-routes.test.ts` covering no-segment inactive state, post-accept activation, acknowledgement, second-accept reactivation, no-op acknowledgement without accepted segments, no-open-project handling, strict unknown-body rejection, no mutation of records/config/brief/accepted segments, and no accepted prose or key-shaped metadata in reminder responses/logs. No deviations from the ticket plan.

Verification:

- `npm test -- reminder-routes` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed.
- `npm run build` — passed, with Vite's existing chunk-size warning.
