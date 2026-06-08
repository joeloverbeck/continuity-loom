# SPECFOUDOCAME-006: Amend stress-coverage-matrix.md and stress-suite.md

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — `docs/stress-coverage-matrix.md` (Cases 7/12/15/26 + new readiness sub-section) and `docs/stress-suite.md` (Cases 7/8/12/14/15/21/26 + new cases 27–31); no production behavior change.
**Deps**: None

<!-- Related: specs/SPEC-foundational-doc-amendments-for-generation-readiness.md §4.8 + §4.9 + §5.1/§5.2; constitution amended in SPECFOUDOCAME-001. -->

## Problem

The stress docs cite codes this correction reclassifies — `missing-stop-guidance` (matrix Cases 7, 26) and `long-dossier-needs-pin` (matrix Cases 12, 15), plus a `sparse-voice-pressure` occurrence — as implemented v1 blocker capabilities, and carry no draftability/readiness coverage. The stress suite's cases lack the first-segment/continuation/voice/draft readiness outcomes. This ticket reclassifies the stale codes and adds readiness coverage without shrinking either doc.

## Assumption Reassessment (2026-06-08)

1. `docs/stress-coverage-matrix.md` is a four-column case-indexed table (`| # | Stress case | Risk area | Implemented v1 capability |`, header at line 9); Case 7 (16) and Case 26 (35) cite `missing-stop-guidance`; Case 12 (21) and Case 15 (24) cite `long-dossier-needs-pin`. `docs/stress-suite.md` carries exactly 26 `## Case N` cases (7, 8, 12, 14, 15, 21, 26 all present). Confirmed this session.
2. Amendment plan from `specs/SPEC-foundational-doc-amendments-for-generation-readiness.md` §4.8 (matrix) and §4.9 (suite), with the §5.1 stop-guidance and §5.2 voice-pressure cleanups, validated against the live docs during `/reassess-spec`.
3. Cross-artifact boundary under audit: two stress docs with distinct invariants — the matrix is a coverage audit (case → risk → capability); the suite is the case definitions. They must stay mutually consistent (a case reclassified in the matrix must read consistently in the suite). Merged here because Cases 7/12/15/26 are touched in both and must move together. SPECFOUDOCAME-008 verifies cross-doc consistency.
4. FOUNDATIONS principle under audit: §11 `Validation and hard fails` — warnings (length, lost-in-the-middle, salience, missing optional nuance) never block; blockers prove contradiction/impossibility/contract failure. The reclassified codes are salience/optional concerns → warnings, not blockers.
5. Fail-closed validation surface touched: reclassifying `missing-stop-guidance` (blank stop guidance no longer blocks — the universal stop rule remains compiled) and `long-dossier-needs-pin` / `sparse-voice-pressure` (grouped salience warnings) does not weaken any true blocker or determinism (§8); the first-segment/continuation/physical/secret blockers in the suite remain blockers. No secret-firewall path is touched.
6. Adjacent contradiction classified: `sparse-voice-pressure` appears in `docs/stress-coverage-matrix.md` but **not** in `packages/` (the implemented validator) — same stale-code situation as demo Recipe 7 (SPECFOUDOCAME-005, item 6). Apply the §5.2 voice-pressure cleanup across the matrix so the `sparse-voice-pressure` occurrence reads as the durable-anchors-primary / grouped-salience-warning model, not a blocker capability.

## Architecture Check

1. Revising the existing rows in place (not merely appending new ones) and adding a *separate* readiness sub-section keeps the case-indexed audit intact while extending coverage — cleaner than a parallel matrix that would drift from the case list.
2. No backwards-compatibility aliasing: stale code rows are reclassified in place; no "legacy capability" alias is retained.

## Verification Layers

1. (matrix) Cases 7/26 no longer present `missing-stop-guidance` as a blocker capability → codebase grep-proof of the revised rows (universal stop rule remains compiled).
2. (matrix) Cases 12/15 + `sparse-voice-pressure` reframed as grouped salience warnings → grep-proof of the revised rows.
3. (matrix) new "Readiness and draftability coverage" sub-section as a *separate* `| Coverage area | Required proof |` table → grep-proof of the new heading + table columns.
4. (suite) Cases 7/8/12/14/15/21/26 carry readiness outcomes; cases 27–31 added → grep-proof (`grep -c "## Case" docs/stress-suite.md` ≥ 31).
5. (cross-artifact) matrix capability rows agree with suite case outcomes → manual review + SPECFOUDOCAME-008 consistency gate.

