# SPEC029PRINOTUSA-001: Schema v3 migration vertical — `mode`, clip & FTS tables

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — `@loom/core` story-note domain (`StoryNote.mode`, `StoryNoteClip` + Zod schemas), `LOOM_SCHEMA_VERSION` 2→3, `@loom/server` `story_notes.note_mode` column + `story_note_clips` + `story_notes_fts` tables/triggers, ordered-step-runner open-time migration, `rowToStoryNote` mode mapping; production behavior change (new on-disk schema v3)
**Deps**: None

## Problem

SPEC-029 turns the flat Private Notes table into a Scene Prep workspace. Every later
ticket (FTS search, clip operations, routes, UI) needs the storage substrate to exist
first: a `mode` discriminator on notes, a `story_note_clips` table, and a derived
`story_notes_fts` index. Adding the required `mode` member to `StoryNote` breaks
`@loom/server` typecheck (`rowToStoryNote`/`createNote`/`updateNote` construct
`StoryNote`), and bumping `LOOM_SCHEMA_VERSION` without the migration makes existing v2
stores fail to open — so the core type change, the version bump, the v2→v3 migration,
and the repository row-mapping are one indivisible vertical (CLAUDE.md forbids the shim
that would bridge a per-layer split). This ticket lands that vertical green.

## Assumption Reassessment (2026-06-22)

1. Current domain verified against `packages/core/src/story-notes.ts`: `StoryNote` =
   `id|title|body|tags|pinned|createdAt|updatedAt` (lines 5–13); limits title ≤ 160
   (`storyNoteTitleSchema:30`), body ≤ 200_000 (`:31`), tag ≤ 32 (`:36`);
   `storyNoteCreateInputSchema` (`:75`) and `storyNoteUpdateInputSchema` (`:84`).
   `packages/core/src/project-storage.ts`: `LOOM_SCHEMA_VERSION = 2` (`:5`),
   `evaluateStoreCompatibility` returns `ok | incompatible-version | migration-required`
   (`:56–69`). `packages/server/src/record-tables.ts:63` `ensureStoryNoteTables` builds
   `story_notes` (`:65`) with indexes `story_notes_pinned_updated_idx` / `_title_idx` /
   `_updated_idx` (`:75–82`). `rowToStoryNote` at `story-notes-repository.ts:47`,
   `createNote:190`, `updateNote:222`, `summarize:136`.
2. Spec authorities: `archive/specs/SPEC-029-private-notes-usability.md` Deliverables 1–3 and
   Scope-decisions 1–7; `docs/FOUNDATIONS.md` §6.6 (`:235–248`) admits the surface
   without constraining internal structure. Novelty grep (repo-wide) for
   `story_note_clips` / `story_notes_fts` / `note_mode` / `StoryNoteClip` returns zero —
   all "create new".
3. Cross-package boundary under audit: the `StoryNote` shape crosses `@loom/core` →
   `@loom/server` (`rowToStoryNote`) → `@loom/web` (read-only). `@loom/web`'s
   `StoryNoteSummary` is `Pick<StoryNote, …>` that **excludes** `mode`
   (`web/src/api.ts:269`, `server/src/story-notes-repository.ts:23`), so adding `mode`
   to `StoryNote` does not break web typecheck; `mode` enters the summary in 002/004.
4. FOUNDATIONS principle restated (§29.12 substrate): this ticket builds the **inputs**
   to the author-private firewall that SPEC029PRINOTUSA-005 enforces by test. Confirm
   the data model introduces no leakage path — `StoryNoteClip` and `mode` are exported
   from `@loom/core` but **never** registered in the record registry, validation
   snapshot, generation-time brief, compiler types, or working-set union; `story_notes_fts`
   is a derived, Notes-only table. No nondeterminism enters compilation (the compiler
   does not import `story-notes`; boundary preserved). Enforcement is deferred to 005.
5. Schema extension (§ additive-with-default): `mode` is a new member of the existing
   `StoryNote` record. Producers updated in this ticket (`rowToStoryNote` reads
   `note_mode`, defaulting `scratch`; `createNote`/`updateNote` accept optional `mode`).
   Migration backfills every v2 row to `scratch`, so the field is additive-with-default —
   no existing note is invalidated. `StoryNoteClip` is a brand-new record with no prior
   consumers.
6. Adjacent contradictions classified as **required consequences** of this ticket: the
   `LOOM_SCHEMA_VERSION` 2→3 bump breaks two produced-assertion test sites —
   `packages/server/src/project-store.test.ts:14` (`const EXPECTED_SCHEMA_VERSION = 2`)
   and `packages/server/src/record-layer.test.ts:99`
   (`toEqual({ user_version: 2 })`). Both are updated here.
   `story-notes-migration.test.ts` reads the `LOOM_SCHEMA_VERSION` symbol and tracks the
   bump automatically. Indivisibility rationale (Merge / schema-field vertical): a
   core-only or schema-tighten-without-migration split leaves a typecheck-failing or
   v2-store-unopenable intermediate; per CLAUDE.md no compat shim is permitted, so the
   vertical is one ticket even at Large size.

