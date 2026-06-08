# PRESSURELBL-003: Prefix the holder's display label on holder-bearing action-pressure summary lines

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `packages/core/src/compiler/sections/pressure.ts`, `docs/compiler-contract.md` (row 134), `packages/core/test/golden-first-segment.prompt.txt`, `packages/core/test/compiler-pressure-sections.test.ts`
**Deps**: None (independent of PRESSURELBL-002; both edit `pressure.ts` and the golden, so whichever lands second rebases the golden)

## Problem

The compact `{active_action_pressure}` lines in `<active_working_set>` render a directive that frequently does not name the person it belongs to, leaving an anonymous instruction. Observed in the committed golden (`packages/core/test/golden-first-segment.prompt.txt:200-201`) and reported from a live prompt:

```
- Stay away from her mother's apartment, as well from those streets near her poor neighborhood where those North-African men harassed her.; Ane Arrieta is wary, despondent.
```

The directive (`intent` for INTENTION, `objective` for PLAN) reads as a free-floating order; the reader must infer the owner from the second clause. The record carries the owner explicitly — `intentionSchema.holder` and `planSchema.holder` are `recordId` references (`packages/core/src/records/causal-pressure.ts`) — but the action-pressure summary line never renders it. The fix prefixes the resolved holder display label so the line reads `Ane Arrieta: Stay away from her mother's apartment…; …`.

This brings the **compact** action-pressure line into consistency with the **detailed** `active_intentions`/`active_plans` sections, which already resolve holders to display labels (PRESSURELBL-001), and with FOUNDATIONS §8 (prose-facing, names not raw references/anonymous directives).

## Assumption Reassessment (2026-06-08)

<!-- Items 1-3 always required. -->

1. **The action-pressure line is built without any holder reference.** Confirmed in `packages/core/src/compiler/sections/pressure.ts`: `active_action_pressure` (`:12-18`) projects `firstText(payload, ["behavioral_pressure", "current_step", "possible_pressure_now", "prompt_text"])`, and `pressureFromRecords` (`:136`) renders `compactParts([displayLabel(record), project(record, payload)])` — `displayLabel` derives from `intent` (INTENTION) / `objective` (PLAN) / `title` (OPEN THREAD) / `label` (VISIBLE AFFORDANCE) per `labelFieldsByType` (`packages/core/src/records/editor-descriptors.ts:115-134`); the holder is never read here.
2. **Which action-pressure types carry a single holder.** Confirmed in `packages/core/src/records/causal-pressure.ts`: `intentionSchema.holder` (`recordId`) and `planSchema.holder` (`recordId`) exist; `openThreadSchema` and the VISIBLE AFFORDANCE schema have **no** single holder field. So the prefix applies to INTENTION and PLAN only; OPEN THREAD and VISIBLE AFFORDANCE lines (e.g. the bench/vegetation entries) correctly remain name-less.
3. **Shared boundary under audit:** the holder-reference resolution contract. The canonical resolver `resolveRecordLabel(snapshot, value)` (`packages/core/src/compiler/labels.ts:8-16`) returns the matched record's display label, or the raw id when no record matches — the exact helper and raw-id-fallback semantics PRESSURELBL-001 used for the detailed sections. This ticket reuses it; it does not introduce a second resolver.
4. **FOUNDATIONS principle under audit:** §8 deterministic prompt compilation — render references as the human display labels the rest of the prompt uses, "not raw database dumps," and avoid anonymous directives. The holder label is deterministically derived from the selected snapshot; no LLM, no invented attribution.
6. **Schema-extension check:** no schema change. Only the *rendering* of an existing `holder` reference is added to the action-pressure line. The change is additive to the rendered line; the consumer is the prose prompt only.
8. **Adjacent contradiction / scope classification:** the named defect is the anonymous INTENTION directive; PLAN carries the same `holder` reference and the same anonymity, so prefixing PLAN is a required consequence handled here (consistency across the holder-bearing action-pressure types). OPEN THREAD / VISIBLE AFFORDANCE have no single holder — inventing a synthetic owner for them is out of scope and would violate §8 (no invented attribution).

## Architecture Check

