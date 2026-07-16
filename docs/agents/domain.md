# Domain docs

Continuity Loom uses a single domain context across its core, server, and web packages.

## Before exploring, read these

- **`CONTEXT.md`** at the repository root
- Relevant architectural decisions under **`docs/adr/`**

If these files or directories do not exist, proceed silently. Do not suggest creating them upfront. The `domain-modeling` skill creates them lazily when domain terminology or architectural decisions are resolved.

## File structure

```text
/
├── CONTEXT.md
├── docs/
│   └── adr/
└── packages/
    ├── core/
    ├── server/
    └── web/
```

The package boundaries are implementation layers within one Continuity Loom domain, not separate domain contexts.

## Use the glossary's vocabulary

When output names a domain concept—in an issue title, refactor proposal, hypothesis, or test name—use the term defined in `CONTEXT.md`. Do not drift to synonyms that the glossary explicitly avoids.

If a needed concept is absent, reconsider whether the term belongs to the project or note the gap for `domain-modeling`.

## Flag ADR conflicts

If proposed work contradicts an existing ADR, surface the conflict explicitly rather than silently overriding it.
