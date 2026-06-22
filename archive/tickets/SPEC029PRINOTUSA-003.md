# SPEC029PRINOTUSA-003: Repository clip operations + explicit cascade/null

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — `@loom/server` `StoryNotesRepository` clip lifecycle (capture, excerpt verification, transactional batch capture, complete-tray reorder, mode conversion, explicit cascade-on-prep-delete + null-on-source-delete, atomic batch note delete); production behavior change
**Deps**: SPEC029PRINOTUSA-001, SPEC029PRINOTUSA-002

## Problem

The Scene Prep tray needs server-side clip operations: snapshot a whole note or a verified
excerpt, capture batches atomically, reorder a complete tray, convert note mode safely, and
delete notes/prep-sheets with correct entity-level semantics. SPEC-029 Deliverable 4 (write
path) plus Scope-decision 2 make these the load-bearing data-integrity invariants of the
feature — including the SPEC-029 reassessment finding (I1) that the declared `ON DELETE`
actions do not fire at runtime and must be enforced explicitly in the repository.

## Assumption Reassessment (2026-06-22)

1. Verified against `packages/server/src/story-notes-repository.ts`: `StoryNotesRepository`
   (`:148`), `createNote:190`, `updateNote:222`, `getNote:183`, `rowToStoryNote:47`. The
   `story_note_clips` table + `StoryNoteClip`/capture/reorder/batch Zod schemas are created
   by SPEC029PRINOTUSA-001; the FTS read path lands in SPEC029PRINOTUSA-002 (this ticket
   sequences after it on the shared `story-notes-repository.ts`).
2. Spec authority: `archive/specs/SPEC-029-private-notes-usability.md` Deliverable 4 (clip path),
   Approach §B/§D, Scope-decisions 2–4, Risks 4–7, and the reassessment I1 fix in Deliverable
   3/4 and §Risks 6.
3. Boundary under audit: clip rows reference `story_notes(id)` twice — `prep_note_id`
   (owner, must be a scene-prep note) and `source_note_id` (nullable provenance). SQLite
   cannot express "points to a scene-prep-mode note" as a FK, so the repository validates it
   on every clip operation.
4. FOUNDATIONS restated (§29.12): clip `content`, `sourceTitleSnapshot`,
   `sourceUpdatedAtAtCapture`, and `sourceStatus` are author-private derived material.
   They are stored and returned only through the Notes repository; no clip value enters any
   prompt/validation/working-set/compiler path — proven by SPEC029PRINOTUSA-005. The
   `source_note_id` pointer is tray-local, never registered in record-reference utilities or
   traversed outside Notes (§6.6 forbids note→record links, not private note→note provenance).
5. §20 change rationale + I1: confirmed via `project-store.ts:144` `configureDatabase`
   (`PRAGMA foreign_keys = ON`) is invoked **only** on the store-create path (`:282`), not
   the open path (`:346`); `record-repository.ts:506` already deletes `record_references`
   explicitly despite its own `ON DELETE CASCADE`. Therefore prep-delete cascade and
   source-delete null are performed **explicitly inside the delete transaction**, not left to
   the declarative FK, and a test asserts the behavior against an opened (foreign-keys-off)
   store. No shim; the FK clauses remain as documented integrity intent only.

## Architecture Check

1. Explicit transactional cascade/null matches the established repository pattern
   (`record-repository.ts`) and is the only correct behavior given foreign-keys-off on the
   open connection; it also lets the DELETE route report cascaded-clip/detached-pointer counts
   it must enumerate anyway. Excerpt fidelity comes from exact Markdown source + server
   timestamp-equality and exact-containment checks, with no persistent character offset.
2. No backwards-compatibility shim: mode downgrade is gated (scene-prep→scratch only with an
   empty tray) rather than tolerating ownerless clips; no alias path for legacy clip shapes.

## Verification Layers

1. Whole-note + excerpt capture snapshot correctness -> repository test (server-captured
   title/timestamp; stale source ⇒ conflict; same-text-twice succeeds; empty selection invalid;
   self-capture rejected).
2. Explicit cascade/null on open path -> repository test (open store, delete prep ⇒ clips gone +
   sources intact; delete source ⇒ pointer nulled + snapshot bytes preserved), proving the
   repository, not a declarative FK, does the work.
