# SPEC-023 — Author-Private Story Notes

**Status**: DRAFT  
Phase: post-v1 feature spec; new author-private per-story surface  
Depends on: explicit FOUNDATIONS amendment approval under §1.1 before implementation; existing local project store, record-route, record-repository, and app-shell patterns  
Governing authority: `docs/FOUNDATIONS.md`  
Primary authority docs: `docs/ACTIVE-DOCS.md`, `docs/FOUNDATIONS.md`, `docs/story-record-schema.md`, `docs/user-guide.md`  
Supporting authorities: `docs/compiler-contract.md` as a negative boundary, `docs/archival-workflow.md`, `tickets/README.md`, `tickets/_TEMPLATE.md`, `README.md`  
Commit of record for repository inspection: `a62f975e08528cc713492af87d06623dd7872ed9`  
Freshness claim: user-supplied target commit only; this spec does **not** independently verify that the commit is current `main`.

> Section style note: this file uses the canonical `specs/` section set
> (Problem Statement / Approach / Deliverables / FOUNDATIONS Alignment /
> Verification / Out of Scope / Risks & Open Questions) that the `reassess-spec`
> and `spec-to-tickets` skills parse.

---

## Brainstorm Context

- **Original request:** Produce a new implementation spec, and only a spec, for
  author-private Notes in Continuity Loom: titled, freeform, per-story notes the
  user can create, edit, browse, and delete; persisted in the local project
  store; and completely walled off from deterministic prompt compilation,
  validation/readiness snapshots, active working set, generation brief,
  ideation prompt, and every compiler input.
- **Originating research brief:** this spec derives from
  `reports/author-private-story-notes-research-brief.md`, the local research
  brief that scoped the feature and its FOUNDATIONS §6 tension before drafting.
- **Spec number:** `SPEC-023` is used because the uploaded manifest shows
  `archive/specs/SPEC-022-ideation-native-prompt-template.md` and no higher
  `SPEC-NNN` under `specs/` or `archive/specs/` at the target commit.
- **Exact-commit source basis:** Repository files were selected from the
  uploaded manifest as path inventory and fetched only through exact raw URLs of
  the form
  `https://raw.githubusercontent.com/joeloverbeck/continuity-loom/a62f975e08528cc713492af87d06623dd7872ed9/<path>`.
  No clone, branch-name fetch, GitHub code search, repository metadata lookup,
  default-branch lookup, or connector namespace label was used as evidence.
- **Premise verification from repo files:**
  - `docs/ACTIVE-DOCS.md` makes `docs/FOUNDATIONS.md` the constitution,
    maps the active authority hierarchy, requires every new active `docs/*.md`
    file to be registered there, and directs new feature work that touches
    storage/schema/prompt/local-first boundaries into a new spec.
  - `docs/FOUNDATIONS.md` currently defines five continuity surfaces in §6;
    Notes are deliberately a sixth, author-private surface and therefore require
    an explicit amendment before implementation.
  - `docs/story-record-schema.md` defines the record and generation-time brief
    schema economy; Notes are not a record type, not a singleton story-config
    record, and not a generation-time field.
  - `docs/compiler-contract.md` has no placeholder or section-order machinery
    for Notes, and this spec intentionally adds none.
  - `packages/server/src/record-tables.ts`, `record-repository.ts`,
    `project-store.ts`, `record-routes.ts`, and `server.ts` establish the
    existing SQLite, repository, migration/open-project, route, no-open-project,
    and loopback/log-redaction patterns Notes must mirror without joining the
    record graph.
  - `packages/core/src/project-storage.ts` and
    `packages/core/test/boundary.test.ts` establish the schema-version and core
    purity boundaries; pure Notes schemas may live in `@loom/core`, but core may
    not import `node:*`, Fastify, React, or Vite.
  - `packages/server/src/snapshot-builder.ts`, `compile-routes.ts`,
    `readiness-routes.ts`, `packages/core/src/validation/snapshot.ts`, and
    `packages/core/src/compiler/compile-prompt.ts` show the prompt/readiness
    path consumes validation snapshots, story config, generation session state,
    and selected records — not arbitrary project tables. Notes must remain
    absent from these types and call paths.
  - `packages/web/src/shell/AppShell.tsx`,
    `packages/web/src/records/RecordBrowser.tsx`, `packages/web/src/api.ts`,
    and `packages/web/src/styles.css` establish the React Router route/nav
    pattern, list-detail-editor surface pattern, native-fetch client style, and
    plain global CSS conventions.
- **External research consulted:** writer notebooks and research surfaces in
  Scrivener, World Anvil, Campfire, Ellipsus, bibisco, Notion, Obsidian, and
  Logseq; personal-information-management research on organizing/finding/keeping
  and folders-vs-tags; local-first software principles; CommonMark/Markdown;
  safe Markdown rendering; and SQLite FTS5 as a deferred search-index option.
- **Locked scope decisions from the brief:** no clarifying questions were
  required or asked. Notes are per-story, permanent, author-private scratch;
  title + body are the floor; no prompt inclusion; no record links; no
  promote-to-record path; local-first and loopback-only; storage validation is
  separate from generation/readiness validation; and FOUNDATIONS alignment is
  part of the deliverable.

---

## Problem Statement

Continuity Loom has strong surfaces for **structured continuity**: records,
active working set, generation-time brief, generated prompt, and accepted
segment archive. It does not yet have a place for the author's messy,
long-lived private thoughts: brainstorm fragments, worldbuilding that may never
be canon, questions to self, reminders, discarded hypotheses, research scraps,
and todos that should live beside the story without becoming continuity.

Authors need that scratch surface. Mature writing and knowledge tools nearly
all provide some form of project-adjacent notebook, binder, research area,
private note, or database of supporting pages. Scrivener's core metaphor puts
manuscript, notes, and references in one project binder; Obsidian and Logseq
bias toward local, text-based knowledge stores; World Anvil's Notebook adds
private notes with search, tags, and starring; Notion exposes searchable and
sortable metadata over pages; Campfire and bibisco emphasize keeping planning,
characters, plot, and writing material together; Ellipsus emphasizes author
ownership and rejects generative AI as a mutation path for the writer's work.
Those patterns are useful, but Continuity Loom cannot copy them naively because
Loom's prompt pipeline is deliberately narrow, deterministic, inspectable, and
record-grounded.

