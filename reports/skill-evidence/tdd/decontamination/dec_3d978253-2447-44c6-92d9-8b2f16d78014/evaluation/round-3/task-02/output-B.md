# TDD execution plan

Begin at the narrow core validation/compiler preflight seam that already emits dangling, wrong-kind, and required-but-unselected reference diagnostics. The first behavior to add is not a new diagnostic: it is applying the existing required-selection rule to CAST MEMBER `entity_id` in each of the three canonical cast bands.

Before the first red, identify the canonical three cast-band paths from the public story-record/domain types and find an existing fixture for a different required-but-unselected reference. Reuse that fixture's exact diagnostic code, severity, and message oracle. Do not invent band names or copy message text from implementation code. Also locate the focused core test command and confirm the base story fixture parses successfully.

## First red-green slice

Choose one canonical cast band and construct a valid project where:

- the CAST MEMBER has an `entity_id`;
- that id resolves to an ENTITY in the project;
- the ENTITY is absent from the active working set; and
- all unrelated references and working-set entries are valid.

Call the public validation/compiler preflight function and assert that the result contains exactly the existing required-but-unselected diagnostic shape at that CAST MEMBER `entity_id` path, with the established blocking severity. Also assert that this case is neither reported as dangling nor wrong-kind.

The intended red is the absence of that required-but-unselected blocker. Parser rejection, invalid fixture setup, or a different reference error is a wrong-reason red. Prove fixture validity separately and rerun until the failing assertion isolates the missing selection rule.

The smallest production change is in the existing data-driven reference-policy/descriptor seam: mark CAST MEMBER `entity_id` as requiring its resolved ENTITY to be in the active working set for all cast-band paths. Route it through the generic required-but-unselected diagnostic builder. Do not add a cast-specific message, mutate the working set, change stored fields, or alter other reference descriptors.

Rerun the exact focused command and confirm the intended test passes.

## Failure-and-recovery matrix

After the first slice is green, add one tracer at a time until the public validation seam covers this matrix for every canonical cast band:

| Initial reference state | Required blocker | Recovery action | Green assertion |
| --- | --- | --- | --- |
| id does not resolve | existing dangling diagnostic | correct/repoint to a selected ENTITY | cast-reference blocker clears |
| id resolves to the wrong record kind | existing wrong-kind diagnostic | correct/repoint to a selected ENTITY | cast-reference blocker clears |
| id resolves to an ENTITY outside the working set | existing required-but-unselected diagnostic | select that ENTITY | cast-reference blocker clears |

That is three failure modes across three bands, with recovery proved on the same logical record rather than unrelated before/after snapshots. If the data-driven production change causes later band assertions to pass immediately, record those as coverage additions. Keep the oracle specific enough to prove the relevant blocker clears while any deliberately unrelated diagnostics remain.

Add two preservation groups at the same core seam:

- representative required and optional reference roles outside CAST MEMBER keep their prior selected/unselected posture and diagnostic shapes; and
- validating the blocked case leaves the input record and active working-set membership unchanged.

Use valid public record builders/parsers and literal expected diagnostics from the established contract. Do not mock owned validation/compiler modules.

## Prompt and send gating slice

Through the public compile result, assert that each blocked cast-reference case returns no prompt artifact/bytes and that no rendered diagnostic or public error payload exposes the raw `entity_id`. Then exercise the public send seam with an unselected CAST MEMBER reference:

- send remains disabled or is rejected by the existing gate;
- the user-visible result is the blocker, with no prompt bytes or raw id; and
- the provider boundary receives zero calls.

A provider fake is appropriate only at that external boundary. Its call count is supporting evidence; the public gated result and absence of prompt output are the primary assertions. Read the record back through the public record/working-set seam after the attempt and assert that no selection was added automatically and no stored field changed.

## Documentation and refactor boundary

Once behavioral tests are green, update the compiler contract and story-record schema documentation to state the cast-specific fail-closed rule: a CAST MEMBER `entity_id` must resolve to an ENTITY present in the active working set in all three bands. Documentation review is synchronization evidence, not a substitute for a failing behavior test.

Refactor only while green. The allowed boundary is consolidating the three cast-band registrations around the existing reference-policy descriptor if they are duplicated. Keep the generic resolver and established diagnostic builder generic; do not broaden required-selection behavior to other roles, introduce a schema migration, or create a compatibility path. Rerun the focused core and gating tests after refactoring.

## Verification

Run focused commands for:

- the core cast-reference matrix and recoveries;
- non-cast required/optional reference regressions;
- compiler prompt suppression and raw-id non-disclosure;
- send gating with the provider boundary controlled; and
- record/working-set non-mutation and stored-shape preservation.

Then run the repository gates:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Report the exact intended first red, each focused green, the documentation synchronization, and the canonical results. The unresolved repository-specific details are the exact cast-band identifiers, public test filenames, and focused commands; derive them from the active types and existing neighboring tests instead of guessing.
