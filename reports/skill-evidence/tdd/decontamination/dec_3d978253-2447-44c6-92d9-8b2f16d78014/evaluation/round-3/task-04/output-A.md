# TDD response: Author Focus operator-bound guidance

## Preflight and agreed seams

This is a single, UI-local behavior change. The issue pre-agrees the primary public seam: the rendered Ideate entry point before Author Focus entry, including the programmatic relationship between guidance and its control. Existing prompt freshness, deterministic slot assignment, grounding, working-set selection, provider activity, persistence, output, and candidate-flow behavior are regression seams, not invitations to change the compiler or request pipeline.

The trial constraints prevent reading `CONTEXT.md`, governing docs, package scripts, or the component implementation. Before the real first red, record their authority dispositions and replace the provisional component/test names below with the existing ones. If the current UI has an established description/help pattern, use it rather than inventing a second pattern.

## First red: visible and accessible guidance

At the smallest public component seam that renders the Ideate entry controls, render the entry point and locate Author Focus by accessible role and name. The first tracer should assert all of the following in the rendered DOM:

- guidance is visible before any text is entered;
- the focus control is programmatically associated with that guidance, preferably through the existing `aria-describedby` pattern, and the referenced element actually exists;
- the guidance says in author language that focus is optional and temporary/non-canonical request context;
- it says focus steers treatment only inside already assigned response slots;
- it explicitly says focus does not choose response kinds/operators, grounding, or active-working-set membership.

A suitable copy baseline is:

> Author focus is optional, temporary guidance for this Ideate request. It steers treatment within the response slots already assigned; it does not choose response kinds, grounding, or what enters the active working set. It is not saved as canonical story state.

The assertion should verify the required concepts and accessible relationship, not freeze incidental punctuation or layout. Confirm the red fails because the guidance/relationship is missing, not because the test cannot render the component.

The smallest green change is local markup and copy in the existing Ideate entry component: render the guidance before the control, give the guidance a stable local ID, and add that ID to the control's existing accessible description. This slice must not touch compiler, slot assignment, request construction, provider, storage, output, or candidate-flow code.

## Regression slices

Run these assertions before the production edit. If they pass, record them as `coverage-only existing behavior; red-first N/A because behavior already existed and no production code changed`. If one fails, it is a separate missing-behavior red and must be made green in its own smallest slice rather than bundled into the copy change.

### Guidance interaction has no provider activity

Using the public rendered UI, focus/read/open the guidance using whatever established interaction the component exposes. Assert the provider fake has zero calls, no candidate flow starts, and no request is emitted. If the guidance is intentionally always-visible and has no disclosure control, keyboard focus and interaction with the associated Author Focus control are the relevant public actions; do not add a disclosure merely to satisfy the test.

Also capture the existing compiled prompt/request before and after guidance-only interaction and assert byte-for-byte equality and unchanged request shape. Guidance display or help interaction must not invoke prompt compilation as a side effect.

### Focus freshness without selection changes

Through the rendered control, type a focus, change it, and clear it. For every transition, assert the existing public prompt-freshness indicator/state follows the same path it used before this change. At the existing slot-plan/grounding observation seam, assert the assigned response kinds/operators, grounding inputs, and active-working-set membership remain identical across those transitions. Assert provider call count remains zero until the existing explicit generation action is invoked.

Use fixed expected slot and grounding values from an existing contract fixture or authoritative worked example; do not compute expected values with the same compiler code under test. If slot/grounding data is not publicly observable at the component seam, keep its existing lower-level public contract test rather than reaching into component internals.

### Persistence, request, output, and candidate invariants

Retain or add focused public-boundary assertions that:

- guidance interaction causes no persistence write;
- focus remains temporary request context and is absent from canonical story-state persistence;
- the established request DTO shape and exact prompt-byte fixture are unchanged for the same inputs;
- successful output parsing and candidate flow are unchanged.

These are regression proofs. Do not update snapshots or expected prompt bytes to accommodate the guidance change; any such failure means production code crossed the intended UI-only boundary.

## Refactor boundary

After the component tracer and regression checks are green, the only appropriate refactor is small UI-local cleanup: reuse the component's existing help-text primitive or extract the copy/ID to the nearest established component constant if that improves readability. Do not create a compiler abstraction, shared request field, new persistence key, slot-assignment option, or compatibility path. A component-only copy/accessibility change should leave prompt and provider modules untouched.

## Verification

Run, in order:

1. the focused Ideate component accessibility test containing the initial red;
2. the focused guidance-interaction/no-provider assertion;
3. the focused focus type/change/clear freshness and invariant assertions;
4. the existing prompt-byte, deterministic slot-assignment, grounding/working-set, persistence, output, and candidate-flow tests;
5. the full web package suite;
6. `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` from the root;
7. a browser accessibility smoke at Ideate: verify guidance is visible before entry, inspect the control's accessible description, keyboard through any guidance interaction, type/change/clear focus, observe freshness, confirm no provider request occurs, and check the console is clean.

The exact focused runner commands, route, and file names remain uncertain because the permitted corpus does not expose the implementation or package configuration. Resolve and record those literal commands before execution. Any compiler, prompt-byte fixture, slot-assignment, grounding, provider, storage, or candidate-flow production diff is outside the minimal implementation seam and should block closeout unless separately authorized.
