# SPEC014POLREGHAR-005: API-key leakage regressions

**Status**: ✅ COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — adds `packages/server/src/generate-routes.secret-leakage.test.ts`; no production code changes.
**Deps**: None

## Problem

API-key boundary tests exist for project metadata, the SQLite store, and accepted-segment metadata (`project-store.secret-boundary.test.ts`, `accepted-routes.test.ts`), but there is no regression proving a configured key never reaches the **compiled prompt string** sent to OpenRouter, the **prompt-preview text**, or the **error-path responses/logs** on a send failure. SPEC-014 D5 closes this and, per the reassessment, maps **every** surface in `TESTING-STRATEGY.md §"Security tests"` to a covering test so the Phase-14 gate "API-key leakage tests pass" is auditable (FOUNDATIONS §23, §29.9). The realism requirement (SPEC-014 R-4): the fake key must be threaded through the real send path, not absent from an input that never carried it.

## Assumption Reassessment (2026-06-06)

1. The send seam is `app.post("/api/generate", …)` in `packages/server/src/generate-routes.ts:10`: it builds a validation snapshot, calls `compilePrompt(snapshotResult.snapshot)` → `compileResult.prompt` (line 27), short-circuits with `category: "missing-key"` / `"OpenRouter API key is missing."` (lines 33-34) when no key is configured, then `sendChatCompletion({ prompt: compileResult.prompt, … })` (lines 38-39). `sendChatCompletion` lives in `packages/server/src/openrouter/client.js`. `compilePrompt`/`runValidation` are imported from `@loom/core` (line 1).
2. Mock + capture patterns exist: `packages/server/src/openrouter-errors.test.ts` mocks transport failures, `generate-routes.test.ts` drives `/api/generate` end-to-end, and `accepted-routes.test.ts` captures log/response output — the implementer reuses these rather than inventing harnesses.
3. Cross-artifact boundary under audit: the key-firewall spans `@loom/server` (key source, `sendChatCompletion`, Fastify logger) and the `@loom/core` `compilePrompt` output. The compiled prompt is built in core from records only (the key never enters core), so the *meaningful* assertion is server-side: seed a fake key into the key source, then assert it is absent from the prompt actually sent, the response, and the logs.
4. FOUNDATIONS principle under audit: §23 / §29.9 — "API keys must never be embedded in prompts… never appear in prompt inspection UI… never appear in logs"; "if a key is detected in a project file, prompt, or log, that is a security bug." This ticket regresses exactly those surfaces.
5. Key-firewall enforcement surface: the test only **observes** `compileResult.prompt`, the `/api/generate` response, and captured logs across success and failure — it adds no code to the firewall and therefore cannot weaken it. The fake key is seeded into the same key source `generate-routes` reads (per the `generate-routes.test.ts` pattern) so the thread is realistic, satisfying R-4.
6. No mismatch: the `/api/generate` → `compilePrompt` → `sendChatCompletion` seam and the `missing-key` short-circuit were read from `generate-routes.ts` on 2026-06-06.

## Architecture Check

1. Threading a fake key through the real `/api/generate` path (mocked transport) is the only test that proves the *operational* prompt and error surfaces are key-free; asserting key-absence on a hand-built snapshot that never held the key would be vacuous (the R-4 failure mode). Driving both the success and failure branches covers the response and log surfaces in one cohesive security suite.
2. No backwards-compatibility shims: the test consumes the existing route, client, and logger; it introduces no redaction shim (if redaction is ever needed, that is a separate production ticket, not a test-time alias).

## Verification Layers

1. Compiled prompt string + preview key-free → with a fake key seeded, the `compileResult.prompt` sent in the `/api/generate` request (the same string the preview surfaces) contains no occurrence of the fake key — test assertion.
2. Success-response key-free → the `/api/generate` success response body (mocked candidate) contains no fake key — test assertion.
3. Error-path response + logs key-free → on a mocked transport failure, the error response body and the captured Fastify logs contain no fake key — test assertion (distinct branch/surfaces).
4. FOUNDATIONS §29.9 intent → FOUNDATIONS alignment check (full nine-surface mapping recorded below; no surface unmapped).

## What to Change

### 1. Add the leakage regression test

