# TDD applicability and execution plan

Software red-green-refactor is not the right method for this task. The task changes no software behavior and explicitly asks for controlled evidence, so inventing a failing test would add an uncontrolled protocol that the comparison does not call for. The applicable part of the TDD skill is its evidence discipline: enumerate every obligation, preserve the supplied controls, measure every required outcome at every named stage, and retain a checkable ledger.

## Frozen comparison protocol

Before either arm runs, create and freeze the following offline inputs:

- the bounded dossier set;
- one bounded promotion packet for each dossier;
- the current full-dossier drafting contract (arm A);
- the required-core-plus-explicit-optional contract (arm B);
- one drafting-engine/version/configuration and one evaluator rubric;
- stage definitions, metric anchors, arm ordering, and the disposition rule.

For every dossier, run both arms at both stages:

1. **Before promotion:** the frozen base dossier only.
2. **After promotion:** that same base dossier plus its frozen promotion packet.

Each drafting run starts in a fresh context and receives only its stage's dossier and assigned contract. Hold the drafting engine, configuration, evaluator instructions, time/correction rules, and downstream-utility exercise constant. Counterbalance arm order across dossiers if there is more than one dossier, and do not let one arm's output or corrections enter the other arm. Score a copy of each raw draft; preserve the raw draft unchanged. This makes contract A versus B the only intended between-arm difference and the frozen promotion packet the only intended within-arm difference.

No step should write product or stored application data, call OpenRouter, amend an authority document, or mutate an implementation. Use an evidence workspace isolated from product state.

## Collection record

Create one record for every `dossier × arm × stage`. An artifact snapshot is supporting evidence, not a substitute for the scored stage. Every record must contain:

| Field group | Required fields |
| --- | --- |
| Identity and controls | dossier ID/version, arm, contract version/hash, stage, promotion-packet version/hash, run order, drafting engine/version/configuration, cold-context confirmation, evaluator/rubric version |
| Structural compliance | required slots applicable, required slots satisfied, required slots unsupported by evidence, optional slots attempted, malformed/contract-violating slots, anchored rubric score, cited output locations |
| Invention pressure | unsupported factual propositions, evidence-ambiguous propositions stated as fact, optional-field guesses, total flagged propositions, severity/rubric score, cited output locations |
| Author correction cost | correction rubric and stop rule, additions, deletions, substitutions, unsupported claims removed, fields reclassified as unknown/optional, elapsed correction time if the protocol permits timing, final correction-cost score |
| Truthful readiness | ready/not-ready verdict, evidence-supported completeness score, unsupported-content count at verdict, reasons, evaluator confidence |
| Downstream prompt utility | identical downstream task/rubric, usable-information coverage, irrelevant or misleading content, missing decision-relevant content, revision needed, utility score, cited output locations |
| Audit fields | raw draft reference, corrected-copy reference, evaluator ID/blinding status, deviations, confounds, contemporaneous observation notes |

Metric anchors and weights must be written before the first run. If timing is not reliable enough to compare, retain edit counts and the anchored correction score rather than silently replacing the measure. Apply the identical correction and downstream-utility procedures to both arms.

## Analysis

For each dossier and each metric, retain all of the following rather than only an aggregate:

- arm A before and after scores, plus `A change = A after - A before`;
- arm B before and after scores, plus `B change = B after - B before`;
- the paired A-versus-B difference at each stage;
- the descriptive difference in within-arm changes, `B change - A change`.

Preserve metric direction explicitly so that a positive change cannot ambiguously mean either improvement or harm. Report counts and individual dossier results alongside any summary. Do not turn this bounded exercise into a statistical or general product claim.

Use separate sections for:

1. **Observations:** raw outputs, rubric scores, corrections, paired differences, protocol deviations, and directly evidenced facts.
2. **Interpretation:** what those observations may suggest about the two contracts.
3. **Limitations/confounds:** dossier representativeness, evaluator subjectivity or imperfect blinding, order effects, drafting-engine variance, learning/carryover, metric sensitivity, and the limited number of bounded exercises.

Any protocol deviation stays visible; do not repair it by changing only one arm after seeing results. If a control fails materially, mark the affected pair unusable and rerun the entire pair under the frozen protocol or report it as a limitation.

## Disposition gate

The evidence report must end with a single `Disposition` field containing exactly one of the three allowed values, with no combined or provisional disposition:

- **retain current contract** when the counterfactual does not show a decision-relevant improvement without unacceptable regressions;
- **reopen the closed implementation issue** only when the evidence demonstrates failure against an already-approved contract that is within that closed issue's scope;
- **promote a new product rule for separate approval** when the evidence supports changing the governing contract rather than repairing conformance to an existing one.

The closed issue's approved scope must be available in the offline evidence packet before using the reopen option. No disposition can be chosen responsibly before the controlled records are collected and scored.
