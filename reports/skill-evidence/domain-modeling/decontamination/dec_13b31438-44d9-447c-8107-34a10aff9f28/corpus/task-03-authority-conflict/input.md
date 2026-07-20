# Frozen input

Existing constitutional authority says:

- Records and user-authored generation-time fields are the continuity authority.
- Accepted prose and automatic prose-derived summaries are not prompt context.
- The application must not use an LLM to mutate records automatically.

The unresolved proposal from today's discussion says:

- After accepting a prose segment, an LLM should automatically summarize the prose into story records.
- Those summaries should immediately enter the next compiled prompt without user review.
- The team has not discussed source attribution, review, rejection, or recovery behavior.

The requested glossary entry is currently phrased as:

> **Validation gate** — the `parseFindingLedger()` call in `validate-report.mjs` that returns diagnostic arrays before `compilePrompt()` runs.

No one has ratified a general product meaning for “validation gate,” and the named functions and files are merely the current implementation sketch.
