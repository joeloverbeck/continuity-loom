# SPEC024REMSTOCON-002: Strip legacy `prose_preferences` from stored STORY CONTRACT payloads across both storage surfaces

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — extends `migrateGlobalConfigRecords` (`packages/server/src/global-config-migration.ts`) to strip the `prose_preferences` key from stored STORY CONTRACT payloads on both storage surfaces; updates 10 `@loom/server` test fixtures and adds migration + open-path regressions. No change to prompt compilation, validation gating, or any prompt-facing surface; runtime behavioral delta is limited to legacy stored payloads loading cleanly under the tightened schema.
**Deps**: SPEC024REMSTOCON-001

## Problem

SPEC024REMSTOCON-001 removes `prose_preferences` from the `.strict()` `storyContractSchema`. Stored STORY CONTRACT payloads that still carry the key would then fail to parse — and the stored data lives in **two** distinct locations, only one of which the existing migration reaches:

- **Live `story_config` table rows (the common case).** Read on every access via `record-repository.ts:348` `getStoryConfig` → `:357 parseJsonWithSchema(row.payload_json, storyContractSchema, …)`, which parses against the strict schema. `migrateGlobalConfigRecords` does **not** rewrite these rows — it preserves any pre-existing `story_config` row untouched (proven by `global-config-migration.test.ts:160-173`). So a legacy payload here would make `getStoryConfig` fail and the STORY CONTRACT fail to load for existing projects.
- **Orphan `records`-table rows (pre-global-config-migration projects).** `migrateGlobalConfigRecords` migrates these into `story_config`, parsing each against the strict schema at `global-config-migration.ts:128` *before* insert; a legacy orphan carrying `prose_preferences` would be pushed to `malformedRecordIds` and silently dropped.

Without stripping both surfaces, the schema tightening is a stored-data load-failure / data-loss regression (FOUNDATIONS §24 local-first integrity). This ticket strips `prose_preferences` from both, idempotently.

## Assumption Reassessment (2026-06-19)

1. **`migrateGlobalConfigRecords` shape confirmed** (`packages/server/src/global-config-migration.ts:106-175`, read 2026-06-19): it `selectOrphanRows` from `records`, groups/sorts, and for each kind parses the chosen orphan (`:128 storyConfigSchemas[kind].parse(payload)`), inserting into `story_config` only when `hasStoryConfig` is false (`:135`). It is invoked at `packages/server/src/project-store.ts:284` (create) and `:391` (open), runs before `RecordRepository` is used, and is idempotent (`global-config-migration.test.ts:194-211`). **Rationale for changing it (no silent retcon, §20):** the schema removal in 001 makes its current strict parse reject legacy payloads; the function must align stored data to that removal.
2. **Read path is strict** (`record-repository.ts:348-357`): `getStoryConfig` parses `story_config` rows against `storyContractSchema`; `setStoryConfig` (`:337-345`) also parses on write. Schema-authoritative source for the field set: `docs/story-record-schema.md` (updated in 001). The strip must operate on **raw JSON** (delete the `prose_preferences` key before any strict parse), because parsing a legacy payload against the post-001 schema would itself throw.
3. **Cross-artifact boundary under audit:** the `story_config` SQLite table and the `records`-table orphan path — the two transport paths for a stored STORY CONTRACT payload. Canonical end-state: both paths yield a payload with no `prose_preferences` key that parses cleanly under the post-001 `storyContractSchema`. This ticket `Deps` on 001 because the strip's correctness is defined relative to the tightened schema (create-then-modify ordering at the contract level).
4. **FOUNDATIONS principle restated:** §24 (local-first, user-owned data) — existing projects must keep loading and must not lose data; the strip removes only the dead key and preserves every surviving field. §11 is untouched: no validation gate is added or weakened (the strip is a storage-normalization step, not a readiness check).
5. **Fail-closed / determinism / secret-firewall check:** the migration runs before validation on open; the strip is a deterministic raw-key delete scoped to STORY CONTRACT rows only. It touches no SECRET/POV record, no prompt compilation, and no generation-time field, so it cannot leak a secret (§15) or introduce nondeterminism (§8). It must stay idempotent so repeated opens converge (a second run finds no `prose_preferences` and writes nothing).

## Architecture Check

