# SPEC002LOCPROFOL-001: `@loom/core` storage contract (pure)

**Status**: ✅ COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `@loom/core` storage-contract surface (`projectMetadataSchema`, taxonomy types, version-compatibility decision functions, identity constants); adds `zod` as a `@loom/core` dependency
**Deps**: None

## Problem

Phase 2 needs a pure, I/O-free contract that the server's storage layer and the
web UI can both depend on: the project-metadata schema (closed, so forbidden
fields cannot round-trip), the open-failure taxonomy types, the fixed store
identity constants, and the deterministic version-compatibility decision. Placing
these in `@loom/core` keeps them unit-testable without a filesystem and preserves
the SPEC-001 purity boundary (`docs/FOUNDATIONS.md` §4.4 testable core).

## Assumption Reassessment (2026-06-05)

1. `@loom/core` currently exports only `versionInfo` / `VersionInfo` from
   `packages/core/src/index.ts`; `packages/core/src/version.ts` is the sole logic
   module. No `projectMetadataSchema`, `LOOM_APPLICATION_ID`, `OpenFailureKind`,
   or `evaluateStoreCompatibility` symbol exists yet (grep over `packages/` is
   empty) — this is a clean addition, no rename/removal.
2. `docs/requirements-version-1/LOCAL-FIRST-STORAGE.md` ("Project metadata/config
   files") enumerates the allowed metadata fields (title, UUID, created/updated,
   expected schema-min version, database filename, description, demo marker) and
   the forbidden set (API keys, prompts, prose, cloud identifiers). SPEC-002
   Deliverable 1 and `docs/requirements-version-1/TECHNOLOGY-DECISIONS.md` ("raw
   SQL via `node:sqlite`… Zod for runtime parsing") govern the shape.
3. Shared boundary under audit: the metadata + taxonomy + compatibility contract
   is the seam consumed by SPEC002LOCPROFOL-002/003 (server) and -005 (web). Its
   field names and union members are the cross-artifact contract — fix them here
   so downstream tickets grep against a stable surface.
4. FOUNDATIONS principles motivating this ticket: §23/§29.9 (secrets never in
   project files) is enforced structurally by a **closed** schema that rejects
   unknown keys, so an `openRouterApiKey`-shaped field cannot round-trip; §24/
   §29.10 (user-owned, inspectable data) is served by a small readable metadata
   schema; §4.4 (deterministic, I/O-free core) by keeping the decision functions
   pure.
5. Enforcement surfaces: the closed Zod schema is part of the secret firewall
   (§15/§29.9) — verify `.strict()`/closed semantics reject extra keys in tests;
   the version-compatibility and application-id functions are deterministic core
   logic (§4.4/§8) — same inputs must always yield the same branch, with no
   `node:*`, wall-clock, or framework import. The new `zod` dependency must not
   trip the core import boundary: `eslint.config.js` `no-restricted-imports` and
   `packages/core/test/boundary.test.ts` restrict only `fastify`/`react`/`vite`/
   `node:*` — `zod` is permitted, and the boundary test must remain green.

## Architecture Check

1. A pure core contract is cleaner than defining the schema inside `@loom/server`
   because it lets the version-gate decision and the closed-schema guarantee be
   tested with in-memory objects (no temp dirs), and lets `@loom/web` reuse the
   exact taxonomy/status types instead of re-declaring drift-prone duplicates.
2. No backwards-compatibility aliasing/shims: these are net-new exports; nothing
   is renamed or wrapped.

## Verification Layers

1. Closed-schema firewall (no forbidden field round-trips) -> schema validation:
   unit test feeds metadata carrying `openRouterApiKey` and asserts a Zod parse
   error.
2. Deterministic version gate (every branch) -> unit test enumerating
   `storeUserVersion <,=,>` `appSchemaVersion` and asserting `migration-required`
   / `ok` / `incompatible-version`.
3. Core purity preserved -> codebase grep-proof: `packages/core/test/boundary.test.ts`
   passes (no `node:*`/framework import in `src/`).
4. Identity classification -> unit test: `classifyApplicationId(LOOM_APPLICATION_ID)`
   is `ok`; `0` and any other value are `not-a-loom-store`.

## What to Change

### 1. Add `zod` to `@loom/core`

Add `"zod": "^4"` to `packages/core/package.json` `dependencies` (matching the
`@loom/server` major, `^4.1.13`). No other dependency is introduced.

### 2. New storage-contract module

Add `packages/core/src/project-storage.ts`:

- `LOOM_APPLICATION_ID` — a fixed nonzero 32-bit **signed** integer chosen once
  and frozen (suggested: `0x4c4f4f4d` = `1280262477`, ASCII "LOOM"; any frozen
  nonzero value within signed-32-bit range is acceptable). Comment that changing
  it later orphans existing stores.
- `LOOM_SCHEMA_VERSION` — baseline `user_version`, `1`.
- `projectMetadataSchema` — a **closed/strict** Zod object (rejects unknown keys)
  for `continuity-loom.project.json`: `title` (non-empty string), `projectUuid`
  (uuid string), `createdAt` / `updatedAt` (ISO datetime strings), `schemaMinVersion`
  (int), `databaseFilename` (string), optional `description` (string), optional
  `isDemoFixture` (boolean). Export the inferred `ProjectMetadata` type.
- `StoreCompatibility = "ok" | "incompatible-version" | "migration-required"`.
- `OpenFailureKind = "missing-metadata" | "invalid-metadata" | "not-a-loom-store"
  | "incompatible-version" | "migration-required" | "invalid-sqlite" | "unreadable"`.
- `ProjectStatus` — `{ folderPath; title; projectUuid; databaseFilename;
  appSchemaVersion; storeUserVersion; compatibility: StoreCompatibility }`.
- `OpenProjectResult = { ok: true; status: ProjectStatus } | { ok: false;
  kind: OpenFailureKind; message: string }`.
- `evaluateStoreCompatibility(appSchemaVersion: number, storeUserVersion: number):
  StoreCompatibility` — `>` → `incompatible-version`; `<` → `migration-required`;
  `===` → `ok`. The store's `user_version` is the authoritative input (per
  SPEC-002 §Approach "Authoritative version source").
