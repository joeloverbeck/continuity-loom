# Blind evaluation: task 06

## Independent adequacy

- **Output A: adequate.** It starts with the complete pure lifecycle/readiness matrix, identifies right-reason red failures and a minimal core green, then expands through compiler, repository transitions, server gates, freshness/recovery, web accessibility, docs, and canonical verification. It makes unknown public names and mechanisms explicit.
- **Output B: adequate.** It likewise begins at the pure seam with the full matrix, preserves contradictory data as saveable while readiness fails closed, proceeds in green vertical slices, covers all downstream consumers and recovery, and provides preservation canaries, commit boundaries, and focused-to-canonical verification.

## Rubric comparison

| Rubric bullet | Output A | Output B |
|---|---|---|
| Begins at pure deterministic lifecycle/readiness seam with failing matrix | Pass. Its first slice is the nine-row zero/one/multiple by missing/matching/contradictory matrix, plus immutability, exact-one-blocker, derived-context, and independent-check assertions. | Pass. Its first red is the same nine-row matrix with exact-one-blocker, non-mutation, derived-context, independent-check, and wrong-reason-red controls. |
| Expands through server and web only after core is green | Pass. It explicitly holds repository/server/web out of the first core slice and advances through ordered slices after focused green. | Pass. It commits the green core slice first, then takes persistence, transitions, server paths, recovery, and web one at a time. |
| Preserves draftability while proving fail-closed prompt/candidate/provider gates | Pass. Contradictory saves round-trip, while preview, compilation, intake, Generate, and provider send share one readiness result; assertions cover public blocked responses, no prompt/candidate state, and zero provider calls. | Pass. Save remains valid; compilation/preview return no prompt bytes, intake stores no candidate, Generate returns no prompt/candidate/provider result, and the provider fake receives zero calls. |
| Covers boundary transitions, explicit repair, fresh recompilation, and accepted-prose canaries | Pass. It covers zero-to-one, one-to-zero, two-to-one, stale `P1`, explicit save, new `P2`, symmetric repair, and accepted-prose exclusion before/after recovery. | Pass. It covers both mismatch-producing boundaries, the multiple-to-one canary, stale inspection, explicit save, new compilation, and accepted-prose exclusion after repair. |
| Defines sensible incremental commits/refactors and focused-to-canonical verification | Pass. It gives six coherent green commits, limits refactoring to green behavior-preserving consolidation, retains chronological red/green evidence, and ends with package plus four canonical gates and browser evidence. | Pass. It gives green vertical commits, narrowly bounds refactoring, retains exact red/green commands, and ends with relevant package tests plus the four canonical gates. |

## Task-constraint comparison

| Task constraint | Output A | Output B |
|---|---|---|
| Zero, one, and multiple accepted segments across missing, matching, and contradictory saved context | Satisfied by the complete matrix. | Satisfied by the complete matrix. |
| One named contradiction blocker; other checks use archive-derived required context | Satisfied. It asserts one stable blocker and composes an independent/context-sensitive blocker against the derived context. | Satisfied. It requires the authorized exact blocker once and ordinary blockers evaluated against the derived context. |
| Accept/delete may create mismatch but never rewrite saved brief | Satisfied for accept, delete-to-zero, and two-to-one, using public operations. | Satisfied for accept, delete-to-zero, and multiple-to-one, using public boundaries. |
| One readiness result gates preview, compilation, intake, Generate, and provider send; no prompt/candidate/call when blocked | Satisfied explicitly at all five seams, including the public result and absence of side effects rather than call count alone. | Satisfied explicitly across the downstream slices and reinforced by the preservation canary requiring every consumer to use the same outcome. |
| Explicit save plus fresh compilation restores behavior; stale inspected prompt is not current | Satisfied with an end-to-end `P1`/transition/block/save/`P2` sequence and symmetric delete repair. | Satisfied with an active-instance stale-inspection/save/new-compile sequence; it explicitly forbids resurrecting or relabeling the stale prompt. |
| Preserve accepted-prose exclusion, storage, schema compatibility, export, and provenance | Satisfied through compiler canaries, public round trips, older missing-field load, export, and provenance regression coverage. | Satisfied through dedicated preservation canaries covering prompt bytes, schema/repository round trips, export, and provenance across the lifecycle. |
| Cover core, server routes/repository boundaries, web accessibility/recovery, docs, and canonical gates | Satisfied across six slices and closeout. | Satisfied across the vertical slices, documentation obligations, commits, and final gates. |

## Regressions and omissions

- **Output A:** no material regression and no severe safety omission. Its provisional blocker name is explicitly labeled provisional and deferred to the repository's public convention, so it is responsible uncertainty rather than an invented contract. Its initial authority-inspection step is a prerequisite for execution, not an evasion of the requested first red.
- **Output B:** no material regression and no severe safety omission. Its conditional discussion of overlapping generation requests is extra scope that should only activate if the implementation actually permits overlap, as the output itself says; it does not displace any required slice. Compared with A, it is slightly less explicit about a single end-to-end public freshness identity and about per-route absence-of-side-effect assertions, but the necessary behavior is still covered.

## Selection

**A.** Both outputs fully satisfy the task. A has a small execution-evidence advantage: it more explicitly sequences compiler fail-closed coverage, tests all five shared-readiness consumers together, requires public-response plus no-state or no-call assertions, and gives a concrete stale-`P1` to fresh-`P2` recovery trace including the symmetric delete path. This is not a material adequacy difference.

## Symmetric noninferiority

- **A relative to B: pass.** A has no material rubric, safety, or task-constraint regression relative to B.
- **B relative to A: pass.** B has no material rubric, safety, or task-constraint regression relative to A.

The pair is symmetrically noninferior at the material-regression threshold even though A is the slight preference.
