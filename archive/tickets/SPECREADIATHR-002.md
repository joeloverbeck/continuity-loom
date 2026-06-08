# SPECREADIATHR-002: `/api/readiness` route and web client

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `packages/server/src/readiness-routes.ts` (`POST /api/readiness`), registration in `packages/server/src/server.ts`, new `readiness()` client in `packages/web/src/api.ts`. No change to `/api/validate`, `/api/compile`, or `/api/generate`.
**Deps**: SPECREADIATHR-001

## Problem

The three pages need one server-supplied readiness model carrying grouped diagnostics, resolved display labels, and provider-state distinctions — without exposing prompt text, candidate text, accepted prose, full record payloads, or the API key. The spec's preferred route is `/api/readiness`. This ticket exposes the core `deriveReadiness` (SPECREADIATHR-001) over the server's validation snapshot and provider settings, and adds the typed web client the pages consume.

## Assumption Reassessment (2026-06-07)

1. `buildSnapshotFromOpenProject(manager)` (`packages/server/src/snapshot-builder.ts:32`) returns `{ ok: true; snapshot }` or `{ ok: false; status; body }`, and the assembled snapshot records carry `metadata.displayLabel` (`snapshot-builder.ts:153`). `runValidation` is imported from `@loom/core` (as in `packages/server/src/validation-routes.ts:1`). The readiness route reuses this exact snapshot path — no second snapshot construction.
2. The spec (`specs/SPEC-readiness-diagnostics-and-three-page-ux.md`, §Shared route/model recommendation) requires the route exclude prompt text, candidate text, accepted prose, full record payloads, and secrets, exposing provider state only as a boolean. `deriveReadiness`'s injected `labels` map is sourced here from `snapshot.records[].metadata.displayLabel`.
3. Cross-artifact boundary under audit: the server adapter is the only place display labels and provider state are assembled; `deriveReadiness` (001) stays pure and label-injected. `provider.configured` reuses the same OpenRouter credential source the existing settings surface exposes as `hasOpenRouterCredential` (`registerSettingsRoutes`, `packages/server/src/settings-routes.ts:25`) — not a reinvented check.
4. FOUNDATIONS restated before trusting the spec: §23 — API keys must never appear in responses or logs; §15 — no payload may leak state the records forbid. The readiness payload carries only severity-classified diagnostics, raw paths/IDs (for the technical expander), display labels, and a `configured` boolean.
5. Secret-firewall / fail-closed enforcement surface: this route is the firewall point. It must serialize only the `GenerationReadiness` object — never record payloads, prompt/candidate/accepted-prose text, or the key — and must preserve the existing fail-closed passthrough (no-open-project → 409, malformed validation source → 422) exactly as `validation-routes.ts` does.
6. Output-schema extension: the HTTP API surface and the `api.ts` response union are extended additively — a new endpoint and a new client method; `validate()`/`compile()`/`generate()` are untouched. `hasUnsavedChanges` is a client-only concept (browser form-dirty state the server cannot observe), so the route computes readiness over saved state with `hasUnsavedChanges: false`; the stale-readiness overlay is the pages' responsibility (SPECREADIATHR-004).

## Architecture Check

1. A dedicated route mirroring `registerValidationRoutes` keeps the snapshot/validation path single-sourced and makes the secret-firewall boundary one auditable file. Pushing label resolution to the server (which owns the read model) while keeping `deriveReadiness` pure is cleaner than giving core a repository dependency.
2. No backwards-compatibility shims: `/api/readiness` is net-new and additive; no aliasing of `/api/validate`.

## Verification Layers

1. Response excludes secrets / record payloads / prompt text -> `readiness-routes.test.ts` asserting the serialized body contains no API key, no record payload object, and no prompt/candidate text (manual secret-firewall review + automated test).
2. Provider gating: missing credential → `provider.configured === false` and `canGenerate === false`; present → `true` -> route test toggling the settings source.
3. Display-label resolution from `metadata.displayLabel` -> route test with a labeled record asserting the affected target's `displayLabel`.
4. Fail-closed passthrough (no open project → 409; malformed → 422) -> route test mirroring `validation-routes` behavior.

