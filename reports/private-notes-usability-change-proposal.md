# Private Notes Usability Change Proposal

**Document type:** research-backed change-proposal precursor  
**Hand-off artifact:** `private-notes-usability-change-proposal.md`  
**Target repository:** `joeloverbeck/continuity-loom`  
**Target commit:** `90d17f8b2e868b90b2f536316e06438e994098cf`  
**Baseline:** the shipped Private Notes feature implemented from archived SPEC-023  
**Freshness limitation:** this proposal analyzes the user-supplied target commit only. It does not independently establish that the commit is the current `main`.  
**Downstream context:** the coding agent may convert this document into a draft such as `specs/SPEC-029-private-notes-usability.md`; this document neither claims that number nor acts as the spec.

> Repository claims in this document use only manifest-listed files fetched from full, exact-commit URLs. References to other repositories inside those files are treated as ordinary file content. External research is cited separately and is never used to assert what exists in Continuity Loom.

## Executive decision

Continuity Loom should keep the existing loose, flat capture model, but add a **Scene Prep workspace inside the author-private Notes surface**. The workspace should combine:

1. **ranked, entirely local full-text and substring search** backed by SQLite FTS5;
2. a persistent **Scene Prep Sheet**, which is still only a private note;
3. a reorderable **source tray** that can capture either a whole note or an exact Markdown-source selection from a note;
4. a three-pane find/read/compose layout, with explicit non-drag controls and safe search highlighting;
5. manual, permanent batch deletion for consumed notes, with no archive, automatic consumption detection, or scene/record association.

The source tray should store **copy-on-collect snapshots**, not live transclusions. Each snapshot may retain a narrow, nullable pointer to its source note solely to reopen it and report “edited since capture” or “source deleted.” It is not a general note graph, is never a record reference, and disappears with its owning prep sheet. Deleting a source note leaves an explicitly collected snapshot intact, just as manual copy/paste would; the deletion confirmation must say so.

This is a deliberately bounded structural change. It solves the owner’s actual bottleneck—finding material, collecting fragments, seeing the selected whole, and composing one working note—without turning Loom into a general PKM system, outliner, planner, or graph editor.

The storage change warrants **`LOOM_SCHEMA_VERSION = 3`**. Existing v2 notes migrate intact and acquire only `mode: "scratch"`; no title, body, tag, pin, identity, or timestamp changes. A local FTS index and a new clip table are additive and rebuildable. The compiler/template/contract version constants remain untouched.

No amendment to FOUNDATIONS §6.6, §27, or §29.12 is needed. The proposal stays wholly inside the already admitted sixth, author-private surface, preserves its distinct labeling, and treats every new index, snippet, source-status value, clip, and copied fragment as material covered by the existing hard wall.

---

## 1. Problem and goals

### 1.1 This is a delta on shipped behavior

The starting point is not a blank notes feature. At the target commit, Loom already has per-project SQLite-backed private notes with UUIDv7 identity, Markdown bodies, normalized tags, pinning, timestamps, search/filter/sort controls, safe preview, approximately 900 ms autosave, and confirmed permanent deletion. The React surface is project-gated at `/notes`; the server exposes project-scoped CRUD; core owns pure Zod/domain definitions; and firewall tests prove that notes do not enter continuity, validation, prompt, OpenRouter, inspection, or record-reference paths. [R3] [R8] [R11] [R12] [R14] [R15] [R18] [R19]

Those capabilities are the floor. This proposal does not present tags, pinning, autosave, safe Markdown, hard delete, or the author-private badge as new ideas. It changes the workflow above that floor.

### 1.2 The actual burden

The owner’s scene-preparation ritual currently has four stages:

- **Find:** scan a large, flat note set and rediscover material relevant to the next scene.
- **Assemble:** copy whole notes and fragments from several notes into one new working note.
- **Orient:** keep both the source context and the emerging scene-prep whole visible while deciding what belongs.
- **Retire:** after the prose has actually been written, manually remove consumed fragments or permanently delete consumed notes so they stop polluting future search.

The dominant cost is not confirmation of deletion. It is repeatedly finding a note, opening it, locating a useful fragment, copying it, switching back to the working note, pasting it, and reconstructing the big picture after every context switch.

### 1.3 Mixed granularity is fundamental

A one-note-per-scene assumption would be wrong. Some notes are consumed whole; others contain material for several scenes, and only a paragraph, sentence, list item, or arbitrary selection is relevant now. The redesign therefore needs both:

- whole-note collection; and
- exact fragment collection without forcing the source note to be split first.

A full block identity system is one possible answer to fragments, but it is not the proportionate answer here. The proposed snapshot clip gives fragments temporary, scene-prep-local identity while preserving the existing Markdown note model.

### 1.4 Consumed material remains a manual judgment

“Consumed” means the author judges that the material has been rendered into written prose. Loom must not infer this from accepted segments, records, current scene, generation state, or textual similarity. There is no note-to-scene link, note-to-record link, accepted-prose link, or automatic retirement.

The normal lifecycle remains intentionally destructive:

1. capture scratch material;
2. collect relevant whole notes or fragments into a prep sheet;
3. write the scene outside the note model’s authority;
4. manually edit or permanently delete source notes when their material is truly consumed;
5. permanently delete the prep sheet when it no longer has value.

“Permanent” here means no Loom archive, trash, recovery queue, or soft-delete row. It is not a promise of forensic secure erasure from SQLite pages or storage media.

### 1.5 Goals

The redesign is successful when it:

- cuts the number of list/detail/editor context switches needed to prepare a scene;
- makes relevant passages visible through ranked local search and meaningful snippets;
- lets the author collect ten whole notes or ten fragments without ten manual copy/paste round trips;
- keeps source context, selected material, and the editable prep note visible together;
- preserves loose capture and avoids requiring an organizational migration before the feature is useful;
- makes deletion of genuinely consumed material fast, explicit, and final;
- preserves every existing note through migration;
- creates no route by which note content or note-derived material can influence continuity or leave the machine.

### 1.6 Non-goals

This change does not make notes canonical, generated, validated, record-like, scene-linked, globally shared, cloud-synced, or model-assisted. It does not introduce plot rails, beats, acts, planning automation, or a second continuity authority.

---

## 2. Repository baseline at the target commit

### 2.1 Authority and boundaries

`docs/principles/FOUNDATIONS.md` is the constitutional authority, and `docs/ACTIVE-DOCS.md` defines the active-document hierarchy and archive boundary. [R1] [R2] The load-bearing rules for this change are:

- notes are the sixth, author-private surface, not one of the five continuity surfaces;
- neither notes nor anything derived from notes may enter validation snapshots, readiness, compiler inputs, any prose/ideation/assistance prompt, OpenRouter bodies, the Active Working Set, record references, or prompt inspection;
- the application may not infer canon from notes, promote them to records, or link them to records;
- the UI must make their inert scratch status obvious;
- local ownership and loopback-only operation remain intact.

`docs/specs/story-record-schema.md` confirms that notes are not a record type or generation-time field, while `docs/specs/compiler-contract.md` gives the negative boundary: there is no note placeholder, section, empty state, or compiler input to extend. [R5] [R7]

### 2.2 Current domain and persistence

SPEC-023 deliberately kept the first release small: it excluded folders, arbitrary manual ordering, general note links, block references, soft deletion, and FTS5 until the simple search proved inadequate. The predecessor brief locked the isolation boundary rather than those upper-layer usability choices. The present, observed find → assemble → orient burden is the evidence needed to revisit search and composition without reopening the constitutional settlement. [R3] [R4]

The current pure core model is a flat `StoryNote` with:

- `id`;
- `title`;
- `body`;
- `tags`;
- `pinned`;
- `createdAt`;
- `updatedAt`.

