# Execution-ready TDD response

The behavior belongs at the existing public validation/compiler seam, with one end-to-end UI/send tracer to prove fail-closed presentation. The requested change is narrow: `entity_id` on a selected CAST MEMBER is a required **working-set** reference in each of the three cast bands. The diagnostic for an ENTITY that exists in the project but is not selected must be the existing required-but-unselected diagnostic, including its current severity and message shape.

## Acceptance map and preservation boundaries

Use the three canonical band values from the active schema/contract; do not substitute guessed names. For each band, the test matrix is:

| Referenced value/state | Required assertion |
| --- | --- |
| Missing/dangling id | Existing dangling blocker remains unchanged |
| Existing record of the wrong kind | Existing wrong-kind blocker remains unchanged |
| Existing ENTITY absent from active working set | Existing required-but-unselected diagnostic, existing severity/message shape, compilation blocked |
| Same ENTITY selected into the working set | The unselected blocker clears and compilation succeeds if the fixture has no other blockers |
| Reference repointed to an already-selected ENTITY | The former reference blocker clears |
| Dangling/wrong-kind value corrected to a selected ENTITY | The relevant blocker clears |

Additional public evidence must prove that a blocked result exposes neither prompt bytes nor the raw identifier, the Send action remains gated, and the external provider is not called. Regression coverage must show that every other reference role retains its current required/optional policy. Schema/storage representations and the working set itself must remain byte-for-byte/structurally unchanged by validation.

## Slice 1: one cast band, existing ENTITY, unselected

Start at the public compiler/validation entry point with a valid project fixture that includes:

- one selected CAST MEMBER in the first canonical band;
- its `entity_id` pointing to an existing ENTITY record;
- that ENTITY absent from the active working set; and
- all unrelated required context valid, so this is the only blocker.

Add a focused test whose first failing assertions are:

- compilation is blocked;
- the diagnostic has the exact existing required-but-unselected code/category, severity, and message structure, populated for CAST MEMBER `entity_id`;
- no prompt bytes are returned;
- neither the blocked public result nor its user-facing diagnostic contains the raw `entity_id` literal.

Derive the expected diagnostic from the existing public diagnostic contract or an existing required-reference worked example, not by invoking the production diagnostic builder in the assertion. The intended red is specifically that this reference is currently allowed or classified as non-blocking. An invalid fixture, unrelated blocker, missing build artifact, or stale registration is a wrong-reason red and must be repaired before production code changes. If this already passes, record unexpected-green coverage and move to the next missing obligation.

The smallest production change is to the existing reference-policy registration/classification: mark CAST MEMBER `entity_id` in this band as requiring a selected ENTITY. Reuse the current required-reference validation path so the existing required-but-unselected diagnostic is emitted. Do not add a parallel validator, new diagnostic, new message, schema field, migration, automatic selection, or storage normalization.

Rerun the exact focused command and retain the green result.

## Slice 2: complete all three bands without narrowing scope

Add one equivalent tracer for each of the remaining two canonical bands. A table-driven public test is appropriate only if every row runs as a separately named case and failures identify the band. Each row must assert the same public blocked result and exact existing diagnostic contract for the unselected ENTITY.

The intended reds are the still-uncovered bands. Extend only the same policy registration/classification for each band, one row at a time, rerunning the focused test after each minimal change. The final test must enumerate exactly the three accepted band values from the authority; do not sample one band and infer the other two.

## Slice 3: existing dangling and wrong-kind behavior for every band

For each band, exercise the same public compiler/validator with two valid boundary fixtures:

1. `entity_id` names no project record: assert the current dangling diagnostic, severity, and blocking result.
2. `entity_id` names an existing selected non-ENTITY record: assert the current wrong-kind diagnostic, severity, and blocking result.

These preservation tests may pass immediately. If so, record a legitimate red-first skip: the behavior already exists and the new tests prove it for all named bands. Do not alter production code. If an existing assertion encodes the formerly optional unselected behavior, retain its failing command after the authorized policy change and update only that expectation; unrelated diagnostic changes are not authorized.

## Slice 4: clearing transitions on active fixtures

Use the public working-set/project update seams, not private policy helpers, to prove state transitions. Across the three bands, cover all of these operations (a compact table can pair one operation with each band, provided every band also has the full blocked-path matrix above):

