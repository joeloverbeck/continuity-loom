# TDD execution plan: Author Focus operator-bound guidance

This task changes observable Ideate-entry UI behavior, so the new guidance should be driven by a small component/browser red. The request, compiler, provider, persistence, and candidate-flow constraints are preservation boundaries, not invitations to redesign those systems.

Before the first red, read the repository guidance and issue authority, then locate the Ideate entry component, its Author focus control, the existing prompt-freshness behavior, the provider-call boundary, and focused component/browser commands. Because repository inspection is forbidden in this trial, exact files, commands, authorized copy, response-slot terminology, and the existing freshness indicator are unknown. Resolve those before implementation.

## Acceptance map

- Visible before entry: public component/browser rendering test.
- Programmatically associated with Author focus: accessible-name/description assertion on the real control.
- Explains scope in author language: exact approved-copy assertion.
- Temporary and non-canonical: exact approved-copy assertion, plus existing persistence-boundary coverage.
- Guidance interaction makes no provider call: controlled provider-boundary spy in a component/browser interaction test.
- Typing, changing, and clearing follow existing prompt freshness: stateful re-entry test on one mounted Ideate instance.
- Slot assignment and grounding do not change: existing public compiler/plan assertions or a new invariant test derived from the authority.
- Request shape, exact prompt bytes, provider boundary, persistence exclusions, output contract, and candidate flow remain unchanged: run existing contract/golden tests unchanged; add characterization only where an acceptance boundary has no coverage.

The copy itself should be approved before encoding it in a test. A candidate phrasing in author language is:

> Optional and temporary. Author focus steers how this Ideate request treats the response directions already assigned. It does not choose the kinds of responses, change which story material they draw from, or become part of your saved story.

This is not authoritative wording. In particular, confirm whether “response directions already assigned” accurately explains response slots/operators, and whether “which story material they draw from” accurately covers both grounding and active-working-set membership. If not, pause for approved copy rather than allowing the implementation to define product semantics.

## Slice 1: visible, associated guidance

Add one focused component test through the rendered Ideate entry UI. Use the real control and accessible queries rather than component internals.

First failing assertions:

```ts
renderIdeateEntry(/* smallest valid public state */);

const focus = screen.getByRole("textbox", { name: /author focus/i });
const guidance = screen.getByText(APPROVED_AUTHOR_FOCUS_GUIDANCE);

expect(guidance).toBeVisible();
expect(focus).toHaveAccessibleDescription(APPROVED_AUTHOR_FOCUS_GUIDANCE);
expect(
  guidance.compareDocumentPosition(focus) & Node.DOCUMENT_POSITION_FOLLOWING,
).toBeTruthy();
```

The intended red is that the guidance text is absent, not visible before the control, or not part of the control's accessible description. A failing render caused by an invalid fixture, missing browser matcher, or wrong control role/name is setup or a wrong-reason failure; fix only the precondition and rerun to obtain the intended failure.

Smallest green production change:

1. Render one visible guidance element immediately before the existing focus input.
2. Give it a stable DOM `id`.
3. Add that id to the control's existing `aria-describedby` value, preserving any ids already there rather than replacing them.
4. Add no request, compiler, store, persistence, or provider logic.

Rerun the exact focused command and retain the red failure and green result.

If the real control is not a textbox, use its actual public role. If “before focus entry” means visual order that CSS can change independently of DOM order, add a real-browser assertion or screenshot/manual evidence for computed placement; keep the programmatic association test regardless.

## Slice 2: guidance interaction is local only

The task refers to a “guidance interaction,” but does not define it. If guidance is always-visible static text, confirm whether focusing/reading the Author focus control is the intended interaction. If the issue specifies a help/disclosure affordance, use the repository's established disclosure pattern and test that exact interaction. Do not invent a tooltip or disclosure merely to satisfy the word “interaction.”

With the provider boundary replaced by a controlled spy, exercise the authorized guidance interaction and assert:

```ts
await user.click(/* existing guidance affordance, if any */);
expect(screen.getByText(APPROVED_AUTHOR_FOCUS_GUIDANCE)).toBeVisible();
expect(providerGenerate).not.toHaveBeenCalled();
```

Also assert the focus control retains its accessible relationship after the interaction. The intended red, if an interactive affordance is required, is missing/inaccessible guidance or an unintended provider call. The smallest green is presentation-local disclosure state only. If static visible copy is authoritative and the no-call assertion already passes, record this as preservation coverage; do not fabricate a red or add needless production state.

## Slice 3: focus re-entry uses the existing freshness path

On one mounted Ideate instance, establish the smallest valid state with existing candidates or whatever public UI state makes prompt freshness observable. Spy on the provider boundary without allowing network access. Capture the public response-slot assignment and grounding presentation (or the public compiled-plan values if that is the accepted seam).

Exercise all required transitions in order:

1. empty → typed focus;
2. typed focus A → changed focus B;
3. focus B → cleared focus.

After each transition assert:

