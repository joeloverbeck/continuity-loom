# SPEC027RECHYGASS-006: Server routes + OpenRouter safety

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — new `@loom/server` module `record-hygiene-routes.ts`, `server.ts` route registration, and route tests. Adds `POST /api/record-hygiene/compile` and `POST /api/record-hygiene/analyze`; no change to existing routes.
**Deps**: `archive/tickets/SPEC027RECHYGASS-005.md`

## Problem

The feature needs two localhost routes: a `compile` route that returns the inspectable prompt + metadata + citation map for local inspection/copy-out (always available, no credentials required), and an `analyze` route that recompiles server-side from current project state, sends the **exact** prompt through the existing OpenRouter client, parses the response, and returns parsed findings or quarantined raw output. Neither route may accept a client-supplied prompt, record subset, or write instruction, and no prompt/payload/key may be logged.

## Assumption Reassessment (2026-06-21)

1. **Route + provider seams (codebase).** `registerIdeateRoutes(app, manager)` (`packages/server/src/ideate-routes.ts:19`) is wired in `server.ts:93`; the OpenRouter client is `sendChatCompletion` (`./openrouter/client.js`, imported at `ideate-routes.ts:14`); provider config is `readOpenRouterSettings()` (`./settings.js`, with `hasOpenRouterCredential`); error categories use `{ ok:false, kind:… }` / `category:"missing-key"`. The new routes mirror these exactly.
2. **Spec/doc authority.** `specs/SPEC-027` Deliverable 4 + proposal §6.10 (copy-out + send) and §7.2 (route request/response shapes, the response-category list).
3. **Cross-artifact boundary under audit.** Both routes consume `buildStoryRecordHygieneSnapshot` + `parseRecordHygieneResponse` (`archive/tickets/SPEC027RECHYGASS-005.md`) and `compileRecordHygienePrompt` (`archive/tickets/SPEC027RECHYGASS-004.md`). New-module reachability: both routes are registered in `server.ts` (mirroring the `registerIdeateRoutes` call at `:93`). `analyze` recompiles server-side and ignores any client-supplied prompt/subset/edit/write field.
4. **FOUNDATIONS principle motivating this ticket.** §22 prompt inspection and audit boundaries + §23 OpenRouter and secrets: prompts are not archived by default, API keys never appear in inspection or logs, and the server binds loopback only. These are the invariants under audit.
5. **Secret-firewall + audit enforcement (§15/§22/§23) — this is the network boundary.** `analyze` recompiles from project state (rejecting any client prompt/subset/edit/write payload); the full hygiene payload — including hidden SECRET content — leaves the machine **only** on the explicit user send. The server must **not** log prompt text, full record payloads, raw model output, parsed findings, citation maps carrying story content, or OpenRouter credentials. Missing credentials block **send only** (local compile/copy stays available); a known over-limit prompt fails `prompt-too-large` with **no** record eviction and **no** retry with fewer records.

## Architecture Check

1. **Dedicated routes mirroring `/api/ideate` beat a shared dispatch.** Modeling on `POST /api/ideate` keeps the provider-error categories, redaction, and loopback discipline consistent, while server-side recompilation prevents a client from substituting prompt text. The shared `promptKindSchema` / `/api/compile` dispatch is **not** extended with a `record_hygiene` arm (spec §Out of Scope / M1) — if a label literal is ever added, `/api/compile` must reject it, not dispatch it.
2. **No backwards-compatibility aliasing/shims.** New route module + one `server.ts` registration block; existing routes untouched.

## Verification Layers

1. `analyze` recompiles from project state and ignores any client-supplied prompt/subset/edit field → server e2e test sending hostile client fields.
2. Prompt text, full record payloads, raw model output, parsed findings, citation maps, and keys never appear in captured logs → log-capture/secret-leakage test.
3. Missing OpenRouter credential blocks `analyze` only; `compile` still returns the prompt → server test.
4. A known over-limit prompt returns `prompt-too-large` with no truncation/eviction/retry → server test.
5. Both routes registered → codebase grep-proof in `server.ts`.

## What to Change

