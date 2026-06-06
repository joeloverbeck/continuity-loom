# SPEC009OPEGLOBSET-002: Pure OpenRouter transport builders (request + errors)

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `packages/server/src/openrouter/request.ts` and `packages/server/src/openrouter/errors.ts` (both pure, no I/O), with unit tests.
**Deps**: SPEC009OPEGLOBSET-001

## Problem

Phase 9's transport needs two pure, deterministic, fast-to-unit-test pieces before any network I/O exists: a request-body builder that maps global settings + the compiled prompt into the OpenRouter chat-completions shape, and an error normalizer that maps every HTTP status / failure cause into the fixed OPENROUTER-INTEGRATION category set. Keeping these import-free of I/O lets them be exhaustively tested without mocking `fetch`, and centralizes the one volatile decision (the max-output-tokens parameter name).

## Assumption Reassessment (2026-06-06)

1. No `packages/server/src/openrouter/` directory exists yet (verified — collision check shows the path free). `zod ^4.1.13` is available in `@loom/server` (`packages/server/package.json:18`) but these two modules need **no** Zod and no I/O — they are pure functions.
2. `docs/requirements-version-1/OPENROUTER-INTEGRATION.md` fixes the request shape ("Non-streaming send": endpoint POST, bearer key, `model`, **one `user` message** containing the compiled prompt, `temperature`/max-tokens/`top_p`, `stream: false`) and the error category set ("Error handling": missing-key, invalid-key, insufficient-credits, invalid-request, provider-unavailable, rate-limit, timeout, moderation-refusal, malformed-response, network, unknown) over HTTP statuses 400/401/402/403/408/429/502/503 with `Retry-After` advisory only. `specs/SPEC-009-…md` Deliverable 2 restates these verbatim.
3. Cross-artifact boundary under audit: `buildChatCompletionRequest` consumes the **`OpenRouterSettings` type** owned by SPEC009OPEGLOBSET-001 (`packages/server/src/settings.ts`); `normalizeOpenRouterError` produces a `NormalizedTransportError` shape `{ category, message }` that SPEC009OPEGLOBSET-003 (`client.ts`) and, transitively, SPEC009OPEGLOBSET-005 (`generate-routes.ts`) and the web `generate()` union consume. The 11-member `category` union is the shared contract.
4. FOUNDATIONS principle motivating this ticket — §23 (transport-only; data-driven not hardcoded) and §25 (mature-fiction envelope): a provider moderation/refusal is a **transport outcome** (`moderation-refusal`), not a validation verdict of the story state. Restated: `errors.ts` classifies provider policy responses as transport categories and never as a records pass/fail.
5. Secret-firewall surface (§23 / §29.9): `normalizeOpenRouterError` must **never** echo the authorization header or raw key into its `message`, even when normalizing a 401/auth body. Verified requirement against OPENROUTER-INTEGRATION "Error handling" ("without dumping raw sensitive payloads"). No deterministic-compilation surface is touched — these run after `compilePrompt()`.

## Architecture Check

1. Splitting the pure builders from the I/O client (SPEC009OPEGLOBSET-003) makes the volatile request mapping and the 11-way error taxonomy exhaustively unit-testable with plain inputs — no `fetch` mock, no env. Centralizing the max-output-tokens parameter name in `request.ts` means the one field OpenRouter may rename (per spec Risk R-3) changes in exactly one place.
2. No backwards-compatibility shim: these are net-new modules with no prior surface to alias.

## Verification Layers

1. Request body shape → unit test: built body has exactly one `user` message containing the compiled prompt, `stream: false`, and `model`/`temperature`/max-tokens/`top_p` mapped from settings.
2. Error taxonomy completeness → unit test: each status (401/402/429/408/502/503/400/403) and each cause (network throw, abort/timeout, malformed body) maps to its documented category; an unmapped input falls to `unknown`.
3. Key never in normalized error → secret-firewall audit: a 401 with an auth body and a synthetic `Authorization: Bearer sk-…` input produces a `message` matching no `/sk-|Bearer|authorization/i`.
4. `Retry-After` advisory only → unit test: a 429 with `Retry-After` yields `category: "rate-limit"` and surfaces the value as metadata without any retry side effect (these are pure functions — no retry is even possible here).

