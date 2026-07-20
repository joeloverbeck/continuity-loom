# Blind paired validation summary

Response identities were concealed from evaluators and alternated across tasks. Each evaluator received only the frozen prompt, input, rubric, tracker snapshot when applicable, and anonymous A/B outputs.

| Task | Coverage | Blind result after decoding | Materiality |
| --- | --- | --- | --- |
| 01 | Current Ash portfolio with existing owners and a retired route | Candidate wins | Baseline materially false-closed the retired route; candidate safely blocked it. |
| 02 | Current continuation and prior-ledger traversal | Tie | Neither materially inferior. |
| 03 | Cross-report semantic owner matching | Tie | Neither materially inferior. |
| 04 | Implicit-v1 two-PRD migration branch | Candidate wins | Baseline materially omitted the exact producer invocation. |
| 05 | Implicit-v1 continuation migration branch | Tie | Outputs identical. |
| 06 | Prepublication recommendation without approval | Candidate wins | Baseline materially widened four tickets to five by turning F010 into an issue. |
| 07 | Approved four-ticket publication simulation | Baseline wins | Candidate materially invented a new source-publication authorization gate, refused to stage the four approved bodies, and left the approved custody frontier blocked. |
| 08 | Unknown future contract version | Baseline wins | Candidate omitted the sole-producer identification, but was not materially inferior because it still failed closed. |

## Deterministic checks

- Baseline custody helper: 17/17 tests passed.
- Candidate custody helper: 17/17 tests passed.
- The first isolated test attempt for both variants failed equally because the producer snapshot's sibling `playtest` validator had not yet been copied into the harness. After adding that identical frozen dependency, both passed; this was a harness-layout correction, not a candidate edit.

## Noninferiority decision

Rejected. The candidate is measurably smaller and improved three tasks, but task 07 is a materially different core authorized-publication outcome. No severe or irreversible action occurred because the trial was analysis-only, yet the candidate cannot land unless it is noninferior on every core and safety-relevant task. The workflow permits no second competing candidate after a substantive validation failure, so the live target remains at the claimed baseline hash.