### 1. `record-hygiene-routes.ts` (new)
`registerRecordHygieneRoutes(app, manager)`:
- `POST /api/record-hygiene/compile` — validate the fixed `{ mode:"full_active_atomic_review" }` request, rebuild the snapshot, compile via `compileRecordHygienePrompt`, return `{ ok:true, prompt, metadata:{ versions, fingerprint, lengthEstimate, tokenEstimate, recordCount, countsByType }, citations }`.
- `POST /api/record-hygiene/analyze` — validate the fixed request, rebuild the snapshot, recompile, check provider config via `readOpenRouterSettings`, send the exact prompt via `sendChatCompletion`, parse via `parseRecordHygieneResponse`, verify citations, return parsed findings or `{ ok:true, malformed:true, raw }`. Reject any client-supplied prompt/subset/edit/write field.
- Mirror the response categories: `no-open-project`, `invalid-record-hygiene-request`, `malformed-hygiene-source`, `missing-key`, `insufficient-credits`, `rate-limit`, `provider-unavailable`, `moderation-refusal`, `prompt-too-large`, `malformed-record-hygiene-response`. Preserve redaction and the "do not log prompts/full payloads/candidates" behavior.

### 2. `server.ts` (modify)
Register both routes (mirror the `registerIdeateRoutes(app, projectStoreManager)` call at `:93`); preserve loopback binding.

## Files to Touch

- `packages/server/src/record-hygiene-routes.ts` (new)
- `packages/server/src/server.ts` (modify)
- `packages/server/src/record-hygiene-routes.test.ts` (new)

## Out of Scope

- The web page + API client (SPEC027RECHYGASS-007).
- Any change to `/api/ideate`, `/api/compile`, or the prose routes.
- Any record mutation, persisted run history, or background scanning.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test` — `analyze` recompiles server-side and ignores client-supplied prompt/subset/edit fields; `compile` returns prompt + metadata + citations without credentials.
2. `npm test` — log-capture test proves prompt text, full payloads, raw output, parsed findings, citation maps with story content, and keys are absent from logs.
3. `npm test` — missing key blocks `analyze` only; `prompt-too-large` returns cleanly with no eviction/retry; both routes resolve.

### Invariants

1. The full hygiene payload (including SECRET content) leaves the machine only on the explicit `analyze` send; never on `compile`.
2. The server never logs prompts, full record payloads, raw model output, parsed findings, citation maps with content, or keys; binding stays loopback-only.

## Test Plan

### New/Modified Tests

1. `packages/server/src/record-hygiene-routes.test.ts` (new) — both routes; client-prompt-rejection; missing-key (send-only block); prompt-too-large no-eviction; secret-leakage/log-capture assertions; malformed-response quarantine surfaced as `{ ok:true, malformed:true, raw }`.

### Commands

1. `npm test -- record-hygiene-routes` — targeted route + safety coverage.
2. `npm run build && npm run typecheck && npm run lint && npm test` — full-pipeline gate.
3. A server route+log-capture test is the correct boundary because the secret-firewall and no-logging invariants live at the transport layer; the live-LLM `analyze` round-trip is exercised by the capstone's manual runbook (SPEC027RECHYGASS-009), not in CI.

## Outcome

Completed: 2026-06-21

What changed:
- Added `packages/server/src/record-hygiene-routes.ts` with dedicated `POST /api/record-hygiene/compile` and `POST /api/record-hygiene/analyze` routes.
- Registered the route module in `packages/server/src/server.ts`.
- Added `packages/server/src/record-hygiene-routes.test.ts` covering compile, analyze, invalid hostile request fields, missing-key behavior, prompt-too-large fail-fast behavior, malformed output quarantine, no project mutation, route registration, and log redaction.

Deviations:
- Client-supplied `prompt`, `subset`, `edit`, and `write` fields are rejected as `invalid-record-hygiene-request`; the server only analyzes prompts it recompiles from current project state.
- `prompt-too-large` is detected when the selected model has a cached `contextLength` and the compiled prompt token estimate plus requested output budget exceeds it. If no context length is known, the route preserves the existing transport behavior.

Verification:
- `npm test -- record-hygiene-routes` passed: 1 file, 8 tests.
- `npm run build` passed.
- `npm run typecheck` passed.
- `npm test` passed: 140 files, 1051 tests.
- `npm run lint --workspace @loom/server` passed.
- Path-scoped `npx eslint packages/server/src/record-hygiene-routes.ts packages/server/src/record-hygiene-routes.test.ts packages/server/src/server.ts` passed.
- `npm run lint` did not pass because the pre-existing unrelated `.codex/worktrees/spec026-mutdrirob` checkout is inside the repo and ESLint traversed its generated `dist` files and worktree test files, producing 626 errors. This is unrelated to SPEC027RECHYGASS-006 and was left untouched.
