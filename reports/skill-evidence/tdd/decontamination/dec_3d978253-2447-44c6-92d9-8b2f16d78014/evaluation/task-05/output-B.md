# TDD assessment for #126

Software red-green-refactor is not the right method for this task. The requested outcome is comparative evidence, not a change in observable software behavior. A failing code test would be invented evidence, and product code must not change. Under the supplied TDD guidance this is one `evidence-only` seam: red is `N/A`, green is the retained comparison packet, and refactoring is `N/A`.

## Non-mutation boundary

- Do not modify product code, the product's stored records, skill files, or authority documents.
- Do not call OpenRouter or any other provider. Use only permitted offline/cold drafting instances or human drafters.
- Do not promote either draft into the application. “Promotion” below is a simulation against a disposable copy of the bounded record and the fixed promotion checklist.
- Retain study artifacts in a dedicated evidence directory, separate from product data. The evidence directory may contain only the frozen protocol, blinded inputs and outputs, scoring sheets, comparison, and final disposition.
- Treat the supplied task contract as the authority for this exercise. Because this blind assessment may not inspect repository authorities, it makes no broader product-conformance claim.

Evidence row:

| Issue | Seam | Red | Green/evidence | Acceptance covered |
|---|---|---|---|---|
| #126 | evidence-only paired draft comparison | N/A; there is no software behavior change | frozen protocol, two blinded outputs per dossier, raw scoring sheets, promotion deltas, comparison, limitations, one disposition | identical bounded inputs and evaluation; contract-only intended difference; five measures before/after bounded promotion; observations separated from interpretation; no general-product claim |

## Freeze the protocol before drafting

1. Assign stable IDs to the bounded dossiers (`D01` ... `Dn`) and freeze their exact bytes. Record a content hash for each dossier. Do not add facts after either arm has started.
2. Create arm A from the current full-dossier contract and arm B from the required-core-plus-explicit-optional counterfactual. The packets must be byte-identical except for the contract block. Record a diff proving that this is the sole planned difference.
3. Freeze one scoring codebook and one bounded-promotion checklist for both arms. Define every metric before looking at outputs.
4. Freeze drafter/evaluator configuration: same model or human qualification, tools, time/token budget, temperature or equivalent drafting conditions, and stopping rule. No arm may receive clarification unavailable to the other.
5. Use fresh, isolated drafting contexts. A drafter sees one dossier and one arm contract, never the paired output or scores. Counterbalance A/B order across dossiers; record order and any accidental exposure as a confound. If identical drafter identity cannot be held constant, match assignments and record drafter identity as a limitation rather than pretending the contract was the only realized difference.
6. Blind evaluators to arm labels. Relabel drafts with random output IDs and keep the arm key outside the scoring packet until raw scoring is locked.

## Run each pair

For each dossier, execute this sequence independently for A and B:

1. Give the cold drafter only the frozen dossier, the arm-specific contract, and the common resource limit.
2. Capture the draft verbatim plus run metadata. Do not repair or normalize it before initial scoring.
3. Have the blinded evaluator score the initial draft with the frozen codebook.
4. Apply the same bounded-promotion procedure to a disposable copy: the same checklist, permitted edit types, maximum time, and maximum number of author interventions. Log each addition, deletion, rewrite, question, and elapsed minute. No product record is written.
5. Score the promoted result with the same codebook and render the same fixed downstream prompt fixture from it. This must be a local, deterministic rendering or a rubric-based inspection; it must not send a provider request.
6. Seal both outputs and scoring sheets before revealing the pair.

If an arm cannot complete promotion within the bound, record `not promotion-ready within bound`; do not silently grant it more corrections.

## Frozen measurements

Keep raw observation fields separate from evaluator explanations:

- **Structural compliance:** checklist results and counts of missing required-core items, malformed items, prohibited additions, and optional items incorrectly presented as required. Score against the arm's declared contract, and also report the common required-core checklist so that the arms remain comparable.
- **Invention pressure:** count dossier-unsupported factual assertions, unsupported optional-field fills, and qualifications converted into facts. Preserve the exact draft span and dossier lookup for every count; also report a rate per 1,000 draft words so verbosity does not hide the effect.
- **Author correction cost:** number of author questions, additions, deletions, and rewrites plus elapsed correction time required by the fixed promotion procedure. Do not collapse these into one opaque score.
- **Truthful readiness:** initial and post-promotion `ready` / `not ready` judgment, with every failed checklist item cited. Readiness means adequately supported by the dossier, not merely structurally complete.
- **Downstream prompt utility:** on the identical fixed downstream fixture, score availability of required, supported facts; actionable specificity; ambiguity; and propagation of unsupported facts. Preserve the rendered prompt excerpt or checklist evidence used for the score.

For every metric retain the initial value, post-promotion value, and within-arm change. Then compute the paired B-minus-A difference for each dossier. Report all dossier-level observations and a compact aggregate such as median and range; a small exercise must not be dressed up with unsupported significance claims.

## Analysis and retention

The comparison packet should contain:

1. `protocol`: frozen dossier IDs/hashes, the contract-only diff, codebook, promotion checklist, allocation/order, resource limits, and stop rules.
2. `raw-observations`: immutable drafts, promotion edit logs, rendered local fixtures, and blinded scoring sheets.
3. `paired-results`: one row per dossier and metric, including before, after, within-arm change, and B-minus-A difference.
4. `interpretation`: explanations written only after raw scores are locked.
5. `limitations-and-confounds`: dossier count and representativeness, drafter/evaluator variation, order effects, evaluator disagreement, any packet drift, and the fact that downstream utility was assessed without a provider call.
6. `disposition`: the decision and a direct pointer to the observations supporting it.

Use two evaluators where feasible and retain their independent scores plus adjudication; do not overwrite disagreement. Any protocol deviation stays visible. If the dossier bytes, evaluation method, promotion bound, or drafting conditions differ between arms, mark the affected pair invalid rather than attributing its difference to the contract.

This is bounded comparative evidence about these dossiers under this protocol. It is not general product proof.

After all valid pairs are scored, the report must end with one and only one line whose value is selected from this closed set (without adding a hybrid disposition):

`Disposition: retain current contract`

or

`Disposition: reopen the closed implementation issue`

or

`Disposition: promote a new product rule for separate approval`
