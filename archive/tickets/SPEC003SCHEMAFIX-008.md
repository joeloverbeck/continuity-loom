# SPEC003SCHEMAFIX-008: Make CURRENT AUTHORITATIVE STATE `offstage_pressuring_entities` required

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `@loom/core` `packages/core/src/records/generation-brief.ts` `currentAuthoritativeStateSchema`.
**Deps**: None (corrects SPEC-003, archived/completed; substrate already exists)

## Problem

`docs/story-record-schema.md` §3.2 lists `offstage_pressuring_entities` under CURRENT AUTHORITATIVE STATE **"Required fields,"** alongside its sibling `onstage_entities`. In code, `onstage_entities` is required (`generation-brief.ts:34`, `z.array(recordId)`), but `offstage_pressuring_entities` carries `.default([])` (`generation-brief.ts:35`):

```ts
onstage_entities: z.array(recordId),
offstage_pressuring_entities: z.array(recordId).default([]),
```

The `.default([])` lets an author omit the field entirely and have it silently materialize as `[]`. That breaks parity with the other §3.2 required fields and weakens the future Phase 6 minimum-completeness check: §3.2 is "always included, compact, explicit, and state-like," so absence of offstage pressure should be an explicit authored empty array, not a silent default. The doc is the field-level authority (CLAUDE.md), so the code is reconciled to the doc, not the reverse.

This is the mildest of the round-2 audit findings and the only one with a legitimate alternative resolution (relax the doc); the chosen direction — code fix to honor the doc — was confirmed during triage (`docs/triage/2026-06-05-spec-003-schema-audit-triage.md`).

## Assumption Reassessment (2026-06-05)

1. Current code: `packages/core/src/records/generation-brief.ts:30–47`, `currentAuthoritativeStateSchema`. Only `offstage_pressuring_entities` (line 35) carries `.default([])`; every other §3.2 field is required (no default). `recordId` is `z.uuid()` (`common.ts`).
2. Authoritative fields: `docs/story-record-schema.md` §3.2 (lines 123–140), which lists `offstage_pressuring_entities` under "Required fields." `onstage_entities` (line 34 in code) is the required sibling already modeled without a default.
3. Schema under audit: the CURRENT AUTHORITATIVE STATE generation-brief surface, persisted in `generation_session` JSON (`@loom/server`) and consumed by future Phase 6 minimum-completeness validation and Phase 7 compilation. Removing the default is a **tightening** change: a brief that previously omitted the field will now fail to parse until it supplies an explicit (possibly empty) array. No released stores exist (SPEC-003), so no migration is required.
4. FOUNDATIONS principle restated: §11 fail-closed validation and the §3.2 "always included / explicit / state-like" rule require that authoritative-state fields be authored, not defaulted. Restated invariant: every §3.2 "Required field" must be present in a valid CURRENT AUTHORITATIVE STATE, an empty list being a legitimate explicit value.
5. Adjacent-contradiction classification: §3.1 ACTIVE WORKING SET's `present_minor_cast_compressed`/`offstage_relevant_cast` also use `.default([])`, but §3.1 is **not** under a "Required fields" heading, so their defaulting is faithful and is **deliberately left unchanged** (classified no-action in triage). This ticket touches only the §3.2 required field. The chosen direction is code-fix (not doc-relax), per the triage decision record.

## Architecture Check

1. Removing `.default([])` brings `offstage_pressuring_entities` to parity with `onstage_entities` and every other §3.2 required field — one rule ("required fields are required") rather than a per-field exception.
2. No backwards-compatibility shim — the default is removed, not retained behind a flag; an empty list remains expressible as an explicit `[]`.

## Verification Layers

1. A CURRENT AUTHORITATIVE STATE payload omitting `offstage_pressuring_entities` **fails** Zod parse -> core unit test on `currentAuthoritativeStateSchema`.
2. A payload supplying `offstage_pressuring_entities: []` (explicit empty) and one supplying UUIDs both **pass** -> core unit test.
3. No other §3.2 field's required/optional status changes -> review of `currentAuthoritativeStateSchema` against §3.2.

## What to Change

### 1. Drop the default on `offstage_pressuring_entities`

In `generation-brief.ts` `currentAuthoritativeStateSchema`, change `offstage_pressuring_entities: z.array(recordId).default([])` to `offstage_pressuring_entities: z.array(recordId)`, matching `onstage_entities`.

## Files to Touch

- `packages/core/src/records/generation-brief.ts` (modify — remove `.default([])` on `offstage_pressuring_entities`)
- `packages/core/test/records.test.ts` (modify — required-field parse coverage for the field)

## Out of Scope

- §3.1 ACTIVE WORKING SET defaulted lists (`present_minor_cast_compressed`/`offstage_relevant_cast`) — faithful, left unchanged (triage no-action).
- Any doc change to `docs/story-record-schema.md` §3.2 (the alternative resolution was rejected in triage; the doc stays authoritative).
- Phase-6 minimum-completeness validation logic over the brief.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core` — `currentAuthoritativeStateSchema` rejects a payload omitting `offstage_pressuring_entities`; accepts one with an explicit `[]` and one with UUIDs.
2. `npm run typecheck && npm run lint && npm test && npm run build` — all green (including any existing brief fixtures updated to supply the now-required field).

### Invariants

1. Every §3.2 "Required field" must be present for a CURRENT AUTHORITATIVE STATE to validate.
2. An explicit empty `offstage_pressuring_entities: []` remains valid.

## Test Plan

### New/Modified Tests

1. `packages/core/test/records.test.ts` — omitted-field rejection and explicit-empty/UUID acceptance for `offstage_pressuring_entities`.

### Commands

1. `npm test --workspace @loom/core`
2. `npm run typecheck && npm run lint && npm test && npm run build`
