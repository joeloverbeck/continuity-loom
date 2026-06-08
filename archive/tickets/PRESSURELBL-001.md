# PRESSURELBL-001: Resolve causal-pressure reference fields to display labels instead of raw UUIDs

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — `packages/core/src/compiler/sections/pressure.ts`, `packages/core/src/compiler/labels.ts` (reuse), `docs/compiler-contract.md` (§9 + rows 139-143), `packages/core/test/golden-first-segment.prompt.txt`
**Deps**: None

## Problem

Causal-pressure sections render entity-reference fields as raw record UUIDs. For example `<active_obligations_and_consequences>` shows:

```
Obligations:
- … ; owed by: 019ea1b1-3957-705f-8332-d3a06305ccd3; owed to: 019ea274-2ac7-… ; …
Consequences:
- … ; target: 019b0298-…; cause: 019b0298-…; …
```

and `<active_plans_and_intentions>` shows `holder: 019b0298-…` (reproduced at `golden-first-segment.prompt.txt:240-241,257`). The prose writer is handed opaque UUIDs where character names belong. This contradicts FOUNDATIONS §8 ("prose-facing prompt sections, not raw database dumps") and the established id-resolution pattern already used for `secret_holders`, `objects`, `onstage_entities`, etc. (`compiler-contract.md` §9).

The fix must resolve **reference** fields to display labels while leaving **free-text** fields untouched, because some adjacent fields are author-written prose (and `cause` is a `recordId | free-text` union).

## Assumption Reassessment (2026-06-08)

<!-- Items 1-3 always required. -->

1. **The reference fields are rendered raw by `labelValue` with no id resolution.** Confirmed in `packages/core/src/compiler/sections/pressure.ts`:
   - `active_intentions` (`:49-57`) renders `labelValue("holder", payload.holder)`.
   - `active_plans` (`:58-67`) renders no holder label currently — **but** the holder UUID surfaces via the intentions path and PLAN holder is the same reference class; confirm during implementation whether PLAN holder is rendered (golden shows INTENTION holders at `:240-241`). *(Reassess: golden lines 240-241 are INTENTION records; PLAN renders `objective`/`current step`/… without `holder`. PLAN.holder is therefore currently unrendered — including it is an additive consistency improvement, see item 8.)*
   - `active_obligations` (`:78-87`) renders `owed by: payload.owed_by`, `owed to: payload.owed_to`.
   - `active_consequences` (`:88-97`) renders `target: payload.holder_or_target`, `cause: payload.cause`.
   `labelValue` (`:184-187`) and `renderValue` (`:172-178`) stringify arrays/values with no snapshot lookup.
2. **Schema confirms which fields are references vs free-text** (`packages/core/src/records/causal-pressure.ts`):
   - **Reference (resolve):** `intentionSchema.holder` (`recordId`, `:40`), `planSchema.holder` (`recordId`, `:52`), `obligationSchema.owed_by` (`array<recordId>`, `:105`), `obligationSchema.owed_to` (`array<recordId> | "public"|"institution"|"self"|"unknown"`, `:106`), `consequenceSchema.holder_or_target` (`array<recordId> | recordId | "public"|"unknown"`, `:119`), `consequenceSchema.cause` (`recordId | nonemptyString`, `:120`).
   - **Free-text (do NOT resolve):** `intent`, `objective`, `terms`, `consequence_if_broken` ("if broken"), `current_effect`, `possible_next_effect`, `urgency` (enum).
   The canonical resolver already exists: `resolveRecordLabel(snapshot, value)` (`packages/core/src/compiler/labels.ts:8-16`) returns the matched record's display label, or the **input unchanged** when no record matches — so it is safe for the `cause` union (a free-text cause passes through verbatim).
3. **Shared boundary under audit:** the id-resolution contract in `compiler-contract.md` §9 (which currently enumerates `pov_character`, `onstage_entities`, `offstage_pressuring_entities`, `secret_holders`, `secret_non_holders_to_protect`, `objects`, `visible_affordances` as label-resolving placeholders — causal-pressure placeholders are **absent** and must be added) plus rows 139 (`active_intentions`), 140 (`active_plans`), 142 (`active_obligations`), 143 (`active_consequences`).

4. **FOUNDATIONS principle under audit:** §8 deterministic compilation ("render records into prose-facing prompt sections, not raw database dumps") and the §9-template prompt-label rule. Intended behavior: reference fields render the same human display labels the rest of the prompt already uses; determinism preserved (label derived from the selected snapshot).

5. **Deterministic-compilation surface:** resolution reads only `snapshot.records` via `resolveRecordLabel`. Raw-id fallback (when a referenced record is absent from the selected snapshot) matches the established behavior for `secret_holders`/`objects` (`compiler-contract.md` §9: "A raw id … means the referenced record was not available in the selected snapshot"). No LLM, no hidden state, secret firewall untouched.

6. **Schema-extension check:** no schema change. Only the *rendering* of existing reference fields changes. Sentinel literals (`public`/`institution`/`self`/`unknown`) and `cause` free-text render as literals, never forced through label lookup incorrectly.

8. **Adjacent contradiction / scope classification:** INTENTION.holder is the **same defect** the user named for obligations/consequences and is corrected here (required consequence). PLAN.holder is currently **unrendered**; resolving it is in scope per the brainstorm decision (consistency across all four causal-pressure reference-bearing records), implemented as an additive labeled field. Arrays (`owed_by`, multi-`holder_or_target`) must map element-wise through `resolveRecordLabel` and join, not stringify the array.

