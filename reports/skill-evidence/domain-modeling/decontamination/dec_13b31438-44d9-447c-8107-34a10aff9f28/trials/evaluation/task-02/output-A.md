No `CONTEXT.md` terms change. The proposed durable decision record is `docs/adr/0002-fail-closed-on-structured-input-parse-failure.md`:

```md
---
status: accepted
---

# Fail closed on structured-input parse failure

A report validator exposed that a parser could represent unparseable structured input as an empty collection, allowing downstream validation to mistake failure for a clean pass. Repository validators that own structured input must distinguish parse failure from successfully parsed empty input: unparseable owned input must emit an error and fail closed, never become an empty-success result. This repository-wide rule prevents parser or format drift from being silently erased.

## Considered Options

- Keep permissive parsing and rely on downstream consumers to detect missing data.
- Fix only the observed Markdown divider pattern.

Both alternatives were rejected because they leave the underlying failure mode intact: a parse failure can still be converted into a clean validation result.

## Consequences

- Formatting drift or renamed structures can produce explicit failures.
- Individual validators may need parser-specific diagnostics.
- A clean empty result remains valid only after parsing succeeds.
```