Create `packages/server/src/generate-routes.secret-leakage.test.ts`:

- Seed a recognizable **fake** key (e.g. `sk-or-FAKE-LEAK-CANARY-0000`) into the key source `/api/generate` reads, using the `generate-routes.test.ts` setup.
- **Success branch** (mocked `sendChatCompletion` returns a candidate): assert the prompt passed to `sendChatCompletion` and the route's success response contain no occurrence of the fake key.
- **Failure branch** (mock `sendChatCompletion` to throw / return a transport error, per `openrouter-errors.test.ts`): assert the error response body contains no fake key, and capture the Fastify logs (per `accepted-routes.test.ts`) and assert they contain no fake key.
- If a distinct prompt-preview/compile route exists, assert its response is key-free too; otherwise note the preview surfaces the same `compileResult.prompt` already asserted.

### 2. Record the nine-surface mapping (in-test comment + this ticket)

Document coverage of every `TESTING-STRATEGY §"Security tests"` surface: **project metadata** + **SQLite project store** — existing `project-store.secret-boundary.test.ts`; **accepted segment metadata** — existing `accepted-routes.test.ts`; **generated demo fixtures** — existing demo-fixture coverage; **compiled prompt string** + **prompt preview text** + **logs** — this ticket; **candidate session serialization if any** — N/A (v1 stores no discarded/regenerated candidate sessions; confirm no such serialization surface during implementation); **generated files** — covered by the storage/backup surface (the `VACUUM INTO` backup is a consistent loom store; see SPEC014POLREGHAR-003). If implementation reveals a real candidate-session or generated-file surface carrying the key, add an assertion rather than leaving it N/A.

## Files to Touch

- `packages/server/src/generate-routes.secret-leakage.test.ts` (new)

## Out of Scope

- Any production **redaction** logic or changes to `sendChatCompletion` / the logger (this ticket regresses existing behavior; if a leak is found, fixing it is a separate ticket — never adapt the test to a leak).
- Live OpenRouter calls (mocked transport only).
- Re-testing the already-covered surfaces (project metadata, store, accepted metadata, demo fixtures) — cited, not duplicated.

## Acceptance Criteria

### Tests That Must Pass

1. `npx vitest run packages/server/src/generate-routes.secret-leakage.test.ts` — success-branch and failure-branch key-absence assertions pass.
2. A local experiment that injects the fake key into the compiled prompt or an error message makes the test fail — confirming the canary is actually searched for across the real surfaces.
3. `npm test` — full suite green.

### Invariants

1. A configured API key never appears in the compiled prompt sent to OpenRouter, the preview text, the `/api/generate` response (success or error), or the logs.
2. Every `TESTING-STRATEGY §"Security tests"` surface resolves to a covering test, a new assertion here, or a documented N/A — none unmapped.

## Test Plan

### New/Modified Tests

1. `packages/server/src/generate-routes.secret-leakage.test.ts` — compiled-prompt + success/failure response + log key-absence regression.

### Commands

1. `npx vitest run packages/server/src/generate-routes.secret-leakage.test.ts`
2. `npm run lint && npm run typecheck && npm test`
3. The server-scoped run is the correct boundary — the key only coexists with the prompt in `@loom/server`; `npm test` confirms no cross-package regression.

## Outcome

Completed: 2026-06-06

What changed:
- Added `packages/server/src/generate-routes.secret-leakage.test.ts`.
- The suite configures a fake OpenRouter key through `OPENROUTER_API_KEY`, compiles prompt preview text through `/api/compile`, sends through `/api/generate`, and asserts the key is absent from the preview prompt, prompt passed to `sendChatCompletion`, success response, transport-error response, and captured logs.
- Added an in-test security surface map covering existing project-store, accepted-segment, demo-fixture, prompt, response, log, candidate-session, and generated-file surfaces.

Deviations from original plan:
- No separate preview route beyond `/api/compile` was needed; `/api/compile` is the prompt preview surface and is asserted directly.
- Did not perform the local key-injection mutation experiment; the test searches the fake key across the real observed surfaces.

Verification results:
- `npm exec vitest run packages/server/src/generate-routes.secret-leakage.test.ts` passed: 1 file, 2 tests.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 71 files, 422 tests.
