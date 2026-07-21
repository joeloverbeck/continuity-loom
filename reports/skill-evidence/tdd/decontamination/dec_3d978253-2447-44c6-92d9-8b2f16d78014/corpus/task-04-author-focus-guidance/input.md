# Historical task: Author Focus operator-bound guidance (#124)

Clarify optional Author focus at the Ideate entry point. Explain in author language that focus steers treatment inside already assigned response slots; it does not choose response kinds/operators, grounding, or active-working-set membership.

Constraints and acceptance criteria:

- Preserve request shape, prompt bytes, deterministic slot assignment, provider boundary, persistence exclusions, output contract, and candidate flow.
- Guidance is visible before focus entry and programmatically associated with the control.
- It identifies focus as temporary, non-canonical request context.
- Typing/changing/clearing focus uses the existing prompt-freshness path without changing slot assignment or grounding.
- Guidance interaction makes no provider call.
- Browser/component accessibility regression covers the relationship and interaction.
