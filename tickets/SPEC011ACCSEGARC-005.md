# SPEC011ACCSEGARC-005: Phase-11 verification smoke + governing-doc completion

**Status**: PENDING
**Priority**: LOW
**Effort**: Medium
**Engine Changes**: None — manual verification runbook + governing-doc updates + spec archival; no product code
**Deps**: SPEC011ACCSEGARC-004

## Problem

SPEC-011's §Verification ends in a manual smoke (open a project, accept segments, browse, filter,
delete-with-confirm, export, confirm no prompt-context control and no key/prompt in logs) that no
automated harness in the repo exercises end-to-end, and its "governing-doc updates on completion"
deliverable (D8) flips the Phase-11 status, adds an implementation note, and archives the spec.
This trailing ticket runs the phase gate once all implementation tickets (001–004) have landed and
records completion in the governing docs — the capstone and cross-cutting-docs shapes merged,
since the docs flip is gated on the same smoke passing.

## Assumption Reassessment (2026-06-06)

1. **001–004 compose the full read/delete/browse pipeline this ticket exercises.** Verified by Deps chain: 001 (server `GET`/`DELETE` + repo delete), 002 (web clients), 003 (`AcceptedSegmentsView`), 004 (nav promotion). 004 is the leaf whose transitive `Deps` cover the whole chain, so `Deps: 004` is sufficient for the capstone. This ticket adds no production logic.
2. **The governing docs and archival target exist.** Verified: `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (Phase 11 gate), `docs/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md` (Phase-11 authority), `docs/archival-workflow.md` (canonical archival process), and `archive/specs/` (destination dir, already holds SPEC-001…010) all present; `specs/SPEC-011-accepted-segment-archive-and-browser.md` is present and not yet archived.
3. **Cross-artifact boundary under audit: the Phase-11 status/note lines and the `specs/` → `archive/specs/` move.** The docs annotate *aggregate completion* (a status flip + a short note), not individually-staleable symbols, so a single `Deps: 004` capstone gate is the legible dependency (per the merged-trailing-shape rule).
4. **FOUNDATIONS boundary to record honestly (§29.8#5 / Phase-12):** the persistent durable-change reminder is **not** in scope here — §29.8#5 is satisfied for now by SPEC-010's ephemeral post-accept notice (`GenerateView.tsx:145`), and the IMPLEMENTATION-ORDER + CANDIDATES notes must say the **persistent** reminder remains Phase 12 (no overclaim of completion). The dashboard latest-segment surfacing is likewise recorded as deferred, not delivered.
5. **Mismatch + correction:** the archival step is a file move governed by `docs/archival-workflow.md` (follow it for any index/cross-reference updates it mandates), not a delete — acceptance is `test -f archive/specs/SPEC-011-…md` AND `test ! -f specs/SPEC-011-…md`, not just absence from `specs/`.

## Architecture Check

1. Merging the capstone (manual smoke) and the docs/archival bookkeeping into one trailing ticket is cleaner than two: both depend on the same leaf (004) and the docs flip is gated on the smoke passing, so splitting would add a needless inter-ticket dependency. The docs cite no individually-staleable symbols, so per-surface `Deps` enumeration is unnecessary.
2. No backwards-compatibility shims. No code changes; the spec is moved, not duplicated or aliased.

## Verification Layers

1. Full automated gate green across the composed pipeline -> `npm run typecheck && npm run lint && npm test && npm run build` (re-run at ticket time; catches post-merge regression across 001–004).
2. Manual smoke (browse in order, filter, delete-with-confirm, export-all, no prompt-context control, no key/prompt in browser console/network logs) -> implementer runbook (no browser-automation harness exists; checklist below).
3. Governing-doc completion recorded -> grep-proofs: Phase-11 status line present in `IMPLEMENTATION-ORDER.md`; Phase-11 implementation note present in `CANDIDATES-AND-ACCEPTED-SEGMENTS.md`; both note the persistent reminder as Phase 12.
4. Archival boundary -> `test -f archive/specs/SPEC-011-accepted-segment-archive-and-browser.md` AND `test ! -f specs/SPEC-011-accepted-segment-archive-and-browser.md`.

## What to Change

### 1. Manual verification runbook (implementer-followed)

`npm start`; open a project; via **Generate / Candidate** accept one or more segments; open **Accepted Segments** and confirm: segments read in `sequence ASC` with the metadata panel; a substring filter narrows then restores the list; delete a segment with confirmation and confirm it disappears while the others keep order; export-all downloads Markdown/plain-text holding the prose (full archive, regardless of an active filter); there is no "use in prompt"/"include last segment" control anywhere; the browser console/network logs contain no API key and no full prompt. Each step's expected observable result is the pass condition.

### 2. `IMPLEMENTATION-ORDER.md` (modify)

Add `Status: ✅ Implemented via SPEC-011 (2026-06-06).` to Phase 11 (use the actual completion date) and check the Phase-11 gate bullets, noting the **persistent** durable-change reminder remains Phase 12 and the dashboard latest-segment surfacing (not delivered) remains later-phase.

### 3. `CANDIDATES-AND-ACCEPTED-SEGMENTS.md` (modify)

Add a short "Phase 11 implementation note": realized browser = `GET` list + `DELETE` with confirmation leaving sequence gaps un-renumbered, Markdown/plain-text export-all (full archive), simple client-side text filter, no prompt-context affordance, reminder deferred to Phase 12.

### 4. Archive the spec

Move `specs/SPEC-011-accepted-segment-archive-and-browser.md` → `archive/specs/` per `docs/archival-workflow.md` (apply any index/cross-reference updates that workflow mandates).

## Files to Touch

- `docs/requirements-version-1/IMPLEMENTATION-ORDER.md` (modify)
- `docs/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md` (modify)
- `specs/SPEC-011-accepted-segment-archive-and-browser.md` (modify — archival move to `archive/specs/`)

## Out of Scope

- Any production code change in `@loom/server`, `@loom/web`, or `@loom/core` (owned by 001–004).
- The persistent durable-change reminder and dashboard latest-segment surfacing (Phase 12 / later — recorded as deferred, not built).
- Editing the SPEC-011 deliverable content during archival (move only).

## Acceptance Criteria

### Tests That Must Pass

1. `npm run typecheck && npm run lint && npm test && npm run build` — all green across the composed 001–004 pipeline.
2. `grep -n "SPEC-011" docs/requirements-version-1/IMPLEMENTATION-ORDER.md` shows the Phase-11 status line; `grep -ni "phase 11" docs/requirements-version-1/CANDIDATES-AND-ACCEPTED-SEGMENTS.md` shows the implementation note; both reference the Phase-12 persistent reminder.
3. `test -f archive/specs/SPEC-011-accepted-segment-archive-and-browser.md && test ! -f specs/SPEC-011-accepted-segment-archive-and-browser.md` — archival boundary holds.
4. Manual runbook (§What to Change 1) completed with every step's expected observable result confirmed.

### Invariants

1. The governing docs record Phase 11 as complete **without** overclaiming Phase 12 (the persistent reminder stays deferred) — no silent retcon (§20).
2. The spec exists in exactly one location after archival (`archive/specs/`), never both.

## Test Plan

### New/Modified Tests

1. `None — verification-only ticket; CI coverage is the composed 001–004 test suites, and this ticket's verification is the full-pipeline gate + grep-proofs + the manual runbook.`

### Commands

1. `npm run typecheck && npm run lint && npm test && npm run build`
2. `grep -n "SPEC-011" docs/requirements-version-1/IMPLEMENTATION-ORDER.md; test -f archive/specs/SPEC-011-accepted-segment-archive-and-browser.md && test ! -f specs/SPEC-011-accepted-segment-archive-and-browser.md && echo ARCHIVED-OK`
3. A narrower per-package run is insufficient here — the capstone's contract is the cross-package gate plus the manual smoke, so the full pipeline command is the correct verification boundary.
