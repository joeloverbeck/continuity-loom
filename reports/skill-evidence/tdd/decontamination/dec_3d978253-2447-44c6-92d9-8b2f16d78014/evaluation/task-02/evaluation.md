# Blind evaluation: task 02

## Independent adequacy

- **Output A: adequate.** It begins at a narrow core-validation seam with the missing unselected-reference behavior, reuses the established diagnostic path, expands to all three bands and all three failure modes, covers recovery and non-CAST regressions, gates compilation/send, defers documentation until green, and includes focused and canonical checks.
- **Output B: adequate.** It provides the same essentials with a more explicit cross-product acceptance matrix, fixture-precondition checks, same-state recovery, blocked-output assertions, all-lane posture regression coverage, send/provider proof, post-green documentation, and canonical verification.

## Rubric coverage

| Rubric criterion | Output A | Output B |
| --- | --- | --- |
| Narrow core-validation seam; first red is unselected reference | Meets. Its first slice is one band at the public core validation/compilation seam, with an existing project ENTITY omitted from the working set. The intended failure is precisely the absent required-but-unselected diagnostic. | Meets. Its first tracer proves target kind/existence/selection preconditions and requires the missing required-but-unselected diagnostic at the public core seam before the narrow policy change. |
| Three failure modes x three cast bands x recovery | Meets. It specifies a table-driven matrix for dangling, wrong-kind, and unselected references, then requires selection, repointing, and correction transitions for every cast band. It preserves unrelated diagnostics to prevent false recovery proof. | Meets strongly. It states the full 3-by-3 matrix up front, retains mode-specific precedence, and requires same-fixture recovery for each action and band. |
| Protects other reference lanes and prompt/send gating | Meets. It adds optional- and required-lane regression cases, proves valid CAST references still compile, and adds an assembled blocked compiler/send case with no prompt bytes, no raw ID, send rejection, and zero provider calls. | Meets strongly. It calls for a regression matrix over every other existing reference lane and asserts no prompt bytes/raw IDs for every blocked matrix cell, plus send gating and zero provider calls at the public boundary. |
| Docs synchronized only after behavioral green | Meets. It explicitly defers compiler-contract and story-record-schema edits until all behavioral tests are green and rejects doc text as runtime proof. | Meets. Documentation is named as post-green synchronization evidence only, with exact cast-specific content and unchanged-storage/non-CAST boundaries. |
| Focused, regression, and canonical verification | Meets. It lists per-slice focused red/green, core validation, compiler, send/provider, broader package checks, final diff review, and all four canonical gates. | Meets. It lists identical-command red/green loops, focused validator/compiler, package, send/API, reference regressions, doc checks, and all four canonical gates. |

## Task-constraint coverage and omissions

Both outputs reuse the existing required-but-unselected diagnostic code/severity/message shape; preserve dangling and wrong-kind behavior; cover selecting, repointing, and correcting; prohibit working-set auto-mutation and provider calls while blocked; keep storage/schema shape unchanged; and synchronize both named documents only after runtime green.

Output A protects the non-CAST posture with representative existing optional and required lanes. That is adequate for the rubric, especially alongside its narrow policy seam and final diff review, but it is weaker than Output B's explicit instruction to parameterize over every existing non-CAST lane. Output A also proves no-prompt/send gating for a blocked cast reference as a separate tracer rather than attaching no-prompt assertions to every band/failure-mode cell. The requirement is still explicitly protected, but the evidence plan is less exhaustive.

Output B's `CONTEXT.md` preflight is extraneous to the frozen task, but it does not impede the red-green sequence or authorize any out-of-scope behavior. No material regression, unsafe behavior, or severe safety omission appears in either output.

## Selection and noninferiority

**Select B.** Both are independently adequate. B is materially clearer about the complete acceptance cross-product: every band and failure mode gets blocked-output protection, recovery uses the same active fixture, and every other reference lane gets posture regression coverage. Those additions reduce the chance of a locally green but incomplete implementation. Its small amount of extra preflight ceremony is outweighed by stronger boundary proof.

On this frozen task, **B is noninferior to A** and is the better fit. This conclusion follows from the contents of the two plans without assuming which version is the candidate.
