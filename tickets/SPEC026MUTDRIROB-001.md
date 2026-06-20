# SPEC026MUTDRIROB-001: Add assurance dependencies and Stryker dry-run configuration

**Status**: PENDING
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — adds root devDependencies (StrykerJS, `@vitest/coverage-v8`, fast-check), three Stryker pillar configs, a shared config factory, `scripts/robustness/` dry-run scripts, `package.json` mutation scripts, and `.gitignore` entries; no production behavior change.
**Deps**: None

## Problem

The three locked `@loom/core` pillars (P1 prose compiler, P2 ideation compiler, P3 validation engine) have no mutation-testing instrumentation — verified greenfield (no Stryker/fast-check in any package manifest, no coverage block in `vitest.config.ts`). Without a mutation toolchain there is no way to measure whether the existing suite would detect a plausible small defect (`>` vs `>=`, `&&` vs `||`, a negated optional-section condition, a swapped severity). This ticket lays the assurance-toolchain foundation that every Phase B/C/D pillar campaign and the Phase E gates build on. It changes no runtime behavior and ships no runtime dependency into `packages/core/src/**`.

## Assumption Reassessment (2026-06-20)

1. The pillar source globs the configs target exist at the cited paths: `packages/core/src/compiler/**/*.ts` (P1, minus ideation), `packages/core/src/compiler/ideation/**/*.ts` + `packages/core/src/compiler/sections/ideation.ts` (P2), `packages/core/src/validation/**/*.ts` (P3) — all confirmed present this session.
2. SPEC-026 §Approach + §Deliverables A1 and report §9 (`reports/prompt-and-validation-robustness-hardening.md`) define the exact tool versions, glob boundaries, and base-config constraints; `packages/core/tsconfig.test.json` (referenced by the base config's `tsconfigFile`) exists.
3. Cross-artifact boundary under audit: the `@loom/core` import-purity boundary (`eslint.config.js` `no-restricted-imports` + `packages/core/test/boundary.test.ts`). All new packages are **root devDependencies**; all configs/scripts live outside `packages/core/src/**`. No test-tool import may enter production core source.
4. FOUNDATIONS principle restated: §29.11 (quality/workflow) and the core-purity boundary — fast local `npm test` must stay unchanged and the import boundary must pass unmodified. This ticket adds assurance scaffolding only; it introduces no runtime doctrine.
5. Deterministic-compilation / secret-firewall surfaces (§8, §15): the configs *mutate* these surfaces in a sandbox but change no production source. Confirm `ignoreStatic` is not set, no global mutator exclusions are configured, the accurate TypeScript checker mode is used, and Stryker's sandbox (no in-place mutation) is preserved — none of which weakens the firewall or determinism.

## Architecture Check

1. A single shared `scripts/robustness/stryker-base.mjs` factory consumed by three thin pillar configs keeps mutation policy in one place; the configs differ only in `mutate` globs, report/cache paths, and thresholds. This is cleaner than three duplicated configs that would drift.
2. No backwards-compatibility aliases or shims introduced. All dependencies are root devDependencies; no production import path changes.

## Verification Layers

1. Core import boundary unbroken -> codebase grep-proof + `npm run lint` + `packages/core/test/boundary.test.ts` pass unchanged.
2. Each config mutates exactly its locked glob -> Stryker dry-run per pillar (`--dryRunOnly` equivalent) inspected for the mutated file set.
3. No runtime dependency entered shipped core -> grep `packages/core/package.json` `dependencies` unchanged; new deps appear only in root `package.json` `devDependencies`.
4. Default test loop unchanged -> `npm test` runs the same Vitest suite with no coverage/mutation side effects.

## What to Change

### 1. Root devDependencies (exact pins)

Add to root `package.json` `devDependencies`: `@stryker-mutator/core@9.6.1`, `@stryker-mutator/vitest-runner@9.6.1`, `@stryker-mutator/typescript-checker@9.6.1`, `@vitest/coverage-v8@4.1.9`, `fast-check@4.8.0`, `@fast-check/vitest@0.4.1`. Exact pins are intentional (mutation operator sets and generator behavior affect baselines); upgrades are explicit baseline-regeneration tickets. `package-lock.json` remains the install authority.

### 2. Shared base config + three pillar configs

`scripts/robustness/stryker-base.mjs` exports `createCoreMutationConfig({ mutate, name, thresholds })` equivalent to SPEC-026 §Approach: `testRunner: 'vitest'`, `vitest: { configFile: 'vitest.config.ts', dir: 'packages/core', related: true }`, `checkers: ['typescript']`, `tsconfigFile: 'packages/core/tsconfig.test.json'`, accurate checker mode, `clear-text`/`progress`/`html`/`json` reporters under `reports/mutation/${name}/`, `incremental: true`, `incrementalFile: '.cache/stryker/${name}.json'`, `cleanTempDir: 'always'`. Constraints: do **not** configure Vitest coverage inside Stryker; do **not** set `ignoreStatic: true`; do **not** set global excluded mutators; add no build command unless a dry run proves source tests run stale output. `stryker.prose.config.mjs`, `stryker.ideation.config.mjs`, `stryker.validation.config.mjs` call the factory with the globs below.

### 2a. Mutation globs

P1: `packages/core/src/compiler/**/*.ts`, `!packages/core/src/compiler/ideation/**/*.ts`, `!packages/core/src/compiler/sections/ideation.ts`. P2: `packages/core/src/compiler/ideation/**/*.ts`, `packages/core/src/compiler/sections/ideation.ts`. P3: `packages/core/src/validation/**/*.ts`.

### 3. Dry-run scripts + package scripts

`scripts/robustness/run-core-mutation.mjs` runs the three configs sequentially and returns non-zero if any fails. Add `package.json` scripts: `mutation:prose`, `mutation:ideation`, `mutation:validation` (each `stryker run <config>`), `mutation:core` (`node scripts/robustness/run-core-mutation.mjs`). No score gate yet — `thresholds.break` stays `null` until SPEC026MUTDRIROB-022.

### 4. Narrow ignores

Append to `.gitignore`: `coverage/`, `reports/mutation/`, `.stryker-tmp/`, `.cache/stryker/`. Do **not** ignore the whole `reports/` directory (it holds committed hand-off material).

## Files to Touch

- `package.json` (modify) — devDependencies + mutation scripts
- `package-lock.json` (modify) — install lock
- `.gitignore` (modify) — narrow generated-dir ignores
- `scripts/robustness/stryker-base.mjs` (new)
- `scripts/robustness/run-core-mutation.mjs` (new)
- `stryker.prose.config.mjs` (new)
- `stryker.ideation.config.mjs` (new)
- `stryker.validation.config.mjs` (new)

## Out of Scope

- Score gates / break floors (SPEC026MUTDRIROB-022).
- Vitest coverage config (SPEC026MUTDRIROB-002).
- The summarizer and baseline format (SPEC026MUTDRIROB-003).
- Any change to prompt text, diagnostic codes, schema, or `packages/core/src/version.ts`.
- Mutating `@loom/server` or `@loom/web`.

## Acceptance Criteria

### Tests That Must Pass

1. `npm run lint` and `npm run typecheck` pass unchanged (core import boundary intact).
2. `npm test` runs the existing Vitest suite with no coverage/mutation side effects.
3. `npm run mutation:prose -- --dryRunOnly` (and the ideation/validation equivalents) complete the dry run and report the mutated file set matching the locked glob, with no score gate.

### Invariants

1. No runtime dependency appears in `packages/core/package.json`; all six tools are root `devDependencies`.
2. `packages/core/test/boundary.test.ts` passes unchanged — no test-tool import in production core source.

## Test Plan

### New/Modified Tests

1. `None — tooling-foundation ticket; verification is dry-run + boundary/lint commands. Existing boundary and lint coverage named in Assumption Reassessment guards the import surface.`

### Commands

1. `npm run mutation:prose -- --dryRunOnly` (repeat for `mutation:ideation`, `mutation:validation`) — confirm mutated file set equals the locked glob.
2. `npm run lint && npm run typecheck && npm test` — full default pipeline unchanged.
3. A dry-run-only boundary is correct here: no mutants are scored until SPEC026MUTDRIROB-022; this ticket only proves the configs resolve and target the right files.
