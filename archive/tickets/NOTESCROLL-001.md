# NOTESCROLL-001: Auto-scroll the Source pane to top when a private note is selected

**Status**: COMPLETED
**Priority**: LOW
**Effort**: Small
**Engine Changes**: None — UI-only change in `@loom/web` (`packages/web/src/notes/NoteSourcePane.tsx` + tests). No schema, compiler, validation, storage, or prompt surface touched.
**Deps**: None. (Builds on the layout delivered by the archived SPEC-029 "private-notes-usability"; that spec never addressed scroll-on-select, so there is no prior decision to reverse.)

## Problem

On the Private Notes page the workspace (`.notesWorkspace`) is a three-column grid with no per-column scroll container, so the **whole window scrolls**. With many notes the left list (`NotesSearchPane`) grows tall; the user scrolls the window down to find a note. Clicking it re-renders the middle **Source** pane (`NoteSourcePane`) but does not move the viewport — the Source pane's top stays pinned near the page top, far above the user's scroll position — so the user must manually scroll back up to read the note they just selected.

The fix: when a note becomes the selected source, auto-scroll the Source pane's top into view, matching the existing in-repo pattern used by the accepted-segment browser.

## Assumption Reassessment (2026-06-27)

<!-- Items 1-3 always required. Items 4+ are a menu; include only those matching this ticket's scope and renumber surviving items sequentially starting from 4. -->

1. There is currently no scroll-on-select logic in the notes UI. Verified: `grep -rn scrollIntoView packages/web/src/notes/` returns nothing; `packages/web/src/notes/NoteSourcePane.tsx:15-114` declares `sourceRef` (line 25) only for textarea text-selection tracking (`refreshSelection`, lines 27-35), with no `useEffect` keyed on the note; `packages/web/src/notes/NotesView.tsx:149-163` (`selectSource`) only flushes editors and calls `setSourceNote`.
2. The window-level scroll behavior is intentional layout, not a missing container: `packages/web/src/styles.css:1789-1794` (`.notesWorkspace`) sets `grid-template-columns … ; align-items: start;` with no `overflow`/`max-height`, and `.notesPane` (lines 1796-1801) likewise has none. This matches the archived SPEC-029 intent that source + list + prep stay visible together (`archive/specs/SPEC-029-private-notes-usability.md`).
3. Shared boundary under audit: the `NoteSourcePane` `note` prop is the contract. Selection flows `NotesSearchPane` click → `onSelectNote(note)` (`NotesSearchPane.tsx:186`) → `NotesView.selectSource` → `setSourceNote` → `NoteSourcePane` receives the new `note` (`NotesView.tsx:403-411, 442-445`). The scene-prep "Open source" action also routes through `selectSource` (`NotesView.tsx:466`), so keying the effect on `note.id` covers both entry points.
4. The fix reuses the established precedent at `packages/web/src/accepted-segments/AcceptedSegmentsView.tsx:449` — `scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" })` plus a `prefersReducedMotion()` helper (lines 456-458 there) — so behavior is consistent with the accepted-segment browser rather than a one-off.

## Architecture Check

1. Putting the effect in `NoteSourcePane` (the component that owns the scroll target) and keying it on `note.id` is cleaner than an imperative scroll from `NotesView`'s click handler: it needs no forwarded ref, and it fires *after* the async `getNote` resolves and the new note renders, rather than racing the in-flight request. Keying on `id` (not the whole note) means same-note re-renders — autosave bumping `updatedAt`, `useSourceAsPrep` — do **not** yank the viewport.
2. No backwards-compatibility aliases/shims. The `prefersReducedMotion` helper is duplicated locally (a 3-line `window.matchMedia` check) rather than exported from `AcceptedSegmentsView` to avoid creating a new cross-module dependency for a trivial helper; if a third consumer appears, extract a shared util then (out of scope here).

## Verification Layers

1. Selecting a different note scrolls the Source pane top into view -> Vitest/RTL test spying on `HTMLElement.prototype.scrollIntoView`, asserting it is called with `{ block: "start", behavior: "smooth" }`.
2. `prefers-reduced-motion: reduce` downgrades to `behavior: "auto"` -> Vitest/RTL test mocking `window.matchMedia` to return `matches: true`.
3. Re-rendering the pane with the **same** note id (e.g. an autosave update) does not re-scroll -> Vitest/RTL test rerendering with same `id`, asserting `scrollIntoView` call count is unchanged.

## What to Change

### 1. `NoteSourcePane.tsx` — scroll the pane to top on note change

