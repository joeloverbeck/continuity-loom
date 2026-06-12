# SPEC021GROIDEPRO-009: Capstone — end-to-end ideation smoke + verification gate

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — new server-side end-to-end test exercising the composed ideation pipeline against the demo project + a manual UI runbook; no production behavior change (verification-only)
**Deps**: SPEC021GROIDEPRO-007 (transitively gates 001→002→003/004→005→006→007 — the full implementation chain)

## Problem

SPEC-021's §Verification requires the whole ideation pipeline to be exercised end-to-end — core slot assignment, deterministic ideation compilation, the relaxed-but-fail-closed gate, the server route with citation verification and no persistence, and the quarantined UI — plus a confirmation that the prose generation flow is byte-identical and untouched. Unit tests own each piece; this capstone composes them: a CI-runnable server e2e over the demo project and a manual UI smoke runbook, with the spec's §Verification bullets as the gate. It introduces no new production logic.

## Assumption Reassessment (2026-06-12)

1. **Composed surfaces exist by Deps.** The pipeline pieces are delivered by 002 (slot engine), 003 (ideation compile + golden + version bumps), 004 (relaxed gate), 005 (`/api/ideate` + parse/verify + no-persistence), 006/007 (Ideate UI). The demo project harness exists (`packages/server/src/demo-creation.ts`, `demo-e2e.test.ts`) and is the fixture this e2e drives.
2. **No new production code.** This ticket adds only test/runbook surfaces; it modifies none of the upstream tickets' files (it exercises them). The CI-runnable slice mocks the OpenRouter transport (as 005's tests do) so it runs without a live key.
3. **Cross-artifact boundary under audit:** the capstone is the integration boundary across `@loom/core` (compile + slots + validation), `@loom/server` (route + parse + verify + persistence guarantees), and the demo fixture. The invariant under audit is that composing them preserves each piece's guarantees — determinism, fail-closed, no-persistence, secret-firewall, and prose non-regression — none of which a single unit test proves end-to-end.
4. **FOUNDATIONS principle restated:** §8 — the prose golden remains byte-identical end-to-end (no ideation work perturbed prose compilation); §22/§26 — the UI smoke confirms the prompt is inspectable, ideas are quarantined scratch with no insertion path, keepers are session-scoped; §11/§4.5 — a contradictory demo state still blocks ideation.
5. **Secret-firewall + deterministic-compilation, end-to-end:** the e2e re-runs the secret-leakage and determinism guarantees through the real route against the demo fixture (not just the unit mocks), confirming no secret leaks into the ideation prompt and that two ideation compiles of the demo snapshot are identical.

## Architecture Check

1. A trailing capstone is cleaner than spreading e2e assertions across feature tickets: each feature ticket proves its own unit, and one integration ticket proves they compose without re-implementing logic. Structuring it as an automatable server e2e plus a manual UI runbook matches the project's lack of a browser-automation harness — the runnable portion gates CI, the runbook gates the human smoke.
2. No backwards-compatibility shims: verification-only; no production surface touched.

## Verification Layers

1. Ideation slate generates end-to-end over the demo project (compile → relaxed gate → mocked send → parse → verify) → `ideate.e2e.test.ts`.
2. Prose flow byte-identical and untouched → existing `compiler-golden.test.ts` + `compile-routes.test.ts` re-run green (named in the gate).
3. Contradictory demo state blocks ideation; missing-directive demo state does not → `ideate.e2e.test.ts` (relaxed-gate composition).
4. Citation verification flags unknown keys and nothing is persisted, through the real route → `ideate.e2e.test.ts` (asserts project-store untouched).
5. Secret non-leakage + ideation determinism over the demo snapshot → `ideate.e2e.test.ts`.
6. Manual UI smoke (generate slate, inspect prompt, regenerate one slot, pin keeper, reload→keeper survives within session, confirm prose flow unchanged) → implementer runbook (checklist, not CI).

## What to Change

### 1. Automatable end-to-end (CI-runnable)

`packages/server/src/ideate.e2e.test.ts` (new): drive the demo project through `/api/ideate` with a mocked OpenRouter transport — assert a slate parses, unknown citations flag, the relaxed gate blocks a contradiction fixture but not a missing-directive fixture, two ideation compiles are identical, no secret leaks, and the project store is unmutated. Re-enumerate expected counts from the demo fixture at test start (no hardcoded counts).

### 2. Manual UI smoke runbook

In this ticket's body (runbook, not CI): against a fresh demo project — (1) open Ideate, inspect the compiled prompt; (2) generate a slate, confirm 3–6 cards reveal together with operator badges + citation chips; (3) regenerate one slot, confirm the avoid-list is sent; (4) pin a keeper, reload the page, confirm the keeper survives within the session and nothing persisted to the project; (5) switch to Generate and confirm prose generation is byte-identical and untouched. Each step lists its expected observable result.

## Files to Touch

- `packages/server/src/ideate.e2e.test.ts` (new)

## Out of Scope

- Any production logic — owned by `archive/tickets/SPEC021GROIDEPRO-002.md`, `archive/tickets/SPEC021GROIDEPRO-003.md`, `archive/tickets/SPEC021GROIDEPRO-004.md`, `archive/tickets/SPEC021GROIDEPRO-005.md`, `archive/tickets/SPEC021GROIDEPRO-006.md`, and SPEC021GROIDEPRO-007.
- Docs — SPEC021GROIDEPRO-008 (runs parallel; not exercised by this smoke).
- A browser-automation harness — not present in the project; the UI smoke is a manual runbook by design.

## Acceptance Criteria

### Tests That Must Pass

1. `packages/server/src/ideate.e2e.test.ts` — full ideation pipeline over the demo project: slate generation, unknown-citation flag, relaxed-gate composition, determinism, secret non-leakage, no persistence.
2. Spec §Verification gate: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all pass — including 002's slot tests, 003's golden/version tests, 004's readiness tests, 005's route tests, 006/007's component tests, and the unchanged prose golden.
3. Manual UI runbook steps 1–5 pass (implementer checklist).

### Invariants

1. Composing the ideation pieces preserves every per-piece guarantee end-to-end: determinism, fail-closed gating, no server persistence, secret firewall, and byte-identical prose compilation.
2. The capstone introduces no production logic — it exercises the pipeline, it does not modify it.

## Test Plan

### New/Modified Tests

1. `packages/server/src/ideate.e2e.test.ts` (new) — composed end-to-end over the demo project with mocked transport, per Verification Layers.

### Commands

1. `npm test -- ideate.e2e`
2. `npm run lint && npm run typecheck && npm test && npm run build` — the full spec §Verification gate.
3. `npm test -- compiler-golden compile-routes` — the narrow prose-non-regression proof that ideation work left the prose flow byte-identical.