## Architecture Check

1. One vertical keeps the on-disk schema, its TypeScript shape, and its migration in a
   single reviewable diff — the only state in which `npm run typecheck` and a v2-store
   open both stay green. The open-time migration is refactored from the current hardcoded
   single-case dispatch (`project-store.ts:386` `LOOM_SCHEMA_VERSION === 2 &&
   storeUserVersion === 1`) into an ordered step runner so a v1 store chains v1→v2→v3 and
   future bumps add a step rather than another special case.
2. No backwards-compatibility aliasing or shims: `mode` is additive-with-default via the
   migration backfill, not a parallel legacy path; the FK declarations document integrity
   intent while the repository enforces cascade/null explicitly (see 003), so no shim
   bridges the foreign-keys-off-on-open reality.

## Verification Layers

1. `StoryNote.mode` + `StoryNoteClip` schema shape -> schema validation (Zod) in
   `packages/core/test/story-notes.test.ts` (enum default, clip strictness, union limits).
2. v2→v3 migration preserves every byte + adds one FTS row -> migration test
   (`story-notes-migration.test.ts`: max-length/Unicode preservation, v1 chain, idempotence,
   forced-failure rollback leaving `user_version` at 2).
3. `mode`/`StoryNoteClip` absence from prompt/record surfaces -> codebase grep-proof +
   core boundary test (`boundary.test.ts` stays green; compiler modules do not import
   `story-notes`).
4. Schema-version constant + compatibility -> `project-storage.test.ts` (`evaluateStoreCompatibility`
   accepts v3, rejects future) + the two updated produced-assertion sites.

## What to Change

### 1. Core domain (`@loom/core`)

- `story-notes.ts`: add `mode: "scratch" | "scene-prep"` to `StoryNote` (a shared enum
  constant); `storyNoteCreateInputSchema` gains optional `mode` defaulting `"scratch"`;
  `storyNoteUpdateInputSchema` gains optional `mode` (omission preserves current). Add the
  `StoryNoteClip` type + Zod schema (`id`, `prepNoteId`, `sourceNoteId | null`,
  `captureKind: "whole-note" | "excerpt"`, `sourceTitleSnapshot` ≤ 160, `content` ≤ 200_000,
  `sourceUpdatedAtAtCapture`, `position` ≥ 0, `createdAt`, `updatedAt`; content immutable
  after capture) and strict Zod unions for whole-note capture, excerpt capture
  (`selectedText`, `sourceUpdatedAt`), batch capture (1–100), complete tray reorder
  (deduplicated clip-ID array), and batch note deletion (1–100 IDs). Export all from `index.ts`.
- `project-storage.ts`: bump `LOOM_SCHEMA_VERSION` 2 → 3; ensure `evaluateStoreCompatibility`
  accepts v3 and rejects future schemas under existing rules. Do **not** touch
  `packages/core/src/version.ts`.

### 2. Server storage + migration (`@loom/server`)

- `record-tables.ts`: add `note_mode TEXT NOT NULL DEFAULT 'scratch' CHECK (note_mode IN
  ('scratch','scene-prep'))` to `story_notes` (retain all current columns/indexes); add
  `story_note_clips` (`prep_note_id … REFERENCES story_notes(id) ON DELETE CASCADE`,
  `source_note_id … REFERENCES story_notes(id) ON DELETE SET NULL`, checked `capture_kind`,
  snapshots, `position`, timestamps) with indexes `(prep_note_id, position, created_at)` and
  `(source_note_id)` — not a unique `(prep_note_id, position)`. Add `story_notes_fts` FTS5
  (`note_id UNINDEXED`, `title`, `tags`, `body`, `tokenize = 'trigram'`) kept in sync by
  insert/update/delete triggers on `story_notes`. The `ON DELETE` clauses document intent
  only — runtime cascade/null is enforced explicitly in 003 (foreign-keys is off on the open
  connection).
- `project-store.ts`: refactor the open-time migration into an **ordered step runner**
  (v1→v2 retained, new v2→v3; a v1 store chains both). v2→v3 transaction: FTS5 preflight →
  `BEGIN IMMEDIATE` → inspect `PRAGMA table_info` → add `note_mode` → create clip table +
  indexes + FTS table + triggers (`IF NOT EXISTS`) → clear/repopulate FTS from every row →
  verify FTS coverage + valid modes → `PRAGMA user_version = 3` → commit → only then advance
  project metadata. On failure: roll back, leave `user_version` at 2, leave v2 rows readable,
  report the existing structured migration failure, never fall back to in-memory compatibility.
