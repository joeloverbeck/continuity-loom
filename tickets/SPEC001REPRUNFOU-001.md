# SPEC001REPRUNFOU-001: Workspace root, baseline tooling, and Node pin

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — introduces the monorepo root: `package.json` (npm workspaces), `tsconfig.base.json`, ESLint flat config, Prettier, Vitest, `.nvmrc`
**Deps**: None

## Problem

Continuity Loom has no runtime skeleton yet. Every later phase (storage, data model, validation, compiler, transport) needs a stable, correctly-layered home with strict TypeScript, ESM, and a deterministic test/lint toolchain. This ticket establishes the workspace root and shared tooling that the three packages (`core`, `server`, `web`) attach to, and pins the Node runtime so the named version-mismatch failure mode is guarded rather than only warned about.

## Assumption Reassessment (2026-06-05)

1. The repo currently has no root `package.json`, `tsconfig.base.json`, `.nvmrc`, or `packages/` directory (repo root holds only `.claude`, `docs`, `specs`, `tickets`, `reports`, `archive`, `README.md`, `LICENSE`, `.gitignore`). All paths in this ticket are net-new; none collide.
2. `specs/SPEC-001-repository-and-runtime-foundation.md` §Architecture and §Recommended stack fix the Phase-1 sub-tooling: npm workspaces, TypeScript strict + ESM, Vitest, ESLint flat config + Prettier; §Scope and §Done Means require `engines.node >= 24` + `.nvmrc`. `docs/requirements-version-1/TECHNOLOGY-DECISIONS.md` confirms Node 24 LTS + TypeScript baseline.
3. Shared boundary under audit: the **one-way dependency direction** (`web→core`, `server→core`, `core→nothing internal`). The root workspace graph is layer 1 of the three-layer boundary enforcement; this ticket sets up the workspace glob so the package manager can enforce it, but the lint rule + boundary test (layers 2–3) land in SPEC001REPRUNFOU-002 against `core`.
4. FOUNDATIONS principle motivating the multi-package split: §4.4 / §8 deterministic compilation — hard module boundaries make the future deterministic core *structurally* unable to import I/O, not merely advised to avoid it. This ticket creates the structural substrate; it adds no enforcement logic itself.

## Architecture Check

1. npm workspaces (bundled with Node 24) over a single package with directory conventions: hard package boundaries make core isolation structural and add zero extra tooling ("boring where correctness matters"). `tsconfig.base.json` + per-package `tsconfig.json` extending it gives strict settings without a central project-references file every package ticket would have to edit.
2. No backwards-compatibility aliasing or shims are introduced — this is greenfield; there is no prior layout to alias.

## Verification Layers

1. Workspace resolves all packages -> codebase grep-proof: `npm ls --workspaces` lists `packages/*` once they exist; root scripts fan out with `--workspaces --if-present`.
2. Strict TypeScript is on -> manual review of `tsconfig.base.json` (`"strict": true`, ESM-appropriate `module`/`moduleResolution`, `"type": "module"` in root `package.json`).
3. Node pin holds -> codebase grep-proof: `.nvmrc` contains a Node-24 line and root `package.json` has `"engines": { "node": ">=24" }`.
4. Single-tool-config ticket: lint/test here only assert config validity (no package source yet to lint), so deeper invariants (boundary enforcement) are deferred to 002 by design.

## What to Change

### 1. Root `package.json`

Private root with `"type": "module"`, `"workspaces": ["packages/*"]`, `"engines": { "node": ">=24" }`, and scripts `typecheck`, `lint`, `test` that fan out across workspaces (`--workspaces --if-present`). `dev`/`build`/`start` are added by SPEC001REPRUNFOU-006 once the packages exist.

### 2. Shared TypeScript config

`tsconfig.base.json`: strict mode, ESM module/resolution, `composite` enabled for project references. Each package's own `tsconfig.json` (added in its ticket) extends this.

### 3. Lint / format / test tooling

ESLint flat config (`eslint.config.js`) + Prettier config at root with TypeScript strict integration; Vitest config. The core-scoped `no-restricted-imports` rule is NOT added here — it lands in 002 against the `core` source.

### 4. Node pin + ignores

`.nvmrc` (Node 24 LTS). Extend `.gitignore` for `node_modules/`, `dist/`, and build artifacts.

## Files to Touch

- `package.json` (new)
- `tsconfig.base.json` (new)
- `eslint.config.js` (new)
- `.prettierrc` (new)
- `vitest.config.ts` (new)
- `.nvmrc` (new)
- `.gitignore` (modify)

## Out of Scope

- Any `packages/*` source (002–004).
- `dev`/`build`/`start` launch scripts and browser open (006).
- The core boundary lint rule + boundary test (002).
- Desktop packaging, storage, secrets, transport (spec §Non-goals).

## Acceptance Criteria

### Tests That Must Pass

1. `npm install` succeeds at the root with the `workspaces` field present (an empty `packages/*` set is acceptable pre-002).
2. `cat .nvmrc` shows Node 24; `npm pkg get engines.node` returns `>=24`.
3. `npm run lint --if-present` and `npm run test --if-present` exit 0 with no packages (no-op fan-out is green).

### Invariants

1. Root `package.json` is private and declares `packages/*` as the only workspace glob.
2. `tsconfig.base.json` has `"strict": true`; no package may override it to false.

## Test Plan

### New/Modified Tests

1. `None — scaffold ticket; verification is command-based and package-level tests arrive in 002–004.`

### Commands

1. `npm install && npm run typecheck --if-present`
2. `cat .nvmrc && npm pkg get engines.node workspaces`