## Architecture Check

1. Routing reference fields through the existing `resolveRecordLabel` helper (already the canonical resolver used by front/tail sections) is consistent with how every other id-bearing placeholder is rendered, and the helper's pass-through-on-miss behavior cleanly handles the `cause` union and the absent-record fallback. The alternative (a bespoke resolver in `pressure.ts`) would duplicate logic and risk divergent fallback semantics — rejected.
2. No backwards-compatibility shims. Free-text fields keep their current `labelValue`/`asString` rendering; only reference fields gain resolution.

## Verification Layers

1. `owed_by`/`owed_to`/`holder_or_target`/`cause`(when a record id)/`holder` render display labels, not UUIDs -> new unit tests in `compiler-pressure-sections.test.ts` + regenerated golden.
2. Free-text fields (`terms`, `consequence_if_broken`, `current_effect`, `possible_next_effect`, free-text `cause`) render verbatim, never label-mangled -> new unit test with a free-text `cause`.
3. Sentinel `owed_to`/`holder_or_target` values render as literals (`public`, `institution`, `self`, `unknown`) -> new unit test.
4. Array references render as comma-joined labels -> new unit test with multi-element `owed_by`.
5. Absent referenced record falls back to raw id (parity with §9) -> new unit test.
6. Contract §9 + rows 139-143 updated -> schema validation (prompt-section conformance vs `compiler-contract.md`).

## What to Change

### 1. Resolve reference fields in `pressure.ts`

Thread `snapshot` into the projection closures and replace raw rendering of reference fields with `resolveRecordLabel`-based resolution (array-aware; element-wise map + join). Apply to: `active_intentions.holder`, `active_plans.holder` (new labeled field), `active_obligations.owed_by`/`owed_to`, `active_consequences.holder_or_target`/`cause`. Sentinel enum values bypass lookup and render literally. Leave all free-text fields exactly as they are.

### 2. Update `docs/compiler-contract.md`

Add the causal-pressure reference fields to the §9 id-resolution enumeration, and update rows 139, 140, 142, 143 to state that holder/owed_by/owed_to/holder_or_target/cause resolve to selected records' display labels with raw-id fallback, while named free-text fields render verbatim.

### 3. Regenerate the golden

Update `packages/core/test/golden-first-segment.prompt.txt` so intention holders and the consequence `target`/`cause` render labels (e.g. `Niko`, the cause record's label) instead of UUIDs.

## Files to Touch

- `packages/core/src/compiler/sections/pressure.ts` (modify)
- `docs/compiler-contract.md` (modify) — §9, rows 139-143
- `packages/core/test/golden-first-segment.prompt.txt` (modify)
- `packages/core/test/compiler-pressure-sections.test.ts` (modify)

## Out of Scope

- Any schema change to causal-pressure records.
- Resolution of fields outside the causal-pressure sections (already handled elsewhere).
- EVENT `participants`/`causes`/`effects` rendering (those records render via other placeholders; not part of this defect).

## Acceptance Criteria

### Tests That Must Pass

1. New unit test: an OBLIGATION with `owed_by=[idA]`, `owed_to=[idB]` (both selected) renders `owed by: <labelA>; owed to: <labelB>` — no UUIDs.
2. New unit test: a CONSEQUENCE with `holder_or_target=idC` and `cause=idD` renders `target: <labelC>; cause: <labelD>`; a CONSEQUENCE with free-text `cause` renders that text verbatim.
3. New unit test: `owed_to="institution"` renders `owed to: institution`; absent referenced id falls back to the raw id.
4. New unit test: INTENTION/PLAN `holder` renders a label.
5. `npm run lint && npm run typecheck && npm test` (golden regenerated).

### Invariants

1. No causal-pressure reference field renders a record UUID when the referenced record is present in the snapshot (FOUNDATIONS §8; `compiler-contract.md` §9).
2. Author-written free-text fields are never routed through label resolution.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-pressure-sections.test.ts` — label resolution, free-text passthrough, sentinel literals, array join, absent-record fallback.
2. `packages/core/test/golden-first-segment.prompt.txt` — regenerated with labels.

### Commands

1. `npm test -- compiler-pressure-sections`
2. `npm run lint && npm run typecheck && npm test`

## Outcome

Completed on 2026-06-08.

Resolved causal-pressure reference fields through the existing selected-record display-label helper. INTENTION and PLAN holders now render labels, PLAN holder is included in the prompt, OBLIGATION `owed_by`/`owed_to` and CONSEQUENCE `holder_or_target`/record-id `cause` render labels when referenced records are selected, arrays render as comma-joined labels, sentinel literals remain literal, and free-text `cause` values remain verbatim. Missing referenced records keep the established raw-id fallback.

Updated `docs/compiler-contract.md` rows and §9, expanded pressure compiler tests, and regenerated the first-segment golden prompt to replace causal-pressure UUIDs with labels.

Deviation from original plan: none.

Verification:

- `npm test -- compiler-pressure-sections` passed.
- `npm test -- compiler-pressure-sections compiler-golden` passed.
- `npm run lint && npm run typecheck && npm test` passed with loopback binding allowed for server tests.
