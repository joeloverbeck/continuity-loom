# TDD execution plan

The first red belongs at the public core reference-validation/compiler seam. The fixture should isolate the one missing case: a selected CAST MEMBER has an `entity_id` that resolves to an ENTITY in the project, but that ENTITY is absent from the active working set.

## Before red

Use the existing valid story/project builders and the public validation or compilation entry point already used by reference-integrity tests. From the governing schema, enumerate the three cast-band values literally in the test; do not derive the expected band set from production validation logic. Reuse the independently specified literal code, severity, field/path shape, and public message format from an existing required-but-unselected reference contract. Do not import a production diagnostic builder to compute the expected result.

The blind brief does not name the band literals, diagnostic literals, focused test paths, or runner-filter syntax. Those are the only details that must be resolved from the active schema/contract and existing public tests before implementation. They should be recorded in the test rather than left as broad string matching.

## Slice 1: one unselected CAST MEMBER reference

Choose one of the three explicit cast bands and build a valid fixture with:

- a selected CAST MEMBER in that band;
- its `entity_id` set to a distinctive raw identifier;
- a project record at that identifier whose kind is ENTITY; and
- no entry for that ENTITY in the active working set.

Call the public validator/compiler and assert one required-but-unselected blocker at the CAST MEMBER `entity_id` reference. Assert the exact existing diagnostic code, severity, path, and message shape. Also assert that compilation is blocked, no prompt bytes are returned, and neither diagnostic output nor other user-visible blocked output contains the raw identifier.

The intended red is the absence of the required-but-unselected diagnostic and consequent failure to block. A parse error, invalid fixture, dangling-reference diagnostic, wrong-kind diagnostic, or unrelated blocker is a wrong-reason red. Fix only the fixture/setup and rerun until the isolated assertion fails for the missing behavior.

The smallest production change is in the central core seam that classifies reference roles as required or optional for working-set validation. Add only the cast-specific rule: `entity_id` on a selected CAST MEMBER is a required working-set reference in each of the three cast bands. Feed that rule through the existing required-but-unselected diagnostic path so its code, severity, message construction, sanitization, and fail-closed behavior are reused. Do not create a new diagnostic, change field storage/schema, add the ENTITY to the working set, or touch provider code.

Rerun the exact focused command and confirm the intended test now passes.

## Slice 2: the three-by-three failure matrix

Expand through small parameterized cases whose expected inputs enumerate all three cast bands and all three failure modes:

| Failure mode | Fixture distinction | Expected behavior |
| --- | --- | --- |
| Unselected | Correct-kind ENTITY exists in the project but not the active working set | Existing required-but-unselected blocker |
| Dangling | `entity_id` resolves to no project record | Existing dangling-reference blocker |
| Wrong kind | `entity_id` resolves to a non-ENTITY record | Existing wrong-kind blocker |

For every cell, assert the exact applicable diagnostic contract and blocker severity. Also assert compilation returns no prompt bytes, blocked public output does not reveal the distinctive raw identifier, and the working-set input remains unchanged. The dangling and wrong-kind cases should normally be green regressions; do not alter their expectations merely because the new rule shares their validation path.

Add explicit neighboring-lane regressions using existing public fixtures:

- an optional non-cast reference that is allowed to remain unselected must retain that posture; and
- an existing required non-cast reference must retain its current required-but-unselected behavior.

This proves the change is keyed to CAST MEMBER `entity_id`, not a global change to reference requiredness.

## Slice 3: recovery on the active validation seam

For each cast band, exercise each applicable repair as a transition from a blocked input to a corrected input and re-run the public validator/compiler:

- **Selecting:** start from the unselected case, add the already-existing ENTITY to the caller-supplied active working set, and confirm the blocker clears.
- **Repointing:** start from the dangling case, change `entity_id` to an already-selected valid ENTITY, and confirm the dangling blocker clears.
- **Correcting:** start from the wrong-kind case, supply a corrected ENTITY record for that reference through the normal record-edit/input seam, and confirm the wrong-kind blocker clears.

With otherwise valid fixtures, each corrected case should compile successfully and produce prompt bytes. Assert that validation itself did not mutate the working set, stored record, or `entity_id`; all changes above are explicit test inputs representing user corrections.

## Slice 4: send gating and provider boundary

At the public send/generation seam, use the real assembled application behavior with only the external provider client replaced by a faithful boundary fake. For an unselected ENTITY case in each cast band, assert the visible/public blocked result, absence of prompt bytes and raw identifier, and disabled or rejected send behavior. Assert zero provider requests only as supporting evidence; the blocked public result and absence of forbidden output are the primary oracle.

Run the existing send-gating regressions for dangling and wrong-kind references as well. No test should make a real provider request.

## Documentation after behavioral green

Once the behavioral and regression tests are green, synchronize `docs/compiler-contract.md` and `docs/story-record-schema.md` with the same narrow rule: selected CAST MEMBER `entity_id` references in all three cast bands fail closed when the target ENTITY is not selected into the active working set. State that dangling and wrong-kind behavior remains in force and that validation does not mutate the working set. Review or repository doc checks verify this obligation; documentation is not a substitute for the behavioral red/green evidence.

## Refactor boundary

Refactor only while green. If the three cast-band checks duplicate one rule, express them through the existing reference-role classifier or a small cast-role predicate. Keep the existing diagnostic constructor and prompt gate intact. Do not generalize other reference lanes, add compatibility aliases, migrate records, change serialization, or restructure the compiler. Rerun the focused matrix and send-gating test after refactoring.

## Verification

Run and retain results in this order:

1. the focused core reference-validation test containing the first unselected case;
2. the focused three-band/failure/recovery matrix;
3. the focused compiler prompt-suppression and raw-identifier-sanitization tests;
4. the focused send-gating test with the provider boundary fake;
5. existing reference-role, schema-parse, serialization, dangling, and wrong-kind regressions;
6. any repository documentation checks;
7. `npm run lint`;
8. `npm run typecheck`;
9. `npm test`;
10. `npm run build`.

Completion requires the new unselected case, all nine band/failure combinations, all recovery paths, neighboring-role posture, prompt/send gating, provider non-invocation, both documentation updates, and all canonical gates to pass. The final diff should show no schema migration, stored-field change, automatic working-set mutation, provider behavior change, or unrelated reference-role change.
