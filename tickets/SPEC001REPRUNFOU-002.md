# SPEC001REPRUNFOU-002: `@loom/core` pure domain layer and boundary enforcement

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `packages/core` (`@loom/core`); ESLint `no-restricted-imports` boundary rule; Vitest boundary test
**Deps**: SPEC001REPRUNFOU-001

## Problem

The constitutional payoff of Phase 1 is a deterministic domain core that is *provably* isolated from HTTP and UI from day one, so the future validator/compiler can be tested without a server or browser. This ticket creates `@loom/core` as a pure TypeScript package and enforces its no-I/O boundary with two independent layers (lint rule + boundary test) on top of the workspace-graph layer from 001.

## Assumption Reassessment (2026-06-05)

1. `packages/core` does not exist yet (001 creates only the workspace root). `@loom/core` is net-new. This ticket modifies `eslint.config.js` (created `(new)` by 001 in this batch) to add the core-scoped boundary override — hence the explicit `Deps: 001`.
2. `specs/SPEC-001-repository-and-runtime-foundation.md` §`packages/core` requires the boundary to forbid the **entire `node:*` namespace** (not a partial blocklist) plus `fastify`, `react`, `vite`; §Boundary enforcement lists the three layers (workspace graph, lint rule, boundary test). `docs/requirements-version-1/TESTING-STRATEGY.md` ("the domain core should be testable without the UI and without network") is the testability authority.
3. Shared boundary under audit: the `core → (nothing internal; no I/O)` edge. This ticket owns layers 2–3 of its enforcement; layer 1 (workspace graph) is 001.
4. FOUNDATIONS principle motivating: §4.4 / §8 deterministic compilation — the compiler must be a deterministic renderer with no I/O and no LLM intermediary. A pure core is the structural precondition. Restated before trusting the spec narrative.
5. Deterministic-compilation enforcement surface: the boundary test is the gate. It must match `node:*` by **namespace prefix**, not an enumerated list, so an I/O module nobody blocklisted (`node:fs/promises`, `node:child_process`) cannot silently re-enter. No secret-firewall surface is touched yet (§15 N/A — no POV/secret handling in Phase 1); determinism is *enabled*, not weakened.

## Architecture Check

1. Two enforcement layers (lint + test) over one (lint alone): a forbidden import fails CI via the boundary test even if a contributor disables the lint rule inline. Namespace-prefix matching over an enumerated denylist closes the "forgot to list `node:fs/promises`" gap structurally.
2. No backwards-compatibility aliasing/shims — net-new package.

## Verification Layers

1. Core imports no `node:*` builtin -> codebase grep-proof: the boundary test scans `core/src/**` for `from 'node:` / `require('node:` and fails on any match.
2. Core imports no framework -> codebase grep-proof: same test asserts no `fastify`/`react`/`vite` import.
3. Lint rule active -> skill dry-run / manual review: `npm run lint` flags a deliberately-added `import 'node:fs'` in `core/src` (negative test in Test Plan).
4. `versionInfo` type compiles and is exported -> schema validation / typecheck: `tsc -b` green and the type is importable by `server`/`web`.

## What to Change

### 1. `@loom/core` package

`packages/core/package.json` (name `@loom/core`, `"type": "module"`, no internal deps), `tsconfig.json` extending `../../tsconfig.base.json`. `src/index.ts` re-exports a `versionInfo` type (app/template/compiler version metadata) and any pure helper the stub `/api/version` payload needs.

### 2. Boundary lint rule

ESLint override scoped to `packages/core/**` using `no-restricted-imports` with a `patterns` entry matching `node:*` plus path entries for `fastify`, `react`, `vite`. A pure builtin is re-allowed only by explicit exception.

### 3. Boundary test

`packages/core/src/boundary.test.ts` (Vitest) reads every `.ts` under `core/src` and asserts no `node:*`-prefixed or framework import is present.

## Files to Touch

- `packages/core/package.json` (new)
- `packages/core/tsconfig.json` (new)
- `packages/core/src/index.ts` (new)
- `packages/core/src/version.ts` (new)
- `packages/core/src/boundary.test.ts` (new)
- `eslint.config.js` (modify) — add the `core`-scoped `no-restricted-imports` override (file created `(new)` by 001; Deps:001)

## Out of Scope

- HTTP server, endpoints, transport (003).
- Real record schemas / validation / compiler logic (Phases 3/6/7).
- Any `node:*` usage in `core` (permanently forbidden).

## Acceptance Criteria

### Tests That Must Pass

1. `npm run test --workspace @loom/core` — boundary test passes on a clean tree.
2. Negative: adding `import 'node:fs'` to a `core/src` file makes both `npm run lint` and the boundary test fail.
3. `npm run typecheck --workspace @loom/core` green; `versionInfo` exported.

### Invariants

1. `core` has zero internal dependencies and zero `node:*`/framework imports.
2. The boundary test matches `node:*` by prefix, not an enumerated module list.

## Test Plan

### New/Modified Tests

1. `packages/core/src/boundary.test.ts` — asserts no forbidden imports in the core tree (the CI backstop to the lint rule).

### Commands

1. `npm run lint --workspace @loom/core && npm run test --workspace @loom/core`
2. `npm run typecheck --workspace @loom/core`
