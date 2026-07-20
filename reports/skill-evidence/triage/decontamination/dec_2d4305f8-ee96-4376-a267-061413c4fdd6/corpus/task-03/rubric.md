# Comparison rubric

- Routes the report to `needs-info`, not `ready-for-agent` or `wontfix`.
- Asks only for reproducibility facts that distinguish validation, local transport, and provider failures.
- Explicitly avoids requesting credentials, full prompts, prose, or full record payloads.
- Does not claim a live tracker read or mutation.

Deterministic check: `node ../checks.mjs task-03 <output-path>` from this directory's parent.
