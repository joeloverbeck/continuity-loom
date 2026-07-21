# Frozen paired-trial corpus

Run: `dec_e447a49e-4288-40de-b3ce-6f2c9ba0a148`

This corpus was frozen before the live target or baseline snapshot was read for
removal opportunities and before any candidate existed. The tasks are based on
historical architecture-review uses, with task-local dossiers substituted for
the original repositories. Audit findings, expected answers, and candidate
diagnoses are intentionally absent from the inputs.

Each task contains:

- `prompt.md`: the raw user request for the trial;
- `input.md`: repository, environment, or prior-turn artifacts available to the
  trial agent;
- `rubric.md`: observable comparison criteria for blind evaluation.

The seven tasks cover two materially different core scans, report opening and
browser-render branches, candidate verification, and two post-selection
grilling branches. `checks.mjs` verifies corpus and trial-output completeness.
