# CONTEXT.md Format

Use `CONTEXT.md` only for the project's domain or application language.

## Structure

```md
# {Context Name}

{One or two sentences describing the context.}

## Language

**Order**:
A request from a Customer for goods to be delivered.
_Avoid_: Purchase, transaction

**Customer**:
A person or organization that places Orders.
_Avoid_: Client, buyer, account
```

## Entry rules

- Pick one canonical term and put meaningful rejected synonyms under `_Avoid_`.
- Define what the concept is in one or two sentences; omit implementation detail.
- Include only domain or app-layer concepts. Exclude general programming concepts and project-specific process, tooling, document, flow, module, and code-structure names.
- Group terms only when natural clusters emerge.
- When an authoritative upstream domain glossary exists, name that authority and define only concepts introduced by this project's layer; do not restate upstream entries.

## Single and multiple contexts

Follow repository-specific routing first. Otherwise:

- A single-context repository uses root `CONTEXT.md`.
- A multi-context repository uses root `CONTEXT-MAP.md` to list each context's `CONTEXT.md` and the relationships between them.
- If neither file exists, create root `CONTEXT.md` lazily when the first term resolves.
- A repository declared multi-context still begins with root `CONTEXT.md` while it has zero or one actual contexts; create `CONTEXT-MAP.md` only when a second context exists.
- When several contexts exist, infer the relevant one from the topic and ask if it remains unclear.

A compact map has this shape:

```md
# Context Map

## Contexts

- [Ordering](./src/ordering/CONTEXT.md) — receives and tracks orders
- [Billing](./src/billing/CONTEXT.md) — requests and records payment

## Relationships

- **Ordering → Billing**: Ordering supplies accepted Orders for invoicing.
```
