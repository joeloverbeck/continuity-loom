# Robustness Testing

Status: active reference — development-assurance policy for compiler and validation robustness evidence
Authority: development-assurance (see docs/ACTIVE-DOCS.md)

This document owns the operational policy for mutation testing, scoped coverage,
property tests, metamorphic tests, and focused goldens used to harden the four
locked `@loom/core` pillars. It is subordinate to `docs/principles/FOUNDATIONS.md` and the
domain contracts named in `docs/ACTIVE-DOCS.md`.

This document does not define prompt text, validation behavior, diagnostic
semantics, record schema, OpenRouter behavior, accepted-prose behavior, or
contract versions. When assurance policy and product behavior appear to
conflict, the product authority wins and this document must be corrected.

## Enrolled Scopes

P1 prose compiler:

- `packages/core/src/compiler/**/*.ts`
- excluding `packages/core/src/compiler/ideation/**/*.ts`
- excluding `packages/core/src/compiler/sections/ideation.ts`
- excluding `packages/core/src/compiler/reconciliation/**/*.ts`
- excluding `packages/core/src/compiler/change-review/**/*.ts`
- excluding `packages/core/src/compiler/accepted-segment-echo.ts`

P2 ideation compiler:

- `packages/core/src/compiler/ideation/**/*.ts`
- `packages/core/src/compiler/sections/ideation.ts`

P3 accepted-segment assistance compilers and parsers:

- `packages/core/src/compiler/reconciliation/**/*.ts`
- `packages/core/src/compiler/change-review/**/*.ts`
- `packages/core/src/compiler/accepted-segment-echo.ts`

P4 validation engine:

- `packages/core/src/validation/**/*.ts`

Root robustness tooling lives under `scripts/robustness/`, `tools/robustness/`,
the four `stryker.*.config.mjs` files, and dedicated CI workflows/jobs.

## Commands And Versions

Exact-pinned root devDependency versions:

- `@stryker-mutator/core`: `9.6.1`
- `@stryker-mutator/vitest-runner`: `9.6.1`
- `@stryker-mutator/typescript-checker`: `9.6.1`
- `@vitest/coverage-v8`: `4.1.9`
- `fast-check`: `4.8.0`
- `@fast-check/vitest`: `0.4.1`

Commands:

- `npm run test:coverage:core` runs scoped V8 coverage for compiler and validation sources.
- `npm run mutation:prose` runs the P1 Stryker config.
- `npm run mutation:ideation` runs the P2 Stryker config.
- `npm run mutation:segment-reconciliation` runs the P3 Stryker config.
- `npm run mutation:validation` runs the P4 Stryker config.
- `npm run mutation:core` runs the four pillar mutation configs sequentially.
- `npm run mutation:gate -- <mutation.json> [floor|null]` summarizes Stryker JSON into compact counts and gate decisions.

Default `npm test` remains coverage-free and mutation-free.

## Coverage Floors

Coverage is a reachability floor, not assertion-strength proof. Mutation score
is the adequacy anchor.

The scoped V8 coverage gate is disabled by default in `vitest.config.ts` and
enabled only by `npm run test:coverage:core` or the `core-coverage` CI job.
Configured floors:

- global lines/statements/functions: `95`
- global branches: `90`
- `packages/core/src/validation/**` lines/statements/functions: `97`
- `packages/core/src/validation/**` branches: `95`

`autoUpdate` must remain `false`.

## Mutation Floors

Break floors activate only after all baseline survivors across P1, P2, P3, and P4
have been reviewed and classified.

Configured final floors:

- P1 prose compiler: green `95`, warning `92`, break `90`
- P2 ideation compiler: green `95`, warning `92`, break `90`
- P3 accepted-segment assistance compilers and parsers: green `95`, warning `92`, break `90`
- P4 validation engine: green `98`, warning `96`, break `95`

Until activation, `thresholds.break` remains `null` and mutation output is
advisory.

## Changed-Source Rule

Ordinary PRs do not run the full mutation matrix. Changed locked-pillar source
must still be mutation-gated:

- changed P1/P2/P3/P4 source forces mutation of each changed source file;
- changed source for a pre-activation pillar with no reviewed baseline and
  `thresholds.break: null` reports and defers that pillar's changed-source
  mutation to the scheduled/manual robustness workflow instead of failing the PR
  inline; the accepted-segment assistance pillar, including Segment Reconciliation and the non-user-facing candidate Accepted-Segment Change Review candidate, is currently pre-activation;
- Stryker, Vitest, TypeScript, package manifest, lockfile, robustness script, or
  test-support generator changes are full-campaign triggers, but the PR
  changed-file job reports and defers those full campaigns to the scheduled or
  manual robustness workflow instead of running them inline;
- cache misses fall back to real forced-scope mutation work, never a skipped
  status;
- out-of-scope changes report an explicit no-op status.

### P3 Compact Catalog Assurance

Changes to `packages/core/src/compiler/reconciliation/schema-catalog.ts` remain
P3 changed-source work. The compact Segment Reconciliation catalog has two
locked regression dimensions:

- semantic coverage compares registry order and every compact field path,
  required/optional/default state, schema shape, reference marker, lifecycle
  marker, and repository-managed/forbidden marker, with synthetic boolean,
  number, literal, union, nested-object, default, escaping, and unsupported-
  constraint probes; and
- size coverage compiles the reproducible zero-record fixture, measures the
  complete catalog section in UTF-16 code units, enforces the `136328` baseline
  maximum of `68164`, and locks the current measured ceiling at `18696`.