The design problem is therefore not "add another source of context." It is:

> Add a durable, pleasant, local, per-story author notebook while proving that
> note titles and note bodies can never become prompt context, validation input,
> working-set membership, record graph material, or hidden compiler state.

That creates a constitutional tension. `docs/FOUNDATIONS.md` §6 currently names
**five** continuity surfaces. Notes are a sixth project surface, but they are
not continuity-bearing and must not weaken the closed prompt context model.
This spec therefore treats the feature as requiring a deliberate FOUNDATIONS
amendment before implementation, rather than silently interpreting §6 as open.

---

## Design Stance & Scope

### What Notes are

Story Notes are a **sixth, author-private project surface**:

- **Per-story, not global.** A note belongs to the currently open project/story
  and is stored in that project's local SQLite database. It opens and closes
  with the project, like records and `story_config`; it is not an account-level
  or global setting.
- **Permanent parallel scratchpad.** Notes are indefinite private scratch. They
  can hold brainstorming, worldbuilding, reminders, todos, research fragments,
  rejected ideas, questions, or prose snippets the author does not want to make
  canonical.
- **Title + freeform body floor.** Every note has a non-empty title and a body
  field. The body is freeform Markdown-compatible plain text and may be empty
  during drafting, but the body field is always present.
- **Author-owned local data.** Notes add no account, cloud, sync, telemetry,
  remote index, remote preview, or background network call.
- **Manual-only influence.** A note can influence the story only if the human
  author manually re-authors equivalent information into a prompt-facing record
  or generation-time brief field.

### What Notes are not

Notes are deliberately inert with respect to continuity:

- Notes are **not** story records and must not be registered in the record
  registry.
- Notes are **not** generation-time brief fields and must not appear in
  `GenerationSessionReady` (the generation-brief readiness input produced by
  `normalizeGenerationSessionForReadiness`), readiness validation, the
  validation snapshot, or compile inputs.
- Notes are **not** active-working-set members and have no salience, urgency,
  cast band, local function, compile destination, or readiness status.
- Notes are **not** accepted prose, rejected prose, candidate prose, prompt
  archives, prompt inspection material, or automatic prose-derived summaries.
- Notes have **no record references**. A note cannot link to a record, cannot be
  linked from a record, cannot participate in `record_references`, cannot block
  record delete/archive, cannot repair dangling references, and cannot appear in
  record graph validation.
- Notes are **not** a staging area for records. There is no "promote note to
  record," "extract record from note," "add note to working set," "include note
  in prompt," or "use note as brief" action.
- The app must never use an LLM to mutate notes automatically.

### Recommended V1 feature set

Above the locked title/body/CRUD floor, this spec recommends the following
bounded feature set:

1. Markdown-compatible plain-text body with safe rendered preview.
2. Local search over note title/body/tags.
3. Lightweight freeform tags.
4. Pinned notes.
5. Created/updated timestamps and stable sort options.
6. Debounced autosave for existing notes, with visible saved/saving/error state.
7. Hard delete with explicit confirmation.

This spec deliberately excludes folders, sections, record links, backlinks,
manual ordering, soft-delete/trash, attachments, image uploads, daily notes,
block references, graph views, embeddings, AI summarization, and any prompt-use
or record-conversion affordance.

---

## Research Grounding & Rationale

### Survey synthesis

Writer tools support project-adjacent private material because long fiction has
more author knowledge than the manuscript can safely contain at any one moment.
Scrivener's official overview describes its binder metaphor as a way to gather
material and move between manuscript, notes, and references, while still letting
writers restructure long documents later.[^scrivener-overview] That argues for
Notes living beside the story, not in a global settings page.

World Anvil's Notebook exposes private notes, starring, tags, and search; its
help docs describe starring as quick access and tags as a parallel organization
system matched by notebook search.[^worldanvil-notebook] A later World Anvil
feature note similarly groups search/filtering, tags, section movement, and
starring as organization improvements.[^worldanvil-features] The relevant Loom
lesson is not to copy its section hierarchy or publishing/account model, but to
keep the high-value findability affordances: search, tags, and pins.

Obsidian stores notes as Markdown-formatted plain-text files in local vault
folders and lets other editors/file managers operate on those files.[^obsidian-storage]
Its search plugin is a core affordance for finding data in a vault using terms
and operators.[^obsidian-search] Logseq likewise emphasizes privacy, longevity,
user control, Markdown/Org-mode support, and graph-style knowledge management
features.[^logseq-github] Loom should borrow the durable-local and plain-text
body posture, not the graph/link/backlink model. Links are powerful in PKM, but
Loom's locked requirement is full isolation from records.

Notion's database docs show why lightweight metadata helps browse a pile of
pages: properties exist so views can filter, sort, and search data, and
multi-view databases organize many pages in one place.[^notion-properties][^notion-views][^notion-databases]
Loom should adopt the smallest metadata set that earns its keep — tags, pinned,
and timestamps — without turning Notes into a second story-record database.

Campfire's writing software markets modules for planning, plotting, character
sheets, timelines, and world lore; its mobile listing describes interconnected
tools that can reference and link story elements.[^campfire-write][^campfire-mobile]
For Loom, this is mostly a negative example: writers value worldbuilding
adjacency, but Loom must not reproduce cross-linking because record links are
explicitly forbidden for Notes.

Ellipsus positions itself as writer-owned and states "No generative AI—ever" on
its main product page; its feature list centers drafts, comments, version
history, and collaboration rather than AI mutation.[^ellipsus-home][^ellipsus-features]
That reinforces Loom's stance: Notes are authored by the user and never mutated
or summarized by an LLM.

bibisco describes itself as novel-writing software that helps authors plan,
write, organize, and develop a novel from first idea to complete draft.[^bibisco-home]
Again, the transferable insight is project cohesion: story planning material
belongs near the story, not in a disconnected global utility.

Personal-information-management research supports the same small feature set.
Lush's PIM literature review frames the fundamental activities as organizing,
finding, and keeping personal information.[^lush-pim] Civan et al.'s folders vs.
tags work starts from the premise that folders have long been the primary method
for organizing personal information, then studies whether tags are a viable
alternative.[^civan-tags-folders] For Loom V1, that argues against forcing a
folder taxonomy up front. Tags are lower-friction, search works even when the
user has not organized, and pins cover the "I need this right now" case.

