# Frozen input

Starting state:

- The repository already has a small root `CONTEXT.md`, but none of its terms concern validators or parsing.
- `docs/adr/` exists and contains one unrelated accepted decision numbered 0001.

Resolved session facts:

- A report validator tried to parse a structured finding table.
- A valid Markdown divider variant did not match the parser's narrow pattern.
- The parser represented “could not parse” as an empty collection, and downstream validation treated that as “no findings and no errors.”
- The failure therefore looked like a clean pass.

Ratified decision:

- Any validator responsible for structured input must distinguish parse failure from valid empty input.
- Unparseable owned input must emit an error and fail closed; it must never become an empty-success result.
- This rule applies across repository validators, not only to the table parser that exposed it.

Rejected alternatives:

- Keep permissive parsing and rely on downstream consumers to catch missing data.
- Fix only the observed Markdown divider pattern.

Consequences accepted by the owner:

- Formatting drift or renamed structures can produce explicit failures.
- Individual validators may need parser-specific diagnostics.
- A clean empty result remains valid only after successful parsing.
