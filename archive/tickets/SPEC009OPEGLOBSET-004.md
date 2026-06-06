# SPEC009OPEGLOBSET-004: OpenRouter settings routes (GET/PUT + model refresh)

**Status**: ✅ COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `packages/server/src/settings-routes.ts` (`GET`/`PUT /api/settings/openrouter`, `POST /api/settings/openrouter/models`), registered in `createServer()`.
**Deps**: SPEC009OPEGLOBSET-001, SPEC009OPEGLOBSET-003

## Problem

The settings module and transport exist, but nothing exposes them over the localhost API. Phase 9 needs an HTTP surface for the web settings UI to read the non-secret model settings + credential status, persist edits, and optionally refresh the model list — never exposing the API key.

## Assumption Reassessment (2026-06-06)

1. No `settings-routes.ts` exists yet (collision check: path free). The registration pattern is established in `packages/server/src/server.ts:63–69`: each `register*Routes(app, projectStoreManager)` is called inside `createServer()`, imported at the top. Routes follow the Fastify + Zod convention seen in `record-routes.ts` (`import { z, ZodError } from "zod"`) and `compile-routes.ts`.
2. `docs/requirements-version-1/OPENROUTER-INTEGRATION.md` ("Global settings", "API key handling", "User-facing behavior"): settings UI shows "API key configured/missing", never the value; model list refresh is optional and manual entry must survive its failure. `specs/SPEC-009-…md` Deliverable 1 specifies `GET`/`PUT /api/settings/openrouter` (+ optional `POST …/models`).
3. Cross-artifact boundary under audit: these routes consume `readOpenRouterSettings`/`writeOpenRouterSettings`/`OpenRouterSettings` (SPEC009OPEGLOBSET-001) and `refreshModelList` (SPEC009OPEGLOBSET-003); they produce the JSON contract the web client (SPEC009OPEGLOBSET-006) consumes — `GET`/`PUT` return `{ …non-secret settings, hasOpenRouterCredential }`, never the key. The `register*Routes(app, manager)` signature is the shared boundary with `server.ts`.
4. FOUNDATIONS principle motivating this ticket — §23 / §29.9: API keys must never appear in the settings response; the app must fail safely when no key is configured. Restated: the route returns only the boolean credential signal; a model-refresh failure degrades to a normalized error, not a 500 that blocks settings.
5. Secret-firewall surface (§23): `PUT` accepts only the non-secret patch and relies on SPEC009OPEGLOBSET-001's key-shaped-field rejection; the route never reads `process.env.OPENROUTER_API_KEY` into its response body. No deterministic-compilation surface is touched.
6. `server.ts` is also modified by SPEC009OPEGLOBSET-005 (registers the generate route + extends redact paths). These are parallel siblings on a shared file — both add one import + one `register*Routes(...)` line inside `createServer()`; the edits do not depend on each other but will need a mechanical merge.

## Architecture Check

1. A dedicated `settings-routes.ts` mirrors the existing one-file-per-surface route convention, keeping `createServer()` a flat registration list. Returning the credential boolean (never the key) at the route layer keeps the secret boundary identical to the module layer. Making the models-refresh route tolerate transport failure (normalized error, 200-with-error-body or a documented status) preserves "manual entry always works".
2. No backwards-compatibility shim: the inert placeholder path (`getSettings`) is already removed in SPEC009OPEGLOBSET-001; this is a clean new surface.

## Verification Layers

1. GET returns non-secret settings + boolean → `fastify.inject` test asserts the body shape and the absence of any key field.
2. PUT round-trips a non-secret patch → inject test: PUT then GET reflects the change; a key-shaped PUT field is rejected (422/400) and persists nothing.
3. Key never in any response → secret-firewall audit: GET/PUT/refresh response bodies match no `/openRouterApiKey|OPENROUTER_API_KEY|apiKey|sk-/`.
4. Model-refresh resilience → inject test with a mocked failing `refreshModelList`: response is a normalized error and the settings GET still works (manual entry unaffected).
5. Registration → grep-proof: `registerSettingsRoutes` appears in `server.ts`'s `createServer()` body.

