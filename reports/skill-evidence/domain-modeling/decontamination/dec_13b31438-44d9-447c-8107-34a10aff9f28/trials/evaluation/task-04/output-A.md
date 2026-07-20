I would not add “custody receipt” to `CONTEXT.md`. That glossary is for Continuity Loom’s application domain, while this term names a repository-local workflow artifact. Its importance and project-specific name do not make it an app-layer concept, and neither users nor application state interact with it. The workflow package’s reference documentation should remain the authority for its definition, schema, and change history.

No ADR is warranted: this session resolved no hard-to-reverse architectural trade-off, and the workflow package already owns the relevant contract and decision history.

Domain model unchanged — no new app-layer terms, no ADR-worthy decisions.

No repository patch is proposed.