- Add a `useEffect` and `useRef<HTMLElement>` import (already imports `useRef`, `useState`; add `useEffect`).
- Declare `const paneRef = useRef<HTMLElement | null>(null);` alongside the existing `sourceRef` (keep `sourceRef` for textarea selection — unchanged).
- Add, **before** the `if (!note) return …` early return so hook order is stable:
  ```ts
  useEffect(() => {
    if (!note) {
      return;
    }
    paneRef.current?.scrollIntoView({
      block: "start",
      behavior: prefersReducedMotion() ? "auto" : "smooth"
    });
  }, [note?.id]);
  ```
- Attach `ref={paneRef}` to the populated `<section className="notesPane notesSourcePane" aria-labelledby="note-source-title">` (the main return at line 46). The empty-state section (line 39) does not need the ref — the effect guards on `note`.
- Add a local helper mirroring the accepted-segments precedent:
  ```ts
  function prefersReducedMotion(): boolean {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  }
  ```

## Files to Touch

- `packages/web/src/notes/NoteSourcePane.tsx` (modify)
- `packages/web/src/notes/NoteSourcePane.test.tsx` (new) — focused unit tests for the scroll behavior

## Out of Scope

- Adding an `overflow:auto` scroll container to the left list or any column (would reverse SPEC-029's "all panes visible together" layout intent).
- Any change to selection state, data flow, the API, or the scene-prep / clip-tray behavior.
- Extracting a shared `prefersReducedMotion` / scroll util across modules.
- Focus management on selection (the accepted-segment browser also focuses an element; this ticket only scrolls — the source pane has no single canonical focus target to steal focus to).

## Acceptance Criteria

### Tests That Must Pass

1. New `NoteSourcePane.test.tsx`: rendering with a note, then rerendering with a different-`id` note, calls `scrollIntoView` with `{ block: "start", behavior: "smooth" }`.
2. New `NoteSourcePane.test.tsx`: with `window.matchMedia` mocked to `matches: true`, the call uses `behavior: "auto"`.
3. New `NoteSourcePane.test.tsx`: rerendering with the **same** note id does not increase the `scrollIntoView` call count.
4. `npm test` (builds `@loom/core`, runs Vitest) passes, including the existing `packages/web/src/notes/NotesView.test.tsx`.
5. `npm run lint` and `npm run typecheck` pass.

### Invariants

1. The effect re-runs only when `note?.id` changes — same-note re-renders (autosave, prep conversion) must not scroll.
2. Notes remain author-private and inert: no records, readiness, generation, prompts, or accepted prose are read or written by this change (it touches only viewport scroll position).

## Test Plan

### New/Modified Tests

1. `packages/web/src/notes/NoteSourcePane.test.tsx` — new file. Spy on `HTMLElement.prototype.scrollIntoView` (save/restore the original descriptor as `readiness-cross-page.test.tsx:33-79` does, or assign a `vi.fn()` as `AcceptedSegmentsView.test.tsx:20` does). Cover: scroll-on-id-change (smooth), reduced-motion (auto), no-scroll-on-same-id. Render `NoteSourcePane` directly with a stub `StoryNote` and the required prop callbacks (`onEdit`/`onDelete`/`onCollectWhole`/`onCollectSelection`/`formatDate`) — no API mocking needed since the component is presentational.

### Commands

1. `npm test -- packages/web/src/notes/NoteSourcePane.test.tsx` (targeted)
2. `npm test` then `npm run lint` and `npm run typecheck` (full gate)
3. The targeted Vitest file is the correct primary boundary because the change is isolated to one presentational component; the full suite confirms no regression in `NotesView` integration.

## Outcome

Completed: 2026-06-27

Changed:

- Added `NoteSourcePane` scroll-on-selected-note behavior keyed to `note?.id`, with the pane itself as the scroll target.
- Matched the accepted-segment reduced-motion behavior: smooth scroll by default, instant scroll when `(prefers-reduced-motion: reduce)` matches.
- Added focused `NoteSourcePane.test.tsx` coverage for different-id selection, reduced-motion behavior, and same-id rerenders not scrolling again.

Deviations:

- Used optional method chaining on `scrollIntoView` so jsdom or other DOM-like environments without the method do not crash. Browser behavior remains the same when the API exists.

Verification:

- `npm test -- packages/web/src/notes/NoteSourcePane.test.tsx` passed: 1 file, 3 tests.
- `npm run typecheck` passed.
- `npm test` passed: 167 files, 1757 tests.
- `npm run lint` passed.
- `npm run build` passed; Vite emitted the pre-existing chunk-size warning.
- Smoke skipped: direct browser smoke was not run because this change is a presentational `scrollIntoView` effect with no request shape, storage, API, prompt, readiness, generation, or accepted-prose behavior. The new jsdom regression tests spy on the exact DOM scroll call and full `NotesView` tests passed.
