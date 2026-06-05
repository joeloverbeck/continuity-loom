# SPEC008PROPREGAT-004: Phase-8 completion — manual smoke, governing-doc updates, spec archival

**Status**: PENDING
**Priority**: LOW
**Effort**: Medium
**Engine Changes**: Yes — governing docs (`IMPLEMENTATION-ORDER.md` Phase-8 status, `UI-WORKFLOWS.md` Phase-8 note) + archival move of the spec to `archive/specs/`. No product code.
**Deps**: SPEC008PROPREGAT-003

## Problem

Once the prompt-preview surface ships (001-003), SPEC-008's end-of-phase obligations
remain: run the manual smoke that the surface's §Verification specifies (no
browser-automation harness exists in the project, so it cannot be a CI test), record Phase
8 as implemented in the sequencing and workflow docs, and archive the spec per the
archival workflow. This trailing capstone exercises the composed pipeline by hand and
performs the completion bookkeeping atomically.

## Assumption Reassessment (2026-06-05)

1. The implementation surface exists only after SPEC008PROPREGAT-003 (the `/preview` route,
   `PromptPreviewView`, nav promotion). This ticket adds no product code; it depends on 003
   (which transitively depends on 001 + 002), so `Deps: SPEC008PROPREGAT-003` covers the
   full chain. **Change rationale (§20):** the doc edits annotate aggregate Phase-8
   completion — no silent retcon of phase status, and the spec file moves rather than being
   deleted (history preserved in `archive/specs/`).
2. Target docs verified present: `docs/requirements-version-1/IMPLEMENTATION-ORDER.md`
   (Phase 8 section), `docs/requirements-version-1/UI-WORKFLOWS.md` ("Prompt preview" /
   "Validation panel"), and `docs/archival-workflow.md` (canonical archival process).
   `archive/specs/` exists and already holds SPEC-001…007. The spec under move is
   `specs/SPEC-008-prompt-preview-gated-by-validation.md`. Mirror the existing completed-
   phase marker format already used for Phases 1-7 when adding the Phase-8 status line.
3. Shared boundary under audit: the governing-doc completion contract. Per SPEC-008
   Deliverable 4 — add `Status: ✅ Implemented via SPEC-008 (YYYY-MM-DD).` to Phase 8 and
   check its gate bullets satisfied (without altering ordering rationale or later phases);
   add a short "Phase 8 implementation note" to UI-WORKFLOWS recording the validation-gated,
   no-partial-preview, copy/search/clear, external-version-metadata, ephemeral/not-canon
   surface, leaving Phases 9-12 open.
4. FOUNDATIONS principles the smoke verifies before trusting the narrative: §22 prompt
   inspection is ephemeral / key-free / easy-to-clear and not a permanent archive; §29.9 no
   key in prompt inspection UI and no committed prompt logs; §4.5 fail-closed (no prompt
   when blocked). The manual smoke is the human gate confirming these at runtime.

## Architecture Check

1. Merging the manual-runbook capstone with the docs/bookkeeping into one trailing ticket
   is correct here: the smoke has no automation harness, and the status flip + note are
   gated on that smoke passing, so both depend on the same upstream leaf (003) and splitting
   would only add a needless inter-ticket dependency. The doc note annotates *aggregate*
   completion (not individually-staleable symbols), so `Deps: 003` is more legible than
   re-enumerating each surface.
2. No backwards-compatibility aliasing/shims: the spec is moved, not duplicated; no doc
   keeps a parallel stale Phase-8 status.

## Verification Layers

1. Phase-8 status line present in the sequencing doc → grep-proof (`grep -n "Implemented via SPEC-008" docs/requirements-version-1/IMPLEMENTATION-ORDER.md`).
2. Phase-8 implementation note present in the workflow doc → grep-proof (`grep -ni "Phase 8" docs/requirements-version-1/UI-WORKFLOWS.md`).
3. Spec archived → `test -f archive/specs/SPEC-008-prompt-preview-gated-by-validation.md` is true AND `test ! -f specs/SPEC-008-prompt-preview-gated-by-validation.md` is true.
4. Runtime behavior matches the §Verification gate (no prompt when blocked; complete prompt + external version triple + fingerprint when not; copy/clear work; no persisted prompt and no key in console/network) → manual review (runbook below — not CI-runnable, no browser-automation harness).

