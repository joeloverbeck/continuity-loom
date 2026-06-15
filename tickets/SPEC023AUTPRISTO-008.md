# SPEC023AUTPRISTO-008: Web UI write path — editor, autosave, create, delete-confirm

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Large
**Engine Changes**: Yes — new `NoteEditor` component + mutation wiring into `NotesView`/`NoteDetail` + editor test; no change to existing non-notes surfaces
**Deps**: 007

## Problem

Authors need to create, edit (with debounced autosave and visible save state), and delete notes. The editor behaves like a scratch document — title input, pinned checkbox, tag input, body textarea, a safe Preview toggle, and a delete action gated by an explicit title-bearing confirmation. New notes are title-first (no malformed empty-title rows). This ticket adds all mutation to the read surface built in 007.

## Assumption Reassessment (2026-06-15)

1. The read surface (`NotesView.tsx`, `NoteDetail.tsx`, `safe-markdown.tsx`) and the client helpers (`createNote`/`updateNote`/`deleteNote`, ticket 006) already exist when this ticket runs (Deps 007 → 006). This ticket adds `NoteEditor.tsx` and wires the New/Edit/Delete affordances `NotesView`/`NoteDetail` stubbed in 007. The editor's Preview reuses the `safe-markdown` helper from 007 (no second renderer).
2. SPEC-023 §"Autosave UX" + §"Include: debounced autosave" + §"Include: hard delete with confirmation" prescribe: debounce ~750–1200 ms + save-on-blur + save-before-switching-if-dirty; status `Saving…` / `Saved` / `Save failed — retry`; keep unsaved edits in component state on failure (no silent discard); new notes are title-first and not POSTed until the title validates; delete uses a confirmation dialog containing the note title; no global offline queue in V1.
3. **Cross-artifact boundary under audit (intra-batch create-then-modify)**: this ticket `(modify)`s `NotesView.tsx` and `NoteDetail.tsx` — files ticket 007 creates `(new)` in this batch — to mount the editor and wire the Edit/New/Delete handlers. The dependency is load-bearing (this ticket fails at implementation time without 007's files), hence `Deps: 007`. The mutation handlers call `createNote`/`updateNote`/`deleteNote` from `api.ts` (006).
4. **FOUNDATIONS principle under audit (§27)**: §27 — "make dangerous actions hard to do accidentally" motivates the title-bearing delete confirmation; autosave is acceptable for Notes precisely because they have no validation/readiness consequence (unlike the explicit-save record/brief forms), so it does not blur the surfaces. The editor exposes no promote-to-record, include-in-prompt, add-to-working-set, or insert-into-brief action.
5. **Adjacent modification (required consequence)**: wiring handlers into 007's `NotesView`/`NoteDetail` is a required consequence of delivering mutation on the read surface, not a separate feature; it is the create-then-modify counterpart of 007.

## Architecture Check

1. Keeping the editor a separate component that the container mounts (rather than inlining mutation into `NotesView`) keeps the read path (007) reviewable on its own and the write path here, while a single shared `safe-markdown` helper avoids a divergent preview renderer. Autosave-in-component-state with explicit status is cleaner than a global store for a single-active-project local app.
2. No backwards-compatibility aliasing/shims: a new editor component; the `NotesView`/`NoteDetail` edits are additive handler wiring. No offline-queue infrastructure (deliberately excluded in V1).
3. **Same revision; co-lands with the feature (§1.1)** — transitively after 001.

## Verification Layers

1. New-note flow is title-first: no `createNote` POST fires until the title validates -> UI test (`NoteEditor.test.tsx`).
2. Autosave: debounced save + save-on-blur fire `updateNote`; status transitions `Saving…`→`Saved`; a failed save shows `Save failed — retry` and retains the local buffer (no discard) -> UI test (mocked client incl. a rejecting case).
3. Delete shows a confirmation dialog containing the note title and calls `deleteNote` only on confirm -> UI test.
4. The editor exposes no promote-to-record / include-in-prompt / add-to-working-set / insert-into-brief action, and the Preview reuses the safe renderer (raw HTML escaped) -> UI test absence assertions + grep-proof.

## What to Change

### 1. `packages/web/src/notes/NoteEditor.tsx` (new)

Title input, pinned checkbox, tag input, body textarea, Preview toggle (reusing `safe-markdown`), and a save-status indicator. Existing-note autosave: debounce ~750–1200 ms, save on blur, save before switching selection when dirty; on failure keep the buffer and show retry. New-note flow: title-first; no `createNote` until the title validates; then the same autosave path via `updateNote`. Delete action (when editing an existing note) opens the confirmation dialog.

### 2. `packages/web/src/notes/NotesView.tsx` (modify)

Wire the New Note button to open the editor for a fresh draft; mount `NoteEditor` for the selected note; manage selection + dirty-before-switch handling.

### 3. `packages/web/src/notes/NoteDetail.tsx` (modify)

Wire the Edit button to open the editor and the Delete button to the title-bearing confirmation dialog → `deleteNote`.

## Files to Touch

- `packages/web/src/notes/NoteEditor.tsx` (new)
- `packages/web/src/notes/NotesView.tsx` (modify — created by 007, this batch; `Deps: 007`)
- `packages/web/src/notes/NoteDetail.tsx` (modify — created by 007, this batch; `Deps: 007`)
- `packages/web/src/notes/NoteEditor.test.tsx` (new)

## Out of Scope

- Read-path scaffolding (route, nav, list, detail display, `safe-markdown`) — ticket 007.
- Server routes/repository (004–005), client helpers (006).
- Any promote-to-record, include-in-prompt, add-to-working-set, or insert-into-brief affordance.
- Global offline queue / sync (SPEC-023 §Out of Scope — V1 is single active local project).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/web` — `NoteEditor.test.tsx`: title-first create (no POST until title valid); autosave status transitions; failed save retains the buffer; delete confirmation shows the note title and calls `deleteNote` only on confirm.
2. `npm test --workspace @loom/web` — the editor exposes no cross-surface action (promote-to-record / include-in-prompt / working-set / brief), asserted by absence; the existing `NotesView.test.tsx` (007) still passes with the wired handlers.
3. `npm run typecheck && npm run lint && npm run build` succeed.

### Invariants

1. A note is never POSTed with an empty/invalid title; a failed save never silently discards the author's edits.
2. The editor and detail panes expose no affordance to move a note into records, the working set, the brief, or any prompt.

## Test Plan

### New/Modified Tests

1. `packages/web/src/notes/NoteEditor.test.tsx` (new) — create/autosave/delete-confirm/no-cross-surface-action/preview-safety.
2. `packages/web/src/notes/NotesView.test.tsx` (from 007) — re-run to confirm wired New/Edit/Delete handlers don't regress the read path.

### Commands

1. `npm test --workspace @loom/web -- NoteEditor NotesView`
2. `npm run typecheck && npm run lint && npm run build`
3. `grep -niE "promote|working-set|include-in-prompt|insert.*brief|addToWorkingSet" packages/web/src/notes/NoteEditor.tsx` — must return nothing (no cross-surface action); the narrow grep proves the isolation invariant for the editor.