Local-first software principles also matter. Ink & Switch define local-first as
software that improves offline availability, security/privacy, long-term
preservation, and user control of data.[^ink-switch-local-first] Notes are
therefore stored in the existing local project SQLite store, not an external
cloud note service, remote index, or account-bound notebook.

Markdown is recommended because CommonMark defines Markdown as a plain-text
format for structured documents.[^commonmark] Markdown-compatible bodies give
writers headings, lists, emphasis, checkboxes-as-text, and code/research
snippets without a rich-editor dependency or opaque document format. Rendering
must be safe: `react-markdown` documents that it escapes or ignores raw HTML by
default because raw HTML is dangerous,[^react-markdown] and DOMPurify is a
standard sanitizer if any renderer later enables raw HTML or generated HTML
injection.[^dompurify]

SQLite FTS5 exists and is the right direction for large local corpora: SQLite
describes FTS5 as a virtual table module for full-text search.[^sqlite-fts5]
This spec still **does not** require FTS5 in V1. Loom's first Notes corpus is
expected to be small, and introducing a virtual table plus triggers creates a
larger migration surface. V1 search should use deterministic local substring
matching over title/body/tags, with FTS5 reserved for a future performance spec
if real projects outgrow simple search.

### Decisions from the research

#### Include: Markdown-compatible plain text + safe preview

Store the body as raw text. The editor is a normal textarea, not a WYSIWYG rich
editor. The UI provides a Preview mode that renders a safe Markdown subset:
headings, lists, emphasis, links, inline code, fenced code blocks, and
checkbox-looking list items. Raw HTML is ignored or escaped. No embeds, remote
link previews, image fetching, Mermaid, iframes, or scriptable extensions.

This gives the author structure without introducing a new document model or
network surface.

#### Include: search

Browsing without search fails quickly once notes become the author's memory.
V1 search is case-insensitive local substring matching across `title`, `body`,
and `tags`, with stable ranking:

1. pinned exact title matches;
2. exact title matches;
3. pinned body/tag matches;
4. body/tag matches;
5. updated newest first as tie-breaker.

Search is server-side for route consistency but intentionally simple; no
external index, embeddings, cloud search, or LLM retrieval.

#### Include: tags

Tags are optional, opaque, author-authored strings. They do not point at
records, entities, cast members, locations, themes, or any typed ontology.
Recommended examples in UI copy: `todo`, `worldbuilding`, `research`,
`voice`, `later`, `spoiler`. The tag system is deliberately shallow: no tag
hierarchy, no autocomplete from record names, no backlinks, no computed tags.

Tags earn their place because they support loose organization without forcing
folders or schema design too early.

#### Include: pinned notes

Pinned notes are a single boolean. They sort to the top and can be filtered.
They replace more complex favorites, priority numbers, manual ordering, and
folder-front pages in V1.

#### Include: timestamps and sort options

`created_at` and `updated_at` are required. Default list order is pinned first,
then `updated_at` descending, then `id` ascending for deterministic ties. Other
sorts: title ascending, created newest, created oldest, updated newest, updated
oldest. There is no manual order in V1.

#### Include: debounced autosave for existing notes

Notes behave more like a scratch document than a structured record form. For
existing notes, changes autosave after a short debounce and on blur; the UI
shows `Saving…`, `Saved`, or an error with retry. The editor keeps unsaved
changes in component state if a save fails. The app does not implement a global
offline queue in V1 because the server is local and the project store is single
active project/session.

For new notes, the user supplies a title, the app creates the row, then body and
metadata changes autosave. Empty-title drafts remain client-local until the user
enters a valid title; they are not persisted as malformed rows.

#### Include: hard delete with confirmation

Delete removes the note row. Because Notes are not records and cannot be
referenced, deletion has no referential-integrity blockers. The UI must use a
clear confirmation dialog containing the note title. Soft-delete/trash is
excluded from V1 because it adds state, filters, migration complexity, and new
recovery semantics without being necessary for the first local scratch surface.

### Deliberately excluded

- **Folders/sections/categories.** These create premature hierarchy and invite a
  second binder competing with Records. Tags + search + pins cover V1.
- **Manual ordering.** It adds persistent order-write churn and ambiguous
  behavior under filtering/search. Stable sort options are enough.
- **Record links/backlinks.** Forbidden by the locked intention and a major
  prompt-contamination risk.
- **Promote-to-record / extract-to-record.** Forbidden. The author must manually
  write continuity into records or brief fields.
- **Daily notes / journal automation.** Useful in PKM tools, wrong for Loom V1:
  it creates date-driven workflows unrelated to story-state continuity.
- **FTS5.** Worth revisiting only if simple local search becomes measurably
  inadequate.
- **Attachments/images/embeds.** They expand storage, backup, sanitization, and
  network-fetch concerns beyond the feature's purpose.
- **AI summaries, TODO extraction, semantic search, embeddings.** All would make
  notes computationally active and risk becoming hidden context.

---

## Approach

Single approach: add Notes as a separate vertical slice with a pure core shape,
server-side SQLite persistence and project-scoped REST routes, and a React
`/notes` surface. Do not thread Notes into any record registry, reference graph,
active working set, validation/readiness snapshot, compiler contract, prompt
preview, generate route, or ideation route.

### Package boundaries

- `@loom/core`: pure note schemas/types/helpers only. No persistence, no
  Fastify, no React, no Vite, no `node:*` imports. The existing core boundary
  test must stay green.
- `@loom/server`: SQLite DDL/migration, `StoryNotesRepository`, route
  registration, redaction, and fastify.inject tests.
- `@loom/web`: route registration, nav item, native-fetch API client helpers,
  list/detail/editor components, CSS, and UI tests.

### Naming

Use **Story Notes** for the domain and user-facing surface. Use `story_notes`
for the SQLite table. Use `StoryNote` for core/server/web types. Avoid `Record`
in all names except when stating a negative rule.

### No compiler-contract entry