- the existing public freshness behavior occurs (for example, the authorized stale/dirty state, candidate invalidation, or regeneration affordance; use the actual contract rather than guessing);
- the response-slot/operator assignment is unchanged;
- grounding and active-working-set membership are unchanged;
- no provider call occurs from typing/changing/clearing;
- no guidance UI state enters the request or persisted story state.

Example shape, with repository-specific assertions substituted:

```ts
const assignmentsBefore = readPublicAssignments();
const groundingBefore = readPublicGrounding();

await user.type(focus, "Keep the emotional distance restrained");
expectPromptToBeFreshnessInvalidatedThroughExistingUI();
expect(readPublicAssignments()).toEqual(assignmentsBefore);
expect(readPublicGrounding()).toEqual(groundingBefore);
expect(providerGenerate).not.toHaveBeenCalled();

await user.clear(focus);
await user.type(focus, "Emphasize the practical tradeoff");
expectPromptToBeFreshnessInvalidatedThroughExistingUI();
expect(readPublicAssignments()).toEqual(assignmentsBefore);
expect(readPublicGrounding()).toEqual(groundingBefore);
expect(providerGenerate).not.toHaveBeenCalled();

await user.clear(focus);
expectPromptToBeFreshnessInvalidatedThroughExistingUI();
expect(readPublicAssignments()).toEqual(assignmentsBefore);
expect(readPublicGrounding()).toEqual(groundingBefore);
expect(providerGenerate).not.toHaveBeenCalled();
```

If this behavior already exists, these assertions may pass before the UI copy change. Treat them as characterization/preservation evidence, not a fake red. If one genuinely fails, first confirm the issue intended a behavior repair beyond guidance. Then make the smallest change by routing that focus transition through the already-existing freshness action; do not add another invalidation mechanism or recompute slots/grounding.

## Slice 4: cross-boundary preservation

The guidance change should not touch these boundaries. Run their existing tests unchanged, and add focused characterization only if the acceptance obligation otherwise has no evidence:

- **Request shape:** compare the eventual Ideate request keys/structure with the authorized fixture. The existing focus field may vary; no guidance field or UI metadata may appear.
- **Prompt bytes:** run exact existing compiler golden/byte snapshots for empty, populated, changed, and cleared Author focus. Do not update snapshots to accommodate this UI-only change. Focus content may legitimately affect the bytes under the pre-existing contract; the requirement is that the guidance implementation does not alter that contract.
- **Deterministic assignment and grounding:** for identical canonical story state and deterministic inputs, assignments and grounding remain the existing expected values across focus changes. Expected values must come from authority/worked fixtures, not by duplicating the production algorithm in the test.
- **Provider boundary:** generation still uses the same boundary, and merely viewing/operating guidance or editing focus sends nothing.
- **Persistence exclusions:** save/reload or repository serialization still omits Author focus and any guidance state. Exercise restoration on a fresh instance if persistence coverage uses a store/repository seam.
- **Output contract and candidate flow:** existing candidate generation, rendering, selection, rejection, and acceptance tests stay green; do not change output parsing or introduce another candidate path.

Do not use static source assertions for these user-visible contracts unless the authority explicitly names source structure. Prefer the public component, compiler, request, repository, and browser seams.

## Refactor boundary

Refactor only while focused tests are green. The allowed refactor is limited to extracting the approved guidance copy into the component's existing copy/content owner if that prevents duplication, and reusing an established described-field/help primitive if it preserves visible order and accessible description. Do not create a new design system abstraction for one field.

No compiler, request schema, slot allocator, grounding selector, provider client, persistence schema, output parser, or candidate-flow refactor belongs to this task. Do not rename or reshape Author focus, add compatibility aliases, or update prompt snapshots.

## Verification and evidence

Retain for each real behavior slice:

- exact focused red command and intended failure;
- smallest production change;
- exact focused green result;
- explicit reason when a preservation assertion was already green and red-first was not applicable.

Then run:

1. focused Ideate entry component/a11y test;
2. real-browser accessibility regression covering visible order, accessible association, and the authorized guidance interaction;
3. stateful focus typing/changing/clearing regression;
4. compiler prompt-byte golden tests and slot/grounding determinism tests unchanged;
5. request/provider-boundary tests;
6. persistence-exclusion tests;
7. output-contract and candidate-flow suites;
8. relevant package tests, followed by repository lint, typecheck, full test, and build commands from repository guidance.

No network or real provider request is needed; use the controlled existing provider boundary. Do not claim completion while an applicable check is failing, and report any command that could not run.

## Uncertainties to resolve before implementation

- exact authority-approved author-language copy;
- the actual five concepts/terms the UI uses for slots/operators, grounding, and active context;
- whether guidance is static or has an existing interaction affordance;
- the public prompt-freshness signal and its behavior when no candidates exist versus when candidates exist;
- whether focus edits immediately discard, retain-but-mark-stale, or otherwise affect current candidates under the existing flow;
- exact public seams for observing assignments and grounding;
- current request/prompt/persistence fixtures and focused commands.

Any ambiguity that would change user-visible semantics, the freshness lifecycle, or the canonical/non-canonical boundary requires issue clarification. It should not be settled incidentally by a UI test.
