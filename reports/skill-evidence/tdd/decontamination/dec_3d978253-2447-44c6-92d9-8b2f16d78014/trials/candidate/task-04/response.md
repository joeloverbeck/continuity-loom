# TDD execution plan: Author focus guidance

This is primarily one user-visible component slice. The expected behavior red is the missing visible, accessible guidance at the Ideate entry point. The compiler, slot assignment, grounding, working set, request contract, persistence, and provider flow are preservation constraints, not invitations to create new implementations.

## Before the first red

Locate the existing Ideate component that owns the Author focus control, its current label/input, the existing prompt-freshness handler used by focus changes, and the public component/browser test seam. Also identify the existing golden/contract tests for prompt bytes, slot assignment, grounded context, active-working-set selection, request shape, persistence exclusions, output contract, and candidate flow.

The exact component/test filenames, focus control type, and public freshness indicator are uncertain because product source was not supplied. Reuse the current component and test harness; do not introduce a compiler or domain seam merely to test help copy.

## Slice 1: visible and accessible guidance

In the existing Ideate component test, render the entry point in its normal pre-request state. Add the first failing assertions:

- guidance is visible before the Author focus input in DOM/reading order;
- the focus control is programmatically associated with that guidance, preferably through its existing label plus `aria-describedby` pointing to stable help-text content;
- the control's accessible description communicates all of these independently specified ideas: focus is optional and temporary, it steers treatment inside already assigned response slots, it does not choose response kinds/operators, it does not alter grounding or active-working-set membership, and it is request-only/non-canonical context; and
- the language is addressed to an author rather than exposing implementation instructions.

Use role/label and accessible-description queries as the oracle, not a class name or component internals. The visible copy can be concise, for example: “Optional and temporary. Use Author focus to steer how the already assigned response slots treat this request. It does not choose response kinds, change grounding, or change what is in the active working set, and it is not saved as canonical story state.” Adjust terminology to the repository's established author-facing vocabulary without losing any of those meanings.

Run only this test and confirm it fails because the guidance/association is absent. Then make the smallest production change in the component: add one visible help-text element immediately before the current control and associate that element with the control. Reuse existing field/help styles and the existing control; do not add a new request field, handler, state variable, dialog, provider action, or compiler change. Rerun the exact focused test to green.

## Slice 2: interaction and prompt-freshness invariants

Extend the same public component test, or the nearest existing prompt-freshness component test, using one mounted instance:

1. Focus/read or otherwise exercise any existing guidance affordance and assert zero provider calls.
2. Type a focus value and assert the existing public prompt-freshness state changes exactly as it did before this work, with zero provider calls.
3. Change the focus and assert the same freshness path is used, still with zero provider calls.
4. Clear it and assert freshness is again invalidated/restored according to the existing contract, still with zero provider calls.
5. Across all three edits, assert the rendered/public assigned response slots, grounding indication, and active-working-set membership remain identical.

The provider client/fetch may be controlled because it is a system boundary. Do not mock owned slot, grounding, or working-set modules; observe their public UI/request result. If the guidance is permanently visible and has no interactive affordance, do not invent one: focusing the associated control and typing/changing/clearing it is sufficient to prove that consulting and using the guidance triggers no provider request.

These preservation assertions should normally pass before the production copy change. Treat an initial pass as regression coverage, not as a fabricated red. If one fails, first exclude invalid setup or a stale fixture. Only if the current public behavior genuinely violates the stated acceptance criteria should a second, narrowly scoped behavior red be opened; reuse the existing focus-change handler/freshness path rather than implementing a parallel one.

## Slice 3: contract preservation at explicit generation

At the existing public compile/request seam, retain or add a focused regression using a known valid story/input fixture and independently fixed expected values. Compare before/after focus edits and then explicitly invoke the existing generation action. Assert:

- the assigned operator/response-slot identities and ordering are unchanged;
- grounding and active-working-set membership are unchanged;
- the request has exactly the existing shape, including the existing Author focus representation and no guidance-only fields;
- the compiled prompt bytes for each already-supported focus state still equal the existing golden literals/snapshots;
- no provider call occurs before the explicit generation action, and that action makes only the already-expected call;
- Author focus remains excluded from canonical persistence; and
- the output contract and candidate flow are unchanged.

Do not regenerate expected prompt output from the production compiler inside the assertion. Prefer the current golden/contract fixture and preserve its exact bytes. The new guidance copy must never enter the compiled prompt. If all existing contract tests already prove these properties, run and cite them instead of adding duplicate tests. No compiler, slot allocator, grounding, persistence, provider-boundary, or candidate-flow production change is justified by a copy-only red.

## Refactor boundary

Refactor only while the focused component and preservation tests are green. Keep the boundary local to the Ideate field markup: consolidate a stable help-text id or reuse an existing field-description primitive only if that reduces duplication without changing behavior. Do not extract a new domain abstraction for this single piece of guidance, move focus state, alter event handlers, or touch compilation/provider code. Rerun the focused accessibility and freshness test after any markup refactor.

## Verification

Retain the exact focused red command and the missing-guidance assertion, followed by the focused green result. Use the existing web test runner against the resolved component test, then run the existing prompt/compiler contract tests and a browser/component accessibility regression that verifies visible order and the control-description relationship.

Finally run the canonical gates:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Completion requires the guidance to be visible before entry and accessible from the control, focus edits to continue using the existing freshness path, zero provider activity before explicit generation, and unchanged slot assignment, grounding, working set, request/prompt contract, persistence exclusions, output contract, and candidate flow.
