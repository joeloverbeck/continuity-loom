# WSINTEGRITY-001: Repair dangling active-working-set record references on project open

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new pure core helper (`packages/core/src/records/`), new server migration (`packages/server/src/`), wired into project open/create in `packages/server/src/project-store.ts`. No table-schema change.
**Deps**: None. (WSINTEGRITY-002 depends on this ticket for the shared core helper.)

## Problem

The production project `/home/joeloverbeck/stories/red-bunny` is in a broken state: `/generation-brief`, `/preview`, and `/generate` all show the on-screen error **`Record not found: 019e99c1-4157-79fc-a7f7-ea1d624471ba`**, and the page console reports the failing requests.

Root cause (reproduced live): the CONFIGDEDUP-001 migration moved the user's `STORY CONTRACT` and `UNIVERSAL CONTENT POLICY` payloads into `story_config` and **deleted the backing `records` rows** (`archive/tickets/CONFIGDEDUP-001.md` — `records` table is now empty for red-bunny). But the user had previously selected those two records into the active working set, and the migration never scrubbed their IDs out of `generation_session.active_working_set.selected_records`. The stored session still holds:

```
selected_records: [
  "019e99c1-4157-79fc-a7f7-ea1d624471ba",  ← deleted STORY CONTRACT record
  "019e99c4-64a1-7a2c-af39-fb58fbfece02"   ← deleted UNIVERSAL CONTENT POLICY record
]
```

`buildSnapshotFromOpenProject` → `resolveSelectedRecords` (`packages/server/src/snapshot-builder.ts:90-111`) calls `getRecord(id)` for every selected ID and hard-fails the entire snapshot on the first miss, returning `422 malformed-validation-source: Record not found: …`. This is consumed by `POST /api/validate`, `POST /api/compile`, and `POST /api/generate` — i.e. the `/generation-brief`, `/preview`, and `/generate` pages.

This ticket is the **data-repair half**: an idempotent integrity sweep at project open that drops working-set record references whose records no longer exist, restoring red-bunny (and any project in the same state). WSINTEGRITY-002 is the **prevention half** (scrub at the delete boundary). Issue 4 (story-config console noise) is unrelated and handled by STORYCFGUX-001.

Pruning a reference to a record that no longer exists is **referential-integrity maintenance, not authorial override**: the record is gone, so there is nothing left to "select." This does not trip FOUNDATIONS §29.3 ("silently remove selected records"), which protects still-existing records the user chose. It directly serves §24 (do not leave user-owned project data in a damaged state).

## Assumption Reassessment (2026-06-07)

1. **The brick path is `selected_records` only.** `resolveSelectedRecords` (`snapshot-builder.ts:96-108`) iterates `generationSession.active_working_set?.selected_records` and calls `repository.getRecord(id)`; a non-`ok` result returns `{ ok: false, message }` which becomes the 422 in `buildSnapshotFromOpenProject` (`snapshot-builder.ts:45-49`). `castBandAssignments` (`snapshot-builder.ts:137-157`) only builds a lookup map and does not itself call `getRecord`, but its cast IDs are part of the working set and should be repaired for integrity. Verified live: red-bunny `/api/validate`, `/api/compile`, `/api/generate` all return `422 Record not found: 019e99c1-…`.
2. **The session shape is `@loom/core`'s `generationSessionSchema`.** The working-set record-reference surface is `active_working_set.{selected_records, active_onstage_cast_full[].cast_member_id, present_minor_cast_compressed, offstage_relevant_cast, selected_pov, manual_directive_id}` (`packages/core/src/records/generation-brief.ts:5-28,158-169`). `selected_pov` is `recordId | "omniscient"`; only the `recordId` case is prunable. The session round-trips through `generationSessionSchema.parse` on read (`record-repository.ts:343`) and write (`record-repository.ts:324`), so a pruned subset re-validates cleanly.
3. **Shared boundary under audit:** the `generation_session` row (`id = 1`, `payload_json`) versus the `records` table within one project SQLite database. The sweep reads `SELECT id FROM records` to build the live-ID set and rewrites `generation_session.payload_json` with dangling working-set references removed. No foreign keys couple them; the only contract is the core session schema.
4. **FOUNDATIONS principles restated:** §24 / §4.10 (local-first, user-owned — do not leave authored project data in a broken, ungenerable state); §7 / §29.3 (active-working-set supremacy — the app must not silently remove *selected records*, but a pointer to a deleted record is not a selected record; removing it restores the user's own intent that the working set name real records); §4.5 (fail closed — `resolveSelectedRecords`'s hard-fail remains the last-resort guard; this ticket removes the *cause*, not the guard).
5. **Removal/refactor blast radius:** new code only. The pure helper is added to core and exported from `packages/core/src/index.ts`; the migration is new; `project-store.ts` gains one call per store path. No symbol is renamed or removed. `resolveSelectedRecords` is intentionally **not** weakened — it stays strict so genuine corruption still fails closed.
6. **Ordering dependency:** the sweep must run **after** `migrateGlobalConfigRecords(database)` (`project-store.ts:246,343`), because that migration is what deletes the global-config records; the sweep must observe the post-deletion `records` set.
7. **Adjacent contradictions classified.** (a) `current_authoritative_state.*` and the top-level voice arrays (`current_cast_voice_pressure`, `cast_voice_overrides`) can also hold record/cast IDs, but they are **not** the active working set, are not resolved by `resolveSelectedRecords`, and do not brick snapshot building — **out of scope** (future cleanup ticket if ever needed). (b) The fact that `deleteRecord` does not scrub the working set is a **separate prevention concern** handled by WSINTEGRITY-002.

