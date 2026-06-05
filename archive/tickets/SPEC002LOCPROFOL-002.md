# SPEC002LOCPROFOL-002: `@loom/server` project storage module — create/open/close/status/backup

**Status**: PENDING
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — new `@loom/server` `node:sqlite`-backed project storage module with a per-instance active-project handle; integration tests against temp dirs
**Deps**: SPEC002LOCPROFOL-001

## Problem

The server needs the only I/O boundary that owns the project folder and the
canonical SQLite store: create a folder + `continuity-loom.project.json` +
`loom.sqlite` (with identity/version PRAGMAs), open a valid project, report
status, safely close, and produce a consistent backup. It must hold at most one
open store and never leak that handle across server instances (so temp-dir
integration tests and the dev/prod launchers stay isolated). This ticket ships
the green-path lifecycle and backup; failure-taxonomy hardening is
SPEC002LOCPROFOL-003.

## Assumption Reassessment (2026-06-05)

1. `@loom/server` already depends on `@loom/core`, `fastify`, `@fastify/static`,
   and `zod@^4.1.13` (`packages/server/package.json`); its existing modules
   (`server.ts`, `settings.ts`, `version-schema.ts`) co-locate tests as
   `src/*.test.ts`. No project-store module exists yet. `node:sqlite` is the
   committed access path (`TECHNOLOGY-DECISIONS.md`); verified at reassessment
   that `DatabaseSync`, `PRAGMA application_id`/`user_version`, and `VACUUM INTO`
   all work on the repo's Node (emits an `ExperimentalWarning`).
2. SPEC-002 Deliverable 2 + `LOCAL-FIRST-STORAGE.md` ("Project folder model",
   "Backup and copy expectations") govern: `loom.sqlite` + `continuity-loom.project.json`
   + optional `backups/`; backup via a WAL-safe single-file `VACUUM INTO`.
3. Shared boundary under audit: this module consumes the SPEC002LOCPROFOL-001
   contract (`projectMetadataSchema`, `ProjectStatus`, `LOOM_APPLICATION_ID`,
   `LOOM_SCHEMA_VERSION`, `evaluateStoreCompatibility`). The `project-store.ts`
   file it creates is the surface SPEC002LOCPROFOL-003 and -004 modify — declared
   as their `Deps`.
4. FOUNDATIONS motivating this ticket: §24/§29.10 (a project is an explicit
   user-owned folder with a readable metadata file + one canonical store — no
   app-opaque silo); §4.9/§22 (no prompt/prose written to the store).
5. Enforcement surfaces: secret firewall (§29.9) — the module writes metadata
   only through `projectMetadataSchema` (closed) and logs operation **results**
   only (status/kind/`backupPath`), never folder/parent paths paired with
   payloads, metadata bodies, or store contents, so the SPEC-001 redact allowlist
   in `server.ts` needs no additions. The single active-project handle is held as
   **per-manager-instance state, not a module-level singleton** (per SPEC-002
   Deliverable 2, M3), so concurrently constructed servers do not share a handle.

## Architecture Check

1. A `createProjectStoreManager()` factory that closes over a private
   `DatabaseSync | null` handle is cleaner than module-level mutable state: each
   `createServer()` (SPEC002LOCPROFOL-004) gets its own manager, so temp-dir
   integration tests and the dev/prod launchers never collide on a shared open
   handle. A thin typed repository (raw SQL, no ORM) preserves deterministic,
   inspectable data access per `TECHNOLOGY-DECISIONS.md`.
2. No backwards-compatibility aliasing/shims: net-new module; `server.ts` is not
   touched here (route wiring is SPEC002LOCPROFOL-004).

## Verification Layers

1. Create→open round-trip -> integration test: `createProject` writes the folder,
   metadata, and `loom.sqlite` on disk; a fresh manager `openProject`s it and
   returns `{ ok: true, status }` with the expected title/versions.
2. On-disk identity/version -> schema validation + SQLite probe: the created
   store reports `application_id === LOOM_APPLICATION_ID` and
   `user_version === LOOM_SCHEMA_VERSION`; metadata file parses under
   `projectMetadataSchema`.
