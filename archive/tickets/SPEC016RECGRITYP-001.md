# SPEC016RECGRITYP-001: Core per-type column manifest

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `@loom/core` module `records/column-manifest.ts` (per-type column registry, typed accessors, `projectDisplayValues`, severity ordinal) exported from `packages/core/src/index.ts`; new unit test `packages/core/test/column-manifest.test.ts`. No runtime behavior change to existing surfaces.
**Deps**: None

## Problem

The `/records` grid renders one fixed 7-column set for all 18 record types (`RecordBrowser.tsx:22–33`), so types like EMOTION show empty `Salience`/`Urgency` columns while hiding their relevant fields. A deterministic, testable per-type column manifest is the single source of truth both the server projection (which payload fields to extract) and the web grid (which columns to render, in what order) will consume. This ticket builds that manifest in `@loom/core` — the foundation the rest of SPEC-016 depends on.

## Assumption Reassessment (2026-06-09)

1. The 18 record types are `recordTypes` from `packages/core/src/records/registry.ts:37` (assembled from `entity`/`cast-member`/`knowledge`/`space-material`/`causal-pressure`/`relationship-emotion` definitions = 18). Per-type primary-label fields already exist as `labelFieldsByType` (`editor-descriptors.ts:118–137`); the manifest's primary-label column reuses those, it does not re-derive them.
2. Every additional-column field key named in SPEC-016's manifest table (§Per-type column manifest) was verified field-by-field against the schema source during `/reassess-spec` this session — e.g. EMOTION `affect_kind`/`intensity` (`relationship-emotion.ts:51,74`), FACT `fact_kind`/`scope`/`salience` (`knowledge.ts:15,17,20`), OPEN THREAD `type`/`urgency`/`current_relevance` (`causal-pressure.ts:131,136,137`). All keys exist; the unit test re-proves this as a fail-closed guard.
3. Cross-artifact boundary under audit: `@loom/core` purity (no `react`/`fastify`/`vite`/`node:*`), enforced by ESLint `no-restricted-imports` and `packages/core/test/boundary.test.ts`. The manifest is pure data + typed accessors and must not import any platform/framework surface.
4. FOUNDATIONS principle motivating the design: §8 deterministic compilation / §4.4 — the manifest and `projectDisplayValues` are **display-only** projections that must never enter prompt compilation. The compiler consumes `parseRecordPayload` / record definitions, not the summary metadata. This ticket adds no path from the manifest into the compiler; the severity ordinal and `displayValues` exist solely for the records-browser presentation layer.

## Architecture Check

1. A single declarative manifest keyed by record type — consumed by both the server projection and the web grid — is cleaner than duplicating per-type column lists in the server and the React component, which would drift. Putting it in `@loom/core` keeps it pure and unit-testable without a server or DOM. Reusing `labelFieldsByType` for the primary column avoids a second source of truth for "the most important field per type."
2. No backwards-compatibility aliasing/shims: this is a net-new module; no existing export is renamed or wrapped.

## Verification Layers

