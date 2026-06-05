# SPEC003SCHEMAFIX-006: Emit EVENT `location` reference in the projection

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `@loom/core` `packages/core/src/records/causal-pressure.ts` EVENT `extractReferences`.
**Deps**: None (corrects SPEC-003, archived/completed; substrate already exists)

## Problem

The EVENT reference extractor (`causal-pressure.ts:157–161`) emits `participant`, `record_link` (from `causes`/`effects`), and `known_by` references, but **never emits `location`**:

```ts
extractReferences: (payload: EventRecord) => [
  ...refsFromStrings("participant", payload.participants),
  ...refsFromStrings("record_link", [...payload.causes, ...payload.effects]),
  ...(Array.isArray(payload.known_by) ? refsFromStrings("known_by", payload.known_by) : [])
]
```

EVENT `location` is typed `z.union([recordId, z.enum(["unknown", "offstage"])])` — a reference-bearing `location_id` field per `docs/story-record-schema.md` §8.1. Because it is never extracted, real EVENT→LOCATION edges (when `location` holds a UUID) never reach `record_references`. Phase 6 deterministic validation cannot traverse them, so an EVENT referencing a deleted/absent LOCATION would not surface as a dangling reference. This is the inverse defect of `SPEC003SCHEMAFIX-005` (a missing edge, not a polluted one), found in the same round-2 audit.

## Assumption Reassessment (2026-06-05)

1. Current code: `packages/core/src/records/causal-pressure.ts:157–161`, EVENT `extractReferences`. `eventSchema.location` is `z.union([recordId, z.enum(["unknown", "offstage"])])` (verified in `causal-pressure.ts`), so it can hold either a UUID or one of two sentinels — extraction must guard the sentinels.
2. Canonical guard already exists: `referenceIfId(refRole, value)` (`packages/core/src/records/common.ts:14`) emits only for full-UUID values; `compactReferences` (`references.ts:6`) drops the `undefined`s. Same pattern used by OBJECT (`space-material.ts:94–99`) and applied to ENTITY STATUS in `SPEC003SCHEMAFIX-005`.
3. Schema under audit: the `record_references` projection contract; consumer is future Phase 6 validation plus the server's transactional projection refresh on save (`@loom/server` `record-repository.ts`). The change is **additive** — it adds `location` edges where a UUID exists; it removes nothing and changes no projection shape or DDL.
4. FOUNDATIONS principle restated: §8 deterministic compilation and §11 validation depend on a complete reference graph; an EVENT whose `location` UUID is invisible to the projection is a silent gap in the dangling-reference / contradiction substrate. Restated invariant: every reference-bearing field that holds a UUID must appear in the projection.
5. Adjacent-contradiction classification: this missing-edge gap is a **separate finding** from the ENTITY STATUS pollution bug (`SPEC003SCHEMAFIX-005`); both were uncovered by the round-2 audit (`docs/triage/2026-06-05-spec-003-schema-audit-triage.md`). No other reference-bearing field was found unextracted in the audit (all of OBJECT/SECRET/FACT/OBLIGATION/CONSEQUENCE/INTENTION/PLAN/RELATIONSHIP/EMOTION/BELIEF/PROSE MODE extractors were confirmed complete and guarded).

## Architecture Check

1. Adding a guarded `location` edge via `referenceIfId` brings EVENT to parity with its own already-extracted reference fields and with the registry-wide rule that every UUID-valued reference field is projected.
2. No backwards-compatibility shim — the edge is added directly; the sentinel cases simply emit nothing via the shared guard.

## Verification Layers

1. An EVENT with a UUID `location` emits a `location` reference -> unit test on EVENT `extractReferences`.
2. An EVENT with `location: "unknown"` and with `location: "offstage"` emits **no** `location` reference -> unit test.
3. Existing EVENT references (`participant`, `record_link`, `known_by`) are unchanged -> unit test asserts the full emitted set.

## What to Change

### 1. Add a guarded `location` edge to the EVENT extractor

In `causal-pressure.ts` EVENT `extractReferences`, append `referenceIfId("location", payload.location)` through `compactReferences` (or spread a `compactReferences([referenceIfId("location", payload.location)])`), keeping the existing `participant`/`record_link`/`known_by` emissions intact.

## Files to Touch

- `packages/core/src/records/causal-pressure.ts` (modify — add guarded EVENT `location` extraction; import `referenceIfId`/`compactReferences` if not already imported)
- `packages/core/test/records.test.ts` (modify — EVENT `location` reference-extraction coverage)

## Out of Scope

- ENTITY STATUS pollution fix — `SPEC003SCHEMAFIX-005`.
- The `ref_role` naming for EVENT location is `"location"`; no compiler/placeholder consumer exists yet (Phase 7), so no `compiler-contract.md` change this phase.
- Phase-6 validation behavior over the new edge.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core` — EVENT with a UUID `location` emits a `location` reference; EVENT with `location: "unknown"` or `"offstage"` emits none; `participant`/`record_link`/`known_by` emissions are unchanged.
2. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. EVENT emits a `location` reference only when `location` is a UUID.
2. Every reference-bearing field holding a UUID appears in the projection (EVENT `location` no longer excepted).

## Test Plan

### New/Modified Tests

1. `packages/core/test/records.test.ts` — EVENT UUID-location (ref emitted) and sentinel-location (no ref) cases, plus an assertion of the complete emitted reference set.

### Commands

1. `npm test --workspace @loom/core`
2. `npm run typecheck && npm run lint && npm test && npm run build`
