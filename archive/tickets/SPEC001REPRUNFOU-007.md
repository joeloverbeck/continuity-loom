# SPEC001REPRUNFOU-007: Phase-1 gate verification (capstone)

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: None — verification-only; exercises 001–006 end-to-end and adds no production logic
**Deps**: SPEC001REPRUNFOU-005, SPEC001REPRUNFOU-006

## Problem

Phase 1 is defined by its gate. This capstone ticket exercises the §Verification section end-to-end: the boundary test, the server smoke test, `typecheck`/`lint`/`build` green for every package, all five scripts present and passing, and a manual launch runbook confirming the browser shows health/version. It introduces no new production logic; it proves the pipeline the earlier tickets composed.

## Assumption Reassessment (2026-06-05)

1. By this point 001–006 have landed: boundary test (002), server smoke test (003), web component test (004), settings test (005), launch path (006). This ticket only aggregates and adds the manual launch check; it grep-verifies the prior surfaces exist rather than re-implementing them. `Deps: 005, 006` is the leaf set whose transitive `Deps` cover the full chain (005→003→002→001; 006→001,003,004→002).
2. `archive/specs/SPEC-001-repository-and-runtime-foundation.md` §Verification / §Done Means enumerate the gate: boundary test, server smoke test, build/typecheck/lint green, manual launch check showing health/version; `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` Phase 1 gate lists the five gate bullets.
3. Shared boundary under audit: the full Phase-1 pipeline (core boundary → server API → web shell → launch). Each gate bullet maps to a distinct proof surface; they are not collapsed into one generic "it works" check.

## Architecture Check

1. A single trailing verification ticket gives reviewers one place to confirm the gate holds coherently, rather than trusting that per-package green implies end-to-end green. It re-derives expected results from live runs, not hardcoded counts.
2. No backwards-compatibility aliasing/shims; no production logic added.

## Verification Layers

1. Core boundary holds -> codebase grep-proof: `npm run test --workspace @loom/core` (boundary test green).
2. Server contracts hold -> schema validation: `npm run test --workspace @loom/server` (health/version/loopback).
3. All packages typecheck/lint/build -> codebase grep-proof: `npm run typecheck && npm run lint && npm run build` exit 0.
4. Manual launch gate -> manual review (dry-run runbook): `npm start` opens/points to the placeholder showing health/version on loopback.

## What to Change

### 1. Manual launch runbook (dry-run)

Document, in this ticket, the implementer-followed steps: run `npm install`; `npm run build`; `npm start`; open the printed URL; confirm the placeholder shows the app name + health (`ok`) + version; confirm loopback bind; stop; run `npm run dev` and confirm HMR + `/api` proxy. On WSL2, opening the printed URL manually counts as a pass (auto-open is best-effort).

### 2. Aggregate CI assertions

Add an optional end-to-end smoke that boots the launch and hits `/api/health` + `/api/version` on one port, and confirm the five scripts (`dev`/`build`/`typecheck`/`lint`/`test`) exist in the root `package.json` with the non-interactive four exiting 0 across all workspaces. The e2e smoke must not duplicate 002/003 unit coverage.

## Files to Touch

- `packages/server/src/gate.e2e.test.ts` (new) — optional end-to-end smoke (boot launch, one-port `/api/health` + `/api/version`); the manual launch runbook lives in this ticket body, not in a file.

## Out of Scope

- Any new production logic (all owned by 001–006).
- Requirements-doc updates (008).

## Acceptance Criteria

### Tests That Must Pass

1. `npm run typecheck && npm run lint && npm test && npm run build` all exit 0 across workspaces.
2. `npm run test --workspace @loom/core` and `--workspace @loom/server` pass (boundary + smoke).
3. Manual runbook: `npm start` shows the placeholder with health/version on loopback; `npm run dev` shows HMR + `/api` proxy.

### Invariants

1. All five scripts (`dev`/`build`/`typecheck`/`lint`/`test`) exist and the non-interactive four pass.
2. The gate is satisfied by the printed-URL + manual-open path on WSL2 (auto-open is not required).

## Test Plan

### New/Modified Tests

1. `packages/server/src/gate.e2e.test.ts` — optional end-to-end smoke (boot launch, hit `/api/health` + `/api/version` on one port); does not duplicate 002/003 unit coverage.

### Commands

1. `npm run typecheck && npm run lint && npm test && npm run build`
2. `npm start` (manual runbook per What to Change)

## Outcome

Added `packages/server/src/gate.e2e.test.ts` to verify the required root
scripts and the one-origin launch path for built assets, `/api/health`, and
`/api/version`. Verified the Phase 1 gate with `npm run test --workspace
@loom/server`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`,
and `git diff --check`. The production launch path was also smoke-tested during
SPEC001REPRUNFOU-006 with `node packages/server/dist/launch.js --port 0
--no-open`, confirming the printed loopback URL served the built page and API.
