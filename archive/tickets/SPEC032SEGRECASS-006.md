# SPEC032SEGRECASS-006: Server repository method, snapshot builder, and compile/analyze routes

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — new `segment-reconciliation-{snapshot-builder,routes,parse}.ts`; new `RecordRepository.getLatestAcceptedSegmentForReconciliation()`; `server.ts` route registration; new route + e2e tests
**Deps**: SPEC032SEGRECASS-004, SPEC032SEGRECASS-005

## Problem

The server wires the reconciliation feature to real project data and the provider: a one-row latest-accepted-segment fetch (with full text), a dedicated snapshot builder, and the `POST /api/segment-reconciliation/compile` + `POST /api/segment-reconciliation/analyze` route pair. Compile builds the snapshot, calls the core compiler (SPEC032SEGRECASS-004), and returns prompt + fingerprint + disclosure + output schema. Analyze rebuilds the snapshot/prompt, rejects fingerprint drift with `409`, makes one OpenRouter request under an exact structured-output policy with provider transforms disabled, and runs the local parser (SPEC032SEGRECASS-005) — returning typed valid proposals or malformed scratch. The server never trusts a client-supplied prompt/records/segment/catalog/counts, and never logs or persists raw output or accepted text.

Implements SPEC-032 Deliverable 3. Route algorithm and provider restrictions are fixed by `reports/segment-reconciliation-assistance-change-proposal.md` §8.8 and §6.10.

## Assumption Reassessment (2026-06-24)

1. The server seams to mirror exist (verified this session): routes register as `registerXRoutes(app, projectStoreManager)` in `server.ts` (e.g. L95 `registerRecordHygieneRoutes`); a route reaches data via `manager.getRecordRepository()` (record-hygiene-routes.ts:104); the OpenRouter call is `sendChatCompletion` from `./openrouter/client.js` with `readOpenRouterSettings()` (record-hygiene-routes.ts:4,48); a prompt-too-large guard pattern exists (`isPromptTooLarge`). The snapshot builder mirrors `buildStoryRecordHygieneSnapshot(...)` (record-hygiene-snapshot-builder.ts:28).
2. **The existing `RecordRepository.getLatestAcceptedSegment(): AcceptedSegmentReminderRef | null` (record-repository.ts:437) returns a reminder ref WITHOUT text** — verified. This confirms the spec's mandate to add a *separate* `getLatestAcceptedSegmentForReconciliation()` returning id/sequence/acceptedAt/**text** from one ordered row, and NOT to widen the reminder method to carry accepted text (proposal §8.9). The new method must not load a range and must not change reminder behavior.
3. **Cross-artifact boundary under audit**: the route calls the core compiler (SPEC032SEGRECASS-004) and parser (SPEC032SEGRECASS-005); the analyze fingerprint check must rebuild the *entire* snapshot+prompt server-side and compare against the client-echoed `expectedPromptFingerprint`, returning `409 reconciliation-source-changed` on mismatch. The server rejects/ignores any client-supplied prompt, records, brief values, segment text, schema catalog, or source counts — it rebuilds from repository state.
4. **FOUNDATIONS principle restated (§22/§23/§29.9)**: prompt is inspected before send; no prompt/response/keeper state is persisted in the project store; raw output and accepted text are never logged (audit boundary §22). For this operation the server explicitly disables OpenRouter Response Healing, context compression/middle-out, web/file plugins, uninspected tool calls, and fallback to providers that ignore required structured-output parameters; structured mode uses `response_format: json_schema` + `strict:true` + `provider.require_parameters:true` where supported, else plain pure-JSON with the same parser. If an undisclosable transform cannot be disabled, the operation fails clearly.
5. **Secret-firewall + determinism (§15/§8)**: whole-project scope may include secret-bearing records — they are sent only after the explicit disclosure + user-initiated send (SPEC032SEGRECASS-007); the server adds no secret leakage path the records forbid. Compile/analyze are deterministic given repository state + versions; oversize fails with `segment-reconciliation-prompt-too-large` rather than enabling compression.

## Architecture Check

1. A dedicated purpose-specific repository method (not a widened reminder accessor) keeps accepted-text access auditable and prevents the reminder metadata path from silently carrying prose — directly satisfying the spec's "keep the new evidence access purpose-specific" constraint. Rebuilding the snapshot server-side on analyze (never trusting a client prompt) is the only design that makes the fingerprint check authoritative.
2. No backwards-compatibility aliasing/shims: the new route pair and repository method are net-new; no existing accepted-segment accessor is overloaded or aliased.

## Verification Layers

