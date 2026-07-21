# Blind evaluation: task 05

## Output A

Output A correctly declines to force software red-green-refactor onto an evidence-only task. It preserves the important controls: frozen dossiers and arm contracts, a contract-only arm difference, matched drafting conditions, fresh contexts, blinding, counterbalancing, a common correction bound, immutable raw artifacts, visible deviations, invalidation when controls fail, bounded claims, and one closed-set disposition. It also names all five required measures and states that every metric must retain an initial value, a post-promotion value, and a within-arm change, followed by paired arm differences.

Its weakness is that the operational sequence does not fully cash out that blanket scoring requirement. The fixed downstream fixture is explicitly rendered only for the promoted result, so pre-promotion downstream prompt utility is not unambiguously measured. More importantly, it defines promotion as separately correcting each draft with a common checklist. That is a controlled correction procedure, but it is less clearly the same frozen promotion applied to the common dossier/input for both arms. The initial/post values for author correction cost are also left semantically ambiguous: the plan logs the one promotion intervention but does not say what the initial and post-promotion correction-cost observations each mean. Thus all five measures appear in the measurement section, but the run protocol does not explicitly generate all five observations at both stages.

This is a material methodology gap, not a severe safety failure. The non-mutation and no-provider boundaries are strong.

## Output B

Output B also correctly classifies the task as evidence-only and gives an execution-ready controlled comparison rather than invented code tests. It more clearly freezes one promotion packet per dossier and applies that same packet to both arms: each arm is run once on the frozen base dossier and once on that base plus the frozen promotion packet. Fresh contexts and otherwise held-constant conditions isolate the arm contract as the intended between-arm difference and the common promotion as the intended within-arm difference.

Crucially, it requires one record for every `dossier x arm x stage`, and each such record explicitly contains structural compliance, invention pressure, author correction cost, truthful readiness, and downstream prompt utility. It then requires A-before, A-after, A-change, B-before, B-after, B-change, both stage-wise arm differences, and the difference in changes for every metric. This is the clearest satisfaction of the requirement to score all five measures before and after the same promotion. It also preserves raw drafts, corrected copies, cited output locations, blinding and audit fields, observations/interpretation/limitations separation, failed-control handling, bounded claims, and a single allowed disposition.

The minor caveat is that each stage also has its own correction procedure, so implementers must keep stage-specific author correction distinct from the frozen dossier promotion. The text provides enough structure to do that and does not materially compromise the comparison. No material regression or severe safety omission is present.

## Comparison and verdict

**Preferred: B.** B turns the five-measure, two-stage requirement into explicit collection records and makes the shared frozen promotion the within-arm intervention. A is thoughtful and mostly compliant, but its operational steps leave pre-promotion downstream utility and before/after correction cost underspecified and can be read as promoting the drafts separately rather than applying one frozen promotion to the common input.

- **A noninferior to B:** No. A has a material evidence-collection ambiguity relative to B.
- **B noninferior to A:** Yes. B retains A's essential controls while making the decisive before/after measurements more explicit.
- **Severe regression or safety omission:** None in either output.
- **Material regression:** A's incomplete operationalization of all five measures at both stages; no material regression in B.
