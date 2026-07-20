---
name: domain-modeling
description: Build and sharpen a project's domain model. Use when the user wants to pin down domain terminology or a ubiquitous language, record an architectural decision, or when another skill needs to maintain the domain model.
---

# Domain Modeling

Build the model actively: challenge and sharpen domain language, test boundaries, and record terms or durable decisions when they resolve. Merely consuming an existing glossary does not invoke this skill.

## Route the domain artifacts

1. If `docs/agents/domain.md` exists, read and follow it; it owns repository-specific context and ADR routing.
2. Check that optional `CONTEXT.md`, `CONTEXT-MAP.md`, and ADR paths exist before opening them. Treat absence silently and use the defaults in the format references.
3. Before writing, follow the repository entrypoint and active-doc registry for any required index updates; include those updates in the same change.

Create domain files lazily. Read [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md) before adding or editing a glossary entry, and read [ADR-FORMAT.md](./ADR-FORMAT.md) before offering or writing an ADR.

## Model during the session

- **Challenge the glossary.** Surface conflicts between the user's language and existing definitions.
- **Sharpen fuzzy terms.** Propose a precise canonical term when language is vague or overloaded.
- **Test concrete scenarios.** Probe edge cases that clarify relationships and boundaries.
- **Check reality.** Compare claims with code and governing documents; surface contradictions rather than recording them as fact.
- **Check agent-authored material too.** Apply the same scrutiny to autonomous recaps, ledgers, and determinations.

## Record resolved changes

When a term resolves, update the relevant `CONTEXT.md` inline using the format reference. If a caller's mutation boundary is still unresolved, retain the exact pending write for its checkpoint instead of editing early.

Separate terms from decisions before writing:

- Put only a domain or app-layer concept's tight definition in `CONTEXT.md`.
- Put ownership, alternatives, trade-offs, consequences, and implementation shape in the appropriate ADR, spec, issue, or design note.

For an architectural decision, apply `ADR-FORMAT.md`'s qualification and ownership rules. Skip an ADR when the decision does not qualify or an authoritative artifact already owns its decision record.

## Supporting-role closeout

When another skill invoked this one, review the session's current decisions once before closeout.

- Settled facts and user-ratified decisions with no domain change: `Domain model unchanged — no new app-layer terms, no ADR-worthy decisions`.
- Any provisional decision with no domain change: `Domain model unchanged — contingent on ratification of the provisional decisions`.
- A changed model: list the exact `CONTEXT.md` term changes and every ADR created or offered, including written paths.

Include the applicable result in the caller's recap or pre-deliverable checkpoint.
