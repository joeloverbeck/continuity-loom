# SPEC023AUTPRISTO-007: Web UI read path — `/notes` route, nav, list, detail, safe preview

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Large
**Engine Changes**: Yes — new `/notes` route + AppShell nav item + `NotesView`/`NoteDetail` components + safe-markdown helper + CSS + a Markdown dependency + UI test; no change to existing surfaces
**Deps**: 006

## Problem

Authors need a project-gated `/notes` surface to browse their private notes: a list with search/tag/pinned/sort controls, a detail pane with a safe rendered Markdown preview, and persistent boundary copy making clear the surface is inert scratch that never reaches prompts. This ticket delivers the read/browse half; mutation (editor, autosave, create, delete-confirm) is ticket 008.

## Assumption Reassessment (2026-06-15)

1. The app shell nav is a typed array in `packages/web/src/shell/AppShell.tsx` (`{ to, label, requiresProject }`, e.g. `{ to: "/records", label: "Records", requiresProject: true }` at `:29`, `{ to: "/working-set", label: "Active Working Set", requiresProject: true }` at `:30`). The new entry `{ to: "/notes", label: "Private Notes", requiresProject: true }` goes after Records and before Active Working Set, with a matching route rendering `NotesView`. The list-detail pattern to mirror is `packages/web/src/records/RecordBrowser.tsx`; global CSS is `packages/web/src/styles.css`.
2. SPEC-023 §"Web UI" prescribes: the `/notes` route (project-gated), the page-header boundary copy and "Author-private · never sent to prompts" badge, the toolbar (New Note, search, tag filter, pinned filter, sort), the list (title, body preview, tags, pinned marker, updated timestamp, empty-state copy), the detail pane (metadata + rendered Markdown preview + Edit/Delete buttons), and the safe-preview rules (raw HTML escaped/ignored; no embeds, remote link previews, image fetching, or scriptable components).
3. **Cross-artifact boundary under audit**: the read surface consumes the notes client helpers `listNotes`/`getNote` (ticket 006) and renders `StoryNoteSummary`/`StoryNote` shapes. It must NOT present record-table columns, record badges, salience/urgency labels, reference pickers, working-set toggles, compile-destination labels, readiness status, or prompt-preview affordances (SPEC-023 §"List → detail → editor pattern"). The Edit/New/Delete affordances' handlers and the editor are ticket 008; this ticket renders the detail pane read-only with a preview.
4. **FOUNDATIONS principle under audit (§27)**: §27 requires the UI to keep the surfaces distinct and to make inert scratch legible as such — satisfied by the dedicated `/notes` route, `.notes-`-prefixed classes, the boundary header/badge, and the deliberate absence of record/working-set/prompt controls. The added §27 bullet (ticket 001) requiring notes to be labeled as inert scratch motivates the persistent copy.
5. **Adjacent dependency (required consequence)**: a safe Markdown renderer requires a rendering library; adding it to `packages/web/package.json` is a required consequence of the safe-preview deliverable. `react-markdown` escapes/ignores raw HTML by default (SPEC-023 footnote), satisfying the no-raw-HTML rule without enabling `dangerouslySetInnerHTML`.

## Architecture Check

1. A dedicated `notes/` component directory with `.notes-`-prefixed CSS mirrors the record-browser pattern while staying mechanically distinct — no shared record components, so the surface cannot accidentally inherit record/working-set affordances. A small `safe-markdown` wrapper centralizes the safe-rendering policy for reuse by the editor preview (008).
2. No backwards-compatibility aliasing/shims: new route/components/CSS; the only existing-file edits are the additive nav entry, the route table, and the CSS append. No raw-HTML injection path is introduced.
3. **Same revision; co-lands with the feature (§1.1)** — transitively after 001.

## Verification Layers