## What to Change

### 1. `settings-routes.ts`

`registerSettingsRoutes(app: FastifyInstance, manager: ProjectStoreManager): void` (match the existing signature even if `manager` is unused here, for registration symmetry — or omit if lint forbids unused params; follow the prevailing convention). Routes:

- `GET /api/settings/openrouter` → `readOpenRouterSettings()` result (non-secret settings + `hasOpenRouterCredential`).
- `PUT /api/settings/openrouter` → Zod-validate the non-secret patch, `writeOpenRouterSettings(patch)`, return the updated settings; reject key-shaped fields (via the module) with a structured error.
- `POST /api/settings/openrouter/models` (optional refresh) → `refreshModelList(...)`; on success cache via `writeOpenRouterSettings({ cachedModels })` and return the list; on failure return the normalized error so manual entry is unaffected.

### 2. Register in `createServer()`

Add the import and a `registerSettingsRoutes(app, projectStoreManager)` line alongside the existing `register*Routes` calls in `packages/server/src/server.ts`.

## Files to Touch

- `packages/server/src/settings-routes.ts` (new)
- `packages/server/src/settings-routes.test.ts` (new)
- `packages/server/src/server.ts` (modify — add import + registration)

## Out of Scope

- The settings module internals and config-file resolver — SPEC009OPEGLOBSET-001.
- Transport modules — SPEC009OPEGLOBSET-002, -003.
- `POST /api/generate` + redact-path extension — SPEC009OPEGLOBSET-005.
- The web settings UI — SPEC009OPEGLOBSET-007.

## Acceptance Criteria

### Tests That Must Pass

1. `GET /api/settings/openrouter` returns the non-secret settings + `hasOpenRouterCredential`, with no key field present.
2. `PUT` persists a non-secret patch (GET reflects it); a key-shaped field is rejected and nothing is written.
3. No GET/PUT/models-refresh response body contains a key or bearer token.
4. With `refreshModelList` mocked to fail, `POST …/models` returns a normalized error and `GET` still succeeds.
5. `registerSettingsRoutes` is wired in `createServer()`.
6. `npm test --workspace @loom/server -- src/settings-routes.test.ts`, `npm run typecheck`, `npm run lint`, `npm test` all green.

### Invariants

1. No settings endpoint ever returns or logs the API key — only the derived boolean.
2. Model-list refresh failure never makes settings read/write fail.

## Test Plan

### New/Modified Tests

1. `packages/server/src/settings-routes.test.ts` — `fastify.inject` (`createServer()`): GET shape + key-absence, PUT round-trip, key-shaped-field rejection, refresh-failure resilience, response-body secrecy.

### Commands

1. `npm test --workspace @loom/server -- src/settings-routes.test.ts`
2. `npm run typecheck && npm run lint && npm test`
3. `grep -n "registerSettingsRoutes" packages/server/src/server.ts` — registration proof.

## Outcome

Completed: 2026-06-06

Added `packages/server/src/settings-routes.ts` with `GET /api/settings/openrouter`,
`PUT /api/settings/openrouter`, and `POST /api/settings/openrouter/models`. The routes
return only non-secret settings plus `hasOpenRouterCredential`, persist validated
non-secret patches, reject key-shaped/unknown payload fields, cache successful model-list
refreshes, and return normalized refresh failures without blocking settings reads/writes.

Registered `registerSettingsRoutes(app)` in `createServer()`.

Added `packages/server/src/settings-routes.test.ts` coverage for GET shape and key
absence, PUT round-trip, key-shaped-field rejection with no persistence, successful model
refresh caching, normalized refresh failure resilience, and response-body secrecy.

Deviations: `registerSettingsRoutes` takes only the `FastifyInstance`; it does not accept
an unused project manager parameter because these global settings routes do not touch
project state.

Verification:

- `npm test --workspace @loom/server -- src/settings-routes.test.ts` — passed.
- `rg -n "registerSettingsRoutes" packages/server/src/server.ts` — import and registration present.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — 54 files / 303 tests passed.
- `npm run build` — passed.
