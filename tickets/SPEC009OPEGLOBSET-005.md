# SPEC009OPEGLOBSET-005: Generate endpoint + log redaction extension

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `packages/server/src/generate-routes.ts` (`POST /api/generate`), extended `redact.paths` in `createServer()`, both registered/edited in `packages/server/src/server.ts`.
**Deps**: SPEC009OPEGLOBSET-001, SPEC009OPEGLOBSET-003

## Problem

The compiled prompt is inspectable but cannot be sent. Phase 9 needs a fail-closed `POST /api/generate` that rebuilds the snapshot, re-runs validation (blocked → no candidate, no network), compiles, and sends through the transport — writing no project data on any branch. Because that endpoint is the first to carry prompt, candidate, and key-adjacent traffic, the logger's redaction set must be extended in the same change, with a logging test proving none of it leaks. D3 (send endpoint) and D4 (log redaction) are merged here: they share `server.ts` and the redaction test exercises the generate route.

## Assumption Reassessment (2026-06-06)

1. `compile-routes.ts` is the exact fail-closed template to mirror: `buildSnapshotFromOpenProject(manager)` → on `!ok` `reply.code(snapshotResult.status).send(snapshotResult.body)` → `runValidation(snapshot)` → `if (validation.isBlocked) return { ok: false, kind: "validation-blocked", validation }` → else `compilePrompt(snapshot)` (verified `packages/server/src/compile-routes.ts`). `buildSnapshotFromOpenProject`, `no-open-project`, `malformed-validation-source` are in `snapshot-builder.ts:24,28,31`; `compilePrompt`/`runValidation` are `@loom/core` exports; `CompileResult` is `{ prompt, metadata }` (`packages/core/src/compiler/types.ts:10`).
2. `docs/requirements-version-1/OPENROUTER-INTEGRATION.md` ("Request lifecycle", "Validation implications", "Logging prohibitions") and `IMPLEMENTATION-ORDER.md` Phase 9 gate: send blocked while validation blockers exist; missing key blocks send but does not invalidate records; no project data mutates on failure; prompts/keys not logged. `specs/SPEC-009-…md` Deliverable 3 + 4 specify `missing-key` returned **without** a network call, success `{ ok: true; candidate: { text }, metadata: { model, versions } }`, and extending `redact.paths` to cover `messages`/`candidate`/`candidateText`/`choices`/`body`.
3. Cross-artifact boundary under audit: the route consumes `readOpenRouterSettings` (SPEC009OPEGLOBSET-001), `sendChatCompletion` (SPEC009OPEGLOBSET-003), and core's `compilePrompt`/`runValidation`; it reuses `snapshot-builder.ts`'s `no-open-project`/`malformed-validation-source` bodies unchanged. Its response union (success / `validation-blocked` / normalized failure) is the contract the web `generate()` (SPEC009OPEGLOBSET-006) consumes.
4. FOUNDATIONS principles motivating this ticket — §4.5 / §11 / §29.5 (fail closed, no v1 override) and §23 / §29.9 (no key/prompt/candidate in logs; fail safely with no key). Restated: `/api/generate` re-runs `runValidation()` server-side and refuses to send while blocked — the same gate as `/api/compile`, not a client-trust check; logs carry only timestamp/model/status-category/latency/error-category.
5. Secret-firewall + fail-closed surfaces (§15 / §11): the redaction extension must keep the full prompt, full candidate, raw request/response body, and key out of logs. `server.ts:33–42` already redacts `req.headers.authorization`, `apiKey`, `api_key`, `prompt`, `candidateProse`, `acceptedProse`, `recordPayload`; this adds `messages`, `candidate`, `candidateText`, `choices`, `body`. The fail-closed gate is server-side and has no override (§4.5). No LLM enters compilation — the model is called strictly after `compilePrompt()` and is never fed back (§4.4 / §29.4).
6. `captureProcessWrites` is a **per-test-file local helper**, not a shared export (defined independently in `compile-routes.test.ts:61`, `validation-routes.test.ts`, `generation-brief-routes.test.ts`, `phase4-gate.e2e.test.ts`); `generate-routes.test.ts` will define its own copy. `createServer({ logger: true })` (`ServerOptions.logger`, `server.ts:17–18`) turns logging on for the redaction test.
7. `server.ts` is also edited by SPEC009OPEGLOBSET-004 (registers settings routes). Parallel siblings on a shared file: this ticket adds the generate import + registration **and** the redact-path entries; -004 adds only its registration line. Mechanical merge expected.

