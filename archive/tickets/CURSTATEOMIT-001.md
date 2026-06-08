# CURSTATEOMIT-001: Omit empty optional lines in `<current_authoritative_state>`

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — `current_authoritative_state` section rendering in `packages/core/src/compiler`; `docs/compiler-contract.md` and `docs/prompt-template.md` empty-state rules
**Deps**: None (independent of CURSTATELABEL-001 and CURSTATEEDIT-001; order-free)

## Problem

The `<current_authoritative_state>` block renders all 15 lines unconditionally, so unfilled optional fields emit placeholder noise:

```
Current physical positions: None currently specified
Routes and exits: None currently specified
Available time: None currently specified
...
```

This burns tokens and dilutes signal for the generating model when the writer intentionally left a field blank. The block should render only the lines that carry real state (plus the always-required lines), omitting empty optional lines entirely — header and value.

## Assumption Reassessment (2026-06-08)

1. **Code**: `<current_authoritative_state>` is a flat `SECTION_TEMPLATES` entry (`packages/core/src/compiler/template-constants.ts:127-143`) rendered by `renderSection` via regex placeholder substitution (`packages/core/src/compiler/compile-prompt.ts:39-47`). Every `{placeholder}` resolves to a value or its `EMPTY_STATE_CONSTANTS` fallback (`packages/core/src/compiler/sections/front.ts:170-173`, `empty-states.ts`), so empty lines always render.
2. **Existing omission precedent (the model to follow)**: composite sections render via `renderCompositeSection` (`compile-prompt.ts:49-60`), which omits a block entirely when its content is empty: `return content ? `${block.label}:\n${content}` : ""`. `docs/compiler-contract.md` (lines 257–260) already authorizes this: *"Optional prompt-preference fields may be omitted entirely when blank… Empty-state rendering is required only when omission would make the prompt ambiguous or structurally malformed,"* and the `relevant_facts`/`locations` composite sub-blocks "omit both the sub-block header and value when empty." `docs/prompt-template.md:379` shows the same conditional-omission pattern for `soft_unit_guidance`.
3. **Shared boundary under audit**: the empty-state-rendering contract for `<current_authoritative_state>` shared between the compiler and `docs/compiler-contract.md` (per-field mapping rows 98–112 + the empty-state rules) and the literal template in `docs/prompt-template.md`. All must agree after this change.
4. **FOUNDATIONS principle**: §4.4 / §8 deterministic compilation — omission is a deterministic function of input (line present iff field non-empty), so determinism holds; §28.2 token discipline — removing empty scaffolding directly serves "avoid burying signal / don't dump." No §29 hard-fail is tripped; no FOUNDATIONS amendment required (the change lives in `docs/compiler-contract.md`).
5. **Required vs. context-gated split (load-bearing)**: per `docs/compiler-contract.md` rows 98–112, four fields are *Readiness required / Block if blank* — `current_time`, `current_location`, `onstage_entities`, `immediate_situation_summary`. These must ALWAYS render (during pre-blocker prompt inspection they fall back to their empty-state constant). The other eleven are *Context-gated required* — render only when populated, omit the whole line when empty. Blockers are unchanged: context-gated fields still block when a validation tag requires them; omission only affects the not-required-here case.
6. **Adjacent contradiction (classified: required consequence)**: `consent_or_force_conditions` defaults to the literal `"none"` (`generation-brief-draft.ts:50`, `GenerationBriefView.tsx:252`), which currently renders `Consent or force conditions: none`. Treat the literal `"none"` as empty for omission purposes (mirror `records-tail.ts:236` `labelValue`, which treats `"none"` as absent), so this line is omitted when left at its default.

## Architecture Check

1. Converts `current_authoritative_state` to a structured line renderer modeled on the existing `renderCompositeSection` omission path, rather than post-processing rendered text to strip empty lines (fragile, couples to empty-state phrasing). Each line declares whether it is always-render or omit-when-empty.
2. No backwards-compatibility aliasing/shims. The flat template entry is replaced by the structured definition; the old empty-state phrases for the eleven optional fields stop being emitted.

## Verification Layers

1. Empty optional line is omitted (header + value absent) → schema validation (prompt-section conformance against `docs/compiler-contract.md`) + unit test asserting the line string is absent.
2. The four required lines always render even when blank during prompt inspection → unit test on a minimal/empty snapshot.
3. Determinism preserved (same snapshot → identical block, byte-for-byte) → FOUNDATIONS §8 alignment check via golden/compile test.
4. `consent_or_force_conditions: "none"` default omits the line → unit test.