`docs/compiler-contract.md` is not amended for Notes because Notes introduce no
prompt placeholder, no compiler input, no section-order entry, no empty-state
machinery, and no prompt-inspection surface. Any implementation that discovers
it needs a compiler-contract change has violated this spec.

---

## Data Model

### Core shape

Add a new pure module, recommended path:

```text
packages/core/src/story-notes.ts
```

Export it from `packages/core/src/index.ts`.

The pure shape is:

```ts
export type StoryNote = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StoryNoteCreateInput = {
  title: string;
  body?: string;
  tags?: string[];
  pinned?: boolean;
};

export type StoryNoteUpdateInput = {
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
};
```

Zod schemas live with the types:

- `storyNoteIdSchema`: UUID string. IDs should be UUIDv7 generated by a pure
  `generateStoryNoteId()` wrapper or helper that uses the existing `globalThis`
  crypto posture, not Node imports.
- `storyNoteTitleSchema`: trimmed string, minimum 1 visible character, maximum
  160 characters.
- `storyNoteBodySchema`: string, maximum 200,000 characters, not trimmed. Empty
  string is valid so a newly created note can be filled gradually.
- `storyNoteTagSchema`: trimmed string, minimum 1, maximum 32 characters,
  normalized for display/search. A safe implementation is Unicode letters,
  numbers, space, `_`, `-`, and `.`; no control characters. The repository must
  de-duplicate tags case-insensitively while preserving a stable display form.
- `storyNoteTagsSchema`: array, maximum 12 tags, default `[]`.
- `storyNoteSchema`: strict object matching `StoryNote`.
- `storyNoteCreateInputSchema`: strict object accepting title and optional
  body/tags/pinned.
- `storyNoteUpdateInputSchema`: strict replacement shape for PUT.
- `storyNoteListQuerySchema`: pure route-query helper if useful, but no Fastify
  types.

### What core must not do

Core must not add Notes to:

- `packages/core/src/records/registry.ts`;
- any record type union;
- `compileDestinationFamilyIds` and the `compile-destinations` module;
- reference classification helpers;
- generation brief descriptors;
- `GenerationSessionReady` / `normalizeGenerationSessionForReadiness`;
- validation/readiness schemas;
- prompt compiler section types;
- ideation operator, citation, or slot machinery.

### SQLite table

Add a table beside `story_config`, `generation_session`, and other per-project
state tables:

```sql
CREATE TABLE IF NOT EXISTS story_notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  pinned INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS story_notes_pinned_updated_idx
  ON story_notes(pinned DESC, updated_at DESC, id ASC);

CREATE INDEX IF NOT EXISTS story_notes_title_idx
  ON story_notes(title COLLATE NOCASE, id ASC);

CREATE INDEX IF NOT EXISTS story_notes_updated_idx
  ON story_notes(updated_at DESC, id ASC);
```

Storage notes:

- `tags_json` stores the normalized tag array. It is parsed and validated by
  the repository through `storyNoteTagsSchema` before any value crosses the
  storage boundary.
- No `story_note_records`, `note_references`, `note_links`, `record_id`,
  `target_id`, `compile_destination`, or `working_set` columns exist.
- No foreign key points from Notes to `records` or from `records` to Notes.
- No trigger writes to `record_references`.
- Search uses SQL substring matching and/or repository-side matching over
  already fetched notes. FTS5 virtual tables are out of scope for this spec.

### Repository

Add `packages/server/src/story-notes-repository.ts` with a dedicated
`StoryNotesRepository`. Do not fold notes into `RecordRepository`; separation is
part of the isolation proof.

Recommended methods:

```ts
type StoryNoteSort =
  | "updated-desc"
  | "updated-asc"
  | "created-desc"
  | "created-asc"
  | "title-asc";

type StoryNoteListQuery = {
  q?: string;
  tag?: string;
  pinned?: "all" | "only" | "unpinned";
  sort?: StoryNoteSort;
};

type StoryNoteSummary = Pick<
  StoryNote,
  "id" | "title" | "tags" | "pinned" | "createdAt" | "updatedAt"
> & {
  bodyPreview: string;
};

class StoryNotesRepository {
  listNotes(query?: StoryNoteListQuery): StoryNoteSummary[];
  getNote(id: string): StoryNote | undefined;
  createNote(input: StoryNoteCreateInput): StoryNote;
  updateNote(id: string, input: StoryNoteUpdateInput): StoryNote | undefined;
  deleteNote(id: string): boolean;
  listTags(): string[];
}
```

Repository rules:

- Parse every row through `storyNoteSchema` before returning it.
- Parse every create/update input through core Zod schemas before writing.
- Generate `id`, `created_at`, and `updated_at` server-side.
- Update `updated_at` on every content/metadata update.
- Keep body preview deterministic: strip Markdown syntax lightly or use a
  plaintext excerpt; cap at 240 characters; never call an LLM to summarize.
- Return deterministic orders even when timestamps tie.
- Never inspect or mutate records, working set, generation session, story
  config, accepted segments, or reference tables.

### Schema version and migration

This is a project-store schema evolution. Implementation must:

1. Bump `LOOM_SCHEMA_VERSION` in `packages/core/src/project-storage.ts` from
   `1` to `2`.
2. Ensure new projects create `story_notes` and set `PRAGMA user_version = 2`.
3. Add an open-time migration path for existing schema-version-1 projects:
   - verify app id and metadata first;
   - if store user_version is `1` and app schema is `2`, create `story_notes`
     and indexes inside a transaction;
   - update `PRAGMA user_version = 2`;
   - update project metadata `schemaMinVersion` to `2` in the same migration
     boundary;
   - only then proceed to compatibility evaluation as a version-2 store.
4. Keep migration idempotent by using `CREATE TABLE IF NOT EXISTS` and
   `CREATE INDEX IF NOT EXISTS`, but do not add compatibility aliases or
   duplicate authority paths.
5. Add a migration test that opens a schema-version-1 fixture and verifies the
   table exists, the version is bumped, and no records/generation/session data
   is changed.

If implementation discovers the current open-project compatibility check rejects
version-1 stores before migrations can run, that order must be adjusted for this
specific forward migration. The adjustment is part of this spec, not a separate
shim.

---

## Server API

