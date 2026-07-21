# Applicability

Software red-green-refactor is not the right method for this task. The requested output is controlled evidence, not changed software behavior. Inventing a failing software test would add a new variable and would not verify the comparison. Use the paired evidence protocol below and retain its controls exactly.

# Fixed comparison protocol

Before either drafting arm runs, freeze and identify:

- the bounded dossier and the bounded promotion applied to it;
- the current full-dossier contract;
- the required-core-plus-explicit-optional counterfactual;
- one scoring guide with operational definitions for every measure;
- the drafter and evaluator instructions; and
- the run order, cold-context procedure, and evidence template.

For each dossier, create two arms. Arm A receives the current contract and Arm B receives the counterfactual. Both arms receive byte-identical dossier content, the same drafting request, the same promotion input, the same time or turn allowance, and the same evaluation method. The contract text is the only intended difference. Run each arm in a fresh context with no exposure to the other arm's draft or scores. If there is more than one dossier, counterbalance or randomize arm order and retain that order; do not silently change the protocol in response to early results.

This remains offline evidence work. Do not call OpenRouter or another provider, write through product APIs, alter stored story data, change product or authority documents, or use a draft as application state. Evidence artifacts must stay outside product state.

# Execution sequence

1. Record stable identifiers or fingerprints for the dossier, promotion input, both contracts, scoring guide, and instructions. Record the planned arm order and evaluator assignment before drafting.
2. Run the cold Arm A draft. Preserve the unedited raw draft and a run log containing only protocol facts.
3. Reset to a genuinely cold context and run Arm B with the identical materials except for its contract. Preserve the same evidence.
4. Apply the same bounded promotion to each arm. Do not let observations from one arm influence the other's promotion. Preserve pre-promotion and post-promotion versions rather than overwriting them.
5. Score both versions of both arms with the frozen guide. Where practical, hide the arm identity from the evaluator. A second evaluator may be used only if both arms receive the same treatment and disagreement handling was predeclared.
6. Give each draft to an author under the same correction brief. Record correction actions without changing the scoring definitions.
7. Run the same fixed downstream-prompt-utility exercise against each promoted result without making a provider request. Preserve the exact downstream input and observed output or evaluator record.
8. Complete the observation tables before writing interpretation. Then write the interpretation, limitations, confounds, and final disposition.

# Measures

Define the measurement rules before the runs so the evaluator cannot move the goalposts:

- **Structural compliance:** required sections present, prohibited or misplaced material, required/optional distinctions honored, and count of repairable structural defects.
- **Invention pressure:** unsupported facts introduced, places where the contract appears to demand unavailable facts, and explicit uncertainty handled truthfully. Keep observed unsupported statements separate from a theory about why they appeared.
- **Author correction cost:** number and kind of author decisions and edits, elapsed effort if measured consistently, and the textual delta required to reach the same readiness bar.
- **Truthful readiness:** whether the draft's readiness claim agrees with the frozen evidence-based readiness rubric, including false-ready and false-not-ready outcomes.
- **Downstream prompt utility:** performance against the same predeclared utility questions, such as whether required information is findable, unambiguous, and usable without importing unsupported claims.

Report raw observations in paired rows, including denominators and any evaluator disagreement. Put causal explanations, preference judgments, and product implications in a separate interpretation section. Do not convert one exercise into a general product claim.

# Evidence retention and decision

Retain the frozen inputs, both contract variants, run-order record, cold-context attestations, raw drafts, promoted drafts, score sheets, correction logs, downstream utility records, and protocol deviations. The report must name sample-size, ordering, drafter/evaluator, scoring-subjectivity, and dossier-representativeness limitations, plus every observed protocol deviation.

Choose the terminal outcome only after the paired evidence is complete:

- use **retain current contract** when the counterfactual does not show a sufficiently clear benefit under the frozen measures, or its tradeoffs outweigh that benefit;
- use **reopen the closed implementation issue** only when the evidence shows the already-approved implementation contract was not actually satisfied; or
- use **promote a new product rule for separate approval** when the evidence supports changing the governing contract rather than repairing conformance to the existing one.

The completed report must end with exactly one of those three disposition phrases, selected verbatim, and no additional fallback or hybrid disposition.
