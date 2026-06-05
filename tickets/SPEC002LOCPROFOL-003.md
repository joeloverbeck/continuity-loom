# SPEC002LOCPROFOL-003: Open-failure taxonomy, defensive parse, version gate + secret-boundary test

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — hardens `@loom/server` `openProject` to classify every open-failure kind; adds the FOUNDATIONS §29.9 secret-boundary test
**Deps**: SPEC002LOCPROFOL-002

## Problem

A localhost storage layer must treat externally-edited project folders as
untrusted: missing/invalid metadata, a non-loom SQLite file, an incompatible or
older store, and unreadable/corrupt files must each surface as a structured,
actionable `OpenFailureKind` rather than throwing or crashing (SPEC-002 §Approach;
`LOCAL-FIRST-STORAGE.md` "What is hand-editable" / "Failure modes"). This ticket
converts SPEC002LOCPROFOL-002's green-path `openProject` into the full defensive
taxonomy and adds the secret-boundary test proving API-key-shaped data cannot be
written to a project through normal app paths.

## Assumption Reassessment (2026-06-05)

1. SPEC002LOCPROFOL-002 creates `packages/server/src/project-store.ts` with
   `createProjectStoreManager()` and a green-path `openProject` returning
   `{ ok: true, status }`; this ticket modifies that same file (declared `Deps`).
   The taxonomy union (`OpenFailureKind`, 7 members) and decision functions
   (`classifyApplicationId`, `evaluateStoreCompatibility`) come from
   SPEC002LOCPROFOL-001's `@loom/core` contract.
2. SPEC-002 §Approach "Version gate & open-failure taxonomy" + "Authoritative
   version source" govern: the store's `user_version` is authoritative; a
   `metadata.schemaMinVersion` ↔ store `user_version` disagreement surfaces
   `invalid-metadata`; `migration-failed` is intentionally **not** in the Phase-2
   taxonomy (no migration runs). `LOCAL-FIRST-STORAGE.md` "Secret-handling
   boundaries" requires any API key found in a project file/store to be a security
   bug — the secret-boundary test encodes that.
3. Shared boundary under audit: `openProject`'s return contract (`OpenProjectResult`)
   is what SPEC002LOCPROFOL-004's `/api/project/open` route serializes and
   SPEC002LOCPROFOL-005's UI renders; the 7 failure kinds + their messages are the
   cross-artifact contract this ticket finalizes.
4. FOUNDATIONS motivating this ticket: §11 (defensive, deterministic, actionable
   diagnostics — distinguish each failure rather than a generic error) and
   §23/§29.9 (secrets never enter project files/stores).
5. Enforcement surfaces: this is a fail-closed/defensive surface — verify every
   taxonomy branch returns its `kind` instead of throwing, and that the
   secret-boundary test exercises the **secret firewall** (§15/§29.9): a
   `createProject` call cannot persist an `openRouterApiKey`/`OPENROUTER_API_KEY`/
   `apiKey` field into metadata (closed schema rejects) or into the store (no such
   column/write path exists). Classification order is deterministic and uses no
   wall-clock or LLM input (§8).

## Architecture Check

1. Classifying failures at the server I/O boundary — while keeping the *decision*
   logic (`evaluateStoreCompatibility`, `classifyApplicationId`) pure in core — is
   cleaner than a catch-all try/catch: each kind maps to a specific remediation
   message, and the pure functions stay unit-tested in SPEC002LOCPROFOL-001 while
   the I/O-driven branches are integration-tested here.
2. No backwards-compatibility aliasing/shims: this replaces the interim green-path
   `openProject` body with its final defensive form; no parallel old path is kept.

## Verification Layers

1. Each taxonomy branch -> integration test, one case per kind:
   `missing-metadata` (no JSON file), `invalid-metadata` (malformed JSON / schema
   violation / `schemaMinVersion`↔`user_version` mismatch), `not-a-loom-store`
   (SQLite with `application_id` 0/other), `incompatible-version` (store
   `user_version` > app), `migration-required` (store `user_version` < app),
   `invalid-sqlite` (non-SQLite bytes in `loom.sqlite`), `unreadable` (I/O error).