Register new routes in `packages/server/src/story-note-routes.ts` and call the
registration from `packages/server/src/server.ts`. All routes are project-scoped
through the single active `ProjectStoreManager` model. If no project is open,
return the canonical error:

```json
{ "ok": false, "kind": "no-open-project", "message": "No project is open." }
```

with HTTP `409`, matching existing record route behavior.

### Response conventions

Use discriminated response unions in the existing style:

```ts
type NotesRouteError =
  | { ok: false; kind: "no-open-project"; message: string }
  | { ok: false; kind: "invalid-request"; message: string; issues?: unknown }
  | { ok: false; kind: "malformed-payload"; message: string; issues?: unknown }
  | { ok: false; kind: "not-found"; message: string };
```

No route returns raw thrown Zod errors. Field-level issues may be included in a
safe structured form for the UI, but request bodies containing note text must not
be logged.

### Routes

#### `GET /api/notes`

List note summaries.

Query parameters:

- `q` optional string, max 200 characters after trim;
- `tag` optional string, normalized by the same tag normalizer;
- `pinned` optional enum: `all` default, `only`, `unpinned`;
- `sort` optional enum: `updated-desc` default, `updated-asc`, `created-desc`,
  `created-asc`, `title-asc`.

Success:

```json
{
  "ok": true,
  "notes": [
    {
      "id": "...",
      "title": "Worldbuilding loose ends",
      "bodyPreview": "Need to decide how the bridge economy works...",
      "tags": ["worldbuilding", "later"],
      "pinned": true,
      "createdAt": "2026-06-15T10:00:00.000Z",
      "updatedAt": "2026-06-15T10:05:00.000Z"
    }
  ],
  "tags": ["later", "worldbuilding"]
}
```

The list route does not need to return full bodies. It may return them only if a
future implementation proves the UI needs it; defaulting to summaries reduces
unnecessary body movement and accidental logging surface.

#### `GET /api/notes/:id`

Return one full note by id.

Success:

```json
{ "ok": true, "note": { "id": "...", "title": "...", "body": "...", "tags": [], "pinned": false, "createdAt": "...", "updatedAt": "..." } }
```

If not found, return `404` with `kind: "not-found"`.

#### `POST /api/notes`

Create a note.

Body:

```json
{ "title": "Bridge economy", "body": "", "tags": ["worldbuilding"], "pinned": false }
```

Success: HTTP `201`, `{ "ok": true, "note": StoryNote }`.

Validation failure: HTTP `400`, `kind: "malformed-payload"`.

#### `PUT /api/notes/:id`

Replace the user-editable fields of an existing note.

Body:

```json
{ "title": "Bridge economy", "body": "Updated text", "tags": ["worldbuilding"], "pinned": true }
```

Success: HTTP `200`, `{ "ok": true, "note": StoryNote }`.

If not found: HTTP `404`, `kind: "not-found"`.

Use PUT rather than PATCH to mirror the existing route preference for explicit
validated replacement payloads.

#### `DELETE /api/notes/:id`

Hard delete a note.

Success:

```json
{ "ok": true }
```

If not found: HTTP `404`, `kind: "not-found"`.

No reference-integrity errors exist for Notes because Notes cannot reference
records and records cannot reference Notes.

### Loopback, logging, and secret safety

- No new network binding. Server remains loopback-only through the existing
  `LOOPBACK_HOST = "127.0.0.1"` posture.
- Notes add no OpenRouter traffic and no remote service call.
- Note title/body/tags must not be logged by default. Existing body redaction is
  already broad, but implementation must add note-specific log-redaction tests
  so future logging changes cannot leak note content.
- Route tests must use `fastify.inject()` like existing server route tests.

---

## Web UI

### Route and nav

Add a project-gated `/notes` route in `packages/web/src/shell/AppShell.tsx`:

- nav label: `Notes` or `Private Notes`;
- `requiresProject: true`;
- recommended nav placement: after `Records`, before `Active Working Set`.

The placement is intentional: Notes live beside story state but before the
explicit prompt-facing working-set/brief/preview/generate surfaces.

### Surface copy

The page header must make the boundary visible:

> Private Notes
>
> Per-story scratchpad for your own brainstorming, reminders, and worldbuilding.
> Notes are never records, working-set entries, brief fields, validation input,
> or prompt context.

A short boundary badge should appear near the editor/detail pane:

> Author-private · never sent to prompts

This is not cosmetic; it is part of the UI's FOUNDATIONS §27 distinct-surface
requirement.

### List → detail → editor pattern

Mirror the `RecordBrowser.tsx` list-detail-editor pattern, but use Notes-specific
components and CSS class names. Recommended files:

```text
packages/web/src/notes/NotesView.tsx
packages/web/src/notes/NoteEditor.tsx
packages/web/src/notes/NoteDetail.tsx
packages/web/src/notes/NotesView.test.tsx
packages/web/src/notes/NoteEditor.test.tsx
```

The surface contains:

- **Toolbar:** New Note, search input, tag filter, pinned filter, sort selector.
- **List:** title, body preview, tags, pinned marker, updated timestamp. Pinned
  notes sort first by default. Empty state says: "No private notes yet. Create
  one for brainstorming, reminders, or loose worldbuilding."
- **Detail pane:** title, tags, pinned status, created/updated timestamps,
  rendered Markdown preview, Edit and Delete buttons.
- **Editor:** title input, pinned checkbox, tag input, body textarea, Preview
  toggle, save status, delete action when editing an existing note.

Do not use record table columns, record badges, salience/urgency labels,
reference pickers, working-set toggles, compile-destination labels, readiness
status, or prompt-preview affordances.

### API client

Extend `packages/web/src/api.ts` with typed native-fetch helpers:

```ts
export async function listNotes(query?: NoteListQuery): Promise<ListNotesResponse>;
export async function getNote(id: string): Promise<GetNoteResponse>;
export async function createNote(input: StoryNoteCreateInput): Promise<SaveNoteResponse>;
export async function updateNote(id: string, input: StoryNoteUpdateInput): Promise<SaveNoteResponse>;
export async function deleteNote(id: string): Promise<DeleteNoteResponse>;
```

Follow the existing client convention in `packages/web/src/api.ts`: per-endpoint
exported helper functions (e.g. `createRecord`, `updateRecord`, `deleteRecord`)
built on the private `fetchJson` (GET) and `requestJson(url, method, body)`
transports. `requestJson` already implements PUT and DELETE, so no new transport
helper is needed; keep behavior consistent with existing API tests.

