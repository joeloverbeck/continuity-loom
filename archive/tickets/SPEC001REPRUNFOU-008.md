# SPEC001REPRUNFOU-008: Requirements-doc completion updates

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — docs only: `IMPLEMENTATION-ORDER.md` Phase 1 status/gate, `TECHNOLOGY-DECISIONS.md` Phase-1-realized note
**Deps**: SPEC001REPRUNFOU-007

## Problem

When Phase 1's gate passes, the requirements docs must record the work as done so the build order stays an accurate ledger. This cross-cutting docs ticket marks `IMPLEMENTATION-ORDER.md` Phase 1 implemented and adds a Phase-1-realized note to `TECHNOLOGY-DECISIONS.md`, without rewriting any existing rationale.

## Assumption Reassessment (2026-06-05)

1. `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` exists with a "## Phase 1 — Repository and runtime foundation" heading and a five-bullet "Phase gate:" block (verified this session). `docs/requirements-version-1/TECHNOLOGY-DECISIONS.md` exists with "Recommended v1 stack" / "Done Means" sections.
2. `specs/SPEC-001-repository-and-runtime-foundation.md` §"Requirements-doc updates on completion" specifies exactly these two edits and explicitly states no other `docs/requirements-version-1/*` file is marked done by this spec.
3. Shared boundary under audit: the requirements-doc ledger. This ticket annotates completion; it must not alter the ordering rationale, later phases, or the deferred (storage/OpenRouter/packaging) decisions.
4. §20 (durable change & human gatekeeping / no silent retcon): the edits are *additive completion annotations* (a status line + checked gate bullets + a realized-in-code note), not a rewrite of the original decisions — the causal narrative of the docs is preserved. This is the change rationale required for modifying existing committed docs.

## Architecture Check

1. A single trailing docs ticket lets the completion annotations land atomically once the gate (007) is verified, avoiding a window where the docs claim "done" before the gate passes. Per-bullet co-location with implementation tickets would create exactly that staleness window.
2. No backwards-compatibility aliasing/shims; additive annotations only.

## Verification Layers

1. Phase 1 marked implemented -> codebase grep-proof: `grep -n "Implemented via SPEC-001" docs/requirements-version-1/IMPLEMENTATION-ORDER.md` returns the new status line.
2. Gate bullets satisfied -> codebase grep-proof: the Phase 1 gate block shows checked items or a "Verified by SPEC-001" note.
3. Tech-decisions note added -> codebase grep-proof: `grep -n "SPEC-001" docs/requirements-version-1/TECHNOLOGY-DECISIONS.md` returns the realized-in-code note.
4. No collateral edits -> manual review: `git diff` touches only the Phase-1 region of IMPLEMENTATION-ORDER and the one note in TECHNOLOGY-DECISIONS; later phases and existing rationale are unchanged.

## What to Change

### 1. `IMPLEMENTATION-ORDER.md` Phase 1

Add a status line under the Phase 1 heading (`Status: ✅ Implemented via SPEC-001 (2026-…)`); mark the five Phase-1 gate bullets satisfied (checked items or a "Verified by SPEC-001" note). Do not alter the ordering rationale or any later phase.

### 2. `TECHNOLOGY-DECISIONS.md` Phase-1 note

Add a one-line note (near "Recommended v1 stack" / "Done Means") that the Phase-1 stack is realized in code per SPEC-001 (Node 24 LTS + TypeScript, React + Vite, WSL2 path, npm workspaces, Fastify localhost server, Vitest). Do not remove or rewrite existing rationale or the deferred choices.

## Files to Touch

- `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (modify)
- `docs/requirements-version-1/TECHNOLOGY-DECISIONS.md` (modify)

## Out of Scope

- Any other `docs/requirements-version-1/*` file (`LOCAL-FIRST-STORAGE.md`, `DATA-MODEL-AND-RECORDS.md`, `VALIDATION-ENGINE.md`, `PROMPT-COMPILER.md`, etc. stay open for their later-phase specs).
- Code changes (all in 001–006).

## Acceptance Criteria

### Tests That Must Pass

1. `grep -n "SPEC-001" docs/requirements-version-1/IMPLEMENTATION-ORDER.md docs/requirements-version-1/TECHNOLOGY-DECISIONS.md` returns the new annotations in both files.
2. `git diff --stat` shows only the two requirements docs changed.

### Invariants

1. Only the Phase-1 region of IMPLEMENTATION-ORDER and one note in TECHNOLOGY-DECISIONS are changed; later phases and existing decision rationale are untouched.

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based and existing pipeline coverage is named in Assumption Reassessment.`

### Commands

1. `grep -n "SPEC-001" docs/requirements-version-1/IMPLEMENTATION-ORDER.md docs/requirements-version-1/TECHNOLOGY-DECISIONS.md`
2. `git diff --stat docs/requirements-version-1/`

## Outcome

Updated the requirements ledger after the Phase 1 gate passed. Added the
SPEC-001 completion status and checked Phase 1 gate bullets in
`IMPLEMENTATION-ORDER.md`, and added one Phase-1-realized stack note in
`TECHNOLOGY-DECISIONS.md`. Verified with the requested `grep -n "SPEC-001" ...`
and `git diff --stat docs/requirements-version-1/`, which showed only those two
requirements docs changed.