1. Manifest completeness (an entry for every `recordTypes` member) -> codebase grep-proof + unit test asserting `manifest` keys === `recordTypes`.
2. Field-existence (every declared field key exists on that type's editor descriptor) -> unit test cross-referencing `getEditorDescriptor(type).fields` for each manifest column.
3. Core purity (no framework/platform imports) -> `packages/core/test/boundary.test.ts` (existing) + ESLint `no-restricted-imports`.
4. Determinism (same type → same ordered columns; severity ordinal is a fixed map) -> unit test asserting stable column order and ordinal ranking; no `Date.now()`/`Math.random()`.

## What to Change

### 1. New manifest module `packages/core/src/records/column-manifest.ts`

- Export a typed `ColumnDescriptor` (`{ fieldKey: string; header: string; kind: "enum" | "boolean" | "short_string" | "ordinal"; align?: "left" | "right" }`) and a `RecordColumnManifestEntry` (`{ primaryLabelHeader: string; additionalColumns: readonly ColumnDescriptor[] }`).
- Export `recordColumnManifest: Readonly<Record<string, RecordColumnManifestEntry>>` covering all 18 types per SPEC-016's table. OPEN THREAD's `type` column uses header **"Thread kind"** (avoids colliding with the record-`type` column). ENTITY's `roles_in_story` is array-valued — mark its descriptor so the projection join-formats it.
- Export the minimal "All types" column set: `allTypesColumns` = Working Set (rendered by the grid, not the manifest) + Type + Label + Status + Updated.
- Export `severityOrdinal: Readonly<Record<string, number>>` for the shared enum domain (`low < medium < high < critical`; intensity adds `extreme`), and a helper `compareSeverityDesc(a, b)` for the default-sort consumer.
- Export `projectDisplayValues(recordType: string, payload: unknown): Record<string, string | null>` — for each manifest additional column, read the payload key, format scalars/enums to strings, join-format array columns (`roles_in_story`), and emit `null` for absent values. Pure; no DB/IO.
- Export typed accessors `getColumnManifest(recordType)` and `getAdditionalColumnKeys(recordType)`.

### 2. Re-export from `packages/core/src/index.ts`

Add the manifest types, `recordColumnManifest`, `allTypesColumns`, `severityOrdinal`/`compareSeverityDesc`, and `projectDisplayValues` alongside the existing `records/*` exports (near `recordTypes`, line ~158).

## Files to Touch

- `packages/core/src/records/column-manifest.ts` (new)
- `packages/core/test/column-manifest.test.ts` (new)
- `packages/core/src/index.ts` (modify)

## Out of Scope

- The server projection wiring and `RecordMetadata`/`api.ts` type changes (SPEC016RECGRITYP-002).
- Any `RecordBrowser.tsx` rendering (SPEC016RECGRITYP-003/004) or CSS (005).
- Resolving reference fields (UUID holders/targets) to display names — deferred per spec §Out of Scope.
- User-configurable columns / saved views — deferred per spec §Out of Scope.

## Acceptance Criteria

### Tests That Must Pass

1. `npx vitest run packages/core/test/column-manifest.test.ts` — manifest has an entry for every `recordTypes` member; each declared field key exists on that type's `getEditorDescriptor` fields; `projectDisplayValues("EMOTION", …)` emits `affect_kind`/`intensity`, `projectDisplayValues("FACT", …)` emits `fact_kind`/`scope`/`salience`; absent fields → `null`; `roles_in_story` join-formats to a string.
2. `npx vitest run packages/core/test/boundary.test.ts` — `@loom/core` purity holds with the new module present.
3. `npm run typecheck && npm run lint && npm test` — full gates pass (incl. the core import-boundary rule).

### Invariants

1. `Object.keys(recordColumnManifest)` is exactly the set `recordTypes` (no missing, no extra type).
2. Every `additionalColumns[].fieldKey` exists on the corresponding type's payload schema/editor descriptor (fail-closed: a stale key fails the test).
3. `projectDisplayValues` is referentially pure — identical `(recordType, payload)` yields identical output; no platform/framework import enters `@loom/core`.

## Test Plan

### New/Modified Tests

1. `packages/core/test/column-manifest.test.ts` (new) — completeness, field-existence, `projectDisplayValues` formatting (scalars, enums, array join, null absences), severity-ordinal ordering.
2. `packages/core/test/boundary.test.ts` (existing) — re-run to confirm purity with the new module.

### Commands

1. `npx vitest run packages/core/test/column-manifest.test.ts`
2. `npm test`
3. Targeted vitest is the correct boundary because the manifest is pure core logic with no server/DOM dependency; `npm test` builds `@loom/core` first then runs the suite, covering the boundary rule end-to-end.

## Outcome

Completed: 2026-06-09

What changed:
- Added `packages/core/src/records/column-manifest.ts` with the per-type column manifest, minimal all-types columns, severity ordering, display-value projection, and typed accessors.
- Re-exported the manifest API from `packages/core/src/index.ts`.
- Added `packages/core/test/column-manifest.test.ts` covering manifest completeness, descriptor field existence, all-types columns, display-value formatting, array join formatting, and severity ordering.

Deviations from original plan:
- Used `npm exec vitest -- ...` for targeted Vitest commands rather than `npx vitest ...`; the same tests were run against the same files.
- `allTypesColumns` exports the data columns (`Type`, `Label`, `Status`, `Updated`); the Working Set column remains a grid-owned leading column as the ticket described.

Verification:
- `npm exec vitest -- run packages/core/test/column-manifest.test.ts` — passed.
- `npm exec vitest -- run packages/core/test/boundary.test.ts` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed.
