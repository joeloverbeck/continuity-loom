# Blind paired evaluation: task 06

## Verdict

- **Preferred output:** A, narrowly.
- **Output A independent adequacy:** Fully adequate.
- **Output B independent adequacy:** Fully adequate.
- **Severe regression or safety omission:** None in either output.
- **Material regression:** None. B's placement of candidate-intake and generation-material gates in a proposed core-level assertion group is a seam-placement risk, but it later restores the required core-to-server delegation and does not amount to a material acceptance loss. A avoids the ambiguity by limiting the early core expansion to readiness and compilation, then testing candidate/provider behavior at the server boundary.

## Rubric comparison

| Rubric requirement | Output A | Output B | Comparison |
| --- | --- | --- | --- |
| Begins at the pure deterministic lifecycle/readiness seam with a failing matrix | Pass. Its first slice is a nine-row zero/one/multiple by missing/matching/contradictory public readiness matrix, including blocker composition and wrong-reason-red guidance. | Pass. It begins with the same complete nine-case public matrix, exactly-one blocker, archive-derived context, unrelated checks, and wrong-reason-red guidance. | Tie. |
| Expands through server and web only after core is green | Pass. It makes the core matrix green, then core compiler behavior, repository transitions, server gates, freshness, and finally rendered web recovery. | Pass. It requires core green before archive boundaries, server tracers, and then web tracers. Its extra suggestion of core-level candidate/generation assertions is a minor ownership ambiguity. | A is safer and more explicit about boundary ownership. |
| Preserves draftability while proving fail-closed prompt/candidate/provider gates | Pass. Contradictory values save and round-trip, while preview, compilation, candidate intake, Generate, and provider sending share one gate with public blocked responses and no prompt/candidate/provider side effects. | Pass. It proves contradictory saves remain allowed and requires the same shared readiness result, no prompt bytes, no candidate, zero provider calls, and public blocked results. | Tie. |
| Covers transitions, explicit repair, fresh recompilation, and accepted-prose canaries | Pass. It covers accept, delete, two-to-one, rejected/superseded candidates, symmetric repair paths, stale inspection identity, new compilation identity, and accepted-prose canaries. | Pass. It covers zero-to-one, one-to-zero, above-zero transitions, explicit repair, stale prompt invalidation, fresh compilation, and accepted-prose canaries. | A is more exhaustive, but both satisfy the rubric. |
| Defines sensible incremental commits/refactors and focused-to-canonical verification | Pass. It supplies six independently green commit boundaries, defers refactoring until green, records red/green commands, and runs focused, package, canonical, browser, export, and provenance checks. | Pass. It supplies four independently green commits, green-only local refactors, a per-slice ledger, and an ordered focused-to-package-to-canonical verification ladder. | Tie; B is slightly cleaner about per-slice refactoring, while A is more detailed about closeout evidence. |

## Task-constraint comparison

| Task constraint | Output A | Output B |
| --- | --- | --- |
| Cover zero, one, and multiple accepted segments for missing, matching, and contradictory values | Pass: all nine combinations are explicit. | Pass: all nine combinations are explicit. |
| Emit one named contradiction blocker while other checks use archive-derived context | Pass: exactly one provisionally named blocker, required/effective archive context, and an independent-blocker composition fixture. | Pass: exactly one symbolic stand-in pending discovery of the public name, archive-derived effective context, and an independent-blocker case. |
| Acceptance/deletion may create mismatch but never auto-mutate the brief | Pass: explicit accept, delete, and two-to-one public-operation tracers preserve saved values. | Pass: explicit zero-to-one, one-to-zero, and above-zero transition tests preserve saved values and prohibit auto-repair. |
| One shared readiness result gates preview, compilation, candidate intake, Generate, and provider send; blocked paths have no prompt/candidate/provider effect | Pass: each of the five seams has a focused public assertion, the same blocker payload, and side-effect absence checks. | Pass: all five are named across core/server slices, route delegation is shared, and prompt/candidate/provider absence accompanies the blocked response. |
| Explicit save plus fresh compilation restores behavior; stale prompt cannot remain current | Pass: it supplies a six-step revision/inspection sequence and the symmetric delete-to-zero recovery. | Pass: it tests explicit save, fresh compilation, stale-currentness invalidation, and only post-save compilation becoming current. |
| Preserve accepted prose exclusion, storage, schema, export, and provenance | Pass: accepted-prose canaries recur in compilation and recovery; repository compatibility, export, storage, schema, and provenance receive explicit regression coverage. | Pass: canaries and focused public characterization cover each preservation concern, with repetition at server verification. |
| Cover core, repository/server, web accessibility/recovery, docs, and canonical gates | Pass: each is a distinct slice or closeout row, including browser evidence and the four named canonical commands. | Pass: each is explicitly sequenced, including rendered accessibility behavior, documentation review, relevant packages, and repository canonical gates. |

## Prompt-specific execution requirements

| Required response element | Output A | Output B |
| --- | --- | --- |
| First failing tests/assertions | Pass: exact public assertions and expected behavioral failure are given for the core matrix, with subsequent red tracers ordered by slice. | Pass: the complete first matrix, intended behavioral failure, and subsequent ordered tracers are explicit. |
| Smallest production change | Pass: every slice names a narrow green change and explicitly excludes unrelated layers. | Pass: every slice names a narrow owner/delegation/invalidation/UI change. |
| Refactor boundary | Pass: no refactor while red; later consolidation is behavior-preserving and bounded. | Pass: refactoring occurs only after the relevant slice is green and is limited to duplication encountered in that slice. |
| Verification | Pass: focused red/green evidence, package suites, canonical commands, browser evidence, and final-tree preservation suites. | Pass: focused commands discovered from the repository, package suites, canonical gates, and a completion-reporting rule. |
| Explicit uncertainty | Pass: saved-field location, blocker vocabulary, freshness mechanism, routes, deletion semantics, and provenance authorities are named, and normalization is labeled an assumption. | Pass: API names, blocker identity, and normalization semantics are explicitly unresolved and must be obtained from public authorities rather than guessed. |

## Symmetric noninferiority

Noninferiority here means that the output has no material loss against the comparator on any task constraint or rubric bullet.

- **A relative to B: PASS.** A covers all of B's acceptance surface and gives more explicit server-gate, freshness, preservation, and closeout assertions.
- **B relative to A: PASS.** B is less granular and has a minor early seam-placement ambiguity, but it still preserves every required behavior, boundary, verification stage, and uncertainty guard.

## Rationale for preference

A is narrowly preferred for execution safety: it cleanly keeps the first production change in the pure readiness owner, treats compilation as the next core consumer, and defers candidate intake and provider behavior to explicit server-boundary tests. Its freshness sequence and per-gate side-effect assertions also reduce room for an implementation to pass on call counts while leaking prompt or candidate state. B remains independently execution-ready and noninferior at the material-requirement level.
