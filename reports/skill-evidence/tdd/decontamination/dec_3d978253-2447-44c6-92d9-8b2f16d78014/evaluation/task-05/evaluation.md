# Blind evaluation: task 05

## Independent adequacy

- **Output A:** Not fully adequate as an execution-ready protocol until one material ambiguity is corrected. It correctly rejects software red-green-refactor and otherwise supplies a strong controlled-comparison protocol, but its preference for “two independent cold drafters” is not paired with a requirement that each drafter execute both arms or that drafter assignment be crossed. Read literally alongside the singular A and B runs, drafter identity can vary with contract, so the drafting contract is no longer the only intended difference.
- **Output B:** Adequate. It correctly treats the work as evidence-only, preserves the one-variable comparison, makes the non-mutation boundaries explicit, separates observations from interpretation, retains the closed disposition set, and provides a usable execution and retention protocol.

## Rubric-by-rubric comparison

| Rubric item | Output A | Output B |
| --- | --- | --- |
| Correctly decides whether software TDD applies | Pass. It plainly says red-green-refactor does not apply and substitutes a preregistered cold A/B protocol. It does not invent a failing software test. | Pass. It plainly says red-green-refactor does not apply. Its `red: N/A` / `refactoring: N/A` evidence row is harmless bookkeeping rather than a forced software loop. |
| Preserves the paired, controlled, cold comparison and one-variable design | Partial. It freezes dossier bytes, contract-only packet differences, instructions, evaluation, promotion rules, and blinded fresh contexts. However, the unqualified preference for two independent drafters risks confounding arm with drafter identity. Merely recording identities and later calling the difference a confound does not preserve the intended one-variable design. | Pass. It freezes dossier bytes and the contract-only diff; holds configuration, tools, resources, stopping rule, scoring, and promotion constant; uses isolated contexts and blinded evaluation; counterbalances order; and explicitly treats unmatched drafter identity as a limitation rather than proof of a contract effect. |
| Protects no-mutation/no-provider boundaries | Pass. It forbids product, stored-data, authority-doc, provider, and network changes, and constrains simulated promotion and downstream evaluation to local evidence. | Pass. It forbids product, stored-record, authority, provider, and network changes; makes promotion disposable; and keeps artifacts in a separate evidence area. |
| Keeps measurements distinct from interpretation and preserves the exact disposition set | Pass. It defines all five requested measures, requires atomic observations before roll-ups, separates causal claims into interpretation, keeps disagreements visible, and requires exactly one of the three exact final disposition lines. | Pass. It defines pre/post and within-pair evidence for all five measures, retains spans/lookups and edit logs before aggregate claims, postpones interpretation until scores are locked, and preserves exactly the three allowed dispositions. |
| Gives a usable execution sequence and evidence-retention plan | Pass. The eight-step sequence is ordered and operational; the frozen packet, drafts, blind key, score sheets, edit logs, promoted drafts, metadata, deviations, confounds, and final report are all retained. | Pass. It provides an ordered freeze/run/score/promote/analyze workflow, invalid-pair handling, dossier-level comparisons, bounded aggregation, evaluator-disagreement retention, a deviations log, and a concrete packet layout. |

## Material or severe regressions and safety omissions

- **Output A:** One material methodological regression: its preferred drafter allocation can make drafter identity covary with contract. This does not create a product/provider safety breach, and all explicit no-mutation boundaries are present, but it weakens causal attribution enough that the protocol should not run as written. The fix is narrow: require the same drafter to perform both arms in isolated, randomized contexts, or cross multiple drafters over both arms so identity is balanced rather than arm-specific.
- **Output B:** No material or severe regression found. No product-mutation, provider-call, evidence-integrity, or disposition-set omission found.

## Selection

**B** is the fitter response. Both are strong on boundaries, measurement, and retention, but B is execution-ready without the arm/drafter confound that remains ambiguous in A. Its extra metric details remain relevant rather than obscuring the procedure.

## Noninferiority conclusion

Without assuming which output is the candidate: if **B** is the candidate, it is noninferior to A and is preferable on experimental control. If **A** is the candidate, noninferiority is not established because A contains the material drafter-allocation ambiguity described above.