- **Selecting:** start from the unselected blocker, select the referenced existing ENTITY, recompile, and assert that diagnostic disappears and valid prompt output becomes available.
- **Repointing:** start from a CAST MEMBER aimed at an unselected ENTITY, change `entity_id` to an already-selected ENTITY, recompile, and assert the blocker clears.
- **Correcting:** start from dangling or wrong-kind `entity_id`, correct it to a selected ENTITY, recompile, and assert the relevant blocker clears.

Assert the public result after each transition on the same active project/validator instance where the API is stateful. Ensure no unrelated blocker can make a nominal clearing test ambiguous. The minimal production change should remain the policy registration only; if clearing fails because validation state is cached, add the smallest invalidation correction through the existing mechanism and test that observable transition, without mutating the working set automatically.

## Slice 5: fail-closed UI/send path and provider boundary

Through the rendered compilation/send entry point, load a valid project with an unselected CAST MEMBER ENTITY reference. Assert:

- the existing blocker presentation is visible using the reused diagnostic shape;
- no prompt text/bytes are rendered;
- the raw identifier is absent from the rendered document;
- Send is disabled or otherwise gated through its public behavior; and
- attempting the normal send path cannot reach the provider.

Use a faithful fake only for the external provider boundary. Provider call count is supporting evidence for the `no provider call` obligation; the primary oracle is the blocked public UI/result and absence of prompt/raw-id output. Do not mock compiler, validator, store, or other owned collaborators. The expected first red is the UI remaining sendable or exposing prompt data for this newly blocking case. If the UI already gates all compiler blockers generically, this tracer may be green immediately and needs no production UI change.

After selecting the ENTITY through the normal UI/state seam, recompile and assert the blocker is gone and Send is re-enabled. A provider call is still unnecessary: proving enabled public state is sufficient and avoids an external request.

## Slice 6: unchanged posture of all other roles

Build a policy inventory from the active contract/registrations before editing. For every non-CAST-MEMBER-`entity_id` reference role, retain a focused existing test or add a table row proving its current required/optional behavior for an unselected target. This is an exhaustive preservation boundary, not a sample. Expected posture must come from the authority, not the implementation table being changed.

Also assert through public serialization/storage seams that compiling a blocked project does not rewrite `entity_id`, add the ENTITY to the working set, or alter stored records. These checks may be green from the outset; do not fabricate red or add migration code.

## Documentation and refactor boundary

Synchronizing the compiler contract and story-record schema is a required documentation change, not a software red. After behavior is green, update only the cast-reference rule in those two authorities so both say that selected CAST MEMBER `entity_id` must resolve to an ENTITY in the active working set in every cast band, and that failure uses the established required-but-unselected blocker. Record doc review or an existing documentation check as the verification; do not invent a source-string test unless the repository explicitly treats that wording as a source-level contract.

Refactor only while focused tests are green. The permitted boundary is consolidation of the three CAST MEMBER band entries into the existing declarative reference-policy structure if that removes duplication. Do not generalize all ENTITY references, change diagnostic construction, alter other role posture, modify stored schemas, or introduce compatibility aliases. Rerun all focused tests after refactoring.

## Verification and evidence ledger

For every vertical slice, retain:

- the exact focused command;
- the intended failing assertion and evidence that it failed for the missing behavior;
- the minimal policy change;
- the focused green result;
- explicit red-first skips for already-correct dangling, wrong-kind, clearing, gating, or preservation behavior.

Then run the relevant broader package tests and the canonical repository gates discovered in repository guidance. Completion requires the full three-band matrix, UI/send proof, exhaustive other-role preservation, the two synchronized docs, and all applicable checks green. Report any command that could not run and do not claim completion while an applicable check fails.

## Uncertainty to resolve before the first red

The historical task does not supply the literal band values, diagnostic fields, focused test commands, public compiler result type, UI entry point, or reference-role inventory. Inspect current repository guidance, the governing issue and contracts, registrations, fixtures, and existing tests to identify them before writing assertions. If the docs disagree with runtime registrations about any band or other role, stop for scope correction rather than choosing one silently. If the public compiler result cannot represent `no prompt bytes`, clarify the agreed observable seam before testing; do not substitute an internal helper or a UI-only snapshot for that contract.
