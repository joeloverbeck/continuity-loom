# Checks

Inspected only the baseline snapshot and task-scoped evidence:

- `baseline/SKILL.md` and its directly relevant `baseline/DEEPENING.md` reference.
- Task `prompt.md`, `inputs.md`, and `rubric.md`.
- Frozen blobs for `packages/server/src/openrouter/client.ts`, `packages/server/src/openrouter/request.ts`, `docs/FOUNDATIONS.md`, and `AGENTS.md` at repository commit `5e6c9a18186aa468512da83656a490fb0bfca59f`.
- Directly related frozen imports/tests: `openrouter-client.test.ts`, `openrouter-request.test.ts`, `openrouter/errors.ts`, and `openrouter/models.ts`.

Rubric coverage:

- Makes the adapter decision contingent and recommends against extraction on current evidence.
- States the explicit two-justified-adapter threshold and concrete reversal evidence.
- Enumerates credential secrecy, abort, normalization, and request-shaping invariants.
- Gives falsifiable conditions under which the recommendation changes.
- Rejects speculative provider machinery, fetch-shaped pass-throughs, and compatibility aliases.
- Names the current two-interface test surface and requires zero test changes now; also bounds the replacement test surface if extraction becomes justified.

No source or target code was edited. No runtime tests were needed for this report-only trial.
