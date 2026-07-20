# Frozen paired-trial corpus

Frozen for run `dec_13b31438-44d9-447c-8107-34a10aff9f28` before candidate construction or removal analysis.

Each task is executed twice from the same prompt and immutable input: once with the hash-verified baseline snapshot and once with the isolated candidate. Performers receive only their assigned skill variant, `prompt.md`, and `input.md`. They must not read `rubric.md`, another trial output, evaluator notes, the live target, or the other variant.

All trials are analysis-only simulations. Performers must not access the network, modify the repository, or create the described durable artifacts. When the skill would write a file, the performer instead includes the exact proposed file contents or patch in its retained response.

The five tasks cover the common glossary path, the materially different ADR path, a safety-relevant authority conflict, an unusual process-artifact boundary, and the supporting-role no-change closeout most likely to disappear during simplification.

## Deterministic corpus checks

- Every task contains `prompt.md`, `input.md`, and `rubric.md`.
- No task discloses the decontamination diagnosis or expected winner.
- `CORPUS.sha256` covers every corpus file other than itself.
- Trial performers are prohibited from reading rubrics and cross-variant outputs.
