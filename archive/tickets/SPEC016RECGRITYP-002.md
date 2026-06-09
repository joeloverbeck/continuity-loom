# SPEC016RECGRITYP-002: `displayValues` summary projection

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — extends `RecordMetadata` (`packages/core/src/records/metadata.ts`) with an optional `displayValues`; wires the server `metadata(...)`/detail projection (`packages/server/src/record-routes.ts`) to emit it via the core manifest; extends web `RecordSummary`/`RecordDetail` (`packages/web/src/api.ts`). Additive-only; no existing field changes type.
**Deps**: SPEC016RECGRITYP-001

## Problem

The grid can only read the fields the summary metadata carries today (`metadata.ts:3–16`: `id, type, displayLabel, status?, salience?, urgency?, …`). To render type-specific columns, the record summary must additionally carry the manifest-declared scalar/enum display values per record. The server already loads each record's full payload (`record-repository.ts:306–317` maps every row through `getRecord`) and then discards all but metadata (`record-routes.ts` `metadata(...)`), so this requires only a wider projection — **no new DB queries**.

## Assumption Reassessment (2026-06-09)

1. The server projection is `metadata(record: RecordRepositoryRecord)` in `packages/server/src/record-routes.ts` (returns `RecordMetadataResponse`); the repository record carries `payload` (used today by `textMatches` → `JSON.stringify(record.payload)`), so the projection can read payload fields without an extra query. The list path runs every row through this projection at `record-routes.ts` (`repo.listRecords(...).flatMap(...).filter(...textMatches...)`).
2. `RecordMetadata` is a `.strict()` zod schema (`metadata.ts:3–16`); its consumer is `packages/core/src/validation/snapshot.ts:7,18` (`metadata?: RecordMetadata`). Web `RecordSummary`/`RecordDetail` are at `packages/web/src/api.ts:132–147`, constructed by `GenerationBriefView.tsx`, `StoryConfigEditor.tsx`, `WorkingSetView.tsx`, and `*.test.tsx` fixtures.
3. Cross-artifact boundary under audit: the `RecordMetadata` schema (core) ↔ the server `metadata(...)` projection ↔ the web `RecordSummary` type. All three must agree that `displayValues` is **optional** so no existing construction site breaks.
4. Output-schema extension (per README §10 / `_TEMPLATE` item): `RecordMetadata` and web `RecordSummary` are extended with `displayValues?: Record<string, string | null>`. The extension is **additive-only / optional with no default required at construction** — every existing consumer (`snapshot.ts`, the three web views, the test fixtures) continues to type-check and run unchanged; only the records list/detail projection populates it. Required-vs-optional was resolved to optional during `/reassess-spec` this session precisely to bound this blast radius.
5. FOUNDATIONS principle under audit: §8/§4.4 deterministic compilation — `displayValues` is a read-only projection of existing user-authored payload fields fed only to the records browser. It introduces no new stored state, no mutation, and no path into prompt compilation (the compiler does not consume `RecordMetadata`). The enforcement is structural: `projectDisplayValues` lives in `@loom/core` and is called by the HTTP projection, never by the compiler.

## Architecture Check

1. Deriving `displayValues` from the shared core manifest (`projectDisplayValues`, SPEC016RECGRITYP-001) keeps the server projection declarative and guarantees server and web agree on which fields each type exposes. Emitting it from **both** the list `metadata(...)` and the single-record detail projection means a freshly-saved row (`toRecordSummary`, consumed in 003) is never blank until reload, without the web client re-implementing extraction.
2. No backwards-compatibility aliasing/shims: the field is a straightforward additive optional; no parallel/duplicate metadata path is introduced.

## Verification Layers

1. Optional additivity (existing consumers unaffected) -> codebase grep-proof that `displayValues` is declared optional in `metadata.ts` and `api.ts`; `npm run typecheck` proves no construction site breaks.
2. Projection correctness (manifest-declared values emitted, absent fields nulled, no extra DB access) -> server test in `record-routes.test.ts` asserting EMOTION → `affect_kind`/`intensity`, FACT → `fact_kind`/`scope`/`salience`.
3. Determinism / no-compiler-leak -> FOUNDATIONS alignment check: grep that `projectDisplayValues` is imported only by `record-routes.ts`, not by any compiler module.