1. Source-rebuild + drift invariant (analyze rebuilds from repository state and returns `409` on fingerprint mismatch; client prompt/records are ignored) → route test injecting a client prompt and a stale fingerprint.
2. One-row + no-range invariant (the latest-segment method returns exactly one row with text and never loads the archive) → repository test + a query-shape assertion.
3. Provider-policy invariant (structured request includes the strict schema + `require_parameters`; healing/compression/plugins/uninspected-tools disabled) → route test asserting the outbound request options.
4. No-residue invariant (raw output + accepted text are not logged or persisted; the project store is byte/row unchanged after a full analyze) → e2e test asserting store invariance and log absence.

## What to Change

### 1. `RecordRepository.getLatestAcceptedSegmentForReconciliation()`

Add a method returning `{ id, sequence, acceptedAt, text } | null` from one ordered single-row query including the full text. Do not load a range; do not touch reminder metadata methods.

### 2. `segment-reconciliation-snapshot-builder.ts`

Mirror `buildStoryRecordHygieneSnapshot`: assemble the `SegmentReconciliationSnapshot` (segment + spans, nineteen brief fields with explicit missing/blank, scoped records + reference stubs, schema catalog) from repository state for the selected scope.

### 3. `segment-reconciliation-routes.ts` + `segment-reconciliation-parse.ts` + `server.ts`

Implement `registerSegmentReconciliationRoutes(app, projectStoreManager)` with the compile/analyze handlers (proposal §8.8) and register it in `server.ts` beside `registerRecordHygieneRoutes`. The parse module adapts the core parser to the route response envelope (valid proposals vs malformed scratch). Apply the exact provider policy (§6.10): strict structured output where supported; healing/compression/plugins/uninspected-tools/parameter-ignoring-fallback disabled.

## Files to Touch

- `packages/server/src/segment-reconciliation-snapshot-builder.ts` (new)
- `packages/server/src/segment-reconciliation-routes.ts` (new)
- `packages/server/src/segment-reconciliation-parse.ts` (new)
- `packages/server/src/record-repository.ts` (modify)
- `packages/server/src/server.ts` (modify)
- `packages/server/src/segment-reconciliation-routes.test.ts` (new)
- `packages/server/src/segment-reconciliation.e2e.test.ts` (new)

## Out of Scope

- The web page, cards, keepers, disclosure UI, and reminder CTA (SPEC032SEGRECASS-007).
- The core compiler/parser internals (SPEC032SEGRECASS-004/-005) — this ticket calls them.
- The cross-pillar capstone and stress/robustness docs (SPEC032SEGRECASS-008).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- segment-reconciliation-routes` and `npm test -- segment-reconciliation.e2e` — route blocking cases (no project, no accepted segment, malformed draft/record), `409` on fingerprint drift, client-prompt rejection, prompt-too-large failure, provider-policy assertions, and the multi-change e2e asserting the project store is byte/row unchanged.
2. `npm run typecheck && npm run lint` — green.
3. `npm test` — no regression in existing route/repository suites.

### Invariants

1. Analyze rebuilds the snapshot from repository state and returns `409 reconciliation-source-changed` on fingerprint mismatch; the server never trusts a client-supplied prompt/records/segment/catalog/counts.
2. The latest-segment method returns exactly one row with text and never loads a range; raw output and accepted text are never logged or persisted; the project store is unchanged after analyze.

## Test Plan

### New/Modified Tests

1. `packages/server/src/segment-reconciliation-routes.test.ts` — compile/analyze route tests (proposal §12.4): blocking cases, drift `409`, client-injection rejection, provider-policy options, oversize failure.
2. `packages/server/src/segment-reconciliation.e2e.test.ts` — the segment-changes-object-holder/resolves-clock/reveals-secret/introduces-obligation case asserting typed suggestions only + store invariance.

### Commands

1. `npm test -- segment-reconciliation-routes && npm test -- segment-reconciliation.e2e`
2. `npm test && npm run typecheck && npm run lint`
3. The route + e2e filters plus a full `npm test` are the right boundary because this ticket integrates the core compiler/parser with real storage and the provider seam; store-invariance can only be proven by the e2e exercising a full analyze.

## Outcome

Completed: 2026-06-24

Added the reconciliation-specific latest accepted segment repository read, server snapshot builder, compile/analyze routes, parser adapter, OpenRouter structured-output policy options, route tests, and storage-invariance e2e coverage.

Verification: `npm test -- segment-reconciliation-routes`; `npm test -- segment-reconciliation.e2e`; `npm run typecheck`; `npm run lint`; `npm test`; `npm run build`; `git diff --check`.
