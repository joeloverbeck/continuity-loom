# Noninferiority decision

## Blinded paired results

| Task | Candidate blind label | Evaluator conclusion | Candidate result |
| --- | --- | --- | --- |
| T01 historical schema-v1 new story | A | both noninferior; A narrowly preferred | noninferior |
| T02 schema-v1 continuation | B | both noninferior; B preferred | noninferior |
| T03 ordinary schema-v2 new story | A | both noninferior; B narrowly preferred | noninferior |
| T04 continuation after implementation | B | both noninferior; tie | noninferior |
| T05 mixed no-create/routed custody | A | A noninferior to B; A preferred | noninferior |
| T06 third-run continuation | B | B noninferior to A; B preferred | noninferior |

No evaluator found a material or severe regression, loss of domain knowledge, unsafe mutation,
weakened ownership boundary, or missing source/strength coverage. The two one-sided conclusions both
favored the candidate. T03's first candidate attempt was excluded before producing a result after
incidental unrelated-prep search hits; the table uses the fresh replacement only.

## Deterministic checks

- Every baseline and candidate task retained a current-contract artifact and passing assigned plus
  frozen-current final validator output.
- Root independently installed the candidate into a fresh clone and ran the unchanged validator
  suite: 26/26 passed.
- Root independently revalidated all six final candidate artifacts in a fresh candidate clone. All
  passed. T02 and T04 initially failed only because the sequential audit had overwritten their
  frozen predecessor prep with another trial output; after restoring the corpus predecessor bytes,
  both passed, confirming the trial-isolation requirement rather than a candidate defect.
- The decontamination helper suite passed 12/12.
- Validator, validator tests, and agent metadata are byte-identical between baseline and candidate.

## Simplicity gate

The candidate removes 1,389 mandatory target-owned words (33.6%, approximately 1,847 tokens) while
retaining all five phases, four executable validation commands, exact artifact schemas, current ADR
version behavior, ticket packets, continuation ledgers, privacy/freshness gates, and final custody
closeout. This is meaningful simplification rather than a behavioral tie at equal complexity.

## Decision

Accepted. The candidate is noninferior on every core and safety-relevant trial, has no material or
severe regression, passes applicable deterministic checks, preserves unusual rules whose current
transferability is externally corroborated, and is measurably smaller and less repetitive.
