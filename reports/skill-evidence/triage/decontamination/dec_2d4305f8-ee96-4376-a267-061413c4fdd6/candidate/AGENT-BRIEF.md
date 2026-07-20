# Writing Agent Briefs

An agent brief is the durable contract posted when an issue or PR moves to `ready-for-agent`. The original discussion remains context. For an issue, specify the change to build; for a PR, specify what remains to make the existing diff acceptable.

## Rules

- Describe behavior, interfaces, data/config shapes, and externally observable contracts—not an implementation recipe.
- Avoid file paths, line numbers, and assumptions about today's internal structure.
- State current and desired behavior, including relevant edge and failure cases.
- Give independently testable acceptance criteria.
- Name explicit out-of-scope boundaries.
- For a PR, distinguish what the diff already accomplishes from the remaining gaps, and preserve acceptable existing work.

## Template

```markdown
## Agent Brief

**Category:** bug / enhancement
**Summary:** one-line behavioral outcome

**Current behavior:**
What happens now. For a PR, describe the current diff and its verified gaps.

**Desired behavior:**
What must be observably true afterward, including edge/error behavior.

**Key interfaces:**
- Interface/type/config/command — contract that changes or must remain stable

**Acceptance criteria:**
- [ ] Independently verifiable outcome
- [ ] Regression or error-path outcome
- [ ] Applicable project checks pass

**Out of scope:**
- Adjacent behavior that must not change
- Tempting follow-on work not owned by this item
```

Use names for stable public or domain interfaces when known, but do not turn the brief into a file-by-file edit plan. Acceptance criteria must be sufficient for an AFK agent to determine completion without recovering product decisions from the discussion.