## What to Change

### 1. `openrouter/request.ts` (pure)

`buildChatCompletionRequest({ prompt, settings }: { prompt: string; settings: OpenRouterSettings }): OpenRouterRequest` returns `{ model, messages: [{ role: "user", content: prompt }], temperature, <max-output-tokens param>, top_p?, stream: false }`. Map `maxOutputTokens` to OpenRouter's supported token parameter (confirm `max_tokens` vs newer field against the live parameters doc at implementation time — this is the single centralization point). Omit `top_p` when `settings.topP` is undefined. No I/O, no Zod, no `node:*`.

### 2. `openrouter/errors.ts` (pure)

`normalizeOpenRouterError(status?: number, body?: unknown, cause?: unknown): NormalizedTransportError` where `NormalizedTransportError = { category: TransportErrorCategory; message: string; retryAfter?: number }`. Map HTTP statuses (400→invalid-request, 401/403→invalid-key, 402→insufficient-credits, 408→timeout, 429→rate-limit, 502/503→provider-unavailable), the OpenRouter JSON error shape, network/timeout/abort causes (→network/timeout), provider policy/moderation responses (→moderation-refusal), and missing choices/content (→malformed-response); anything unrecognized → unknown. Each category carries a concise user-facing `message`. Parse `Retry-After` into `retryAfter` metadata; do **not** trigger retries. Never include the authorization header or raw key in `message`. (Note: `missing-key` is produced pre-network by the client in SPEC009OPEGLOBSET-003; include it in the `TransportErrorCategory` union here so the type is complete.)

## Files to Touch

- `packages/server/src/openrouter/request.ts` (new)
- `packages/server/src/openrouter/request.test.ts` (new)
- `packages/server/src/openrouter/errors.ts` (new)
- `packages/server/src/openrouter/errors.test.ts` (new)

## Out of Scope

- The `fetch` call, env-key reading, and model-list refresh — SPEC009OPEGLOBSET-003 (`client.ts`, `models.ts`).
- Route wiring (`/api/generate`, `/api/settings/openrouter`) — SPEC009OPEGLOBSET-004, -005.
- Streaming, provider routing/transforms, guardrail routing, experimental knobs — OPENROUTER-INTEGRATION non-goals.

## Acceptance Criteria

### Tests That Must Pass

1. `buildChatCompletionRequest` produces exactly one `user` message with the verbatim compiled prompt and `stream: false`; settings map to the supported parameters; `top_p` omitted when absent.
2. Every documented status and failure cause maps to its OPENROUTER-INTEGRATION category; unrecognized input → `unknown`.
3. No normalized-error `message` contains a key, bearer token, or authorization header, including for the 401/auth path.
4. `Retry-After` is surfaced as advisory metadata only; no retry behavior.
5. `npm test --workspace @loom/server -- src/openrouter/request.test.ts src/openrouter/errors.test.ts`, `npm run typecheck`, `npm run lint` all green.

### Invariants

1. `request.ts` and `errors.ts` import no I/O, no `node:*`, no Zod — pure functions only.
2. The `TransportErrorCategory` union has exactly the 11 OPENROUTER-INTEGRATION categories (incl. `missing-key`).

## Test Plan

### New/Modified Tests

1. `packages/server/src/openrouter/request.test.ts` — body shape, single user message, `stream:false`, parameter mapping, `top_p` omission.
2. `packages/server/src/openrouter/errors.test.ts` — full status/cause → category matrix, key-redaction in messages, `Retry-After` metadata.

### Commands

1. `npm test --workspace @loom/server -- src/openrouter/request.test.ts src/openrouter/errors.test.ts`
2. `npm run typecheck && npm run lint && npm test`
3. `grep -nE "node:|fetch\(|from \"zod\"" packages/server/src/openrouter/request.ts packages/server/src/openrouter/errors.ts` — must return nothing (purity proof for these two files).
