# Execution-ready TDD response

The public behavior under test is the rendered Record Editor/CAST MEMBER editor plus the existing save-and-reopen path. Requiredness and cardinality are separate contracts: a required list property must still exist, while an empty array is valid unless the registered schema gives the list a positive minimum.

## Acceptance map and preservation boundaries

| Obligation | Evidence |
| --- | --- |
| Required, zero-minimum list distinguishes structural presence from item count | Rendered-editor test for a generic record list and a CAST MEMBER list |
| Zero-minimum guidance is adjacent and programmatically associated | Accessible-name/description assertion against the list control or list group, not a source-text check |
| Positive minimum reports the actual minimum | Rendered-editor test using an existing registered list with a real nonzero minimum |
| Empty and nonempty editing still works | User-level add/remove tests through the existing controls |
| Empty array survives save, reload, serialization, export, and round-trip | Public save/read/reopen tests plus the existing public serialization/export seams |
| Existing behavior is preserved | Existing editor, schema, validation, serialization, prompt, and export suites; canonical repository gates |

Explicit non-goals are default-item insertion, role-tag requirements, warnings, scalar-marker changes, schema/default/validator changes, and prompt changes. Tests should assert the observable absence of invented items or new blocking UI where that is visible; they should not freeze private implementation details.

## Slice 1: zero-minimum guidance in one generic Record Editor list

First add one focused rendered-editor test through the existing Record Editor entry point, using a valid registered record fixture whose required list permits `[]`.

The initial assertions should be:

- the existing required marker remains visible;
- the list is initially empty;
- adjacent text says that the list may be empty;
- the list control/group has that text in its accessible description (for example, via the test library's accessible-description query rather than by asserting a particular `aria-describedby` id);
- the existing Add control remains available.

Run the narrowest existing web/component test command that selects this test. The valid red is the accessible/visible guidance assertion failing because the UI does not yet expose the cardinality distinction. A missing DOM environment, invalid registered fixture, unmatched entry point, or inaccessible test query is setup failure: repair the fixture/query and rerun until the intended assertion fails. If the assertion already passes, record this as coverage and move to the next uncovered obligation rather than manufacturing a failure.

The smallest production change is confined to the shared list-field rendering path: obtain the list's registered minimum, treat an absent or zero minimum as zero, render adjacent `may be empty` guidance, and associate that guidance with the rendered list control/group. Do not touch the schema, validator, stored value, defaults, save payload, or scalar required-marker path.

Rerun the exact focused command and retain the green result.

## Slice 2: CAST MEMBER and positive-minimum wording

Add two small tracers through the existing public editor entry points:

1. Render a required, empty-allowed CAST MEMBER list and make the same visible and accessible-description assertions as Slice 1.
2. Render an existing registered list with a true positive minimum `N` and assert that the adjacent accessible guidance reports the literal minimum `N` and does not say `may be empty`.

These tests must use actual registered field definitions rather than hand-built partial objects that bypass parsing or registration. Cover every relevant editor variant; do not infer CAST MEMBER coverage solely from the generic editor test.

The intended reds are, respectively, missing CAST MEMBER guidance and incorrect positive-minimum wording. The smallest green change is to route both existing list renderers through the same cardinality-description decision while leaving their existing controls and required markers intact. If the two editors do not share a safe rendering seam, make the same minimal view-only decision at each public renderer first; consolidation belongs to refactor, not green.

## Slice 3: add/remove, save, and reload on one active flow

Through an existing create/edit entry point, begin with a valid record whose required list is `[]` and exercise the real controls on one mounted editor:

1. Confirm the empty list and `may be empty` description.
2. Add one valid item and save through the public action.
3. Reopen/read through the normal UI or public route and assert the one-item list is present.
4. Remove that item, save `[]`, and assert that save succeeds without a warning or synthetic replacement item.
5. Reopen/read again and assert the list is still exactly `[]`, the guidance remains associated, and Add remains available.

Repeat the minimum necessary tracer for CAST MEMBER if its save adapter or editor path differs. Use valid item data and the real boundary parser/types. The intended red must be an actual user-visible contract failure; if empty arrays already persist correctly, keep that test as preservation coverage and do not change persistence code.

The smallest production change for this slice should be **none** unless the test reveals that the new display-only change accidentally affects the payload. The historical request explicitly preserves serialization and validation. A persistence failure that predates or is independent of the guidance change requires scope clarification rather than opportunistically changing those contracts.

## Slice 4: serialization, export, and round-trip preservation

At each existing public seam, use a valid record with a required zero-minimum list equal to `[]` and independently assert the literal result:

- serialization contains that property as `[]` rather than omitting it or inventing an item;
- deserializing/reading the serialized value returns `[]`;
- export represents the list exactly as the current format specifies for an empty array;
- importing or otherwise round-tripping the exported form restores `[]`;
- any existing prompt-compilation preservation test remains unchanged and green.

Expected values should come from the current format/schema authority, not from calling the production serializer to construct the expected value. These are preservation tests and may be green immediately. A failure caused by malformed fixture data or a stale generated build is not evidence of the requested UI defect.

## Refactor boundary

Refactor only after all focused tracers above are green. The permitted refactor is a small, pure presentation helper such as `describeListCardinality(minimum)` or a shared list-guidance component if duplication now exists. Its input is already-registered cardinality metadata and its output is display/accessibility text. It must not become a second schema interpreter, alter requiredness, normalize values, or participate in validation/serialization. Keep scalar required-marker rendering outside this change. After refactoring, rerun every focused test.

## Verification and evidence ledger

For each slice, record:

- the exact focused command;
- the intended failing assertion and why it is the right-reason red;
- the minimal production change;
- the exact focused green result;
- any legitimate red-first skip because preservation behavior already passed.

Then run the relevant broader package tests and all canonical gates:

```text
npm run lint
npm run typecheck
npm test
npm run build
```

Completion requires all applicable checks to pass. Report any command that cannot run and do not claim completion with an applicable failure.

## Uncertainty to resolve before implementation

The historical task does not name concrete components, registered fixtures, positive-minimum fields, public persistence/export commands, or focused test scripts. Before the first red, inspect current repository guidance, the governing issue/authorities, field registrations, public editor seams, and existing tests to identify those names. If no registered positive-minimum list exists, do not invent or register one because that would change scope; ask whether a test-only valid registration is supported or whether the acceptance criterion needs an authority-approved fixture. If the generic and CAST MEMBER editors expose different public seams, retain one tracer for each rather than narrowing coverage to the first implementation found.
