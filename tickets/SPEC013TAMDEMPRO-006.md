# SPEC013TAMDEMPRO-006: Demo end-to-end capstone + Phase 13 completion bookkeeping

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — new server end-to-end test exercising the full demo loop; status update to `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (no production logic)
**Deps**: SPEC013TAMDEMPRO-003, SPEC013TAMDEMPRO-004, SPEC013TAMDEMPRO-005

## Problem

SPEC-013 §Verification requires that the demo, created via `POST /api/project/create-demo`, opens normally, passes validation with zero blockers, compiles a non-empty deterministic prompt, previews it, accepts an (edited) candidate into the archive, and raises the durable-change reminder. This capstone exercises the pipeline the earlier tickets composed end-to-end (it introduces no new production logic) and performs the phase-completion bookkeeping (flip Phase 13's status in the sequencing doc, mirroring the established Phase 12 precedent).

## Assumption Reassessment (2026-06-06)

1. The full-loop surfaces exist and are reachable from the created demo: `POST /api/validate` and `POST /api/compile` (`packages/server/src/validate`/`compile-routes.ts`, the latter gated by validation per SPEC-008), `POST /api/accepted-segments` + `GET /api/accepted-segments` (`packages/server/src/accepted-routes.ts:54,45`), `GET /api/durable-change-reminder` (`packages/server/src/reminder-routes.ts:37`). Acceptance stores user-edited candidate text directly, so the capstone is fully CI-runnable without invoking OpenRouter.
2. SPEC-013 (reassessed in-session 2026-06-06) §Verification enumerates the capstone sub-cases; §Out of Scope defers real OpenRouter send to manual/existing mocks (no new transport harness here). The valid baseline is produced by SPEC013TAMDEMPRO-001/-002, reached through -003's affordance path; -004 and -005 prove blockers and stress coverage independently, so this leaf set transitively covers the chain (001→002→{003,004}; 001→005).
3. Shared boundary under audit: the capstone is the integration contract across all prior tickets — it asserts the composed pipeline, not any single module, and re-derives expected record/config counts from the fixture at test start (not hardcoded) to avoid stale counts. Bookkeeping boundary: `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` Phase 13 status line (precedent: Phase 12 `Status: ✅ Implemented via SPEC-012 (2026-06-06)`, `:226`; trailing "Phase 13 demo/stress and Phase 14 hardening remain", `:241`).
4. FOUNDATIONS principles motivating the gate: §11 (zero-blocker validation precedes compile), §8 (the compiled prompt is non-empty and deterministic for identical inputs), §20 (post-acceptance durable-change reminder fires; the human remains gatekeeper). §20 no-silent-retcon also governs the bookkeeping edit — rationale (Phase 13 complete) is recorded here.
5. Fail-closed / deterministic surfaces exercised: the validation gate (`packages/core/src/validation/rules/*` via `/api/compile`) and the deterministic compiler (`compilePrompt`) are proven, not modified — the valid demo passes with zero blockers and compiles identically on re-run; the reminder surface (SPEC-012) raises after acceptance. No enforcement surface is weakened.

## Architecture Check

1. A single trailing verification-only test that drives the real routes end-to-end is the cleanest proof that the independently-ticketed pieces compose, and it catches integration gaps (e.g. a fixture that validates in isolation but fails the gated compile) that per-ticket tests miss. Merging the completion-bookkeeping into this capstone (rather than a separate docs ticket) is appropriate because the only doc change is an aggregate status flip gated on the smoke passing — no individually-staleable symbols are cited.
2. No backwards-compatibility aliasing/shims: net-new test + a status-line doc edit; no production code or parallel path.

## Verification Layers

1. Demo creates and opens -> server e2e: `POST /api/project/create-demo` returns a `ProjectStatus` and `GET /api/project` reports it active with `isDemoFixture: true`.
2. Valid demo passes validation with zero blockers -> fail-closed gate: `POST /api/validate` returns no blocker-severity diagnostics.
3. Compiles a non-empty deterministic prompt -> schema validation + FOUNDATIONS §8 alignment: `POST /api/compile` returns a non-empty prompt; a second compile of the same inputs is byte-identical.
4. Accept (edited) candidate into archive -> server e2e: `POST /api/accepted-segments` stores the edited text; `GET /api/accepted-segments` returns it in order.
5. Durable-change reminder raised -> server e2e (§20): `GET /api/durable-change-reminder` reports the reminder after acceptance.
6. Phase 13 marked complete -> codebase grep-proof: `IMPLEMENTATION-ORDER.md` shows Phase 13 `✅ Implemented via SPEC-013` and no longer lists Phase 13 under "remain".

## What to Change

### 1. End-to-end capstone test

Add `packages/server/src/demo-e2e.test.ts`: create the demo via the route, then walk validate (zero blockers) → compile (non-empty + deterministic re-compile) → accept an edited candidate → assert archive contents and the durable-change reminder. Re-enumerate expected record/config counts from the imported fixture at test start.

### 2. Phase 13 status bookkeeping

In `docs/requirements-version-1/IMPLEMENTATION-ORDER.md`, add a `Status: ✅ Implemented via SPEC-013 (<date>)` line to the Phase 13 section (matching the Phase 12 format) and update the trailing "Phase 13 demo/stress and Phase 14 hardening remain" line to reflect only Phase 14 remaining.

## Files to Touch

- `packages/server/src/demo-e2e.test.ts` (new)
- `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (modify)

## Out of Scope

- New production logic of any kind — this ticket exercises and records, it does not implement (the demo loop is built by SPEC013TAMDEMPRO-001…005).
- Real OpenRouter send wiring / a new transport harness — send is exercised manually or with existing mocks (spec §Out of Scope).
- Spec archival (`archive/specs/`) — a post-merge workflow step per `docs/archival-workflow.md`, not part of this diff.
- Phase 14 hardening (golden-output stabilization, leakage regression suite) — separate phase.

## Acceptance Criteria

### Tests That Must Pass

1. `npx vitest run packages/server/src/demo-e2e.test.ts` — create-demo → zero-blocker validate → non-empty deterministic compile → accept edited candidate → reminder raised, with fixture-derived counts.
2. `grep -n "Implemented via SPEC-013" docs/requirements-version-1/IMPLEMENTATION-ORDER.md` returns the new Phase 13 status; `grep -n "Phase 13 demo/stress" docs/requirements-version-1/IMPLEMENTATION-ORDER.md` no longer reports it as remaining.
3. `npm run lint && npm run typecheck && npm test` — full pipeline green.

### Invariants

1. The valid demo passes validation with zero blockers and compiles a non-empty, deterministic prompt; acceptance raises the durable-change reminder (§8/§11/§20).
2. Expected counts are re-derived from the fixture at runtime, never hardcoded, so the capstone cannot silently pass against a drifted fixture.

## Test Plan

### New/Modified Tests

1. `packages/server/src/demo-e2e.test.ts` — full demo loop integration (verification-only; no production logic).

### Commands

1. `npx vitest run packages/server/src/demo-e2e.test.ts`
2. `npm run lint && npm run typecheck && npm test`
3. The server e2e is the correct boundary (the loop spans create/validate/compile/accept/reminder HTTP surfaces); the bookkeeping edit is verified by the grep assertions in Acceptance Criteria #2.
