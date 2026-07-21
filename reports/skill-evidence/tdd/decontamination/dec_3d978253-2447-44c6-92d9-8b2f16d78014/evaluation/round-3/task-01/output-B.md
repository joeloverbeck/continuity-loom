# TDD execution plan

The behavioral seam is the rendered list control in each existing editor, followed by the editor's public save/reload flow. Structural requiredness and item-count requiredness are separate contracts: a property can be structurally required while its lawful value is `[]`.

Before changing production code, identify the existing rendered-component test harness for the generic Record Editor and CAST MEMBER editor and the public save/reload test seam. Also identify the schema/field metadata already supplied to the list renderer. I would not add a new schema flag unless the current metadata truly omits `minItems`; the task explicitly preserves the schemas.

## First red-green slice: zero-minimum guidance

Start with one structurally required list in the generic Record Editor whose registered minimum is zero. Render the editor through its public component seam with a valid record containing `[]`, then assert all of the following as one observable accessibility contract:

- the existing required-property marker is still present;
- the list control has an accessible description containing `may be empty`;
- the description is adjacent in the rendered UI and programmatically associated with that control (prefer an accessible-description query; inspect `aria-describedby` only if the harness cannot query the computed description);
- the empty list is not reported invalid merely because it has zero items; and
- the existing add control remains available.

The intended red is the missing zero-minimum description or association. A fixture/parser failure, missing control, or unrelated validation failure is setup, not the red; repair the fixture or focused harness and rerun until this assertion fails for the requested behavior.

The smallest production change is at the existing shared list-field rendering seam: derive presentation guidance from the already-registered item minimum. When the list is structurally required and `minItems` is absent or zero, render `may be empty`; when `minItems > 0`, render the actual minimum. Give that guidance a stable per-control id and compose it into the control's existing accessible-description association without replacing other descriptions. Do not touch schema definitions, defaults, validators, serializers, prompt compilation, or scalar-marker code.

Rerun the exact focused command and confirm the intended component test passes.

## Subsequent vertical slices

Add and satisfy each tracer one at a time, rerunning its focused test before moving on:

1. Render the same zero-minimum case through the CAST MEMBER editor and assert the same required marker, `may be empty` description, association, and add-control availability. If the first shared-renderer change makes this pass immediately, record it as added coverage, not a fabricated red.
2. Render a structurally required list with a real registered minimum `N > 0`. Assert the accessible description reports the literal configured minimum, does not say `may be empty`, and the existing validator continues to reject fewer than `N` items. The expected value comes from the fixture's registered constraint, not a production helper.
3. Through the existing editor controls, add an item, remove it again, save the lawful `[]`, reload the same record through the public read/editor entry point, and assert the control still contains zero items and remains described as `may be empty`.
4. Save and reload a nonempty list and assert its item value and ordering are unchanged and add/remove remain usable after reload.
5. Exercise the existing public serialization/export and import/round-trip seams with both empty and nonempty lists. Assert `[]` remains an explicit empty array rather than becoming missing, receiving a default item, or changing shape.

The save/reload and serialization assertions may already pass. Establish them as green preservation tests before the UI change where possible; they are not legitimate failing behavior tests unless the current product actually violates them.

Add narrow regression assertions that scalar required markers are unchanged, no role tag or invented list item appears, and representative compiled prompt output is byte-for-byte unchanged for the same accepted record. Existing schema-validation tests should remain unchanged and green. Use public outputs rather than snapshots of internal renderer helpers.

## Refactor boundary

Refactor only after all focused tests are green. If both editors currently duplicate the same presentation branch, extract a small component-layer helper for list minimum guidance and accessible-description id composition. Keep it on the rendering side of the schema/validation boundary; it may consume existing structural-required and minimum metadata but must not redefine either. Do not rewrite the editors or generalize scalar requiredness as part of this change. Rerun the focused component and persistence tests after the refactor.

## Verification

Run the exact focused commands for:

- generic Record Editor list rendering/accessibility;
- CAST MEMBER list rendering/accessibility;
- editor add/remove plus save/reload;
- serialization/export round trips; and
- prompt and schema/validation preservation.

Then run the canonical gates:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Report the first red command and intended assertion, each focused green rerun, and all canonical results. The only material uncertainty is the current test filenames and whether both editors already share a list renderer; resolve those by inspecting the existing tests/components rather than guessing a new architecture.
