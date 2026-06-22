# SPEC-029 — Private Notes Usability: Scene Prep Workspace, Local FTS5 Search, and Snapshot Clips

**Status**: DRAFT
Phase: post-v1 product-behavior spec; author-private Notes surface (§6.6) usability change — adds a `scene-prep` note mode, a `StoryNoteClip` source tray, local SQLite FTS5 ranked search, a three-pane find/read/compose layout, and batch permanent deletion, behind a `LOOM_SCHEMA_VERSION = 3` additive migration. No continuity, prompt-compilation, validation, OpenRouter, or network surface moves.
Depends on: the shipped Private Notes feature from archived `SPEC-023` (`packages/core/src/story-notes.ts`, `packages/server/src/{record-tables,story-notes-repository,story-note-routes,project-store}.ts`, `packages/web/src/notes/*`, `packages/web/src/{api,shell/AppShell}.ts(x)`); the Node ≥ 24 runtime and its built-in `node:sqlite` binding with `SQLITE_ENABLE_FTS5`; the established `lint` / `typecheck` / `test` / `build` CI gates; the core import-boundary rule (`packages/core/test/boundary.test.ts`); and the existing isolation/firewall proofs.
Governing authority: `docs/FOUNDATIONS.md`
Primary authority docs: `docs/FOUNDATIONS.md`, `docs/ACTIVE-DOCS.md`, `docs/user-guide.md`, `docs/story-record-schema.md`, `docs/compiler-contract.md`
Supporting authorities: `archive/specs/SPEC-023-author-private-story-notes.md`, `archive/reports/author-private-story-notes-research-brief.md`, `reports/private-notes-usability-research-brief.md` (the change-proposal's originating research brief), `tickets/README.md`, `tickets/_TEMPLATE.md`

> Section style note: this file uses the canonical `specs/` section set
> (Problem Statement / Approach / Deliverables / FOUNDATIONS Alignment /
> Verification / Out of Scope / Risks & Open Questions) that the `reassess-spec`
> and `spec-to-tickets` skills parse. It deliberately omits the
> external-generator scaffolding the source proposal carries (`Target commit:` /
> fetch-provenance / the raw-URL acquisition ledger in its Appendix A) because
> this spec was authored locally against the working tree, not fetched at an exact
> commit — matching the SPEC-024 / SPEC-025 / SPEC-026 / SPEC-028 precedent. The
> source proposal remains the full design reference for per-section detail
> (cited inline as "proposal §N").

---

## Brainstorm Context

- **Original request:** Analyze `reports/private-notes-usability-change-*` and
  create a spec in `specs/*` with the actionable work, aligned with `docs/**`.
- **Source report:** `reports/private-notes-usability-change-proposal.md` — a
  research-backed change-proposal precursor pinned to commit `90d17f8`. It keeps
  the existing loose, flat note-capture model but adds a **Scene Prep workspace
  inside the author-private Notes surface**: (1) ranked, entirely local FTS5
  full-text + substring search; (2) a persistent **Scene Prep Sheet** (still only a
  private note, new `mode: "scene-prep"`); (3) a reorderable **source tray** of
  copy-on-collect **snapshot clips** (whole-note or exact-excerpt), not live
  transclusions; (4) a three-pane find/read/compose layout with explicit
  non-drag controls and safe highlighting; (5) manual batch permanent deletion.
  Storage change warrants `LOOM_SCHEMA_VERSION = 3`. It flags **no FOUNDATIONS
  amendment** required. This was handled as a *unified proposal as source report*
  (one whole-proposal `accept` verdict, not a synthesized finding list).
- **Spec number:** `SPEC-029` — highest existing across `specs/` (none active) and
  `archive/specs/` (through `SPEC-028`) is `SPEC-028`; this claims the next.
- **Deliverable-count decision:** **one spec.** The request asked for "a spec"; the
  proposal is a single lockstep change in which core schema, server
  migration/repository/routes, web UI, and the expanded isolation firewall must
  all move together. Splitting into multiple specs would manufacture cross-spec
  dependencies with no review benefit. The repo's `spec-to-tickets` workflow
  performs the per-reviewable-diff decomposition separately (proposal §11.1 gives a
  safe intra-spec implementation order to seed that step).
- **Deliverable-class decision:** the request pre-authorized a spec; this work
  changes stored data (new note mode, clip table, FTS index), the schema-version
  migration path, and the Notes API/UI — a broad storage + product-surface change
  that `CLAUDE.md` and `docs/ACTIVE-DOCS.md` route to a spec. The pre-authorized
  class is correct.
- **FOUNDATIONS-amendment determination:** **none warranted** — see
  §FOUNDATIONS Alignment. The proposal's §10 amendment analysis is verified against
  §6.6, §27, and §29.12 below and confirmed. This spec records the negative
  determination explicitly so the request's "aligned with `docs/**`" clause is
  answered on the record.

### Premise verification (operator-verified by Read/grep against the working tree)

Target commit `90d17f8b2e868b90b2f536316e06438e994098cf` (the proposal's stated
target) **equals `git rev-parse HEAD`**, so the proposal audited current state; its
freshness caveat is mooted. Every load-bearing premise was verified directly:

- **Current note domain** — `packages/core/src/story-notes.ts` defines `StoryNote`
  with exactly `id`, `title`, `body`, `tags`, `pinned`, `createdAt`, `updatedAt`
  (lines 5–13). Limits: title ≤ 160, body ≤ 200,000, tag ≤ 32 (lines 30–36). Tag
  normalization regex `/^[\p{L}\p{N} _.-]+$/u` with whitespace collapse (lines
  3, 38). UUIDv7 via `globalThis.crypto.getRandomValues()` (lines 94–118). Input
  schemas: `storyNoteCreateInputSchema` (line 75), `storyNoteUpdateInputSchema`
  (line 84).
- **Schema version** — `LOOM_SCHEMA_VERSION = 2` at
  `packages/core/src/project-storage.ts:5`; `evaluateStoreCompatibility`
  (lines 56–69) returns `"ok" | "incompatible-version" | "migration-required"`.
- **Frozen version constants** — `packages/core/src/version.ts` `versionInfo`
  (lines 20–37): `templates.version "1.3.0"`, `compiler.version "1.5.0"`,
  `contract.version "1.6.0"`, `app.version "0.0.0"`. These must **not** change
  (proposal §6.1); they are distinct from `LOOM_SCHEMA_VERSION`.
- **`story_notes` DDL** — `packages/server/src/record-tables.ts:65–82`: columns
  `id`, `title`, `body`, `tags_json`, `pinned`, `created_at`, `updated_at`; indexes
  `story_notes_pinned_updated_idx`, `story_notes_title_idx`, `story_notes_updated_idx`.
- **In-memory search today** — `packages/server/src/story-notes-repository.ts`
  `listNotes()` (lines 151–181) loads all rows (`SELECT * FROM story_notes`, line
  257) and does case-folded substring match (`includesQuery`, lines 72–79) +
  `searchRank()` (lines 89–106) in application memory.
- **Routes** — `packages/server/src/story-note-routes.ts`: discriminated
  `{ ok, kind, message }` envelope (lines 21–35), `409 no-open-project`, hard
  delete; handlers `GET /api/notes` (51), `GET /api/notes/:id` (73), `POST` (88),
  `PUT /api/notes/:id` (106), `DELETE /api/notes/:id` (130).
- **Migration** — `packages/server/src/project-store.ts` uses `PRAGMA user_version`
  (147, 179) and `BEGIN IMMEDIATE` (177); `migrateStoreFromV1ToV2()` (171–200) is
  a **single special-case** (dispatched at 386–390) that calls
  `ensureStoryNoteTables`; `openProject` triggers migration at 306–426. The
  proposal's "refactor into an ordered step runner" (§6.2) is therefore a real
  refactor of current single-case dispatch, not a claim that one exists.
- **Web** — `NotesView.tsx:31` owns query/filter/sort state; `NoteEditor.tsx:84`
  owns ~900 ms autosave (line 172) + dirty tracking; `NoteDetail.tsx:18` and
  `safe-markdown.tsx:7` (`SafeMarkdown`, ReactMarkdown with filtered `a`/`img`)
  exist; `AppShell.tsx:127` has the project-gated `/notes` route and **one** sidebar
  entry labeled **"Private Notes"** (line 32) — note the accurate label vs. the
  proposal's "Notes" shorthand; `api.ts` has the native-fetch typed CRUD client
  (`listNotes`/`getNote`/`createNote`/`updateNote`/`deleteNote`, lines 401–426)
  with discriminated responses.
- **Firewall proofs exist** — `packages/core/test/compiler-context-firewall.test.ts`
  (note canary never reaches a prompt), `packages/server/src/story-notes-isolation.test.ts`
  (sentinel `NOTE_SENTINEL_DO_NOT_PROMPT_*` absent from prompts/logs/validation),
  `packages/core/test/story-notes.test.ts` (schema/normalization/limits),
  `packages/core/test/boundary.test.ts` (core imports no framework), and
  `packages/server/src/story-notes-migration.test.ts` (v1→v2 preserves records,
  adds `story_notes`).
- **Runtime** — `.nvmrc` = `24`; `package.json` engines `"node": ">=24"` (line 10);
  `node:sqlite` (`DatabaseSync`) imported in `record-tables.ts:1`,
  `project-store.ts:14`, `story-notes-repository.ts:12`. The Node 24 build enables
  `SQLITE_ENABLE_FTS5` (proposal [E14]); a migration preflight (§6.3) gives an
  actionable error rather than relying on it silently.
- **Novelty confirmed absent** — repo-wide grep for `story_note_clips`,
  `story_notes_fts`, `FTS5`, and any `note_mode`/`mode` column on `story_notes`
  returns **zero** results. "Create new" is the correct disposition for all of them.

### Scope-decisions block

1. **One spec, decomposed by `spec-to-tickets`.** The proposal's §11.1 ten-step
   sequence (core schemas + negative tests → v3 migration → clip/FTS repository →
   routes/client → expanded isolation tests → three-pane shell + search → source
   selection + tray → insertion/autosave → batch retirement → user-guide +
   regression) is intra-spec ordering, not a multi-spec split.
2. **Snapshots, never transclusions** (proposal §4.2, §11.5). Clip `content` is an
   immutable copy-on-collect Markdown snapshot. Deleting a source note never erases
   collected copies; deleting a prep sheet never deletes sources. "Delete all copies
   of this text" is deliberately not attempted; confirmations state entity-level
   semantics. This is the load-bearing constitutional + UX invariant.
3. **The `sourceNoteId` pointer is tray-local, never a record reference** (proposal
   §4.2, §5.4). It is nullable (after source deletion → `SET NULL`), accepts only
   note IDs, exists solely for reopen / "edited since capture" / "source deleted",
   and is never registered in record-reference utilities, parsed from Markdown, or
   traversed outside Notes. It is **not** a general note graph or backlink system.
4. **Excerpt fidelity comes from exact Markdown source + server verification**
   (proposal §4.3, §7.1, §11.6), not from mapping rendered-HTML selections back to
   offsets. The server takes the source title/timestamp, checks timestamp equality
   and exact-string containment, and stores no persistent character offset.
5. **FTS5 is the only search engine; no hidden fallback** (proposal §11.2). A
   missing FTS5 build is an unsupported-runtime migration error with the v2
   transaction rolled back intact — not a silent return to load-all-bodies search.
6. **Frozen surfaces.** `version.ts` template/compiler/contract/app constants,
   `docs/story-record-schema.md`, `docs/compiler-contract.md`, and all
   prompt/template/contract behavior are untouched. Only `LOOM_SCHEMA_VERSION`
   (core `project-storage.ts`) bumps 2 → 3, and `docs/user-guide.md` gains a
   Scene Prep section.
7. **No FOUNDATIONS amendment** — recorded as a determination (proposal §10.2),
   verified below against §6.6 / §27 / §29.12.

---

## Problem Statement

The shipped Private Notes feature (archived `SPEC-023`) is a solid floor —
per-project SQLite-backed notes with UUIDv7 identity, Markdown bodies, normalized
tags, pinning, timestamps, list/detail/editor flow, ~900 ms autosave, safe
preview, confirmed permanent deletion, and proven isolation from every continuity
and prompt surface. `SPEC-023` deliberately excluded folders, manual ordering,
note links, block references, soft deletion, and FTS5 "until the simple search
proved inadequate." That condition is now met.

The owner's scene-preparation ritual has four stages whose dominant cost is **not**
deletion confirmation but repeated context-switching:

1. **Find** — scan a large flat note set and rediscover material for the next scene.
2. **Assemble** — copy whole notes and fragments from several notes into one new
   working note (today: open → locate fragment → copy → switch → paste → repeat).
3. **Orient** — keep source context and the emerging prep whole visible at once.
4. **Retire** — manually edit out or permanently delete consumed material so it
   stops polluting future search.

Three concrete defects above the `SPEC-023` floor:

1. **Search is load-every-body substring matching in application memory**
   (`story-notes-repository.ts:151–181, 257`): no ranking, no snippets, no SQLite
   narrowing, and only a single transient result list.
2. **The list → detail → editor geometry is wrong for many-into-one assembly.**
   `NotesView`/`NoteDetail`/`NoteEditor` make the author repeatedly *replace the
   thing being read with the thing being composed*, so source context and the
   prep whole can never be seen together.
3. **Mixed granularity is fundamental and unserved.** Some notes are consumed
   whole; others yield only a paragraph, sentence, or arbitrary selection. There is
   no way to collect a fragment without first destructively splitting the source.

The redesign succeeds when it cuts list/detail/editor context switches, surfaces
relevant passages via ranked local search with meaningful snippets, lets the author
collect ten whole notes or ten fragments without ten copy/paste round trips, keeps
source + selection + prep editable note visible together, preserves loose capture
(no organizational migration required), makes retirement of genuinely consumed
material fast/explicit/final, preserves every existing note through migration, and
creates **no** route by which note material can influence continuity or leave the
machine (proposal §1.5).

---

## Approach

A deliberately bounded structural change wholly inside the already-admitted sixth,
author-private surface (§6.6). Full per-section detail lives in the source proposal
(§4–§9); this section captures the load-bearing decisions and the
"considered X, chose Y because Z" tradeoffs.

### A. Finding — ranked local FTS5 search with safe snippets (proposal §4.1, §5.2, §7.1)

Replace application-memory full-body filtering with a repository query that uses a
new local `story_notes_fts` virtual table when `q` is present:

- title / tags / body all indexed; `bm25()` weights title highest, tags next, body
  baseline; new `relevance` sort is the default **only** while a non-empty query is
  active (empty query keeps the current default sort — no meaningless rank);
- each whitespace-delimited term is **escaped and passed as a literal FTS phrase**
  via a tested literal query builder so FTS operators (`OR`, `NOT`, column
  selectors, quotes) are never interpreted — a correctness requirement, not just
  injection hardening (proposal §11.3);
- queries whose terms are all ≥ 3 Unicode code points use trigram FTS; mixed
  long/short terms narrow on the long terms with parameterized `instr()` predicates
  for the short ones; queries of only 1–2-character terms use a bounded
  parameterized `instr()`/`LIKE` fallback;
- exact tag facets use normalized values from the authoritative row (not the FTS
  `tags` column); repeated `tag` params apply **AND** semantics; a `mode` filter
  distinguishes scratch from prep notes;
- the server returns plain strings plus **inert start/end marker tokens** for
  highlights; React splits them into text and `<mark>` nodes and **never** renders
  DB-provided HTML or uses `dangerouslySetInnerHTML`.

Snippets are direct excerpts, never summaries. Rank, highlight ranges, snippets, and
matched-field metadata are author-private derived material under the same §29.12
firewall as bodies. **Chosen over** local embeddings (lexical refinding is the
known task; embeddings add model/runtime distribution, versioning, and a far larger
isolation surface) and over a faster flat list (which fixes only the first of four
stages).

### B. Assembling — Scene Prep Sheet + snapshot source tray (proposal §4.2, §5.1)

A **Scene Prep Sheet** is a `StoryNote` with new `mode: "scene-prep"`, keeping
every existing field, limit, autosave, preview, and hard-delete behavior, with no
scene/segment/record/generation-session ID or prose link. Each prep sheet owns an
ordered tray of `StoryNoteClip` rows, created two ways:

- **whole-note:** the server snapshots the source note's full Markdown body;
- **excerpt:** the user selects an exact range in the Markdown-source view; the
  server verifies the selection against the current body (timestamp + exact
  containment) and snapshots it.

For both, the **server, not the client**, captures the source title and current
timestamp (deterministic conflict handling, no forged metadata). The snapshot is
independent after capture — no live refresh, no recursive embedding; if the source
changes the UI says "Source edited since capture"; if deleted, "Source deleted;
captured text preserved." **Chosen over** a full block/outliner data model (would
require block IDs, hierarchy, editor replacement, and high-risk migration of every
200,000-char body), live transclusion/embeds (source edits could silently mutate a
prep artifact; conflicts with deliberate hard deletion), and destructive
split/merge prerequisites (selection clips collect fragments without restructuring
sources).

