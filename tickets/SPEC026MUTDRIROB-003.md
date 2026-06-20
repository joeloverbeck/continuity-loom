# SPEC026MUTDRIROB-003: Add mutation report summarizer and compact baseline format

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — adds a Stryker-JSON summarizer script and the compact `mutation-baseline.json` format (advisory); no production behavior change.
**Deps**: SPEC026MUTDRIROB-001

## Problem

Stryker's full incremental report is a large, unstable cache (open upstream issue on non-deterministic Vitest test IDs producing no-op diffs) and is not a fit for version control. The enforcement model (changed-file gate, ratchet) needs a stable, tool-independent summary instead. This ticket adds a summarizer that parses Stryker JSON into stable counts + gate decisions, and the compact `mutation-baseline.json` format the Phase E ratchet reads. The baseline starts **advisory** (no gate) until every survivor is classified in SPEC026MUTDRIROB-022.

## Assumption Reassessment (2026-06-20)

1. The Stryker configs and `reports/mutation/${name}/mutation.json` JSON reporter are created by SPEC026MUTDRIROB-001; `scripts/robustness/` exists (created by 001).
2. SPEC-026 §Deliverables A4 + report §10.2 define the compact baseline fields (tool versions, pillar, mutant totals by status, reviewed score, reviewed ignored count, timestamp + establishing commit, optional classifying-ticket link) and forbid committing the full incremental report.
3. Cross-artifact boundary under audit: the JSON contract between Stryker's `jsonReporter` output and the summarizer — the summarizer must read only documented Stryker JSON fields so a tool upgrade is a deliberate baseline-regeneration event.
4. FOUNDATIONS principle restated: §29.11 (workflow quality) — failures must produce replayable, localized evidence; the compact baseline is the durable, reviewable record, distinct from the disposable incremental cache.

## Architecture Check

1. A compact, tool-independent baseline JSON plus a summarizer that derives counts/gate decisions is cleaner and more reviewable than version-controlling Stryker's incremental report; it keeps the ratchet stable across tool noise.
2. No backwards-compatibility shims. The summarizer is additive tooling under `scripts/robustness/`.

## Verification Layers

1. Summarizer parses real Stryker JSON -> run against a fixture `mutation.json` and assert stable status counts + score.
2. Baseline format complete -> schema/grep-proof that `mutation-baseline.json` carries every required field.
3. Incremental report not committed -> `.gitignore` (from 001) covers `.cache/stryker/`; grep confirms no incremental file is tracked.

## What to Change

### 1. Summarizer script

`scripts/robustness/mutation-gate.mjs` (and any helper) parses a pillar's `reports/mutation/${name}/mutation.json` into: total mutants by status (Killed/Survived/NoCoverage/Timeout/RuntimeError/CompileError/Ignored), the computed mutation score, and a gate decision (pass/fail) given a supplied floor. It returns non-zero on an adverse decision. No floor is enforced yet (callers pass `null`).

### 2. Compact baseline format

`tools/robustness/mutation-baseline.json` — one entry per pillar (`prose`/`ideation`/`validation`) with: `toolVersions`, `pillar`, `statusTotals`, `reviewedScore`, `reviewedIgnoredCount`, `timestamp`, `commit`, optional `classifyingTicket`. Seed it **advisory** (scores recorded, `break` floors not yet active). Do not commit the Stryker incremental report.

### 3. Package script (optional wiring)

If a convenience entry is useful, add a `package.json` script that runs the summarizer over the three pillar JSON outputs; otherwise the summarizer is invoked by `run-core-mutation.mjs` / CI.

## Files to Touch

- `scripts/robustness/mutation-gate.mjs` (new)
- `tools/robustness/mutation-baseline.json` (new) — advisory baseline
- `package.json` (modify) — optional summarizer script entry

## Out of Scope

- Activating break floors / making the ratchet enforce (SPEC026MUTDRIROB-022).
- The changed-file CI scope logic (SPEC026MUTDRIROB-020).
- Any pillar test content (Phases B/C/D).

## Acceptance Criteria

### Tests That Must Pass

1. The summarizer parses a representative Stryker `mutation.json` fixture into correct status counts + score.
2. `tools/robustness/mutation-baseline.json` validates against the documented field set and is marked advisory.
3. `npm run lint && npm run typecheck` pass.

### Invariants

1. The summarizer reads only documented Stryker JSON fields; a tool-version change invalidates comparability and requires a baseline-regeneration ticket.
2. No Stryker incremental report is committed; only the compact baseline is version-controlled.

## Test Plan

### New/Modified Tests

1. `scripts/robustness/__tests__/mutation-gate.test.mjs` (or the repo's script-test convention) — assert parse + gate-decision logic against a checked-in `mutation.json` fixture.

### Commands

1. `node scripts/robustness/mutation-gate.mjs <fixture.json>` — confirm counts/score/decision.
2. `npm run lint && npm run typecheck` — toolchain sanity.
3. A fixture-driven unit test is the correct boundary: the summarizer's contract is JSON-in → counts-out, independent of running a full campaign.
