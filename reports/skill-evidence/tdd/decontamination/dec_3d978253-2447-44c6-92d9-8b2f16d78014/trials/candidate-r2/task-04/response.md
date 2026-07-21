# TDD execution plan

This is a guidance-only behavior change at the existing Ideate Author focus component seam. The first red should therefore be the missing visible/accessibility contract, not a compiler test. Existing focus, freshness, request, grounding, slot, provider, persistence, and candidate-flow tests are regression coverage; if they already pass before the copy change, they are not reds.

## Slice 1: visible, associated guidance

Render the real Ideate entry component through its public component test harness. The first failing test should assert all of the following:

- before entering focus, the author can see guidance conveying: `Author focus is optional, temporary request context—not story canon. It guides treatment within response slots that have already been assigned; it does not choose response kinds, grounding, or what belongs in the active working set.` The final wording may follow the product's voice, but the test must independently require each of those meanings;
- the guidance precedes the Author focus control in rendered document order;
- the focus control is found by its accessible role and name;
- the guidance element has an ID included in the control's `aria-describedby` token list, so any existing description remains intact; and
- the control's computed accessible description includes the guidance.

This red is valid only when the actual rendered guidance/association is missing. A missing DOM matcher, invalid story fixture, or inaccessible component setup is a precondition failure and must be repaired and rerun before production changes.

The smallest green is a visible description immediately before the existing control plus an `aria-describedby` association. Reuse the component's existing description/id primitive if it has one; otherwise add a stable component-local ID without introducing state. Do not add an event handler, compiler branch, request field, persistence path, or provider action. Rerun the same component test to green.

## Slice 2: existing focus transitions remain the only behavior

On one mounted Ideate instance with known assigned slots, grounding, and active-working-set items, exercise focus entry, change, and clearing through the public textbox. After each transition, assert the existing public prompt-freshness outcome (for example, the established stale/fresh indicator or candidate invalidation state) rather than spying on an internal callback.

At the same checkpoints, assert that the rendered assigned response kinds/operators, grounding sources, and active-working-set membership remain equal to their initial known literals. Also assert there is no candidate/success transition, no story-record persistence effect through the public persistence seam, and no provider request. A fake at the provider boundary may record zero calls, but that count must accompany the unchanged public UI and persistence assertions.

Interact with the guidance itself as the final part of this test—focus/click the associated text/control, or open and close an existing disclosure if the component already uses one—and again assert zero provider requests and no public state transition. Do not add a disclosure solely for the test; static visible guidance is the smaller implementation.

These assertions should normally be green before the production change because the focus wiring already exists. If one fails, stop: that is a separate behavioral defect, not permission to rewrite freshness or slot logic as part of this guidance task.

## Slice 3: pin the preserved request and prompt contracts

Run or add characterization at the existing public request/compiler seam for empty and populated Author focus using repository-authoritative expected literals. Assert:

- the outbound request has exactly the existing keys and value placement;
- compiled prompt bytes equal the pre-change known literals for those fixtures;
- deterministic response-slot assignment is unchanged;
- grounding and active-working-set inputs are unchanged; and
- Author focus remains excluded from canonical persistence.

Expected prompt bytes must come from an existing approved fixture or independently recorded pre-change golden, not by invoking the production compiler to calculate the test expectation. If the component harness needs to capture a request, fake only the provider boundary, trigger the existing Ideate action once, and return a valid controlled response; merely typing, clearing, or using guidance must still make no call. Preserve the existing output contract and candidate flow in that test.

No compiler or server production change is needed to make this slice green. An unexpected green is retained as regression coverage. An unexpected failure requires determining whether the fixture is stale or the historical task is broader than stated before changing production behavior.

## Refactor boundary

Refactor only while the focused component and invariant tests are green. The likely correct refactor is no production refactor at all: a single component-local guidance block is already the deepest minimal seam. It is acceptable to consolidate test setup for a valid Ideate fixture or cleanly merge multiple `aria-describedby` IDs. Do not extract a design-system abstraction for one use, move Author focus ownership, or touch compiler, slot assignment, grounding, request construction, provider, persistence, or candidate modules.

## Verification and retained evidence

Retain the exact focused command and missing guidance/accessibility assertion for red, then the same command's green result after the component-only change. Run the focused Author focus component test, the existing prompt-freshness/request/compiler regression tests, and the browser/component accessibility regression. Then run:

```text
npm run lint
npm run typecheck
npm test
npm run build
```

The packet does not provide the component/test filenames, existing freshness indicator, accessibility harness, fixture literals, or focused npm commands. Those names must be resolved from the repository rather than guessed. The implementation is complete only if the diff is confined to the minimal UI guidance seam (plus tests), the accessible association works in the rendered browser/component surface, focus transitions still use the old freshness path, and all prompt/request/slot/grounding/provider/persistence/candidate invariants remain green.
