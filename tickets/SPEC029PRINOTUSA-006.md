# SPEC029PRINOTUSA-006: Web three-pane Scene Prep workspace + web tests

**Status**: PENDING
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — `@loom/web` notes surface refactored into Find/Source/Prep panes (`NotesSearchPane`, `NoteSourcePane`, `ScenePrepPane`, `NoteClipTray`, `PermanentDeleteDialog`), `NotesView` orchestration shell, boundary labeling, plain CSS; production UI behavior change
**Deps**: SPEC029PRINOTUSA-004

## Problem

The current list→detail→editor geometry forces the author to replace the thing being read with
the thing being composed, so source context and the emerging prep sheet can never be seen
together. SPEC-029 Deliverable 6 turns the single `/notes` route into three coordinated panes —
Find / Source / Prep — reusing the existing editor and safe-markdown, with explicit non-drag
controls, safe highlighting, and the constitutional boundary language.

## Assumption Reassessment (2026-06-22)

1. Verified against `packages/web/src/`: `notes/NotesView.tsx:31` owns query/filter/sort state;
   `notes/NoteEditor.tsx:84` owns ~900 ms autosave (`:172`) + dirty tracking; `notes/NoteDetail.tsx:18`
   and `notes/safe-markdown.tsx:7` (`SafeMarkdown`, ReactMarkdown with filtered `a`/`img`) exist.
   `shell/AppShell.tsx:32` already has the single "Private Notes" sidebar entry and `:127` the
   project-gated `/notes` route — **no AppShell change** (one route, one entry stay).
2. Spec authority: `specs/SPEC-029-private-notes-usability.md` Deliverable 6 + Approach §C/§D/§E;
   the typed client fns (`listNoteClips`/`captureNoteClips`/`reorderNoteClips`/`deleteNoteClip`/
   `deleteNotesBatch`) + `StoryNoteSummary.mode` land in SPEC029PRINOTUSA-004.
3. Boundary under audit: the panes consume the `web/src/api.ts` client contract (004); the prep
   editor reuses the existing `NoteEditor` contract — no second editor engine.
