# ADR Format

Unless repository routing says otherwise, ADRs live in `docs/adr/` and use sequential names such as `0001-event-sourced-orders.md`. Create the directory lazily when the first ADR qualifies.

## Qualification

Create or offer an ADR only when all three are true:

1. **Hard to reverse** — changing the decision later has meaningful cost.
2. **Surprising without context** — a future reader will need to know why this path was chosen.
3. **A real trade-off** — genuine alternatives were considered and one was selected for reasons.

Do not duplicate a decision record owned by another authoritative artifact, such as a methodology changelog or standards-spec change process.

Typical ADR subjects include architectural shape, boundaries and ownership, integration patterns, lock-in-heavy technology choices, non-obvious constraints or deviations, and rejected alternatives worth preserving.

## Numbering and template

Scan the applicable ADR directory, increment its highest existing number, and use a concise slug.

```md
# {Short title of the decision}

{One to three sentences stating the context, decision, and why.}
```

An ADR can be one paragraph. Add optional sections only when they carry useful information:

- status frontmatter: `proposed | accepted | deprecated | superseded by ADR-NNNN`
- `## Considered Options` for rejected alternatives worth remembering
- `## Consequences` for non-obvious downstream effects
