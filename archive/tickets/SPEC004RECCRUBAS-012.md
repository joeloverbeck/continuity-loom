# SPEC004RECCRUBAS-012: Governing-doc updates for Phase 4 completion

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — documentation only (`IMPLEMENTATION-ORDER.md`, `DATA-MODEL-AND-RECORDS.md`, `UI-WORKFLOWS.md`)
**Deps**: SPEC004RECCRUBAS-011

## Problem

When Phase 4 is implemented and verified, the governing docs must record it so the roadmap stays the single source of truth for "what's next." This cross-cutting docs ticket marks Phase 4 complete in `IMPLEMENTATION-ORDER.md` and adds short Phase-4 implementation notes to the data-model and UI-workflow specs. It lands last, after the capstone gate (-011) confirms the phase is actually done, so the status lines do not claim completion prematurely.

## Assumption Reassessment (2026-06-05)

1. The doc targets exist with the expected current state: `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` Phase 4 (lines ~70–83) has no `Status:` line and unchecked phase-gate bullets (Phases 1–3 above it carry `Status: ✅ Implemented via SPEC-00N` + checked bullets — the pattern to mirror); `docs/requirements-version-1/DATA-MODEL-AND-RECORDS.md` carries a "Phase 3 implementation note" (the pattern for a "Phase 4 implementation note"); `docs/requirements-version-1/UI-WORKFLOWS.md` has no implementation note yet.
2. Spec `specs/SPEC-004-...md` Deliverable 5 specifies exactly these updates and constrains them: mark Phase 4 done + check its gate bullets without altering ordering rationale or later phases; add a Phase-4 note to the data-model/UI specs; **no** `compiler-contract.md`/`prompt-template.md`/`story-record-schema.md` change is required from Phase 4 (SPEC004RECCRUBAS-002 already reconciles the one `story-record-schema.md` note it needs).
3. Cross-artifact boundary under audit: these docs annotate **aggregate completion** of the implemented surfaces; the capstone (-011) already gates every referenced surface, so `Deps: -011` is the correct and sufficient dependency (no per-surface symbol citation that could go stale independently). This ticket cites no individual API/symbol, only phase-level status.

## Architecture Check

1. A single trailing docs ticket lets all status/notes land atomically once the phase is verified, avoiding a window where a doc claims Phase 4 done while code is mid-flight. Mirroring the existing SPEC-001/002/003 status-line + Phase-3-note patterns keeps the docs uniform.
2. No backwards-compatibility shim: documentation edits only; no code, no alias.

## Verification Layers

1. Phase 4 status line + checked gate bullets present in `IMPLEMENTATION-ORDER.md` -> grep-proof for `✅ Implemented via SPEC-004`.
2. Phase-4 implementation notes present in the data-model and UI specs -> grep-proof for the note strings.
3. Ordering rationale and later phases unchanged -> manual review (diff scoped to Phase 4 status + the two notes).

## What to Change

### 1. IMPLEMENTATION-ORDER.md

Add `Status: ✅ Implemented via SPEC-004 (YYYY-MM-DD).` under Phase 4 and check the Phase-4 gate bullets satisfied (full CRUD for every record type; browser type/status/search/reference filtering; manual working-set toggle; reference-protected delete/archive; no raw-JSON editor; no LLM assistance). Leave ordering rationale and Phases 5–14 untouched.

### 2. DATA-MODEL-AND-RECORDS.md + UI-WORKFLOWS.md

Add a short "Phase 4 implementation note" to each, recording that full CRUD, the dense browser, generic typed editors (incl. a complete generic CAST MEMBER editor), the three global-config editors, minimal manual working-set membership toggling, and reference-protected delete/archive are realized via SPEC-004 — leaving the custom CAST MEMBER / generation-brief editors (Phase 5), validation (Phase 6), and compilation (Phase 7) open.

## Files to Touch

- `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (modify)
- `docs/requirements-version-1/DATA-MODEL-AND-RECORDS.md` (modify)
- `docs/requirements-version-1/UI-WORKFLOWS.md` (modify)

## Out of Scope

- `compiler-contract.md` / `prompt-template.md` / `story-record-schema.md` edits (none required for Phase 4; the one schema-doc note is owned by SPEC004RECCRUBAS-002).
- Any code or test change — implementation is owned by SPEC004RECCRUBAS-001..-010 and verified by -011.
- Editing Phases 5–14 or the ordering rationale.

## Acceptance Criteria

### Tests That Must Pass

1. `grep -n "✅ Implemented via SPEC-004" docs/requirements-version-1/IMPLEMENTATION-ORDER.md` returns the Phase-4 status line.
2. The Phase-4 gate bullets under Phase 4 are marked satisfied; Phases 5–14 and the ordering rationale are unchanged (scoped diff review).
3. A "Phase 4 implementation note" string is present in both `DATA-MODEL-AND-RECORDS.md` and `UI-WORKFLOWS.md`.

### Invariants

1. No later phase's status or rationale is altered (the roadmap remains the authoritative next-step source).
2. Docs reflect only what -011 verified as actually shipped (no premature completion claims).

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based and the implemented surfaces are gated by the SPEC004RECCRUBAS-011 capstone named in Assumption Reassessment.`

### Commands

1. `grep -n "✅ Implemented via SPEC-004" docs/requirements-version-1/IMPLEMENTATION-ORDER.md`
2. `grep -n "Phase 4 implementation note" docs/requirements-version-1/DATA-MODEL-AND-RECORDS.md docs/requirements-version-1/UI-WORKFLOWS.md`
