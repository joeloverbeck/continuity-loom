# SPEC018FOUDOCCON-006: Backfill both stress coverage matrices for Cases 27–31

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — `docs/stress-coverage-matrix.md` and `docs/stress-suite.md` matrix bodies; conditionally one candidate entry in `docs/narrative-theory-blocker-roadmap.md`; no production behavior change
**Deps**: SPEC018FOUDOCCON-004 (if a case turns out to have no covering rule, the gap is recorded as a candidate in the roadmap doc that 004 creates). Source spec: `specs/SPEC-018-foundational-docs-consolidation-and-hardening.md` (D5).

## Problem

`docs/stress-coverage-matrix.md` has numbered rows for Cases 1–26 and 32 only; Cases 27–31 are missing, with the drift acknowledged in the doc itself ("this numbered table predates Cases 27-31 … backfilling those rows is pre-existing matrix-maintenance drift"). The embedded risk-surface matrix in `docs/stress-suite.md` (lines ~16–37) references only Cases 1–26 — neither 27–31 nor 32. Both matrices exist to prevent drift; both are currently drifted, and neither states the rule that keeps them synchronized.

## Assumption Reassessment (2026-06-10)

1. Verified against the working tree 2026-06-10: `docs/stress-suite.md` has `## Case N — …` headings for 1–32 (Case 27 "Draft save despite readiness blockers" at line 855 through Case 31 "Deduplicated long-dossier warning" at line 969; Case 32 at line 1001). `docs/stress-coverage-matrix.md` numbered rows cover 1–26 and 32; the drift disclaimer sits at line 38. The embedded matrix in `docs/stress-suite.md` (lines ~16–37) references cases up to 26 only.
2. `docs/stress-coverage-matrix.md` also carries a separate `## Readiness and draftability coverage` table (line ~40) that already covers Cases 27–31's ground by coverage area (draft save with blockers, generation-context defaults, provider separation, warning deduplication) — without case numbers. Per the reassessed SPEC-018 D5, the backfill must coordinate with it: add case-number references linking that table and the new numbered rows, and state the relationship between the two tables, so the same coverage is not represented twice with no linkage.
3. Cross-artifact boundary under audit: matrix rows map cases to *implemented* validation rules / compiler behaviors. Rule IDs cited in new rows must exist in `DIAGNOSTIC_CODES` (`packages/core/src/validation/types.ts`, 55 values); readiness behaviors must match the readiness engine (`packages/core/src/validation/readiness.ts`) and the existing row idiom (rule IDs + schema fields/behavior notes, same shape as Cases 1–26 rows).
4. FOUNDATIONS principle restated before trusting the spec narrative: §11 — warnings never gate; Cases 27–31 are readiness/draftability cases, so their rows must respect the draft-save-never-blocked and warnings-never-blocking doctrine when describing coverage. §8 drift doctrine motivates the same-change maintenance rule added to both files. If any case has **no** covering implemented rule, record the gap honestly in the matrix ("no deterministic rule; warning-grade gap") rather than inventing coverage — and add it as a candidate to `docs/narrative-theory-blocker-roadmap.md` (exists after SPEC018FOUDOCCON-004), which is why 004 is a Deps.
5. Mismatch + correction: none — case headings, row coverage, disclaimer line, and the readiness table all re-verified this session.

## Architecture Check

1. Backfilling the existing numbered table plus cross-linking the readiness table is cleaner than merging the two tables or merging the matrix doc into the stress suite (both were considered and rejected by the spec audit): the numbered table stays scannable per case, the readiness table stays scannable per coverage area, and explicit links plus a same-change rule replace silent divergence.
2. No backwards-compatibility aliasing/shims introduced — the drift disclaimer is removed once the drift it documents is fixed, not preserved alongside the fix.

## Verification Layers

