# SPEC026MUTDRIROB-022: Activate mutation floors and reviewed ratchets

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — activates Stryker break floors, commits the reviewed compact baseline, and makes the changed-source + coverage checks required; no production behavior change.
**Deps**: archive/tickets/SPEC026MUTDRIROB-019.md, archive/tickets/SPEC026MUTDRIROB-020.md, SPEC026MUTDRIROB-021

## Problem

Floors and the ratchet must activate only after every baseline survivor across all three pillars is classified — activating earlier would either block on un-reviewed survivors or lock in an unreviewed score. This enforcement-capstone ticket sets the Stryker break floors (P1/P2 90, P3 95), commits the reviewed compact baseline, and makes the `core-coverage` and `mutation-changed` checks required, completing the regime.

## Assumption Reassessment (2026-06-20)

1. The full pillar campaigns are complete and their reviewed scores recorded by archive/tickets/SPEC026MUTDRIROB-009.md (P1), -012 (P2), -018 (P3); the cross-pillar suite (-019), changed-file job (-020), and scheduled workflow (-021) exist — hence the Deps on the cross-pillar + enforcement leaves (which transitively cover the pillar campaigns).
2. SPEC-026 §Deliverables E3 + report §10.3/§11 define the ratchet (`max(configured break floor, reviewed baseline rounded down)`), the floors table, and the "only after every survivor classified" precondition; the advisory baseline format comes from archive/tickets/SPEC026MUTDRIROB-003.md.
3. Cross-artifact boundary under audit: the compact `tools/robustness/mutation-baseline.json` flips from advisory to authoritative; the CI branch-protection contract flips `core-coverage` + `mutation-changed` to required status checks.
4. FOUNDATIONS principle restated: §29.11 workflow quality — the reviewed baseline cannot auto-decrease; lowering a ratchet requires an explicit baseline-change ticket. No runtime/schema/contract change; `packages/core/src/version.ts` untouched.

## Architecture Check

1. Activating floors as a single trailing capstone — after every survivor is classified — is cleaner than per-pillar activation, which would gate on incomplete classification; the `max(floor, reviewed baseline)` ratchet makes regressions fail while preventing a 100%-doctrine that would reward suppression.
2. No backwards-compatibility shims. A score decrease fails; a tool-version change invalidates comparability and requires a deliberate baseline-regeneration ticket.

## Verification Layers

1. Floors active -> the three Stryker configs carry break floors (P1/P2 90, P3 95); a forced score below floor fails the run.
2. Reviewed baseline committed -> `tools/robustness/mutation-baseline.json` holds the reviewed scores + ignored counts + classifying-ticket links and is marked authoritative; no auto-decrease path exists.
3. Required checks -> `core-coverage` and `mutation-changed` are required status checks (documented in `docs/robustness-testing.md`; CI config reflects required gating).

## What to Change

### 1. Activate break floors

Set `thresholds.break` in `stryker.prose.config.mjs` / `stryker.ideation.config.mjs` / `stryker.validation.config.mjs` to 90/90/95 (plus green/warning bands), only after confirming every baseline survivor is classified.

### 2. Commit reviewed baseline + ratchet

Flip `tools/robustness/mutation-baseline.json` to authoritative with the reviewed per-pillar scores, ignored counts, timestamp/commit, and classifying-ticket links. Wire the ratchet rule `max(break floor, reviewed baseline)` into the gate (summarizer from archive/tickets/SPEC026MUTDRIROB-003.md); a decrease fails.

### 3. Make checks required

Make `core-coverage` and `mutation-changed` required; record the required-status decision in `docs/robustness-testing.md`.

## Files to Touch

- `stryker.prose.config.mjs` (modify) — break floor 90
- `stryker.ideation.config.mjs` (modify) — break floor 90
- `stryker.validation.config.mjs` (modify) — break floor 95
- `tools/robustness/mutation-baseline.json` (modify) — reviewed authoritative baseline
- `.github/workflows/ci.yml` (modify) — required-status gating
- `docs/robustness-testing.md` (modify) — record required-checks + activated floors

## Out of Scope

- Any pillar test content (Phases B/C/D) or new campaigns.
- Queuing the secondary-tier follow-ups (SPEC026MUTDRIROB-023).
- Any runtime/schema/diagnostic/contract-version change.

## Acceptance Criteria

### Tests That Must Pass

1. Each Stryker config enforces its break floor; a forced sub-floor score fails the run.
2. `tools/robustness/mutation-baseline.json` is authoritative with reviewed scores; the ratchet fails on a decrease.
3. `core-coverage` and `mutation-changed` are required checks; `npm run lint && npm run typecheck && npm test` pass; `packages/core/src/version.ts` is unchanged.

### Invariants

1. The reviewed baseline cannot auto-decrease; lowering a ratchet requires an explicit ticket.
2. No runtime output, schema, diagnostic, or contract version changes.

## Test Plan

### New/Modified Tests

1. `None — enforcement-activation ticket; verification is config grep-proof (break floors), baseline-content assertion, and a forced sub-floor run failing.`

### Commands

1. `grep -n "break" stryker.*.config.mjs` — floors 90/90/95 active.
2. `npm run mutation:core` — confirm floors enforce and the ratchet gates on the reviewed baseline.
3. Config grep-proof + a forced sub-floor failure is the correct boundary: the deliverable is gate activation, not new test content.
