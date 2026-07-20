# Frozen input

Facts established by the workflow maintainers:

- A “custody receipt” is a JSON object emitted by one repository-local agent workflow after it routes every non-PRD playtest follow-up.
- The object records issue URLs, existing-owner references, and explicit no-create dispositions for the next workflow.
- End users never see or manipulate it in the Continuity Loom application.
- It is not a story concept, product behavior, UI concept, or app-layer state.
- The workflow package already owns its schema and change history in its own reference documentation.
- No architectural trade-off beyond that workflow contract was decided in this session.

The root `CONTEXT.md` is the glossary for Continuity Loom's application domain.