The Zod schemas enforce the title/body/tag limits and tag normalization, and UUIDv7 creation remains platform-neutral through `globalThis.crypto`. [R8] The current schema version is 2. [R9]

The server stores notes in `story_notes`, with JSON tags, an integer pin flag, timestamps, and indexes supporting existing sorts. [R10] The repository currently loads rows, validates them at the persistence boundary, derives previews, and performs case-folded substring matching and ranking in application memory. [R11] That was a sound v1 implementation, but it makes the server read complete note bodies for a list search and gives the UI only one transient result list.

### 2.3 Current API and UI

The notes API follows Loom’s established Fastify pattern: project-scoped routes, Zod request validation, discriminated `{ ok, kind, message }` failures, `409 no-open-project`, and hard delete. [R12] The native-fetch web client mirrors those responses. [R17]

The web surface is a list → detail → editor flow. `NotesView.tsx` owns query/filter/sort state; `NoteEditor.tsx` owns autosave and safe preview; `/notes` is registered in the project-gated shell. [R14] [R15] [R16] This works well for one-note-at-a-time reading and editing. It is exactly the wrong interaction geometry for extracting material from many notes into one note, because the author must repeatedly replace the thing being read with the thing being composed.

### 2.4 Current isolation proof

The repository already contains three complementary proofs:

- core note schema and domain tests;
- a compiler-context firewall test;
- server-level isolation tests that place sentinel note content in the database and exercise readiness, validation, generation, ideation, OpenRouter request creation, logs, references, and working-set behavior. [R18] [R19] [R20]

The proposed feature extends those proofs. It does not weaken or reinterpret them.

---

## 3. Research grounding and design rationale

### 3.1 The workflow is a sensemaking loop, not merely a search problem

Pirolli and Card’s sensemaking model distinguishes raw external material, a smaller “shoebox” of relevant items, an “evidence file” of extracted snippets, a schema, and a final product. Their foraging loop includes searching, filtering, reading, and extracting; the sensemaking loop repeatedly reorganizes selected evidence into a useful representation. [E1] The owner’s current ritual maps almost literally:

- all private notes are the raw source;
- search results are the shoebox;
- collected fragments and whole notes are the evidence file;
- the prep note is the emerging representation;
- the written scene is the eventual product.

This matters because making search faster addresses only the first transition. Russell, Stefik, Pirolli, and Card argue that information retrieval is embedded in a larger task and that changing the external representation can reduce the cost of later operations. [E2] A faster flat list would still leave extraction, comparison, sequencing, and synthesis expensive. The design therefore adds both a better retrieval mechanism and a persistent intermediate representation: the source tray beside the prep sheet.

### 3.2 Writer tools repeatedly pair organization with side-by-side composition

Writer-focused tools converge on a few useful patterns:

- Scrivener’s Collections provide an alternate, task-specific view of Binder material without requiring the primary Binder hierarchy to be rebuilt. Its split editors and Copyholders keep reference documents visible beside the document being written. [E3] [E4]
- Ulysses lets separately managed sheets behave as one coherent editing view, supports split viewing, and distinguishes material sheets from output-bearing text. [E5] [E6]
- Notion demonstrates the value of alternate filtered views and side-peek editing, but its database/view machinery is much broader than Loom needs. [E7]

The transferable principle is not “copy Scrivener’s Binder” or “add a Notion database.” It is: **preserve loose source organization, create a task-specific collection, and let the author see source and composition simultaneously.**

### 3.3 Networked notes and outliners solve a different, larger problem

Obsidian, Bear, and Logseq show the power of internal links, backlinks, embeds, blocks, and nested tags. [E8] [E9] [E10] Logseq, in particular, makes the block the smallest unit, supports live embeds/references, and uses a sidebar to compare snippets from across a graph. Those affordances can be excellent for long-lived knowledge networks.

They also imply durable block identity, reference semantics, rename behavior, deletion behavior, backlink indexes, recursive embedding rules, and user expectations that editing one place may update another. Replacing Loom’s 200,000-character Markdown note body with a block graph would be a storage/editor migration, not a usability refinement. General wiki links and backlinks would improve navigation, but they would not directly eliminate the repeated extraction-and-assembly loop.

The proposal therefore borrows only the bounded interaction lesson—bring selected snippets into a side area—and rejects the general graph model.

### 3.4 Loose capture should not be taxed by premature structure

Folders, nested tags, and saved database views can improve refinding when the categories are stable. They also ask the author to decide where material belongs before the next scene’s needs are known. The research on personal information management treats keeping, organizing, and finding as related but distinct activities, and comparative folder/tag work documents different advantages rather than one universally superior model. [E11] [E12]

Here, the source corpus is intentionally temporary and shrinks as the novel is written. The proposal should not force the author to maintain a lasting ontology for material whose value is episodic. Existing flat tags remain useful. Multi-tag filtering is a small extension. A scene-specific prep sheet is the meaningful saved view: it preserves exactly what mattered for that scene, including fragments, without creating another library of filter definitions.

### 3.5 Local FTS5 is the proportional search engine

SQLite FTS5 supplies ranked full-text search, `bm25()`, snippets/highlights, and a trigram tokenizer that supports general substring matching. [E13] Continuity Loom already requires Node 24 or newer and uses Node’s built-in SQLite binding; the repository engine declaration and the Node 24.0.0 SQLite build configuration establish that the supported runtime has `SQLITE_ENABLE_FTS5`. [R13] [R26] [E14] This makes FTS5 an on-device extension of the existing storage engine, not a new service or dependency.

FTS5 is preferable to the current load-every-body approach because it:

- narrows candidates in SQLite;
- ranks matches;
- can return contextual excerpts;
- updates transactionally with note writes;
- remains fully local and rebuildable from authoritative note rows.

It is preferable to local embeddings in this pass because the known task is lexical refinding, the corpus is bounded, and embeddings would add model/runtime distribution, versioning, storage, and a much larger isolation surface. Trigram FTS is not semantic search and is not true typo-tolerant edit-distance search; the proposal does not claim otherwise. It adds ranked word/phrase/substring retrieval, with a small-query fallback for one- and two-character searches.

### 3.6 Local-first implications

The local-first literature emphasizes user ownership, offline operation, privacy, longevity, and control. [E15] In Loom, those principles already take a stricter product form: a local SQLite story store, a loopback server, and no account. The redesign honors that by keeping search, snippets, clips, and composition inside the same story store and by adding no model call, telemetry path, cloud index, remote sync, or body logging.

### 3.7 Decision matrix