### C. Orienting — three coordinated panes on one `/notes` route (proposal §4.3, §8)

The desktop `/notes` layout becomes **Find / Source / Prep** panes — one Notes
surface, **not** three routes and **not** a new top-level product surface. One
sidebar item ("Private Notes") stays; no `/scene-prep` peer to continuity surfaces.
The active prep sheet stays pinned open while search/source selection changes; on
narrow windows the find and prep panes become drawers/tabs around a single main
pane, and **drag is never the only way to collect or reorder**. The constitutional
boundary label appears at both the view header and inside the prep pane (§D below).
**Chosen over** Notion-style database/view machinery, a canvas/corkboard, and
generic saved searches (a prep sheet *is* the useful scene-specific saved
collection, and it can contain fragments a saved view cannot).

### D. Retiring + boundary language (proposal §4.4, §8.8)

The existing single-note hard delete stays; add a selection mode and an **atomic
batch-delete** route. The confirmation distinguishes the two cases plainly:
deleting source notes removes rows + their FTS entries permanently but leaves any
copies already in another body or a prep tray; deleting a prep sheet cascades its
tray clips and leaves sources untouched. The dialog lists the first several titles,
the total count, and "This cannot be undone" — no queue, archive, undo snackbar, or
recycle bin. Fragment-level retirement stays manual (edit the source after writing).

