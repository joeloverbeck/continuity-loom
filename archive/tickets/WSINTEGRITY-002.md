# WSINTEGRITY-002: Scrub deleted records from the active working set at the delete boundary

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `RecordRepository.deleteRecord` (`packages/server/src/record-repository.ts`) now also prunes the active working set atomically. Reuses the pure core helper from WSINTEGRITY-001. No table-schema change, no new API surface.
**Deps**: WSINTEGRITY-001 (reuses `pruneWorkingSetReferences` from `@loom/core`).

## Problem

Deleting a record that is currently in the active working set leaves a **dangling reference** in `generation_session.active_working_set`, which then bricks `/generation-brief`, `/preview`, and `/generate` with `422 malformed-validation-source: Record not found: …` — the exact failure mode WSINTEGRITY-001 repairs for red-bunny. The CONFIGDEDUP migration was simply the first thing to hit this latent trap; **any** user deletion of a selected record reproduces it.

Verified in code: `RecordRepository.deleteRecord` (`record-repository.ts:295-298`) runs only `assertNoActiveInboundReferences(id)` then `DELETE FROM records WHERE id = ?`. The route `DELETE /api/records/:id` (`record-routes.ts:275-293`) additionally checks `incomingReferencesForRecord` (cross-record links in `record_references`), but **neither path touches `generation_session`**. So the working set keeps pointing at the deleted record, and `resolveSelectedRecords` (`snapshot-builder.ts:96-108`) hard-fails on the next snapshot build.

WSINTEGRITY-001 repairs existing damage on open; this ticket prevents new damage at the source so the repair never has to fire in normal use.

Removing a just-deleted record from the working set is a **direct consequence of the user's explicit delete action**, not a silent authorial override — the record no longer exists. This is consistent with FOUNDATIONS §29.3, which forbids silently removing *still-existing* selected records; it does not require retaining pointers to records the user deleted.

## Assumption Reassessment (2026-06-07)