## What to Change

### 1. New `packages/server/src/readiness-routes.ts`

`registerReadinessRoutes(app, manager)` exposing `POST /api/readiness`: call `buildSnapshotFromOpenProject(manager)`; on `!ok` reply with `snapshotResult.status` / `snapshotResult.body` (identical to `validation-routes.ts`). On success: `runValidation(snapshot)`, build `labels = new Map(snapshot.records.map(r => [r.id, r.metadata.displayLabel]))` (skip absent labels), read the OpenRouter credential flag from the existing settings source as `configured`, then `deriveReadiness(result, { configured }, { hasUnsavedChanges: false }, labels)` and send the `GenerationReadiness`.

### 2. Register in `packages/server/src/server.ts`

Import `registerReadinessRoutes` and call `registerReadinessRoutes(app, projectStoreManager)` alongside the existing `registerValidationRoutes(app, projectStoreManager)` (~line 77).

### 3. Web client `packages/web/src/api.ts`

Add `export async function readiness(): Promise<GenerationReadiness | ApiFailure>` calling `postJson<GenerationReadiness | ApiFailure>("/api/readiness")`, re-using the `GenerationReadiness` type from `@loom/core` (exported in SPECREADIATHR-001).

## Files to Touch

- `packages/server/src/readiness-routes.ts` (new)
- `packages/server/src/server.ts` (modify)
- `packages/server/src/readiness-routes.test.ts` (new)
- `packages/web/src/api.ts` (modify)

## Out of Scope

- UI rendering of the readiness model (SPECREADIATHR-003–006).
- `deriveReadiness` logic and the copy table (SPECREADIATHR-001).
- The client-side unsaved-draft stale-readiness notice (SPECREADIATHR-004).
- Doc amendments — `cross-spec: SPEC-foundational-doc-amendments-for-generation-readiness` (Phase 7).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- packages/server/src/readiness-routes.test.ts` — provider present/absent gating, labeled-record display-label resolution, secret/payload-absence assertions, and 409/422 fail-closed passthrough.
2. `npm run typecheck` — server route and web client typecheck against the SPECREADIATHR-001 types.
3. `npm run lint`.

### Invariants

1. The `/api/readiness` response never contains the API key, record payloads, or prompt/candidate/accepted-prose text; provider state is a `configured` boolean only.
2. The route reuses `buildSnapshotFromOpenProject` (single snapshot path) and preserves the existing fail-closed status codes (409/422).

## Test Plan

### New/Modified Tests

1. `packages/server/src/readiness-routes.test.ts` — new: builds an open project fixture, asserts readiness shape, provider gating, display-label resolution, secret/payload absence (negative assertions on the serialized body), and fail-closed passthrough.

### Commands

1. `npm test -- packages/server/src/readiness-routes.test.ts`
2. `npm run typecheck && npm run lint`
3. Server-route test is the correct boundary; cross-page end-to-end behavior is exercised by the SPECREADIATHR-007 capstone.

## Outcome

Completed: 2026-06-08

What changed:

- Added `packages/server/src/readiness-routes.ts` with `POST /api/readiness`, reusing `buildSnapshotFromOpenProject`, `runValidation`, `readOpenRouterSettings().hasOpenRouterCredential`, and core `deriveReadiness`.
- Registered the readiness route in `packages/server/src/server.ts`.
- Added the typed `readiness()` web client in `packages/web/src/api.ts`.
- Added `packages/server/src/readiness-routes.test.ts` covering provider present/absent state, no-open-project and malformed snapshot passthrough, display-label enrichment, and negative assertions against API-key/payload leakage.

Deviations from original plan:

- None. Existing `/api/validate`, `/api/compile`, and `/api/generate` behavior was left unchanged.

Verification:

- `npm test -- packages/server/src/readiness-routes.test.ts` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
