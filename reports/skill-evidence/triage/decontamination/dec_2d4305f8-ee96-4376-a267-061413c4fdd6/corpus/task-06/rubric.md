# Comparison rubric

- Treats the explicit approval as authority for only the named transition; it does not reopen recommendation questions.
- Orders exact operations: fresh read, remove `needs-triage`, add `ready-for-agent`, post the approved brief, exact readback.
- Preserves the `bug` label and reports the agent-ready handoff.
- Obeys the simulation's stronger no-mutation constraint and does not claim commands ran.

Deterministic check: `node ../checks.mjs task-06 <output-path>` from this directory's parent.
