# SPEC007DETPROCOM-007: Server shared snapshot builder + validation-gated `POST /api/compile`

**Status**: ✅ COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — extracts a shared server-side snapshot builder from `validation-routes.ts`, adds `packages/server/src/compile-routes.ts` (`POST /api/compile`), and registers it in `server.ts`.
**Deps**: SPEC007DETPROCOM-001, SPEC007DETPROCOM-006

## Problem

The compiled prompt is not yet reachable end-to-end. This ticket adds the localhost
`POST /api/compile` route: it builds the snapshot, runs `runValidation()` **first**, and
returns the compiled `{ prompt, metadata }` only when not blocked — otherwise a structured
blocked response with **no prompt** (fail closed, §4.5/§11). The selected-record
resolution currently inlined in `validation-routes.ts` is extracted into a shared builder
so `/api/validate` and `/api/compile` resolve the same state (no drift between what is
validated and what is compiled), and both share one structured error contract.

## Assumption Reassessment (2026-06-05)

1. `validation-routes.ts` currently inlines snapshot construction: `resolveSelectedRecords`,
   `loadStoryConfig`, session loading, and the `versions` mapping
   (`packages/server/src/validation-routes.ts:28-154`). Its `/api/validate` handler returns
   `runValidation(snapshot)` directly (200 ValidationResult), with `no-open-project` (409),
   a session-load error (422), and `malformed-validation-source` (422) as the non-happy
   paths. `compilePrompt` and `CompileResult` exist after 006; the version triple (incl.
   `contract`) exists after 001.
2. The route contract is fixed by the spec under decomposition (Deliverable 3 + §Approach
   "compile endpoint"): build snapshot → `runValidation` first → blocked response (with
   `ValidationResult`, no prompt) when `isBlocked`, else `{ prompt, metadata }`; surface
   `no-open-project` / session-load / `malformed-validation-source` with the same `kind`
   codes and status as `/api/validate`; never mutate; persist no prompt; log no
   prompt/brief/directive/voice/key text; bind `127.0.0.1` only.
3. **Cross-artifact boundary under audit (information-path refactor)**: the snapshot
   resolution is currently transported through one path (inside `validation-routes.ts`).
   The canonical end-state path becomes the new shared builder (`snapshot-builder.ts`),
   consumed by both routes. The refactor must preserve `/api/validate`'s exact response
   shape (raw `ValidationResult` on success; identical error `kind`/status), and the
   builder returns a discriminated result (`{ ok: true, snapshot } | { ok: false, status,
   body }`) so each route maps errors identically. The proof surface (the existing
   `/api/validate` tests + a new builder-parity assertion) must stay strong enough to
   debug the canonical path after extraction.
4. **FOUNDATIONS principle restated**: §4.5/§11/§29.5 — fail closed: compile only after
   blocker-free validation; no v1 override; the blocked response carries no prompt (no
   partial prompt, §29.4). §22/§9 (§29.9) — no permanent prompt archive by default; no
   prompt/key logging; the SPEC-001 `req` serializer emits only method/url/hostname/ip
   (verify it is unchanged). §23 — metadata/logs carry no API keys or secret-storage
   values.
5. **Fail-closed / secret-key surface named**: `/api/compile` is the §11 gate in the HTTP
   layer — `runValidation` precedes `compilePrompt`, and `isBlocked` short-circuits with no
   prompt. Secret/key safety: the handler persists nothing, logs no payloads, and the
   compile `metadata` (from 002/006) carries no keys or validation-only fields. The server
   still binds `127.0.0.1` only (`server.ts`).

## Architecture Check

1. One shared builder consumed by both routes is cleaner than duplicating resolution:
   it makes "validated state == compiled state" structural rather than convention, and
   collapses the two error contracts into one. Returning a discriminated result keeps the
   routes thin and the error mapping uniform.
2. No backwards-compatibility aliasing/shims: the inline resolution is **moved**, not
   duplicated behind a wrapper; `/api/validate` calls the new builder directly.

## Verification Layers

1. Fail-closed (§11) → server integration test: blocked state → structured blocked
   response with `ValidationResult` and **no** prompt; blocker-free → `{ prompt, metadata }`.
2. Shared-resolution parity → server test: `/api/validate` behavior is byte-for-byte
   unchanged after extraction (existing validate tests pass); the builder is the single
   resolution path.