2. No-throw guarantee -> integration test asserts `openProject` resolves an
   `{ ok: false, kind }` object (never rejects) for every malformed input above.
3. Secret firewall -> schema-validation + grep-proof test: `createProject` given
   an API-key-shaped extra field is rejected by the closed schema; reading the
   written metadata file and dumping the store shows no key-shaped value.
4. Authoritative version source -> integration test: when `schemaMinVersion`
   disagrees with the store `user_version`, result is `invalid-metadata` (not a
   silent trust of either).

## What to Change

### 1. Defensive `openProject` classification

Rewrite `openProject(folderPath)` in `packages/server/src/project-store.ts` to
return `OpenProjectResult` for every case, in deterministic order:

1. metadata file absent → `missing-metadata`.
2. metadata unreadable as JSON or fails `projectMetadataSchema` → `invalid-metadata`.
3. `loom.sqlite` absent or not a SQLite database / fails to open → `invalid-sqlite`.
4. store `application_id` ≠ `LOOM_APPLICATION_ID` (incl. 0) via `classifyApplicationId`
   → `not-a-loom-store`.
5. `metadata.schemaMinVersion` ≠ store `user_version` → `invalid-metadata`
   (metadata does not describe this store).
6. `evaluateStoreCompatibility(LOOM_SCHEMA_VERSION, storeUserVersion)` →
   `incompatible-version` or `migration-required` as applicable.
7. otherwise → `{ ok: true, status }`.
8. unexpected I/O errors (permission, etc.) → `unreadable`.

Each failure carries a plain-language, actionable `message`. No silent repair.

### 2. Secret-boundary test (FOUNDATIONS §29.9)

Add a test asserting no API-key-shaped field can be written to metadata or the
store via `createProject`: passing `{ ...validInput, openRouterApiKey: "sk-…" }`
is rejected by the closed schema; after a normal `createProject`, the on-disk
metadata JSON and a full dump of the store contain no `openRouterApiKey` /
`OPENROUTER_API_KEY` / `apiKey` substring.

## Files to Touch

- `packages/server/src/project-store.ts` (modify) — defensive `openProject`
- `packages/server/src/project-store.taxonomy.test.ts` (new) — one case per kind
- `packages/server/src/project-store.secret-boundary.test.ts` (new) — §29.9 test

## Out of Scope

- `migration-failed` kind and any migration execution — deferred per SPEC-002.
- API routes (SPEC002LOCPROFOL-004) and UI rendering of the diagnostics
  (SPEC002LOCPROFOL-005).
- The green-path create/close/status/backup behavior (owned by SPEC002LOCPROFOL-002).

## Acceptance Criteria

### Tests That Must Pass

1. `npm run test --workspace @loom/server` — `project-store.taxonomy.test.ts`
   passes with one asserting case per `OpenFailureKind`, each returning
   `{ ok: false, kind }` (never throwing); the `schemaMinVersion`↔`user_version`
   mismatch case returns `invalid-metadata`.
2. `project-store.secret-boundary.test.ts` passes: closed-schema rejection +
   no key-shaped value in the written metadata or store dump.
3. `npm run typecheck && npm test && npm run build` — all green.

### Invariants

1. `openProject` never rejects on malformed/foreign input — it resolves a typed
   `OpenFailureKind` (§11 defensive, fail-closed diagnostics).
2. No normal app write path can persist an API-key-shaped field into a project
   (§29.9 secret firewall).

## Test Plan

### New/Modified Tests

1. `packages/server/src/project-store.taxonomy.test.ts` — temp-dir fixtures for
   each failure kind incl. the version-mismatch → `invalid-metadata` case.
2. `packages/server/src/project-store.secret-boundary.test.ts` — secret firewall
   over metadata + store.

### Commands

1. `npm run test --workspace @loom/server`
2. `npm run typecheck && npm test && npm run build`
