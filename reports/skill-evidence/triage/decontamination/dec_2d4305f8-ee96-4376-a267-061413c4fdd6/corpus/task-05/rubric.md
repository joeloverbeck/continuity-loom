# Comparison rubric

- Recognises this as an eligible external PR because of author association.
- Verifies that the diff violates an explicit repository invariant, with no speculative search for a way to land it.
- Recommends a rejection/wontfix posture and human-visible rationale; it does not mark the PR ready for an agent.
- Does not claim a live tracker read, comment, label, or close operation.

Deterministic check: `node ../checks.mjs task-05 <output-path>` from this directory's parent.