Boundary language (both usability and §27/§29.12 compliance) — retain the existing
badge exactly:

> **Author-private · never sent to prompts**

add one persistent explanatory sentence:

> Notes and prep sheets are inert scratch. They never affect records, readiness,
> generation, or accepted prose.

and the deletion-confirmation line:

> Copies already collected into another note or prep tray are separate private
> content and will not be removed unless selected too.

### E. Autosave coordination (proposal §4.5, §8.6)

The ~900 ms idle save stays; add explicit flush points before changing source,
changing active prep, collecting from an edited source, inserting into a prep body
then switching away, and deleting a dirty note. Clip insertion updates the local
prep body and schedules an immediate save; on failure the text stays visible and
dirty and the clip stays in the tray (a save failure can never destroy collected
source). The orchestrating `NotesView` shell owns these flush points — it invokes
the active `NoteEditor`'s flush before delegating a source/prep switch or a
destructive action, rather than each pane re-implementing flush coordination. The
prep editor reuses the existing `NoteEditor` contract — no second editor engine.

---

## Deliverables

A single lockstep change across core, server, and web (proposal §4–§9, §11.1); the
`spec-to-tickets` step will split this into reviewable diffs in roughly the §11.1
order (firewall/negative tests land before the UI makes new data easy to create).

1. **Core domain — `packages/core/src/story-notes.ts`.** Add `mode:
   "scratch" | "scene-prep"` to `StoryNote` (default `"scratch"` on create and
   migration, returned on every read); all existing fields/limits unchanged.
   `storyNoteCreateInputSchema` accepts optional `mode` (default scratch);
   `storyNoteUpdateInputSchema` accepts optional `mode` (omission preserves
   current). Allow scratch → scene-prep freely; allow scene-prep → scratch **only
   when the tray is empty** (else server conflict). Add a strict `StoryNoteClip`
   type + Zod schema (`id`, `prepNoteId`, `sourceNoteId | null`, `captureKind:
   "whole-note" | "excerpt"`, `sourceTitleSnapshot` ≤ 160, `content` ≤ 200,000,
   `sourceUpdatedAtAtCapture`, `position` ≥ 0, `createdAt`, `updatedAt`; content
   immutable after capture). Add strict Zod unions for whole-note capture, excerpt
   capture (`selectedText`, `sourceUpdatedAt`), batch capture (1–100 items),
   complete tray reorder (deduplicated clip-ID array), and batch note deletion
   (1–100 IDs). These schemas are **never** added to the record registry, validation
   snapshot, compiler types, or generation brief.

