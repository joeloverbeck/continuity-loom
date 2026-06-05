# SPEC003TYPDATMOD-011: recordRepository — durable record CRUD, projection refresh, reference-integrity

**Status**: ✅ COMPLETED
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — new `@loom/server` `recordRepository` (`packages/server/src/record-repository.ts`); `packages/server/src/project-store.ts` modified to hold it as server-instance state across the open/create lifecycle.
**Deps**: SPEC003TYPDATMOD-001, SPEC003TYPDATMOD-003, SPEC003TYPDATMOD-004, SPEC003TYPDATMOD-010

## Problem

With the schemas (core) and tables (ticket 010) in place, the app needs a typed repository to create, read, update, and archive/delete durable records — Zod-parsing payloads before write, recomputing reference + metadata projections in the same transaction, and protecting reference integrity so no active record is left with a dangling reference. This is the read/write heart of the Phase-3 data layer.

## Assumption Reassessment (2026-06-05)

1. Deps land first: the record-type registry + `generateRecordId` + reference extractors from SPEC003TYPDATMOD-001; ENTITY (003) and CAST MEMBER (004) schemas for the round-trip + reference-integrity tests; the five tables from SPEC003TYPDATMOD-010. The repository is registry-driven (iterates `@loom/core` definitions), so it works for every registered type without a per-type switch.
2. Held as server-instance state, NOT a module singleton — same rationale as SPEC-002's active-project handle (`ActiveProject` in `packages/server/src/project-store.ts`). The repository binds to the active `DatabaseSync` and is recreated on open/create, cleared on close.
3. Shared boundary under audit: `ActiveProject` (`project-store.ts`) gains a `recordRepository` field; `createProjectStoreManager`'s `closeActive`/lifecycle must construct/tear down the repository alongside the DB handle.
4. FOUNDATIONS §29.4 ("no arbitrary unvalidated blobs") motivates Zod-parse-before-write and on read: malformed payloads are rejected on write and surface a structured "malformed record" diagnostic on read (never crash/coerce). §13/§20 (record authority, no silent dangling references; `DATA-MODEL-AND-RECORDS.md` "Identity rules" + failure mode "dangling references after deletion") motivates reference-integrity-protected delete: if active (non-archived) records reference the target, deletion is blocked or converted to archive. Restated: the repository is the human-gated write path; no LLM, no prose inference.
5. Information-path note: a record's status/salience/urgency exist both in the typed `payload_json` (authoritative) and as denormalized columns (projection). Canonical end-state: payload is the source of truth; `createRecord`/`updateRecord` recompute the `status`/`salience`/`urgency` columns AND `record_references` rows from the parsed payload in the same transaction (SPEC-003 §Approach). Tests assert the projection matches the payload after save.

## Architecture Check

1. A registry-driven repository keeps CRUD generic: adding a record type (tickets 002–009) needs no repository change. Transactional projection refresh keeps `record_references` and the metadata columns consistent with `payload_json` by construction.
2. No backwards-compatibility shims — new repository bound to the existing `ActiveProject` lifecycle; no alias path.

## Verification Layers

1. create→save→load round-trip for an atomic type + CAST MEMBER rich dossier -> server integration test (`vitest`) against a temp project.
2. Malformed payload rejected on write AND surfaced as a structured diagnostic on read -> integration test (write rejection; read of a hand-corrupted `payload_json` returns a diagnostic, no crash).
3. Reference + metadata projection populated/refreshed on save -> integration test asserting `record_references` rows and `status`/`salience`/`urgency` columns match the parsed payload.
4. Reference-integrity protection: deleting a referenced ENTITY is blocked or archived (no dangling reference) -> integration test (FOUNDATIONS §13/§20).
5. Repository is server-instance state, cleared on close -> integration test (no cross-project leakage after close/open).

## What to Change

### 1. `recordRepository`

Add `packages/server/src/record-repository.ts`: `createRecord`/`updateRecord` (assign/keep UUIDv7 id via `generateRecordId`, Zod-parse payload before write, recompute `record_references` + `status`/`salience`/`urgency` columns in one transaction), `getRecord`/`listRecords` (Zod-parse on read; structured "malformed record" diagnostic on failure), `archiveRecord`/`deleteRecord` (reference-integrity protected — block or convert-to-archive when active records reference the target).

### 2. Lifecycle integration

Modify `packages/server/src/project-store.ts`: add a `recordRepository` to `ActiveProject` (or expose it from the manager), construct it on create/open against the active DB, tear down on close.

## Files to Touch

- `packages/server/src/record-repository.ts` (new)
- `packages/server/src/project-store.ts` (modify — hold repository as server-instance state)
- `packages/server/src/record-repository.test.ts` (new)

## Out of Scope

- Singleton story-config / generation-session / accepted-segment accessors — ticket 012.
- New HTTP/CRUD API routes — Phase 4 (repository is wired into the lifecycle, not exposed over HTTP this phase).
- Specific reference-integrity UX (block vs. force-archive) — implementer's choice within the no-dangling-references invariant (SPEC-003 Risks).
- Validation of contradictions across records — Phase 6.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/server` — round-trip (atomic + CAST MEMBER), malformed-rejection on write/read, projection populated/refreshed on save, reference-integrity prevents dangling references, repository cleared on close.
2. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. No payload is persisted without passing its registered Zod schema; the metadata columns + `record_references` always match the stored `payload_json` after a save.
2. No `deleteRecord`/`archiveRecord` leaves an active record pointing at a removed target (no silent dangling reference, §13/§20).

## Test Plan

### New/Modified Tests

1. `packages/server/src/record-repository.test.ts` — CRUD round-trips, malformed handling, projection refresh, reference-integrity, lifecycle teardown.

### Commands

1. `npm test --workspace @loom/server`
2. `npm run typecheck && npm run lint && npm test && npm run build`

## Outcome

Completed: 2026-06-05.

Implemented the lifecycle-bound `RecordRepository` with create/update/get/list, validated payload writes, malformed read diagnostics, projection refresh, archive/delete integrity protection, and manager access via `getRecordRepository`.

Deviation: repository access is server-internal only; no Phase-4 HTTP CRUD surface was added.

Verification: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` passed.
