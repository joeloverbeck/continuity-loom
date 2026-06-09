# HANDOFFDIR-001: Omit empty optional lines in `<immediate_handoff>` and `<manual_directive>`

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — `immediate_handoff` and `manual_directive` section rendering in `packages/core/src/compiler`; `docs/compiler-contract.md` and `docs/prompt-template.md` empty-state rules; `packages/core/test` golden/unit coverage
**Deps**: None (independent of HANDOFFDIR-002; order-free). Directly mirrors the completed `archive/tickets/CURSTATEOMIT-001.md`.

## Problem

The `<immediate_handoff>` and `<manual_directive>` blocks render every label/value pair unconditionally, so unfilled optional fields emit placeholder noise:

```
Last visible moment:
None specified

...

Begin prose exactly after this point:
None specified
```

```
May render if naturally caused:
None specified

Do not force:
None specified
```

This burns tokens and dilutes signal for the generating model when the writer intentionally left a field blank. The blocks should render only the lines that carry real state (plus the load-bearing always-render lines), omitting empty optional lines entirely — header and value.

**Two renders are NOT noise and must keep rendering even when empty:**
- `prior_accepted_prose_status_or_handoff_note` → `None. No accepted prose is included.` — a contract-mandated anti-leakage affirmation (`docs/compiler-contract.md` row 115 `Required: Yes`; §6 `first_segment` matrix line 189 requires it render "no accepted prose included"). Stripping it would weaken the documented accepted-prose firewall.
- `recent_causal_context` → `None; first local unit begins from current state` — first-segment orientation that actively tells the writer where to begin, not a `None specified` placeholder (row 113).

## Assumption Reassessment (2026-06-08)

1. **Code**: `<immediate_handoff>` and `<manual_directive>` are flat `SECTION_TEMPLATES` entries (`packages/core/src/compiler/template-constants.ts:129-143` and `:144-153`) rendered by `renderSection` via regex placeholder substitution (`packages/core/src/compiler/compile-prompt.ts:61-74`). Every `{placeholder}` resolves to a value or its `EMPTY_STATE_CONSTANTS` fallback through `valueOrEmpty` (`packages/core/src/compiler/sections/front.ts:100-120, 176-179`; `empty-states.ts:19,39,42,43,44,66,69`), so empty lines always render.
2. **Existing omission precedent (the model to follow)**: `<current_authoritative_state>` uses a dedicated line renderer `renderCurrentAuthoritativeStateSection` (`compile-prompt.ts:76-113`) that filters each line on `alwaysRender || hasCurrentStateValue(...)`; composite sections use `renderCompositeSection` (`compile-prompt.ts:123-134`), which omits a block when content is empty (`content ? `${block.label}:\n${content}` : ""`). `docs/compiler-contract.md` §8 (lines 258-259) already authorizes this: *"Optional prompt-preference fields may be omitted entirely when blank… Empty-state rendering is required only when omission would make the prompt ambiguous or structurally malformed."* The `<immediate_handoff>`/`<manual_directive>` pair was simply never migrated off the flat-template path. This ticket is the direct analogue of the completed `CURSTATEOMIT-001`.
3. **Shared boundary under audit**: the empty-state-rendering contract for these two sections, shared between the compiler, the per-field mapping rows of `docs/compiler-contract.md` (rows 113-119), §8 empty-state rules, and the literal templates in `docs/prompt-template.md:107-134`. All must agree after this change. Contract §10 (change-control, lines 284-286) requires the contract doc be updated in the same revision as any empty-state-rendering change.
4. **FOUNDATIONS principle**: §8 deterministic compilation — omission is a deterministic function of input (line present iff field non-empty), so determinism holds; §28 token discipline — removing empty scaffolding serves "avoid burying signal." No §29 hard-fail is tripped; no FOUNDATIONS amendment required (the change lives in `docs/compiler-contract.md`).
5. **Always-render vs. omit-when-empty split (load-bearing)**: per `docs/compiler-contract.md` rows 113-119:
   - **Always render** (keep empty-state fallback): `recent_causal_context` (row 113, informative first-segment orientation), `prior_accepted_prose_status_or_handoff_note` (row 115, `Required: Yes` anti-leakage affirmation; preserve its special logic — empty *or* literal `"none"` → the affirmation constant, `front.ts:104-109`), `manual_must_render` (row 117, readiness-required; blocks if blank but keeps its empty-state for pre-blocker prompt inspection).
   - **Omit whole block when empty**: `last_visible_moment` (row 114), `begin_after` (row 116), `manual_may_render_if_naturally_caused` (row 118), `manual_do_not_force` (row 119).