4. FOUNDATIONS restated (§27 UI labeling): the workspace adds to the §27 obligation — the existing
   badge **Author-private · never sent to prompts** is retained verbatim, plus one persistent
   explanatory sentence ("Notes and prep sheets are inert scratch. They never affect records,
   readiness, generation, or accepted prose.") and the deletion-confirmation retained-copies line;
   one "Private Notes" sidebar item, no `/scene-prep` peer, no continuity colors/icons/"working
   set"/readiness/canon vocabulary. §20 change rationale: `NotesView` is refactored into an
   orchestration shell (not aliased) because many-into-one assembly needs panes, not a list/detail
   swap.
5. Derived-material rendering (§29.12): highlighting is rendered from React **text nodes** split on
   the server's inert marker tokens — never `dangerouslySetInnerHTML`, never DB-provided HTML; the
   `NotesView` shell owns the autosave flush points (before source/prep switch, collect-from-edited-
   source, dirty delete) so a save failure never destroys collected source.

## Architecture Check

1. An orchestration shell with focused pane children (reusing `NoteEditor`/`NoteDetail`/
   `safe-markdown`) is cleaner than a Notion-style database/view or a canvas: a prep sheet *is*
   the useful scene-specific saved collection, and it can hold fragments a saved view cannot. Drag
   is supplemental — keyboard move-up/down and explicit Collect/Insert controls are always present.
2. No backwards-compatibility shim, no new design system, Redux, or query library: plain global CSS
   in `styles.css`, reusing the existing client and editor contracts.

## Verification Layers

1. Safe highlighting -> web test (highlight rendered from text nodes; no `dangerouslySetInnerHTML`).
2. Many-into-one assembly without navigation loss -> web test (source + prep coexist; multi-select
   collect; exact textarea-selection capture; keyboard reorder; edited/deleted source labels).
3. Boundary + destructive language -> web test (badge verbatim + explanatory sentence rendered;
   batch-delete confirmation lists titles/count/"cannot be undone" + retained-copies warning +
   prep-cascade wording; no record/readiness/generation/working-set action present in Notes).

## What to Change

### 1. Orchestration shell + panes

- Refactor `NotesView` into a shell with `NotesSearchPane` (debounced query, multi-tag AND chips,
  pinned/mode filters, relevance + existing sorts, match count, result checkboxes, "Collect
  selected"/"Permanently delete selected", highlighted title + direct excerpt + badges, active-tray
  count), `NoteSourcePane` (safe Preview + escaped Markdown-source read view; "Collect selection"
  enabled only in source view when `selectionStart !== selectionEnd`; "Edit source" flushes a
  pending edit before capture), `ScenePrepPane` (prep-sheet selector + "New prep sheet" + "Use this
  note as a prep sheet", reused `NoteEditor`, save state), and `NoteClipTray` (capture-kind/time/
  status badges, insert-at-cursor/append, open-source/remove, keyboard move-up/down with drag
  supplemental, collapse/expand). On narrow windows the find and prep panes become drawers/tabs
  around a single main pane.

### 2. Deletion + boundary language

- `PermanentDeleteDialog`: a focused modal listing the first several titles, the total count, and
  "This cannot be undone"; distinguishes source-note deletion (leaves collected copies) from
  prep-sheet deletion (cascades tray clips, leaves sources). Render the §D boundary badge,
  explanatory sentence, and deletion-confirmation retained-copies line. Highlighting renders from
  React text nodes only; plain global CSS in `styles.css`.

## Files to Touch

- `packages/web/src/notes/NotesView.tsx` (modify)
- `packages/web/src/notes/NotesSearchPane.tsx` (new)
- `packages/web/src/notes/NoteSourcePane.tsx` (new)
- `packages/web/src/notes/ScenePrepPane.tsx` (new)
- `packages/web/src/notes/NoteClipTray.tsx` (new)
- `packages/web/src/notes/PermanentDeleteDialog.tsx` (new)
- `packages/web/src/notes/NotesView.test.tsx` (modify)
- `packages/web/src/notes/NotesSearchPane.test.tsx` (new)
- `packages/web/src/notes/ScenePrepPane.test.tsx` (new)
- `packages/web/src/styles.css` (modify)

## Out of Scope

- Routes / client functions (SPEC029PRINOTUSA-004) — consumed here, not defined here.
- Server search/clip logic (SPEC029PRINOTUSA-002 / -003).
- A new `/scene-prep` route or sidebar entry, drag-only collection, design system, Redux, or query
  library.
- User-guide docs + end-to-end smoke (SPEC029PRINOTUSA-007).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/web -- notes` — highlight renders from text nodes (no
   `dangerouslySetInnerHTML`); multi-select collection, exact textarea-selection capture,
   source/prep coexistence without navigation loss, insert/append + autosave-failure recovery,
   keyboard reorder, edited/deleted source labels render correctly.
2. The boundary badge + explanatory sentence render, and the batch-delete confirmation shows the
   retained-copies warning + prep-cascade wording; no record/readiness/generation/working-set
   action appears anywhere in Notes.
3. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. One project-gated `/notes` route and one "Private Notes" sidebar entry — no `/scene-prep` peer.
2. No DB-provided HTML is ever rendered; highlighting is text-node only.

## Test Plan

### New/Modified Tests

1. `packages/web/src/notes/NotesView.test.tsx` — orchestration shell: collect, coexistence, flush-on-switch.
2. `packages/web/src/notes/NotesSearchPane.test.tsx` — debounced query, multi-tag AND, highlight text nodes, match count.
3. `packages/web/src/notes/ScenePrepPane.test.tsx` — clip tray insert/append, keyboard reorder, status badges, delete dialog language.

### Commands

1. `npm test --workspace @loom/web -- notes`
2. `npm run typecheck && npm run lint && npm test && npm run build`
