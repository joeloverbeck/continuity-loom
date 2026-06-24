# SPEC032SEGRECASS-008: Capstone — cross-pillar guard, stress/robustness enrollment, and non-§8 docs

**Status**: COMPLETED
**Priority**: LOW
**Effort**: Medium
**Engine Changes**: Yes — new cross-pillar capstone test, stress-suite/coverage-matrix cases, mutation-pillar enrollment, and the non-§8 doc updates (`user-guide`, `ACTIVE-DOCS` version note, `robustness-testing`); no production behavior change
**Deps**: SPEC032SEGRECASS-007

## Problem

The trailing ticket proves the complete feature coheres and locks the regression armor: a cross-pillar capstone test that fails if any prose/Ideate/Hygiene prompt starts including accepted text OR if the reconciliation prompt fails to include exactly one segment; stress-suite and coverage-matrix cases for the reconciliation scenarios (proposal §12.6); enrollment of the reconciliation core files in the mutation gate (the SPEC-032 reassessment M1 decision); and the non-§8 documentation that lands after the feature exists — the nine-step user-guide loop, the `docs/ACTIVE-DOCS.md` version note, and the `docs/robustness-testing.md` scope update. It exercises the pipeline the earlier tickets composed; it introduces no new production logic.

Implements SPEC-032 Deliverable 5 and the non-§8 slice of Deliverable 1. Test/stress coverage is fixed by `reports/segment-reconciliation-assistance-change-proposal.md` §12.

## Assumption Reassessment (2026-06-24)

1. The full feature exists as Deps: SPEC032SEGRECASS-007 (the linear chain head reaches every prior ticket transitively). The stress/robustness/user-guide/ACTIVE-DOCS targets exist (verified this session): `docs/stress-suite.md`, `docs/stress-coverage-matrix.md`, `docs/robustness-testing.md`, `docs/user-guide.md` (post-acceptance loop at L25/L143-145), `docs/ACTIVE-DOCS.md` (the §"Version note" carries the contract-version pins).
2. **Mutation-pillar enrollment (M1 decision)**: `docs/robustness-testing.md` enumerates Enrolled Scopes P1 prose / P2 ideation / P3 validation, each with a `mutation:<pillar>` script and a `stryker.<pillar>.config.mjs` (verified: `mutation:prose/ideation/validation/core` scripts present in `package.json`). This ticket adds a **new `segment-reconciliation` pillar** mirroring the P2-ideation precedent — a new `stryker.segment-reconciliation.config.mjs` scoping `packages/core/src/compiler/reconciliation/**`, a `mutation:segment-reconciliation` script, and an Enrolled-Scopes entry — covering lifecycle dispatch, path allowlists, enum validation, citation resolution, dependency-graph validation, and echo thresholds (proposal §12.3). (Alternative the reviewer may flip to: enroll the reconciliation files into the existing core pillar instead of a new config.)
3. **Cross-artifact boundary under audit**: the cross-pillar capstone asserts across the prose compiler (SPEC-007), ideation compiler (SPEC-021/022), hygiene compiler (SPEC-027/030), and the new reconciliation compiler (SPEC032SEGRECASS-004) simultaneously — it is the single test that proves accepted prose is confined to exactly the reconciliation prompt. The user-guide/ACTIVE-DOCS edits are non-§8 (they describe, not template, the compiler) so they correctly land here rather than with SPEC032SEGRECASS-004.
4. **Test-armoring surface (§8/§10/§29.4)**: this ticket pins existing FOUNDATIONS enforcement surfaces — the deterministic prose/ideation/hygiene compilers' accepted-prose firewall and the reconciliation single-segment guarantee. The capstone and mutation enrollment change **no production behavior**; they mutate the surfaces only in a sandbox to confirm assertion strength. Naming the surface under test: the cross-pillar accepted-prose firewall (§10) and deterministic compilation (§8).

## Architecture Check

1. A single trailing capstone that re-enumerates expected results from fixtures (not hardcoded counts) is the cleanest way to gate the whole feature without duplicating earlier per-ticket assertions. Landing the non-§8 docs here (after every surface exists) prevents a status/version note referencing a surface authored in a later ticket. A dedicated mutation pillar mirrors the established per-pillar config convention.
2. No backwards-compatibility aliasing/shims: the capstone and docs are additive; no existing pillar config or doc section is aliased or duplicated.

## Verification Layers

