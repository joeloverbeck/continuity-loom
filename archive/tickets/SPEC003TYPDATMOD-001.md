# SPEC003TYPDATMOD-001: Core data-model substrate — common metadata, registry, UUIDv7, reference extractors

**Status**: ✅ COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `@loom/core` data-model surface: `packages/core/src/records/` (common record-metadata Zod schema, record-type registry framework, pure UUIDv7 generator, reference-projection extractor framework); new exports in `packages/core/src/index.ts`.
**Deps**: None

## Problem

After SPEC-002 the store holds zero record tables and `@loom/core` has no concept of a story record. Every later phase (CRUD, validation, compiler) needs a shared, pure substrate: a common record-metadata shape, a way to iterate record types deterministically, stable sortable identity, and reference-projection extraction. This ticket lays that substrate so the per-category schema tickets (002–009) and the server repository (011) hang off one framework instead of hardcoding a per-type switch.

## Assumption Reassessment (2026-06-05)

1. `@loom/core` is pure: `eslint.config.js:57-85` applies `no-restricted-imports` (fastify/react/vite + `node:*` patterns) to `packages/core/src/**`, and `packages/core/test/boundary.test.ts` greps `src/` recursively for `node:`/framework specifiers. UUIDv7 must use `globalThis.crypto.getRandomValues` + `Date.now()` (both globals, no import) — never `node:crypto`. The boundary test recurses into subdirectories, so `src/records/` is in scope.
2. `zod@^4.1.13` is a declared dependency of `@loom/core` (`packages/core/package.json`); closed schemas use `.strict()` so unknown keys (e.g. an API-key-shaped field) are rejected, per SPEC-003 §Approach and FOUNDATIONS §23.
3. Shared boundary under audit: `packages/core/src/index.ts` is the package's only public surface (currently re-exports `project-storage.js` + `version.js`). This ticket extends it with the records surface; downstream consumers (002–009, server 011) import from `@loom/core`, not deep paths.
4. FOUNDATIONS §29.4 ("no arbitrary unvalidated blobs") motivates the Zod-everywhere stance; §13 (atomic records, field economy) motivates the registry-driven, no-hardcoded-switch design. Restated: every record type must own a runtime schema, and iteration over types must be data-driven so additions stay mechanical.
5. Deterministic-compilation surface: UUIDv7 embeds `Date.now()`, but record IDs are **captured-at identity assigned once and stored durably**, not a compiled prompt input — Phase 3 has no compiler. This does not introduce nondeterminism into any compilation path (§8/§29.4), which does not exist yet. The generator stays pure and the boundary firewall (§15) is untouched (no secret/POV handling here).

## Architecture Check

1. A record-type **registry** (`recordType → { metadataShape, payloadSchema, statusEnum, extractReferences }`) lets editors (Phase 4) and validation (Phase 6) iterate types deterministically instead of a brittle per-type `switch`; additions are one registry entry. A pure UUIDv7 generator keeps identity in the I/O-free core, unit-testable without a filesystem.
2. No backwards-compatibility shims — this is a new surface. No alias paths; exports are additive to `index.ts`.

## Verification Layers

1. Core stays pure (no `node:*`/framework imports) -> codebase grep-proof via `packages/core/test/boundary.test.ts` (passes after the new `src/records/` files land).
2. UUIDv7 IDs are format-valid and monotonically sortable by creation order -> unit test (`vitest`) asserting version/variant nibbles and lexical ordering across a generated batch.
3. Common metadata schema rejects unknown keys and malformed values -> schema validation test (accept a valid metadata object; reject one carrying an extra `api_key` field).
4. Reference-extractor framework returns `{ refRole, targetId }` tuples for a registered type -> unit test against a stub registry entry (per-type extractors land in 003–009).

## What to Change

### 1. Common record-metadata schema

Add `packages/core/src/records/metadata.ts`: a Zod schema for the common columns — `id`, `type`, `displayLabel`, optional `status`, optional `salience`, optional `urgency`, `createdAt`, `updatedAt`, `archived`, optional `userOrder`. Per SPEC-003 §Approach, `status`/`salience`/`urgency` are **optional** (nullable denormalized projections of per-type payload fields). Use `.strict()`.

### 2. Record-type registry framework

Add `packages/core/src/records/registry.ts`: the `RecordTypeDefinition` type (`{ metadataShape, payloadSchema, statusEnum?, extractReferences }`) and a registry container keyed by record-type string. Expose a registration function and a typed lookup/iteration API. The registry is populated by tickets 002–009 (each registers its category); this ticket ships the framework + an empty/extensible registry, not the per-type entries.

### 3. Pure UUIDv7 generator

Add `packages/core/src/records/uuidv7.ts`: a `generateRecordId()` returning a UUIDv7 string built from `Date.now()` + `globalThis.crypto.getRandomValues`. No `node:*` import.

### 4. Reference-projection extractor framework

Add `packages/core/src/records/references.ts`: the `RecordReference = { refRole: string; targetId: string }` type and the dispatch that, given a record type + parsed payload, calls the registered extractor. Per-type extractors land with their schemas in 003–009.

### 5. Public exports

Extend `packages/core/src/index.ts` with the new records surface (schemas, registry API, `generateRecordId`, reference types/dispatch).

## Files to Touch

- `packages/core/src/records/metadata.ts` (new)
- `packages/core/src/records/registry.ts` (new)
- `packages/core/src/records/uuidv7.ts` (new)
- `packages/core/src/records/references.ts` (new)
- `packages/core/src/index.ts` (modify)
- `packages/core/test/records/uuidv7.test.ts` (new)
- `packages/core/test/records/metadata.test.ts` (new)
- `packages/core/test/records/registry.test.ts` (new)

## Out of Scope

- Per-type payload schemas, status enums, and reference extractors — tickets 002–009 (this ticket ships the framework only).
- Any server / DDL / repository code — tickets 010–012.
- CRUD UI, validation engine, compiler — Phases 4/6/7.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core` — UUIDv7 format/sortability, common-metadata accept/reject (incl. rejected extra `api_key` field), registry framework shape.
2. `npm run lint` — core import-boundary rule green (no `node:*`/framework imports in `src/records/`).
3. `npm run typecheck && npm test && npm run build` — all green.

### Invariants

1. `@loom/core` imports no `node:*` or framework module (boundary test green).
2. Record IDs are time-sortable UUIDv7 strings; identical inputs are not required (IDs are unique captured-at identity, not a compiled form).

## Test Plan

### New/Modified Tests

1. `packages/core/test/records/uuidv7.test.ts` — version/variant nibble assertions + lexical monotonicity across a generated batch.
2. `packages/core/test/records/metadata.test.ts` — valid metadata accepted; unknown-key (`api_key`) and malformed values rejected.
3. `packages/core/test/records/registry.test.ts` — register a stub type, look it up, iterate, and invoke its `extractReferences`.

### Commands

1. `npm test --workspace @loom/core`
2. `npm run typecheck && npm run lint && npm test && npm run build`

## Outcome

Completed: 2026-06-05.

Implemented the pure `@loom/core` record substrate: common metadata schema, UUIDv7 generator, registry, projection helpers, and public exports.

Deviation: the concrete schemas landed in the same implementation pass as the substrate rather than as isolated commits.

Verification: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` passed.
