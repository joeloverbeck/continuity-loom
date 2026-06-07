# CONFIGDEDUP-001: Migrate orphaned global-config records into the story_config store

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new server migration (`packages/server/src/`), wired into project open/create in `packages/server/src/project-store.ts`. No schema-shape change to `story_config` or `records` tables.
**Deps**: None. (CONFIGDEDUP-002 depends on this ticket.)

## Problem

`STORY CONTRACT`, `UNIVERSAL CONTENT POLICY`, and `PROSE MODE` are registered both as **story-record types** (via `globalConfigDefinitions`) and as **per-story configuration** (the `story_config` table behind `/story-config`). The deterministic compiler and validator read **only** `story_config`; records of those three types are stored but never compiled.

The first production project (`/home/joeloverbeck/stories/red-bunny`) is already in the failure state this creates. Verified live against the running app:

- `records` table holds **1 `STORY CONTRACT` + 1 `UNIVERSAL CONTENT POLICY`** record (the user's authored work).
- `GET /api/story-config/{kind}` returns **404 for all three kinds** — the store the compiler reads is empty.
- `POST /api/compile` **blocks** with `missing-story-config` reported three times.

The user's authored contract and policy are stranded in a dead path; the live path is empty; generation is blocked. Before CONFIGDEDUP-002 removes the record-type registration, this authored data must be moved into `story_config` so it is not lost and so generation becomes unblocked. This ticket is the data-preservation half of the fix; CONFIGDEDUP-002 is the de-registration half.

This is a one-time, idempotent local-data migration. It aligns with FOUNDATIONS §24 (local-first, do not damage user-owned project data) and §6 (keep the five continuity surfaces distinct).

## Assumption Reassessment (2026-06-07)

1. **Both transport paths exist today, and only one is live.** Record path: `globalConfigDefinitions` (`packages/core/src/records/global-config.ts:57-78`) → registry spread (`packages/core/src/records/registry.ts:25-26`) → `recordTypes` (`registry.ts:39`) → stored in `records` table via `RecordRepository.createRecord` (`packages/server/src/record-repository.ts:148`). Config path: `/api/story-config/:kind` (`packages/server/src/story-config-routes.ts`) → `RecordRepository.setStoryConfig` (`record-repository.ts:300`) → `story_config` table (`packages/server/src/record-tables.ts:33-37`). The compiler reads only the config path: `snapshot-builder.ts` `loadStoryConfig()` → `repository.getStoryConfig()` → `SELECT … FROM story_config` (`record-repository.ts:311-321`); compiler resolvers in `packages/core/src/compiler/sections/front.ts` read exclusively from `snapshot.storyConfig`.
2. **`docs/FOUNDATIONS.md` §24** mandates local-first, user-owned, non-destructive data handling; §13's atomic-record enumeration deliberately omits these three kinds, confirming the config path is canonical and the record path is the erroneous duplicate. `docs/compiler-contract.md:24` already frames these as "Story configuration", sourced from the config objects, not from selectable records.
3. **Shared boundary under audit:** the `story_config` table and the `records` table within one project SQLite database. The migration reads rows of type `STORY CONTRACT` / `UNIVERSAL CONTENT POLICY` / `PROSE MODE` from `records` and writes them as `story_config` rows keyed by kind. The two tables share no foreign keys; the only coupling is the three Zod payload schemas, which are identical on both sides (`storyContractSchema`, `universalContentPolicySchema`, `proseModeSchema` from `@loom/core`).
4. **FOUNDATIONS principle restated:** §24 local-first/user-owned data — migrating rather than discarding the authored payloads is required to satisfy "do not damage project data." §6 five-surfaces — config must live on the config surface, not the all-records surface.
5. **Removal/refactor blast radius (information-path refactor):** after CONFIGDEDUP-002 de-registers the three types, `parseRecordPayload` (`packages/core/src/records/registry.ts:45-53`) throws `Unsupported record type` for them, and `RecordRepository.getRecord` (`record-repository.ts:251-275`) / `listRecords` (`record-repository.ts:277-288`) call `parseRecordPayload` on every row (`record-repository.ts:261`). Therefore the migration **must read orphan rows via raw SQL** (`SELECT id, type, payload_json FROM records WHERE type IN (...)`), not via `getRecord`/`listRecords`, so it remains correct whether it runs before or after de-registration. The canonical end-state transport path for these three facts is `story_config` only.
6. **Adjacent contradiction classification:** the misleading `compile-destinations.ts` mapping and the `/records` create buttons are **required consequences** addressed by CONFIGDEDUP-002 (de-registration), not by this ticket. This ticket is data migration only.

## Architecture Check

1. A one-time idempotent migration at project-open is cleaner than: (a) leaving authored data stranded (breaks §24 and blocks red-bunny), or (b) a manual re-entry flow (forces the user to retype already-authored config, and silently abandons the existing rows). Reading via raw SQL keeps the migration independent of the registry, so it is correct regardless of CONFIGDEDUP-002 ordering and cannot be bricked by de-registration.
2. No backwards-compatibility aliasing or shims are introduced. The migration deletes the orphan record rows after moving them; it does not leave a dual-write or sync path. After migration, `story_config` is the single authority — no duplicate transport path remains.

## Verification Layers

1. Orphan global-config records are moved, not lost → schema validation (each moved payload validates against `storyContractSchema` / `universalContentPolicySchema` / `proseModeSchema`) + codebase grep-proof (post-migration `SELECT count(*) FROM records WHERE type IN ('STORY CONTRACT','UNIVERSAL CONTENT POLICY','PROSE MODE')` is 0; `story_config` has the corresponding kinds).
2. Migration never overwrites a config the user already set on `/story-config` → manual review + test (pre-seed `story_config` for a kind, plus an orphan record of the same kind; assert the existing `story_config` row is preserved and the orphan is deleted).
3. Migration is idempotent and safe on projects with no orphans → test (run twice; second run is a no-op; projects with zero orphan records open unchanged).
4. red-bunny becomes compilable for the migrated kinds → FOUNDATIONS alignment check (§24) + manual review (after open, `GET /api/story-config/STORY CONTRACT` and `… /UNIVERSAL CONTENT POLICY` return 200; `missing-story-config` for those two no longer appears in `/api/compile` validation).

## What to Change

### 1. New migration module

Add `packages/server/src/global-config-migration.ts` exporting a function, e.g. `migrateGlobalConfigRecords(database: DatabaseSync): { movedKinds: string[]; deletedRecordIds: string[] }`. Behavior:

- `SELECT id, type, payload_json, updated_at FROM records WHERE type IN ('STORY CONTRACT','UNIVERSAL CONTENT POLICY','PROSE MODE')` (raw SQL — do **not** use `listRecords`/`getRecord`, which parse via the registry).
- Group rows by `type`. If multiple rows share a type, pick the most recent deterministically (highest `updated_at`, tie-broken by `id`) and treat the others as additional orphans to delete.
- For each kind, parse the chosen `payload_json` against the matching schema from `@loom/core` (`storyContractSchema` / `universalContentPolicySchema` / `proseModeSchema`).
  - If parsing succeeds **and** `story_config` has no existing row for that kind (`SELECT 1 FROM story_config WHERE kind = ?`), upsert it into `story_config` (mirror the `setStoryConfig` SQL in `record-repository.ts:300`).
  - If `story_config` already has that kind, do **not** overwrite — the `/story-config` value wins.
  - If parsing fails, leave the row in place and do not delete it (surface via the returned summary / a server log line without payload contents).
- Delete every successfully-handled orphan record row (the chosen migrated row and any duplicate same-type rows whose superseded payload was discarded) inside a single transaction with the upserts.
- Idempotent: a project with no matching rows performs no writes.

### 2. Wire the migration into project open/create

In `packages/server/src/project-store.ts`, call `migrateGlobalConfigRecords(database)` immediately after `ensureRecordTables(database)` in **both** store-creation paths (`project-store.ts:244` and `project-store.ts:340`), before the `RecordRepository` is handed out. `ensureRecordTables` already runs on every open and is idempotent; the migration sits in the same idempotent init step.

## Files to Touch

- `packages/server/src/global-config-migration.ts` (new)
- `packages/server/src/project-store.ts` (modify — invoke migration after `ensureRecordTables` in both paths)
- `packages/server/src/global-config-migration.test.ts` (new)

## Out of Scope

- De-registering the three types from the record registry, removing the `/records` create buttons, and fixing the `compile-destinations.ts` preview mapping — **CONFIGDEDUP-002**.
- Any change to the `story_config` or `records` table schemas.
- Any UI surface (no React changes).
- Backfilling `PROSE MODE` for red-bunny — none was authored on either path; the migration simply finds no `PROSE MODE` orphan and leaves the kind unset (validation will still correctly report it missing until the user authors one on `/story-config`).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -w @loom/server` — new `global-config-migration.test.ts` covers: move single orphan per kind; multiple same-type rows collapse to most-recent; existing `story_config` row is preserved (orphan still deleted); unparseable orphan retained; idempotent re-run; empty-project no-op.
2. `npm test` — full suite (builds `@loom/core` first) stays green; no regression in `project-store`, `story-config-routes`, `compile-routes`, or `snapshot-builder` tests.
3. `npm run lint && npm run typecheck` — clean.

### Invariants

1. After opening any project, `records` contains zero rows of type `STORY CONTRACT`, `UNIVERSAL CONTENT POLICY`, or `PROSE MODE`.
2. A pre-existing `story_config` value for a kind is never overwritten by the migration; the `/story-config`-authored value is authoritative.
3. No authored global-config payload is deleted without first being written into `story_config` (or retained in place if it fails schema parse).

### Tests That Must Pass (manual, red-bunny)

1. Open `/home/joeloverbeck/stories/red-bunny`; confirm `GET /api/story-config/STORY CONTRACT` and `GET /api/story-config/UNIVERSAL CONTENT POLICY` return 200 with the previously record-stored payloads, and `/api/compile` no longer reports `missing-story-config` for those two kinds.

## Test Plan

### New/Modified Tests

1. `packages/server/src/global-config-migration.test.ts` — direct unit tests of the migration against an in-memory/temp SQLite database for each branch above.
2. `packages/server/src/project-store.test.ts` (modify if present) — assert the migration runs on open and create paths and that opened repositories expose migrated config via `getStoryConfig`.

### Commands

1. `npm test -w @loom/server`
2. `npm test`
3. Narrow boundary rationale: migration logic is pure SQLite-on-`DatabaseSync`, so the `@loom/server` package suite is the correct proof surface; the full `npm test` run guards cross-package wiring (snapshot/compile) after the data move.
