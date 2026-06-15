# SPEC023AUTPRISTO-003: `story_notes` table, schema v1→v2 bump, and forward migration

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — bumps `LOOM_SCHEMA_VERSION` 1→2, adds `story_notes` DDL + indexes (new-project create path and existing-project migration path), adjusts the open-project compatibility order; behavior change: existing v1 projects migrate to v2 on open
**Deps**: 001

## Problem

Author-private notes are per-project state stored beside `story_config` and `generation_session`. New projects must create a `story_notes` table; existing schema-version-1 projects must gain it through a forward migration on open. This is a project-store schema evolution (`LOOM_SCHEMA_VERSION` 1→2). The current open-project flow rejects any store whose `user_version` is below the app version *before* a migration can run, so the rejection order must be adjusted for the sanctioned v1→v2 forward migration — without weakening rejection of genuinely incompatible (newer) stores or introducing any compatibility alias.

## Assumption Reassessment (2026-06-15)

1. All per-project tables (records, `record_references`, `story_config`, `generation_session`) are created in `packages/server/src/record-tables.ts` (`CREATE TABLE IF NOT EXISTS story_config` at `:33`, `generation_session` at `:39`) — so `story_notes` DDL belongs there, not in a new file. `LOOM_SCHEMA_VERSION` is defined at `packages/core/src/project-storage.ts:5` (currently `= 1`); `PRAGMA user_version` is stamped from it at `packages/server/src/project-store.ts:143`; metadata `schemaMinVersion` is written at `:231`.
2. SPEC-023 §"Schema version and migration" prescribes: bump to 2; new projects create `story_notes` + indexes at `user_version = 2`; existing v1 stores get a transactional `CREATE TABLE IF NOT EXISTS` migration, `PRAGMA user_version = 2`, and metadata `schemaMinVersion = 2` in the same boundary; idempotent; a migration test that preserves existing records/config/session.
3. **Cross-artifact boundary under audit**: the open-project compatibility seam is `evaluateStoreCompatibility(appSchemaVersion, storeUserVersion)` (`packages/core/src/project-storage.ts:55`) — returns `"incompatible-version"` when store > app, `"migration-required"` when store < app, `"ok"` when equal. It is consumed at `packages/server/src/project-store.ts:159` and `:335`; at `:335` a non-`"ok"` result currently returns a failure. After the bump, a v1 store yields `"migration-required"` and is rejected before any migration — this is the order this ticket adjusts. The earlier guard `metadata.schemaMinVersion !== storeUserVersion` (`:327`) stays satisfied because the migration updates both to 2 in the same boundary.
4. **FOUNDATIONS principle under audit (§24, §20)**: §24 local-first — the migration keeps the store local, inspectable, and intact. §20 / no-silent-retcon — the migration must not damage or rewrite existing records, `story_config`, or `generation_session`; it only adds `story_notes` and bumps versions.
5. **Enforcement-surface confirmation (compatibility gate; §8/§15)**: the order change adds *only* the sanctioned v1→v2 forward migration. It does not weaken safety — `"incompatible-version"` (a newer store than the app) still rejects, and no migration runs for any version below 1. No secret or nondeterminism path is introduced: the migration is pure DDL + pragma, deterministic, with no LLM and no prompt surface. No compatibility alias or duplicate schema authority path is added (FOUNDATIONS / CLAUDE.md conventions).
6. **Changed-constant blast radius (`LOOM_SCHEMA_VERSION` 1→2)**: repo-wide grep for produced assertions of the current value: `packages/server/src/record-layer.test.ts:97` hardcodes `{ user_version: 1 }` for a newly created store (breaks → update to 2); `packages/server/src/project-store.recoverability.test.ts:28-29` parametrizes `["incompatible-version", LOOM_SCHEMA_VERSION + 1]` and `["migration-required", LOOM_SCHEMA_VERSION - 1]` — the `"migration-required"` case (now `= 1`) must change from *rejected* to *successfully migrated*. Symbolic uses (`recoverability.test.ts:64` `toBe(LOOM_SCHEMA_VERSION)`) adapt automatically. The `project-store.taxonomy.test.ts:23` `writeMetadata(folderPath, schemaMinVersion = 1)` helper is reviewed: confirm whether its stores are opened expecting `"ok"` and update the default to match the migrated version if so.
7. **Adjacent contradiction classification**: the compatibility-rejection order is a **required consequence** of this ticket (the spec's Risk "schema-version migration order is currently too rigid" is in-scope), not a separate bug or follow-up.
8. **Mismatch + correction**: confirmed against the live code that `evaluateStoreCompatibility(2, 1)` returns `"migration-required"` and `:335` rejects it today; the migration-order adjustment is the corrected behavior, applied here.

## Architecture Check

1. Hosting `story_notes` DDL in `record-tables.ts` follows the established home for all per-project tables (the file already owns `story_config`/`generation_session`), avoiding a parallel DDL authority path. Running the v1→v2 migration inline in the open-project flow (gated on `"migration-required"` + `storeUserVersion === 1`) is cleaner than a separate migration framework for a single additive table.
2. No backwards-compatibility aliasing/shims: `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` make the migration idempotent without a legacy schema path; no duplicate version authority.
3. **Same revision; never merge standalone ahead of 001 (§1.1)** — co-lands with the FOUNDATIONS amendment.

## Verification Layers

1. New projects create `story_notes` (+ 3 indexes) at `user_version = 2` -> schema validation + test (`record-layer.test.ts` asserts `user_version: 2` and table presence).
2. A v1 store opens, gains `story_notes`, bumps `user_version` and metadata `schemaMinVersion` to 2 -> migration test (`story-notes-migration.test.ts`).
3. Migration runs before the compatibility rejection for v1 stores, while newer stores still reject -> manual review of the `:335` order + `recoverability.test.ts` cases.
4. No data damage: pre-existing records, `record_references`, `story_config`, `generation_session` rows/counts unchanged across migration -> test assertions in the migration test.
5. Migration is transactional and idempotent (re-open is a no-op) -> codebase grep-proof (`IF NOT EXISTS`) + test re-open assertion.

## What to Change

### 1. Bump the schema version

`packages/core/src/project-storage.ts`: `LOOM_SCHEMA_VERSION = 2`.

### 2. Add `story_notes` DDL

`packages/server/src/record-tables.ts`: add `CREATE TABLE IF NOT EXISTS story_notes (...)` and the three indexes (`story_notes_pinned_updated_idx`, `story_notes_title_idx`, `story_notes_updated_idx`) exactly per SPEC-023 §"SQLite table". This runs on the new-project create path.

### 3. Forward migration in the open-project flow

`packages/server/src/project-store.ts`: when `evaluateStoreCompatibility` returns `"migration-required"` and `storeUserVersion === 1` (app `= 2`), run a transactional migration before returning any compatibility failure — create `story_notes` + indexes, `PRAGMA user_version = 2`, update project metadata `schemaMinVersion = 2` in the same boundary — then proceed as a version-2 store. `"incompatible-version"` (newer-than-app) still rejects. No store below version 1 is migrated.

### 4. Update version assertions

- `packages/server/src/record-layer.test.ts`: `user_version` assertion `1` → `2`.
- `packages/server/src/project-store.recoverability.test.ts`: the `"migration-required"` (`LOOM_SCHEMA_VERSION - 1` = v1) case now expects a successful migrated open, not a rejection; `"incompatible-version"` (newer) still rejects.

### 5. New migration test

`packages/server/src/story-notes-migration.test.ts`: open a schema-version-1 fixture, assert `story_notes` exists, `user_version`/`schemaMinVersion` are 2, and pre-existing records/config/session are unchanged; re-open to assert idempotence.

## Files to Touch

- `packages/core/src/project-storage.ts` (modify)
- `packages/server/src/record-tables.ts` (modify)
- `packages/server/src/project-store.ts` (modify)
- `packages/server/src/record-layer.test.ts` (modify)
- `packages/server/src/project-store.recoverability.test.ts` (modify)
- `packages/server/src/story-notes-migration.test.ts` (new)

## Out of Scope

- `StoryNotesRepository` and CRUD/search (ticket 004) — this ticket only creates/migrates the table.
- `/api/notes` routes (005), web client/UI (006–008).
- FTS5 virtual tables / search-index migration (SPEC-023 §Out of Scope).
- Any migration path other than the forward v1→v2 (no v0, no downgrade, no compatibility alias).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/server` — `story-notes-migration.test.ts` passes (v1 fixture → `story_notes` present, versions = 2, records/config/session preserved, idempotent re-open).
2. `npm test --workspace @loom/server` — `record-layer.test.ts` (`user_version: 2`) and `project-store.recoverability.test.ts` (migration-required → migrated; incompatible-version → rejected) pass.
3. `npm run typecheck` and `npm run build` succeed with the bumped schema version.

### Invariants

1. Opening a v1 store never rejects with `"migration-required"`; opening a store newer than the app version always rejects with `"incompatible-version"`.
2. The migration adds only `story_notes` (+ indexes) and the version bumps; it mutates no existing record, reference, config, or session row.

## Test Plan

### New/Modified Tests

1. `packages/server/src/story-notes-migration.test.ts` (new) — forward-migration correctness, data preservation, idempotence.
2. `packages/server/src/record-layer.test.ts` (modify) — new-store `user_version` is 2.
3. `packages/server/src/project-store.recoverability.test.ts` (modify) — compatibility-model expectations under the bump.

### Commands

1. `npm test --workspace @loom/server -- story-notes-migration`
2. `npm test --workspace @loom/server`
3. `npm run typecheck && npm run build`

## Outcome

Completed: 2026-06-15

What changed:
- Bumped `LOOM_SCHEMA_VERSION` from 1 to 2.
- Added `story_notes` table DDL plus pinned/updated, title, and updated indexes to the existing per-project table authority.
- Added a narrow `ensureStoryNoteTables()` helper and v1-to-v2 open-project migration path that creates `story_notes`, stamps SQLite `user_version = 2`, and updates project metadata `schemaMinVersion = 2`.
- Preserved newer-store rejection and below-v1 rejection behavior while allowing schema-version-1 stores to migrate on open.
- Updated version-sensitive server tests and added `packages/server/src/story-notes-migration.test.ts` for table creation, version stamps, existing row preservation, and idempotent reopen.

Deviations:
- None. The migration is limited to the sanctioned v1-to-v2 path and adds only `story_notes` plus indexes and version metadata.

Verification:
- `npm test --workspace @loom/server -- story-notes-migration` passed.
- `npm test --workspace @loom/server` passed: 42 files, 221 tests.
- `npm run typecheck` passed across core, server, and web workspaces.
- `npm run build` passed across workspaces; Vite reported the pre-existing large chunk warning.
