# SPEC029PRINOTUSA-002: Repository FTS5 ranked search + tag-list rebuild

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — `@loom/server` `StoryNotesRepository` search path (FTS5 query, literal query builder, derived read fields, relevance sort), `StoryNoteSummary` gains `mode` + derived fields; production behavior change (search engine replaced)
**Deps**: SPEC029PRINOTUSA-001

## Problem

Note search today loads every body and substring-matches in application memory
(`story-notes-repository.ts` `includesQuery:77`, `searchRank:89`, `listNotes:151–181`,
`SELECT * FROM story_notes:257`): no ranking, no snippets, no SQLite narrowing. SPEC-029
Deliverable 4 (read path) replaces it with a ranked local FTS5 query against the
`story_notes_fts` table created in 001, returning meaningful snippets and the derived read
fields the find pane needs — while keeping all of it author-private.

## Assumption Reassessment (2026-06-22)

1. Current search verified in `packages/server/src/story-notes-repository.ts`:
   `includesQuery` (`:77`), `searchRank` (`:89–106`), `listNotes` (`:151–181`) loading via
   `SELECT * FROM story_notes` (`:257`), `summarize` (`:136`) building `StoryNoteSummary`
   (`:23`, currently `Pick<StoryNote,…> & { bodyPreview }`, no `mode`). `story_notes_fts`
   (`note_id`,`title`,`tags`,`body`, trigram) is created by SPEC029PRINOTUSA-001.
2. Spec authority: `specs/SPEC-029-private-notes-usability.md` Approach §A + Deliverable 4
   (read path) — bm25 title>tags>body, literal FTS phrase escaping, trigram for ≥3-char
   terms, parameterized `instr()`/`LIKE` for 1–2-char terms, exact tag AND from the
   authoritative row, `relevance` sort default only while a non-empty query is active.
3. Boundary under audit: the list-response shape (`StoryNoteSummary` + new derived fields)
   crosses `@loom/server` → `@loom/web`. This ticket owns the **server** side of that shape;
   the web client mirror (`web/src/api.ts`) is SPEC029PRINOTUSA-004.
4. FOUNDATIONS restated (§29.12 derived material): rank, snippets, highlight marker tokens,
   and matched-field metadata are author-private derived material under the same firewall as
   bodies. They are returned **only** from the repository's list response consumed by
   `/api/notes`; no value enters validation/readiness/working-set/compiler/any prompt.
   Enforcement is proven by SPEC029PRINOTUSA-005. Snippets are direct excerpts, never
   summaries — no LLM intermediary, so determinism (§8) is unaffected.
5. Schema extension: `StoryNoteSummary` gains `mode` plus `relevance`/`titleHighlight`/
   `bodySnippet`/`matchedTags` as a list-response type, **not** on `StoryNote`. Additive;
   its only consumer is `listNotes`/`/api/notes`. §20 change rationale: the in-memory
   substring search is removed (not aliased) because FTS5 is now the only search engine —
   no hidden fallback to load-all-bodies (a missing FTS5 build is the 001 migration error).

## Architecture Check

1. Evolving `StoryNotesRepository` in place (no parallel note authority) keeps one storage
   owner. A tested literal query builder escapes FTS operators (`OR`/`NOT`/quotes/column
   selectors/punctuation) so user terms are literal phrases — a correctness requirement, not
   only injection hardening — and short-term `instr()`/`LIKE` covers trigram's ≥3-char floor.
2. No backwards-compatibility shim: the old `includesQuery`/`searchRank` path is deleted, not
   kept as a fallback; divergent search implementations are explicitly disallowed.

## Verification Layers

1. Weighted relevance + deterministic tie-break -> repository test (title>tags>body bm25,
   stable secondary order).
2. FTS-operator literalization + short-term fallback -> repository test (`OR`/`NOT`/quotes
   treated as literals; 1/2-char queries via `instr()`/`LIKE`; mixed-length narrowing).
3. Exact multi-tag AND from authoritative row -> repository test (normalized values, repeated
   `tag` ⇒ AND).
