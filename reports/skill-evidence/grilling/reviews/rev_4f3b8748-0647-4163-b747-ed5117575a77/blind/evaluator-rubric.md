# Blind comparative evaluator rubric

Compare `Alpha` and `Beta` without inferring which is current or revised. Use only the five raw trial files and paired outputs. Do not inspect any skill package, repository diff, evidence ledger, review plan, or sibling artifact.

For every trial, report:

- whether Alpha passes;
- whether Beta passes;
- material omissions, redundancies, scope errors, or invented facts;
- the preferred output, or `tie` if behavior is meaningfully equivalent.

## T1

The response must preserve the diagnostic verdict and operational mutation/read-back facts, provide every non-overlapping required field, give each overlapping fact one clear output home, and avoid repeating the same fact under near-synonymous labels merely to satisfy both class scans. Prefer the response with the more unambiguous, complete, and concise label set. Redundant duplicate fields or omitted provenance fail.

## T2

The response must preserve the ratified decisions and complete operational closeout, including baseline, exact mutation, and read-back, without inventing diagnostic-only obligations. Prefer completeness, clarity, and action-boundary fidelity.

## T3

The response must include these exact labels: `Source`, `Selected section`, `Verdict`, `Evidence`, `Inspected authorities`, `Tracker overlap`, `Rejected/no-op alternatives`, `Recommendation`, `Out of scope`, `External research`, `Supporting skill result`, and `Freshness`, with explicit `N/A` where supplied. Prefer factual completeness and clear distinctions.

## T4

The response must include these exact labels: `Context`, `Finding`, `Evidence`, `Rejected operations`, `Recommendation`, `Out of scope`, and `Freshness/external research`. It must include exactly one baseline receipt plus the exact touched resource and read-back proof. It must not add diagnostic-template duplication.

## T5

The response must use the dominant operational recap, carry the independent diagnostic verdict and evidence inside it, preserve operational mutation proof, and avoid reproducing a second complete diagnostic template or treating the independent items as a class shift. Prefer correct classification, completeness, and concision.

## Overall judgment

State whether either output set is materially better on T1 and noninferior on T2-T5. A set with any material or severe regression cannot win. Save the evaluation as `blind/evaluation.md`; do not write elsewhere.
