# TESTTSGATE-001: Bring packages/core/test/ under the strict TypeScript gate

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: None — tooling only (tsconfig layout, `typecheck` script, `eslint.config.js` project service). No runtime, schema, compiler, or validation behavior changes.
**Deps**: None

## Problem

Test files in `packages/core/test/` receive **no strict TypeScript checking** from any CI gate:

- `npm run typecheck` runs `tsc -p packages/core/tsconfig.json --noEmit`, and that config's `include` is `["src/**/*.ts"]` only — `test/` is never type-checked.
- `npm run lint` type-checks `test/` files under ESLint's **non-strict default inferred project**, because `eslint.config.js` lists `packages/*/test/*.ts` in `parserOptions.projectService.allowDefaultProject` and no tsconfig includes those files. Under the non-strict default project, `strictNullChecks` is off.

This produced a confusing CI lint failure (PR #27): legitimate `generation_validation_focus!` non-null assertions on an **optional** field (`generationSessionSchema`, `generation-brief.ts:167`) read as no-ops under the non-strict project and tripped `@typescript-eslint/no-unnecessary-type-assertion`. The hotfix (commit `89461d1`) removed the assertions to unblock CI, but that only papered over the gap: the same file still carries strict-mode type errors that **no CI gate catches**, e.g. in `packages/core/test/validation-taxonomy-capstone.test.ts`:

- Line ~40: `manual_moment_directive = { must_render: [] }` omits the required `may_render_if_naturally_caused` and `do_not_force` (per the readiness schema, `generation-brief-readiness.ts:70-71`).
- Lines ~73/~78: a record literal supplies `metadata: { displayLabel: ... }` but the record metadata type requires `id`, `type`, `createdAt`, `updatedAt`, `archived` (and the now-removed `!` assertions are genuinely needed under strict).

The goal is to close the gap so `test/` files are type-checked under the project's standard strict config (`tsconfig.base.json`, `strict: true`) by both `typecheck` and `lint`, and to fix the strict errors that surfacing the gap reveals.

## Assumption Reassessment (2026-06-07)

1. `packages/core/tsconfig.json` `include` is `["src/**/*.ts"]` (verified); it extends `tsconfig.base.json` whose `strict: true` (verified). The build script `tsc -p tsconfig.json` **emits** to dist, so `test/` must NOT be added to this config — doing so would emit test files and pull test-only imports (`vitest`) into the published build. A separate strict, `noEmit` config is required.
2. `eslint.config.js:39-45` `allowDefaultProject` includes `"packages/*/test/*.ts"` and `"packages/*/src/*.test.ts"`. The `test/` glob is the cause: matched files fall back to the non-strict default project. `src/demo/stress-coverage.test.ts` is in `src/**` (covered by the strict tsconfig) and is correctly linted strict — confirming the diagnosis by contrast.
3. Shared boundary under audit: the set of TS projects ESLint `projectService` resolves files against, and the `typecheck` script's project coverage. Both must include `test/` under a strict config, and the ESLint `allowDefaultProject` `test/` glob must be dropped so the rule engine uses the real strict project rather than the inferred one.
4. Adjacent contradictions classification: the strict errors already present in `validation-taxonomy-capstone.test.ts` (and any others surfaced across the ~35 `test/` files) are **required consequences** of this ticket — they exist today, are simply invisible to CI, and must be fixed for the strict gate to pass. They are not separate bugs deferred elsewhere.
5. No FOUNDATIONS principle governs lint/typecheck project layout; this is dev-tooling. The `@loom/core` purity boundary (enforced by `no-restricted-imports` in `eslint.config.js:57-85` and the boundary test) is scoped to `packages/core/src/**` and is unaffected — this ticket does not touch that rule's `files` glob.

## Architecture Check

1. A dedicated strict `noEmit` config (e.g. `packages/core/tsconfig.test.json` extending `tsconfig.base.json`, including `src` + `test`) keeps the emit-producing build config (`tsconfig.json`) clean while giving both `typecheck` and ESLint a single strict project for test files. This is cleaner than the alternative of toggling `strict` per-rule or sprinkling `eslint-disable`, which would hide real type errors and fragment the typing standard.
2. No backwards-compatibility aliasing or shims introduced. The `allowDefaultProject` `test/` glob is removed outright, not aliased; there is no second lawful typing path left for `test/` files after the change.

## Verification Layers

1. Invariant: every `packages/core/test/*.ts` file resolves to a strict TS project under ESLint -> codebase grep-proof (`allowDefaultProject` no longer contains a `test/` glob) + skill dry-run (`npm run lint` exits 0 with the test config present).
2. Invariant: `test/` files are strict-type-checked by the `typecheck` gate -> skill dry-run (`npm run typecheck` covers the new test config and exits 0).
3. Invariant: the previously-hidden strict errors are fixed, not re-suppressed -> manual review (no new `eslint-disable`/`@ts-expect-error`/`!`-removal that drops real type signal; the `must_render`/`metadata` literals are completed to their full schema shape).
4. Invariant: the build output is unchanged (no test files emitted to dist) -> codebase grep-proof (`tsconfig.json` `include` still `["src/**/*.ts"]`; `dist/` contains no `test/` artifacts after `npm run build`).

## What to Change

### 1. Strict, no-emit TS config covering test files

Add `packages/core/tsconfig.test.json` extending `tsconfig.base.json`, `"noEmit": true`, `include` covering `src/**/*.ts` and `test/**/*.ts` (and `*.test.ts`). Do not modify `packages/core/tsconfig.json`'s `include`.

### 2. Wire the test config into the typecheck gate

Update `packages/core/package.json` `typecheck` so it type-checks the new config in addition to the build config (e.g. `tsc -p tsconfig.json --noEmit && tsc -p tsconfig.test.json`). Confirm `npm run typecheck` at the root still aggregates via `scripts/run-workspaces-if-present.mjs`.

### 3. Register the strict project with ESLint and drop the default-project fallback

In `eslint.config.js`, remove `"packages/*/test/*.ts"` from `allowDefaultProject` so `projectService` resolves test files against the new strict project. Verify the `projectService` picks up `tsconfig.test.json` (add it to `projectService` config if required by the resolver).

### 4. Fix the strict errors surfaced

Resolve every strict error the new gate reports across `packages/core/test/`. Known sites in `validation-taxonomy-capstone.test.ts`: complete the `manual_moment_directive` literal (`may_render_if_naturally_caused`, `do_not_force`), complete the record `metadata` literals (`id`, `type`, `createdAt`, `updatedAt`, `archived`), and restore the `generation_validation_focus!` assertions now that strict checking makes them necessary. Sweep for any other files with the same latent issues.

## Files to Touch

- `packages/core/tsconfig.test.json` (new)
- `packages/core/package.json` (modify — `typecheck` script)
- `eslint.config.js` (modify — `allowDefaultProject`, `projectService`)
- `packages/core/test/validation-taxonomy-capstone.test.ts` (modify — strict fixes)
- Additional `packages/core/test/*.ts` files (modify — only those the strict gate flags)

## Out of Scope

- Any runtime, schema, compiler, validation-rule, or prompt behavior change.
- Strict-checking `packages/server/test` or `packages/web` test files (note `packages/server/src/*.test.ts` is deliberately `disableTypeChecked` in `eslint.config.js:52-55`); this ticket is scoped to `@loom/core` test files. A follow-up may extend the pattern.
- Changing the `@loom/core` import-boundary rule or its `files` glob.

## Acceptance Criteria

### Tests That Must Pass

1. `npm run lint` exits 0 with no `no-unnecessary-type-assertion` (or other) errors on `packages/core/test/**`.
2. `npm run typecheck` exits 0 and demonstrably covers `packages/core/test/**` (e.g. introducing a deliberate `const x: string = 1` in a test file fails the gate before being reverted).
3. `npm test` — full suite (currently 571 tests) still passes; runtime behavior of tests is unchanged.

### Invariants

1. No `packages/core/test/*.ts` file resolves to ESLint's non-strict default project (`allowDefaultProject` carries no `test/` glob).
2. `packages/core/tsconfig.json` `include` remains `["src/**/*.ts"]`; `npm run build` emits no `test/` artifacts to `packages/core/dist/`.

## Test Plan

### New/Modified Tests

1. `None — tooling ticket; verification is command-based.` The proof that test files are now strict-checked is the `typecheck`/`lint` gate covering them (Acceptance Criteria 1-2), plus the strict fixes in existing `test/*.ts` files. Existing pipeline coverage (96 test files / 571 tests) confirms no runtime regression.

### Commands

1. `npm run lint` (targeted: confirms the lint gate is green under the strict project)
2. `npm run typecheck` (targeted: confirms test files are strict-checked)
3. `npm test` (full-pipeline: confirms no runtime regression)
4. `npm run build && ls packages/core/dist | grep -i test || echo "no test artifacts (correct)"` (confirms the build config still excludes test files)

## Outcome

Completed: 2026-06-07

What changed:

- Added a strict no-emit `packages/core/tsconfig.test.json` covering `packages/core/src/**/*.ts`, `packages/core/test/**/*.ts`, and `packages/core/src/**/*.test.ts`.
- Added `packages/core/test/tsconfig.json` so ESLint project service resolves `packages/core/test/**` against the strict test project instead of the inferred default project.
- Updated `@loom/core` `typecheck` to run both the build config and the strict test config.
- Removed the `packages/*/test/*.ts` ESLint `allowDefaultProject` fallback.
- Fixed the strict TypeScript errors surfaced across core test fixtures without runtime behavior changes.

Deviations from original plan:

- ESLint project service did not discover `packages/core/tsconfig.test.json` by filename, so a small nested `packages/core/test/tsconfig.json` was required to bind test files to the strict project.
- The no-emit test config disables inherited composite/declaration output to avoid leaving `dist/tsconfig.test.tsbuildinfo`.

Verification:

- `npm run lint` passed.
- `npm run typecheck` passed and runs `tsc -p tsconfig.test.json` for `@loom/core`.
- `npm test` passed: 96 files, 571 tests.
- `npm run build` passed; Vite reported only the existing chunk-size warning.
- Artifact checks found no `packages/core/dist/test/**` files and no root `packages/core/dist/*tsconfig.test*` artifact.
- Grep-proof confirmed `eslint.config.js` no longer contains the `packages/*/test/*.ts` default-project fallback and `packages/core/tsconfig.json` still includes only `["src/**/*.ts"]`.
