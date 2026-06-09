# POVEMPTYLINE-001: Omit empty value-lines in `<pov_knowledge_constraints>`

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `packages/core/src/compiler/compile-prompt.ts` (new section renderer), `docs/compiler-contract.md` (§4 rows + §8), `docs/prompt-template.md` (conditional-line note)
**Deps**: None (interacts with POVPERCEIVE-001 — see Assumption Reassessment)

## Problem

`<pov_knowledge_constraints>` renders every value-line unconditionally, so empty lines surface as token waste:

```
POV does not know:
None specified
```

This wastes prompt budget and adds no signal. The fix should omit a value-line (label + value) when it is empty, while keeping it when there is real content, mirroring the established empty-line-omission pattern already used by `<current_authoritative_state>`, `<immediate_handoff>`, `<manual_directive>`, and the composite sections.

## Assumption Reassessment (2026-06-09)

1. The whole section is rendered via the generic template path (`packages/core/src/compiler/template-constants.ts:132-150`, dispatched by `compile-prompt.ts:124-125`); all four value-lines are hardcoded. The empty fallbacks come from `front.ts` (`renderPovKnows` :306-330, `renderPovBeliefs` :332-342, `renderPovDoesNotKnow` :344-357, `pov_cannot_perceive_now` :126-130) resolving to `EMPTY_STATE_CONSTANTS` `pov_*` = `"None specified"` (`empty-states.ts:59-63`).
2. The empty-line-omission precedent is `renderCurrentAuthoritativeStateSection` (`compile-prompt.ts:128-134`) with the `alwaysRender`/`hasCurrentStateValue` config (`compile-prompt.ts:16-36`, `200-229`); `docs/compiler-contract.md:261-265` documents this omit-when-empty pattern for several sections.
3. Shared boundary under audit: deterministic prompt-compilation surface and `docs/compiler-contract.md` §4 rows `{pov_knows}` (:120), `{pov_believes_suspects_misreads}` (:121), `{pov_does_not_know}` (:122), `{pov_cannot_perceive_now}` (:123), whose empty-state column currently reads `None specified`. Per the contract's §10 change-control rule, this ticket updates those rows and §8 in the same revision.
4. FOUNDATIONS principle under audit: **§29.4 hard-fail** — omitting an *entire* universal section without amendment is forbidden, but this ticket omits empty *value-lines within* the section. The section tag plus the static "Prompt-label rule" and "Non-POV interiority rule" text always render (`template-constants.ts:145-149`), so the section is never omitted and §29.4 is satisfied. This is the same lawful pattern §29.4 already tolerates for `<current_authoritative_state>` lines.
5. FOUNDATIONS §15 / §29.6 (POV/knowledge/secrets): omitting an *empty* line removes no knowledge signal and cannot cause leakage; readiness/validation blocking when a POV constraint is structurally required is a **separate** gate (`packages/core/src/validation/rules/matrix-knowledge.ts`) and is unchanged by this ticket. Verify the validation gate still blocks when `pov_knows` is required for non-omniscient POV with no content.
6. Schema impact: none — no brief/record schema field changes; this is rendering-only.
7. Adjacent contradiction: `pov_cannot_perceive_now` is currently mis-sourced (POVPERCEIVE-001). This ticket's omit-when-empty logic must key off the **resolved value being empty**, not off a specific source field, so it composes correctly regardless of POVPERCEIVE-001 ordering. Classify as a separate bug handled by POVPERCEIVE-001; do not fix the source here.

## Architecture Check

1. Introduce a dedicated `renderPovKnowledgeConstraintsSection` modeled on `renderCurrentAuthoritativeStateSection`, with a line config and an "is the resolved value empty/equal-to-empty-state?" predicate. This reuses the proven pattern instead of inventing a new mechanism, and keeps the static rule text intact.
2. No backwards-compatibility aliasing/shims; the unconditional empty lines were noise, not a contract guarantee (the contract is being updated in lockstep).

## Verification Layers

1. Empty POV lines are omitted (label + value gone, no blank gap) -> golden test + schema validation against the updated `docs/compiler-contract.md` empty-state rows.
2. Populated POV lines still render with their label and content -> golden test with POV-known/secret records present.
3. The section tag and the static Prompt-label / Non-POV interiority rule text always render (section never omitted) -> golden test asserting `<pov_knowledge_constraints>` presence even when all four value-lines are empty (FOUNDATIONS §29.4 alignment check).
4. Validation still blocks when a POV constraint is structurally required but empty -> existing `matrix-knowledge` validation tests remain green (FOUNDATIONS §29.6 alignment check).

