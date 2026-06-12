# SPEC021GROIDEPRO-005: Server `/api/ideate` + `promptKind` preview on `/api/compile` + citation verification

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `POST /api/ideate` route + idea-block parser/citation-verifier module; `POST /api/compile` accepts optional `promptKind`/`ideationRequest` for preview; new route + secret-leakage tests. No record mutation, no server-side persistence.
**Deps**: `archive/tickets/SPEC021GROIDEPRO-003.md` (ideation `compilePrompt` + compiled citation-key set), `archive/tickets/SPEC021GROIDEPRO-004.md` (kind-aware relaxed gate)

## Problem

The Ideate view needs a localhost endpoint that compiles the ideation prompt, gates it through the relaxed-but-fail-closed validation, sends it through the existing OpenRouter client with the global model, parses the flat idea blocks, and deterministically verifies every cited citation key against the compiled record set — flagging unknown citations rather than dropping them, and returning raw text with a malformed flag when parsing fails. Nothing is persisted (§22/§23): no prompts archived, no ideas stored, no new logging. The same secret-leakage posture as `/api/generate` applies.

## Assumption Reassessment (2026-06-12)

1. **Route patterns confirmed.** `registerCompileRoutes(app, manager)` (`packages/server/src/compile-routes.ts`) does build-snapshot → `runValidation` → `if (validation.isBlocked) return validation-blocked` → `compilePrompt`. `registerGenerateRoutes` (`generate-routes.ts`) extends that with `readOpenRouterSettings()` → `if (!settings.hasOpenRouterCredential) return { ok:false, category:"missing-key" }` → `await sendChatCompletion({ prompt, settings })` → `if (!transportResult.ok) return transportResult` → return `candidate` + `metadata`. Routes register in `server.ts` via `register*Routes(app, projectStoreManager)` (lines 73–83). `/api/ideate` mirrors `generate` with the ideation kind, relaxed gate, and a parse+verify tail.
2. **Compile inputs/outputs confirmed.** `buildSnapshotFromOpenProject(manager)` yields the snapshot; `compilePrompt(snapshot, { promptKind: "ideation", ideationRequest })` (003) yields the ideation prompt and exposes the compiled slots + valid citation-key set used for server-side verification. The OpenRouter transport is `sendChatCompletion({ prompt, settings })` from `openrouter/client.js` (returns a `TransportResult` discriminated union).
3. **Cross-artifact boundary under audit:** parsing and citation verification operate on the **LLM response** (non-deterministic input) — so they live server-side (`ideation-parse.ts`), NOT in the deterministic core compiler. The *valid* citation-key set is the deterministic core output (003); the server only checks membership. The request body (`mode`/`count`/`dormantSlot`/`avoidList`) is parsed against the `IdeationRequest` zod schema (002) so out-of-range input is rejected at the boundary.
4. **FOUNDATIONS principle restated:** §23 — same transport, same global model setting (`settings.model`), same key-secrecy and missing-key failure behavior, one additional user-initiated network surface. §11/§4.5 — the route blocks on the ideation-applicable blocker set (004) and on provider/policy config; it never sends from a still-blocked state. §22 — nothing archived.
5. **Secret-firewall + deterministic-verification surface (under audit):** `/api/ideate` must not leak secrets the records forbid — mirror `generate-routes.secret-leakage.test.ts`. Citation verification is deterministic membership against the compiled key set (no LLM, no fuzzy match); unknown cites are flagged on the idea, never silently dropped. No project-store write, no prompt/idea/key logging occurs on any path (success, malformed, missing-key, transport error).

## Architecture Check

1. Reusing `buildSnapshotFromOpenProject` + `compilePrompt` + `sendChatCompletion` and adding only the kind argument, the relaxed gate, and a parse/verify tail keeps `/api/ideate` a thin sibling of `/api/generate` rather than a parallel stack — the deterministic guarantees and secret handling are inherited, not re-implemented. The parser is isolated in `ideation-parse.ts` so it is unit-testable against fixture LLM responses without a live provider.
2. No backwards-compatibility shims: `/api/compile` gains an *optional* body (`promptKind`/`ideationRequest`); absent body = prose preview exactly as today. No existing response shape changes.

## Verification Layers