## What to Change

### 1. `docs/stress-coverage-matrix.md`

- Revise **Case 7** and **Case 26** so blank `soft_unit_guidance` no longer reads as a blocker (the universal stop rule remains compiled); keep the legitimate `local-prose-scope-violation` / `directive-stop-guidance-disagreement` blockers.
- Revise **Case 12** and **Case 15** (and the `sparse-voice-pressure` occurrence, per §5.2) to the grouped-salience-warning model with durable voice anchors as primary authority.
- Add a new sub-section titled **"Readiness and draftability coverage"** as a *separate* table with columns `| Coverage area | Required proof |` (do NOT append rows to the case-indexed table — the columns differ), covering: draft save with blockers; blank stop guidance; first-segment default; continuation default; manual directive required; current-state universal floor; physical context gating; voice pressure optionality; warning deduplication; three-page shared readiness; provider separation. (Spec §4.8.)

### 2. `docs/stress-suite.md`

- Add expected readiness outcomes to **Case 7** (passes with blank stop guidance + blank continuation handoff if floor + directive present), **Case 8** (blocks when continuation handoff missing; no accepted prose in prompt), **Case 12** (grouped salience warnings, not repeated blockers), **Case 14** (durable anchors satisfy readiness; pins optional), **Case 15** (warn for salience/turn-taking; block only missing speaker/audibility/relationship/voice authority), **Case 21** (require position/visibility/body authority when silent presence materially matters; current silence pressure recommended), **Case 26** (blank soft guidance still enforces the universal stop rule).
- Add **Cases 27–31**: draft save despite readiness blockers; generation-context default mismatch prevention (no false `focus-tag-count-invalid`); continuation default from accepted-segment count; provider-only block (Generate blocked, Preview available); deduplicated long-dossier warning. (Spec §4.9.)

## Files to Touch

- `docs/stress-coverage-matrix.md` (modify)
- `docs/stress-suite.md` (modify)

## Out of Scope

- The demo-blocker-recipes `sparse-voice-pressure` occurrence (SPECFOUDOCAME-005).
- Constitution / schema / compiler / template doctrine (SPECFOUDOCAME-001…004).
- Any production validator code or test-fixture change (owned by the archived behavioral specs; spec §8).
- Final cross-doc consistency search-checks (SPECFOUDOCAME-008).

## Acceptance Criteria

### Tests That Must Pass

1. `grep -nE "Readiness and draftability coverage" docs/stress-coverage-matrix.md` returns the new sub-section; its table header is `| Coverage area | Required proof |` (not appended to the case table).
2. Matrix Cases 7/12/15/26 rows reflect the warning reclassification (blank stop guidance / long-dossier / sparse-voice no longer read as blocker capabilities).
3. `grep -c "^## Case" docs/stress-suite.md` returns ≥ 31 (existing 26 preserved + cases 27–31 added).

### Invariants

1. The existing 26 stress cases remain (no case deleted); the matrix's case-indexed table keeps its four columns.
2. Coverage invariant: every reclassified code is presented as a warning; first-segment/continuation/physical/secret blockers remain blockers; the universal stop rule is documented as always compiled.

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based (greps below). Stress-case validation behavior is covered by the archived demo/stress spec's tests; cross-doc consistency is verified by SPECFOUDOCAME-008.`

### Commands

1. `grep -nE "missing-stop-guidance|long-dossier-needs-pin|sparse-voice-pressure" docs/stress-coverage-matrix.md` — confirm each stale code is reframed (warning, not blocker capability).
2. `grep -c "^## Case" docs/stress-suite.md` — confirm ≥ 31 cases.
3. Manual review of the matrix capability rows against the suite case outcomes for Cases 7/12/15/26 (the correct boundary — cross-row consistency is not a single greppable count; the full sweep is SPECFOUDOCAME-008).