1. **Delete path confirmed.** `record-routes.ts:275-293` validates open project, `getRecord(id).ok` (404 if absent), `incomingReferencesForRecord(id)` (409 on cross-record links), then `repo.deleteRecord(id)`. `deleteRecord` (`record-repository.ts:295-298`) does `assertNoActiveInboundReferences(id)` + `DELETE FROM records`. No working-set scrub anywhere.
2. **Session read/write API confirmed.** `getGenerationSession()` (`record-repository.ts:334-344`) parses `generation_session` row 1 via `generationSessionSchema`; `setGenerationSession()` (`record-repository.ts:323-332`) upserts a parsed payload. The scrub will read, prune via the core helper, and write back within the same delete transaction.
3. **Shared boundary under audit:** `RecordRepository.deleteRecord` as the single chokepoint for record removal, versus the `generation_session` working-set surface. Performing the scrub inside `deleteRecord` (rather than in the route) guarantees every current and future delete caller is covered atomically.
4. **FOUNDATIONS principles restated:** §7 / §29.3 (active-working-set supremacy — removing a *deleted* record from the working set is a consequence of the user's explicit delete, not a silent removal of a selected record); §4.5 (fail closed — `resolveSelectedRecords` stays strict; this ticket removes the cause); §24 (do not let the store drift into a self-inflicted broken state).
5. **HARD-GATE / fail-closed surface check:** this does not touch deterministic compilation (§8), the secret firewall (§15), or any validation rule. `resolveSelectedRecords` is unchanged and still fails closed on genuine corruption. The change only keeps the stored working set internally consistent with the `records` table.
6. **Reuse, not re-implementation.** The pruning predicate is the pure `pruneWorkingSetReferences(session, keepRecordId)` helper introduced by WSINTEGRITY-001, called here with `keepRecordId = (other) => other !== deletedId`. This guarantees the prevent-on-delete and repair-on-open paths share identical semantics.
7. **Adjacent contradictions classified.** Pruning `current_authoritative_state.*` and the top-level voice arrays on delete is the same out-of-scope surface as in WSINTEGRITY-001 (not the working set, does not brick the snapshot) — left out deliberately; a future ticket can extend the predicate to those surfaces if a concrete failure is shown.

## Architecture Check

1. Scrubbing inside `RecordRepository.deleteRecord` (one transaction: delete the row, prune the session, write it back) is cleaner than scrubbing in the route handler: it covers all callers, keeps the two writes atomic (no window where the record is gone but the working set still references it), and colocates the integrity rule with the mutation. Reusing the WSINTEGRITY-001 core helper avoids a second, drifting copy of the prune logic.
2. No backwards-compatibility aliasing/shims. `deleteRecord` gains an atomic follow-on write; no alias path or dual store is introduced.

## Verification Layers

1. Deleting a selected record removes it from the working set → test (seed a record, select it via `setGenerationSession`, `deleteRecord(id)`, assert `getGenerationSession` no longer lists it).
2. The delete + scrub is atomic → test/manual review (the prune write occurs in the same transaction as the row delete; a thrown prune does not leave a deleted row with a stale working set).
3. Deleting a non-selected record leaves the working set untouched → test (no spurious session write when the deleted ID is not referenced).
4. The end-to-end pipeline survives a delete-of-selected-record → test (after delete, `buildSnapshotFromOpenProject` succeeds rather than returning `malformed-validation-source`).

## What to Change

### 1. Prune the working set inside `deleteRecord`

In `packages/server/src/record-repository.ts`, change `deleteRecord(id)` to run inside a transaction:

- `assertNoActiveInboundReferences(id)` (unchanged guard).
- `DELETE FROM records WHERE id = ?`.
- Read the current `generation_session` (row 1). If present, call `pruneWorkingSetReferences(session, (other) => other !== id)`; if `removed.length > 0`, write the pruned session back (refreshing `updated_at`).
- Wrap the delete + conditional session write in a single `BEGIN IMMEDIATE … COMMIT` (rollback on error), mirroring the transaction style in `global-config-migration.ts:149-172`.

No change to `record-routes.ts` is required (the route delegates to `deleteRecord`), but confirm its existing 404/409 guards remain ahead of the call.

## Files to Touch

- `packages/server/src/record-repository.ts` (modify — `deleteRecord` prunes the working set atomically)
- `packages/server/src/record-repository.test.ts` (modify/new — delete-scrub coverage)
- `packages/server/src/record-routes.test.ts` (modify — assert `DELETE /api/records/:id` of a selected record scrubs the working set)

## Out of Scope

- Repairing already-damaged projects (red-bunny) — **WSINTEGRITY-001** (repair-on-open).
- The story-config 404 console noise — **STORYCFGUX-001**.
- Pruning `current_authoritative_state.*` or the voice arrays on delete (same out-of-scope surface as WSINTEGRITY-001).
- Changing `archiveRecord` behavior — archived records still exist as rows and remain resolvable, so they do not create dangling references; no scrub needed there.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -w @loom/server` — delete-scrub coverage: deleting a selected record removes it from `selected_records` and cast bands; deleting a non-selected record performs no session write; route-level `DELETE` of a selected record yields a working set without the deleted ID.
2. `npm test` — full suite green; `snapshot-builder`/`compile`/`generate` tests still pass.
3. `npm run lint && npm run typecheck` — clean.

### Invariants

1. After any successful `deleteRecord`, `generation_session.active_working_set` contains no reference to the deleted ID.
2. The row delete and the working-set write are atomic — no committed state has a deleted record still referenced by the working set.
3. Deleting a record not referenced by the working set leaves `generation_session` unchanged (no write).

## Test Plan

### New/Modified Tests

1. `packages/server/src/record-repository.test.ts` — direct `deleteRecord` tests: selected-record scrub, non-selected no-op, cast-band scrub.
2. `packages/server/src/record-routes.test.ts` — `DELETE /api/records/:id` integration asserting the working set is scrubbed and a subsequent snapshot build succeeds.

### Commands

1. `npm test -w @loom/server`
2. `npm test`
3. `npm run lint && npm run typecheck`
4. Narrow boundary rationale: the mutation lives in `@loom/server`'s repository, so the server suite is the proof surface; the full run confirms the downstream snapshot pipeline no longer bricks after a delete-of-selected-record.

## Outcome

Completion date: 2026-06-07

Implemented atomic working-set scrubbing inside `RecordRepository.deleteRecord`. The delete path now runs the existing inbound-reference guard, row deletion, and conditional `generation_session.active_working_set` rewrite in one transaction, reusing `pruneWorkingSetReferences` from `@loom/core`.

Deviations from original plan: the direct repository coverage was added to `packages/server/src/record-layer.test.ts`, which is the existing repository/storage proof surface in this repo; there is no separate `record-repository.test.ts` file.

Verification results:

- `npm test -w @loom/server` — passed; tests cover deleting selected records, deleting cast-band records, no-write behavior for unselected deletes, and route-level delete/working-set/snapshot behavior.
- `npm test` — passed.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