6. **Template constant text is preserved**: the `<immediate_handoff>` trailing instruction lines (`docs/prompt-template.md:120,122` — "For first segments…" and "Do not include or quote accepted prose…") and the `<manual_directive priority="high">` opening tag are template constants and must always render; only the omittable label/value blocks are conditional.
7. **Adjacent contradiction (classified: separate ticket)**: `last_visible_moment`, `begin_after`, `may_render_if_naturally_caused`, and `do_not_force` currently have no editor input in `packages/web` (`GenerationBriefView.tsx` renders inputs only for `recent_causal_context`, `prior_accepted_prose_status_or_handoff_note`, `must_render`), so they are *permanently* empty today. This ticket omits them when empty; making them authorable is **HANDOFFDIR-002** (independent, order-free). After this ticket alone, those four lines never appear, which is correct behavior until HANDOFFDIR-002 lands.

## Architecture Check

1. Converts `immediate_handoff` and `manual_directive` to structured block renderers modeled on the existing `renderCurrentAuthoritativeStateSection` / `renderCompositeSection` omission paths, rather than post-processing rendered text to strip empty lines (fragile, couples to empty-state phrasing). Each block declares its label, placeholder, and whether it is always-render or omit-when-empty; trailing constant text is appended verbatim.
2. No backwards-compatibility aliasing/shims. The flat template entries are replaced by the structured definitions; the empty-state phrases for the four omittable fields stop being emitted.

## Verification Layers

1. Empty optional block is omitted (label + value + surrounding blank line absent) → schema validation (prompt-section conformance against `docs/compiler-contract.md`) + unit test asserting `Last visible moment:`, `Begin prose exactly after this point:`, `May render if naturally caused:`, `Do not force:` are absent when their fields are empty.
2. The three always-render lines (`recent_causal_context`, `prior_accepted_prose_status_or_handoff_note`, `manual_must_render`) always render even when blank during prompt inspection → unit test on a minimal/empty snapshot, including the `prior_accepted` literal-`"none"` → affirmation case.
3. Template constant text (`Do not include or quote accepted prose…`, `<manual_directive priority="high">`) always renders → unit test.
4. Determinism preserved (same snapshot → identical block, byte-for-byte) → FOUNDATIONS §8 alignment check via golden/compile test.

## What to Change

### 1. `immediate_handoff` + `manual_directive` section rendering (`packages/core/src/compiler`)

