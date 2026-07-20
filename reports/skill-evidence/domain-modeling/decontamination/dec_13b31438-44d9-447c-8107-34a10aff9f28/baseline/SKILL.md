---
name: domain-modeling
description: Build and sharpen a project's domain model. Use when the user wants to pin down domain terminology or a ubiquitous language, record an architectural decision, or when another skill needs to maintain the domain model.
---

# Domain Modeling

Actively build and sharpen the project's domain model as you design. This is the *active* discipline — challenging terms, inventing edge-case scenarios, and writing the glossary and decisions down the moment they crystallise. (Merely *reading* the relevant domain glossary for vocabulary is not this skill — that's a one-line habit any skill can do. This skill is for when you're changing the model, not just consuming it.)

## File structure

Resolve routing before any context or ADR read:

1. If `docs/agents/domain.md` exists, read and follow it first; it is the repo-specific routing rule for where contexts and ADRs live. The rules below are the default shape when no repo-local routing doc exists.
2. Probe each optional `CONTEXT.md`, `CONTEXT-MAP.md`, and ADR directory for existence without opening it.
3. Open only paths proven to exist. Treat absence as silent routing information; do not include optional paths in unconditional bulk-read or line-count commands, and do not surface a file-not-found error.

Before proposing or creating a context or ADR file, inspect the repository entrypoint and active-doc
map for any required registry or index updates. Name those paths in the same mutation checkpoint and
write them in the same change as the domain document.

Most repos have a single context:

```
/
├── CONTEXT.md
├── docs/
│   └── adr/
│       ├── 0001-event-sourced-orders.md
│       └── 0002-postgres-for-write-model.md
└── src/
```

If repo-local routing says the repo has multiple contexts, or a `CONTEXT-MAP.md` exists at the root, the map points to where each one lives:

```
/
├── CONTEXT-MAP.md
├── docs/
│   └── adr/                          ← system-wide decisions
├── src/
│   ├── ordering/
│   │   ├── CONTEXT.md
│   │   └── docs/adr/                 ← context-specific decisions
│   └── billing/
│       ├── CONTEXT.md
│       └── docs/adr/
```

Create files lazily — only when you have something to write. If no relevant context `CONTEXT.md` exists, create one when the first term is resolved. If no relevant `docs/adr/` exists, create it when the first ADR is needed.

If a repo is declared multi-context but has no `CONTEXT-MAP.md` and only zero or one actual context so far, use the root `CONTEXT.md` as the active context. Create `CONTEXT-MAP.md` only when a second context actually exists.

## During the session

### Challenge against the glossary

When the user uses a term that conflicts with the existing language in the relevant domain glossary, call it out immediately. "Your glossary defines 'cancellation' as X, but you seem to mean Y — which is it?"

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account' — do you mean the Customer or the User? Those are different things."

### Discuss concrete scenarios

When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.

### Cross-reference with code

When the user states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your code cancels entire Orders, but you just said partial cancellation is possible — which is right?"

### Challenge agent-authored material

When decisions are drafted without live user input (the user is away, or the session runs autonomously), the material carrying domain terms is your own — ledger lines, recaps, determinations. Apply the same glossary challenge and fuzzy-language sharpening to that material, checking it against the relevant domain glossary before presenting it.

### Update the relevant CONTEXT.md inline

When a term is resolved, update the relevant context's `CONTEXT.md` right there. Don't batch these up — capture them as they happen. Consult [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md) itself when adding or editing entries — the live file's existing entries are not the format authority and may have drifted. Two exceptions share one shape: when the glossary file's own existence or shape is still an open decision in the session, or when a session branch governing whether standing files change at all (for example, a driving skill's deliverable-depth question) is unresolved, hold resolved terms aside — listed as pending writes in the caller's recap where one exists — and write them in one pass once the open question resolves.

When the domain ships its own authoritative glossary, the relevant `CONTEXT.md` defers to it and holds only the terms this project's layer introduces — see the deference rule in [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md).

A `CONTEXT.md` file should be totally devoid of implementation details. Do not treat `CONTEXT.md` as a spec, a scratch pad, or a repository for implementation decisions. It is a glossary and nothing else. A term being unique to the project does not make it a glossary term: names for process artifacts, tooling, or code structure stay out even when project-specific (see the three-way test in [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md)).

Before writing, split terms from decisions. If the resolved wording names a domain or app-layer concept, put only the tight definition in `CONTEXT.md`. If the resolved wording records ownership, rejected alternatives, trade-offs, consequences, or implementation shape, put that material in an ADR, spec, issue, or design note instead.

### Offer ADRs sparingly

Only offer to create an ADR when all three are true:

1. **Hard to reverse** — the cost of changing your mind later is meaningful
2. **Surprising without context** — a future reader will wonder "why did they do it this way?"
3. **The result of a real trade-off** — there were genuine alternatives and you picked one for specific reasons

If any of the three is missing, skip the ADR. Use the format in [ADR-FORMAT.md](./ADR-FORMAT.md). When the decision amends an artifact that carries its own decision-record discipline (a methodology package's changelog, a standards spec's change process), record it there and do not offer a duplicate ADR — the domain's own record satisfies the test.

### Before the session closes

When this skill was invoked in a supporting role (e.g., by another skill) and no trigger fired, don't end silently:

1. Review the session's resolved decisions once and confirm none introduced a term owed to the relevant `CONTEXT.md`, sharpened or contradicted an existing entry's definition, or made a decision passing the three-part ADR test.
2. Choose exactly one result line based on the current decision state:
   - Settled facts and user-ratified decisions only: `Domain model unchanged — no new app-layer terms, no ADR-worthy decisions`.
   - Any provisional decision: `Domain model unchanged — contingent on ratification of the provisional decisions`.
3. If another skill is driving the session, include that line in the caller's recap or pre-deliverable checkpoint before documents, issues, code, or implementation begin.

Ratification without amendment resolves the contingency. A veto or amendment reopens the domain check and requires a refreshed result line before the next deliverable or mutation.

When this skill changes the domain model in a supporting role, make the caller's recap just as explicit: list the exact `CONTEXT.md` term changes and any ADRs created or offered, including paths when files were written.
