# TDD execution plan: required list guidance

This is a single-issue change with two agreed public seams: the rendered Record Editor/CAST MEMBER list controls and the existing public save/reload/export path. No production or test commands should run until the implementer records whether `CONTEXT.md` exists and checks the active UI, schema, validation, and serialization authorities. The supplied issue is clear that those authorities must remain unchanged; if an authority instead requires nonempty structurally-required arrays, that is a conflict and the first red is blocked pending a scope correction.

## Acceptance map and pre-red decisions

- Structural requiredness and item cardinality are separate atoms. The existing required marker continues to mean that the array property must be present. It must not be used to infer `length > 0`.
- For every list with a registered minimum of zero (including the generic editor and CAST MEMBER editor examples), the observable control has adjacent text meaning “may be empty,” and that text is in the control's accessible description.
- For a list with a registered minimum greater than zero, the adjacent and accessible text states that exact minimum and does not say “may be empty.” The test must use an existing true-minimum field from the registry; it must not create a production-only example.
- Empty and nonempty arrays, add/remove, save, reload, serialization, export, and round-trip preservation are distinct proof obligations at the existing public seams.
- Scalar required markers, schemas/defaults/validation/prompt behavior, and existing entry points are regression boundaries, not places to add new behavior.

The exact component names, test files, runner invocation, and registered true-minimum fixture are not present in this blind packet. Before writing the first test, locate the existing editor integration/component tests and invoke their underlying runner directly if the root `npm test` script does not forward a focused file argument. Record that resolved command in the red/green ledger. Do not compensate for uncertainty by testing a private helper or by adding a synthetic schema rule.

## Vertical red-green slices

Run each slice red to green before writing the next one.

1. **Zero-minimum generic list, rendered accessibility seam.** Render the generic Record Editor through its existing public test harness with a required array property whose registered minimum is zero and value is `[]`. Assert that the existing required marker remains, the list/control remains available, adjacent “may be empty” guidance is visible, and the list's accessible description includes that guidance (for example, by an accessible-description query rather than by inspecting an internal ID). Also assert that no item-level required warning appears. The intended first red is the missing guidance/accessibility assertion, not fixture setup.

2. **Zero-minimum CAST MEMBER list at the same public seam.** Open the existing CAST MEMBER edit entry point with its lawful empty list. Assert the same structural-required marker plus associated “may be empty” description. This guards against fixing only the generic renderer if CAST has a specialized path. The red must fail on the missing observable description.

3. **True nonzero minimum.** Render the registry's existing list field with a real minimum `N > 0`. Assert that its adjacent accessible guidance communicates the literal `N` and does not contain “may be empty.” Use a literal expected phrase derived from the product copy/spec, not code that reproduces the production formatter. This test separates required-property presence from list cardinality.

4. **List interactions.** Through user-visible add/remove controls, start empty, add an item, verify the nonempty value, remove it, and verify the list returns to `[]` without a warning or invented row. Repeat at the CAST MEMBER entry point if it does not use the same rendered public boundary. Existing create/edit entry points and controls must remain queryable throughout.

5. **Persistence tracer.** Through the existing save interface, save a lawful `[]`, reload the record through the public read/edit path, and assert the field is present and exactly `[]`. Exercise the existing serializer/export interface and re-import or round-trip path, asserting `[]` remains `[]`; then repeat with a representative nonempty value to ensure the UI change did not erase items. Also assert the compiled prompt output for the same record is byte-for-byte unchanged from the pre-change fixture. If these new assertions pass before production changes, record them as `coverage-only existing behavior; red-first N/A because behavior already existed and no production code changed`. If one fails, it becomes its own behavior red and must be fixed separately rather than folded into the copy change.

6. **Regression boundary.** Run the existing scalar required-marker cases unchanged and the relevant schema/default/validation tests. Do not rewrite an expectation unless the issue explicitly authorizes that changed contract; this issue does not authorize one.

## Smallest production change

At the existing list-field rendering boundary, derive display metadata from the already-registered item minimum independently of the existing property-required flag:

- minimum absent or zero: render the agreed “may be empty” guidance;
- minimum greater than zero: render guidance containing that exact minimum;
- keep the required marker driven by structural/property requiredness exactly as it is today.

Render the guidance next to the list and associate it with the current list/group/input using the component's established description mechanism (`aria-describedby` or its existing accessible-description abstraction). Reuse the existing list controls and field registry. Do not change schemas, defaults, parsers, validators, serializers, prompt compilation, save handlers, or seed list items. If generic and CAST editors share this rendering boundary, one production change should serve both; if CAST has a thin wrapper, only pass the same cardinality metadata through that wrapper.

## Refactor boundary after green

After all behavior is green, a small extraction is allowed only if both editor paths otherwise duplicate the formatting/description wiring: one pure formatter for zero versus positive minimum and one shared description-ID wiring path. Do not redesign the editor, consolidate schemas, rename fields, or alter validation as part of this issue. Rerun the focused rendered-control and persistence tests after any extraction.

## Verification

For every slice, record the focused red command and confirm the failure names the intended missing guidance or behavior; then record the identical focused command green. Follow with the relevant editor/component suite, accessibility suite, persistence/serialization/export suite, compiler regression suite, and finally:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Completion requires no new console/accessibility failures, the empty and nonempty round trips remaining exact, and no changed schema, validation, scalar-marker, serialization, or prompt expectations.
