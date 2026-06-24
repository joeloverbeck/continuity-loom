# MUTP3WIRE-001: Wire P3 segment-reconciliation into changed-file mutation scope and defer it while pre-activation

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: None — dev-assurance tooling and policy only (`scripts/robustness/mutation-scope.mjs`, `stryker.prose.config.mjs`, `.github/workflows/robustness.yml`, `docs/robustness-testing.md`). No product runtime, compiler, validation, or prompt behavior changes.
**Deps**: None

> **Namespace note**: No existing ticket prefix (scanned `tickets/` + `archive/tickets/`) covers robustness mutation-scope wiring; `SPEC026MUTDRIROB-*` is the archived SPEC-026 decomposition, not an active family. Derived a fresh `MUTP3WIRE` prefix starting at `-001`. Single ticket — collapse/rename before implementation if you prefer to fold it into a robustness family.

## Problem

The CI job **`CI / mutation-changed`** fails on PR `reconfix-ticket` (run 28121151540, 2m14s, `failure`). The job runs `npm run mutation:changed` (`scripts/robustness/mutation-scope.mjs`), which mutation-gates changed locked-pillar source.

`docs/robustness-testing.md` enrolls **P3 segment-reconciliation** (`packages/core/src/compiler/reconciliation/**/*.ts`) as a first-class pillar with its own Stryker config (`stryker.segment-reconciliation.config.mjs`), command (`mutation:segment-reconciliation`), and floors (green 95 / warn 92 / break 90). But the robustness **tooling** was never wired to know about P3:

- `scripts/robustness/mutation-scope.mjs` knows only `prose` / `ideation` / `validation`. `pillarForSourcePath` (lines 111-129) has no reconciliation branch, so `compiler/reconciliation/*.ts` falls through the generic `compiler/` catch-all and **misroutes to the P1 prose campaign**. `PILLARS` (lines 7-23) and `isFullCampaignTrigger` (lines 99-109) also omit P3.
- `stryker.prose.config.mjs` (lines 5-8) excludes `ideation/**` but **not** `reconciliation/**`, so reconciliation is double-enrolled in P1 and P3.
- `runCampaign` (mutation-scope.mjs:204-218) throws on **any** adverse status (`Survived`/`NoCoverage`/`Timeout`/`RuntimeError`/`Pending`, line 5), regardless of the pillar's configured break floor.

The reconciliation surface is still **pre-activation**: the full `mutation:segment-reconciliation` campaign scores **48.99%** (385 Survived + 168 NoCoverage tree-wide; `compile-segment-reconciliation-prompt.ts` alone: 53 Survived + 9 NoCoverage) yet exits **0**, because `break: null` makes its output advisory — exactly the state `docs/robustness-testing.md` describes ("Until activation, `thresholds.break` remains `null` and mutation output is advisory", and "Break floors activate only after all baseline survivors … have been reviewed and classified"). `tools/robustness/mutation-baseline.json` has no segment-reconciliation entry, confirming P3 has never been baselined.

So a changed reconciliation source file is misrouted into the strict P1 prose campaign, whose blanket zero-adverse throw cannot pass against an unhardened, advisory-stage pillar → CI red.

