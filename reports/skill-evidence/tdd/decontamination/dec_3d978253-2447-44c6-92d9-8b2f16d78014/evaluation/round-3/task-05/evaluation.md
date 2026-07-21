# Blind paired evaluation: task 05

## Verdict

- **Preferred output:** A
- **Output A independent adequacy:** Fully adequate.
- **Output B independent adequacy:** Not fully adequate. It is strong on control, boundaries, and evidence retention, but it does not unambiguously require before-and-after scoring of all five required measures around the bounded promotion.
- **Severe regression or safety omission:** None in either output.
- **Material regression:** B has one material omission relative to A and the task: its protocol retains initial and promoted artifacts, but its scoring step can be read as scoring the two arms rather than scoring each arm both before and after promotion. That weakens the required change measurement at the center of the exercise.

## Rubric comparison

| Rubric requirement | Output A | Output B | Comparison |
| --- | --- | --- | --- |
| Correctly decides whether software TDD applies | Pass. It explicitly rejects software red-green-refactor because this is evidence-only work and identifies code-test red/green/refactor as inapplicable. | Pass. It explicitly rejects software red-green-refactor and explains why a fabricated failing test would not prove the contract comparison. | Tie. |
| Preserves the paired, controlled, cold comparison and one-variable design | Pass. It freezes dossier bytes, proves a contract-only packet diff, holds configuration and limits constant, uses isolated sessions, counterbalances order, blinds evaluators, and invalidates drifted pairs. | Pass. It freezes dossiers, both contracts, a mechanical contract-only diff, shared instructions and promotion, cold sessions, order, blinding, and invalidation for boundary violations. | A is somewhat more operationally explicit, but both satisfy the rubric. |
| Protects no-mutation/no-provider boundaries | Pass. It prohibits code, stored-record, skill, authority, provider, and product promotion changes; promotion is explicitly simulated on disposable copies with local deterministic inspection. | Pass. It prohibits product, provider, stored-data, and authority changes, uses frozen local artifacts, and invalidates a pair on a boundary violation. | Tie. |
| Keeps measurements distinct from interpretation and preserves exact disposition set | Pass. It defines the five measures separately, locks raw observations before interpretation, retains limitations/confounds, and requires one final line from exactly the three allowed dispositions. | Partial pass. It clearly separates literal observations from interpretation, records limitations, and preserves the closed disposition set, but does not clearly require pre- and post-promotion values for every required measure. | A wins materially on measurement completeness. |
| Gives a usable execution sequence and evidence-retention plan | Pass. The freeze, run, promote, score, compare, interpret, retain, and disposition sequence is executable, with a concrete packet structure and invalid-pair rule. | Pass. The manifest, per-dossier execution, evidence bundle, deviation handling, and bounded conclusion are executable. | A is more precise about paired deltas; both otherwise pass. |

## Task-constraint comparison

| Task constraint | Output A | Output B |
| --- | --- | --- |
| Hold dossier inputs and evaluation method constant; vary only the drafting contract | Pass: exact dossier hashes, a contract-only diff, a frozen codebook and promotion checklist, matched resources, and invalidation on drift. | Pass: frozen manifest, mechanical diff, common instructions, rubric, promotion, order, and tools. |
| No product mutation, provider request, stored-data change, or authority-doc change | Pass, including disposable promotion and provider-free local prompt inspection. | Pass, including explicit pre/post boundary verification and pair invalidation. |
| Measure all five outcomes before and after the same bounded promotion | Pass. It explicitly retains each metric's initial value, post-promotion value, within-arm change, and paired B-minus-A difference. | Material gap. Initial drafts and promoted artifacts are retained, but the instructions do not clearly score every metric at both stages; downstream utility is expressly measured only on the promoted artifact. |
| Separate observations from interpretation and record limitations/confounds | Pass, with raw immutable observations, post-lock interpretation, evaluator disagreement, deviations, and named confounds. | Pass, with literal observation fields, a separate interpretation section, scorer disagreement, deviations, and named confounds. |
| End with exactly one allowed disposition | Pass. The final line must be exactly one of the three allowed dispositions, expressed with a consistent `Disposition:` label and no hybrid. | Pass. The report must end with exactly one of the three verbatim dispositions and no co-recommendation. |
| Do not claim general product proof | Pass, stated explicitly more than once. | Pass, stated explicitly and carried into the disposition qualification. |

## Symmetric noninferiority

Noninferiority here means that the output has no material loss against the comparator on any task constraint or rubric bullet.

- **A relative to B: PASS.** A retains all of B's protections and adds an explicit pre/post/within-arm/paired measurement cadence.
- **B relative to A: FAIL.** B's ambiguous scoring cadence can produce a bundle that lacks the required before-and-after comparison for all five measures.

## Rationale for preference

A is preferred because it turns the central before/after promotion requirement into explicit retained fields and paired deltas. B is otherwise a strong controlled-study plan, and its omission is repairable by requiring initial and post-promotion scoring for every measure, but that requirement should not be left implicit in an execution-ready protocol.