Replace the flat `SECTION_TEMPLATES["immediate_handoff"]` and `SECTION_TEMPLATES["manual_directive"]` strings with structured block renderers (new dedicated section renderers wired into `renderSection` in `compile-prompt.ts:61-74`, analogous to `renderCurrentAuthoritativeStateSection`). Each block carries its label, placeholder, and an `alwaysRender` flag; rendered blocks join with a blank-line separator (mirror `renderCompositeSection`'s `"\n\n"` join) so omitted blocks leave no gap. Append the `<immediate_handoff>` trailing constant instruction text verbatim after the blocks. Preserve the `prior_accepted_prose_status_or_handoff_note` special logic (empty or literal `"none"` → affirmation constant). Always-render: `recent_causal_context`, `prior_accepted_prose_status_or_handoff_note`, `manual_must_render`. Omit-when-empty: `last_visible_moment`, `begin_after`, `manual_may_render_if_naturally_caused`, `manual_do_not_force`. Use a raw-snapshot-value emptiness check (mirror `hasValue`/`hasCurrentStateValue` in `compile-prompt.ts:84-121`).

### 2. `docs/compiler-contract.md`

- Update the four omittable mapping rows from "render `None specified`" to "omit the line when empty": `last_visible_moment` (row 114), `begin_after` (row 116), `manual_may_render_if_naturally_caused` (row 118), `manual_do_not_force` (row 119).
- Keep rows 113, 115, 117 as always-render (their empty-state phrases stand).
- Add an `immediate_handoff`/`manual_directive`-specific paragraph to the §8 empty-state rules (around lines 260-261, beside the existing `current_authoritative_state` paragraph) describing the always-render-three / omit-empty-four behavior and the preserved trailing constant text.

### 3. `docs/prompt-template.md`

Update the `<immediate_handoff>` note (line 120) and the section depiction (lines 107-134) to document conditional omission of `last_visible_moment`, `begin_after`, `may_render_if_naturally_caused`, and `do_not_force`, while `recent_causal_context`, `prior_accepted_prose_status_or_handoff_note`, and `must_render` keep their empty states — mirroring the conditional-omission notes already present for `current_authoritative_state`.

## Files to Touch

- `packages/core/src/compiler/template-constants.ts` (modify)
- `packages/core/src/compiler/compile-prompt.ts` (modify)
- `packages/core/src/compiler/sections/front.ts` (modify — optional simplification of the four omittable resolvers once omission is block-driven; not required, per the CURSTATEOMIT-001 outcome note)
- `docs/compiler-contract.md` (modify)
- `docs/prompt-template.md` (modify)
- `packages/core/test/compiler-front-sections.test.ts` (modify)
- `packages/core/test/golden-first-segment.prompt.txt` + `packages/core/test/compiler-golden.test.ts` (modify — the current golden renders `Last visible moment: None specified`, `Begin prose exactly after this point: None specified`, `May render if naturally caused: None specified`, `Do not force: None specified` at lines 115-141 and must be rebaselined to the omitting form)

## Out of Scope

- Changing which fields are required vs. context-gated (the contract-row classification stands).
- Validation-blocker behavior (`manual_must_render` still blocks when blank after normalization; continuation handoff blockers unchanged).
- Adding editor inputs for the four currently-unauthorable fields (HANDOFFDIR-002).
- Any change to the `prior_accepted_prose_status_or_handoff_note` or `recent_causal_context` empty-state phrasing or behavior.

## Acceptance Criteria

### Tests That Must Pass

1. Unit test: a snapshot with `last_visible_moment`, `begin_after`, `may_render_if_naturally_caused`, `do_not_force` all empty renders no `Last visible moment:` / `Begin prose exactly after this point:` / `May render if naturally caused:` / `Do not force:` lines.
2. Unit test: populating `last_visible_moment` (or any of the four) makes its block appear; clearing it removes the whole block including the surrounding blank line.
3. Unit test: `prior_accepted_prose_status_or_handoff_note` renders `None. No accepted prose is included.` when empty and when literal `"none"`; `recent_causal_context` renders its first-segment empty state; `manual_must_render` renders its empty state during inspection.
4. Unit test: the `<immediate_handoff>` trailing constant text and `<manual_directive priority="high">` tag always render.
5. Golden/compile determinism test passes against the rebaselined fixture (identical inputs → identical output).
6. `npm test` passes.

### Invariants

1. `<immediate_handoff>` and `<manual_directive>` never emit an omittable line whose underlying field is empty.
2. `prior_accepted_prose_status_or_handoff_note`, `recent_causal_context`, and `manual_must_render` lines, the section tags, and the trailing constant text are never omitted (FOUNDATIONS §9 — constitutional content retained; §15/§6 anti-leakage affirmation preserved).
3. Output remains a deterministic pure function of the snapshot (FOUNDATIONS §8).

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-front-sections.test.ts` — add always-render / omit-empty / `prior_accepted` literal-`"none"` cases for both sections.
2. `packages/core/test/golden-first-segment.prompt.txt` + `packages/core/test/compiler-golden.test.ts` — rebaseline expected output to the line-omitting form.

### Commands

1. `npm exec -- vitest run packages/core/test/compiler-front-sections.test.ts packages/core/test/compiler-golden.test.ts`
2. `npm test`
3. `npm run lint && npm run typecheck`

## Outcome

Completed: 2026-06-08

What changed:
- Added dedicated deterministic renderers for `<immediate_handoff>` and `<manual_directive>` so `last_visible_moment`, `begin_after`, `manual_may_render_if_naturally_caused`, and `manual_do_not_force` omit both label and value when empty.
- Preserved always-render output for `recent_causal_context`, `prior_accepted_prose_status_or_handoff_note`, `manual_must_render`, section tags, and the accepted-prose firewall instruction text.
- Updated the compiler contract and prompt template docs to describe the always-render vs. omit-when-empty split.
- Added front-section tests for empty optional block omission, populated block rendering, literal `"none"` prior-accepted handling, retained constants, and deterministic output.

Deviations:
- `packages/core/src/compiler/sections/front.ts` did not need changes; existing placeholder resolvers continue to own populated values and load-bearing empty states.
- The first-segment golden fixture already uses populated handoff/directive fields, so no golden text rebaseline was required; the existing golden determinism test remains the proof surface.

Verification:
- `npm exec -- vitest run packages/core/test/compiler-front-sections.test.ts packages/core/test/compiler-golden.test.ts` passed.
- `npm test` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
