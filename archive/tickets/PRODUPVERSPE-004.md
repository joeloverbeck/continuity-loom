# PRODUPVERSPE-004: Stress coverage — Case 32 cross-segment salience-duplicate calibration

**Status**: ✅ COMPLETED
**Priority**: LOW
**Effort**: Small
**Engine Changes**: Yes — new conceptual stress case in `docs/stress-suite.md` and a new coverage-matrix row in `docs/stress-coverage-matrix.md`; no production behavior change.
**Deps**: PRODUPVERSPE-002

## Problem

The salience-duplicate calibration the predicate tickets (001, 002) implement needs a conceptual stress case so the doctrine is protected against a future token-budget pass: it must stay legible that ordinary FACT/backstory-EVENT text is *not* copied to the front while voice pins, secret lanes, and behavioral-effect belief pressure remain dual-framed. Per the spec verdict (`specs/prompt-duplication-verdict-and-spec.md` §7.10/§7.11), add Case 32 to the stress suite and a corresponding row to the coverage matrix.

## Assumption Reassessment (2026-06-09)

1. `docs/stress-suite.md`'s last case is `## Case 31 — Deduplicated long-dossier warning`; Case 32 is the correct next number (no collision) — confirmed this session.
2. `docs/stress-coverage-matrix.md` is a 4-column table `| # | Stress case | Risk area | Implemented v1 capability |` whose `#` cell is formatted `| Case N |`, and its numbered table currently stops at **Case 26** (Cases 27–31 have no rows) — confirmed this session. Spec §7.11 was corrected during reassessment (finding I2) to use the 4-column `| Case 32 |` shape and to note the 27–31 gap as pre-existing out-of-scope drift; spec §7.10 supplies the Case 32 setup and expected prompt behavior.
3. **Shared boundary under audit**: this ticket documents the expected end-state behavior of the `active_knowledge_pressure` and `material_pressure` changes. `Deps: PRODUPVERSPE-002` because Case 32's expected behavior and the matrix row's "compiler pressure tests + golden diff prove…" reference the behavior 001+002 land (002 transitively covers 001). Pure docs — no files shared with PRODUPVERSPE-003.
4. **FOUNDATIONS §17 / §28.2**: Case 32 exists to protect two doctrines — voice pins as deliberate salience duplicates (§17 "current voice pressure is optional scene-specific salience reinforcement") and front-edge placement against long-context burial (§28.2) — from being mistaken for redundancy. The case asserts those duplicates survive while inert archive text does not.
5. **Adjacent contradiction (pre-existing, out of scope)**: the matrix's numbered table stops at Case 26, so a lone Case 32 row is anomalous against the suite's 31 existing cases. This is pre-existing matrix-maintenance drift, not introduced here; spec §7.11 already records it as out of scope. This ticket adds only the Case 32 row in correct format and the gap note; it does not backfill 27–31.
6. **Mismatch + correction**: none; the spec was reassessed this session and §7.10/§7.11 carry the corrected Case 32 content and matrix-row format.

## Architecture Check

1. A conceptual stress case + coverage-matrix row is the established Continuity Loom mechanism for protecting a prompt-quality doctrine (the suite already carries Case 12 large-cast salience and Case 31 deduplicated-dossier warning); reusing it is cleaner than inventing a new doctrine-protection surface. Adding the row in the matrix's existing 4-column format keeps the table valid rather than introducing the malformed 5-cell/`| 32 |` row the original spec draft carried.
2. No backwards-compatibility aliasing or shims: documentation additions only.

## Verification Layers

1. Case-numbering invariant -> codebase grep-proof: `## Case 32` is present and unique in `docs/stress-suite.md`, and Case 31 remains the prior case.
2. Matrix-format invariant -> grep-proof: the `| Case 32 |` row exists in `docs/stress-coverage-matrix.md` with four cells, and no malformed `| 32 |` row is present.
3. Gap-note invariant -> grep-proof: the matrix records the Cases 27–31 coverage gap as pre-existing out-of-scope context.

## What to Change

### 1. `docs/stress-suite.md`

Append `## Case 32 — Cross-segment salience duplicate calibration` after Case 31, with the setup and expected-prompt-behavior bullets from spec §7.10 (high-salience BELIEF with behavioral effect; ordinary low-salience setting FACT; critical current-state FACT; immediate_previous high-relevance EVENT; low-relevance backstory EVENT; full SECRET lane set; action-driving VISIBLE AFFORDANCE; long-dossier active cast member with a voice pin — and the expected rendering for each).

### 2. `docs/stress-coverage-matrix.md`

Add the Case 32 row in the table's 4-column `| Case 32 | <name> | <risk area> | <implemented capability incl. golden/test proof> |` format (spec §7.11, corrected), folding the golden-diff/compiler-pressure-test proof into the capability column. Add the one-line note that the numbered table predates Cases 27–31 and that backfilling them is out of scope here.

## Files to Touch

- `docs/stress-suite.md` (modify)
- `docs/stress-coverage-matrix.md` (modify)

## Out of Scope

- Backfilling coverage-matrix rows for Cases 27–31 (pre-existing drift; spec §7.11 excludes it).
- All compiler/template/contract changes (PRODUPVERSPE-001, -002, -003).
- Any schema change, any FOUNDATIONS amendment, and the optional FACT/backstory warning (spec §7.7/§7.9).

## Acceptance Criteria

### Tests That Must Pass

1. `grep -Fq "## Case 32 — Cross-segment salience duplicate calibration" docs/stress-suite.md` — Case 32 present.
2. `grep -Fq "| Case 32 |" docs/stress-coverage-matrix.md` — matrix row present in 4-column format; `grep -Fc "| 32 |" docs/stress-coverage-matrix.md` returns 0 (no malformed row).
3. `npm test` — full suite green (no behavioral change; confirms the docs additions break nothing).

### Invariants

1. The coverage-matrix Case 32 row matches the table's existing 4-column `| Case N |` convention exactly.
2. Case 32 asserts that voice pins, secret lanes, and behavioral-effect belief pressure remain dual-framed while ordinary FACT/backstory-EVENT text is not copied to the front.

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based grep-proofs (Acceptance Criteria) and the existing pipeline coverage named in Assumption Reassessment.`

### Commands

1. `grep -Fq "## Case 32 — Cross-segment salience duplicate calibration" docs/stress-suite.md && grep -Fq "| Case 32 |" docs/stress-coverage-matrix.md`
2. `npm test`
3. A narrower command is the correct boundary here: the deliverable is conceptual documentation with no executable assertion, so grep-proofs plus a full-suite no-regression run are the complete verification surface.

## Outcome

Completed: 2026-06-09

What changed:

- Added stress-suite Case 32 for cross-segment salience duplicate calibration.
- Documented the expected behavior that behavioral-effect BELIEF pressure, current/critical FACT pressure, immediate/recent EVENT pressure, secret lane separation, affordance action placement, and voice-pin salience remain calibrated.
- Added the Case 32 row to `docs/stress-coverage-matrix.md` using the existing four-column `| Case N |` table format.
- Added the note that Cases 27-31 are a pre-existing coverage-matrix gap and are out of scope for this ticket.

Deviations from original plan:

- None.

Verification:

- `grep -Fq "## Case 32 — Cross-segment salience duplicate calibration" docs/stress-suite.md && grep -Fq "| Case 32 |" docs/stress-coverage-matrix.md && test "$(grep -Fc "| 32 |" docs/stress-coverage-matrix.md)" -eq 0 && grep -Fq "predates Cases 27-31" docs/stress-coverage-matrix.md` — passed.
- `npm test` — passed, 99 files / 734 tests.