## Architecture Check

1. Recompiling from the current snapshot (not trusting a previewed string) means a state change between preview and Generate is caught by re-validation + recompile — the user can never send a prompt that no longer validates (spec Risk: stale prompt). Mirroring `compile-routes.ts` keeps one fail-closed shape across both endpoints. Merging the redaction extension with the endpoint that produces the sensitive traffic lets one logging test prove the whole surface at once.
2. No backwards-compatibility shim: net-new route; the redact list is extended in place, not branched.

## Verification Layers

1. Fail-closed send → `fastify.inject` test: a blocked project state returns `{ ok: false, kind: "validation-blocked", validation }`, no candidate, and the transport mock's `fetch`/`sendChatCompletion` is **never called**.
2. Missing key → inject test: with `OPENROUTER_API_KEY` unset and a blocker-free state, response is `missing-key` and no network call occurs.
3. No durable writes → inject test: across success and every error branch, the project store is untouched (assert via store inspection / no record mutation) — Phase 10/11 own persistence.
4. Log redaction → secret-firewall audit: `createServer({ logger: true })` + a per-file `captureProcessWrites`, send with a seeded key/prompt/candidate string, assert captured stdout/stderr contain none of them.
5. Registration → grep-proof: `registerGenerateRoutes` in `createServer()`, and the new redact paths present in `server.ts`.

## What to Change

### 1. `generate-routes.ts`

`registerGenerateRoutes(app, manager)`: `POST /api/generate` → `buildSnapshotFromOpenProject(manager)` (reuse `status`/`body` on `!ok`) → `runValidation(snapshot)`; if `isBlocked` return `{ ok: false, kind: "validation-blocked", validation }` (no candidate, no network) → `compilePrompt(snapshot)` → `readOpenRouterSettings()` + env key; if key absent return `missing-key` (no network) → `sendChatCompletion({ prompt, settings, … })` → return `{ ok: true, candidate: { text }, metadata: { model, versions } }` on success or the normalized structured error otherwise. Write **no** project records or accepted segments in any branch. `versions` reuses the existing version triple (`versionInfo`) for traceability.

### 2. Extend `redact.paths` and register

In `createServer()` add `messages`, `candidate`, `candidateText`, `choices`, `body` to `redact.paths`, and add the import + `registerGenerateRoutes(app, projectStoreManager)` to the registration list.

## Files to Touch

- `packages/server/src/generate-routes.ts` (new)
- `packages/server/src/generate-routes.test.ts` (new)
- `packages/server/src/server.ts` (modify — register route + extend `redact.paths`)

## Out of Scope

- Candidate editing / regenerate / discard / accept and any accepted-segment write — Phase 10/11.
- Transport internals and settings module — SPEC009OPEGLOBSET-001, -002, -003.
- The web Generate UI — SPEC009OPEGLOBSET-008.
- Automatic retry / multi-candidate — OPENROUTER-INTEGRATION non-goal.

## Acceptance Criteria

### Tests That Must Pass

1. Blocked state → `validation-blocked`, no candidate, no network call.
2. `no-open-project` / `malformed-validation-source` → the reused structured errors.
3. Missing key → `missing-key`, no `fetch`, no project mutation.
4. Success (mocked transport) → `{ ok: true, candidate: { text }, metadata }`.
5. Transport error → normalized error; no record or accepted segment written in any branch.
6. Logger-on test: a seeded key, full prompt, and candidate string appear in no captured stdout/stderr.
7. `npm test --workspace @loom/server -- src/generate-routes.test.ts`, `npm run typecheck`, `npm run lint`, `npm test` all green.

### Invariants

1. Send is impossible while validation blockers exist (server-side gate, no v1 override).
2. `/api/generate` writes no durable project data on success or failure.
3. No full prompt, full candidate, raw request/response body, or key reaches logs.

## Test Plan

### New/Modified Tests

1. `packages/server/src/generate-routes.test.ts` — `fastify.inject` + mocked transport: blocked/no-open-project/missing-key/success/transport-error branches, no-durable-write assertion, and a `captureProcessWrites` logger-on redaction test (local helper, mirroring `compile-routes.test.ts`).

### Commands

1. `npm test --workspace @loom/server -- src/generate-routes.test.ts`
2. `npm run typecheck && npm run lint && npm test`
3. `grep -nE "registerGenerateRoutes|\"messages\"|\"candidate\"|\"choices\"" packages/server/src/server.ts` — registration + redact-path proof.