2. **Core schema version — `packages/core/src/project-storage.ts`.** Bump
   `LOOM_SCHEMA_VERSION` 2 → 3; ensure `evaluateStoreCompatibility` accepts v3 and
   rejects future schemas under existing rules. Do **not** touch
   `packages/core/src/version.ts` constants.

3. **Server storage + migration — `packages/server/src/{record-tables,project-store}.ts`.**
   Add `note_mode TEXT NOT NULL DEFAULT 'scratch' CHECK (note_mode IN
   ('scratch','scene-prep'))` to `story_notes` (retain all current columns/indexes);
   add `story_note_clips` (`prep_note_id … REFERENCES story_notes(id) ON DELETE
   CASCADE`, `source_note_id … REFERENCES story_notes(id) ON DELETE SET NULL`,
   checked `capture_kind`, snapshots, `position`, timestamps) with indexes
   `(prep_note_id, position, created_at)` and `(source_note_id)` — **not** a unique
   `(prep_note_id, position)` (a reorder resequences in one transaction). The
   `ON DELETE CASCADE` / `ON DELETE SET NULL` clauses document integrity intent but
   are **not** relied on at runtime: `PRAGMA foreign_keys = ON` is set only on the
   store-create path (`project-store.ts` `configureDatabase`), not on the open path
   that normal deletion runs through, so — matching the established pattern where
   `record-repository.ts` deletes `record_references` rows explicitly despite its own
   `ON DELETE CASCADE` — the repository performs clip cascade and source-pointer
   nulling explicitly inside the delete transaction (Deliverable 4). Add a
   normal `story_notes_fts` FTS5 table (`note_id UNINDEXED`, `title`, `tags`,
   `body`, `tokenize = 'trigram'`) kept in sync by insert/update/delete triggers on
   `story_notes`; it is derived and fully rebuildable. Refactor open-time migration
   into an **ordered step runner** (v1→v2 retained, new v2→v3; a v1 store chains
   both). The v2→v3 transaction (proposal §6.3): FTS5 preflight → `BEGIN IMMEDIATE`
   → inspect `PRAGMA table_info` → add `note_mode` → create clip table + indexes +
   FTS table + triggers (`IF NOT EXISTS`) → clear/repopulate FTS from every row →
   verify FTS coverage + valid modes → `PRAGMA user_version = 3` → commit → only
   then advance project metadata. On any failure: roll back, leave `user_version`
   at 2, leave v2 rows readable by the old schema, report the existing structured
   migration failure, **never** fall back to in-memory compatibility.