1. `/notes` is project-gated like other `requiresProject: true` surfaces; the nav item renders only with a project open -> UI test + grep-proof of the AppShell nav entry.
2. List renders summaries and detail renders a full note from mocked `listNotes`/`getNote`; search/tag/pinned/sort controls call `listNotes` with the expected query -> UI test (`NotesView.test.tsx`).
3. Markdown preview escapes or ignores raw HTML/script input -> UI test feeding `<script>`/raw-HTML and asserting no live HTML node.
4. The surface presents no record/working-set/compile/readiness/prompt-preview affordance -> UI test absence assertions + grep-proof.

## What to Change

### 1. `packages/web/src/shell/AppShell.tsx` (modify)

Add the `{ to: "/notes", label: "Private Notes", requiresProject: true }` nav entry after Records / before Active Working Set, and the route rendering `NotesView`.

### 2. `packages/web/src/notes/NotesView.tsx` (new)

List-detail container mirroring `RecordBrowser`: page header with the boundary copy + "Author-private · never sent to prompts" badge; toolbar (New Note button — handler wired in 008 —, search input, tag filter, pinned filter, sort selector); list of summaries (title, body preview, tags, pinned marker, updated timestamp; empty-state copy per spec). Calls `listNotes`/`getNote`; threads control state into the `listNotes` query.

### 3. `packages/web/src/notes/NoteDetail.tsx` (new)

Read-only detail pane: title, tags, pinned status, created/updated timestamps, and the rendered Markdown preview (via the safe-markdown helper). Renders Edit and Delete buttons whose handlers are wired by ticket 008.

### 4. `packages/web/src/notes/safe-markdown.tsx` (new)

Safe Markdown renderer (headings, lists, emphasis, links, inline + fenced code, checkbox-looking list items) with raw HTML escaped/ignored and no embeds, remote link previews, image-by-URL fetching, or scriptable components. Reused by the editor preview (008).

### 5. `packages/web/src/styles.css` (modify) + `packages/web/package.json` (modify)

Append `.notes-`-prefixed styles. Add the Markdown rendering dependency.

## Files to Touch

- `packages/web/src/shell/AppShell.tsx` (modify)
- `packages/web/src/notes/NotesView.tsx` (new)
- `packages/web/src/notes/NoteDetail.tsx` (new)
- `packages/web/src/notes/safe-markdown.tsx` (new)
- `packages/web/src/styles.css` (modify)
- `packages/web/package.json` (modify — Markdown dependency)
- `packages/web/src/notes/NotesView.test.tsx` (new)

## Out of Scope

- The editor, autosave, create flow, and delete-confirm dialog (ticket 008) — this ticket renders detail read-only and stubs the Edit/New/Delete affordances for 008 to wire.
- Server routes/repository (004–005), client helpers (006).
- Any record-table columns, record badges, working-set toggle, compile-destination/readiness label, or prompt-preview affordance.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/web` — `NotesView.test.tsx`: `/notes` is project-gated; list/detail render against mocked API; search/tag/pinned/sort controls invoke `listNotes` with the expected query; the boundary header/badge text is present.
2. `npm test --workspace @loom/web` — the Markdown preview escapes/ignores `<script>` and raw HTML (no live HTML node created).
3. `npm run typecheck && npm run lint && npm run build` — the new route/components/dependency compile, lint, and build.

### Invariants

1. The `/notes` surface contains no record picker, working-set toggle, compile-destination label, readiness status, or prompt-preview control.
2. The Markdown preview never renders raw HTML or fetches remote resources; the note body remains the raw-text source of truth.

## Test Plan

### New/Modified Tests

1. `packages/web/src/notes/NotesView.test.tsx` (new) — gating, list/detail rendering, control→`listNotes` query wiring, boundary copy, Markdown-safety.

### Commands

1. `npm test --workspace @loom/web -- NotesView`
2. `npm run typecheck && npm run lint && npm run build`
3. `grep -nE "to: \"/notes\"" packages/web/src/shell/AppShell.tsx` — confirms the project-gated nav entry exists.