## Architecture Check

1. A pure core helper (`pruneWorkingSetReferences`) plus a thin idempotent server migration is cleaner than: (a) repairing inline inside `resolveSelectedRecords` — that would silently mutate state during a read path and conflate the fail-closed guard with repair; or (b) loosening `resolveSelectedRecords` to skip missing IDs — that hides corruption and weakens §4.5 fail-closed. Keeping the helper pure in core lets WSINTEGRITY-002 reuse the exact same pruning predicate, so the repair-on-open and prevent-on-delete paths cannot diverge.
2. No backwards-compatibility aliasing or shims. The sweep deletes dangling references outright and writes a single canonical session payload; it introduces no dual-write or sync path.

## Verification Layers

1. A working set with a reference to a non-existent record is repaired on open → test (seed `records` with one row, seed `generation_session` whose `selected_records` includes that row's ID plus a stranger ID; after the sweep, only the live ID remains) + manual red-bunny review.
2. The sweep never removes a reference to a record that still exists → test (all referenced IDs present ⇒ session is byte-identical, no write performed).
3. The sweep is idempotent and a no-op on clean projects → test (run twice; second run performs no write; project with no `generation_session` row opens unchanged).
4. red-bunny becomes generable again → FOUNDATIONS alignment check (§24) + manual review (after open, `POST /api/validate`, `/api/compile`, `/api/generate` no longer return `malformed-validation-source: Record not found`).
5. The pure helper introduces no platform coupling → codebase grep-proof (no `node:*`/`fastify`/`react`/`vite` import in the new core file; `npm run lint` core import-boundary rule passes).

## What to Change

### 1. New pure core helper

Add `packages/core/src/records/working-set-integrity.ts` exporting:

```ts
pruneWorkingSetReferences(
  session: GenerationSession,
  keepRecordId: (recordId: string) => boolean
): { session: GenerationSession; removed: string[] }
```

- Operates only on `session.active_working_set`. If absent, returns the session unchanged with `removed: []`.
- Removes from `selected_records`, `present_minor_cast_compressed`, `offstage_relevant_cast` every ID where `keepRecordId(id)` is `false`; filters `active_onstage_cast_full` by `keepRecordId(entry.cast_member_id)`; clears `selected_pov` when it is a `recordId` (not `"omniscient"`) and `keepRecordId` is `false`; clears `manual_directive_id` when `keepRecordId` is `false`.
- Returns the de-duplicated list of removed record IDs (for summary/logging).
- Pure and platform-free (no `node:*`, no framework imports) — must satisfy the `@loom/core` import-boundary rule.

Export it from `packages/core/src/index.ts`.

### 2. New server migration

Add `packages/server/src/working-set-integrity-migration.ts` exporting `repairWorkingSetReferences(database: DatabaseSync): { removedReferenceIds: string[] }`:

- `SELECT id FROM records` → build a `Set<string>` of live record IDs (raw SQL — independent of the registry, consistent with `global-config-migration.ts`).
- `SELECT payload_json FROM generation_session WHERE id = 1`; if no row, return `{ removedReferenceIds: [] }` (no-op).
- Parse the payload with `generationSessionSchema` from `@loom/core`. Call `pruneWorkingSetReferences(session, (id) => liveIds.has(id))`.
- If `removed.length === 0`, perform no write. Otherwise write the pruned session back to `generation_session` (mirror the upsert in `record-repository.ts:325-331`, refreshing `updated_at`) inside a single transaction.
- Idempotent: a clean project produces no write.

### 3. Wire the sweep into project open/create

In `packages/server/src/project-store.ts`, call `repairWorkingSetReferences(database)` immediately **after** `migrateGlobalConfigRecords(database)` in both store paths (`project-store.ts:246` and `project-store.ts:343`), before the `RecordRepository` is constructed.

## Files to Touch

- `packages/core/src/records/working-set-integrity.ts` (new)
- `packages/core/src/index.ts` (modify — export the helper)
- `packages/server/src/working-set-integrity-migration.ts` (new)
- `packages/server/src/project-store.ts` (modify — invoke sweep after `migrateGlobalConfigRecords` in both paths)
- `packages/core/test/working-set-integrity.test.ts` (new)
- `packages/server/src/working-set-integrity-migration.test.ts` (new)
- `packages/server/src/project-store.test.ts` (modify — assert the sweep runs on open and repaired sessions expose pruned `selected_records`)

## Out of Scope

- Scrubbing the working set when a record is deleted through the API — **WSINTEGRITY-002** (prevention half; reuses the core helper).
- The story-config 404 console noise on `/story-config` and `/generation-brief` — **STORYCFGUX-001**.
- Pruning dangling IDs from `current_authoritative_state.*` or the top-level voice arrays (`current_cast_voice_pressure`, `cast_voice_overrides`) — these are not the active working set and do not brick the snapshot. Out of scope unless a future bug demonstrates a concrete failure.
- Any change to `resolveSelectedRecords`'s strictness (it stays fail-closed) or to any table schema.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -w @loom/core` — new `working-set-integrity.test.ts` covers: prune one stranger from `selected_records`; prune cast-band IDs; clear dangling `selected_pov`/`manual_directive_id`; preserve `"omniscient"` POV; no-op when all IDs live; no-op when `active_working_set` absent.
2. `npm test -w @loom/server` — new `working-set-integrity-migration.test.ts` covers: repair a seeded dangling reference; no write when clean; idempotent re-run; no `generation_session` row no-op. `project-store.test.ts` covers the open-path wiring.
3. `npm test` — full suite stays green (no regression in `snapshot-builder`, `compile-routes`, `validation-routes`, `generate-routes`).
4. `npm run lint && npm run typecheck` — clean, including the `@loom/core` import-boundary rule.

### Invariants

1. After opening any project, `generation_session.active_working_set` contains no record reference whose ID is absent from the `records` table.
2. The sweep never removes a reference whose record still exists; a project with no dangling references is written byte-for-byte unchanged (no write at all).
3. `resolveSelectedRecords` remains strict — it still returns `malformed-validation-source` for a genuinely dangling reference (last-resort guard preserved).

### Tests That Must Pass (manual, red-bunny)

1. Open `/home/joeloverbeck/stories/red-bunny`; confirm `GET /api/working-set` returns `selectedRecordIds: []`, and `POST /api/validate`, `POST /api/compile`, `POST /api/generate` no longer return `malformed-validation-source: Record not found`.

## Test Plan

### New/Modified Tests

1. `packages/core/test/working-set-integrity.test.ts` — unit tests of the pure pruning helper across each working-set sub-field.
2. `packages/server/src/working-set-integrity-migration.test.ts` — direct tests of the migration against a temp/in-memory SQLite database.
3. `packages/server/src/project-store.test.ts` — assert the sweep runs on the open path and exposes a repaired session.

### Commands

1. `npm test -w @loom/core`
2. `npm test -w @loom/server`
3. `npm test`
4. Narrow boundary rationale: the prune logic is a pure core transform (core suite is its proof surface); the migration is SQLite-on-`DatabaseSync` (server suite); the full run guards the snapshot/compile/generate pipeline after the data repair.

## Outcome

Completion date: 2026-06-07

Implemented a pure `pruneWorkingSetReferences` helper in `@loom/core`, added an idempotent server-side `repairWorkingSetReferences` migration for `generation_session.active_working_set`, and wired the repair after `migrateGlobalConfigRecords` in both project create/open paths before the repository is exposed.

Deviations from original plan: none for the implemented scope. The red-bunny manual check confirmed the original `Record not found` brick is removed; the project now fails closed on ordinary missing launch fields/config instead.

Verification results:

- `npm test -w @loom/core` — passed; new helper tests cover selected records, cast bands, selected POV/manual directive, omniscient POV, clean no-op, and absent working set.
- `npm test -w @loom/server` — passed; migration and project-store tests cover repair, no-write clean sessions, idempotence, absent generation session, and post-global-config open-path repair.
- `npm test` — passed.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- Manual red-bunny API check — passed: opening `/home/joeloverbeck/stories/red-bunny` returned `200`, `GET /api/working-set` returned `selectedRecordIds: []`, and `POST /api/validate`, `/api/compile`, and `/api/generate` no longer returned `malformed-validation-source: Record not found`.