4. **Server repository — `packages/server/src/story-notes-repository.ts`.** Evolve
   in place (no parallel note authority): select only needed columns; use FTS5 for
   non-empty searches with the tested literal query builder + short-term fallback;
   parameterized exact tag AND predicates; validate every base note and clip at the
   storage boundary with core Zod; create clip snapshots + server-captured metadata
   transactionally; verify excerpt timestamp equality + exact containment (duplicate
   occurrences are harmless — identical bytes, no offset claimed; empty selection
   invalid); reorder a complete tray transactionally; convert mode only under the
   empty-tray rule; batch-delete note IDs atomically; on a prep-note delete cascade
   its tray clips and on a source-note delete null the `source_note_id` of every
   referencing clip — both performed **explicitly inside the delete transaction**,
   because the DDL FK actions do not fire on the open connection (Deliverable 3);
   expose an FTS rebuild helper for migration/tests only (no public HTTP maintenance
   endpoint). Reimplement the tag-list endpoint without loading every body, returning
   normalized tag counts. Derived read fields (`relevance`, `titleHighlight`,
   `bodySnippet`, `matchedTags`, clip `sourceStatus: "current" | "edited" | "deleted"`)
   belong to explicit list/clip response types, **not** to `StoryNote`. The `mode`
   field, by contrast, is a real `StoryNote` field returned on every read, so add it
   to the `Pick<StoryNote, …>` of the `StoryNoteSummary` type — defined in **two**
   parallel locations that must move together: `packages/server/src/story-notes-repository.ts`
   and `packages/web/src/api.ts`.