| Candidate | Decision | Rationale |
|---|---|---|
| SQLite FTS5 with trigram tokenization, ranking, and snippets | **Adopt** | Directly reduces find cost; local; supported by the current runtime; rebuildable. |
| Three-pane find/read/compose workspace | **Adopt** | Removes the repeated source/prep context switch; follows strong writer-tool precedents. |
| Persistent Scene Prep Sheet | **Adopt** | Gives the author one editable working note and a durable task-specific overview. It remains an ordinary private note. |
| Whole-note and exact-selection snapshot clips | **Adopt** | Solves mixed granularity without migrating all notes to blocks. |
| Narrow clip→source-note pointer | **Adopt, tightly scoped** | Enables reopen/change/deletion status. It is nullable, tray-local, and not a general backlink graph. |
| Multi-select whole-note collection | **Adopt** | Removes repetitive collection clicks and copy/paste. |
| Multi-tag filtering with AND semantics | **Adopt** | Uses the existing tag model to narrow large result sets without adding hierarchy. |
| Reorder by drag | **Adopt only as enhancement** | Useful for spatial manipulation, but keyboard/button controls remain canonical and accessible. |
| Batch permanent deletion | **Adopt** | Makes manual retirement efficient while preserving explicit confirmation and no recovery layer. |
| General folders or nested note hierarchy | **Exclude** | Adds up-front classification, does not solve fragments, and duplicates a long-lived library structure for a shrinking corpus. |
| Hierarchical tags | **Exclude** | Adds ontology maintenance without improving extraction or composition enough. |
| Saved searches / generic saved views | **Exclude** | A prep sheet is the useful scene-specific saved collection and can contain fragments; generic views cannot. |
| General `[[wikilinks]]`, backlinks, or note graph | **Exclude** | Improves navigation more than assembly and introduces graph maintenance beyond the target workflow. |
| Live transclusion or editable embeds | **Exclude** | Source edits/deletion could silently change a prep artifact; dependency semantics conflict with deliberate hard deletion. |
| Full block/outliner data model | **Exclude** | Requires block IDs, hierarchy, editor replacement, and high-risk migration of every body. The problem does not justify that reach. |
| Canvas / freeform spatial board | **Exclude** | Large scope, weak fit for producing one linear prep note, and poor parity with the existing plain-CSS/editor architecture. |
| Destructive split/merge as a prerequisite | **Exclude** | Selection clips solve fragment collection without forcing source restructuring. Existing notes remain intact. |
| Automatic “move selection” that cuts source text | **Exclude** | Collection and consumption happen at different times; cutting early risks silent loss. |
| Archive, trash, or soft delete | **Exclude** | Contradicts the settled consumed-note lifecycle. |
| Local semantic embeddings | **Exclude** | Extra runtime, index lifecycle, privacy/isolation proof, and little evidence that lexical FTS is insufficient. |
| Any LLM-over-notes helper | **Exclude** | Adds a new network/model surface, conflicts with the locked default, and is unnecessary for the identified burden. |

---

## 4. Recommended changes

### 4.1 Finding: ranked local search with useful context

Replace application-memory full-body filtering with a repository query that uses a local `story_notes_fts` virtual table when `q` is present.

The search behavior should be:

- title, tags, and body are all indexed;
- title matches carry the highest `bm25()` weight, tags the next highest, body the baseline;
- each whitespace-delimited user term is escaped and passed as a literal FTS phrase, so FTS operators are never accepted accidentally;
- queries whose terms are all at least three Unicode code points use trigram FTS;
- if a query mixes long and one/two-character terms, FTS narrows on the long terms and parameterized `instr()` predicates enforce the short terms;
- queries containing only one/two-character terms use a bounded, parameterized `instr()`/`LIKE` fallback;
- the existing five explicit non-relevance sorts remain available;
- a new `relevance` sort is the default only while a non-empty query is active;
- an empty query retains the current default sort rather than inventing a meaningless rank;
- exact tag facets use the normalized values in `tags_json`, not substring matches;
- repeated `tag` parameters apply AND semantics;
- a `mode` filter distinguishes scratch notes from prep sheets when desired;
- result metadata includes total count, escaped title highlighting, a short body-source snippet, and matched tags.

The server should return plain strings plus inert start/end marker tokens for highlights. React should split those strings into text and `<mark>` nodes. It should never render database-provided HTML or use `dangerouslySetInnerHTML`.

Search snippets are direct excerpts, not summaries. Rank, highlight ranges, snippets, and matched-field metadata are all author-private derived material and are covered by the same firewall as note bodies.

### 4.2 Assembling: a Scene Prep Sheet and source tray

A **Scene Prep Sheet** is a `StoryNote` whose new `mode` is `scene-prep`. It keeps the existing title, Markdown body, tags, pin, timestamps, autosave, preview, and hard-delete behavior. It has no scene ID, segment ID, record ID, generation-session ID, or prose link.

Each prep sheet owns an ordered source tray of `StoryNoteClip` rows. A clip is created in one of two ways:

- **Whole note:** the server snapshots the source note’s full Markdown body.
- **Excerpt:** the user selects an exact range in the source-Markdown view; the server verifies the selected text against the current body and snapshots it.

For either kind, the server—not the client—takes the source title and current source timestamp. This prevents stale or forged “source” metadata inside the local API contract and gives deterministic conflict handling.

Collection affordances:

- “Collect note” on one result;
- checkboxes plus “Collect selected notes” for many whole notes;
- “Collect selection” when the source Markdown view has a non-empty selection;
- keyboard-accessible move-up/move-down controls on every clip;
- optional pointer drag-and-drop using the same reorder operation;
- “Insert at cursor” and “Append to prep” actions that place clip text into the prep body through the existing editor save path;
- remove-from-tray, which does not modify the source note or prep body;
- open-source, when the source still exists.

The snapshot is intentionally independent after capture. There is no live refresh and no recursive embedding. If the source changes, the UI says “Source edited since capture.” If it is deleted, the UI says “Source deleted; captured text preserved.” The user may remove and recollect if a newer snapshot is wanted.

The narrow `sourceNoteId` exists only for those two operations. It is not exposed to record-reference utilities, not parsed from note Markdown, not included in backlinks, and not traversed outside Notes.

### 4.3 Orienting: keep source, selection, and synthesis visible

The desktop `/notes` layout should become three coordinated regions:

1. **Find pane:** query, filters, result count, multi-select, and result cards.
2. **Source pane:** the selected note’s safe preview or exact Markdown-source view, tags/timestamps, edit action, and collect actions.
3. **Prep pane:** active prep-sheet selector, editable body, save state, source tray, source-status badges, and ordering/insertion controls.

This is one Notes surface, not three routes and not another top-level product surface. The sidebar retains one `Notes` item. The constitutional boundary label appears both at the view header and inside the prep pane:

> **Author-private · never sent to prompts**

A second explanatory line should be explicit:

> Scratch notes and prep sheets do not affect continuity, readiness, generation, or accepted prose.

Orientation details that materially reduce cognitive load:

- the active prep sheet stays pinned open while search/source selection changes;
- result cards show whether and how many times the source appears in the active tray;
- the tray shows source title, capture kind, capture time, and changed/deleted status;
- the result header shows counts for matches, selected results, and collected clips;
- the author can collapse the source tray to focus on prose, then reopen it without losing context;
- no continuity-surface colors, record icons, “working set” terminology, readiness states, or canon language are reused.

On narrower windows, the find pane and prep pane become drawers/tabs around a single main pane. The action model stays the same; drag is never the only way to collect or reorder.

### 4.4 Retiring consumed material

The existing single-note hard delete remains. Add selection mode and an atomic batch-delete route for manual cleanup.

The confirmation dialog should distinguish the two important deletion cases:

- **Deleting source notes:** removes those note rows and their search-index entries permanently from Loom’s active data. Any copies already inserted into another note body or deliberately captured in a prep tray remain. The dialog states that plainly.
- **Deleting a prep sheet:** removes the prep note and cascades deletion of its tray clips. Source notes are untouched.

The dialog lists the first several titles, the total count, and “This cannot be undone.” There is no delayed queue, archive, undo snackbar, or recycle bin.

Fragment-level retirement stays intentionally simple: open the source note and edit out the consumed fragment after the scene has been written. Loom does not attempt text-offset tracking, automatically remove a captured fragment, or infer that insertion into a prep body means consumption.

### 4.5 Preserve the strengths of the existing editor

The current safe Markdown renderer, title/body/tag constraints, pinning, and autosave remain. The prep editor reuses the same component contract rather than introducing a second editor engine.

The autosave changes are coordination changes, not a new persistence model:

- each visible editor instance is keyed by note ID;
- pending saves flush before changing the source note or active prep sheet;
- inserting clip text updates the prep editor’s local value and triggers an immediate save attempt;
- a failed save leaves the text in the editor and displays an explicit error;
- removing a clip never occurs as a side effect of insertion, so a save failure cannot destroy the collected source.

---

## 5. Data model

### 5.1 Core types in `@loom/core`

The pure domain module `packages/core/src/story-notes.ts` should evolve without importing SQLite, Fastify, React, Vite, or `node:*`.

#### `StoryNote`