### Markdown preview

Preview rendering requirements:

- Body remains source of truth as raw text.
- Raw HTML is escaped or ignored.
- No remote embeds, link unfurling, oEmbed, images fetched by URL, or scriptable
  components.
- External links, if rendered as links, are only opened by explicit user click;
  no background prefetching.
- The preview is informational. It does not create a second saved body format.

### Autosave UX

For existing notes:

- Debounce saves after approximately 750–1200 ms of inactivity.
- Save on blur and before switching selected note if dirty.
- Show `Saving…`, `Saved`, or `Save failed — retry`.
- Disable destructive navigation only when a save is actively failing or still
  in flight; do not silently discard edits.

For new notes:

- The New Note flow may open a small title-first form or create a local draft.
- Do not POST until title validates.
- Once created, use the same autosave path as existing notes.

### CSS and state management

- Use plain global CSS in `packages/web/src/styles.css`.
- Recommended class prefix: `.notes-` or `.story-notes-`.
- Use React state/context patterns already present in the app. Do not add Redux,
  a query cache library, or a rich editor framework for V1.

---

## Isolation Guarantees & Tests

Isolation is the feature's most important property. Implementation is incomplete
unless tests make note non-leakage checkable.

### Static/domain guarantees

- No Note type appears in the `recordTypeRegistry` or `recordTypes` arrays,
  reference roles, generation-brief descriptors, compiler section inputs, or
  validation snapshot types.
- `StoryNotesRepository` is separate from `RecordRepository`.
- `story_notes` has no foreign key to `records` and no trigger that touches
  `record_references`.
- Notes routes are registered separately from record routes.
- `docs/compiler-contract.md` remains unchanged for Notes.

### Required core tests

1. **Core purity:** `packages/core/test/boundary.test.ts` still passes after
   adding story-note schemas.
2. **Schema tests:** valid/invalid StoryNote create/update/tag/title/body cases.
3. **Registry exclusion:** a test asserts no `NOTE`, `STORY_NOTE`, or
   equivalent key is present in `recordTypeRegistry`
   (`packages/core/src/records/registry.ts`) or the `recordTypes` arrays.
4. **Generation-brief exclusion:** a test asserts note-shaped data is not
   accepted by `GenerationSessionReady` or generation brief schemas.
5. **Compiler type exclusion:** compiler inputs remain `ValidationSnapshot` and
   compile request only; no story-note import exists under compiler source.

### Required server tests

1. **Route no-open-project:** every Notes route returns `409` with
   `kind: "no-open-project"` when no project is open.
2. **CRUD:** create, list, get, update, delete, not-found, malformed-payload,
   query validation, tag normalization, pinned sorting, and search behavior.
3. **Migration:** a schema-version-1 project opens, gains `story_notes`, bumps
   to schema version 2, and preserves existing records/story config/generation
   state unchanged.
4. **No record graph touch:** creating/updating/deleting notes leaves
   `record_references`, selected working set records, and record counts
   unchanged.
5. **Prompt/readiness non-leakage sentinel:** insert a note whose title and body
   contain a unique sentinel such as
   `NOTE_SENTINEL_DO_NOT_PROMPT_9f7e3c1b`. Then invoke:
   - readiness route;
   - prompt preview/compile route;
   - generate route request-building path using a mocked OpenRouter client;
   - ideation route request-building path.

   Assert the sentinel appears in none of:
   - validation snapshot JSON;
   - readiness diagnostics;
   - compiled prose prompt;
   - ideation prompt;
   - OpenRouter request body;
   - server logs.
6. **Redaction:** note title/body/tags in request bodies are not emitted in logs
   under success or validation failure.

### Required web tests

1. `/notes` is project-gated like other project surfaces.
2. The nav item appears only in the app shell route set and uses the project
   requirement.
3. Notes list/detail/editor CRUD works against mocked API responses.
4. Search/tag/pinned/sort controls call `listNotes` with the expected query.
5. Autosave status transitions are visible and failed save does not discard the
   local buffer.
6. The UI contains no record picker, no working-set toggle, no promote-to-record
   button, no include-in-prompt button, no brief insertion action, and no prompt
   preview action.
7. Markdown preview escapes or ignores raw HTML/script input.

### Manual verification scenario

1. Open a local project.
2. Create a note titled `NOTE_SENTINEL_DO_NOT_PROMPT_manual` with body containing
   the same sentinel.
3. Confirm the note appears in `/notes` and can be searched.
4. Open Readiness, Preview, Generate, and Ideate.
5. Confirm the sentinel appears nowhere outside `/notes`.
6. Delete the note.
7. Confirm existing records, working set, story config, prompt preview, and
   accepted segment archive are unchanged.

---

## Deliverables

This spec authorizes later ticket decomposition but does not create tickets.
Implementation deliverables are:

1. **FOUNDATIONS amendment landed first or same revision as feature behavior,**
   after explicit sign-off per §1.1.
2. **Core:** pure `StoryNote` schemas/types/helpers and tests; export through
   `@loom/core`; boundary test remains green.
3. **Server storage:** `story_notes` DDL, schema-version bump to 2, migration
   path for version-1 projects, repository, and migration tests.
4. **Server API:** project-scoped `/api/notes` routes with Zod request
   validation, discriminated errors, no-open-project behavior, redaction, and
   route tests.
5. **Web API client:** typed native-fetch helper functions and client tests.
6. **Web UI:** `/notes` route, app-shell nav item, list/detail/editor surface,
   Markdown preview, search/tags/pins/sort, autosave status, delete confirm,
   plain global CSS, and UI tests.
7. **Docs:** update `docs/user-guide.md` to explain Private Notes, the
   no-prompt/no-record-link boundary, and the local project lifecycle. Do not
   create a new active `docs/*.md` file unless the same change registers it in
   `docs/ACTIVE-DOCS.md`.
8. **Non-leakage regression:** sentinel tests proving Notes do not enter
   validation, prompt, ideation, OpenRouter request bodies, or logs.

---

## FOUNDATIONS Alignment & Required Amendment

### Verdict

