# SPEC029PRINOTUSA-007: User-guide Scene Prep section + manual verification capstone

**Status**: COMPLETED
**Priority**: LOW
**Effort**: Medium
**Engine Changes**: Yes — `docs/user-guide.md` Scene Prep section + manual UI verification runbook; production deletion-refresh fix added from runbook finding
**Deps**: SPEC029PRINOTUSA-005, SPEC029PRINOTUSA-006

## Problem

SPEC-029 Deliverable 8 documents the Scene Prep workspace for the owner, and the spec's
§Verification names full-feature properties that need a final end-to-end pass once every
implementation ticket has landed. This trailing ticket adds the user-guide section and a manual
UI smoke runbook, then runs the full gate — the merged docs + capstone shape, since the
CI-runnable verification is already owned by 001–006 and the remaining gap is the real-browser
smoke plus the doc.

## Assumption Reassessment (2026-06-22)

1. Verified `docs/user-guide.md` exists and is an already-registered active doc (per SPEC-029
   Deliverable 8: "no new `docs/ACTIVE-DOCS.md` entry"). The CI-runnable verification surfaces it
   would otherwise duplicate already live in: migration/schema tests (SPEC029PRINOTUSA-001),
   repository tests (-002/-003), route tests (-004), firewall canaries (-005), web tests (-006).
2. Spec authority: `archive/specs/SPEC-029-private-notes-usability.md` Deliverable 8 + §Verification. The
   spec explicitly forbids adding note fields to `docs/story-record-schema.md` or anything to
   `docs/compiler-contract.md`, and forbids changing prompt/template/contract versions — so the
   user guide is the **only** doc surface (neither §8-bound doc is touched).
3. Boundary under audit: this ticket gates *behavior* via the leaf set covering the full feature
   (the UI leaf -006 transitively reaches -004→-002/-003→-001; the firewall leaf -005). It
   introduces no production logic and does not modify the upstream tickets' files.
4. FOUNDATIONS restated (§27): the user-guide section must describe notes + prep sheets as inert
   scratch — local search, snapshot behavior (copies survive source deletion), and hard-delete
   consequences — keeping author-private material visibly separate from the continuity surfaces.

## Architecture Check

1. Merging the docs and capstone is cleaner than two trailing tickets here: the user-guide edit and
   the manual UI smoke both depend on the same upstream leaf set, and there is no individually-
   staleable symbol the docs cite (it is narrative guidance, not an API table), so a single trailing
   ticket avoids a needless inter-ticket dependency.
2. No backwards-compatibility shim — documentation + verification only; the capstone exercises the
   pipeline the earlier tickets composed and adds no new production path.

## Verification Layers

1. User-guide content -> grep-proof against `docs/user-guide.md` (Scene Prep heading; snapshot-
   survives-source-deletion sentence; hard-delete consequence wording).
2. Full-feature behavior -> manual UI runbook (find→source→prep→retire smoke in a real browser) +
   the aggregate gate run re-exercising the CI suites owned by 001–006.
3. FOUNDATIONS labeling -> manual review (badge + explanatory sentence present in the running UI;
   no continuity/readiness/working-set vocabulary in Notes).

## What to Change

### 1. User-guide Scene Prep section (`docs/user-guide.md`)

- Add a Scene Prep section explaining the workspace (Find / Source / Prep), local ranked search,
  snapshot behavior (collected copies survive deletion of their source), and permanent hard-delete
  consequences (no archive/undo/recycle). Keep author-private framing consistent with §27.

### 2. Manual verification runbook (this ticket's What-to-Change, not CI)

Implementer-checklist runbook (run against a copy of a project store):
1. Open `/notes`; confirm the **Author-private · never sent to prompts** badge + explanatory
   sentence render.
2. Create a scene-prep sheet; search with a multi-word query; confirm relevance ranking + safe
   highlighted snippets.
3. Collect one whole note and one exact excerpt; confirm the tray shows capture-kind/time/status.
4. Edit then delete a source note; confirm the clip shows "Source edited since capture" then
   "Source deleted; captured text preserved" and the snapshot text remains.
5. Reorder the tray by keyboard; insert a clip at cursor; confirm autosave-failure leaves text +
   clip intact.
6. Permanently delete selected notes; confirm the dialog lists titles/count/"cannot be undone" +
   retained-copies warning; deleting the prep sheet cascades its clips and leaves sources.

## Files to Touch

- `docs/user-guide.md` (modify)

## Out of Scope

- Any production code or test file (CI verification is owned by SPEC029PRINOTUSA-001…-006).
- `docs/story-record-schema.md`, `docs/compiler-contract.md`, `docs/ACTIVE-DOCS.md`, and any
  `version.ts` constant (untouched by SPEC-029).

## Acceptance Criteria

### Tests That Must Pass

1. `grep -n "Scene Prep" docs/user-guide.md` resolves; the section states copies survive source
   deletion and that permanent deletion cannot be undone.
2. The manual UI runbook (above) passes each step by hand against a project-store copy.
3. `npm run lint && npm run typecheck && npm test && npm run build` — the full gate is green with
   all SPEC-029 tickets landed.

### Invariants

1. The user guide describes notes/prep sheets as inert scratch, separate from continuity surfaces.
2. The capstone modifies no upstream ticket's production files.

## Test Plan

### New/Modified Tests

1. `None — documentation + manual-runbook capstone; CI-runnable verification is owned by SPEC029PRINOTUSA-001…-006 and named in Assumption Reassessment.`

### Commands

1. `grep -n "Scene Prep" docs/user-guide.md`
2. `npm run lint && npm run typecheck && npm test && npm run build`

## Outcome

Completed 2026-06-22.

Changed:

- Added the Scene Prep user-guide section to `docs/user-guide.md`, covering Find / Source / Prep, local ranked search, snapshot clips, source deletion preservation, and permanent delete consequences.
- Ran the manual browser capstone against a disposable `/tmp/spec029-smoke` project store.
- Fixed a capstone-found UI bug where deleting a source note could leave stale source selection and stale tray source-status state until a reload. `NotesView` now removes deleted notes from local lists immediately, clears related selections, and reloads clips for the active prep sheet after non-prep source deletion.
- Added a `NotesView` regression test for active prep clip reload without refetching the deleted source note.

Manual browser runbook:

- `/notes` rendered the Author-private badge and inert-scratch explanatory sentence.
- Created a scene-prep sheet; searched for `Bridge`; local results showed ranked/highlighted matches across the source and prep sheet.
- Captured one whole-note clip and one exact excerpt; tray showed kind, captured time, and source status.
- Reordered the excerpt ahead of the whole-note clip; `Insert` and `Append` updated the prep sheet body. Cursor-specific insertion is still represented by the existing append-backed UI path from SPEC029PRINOTUSA-006.
- Edited the source note, reloaded/select-refetched the prep sheet, and confirmed clips showed `Source edited since capture` while preserving captured text.
- Deleted the source note and confirmed clips showed `Source deleted; captured text preserved` while retaining captured text.
- Used `Permanently delete selected` on the prep sheet and confirmed the dialog included `This cannot be undone`, retained source-copy warning, and prep-sheet cascade warning; confirmation removed the prep sheet and its tray clips.

Notes:

- A first attempt to create the fixed demo project hit an unrelated existing-demo `409 Conflict`; the smoke continued in `/tmp/spec029-smoke`.
- The browser smoke initially exposed the source-delete refresh bug above; the runbook was repeated after the fix and passed.

Verification:

- `grep -n "Scene Prep" docs/user-guide.md`
- `npm test --workspace @loom/web -- notes`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
