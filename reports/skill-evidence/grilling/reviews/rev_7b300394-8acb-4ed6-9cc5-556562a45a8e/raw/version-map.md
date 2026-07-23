# Private version → sample map (NOT shown to executors or the blind evaluator)

Label A = CURRENT skill ("load"); Label B = CANDIDATE ("invoke … run the skill itself, not a file read").

| Sample | Trial | Version | Gov file |
|---|---|---|---|
| S01 | T1 reproduction (/domain-modeling ADR) | A | gov-intake-A |
| S02 | T1 | A | gov-intake-A |
| S03 | T1 | A | gov-intake-A |
| S04 | T1 | B | gov-intake-B |
| S05 | T1 | B | gov-intake-B |
| S06 | T1 | B | gov-intake-B |
| S07 | T2 adjacent (/codebase-design seam) | A | gov-intake-A |
| S08 | T2 | A | gov-intake-A |
| S09 | T2 | B | gov-intake-B |
| S10 | T2 | B | gov-intake-B |
| S11 | T3 no-skill regression | A | gov-intake-A |
| S12 | T3 | A | gov-intake-A |
| S13 | T3 | B | gov-intake-B |
| S14 | T3 | B | gov-intake-B |
| S15 | T4 recap (version-invariant text) | A-side | gov-recap |
| S16 | T4 | A-side | gov-recap |
| S17 | T4 | B-side | gov-recap |
| S18 | T4 | B-side | gov-recap |
| S19 | T5 read-only safety (/domain-modeling) | A | gov-readonly-A |
| S20 | T5 | A | gov-readonly-A |
| S21 | T5 | B | gov-readonly-B |
| S22 | T5 | B | gov-readonly-B |

Note: T4 governing text (recap-contracts + question-flow) is UNCHANGED by the candidate,
so S15–S18 are version-invariant; run as a pure regression spot-check of the recap contract.
