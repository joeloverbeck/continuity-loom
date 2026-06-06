# SPEC009OPEGLOBSET-003: OpenRouter transport I/O (client + model refresh)

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `packages/server/src/openrouter/client.ts` (the `fetch`-based send) and `packages/server/src/openrouter/models.ts` (optional model-list refresh), with mocked-`fetch` tests.
**Deps**: SPEC009OPEGLOBSET-001, SPEC009OPEGLOBSET-002

## Problem

With the pure builders in place, Phase 9 needs the one module that actually performs network I/O: a non-streaming send to the OpenRouter chat-completions endpoint that reads the API key from the environment at call time, parses the candidate text from the first choice, and routes every failure through the normalizer — plus an optional, non-fatal model-list refresh. This is the only transport module that touches the network or the env key; isolating it keeps the secret boundary and the I/O surface small.

## Assumption Reassessment (2026-06-06)

1. `packages/server/src/openrouter/` will already hold `request.ts`/`errors.ts` from SPEC009OPEGLOBSET-002; this ticket adds `client.ts`/`models.ts` in the same directory. Global `fetch` is available (Node ≥ 24, `.nvmrc`). `@loom/server` permits `fetch` and `node:*` (the purity boundary, `packages/core/test/boundary.test.ts`, applies only to `@loom/core`).
2. `docs/requirements-version-1/OPENROUTER-INTEGRATION.md` ("Non-streaming send", "Model list", "API key handling"): bearer key from `OPENROUTER_API_KEY`; one user message; response must have ≥1 choice and a message content string; the returned content becomes the **session candidate, not an accepted segment**; the models API returns id/name/context-length/pricing/supported-params and **cache failure must not prevent manual model entry**. `specs/SPEC-009-…md` Deliverable 2 restates these and pins env-key reading to call time with a pre-network `missing-key` failure.
3. Cross-artifact boundary under audit: `sendChatCompletion` calls `buildChatCompletionRequest` and `normalizeOpenRouterError` (SPEC009OPEGLOBSET-002), consumes the `OpenRouterSettings` type (SPEC009OPEGLOBSET-001), and returns a `TransportResult` union (`{ ok: true; candidate: { text } } | { ok: false } & NormalizedTransportError`) consumed by SPEC009OPEGLOBSET-005 (`generate-routes.ts`). The endpoint URL + optional non-secret app/site headers are read from config, not hardcoded.
4. FOUNDATIONS principle motivating this ticket — §23: "fail safely and clearly when no API key is configured" and key never logged/persisted/returned. Restated: `missing-key` is returned **before any network call**; the key is read into a local, never persisted, never returned, never logged.
5. Secret-firewall surface (§23 / §29.9 / §15): the key flows env → local `const` → `Authorization` header only; it never reaches the returned object, the config file, or a log line. The `Authorization` header is sensitive and is already redacted at the logger (`req.headers.authorization`, `server.ts:34`); this module adds the actual header value and must keep it out of every error `message` (guaranteed by SPEC009OPEGLOBSET-002's normalizer). No compilation surface touched — `client.ts` runs after `compilePrompt()`.

## Architecture Check

1. Confining all network I/O and env-key reading to `client.ts`/`models.ts` (with the pure builders separate) means the secret boundary and the only mockable surface are one small module. Reading the key at call time (not at module load) keeps `hasOpenRouterCredential` and send agreement exact and avoids a stale captured key.
2. No backwards-compatibility shim: net-new modules.

## Verification Layers

1. Success path → mocked-`fetch` test: a response with one choice + content yields `{ ok: true, candidate: { text } }`.
2. Pre-network missing-key → test: with `OPENROUTER_API_KEY` unset, `sendChatCompletion` returns `missing-key` and `fetch` is **never called** (assert the mock's call count is 0).
3. Failure routing → mocked-`fetch` tests: 401→invalid-key, 402→insufficient-credits, 429→rate-limit, 408/abort→timeout, network throw→network, missing choices/content→malformed-response.
4. Key never leaks → secret-firewall audit: across success and every error branch, the returned value and any error `message` match no `/sk-|Bearer/`.
5. Model-refresh non-fatal → test: a failed `refreshModelList` returns a normalized error (does not throw), leaving manual entry usable.

## What to Change

### 1. `openrouter/client.ts` (I/O)

`sendChatCompletion({ prompt, settings, apiKey, signal? }): Promise<TransportResult>` — read `apiKey` from `process.env.OPENROUTER_API_KEY` at call time (the param documents the dependency; resolve env inside if omitted). If absent, return `{ ok: false, category: "missing-key", … }` **before** any `fetch`. Otherwise `fetch` the chat-completions endpoint (URL + optional non-secret app/site headers from config) with `Authorization: Bearer <key>`, `signal` wired for optional cancellation, body from `buildChatCompletionRequest`. Parse the first choice's message content → `{ ok: true, candidate: { text } }`. Route every non-2xx, network/abort/timeout, and malformed-body case through `normalizeOpenRouterError`.

### 2. `openrouter/models.ts` (I/O, optional)

`refreshModelList({ apiKey }): Promise<ModelListResult>` — call the OpenRouter models API, return id/name/context-length metadata for caching in the global config file (pricing + supported-params intentionally deferred per spec Deliverable 2). On any failure return a normalized error (never throw) so the UI keeps manual model entry working.

## Files to Touch

- `packages/server/src/openrouter/client.ts` (new)
- `packages/server/src/openrouter/client.test.ts` (new)
- `packages/server/src/openrouter/models.ts` (new)
- `packages/server/src/openrouter/models.test.ts` (new)

## Out of Scope

- Route wiring (`/api/generate`, `/api/settings/openrouter/models`) — SPEC009OPEGLOBSET-005, -004.
- Real network calls in tests — `fetch` is mocked per `docs/requirements-version-1/TESTING-STRATEGY.md`.
- Streaming, automatic retry, multi-candidate generation — OPENROUTER-INTEGRATION non-goals.
- Persisting the cached model list — the write goes through SPEC009OPEGLOBSET-001's settings module via the route in SPEC009OPEGLOBSET-004.

## Acceptance Criteria

### Tests That Must Pass

1. Success: a mocked OK response with one choice + content yields `{ ok: true, candidate: { text } }`.
2. Missing key: with the env key unset, `missing-key` is returned and `fetch` is never invoked.
3. Failure routing: each mocked status/cause maps to its normalized category (401/402/429/408/network/malformed).
4. Secrecy: no returned value or error message contains the key or bearer token in any branch.
5. `refreshModelList` failure returns a normalized error without throwing.
6. `npm test --workspace @loom/server -- src/openrouter/client.test.ts src/openrouter/models.test.ts`, `npm run typecheck`, `npm run lint` all green.

### Invariants

1. The API key is read at call time, used only for the `Authorization` header, and never returned, persisted, or logged.
2. `missing-key` short-circuits before any network access.
3. Model-list refresh failure is non-fatal and never blocks manual model entry.

## Test Plan

### New/Modified Tests

1. `packages/server/src/openrouter/client.test.ts` — mocked `fetch`: success, pre-network missing-key (call-count 0), status/cause routing, key-secrecy, optional `AbortSignal` wiring.
2. `packages/server/src/openrouter/models.test.ts` — mocked `fetch`: success metadata mapping, non-fatal failure.

### Commands

1. `npm test --workspace @loom/server -- src/openrouter/client.test.ts src/openrouter/models.test.ts`
2. `npm run typecheck && npm run lint && npm test`
3. `grep -nE "sk-|Bearer" packages/server/src/openrouter/*.test.ts` — only seeded-input assertions, never an expected output match (manual review of the proof).
