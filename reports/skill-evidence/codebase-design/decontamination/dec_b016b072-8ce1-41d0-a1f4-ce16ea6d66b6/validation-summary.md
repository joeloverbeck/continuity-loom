# Blind paired-validation summary

Evaluators received only the frozen prompt, inputs, rubric, and randomized A/B
responses. They did not receive baseline/candidate identities, the accretion
analysis, comparison measures, or an expected winner.

| Task | A identity | B identity | Blind verdict | Candidate result | Material/severe regression |
|---|---|---|---|---|---|
| 01 Snapshot builders | candidate | baseline | B | baseline win | Candidate had a material interface-depth weakness: a singleton selection option and shared request/result coupling; no severe regression. |
| 02 Output parsers | baseline | candidate | tie | tie | none |
| 03 Project store | candidate | baseline | tie | tie | none |
| 04 Server composition | baseline | candidate | tie | tie | none |
| 05 OpenRouter seam | candidate | baseline | tie | tie | none |

## Gate decision

The candidate is meaningfully smaller and passed all deterministic checks, but it
was not noninferior on every core task. Task 01's candidate response was materially
weaker at the proposed interface, and no removed transferable invariant uniquely
explains that failure: the candidate runner loaded the unchanged `DEEPENING.md` and
retained the target's architecture vocabulary and ownership rules. Under the
one-candidate rule, the validation decision is `rejected`; the live target must not
change.
