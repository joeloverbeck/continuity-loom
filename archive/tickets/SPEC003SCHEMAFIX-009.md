# SPEC003SCHEMAFIX-009: Store `salience`/`urgency` as TEXT, not REAL (enum fidelity)

**Status**: PENDING
**Priority**: LOW
**Effort**: Small
**Engine Changes**: Yes — `@loom/server` `packages/server/src/record-tables.ts` `records` DDL (`salience`/`urgency` column affinity); `@loom/core` `packages/core/src/records/metadata.ts` `recordMetadataSchema` (`salience`/`urgency` field types).
**Deps**: None (corrects SPEC-003, archived/completed; realizes the deferred LOW item recorded in `docs/triage/2026-06-05-spec-003-schema-audit-triage.md` "Decisions of record" #3, "Column affinity (REAL→TEXT) deferred, not rejected").

## Problem

The denormalized `records.salience` and `records.urgency` columns are declared `REAL` (`record-tables.ts:11–12`), and the common record-metadata schema types them as `z.union([z.number().finite(), z.string().min(1)])` (`metadata.ts:9–10`). Both model the fields as potentially numeric.

But in `docs/story-record-schema.md` **every** `salience` (FACT §6.1, BELIEF §6.2, SECRET §6.3, PLAN §8.3, CLOCK §8.4) and **every** `urgency` (INTENTION §8.2, OBLIGATION §8.5, CONSEQUENCE §8.6, OPEN THREAD §8.7) value is the categorical enum `low | medium | high | critical`. None is ever numeric. The registry projectors (`projectRecordSalience`/`projectRecordUrgency`) correctly return those enum **strings**.

So the declared column/type is unfaithful: it leans numeric while the data is always categorical. It "works" today only because SQLite type affinity stores a non-numeric string in a REAL-affinity column as TEXT — `record-layer.test.ts:167–171` even asserts `salience = "high"`/`"critical"` round-trips. The latent risk is Phase-6 deterministic salience/urgency-floor ordering or filtering over a REAL-affinity column (numeric coercion semantics on categorical data), and simple misleadingness for anyone inspecting the store with ordinary SQLite tooling (FOUNDATIONS §24 inspectability). The faithful encoding is TEXT + string.

## Assumption Reassessment (2026-06-05)

1. Current code: `packages/server/src/record-tables.ts:11–12` declares `salience REAL NULL, urgency REAL NULL`; `packages/core/src/records/metadata.ts:9–10` types `salience`/`urgency` as `z.union([z.number().finite(), z.string().min(1)]).nullable().optional()`. Projectors return strings (`packages/core/src/records/knowledge.ts`, `causal-pressure.ts` — all `low|medium|high|critical`); the repository writes the projection in the write transaction (`record-repository.ts:137–139`, `196–198`, `205–209`). `record-layer.test.ts:167–171` confirms enum strings already round-trip through the REAL column via affinity.
2. Authoritative fields: `docs/story-record-schema.md` §6.1/§6.2/§6.3/§8.3/§8.4 (`salience`) and §8.2/§8.5/§8.6/§8.7 (`urgency`) — all are `low | medium | high | critical`, with no numeric form anywhere in the doc. CLAUDE.md makes `story-record-schema.md` the field-level authority; per the project rule, fix the code to the doc.
3. Schema under audit: the common record-metadata `salience`/`urgency` projection (Zod type + DDL column). Consumers: future Phase-6 deterministic validation (salience/urgency floors), the future record browser's filter/sort, and the server repository's denormalized recompute on save. This is the contract change.
4. FOUNDATIONS principle restated: §13 (records & current continuity) and §11/§4.5 (fail-closed validation substrate) require the denormalized projection to be a faithful, deterministically-queryable image of the payload enum; §24 (local-first, inspectable) wants the on-disk column type to read truthfully under ordinary SQLite tooling. A REAL column over enum strings tensions both at the storage surface. Restated invariant: the `salience`/`urgency` column type and the metadata field type both encode a categorical enum, not a number.
6. Schema extension classification: this is a **narrowing** of the record-metadata projection type (drop the numeric union member) plus a column-affinity change — not a breaking change to stored data. Because SQLite stores the string regardless of declared affinity, every existing dev store already holds the correct TEXT value; only newly-created stores receive the `TEXT` declaration. No data migration is required (forward-only `CREATE TABLE IF NOT EXISTS`, no released stores — SPEC-003).
7. Blast radius of the type narrowing: `recordMetadataSchema.salience`/`.urgency` (`metadata.ts`); the repository's `RecordRepositoryRecord.salience`/`.urgency` (`record-repository.ts:24–25`, typed `string | number | null`) and `normalizeProjection` (`record-repository.ts:98–100`) may keep their wider `string | number` types harmlessly, or narrow to `string` for consistency. The registry `ProjectionProjector`/`projectRecordSalience`/`projectRecordUrgency` signatures (`registry.ts:13`, `69–75`) return `string | number | null` and are left unchanged (generic projection hooks; widening is harmless and avoids unrelated churn).
8. Adjacent-contradiction classification: this finding was **identified and deliberately deferred** in the round-2 audit (`docs/triage/2026-06-05-spec-003-schema-audit-triage.md`, "Deferred / not ticketed" + Decision of record #3 — "deferred, not rejected"). Ticketing it now is the anticipated LOW cleanup, **not** a reversal of a rejection. No other projection is affected — `status` is already `TEXT`, and `user_order` correctly stays `INTEGER`.

## Architecture Check

1. TEXT columns + a string-typed metadata field make the stored type match the categorical domain exactly, so Phase-6 ordering/filtering reasons over the enum with no numeric-affinity coercion surprises and the store reads truthfully under inspection. This is strictly closer to `story-record-schema.md` than the current numeric-leaning declaration.
2. No backwards-compatibility shim: the union member is dropped outright and the column declaration changed directly. No dual-read/dual-write path; existing dev stores are already correct by affinity.

## Verification Layers

1. A freshly created store's `records` table declares `salience`/`urgency` as `TEXT` -> server integration test reading `PRAGMA table_info(records)` (or equivalent) and asserting the declared types.
2. Saving records across all salience/urgency-bearing types and reading the denormalized columns yields the exact enum string, not a coerced number -> existing/extended `record-layer.test.ts` round-trip (already asserts `"high"`/`"critical"`; add an urgency-bearing type, e.g. OBLIGATION `urgency: "high"`).
3. `recordMetadataSchema` rejects a numeric `salience`/`urgency` and accepts the enum string -> core unit test on the metadata schema.

## What to Change

### 1. DDL column affinity (`record-tables.ts`)

Change `salience REAL NULL` -> `salience TEXT NULL` and `urgency REAL NULL` -> `urgency TEXT NULL` in the `records` `CREATE TABLE IF NOT EXISTS`. No other column changes; `user_order` stays `INTEGER`, `status` stays `TEXT`.

### 2. Metadata field type (`metadata.ts`)

Change `salience` and `urgency` from `z.union([z.number().finite(), z.string().min(1)]).nullable().optional()` to `z.string().min(1).nullable().optional()`.

### 3. (Optional, for type consistency)

Narrow `RecordRepositoryRecord.salience`/`.urgency` and `normalizeProjection`'s return to `string | null` in `record-repository.ts`. Keep the generic `ProjectionProjector`/`projectRecord*` signatures as-is. Only do this if it lands cleanly under typecheck; it is not required for correctness.

## Files to Touch

- `packages/server/src/record-tables.ts` (modify — `salience`/`urgency` columns `REAL` -> `TEXT`)
- `packages/core/src/records/metadata.ts` (modify — drop the numeric union member from `salience`/`urgency`)
- `packages/server/src/record-layer.test.ts` (modify — assert declared column type `TEXT`; add an `urgency`-bearing round-trip)
- `packages/core/test/records.test.ts` (modify — metadata schema rejects numeric salience/urgency, accepts enum string) *(adjust path to the actual core test file if different)*
- `packages/server/src/record-repository.ts` (modify — optional type narrowing per What to Change §3)

## Out of Scope

- Phase-6 salience/urgency-floor validation logic (consumes the column; not built here).
- Any change to the `status` projection (already `TEXT`, verified faithful) or `user_order` (correctly `INTEGER`).
- The `updateRecord` payload-`id`/PK consistency guard — separate ticket `SPEC003SCHEMAFIX-010`.
- A migration runner / `user_version` bump — still deferred (forward-only DDL, no released stores).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core` — `recordMetadataSchema` rejects a numeric `salience`/`urgency` and accepts `"high"`.
2. `npm test --workspace @loom/server` — a newly created store declares `salience`/`urgency` as `TEXT`; saving and reading a salience-bearing record (e.g. SECRET `"critical"`) and an urgency-bearing record (e.g. OBLIGATION `"high"`) yields the exact enum string.
3. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. The `records.salience` and `records.urgency` columns are declared `TEXT`, and the metadata schema types both as a string enum (never numeric).
2. The denormalized column equals the payload enum for every salience/urgency-bearing type after save (no regression in the projection wiring).

## Test Plan

### New/Modified Tests

1. `packages/core/test/records.test.ts` — metadata schema salience/urgency string-only acceptance/rejection.
2. `packages/server/src/record-layer.test.ts` — declared-column-type assertion + urgency round-trip.

### Commands

1. `npm test --workspace @loom/core && npm test --workspace @loom/server`
2. `npm run typecheck && npm run lint && npm test && npm run build`