Add:

| Field | Type | Rule |
|---|---|---|
| `mode` | `"scratch" \| "scene-prep"` | Defaults to `"scratch"` on create and migration. Returned on every read. |

All existing fields and limits remain unchanged.

`StoryNoteCreateInput` accepts optional `mode`, defaulting to `scratch`. `StoryNoteUpdateInput` may accept optional `mode`; omission preserves the current value. Converting scratch → scene-prep is allowed. Converting scene-prep → scratch is allowed only when its tray is empty, otherwise the server returns a conflict. This lets an existing working note become a prep sheet without copying its body and prevents clips from becoming ownerless.

#### `StoryNoteClip`

| Field | Type | Rule |
|---|---|---|
| `id` | UUIDv7 string | Generated server-side through the existing pure UUID utility. |
| `prepNoteId` | UUIDv7 string | Owning note; repository verifies `mode === "scene-prep"`. |
| `sourceNoteId` | UUIDv7 string or `null` | Nullable after source hard deletion. Never a record ID. |
| `captureKind` | `"whole-note" \| "excerpt"` | Fixed after creation. |
| `sourceTitleSnapshot` | string | Same 160-character ceiling as titles. |
| `content` | string | Exact Markdown snapshot; maximum 200,000 characters. |
| `sourceUpdatedAtAtCapture` | ISO timestamp | Used only for “edited since capture.” |
| `position` | non-negative integer | Ordered within one prep sheet. |
| `createdAt` | ISO timestamp | Set at capture. |
| `updatedAt` | ISO timestamp | Changes on reorder or other explicit clip mutation. |

Clip content is immutable after capture. The user edits the prep body, not the evidence snapshot. Replacing a stale clip is an explicit remove-and-recollect operation.

#### Input schemas

Add strict Zod unions for:

- whole-note capture: `sourceNoteId`;
- excerpt capture: `sourceNoteId`, `selectedText`, `sourceUpdatedAt`;
- batch capture: one to 100 capture items;
- complete tray reorder: a deduplicated array of clip IDs;
- batch note deletion: one to 100 note IDs.

Storage validation remains separate from generation/readiness validation. These schemas are never added to the record registry, validation snapshot, compiler types, or generation brief.

### 5.2 SQLite changes

#### `story_notes`

Add:

- `note_mode TEXT NOT NULL DEFAULT 'scratch' CHECK (note_mode IN ('scratch', 'scene-prep'))`

Retain all current columns and indexes.

#### `story_note_clips`

Add a table beside `story_notes`:

| Column | Storage |
|---|---|
| `id` | `TEXT PRIMARY KEY` |
| `prep_note_id` | `TEXT NOT NULL REFERENCES story_notes(id) ON DELETE CASCADE` |
| `source_note_id` | `TEXT REFERENCES story_notes(id) ON DELETE SET NULL` |
| `capture_kind` | checked text enum |
| `source_title_snapshot` | `TEXT NOT NULL` |
| `content` | `TEXT NOT NULL` |
| `source_updated_at_at_capture` | `TEXT NOT NULL` |
| `position` | non-negative integer |
| `created_at` | `TEXT NOT NULL` |
| `updated_at` | `TEXT NOT NULL` |

Add indexes on:

- `(prep_note_id, position, created_at)`;
- `(source_note_id)`.

Do not make `(prep_note_id, position)` unique; a reorder can resequence positions in one transaction without temporary uniqueness collisions. Repository reads use `position`, then `created_at`, then `id` as deterministic tie-breakers.

The database cannot express “prep_note_id points to a scene-prep-mode note” as a simple foreign key. The repository validates that invariant on every clip operation, and route/repository tests prove it.

#### `story_notes_fts`

Create a normal FTS5 table:

- `note_id UNINDEXED`;
- `title`;
- `tags`;
- `body`;
- `tokenize = 'trigram'`.

This table is derived, not authoritative. Insert/update/delete triggers on `story_notes` keep it synchronized. A normal FTS table with an unindexed text note ID avoids coupling the index to the base table’s mutable implicit `rowid`.

The FTS row stores the existing JSON tag string in its `tags` search column; exact tag filters still use parsed normalized tags from the authoritative row. The index can be deleted and rebuilt entirely from `story_notes`.

### 5.3 Derived read models

The repository may return Notes-only read fields:

- `relevance`;
- `titleHighlight`;
- `bodySnippet`;
- `matchedTags`;
- clip `sourceStatus: "current" | "edited" | "deleted"`.

These are not added to `StoryNote` itself. They belong to explicit list/clip response types, remain under Notes routes, and are treated as note-derived material in isolation tests.

### 5.4 Invariants

- A clip owner is always a scene-prep note.
- A clip source, while present, is always another `story_notes` row; it may itself be scratch or prep.
- `prepNoteId` and `sourceNoteId` may not be equal at capture time.
- A source pointer never accepts a record ID.
- Deleting a prep sheet cascades only its clips.
- Deleting a source nulls the pointer and retains the snapshot.
- No clip, mode, FTS row, snippet, match rank, or source status is available through record, validation, readiness, compile, generate, ideate, hygiene, accepted-segment, working-set, or prompt-inspection repositories.

---

## 6. Migration and compatibility

### 6.1 Version

Set:

- `LOOM_SCHEMA_VERSION = 3`

Do not change template, compiler, prompt-contract, or snapshot version constants in `packages/core/src/version.ts`. [R23]

### 6.2 Migration shape

Refactor open-time migration into an ordered step runner rather than a single special case:

- v1 → v2: retain the existing migration that adds `story_notes`;
- v2 → v3: add note mode, clips, and local search;
- a v1 store therefore runs v1 → v2 → v3 in order;
- a v2 store runs only v2 → v3;
- a v3 store runs no migration.

This follows the existing `PRAGMA user_version`, `evaluateStoreCompatibility`, `BEGIN IMMEDIATE`, rollback, and metadata-update contract in `project-store.ts`. [R9] [R13] [R22]

### 6.3 Concrete v2 → v3 transaction

Before changing the store, verify that the active SQLite runtime has FTS5 enabled. The supported Node 24 runtime does, but an explicit preflight gives an actionable migration failure instead of creating a half-featured schema. [E14]

Then, inside `BEGIN IMMEDIATE`:

1. Inspect `PRAGMA table_info(story_notes)`.
2. If absent, add `note_mode` with `NOT NULL DEFAULT 'scratch'` and its enum check.
3. Create `story_note_clips` and its indexes with `IF NOT EXISTS`.
4. Create `story_notes_fts` with `IF NOT EXISTS`.
5. Create the three synchronization triggers with `IF NOT EXISTS`.
6. Clear and repopulate the FTS table from every `story_notes` row.
7. Verify that every note has a corresponding FTS row and that every `note_mode` is valid.
8. Set `PRAGMA user_version = 3`.
9. Commit.
10. Only after the database commit succeeds, update project metadata’s minimum schema version through the current compatibility path.

On any failure:

- roll back the transaction;
- leave `user_version` at 2;
- leave all authoritative v2 note rows readable by the old schema;
- report the existing structured migration failure;
- never continue with an in-memory compatibility fallback or partially created authority path.

The DDL is idempotent, column addition is guarded by schema inspection, and index repopulation is repeatable. The transaction makes an interrupted migration all-or-nothing.

### 6.4 Exact preservation guarantee

A v2 note such as:

| Field | Before |
|---|---|
| `id` | unchanged UUIDv7 |
| `title` | unchanged |
| `body` | unchanged Markdown bytes |
| `tags` | unchanged normalized array |
| `pinned` | unchanged |
| `createdAt` | unchanged |
| `updatedAt` | unchanged |

appears after migration as:

| Field | After |
|---|---|
| every existing field | byte-for-byte/logically unchanged |
| `mode` | `"scratch"` |
| owned clips | none |
| FTS representation | one rebuildable derived index row |