3. Consistent backup -> integration test: `createBackup` creates `backups/` first,
   writes a timestamped file via `VACUUM INTO`, and the copy opens as a valid
   store with the same `application_id`.
4. Single-handle isolation -> integration test: opening a second project closes
   the prior handle; two managers constructed separately do not observe each
   other's active project.

## What to Change

### 1. New storage module

Add `packages/server/src/project-store.ts` exporting
`createProjectStoreManager(): ProjectStoreManager`, where `ProjectStoreManager`
holds a private active handle + active `{ folderPath, metadata }` and exposes:

- `createProject({ parentPath, folderName, title, description? }): Promise<ProjectStatus>`
  — resolve `parentPath/folderName`; create the folder (fail clearly if it already
  exists with content); write `continuity-loom.project.json` validated through
  `projectMetadataSchema` (`projectUuid` via `node:crypto randomUUID`,
  `createdAt`/`updatedAt` ISO, `schemaMinVersion = LOOM_SCHEMA_VERSION`,
  `databaseFilename = "loom.sqlite"`); open/create `loom.sqlite` and set
  `PRAGMA application_id = LOOM_APPLICATION_ID`, `PRAGMA user_version =
  LOOM_SCHEMA_VERSION`, `PRAGMA journal_mode = WAL`, `PRAGMA foreign_keys = ON`,
  `PRAGMA synchronous = NORMAL`; hold the handle; return `ProjectStatus`.
- `openProject(folderPath): Promise<OpenProjectResult>` — **green path only here**:
  read + parse metadata, open the store, read `application_id` + `user_version`,
  call `classifyApplicationId` and `evaluateStoreCompatibility`, and on a valid
  loom store return `{ ok: true, status }`. (Full failure-kind classification is
  SPEC002LOCPROFOL-003; until then, unexpected inputs may throw — that ticket
  converts those into structured kinds.)
- `getActiveProjectStatus(): ProjectStatus | { open: false }`.
- `closeProject(): Promise<{ open: false }>` — finalize/close the handle, clear
  active state.
- `createBackup(): Promise<{ backupPath: string }>` — require an open project;
  `mkdir` `backups/` (recursive) **before** `VACUUM INTO` (SQLite does not create
  the target directory); write `backups/loom-backup-<timestamp>.sqlite`; return
  the absolute path.

Opening a project while one is open cleanly closes the prior handle first.

## Files to Touch

- `packages/server/src/project-store.ts` (new)
- `packages/server/src/project-store.test.ts` (new) — green-path + backup
  integration tests against `node:fs` temp dirs

## Out of Scope

- Open-failure taxonomy / defensive parse classification + secret-boundary test
  (SPEC002LOCPROFOL-003).
- API routes (SPEC002LOCPROFOL-004), web UI (SPEC002LOCPROFOL-005), doc updates
  (SPEC002LOCPROFOL-006).
- Story-record tables, migration runner — Phase 3 / deferred per SPEC-002.

## Acceptance Criteria

### Tests That Must Pass

1. `npm run test --workspace @loom/server` — `project-store.test.ts` passes:
   create→open round-trip yields the expected `ProjectStatus`; the metadata file
   and `loom.sqlite` exist on disk with the expected `application_id`/`user_version`;
   `createBackup` yields a consistent, openable copy under `backups/`; opening a
   second project closes the first handle.
2. `npm run typecheck && npm test && npm run build` — all green.

### Invariants

1. At most one open store handle per manager instance; `closeProject` releases it.
2. No metadata body, store content, or payload-bearing path is logged — only
   operation results (preserves §29.9; no redact-list change required).

## Test Plan

### New/Modified Tests

1. `packages/server/src/project-store.test.ts` — temp-dir integration: create→open
   round-trip, on-disk file + PRAGMA assertions, backup-produces-openable-copy,
   single-handle replacement on second open.

### Commands

1. `npm run test --workspace @loom/server`
2. `npm run typecheck && npm test && npm run build`
