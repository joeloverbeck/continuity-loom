# SPEC003SCHEMAFIX-001: Close CAST MEMBER §5.2 extended-field schemas

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — `@loom/core` `packages/core/src/records/cast-member.ts` CAST MEMBER payload schema (5 extended-field groups + 2 optional prose fields).
**Deps**: None (corrects SPEC-003, archived/completed; substrate already exists)

## Problem

SPEC-003 promised closed CAST MEMBER schemas with "no field silently dropped," but the five §5.2 optional extended groups were implemented as open blobs:

```ts
const looseObject = z.record(z.string(), z.unknown()).optional();
// ...
voice_extended: looseObject,
body_and_presence_extended: looseObject,
perception_and_embodiment: looseObject,
pressure_behavior_extended: looseObject,
agency_and_planning_extended: looseObject,
```

`docs/story-record-schema.md` §5.2 specifies **exact named subfields** for each group (e.g. `voice_extended.intimacy/anger/lying/register_switching/humor_or_irony_style/idiom_or_sociolect_notes` + `anti_generic_warnings` list). `z.record(z.string(), z.unknown())` accepts any keys and any values, so typos and arbitrary content pass validation and the Phase-7 schema→placeholder mapping (`compiler-contract.md:133`, which renders these named fields core-first) has no named shape to map. Additionally `relational_charge` and `moral_psychological_edge` use bare `z.string()` (accept `""`) while every other prose field uses `nonemptyString`.

## Assumption Reassessment (2026-06-05)

1. Current code: `packages/core/src/records/cast-member.ts:6` defines `looseObject`; lines 91–95 assign it to all five extended groups; lines 89–90 use bare `z.string().optional()` for `relational_charge`/`moral_psychological_edge`. The required core (§5.1) and `world_pressure_core` are already closed `.strict()` objects — leave them untouched.
2. Authoritative field list: `docs/story-record-schema.md` §5.2 (lines 404–442). The exact subfields are: `voice_extended` {intimacy, anger, lying, register_switching, humor_or_irony_style, idiom_or_sociolect_notes : prose; anti_generic_warnings : prose list}; `body_and_presence_extended` {body_limits, clothing_presentation, sensory_or_appearance_signatures : prose}; `perception_and_embodiment` {notices, misses, misreads, sensory_bias : prose}; `pressure_behavior_extended` {humiliated, offered_power, refused_power : prose}; `agency_and_planning_extended` {fallback_style, planning_blind_spots : prose}.
3. Schema under audit: the CAST MEMBER story record. Consumers in-repo today: the record-type registry (`registry.ts`, `castMemberDefinition`) and the server repository round-trip (`@loom/server`). The Phase-6 validator and Phase-7 compiler are the future consumers this fidelity protects; neither exists yet, so tightening now is consumer-safe.
4. FOUNDATIONS principle restated: §13 (field economy — every field earns its place via a concrete function; the doc names these fields precisely so the compiler can bind them) and §29.3 (active/onstage cast dossiers must not be silently compressed — the render order in `compiler-contract.md:133` enumerates these named groups). An open blob defeats the named-field contract §8 deterministic compilation depends on.
5. Schema-extension classification: this is a **tightening** (restrictive) change, not additive. Previously-accepted arbitrary keys would now be rejected. Safe because no released store exists (SPEC-003 shipped forward-only `CREATE TABLE IF NOT EXISTS`, no released data) and no compiler/validation consumer reads these fields yet.
6. Sub-field optionality: §5.2 marks the whole groups "Optional extended fields." Within a present group, subfields are independently optional (a user may fill `voice_extended.intimacy` without `humor_or_irony_style`). Model each group `.strict().optional()` with all subfields optional — `.strict()` preserves "no silent drop" by rejecting unknown keys.

## Architecture Check

1. Closed `.strict()` nested schemas mirroring §5.2 give the registry and the future compiler a named, traversable shape, and reject typo'd keys at write time — strictly cleaner than an opaque `z.record` that defers all field discovery to a phase that has no schema to read.
2. No backwards-compatibility shims — the `looseObject` helper is deleted, not aliased; no legacy-key acceptance path is retained.

## Verification Layers

1. Each extended group matches `docs/story-record-schema.md` §5.2 field names -> schema validation test (accept a fully-populated fixture; reject an unknown-key payload).
2. Sub-field optionality holds (a group with only one subfield parses) -> unit test.
3. `relational_charge`/`moral_psychological_edge` reject empty string -> unit test.
4. `looseObject` removed from the core tree -> grep-proof (`grep -rn "looseObject" packages/core/src` returns nothing).

## What to Change

### 1. Replace the five `looseObject` groups with closed schemas

In `packages/core/src/records/cast-member.ts`, delete the `looseObject` constant and define five `.strict().optional()` nested object schemas per §5.2. Prose subfields use `nonemptyString.optional()`; `voice_extended.anti_generic_warnings` is `z.array(nonemptyString).optional()`.

### 2. Tighten the two bare-string optional fields

`relational_charge` and `moral_psychological_edge` become `nonemptyString.optional()` (matching every other prose field).

## Files to Touch

- `packages/core/src/records/cast-member.ts` (modify)
- `packages/core/test/records.test.ts` (modify — add CAST MEMBER extended-field coverage, currently absent)

## Out of Scope

- The §5.1 required core, `world_pressure_core`, and `sample_utterances` (already closed/correct).
- Sample-utterance word-count / copy-policy compile rules — Phase 6/7.
- Compiling these fields into prompt sections — Phase 7.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core` — CAST MEMBER accepts a fully-populated §5.2 fixture, accepts a partially-filled group, and rejects an unknown key inside any extended group and an empty-string `relational_charge`.
2. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. Every §5.2 subfield name in `docs/story-record-schema.md` appears in the CAST MEMBER schema; no extended group accepts unknown keys.
2. No `z.record(...)`/`looseObject` blob remains in `packages/core/src/records/`.

## Test Plan

### New/Modified Tests

1. `packages/core/test/records.test.ts` — CAST MEMBER extended-group accept/reject (full fixture, partial group, unknown-key rejection, empty-prose rejection).

### Commands

1. `npm test --workspace @loom/core`
2. `npm run typecheck && npm run lint && npm test && npm run build`

## Outcome

Completed: 2026-06-05

What changed:
- Replaced the CAST MEMBER §5.2 open extended-field blobs with named `.strict()` Zod object schemas for `voice_extended`, `body_and_presence_extended`, `perception_and_embodiment`, `pressure_behavior_extended`, and `agency_and_planning_extended`.
- Tightened `relational_charge` and `moral_psychological_edge` from optional bare strings to optional non-empty prose strings.
- Added core record tests proving a fully populated §5.2 CAST MEMBER fixture parses, a partially populated extended group parses, an unknown extended-group key is rejected, and empty `relational_charge` is rejected.

Deviations from original plan:
- None.

Verification results:
- `npm test --workspace @loom/core` passed: 3 test files, 14 tests.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test` passed: 14 test files, 63 tests.
- `npm run build` passed.
- `rg -n "looseObject|z\\.record" packages/core/src/records` returned no matches.