3. Complete-tray reorder + atomic batch ops -> repository test (exact clip-ID set required;
   stale set ⇒ conflict; batch capture/delete all-or-nothing).
4. `prep_note_id` mode invariant -> repository test (clip rejected when owner is not scene-prep).

## What to Change

### 1. Clip capture + verification

- `captureClips`: whole-note snapshots the source body; excerpt verifies `selectedText`
  against the current body by timestamp equality + exact containment, then snapshots. The
  server (not client) captures `sourceTitleSnapshot` + `sourceUpdatedAtAtCapture`. Batch
  capture (1–100) validates **all** before inserting, appending after the current max position,
  in one transaction. `sourceStatus` (`current`/`edited`/`deleted`) is derived at read time.

### 2. Tray + mode + deletion

- `reorderClips`: replace the exact ordered clip-ID set transactionally; a stale set conflicts.
- `setNoteMode`: scratch→scene-prep freely; scene-prep→scratch only when the tray is empty.
- `deleteNote`: when the note is a prep sheet, **explicitly** delete its tray clips in the
  same transaction; for every clip whose `source_note_id` equals the deleted note, **explicitly**
  set it null. `deleteNotesBatch` (1–100) applies the same semantics atomically. Validate
  `prep_note_id` owner-is-scene-prep on every clip op.
- Expose an FTS rebuild helper for migration/tests only (no public HTTP maintenance endpoint).

## Files to Touch

- `packages/server/src/story-notes-repository.ts` (modify)
- `packages/server/src/story-notes-repository.test.ts` (modify)

## Out of Scope

- HTTP routes, error-kind envelope, typed client (SPEC029PRINOTUSA-004).
- FTS search query + derived read fields (SPEC029PRINOTUSA-002).
- Cross-surface firewall canaries (SPEC029PRINOTUSA-005).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/server -- story-notes-repository` — whole/excerpt capture,
   stale-source conflict, same-text-twice, self-capture rejection, empty-selection invalid,
   complete-tray reorder + stale-tray conflict, empty-tray-gated mode downgrade, atomic batch
   capture/delete, owner-is-scene-prep validation.
2. Open an existing store (foreign-keys off): deleting a prep sheet removes its clips and
   leaves sources; deleting a source nulls referencing pointers and preserves snapshot bytes.
3. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. A save/delete never destroys collected source: clip removal is never a side effect of
   insertion, and cascade/null run only inside an explicit committed transaction.
2. No clip body, snapshot, or selected text appears in any error or log.

## Test Plan

### New/Modified Tests

1. `packages/server/src/story-notes-repository.test.ts` — capture/stale/self-capture/reorder/cascade/null/batch/mode-gate cases on an opened store.

### Commands

1. `npm test --workspace @loom/server -- story-notes-repository`
2. `npm run typecheck && npm run lint && npm test && npm run build`

## Outcome

Completed: 2026-06-22

Changed:
- Added repository clip read/capture/reorder/delete operations with derived `sourceStatus`.
- Added `StoryNotesRepositoryError` kinds for prep/source/clip/stale/self-capture/mode-gate failures so routes can map them in SPEC029PRINOTUSA-004.
- Implemented whole-note and excerpt snapshot capture with server-owned source title/timestamp capture, timestamp equality, exact selected-text containment, self-capture rejection, and validate-before-insert batch behavior.
- Implemented complete-tray reorder with exact current clip-ID set validation.
- Added `setNoteMode` with scene-prep-to-scratch downgrade blocked while clips exist.
- Implemented explicit prep-delete cascade and source-delete pointer nulling inside repository transactions, including atomic batch delete.
- Expanded repository tests for capture/stale/self/empty/non-prep cases, reorder/stale tray, mode gate, explicit cascade/null on reopened stores, and batch delete atomicity/effects.

Deviations:
- Added `deleteNoteWithEffects` and `deleteNotesBatch` alongside the existing boolean `deleteNote` API so current callers keep working until SPEC029PRINOTUSA-004 exposes the richer route response.
- Added route-ready repository error kinds now, but no HTTP envelope or client type changes were made in this ticket.

Verification:
- `npm test --workspace @loom/server -- story-notes-repository` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed, 158 files / 1687 tests.
- `npm run build` — passed; Vite emitted the pre-existing large chunk warning.
