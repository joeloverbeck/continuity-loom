# Candidate measurements

Measured after the single pre-trial mechanical correction branch and before blind candidate trials.

| Surface | Baseline | Candidate | Delta |
|---|---:|---:|---:|
| Runtime Markdown words | 23,304 | 4,004 | -19,300 (-82.8%) |
| Runtime Markdown bytes | 171,573 | 30,367 | -141,206 (-82.3%) |
| Approximate Markdown tokens (bytes / 4) | 42,893 | 7,592 | -35,301 (-82.3%) |
| All Markdown and JavaScript words | 45,901 | 26,225 | -19,676 (-42.9%) |
| All Markdown and JavaScript bytes | 388,868 | 243,416 | -145,452 (-37.4%) |
| Executable non-test helpers | 7 | 7 | unchanged, byte-identical |
| Phase references named by the entrypoint | 6 | 6 | unchanged, now selected only for the active phase |
| Frozen core/safety trials | 7 | 7 | unchanged |

The candidate replaces repeated narrative gate restatements with a four-phase state machine and delegates exact syntax to the seven existing executable helpers. It preserves distinct phase owners for intake, implementation/browser proof, fixed-point review, tracker mutation, child-family ordering, and long/split closeout bodies. The only JavaScript changes are prose-conformance tests: legacy phrase locks were replaced with assertions over transferable invariants and the isolation-only adapter assertion was made harness-neutral.

Deterministic candidate check before trials: `node --test candidate/scripts/*.test.mjs` passed 78/78 tests. `git diff --no-index --check baseline candidate` emitted no whitespace errors (exit 1 reflected the expected content diff).
