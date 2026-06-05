# SPEC003SCHEMAFIX-005: Guard ENTITY STATUS `current_location` reference extraction

**Status**: PENDING
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `@loom/core` `packages/core/src/records/entity.ts` ENTITY STATUS `extractReferences`.
**Deps**: None (corrects SPEC-003, archived/completed; substrate already exists)

## Problem

The ENTITY STATUS reference extractor (`entity.ts:65–68`) emits a `current_location` reference whenever `payload.location` is truthy:

```ts
extractReferences: (payload: EntityStatus) => [
  { refRole: "entity_id", targetId: payload.entity_id },
  ...(payload.location ? [{ refRole: "current_location", targetId: payload.location }] : [])
]
```

But `location` is typed `z.union([recordId, z.enum(["unknown", "concealed", "offstage", "not_applicable"])])` (`entity.ts:47`). When it holds any of the four sentinels, the extractor writes that literal string into `record_references.target_id` as a non-UUID. This is the **exact defect class fixed for CONSEQUENCE in `SPEC003SCHEMAFIX-002`**: it pollutes the reference projection — the deterministic substrate Phase 6 validation traverses for contradiction and dangling-reference checks. A spurious `current_location → "offstage"` edge is either silently rotten data or a future false dangling-reference blocker.

`entity_id` (line 66) is **safe** — it is a bare `recordId`, always a UUID.

## Assumption Reassessment (2026-06-05)

1. Current code: `packages/core/src/records/entity.ts:65–68`, ENTITY STATUS `extractReferences`. Only the `location` branch (line 67) is defective; `entity_id` (line 66) is a pure `recordId` and needs no guard. `entitySchema` ENTITY has `extractReferences: () => []` (line 60) — no references, correct.
2. Canonical guard already exists: `referenceIfId(refRole, value)` (`packages/core/src/records/common.ts:14`) returns a `{refRole, targetId}` only for full-UUID values, else `undefined`; `compactReferences` (`references.ts:6`) drops the `undefined`s. This is the pattern OBJECT already uses (`space-material.ts:94–99`) and the pattern `SPEC003SCHEMAFIX-002` applied to CONSEQUENCE.
3. Schema under audit: the `record_references` projection contract (`from_record_id`, `ref_role`, `target_id`) populated from each type's `extractReferences` and refreshed transactionally on save (`@loom/server` `record-repository.ts`). Consumer: future Phase 6 deterministic validation. The fix changes only which tuples ENTITY STATUS emits — no projection-shape change, no DDL change.
4. FOUNDATIONS principle restated: §8 deterministic compilation and §11 validation/hard-fails depend on a clean reference graph; a reference whose `target_id` is the literal `"unknown"`/`"concealed"`/`"offstage"`/`"not_applicable"` is not a real outgoing reference. Restated invariant: the reference projection must contain only real, full-UUID outgoing references.
5. Adjacent-contradiction classification: this weak guard is a **separate instance of the same defect class** as `SPEC003SCHEMAFIX-002`, uncovered during the round-2 SPEC-003 schema audit (`docs/triage/2026-06-05-spec-003-schema-audit-triage.md`). It is fully contained in this ticket. A repo-wide audit found one further reference-projection defect — EVENT `location` is never extracted at all — handled separately in `SPEC003SCHEMAFIX-006` (a missing-edge gap, not pollution).

## Architecture Check

1. Routing ENTITY STATUS `location` through `referenceIfId`/`compactReferences` makes the type use the same full-UUID guard as the rest of the registry — one reference-detection rule, no per-type truthiness heuristic.
2. No backwards-compatibility shim — the inline truthiness ternary is removed, not retained behind a flag.

## Verification Layers

1. An ENTITY STATUS with `location: "offstage"` (and each other sentinel) emits **no** `current_location` reference -> unit test on ENTITY STATUS `extractReferences`.
2. An ENTITY STATUS with a UUID `location` still emits the `current_location` reference, and `entity_id` is always emitted -> unit test.
3. No truthiness-only reference emission remains in ENTITY STATUS -> code review of `entity.ts` against the `referenceIfId` pattern.

## What to Change

### 1. Replace the truthiness ternary with the canonical UUID guard

In `entity.ts` ENTITY STATUS `extractReferences`, import `referenceIfId` and `compactReferences`, then build the reference list as
`compactReferences([{ refRole: "entity_id", targetId: payload.entity_id }, referenceIfId("current_location", payload.location)])`
(or equivalent), dropping the `payload.location ? …` test. `entity_id` stays unconditional.

## Files to Touch

- `packages/core/src/records/entity.ts` (modify — import guards, rewrite ENTITY STATUS extractor)
- `packages/core/test/records.test.ts` (modify — ENTITY STATUS reference-extraction coverage)

## Out of Scope

- EVENT `location` extraction gap — `SPEC003SCHEMAFIX-006`.
- Other types' extractors (already UUID-guarded; verified in the round-2 audit).
- Phase-6 validation behavior over the projection.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core` — ENTITY STATUS with each `location` sentinel (`unknown`/`concealed`/`offstage`/`not_applicable`) emits zero `current_location` references; with a UUID `location` emits the `current_location` tuple; `entity_id` is emitted in all cases.
2. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. Every reference emitted by any record type targets a full-UUID `target_id`.
2. ENTITY STATUS emits a `current_location` reference only when `location` is a UUID.

## Test Plan

### New/Modified Tests

1. `packages/core/test/records.test.ts` — ENTITY STATUS sentinel-location (no ref) and UUID-location (ref emitted) cases.

### Commands

1. `npm test --workspace @loom/core`
2. `npm run typecheck && npm run lint && npm test && npm run build`