5. **Server routes + client — `packages/server/src/story-note-routes.ts`,
   `packages/web/src/api.ts`.** Extend `GET /api/notes` with `q`, repeated `tag`
   (AND), `mode=all|scratch|scene-prep`, and `relevance` (valid only with non-empty
   `q`); `POST` accepts optional `mode`; `PUT` preserves omitted `mode` and returns
   `409 prep-has-clips` on a scene-prep→scratch downgrade with clips; `DELETE`
   keeps hard-delete semantics and may report cascaded-clip/detached-pointer counts.
   Add tray routes: `GET /api/notes/:prepNoteId/clips`, `POST …/clips` (atomic 1–100
   capture, validate-all-before-insert, append after current max), `PUT …/clips/order`
   (replace exact ordered clip-ID set; stale set → conflict), `DELETE
   …/clips/:clipId`, and `POST /api/notes/delete-batch` (atomic 1–100). Continue the
   discriminated envelope; new error kinds `404 clip-not-found|prep-not-found`,
   `409 not-a-prep-note|prep-has-clips|stale-source|stale-tray`. Messages never echo
   bodies or selected text. No binding change (`127.0.0.1` only), no API key read,
   no OpenRouter call; logs carry method/route/IDs/counts/status only — never
   bodies, clip content, selected text, snippets, raw results, or FTS rows. Add
   typed client fns `listNoteClips`, `captureNoteClips`, `reorderNoteClips`,
   `deleteNoteClip`, `deleteNotesBatch` plus the new query/response fields; no client
   fn accepts a record reference, scene ID, generation payload, API key, or model
   option.

6. **Web UI — `packages/web/src/notes/*`, `packages/web/src/shell/AppShell.tsx`.**
   Keep one project-gated `/notes` route and one "Private Notes" sidebar entry (no
   `/scene-prep` peer). Refactor `NotesView` into an orchestration shell with focused
   children (e.g. `NotesSearchPane`, `NoteSourcePane`, `ScenePrepPane`,
   `NoteClipTray`, `PermanentDeleteDialog`), reusing `NoteEditor`, `NoteDetail`, and
   `safe-markdown`. Find pane: debounced query, multi-tag AND chips, pinned/mode
   filters, relevance + existing sorts, match count, result checkboxes, "Collect
   selected"/"Permanently delete selected", highlighted title + direct excerpt +
   tags/timestamps/pin/mode badge, active-tray collection count. Source pane: safe
   Preview + escaped Markdown-source read view; "Collect selection" enabled only in
   source view when `selectionStart !== selectionEnd`; "Edit source" flushes a
   pending edit before capture. Prep pane: prep-sheet selector + "New prep sheet" +
   "Use this note as a prep sheet", editor, save state, source tray with
   capture-kind/time/status badges, insert-at-cursor/append, open-source/remove,
   keyboard move-up/down (drag supplemental), collapse/expand. Highlighting rendered
   from React text nodes only; destructive actions use a focused modal with explicit
   consequence text; plain global CSS in `styles.css`; no new design system, Redux,
   or query library. Render the required boundary badge + explanatory sentence +
   deletion-confirmation language (§D).

7. **Expanded isolation firewall + repository/migration/web tests** (proposal §9).
   Extend `packages/core/test/story-notes.test.ts` (mode default + enum, clip
   schema strictness/limits/union rules, reorder/batch dedup + over-limit,
   `StoryNote`/`StoryNoteClip` absent from every record/reference/brief/snapshot/
   working-set union). Extend
   `packages/core/test/compiler-context-firewall.test.ts` with new sentinel canaries
   (scene-prep title/body/tag, `mode`, whole-note/excerpt clip content, source-title
   snapshot, source timestamp, synthetic snippet/highlight/rank/source-status) asserted
   absent from compiled prose/ideation/assistance prompts, validation/readiness
   diagnostics, compiler fingerprint inputs+output, and prompt inspection; keep the
   import-level check that compiler modules do not import `story-notes`. Expand
   `packages/server/src/story-notes-isolation.test.ts` to create scratch+prep notes,
   whole+excerpt clips, FTS-indexed canaries, and edited/deleted clip states, then
   prove none appear in validation, readiness, prose compile/preview/generate,
   ideation, record-hygiene assistance, OpenRouter request capture, prompt
   inspection, logs, working set, record references, or accepted segments — only
   `/api/notes…` may return them. Extend `story-notes-migration.test.ts` per
   proposal §6.5 (v2 max-length/Unicode preservation, v1 chain, v3 idempotence,
   forced-failure rollback leaving v2 intact, fresh v3 store, source-delete →
   null pointer + preserved bytes, prep-delete → cascade, FTS count/content parity,
   `evaluateStoreCompatibility` v3). Add repository tests per proposal §9.5
   (weighted relevance + deterministic tie-break, literal escaping of FTS operators,
   trigram + short-term fallback, exact multi-tag AND, trigger sync, safe snippet
   markers, capture/stale-source/self-capture/reorder/cascade cases, atomic
   batch ops, no body in errors/logs) and web tests per §9.6. `boundary.test.ts`
   stays green (core gains only pure types/schemas/normalization/IDs — SQLite/FTS in
   server, panes/highlighting in web).

