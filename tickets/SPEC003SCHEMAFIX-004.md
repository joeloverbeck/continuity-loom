# SPEC003SCHEMAFIX-004: Remove invented STOP GUIDANCE `stop_before` field

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `@loom/core` `packages/core/src/records/generation-brief.ts` `stopGuidanceSchema`.
**Deps**: None (corrects SPEC-003, archived/completed)

## Problem

`stopGuidanceSchema` (`generation-brief.ts:152–157`) declares a `stop_before` field:

```ts
export const stopGuidanceSchema = z.object({
  soft_unit_guidance: nonemptyString,
  stop_before: z.array(nonemptyString).default([])
}).strict();
```

`stop_before` appears **nowhere** in the governing docs. `docs/story-record-schema.md` §3.8 defines STOP GUIDANCE with exactly one field, `soft_unit_guidance: prose`. `docs/compiler-contract.md` maps only `{soft_unit_guidance}` (line 153) into `<stop_rule>`; there is no `stop_before` placeholder or source. The field is therefore dead weight — persisted into `generation_session` but uncompilable and unvalidated — and contradicts both §3.8 and the field-economy rule (§13: a field with no compilation, validation, continuity, voice, or authorial-control function should be deleted). The stop boundary is already expressible inside `soft_unit_guidance` prose and enforced by the §11 / compiler-contract stop blockers.

## Assumption Reassessment (2026-06-05)

1. Current code: `packages/core/src/records/generation-brief.ts:155` (`stop_before` in `stopGuidanceSchema`); the schema is embedded in `generationSessionSchema` (`:168`) as the optional `stop_guidance` surface.
2. Authoritative shape: `docs/story-record-schema.md` §3.8 — STOP GUIDANCE has only `soft_unit_guidance`. `docs/compiler-contract.md:153` — only `{soft_unit_guidance}` compiles into `<stop_rule>`; grep confirms `stop_before` is absent from `docs/`.
3. Schema under audit: STOP GUIDANCE generation-time brief surface, persisted via the server `generation_session` singleton (JSON). Removing `stop_before` is a **breaking** removal for any persisted session JSON that carries it, but no released store exists (dev-only, forward-only DDL) and no consumer reads `stop_before` (no placeholder, no validator), so removal is consumer-safe.
4. FOUNDATIONS principle restated: §13 field economy (delete fields with no concrete function) and §8/§29.4 deterministic compilation (every prompt-facing field names its destination; a field with no compiler destination is not a prompt field). Restated: STOP GUIDANCE stays single-field prose; the stop boundary lives in `soft_unit_guidance`.
5. Decision recorded: the brainstorm triage weighed "remove from code" vs. "amend schema doc + compiler-contract to legitimize `stop_before`" and recommended **removal** — §3.8 is deliberately minimal and no need for a structured stop field has been demonstrated (YAGNI). This ticket implements removal. Legitimizing `stop_before` (the rejected alternative) would require a `story-record-schema.md` §3.8 amendment and a `compiler-contract.md` placeholder addition in the same change, per FOUNDATIONS §8 — out of scope here.
6. Adjacent check: no other brief surface invents undocumented fields (verified against §3.1–§3.8); this is a contained single-field removal.

## Architecture Check

1. Deleting `stop_before` makes STOP GUIDANCE transcribe §3.8 exactly and keeps the generation-time brief free of fields no phase can consume — cleaner than carrying a dead field until Phase 7 trips over its missing placeholder.
2. No backwards-compatibility shim — the field is removed, not deprecated/aliased; `.strict()` will now reject stray `stop_before` keys, surfacing any stale dev session instead of silently absorbing it.

## Verification Layers

1. STOP GUIDANCE schema has exactly one field (`soft_unit_guidance`) -> schema validation test (reject a payload containing `stop_before`).
2. `stop_before` removed from the core tree -> grep-proof (`grep -rn "stop_before" packages/core/src` returns nothing).
3. STOP GUIDANCE matches §3.8 / `{soft_unit_guidance}` is the only stop source -> FOUNDATIONS/compiler-contract alignment check (`docs/compiler-contract.md:153`).

## What to Change

### 1. Drop `stop_before`

In `generation-brief.ts`, reduce `stopGuidanceSchema` to `{ soft_unit_guidance: nonemptyString }` (`.strict()`). No change to `generationSessionSchema` wiring beyond the now-narrower `stop_guidance` shape.

## Files to Touch

- `packages/core/src/records/generation-brief.ts` (modify)
- `packages/core/test/records.test.ts` (modify — assert STOP GUIDANCE rejects `stop_before`, accepts bare `soft_unit_guidance`)

## Out of Scope

- Amending `docs/story-record-schema.md` §3.8 or adding a `stop_before` placeholder to `compiler-contract.md` (the rejected alternative — see Assumption Reassessment 5).
- Stop-rule blocker enforcement (blank / non-local / contradictory `soft_unit_guidance`) — Phase 6/7.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core` — STOP GUIDANCE accepts `{ soft_unit_guidance }` and rejects a payload containing `stop_before`.
2. `npm run typecheck && npm run lint && npm test && npm run build` — all green.

### Invariants

1. STOP GUIDANCE defines exactly the one field in `docs/story-record-schema.md` §3.8.
2. No `stop_before` reference remains in `packages/core/src`.

## Test Plan

### New/Modified Tests

1. `packages/core/test/records.test.ts` — STOP GUIDANCE single-field accept + `stop_before` rejection.

### Commands

1. `npm test --workspace @loom/core`
2. `npm run typecheck && npm run lint && npm test && npm run build`