## What to Change

### 1. Manual smoke runbook (perform before the doc edits)

Follow SPEC-008 §Verification "Manual smoke":
1. `npm start`; open the app and open a project.
2. With blockers present, visit "Validation / Prompt Preview"; confirm the blocker list
   shows and **no prompt** is visible.
3. Resolve the blockers, click **Refresh preview**; confirm a complete prompt renders with
   the template/compiler/contract version triple + fingerprint **outside** the prompt body.
4. Confirm **Copy prompt** copies the exact text and **Clear** empties the surface.
5. Confirm the browser console and network logs contain **no persisted prompt and no API
   key**.
Record pass/fail for each step in the PR description.

### 2. `IMPLEMENTATION-ORDER.md` — Phase 8 status

Add `Status: ✅ Implemented via SPEC-008 (<completion-date>).` to the Phase 8 entry and
check its gate bullets as satisfied. Do not alter ordering rationale or later phases.

### 3. `UI-WORKFLOWS.md` — Phase 8 implementation note

Add a short note that the validation-gated prompt-preview surface (no-partial-preview,
copy/search/clear, external version metadata, ephemeral/not-canon) is realized via
SPEC-008, with OpenRouter transport (Phase 9) and the candidate lifecycle (Phase 10)
still open.

### 4. Archive the spec

Move `specs/SPEC-008-prompt-preview-gated-by-validation.md` to `archive/specs/` per
`docs/archival-workflow.md`.

## Files to Touch

- `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (modify)
- `docs/requirements-version-1/UI-WORKFLOWS.md` (modify)
- `specs/SPEC-008-prompt-preview-gated-by-validation.md` → `archive/specs/SPEC-008-prompt-preview-gated-by-validation.md` (archival move)

## Out of Scope

- Any `packages/` product code — implemented in 001-003; this ticket is docs + archival +
  manual verification only.
- Phase 9-12 doc updates (OpenRouter, candidate lifecycle, accepted segments) — left open.
- Editing ordering rationale or later-phase entries in `IMPLEMENTATION-ORDER.md`.

## Acceptance Criteria

### Tests That Must Pass

1. `grep -n "Implemented via SPEC-008" docs/requirements-version-1/IMPLEMENTATION-ORDER.md` — prints the Phase-8 status line.
2. `grep -ni "Phase 8" docs/requirements-version-1/UI-WORKFLOWS.md` — prints the implementation note.
3. `test -f archive/specs/SPEC-008-prompt-preview-gated-by-validation.md && test ! -f specs/SPEC-008-prompt-preview-gated-by-validation.md` — archival move confirmed.

### Invariants

1. Phase status is recorded in exactly one place per doc (no stale duplicate Phase-8 status
   after the move).
2. The spec exists at exactly one path (archived), never both.

## Test Plan

### New/Modified Tests

1. `None — completion-bookkeeping + manual-smoke ticket; verification is command-based (grep / test -f) plus the manual runbook. Automated product coverage lives in SPEC008PROPREGAT-001/002/003.`

### Commands

1. `grep -n "Implemented via SPEC-008" docs/requirements-version-1/IMPLEMENTATION-ORDER.md && grep -ni "Phase 8" docs/requirements-version-1/UI-WORKFLOWS.md`
2. `test -f archive/specs/SPEC-008-prompt-preview-gated-by-validation.md && test ! -f specs/SPEC-008-prompt-preview-gated-by-validation.md`
3. The runtime gate is a manual smoke (no browser-automation harness in the project), so the CI-runnable boundary is the grep/`test` proofs above plus the existing `npm test` suite from 001-003; the §Verification behavior is the implementer runbook in What to Change §1.
