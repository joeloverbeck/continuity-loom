# TAILRENDER-002: Omit empty optional list sub-blocks in the two record-list composite prompt sections

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — `packages/core/src/compiler/sections/records-tail.ts` (sub-block resolvers), `packages/core/src/compiler/template-constants.ts` + `packages/core/src/compiler/compile-prompt.ts` (composite-section assembly); `docs/compiler-contract.md` (§4 rows + §8 empty-state rules); `docs/prompt-template.md` (composite section blocks); `packages/core/test/compiler-tail-sections.test.ts` (and `compiler-scaffold.test.ts` if it asserts these sub-headers)
**Deps**: None (independent of TAILRENDER-001; both touch `records-tail.ts` but different resolvers/lines and can land in either order)

## Problem

Inside the `<locations_objects_affordances>` and `<relevant_facts_beliefs_events>` composite sections, every optional list sub-block prints its header line followed by an empty-state constant even when there is no content. Observed in a real project:

```
Visible affordances:
None specified

Unavailable or impossible actions:
None specified
```

These header + "None specified" pairs are dead weight that can confuse and degrade the external prose writer. The intended behavior: when an optional list sub-block is empty, render neither its header nor its value (no blank gap left behind).

This is already the documented intent — it is not a contract relaxation:
- `docs/compiler-contract.md` §8: "Optional prompt-preference fields may be omitted entirely when blank if the surrounding universal instruction remains structurally complete"; "Empty-state rendering is required only when omission would make the prompt ambiguous or structurally malformed."
- `docs/prompt-template.md` already mandates conditional sub-block omission elsewhere: voice pins (line 208, "omit the pins sub-block or render a concise deterministic empty state") and soft-unit guidance (line 375, "If it is blank, omit that line").

Scope is deliberately limited to the **two record-list composite sections** whose sub-blocks are all "optional list sections" per §4. Whole-tag empty states elsewhere (e.g. `active_clocks` → "None active", and the deliberately reassuring `prior_accepted_prose_status_or_handoff_note` → "None. No accepted prose is included.") are preserved.

## Assumption Reassessment (2026-06-08)

1. **Rendering mechanics confirmed.** `packages/core/src/compiler/compile-prompt.ts:33-37` substitutes each `{placeholder}` via a flat regex with whatever the resolver returns; the section metadata (`required`/`missingBehavior`/`emptyState`) on `PlaceholderResolver` is declared but unused by the renderer. The empty-state fallback is currently baked into each tail resolver as `renderRecords(...) || EMPTY_STATE_CONSTANTS.<name>` (`packages/core/src/compiler/sections/records-tail.ts:11-114`). The two composite templates are static strings with hardcoded sub-headers (`packages/core/src/compiler/template-constants.ts:269-303`, mirrored in `docs/prompt-template.md:269-308`).
2. **In-scope sub-blocks enumerated.** `relevant_facts_beliefs_events`: `pov_accessible_facts`, `writer_visible_or_non_pov_facts`, `pov_relevant_beliefs`, `non_pov_behavior_shaping_beliefs`, `recent_events`, `relevant_backstory`, `offstage_or_withheld_events`. `locations_objects_affordances`: `locations`, `objects`, `visible_affordances`, `unavailable_or_impossible_actions`. All 11 are optional list sections per §4 (every row carries an empty-state constant and is "No"/"No except..."/"Required for..." not constitutional).
3. **Shared contract under audit.** Prompt-section conformance against `docs/compiler-contract.md` §8 (empty-state rendering rules) and the §4 empty-state column for the 11 rows. Per §10 / FOUNDATIONS §8 line 252, the contract must be updated in the same revision; `docs/prompt-template.md` (the template authority) must mirror the conditional-omission wording it already uses for voice pins and soft-unit guidance.
4. **FOUNDATIONS principle restated.** §8 deterministic compilation: omission must be a deterministic per-placeholder rule (empty list → omit sub-block), so identical inputs/versions yield identical output (§29 / §907). §11 fail-closed validation is NOT weakened: required/context-gated state still blocks *before* rendering (§4 "Block if underspecified" for `{locations}`, etc., and §8 "Required-but-missing state blocks before rendering"); we only omit genuinely-empty optional sub-blocks after validation has passed.
5. **Deterministic-compilation surface confirmed.** This touches the deterministic compiler. The change adds no LLM, no hidden state, no nondeterminism; sub-block presence is a pure function of which records/state resolve to content.
6. **Adjacent contradiction classification.** Other composite sections (`content_policy`, `current_authoritative_state`, `immediate_handoff`, `pov_knowledge_constraints`, `audience_knowledge`, `secrets_and_reveal_constraints`) also embed header + placeholder pairs, but their sub-fields are required/context-gated or carry informative empty states; broadening to them would contradict the user's "composite sub-blocks only" scope and §8 rule 1 (constitutional sections never omitted). Classified as out of scope, not a missed consequence.
7. **Test impact.** `compiler-tail-sections.test.ts:211-223` currently asserts the composite section *contains* `EMPTY_STATE_CONSTANTS.locations` / `.unavailable_or_impossible_actions` when sources are absent. After this change those sub-headers are omitted; the test must be updated to assert (a) empty sub-blocks and their headers are absent when siblings have content, and (b) the section-level fallback renders when *all* sub-blocks are empty. This is adapting tests to a deliberate behavior change (not to a bug), which is correct.