1. Reusing `resolveRecordLabel` (already the canonical resolver for every id-bearing placeholder, including the detailed causal-pressure sections after PRESSURELBL-001) keeps fallback semantics uniform and avoids a bespoke resolver in `pressure.ts`. A leading `Name:` prefix — rather than a trailing `; holder: X` clause — matches the requested reading (the directive belongs to that person) and avoids re-introducing the metadata-dump feel PRESSURELBL-001 deliberately moved away from.
2. The prefix is applied only when the record exposes a single `holder` that resolves to a non-empty label; absent/unresolved holders leave the line exactly as today. No backwards-compatibility shim.

## Verification Layers

1. An INTENTION with a selected `holder` renders `- <holderLabel>: <intent>; <behavioral_pressure>` -> new unit test in `compiler-pressure-sections.test.ts` + regenerated golden.
2. A PLAN with a selected `holder` renders `- <holderLabel>: <objective>; <current_step>` -> new unit test.
3. An action-pressure record without a single holder (OPEN THREAD, VISIBLE AFFORDANCE) renders with no name prefix -> new/extended unit test.
4. A holder whose referenced record is absent from the snapshot falls back to the raw id prefix (parity with §9 / PRESSURELBL-001) — or, if preferred, no prefix; the test pins whichever the implementation chooses, consistent with `resolveRecordLabel` pass-through -> new unit test.

## What to Change

### 1. Prefix the holder label in the action-pressure projection (`pressure.ts`)

Thread `snapshot` into the action-pressure line construction so that, for records exposing a single `holder` reference (INTENTION, PLAN), the rendered line is `${resolveRecordLabel(snapshot, payload.holder)}: ${existingLine}` when the holder resolves to a non-empty label. Records without a single holder render unchanged. Implement without disturbing the knowledge/relationship/material summary paths.

### 2. Update `docs/compiler-contract.md`

Add a one-line Note to row 134 (`{active_action_pressure}`) stating that INTENTION/PLAN action-pressure lines are prefixed with the holder's resolved display label (raw-id fallback per §9), while holder-less action-pressure records render without a name prefix.

### 3. Regenerate the golden

Update `packages/core/test/golden-first-segment.prompt.txt` so the INTENTION action-pressure lines (`:200-201`) gain their holder-label prefix.

## Files to Touch

- `packages/core/src/compiler/sections/pressure.ts` (modify)
- `docs/compiler-contract.md` (modify) — row 134 Note
- `packages/core/test/golden-first-segment.prompt.txt` (modify)
- `packages/core/test/compiler-pressure-sections.test.ts` (modify)

## Out of Scope

- The knowledge-pressure duplication fix (PRESSURELBL-002).
- Any holder rendering in the **detailed** sections (already handled by PRESSURELBL-001).
- Inventing or synthesizing an owner for OPEN THREAD / VISIBLE AFFORDANCE (no single holder; would violate FOUNDATIONS §8).
- Any schema change to causal-pressure records.

## Acceptance Criteria

### Tests That Must Pass

1. New unit test: an INTENTION with `holder=idA` (selected) renders `- <labelA>: <intent>; <behavioral_pressure>`.
2. New unit test: a PLAN with `holder=idB` (selected) renders `- <labelB>: <objective>; <current_step>`.
3. New unit test: a VISIBLE AFFORDANCE / OPEN THREAD action-pressure line renders with no name prefix.
4. New unit test: an INTENTION whose `holder` record is absent from the snapshot falls back per `resolveRecordLabel` (raw-id prefix), with no crash.
5. `npm run lint && npm run typecheck && npm test` (golden regenerated).

### Invariants

1. Every holder-bearing action-pressure line names its owner with the same display label the rest of the prompt uses (FOUNDATIONS §8; `compiler-contract.md` §9 + row 134).
2. Holder-less action-pressure records are never given an invented owner; their lines are unchanged.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-pressure-sections.test.ts` — holder-prefix for INTENTION and PLAN, no-prefix for holder-less types, absent-record fallback.
2. `packages/core/test/golden-first-segment.prompt.txt` — regenerated with prefixed INTENTION lines.

### Commands

1. `npm test -- compiler-pressure-sections`
2. `npm run lint && npm run typecheck && npm test`
