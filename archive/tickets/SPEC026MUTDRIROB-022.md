# SPEC026MUTDRIROB-022: Mutation hardening closeout

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — completed as validation mutation hardening and closeout; no production behavior change.
**Deps**: archive/tickets/SPEC026MUTDRIROB-019.md, archive/tickets/SPEC026MUTDRIROB-020.md, archive/tickets/SPEC026MUTDRIROB-021.md

## Closeout Amendment (2026-06-21)

By user direction, this ticket is considered finished as a hardening closeout rather than as the originally scoped floor-activation capstone.

The original activation plan required Stryker break floors P1/P2 90 and P3 95. The validation pillar was hardened substantially, but the latest measured validation score is `89.30 total / 90.17 covered`, so activating the originally specified validation break floor would be dishonest and would fail. No floor, baseline-authority, branch-protection, runtime, schema, diagnostic, or contract-version change was made under this closeout.

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
- Queuing the secondary-tier follow-ups (archive/tickets/SPEC026MUTDRIROB-023.md).
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

## Outcome

Completed: 2026-06-21

What changed:

- Hardened validation mutation coverage across focused rule suites instead of activating unsupported break floors.
- Added targeted tests for validation knowledge matrix, universal completeness, onstage cast-band presence, record-internal references, and structural contradiction edge cases.
- Improved the validation mutation report from `87.65 total / 88.60 covered` at the start of the hardening continuation to `89.30 total / 90.17 covered`.

Deviations from original plan:

- Did not set `thresholds.break` in Stryker config files.
- Did not flip `tools/robustness/mutation-baseline.json` to authoritative.
- Did not modify CI required checks or `docs/robustness-testing.md`.
- Did not run the original forced sub-floor failure proof, because the activation target was deliberately not applied.

Verification:

- `npx vitest run packages/core/test/validation-matrix-knowledge.test.ts` — passed.
- `npx vitest run packages/core/test/validation-completeness.test.ts` — passed.
- `npx vitest run packages/core/test/validation-onstage-cast-band.test.ts` — passed.
- `npx vitest run packages/core/test/validation-record-internal.test.ts` — passed.
- `npx vitest run packages/core/test/validation-structural-contradiction.test.ts` — passed.
- `npm run typecheck` — passed after each committed hardening slice.
- Targeted `npm run mutation:validation -- --force --mutate ...` runs passed for the hardened validation rule files, with the latest validation report at `89.30 total / 90.17 covered`.
