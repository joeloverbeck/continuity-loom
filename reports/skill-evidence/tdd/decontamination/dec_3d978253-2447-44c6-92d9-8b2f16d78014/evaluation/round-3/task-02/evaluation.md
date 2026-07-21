# Blind evaluation: task 02, round 3

## Independent adequacy

### Output A

Adequate and execution-ready. It begins with the missing unselected-reference behavior at the public core validation/compiler seam, requires a right-reason red, proposes a narrow reference-policy change that reuses the existing diagnostic, supplies a complete three-band by three-failure matrix with same-fixture recovery, protects prompt/send/provider behavior and other reference lanes, and places documentation after behavioral green.

### Output B

Adequate and execution-ready. It starts at the same narrow preflight seam with a deliberately valid unselected ENTITY fixture, isolates the intended missing blocker, limits production work to the data-driven reference descriptor, covers the full failure/recovery matrix and public gating behavior, and reserves contract synchronization and refactoring for after green.

## Rubric comparison

| Rubric bullet | Output A | Output B |
| --- | --- | --- |
| Chooses a narrow core-validation seam and begins with a failing unselected-reference test | Meets. Its first tracer calls the public core validation/compiler boundary and must fail only because the established required-but-unselected diagnostic is absent. | Meets. Its first slice calls the public validation/compiler preflight seam, proves fixture validity, and requires absence of the required-but-unselected blocker as the intended failure. |
| Builds a matrix covering three failure modes, three cast bands, and recovery without losing existing behavior | Meets. The explicit band matrix covers dangling, wrong-kind, and unselected cases in all three bands, then enumerates selecting, repointing, and correcting on the same active fixture. | Meets. The matrix applies all three initial states and their recovery actions to every canonical band and explicitly requires same-logical-record recovery plus unrelated-diagnostic preservation. |
| Explicitly protects other reference lanes and prompt/send gating | Meets. It adds a separate non-CAST reference-role matrix, suppresses prompt bytes/raw IDs for every blocked cell, gates the public send seam, and asserts zero provider calls. | Meets. It preserves representative required and optional non-CAST roles, suppresses prompt bytes/raw IDs for blocked cases, gates public send, and asserts zero provider calls. |
| Keeps docs synchronization after behavioral green rather than using docs as proof | Meets. Compiler-contract and story-record-schema edits occur only after behavioral green and are expressly not counted as test proof. | Meets. The same two documents are synchronized only after green, and document review is explicitly not behavioral proof. |
| Includes focused checks, regression checks, and canonical gates | Meets. It specifies focused validator/compiler, package, send/API, reference-regression, and doc checks, followed by all four canonical gates. | Meets. It specifies focused matrix, non-CAST, prompt-disclosure, send/provider, and non-mutation checks, followed by all four canonical gates. |

## Task-constraint comparison

| Task constraint | Output A | Output B |
| --- | --- | --- |
| Require selected CAST MEMBER `entity_id` references in all three bands | Limits the new policy to selected CAST MEMBER participation in each canonical band. | Registers CAST MEMBER `entity_id` at all canonical cast-band paths and does not generalize the rule. |
| Prove dangling, wrong-kind, and unselected paths for all three bands | Explicit three-by-three matrix, with exact diagnostic precedence and shapes. | Explicit matrix applied to every band, preserving the existing dangling and wrong-kind diagnostics. |
| Prove selecting, repointing, or correcting clears the relevant blocker | Exercises selecting for unselected, repointing for dangling, and correction/repointing for wrong-kind on the same fixture for each band. | Associates each failure with its recovery and requires same-record revalidation with only the relevant blocker cleared. |
| While blocked, reveal no prompt bytes/raw ID and keep send gated | Applies non-disclosure to every blocked matrix cell and adds public send gating plus zero provider calls. | Applies compile non-disclosure to each blocked cast-reference case and adds public send gating plus zero provider calls for the new unselected path. |
| Preserve every other reference role's required/optional posture | Requires a separate regression matrix over existing non-CAST lanes. | Requires preservation groups for representative required and optional non-CAST lanes and their diagnostic shapes. |
| No migration, stored-field change, working-set mutation, or provider call | Explicitly excludes each and verifies provider non-call; the send recovery reaches only the normal post-validation path. | Explicitly excludes each, verifies provider non-call while blocked, and reads state back to prove no mutation. |
| Synchronize compiler contract and story-record schema | Names both documents and the exact cast-specific fail-closed content to add after green. | Names both documents and the same fail-closed rule to add after green. |

## Regressions and omissions

- **Output A:** No material or severe regression. The additional `CONTEXT.md`/authority check is not demanded by the packet, but it is harmless process overhead. Its matrix and recovery requirements are complete, and its policy seam avoids both global requiredness and compiler special-casing.
- **Output B:** No material or severe regression. It asks for representative non-CAST required and optional reference roles rather than literally parameterizing every other lane as A does; paired with its explicit prohibition on altering other descriptors and the rubric's preservation requirement, this remains sufficient regression protection. Its public send tracer focuses on the newly added unselected case, while core prompt suppression covers all blocked modes; the already-blocking dangling and wrong-kind send behavior is not materially endangered by the narrow descriptor change.
- Neither output changes storage/schema, mutates selection, calls the provider while blocked, leaks identifiers, uses documentation as proof, or broadens required-selection policy beyond CAST MEMBER `entity_id`.

## Comparative determination

**Verdict: Tie.** Both outputs satisfy every rubric bullet and acceptance constraint at execution-ready depth. A is somewhat more exhaustive in spelling out every blocked-cell assertion and every non-CAST lane; B adds particularly strong explicit non-mutation readback and a concise descriptor-level implementation. The differences are complementary rather than outcome-changing.

**Symmetric noninferiority:** Output A is noninferior to Output B, and Output B is noninferior to Output A. Neither shows a material correctness, regression, security, privacy, or TDD-process deficit relative to the other.