## What to Change

### 1. New section renderer

In `packages/core/src/compiler/compile-prompt.ts`, route `pov_knowledge_constraints` to a new `renderPovKnowledgeConstraintsSection` (like `renderCurrentAuthoritativeStateSection`). For each of the four lines (`pov_knows`, `pov_believes_suspects_misreads`, `pov_does_not_know`, `pov_cannot_perceive_now`), render `Label:\n<value>` only when the resolved value is non-empty and not equal to its `EMPTY_STATE_CONSTANTS` empty state. Always append the static "Prompt-label rule" and "Non-POV interiority rule" blocks.

### 2. Template constant

Adjust `template-constants.ts` `pov_knowledge_constraints` so the conditional value-lines are no longer hardcoded into the static template (move them into the renderer), keeping the static rule text.

### 3. Docs in lockstep (§10 change-control)

- `docs/compiler-contract.md`: change the empty-state column for rows `{pov_knows}`, `{pov_believes_suspects_misreads}`, `{pov_does_not_know}`, `{pov_cannot_perceive_now}` from `None specified` to "omit line when empty", and add `<pov_knowledge_constraints>` to the §8 list of sections whose internal lines omit-when-empty.
- `docs/prompt-template.md`: add a conditional-line note to the `<pov_knowledge_constraints>` block (matching the `<current_authoritative_state>` conditional-line note style).

## Files to Touch

- `packages/core/src/compiler/compile-prompt.ts` (modify)
- `packages/core/src/compiler/template-constants.ts` (modify)
- `docs/compiler-contract.md` (modify)
- `docs/prompt-template.md` (modify)
- `packages/core/test/compiler-front-sections.test.ts` (modify/add)
- `packages/core/test/compiler-golden.test.ts` (modify)

## Out of Scope

- Changing the *source* of `pov_cannot_perceive_now` (POVPERCEIVE-001).
- Omitting the entire `<pov_knowledge_constraints>` section (forbidden by §29.4; never the goal here).
- Any change to validation/readiness blocking behavior.
- Restricting the fix to only `pov_does_not_know`: the omit-when-empty rule applies uniformly to all four value-lines.

## Acceptance Criteria

### Tests That Must Pass

1. With no POV knowledge/secret records and an empty `pov_cannot_perceive_now`, the compiled `<pov_knowledge_constraints>` contains the section tag and the two static rule blocks, and contains none of the four `POV ...:` value-line labels and no `None specified`.
2. With a secret the POV must not know, the `POV does not know:` line renders with its content.
3. With POV-known facts present, `POV knows:` renders with content while still-empty sibling lines are omitted.
4. Existing `matrix-knowledge` validation tests still pass (required-but-empty POV constraints still block).
5. `npm test` passes.

### Invariants

1. `<pov_knowledge_constraints>` section is always present (never omitted) — §29.4.
2. A POV value-line appears iff its resolved value is non-empty — deterministic, identical for identical inputs (§8).
3. Empty-state rendering of these placeholders matches the updated `docs/compiler-contract.md` rows.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-front-sections.test.ts` — assert per-line omission and persistence of static rule text.
2. `packages/core/test/compiler-golden.test.ts` — refresh golden output for empty and populated POV-knowledge cases.

### Commands

1. `npm test -- compiler-front-sections`
2. `npm test -- validation-matrix-knowledge`
3. `npm test`

## Outcome

Completed: 2026-06-09

What changed:

- Added a dedicated `<pov_knowledge_constraints>` renderer that conditionally renders the four POV value-lines only when their resolved values are non-empty and not equal to their deterministic empty-state constants.
- Kept the `<pov_knowledge_constraints>` section tag plus the static Prompt-label and Non-POV interiority rules always present.
- Removed the POV value-lines from the static template constant, updated the compiler contract and prompt template conditional-line documentation, and refreshed the frozen prompt golden for the intentional omission of an empty `POV does not know` block.
- Added compiler front-section coverage for all-empty POV constraints and populated `POV knows` with empty sibling-line omission.

Deviations from original plan:

- None. `pov_cannot_perceive_now` source behavior remains unchanged and is still left to POVPERCEIVE-001.

Verification:

- `npm test -- compiler-front-sections` passed.
- `npm test -- compiler-golden` passed.
- `npm test -- validation-matrix-knowledge` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed.
- `npm run build` passed, with the existing Vite chunk-size warning.
