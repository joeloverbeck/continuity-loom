# TDD execution plan

## Preflight and uncertainty

The supplied material does not name the validator entry point, cast-band constants, diagnostic code, or focused-test paths. Before editing, identify the public core validation/compilation seam, the typed project and working-set fixture builders, and the existing required-but-unselected diagnostic used by another required reference. Capture that diagnostic's code, severity, and message shape from existing behavior rather than inventing a cast-specific variant. Also locate the public send/generation seam and its injectable provider boundary. Confirm the compiler contract and story-record schema are the governing docs, but defer their edits until behavior is green.

## Slice 1: one unselected CAST MEMBER reference

Start at the narrow core-validation seam with one cast band. Build a valid fixture in which:

- a CAST MEMBER has an `entity_id`;
- that identifier resolves to an ENTITY in the project; and
- the ENTITY is absent from the active working set.

Add one focused test asserting validation returns the existing required-but-unselected blocker with exactly the existing severity and message shape, attributed to the CAST MEMBER `entity_id` lane. Also assert no diagnostic text exposes the raw identifier. Run the focused core test and confirm it fails because this reference is currently treated as optional/allowed, not because the fixture is invalid.

The smallest green change is to the existing reference-requirement classification used by core validation: classify CAST MEMBER `entity_id` as required for that cast band and route it through the already-existing required-reference validation path. Reuse the current dangling, wrong-kind, and required-but-unselected diagnostics; add no new diagnostic or stored field. Rerun the exact focused command.

Once green, refactor only the cast-band classification if needed so all three named bands share one explicit cast-reference rule. Do not redesign general reference validation, change other role postures, mutate the working set, or touch persistence. Rerun the focused test after refactoring.

## Failure and recovery matrix

Extend vertically, keeping each addition red then green, into a table-driven core test matrix across all three cast bands and all three failure modes:

| Failure mode | Fixture oracle | Expected public result |
| --- | --- | --- |
| dangling | `entity_id` resolves to no project record | existing dangling blocker |
| wrong kind | `entity_id` resolves to a selected non-ENTITY record | existing wrong-kind blocker |
| unselected | `entity_id` resolves to a project ENTITY absent from the working set | existing required-but-unselected blocker |

For every matrix row, assert the established diagnostic code/message/severity rather than a newly invented string, and assert the raw identifier is absent. Preserve the existing dangling and wrong-kind expectations while adding the missing unselected path.

Use valid public inputs to prove recovery, preferably on the same assembled validation boundary:

1. Add the existing ENTITY to the active working set and assert only the unselected blocker clears.
2. Repoint a dangling CAST MEMBER reference to an existing selected ENTITY and assert the dangling blocker clears.
3. Correct the wrong-kind target to an ENTITY (or repoint to a selected ENTITY through the normal public model operation) and assert the wrong-kind blocker clears.

Cover these transitions for each cast band, while retaining any unrelated diagnostics in the fixture so the assertion cannot accidentally mean “all diagnostics disappeared.”

## Gating and non-regression slices

After core behavior is green, add an assembled compiler/send test for a blocked cast reference. Through the public result, assert that prompt bytes are unavailable/empty, the user-visible diagnostic contains no raw identifier, and send remains disabled or rejected. Supply a faithful fake only for the external provider boundary; assert both the blocked public result and zero provider calls. The call count is supporting evidence, not the sole oracle. No network request belongs in this test.

Add focused regression cases for representative non-cast reference roles: an existing optional lane must remain optional, and an existing required lane must retain its current posture and diagnostic. Confirm valid selected CAST MEMBER-to-ENTITY references still compile normally. These tests guard against broadening the classification change beyond the three cast bands.

With all behavioral tests green, synchronize the compiler contract and story-record schema to state the cast-specific fail-closed rule. Review those docs for agreement with the tested behavior; do not use text checks or doc edits as proof that runtime behavior works.

## Verification

For each slice, preserve the exact focused red command and intended assertion, then rerun it green. After the matrix is complete, run the focused core validation suite, compiler regression suite, and send/provider-gating suite. Then run the relevant broader package tests and the repository's canonical gates from its guidance:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Review the final diff to confirm there is no migration, stored-field change, automatic working-set mutation, provider integration change, or posture change for another reference role. Report any command that cannot run, and do not claim completion while an applicable check fails.
