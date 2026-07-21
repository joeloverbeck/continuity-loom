# TDD plan: clarify operator-bound Author focus

This should be a component-copy/accessibility change at the Ideate entry point, with regression coverage proving that the existing focus mechanics remain untouched. The exact component, test file, rendered freshness indicator, and focused test command are not supplied; resolve those from the repository and reuse the existing public seams. Do not create a compiler or request-contract change to make the test convenient.

## First red: visible, associated author guidance

Render the public Ideate entry component in its normal pre-entry state and query the Author focus control by accessible role/name. The first failing test should assert all of the following:

- guidance is visible before the author enters focus;
- the control is programmatically associated with that guidance (prefer an accessible-description assertion over merely finding adjacent text);
- the description says, in author language, that focus temporarily steers treatment within already assigned response slots;
- it says focus does **not** choose response kinds/operators, grounding, or active-working-set membership; and
- it identifies focus as temporary, non-canonical request context.

The smallest production change is local to the Ideate entry component: add one visible hint/help element and associate its stable ID with the existing control, for example through the component's existing description API or `aria-describedby`. Reuse the project's existing field-help primitive if one already exists. Do not add a request field, store field, schema field, compiler clause, or new interaction merely to host the copy.

Run the same focused component test. The intended green is that the control now has the complete accessible description and the same textbox/input behavior it had before.

## Second slice: interaction preserves the existing focus path

On one mounted Ideate instance, exercise the full existing sequence: empty focus → type focus A → change to focus B → clear focus. Use the public rendered freshness/prompt behavior rather than mocking an internal state module. After each transition, assert:

- the existing prompt-freshness observable changes or refreshes exactly as it did before;
- the independently known assigned response slots/operators remain unchanged;
- grounding and active-working-set membership remain the independently known fixture values;
- the hint remains visible and associated with the focus control; and
- no provider request has occurred.

Use a fake only at the external provider boundary. If the UI has no public freshness observable, use the existing assembled request-preview/request-builder integration seam and assert its public output; do not introduce a private attempt token or callback solely for the test. Where an explicit Generate action is needed to observe the assembled request, separately assert zero provider calls after focus/help interaction and before Generate, then inspect only the controlled provider request caused by that explicit action.

The prompt assertions must protect the existing byte contract rather than define a new one:

- with a fixed fixture and focus value, compare the compiled prompt to the repository's existing known literal/golden output;
- clearing focus should restore the fixture's exact no-focus prompt bytes;
- changing focus may exercise the existing focus substitution, but must not alter slot assignment, grounding, or working-set inputs; and
- the new guidance text must never appear in provider prompt bytes.

If the typing/changing/clearing assertions are already green, record them as preservation coverage. Only the missing guidance/association should drive production changes; do not fabricate a behavior red.

## Third slice: guidance and persistence/candidate regressions

Add or extend the narrowest public integration assertions needed to cover the remaining boundaries:

- focusing, reading, hovering, or otherwise operating any existing help presentation makes zero provider calls;
- Author focus remains absent from canonical story persistence and does not change the request's established shape;
- no-focus and known-focus prompt golden tests remain byte-for-byte unchanged;
- the same deterministic slot assignment is used before and after focus edits;
- an explicit generation still returns the existing output contract and enters the existing candidate flow; and
- guidance interaction alone creates no candidate and causes no provider activity.

These are negative regression invariants. Prefer existing persistence, compiler-golden, and candidate-flow tests. Add a new assertion only where the obligation is otherwise unproved, and do not change compiler/persistence/generation production code if those assertions already pass.

## Refactor boundary

Refactor only after the focused component test is green. The acceptable boundary is small: give the hint/description ID a clear local name, use an existing accessible field-help component, or remove duplicated component test setup. Do not extract new domain concepts, move focus into canonical state, change the compiler, alter prompt formatting, redesign deterministic slot assignment, or touch provider/candidate flow.

## Verification

For the implementation ledger, retain the exact focused red command and the missing accessible-description assertion, the component-only change, and the same focused command green. Then verify in this order:

1. focused Ideate component accessibility test;
2. focused type/change/clear freshness and no-provider-call test;
3. existing compiler prompt-golden and deterministic slot/grounding/working-set tests;
4. existing persistence-exclusion and candidate-flow tests;
5. the broader web/package suite; and
6. canonical repository gates: `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.

Use the repository's actual focused runner and test paths once located; they cannot be named exactly from the supplied material. Completion requires the browser/component accessibility regression and all applicable canonical gates to pass without updating expected prompt bytes, request shapes, or success/candidate expectations.
