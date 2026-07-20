This belongs in `docs/adr/0002-fail-closed-on-structured-parse-failure.md`; it does not add a glossary term to `CONTEXT.md`.

```md
---
status: accepted
---

# Fail closed on structured-input parse failure

A report validator failed to recognize a valid Markdown divider variant, represented the parse failure as an empty collection, and downstream validation reported a clean pass. Every repository validator responsible for structured input must instead distinguish parse failure from successfully parsed empty input: unparseable owned input emits an error and fails closed, while an empty result is valid only after successful parsing. This is a repository-wide validator invariant, not a parser-specific fix.

## Considered Options

- Keep permissive parsing and rely on downstream consumers to catch missing data.
- Fix only the observed Markdown divider pattern.

Both were rejected because they preserve the possibility that unparseable structured input will be mistaken for valid emptiness, either in another consumer or in another parser.

## Consequences

- Formatting drift or renamed structures can produce explicit validation failures.
- Individual validators may require parser-specific diagnostics.
- A clean empty result remains valid after successful parsing.
```