No migration rewrites a title, body, tag, pin, ID, or timestamp. Existing list/detail/editor behavior continues immediately because scratch remains the default mode.

### 6.5 Migration tests

Extend `story-notes-migration.test.ts` and project-store tests to cover:

- v2 fixture with maximum-length and Unicode content migrates with every field preserved;
- v1 fixture chains through both steps;
- reopening v3 is idempotent;
- a forced FTS/table/trigger failure rolls back and leaves v2 data intact;
- fresh-store creation yields the v3 schema directly;
- source deletion sets clip source to null and preserves snapshot bytes;
- prep deletion cascades clips and leaves sources;
- FTS row counts and content match base notes after migration;
- `evaluateStoreCompatibility` accepts v3 and rejects future schemas under the existing rules;
- project metadata is advanced only after database success.

---

## 7. Server repository and API

### 7.1 Repository responsibilities

Evolve `story-notes-repository.ts` rather than creating a parallel note authority.

The repository should:

- select only columns needed for list/search results;
- use FTS5 for non-empty searches;
- use parameterized exact tag predicates;
- validate every base note and clip at the storage boundary with core Zod schemas;
- create clip snapshots and capture metadata in a transaction;
- verify excerpt freshness and exact containment;
- reorder a complete tray transactionally;
- convert mode only under the empty-tray rule;
- batch-delete note IDs atomically;
- expose an explicit FTS rebuild helper for migration/tests, not a public HTTP maintenance endpoint.

For excerpt capture, the client sends the exact selected Markdown and the source note’s `updatedAt`. The repository first checks timestamp equality, then verifies that the exact selected string occurs in the current body. If it appears more than once, that is harmless because the captured bytes are identical and no persistent character offset is claimed. Empty selections are invalid.

### 7.2 Existing route deltas

Retain the existing CRUD routes and response envelope. [R12]

#### `GET /api/notes`

Add query support for:

- `q`;
- repeated `tag` values, with AND semantics;
- current `pinned` behavior;
- `mode=all|scratch|scene-prep`;
- all current sorts plus `relevance`.

The response contains list items and aggregate counts. Relevance is valid only with non-empty `q`; without a query it resolves to the existing default order.

#### `POST /api/notes`

Accept optional `mode`, defaulting to `scratch`.

#### `PUT /api/notes/:id`

Accept optional `mode`. Preserve it when omitted. Return `409 prep-has-clips` if a scene-prep note with clips is changed back to scratch.

#### `DELETE /api/notes/:id`

Keep current hard-delete semantics. The response may include counts of cascaded clips and detached source pointers so the UI can describe what happened without exposing content.

#### Tag listing

Keep the current tag-list endpoint, but implement it without loading every body. Return normalized tag counts so the filter UI can show useful facets.

### 7.3 New tray routes

| Method and path | Purpose |
|---|---|
| `GET /api/notes/:prepNoteId/clips` | Return ordered clips plus derived source status. |
| `POST /api/notes/:prepNoteId/clips` | Atomically capture one to 100 whole-note/excerpt items. |
| `PUT /api/notes/:prepNoteId/clips/order` | Replace the complete ordered clip-ID sequence after validating exact membership. |
| `DELETE /api/notes/:prepNoteId/clips/:clipId` | Remove one snapshot from the tray only. |
| `POST /api/notes/delete-batch` | Atomically hard-delete one to 100 explicitly selected notes. |

The batch capture route validates all items before inserting any. Positions append after the current maximum in request order.

The reorder route requires the exact current clip set, with no duplicates or omissions. A stale client receives a conflict and reloads rather than silently losing a clip.

### 7.4 Response and error discipline

Continue the existing discriminated pattern:

- `400 invalid-request`;
- `404 note-not-found`, `clip-not-found`, or `prep-not-found`;
- `409 no-open-project`;
- `409 not-a-prep-note`;
- `409 prep-has-clips`;
- `409 stale-source`;
- `409 stale-tray`.

Messages are safe, concise, and do not echo note bodies or selected text.

All new routes remain under the currently open project and use the same project-store lifecycle. They are not global APIs.

### 7.5 Loopback, secrets, and logging

No server binding changes: launch remains `127.0.0.1` only. [R25] No API key is read for any Notes operation. No OpenRouter client is called. Request and error logs may include method, route, IDs, counts, and status; they must not include note bodies, clip content, selected text, search snippets, raw query results, or FTS rows.

Search and capture are local database operations, not “assistance” calls.

### 7.6 Native-fetch client surface

Extend `packages/web/src/api.ts` in the same typed, discriminated-response style as the current client. Existing functions remain the authority for note CRUD and gain the new query/response fields. Add narrowly named client functions:

- `listNoteClips(prepNoteId)`;
- `captureNoteClips(prepNoteId, input)`;
- `reorderNoteClips(prepNoteId, clipIds)`;
- `deleteNoteClip(prepNoteId, clipId)`;
- `deleteNotesBatch(noteIds)`.

The client types distinguish base `StoryNote`, search list items, clips, and failure unions. No function accepts a record reference, scene ID, generation payload, API key, or model option.

---

## 8. Web UI

### 8.1 Route and shell

Keep one project-gated `/notes` route and one sidebar entry in `AppShell.tsx`. [R16] Do not add `/scene-prep` as a peer to continuity surfaces. Optional URL search parameters may preserve the selected note or prep ID for refresh, but they carry only note IDs and filter state, never content.

### 8.2 View structure

`NotesView.tsx` becomes an orchestration shell with focused child components, for example:

- `NotesSearchPane`;
- `NoteSourcePane`;
- `ScenePrepPane`;
- `NoteClipTray`;
- `PermanentDeleteDialog`.

This is a code-organization suggestion, not a second product model. Existing `NoteEditor`, `NoteDetail`, and `safe-markdown` behavior should be reused.

### 8.3 Find pane

The find pane includes:

- debounced query input;
- multi-tag chips with AND semantics;
- pinned and mode filters;
- relevance plus existing sorts;
- match count;
- result checkboxes;
- “Collect selected” and “Permanently delete selected” actions;
- highlighted title, direct excerpt, tags, timestamps, pin, and mode badge;
- active-tray collection count derived from the loaded clips.

Search state remains in React context/local component state, consistent with the current application. No Redux or query library is introduced.

### 8.4 Source pane

The source pane has two safe views:

- **Preview:** current sanitized Markdown rendering;
- **Markdown source:** escaped plain source in a selection-capable read view.

“Collect selection” is enabled only in Markdown-source view when `selectionStart !== selectionEnd`. This deliberately avoids trying to map a DOM selection in rendered HTML back to exact Markdown offsets.

The pane also offers “Edit source” through the existing note editor. A pending source edit is flushed before capture; otherwise the server’s `stale-source` response prompts a reload.

### 8.5 Prep pane

The prep pane includes:

- active prep-sheet selector and “New prep sheet”;
- “Use this note as a prep sheet” for an existing scratch note;
- title/tags/pin and existing editor;
- save-state indicator;
- source tray;
- insert-at-cursor and append actions;
- source status and open-source/remove actions;
- move-up/move-down buttons and optional drag handles;
- collapse/expand tray.

The phrase “Scene Prep Sheet” is UI vocabulary, not a record type. No scene picker or record picker appears.

### 8.6 Autosave and failure behavior

Keep the existing approximately 900 ms idle save for ordinary typing. Add explicit flush points before:

- changing selected source;
- changing active prep;
- collecting a selection from an edited source;
- inserting into a prep body and then switching away;
- deleting a dirty note.

A clip insertion updates the local prep body and schedules an immediate save. If saving fails, the body remains visible and dirty, and the clip remains in the tray. The UI never reports a successful insert until the save response arrives.

### 8.7 Safe rendering and accessibility