## What to Change

### 1. `current_authoritative_state` section rendering (`packages/core/src/compiler`)

Replace the flat `SECTION_TEMPLATES["current_authoritative_state"]` string with a structured, line-level renderer (new entry analogous to `COMPOSITE_SECTION_TEMPLATES`, or a dedicated section renderer) where each line carries its label, placeholder, and an `alwaysRender` flag. Always-render lines: `current_time`, `current_location`, `onstage_entities`, `immediate_situation_summary` (keep empty-state fallback for pre-blocker inspection). Omit-when-empty lines: the remaining eleven. Wire it into `renderSection`/`compile-prompt.ts` alongside the composite path. Treat literal `"none"` as empty for `consent_or_force_conditions`.

### 2. `docs/compiler-contract.md`

Update the mapping rows for the eleven context-gated `current_authoritative_state` fields (lines ~102–112) from "render `None currently specified`/`None specified`" to "omit the line when empty," and add a `current_authoritative_state`-specific line to the empty-state rules section (around lines 251–260) describing the always-render-four / omit-empty-eleven behavior. Keep the four required fields' empty-state phrases (used only during deterministic backfill / empty prompt inspection).

### 3. `docs/prompt-template.md`

Update the `<current_authoritative_state>` template depiction (lines ~87–103) to document conditional line omission, mirroring the existing `soft_unit_guidance` conditional-omission note (line 379).

## Files to Touch

- `packages/core/src/compiler/template-constants.ts` (modify)
- `packages/core/src/compiler/compile-prompt.ts` (modify)
- `packages/core/src/compiler/sections/front.ts` (modify — may simplify the eleven optional resolvers once omission is line-driven)
- `docs/compiler-contract.md` (modify)
- `docs/prompt-template.md` (modify)
- `packages/core/test/...` compiler/golden tests (modify/new)

## Out of Scope

- Changing which fields are required vs. context-gated (the §-row classification stands).
- Validation-blocker behavior (context-gated fields still block when their tag fires).
- Entity label resolution (CURSTATELABEL-001) and editor fields (CURSTATEEDIT-001).

## Acceptance Criteria

### Tests That Must Pass

1. Unit test: a snapshot with only the four required fields populated renders exactly four lines inside `<current_authoritative_state>` — no `None currently specified` lines.
2. Unit test: populating `routes_and_exits` (or any optional field) makes its line appear; clearing it removes the whole line.
3. Unit test: `consent_or_force_conditions` left at default `"none"` omits the line.
4. Golden/compile determinism test passes (identical inputs → identical output).
5. `npm test` passes.

### Invariants

1. `<current_authoritative_state>` never emits an optional line whose underlying field is empty (or literal `"none"` for consent/force).
2. The four readiness-required lines always render; the section tag is never omitted (FOUNDATIONS §9 — constitutional section retained).
3. Output remains a deterministic pure function of the snapshot (FOUNDATIONS §8).

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler` current-authoritative-state rendering test — required-always / optional-omit / `"none"`-omit cases.
2. Existing golden/compile snapshot test — update expected output to the line-omitting form.

### Commands

1. `npm test`
2. `npm run lint && npm run typecheck`

## Outcome

Completed: 2026-06-08

What changed:
- Replaced the flat `current_authoritative_state` template path with a dedicated line-level renderer.
- Kept the section tag and the four readiness-required lines always rendered.
- Omitted the eleven context-gated current-state lines when their raw snapshot values are empty.
- Treated `consent_or_force_conditions: "none"` as empty for line omission.
- Updated `docs/compiler-contract.md` and `docs/prompt-template.md` to document the always-render / omit-empty split.
- Added compiler tests for required-only output, optional `routes_and_exits` appearance/removal, and default `"none"` consent omission.

Deviations from original plan:
- `packages/core/src/compiler/sections/front.ts` did not need simplification; the renderer checks raw snapshot values before invoking existing placeholder resolvers and fallbacks.
- The existing golden prompt fixture did not need rebaselining for this ticket because its optional current-state fields are populated, including a non-`none` consent/force line.

Verification:
- `npm exec -- vitest run packages/core/test/compiler-front-sections.test.ts packages/core/test/compiler-golden.test.ts packages/core/test/compiler-scaffold.test.ts` passed.
- `npm test` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
