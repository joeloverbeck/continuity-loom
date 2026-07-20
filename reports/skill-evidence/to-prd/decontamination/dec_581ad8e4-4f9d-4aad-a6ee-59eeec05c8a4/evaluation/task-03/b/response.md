The simulated two-PRD publication package is prepared in the ratified order; no GitHub or tracker writes were made.

- Simulated #1001: `PRD: User-Supplied Candidate Intake — Local Drafting and Provenance` — labels `enhancement`, `ready-for-agent`
- Simulated #1002: `PRD: Prompt-Facing Full Labels — Complete Deterministic Projection` — labels `bug`, `ready-for-agent`

The shared sequence comment names both exact issue identities, places #1001 first because it unblocks external trial prose, and states that the order is priority rather than technical dependency. Simulated readback verification passed for both issues with exactly one byte-identical comment apiece.

The isolated staged-body validator was run against both bodies with browser-checklist enforcement and explicit source allowlists. Both runs exited `2` before inspecting the bodies because the copied validator resolves its browser-checklist authority to the absent path `reports/skill-evidence/to-prd/docs/agents/issue-tracker.md`. I did not substitute the prohibited live skill, so the bodies are drafted but not validator-cleared; the exact commands and diagnostics are recorded in `checks.md`.
