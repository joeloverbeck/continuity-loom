# SPEC003SCHEMAFIX-007: Project BELIEF and SECRET `salience` into the denormalized column

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `@loom/core` `packages/core/src/records/knowledge.ts` BELIEF and SECRET registry definitions (`projectSalience`).
**Deps**: None (corrects SPEC-003, archived/completed; substrate already exists)

## Problem

The `records` table carries a denormalized nullable `salience` column that SPEC-003 specifies the repository must recompute from each record's payload on every write, so Phase 6 validation and the future record browser can filter by salience without parsing JSON. The registry projects salience via an optional `projectSalience` hook (`registry.ts`), wired through `projectRecordSalience`.

FACT, PLAN, and CLOCK wire `projectSalience` (`knowledge.ts:91`, `causal-pressure.ts:176`, `causal-pressure.ts:184`). But **BELIEF and SECRET do not**, even though both carry a required `salience: low|medium|high|critical` field in their payload schemas (`docs/story-record-schema.md` §6.2, §6.3) and SPEC-003 / `DATA-MODEL-AND-RECORDS.md` list salience as denormalized for FACT/BELIEF/SECRET/PLAN/CLOCK. Their definitions stop at `projectStatus`/`extractReferences`:

```ts
{
  recordType: "BELIEF",
  payloadSchema: beliefSchema,
  statusValues: beliefStatusValues,
  projectStatus: (payload: Belief) => payload.status,
  extractReferences: (payload: Belief) => [{ refRole: "holder", targetId: payload.holder }]
},
{
  recordType: "SECRET",
  payloadSchema: secretSchema,
  statusValues: secretStatusValues,
  projectStatus: (payload: Secret) => payload.status,
  extractReferences: (payload: Secret) => [ /* holders, non_holders_to_protect */ ]
}
```

So a BELIEF or SECRET always lands with `salience = NULL` in the column, regardless of its payload. Any salience-based filtering silently omits all beliefs and secrets — a fidelity gap in exactly the high-salience concealment records Phase 6 most needs to surface.

## Assumption Reassessment (2026-06-05)

1. Current code: `packages/core/src/records/knowledge.ts:95–113` — BELIEF (no `projectSalience`) and SECRET (no `projectSalience`). `beliefSchema`/`secretSchema` both declare `salience` (verified in `knowledge.ts`). The projecting hook is `projectSalience`, consumed by `projectRecordSalience` in `registry.ts:65–67` (returns `?.() ?? null`), invoked by the repository in the write transaction (`@loom/server` `record-repository.ts:137–139`, `196–198`).
2. Authoritative fields: `docs/story-record-schema.md` §6.2 BELIEF `salience` and §6.3 SECRET `salience`. SPEC-003 Approach + `DATA-MODEL-AND-RECORDS.md` "Recommended storage shape" specify `salience` as a denormalized projection for FACT/BELIEF/SECRET/PLAN/CLOCK.
3. Schema under audit: the common record-metadata `salience` column contract. Consumers: future Phase 6 validation and the future record browser's salience filter; the server repository's denormalized-column recompute on save. The fix is **additive** — it populates a currently-NULL column for two types; no schema, DDL, or reference-projection change.
4. FOUNDATIONS principle restated: §13 records & current continuity and §11 fail-closed validation rely on the denormalized metadata being a faithful projection of the payload; a `salience` column that is NULL for every BELIEF/SECRET silently breaks salience-floor reasoning. Restated invariant: the denormalized `salience` column equals the payload `salience` for every type that defines one.
5. Adjacent-contradiction classification: this is a **separate finding** from the reference-projection bugs (`SPEC003SCHEMAFIX-005/006`), uncovered in the round-2 audit (`docs/triage/2026-06-05-spec-003-schema-audit-triage.md`). Audit confirmed `projectStatus` (incl. PLAN's `plan_status`), `projectUrgency`, and salience for FACT/PLAN/CLOCK are all correctly wired; only BELIEF/SECRET salience is missing. No type carries both salience and urgency, so no double-projection question arises.

## Architecture Check

1. Adding `projectSalience` to BELIEF and SECRET completes the registry-uniform rule "every type with a payload `salience` projects it," matching FACT/PLAN/CLOCK — no special-casing in the repository.
2. No backwards-compatibility shim — the hook is added directly; existing rows are re-projected on their next save (no released stores exist, per SPEC-003).

## Verification Layers

1. Saving a BELIEF with `salience: "high"` and a SECRET with `salience: "critical"` lands the value in the `records.salience` column -> server integration test (round-trip read of the denormalized column).
2. `projectRecordSalience("BELIEF", payload)` / `("SECRET", payload)` return the payload value, not `null` -> core unit test on the registry projection.
3. Status-less / salience-less types still project `null` -> existing registry behavior unchanged (no regression).

## What to Change

### 1. Wire `projectSalience` on BELIEF and SECRET

In `knowledge.ts`, add `projectSalience: (payload: Belief) => payload.salience` to the BELIEF definition and `projectSalience: (payload: Secret) => payload.salience` to the SECRET definition, matching FACT's hook (`knowledge.ts:91`).

## Files to Touch

- `packages/core/src/records/knowledge.ts` (modify — add `projectSalience` to BELIEF and SECRET)
- `packages/core/test/records.test.ts` (modify — registry salience-projection coverage for BELIEF/SECRET)
- `packages/server/src/record-layer.test.ts` (modify — denormalized `salience` column round-trip for a BELIEF and a SECRET)

## Out of Scope

- The `salience`/`urgency` SQLite column affinity (`REAL` vs `TEXT`) — not addressed here (separate LOW finding left unticketed per triage).
- Phase-6 salience-floor validation logic.
- Any change to the `status`/`urgency` projections (verified correct).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core` — `projectRecordSalience` returns the payload salience for BELIEF and SECRET.
2. `npm test --workspace @loom/server` — saving a BELIEF (`salience: "high"`) and a SECRET (`salience: "critical"`) and reading the row yields `salience` = the payload value, not NULL.
3. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. For every record type that declares a payload `salience`, the denormalized `records.salience` column equals that value after save.
2. Types without a payload `salience` still project NULL.

## Test Plan

### New/Modified Tests

1. `packages/core/test/records.test.ts` — BELIEF/SECRET salience projection returns the payload value.
2. `packages/server/src/record-layer.test.ts` — BELIEF/SECRET denormalized `salience` column round-trip.

### Commands

1. `npm test --workspace @loom/core && npm test --workspace @loom/server`
2. `npm run typecheck && npm run lint && npm test && npm run build`