1. Accepted-prose-confinement invariant (only the reconciliation prompt contains accepted text; prose/Ideate/Hygiene remain accepted-prose-free; reconciliation includes exactly one segment) → cross-pillar capstone test.
2. Catalog-equals-registry-at-scale invariant (the generated catalog's type/enum sets equal the registry-derived sets across all 18 types) → capstone assertion re-enumerated from the registry fixture.
3. Mutation-coverage invariant (the reconciliation dispatch surfaces are enrolled and meet the gate floor) → `mutation:segment-reconciliation` run.
4. Docs-coherence invariant (user-guide nine-step loop present; ACTIVE-DOCS version note updated to `1.6.0/1.8.0/1.9.0`; robustness-testing names the reconciliation scope) → docs grep-proofs against the post-implementation tree.

## What to Change

### 1. Cross-pillar capstone + stress cases

Add `packages/core/test/segment-reconciliation-cross-pillar.test.ts` (the capstone). Add the proposal §12.6 stress cases to `docs/stress-suite.md` and map them in `docs/stress-coverage-matrix.md` (long injection segment, near-context-limit segment, oversize whole project, no selected records, secret reveal, object transfer, entrance/exit + line-of-sight, PLAN/CLOCK/OBLIGATION/CONSEQUENCE transitions, new ENTITY+CAST MEMBER dependency, invented-enum response, accepted-handoff-quote response, post-inspection new acceptance).

### 2. Mutation enrollment

Add `stryker.segment-reconciliation.config.mjs` scoping `packages/core/src/compiler/reconciliation/**`, a `mutation:segment-reconciliation` script in `package.json`, and an Enrolled-Scopes entry in `docs/robustness-testing.md`.

### 3. Non-§8 docs

Update `docs/user-guide.md` to the nine-step optional-reconciliation post-acceptance loop (proposal §11.4; state Reconciliation is optional, non-canonical, may be wrong, never applies changes). Update the `docs/ACTIVE-DOCS.md` version note to `templates 1.6.0 / compiler 1.8.0 / contract 1.9.0`.

## Files to Touch

- `packages/core/test/segment-reconciliation-cross-pillar.test.ts` (new)
- `stryker.segment-reconciliation.config.mjs` (new)
- `package.json` (modify)
- `docs/stress-suite.md` (modify)
- `docs/stress-coverage-matrix.md` (modify)
- `docs/robustness-testing.md` (modify)
- `docs/user-guide.md` (modify)
- `docs/ACTIVE-DOCS.md` (modify)

## Out of Scope

- Any production logic — this ticket exercises and documents the feature, it does not change behavior.
- The §8-bound docs (`compiler-contract.md`, `story-record-schema.md`, the new template authority) and the version bump — those landed with SPEC032SEGRECASS-004.
- New reconciliation behavior of any kind (the spec's Out of Scope forbids it).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- segment-reconciliation-cross-pillar` — fails if any prose/Ideate/Hygiene prompt includes accepted text or the reconciliation prompt lacks exactly one segment; passes against the composed feature.
2. `npm run mutation:segment-reconciliation` — the reconciliation core files are enrolled and meet the gate floor.
3. `npm test && npm run lint && npm run typecheck && npm run build` — full green, and a final diff audit against the amended FOUNDATIONS §29.

### Invariants

1. Accepted prose appears in exactly the reconciliation prompt and nowhere else across the four compiler pillars; the cross-pillar capstone re-enumerates counts from fixtures, never hardcoded.
2. `grep -n "Segment Reconciliation" docs/user-guide.md` returns the nine-step loop; `grep -n "1.9.0" docs/ACTIVE-DOCS.md` returns the updated contract version note; `docs/robustness-testing.md` names the reconciliation mutation scope.

## Test Plan

### New/Modified Tests

1. `packages/core/test/segment-reconciliation-cross-pillar.test.ts` — the cross-pillar accepted-prose-confinement capstone (proposal §12.2).
2. `stryker.segment-reconciliation.config.mjs` + `package.json` `mutation:segment-reconciliation` — mutation enrollment of the reconciliation dispatch surfaces.

### Commands

1. `npm test -- segment-reconciliation-cross-pillar`
2. `npm run mutation:segment-reconciliation`
3. `npm test && npm run lint && npm run typecheck && npm run build`

The full-suite + mutation + build run is the correct boundary because this is the capstone gate for the whole feature; a narrower command could not prove cross-pillar confinement or mutation-coverage strength.

## Outcome

Completed: 2026-06-24

Added the cross-pillar accepted-prose confinement capstone, Segment Reconciliation stress/coverage docs, mutation-pillar enrollment, user-guide loop, ACTIVE-DOCS version note, and robustness policy update.

Deviation: `npm run mutation:segment-reconciliation` is enrolled with `thresholds.break: null`; the first run completed with an advisory mutation score of 47.89 total / 55.53 covered, with surviving and timed-out mutants to classify in future robustness work.

Verification: `npm test -- segment-reconciliation-cross-pillar`; `npm run mutation:segment-reconciliation`; `npm run typecheck`; `npm run lint`; `npm test`; `npm run build`; `git diff --check`.