- `classifyApplicationId(storeApplicationId: number): "ok" | "not-a-loom-store"`
  — `=== LOOM_APPLICATION_ID` → `ok`; otherwise (including `0`) → `not-a-loom-store`.

### 3. Re-export from the package entrypoint

Extend `packages/core/src/index.ts` to export the new schema, constants, types,
and functions.

## Files to Touch

- `packages/core/package.json` (modify) — add `zod` dependency
- `packages/core/src/project-storage.ts` (new)
- `packages/core/src/index.ts` (modify) — re-export new surface
- `packages/core/test/project-storage.test.ts` (new) — unit tests

## Out of Scope

- Any `node:sqlite` / `node:fs` access or store probing (SPEC002LOCPROFOL-002/003).
- The full open-failure *classification flow* (I/O-driven); this ticket ships only
  the pure types + the two pure decision functions the server will call.
- Migration runner / `migration-failed` kind — deferred per SPEC-002 Out of Scope.
- API routes, web UI, requirements-doc updates.

## Acceptance Criteria

### Tests That Must Pass

1. `npm run test --workspace @loom/core` — new `project-storage.test.ts` passes:
   schema accepts a valid metadata blob; rejects an `openRouterApiKey`-bearing
   blob; rejects a missing required field; `evaluateStoreCompatibility` returns
   each branch; `classifyApplicationId` returns `ok` only for `LOOM_APPLICATION_ID`.
2. `npm run lint` — `@loom/core` import-boundary rule passes with `zod` added.
3. `npm run typecheck && npm test && npm run build` — all green.

### Invariants

1. `@loom/core` imports no `node:*`/`fastify`/`react`/`vite` (boundary test green).
2. `projectMetadataSchema` rejects any key not in its declared field set
   (closed-schema secret firewall, §29.9).

## Test Plan

### New/Modified Tests

1. `packages/core/test/project-storage.test.ts` — covers closed-schema accept/
   reject (incl. an API-key-shaped field), required-field rejection, and every
   `evaluateStoreCompatibility` / `classifyApplicationId` branch.

### Commands

1. `npm run test --workspace @loom/core`
2. `npm run lint && npm run typecheck && npm test && npm run build`

## Outcome

Completed: 2026-06-05.

- Added the pure `@loom/core` storage contract, metadata Zod schema, identity/version constants, compatibility helpers, exported types, and focused unit tests.
- Deviation from plan: none; `zod` was already present in the root lockfile, so no lockfile update was needed.
- Verification: `npm run test --workspace @loom/core`, `npm run lint --workspace @loom/core`, and `npm run typecheck --workspace @loom/core` passed before archival.
