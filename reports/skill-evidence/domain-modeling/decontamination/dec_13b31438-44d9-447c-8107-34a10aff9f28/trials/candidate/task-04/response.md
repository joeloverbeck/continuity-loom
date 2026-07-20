I would not add “custody receipt” to the root `CONTEXT.md`, and I would not create an ADR.

“Custody receipt” names a repository-local workflow handoff artifact, not a Continuity Loom application-domain or app-layer concept. Its schema and change history already have an authoritative home in the workflow package’s reference documentation; duplicating it in the application glossary would create a competing authority. No architectural trade-off or broader decision was made, so an ADR does not qualify either.

Proposed repository changes: none.

Domain model unchanged — no new app-layer terms, no ADR-worthy decisions.