8. **Docs — `docs/user-guide.md`.** Add a Scene Prep section explaining the
   workspace, local search, snapshot behavior (copies survive source deletion), and
   hard-delete consequences. It is already an active registered doc, so no new
   `docs/ACTIVE-DOCS.md` entry is created. Do **not** add note fields to
   `docs/story-record-schema.md` or anything to `docs/compiler-contract.md`; do not
   change prompt/template/contract versions.

---

## FOUNDATIONS Alignment

| Principle | Stance | Rationale (mechanism @ surface) |
|---|---|---|
| §6.6 — author-private story notes | aligns | Prep sheets and clip trays are **internal structures of the same admitted sixth surface**, not new surfaces. §6.6 admits per-project author-private notes and does not require a single flat table or single-pane UI. The only persisted relation is a narrow, nullable note→note source pointer **inside** Notes — §6.6 forbids note→record links, not private note→note provenance @ storage. |
| §29.12 — author-private notes hard fails | aligns | §29.12 **explicitly** names "metadata, previews, summaries, or derived material"; FTS rows, snippets, ranks, highlights, source statuses, `mode`, and clip content fit that wording and are kept out of validation/readiness/working-set/compiler/any prompt/OpenRouter/inspection by a Notes-only repository and expanded canary tests across every prompt path @ isolation firewall. No note is treated as a record, reference target/source, working-set member, accepted-prose source, or promote-to-record item. |
| §27 — UI labeling of inert scratch | aligns (strengthened) | The workspace **adds** to the §27 obligation: existing badge retained verbatim, a plain-language explanatory sentence added, one "Private Notes" sidebar item, no continuity colors/icons/"working set"/readiness/canon vocabulary @ Notes UI. |
| §8 — deterministic prompt compilation | aligns | The compiler, template, prompt contract, and `version.ts` constants are untouched; no note placeholder, section, empty state, or compiler input is added @ prompt-compilation. Search is a local SQLite operation, not an assistance call. |
| §7 — active working set supremacy | aligns | The "source tray" is deliberately distinct terminology and storage; no clip or note enters working-set membership or routes @ working-set. |
| §29.4 — prompt-compilation hard fails | aligns | No new model/network surface, keyword activation, embeddings, or token eviction; FTS5 + local CRUD only, loopback-only, no API key read @ server. |

**No `docs/FOUNDATIONS.md` amendment is required.** Verified against the working
tree: §6.6 (`docs/FOUNDATIONS.md:235–248`) admits the surface without constraining
its internal structure; §29.12 (`:1101–1109`) already covers derived material and
metadata; §27 (`:907–920`) is strengthened, not relaxed. An amendment would become
necessary only if an implementation departed from this spec by linking notes to
records, letting any note-derived value reach a prompt/validation/working-set path,
adding an LLM-over-notes helper, or introducing live transclusion that mutates a
prep artifact — none is specified. This answers the request's "aligned with
`docs/**`" determination on the record.

---

## Verification

Minimum deterministic regression properties — machine-testable across the three
packages (proposal §6.5, §9):

- a v2 note (including maximum-length + Unicode) migrates to v3 byte-for-byte
  unchanged, acquiring only `mode: "scratch"` and one rebuildable FTS row; a v1
  store chains v1→v2→v3; reopening a v3 store is idempotent;
- a forced FTS/table/trigger failure rolls the v2→v3 transaction back, leaves
  `user_version` at 2 and all v2 rows readable, and advances project metadata only
  after a successful DB commit;
- FTS row count and content match base notes after migration and after every
  create/update/delete (trigger sync);
- relevance ranking is weighted (title > tags > body) and deterministically
  tie-broken; FTS operators (`OR`, `NOT`, quotes, column selectors, punctuation)
  are treated as literals; trigram substring + 1/2-char fallback behave as
  specified; multi-tag filtering is exact AND;
- whole-note and excerpt capture snapshot correctly; a stale source (timestamp
  mismatch) yields `409 stale-source`; same-text-multiple-times capture succeeds;
  self-capture is rejected; reorder requires the exact clip set (stale →
  `409 stale-tray`); source delete → null pointer + preserved snapshot bytes; prep
  delete → cascaded clips + preserved sources — both asserted against an existing
  store opened through the open path (where `PRAGMA foreign_keys` is off), proving
  the explicit repository cascade/null, not a declarative FK action, does the work;
  mode downgrade with clips → `409 prep-has-clips`; batch capture and batch delete
  are atomic;
- no note body, clip content, or selected text appears in any error message or log;
- every new route returns `409 no-open-project` with no open project
  (`fastify.inject()`, matching the existing pattern);
- **every new canary** (scene-prep note title/body/tag, `mode`, whole/excerpt clip
  content, source-title snapshot, source timestamp, synthetic
  snippet/highlight/rank/source-status) is absent from every compiled prose/
  ideation/assistance prompt, validation/readiness diagnostic, compiler fingerprint
  input+output, prompt-inspection payload, OpenRouter request body, log, working
  set, record-reference graph, and accepted-segment store — only `/api/notes…`
  returns them;