1. Matrix completeness → codebase grep-proof: every `## Case N` heading in `docs/stress-suite.md` has a corresponding `| Case N |` row in `docs/stress-coverage-matrix.md` (32/32); the line-38 drift disclaimer is gone.
2. Embedded matrix currency → codebase grep-proof: the `docs/stress-suite.md` risk-surface matrix references Cases 27–32 where they map.
3. Cited rule IDs are implemented → codebase grep-proof: every backticked rule ID in the new rows exists in `DIAGNOSTIC_CODES` (`packages/core/src/validation/types.ts`).
4. Readiness-table linkage → manual review: the two tables in `docs/stress-coverage-matrix.md` cross-reference each other's coverage of Cases 27–31 and state their relationship.

## What to Change

### 1. `docs/stress-coverage-matrix.md` — numbered rows for Cases 27–31

Add rows in the existing shape (| Case N | title | risk surface | rule IDs + fields/behavior notes |) mapping each case to the implemented validation rules / readiness behaviors that cover it: Case 27 (draft save despite readiness blockers), Case 28 (generation-context default mismatch prevention), Case 29 (continuation default from accepted-segment count), Case 30 (provider-only Generate block), Case 31 (deduplicated long-dossier warning). Insert in numeric order (before the Case 32 row). Remove the line-38 drift disclaimer. If a case has no covering implemented rule, record "no deterministic rule; warning-grade gap" honestly and route the candidate per Assumption item 4.

### 2. `docs/stress-coverage-matrix.md` — link the readiness table

Add case-number references connecting the `## Readiness and draftability coverage` table and the new numbered rows (in whichever direction reads better), and a one-line statement of the relationship between the two tables.

### 3. `docs/stress-suite.md` — extend the embedded risk-surface matrix

Extend existing rows (or add rows) so the matrix references Cases 27–32 where they map (e.g. readiness/draftability surfaces for 27–31; salience-duplicate control for 32).

### 4. Both files — same-change maintenance rule

State in each: a new stress case must land with its matrix row(s) in the same revision.

## Files to Touch

- `docs/stress-coverage-matrix.md` (modify)
- `docs/stress-suite.md` (modify)
- `docs/narrative-theory-blocker-roadmap.md` (modify — only if a no-rule gap is found; created by SPEC018FOUDOCCON-004)

## Out of Scope

- Adding, removing, or re-grading any validation rule (gaps are recorded, not fixed).
- Adding new stress cases.
- Header standardization of these two files (SPEC018FOUDOCCON-005 — disjoint regions of the same files; coordinate mechanically on merge).
- The validation rule inventory's stress-case column (SPEC018FOUDOCCON-003 owns that doc).

## Acceptance Criteria

### Tests That Must Pass

1. Completeness grep: `for n in $(grep -oE '^## Case [0-9]+' docs/stress-suite.md | grep -oE '[0-9]+'); do grep -q "| Case $n " docs/stress-coverage-matrix.md || echo "MISSING Case $n"; done` — prints nothing (32/32).
2. `grep -c "predates Cases 27" docs/stress-coverage-matrix.md` — returns 0 (drift disclaimer removed).
3. Every rule ID cited in the new rows resolves: each backticked kebab-case ID in Cases 27–31 rows appears in `packages/core/src/validation/types.ts`.
4. `npm run lint && npm run typecheck && npm test` — unaffected (docs-only), all pass.

### Invariants

1. Matrix rows describe implemented coverage only; any uncovered surface is an explicitly labeled gap, never invented coverage.
2. Both files state the same-change maintenance rule; neither contains a standing drift disclaimer.

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based and existing pipeline coverage is named in Assumption Reassessment.`

### Commands

1. `for n in $(grep -oE '^## Case [0-9]+' docs/stress-suite.md | grep -oE '[0-9]+'); do grep -q "| Case $n " docs/stress-coverage-matrix.md || echo "MISSING Case $n"; done`
2. `npm run lint && npm run typecheck && npm test`
3. The completeness loop is the correct verification boundary — it is the spec's own §Verification check 4; the pipeline run only proves no collateral damage.