The local payload parsers remain the behavior authority after reference-token
resolution. Catalog coverage does not replace parser, golden, route, or
component regressions. While P3 remains pre-activation, the changed-source
mutation command reports and defers this source to the scheduled/manual
workflow exactly as described above; it must not invent an inline break floor.

### P3 Accepted-Segment Change Review Candidate Assurance

Changes under `packages/core/src/compiler/change-review/` and the shared accepted-segment echo helper are P3 changed-source work. Candidate evidence must include the eight synthetic gold scenarios, strict shallow-envelope and six-dimension coverage mutations, whole-response quarantine cases, deterministic record-permutation properties, selected-only consumed-guidance properties, server reconstruction/freshness/zero-write tests, unmounted component state/action/a11y tests, and real-browser candidate-harness proof. Candidate tests do not activate production identity or establish a mutation-score baseline; P3 remains pre-activation and follows the same scheduled/manual deferral rule.

## Cadence

PR cadence:

- run lint, typecheck, default tests, build, scoped coverage, and changed-file
  mutation when changed locked-pillar source is in scope;
- for full-campaign triggers, the PR job must finish quickly with an explicit
  deferred-full-campaign status rather than occupying ordinary PR latency;
- keep the full mutation matrix out of ordinary PR latency.

Scheduled/manual cadence:

- run the uncached full P1/P2/P3/P4 matrix on a schedule and through
  `workflow_dispatch`;
- use `--force` for scheduled score-of-record runs;
- record seed and summary data in job output and short-lived artifacts.

## Baseline And Ratchet

`tools/robustness/mutation-baseline.json` is the compact baseline of record.
Stryker incremental reports, HTML reports, and raw mutation output are generated
artifacts and are not committed.

The baseline records:

- tool versions;
- pillar;
- status totals;
- reviewed score;
- reviewed ignored count;
- timestamp;
- establishing commit;
- optional classifying ticket.

After activation, the ratchet floor is:

```text
max(configured break floor, reviewed baseline rounded down)
```

The ratchet must not decrease automatically. Lowering it requires an explicit
baseline-change ticket that explains the reason and evidence.

## Survivor Classifications

Every non-killed or non-actionable mutant in the reviewed baseline must be
classified as one of:

- test gap;
- equivalent mutant;
- product defect;
- contract ambiguity;
- NoCoverage;
- Timeout;
- tool error.

Product defects and contract ambiguities stop the campaign and become behavior
or contract work before the baseline is accepted.

## Equivalent-Mutant Rules

Equivalent-mutant handling must stay narrow:

- prefer adding a meaningful test before declaring equivalence;
- document the exact mutant, location, reason, and reviewing ticket;
- do not add global mutator exclusions;
- do not set `ignoreStatic: true`;
- keep disables local to the smallest proven equivalent case.

## Seed And Replay Policy

Property and metamorphic tests must record replay information when they fail.

- PR runs use a fixed seed unless a test explicitly owns another deterministic seed.
- Scheduled runs may rotate seeds.
- Failing property runs must report enough `FC_SEED` and `FC_PATH` information to replay.
- A replay that exposes a behavior defect becomes a normal implementation ticket, not a suppressed test.

## Artifacts

Core mutation sandboxes exclude the root `.agents/` and `reports/` trees.
Those repository-workflow and evidence surfaces are not inputs to `@loom/core`
tests and may contain directory symlinks that cannot be copied as ordinary
files. This sandbox-copy boundary does not change enrolled mutation sources,
test selection, thresholds, or mutation-report output.

Committed artifacts:

- focused tests and fixtures;
- `tools/robustness/mutation-baseline.json`;
- operational docs and CI workflow definitions.

Generated artifacts:

- `coverage/`;
- `reports/mutation/`;
- `.stryker-tmp/`;
- `.cache/stryker/`;
- Stryker HTML/JSON run output.

Generated artifacts stay local or CI-internal. Do not upload results to an
external dashboard by default.

## Behavior-Defect Escalation

If mutation, property, metamorphic, golden, or coverage work reveals a runtime
behavior defect, do not hide it by changing thresholds or weakening tests.

Classify the defect, open or update the owning ticket/spec, and fix the product
behavior under the relevant domain authority. Contract-version changes,
diagnostic changes, prompt text changes, schema changes, OpenRouter behavior, and
accepted-prose behavior remain outside this document's authority.

## Queued Secondary-Tier Hardening

SPEC-026 deliberately defers the report's secondary criticality audit to future
spec work. These items are queued scope, not automatically revived backlog, and
each must become its own future spec before implementation begins.

Recommended order:

1. Snapshot/reference integrity first: harden `packages/server/src/snapshot-builder.ts`
   and adjacent working-set/reference assembly seams. This is the choke point
   from persisted project state into the validation and compilation snapshot, so
   future work should cover archive filtering, selected-record resolution,
   project indexes, dangling-state fail-closed behavior, and clean
   snapshot-then-compile contracts.
2. Server security envelope next: harden selected localhost API and OpenRouter
   request/error/model helper seams, focusing on pure request builders,
   provider-error classifiers, secret discipline, and simulated transport
   failure handling before any broad integration campaign.
3. SQLite/project durability next: harden local-first persistence, including
   project storage/store behavior, record tables, migrations, recoverability,
   transaction/fault-injection behavior, close/reopen invariants, and narrowly
   scoped mutation for pure decision helpers.
4. Record identity and normalization support: harden `uuidv7.ts` and core
   normalization helpers with fixed vectors, injected time/randomness,
   uniqueness, version/variant, monotonic-ordering, and reference-preservation
   properties.

Compiler fingerprint and token-estimate robustness are not queued here because
they are already part of the P1 compiler scope.
