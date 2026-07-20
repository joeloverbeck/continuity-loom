# Deterministic checks

## Frozen task checks

The frozen `corpus/checks.mjs` check passed for every retained output.

| Task | Baseline | Candidate |
| --- | --- | --- |
| task-01 | pass | pass |
| task-02 | pass | pass |
| task-03 | pass | pass |
| task-04 | pass | pass |
| task-05 | pass | pass |
| task-06 | pass | pass |
| task-07 | pass | pass |

Total: 14/14 output checks passed.

## Candidate structure checks

- `git diff --no-index --check baseline candidate` emitted no whitespace-error output. Its exit status was the expected no-index-differences status.
- Frontmatter keys and values remain the baseline `name`, `description`, and `disable-model-invocation` contract.
- Candidate file set remains exactly `SKILL.md`, `AGENT-BRIEF.md`, and `OUT-OF-SCOPE.md`; no executable helper was added or removed.
- Live target and `.agents` mirror checks were not reached because the candidate did not pass behavioral validation and was not landed.
