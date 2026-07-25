# Blind paired trial results — rev_301fd08e-0548-4b97-903c-67b9970967a1

Version mapping (concealed from executors; counterbalanced across trials):

| Run | Trial | Tree label seen by executor | Actual version |
|---|---|---|---|
| a | T1 sequence authoring | `skills-a` | candidate |
| b | T1 sequence authoring | `skills-b` | current |
| c | T2 inventory authoring | `skills-c` | current |
| d | T2 inventory authoring | `skills-d` | candidate |

Each executor received only the raw task, the body fixture, the evidence/authority notes, and the
validator command. No diagnosis, no intended repair, no statement that two versions exist.

## T1 — sequence authoring (reproduction case)

| Run | Version | Rounds with errors | Recovery route |
|---|---|---|---|
| a | candidate | 0 | read `review-evidence-contract.mjs` **before** the first validator run |
| b | current | 0 | read `review-evidence-contract.mjs` **before** the first validator run |

**Tied at 0 rounds.** Both executors front-loaded: each opened the shared contract module and
derived `validateSequenceSource`'s order and proof regexes before drafting, then wrote cells using
`observed`/`asserted`, which both versions accept. This reproduces the known front-loading effect
that collapses blind round-count as an instrument; it is not evidence against the candidate.

Run b, on the current version, additionally reported the accepted proof vocabulary it had to
extract from source: `observed|asserted|verified|proved|test|trace|evidence|artifact|log|browser|report|API`.

## T2 — source-inventory authoring (adjacent capability)

| Run | Version | Rounds with errors | Recovery route |
|---|---|---|---|
| c | current | 1 | did **not** read validator source; after the rejection had to `find` + grep `SKILL.md` / `implementation-closeout.md` to recover |
| d | candidate | 1 | did **not** read validator source; recovered the Spec-axis grammar **from the error message itself**, and grepped the docs only for the separator rule |

**Tied at 1 round; diagnosability differs.** Both first attempts failed for the same two reasons —
`;` instead of ` | ` separators and a prose-wrapped baseline instead of the literal `smell baseline`.
Run d reported unprompted that "the validator's own error text carried the full accepted grammar for
the Spec axis but not the separator, which is documented only in SKILL.md:51,55". Run c, on current,
had to leave the validator and search the skill documentation to recover the same grammar.

Final Spec inventories: run c produced `issue #370 comment 5052198448`; run d produced
`issue #370 comment ID 5052198448` — the form `SKILL.md:51` documents, which the current version
rejects and the candidate accepts.

**Recorded honestly:** neither first attempt happened to use the `comment ID` form, so the F7
reject→accept flip was proven by the deterministic matrix, not by a blind rejection.

## Observed friction the candidate deliberately does not address

Both T2 executors lost their single round to the Standards-axis rules, whose messages name no
accepted forms and whose ` | ` separator rule appears only in `SKILL.md`. That is real, blind-
confirmed friction on a surface outside this review's frozen candidate. Per the no-same-review-
expansion rule it is recorded here as a trial result and left for a later evidence cycle.
