# SPEC026MUTDRIROB-020: Add changed-file mutation scope and fail-safe cache behavior

**Status**: PENDING
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — adds the changed-file mutation-scope script and the `mutation-changed` CI job; no production behavior change.
**Deps**: SPEC026MUTDRIROB-001, SPEC026MUTDRIROB-003

## Problem

A full mutation matrix is too expensive per PR, but changed pillar source must still be mutation-gated. This ticket adds the `mutation-changed` PR job: it classifies changed paths, forces mutation of every changed P1/P2/P3 source file, forces all three campaigns on config/dependency/support-generator/script changes (Stryker incremental does not detect all environment changes), and falls back to real forced-scope work on a cache miss rather than skipping. The job always reports a status so branch protection stays reliable.

## Assumption Reassessment (2026-06-20)

1. `.github/workflows/ci.yml` exists and runs the established gates (confirmed this session); the Stryker configs + `mutation:*` scripts come from SPEC026MUTDRIROB-001 and the summarizer/baseline from SPEC026MUTDRIROB-003 — hence the Deps.
2. SPEC-026 §Deliverables E1 + report §11.1 define the changed-file rules (forced changed-source `mutate`; config/dep/support/script changes force all three; cache-miss fallback; any new `Survived`/`NoCoverage`/`Timeout`/unclassified error fails; baseline ratchet must not regress).
3. Cross-artifact boundary under audit: the CI gate contract — the new `mutation-changed` job is additive to `.github/workflows/ci.yml`, coexists with the existing jobs and the `core-coverage` job (archive/tickets/SPEC026MUTDRIROB-002.md), and shares the file with them (Step 6 shared-file overlap).
4. FOUNDATIONS principle restated: §29.11 workflow quality — fast PR loop preserved (changed-file scope, not full matrix); failures produce replayable evidence; the job fails safe (cache miss → real work, never skip).

## Architecture Check

1. A dedicated `scripts/robustness/mutation-scope.mjs` path-classifier driving a `mutation-changed` job that fails safe is cleaner than embedding scope logic in YAML; it forces all three campaigns on environment/config drift Stryker incremental cannot detect, and forces every changed source file rather than trusting incremental reuse.
2. No backwards-compatibility shims; the changed-source check is not yet a required status check (that is SPEC026MUTDRIROB-022).

## Verification Layers

1. Path classification -> `mutation-scope.mjs` maps a changed file set to the correct forced `mutate` targets / full-campaign trigger (unit test over representative diffs).
2. Fail-safe cache -> a simulated cache miss runs the forced changed-file scope without reuse rather than skipping.
3. Always-reports-status -> the job exits successfully with an explicit out-of-scope message when no pillar/robustness source changed; fails on any new `Survived`/`NoCoverage`/`Timeout`/unclassified error or baseline regression.

## What to Change

### 1. Changed-file scope script

`scripts/robustness/mutation-scope.mjs`: classify changed paths; for changed P1/P2/P3 source, force that file as a `mutate` target; for changed Stryker/Vitest/TS config, package manifest/lockfile, test-support generators, or robustness scripts, force all three pillar campaigns; restore-or-fallback the incremental cache (cache miss → forced changed-file scope without reuse). Use the summarizer (SPEC026MUTDRIROB-003) to gate on new adverse statuses + baseline ratchet.

### 2. `mutation-changed` CI job

Add the job to `.github/workflows/ci.yml`: always reports a status; exits successfully with an explicit "no locked-pillar source or robustness-infrastructure changes" message when out of scope; fails on any new adverse status in changed source or a baseline regression.

### 3. Package script

Add `mutation:changed` (`node scripts/robustness/mutation-scope.mjs`) to `package.json`.

## Files to Touch

- `scripts/robustness/mutation-scope.mjs` (new)
- `.github/workflows/ci.yml` (modify) — `mutation-changed` job
- `package.json` (modify) — `mutation:changed` script

## Out of Scope

- The scheduled full matrix (SPEC026MUTDRIROB-021).
- Making the check a required status + committing the reviewed baseline (SPEC026MUTDRIROB-022).
- Any pillar test content (Phases B/C/D).

## Acceptance Criteria

### Tests That Must Pass

1. `mutation-scope.mjs` unit tests map representative changed-file sets to the correct forced targets / full-campaign trigger.
2. A simulated cache miss runs forced changed-file scope (proven by test) rather than skipping.
3. `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. The job always reports a status; a cache miss never skips mutation.
2. Config/dependency/support/script changes force all three pillar campaigns.

## Test Plan

### New/Modified Tests

1. `scripts/robustness/__tests__/mutation-scope.test.mjs` — path classification + fail-safe fallback over representative diffs.

### Commands

1. `node scripts/robustness/mutation-scope.mjs --dry --changed "<paths>"` — confirm classification.
2. `npm run lint && npm run typecheck` — toolchain sanity.
3. A fixture-driven classifier test is the correct boundary: the CI job's contract is changed-paths → forced-scope, verifiable without a full campaign.
