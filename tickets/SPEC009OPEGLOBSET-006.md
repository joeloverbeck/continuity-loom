# SPEC009OPEGLOBSET-006: Web API clients for settings + generate

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — extends `packages/web/src/api.ts` with `getOpenRouterSettings`, `putOpenRouterSettings`, `refreshModels`, and `generate()` (+ their types); extends `packages/web/src/api.test.tsx`.
**Deps**: SPEC009OPEGLOBSET-004, SPEC009OPEGLOBSET-005

## Problem

The web UI needs typed clients for the new server surfaces before any settings editor or Generate button can be built. This ticket adds the four client functions and the discriminated-union response types that the settings surface (SPEC009OPEGLOBSET-007) and the candidate panel (SPEC009OPEGLOBSET-008) consume — keyed off the exact server contracts from -004 and -005.

## Assumption Reassessment (2026-06-06)

1. `packages/web/src/api.ts` already exports the helper pattern these clients reuse: `requestJson<T>(url, method, body?)` and `postJson<T>(url, body?)` (`api.ts:121–143`). The SPEC-008 Content-Type fix is present and load-bearing — `requestJson` sets `Content-Type: application/json` **only when `body !== undefined`** (`api.ts:129–135`); GET clients must pass no body so no Content-Type is sent. Existing typed clients (e.g. `compile()` → `CompileResponse`, `api.ts:254`) and the shared `ApiFailure` (`api.ts:40`) / `CompileBlocked` (`kind: "validation-blocked"`, `api.ts:50`) types are the model to follow.
2. `docs/requirements-version-1/OPENROUTER-INTEGRATION.md` ("User-facing behavior") and `specs/SPEC-009-…md` Deliverable 5 specify `generate()` as a discriminated union: success `{ ok: true; candidate: { text }; metadata }`; blocked `{ ok: false; kind: "validation-blocked"; validation: ValidationResult }`; failure the shared `ApiFailure` carrying the normalized transport `kind`/`category` + `message` (and `no-open-project` / `malformed-validation-source`).
3. Cross-artifact boundary under audit: these clients are typed against the server JSON contracts from SPEC009OPEGLOBSET-004 (`GET`/`PUT /api/settings/openrouter`, `POST …/models`) and SPEC009OPEGLOBSET-005 (`POST /api/generate`). `ValidationResult`/`CompileResult` are imported as types from `@loom/core` exactly as the web already does (no core change). The `GenerateResponse` union and `OpenRouterSettingsResponse` type are the contract SPEC009OPEGLOBSET-007/-008 consume.
4. FOUNDATIONS principle motivating this ticket — §23: no UI surface may carry a key. Restated: the settings clients send/receive only the non-secret shape + the `hasOpenRouterCredential` boolean; no client field can hold a key or secret-storage value.
5. Secret-firewall surface (§23): `putOpenRouterSettings(patch)` sends only non-secret model fields; there is no client path that transmits or receives a key. No deterministic-compilation surface is touched — these are network clients.

## Architecture Check

1. Reusing `requestJson`/`postJson` (with the body-gated Content-Type) keeps the new clients consistent with every existing endpoint and avoids re-deriving fetch/headers logic. Modeling `generate()` as a discriminated union lets the consuming components exhaustively switch on `ok`/`kind` with compile-time safety, mirroring how `PromptPreviewView` already switches on `CompileResponse`.
2. No backwards-compatibility shim: net-new exported functions and types; no existing client signature changes.

## Verification Layers

1. Client wiring → `api.test.tsx` with mocked `fetch`: each function hits the right URL/method and parses the right shape.
2. `generate()` union branches → tests: success (`ok: true` candidate), blocked (`validation-blocked`), failure (`ApiFailure` incl. `missing-key`).
3. Body-gated Content-Type preserved → test: `getOpenRouterSettings()` (GET, no body) issues no `Content-Type` header; `putOpenRouterSettings(patch)` does.
4. No key in client types → manual review / type check: no field in the settings request/response types can carry a key.

## What to Change

### 1. Settings clients

- `getOpenRouterSettings(): Promise<OpenRouterSettingsResponse>` over `GET /api/settings/openrouter` (no body).
- `putOpenRouterSettings(patch): Promise<OpenRouterSettingsResponse>` over `PUT /api/settings/openrouter`.
- `refreshModels(): Promise<RefreshModelsResponse>` over `POST /api/settings/openrouter/models` (failure surfaces as a normalized non-blocking error, not a throw the UI can't render).

`OpenRouterSettingsResponse` = `{ ok: true; settings: { model; temperature; maxOutputTokens; topP?; cachedModels? }; hasOpenRouterCredential: boolean } | ApiFailure` (key never present).

### 2. `generate()` client

`generate(): Promise<GenerateResponse>` over `POST /api/generate`, where `GenerateResponse = { ok: true; candidate: { text }; metadata } | { ok: false; kind: "validation-blocked"; validation: ValidationResult } | ApiFailure`. Import `ValidationResult` as a type from `@loom/core` (consistent with existing usage).

## Files to Touch

- `packages/web/src/api.ts` (modify — add clients + types)
- `packages/web/src/api.test.tsx` (modify — add client branch tests)

## Out of Scope

- The settings editor component — SPEC009OPEGLOBSET-007.
- The Generate button + candidate panel — SPEC009OPEGLOBSET-008.
- Any `@loom/core` change — `ValidationResult`/`CompileResult` are imported as-is.

## Acceptance Criteria

### Tests That Must Pass

1. `getOpenRouterSettings` / `putOpenRouterSettings` / `refreshModels` hit the correct URL+method and parse the non-secret response (no key field).
2. `generate()` resolves each union branch: success candidate, `validation-blocked`, and `ApiFailure` (including `missing-key`).
3. GET clients send no `Content-Type`; PUT/POST-with-body clients do (SPEC-008 fix preserved).
4. `npm test --workspace @loom/web -- src/api.test.tsx`, `npm run typecheck`, `npm run lint`, `npm test` all green.

### Invariants

1. No settings client type can carry an API key — only the non-secret shape + the boolean.
2. `generate()` is a closed discriminated union the consumer can switch on exhaustively.

## Test Plan

### New/Modified Tests

1. `packages/web/src/api.test.tsx` — mocked `fetch`: URL/method/shape per client; `generate()` success/blocked/failure branches; Content-Type body-gating for the new GET vs PUT/POST clients.

### Commands

1. `npm test --workspace @loom/web -- src/api.test.tsx`
2. `npm run typecheck && npm run lint && npm test`
3. `grep -nE "OPENROUTER_API_KEY|apiKey|openRouterApiKey" packages/web/src/api.ts` — must return nothing (no key in client types).
