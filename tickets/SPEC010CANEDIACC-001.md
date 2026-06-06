# SPEC010CANEDIACC-001: Parameter-snapshot generate metadata

**Status**: PENDING
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — extends the `POST /api/generate` success-response `metadata` shape (server code surface; consumed later by the accept write path)
**Deps**: None

## Problem

`POST /api/generate` (`packages/server/src/generate-routes.ts:47-54`) currently returns
`metadata: { model, versions }`. SPEC-010's acceptance write must persist the **full
deterministic snapshot of what actually generated the text** (FOUNDATIONS §21 accepted-segment
metadata). The candidate flow has no way to carry the generation parameters (temperature,
maxOutputTokens, topP, provider) from the send to the eventual accept, so the segment metadata
would be incomplete. This ticket widens the generate response to carry the parameter snapshot —
all values already knowable server-side at send time — without adding any new I/O or secret.

## Assumption Reassessment (2026-06-06)

1. `generate-routes.ts:50-53` returns `metadata: { model: settings.model, versions: compileResult.metadata.versions }`; `settings` comes from `readOpenRouterSettings()` (`generate-routes.ts:28`).
2. `readOpenRouterSettings(): OpenRouterSettingsStatus` (`packages/server/src/settings.ts:53`) returns `model`, `temperature`, `maxOutputTokens`, optional `topP`, plus `hasOpenRouterCredential` — so every snapshot field is already in scope; no new read is needed. SPEC-010 §Approach "parameter snapshot" + Deliverable 1.
3. Shared boundary under audit: the generate-response `metadata` contract is consumed downstream by the web `GenerateResponse` type (`packages/web/src/api.ts:84`, widened in SPEC010CANEDIACC-003) and ultimately by the accept route (SPEC010CANEDIACC-002). This ticket fixes the server-emitted shape; consumers follow in their own tickets.
4. FOUNDATIONS §21 motivates this: accepted-segment metadata should include model, provider/model identifier, prompt template version, and compiler version. The snapshot is a superset (adds temperature/maxOutputTokens/topP/contract version), all deterministic and key-free.
5. Secret-firewall check (§15/§23/§29.9): the snapshot reads only non-secret settings fields; `OpenRouterSettingsStatus` carries no key (`settings.ts:161-166` only adds the boolean `hasOpenRouterCredential`), and `provider` is the constant `"openrouter"`. No key enters the response. Determinism (§8) is unaffected — the response metadata is not a compiler input; `compileResult.metadata.versions` (`ValidationVersions = { template, compiler, contract }`, `packages/core/src/validation/snapshot.ts:23-26`) is threaded through unchanged.
6. Schema extension: the success branch of the generate response is an inline object literal, not a shared exported type on the server side; the only construction site is `generate-routes.ts:50`. The web mirror type and its test mock are updated in -003 (`api.ts:84`) and -005 (the relocated `candidateMetadata()` mock). Additive widening — no field removed.

## Architecture Check

1. Reading the snapshot from the same `settings` object already loaded for the transport call (`generate-routes.ts:28,38-41`) guarantees the persisted metadata reflects exactly the parameters used for this generation — no second read, no drift between "sent" and "recorded".
2. No backwards-compatibility aliasing: the old `{ model, versions }` shape is replaced in place, not kept alongside a new shape. Downstream consumers are updated in their own tickets via explicit Deps.

## Verification Layers

1. Response carries the full snapshot → server e2e (`fastify.inject` on `/api/generate` asserts `metadata` has `model`, `provider:"openrouter"`, `temperature`, `maxOutputTokens`, `versions`, and `topP` when configured) in `generate-routes.test.ts`.
2. No secret/prompt/candidate leak in metadata → grep-proof + assertion that the response `metadata` contains no key-shaped field and no prompt/candidate text.
3. Determinism preserved (§8) → `versions` still equals `compileResult.metadata.versions` unchanged; FOUNDATIONS alignment check (metadata is not a compiler input).

## What to Change

### 1. Extend the generate success metadata

In `packages/server/src/generate-routes.ts`, replace the success-branch `metadata` object with:

```ts
metadata: {
  model: settings.model,
  provider: "openrouter" as const,
  temperature: settings.temperature,
  maxOutputTokens: settings.maxOutputTokens,
  ...(settings.topP !== undefined ? { topP: settings.topP } : {}),
  versions: compileResult.metadata.versions
}
```

`topP` is included only when configured (it is optional on `OpenRouterSettings`). Keep `versions` exactly as-is.

### 2. Extend the existing test

In `packages/server/src/generate-routes.test.ts`, update the success-path assertion to expect the full snapshot, add a case asserting `topP` is present when settings configure it and absent when they do not, and assert no key-shaped field appears in `metadata`.

## Files to Touch

- `packages/server/src/generate-routes.ts` (modify)
- `packages/server/src/generate-routes.test.ts` (modify)

## Out of Scope

- The accept route / archive write (SPEC010CANEDIACC-002).
- The web `GenerateResponse` type widening and `acceptCandidate` client (SPEC010CANEDIACC-003).
- Optional richer metadata (`finishReason`, token `usage`, prompt `fingerprint`) — deferred per SPEC-010 §Out of Scope.
- Any `@loom/core` change — none required; the version triple is threaded through unchanged.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- generate-routes` — success response `metadata` equals `{ model, provider:"openrouter", temperature, maxOutputTokens, topP?, versions }`; `topP` present iff configured.
2. `npm test -- generate-routes` — no key-shaped field and no prompt/candidate text appears anywhere in the response `metadata`.
3. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. The persisted-able snapshot reflects the exact `settings` used for the transport call in the same request (single read).
2. `metadata.versions` remains byte-identical to `compileResult.metadata.versions` (determinism, §8); the metadata never becomes a compiler input.

## Test Plan

### New/Modified Tests

1. `packages/server/src/generate-routes.test.ts` — assert the widened snapshot, the conditional `topP`, and the no-secret/no-prompt invariant.

### Commands

1. `npm test -- generate-routes`
2. `npm run typecheck && npm run lint && npm test && npm run build`