- Search highlighting is rendered from React text nodes, never raw HTML.
- Clip content is shown as escaped source or through the existing safe Markdown component.
- All pane headings and status changes have accessible labels.
- Reorder buttons support keyboard use; drag is supplemental.
- Multi-select has a clear count and “clear selection.”
- Destructive actions require a focused modal with explicit consequence text.
- Plain global CSS in `packages/web/src/styles.css` remains the styling mechanism.
- The layout should remain usable at the current application’s supported viewport widths without adopting a new design system.

### 8.8 Required boundary language

Retain the existing badge exactly:

> **Author-private · never sent to prompts**

Add one persistent explanatory sentence:

> Notes and prep sheets are inert scratch. They never affect records, readiness, generation, or accepted prose.

Deletion confirmations additionally say:

> Copies already collected into another note or prep tray are separate private content and will not be removed unless selected too.

This language is both usability and constitutional compliance: it prevents the author from mistaking a prep sheet for continuity authority.

---

## 9. Isolation guarantees and test plan

### 9.1 Architectural guarantee

The safest design is not to “filter notes out” late. It is to keep Notes repositories and response types entirely absent from all snapshot/compiler/request builders.

Nothing in this proposal changes:

- record registries;
- generation-time field schemas;
- validation snapshot construction;
- readiness rules;
- compiler placeholders or section ordering;
- prose, ideation, or hygiene prompt request types;
- Active Working Set membership;
- record-reference unions;
- prompt inspection;
- OpenRouter request construction;
- accepted-segment storage.

The new FTS and clip tables are reachable only from the Notes repository. No generic “load all project tables” object should be introduced.

### 9.2 `packages/core/test/story-notes.test.ts`

Extend the existing domain tests to prove:

- v2-shaped create input defaults to `mode: "scratch"`;
- scene-prep mode parses only the exact enum;
- clip schemas enforce UUIDv7-shaped IDs, strict keys, limits, timestamps, and capture union rules;
- tags retain current normalization and deduplication;
- excerpt input rejects empty/oversized content;
- reorder and batch arrays reject duplicates and over-limit requests;
- `StoryNote` and `StoryNoteClip` are absent from every record kind, record reference, generation brief, validation snapshot, and working-set union.

### 9.3 `packages/core/test/compiler-context-firewall.test.ts`

Add unique sentinel canaries to every new category:

- scene-prep note title/body/tag;
- `mode`;
- whole-note clip content;
- excerpt clip content;
- source-title snapshot;
- source timestamp;
- synthetic search snippet/highlight/rank/source-status values.

Attempt to place these values in untrusted outer request objects and prove that strict validation rejects extra fields or that explicit snapshot construction does not copy them. Assert all canaries are absent from:

- compiled prose prompt;
- ideation prompt;
- assistance/hygiene prompt;
- validation/readiness diagnostics;
- compiler fingerprint inputs and output;
- prompt-inspection payloads.

Also keep the import-level negative check: compiler modules must not import `story-notes`.

### 9.4 `packages/server/src/story-notes-isolation.test.ts`

Expand the end-to-end sentinel fixture to create:

- a scratch source note;
- a prep note;
- whole and excerpt clips;
- FTS-indexed body/tag/title canaries;
- source-edited and source-deleted clip states.

Then exercise every prompt-adjacent server surface already covered by the test suite:

- validation;
- readiness;
- prose compile/preview/generate;
- ideation;
- record-hygiene assistance;
- OpenRouter request capture;
- prompt inspection;
- logs;
- working set;
- record references;
- accepted segments.

Assert that none of the new canaries occurs in any response, prompt, request body, log message, or reference graph. The only endpoints allowed to return those values are `/api/notes...`.

### 9.5 Repository and migration tests

Extend/add colocated Vitest coverage for:

- weighted relevance and deterministic tie-breaking;
- title/tag/body matches;
- literal escaping of quotes, `OR`, `NOT`, column selectors, and punctuation;
- trigram substring behavior;
- one/two-character fallback;
- exact multi-tag AND filtering;
- trigger updates after create/update/delete;
- rebuild after migration;
- safe snippet markers;
- whole-note and excerpt capture;
- stale source conflict;
- same-text-multiple-times capture;
- no self-capture;
- clip ordering and stale reorder conflict;
- source delete → null pointer + preserved bytes;
- prep delete → cascaded clips + preserved sources;
- mode downgrade conflict;
- atomic batch delete and batch capture;
- no note body in errors or logs.

Route tests use `fastify.inject()` and verify `409 no-open-project` on every new route, matching the existing pattern.

### 9.6 Web tests

Extend the existing `NotesView.test.tsx`, `NoteEditor.test.tsx`, API tests, and shell tests to cover:

- project gating and unchanged single Notes navigation entry;
- relevance/search snippet display;
- multi-tag filters;
- multi-select whole-note collection;
- exact textarea selection capture;
- source/prep coexistence without navigation loss;
- insert/append and autosave failure recovery;
- keyboard reorder;
- source edited/deleted labels;
- permanent batch-delete confirmation text;
- source-delete warning about retained copies;
- prep-delete cascade wording;
- boundary badge and explanatory sentence;
- no record, readiness, generation, or working-set action in Notes.

### 9.7 Core purity

`packages/core/test/boundary.test.ts` remains green. [R21] Core gains only pure types, schemas, normalization, and IDs. SQLite/FTS belongs in server; HTTP belongs in server; selection, panes, and highlighting belong in web.

---

## 10. FOUNDATIONS alignment and amendment determination

### 10.1 §29 / §29.12 hard-fail pass

| Question | Result | Reason |
|---|---|---|
| Can a note title, body, tag, mode, clip, snippet, rank, highlight, or source-status value influence a prompt? | **No** | Notes-only repository; expanded canary tests across every prompt type. |
| Can any of that material enter validation snapshots or readiness? | **No** | Snapshot types/builders remain unchanged and strict. |
| Can it enter compiler inputs, placeholders, section ordering, fingerprints, or empty states? | **No** | No compiler imports or contract changes. |
| Can it enter an OpenRouter request? | **No** | No Notes route calls OpenRouter; server sentinel tests inspect request bodies. |
| Can it appear in prompt inspection? | **No** | Inspection continues to expose only deterministic compiler/prompt artifacts. |
| Can a note or clip become Active Working Set membership? | **No** | No working-set type/route changes; “source tray” is intentionally different terminology and storage. |
| Can a note or clip be a record-reference source or target? | **No** | Clip pointers accept only note IDs and are not registered in record references. |
| Is there a promote-note-to-record flow? | **No** | No action, route, type, or staging state. |
| Does the app infer canon, scene consumption, or continuity from notes? | **No** | Collection and deletion are manual; no scene/segment/record link exists. |
| Does note material create generation blockers or warnings? | **No** | Storage validation is separate and local to Notes. |
| Does search or assembly add a new network/model surface? | **No** | SQLite FTS5 and local CRUD only. |
| Are bodies or clips logged by default? | **No** | Logs are limited to IDs/counts/status and tested. |
| Are notes visually confused with continuity surfaces? | **No** | Persistent boundary label, explanatory text, one Notes route, distinct vocabulary. |
| Does the change weaken local ownership? | **No** | Same project SQLite store, loopback server, no account/cloud. |
| Does it introduce planning rails or autonomous mutation? | **No** | Prep is inert user-authored scratch; no LLM or automatic record/note mutation. |
| Does it violate package purity? | **No** | Pure schemas in core; storage/FTS in server; UI in web. |

The full design therefore clears the engaged portions of §29, especially §29.12. [R2]

### 10.2 Amendment verdict

**No FOUNDATIONS amendment is required.**

Reasoning:

- §6.6 already admits per-project author-private story notes and does not require them to remain a single flat table or single-pane UI. A prep sheet and clip tray are internal structures of that same surface.
- The only persisted note-to-note relation is a narrowly scoped source pointer inside the private Notes subsystem. §6.6 and §29.12 forbid note-to-record links and record-reference participation; they do not forbid private note-to-note provenance. The pointer never becomes a general reference graph.
- §27’s requirement is strengthened, not relaxed: the proposed workspace carries the existing badge, adds a plain-language explanation, stays under one Notes navigation item, and avoids continuity terminology.
- §29.12 already explicitly covers metadata, previews, summaries, and derived material. FTS rows, snippets, ranks, source statuses, and clips fit under that existing wording and are kept out of every prohibited path.
- No new model/network behavior or authority relationship is introduced.

Because there is no amendment, there is no §1.1 amendment text to draft.

### 10.3 Documentation/registry impact

- Do not alter archived SPEC-023; it remains the historical implementation baseline.
- The downstream coding agent should create a new active draft spec through Loom’s normal intake process, then decompose it into tickets.
- Update `docs/user-guide.md` in the implementation change to explain Scene Prep, local search, snapshot behavior, and hard-delete consequences.
- `docs/user-guide.md` is already an active registered document, so editing it does not create a new active-document registry entry.
- Do not add note fields to `docs/specs/story-record-schema.md`.
- Do not add anything to `docs/specs/compiler-contract.md`.
- Do not change prompt/template/contract versions.
- This hand-off artifact is not a repository document and creates no `docs/ACTIVE-DOCS.md` registration requirement. If the downstream implementation creates any additional active Markdown document under `docs/`, it must register that file in the same change. [R1]

---

## 11. Implementation fit, sequencing, and risks

This section guides the later spec without becoming tickets.

### 11.1 Recommended implementation sequence

A safe implementation order is:

1. core mode/clip schemas and negative boundary tests;
2. schema-v3 migration and fresh DDL;
3. clip repository and FTS repository behavior;
4. route/client contracts;
5. expanded isolation tests;
6. three-pane web shell and search;
7. source selection and tray;
8. insertion/autosave coordination;
9. batch retirement;
10. user-guide update and full regression run.

The firewall tests should be expanded before the UI makes the new data easy to create.

### 11.2 FTS availability

The supported runtime includes FTS5, but migration should still preflight it. There should be no hidden fallback that silently returns to load-all-bodies search; divergent search implementations would complicate behavior and testing. A missing FTS5 build is an unsupported-runtime migration error, with the v2 transaction rolled back intact.

### 11.3 FTS query language

Binding a MATCH parameter prevents SQL injection but does not by itself prevent FTS operator interpretation. The repository needs a tested literal query builder. This is a correctness and predictability requirement, not merely security hardening.

### 11.4 Index consistency

The FTS index is derived. Triggers keep normal writes synchronized, migration rebuilds it, and tests compare base/index counts. The application should not expose a second writable path to the FTS table.

### 11.5 Snapshot duplication and deletion expectations

Snapshots deliberately duplicate content. That is the feature’s replacement for manual copy/paste. Consequently:

- deleting a source does not erase copies in prep bodies or clips;
- deleting a prep sheet does not delete sources;
- “delete all copies of this text” is not attempted;
- confirmations state the entity-level semantics.

This avoids both accidental assembly loss and a false promise of global text erasure.

### 11.6 Selection fidelity

Rendered Markdown selection is not a reliable source-range protocol. Collection comes from exact Markdown source. The server’s timestamp and containment checks protect against capturing from a stale view without introducing brittle persistent offsets.

### 11.7 Scale

The intended corpus is a single story’s notes, not a multi-tenant document service. FTS5 and bounded batch operations are sufficient. The proposal deliberately avoids pagination, background workers, remote indexes, and caching layers until measured data shows a need.

---

## 12. Deliberate exclusions and out of scope

The following are outside this change:

- any note → record link;
- any note → scene, generation session, candidate, accepted segment, or prose link;
- promote note to record;
- record suggestions derived from notes;
- note participation in validation, readiness, compiler inputs, any prompt, OpenRouter body, prompt inspection, Active Working Set, or record references;
- cross-project or global notes;
- cloud storage, sync, collaboration, accounts, telemetry, or remote search;
- any LLM-over-notes, local or remote;
- embeddings or semantic model distribution;
- general wiki links, backlinks, graph view, live transclusion, or recursive embeds;
- a full block/outliner editor;
- folders, nested note hierarchy, or hierarchical tags;
- generic saved searches/views;
- canvas or corkboard;
- automatic scene planning, beats, acts, plot rails, or consumption detection;
- soft delete, archive, trash, recovery, or undo;
- automatic source-text cutting after collection;
- secure-erasure guarantees;
- ticket generation or code in this document.

Ticket decomposition is deferred to Loom’s spec-to-tickets workflow after the coding agent converts this precursor into an approved spec.

---

## 13. Handoff summary

The recommended change is a **local Scene Prep workspace within Private Notes**, not a new continuity surface:

- FTS5 solves findability.
- Snapshot clips solve mixed-granularity collection.
- The three-pane layout solves context switching and orientation.
- The existing note body remains the editable composition target.
- Explicit batch hard delete supports the shrinking-note lifecycle.
- Schema v3 preserves every existing note.
- No compiler, validation, prompt, record, working-set, OpenRouter, inspection, or network boundary moves.
- No FOUNDATIONS amendment is required.

The later spec should preserve this bounded shape. Expanding it into a general PKM graph, live transclusion engine, record bridge, or model-assisted note system would be a different proposal with different constitutional and migration consequences.

---

## 14. Source register

### Repository evidence — exact target commit

- **[R1]** [`docs/ACTIVE-DOCS.md`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/docs/ACTIVE-DOCS.md)
- **[R2]** [`docs/principles/FOUNDATIONS.md`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/docs/principles/FOUNDATIONS.md)
- **[R3]** [`archive/specs/SPEC-023-author-private-story-notes.md`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/archive/specs/SPEC-023-author-private-story-notes.md)
- **[R4]** [`archive/reports/author-private-story-notes-research-brief.md`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/archive/reports/author-private-story-notes-research-brief.md)
- **[R5]** [`docs/specs/story-record-schema.md`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/docs/specs/story-record-schema.md)
- **[R6]** [`docs/user-guide.md`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/docs/user-guide.md)
- **[R7]** [`docs/specs/compiler-contract.md`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/docs/specs/compiler-contract.md)
- **[R8]** [`packages/core/src/story-notes.ts`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/core/src/story-notes.ts)
- **[R9]** [`packages/core/src/project-storage.ts`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/core/src/project-storage.ts)
- **[R10]** [`packages/server/src/record-tables.ts`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/record-tables.ts)
- **[R11]** [`packages/server/src/story-notes-repository.ts`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/story-notes-repository.ts)
- **[R12]** [`packages/server/src/story-note-routes.ts`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/story-note-routes.ts)
- **[R13]** [`packages/server/src/project-store.ts`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/project-store.ts)
- **[R14]** [`packages/web/src/notes/NotesView.tsx`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/web/src/notes/NotesView.tsx)
- **[R15]** [`packages/web/src/notes/NoteEditor.tsx`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/web/src/notes/NoteEditor.tsx)
- **[R16]** [`packages/web/src/shell/AppShell.tsx`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/web/src/shell/AppShell.tsx)
- **[R17]** [`packages/web/src/api.ts`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/web/src/api.ts)
- **[R18]** [`packages/core/test/compiler-context-firewall.test.ts`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/core/test/compiler-context-firewall.test.ts)
- **[R19]** [`packages/server/src/story-notes-isolation.test.ts`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/story-notes-isolation.test.ts)
- **[R20]** [`packages/core/test/story-notes.test.ts`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/core/test/story-notes.test.ts)
- **[R21]** [`packages/core/test/boundary.test.ts`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/core/test/boundary.test.ts)
- **[R22]** [`packages/server/src/story-notes-migration.test.ts`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/story-notes-migration.test.ts)
- **[R23]** [`packages/core/src/version.ts`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/core/src/version.ts)
- **[R24]** [`packages/server/src/record-routes.ts`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/record-routes.ts)
- **[R25]** [`packages/server/src/launch.ts`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/launch.ts)
- **[R26]** [`package.json`](https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/package.json)

