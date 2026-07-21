# TDD execution plan

## Preflight and uncertainty

The supplied material does not name the component, fixture, or focused-test paths. Before the first edit, locate the existing rendered tests for the generic Record Editor and CAST MEMBER editor, their public schema/field-registry fixtures, and the existing save/reload and export tests. Use their typed builders and focused commands; do not invent a partial fixture or treat a harness failure as the red. Also confirm that the applicable authority documents agree that required array presence and `minItems` are separate contracts. The public seams are the rendered editor, its accessible list control, and the existing save/read/export interfaces.

## Slice 1: a structurally required, zero-minimum list

Add one rendered test around an existing required array field in the generic Record Editor whose registered minimum is zero (or absent and therefore zero). The fixture must be valid at the editor's normal public boundary and contain the property as `[]`.

The first red should assert all of this observable contract:

- the field retains the existing required-property marker;
- adjacent text says “may be empty”;
- the list control/group has that text in its accessible description, proving programmatic association rather than merely finding nearby text;
- no nonzero-minimum wording is exposed; and
- the existing add control is still operable.

Run only that component test and confirm the assertion fails because the guidance/accessible description is missing or wrong. A fixture rejection, missing test environment, or inability to locate the control is a setup failure to repair and rerun, not the behavioral red.

The smallest green change is at the list-field presentation seam: derive the item-count guidance from the existing array metadata while continuing to derive the required marker from structural requiredness. Render a small adjacent description and associate it with the existing list control using the component's current accessibility mechanism. For a zero minimum, the description is “may be empty.” Do not touch schemas, defaults, validators, serialization, form state, or prompt compilation.

Rerun the exact focused test. Only after it is green, extract a tiny formatter/presentation component if both editors would otherwise duplicate the mapping from effective minimum to description. Keep the refactor inside list-field labelling; do not rewrite the editor or form architecture. Rerun the focused test after the refactor.

## Subsequent tracer slices

Proceed one failing behavior at a time:

1. Add the equivalent zero-minimum rendered test for an existing CAST MEMBER list field. Make the shared presentation seam serve it, then rerun both focused component tests.
2. Add a test using an existing registered nonzero-minimum list. Assert its accessible description reports the actual minimum (for example, the fixture's literal minimum), does not say “may be empty,” and remains structurally marked exactly as before. Extend only the description formatter if needed.
3. On one mounted editor instance, start with `[]`, add an item, remove it back to `[]`, and assert the guidance remains associated and the list controls remain available throughout. Add the corresponding nonempty case so the hint is based on the registered contract, not current item count.
4. Through the existing public create/save/read path, save a lawful empty list and reload the record into the edit entry point. Assert the property is still present as `[]`, the editor still shows zero items, and add/remove controls and “may be empty” description are available. Repeat with a nonempty value and with the CAST MEMBER editor. Do not inspect storage as a shortcut for reload behavior.
5. Through the existing serialization/export public seam, assert empty and nonempty arrays round-trip unchanged. Preserve existing prompt-output expectations/goldens so the UI-only change cannot alter prompt bytes. Add no default item, warning, or role tag.
6. Add narrow regressions proving scalar required markers are unchanged and an existing true-minimum control still rejects too few items through the existing validator. Existing create and edit entry-point tests should continue to prove both routes remain available.

For every slice, retain the exact focused red command and the intended failing assertion, make only the production change needed for that slice, and rerun the same command green. If a proposed assertion is already green, record it as coverage and do not fabricate a failure.

## Verification

Run the discovered focused component commands after each UI slice, then the existing focused persistence, serialization/export, validation, and prompt-compiler regression commands. Review the production diff to confirm there are no schema, default, validation, serialization, prompt, or scalar-marker changes. Finally run the canonical gates exactly as supplied:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Do not claim completion if an applicable focused or canonical check is failing; report any command that cannot run.
