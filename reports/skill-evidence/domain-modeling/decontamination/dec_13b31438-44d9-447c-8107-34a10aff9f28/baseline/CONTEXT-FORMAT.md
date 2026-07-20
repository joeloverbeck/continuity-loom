# CONTEXT.md Format

## Structure

```md
# {Context Name}

{One or two sentence description of what this context is and why it exists.}

## Language

**Order**:
{A one or two sentence description of the term}
_Avoid_: Purchase, transaction

**Invoice**:
A request for payment sent to a customer after delivery.
_Avoid_: Bill, payment request

**Customer**:
A person or organization that places orders.
_Avoid_: Client, buyer, account
```

## Rules

- **Be opinionated.** When multiple words exist for the same concept, pick the best one and list the others under `_Avoid_`.
- **Keep definitions tight.** One or two sentences max. Define what it IS, not what it does.
- **Only include terms specific to this project's context.** Two kinds of term are excluded even though the project uses them. *General programming concepts* (timeouts, error types, utility patterns) don't belong even when used extensively. Neither do *project-unique process, tooling, or code-structure names* — a docs or build artifact, a flow/module-structure name — because "unique to this project" is not the same as "domain term." Before adding a term, ask: does this name a **domain or app-layer concept**? Only then does it belong. (A repo's own ADR may explicitly rule a structural name out of the glossary — e.g. code-structure names like `store`/`core` staying out even though they are project-specific.)
- **Group terms under subheadings** when natural clusters emerge. If all terms belong to a single cohesive area, a flat list is fine.
- **Defer to an authoritative domain glossary when one exists.** When the domain ships its own glossary document (a methodology package, a standards spec), open `CONTEXT.md` with a deference rule naming it, and define only the terms this project's layer introduces on top — never restate or paraphrase upstream terms, or the two definitions will drift.

## Single vs multi-context repos

**Single context (most repos):** One `CONTEXT.md` at the repo root.

**Multiple contexts:** A `CONTEXT-MAP.md` at the repo root lists the contexts, where they live, and how they relate to each other:

```md
# Context Map

## Contexts

- [Ordering](./src/ordering/CONTEXT.md) — receives and tracks customer orders
- [Billing](./src/billing/CONTEXT.md) — generates invoices and processes payments
- [Fulfillment](./src/fulfillment/CONTEXT.md) — manages warehouse picking and shipping

## Relationships

- **Ordering → Fulfillment**: Ordering emits `OrderPlaced` events; Fulfillment consumes them to start picking
- **Fulfillment → Billing**: Fulfillment emits `ShipmentDispatched` events; Billing consumes them to generate invoices
- **Ordering ↔ Billing**: Shared types for `CustomerId` and `Money`
```

The skill infers which structure applies:

- If `CONTEXT-MAP.md` exists, read it to find contexts
- If only a root `CONTEXT.md` exists, single context
- If neither exists, create a root `CONTEXT.md` lazily when the first term is resolved
- A repo *declared* multi-context (e.g. in its agent docs) but with zero or one actual contexts still starts with a root `CONTEXT.md`; create `CONTEXT-MAP.md` only when a second context actually exists

When multiple contexts exist, infer which one the current topic relates to. If unclear, ask.