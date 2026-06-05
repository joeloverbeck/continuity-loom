# SPEC005CUSCASGEN-008: Phase-5 verification smoke + governing-doc updates + archival

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — governing-doc updates (`IMPLEMENTATION-ORDER.md`, `UI-WORKFLOWS.md`, `DATA-MODEL-AND-RECORDS.md`); SPEC-005 archival
**Deps**: SPEC005CUSCASGEN-005, SPEC005CUSCASGEN-006, SPEC005CUSCASGEN-007

## Problem

Once the Phase-5 surfaces ship, the SPEC-005 §Verification manual smoke (`UI-WORKFLOWS.md` "Done Means") must pass, the governing docs must record Phase-5 completion (SPEC-005 Deliverable 5), and the spec must be archived. This is a capstone (manual-runbook variant — UI smoke, no browser-automation harness in the repo) combined with the cross-cutting docs update; it introduces no production logic.

## Assumption Reassessment (2026-06-05)

1. The implementation tickets SPEC005CUSCASGEN-001…007 compose the Phase-5 surfaces; this ticket adds no production code. The manual smoke follows `docs/requirements-version-1/UI-WORKFLOWS.md:257-273` "Done Means" plus SPEC-005 §Verification "Manual smoke".
2. The docs to update exist: `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` Phase 5 (`:87-98`, currently with no Status line — Phases 1-4 carry `Status: ✅ Implemented via SPEC-00N (2026-06-05)` at `:23/:39/:56/:72`); `docs/requirements-version-1/UI-WORKFLOWS.md` (the Phase-4 note pattern at `:239`); `docs/requirements-version-1/DATA-MODEL-AND-RECORDS.md` (the Phase-4 note at `:211`). Archival per `docs/archival-workflow.md` moves the spec to `archive/specs/` (which already holds SPEC-001…004).
3. Shared boundary under audit: the docs reference the surfaces built by tickets 005/006/007 (and transitively 001-004); the status flip is gated on the manual smoke passing. No `compiler-contract.md` / `prompt-template.md` / `story-record-schema.md` change is required — Phase 5 introduces no prompt placeholders and no schema fields (SPEC-005 Deliverable 5).
4. (FOUNDATIONS §8 anti-drift / §20) The doc updates keep `IMPLEMENTATION-ORDER` / `UI-WORKFLOWS` / `DATA-MODEL` consistent with the landed implementation (drift between template, schema, and docs is a continuity bug); the spec's archived Outcome section makes the landed work explicit (no silent retcon).

## Architecture Check

1. A single trailing ticket lands the manual smoke plus the doc status updates atomically once tickets 005/006/007 exist, avoiding a staleness window where the docs claim Phase 5 is done before the UI works. A manual runbook (no browser-automation harness in the repo) plus grep-proof doc assertions is the correct verification boundary for a UI-completion phase.
2. No backwards-compatibility aliasing or shims — docs-only plus the archival move; no production surface is touched.

## Verification Layers

1. Manual smoke passes → implementer runbook checklist (open project → author a CAST MEMBER through the sectioned editor → assign active/onstage / present-minor / offstage bands and `local_function` → fill the brief across all eight surfaces → confirm an override stays generation-time-only → confirm the paste-guard and non-local flag warn but do not block → server binds `127.0.0.1` only).
2. `IMPLEMENTATION-ORDER.md` Phase 5 status line added → grep-proof (`Status: ✅ Implemented via SPEC-005`).
3. `UI-WORKFLOWS.md` + `DATA-MODEL-AND-RECORDS.md` Phase-5 notes added → grep-proof.
4. Spec archived → `test ! -f specs/SPEC-005-custom-cast-and-generation-brief-editors.md` and `test -f archive/specs/SPEC-005-custom-cast-and-generation-brief-editors.md`.

## What to Change

### 1. Manual smoke runbook (verification-only)

Document and execute the click-path with each step's expected observable per `UI-WORKFLOWS.md` "Done Means"; run `npm start` and confirm the server binds `127.0.0.1` only.

### 2. Governing-doc updates

In `IMPLEMENTATION-ORDER.md` Phase 5, add `Status: ✅ Implemented via SPEC-005 (YYYY-MM-DD).` and check the Phase-5 gate bullets satisfied (do not alter ordering rationale or later phases). In `UI-WORKFLOWS.md` and `DATA-MODEL-AND-RECORDS.md`, add a short "Phase 5 implementation note" recording the custom CAST MEMBER editor, the generation-time brief workflow, the full-session persistence routes, cast inclusion bands + `local_function`, and the "what will compile" conceptual preview — leaving the validation engine (Phase 6), prompt compiler (Phase 7), and prompt preview (Phase 8) open. No `compiler-contract.md` / `prompt-template.md` / `story-record-schema.md` change.

### 3. Archive

Flip the spec's Status to COMPLETED and add an Outcome section (per `docs/archival-workflow.md`), then `git mv specs/SPEC-005-custom-cast-and-generation-brief-editors.md archive/specs/`.

## Files to Touch

- `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (modify)
- `docs/requirements-version-1/UI-WORKFLOWS.md` (modify)
- `docs/requirements-version-1/DATA-MODEL-AND-RECORDS.md` (modify)
- `specs/SPEC-005-custom-cast-and-generation-brief-editors.md` (modify — Status flip + Outcome, then moved)
- `archive/specs/SPEC-005-custom-cast-and-generation-brief-editors.md` (new — destination of the move)

## Out of Scope

- Any production code (SPEC005CUSCASGEN-001…007 own it).
- `compiler-contract.md` / `prompt-template.md` / `story-record-schema.md` edits (Phase 5 adds no placeholders or schema fields).
- Phase 6+ surfaces (validation engine, compiler, preview).

## Acceptance Criteria

### Tests That Must Pass

1. Grep-proofs: `IMPLEMENTATION-ORDER.md` Phase 5 shows `Status: ✅ Implemented via SPEC-005`; `UI-WORKFLOWS.md` and `DATA-MODEL-AND-RECORDS.md` each carry a Phase-5 implementation note.
2. Archival: `specs/SPEC-005-...md` no longer exists and `archive/specs/SPEC-005-...md` does.
3. `npm run typecheck && npm run lint && npm test && npm run build` all green (no production regression introduced by the docs/archival change).

### Invariants

1. The governing docs match the landed Phase-5 implementation; no `compiler-contract` / `prompt-template` / `story-record-schema` change is made.
2. The spec exists in exactly one location after archival (moved, not copied).

## Test Plan

### New/Modified Tests

1. `None — documentation/verification-only ticket; verification is command-based (grep-proofs + archival path checks) and the manual smoke runbook, with implementation coverage provided by SPEC005CUSCASGEN-001…007 named in Assumption Reassessment.`

### Commands

1. `grep -n "Status: ✅ Implemented via SPEC-005" docs/requirements-version-1/IMPLEMENTATION-ORDER.md` and `grep -ni "phase 5 implementation note" docs/requirements-version-1/UI-WORKFLOWS.md docs/requirements-version-1/DATA-MODEL-AND-RECORDS.md` — doc grep-proofs.
2. `npm run typecheck && npm run lint && npm test && npm run build` — full CI gate (confirms the docs/archival change introduces no regression).
3. `test ! -f specs/SPEC-005-custom-cast-and-generation-brief-editors.md && test -f archive/specs/SPEC-005-custom-cast-and-generation-brief-editors.md` — archival boundary; plus a manual `npm start` smoke for the UI runbook (no browser-automation harness exists, so the smoke is an implementer checklist).