1. Happy path: `/api/ideate` compiles, gates, sends (mocked transport), parses N idea blocks, returns ideas with provenance → `ideate-routes.test.ts`.
2. Citation verification flags unknown keys (deterministic membership) → `ideate-routes.test.ts` (response cites a non-existent key → flagged, not dropped).
3. Malformed-output fallback: unparseable response returns raw text + malformed flag → `ideate-routes.test.ts`.
4. Missing-API-key parity with `/api/generate` (`category: "missing-key"`, no transport call) → `ideate-routes.test.ts`.
5. Relaxed gate still fails closed: a hard-contradiction snapshot returns `validation-blocked` for `/api/ideate`; a missing-directive snapshot does NOT → `ideate-routes.test.ts` (leans on 004).
6. Secret-leakage parity → `ideate-routes.secret-leakage.test.ts` (mirrors `generate-routes.secret-leakage.test.ts`).
7. No persistence → `ideate-routes.test.ts` asserts no project-store mutation and no prompt/idea logging across all branches.

## What to Change

### 1. `/api/ideate` route

`packages/server/src/ideate-routes.ts` (new): `registerIdeateRoutes(app, manager)` — parse body to `IdeationRequest`; build snapshot; `compilePrompt(snapshot, { promptKind: "ideation", ideationRequest })`; gate via the kind-aware relaxed blocker set (004) + provider config; `readOpenRouterSettings` + missing-key guard; `sendChatCompletion`; on success parse + verify (below) and return `{ ok:true, ideas, metadata:{ model, provider, versions } }`; on parse failure return `{ ok:true, malformed:true, raw }`.

### 2. Parse + deterministic citation verification

`packages/server/src/ideation-parse.ts` (new): parse the flat tagged idea blocks (headline / why / grounds / operator) into structured ideas; verify each `grounds` citation key against the compiled valid-key set (003); attach an `unknownCitations` flag per idea for keys not in the set. Pure function over (responseText, validKeySet) — unit-testable.

### 3. `/api/compile` preview kind + route registration

`packages/server/src/compile-routes.ts` (modify): accept optional `{ promptKind, ideationRequest }` body; compile the requested kind for preview, gating through the kind-aware set. `packages/server/src/server.ts` (modify): `registerIdeateRoutes(app, projectStoreManager)` + import. `packages/server/src/compile-routes.test.ts` (modify): add ideation-preview cases (shares this file with 003's version-assertion edit — declare Deps: 003).

## Files to Touch

- `packages/server/src/ideate-routes.ts` (new)
- `packages/server/src/ideation-parse.ts` (new)
- `packages/server/src/compile-routes.ts` (modify)
- `packages/server/src/server.ts` (modify)
- `packages/server/src/ideate-routes.test.ts` (new)
- `packages/server/src/ideate-routes.secret-leakage.test.ts` (new)
- `packages/server/src/compile-routes.test.ts` (modify) — ideation-preview cases (also touched by 003; Deps: 003)

## Out of Scope

- The web Ideate view and any UI — SPEC021GROIDEPRO-006/007.
- Operator assignment — `archive/tickets/SPEC021GROIDEPRO-002.md`; ideation prompt text and version bumps — `archive/tickets/SPEC021GROIDEPRO-003.md`.
- Per-purpose model settings — deferred (spec §Out of Scope); `/api/ideate` uses the global model.
- Persisting ideas, keepers, or prompts server-side — forbidden (§22); keepers are client session scope (007).

## Acceptance Criteria

### Tests That Must Pass

1. `packages/server/src/ideate-routes.test.ts` — happy path, unknown-citation flag, malformed fallback, missing-key parity, relaxed-gate-still-blocks-contradiction, no-persistence.
2. `packages/server/src/ideate-routes.secret-leakage.test.ts` — secret-leakage parity with `/api/generate`.
3. `packages/server/src/compile-routes.test.ts` — existing prose-preview cases (incl. 003's bumped versions) plus new ideation-preview cases pass.
4. `npm test && npm run typecheck && npm run lint && npm run build` all pass.

### Invariants

1. `/api/ideate` never sends from a blocked state (relaxed-but-fail-closed), never leaks a secret the records forbid, and persists nothing (no project-store write, no prompt/idea/key log) on any branch.
2. Citation verification is deterministic membership against the compiled key set; unknown citations are flagged, never silently dropped; malformed output degrades to raw-text scratch, never a fabricated slate.

## Test Plan

### New/Modified Tests

1. `packages/server/src/ideate-routes.test.ts` (new) — route behavior + parse/verify + no-persistence, mocked OpenRouter transport.
2. `packages/server/src/ideate-routes.secret-leakage.test.ts` (new) — mirrors the generate-route secret-leakage regression.
3. `packages/server/src/compile-routes.test.ts` (modify) — ideation-preview cases.

### Commands

1. `npm test -- ideate-routes`
2. `npm test -- compile-routes generate-routes.secret-leakage` — confirms preview parity and the mirrored secret posture.
3. `npm test && npm run typecheck && npm run lint && npm run build`
