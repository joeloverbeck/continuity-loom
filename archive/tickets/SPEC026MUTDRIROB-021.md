# SPEC026MUTDRIROB-021: Add scheduled/manual full robustness workflow

**Status**: COMPLETED (2026-06-21)
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — adds a scheduled/manual `robustness.yml` CI workflow; no production behavior change.
**Deps**: archive/tickets/SPEC026MUTDRIROB-001.md

## Outcome

- Added `.github/workflows/robustness.yml`, a separate scheduled/manual workflow with `schedule` and `workflow_dispatch` triggers.
- The workflow runs a forced full Stryker matrix for P1 prose, P2 ideation, and P3 validation via `npm run mutation:* -- --force`, records a run seed/commit summary, writes compact mutation summaries with `mutation:gate`, and uploads short-lived CI artifacts for local report files.
- No external report publishing step was added; reports remain CI-internal.
- No browser smoke was run; this ticket only adds a CI workflow definition.

Verification:

- `grep -nE "schedule:|workflow_dispatch:|--force" .github/workflows/robustness.yml` (schedule, manual trigger, and forced mutation present)
- `grep -niE "dashboard|stryker-dashboard|upload.*report.*http" .github/workflows/robustness.yml` (no matches)
- `npx prettier --check .github/workflows/robustness.yml` (passed)
- `npm run lint` (passed)
- `npm run typecheck` (passed)
- `npm test` (150 files, 1232 tests passed)
- `npm run build` (passed; existing Vite large-chunk warning)

## Problem

Changed-file PR mutation cannot detect stale caches, indirect test/config drift, or survivors outside recently touched files. An uncached full three-pillar matrix must run on a schedule (and on demand) as the score of record. This ticket adds a separate `robustness.yml` workflow with a scheduled `--force` matrix, `workflow_dispatch`, and short-lived artifact upload — with no external dashboard.

## Assumption Reassessment (2026-06-20)

1. The Stryker configs + `mutation:*` scripts come from archive/tickets/SPEC026MUTDRIROB-001.md; `.github/workflows/` exists and holds `ci.yml` (confirmed this session); no `robustness.yml` exists yet (proposed-new, no collision).
2. SPEC-026 §Deliverables E2 + report §11.2 define the workflow (scheduled uncached full matrix for P1/P2/P3; `workflow_dispatch`; artifact upload for HTML/JSON/coverage/seed/summary; `--force`, ignore incremental reuse; no external dashboard).
3. Cross-artifact boundary under audit: `robustness.yml` is a **separate** workflow from `ci.yml` — it does not alter the PR gates; the three pillar jobs run on separate runners for parallelism.
4. FOUNDATIONS principle restated: §29.9 prompt-audit/secrets + §29.11 workflow quality — generated reports stay CI-internal (no external dashboard upload); expensive full mutation is scheduled, not per-PR.

## Architecture Check

1. A separate scheduled workflow with `--force` (the uncached score of record) plus `workflow_dispatch` is cleaner than overloading the PR workflow; rotating scheduled seeds recorded in the job summary keep reproducibility without flaking PRs.
2. No backwards-compatibility shims; the new workflow is additive and touches no PR gate.

## Verification Layers

1. Workflow shape -> `robustness.yml` defines a scheduled trigger + `workflow_dispatch` + a three-job P1/P2/P3 matrix using `--force`.
2. Artifacts -> HTML/JSON/coverage/seed/summary uploaded as short-lived artifacts; no external dashboard step exists (grep-proof negative).
3. Separation -> `ci.yml` PR gates are unchanged by this ticket.

## What to Change

### 1. Scheduled/manual workflow

Add `.github/workflows/robustness.yml`: a scheduled cron trigger and `workflow_dispatch`; three jobs (P1/P2/P3) each running its pillar config with `--force` (ignore incremental reuse); rotating seeds recorded in the job summary; artifact upload for HTML, JSON, coverage summaries, seed data, and compact gate summaries. No external dashboard upload.

## Files to Touch

- `.github/workflows/robustness.yml` (new)

## Out of Scope

- The PR changed-file job (archive/tickets/SPEC026MUTDRIROB-020.md) and required-status enforcement (SPEC026MUTDRIROB-022).
- Any pillar test content.

## Acceptance Criteria

### Tests That Must Pass

1. `robustness.yml` parses as valid GitHub Actions YAML and defines the scheduled + `workflow_dispatch` triggers and the three-job matrix with `--force`.
2. No external-dashboard upload step is present (grep-proof negative).
3. `npm run lint` passes (workflow lint if configured).

### Invariants

1. The workflow is uncached (`--force`) and is the score of record.
2. Reports stay CI-internal; no hosted-dashboard dependency is introduced.

## Test Plan

### New/Modified Tests

1. `None — CI-workflow ticket; verification is YAML validity + grep-proof on triggers/jobs/no-dashboard.`

### Commands

1. `grep -nE "schedule:|workflow_dispatch:|--force" .github/workflows/robustness.yml` — triggers + uncached matrix present.
2. `! grep -niE "dashboard|stryker-dashboard|upload.*report.*http" .github/workflows/robustness.yml` — no external dashboard.
3. YAML-validity + grep-proof is the correct boundary: the deliverable is a workflow definition, verified by structure not by a runtime test.