A FOUNDATIONS amendment is required.

Reason: §6 currently describes "the five continuity surfaces" as a closed
surface taxonomy. Notes are intentionally a sixth project surface. They are not
continuity-bearing, but their existence still changes the app's surface model
and UI separation obligations. Implementing Notes without amending §6 would
silently rely on an unapproved exception.

Per §1.1, this amendment must be explicit, labeled, receive user sign-off before
implementation, and land in the same revision as the dependent behavior. This
spec supplies the amendment draft but does not itself implement it.

### Draft amendment text

#### Amend `docs/FOUNDATIONS.md` §2 — App identity

Add this paragraph at the end of §2, immediately after the loom/shuttle/cloth
mental-model blockquote that currently closes the section (which itself follows
the "It is not …" list and the structured-records paragraph):

```markdown
Continuity Loom may also provide author-private per-story notes as an inert
scratch surface. These notes are local project data owned by the user, but they
are not continuity authority, not story records, not generation-time fields, and
never compiler input. A note can influence generation only when the user manually
rewrites its substance into a prompt-facing record or generation-time field.
```

#### Replace `docs/FOUNDATIONS.md` §6 heading and opening

Replace the current §6 heading/opening that names five continuity surfaces with:

```markdown
## 6. The six project surfaces

Continuity Loom has six project surfaces. The first five are the only
continuity-facing surfaces: story records, active working set, generation-time
brief, generated prompt, and accepted prose segment archive. The sixth,
author-private story notes, is a local scratch surface and is never prompt-facing
or continuity-bearing.

The app must keep these surfaces visibly and mechanically distinct. No surface
may silently stand in for another.
```

Keep the existing first five surface definitions (`### 6.1`–`### 6.5`)
unchanged, then add the sixth as `### 6.6`:

```markdown
### 6.6 Author-private story notes

Author-private story notes are per-project local notes for the user's own
brainstorming, worldbuilding, reminders, todos, research fragments, and other
scratch material. Notes are not story records, not generation-time brief fields,
not active-working-set entries, not generated prompts, and not accepted prose.

Notes must never enter validation snapshots, readiness diagnostics, compiler
inputs, prose prompts, ideation prompts, assistance prompts, OpenRouter request
bodies, active-working-set membership, record reference graphs, or prompt
inspection surfaces. The app must not infer canon from notes, promote notes to
records, link notes to records, or use notes to satisfy readiness. A note affects
future generation only if the user manually authors equivalent content into a
prompt-facing record or generation-time field.
```

#### Amend `docs/FOUNDATIONS.md` §27 — UI principles

Replace the surface-separation bullet that currently names the five surfaces
(its live wording opens "clear distinction between **all records**, active
working set, …" — match that text when locating it; the replacement renames
"all records" to "story records") with:

```markdown
- clear distinction between story records, author-private story notes, active
  working set, generation-time brief, generated prompt, and accepted segment
  archive;
```

Add a new bullet under the same section:

```markdown
- author-private notes must be labeled and arranged so the user can tell they
  are inert scratch, not continuity authority and not prompt context;
```

#### Amend `docs/FOUNDATIONS.md` §29 — hard-fail checklist

Add a new self-contained hard-fail group at the end of §29 (after §29.11),
mirroring the new sixth surface (§6.6):

```markdown
### 29.12 Author-private notes hard fails

- Does the change allow author-private notes — their titles, bodies, tags,
  metadata, previews, summaries, or derived material — to influence validation,
  readiness, active working set, compiler input, any prompt, any OpenRouter
  request, prompt inspection, or assistance output? If yes, fail.
- Does the change treat a note as a story record, generation-time field, record
  reference target/source, active-working-set member, accepted prose source, or
  promote-to-record staging item? If yes, fail.
```

Also synchronize the existing §29.11 quality-check bullet so the checklist stops
asserting the pre-amendment surface count. Its live wording is:

```markdown
- Does it make the five continuity surfaces more distinct rather than more blurred?
```

Replace it with:

```markdown
- Does it make the project surfaces more distinct rather than more blurred,
  keeping author-private notes visibly separate from the five continuity surfaces?
```

This §29 update is required by FOUNDATIONS §1.1.4: an amendment that changes what
proposals must clear must update the §29 alignment checklist in the same
amendment. It also keeps the doc internally coherent — no orphaned "five
continuity surfaces" reference survives once §6 names six surfaces.

### ACTIVE-DOCS registry impact

This spec creates a new file under `specs/`, not under `docs/`, so it does not
by itself require an `ACTIVE-DOCS.md` registry entry. The implementation should
update existing registered docs (`docs/FOUNDATIONS.md` and `docs/user-guide.md`).
If implementers introduce any new active `docs/*.md` file such as
`docs/story-notes.md`, that same change must register it in `docs/ACTIVE-DOCS.md`.

### §29 pass for this design

- **No hidden prompt context:** pass. Notes are never compiler input and have no
  prompt placeholder.
- **No accepted-prose/prose-derived context:** pass. Notes are neither prose
  archive nor automatic summaries.
- **Records remain authority:** pass. Notes cannot satisfy record/readiness
  needs.
- **Active working set explicit and user-controlled:** pass. Notes cannot be
  working-set members.
- **Validation fails closed:** pass. Notes add no blockers/warnings and cannot
  make a project ready.
- **No autonomous planner/branches/plot rails:** pass. Notes are inert scratch.
- **No LLM mutation of records or notes:** pass. No AI summarize/extract/promote
  feature.
- **Local-first/user-owned:** pass. Notes live in local project SQLite.
- **Loopback/secret-safe:** pass. Notes add no remote traffic and must not log
  bodies by default.
- **UI surfaces distinct:** pass if the `/notes` copy, nav, class names, and
  controls stay distinct from Records/Working Set/Brief/Preview/Archive as
  required above.

---

## Verification

Implementation is ready only when all of the following pass:

- `npm test --workspace @loom/core` including boundary, schema, registry
  exclusion, and compiler/readiness exclusion tests.
- `npm test --workspace @loom/server` including migration, CRUD, route error,
  redaction, and prompt/readiness/ideation non-leakage sentinel tests.
- `npm test --workspace @loom/web` including route gating, API client, CRUD UI,
  autosave, Markdown preview, and no-cross-surface-action tests.