1. A one-time idempotent rewrite of stored data (option (a) from the reassessment) is cleaner than a permanent strip-on-read shim in `getStoryConfig`: it leaves stored payloads schema-clean and keeps the read path a plain strict parse, consistent with the existing migration architecture (`migrateGlobalConfigRecords`, `migrateStoreFromV1ToV2`) that runs every open. Extending `migrateGlobalConfigRecords` in place keeps the existing `project-store.ts:284,391` call sites unchanged (vs. wiring a new function); a dedicated `stripRemovedStoryContractFields` is an equally valid factoring left to the implementer, provided both surfaces are covered and it is invoked at both call sites.
2. No backwards-compatibility shim is introduced — the dead key is deleted from storage, not tolerated on read. The strip is migration-time normalization, not an alias path.
3. **Co-landing constraint:** lands in the **same revision** as SPEC024REMSTOCON-001 (and -003); must not merge standalone (the strip is defined against 001's tightened schema, and the server suite is red until 001 lands).

## Verification Layers

1. A live `story_config` STORY CONTRACT row carrying legacy `prose_preferences` loads cleanly and stripped through the project-open / `getStoryConfig` path → server open-path test (`project-store.test.ts`) — §24 stored-data integrity.
2. An orphan `records` STORY CONTRACT row carrying `prose_preferences` migrates into `story_config` (stripped) rather than being dropped as malformed → `global-config-migration.test.ts`.
3. The strip is idempotent: a second migration run on already-clean rows is a no-op → extend the existing idempotency test.
4. The strip touches no secret/POV/compiler surface → manual review (raw key delete scoped to STORY CONTRACT; no SECRET record, prompt, or generation-time field referenced).

## What to Change

### 1. Strip pass over live `story_config` rows (`global-config-migration.ts`)

Within `migrateGlobalConfigRecords` (before/independent of the orphan move), read the raw `payload_json` of the `story_config` STORY CONTRACT row, `JSON.parse` it, and if a `prose_preferences` key is present, delete it and `UPDATE story_config` with the rewritten JSON. Skip the write when the key is absent (idempotent). Operate on raw JSON — do **not** strict-parse the legacy payload first.

### 2. Pre-parse strip on the orphan path (`global-config-migration.ts`)

Before `storyConfigSchemas[kind].parse(payload)` at line 128, when `kind === "STORY CONTRACT"`, delete any `prose_preferences` key from the parsed-from-JSON payload object so the orphan validates and migrates instead of landing in `malformedRecordIds`.

### 3. Server test fixtures + regressions

Drop the `prose_preferences` block from each `@loom/server` STORY CONTRACT test fixture (see Files to Touch). Update `global-config-migration.test.ts`'s `storyContractPayload` and the "preserves existing story_config" expectation. Add: (b) an open-path regression in `project-store.test.ts` — a `story_config` STORY CONTRACT row seeded with a legacy `prose_preferences` block opens successfully and `getStoryConfig` returns the stripped payload; (c) a migration regression in `global-config-migration.test.ts` — an orphan STORY CONTRACT row carrying `prose_preferences` migrates into `story_config` stripped (not in `malformedRecordIds`).

## Files to Touch

- `packages/server/src/global-config-migration.ts` (modify)
- `packages/server/src/global-config-migration.test.ts` (modify — fixture + orphan-strip regression (c))
- `packages/server/src/project-store.test.ts` (modify — open-path regression (b))
- `packages/server/src/generate-routes.test.ts` (modify)
- `packages/server/src/phase4-gate.e2e.test.ts` (modify)
- `packages/server/src/validation-routes.test.ts` (modify)
- `packages/server/src/compile-routes.test.ts` (modify)
- `packages/server/src/story-config-routes.test.ts` (modify)
- `packages/server/src/ideate-routes.test.ts` (modify)
- `packages/server/src/generate-routes.secret-leakage.test.ts` (modify)
- `packages/server/src/generation-brief-draftability.e2e.test.ts` (modify)

## Out of Scope

- The `@loom/core` schema/validation/guidance/demo removal and authority docs — SPEC024REMSTOCON-001.
- Story-config UI / `EnumGuidance` removal — SPEC024REMSTOCON-003.
- Any change to PROSE MODE storage or the `migrateStoreFromV1ToV2` version migration.
- Introducing a strip-on-read shim in `getStoryConfig` (rejected in favor of one-time storage normalization).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/server` — green after fixtures updated.
2. Open-path regression (b): opening a project whose `story_config` STORY CONTRACT row contains a legacy `prose_preferences` block succeeds and `getStoryConfig` returns the payload with the key removed.
3. Migration regression (c): an orphan STORY CONTRACT row with `prose_preferences` appears in `movedKinds` (stripped), not `malformedRecordIds`; rerunning the migration is a no-op (idempotent).

### Invariants

1. After migration, no stored STORY CONTRACT payload (either surface) contains a `prose_preferences` key, and each parses cleanly under the post-001 `storyContractSchema`.
2. Every surviving STORY CONTRACT field is preserved unchanged by the strip; no SECRET/POV/prompt surface is read or written.

## Test Plan

### New/Modified Tests

1. `packages/server/src/project-store.test.ts` — open-path regression (b): seed a `story_config` row with legacy `prose_preferences`, open, assert stripped load.
2. `packages/server/src/global-config-migration.test.ts` — update `storyContractPayload` + "preserves existing" expectation; add orphan-strip regression (c) and a strip-idempotency assertion.
3. The remaining 8 server fixtures — drop the `prose_preferences` STORY CONTRACT block.

### Commands

1. `npm test --workspace @loom/server`
2. `npm run typecheck`
3. `grep -rn "prose_preferences" packages/server/src && echo FAIL || echo OK` — targeted; repo-wide sweep is the capstone (SPEC024REMSTOCON-004).
