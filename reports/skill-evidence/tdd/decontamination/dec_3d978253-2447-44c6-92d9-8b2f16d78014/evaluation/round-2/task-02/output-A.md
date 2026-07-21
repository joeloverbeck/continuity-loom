# TDD execution plan: CAST MEMBER entity reference validation

Treat this as one issue with three pre-agreed public seams: core validation/compilation, the public send boundary, and post-green contract documentation. The first behavior red belongs at the core validation seam. Documentation is synchronization evidence only and must not be used to make the behavioral test pass.

Before the first red, record `CONTEXT.md` status and check the active validation, compiler, schema, and provider/send authorities. The issue authorizes only a cast-specific fail-closed rule; any proposed general tightening of reference roles is out of scope. The exact names of the three cast-band values, current diagnostic code/message, public validation function, fixtures, and focused commands are not included in this blind packet. Resolve them from existing public fixtures and tests before implementation, and copy the existing required-but-unselected diagnostic literal as the test oracle rather than inventing a new message.

## Acceptance matrix

Instantiate this matrix with each of the three canonical cast-band values already used by the product:

| Cast band | Dangling `entity_id` | Existing wrong-kind target | Existing ENTITY omitted from active working set | Recovery |
|---|---|---|---|---|
| existing band 1 | existing blocker preserved | existing blocker preserved | new required-but-unselected blocker | repoint/correct/select clears only the relevant blocker |
| existing band 2 | existing blocker preserved | existing blocker preserved | new required-but-unselected blocker | repoint/correct/select clears only the relevant blocker |
| existing band 3 | existing blocker preserved | existing blocker preserved | new required-but-unselected blocker | repoint/correct/select clears only the relevant blocker |

For every blocked cell, assert the public result's exact diagnostic code, severity, role/path, and established message shape; assert that no prompt bytes are returned and that the raw identifier is absent from all user-visible/compiler output. For every recovered cell, assert the relevant blocker is gone without suppressing unrelated diagnostics. Add a separate regression matrix for every other existing reference lane/role, proving its required/optional posture is unchanged.

Sequence is significant only for the recovery tests: on the same project fixture, observe blocked validation, perform the public working-set selection/repoint/correction action, validate again, and observe the blocker clear. Two unrelated snapshots are not equivalent recovery proof.

## Vertical red-green slices

Execute one slice completely before adding the next.

1. **First tracer: unselected ENTITY in one canonical cast band.** Build the record through the existing public typed fixture/builder: the CAST MEMBER is selected in the chosen band, its `entity_id` resolves to an ENTITY record in the project, and that ENTITY is deliberately absent from the active working set. First prove the fixture preconditions (target exists, kind is ENTITY, cast member is active, target is unselected). Call the public core validation/compiler boundary. Assert the existing required-but-unselected diagnostic code, severity, and literal message shape. Also assert compilation is blocked, returns no prompt bytes, and does not expose the raw ID. The intended red is specifically that the required-but-unselected diagnostic is absent; a schema/fixture failure is only `partial red - wrong reason` and must be repaired before production code changes.

2. **Minimal green for that tracer.** At the existing declarative reference-rule/validation boundary, classify CAST MEMBER `entity_id` as a required selected reference when the cast member participates in any cast band. Reuse the existing required-but-unselected diagnostic path. Do not special-case message construction in the compiler and do not mutate the working set.

3. **Remaining cast bands.** Add the same unselected-ENTITY assertion separately for each other canonical band and run each red/green in turn. If the first minimal rule already makes a new band's assertion pass, verify that it observes the intended public seam and record it as coverage-only existing behavior after the production change, not as a fabricated red.

4. **Existing failure modes.** For each band, exercise dangling and wrong-kind `entity_id` through the same public boundary and assert their existing diagnostics remain exact, compilation remains blocked, no prompt bytes/raw ID escape, and the new unselected diagnostic does not replace the more specific existing failure. These are regression checks; do not change their expected values.

5. **Recovery on one active fixture per case.** For each band, cover: selecting the existing ENTITY clears the unselected blocker; repointing a dangling reference to a selected ENTITY clears the dangling blocker; and correcting/repointing a wrong-kind target to a selected ENTITY clears the wrong-kind blocker. Revalidate/compile on the same fixture after each public action and assert normal prompt production resumes only when no blockers remain.

6. **Other reference lanes.** Parameterize over the existing non-CAST reference roles and assert each retains its current required/optional behavior, including any lawful unselected optional reference. Expected values must come from current contract fixtures, not from the new CAST rule.

7. **Send/provider seam.** Through the existing public send/API boundary, submit a fixture blocked by the new unselected CAST reference. Assert send is gated with the established validation response, no prompt/raw ID appears in the response, and a provider test double records zero calls. Then select the ENTITY and retry on the same project state; assert the validation blocker is removed and the request reaches the normal post-validation path. This is a distinct public-seam tracer, not an internal compiler mock assertion.

## Smallest production change

Change only the existing reference-validation policy/table/predicate that decides whether a selected record's reference must resolve to a selected working-set record. Add CAST MEMBER `entity_id` for all three existing cast bands to the required-selected lane, and route its unselected case through the already-existing required-but-unselected diagnostic builder. Keep dangling and kind validation precedence intact.

There should be no schema migration, stored-field change, serializer change, general reference-role default change, automatic target selection, prompt fallback, send-handler special case, or provider behavior change. If the current policy cannot express “required only for selected CAST MEMBER records,” extend that narrow policy representation; do not make all `entity_id` fields globally required.

## Refactor and documentation boundary

Only after behavioral green, remove any tiny duplication in the cast-band membership predicate or matrix fixture if doing so preserves the public assertions. Do not reorganize the compiler or validation pipeline.

Then update the compiler contract and story-record schema documentation to state the exact cast-specific rule: a selected CAST MEMBER's `entity_id` must resolve to an ENTITY that is also in the active working set, for each of the three cast bands, and failure is fail-closed. State explicitly that storage shape is unchanged and other reference lanes retain their prior posture. Review those documents for conformance, but do not count the edits as test proof.

## Verification

For each tracer, record the focused command red and ensure the failure is the missing unselected-reference behavior, then rerun the identical command green. Run the focused core validator/compiler file, its full package suite, the send/API gating suite, all existing reference-validation regressions, and any doc/contract checks. Finish with:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Completion requires exact matrix coverage for three bands by three failure modes, same-instance recovery proof, zero provider calls while blocked, no prompt bytes or raw identifiers on blocked paths, synchronized docs, and no schema/storage or non-CAST reference expectation changes.