- `npm run typecheck` or the repository's existing workspace typecheck command.
- Existing compiler golden tests remain unchanged except for unrelated metadata
  noise. No golden prompt should gain a Notes section or empty state.
- Manual verification scenario in the Isolation section passes.

No implementation ticket may close by only proving the Notes CRUD path. At least
one prompt/readiness non-leakage sentinel test must be present before the
feature is considered complete.

---

## Out of Scope

The following are explicitly out of scope for SPEC-023:

- tickets or ticket decomposition;
- any code emitted by this spec;
- global/user-level notes;
- cross-project notes;
- cloud sync or remote note services;
- account sharing, collaboration, permissions, or publishing;
- record links, backlinks, note-to-record references, record-to-note references,
  record-tag autocomplete, graph views, or referential-integrity participation;
- promote note to record, extract record from note, add note to working set,
  insert note into brief, include note in prompt, or use note as ideation input;
- compiler-contract changes, prompt-template placeholders, prompt-preview Notes
  section, readiness rules, validation blockers/warnings, or generation-time
  brief fields;
- LLM summarization, semantic search, embeddings, AI todo extraction, AI
  cleanup, AI tagging, or AI mutation of notes;
- FTS5 virtual table and ranking migration;
- folders, nested notebooks, daily notes, manual ordering, trash/soft-delete,
  attachments, image uploads, remote embeds, and rich-text/WYSIWYG editor.

---

## Risks & Open Questions

### Risk: a useful scratchpad becomes shadow canon

Mitigation: persistent UI copy, no prompt actions, no record links, no
readiness participation, and sentinel tests. The surface can be useful only if
it stays inert.

### Risk: Markdown preview becomes an XSS surface

Mitigation: raw HTML escaped/ignored, no remote embeds, no preview-time fetches,
and web tests with script/HTML input. If future implementation changes renderer
behavior, sanitizer use and tests are mandatory.

### Risk: autosave conflicts with explicit-save patterns elsewhere

Mitigation: Notes are a document-like scratch surface, not a structured record
form. The UI must show clear save state and retry. Records may keep explicit
save; Notes can autosave because they have no validation/readiness consequences.

### Risk: schema-version migration order is currently too rigid

Mitigation: SPEC-023 includes the migration-order change as required scope:
known v1→v2 migration must run before rejecting a v1 project as incompatible.
No legacy aliasing or duplicate schema path is introduced.

### Risk: simple search may eventually be too weak

Mitigation: V1 deliberately keeps search simple. If real projects accumulate
large note corpora, a future spec can add SQLite FTS5 with a measured migration
and ranking design. Do not add FTS5 opportunistically in this feature.

### Open question for ticket decomposition only

The ticket phase should decide exact component split and debounce interval, but
must not reopen the locked product boundaries: per-story only, permanent
scratchpad, never prompt context, no record links, and no promote-to-record.

---

## External References

[^scrivener-overview]: Literature & Latte, "Scrivener Overview," https://www.literatureandlatte.com/scrivener/overview (accessed 2026-06-15).
[^obsidian-storage]: Obsidian Help, "How Obsidian stores data," https://obsidian.md/help/data-storage (accessed 2026-06-15).
[^obsidian-search]: Obsidian Help, "Search," https://obsidian.md/help/plugins/search (accessed 2026-06-15).
[^logseq-github]: Logseq GitHub README, "logseq/logseq," https://github.com/logseq/logseq (accessed 2026-06-15).
[^worldanvil-notebook]: World Anvil, "Feature Guide to the Notebook," https://www.worldanvil.com/learn/notebook/notebook (accessed 2026-06-15).
[^worldanvil-features]: World Anvil Blog, "World Anvil New Features!" https://blog.worldanvil.com/worldanvil/dev-news/world-anvil-new-features-2025/ (accessed 2026-06-15).
[^notion-properties]: Notion Help Center, "Database properties," https://www.notion.com/help/database-properties (accessed 2026-06-15).
[^notion-views]: Notion Help Center, "Views, filters, sorts & groups," https://www.notion.com/help/views-filters-and-sorts (accessed 2026-06-15).
[^notion-databases]: Notion Help Center, "Intro to databases," https://www.notion.com/help/intro-to-databases (accessed 2026-06-15).
[^campfire-write]: Campfire, "Write Better Stories, Draft Faster, and Stay Inspired," https://www.campfirewriting.com/write (accessed 2026-06-15).
[^campfire-mobile]: Google Play listing, "Campfire — Write Your Book," https://play.google.com/store/apps/details?id=com.campfiremobile (accessed 2026-06-15).
[^ellipsus-home]: Ellipsus, "Collaborative writing software," https://ellipsus.com/ (accessed 2026-06-15).
[^ellipsus-features]: Ellipsus, "Features," https://ellipsus.com/features (accessed 2026-06-15).
[^bibisco-home]: bibisco, "Novel Writing Software for Authors," https://bibisco.com/ (accessed 2026-06-15).
[^lush-pim]: A. Lush, "Fundamental personal information management activities — organising, finding and keeping," Australian Academic & Research Libraries, 2014, https://www.tandfonline.com/doi/full/10.1080/00049670.2013.875452 (accessed 2026-06-15).
[^civan-tags-folders]: A. Civan et al., "Better to organize personal information by folders or by tags?" ASIS&T Annual Meeting, 2008, https://asistdl.onlinelibrary.wiley.com/doi/10.1002/meet.2008.1450450214 (accessed 2026-06-15).
[^ink-switch-local-first]: Ink & Switch, "Local-first software: You own your data, in spite of the cloud," https://www.inkandswitch.com/essay/local-first/ (accessed 2026-06-15).
[^commonmark]: CommonMark, "A strongly defined, highly compatible specification of Markdown," https://commonmark.org/ (accessed 2026-06-15).
[^react-markdown]: remarkjs, "react-markdown," https://github.com/remarkjs/react-markdown (accessed 2026-06-15).
[^dompurify]: Cure53, "DOMPurify," https://github.com/cure53/DOMPurify (accessed 2026-06-15).
[^sqlite-fts5]: SQLite, "SQLite FTS5 Extension," https://sqlite.org/fts5.html (accessed 2026-06-15).
