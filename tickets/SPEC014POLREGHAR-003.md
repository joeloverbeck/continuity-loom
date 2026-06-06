# SPEC014POLREGHAR-003: Storage recoverability + backup regression test

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — adds `packages/server/src/project-store.recoverability.test.ts`; no production storage-code changes.
**Deps**: None

## Problem

The storage version gate and backup workflow are implemented (`evaluateStoreCompatibility`, `PRAGMA user_version`, `createBackup()`'s `VACUUM INTO`) but their *recoverability* guarantee is under-tested: there is no regression proving that opening a store whose `user_version` is ahead/behind the app yields the correct recoverable diagnostic **without mutating or corrupting the store**, and that a backup copy is itself a consistent, openable loom store. SPEC-014 D3 (test part) pins this so a future change to the open path can't silently start mutating an incompatible store or producing an unopenable backup (FOUNDATIONS §24, §29.10). The user-facing documentation of this behavior is delivered separately in SPEC014POLREGHAR-007.

## Assumption Reassessment (2026-06-06)

1. `evaluateStoreCompatibility(appSchemaVersion, storeUserVersion)` (`packages/core/src/project-storage.ts:55-68`) returns `"incompatible-version"` when `storeUserVersion > appSchemaVersion`, `"migration-required"` when `storeUserVersion < appSchemaVersion`, else `"ok"`. `LOOM_SCHEMA_VERSION = 1` (`project-storage.ts:5`); `LOOM_APPLICATION_ID = 0x4c4f4f4d` (`project-storage.ts:4`). So a store at `user_version` 2 → `incompatible-version`; at 0 → `migration-required`.
2. The server store manager is `createProjectStoreManager(options?)` (`packages/server/src/project-store.ts:189`) exposing `createProject(...)`, `openProject(...) → OpenProjectResult` (`{ ok: true; status } | { ok: false; kind: OpenFailureKind; message }`, `project-storage.ts:51-53`), and `createBackup(): Promise<{ backupPath: string }>` (`project-store.ts:106,369-380`) which runs `VACUUM INTO <backupsPath>/loom-backup-<ts>.sqlite`. `OpenFailureKind` includes both `incompatible-version` and `migration-required` (`project-storage.ts:24-31`) — open is **blocked** with that kind, leaving the store intact. The init path sets `PRAGMA user_version = LOOM_SCHEMA_VERSION` (`project-store.ts:139`) and reads it via `readPragmaNumber(db, "user_version")` (`project-store.ts:125,251,308`).
3. Cross-artifact boundary under audit: the test spans `@loom/server` (the store manager / pragmas / `node:sqlite` `DatabaseSync`) and the `@loom/core` compatibility contract (`evaluateStoreCompatibility`, `LOOM_*` constants). The audit confirms the recoverability assertion belongs in `@loom/server` (it needs `node:sqlite`, forbidden in `@loom/core`), and reuses the temp-dir pattern from `packages/server/src/project-store.secret-boundary.test.ts` (`mkdtemp(tmpdir())` + `createProjectStoreManager()`).
4. FOUNDATIONS principle under audit: §24 / §29.10 data ownership — "project data should be local, inspectable, portable… support easy backup and export" and the hard-fails "does it make export or backup unreasonably difficult / prevent local access." A recoverable, non-mutating open on version drift plus a consistent backup is exactly this guarantee. SPEC-014 builds **no migration runner** (deferred per `LOCAL-FIRST-STORAGE.md:93`; Phase 14 is terminal) — the test asserts recoverability, not migration.
5. No mismatch: `evaluateStoreCompatibility` branch directions, the `createBackup` signature, and the `openProject` failure-kind contract were read directly from the working tree on 2026-06-06; the earlier spec citation `project-store.ts:369,378` for `VACUUM INTO` was corrected to `:378` during reassessment and matches the read here.

## Architecture Check

1. Driving the real `createProjectStoreManager` open/backup paths (not a mock) is the only way to prove the *actual* open path is non-mutating; a unit test of `evaluateStoreCompatibility` alone would miss whether `openProject` writes to the store while detecting incompatibility. Asserting the backup's pragmas (`application_id`, `user_version`) proves "opens cleanly" without depending on a folder-copy harness.
2. No backwards-compatibility shims: the test exercises the existing manager API as-is; it adds no migration shim or legacy-version adapter (a migration runner is explicitly out of v1 scope).

## Verification Layers

1. Correct recoverable diagnostic → `openProject` on a `user_version`-2 store returns `{ ok: false, kind: "incompatible-version" }`; on a `user_version`-0 store returns `{ ok: false, kind: "migration-required" }` — test assertion.
2. Non-mutating open → after each failed `openProject`, the store db's `PRAGMA user_version` still equals the drifted value and the project metadata JSON is byte-unchanged (hash before/after) — test assertion (distinct invariant).
3. Backup opens cleanly → `createBackup()` on a healthy store produces a file whose `PRAGMA application_id === LOOM_APPLICATION_ID` and `PRAGMA user_version === LOOM_SCHEMA_VERSION` when reopened with `node:sqlite` `DatabaseSync` — test assertion (distinct surface).
4. FOUNDATIONS §29.10 recoverability intent → FOUNDATIONS alignment check (open failure leaves the store usable; no data loss path introduced).

## What to Change

### 1. Add the recoverability + backup test

Create `packages/server/src/project-store.recoverability.test.ts` using the temp-dir + `createProjectStoreManager()` pattern from the secret-boundary test:

- **Drift setup**: create a healthy project, close it, then open its `loom.sqlite` directly with `node:sqlite` `DatabaseSync` and `exec("PRAGMA user_version = 2")` (ahead) or `= 0` (behind), and close.
- **Recoverable diagnostic**: `openProject` the drifted project and assert `ok === false` with `kind === "incompatible-version"` (ahead) / `"migration-required"` (behind) and a non-empty `message`.
- **Non-mutating**: capture the db file's `user_version` and the project metadata JSON content before the failed open; assert both are unchanged after it.
- **Backup opens cleanly**: on a separate healthy project, call `createBackup()`, reopen the returned `backupPath` with `DatabaseSync`, and assert `application_id === LOOM_APPLICATION_ID` and `user_version === LOOM_SCHEMA_VERSION`.

Import `LOOM_APPLICATION_ID`, `LOOM_SCHEMA_VERSION` from `@loom/core` and the manager from `./project-store.js`, matching existing server-test import conventions.

## Files to Touch

- `packages/server/src/project-store.recoverability.test.ts` (new)

## Out of Scope

- Any **migration runner** or auto-upgrade of a drifted store (explicitly deferred; FOUNDATIONS-aligned no-op for v1).
- Changes to `evaluateStoreCompatibility`, `openProject`, `createBackup`, or pragma handling.
- The user-facing backup/recoverability **documentation** (delivered in SPEC014POLREGHAR-007).

## Acceptance Criteria

### Tests That Must Pass

1. `npx vitest run packages/server/src/project-store.recoverability.test.ts` — recoverable-diagnostic, non-mutating, and backup-opens-cleanly cases pass.
2. The non-mutating assertion fails if a local experiment makes `openProject` write `user_version` back to `LOOM_SCHEMA_VERSION` on incompatible open — confirming the test detects a mutating open.
3. `npm test` — full suite green.

### Invariants

1. Opening a version-drifted store never mutates the store file and always returns the correct recoverable `OpenFailureKind`.
2. A `createBackup()` artifact is a consistent loom store (`application_id` + `user_version` match a healthy store) and reopens without error.

## Test Plan

### New/Modified Tests

1. `packages/server/src/project-store.recoverability.test.ts` — version-drift recoverability + backup consistency regression.

### Commands

1. `npx vitest run packages/server/src/project-store.recoverability.test.ts`
2. `npm run lint && npm run typecheck && npm test`
3. The server-scoped vitest run is the correct boundary — the deliverable is a `@loom/server` storage regression needing `node:sqlite`; `npm test` confirms no cross-package fallout.