- `story-notes-repository.ts`: `rowToStoryNote` reads `note_mode` (defaulting `scratch`);
  `createNote`/`updateNote` persist `mode`. No FTS query or clip CRUD here yet (002/003).

### 3. Produced-assertion test fixups

- `project-store.test.ts:14`: `EXPECTED_SCHEMA_VERSION` 2 → 3.
- `record-layer.test.ts:99`: `{ user_version: 2 }` → `{ user_version: 3 }`.

## Files to Touch

- `packages/core/src/story-notes.ts` (modify)
- `packages/core/src/project-storage.ts` (modify)
- `packages/core/src/index.ts` (modify)
- `packages/server/src/record-tables.ts` (modify)
- `packages/server/src/project-store.ts` (modify)
- `packages/server/src/story-notes-repository.ts` (modify)
- `packages/core/test/story-notes.test.ts` (modify)
- `packages/core/test/project-storage.test.ts` (modify)
- `packages/server/src/story-notes-migration.test.ts` (modify)
- `packages/server/src/project-store.test.ts` (modify)
- `packages/server/src/record-layer.test.ts` (modify)

## Out of Scope

- FTS5 search query logic, literal query builder, short-term fallback, derived read fields
  (SPEC029PRINOTUSA-002).
- Clip capture/reorder/batch-delete operations and explicit cascade/null enforcement
  (SPEC029PRINOTUSA-003).
- Routes, typed client, `StoryNoteSummary.mode` (SPEC029PRINOTUSA-004).
- Any note → record link, working-set, compiler, or prompt participation; `version.ts`
  template/compiler/contract/app constants; `docs/story-record-schema.md` and
  `docs/compiler-contract.md` (untouched by SPEC-029).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core` — `StoryNote.mode` defaults `scratch`; clip schema
   rejects over-limit/extra keys; capture/reorder/batch unions enforce 1–100 and dedup;
   `evaluateStoreCompatibility(3, …)` accepts v3, rejects v4.
2. `npm test --workspace @loom/server` — a v2 note (max-length + Unicode) migrates to v3
   byte-for-byte unchanged acquiring `mode: scratch` + one FTS row; a v1 store chains
   v1→v2→v3; reopening v3 is idempotent; a forced FTS/table failure rolls back leaving
   `user_version` at 2 and all v2 rows readable; updated `project-store.test.ts` /
   `record-layer.test.ts` assert version 3.
3. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. Adding `mode` to `StoryNote` never makes a note enter a record/reference/brief/snapshot/
   working-set union (`boundary.test.ts` green; no compiler import of `story-notes`).
2. `story_notes_fts` is fully derived and rebuildable from `story_notes`; FTS row count and
   content match base notes after migration.

## Test Plan

### New/Modified Tests

1. `packages/core/test/story-notes.test.ts` — mode enum default + clip/union schema strictness and limits.
2. `packages/core/test/project-storage.test.ts` — `evaluateStoreCompatibility` v3 acceptance/future rejection.
3. `packages/server/src/story-notes-migration.test.ts` — v2→v3 preservation, v1 chain, idempotence, forced-failure rollback, FTS parity.
4. `packages/server/src/project-store.test.ts`, `packages/server/src/record-layer.test.ts` — version-3 assertion fixups.

### Commands

1. `npm test --workspace @loom/core && npm test --workspace @loom/server`
2. `npm run typecheck && npm run lint && npm test && npm run build`

## Outcome

Completed: 2026-06-22

Changed:
- Added `StoryNote.mode`, `StoryNoteClip`, clip capture/reorder/batch-delete schemas, and core exports.
- Bumped `LOOM_SCHEMA_VERSION` to 3 without changing prompt/template/compiler/contract versions.
- Added v3 `story_notes.note_mode`, `story_note_clips`, `story_notes_fts`, and FTS triggers; retained a legacy v2 story-note table helper for v1→v2 migration.
- Refactored open-time migration into ordered v1→v2→v3 steps with FTS5 preflight, v2 rollback on failure, v1 chain migration, v3 idempotence, and metadata/user-version updates.
- Updated `StoryNotesRepository` create/update/read mapping to persist `mode`.
- Updated produced schema-version assertions and test fixtures affected by the required `StoryNote.mode` member.

Deviations:
- `StoryNote.mode` is storage-defaulted but type-required, so existing full `StoryNote` test fixtures in the web package were updated in this ticket to preserve a typecheck-green vertical.
- The migration dispatcher leaves stores below the registered migration floor as `migration-required` instead of attempting an unsupported migration and reporting `migration-failed`.

Verification:
- `npm test --workspace @loom/core -- story-notes project-storage` — passed.
- `npm test --workspace @loom/server -- story-notes-migration story-notes-repository project-store record-layer` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed, 158 files / 1678 tests.
- `npm run build` — passed; Vite emitted the pre-existing large chunk warning.