This is a **pre-existing wiring gap**, not a regression from the RECONFIX-002 prompt trim: `mutation:changed` was added in SPEC-026 (#66); reconciliation was added later in `ace2efb` (#73) without touching `ci.yml`, `mutation-scope.mjs`, or the prose config. RECONFIX-002 merely changed a reconciliation source file again, re-tripping the gate.

**Chosen remedy (user-selected):** enroll P3 in the tooling, stop hard-failing the un-activated pillar by deferring its changed-source mutation to the scheduled/manual robustness workflow (advisory) until activation, and exclude reconciliation from the P1 prose score-of-record. The actual reconciliation test-hardening (review/classify the ~553 baseline survivors and activate P3's break floor) is **deferred to its own future robustness spec**, per `docs/robustness-testing.md`'s activation process.

## Assumption Reassessment (2026-06-24)

1. **Misrouting confirmed in code.** `scripts/robustness/mutation-scope.mjs:111-129` `pillarForSourcePath` returns `validation` for `src/validation/`, `ideation` for `compiler/ideation/` (+ `sections/ideation.ts`), and the generic `compiler/` catch-all returns `prose` — no `reconciliation` branch. `PILLARS` (7-23) and `isFullCampaignTrigger` (99-109) omit segment-reconciliation. Verified live: `npm run mutation:changed -- --dry --json --changed <reconciliation-file>` plans `"pillar": "prose"`.
2. **Doc enrolls P3 and mandates advisory-until-activation.** `docs/robustness-testing.md`: Enrolled Scopes "P3 segment-reconciliation compiler and parser" = `packages/core/src/compiler/reconciliation/**/*.ts` (lines 29-31); `mutation:segment-reconciliation` command (line 56); P3 floors green 95 / warn 92 / break 90 (line 88); Changed-Source Rule "changed P1/P2/P3/P4 source forces mutation" (line 99); "Until activation, `thresholds.break` remains `null` and mutation output is advisory" (lines 91-92). `stryker.segment-reconciliation.config.mjs` sets `break: null`. `tools/robustness/mutation-baseline.json` baselines only prose/ideation/validation.
3. **Shared boundary under audit:** the changed-file mutation contract between `docs/robustness-testing.md` (policy authority) and `scripts/robustness/mutation-scope.mjs` (implementation) — specifically the pillar-routing map (`pillarForSourcePath`/`PILLARS`), the P1 prose mutate glob (`stryker.prose.config.mjs`), the scheduled matrix (`.github/workflows/robustness.yml`), and the `runCampaign` adverse-status gate. The doc is the authority; the code must conform.
4. **No FOUNDATIONS hard-fail engaged.** `docs/robustness-testing.md` is dev-assurance policy, explicitly "subordinate to `docs/FOUNDATIONS.md`" and not owning product behavior. This ticket changes only mutation-test routing/gating and the policy doc — no compiler determinism (§8), validation gate (§11), secret firewall (§15), or §29 checklist item is touched. The change does not weaken any product validation gate.
5. **Adjacent contradiction — future cleanup, not in this ticket:** the existing unit test `scripts/robustness/__tests__/mutation-scope.test.mjs` uses `node:test` and is **not** in vitest's include globs (`vitest.config.ts:8-13` covers only `packages/**`, `src/**`, `test/**` `*.test.ts(x)`) nor any npm script / CI step — so it runs only via a direct `node --test` invocation and would not have caught this gap in CI. Wiring `node --test` into CI is a **separate follow-up**, classified as future cleanup (see Out of Scope).

## Architecture Check

1. **Reuses the existing defer mechanism rather than inventing a new gate path.** The script already models "report but don't run inline" via `full-campaign-deferred` (infra changes defer to the scheduled workflow). Marking a pre-activation pillar's changed-source campaign as `deferred` reuses that exact pattern at campaign granularity, so a mixed PR (a prose file + a reconciliation file) still runs the activated prose campaign while deferring the advisory reconciliation one. This is cleaner than (a) hardcoding a reconciliation special-case in `runCampaign`, or (b) globally relaxing the gate to advisory (rejected: it would silently weaken the working zero-adverse protection for P1/P2/P4, all of which also have `break: null`). Gating deferral on a `PRE_ACTIVATION_PILLARS` set keyed to the doc's activation state keeps the strict gate intact for activated pillars and makes activation a one-line removal once the future hardening spec lands.
2. **No backwards-compatibility aliasing/shims.** The prose glob gains a real exclusion (mirroring the existing `ideation` carve-out); no duplicate authority path or compatibility alias is introduced. Reconciliation moves to a single owner (P3).

## Verification Layers

1. Reconciliation source classifies to the `segment-reconciliation` pillar, never `prose` → **codebase grep-proof** + `npm run mutation:changed -- --dry --json --changed packages/core/src/compiler/reconciliation/compile-segment-reconciliation-prompt.ts` shows `"pillar": "segment-reconciliation"` and no `prose` campaign.
2. A changed-reconciliation-only PR is deferred, not run, and does not throw → `npm run mutation:changed -- --changed packages/core/src/compiler/reconciliation/compile-segment-reconciliation-prompt.ts` exits `0` and prints a "deferred to scheduled/manual robustness workflow" line for segment-reconciliation.
3. A mixed change still runs the activated pillar → `--dry --json` for `[a prose source file, a reconciliation source file]` yields a runnable `prose` campaign **and** a `deferred` `segment-reconciliation` campaign.
4. P1 prose no longer mutates reconciliation → **codebase grep-proof** (`!packages/core/src/compiler/reconciliation/**/*.ts` present in `stryker.prose.config.mjs`) + `--dry --json` for a prose source change lists no reconciliation paths under prose.
5. Scheduled robustness covers P3 → **codebase grep-proof** (`pillar: segment-reconciliation` in `.github/workflows/robustness.yml`); **manual review**: `npm run mutation:segment-reconciliation` exits `0` (advisory, `break: null`).
6. Policy/implementation conformance → **FOUNDATIONS/doc alignment check**: `docs/robustness-testing.md` P1 scope excludes reconciliation and the Changed-Source Rule documents the pre-activation report-and-defer behavior.

## What to Change

### 1. `scripts/robustness/mutation-scope.mjs` — register and defer P3

- Add a `segment-reconciliation` entry to `PILLARS`: `config: "stryker.segment-reconciliation.config.mjs"`, `report: "reports/mutation/segment-reconciliation/mutation.json"`, `cache: ".cache/stryker/segment-reconciliation.json"`.
- In `pillarForSourcePath`, add a reconciliation branch **before** the generic `compiler/` prose branch: `if (path.startsWith("packages/core/src/compiler/reconciliation/") && path.endsWith(".ts")) return "segment-reconciliation";` (order matters — reconciliation lives under `compiler/`).
- Add `stryker.segment-reconciliation.config.mjs` to `isFullCampaignTrigger` (consistency with the other three Stryker configs).
- Introduce `const PRE_ACTIVATION_PILLARS = Object.freeze(new Set(["segment-reconciliation"]));` and give each campaign produced by `campaignPlan` a `deferred` flag = `PRE_ACTIVATION_PILLARS.has(pillar)`. In `main()`'s run loop, `continue` past `deferred` campaigns (do not call `runCampaign`). In `printPlan`, render deferred campaigns with a "deferred to scheduled/manual robustness workflow (advisory; pre-activation pillar)" line. Plan `status` stays `in-scope`; deferral is per-campaign so mixed changes still run activated pillars.

### 2. `stryker.prose.config.mjs` — stop double-enrolling reconciliation

- Add `"!packages/core/src/compiler/reconciliation/**/*.ts"` to the `mutate` array (mirroring the existing `!…/ideation/**` exclusions).

### 3. `.github/workflows/robustness.yml` — add P3 to the scheduled matrix

- Add a matrix include entry: `{ pillar: segment-reconciliation, label: "P4 segment-reconciliation mutation" (renumber labels as preferred), script: mutation:segment-reconciliation }`. The downstream steps already key off `${{ matrix.pillar }}` and `reports/mutation/${{ matrix.pillar }}/mutation.json`, which matches the config's `name: "segment-reconciliation"`.

### 4. `docs/robustness-testing.md` — record the conformance

- Enrolled Scopes P1: add an exclusion line `- excluding packages/core/src/compiler/reconciliation/**/*.ts` so P1's scope matches the prose glob and the P3 carve-out.
- Changed-Source Rule: add a clause that a **pre-activation pillar** (no reviewed baseline / `thresholds.break` null) **reports and defers** its changed-source mutation to the scheduled/manual robustness workflow rather than failing the PR inline, until the pillar is activated — making the changed-file gate honor the documented advisory policy. Name segment-reconciliation as the current pre-activation pillar.

## Files to Touch

- `scripts/robustness/mutation-scope.mjs` (modify)
- `stryker.prose.config.mjs` (modify)
- `.github/workflows/robustness.yml` (modify)
- `docs/robustness-testing.md` (modify)
- `scripts/robustness/__tests__/mutation-scope.test.mjs` (modify — new cases, see Test Plan)

## Out of Scope

- **Hardening the reconciliation tests / activating P3's break floor** (killing the ~553 baseline survivors, reviewing/classifying each per the doc's Survivor Classifications, setting a P3 baseline in `tools/robustness/mutation-baseline.json`). This is the larger activation initiative and must become **its own future robustness spec** before implementation (`docs/robustness-testing.md` Queued Secondary-Tier Hardening / "each must become its own future spec"). This ticket only makes P3 advisory-correct, not green-by-hardening.
- Refreshing the existing prose baseline in `mutation-baseline.json` (its score-of-record will improve once reconciliation drops out of the prose glob, but `break: null` keeps it advisory — no gate breaks; a baseline change requires its own ticket per the doc).
- Wiring `node --test scripts/robustness/__tests__/*.test.mjs` into CI / an npm script (Assumption 5) — separate cleanup follow-up.
- Any change to product runtime, the reconciliation prompt text/output, or the compiler.

## Acceptance Criteria

### Tests That Must Pass

1. `node --test scripts/robustness/__tests__/mutation-scope.test.mjs` — all existing cases plus the new ones below pass.
2. `npm run mutation:changed -- --changed packages/core/src/compiler/reconciliation/compile-segment-reconciliation-prompt.ts` exits `0` and reports the segment-reconciliation campaign as deferred (no Stryker run, no adverse-status throw).
3. `npm run lint && npm run typecheck` pass (mjs/yaml/doc edits clean).
4. `npm run mutation:segment-reconciliation` exits `0` (advisory; confirms the scheduled-matrix script is valid).

### Invariants

1. `pillarForSourcePath` maps every `packages/core/src/compiler/reconciliation/**/*.ts` path to `segment-reconciliation` and nothing under `reconciliation/` to `prose`.
2. The P1 prose mutate glob never mutates reconciliation sources; the scheduled robustness matrix runs all four pillars (P1–P4).
3. Activated pillars (prose/ideation/validation) retain the strict zero-adverse changed-file gate — only pre-activation pillars defer.

## Test Plan

### New/Modified Tests

1. `scripts/robustness/__tests__/mutation-scope.test.mjs` — add: (a) a reconciliation source path classifies `in-scope` with a single `segment-reconciliation` campaign carrying `deferred: true` and no `prose` campaign; (b) a mixed `[prose source, reconciliation source]` change yields a runnable `prose` campaign plus a `deferred` `segment-reconciliation` campaign; (c) `buildStrykerArgs` still targets the prose config/glob for a prose-only change and never includes reconciliation paths under prose.

### Commands

1. `node --test scripts/robustness/__tests__/mutation-scope.test.mjs`
2. `npm run mutation:changed -- --dry --json --changed packages/core/src/compiler/reconciliation/compile-segment-reconciliation-prompt.ts` (manual inspection: `"pillar": "segment-reconciliation"`, deferred)
3. `npm run lint && npm run typecheck` (a full `npm test` is unnecessary here — no product source changes; the targeted `node --test` is the correct verification boundary for the router logic, and `mutation:segment-reconciliation` validates the scheduled script).

## Outcome

Completed: 2026-06-24

What changed:

- Registered `segment-reconciliation` as a distinct changed-file mutation pillar in `scripts/robustness/mutation-scope.mjs`, including its Stryker config, report, cache, full-campaign trigger, and source-path router branch before the generic compiler/prose fallback.
- Added pre-activation campaign deferral for `segment-reconciliation` so changed reconciliation source reports an in-scope deferred campaign and skips inline Stryker execution while activated pillars still run normally.
- Excluded `packages/core/src/compiler/reconciliation/**/*.ts` from the P1 prose Stryker mutate glob.
- Added the P3 segment-reconciliation campaign to the scheduled/manual robustness workflow matrix and renumbered validation to P4 in that matrix.
- Updated `docs/robustness-testing.md` so P1 scope excludes reconciliation and the changed-source rule documents pre-activation report-and-defer behavior for the current `segment-reconciliation` pillar.
- Expanded `scripts/robustness/__tests__/mutation-scope.test.mjs` with reconciliation-only, mixed prose/reconciliation, prose args, and segment config full-trigger coverage.

Deviations from original plan:

- None. The broader P3 test-hardening/baseline activation work remains deferred to a future robustness spec, as scoped.

Verification:

- `node --test scripts/robustness/__tests__/mutation-scope.test.mjs` passed.
- `npm run mutation:changed -- --dry --json --changed packages/core/src/compiler/reconciliation/compile-segment-reconciliation-prompt.ts` passed and planned only a deferred `segment-reconciliation` campaign.
- `npm run mutation:changed -- --changed packages/core/src/compiler/reconciliation/compile-segment-reconciliation-prompt.ts` passed and printed the advisory pre-activation deferral line without running Stryker.
- `npm run mutation:changed -- --dry --json --changed packages/core/src/compiler/compile-prompt.ts,packages/core/src/compiler/reconciliation/parse-segment-reconciliation-response.ts` passed and planned runnable `prose` plus deferred `segment-reconciliation` campaigns.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run mutation:segment-reconciliation` passed as advisory, reporting the known 48.99% mutation score with surviving/no-coverage mutants under `thresholds.break: null`.
- `git diff --check` passed.

Smoke skipped: not browser-facing or request-shape-sensitive work; this ticket changes development-assurance tooling, CI wiring, and policy docs only.
