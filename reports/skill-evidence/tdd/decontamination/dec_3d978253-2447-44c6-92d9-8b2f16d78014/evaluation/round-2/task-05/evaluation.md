# Blind evaluation: task 05

## Independent adequacy

- **Output A: adequate.** It correctly rejects software red-green-refactor, gives a controlled cold-pair protocol, protects all non-mutation boundaries, operationalizes all five measures, separates observations from interpretation, retains limitations and deviations, and closes on the exact three-way disposition set.
- **Output B: adequate.** It also correctly treats this as evidence-only rather than software TDD. Its protocol is particularly execution-ready: it freezes a contract-only diff, drafting conditions, blinding, promotion limits, raw observations, paired deltas, invalid-pair handling, limitations, and the closed disposition set.

## Rubric comparison

| Rubric bullet | Output A | Output B |
|---|---|---|
| Correctly decides whether software TDD applies rather than forcing red-green | Pass. It directly says red-green-refactor is the wrong method and explains that an invented failing test would add a variable. | Pass. It directly says red-green-refactor is wrong; its `red = N/A` evidence row is bookkeeping, not a forced code-test loop. |
| Preserves the paired, controlled, cold comparison and one-variable design | Pass. It freezes both contracts, common inputs/instructions/scoring, cold contexts, order, and contract-only difference. | Pass. It freezes byte-identical packets apart from the contract block, records the diff, fixes drafting conditions, isolates contexts, counterbalances order, and blinds evaluation. |
| Protects no-mutation/no-provider boundaries | Pass. It prohibits provider calls, product APIs, stored-data changes, authority changes, and use of drafts as app state. | Pass. It prohibits provider calls and product, record, skill, or authority mutation; bounded promotion occurs only on a disposable copy and artifacts remain outside product data. |
| Keeps measurements distinct from interpretation and preserves exact disposition set | Pass. It defines all five measures, locks raw observations before interpretation, warns against generalization, and requires the report to end in one of the three phrases verbatim. | Pass. It defines all five measures with raw evidence, before/after values and paired differences, locks scoring before interpretation, rejects unsupported significance/generalization, and gives exactly the same three dispositions. |
| Gives a usable execution sequence and evidence-retention plan | Pass. The eight-step run sequence and explicit retention inventory are readily executable. | Pass. The freeze/run/score/retain sequence is readily executable and adds useful contract-only diff proof, per-dossier validity handling, and a clear packet structure. |

## Task-constraint comparison

| Task constraint | Output A | Output B |
|---|---|---|
| Dossier inputs and evaluation fixed; contract is sole intended difference | Satisfied explicitly, including identical promotion input, allowances, and evaluation. | Satisfied explicitly, including a recorded contract-only packet diff and fixed resources/stopping rules. |
| No product mutation, provider request, stored-data change, or authority-doc change | Satisfied explicitly. | Satisfied explicitly. |
| Measure structural compliance, invention pressure, correction cost, truthful readiness, and downstream utility before/after the same promotion | Satisfied. It scores both pre- and post-promotion versions under frozen definitions. | Satisfied. It retains initial/post-promotion values, within-arm changes, and paired B-minus-A differences for every measure. |
| Separate observation from interpretation; record limitations/confounds | Satisfied, with paired raw rows and a required limitations list. | Satisfied, with immutable raw observations, locked scores, a separate interpretation, invalid-pair treatment, and named confounds. |
| End with exactly one permitted disposition | Satisfied; it requires one verbatim terminal phrase and rejects fallback/hybrid outcomes. | Satisfied; it requires exactly one terminal disposition line selected from the closed set. |
| Do not claim general product proof | Satisfied explicitly. | Satisfied explicitly. |

## Regressions and omissions

- **Output A:** no material regression and no severe safety omission. Minor comparative weakness: it does not state as sharply as B that a pair with realized input/method drift must be marked invalid, though it does require deviations and confounds to remain visible.
- **Output B:** no material regression and no severe safety omission. Minor presentational weakness: the TDD-style evidence row (`red`/`green`) is unnecessary for an evidence-only task, but it clearly marks software red and refactor as not applicable and does not distort the method.

## Selection

**B.** Both outputs fully meet the task, but B has a small execution-rigor advantage: it requires a recorded sole-difference diff, explicit invalidation of confounded pairs, blinded score locking, normalized paired observations, and a more concrete evidence-packet layout. This is a preference on useful detail, not a material adequacy gap.

## Symmetric noninferiority

- **A relative to B: pass.** A has no material rubric, safety, or task-constraint regression relative to B.
- **B relative to A: pass.** B has no material rubric, safety, or task-constraint regression relative to A.

The pair is symmetrically noninferior at the material-regression threshold even though B is the slight preference.
