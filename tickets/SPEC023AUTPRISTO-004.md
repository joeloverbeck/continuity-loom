# SPEC023AUTPRISTO-004: `StoryNotesRepository` (CRUD, search, deterministic preview)

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `StoryNotesRepository` + a `getStoryNotesRepository()` accessor on `ProjectStoreManager`; no change to record/generation/session behavior
**Deps**: 002, 003

## Problem

The `/api/notes` routes need a dedicated repository for `story_notes` CRUD, search, tag listing, and deterministic summaries. It must be **separate** from `RecordRepository` — separation is part of the isolation proof — must parse every row and input through the core Zod schemas, must produce previews and orderings deterministically with no LLM, and must never read or mutate records, the working set, the generation session, story config, accepted segments, or reference tables.

## Assumption Reassessment (2026-06-15)

1. The existing repository pattern is `export class RecordRepository { constructor(private readonly database: DatabaseSync) {} }` (`packages/server/src/record-repository.ts:168-169`, `DatabaseSync` from `node:sqlite`). Routes obtain it via `ProjectStoreManager.getRecordRepository(): RecordRepository | null` (`packages/server/src/record-routes.ts:89-90`). `StoryNotesRepository` mirrors this shape, and the manager gains a parallel `getStoryNotesRepository()` accessor so routes (005) can reach it (returns `null` when no project is open → the route emits 409).
2. SPEC-023 §"Repository" prescribes methods `listNotes(query?)`, `getNote(id)`, `createNote(input)`, `updateNote(id, input)`, `deleteNote(id)`, `listTags()`, the `StoryNoteSort` / `StoryNoteListQuery` / `StoryNoteSummary` shapes, and the rules: parse rows via `storyNoteSchema`, parse inputs via the core create/update schemas, server-stamp `id`/`created_at`/`updated_at`, update `updated_at` on every write, deterministic `bodyPreview` (≤240 chars, no LLM), deterministic tie-broken ordering, case-insensitive tag de-dup with stable display form.
3. **Cross-artifact boundary under audit**: the repository touches only the `story_notes` table created by ticket 003. It must issue no SQL against `records`, `record_references`, `story_config`, `generation_session`, or any accepted-segment table — confirmed by Verification Layer 4's grep-proof. The core schemas/types (`storyNoteSchema`, `StoryNoteCreateInput`, `StoryNoteUpdateInput`) come from `@loom/core` (ticket 002).
4. **FOUNDATIONS principle under audit (§10 / §28.1)**: no prose-derived summary may become continuity. `bodyPreview` is a deterministic plain-text excerpt of the author's own note body — not an LLM summary, and it never enters any prompt (it is a list-display field only). This preserves no-prose-derived-canon by construction.
5. **Determinism / firewall confirmation (§8/§15)**: `bodyPreview` and all list orderings are computed deterministically (lexical/temporal sort with `id` as the final tie-breaker, no `Math.random`, no LLM). The repository is substrate the capstone (009) proves isolated; it opens no leakage path because it neither reads nor writes any continuity surface — only `story_notes`. Timestamps are captured server-side as storage metadata, not canonical compiler inputs.
6. **Adjacent wiring (required consequence)**: the `getStoryNotesRepository()` accessor on `ProjectStoreManager` (`packages/server/src/project-store.ts`) is a required consequence of making the repository reachable from routes — it mirrors `getRecordRepository()` and is not a separate feature.

## Architecture Check

1. A standalone `StoryNotesRepository` (not a method bag folded into `RecordRepository`) keeps the note store mechanically incapable of touching the record graph — the cleanest possible isolation guarantee, and it mirrors the one-repository-per-surface pattern already in the server.
2. No backwards-compatibility aliasing/shims: a new class + a new manager accessor; no reuse of record SQL, no shared mutable state with `RecordRepository`.
3. **Same revision; co-lands with the feature (§1.1)** — transitively after 001 via its `Deps`.

## Verification Layers

1. `StoryNotesRepository` is a distinct class from `RecordRepository` -> codebase grep-proof (separate file; no `RecordRepository` import/extension).
2. Every row returned parses through `storyNoteSchema`; every create/update input parses through core schemas before writing -> schema validation test (round-trip + rejection cases).
3. Deterministic `bodyPreview` (≤240 chars, no LLM) and stable ordering with `id` tie-break -> manual review (no LLM/`Math.random` import) + test asserting identical output across repeated calls and stable order on equal timestamps.
4. Repository issues no SQL against `records`/`record_references`/`story_config`/`generation_session`/accepted tables -> codebase grep-proof over `story-notes-repository.ts`.

## What to Change

### 1. New `packages/server/src/story-notes-repository.ts`

`class StoryNotesRepository { constructor(private readonly database: DatabaseSync) {} }` with the six methods per SPEC-023 §"Repository". Parse rows via `storyNoteSchema`; parse `createNote`/`updateNote` inputs via the core input schemas; server-stamp `id` (via core `generateStoryNoteId()`), `created_at`, `updated_at`; bump `updated_at` on every content/metadata write. Implement `listNotes` filtering (`q`, `tag`, `pinned`, `sort`) with deterministic ordering (`pinned DESC`, sort key, `id ASC` tie-break) and the ranked substring search per SPEC-023 §"Include: search". `bodyPreview`: deterministic plain-text excerpt capped at 240 chars, no LLM. `listTags`: distinct normalized tags. Case-insensitive tag de-dup preserving stable display form.

### 2. Manager accessor

`packages/server/src/project-store.ts`: add `getStoryNotesRepository(): StoryNotesRepository | null` mirroring `getRecordRepository()` — returns a repository bound to the open database, or `null` when no project is open.

## Files to Touch

- `packages/server/src/story-notes-repository.ts` (new)
- `packages/server/src/project-store.ts` (modify — `getStoryNotesRepository()` accessor)
- `packages/server/src/story-notes-repository.test.ts` (new)

## Out of Scope

- HTTP routes, request validation, error envelopes, redaction (ticket 005).
- Web client/UI (006–008).
- FTS5 / external search index (SPEC-023 §Out of Scope) — V1 search is SQL/in-repo substring matching.
- Any read/write of records, working set, generation session, story config, accepted segments, or reference tables.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/server` — `story-notes-repository.test.ts` covers create→get→list→update→delete round-trips, `updated_at` bump on update, tag normalization/de-dup, pinned-first + tie-broken ordering, search ranking, and `getNote` of a missing id returns `undefined`.
2. `npm test --workspace @loom/server` — a test asserts repeated `listNotes`/`bodyPreview` calls on identical data return byte-identical results (determinism) and that the repository performs no record-table SQL.
3. `npm run typecheck` — repository types align with `@loom/core` schemas and the manager accessor.

### Invariants

1. The repository reads/writes only `story_notes`; it holds no reference to `RecordRepository` and issues no record/working-set/session/config/accepted SQL.
2. `id`, `created_at`, `updated_at` are always server-generated; `bodyPreview` is always a deterministic excerpt, never an LLM summary.

## Test Plan

### New/Modified Tests

1. `packages/server/src/story-notes-repository.test.ts` (new) — CRUD/search/tag/ordering/determinism + isolation (no record-table access).

### Commands

1. `npm test --workspace @loom/server -- story-notes-repository`
2. `npm test --workspace @loom/server && npm run typecheck`
3. `grep -nE "records|record_references|story_config|generation_session|RecordRepository" packages/server/src/story-notes-repository.ts` — must return nothing (isolation grep-proof); the narrow grep is the correct boundary because it directly proves the no-record-graph-touch invariant.