## Architecture Check

1. Replacing the two static composite templates with a small structured sub-block descriptor (`{ tag, subBlocks: [{ label, placeholder }], emptyState }`) and a sub-block-aware assembler keeps omission logic in one deterministic place, instead of scattering string post-processing or fragile "strip lines that equal a None constant" heuristics across the renderer. Resolvers honestly return `""` for empty content; presentation (header, omission, section-level fallback) is decided by the assembler. This cleanly separates "is there content?" from "how is it laid out?".
2. No backwards-compatibility aliasing or shims. The old `|| EMPTY_STATE_CONSTANTS.<name>` inline fallbacks for the 11 sub-block placeholders are removed (replaced by the section-level fallback), not kept as a parallel path. Non-composite sections keep their existing whole-tag empty-state behavior unchanged.

## Verification Layers

1. An empty optional sub-block omits BOTH its header line and its value when a sibling sub-block has content -> Vitest assertion (`relevant_facts_beliefs_events` and `locations_objects_affordances` do not contain `Visible affordances:` / `None specified` when those records are absent but locations/objects exist).
2. A non-empty sub-block still renders `Header:\n- ...` -> Vitest assertion (existing populated-content case continues to pass).
3. When ALL sub-blocks of a composite section are empty, the section renders its single section-level empty state inside the tag (tag NOT suppressed) -> Vitest assertion against the empty-input case.
4. Required/context-gated state still blocks before render (omission never hides a structurally required field) -> FOUNDATIONS §11 / §8 alignment check + existing validation-blocker tests remain green.
5. §4 empty-state column + §8 document composite sub-block omission and the section-level fallback; `prompt-template.md` mirrors it -> codebase grep-proof + prompt-section conformance review.
6. Deterministic compilation preserved -> FOUNDATIONS §8 alignment check; fingerprint stable for identical inputs.

## What to Change

### 1. Resolvers return empty for empty sub-blocks

In `packages/core/src/compiler/sections/records-tail.ts`, drop the `|| EMPTY_STATE_CONSTANTS.<name>` inline fallback for the 11 in-scope sub-block resolvers so they return `""` when there is no content. (`renderUnavailableActions` already returns `... || EMPTY_STATE_CONSTANTS.unavailable_or_impossible_actions`; change its tail to return `""`.) Non-composite/whole-tag resolvers (e.g. `physical_continuity`) keep their empty-state fallback.

### 2. Composite-section assembler

Introduce a structured descriptor for the two composite sections (in `template-constants.ts`), e.g.:

```ts
const COMPOSITE_SECTIONS = {
  relevant_facts_beliefs_events: {
    subBlocks: [
      { label: "POV-accessible facts", placeholder: "pov_accessible_facts" },
      // ... the remaining 6 ...
    ],
    emptyState: "None specified"
  },
  locations_objects_affordances: {
    subBlocks: [
      { label: "Locations", placeholder: "locations" },
      { label: "Objects", placeholder: "objects" },
      { label: "Visible affordances", placeholder: "visible_affordances" },
      { label: "Unavailable or impossible actions", placeholder: "unavailable_or_impossible_actions" }
    ],
    emptyState: "None specified"
  }
} as const;
```

