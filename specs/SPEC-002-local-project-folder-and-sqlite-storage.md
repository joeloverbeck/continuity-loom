# SPEC-002 — Local Project Folder and SQLite Storage Foundation

Status: DRAFT
Phase: Implementation Order Phase 2
Depends on: SPEC-001 (Repository and Runtime Foundation, COMPLETED)
Governing authority: `docs/FOUNDATIONS.md`
Primary authority doc: `docs/requirements-version-1/LOCAL-FIRST-STORAGE.md`

> Section style note: this file uses the canonical `specs/` section set
> (Problem Statement / Approach / Deliverables / FOUNDATIONS Alignment /
> Verification / Out of Scope / Risks & Open Questions) that the `reassess-spec`
> and `spec-to-tickets` skills parse — not the `docs/requirements-version-1/*`
> requirements-doc house style that the archived SPEC-001 used.

## Brainstorm Context

- **Original request:** Analyze `docs/requirements-version-1/*` (particularly
  `IMPLEMENTATION-ORDER.md`) to decide which spec to create next in `specs/`,
  now that the first spec (SPEC-001) is implemented and archived; the spec must
  align fully with `docs/FOUNDATIONS.md`.
- **Why this spec:** `IMPLEMENTATION-ORDER.md` marks **Phase 1 ✅ implemented via
  SPEC-001**, and SPEC-001 explicitly deferred "Local project folders and the
  canonical SQLite store (Phase 2)" to a later spec. Phase 2 is the next link in
  a strict one-way dependency chain (storage → records → validation → compiler →
  preview → transport): records (Phase 3) require "a stable project identity,
  canonical store, schema/version gate, and safe open/close lifecycle." The
  problem space is fully constrained by `LOCAL-FIRST-STORAGE.md` and
  `TECHNOLOGY-DECISIONS.md`, so a single approach is presented rather than
  competing alternatives.
- **Reference material:** `IMPLEMENTATION-ORDER.md` (Phase 2 gate + cross-spec
  table), `LOCAL-FIRST-STORAGE.md` (Phase 2 authority), `TECHNOLOGY-DECISIONS.md`
  (SQLite via `node:sqlite` behind a typed repository), `docs/FOUNDATIONS.md`
  §§23, 24, 29.9, 29.10.
- **Scope decisions made during brainstorm:**
  1. **Include a minimal backup workflow** — Phase 2 says "basic backup/copy
     assumptions" while `LOCAL-FIRST-STORAGE.md` "Done Means" wants a consistent
     backup workflow to exist; ship a minimal WAL-safe "Create Backup Copy" now.
  2. **Minimal functional project-picker UI** — `UI-WORKFLOWS.md` is *not* listed
     against Phase 2 in the cross-spec table, so the UI is a bare functional
     create/open + status surface, not the dense-record UI of Phases 4+.
- **Final confidence:** ~95%. Which spec is settled by the references; only the
  two scope boundaries above were open, and both are now decided.

---

## Problem Statement

After SPEC-001 the app is a localhost web shell with a pure domain core, a
Fastify loopback server, a placeholder settings boundary, and a placeholder UI.
It has **no concept of a project**: it cannot create or open a user-owned
project folder, has no canonical store, no metadata, no version gate, and no
open/close lifecycle. Every later phase depends on these invariants — records
(Phase 3) cannot be given stable identity, validation (Phase 6) and the compiler
(Phase 7) cannot read a canonical snapshot, and the accepted-segment archive
(Phase 11) has nowhere durable to live.

Phase 2 must establish a project as **a folder the user owns** — not a cloud
account, hidden database, or opaque app silo (FOUNDATIONS §24) — containing a
readable metadata file and one canonical SQLite store, with defensive parsing,
an app/schema version-compatibility gate, an actionable open-failure taxonomy, a
safe open/close lifecycle, and a consistent backup workflow. It must do this
while keeping API keys and prompt text strictly out of project storage
(FOUNDATIONS §23, §29.9) and the deterministic core free of I/O.

This spec introduces **no story records, validation, compiler, transport, or
secret handling** beyond what the storage boundary itself requires.

## Approach

Single approach — the problem space is fully constrained by
`LOCAL-FIRST-STORAGE.md` (canonical SQLite store in an explicit folder) and
`TECHNOLOGY-DECISIONS.md` (raw SQL via Node's official `node:sqlite` behind a
thin typed repository; Zod for runtime parsing of untrusted persisted data).

