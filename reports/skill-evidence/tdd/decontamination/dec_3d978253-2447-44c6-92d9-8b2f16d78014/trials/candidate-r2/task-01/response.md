# TDD execution plan

The first red should be rendered, observable list-field behavior. I would not start by changing schema or validation metadata: the contract says an empty array is already lawful, and the missing behavior is the UI's explanation of what `required` means for a list.

## Before red

Use the existing rendered-component integration harness and valid schema/record fixture builders. Identify the public controls used to render and save a list in the generic Record Editor and in the CAST MEMBER editor. The fixture must make the two independent dimensions explicit:

- the property is structurally required; and
- its registered item minimum is either zero or a known positive number.

Do not use an invalid partial fixture or inspect a private component method. Record the focused test command before changing production code. If the proposed assertion already passes, retain it as coverage and move to the next unmet assertion rather than manufacturing a failure.

The blind brief does not provide repository-specific test paths, runner filtering syntax, field names, or the approved wording for a positive minimum. Those must be taken from the existing public fixtures and UI vocabulary before writing literal assertions. The acceptance text does supply the literal phrase `may be empty`.

## Slice 1: zero-minimum list in the generic Record Editor

Add one rendered behavior test using a required array field whose effective registered minimum is zero. Through accessible queries, assert that:

1. the existing required marker is still rendered;
2. adjacent text says `may be empty`;
3. the list control or list group has that text in its accessible description, normally through its existing description/id association;
4. the control initially contains zero items and no default item has appeared; and
5. the existing add and remove controls remain operable.

The intended red is specifically the absent text or absent programmatic association. A missing fixture, inaccessible query caused by bad setup, or unrelated rendering exception is a wrong-reason red and must be repaired before production code changes.

The smallest green is in the narrow presentation seam that renders list-field requiredness. Read the effective minimum from the metadata source the editor already uses. When the field is a structurally required list and that minimum is zero, add the adjacent `may be empty` description and associate it with the list control. Leave the required marker, list value, field registration, and add/remove handlers unchanged. Do not alter the schema, default value, validator, serializer, or prompt compiler.

Rerun the exact focused command and confirm that this test, rather than merely the containing suite, ran and passed.

## Slice 2: CAST MEMBER and a true minimum

Repeat the public rendered assertion at the CAST MEMBER editor seam for a required, zero-minimum list. This protects the second entry point without assuming that it shares implementation with the generic editor.

Then add a contrasting fixture with a registered positive minimum, preferably a value greater than one so the number cannot be confused with generic requiredness. Assert that its accessible description communicates that exact minimum and does not say `may be empty`. Add a required scalar control to the fixture and assert that its marker and accessible description have not changed.

For both editor entry points, exercise add followed by remove on the active rendered instance. The list should return to zero items, retain the `may be empty` description, and show no new warning. This proves the interaction rather than only a static label.

If the generic and CAST editors already use one list-rendering seam, the first production change should make the CAST assertion pass without another change. If they have distinct renderers, make the second smallest call-site change using the same presentation rule; do not rewrite either form.

## Slice 3: save, reload, serialization, and export

Use public UI/repository seams rather than inspecting storage directly:

- Create or edit a record with the zero-minimum required list equal to `[]`, save it, close it, and reopen that same record. Assert zero rendered items, the `may be empty` accessible description, and no validation error.
- Add a legitimate item, save and reopen, and assert the item remains. Remove it, save and reopen again, and assert the property is present with the exact value `[]`, not omitted and not replaced with a default item.
- Through the existing public serialization/export and corresponding load/import or parse seam, assert that the exported representation contains the list property as `[]` and that the round-tripped record still contains `[]`.
- Keep a true-minimum regression proving that its pre-existing validation behavior is unchanged.

These persistence assertions may be green immediately because the required change is presentational. That is useful regression coverage, not a reason to modify working serialization or validation code. Existing compiler/prompt expectations for the same empty and nonempty fixtures should remain byte-for-byte unchanged; run the focused compiler regressions rather than updating their expectations.

## Refactor boundary

Only after all focused tests are green, extract a small presentation helper if the rule or accessible-description wiring is duplicated. Its responsibility is limited to deriving list guidance from existing field kind, structural-requiredness, and registered minimum metadata. Keep accessible-id generation in the rendering layer. Do not move schema interpretation into a new authority, unify unrelated form components, or change scalar marker logic. Rerun both editor suites after the refactor.

## Verification

Run and retain results in this order:

1. the existing focused generic Record Editor rendered-test command;
2. the existing focused CAST MEMBER editor rendered-test command;
3. the focused save/reload plus serialization/export round-trip tests;
4. the focused validation and prompt/compiler regressions covering the same fixtures;
5. `npm run lint`;
6. `npm run typecheck`;
7. `npm test`;
8. `npm run build`.

Completion requires the zero- and positive-minimum accessibility assertions, add/remove behavior, empty and nonempty round trips, and all four canonical gates to pass. The final diff should be checked to confirm that no schema, default, validation, serialization, prompt behavior, warning behavior, role-tag rule, or scalar required marker changed.