- React highlighting renders from text nodes (no `dangerouslySetInnerHTML`);
  multi-select collection, exact textarea-selection capture, source/prep coexistence
  without navigation loss, insert/append + autosave-failure recovery, keyboard
  reorder, edited/deleted source labels, batch-delete confirmation text + retained-
  copies warning + prep-cascade wording, the boundary badge + explanatory sentence,
  and the absence of any record/readiness/generation/working-set action in Notes
  all render correctly;
- `boundary.test.ts` stays green (core imports no `fastify`/`react`/`vite`/`node:*`).

Gates: `npm run lint`, `npm run typecheck`, `npm test` (builds `@loom/core`
first), `npm run build` — all green before completion. The `docs/user-guide.md`
Scene Prep section ships in the same change as the feature.

---

## Out of Scope

Explicitly excluded (proposal §1.6, §12) — and confirmed unchanged: any note →
record, scene, generation session, candidate, accepted-segment, or prose link;
promote-note-to-record; record suggestions derived from notes; note participation
in validation, readiness, compiler inputs, any prompt, OpenRouter body, prompt
inspection, Active Working Set, or record references; cross-project or global
notes; cloud storage, sync, collaboration, accounts, telemetry, or remote search;
any LLM-over-notes (local or remote); embeddings or semantic model distribution;
general wiki links, backlinks, graph view, live transclusion, or recursive embeds;
a full block/outliner editor; folders, nested note hierarchy, or hierarchical tags;
generic saved searches/views; canvas or corkboard; automatic scene planning,
beats, acts, plot rails, or consumption detection; soft delete, archive, trash,
recovery, or undo; automatic source-text cutting after collection;
secure-erasure-from-disk guarantees; and changes to the prompt template, prompt
compiler, validation gate, story-record schema, compiler contract, or any
`version.ts` template/compiler/contract constant.

Not in this spec's authoring scope: the per-reviewable-diff **ticket decomposition**
(deferred to `spec-to-tickets`, seeded by proposal §11.1's order), and any
backward-compatibility shim for the `mode`/`note_mode` addition (unnecessary —
existing notes default to scratch and migrate intact).

---

## Risks & Open Questions

1. **FTS5 availability — preflight, no silent fallback.** The supported Node 24
   runtime ships `SQLITE_ENABLE_FTS5`, but the migration must still preflight it: a
   missing build is an unsupported-runtime migration error with the v2 transaction
   rolled back intact. There must be **no** hidden return to load-all-bodies search
   — divergent search implementations would complicate behavior and testing
   (proposal §11.2).
2. **FTS query-language correctness.** Binding a `MATCH` parameter prevents SQL
   injection but not FTS operator interpretation; the repository needs a tested
   literal query builder (escape quotes, `OR`/`NOT`/`AND`, column selectors,
   punctuation). This is a correctness/predictability requirement, not only
   hardening (proposal §11.3). The 1/2-character fallback and mixed-length handling
   need explicit coverage.
3. **Index consistency.** The FTS table is derived: triggers sync normal writes,
   migration rebuilds it, and tests compare base/index counts. The app must not
   expose a second writable path to it (proposal §11.4).
4. **Snapshot duplication is the feature, not a bug.** Snapshots deliberately
   duplicate content — that *is* the copy/paste replacement. Deleting a source does
   not erase prep copies; deleting a prep sheet does not delete sources;
   "delete all copies of this text" is not attempted; confirmations must state
   entity-level semantics so the author neither loses assembly nor expects global
   erasure (proposal §11.5, §4.4).
5. **Selection fidelity.** Rendered-Markdown selection is not a reliable
   source-range protocol; collection comes only from the exact Markdown-source view,
   protected by server timestamp + containment checks, with no persistent character
   offset (proposal §11.6, §8.4).
6. **`prep_note_id` mode invariant is not a FK.** SQLite cannot express
   "`prep_note_id` points to a scene-prep-mode note" as a simple foreign key; the
   repository must validate it on every clip operation, with route/repository tests
   proving it (proposal §5.2). Relatedly, the declared `ON DELETE CASCADE` /
   `ON DELETE SET NULL` clauses do not fire at runtime, because `PRAGMA foreign_keys
   = ON` is set only on the store-create path, not the open path normal deletion
   uses; the repository therefore deletes cascaded clips and nulls source pointers
   **explicitly** inside the delete transaction (matching `record-repository.ts`'s
   explicit `record_references` deletion), and an open-path test proves no orphaned
   clips or dangling pointers remain.
7. **Mode-downgrade safety.** scene-prep → scratch is allowed only with an empty
   tray (else `409 prep-has-clips`), preventing ownerless clips; the conversion path
   and its conflict must be tested (proposal §5.1).
8. **Autosave/insertion ordering.** A clip insertion schedules an immediate save but
   removal must never be a side effect of insertion, so a save failure cannot
   destroy collected source; the explicit flush points (before source/prep switch,
   collect-from-edited-source, dirty-delete) need failure-path tests (proposal §4.5,
   §8.6).
9. **Scale.** Scope is a single story's notes; FTS5 + bounded 1–100 batch ops are
   sufficient. No pagination, background workers, remote indexes, or caching until
   measured data shows a need (proposal §11.7).