### External research

- **[E1]** Peter Pirolli and Stuart Card, [“The Sensemaking Process and Leverage Points for Analyst Technology as Identified Through Cognitive Task Analysis”](https://andymatuschak.org/files/papers/Pirolli%2C%20Card%20-%202005%20-%20The%20sensemaking%20process%20and%20leverage%20points%20for%20analyst%20technology%20as.pdf), 2005.
- **[E2]** Daniel M. Russell, Mark J. Stefik, Peter Pirolli, and Stuart K. Card, [“The Cost Structure of Sensemaking”](https://www.markstefik.com/wp-content/uploads/2014/04/1993-Cost-Structure-of-Sensemaking1.pdf), INTERCHI 1993.
- **[E3]** Literature & Latte, [“Scrivener 3: Copyholders and Layouts”](https://www.literatureandlatte.com/blog/scrivener-3-copyholders-and-layouts).
- **[E4]** Literature & Latte, [“Different Ways of Setting Up Scrivener’s Binder for Your Projects”](https://www.literatureandlatte.com/blog/different-ways-of-setting-up-scriveners-binder-for-your-projects).
- **[E5]** Ulysses, [“First Steps — Library & Editor”](https://help.ulysses.app/en_US/getting-started/first-steps-library-editor).
- **[E6]** Ulysses, [“Sheets & Groups”](https://help.ulysses.app/567894-sheets-groups) and [“Beyond the Basics”](https://help.ulysses.app/en_US/getting-started/details-and-tips).
- **[E7]** Notion, [“Views, filters, sorts & groups”](https://www.notion.com/help/views-filters-and-sorts).
- **[E8]** Obsidian, [“Internal links”](https://obsidian.md/help/links) and [“Backlinks”](https://obsidian.md/help/plugins/backlinks).
- **[E9]** Logseq, [“How to Get Started With Networked Thinking and Logseq”](https://blog.logseq.com/how-to-get-started-with-networked-thinking-and-logseq/).
- **[E10]** Bear, [“How to Make Nested Tags”](https://bear.app/faq/nested-tags/) and [“How to use the Info Panel, Table of Contents, and Backlinks in Bear”](https://bear.app/faq/how-to-use-the-info-panel-table-of-contents-and-backlinks-in-bear/).
- **[E11]** Andrew Lush, [“Fundamental personal information management activities: organisation, finding and keeping”](https://www.tandfonline.com/doi/full/10.1080/00049670.2013.875452), 2014.
- **[E12]** Andrea Civan et al., [“Better to organize personal information by folders or by tags?”](https://asistdl.onlinelibrary.wiley.com/doi/10.1002/meet.2008.1450450214), 2008.
- **[E13]** SQLite, [“SQLite FTS5 Extension”](https://sqlite.org/fts5.html).
- **[E14]** Node.js v24.0.0 source, [`deps/sqlite/sqlite.gyp`](https://raw.githubusercontent.com/nodejs/node/v24.0.0/deps/sqlite/sqlite.gyp), showing `SQLITE_ENABLE_FTS5`.
- **[E15]** Martin Kleppmann, Adam Wiggins, Peter van Hardenberg, and Mark McGranaghan, [“Local-first software: You own your data, in spite of the cloud”](https://www.inkandswitch.com/essay/local-first/), 2019.

---

## Appendix A — Complete acquisition evidence ledger

```text
Requested repository: joeloverbeck/continuity-loom
Target commit: 90d17f8b2e868b90b2f536316e06438e994098cf
Freshness claim: user-supplied target commit only; not independently verified as latest main
Manifest role: path inventory only
Repository metadata used: no
Default-branch lookup used: no
Branch-name file fetch used: no
Target-repository code search used: no
Clone used: no
URL fetch method: web.open with full exact raw-file or exact blob-file URLs
Requested file count: 57 fetch requests (43 unique manifest paths; 56 unique exact URLs)
Successfully verified file count: 57 fetches (43 unique manifest paths)
Fetch-provenance contamination observed: no
Foreign-repository references inside fetched file contents: permitted; not a provenance check
Connector/tool namespace trusted as evidence: no
External research lane: separate from repository evidence
```

### Requested exact URLs, in append-only request order

1. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/docs/ACTIVE-DOCS.md>
2. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/docs/principles/FOUNDATIONS.md>
3. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/archive/specs/SPEC-023-author-private-story-notes.md>
4. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/archive/reports/author-private-story-notes-research-brief.md>
5. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/docs/specs/story-record-schema.md>
6. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/docs/user-guide.md>
7. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/docs/specs/compiler-contract.md>
8. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/docs/archival-workflow.md>
9. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/tickets/README.md>
10. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/tickets/_TEMPLATE.md>
11. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/README.md>
12. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/core/src/story-notes.ts>
13. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/core/test/story-notes.test.ts>
14. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/core/test/compiler-context-firewall.test.ts>
15. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/story-notes-isolation.test.ts>
16. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/core/test/boundary.test.ts>
17. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/record-tables.ts>
18. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/story-notes-repository.ts>
19. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/story-note-routes.ts>
20. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/record-routes.ts>
21. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/story-notes-migration.test.ts>
22. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/project-store.ts>
23. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/core/src/project-storage.ts>
24. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/web/src/notes/NotesView.tsx>
25. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/web/src/notes/NoteEditor.tsx>
26. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/web/src/notes/NoteDetail.tsx>
27. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/web/src/notes/safe-markdown.tsx>
28. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/web/src/shell/AppShell.tsx>
29. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/web/src/api.ts>
30. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/core/src/version.ts>
31. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/web/src/styles.css>
32. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/core/src/index.ts>
33. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/core/test/project-storage.test.ts>
34. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/story-notes-repository.test.ts>
35. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/story-note-routes.test.ts>
36. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/server.ts>
37. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/launch.ts>
38. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/web/src/notes/NotesView.test.tsx>
39. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/web/src/notes/NoteEditor.test.tsx>
40. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/web/src/api-notes.test.tsx>
41. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/web/src/shell/AppShell.test.tsx>
42. <https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/core/src/story-notes.ts>
43. <https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/story-notes-repository.ts>
44. <https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/story-note-routes.ts>
45. <https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/record-tables.ts>
46. <https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/project-store.ts>
47. <https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/story-notes-isolation.test.ts>
48. <https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/story-notes-migration.test.ts>
49. <https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/web/src/notes/NotesView.tsx>
50. <https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/web/src/notes/NoteEditor.tsx>
51. <https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/web/src/shell/AppShell.tsx>
52. <https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/web/src/api.ts>
53. <https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/story-note-routes.test.ts>
54. <https://github.com/joeloverbeck/continuity-loom/blob/90d17f8b2e868b90b2f536316e06438e994098cf/packages/web/src/notes/NotesView.test.tsx>
55. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/package.json>
56. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/packages/server/src/project-store.ts>
57. <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/90d17f8b2e868b90b2f536316e06438e994098cf/package.json>

### Acquisition result

Every requested path appeared exactly in the user-supplied manifest. Every request used a full exact-commit URL naming `joeloverbeck/continuity-loom`, the complete target SHA, and the manifest path. Returned resources were direct target files rather than search results, branch pages, repository overviews, cached snippets, or unrelated substitutions. No transport-level owner, repository, commit, or path mismatch was observed. The repeated raw request for `packages/server/src/project-store.ts` was an intentional second inspection of the same verified file and is retained in the append-only ledger.