4. Safe snippet markers -> repository test (inert start/end marker tokens, no HTML).

## What to Change

### 1. FTS5 search in `StoryNotesRepository`

- Replace `includesQuery`/`searchRank`/load-all with: select only needed columns; when `q`
  is non-empty, query `story_notes_fts` via the tested literal query builder with bm25
  weights (title highest, tags next, body baseline); `relevance` sort default while `q`
  active, else the existing default sort. Trigram FTS for all-≥3-char queries; parameterized
  `instr()` short-term fallback for 1–2-char terms; mixed-length narrows on long terms.
- Apply `mode=all|scratch|scene-prep` and repeated-`tag` exact AND filters using normalized
  values from the authoritative `story_notes` row (not the FTS `tags` column).
- Return inert start/end highlight marker tokens (never DB-provided HTML) plus `relevance`,
  `titleHighlight`, `bodySnippet`, `matchedTags` on the list-response type; add `mode` to
  `StoryNoteSummary` and to `summarize`.

### 2. Tag-list rebuild

- Reimplement the tag-list helper without loading every body, returning normalized tag counts.

## Files to Touch

- `packages/server/src/story-notes-repository.ts` (modify)
- `packages/server/src/story-notes-repository.test.ts` (modify)

## Out of Scope

- Clip capture/reorder/batch-delete + explicit cascade/null (SPEC029PRINOTUSA-003).
- HTTP routes, query-param parsing, web client types (SPEC029PRINOTUSA-004).
- React highlight rendering from marker tokens (SPEC029PRINOTUSA-006).
- Any note participation in validation/working-set/compiler/prompt surfaces.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/server -- story-notes-repository` — weighted relevance with
   deterministic tie-break; FTS operators literalized; trigram + 1/2-char fallback; exact
   multi-tag AND; safe snippet markers; trigger-synced index returns expected rows.
2. A query containing `OR`/`NOT`/`"`/`:` returns the literal-match rows, never an FTS parse
   error or operator interpretation.
3. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. FTS5 is the only search engine — no code path returns to load-all-bodies search.
2. `relevance`/snippet/highlight/`matchedTags` exist only on the list-response type, never on
   `StoryNote`, and are emitted only through the repository's list result.

## Test Plan

### New/Modified Tests

1. `packages/server/src/story-notes-repository.test.ts` — relevance ranking, literal escaping, trigram + short-term fallback, multi-tag AND, snippet markers, tag-count rebuild.

### Commands

1. `npm test --workspace @loom/server -- story-notes-repository`
2. `npm run typecheck && npm run lint && npm test && npm run build`

## Outcome

Completed: 2026-06-22

Changed:
- Replaced the old `includesQuery` / `searchRank` / `allNotes()` search path with SQL-backed search over `story_notes_fts` for long terms and parameterized `instr()` predicates for 1–2 character terms.
- Added literal FTS phrase construction so operator-like text such as `OR`, `NOT`, quotes, and column punctuation is treated as note text rather than query syntax.
- Added `mode`, `relevance`, inert marker highlights, body snippets, and `matchedTags` to repository list summaries only.
- Added multi-tag AND filtering from parsed authoritative `story_notes.tags_json`, plus `mode` filtering.
- Rebuilt tag listing to read only `tags_json`, and added a tag-count helper while preserving the existing `listTags()` string API.
- Expanded repository tests for weighted title/tag/body relevance, literal operators, short and mixed query fallback, multi-tag AND, mode filtering, trigger-synced FTS updates, safe marker snippets, and tag counts.

Deviations:
- The public route/client query parsing remains for SPEC029PRINOTUSA-004, so repeated HTTP `tag` params are not exposed yet. The repository now accepts `tag: string | string[]`.
- The existing `listTags()` return shape is preserved for current callers; count data is available through `listTagCounts()` for later UI/API work.

Verification:
- `npm test --workspace @loom/server -- story-notes-repository` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed, 158 files / 1681 tests.
- `npm run build` — passed; Vite emitted the pre-existing large chunk warning.
