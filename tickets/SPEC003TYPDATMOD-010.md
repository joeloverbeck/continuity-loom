# SPEC003TYPDATMOD-010: Record-table DDL initializer + create/open lifecycle wiring

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `@loom/server` module `ensureRecordTables` (5 tables); `packages/server/src/project-store.ts` modified to invoke it on both the create and open lifecycle paths.
**Deps**: None

## Problem

The store today holds zero record tables — `configureDatabase` (`packages/server/src/project-store.ts:130`) sets PRAGMAs only. Phase 3 needs the five record tables (`records`, `record_references`, `story_config`, `generation_session`, `accepted_segments`) created idempotently under the current baseline `user_version`, with `accepted_segments` physically distinct from `records`. The reassessment (this session) established that the tables must be ensured on **both** create and open — `configureDatabase` runs only in `createProject` today, so wiring DDL solely there would leave any project opened without going through create with no tables.

## Assumption Reassessment (2026-06-05)

1. `configureDatabase` (`packages/server/src/project-store.ts:130`) is called only from `createProject` (line ~235), NOT from `openProject` (lines ~251–342, which reads PRAGMAs for validation but never re-configures). Confirmed by reading the file this session. Therefore the table-ensure must be a dedicated step invoked from both paths, not folded into create-only `configureDatabase`.
2. `LOOM_SCHEMA_VERSION = 1` (`packages/core/src/project-storage.ts:5`) is the baseline `user_version`; this ticket adds NO version bump and NO migration runner (SPEC-003 scope decision 1). `openProject` enforces `metadata.schemaMinVersion === storeUserVersion` (line ~309), so user_version must stay 1.
3. Shared boundary under audit: `project-store.ts` `ActiveProject` lifecycle and the `DatabaseSync` handle (`node:sqlite`). `configureDatabase` sets `PRAGMA foreign_keys = ON` (line 135) — `record_references.target_id` must therefore be a plain column, NOT a `FOREIGN KEY` (SPEC-003 §Approach; referential integrity is the app-level policy in ticket 011).
4. FOUNDATIONS §10/§21/§29.8 (accepted prose archive separated) motivates the `accepted_segments` table: it must be physically distinct from `records` with no shared compiler-input query path. §24 (local-first, inspectable) motivates canonical JSON payloads readable by ordinary SQLite tooling. Restated: Phase 3 creates the distinct, mostly-empty tables; it does not fill or query them as prompt input.
5. Touches deterministic-compilation surface? No — no compiler exists. Secret firewall (§15) untouched (no POV/secret logic; tables hold no key fields). The change is additive table creation + a second call site for an idempotent initializer.

## Architecture Check

1. A dedicated `ensureRecordTables(db)` (separate from `configureDatabase`) invoked from both `createProject` and `openProject` is cleaner than re-running full `configureDatabase` on open (which would re-issue identity PRAGMAs unnecessarily) and guarantees tables for any opened store, including one created before the tables existed.
2. No backwards-compatibility shims — `CREATE TABLE IF NOT EXISTS` is idempotent forward-only DDL, not a migration alias.

## Verification Layers

1. Five tables exist after `createProject` AND after `openProject` on a store lacking them -> server integration test (`vitest`) inspecting `sqlite_master`.
2. `application_id`/`user_version` unchanged from SPEC-002 baseline after ensure -> integration test reading both PRAGMAs (user_version === 1).
3. `accepted_segments` is a distinct table from `records` -> grep-proof of DDL + schema inspection (no shared table).
4. `record_references.target_id` is not a SQL foreign key -> grep-proof of the DDL (no `FOREIGN KEY ... target_id`).

## What to Change

### 1. `ensureRecordTables` module

Add `packages/server/src/record-tables.ts`: `ensureRecordTables(db: DatabaseSync): void` issuing `CREATE TABLE IF NOT EXISTS` for `records` (`id` TEXT PK, `type`, `display_label`, `status` NULL, `salience` NULL, `urgency` NULL, `archived` INTEGER, `user_order` INTEGER NULL, `created_at`, `updated_at`, `payload_json` TEXT), `record_references` (`from_record_id`, `ref_role`, `target_id`; indexed; `target_id` NOT a FK), `story_config` (keyed by config kind), `generation_session` (JSON state), `accepted_segments` (append-only ordered text + metadata). No `user_version` bump.

### 2. Lifecycle wiring

Modify `packages/server/src/project-store.ts`: call `ensureRecordTables(database)` in `createProject` (after `configureDatabase`) and in `openProject` (after compatibility validation passes, before `active` is set).

## Files to Touch

- `packages/server/src/record-tables.ts` (new)
- `packages/server/src/project-store.ts` (modify — call `ensureRecordTables` on create + open)
- `packages/server/src/record-tables.test.ts` (new)

## Out of Scope

- The typed `recordRepository` (CRUD, projections, integrity) — ticket 011.
- Singleton/session/accepted-segment accessors — ticket 012.
- Migration runner / `user_version` evolution — deferred (SPEC-002).
- Filling `accepted_segments` — Phase 11.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/server` — five tables present after create and after opening a store that lacked them; `user_version` === 1; `accepted_segments` distinct from `records`.
2. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. `ensureRecordTables` is idempotent (`CREATE TABLE IF NOT EXISTS`) and invoked on both create and open; no `user_version` bump.
2. `record_references.target_id` is a plain indexed column, not a `FOREIGN KEY` (compatible with `PRAGMA foreign_keys = ON`).

## Test Plan

### New/Modified Tests

1. `packages/server/src/record-tables.test.ts` — table presence after create + after open-without-tables; PRAGMA invariance; FK-absence grep; accepted_segments distinctness.

### Commands

1. `npm test --workspace @loom/server`
2. `npm run typecheck && npm run lint && npm test && npm run build`