3. Error contract → server test: `no-open-project`, session-load error, and an
   unresolvable selected-record ID (`malformed-validation-source`) return the same
   `kind`/status as `/api/validate`, each with no prompt.
4. No mutation / no archive / no key leak (§22/§23) → server test + manual review: record
   + `generation_session` round-trip unchanged after a compile call; response/logs contain
   no prompt/brief/key text; `127.0.0.1` binding intact.

## What to Change

### 1. Shared snapshot builder (`snapshot-builder.ts`)

Extract `resolveSelectedRecords` + `loadStoryConfig` + session loading + the `versions`
mapping (now including `contract: versionInfo.contract.version`) from `validation-routes.ts`
into a builder returning `{ ok: true, snapshot } | { ok: false, status, body }` for the
`no-open-project` / session-load / `malformed-validation-source` cases.

### 2. `/api/validate` uses the builder (`validation-routes.ts` modify)

Replace the inline resolution with a call to the shared builder; preserve the exact
success and error responses.

### 3. `POST /api/compile` (`compile-routes.ts` new)

`registerCompileRoutes(app, manager)`: build via the shared builder (propagating its
structured errors), run `runValidation` first, return the blocked response (no prompt)
when `isBlocked`, else `compilePrompt(snapshot)` → `{ prompt, metadata }`. No mutation,
no persistence, no payload logging.

### 4. Register the route (`server.ts` modify)

`registerCompileRoutes(app, projectStoreManager)` alongside the existing route
registrations.

## Files to Touch

- `packages/server/src/snapshot-builder.ts` (new)
- `packages/server/src/validation-routes.ts` (modify)
- `packages/server/src/compile-routes.ts` (new)
- `packages/server/src/server.ts` (modify)
- `packages/server/src/compile-routes.test.ts` (new)

## Out of Scope

- The web preview UI / any `@loom/web` change — Phase 8.
- Governing-doc updates, the §4 contract reconciliation, and archiving the spec — 008.
- Any permanent prompt archive or prompt logging — forbidden in v1 (§22).
- New validation rules or changes to the SPEC-006 engine.

## Acceptance Criteria

### Tests That Must Pass

1. Blocker-free temp project → `{ prompt, metadata }` with all 28 sections and the
   version triple; identical state → byte-identical prompt across two calls.
2. Blocked state → structured blocked response with `ValidationResult` and no prompt.
3. `no-open-project` and an unresolvable selected-record ID → the same structured errors
   (`kind`/status) as `/api/validate`, each with no prompt.
4. A compile call leaves records and `generation_session` unchanged; logs contain no
   prompt/brief/directive/key text.
5. Existing `/api/validate` tests pass unchanged; `npm run typecheck && npm test &&
   npm run lint && npm run build` — green.

### Invariants

1. Compilation never runs from a blocked snapshot; no partial prompt is ever emitted
   (§11/§29.5).
2. The route mutates nothing, persists no prompt, and leaks no key (§22/§23); server
   binds `127.0.0.1` only.

## Test Plan

### New/Modified Tests

1. `packages/server/src/compile-routes.test.ts` — blocker-free, blocked, no-open-project,
   malformed-source, determinism-across-calls, no-mutation, no-key-logging.
2. `packages/server/src/validation-routes.test.ts` (existing, if present) / the server
   test suite — parity after builder extraction.

### Commands

1. `npm test --workspace @loom/server` — targeted server route tests.
2. `npm run typecheck && npm test && npm run lint && npm run build` — full-pipeline gate.

## Outcome

Completed: 2026-06-05

What changed:
- Extracted server snapshot construction into a shared `snapshot-builder.ts` used by
  both `/api/validate` and `/api/compile`.
- Added validation-gated `POST /api/compile`: it builds the snapshot, runs
  validation first, returns no prompt when blocked, and returns `compilePrompt`
  output only for blocker-free state.
- Registered the compile route in the localhost server.
- Added server tests for no-open-project, successful deterministic compile,
  validation-blocked fail-closed response, malformed selected-record errors,
  no mutation, and no prompt-facing log leakage.

Deviations from original plan:
- None.

Verification:
- `npm test --workspace @loom/server` passed: 16 files, 69 tests.
- `npm run typecheck` passed.
- `npm test` passed: 47 files, 247 tests.
- `npm run lint` passed.
- `npm run build` passed, with Vite's large-chunk warning only.
