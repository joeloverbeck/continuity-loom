# SPEC002LOCPROFOL-006: Requirements-doc updates on Phase-2 completion

**Status**: ✅ COMPLETED
**Priority**: LOW
**Effort**: Small
**Engine Changes**: Yes — docs only: `IMPLEMENTATION-ORDER.md` Phase-2 status + `LOCAL-FIRST-STORAGE.md` realized-via-SPEC-002 note
**Deps**: SPEC002LOCPROFOL-005

## Problem

Once Phase-2 implementation and verification are green, the requirements docs must
record that the storage subset shipped — mirroring how Phase 1 records
`Status: ✅ Implemented via SPEC-001 (2026-06-05).` This is SPEC-002 Deliverable 6,
explicitly performed when Verification passes, not as a precondition.

## Assumption Reassessment (2026-06-05)

1. `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` Phase 1 carries
   `Status: ✅ Implemented via SPEC-001 (2026-06-05).` and uses `- [x]` checkbox
   gate bullets; Phase 2 currently has **no** Status line and plain `- ` gate
   bullets (lines under "## Phase 2 — Local project folder and SQLite storage
   foundation"). This ticket adds the Status line and marks the Phase-2 gate
   bullets satisfied, matching the existing Phase-1 format. Later phases and the
   ordering rationale are not altered.
2. `docs/requirements-version-1/LOCAL-FIRST-STORAGE.md` has no SPEC-002 reference
   yet; SPEC-002 Deliverable 6 asks for a short note that the Phase-2 storage
   subset (project folder, canonical `loom.sqlite`, metadata, version gate, backup
   workflow) is realized via SPEC-002, leaving the migration runner and
   accepted-prose-archive separation (later phases) open.
3. Shared boundary under audit: the two requirements docs are the cross-artifact
   contract recording phase completion; this ticket only annotates *aggregate
   completion* of SPEC-002's implementation tickets (001–005), citing no
   individual code symbol that could go stale — hence `Deps:` on the trailing
   implementation ticket (005) suffices.

## Architecture Check

1. A single trailing docs-only ticket keeps the requirements ledger updated
   atomically once the implementation is verified, avoiding a premature
   "implemented" claim co-located with in-progress code. It mirrors the existing
   Phase-1 status convention rather than inventing a new annotation style.
2. No backwards-compatibility aliasing/shims: documentation edits only.

## Verification Layers

1. Phase-2 status recorded -> codebase grep-proof:
   `grep "Implemented via SPEC-002" docs/requirements-version-1/IMPLEMENTATION-ORDER.md`
   matches and sits under the Phase-2 heading.
2. Phase-2 gate satisfied -> grep-proof: the Phase-2 gate bullets render as
   satisfied (`- [x]`) consistent with the Phase-1 format.
3. Storage realized-note present -> grep-proof:
   `grep "SPEC-002" docs/requirements-version-1/LOCAL-FIRST-STORAGE.md` matches,
   and the migration-runner / accepted-prose separation remain described as open.
4. No code change -> manual review: Files to Touch are markdown docs only.

## What to Change

### 1. IMPLEMENTATION-ORDER Phase 2 status

Under "## Phase 2 — Local project folder and SQLite storage foundation", add
`Status: ✅ Implemented via SPEC-002 (<completion-date>).` and mark the Phase-2
phase-gate bullets satisfied (`- [x]`), matching the Phase-1 block. Do not alter
ordering rationale, the cross-spec table, or later phases.

### 2. LOCAL-FIRST-STORAGE realized note

Add a short note (e.g. under "Done Means" or "Migration and versioning
expectations") that the Phase-2 storage subset — project folder, canonical
`loom.sqlite`, readable metadata, app/schema version gate, and `VACUUM INTO`
backup workflow — is realized in code via SPEC-002, while the migration runner and
the accepted-prose-archive physical/logical separation remain open for later
phases.

## Files to Touch

- `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (modify)
- `docs/requirements-version-1/LOCAL-FIRST-STORAGE.md` (modify)

## Out of Scope

- Any code change (all owned by SPEC002LOCPROFOL-001–005).
- Editing `specs/SPEC-002-*.md` (specs are not edited by ticket implementation) or
  archiving SPEC-002 (separate archival step per `docs/archival-workflow.md`).
- Documenting the deferred migration runner / accepted-prose separation beyond
  noting they remain open.

## Acceptance Criteria

### Tests That Must Pass

1. `grep -n "Implemented via SPEC-002" docs/requirements-version-1/IMPLEMENTATION-ORDER.md`
   returns a match under the Phase-2 heading.
2. `grep -n "SPEC-002" docs/requirements-version-1/LOCAL-FIRST-STORAGE.md` returns
   the realized-note match.
3. `npm run lint && npm run typecheck && npm test && npm run build` — all green
   (unchanged; docs edits do not break the pipeline).

### Invariants

1. Only the Phase-2 status/gate lines and a single LOCAL-FIRST note change; later
   phases, ordering rationale, and the cross-spec table are untouched.
2. The migration runner and accepted-prose-archive separation remain described as
   open (no overclaim of deferred scope).

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based and existing
   pipeline coverage is named in Assumption Reassessment.`

### Commands

1. `grep -n "Implemented via SPEC-002" docs/requirements-version-1/IMPLEMENTATION-ORDER.md`
2. `grep -n "SPEC-002" docs/requirements-version-1/LOCAL-FIRST-STORAGE.md`
3. `npm run lint && npm run typecheck && npm test && npm run build`

## Outcome

Completed: 2026-06-05.

- Marked Phase 2 implemented via SPEC-002, checked the Phase 2 gate bullets, and added the SPEC-002 realized-storage note to `LOCAL-FIRST-STORAGE.md`.
- Deviation from plan: root lint required increasing the explicit typescript-eslint default-project file-count guard after the new test files expanded the analyzed test set.
- Verification: both grep checks passed; `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` passed before archival.
