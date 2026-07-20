# Frozen paired-trial corpus

Frozen for run `dec_b548511a-fdbc-46c4-94b2-6247ed5f5791` before semantic target analysis or candidate construction.

Each task is executed twice from the same prompt and immutable inputs: once with the hash-verified baseline snapshot and once with the isolated candidate. Performers receive only their assigned skill variant, `prompt.md`, and `input.md`. They must not read `rubric.md`, another trial output, evaluator notes, the live target, or the other variant.

All trials are analysis-only simulations. Performers must not access the network, mutate GitHub, edit repository files, create requested deliverables, or write outside their assigned output file. Git object reads at commit `557b9abb332de97b712abe129b5c09a7b4639e42` are the frozen input-artifact transport.

The seven tasks cover a common proposal grill, a materially different taxonomy decision, an externally visible publication boundary, delegated sequencing, premise-vs-evidence divergence, a PRD-readiness determination, and a recap-only regression case.

## Deterministic corpus checks

- Every task contains `prompt.md`, `input.md`, and `rubric.md`.
- Every Git-backed input resolves at the frozen commit.
- `CORPUS.sha256` covers every corpus file other than itself.
- Trial performers are prohibited from reading rubrics and cross-variant outputs.
