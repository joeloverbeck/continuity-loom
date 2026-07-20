# Comparative validation summary

## Blind paired results

| Task | Candidate result | Adequate | Material regression | Safety regression |
|---|---|---:|---:|---:|
| 01 seam checkpoint | preferred over baseline | not fully under the literal no-label-before-checkpoint rubric; baseline was worse | no | no |
| 02 ratified single PRD | tie | yes | no | no |
| 03 multi-PRD sequence | tie | yes | no | no |
| 04 undurable-source synthesis | baseline preferred narrowly for detail | yes | no | no |
| 05 playtest custody | preferred over baseline | yes | no | no |
| 06 missing exact authority | baseline preferred narrowly for recap detail | yes | no | no |
| 07 duplicate publication | tie | yes | no | no |

Candidate comparison record: two wins, three ties, and two narrow detail losses.
No evaluator found a material or safety regression in the candidate. Task 01's
absolute shortfall is a mismatch between the frozen rubric's prohibition on
choosing a label posture and the target's demonstrated Step 2 rule to resolve
label posture before the combined checkpoint; the candidate nonetheless reduced
the premature commitment and was the preferred output. It is not a behavior lost
through simplification.

## Deterministic checks

- The baseline and candidate executable helpers and tests are byte-identical.
- Both live-path helper test files passed under Node's test runner.
- Candidate task 02 body validation passed with 13 conforming stories, all eight
  canonical checklist rows, both seam markers, approved durable sources, and no
  failures.
- Both candidate task 03 bodies passed; the simulated sequence comment verified
  exactly once for each of `#1001` and `#1002`.
- Candidate task 04 passed body validation, emitted only four approved durable
  sources, passed their `origin/main` durability ledgers, and contained no local
  prep/trial citation.
- Baseline task 04 also passed after resolving the unchanged helper's
  snapshot-relative checklist-authority path to the real repo authority.
  Baseline tasks 02 and 03 retained the raw snapshot-path infrastructure failure;
  that is not candidate-specific because the helper bytes are identical and the
  same live-path suite is green.

## Noninferiority decision

Accepted. The candidate is noninferior on all core and safety-relevant tasks,
introduces no material or severe regression, retains domain and ownership
boundaries, passes applicable deterministic checks, and reduces mandatory
runtime Markdown by 63.7 percent. The two narrow qualitative losses are extra
recap detail, not lost capability or safety.

Retained unusual rules have transferable justification:

- playtest custody prevents PRD publication from bypassing non-PRD issue custody
  and is protected by task 05;
- exact-title recovery and exactly-once program linking protect external tracker
  state and are protected by tasks 03 and 07;
- exact-byte authority refusal prevents invented constitutional text and is
  protected by task 06;
- staged and published durability protects tracker citations and is protected by
  task 04;
- the combined Step 2 receipt and label consequence preserve the skill's sole
  checkpoint contract.