## What to Change

### 1. Extend `RecordMetadata` (core)

In `packages/core/src/records/metadata.ts`, add `displayValues: z.record(z.string(), z.string().nullable()).optional()` to `recordMetadataSchema` (keeps `.strict()`; field optional).

### 2. Wire the server projection (server)

In `packages/server/src/record-routes.ts`, have `metadata(record)` call `projectDisplayValues(record.type, record.payload)` (imported from `@loom/core`) and include the result as `displayValues`. Apply the same to the single-record detail response so `RecordDetail` carries it. No new queries — read from the already-loaded `record.payload`.

### 3. Extend web types (web)

In `packages/web/src/api.ts`, add `displayValues?: Record<string, string | null>` to `RecordSummary` (inherited by `RecordDetail = RecordSummary & { payload }`).

## Files to Touch

- `packages/core/src/records/metadata.ts` (modify)
- `packages/server/src/record-routes.ts` (modify)
- `packages/server/src/record-routes.test.ts` (modify)
- `packages/web/src/api.ts` (modify)

## Out of Scope

- Building the manifest itself (SPEC016RECGRITYP-001).
- Rendering `displayValues` as columns / `toRecordSummary` passthrough in the React component (SPEC016RECGRITYP-003).
- Reference-field name resolution — deferred per spec §Out of Scope.
- Any change to prompt compilation, validation gating, working-set rules, or stored payload semantics — spec §Out of Scope.

## Acceptance Criteria

### Tests That Must Pass

1. `npx vitest run packages/server/src/record-routes.test.ts` — listing records emits `displayValues` per the manifest for representative types (EMOTION → `affect_kind`/`intensity`; FACT → `fact_kind`/`scope`/`salience`), nulls absent fields, and performs no additional DB access (same query count as before).
2. `npm run typecheck` — every existing `RecordSummary`/`RecordMetadata` construction site (snapshot, `GenerationBriefView`, `StoryConfigEditor`, `WorkingSetView`, test fixtures) still type-checks with the optional field.
3. `npm run lint && npm test` — full gates pass.

### Invariants

1. `displayValues` is optional on both `RecordMetadata` (core) and `RecordSummary` (web); no existing construction site is forced to populate it.
2. The projection adds zero new database queries (payload is already loaded).
3. `projectDisplayValues` is imported only by the HTTP record routes — never by any compiler module (no compilation-path leak).

## Test Plan

### New/Modified Tests

1. `packages/server/src/record-routes.test.ts` (modify) — assert the list/detail projection emits manifest-declared `displayValues` for EMOTION and FACT, nulls absent fields, and that no extra query is issued.

### Commands

1. `npx vitest run packages/server/src/record-routes.test.ts`
2. `npm test`
3. The server route test is the correct boundary because `metadata(...)` is server-side and exercises the manifest→projection seam against a real repository record; `npm test` then confirms core typecheck/boundary across packages.

## Outcome

Completed: 2026-06-09

What changed:
- Extended `RecordMetadata` with optional `displayValues?: Record<string, string | null>`.
- Added `displayValues` to the web `RecordSummary`/`RecordDetail` contract.
- Wired server list metadata plus get/create/update record responses to project display values through `projectDisplayValues(record.type, record.payload)`.
- Extended route tests for FACT and EMOTION display values and added a core metadata schema assertion for optional `displayValues`.

Deviations from original plan:
- Used `npm exec vitest -- ...` for targeted Vitest commands rather than `npx vitest ...`; the same affected test files were run.
- No query-count harness exists in the route tests; the no-extra-query invariant is enforced by the implementation shape and import sweep: the projection reads the already-loaded `record.payload` and does not call repository or database APIs.

Verification:
- `npm exec vitest -- run packages/core/test/records.test.ts packages/server/src/record-routes.test.ts` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed.
- `rg -n "projectDisplayValues" packages/core/src packages/server/src packages/web/src` — only core export/definition and `packages/server/src/record-routes.ts`; no compiler import.