Layering follows the SPEC-001 boundary:

- **`@loom/core` (pure, no `node:*`, no framework):** the project-metadata Zod
  schema, the storage-contract types (project status, the open-failure taxonomy
  discriminant), the fixed `application_id` and baseline `user_version`
  constants, and the **pure** version-compatibility decision function. These are
  deterministic and unit-testable without a filesystem, preserving the
  TESTING-STRATEGY rule that the core is testable without I/O.
- **`@loom/server` (I/O boundary):** the only place that imports `node:sqlite`
  and `node:fs`. A typed `projectRepository` / `projectStore` module performs
  folder create/open, metadata read/write, SQLite open/create with the required
  PRAGMAs, the version gate (calling core's pure decision function), the
  open/close lifecycle for the single active project, and the backup operation.
  New localhost API routes expose these to the UI; logging redaction from
  SPEC-001 is preserved and no project payloads are logged.
- **`@loom/web` (minimal picker):** a functional create/open screen (the user
  supplies an explicit absolute folder path — a native folder dialog is a future
  Tauri affordance, out of scope here) plus a project-status view (path, title,
  schema/app version compatibility, open state) and a "Create Backup Copy"
  button, all wired to the new API. Open failures render the structured
  diagnostic kind and message rather than crashing or blanking.

**Storage mechanics (from the authority docs):**

- Canonical store: `loom.sqlite` inside the project folder; metadata file
  `continuity-loom.project.json`; optional `backups/` directory.
- Identity/recovery: set a fixed nonzero 32-bit `PRAGMA application_id` (a
  recognizable constant defined in core) and `PRAGMA user_version` (baseline =
  the Phase-2 schema version) so power users and the app can identify and
  version the file with ordinary SQLite tools.
- Consistent backup: use `VACUUM INTO '<backups>/loom-backup-<timestamp>.sqlite'`
  — a single-file, WAL-safe, internally-consistent copy — rather than copying
  the live DB plus WAL/journal sidecars. This satisfies "guarantees a consistent
  copy without requiring the user to understand WAL files."
- Single active project: the server holds at most one open store handle; opening
  a new project cleanly closes the prior one; close finalizes and releases the
  handle.

**Version gate & open-failure taxonomy (pure decision in core, surfaced by
server):** on open, the server parses metadata (Zod) and reads the store's
`application_id`/`user_version`, then asks core's decision function for one of:
`ok`, `missing-metadata`, `invalid-metadata`, `not-a-loom-store` (wrong/zero
`application_id`), `incompatible-version` (store newer than the app supports),
`migration-required` (store older than the app — detected and reported; the
**migration runner is deferred**, see Out of Scope), `invalid-sqlite`
(unreadable/corrupt file), or `unreadable` (I/O error). The UI renders the kind +
an actionable message. No silent repair; defensive parse, not crash.

**Authoritative version source.** The store's `PRAGMA user_version` is the
authoritative input to the compatibility decision: `evaluateStoreCompatibility`
takes the store's `user_version`, not the metadata's `schemaMinVersion`. The
metadata `schemaMinVersion` is an informational cross-check carried for power-user
inspectability and recovery; if it disagrees with the store's `user_version`, the
server surfaces `invalid-metadata` (the metadata does not describe this store)
rather than silently trusting either value. This keeps a single deterministic gate
input while still recording the expected version in the readable metadata file.

`migration-failed` is **not** part of the Phase-2 taxonomy: `LOCAL-FIRST-STORAGE.md`
lists it as a future open-failure kind, but Phase 2 executes no migrations (the
migration runner is deferred), so no migration can fail here. It is added with the
migration runner in a later phase.

## Deliverables

1. **`@loom/core` storage contract (pure).**
   - `projectMetadataSchema` (Zod, strict/closed object) for
     `continuity-loom.project.json`: `title`, `projectUuid`, `createdAt`,
     `updatedAt`, `schemaMinVersion`, `databaseFilename`, optional `description`,
     optional `isDemoFixture`. The closed schema means forbidden fields
     (API keys, prompts, prose, cloud identifiers) cannot round-trip through the
     app's normal write path.
   - Constants: `LOOM_APPLICATION_ID` (fixed nonzero 32-bit int) and
     `LOOM_SCHEMA_VERSION` (baseline `user_version`).
   - Types: `ProjectStatus`, `OpenFailureKind` (the taxonomy union),
     `OpenProjectResult` (ok-with-status | failure-with-kind+message).
   - Pure `evaluateStoreCompatibility(...)` returning `ok | incompatible-version
     | migration-required` from `(appSchemaVersion, storeUserVersion)`, plus a
     pure `classifyApplicationId(...)` for the `not-a-loom-store` case.
   - **Dependency note:** this adds `zod` to `@loom/core` (currently
     `dependencies: {}`), pinned to the same major as `@loom/server` (`zod@^4`).
     Zod is permitted under the core purity boundary — `eslint.config.js`
     `no-restricted-imports` and `packages/core/test/boundary.test.ts` restrict
     only `fastify`/`react`/`vite`/`node:*`, not `zod` — so the boundary test must
     stay green after the dependency is added.
   - Unit tests covering schema accept/reject (including a rejected metadata blob
     carrying an `openRouterApiKey`-style field) and every compatibility branch.

2. **`@loom/server` project storage module + lifecycle.**
   - `node:sqlite`-backed store: create folder + metadata + `loom.sqlite`
     (setting `application_id`, `user_version`, sensible PRAGMAs); open existing
     folder with defensive metadata parse and store probe; safe close.
   - `createProject`, `openProject`, `getActiveProjectStatus`, `closeProject`,
     `createBackup` (VACUUM INTO timestamped file under `backups/`; the module
     creates the `backups/` directory first — SQLite does not create the target
     directory for `VACUUM INTO`).
   - Single active-project handle held **as state on the server instance, not a
     module-level singleton**, so concurrently-constructed servers (integration
     tests against temp dirs; the dev and production launchers) do not share or
     leak an open handle. Opening a project cleanly closes the prior one; server
     close finalizes and releases the handle.
   - Reuses SPEC-001 logging redaction. The new storage routes log only operation
     results (status/kind/`backupPath`) — never folder/parent paths paired with
     payloads, metadata bodies, or store contents — so no additions to the
     SPEC-001 redact allowlist are required.

3. **Local API routes (Fastify, loopback only, Zod-validated I/O).**
   - `POST /api/project/create` `{ parentPath, folderName, title, description? }`
     → `ProjectStatus` or structured failure.
   - `POST /api/project/open` `{ folderPath }` → `OpenProjectResult`.
   - `GET  /api/project` → active `ProjectStatus` or `{ open: false }`.
   - `POST /api/project/backup` → `{ backupPath }` or structured failure.
   - `POST /api/project/close` → `{ open: false }`.

4. **`@loom/web` minimal project picker.**
   - Create form (parent path + new folder name + title/description) and open
     form (existing folder path).
   - Project-status panel: path, title, schema/app version compatibility, open
     state; "Create Backup Copy" action surfacing the resulting backup path.
   - Open/create failures render the diagnostic `kind` + message inline.

5. **Tests** (Vitest): core unit tests (deliverable 1); server integration tests
   against a temp directory — create→open round-trip, each failure-taxonomy
   branch (missing/invalid metadata, wrong `application_id`, incompatible
   version, corrupt SQLite), backup produces a consistent openable copy, and a
   **secret-boundary test** asserting no API-key-shaped field can be written to
   metadata or the store via the normal app paths (FOUNDATIONS §29.9).

6. **Requirements-doc updates on completion** (performed by the implementer when
   Verification passes, not as a precondition):
   - `IMPLEMENTATION-ORDER.md` Phase 2: add `Status: ✅ Implemented via SPEC-002
     (YYYY-MM-DD).` and mark the Phase-2 phase-gate bullets satisfied. Do not
     alter ordering rationale or later phases.
   - `LOCAL-FIRST-STORAGE.md`: add a short note that the Phase-2 storage subset
     (project folder, canonical `loom.sqlite`, metadata, version gate, backup
     workflow) is realized in code via SPEC-002. Leave migration runner and
     accepted-prose-archive separation (later phases) open.

## FOUNDATIONS Alignment

| Principle | Stance | Rationale (mechanism @ surface) |
|---|---|---|
| §24 / §29.10 Local-first, user-owned data | aligns | Project is an explicit user-owned folder with a readable metadata file + one canonical SQLite store; no app-opaque silo, no remote authority @ storage. |
| §23 / §29.9 OpenRouter and secrets | aligns | Closed metadata schema + secret-boundary test guarantee API keys/prompts cannot enter project files or the store via normal paths; keys remain global per SPEC-001 @ storage/settings. |
| §4.9 / §22 Prompt transparency without hoarding | aligns | No prompt text, candidate/accepted prose, or compiler cache is written to the store or metadata; backup copies the store only @ storage. |
| §4.4 Deterministic compilation (foundation) | aligns | Metadata schema + version-compatibility decision are pure `@loom/core` logic with no `node:*`, preserving the I/O-free testable core the compiler/validator will later occupy @ domain core. |
| §29.10 "make export/backup unreasonably difficult?" | aligns | `VACUUM INTO` backup + "copy the folder" portability story keep backup easy and the folder movable @ storage. |

No §29 hard-fail is answered "yes": no remote sole-source-of-truth, no opaque
service boundary, no branches/plot-rails, no accepted-prose-as-canon, no LLM
record mutation, no validation override, no permanent prompt archive, no API-key
leakage.

## Verification

- `npm run typecheck`, `npm run lint` (incl. the core import-boundary rule),
  `npm test`, `npm run build` all green.
- Core boundary test still passes — the new core storage-contract code imports no
  `node:*` and no framework.
- Server integration tests: create→open round-trip yields the expected
  `ProjectStatus`; every open-failure taxonomy branch returns its structured
  `kind` rather than throwing/crashing; backup produces a consistent, openable
  copy; the secret-boundary test passes.
- Manual: from the launched app, create a project in an explicit folder, see the
  metadata file + `loom.sqlite` on disk, reopen it, view status, create a backup,
  and observe an actionable diagnostic when opening a non-project / corrupt
  folder.

## Out of Scope

- **Runtime record schemas, record identity/reference layer, repository
  interfaces for story records** — Phase 3.
- **A migration runner / DDL evolution** — Phase 2 detects and *reports*
  `migration-required` and sets baseline version metadata, but executes no
  migrations (there are no record tables yet). Transactional one-way migrations
  are a later phase.
- **Accepted-segment archive tables and their physical/logical separation from
  compiler inputs** — Phase 3/11 (the store baseline here simply leaves room).
- **Native OS folder-picker dialog** — future Tauri affordance; Phase 2 uses
  typed absolute paths.
- **OpenRouter settings/key handling, validation engine, compiler, prompt
  preview, candidate lifecycle** — later phases; the settings boundary stays the
  inert SPEC-001 stub.
- **Encryption, cloud sync, collaboration, whole-project export formats** —
  explicitly non-goals in `LOCAL-FIRST-STORAGE.md`.

## Risks & Open Questions

- **`node:sqlite` maturity:** the module is the committed v1 default
  (`TECHNOLOGY-DECISIONS.md`) but is comparatively new; if a needed primitive
  (e.g. `VACUUM INTO` behavior, PRAGMA access) proves insufficient on Node 24,
  the documented fallback is `better-sqlite3` behind the same repository
  boundary. The repository seam keeps this swap localized to `@loom/server`.
  Note also that `node:sqlite` remains an experimental module on Node 24 and emits
  `ExperimentalWarning: SQLite is an experimental feature…` on first use (verified
  at reassessment time); the implementer should expect this and may suppress it for
  clean server/test output.
- **Browser folder selection:** a localhost web UI cannot open a native folder
  dialog, so Phase 2 accepts a typed absolute path. This is a known minimal-UI
  tradeoff (decided in brainstorm); a real picker arrives with desktop packaging.
- **Backup timestamp/format:** backups are timestamped single files under
  `backups/`; retention/pruning is not specified (YAGNI for v1) and copies are
  explicitly **not** branches/timelines (`LOCAL-FIRST-STORAGE.md`).
- **`application_id` constant value:** must be a fixed nonzero 32-bit integer
  chosen once and frozen (changing it later would orphan existing stores); the
  implementer fixes the exact value in `@loom/core`.
- **Resolved:** which spec (Phase 2), backup inclusion (yes, minimal), and UI
  depth (minimal functional picker) — all settled during the brainstorm.