In `compile-prompt.ts`, branch in section rendering on whether the section id is composite: resolve each sub-block's placeholder; keep only non-empty `Header:\n<content>` units; join with a blank line; if none remain, use the descriptor's `emptyState` (single line). Wrap the result in the `<tag>...</tag>`. Plain sections keep the existing regex substitution. `SECTION_ORDER` is unchanged, and these two tags are always rendered (never suppressed) — only their interior sub-blocks are conditional, consistent with the chosen "composite sub-blocks only" scope.

### 3. Update docs (contract + template)

- `docs/compiler-contract.md` §8: add a rule that optional list sub-blocks inside `relevant_facts_beliefs_events` and `locations_objects_affordances` are omitted (header and value) when empty, and that the composite section renders a single deterministic section-level empty state only when all its sub-blocks are empty. §4: amend the empty-state column for the 11 rows to "Omitted (header + value) when empty; section-level empty state only when all sibling sub-blocks empty."
- `docs/prompt-template.md` (lines 269-308): add conditional-omission guidance for these two composite sections, mirroring the existing wording at lines 208 and 375.

## Files to Touch

- `packages/core/src/compiler/sections/records-tail.ts` (modify)
- `packages/core/src/compiler/template-constants.ts` (modify)
- `packages/core/src/compiler/compile-prompt.ts` (modify)
- `docs/compiler-contract.md` (modify)
- `docs/prompt-template.md` (modify)
- `packages/core/test/compiler-tail-sections.test.ts` (modify)
- `packages/core/test/compiler-scaffold.test.ts` (modify only if it asserts these sub-headers/empty constants)

## Out of Scope

- Whole-tag empty-state suppression for non-composite sections (`active_clocks`, `active_plans`, `offstage_relevance`, the `prior_accepted_prose_status_or_handoff_note` reassurance, the current-state floor, etc.) — preserved per the chosen scope and §8 rule 1 / informative empty states.
- Other composite sections whose sub-fields are required/context-gated (`content_policy`, `current_authoritative_state`, `immediate_handoff`, `pov_knowledge_constraints`, `audience_knowledge`, `secrets_and_reveal_constraints`).
- Fully suppressing the composite `<tag>` itself when empty (the tag is retained with a single section-level empty-state line).
- The id→label resolution defect (TAILRENDER-001).

## Acceptance Criteria

### Tests That Must Pass

1. Updated `packages/core/test/compiler-tail-sections.test.ts`: with locations/objects present but no VISIBLE AFFORDANCE records and no current_locks, `locations_objects_affordances` contains `Locations:` and `Objects:` but NOT `Visible affordances:`, `Unavailable or impossible actions:`, or `None specified`; with all tail sources absent, each composite section renders exactly one section-level empty-state line inside its tag and no per-sub-block headers.
2. The existing populated-content case (facts/beliefs/events/locations/objects/affordances all present) still renders every populated sub-block with its header.
3. `npm test` passes (incl. any `compiler-scaffold.test.ts` updates).
4. `npm run lint && npm run typecheck` pass.

### Invariants

1. No empty optional list sub-block renders a header or an empty-state value inside the two composite sections.
2. Required/context-gated state is never hidden by omission: validation still blocks before render when a sub-block's content is structurally required.
3. Compilation remains deterministic: identical snapshot + versions produce identical prompt output and fingerprint.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-tail-sections.test.ts` — rewrite the "renders exact empty-state constants when tail sources are absent" case (lines 211-223) to assert section-level fallback + absent sub-headers; add a mixed case (some sub-blocks populated, others empty) asserting empty sub-blocks and their headers are gone while populated ones remain.
2. `packages/core/test/compiler-scaffold.test.ts` — update only if it asserts the now-omitted sub-headers/empty constants.

### Commands

1. `npm test -- compiler-tail-sections` (targeted: the resolvers/assembler under change).
2. `npm test && npm run lint && npm run typecheck` (full pre-completion gate).

## Outcome

Completed: 2026-06-08

Changed:
- Added a deterministic composite-section assembler for `<relevant_facts_beliefs_events>` and `<locations_objects_affordances>`.
- Made the eleven scoped optional list sub-block resolvers return empty content instead of per-sub-block empty-state strings.
- Preserved the composite section tags and added a single `None specified` fallback when all sibling sub-blocks are empty.
- Updated compiler contract, prompt template docs, scaffold/tail tests, and the golden prompt baseline.

Deviations:
- The frozen demo golden prompt baseline changed because it intentionally captures the absence of empty fact/backstory sub-blocks.

Verification:
- `npm test -- compiler-tail-sections` passed.
- `npm test` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
