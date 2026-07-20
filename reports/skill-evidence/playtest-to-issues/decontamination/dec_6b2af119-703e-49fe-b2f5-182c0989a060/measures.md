# Baseline and candidate measures

The normal-path runtime measure includes `SKILL.md` plus the custody contract, which every complete custody run must load. Shared `to-issues` instructions are mandatory in both versions and therefore do not affect the delta; its publication protocol remains approval-only in both.

| Measure | Baseline | Candidate | Change |
| --- | ---: | ---: | ---: |
| Runtime instruction words | 2,641 | 1,468 | -1,173 (-44.4%) |
| Approximate runtime tokens (words x 4/3) | 3,521 | 1,957 | -1,564 (-44.4%) |
| Runtime instruction bytes | 19,494 | 11,214 | -8,280 (-42.5%) |
| Runtime instruction lines | 379 | 220 | -159 (-42.0%) |
| Numbered workflow steps | 6 | 5 | -1 |
| Mandatory normal-path references | 2 | 2 | unchanged |
| Approval-only publication references | 1 | 1 | unchanged |
| Material intake, custody, approval, publication, and closeout gates | 12 | 12 | unchanged |
| Retired `skill-audit` route occurrences in target runtime/reference/tests | 5 | 0 | -5 |
| Repeated completion/self-audit paragraphs | 5 | 0 | -5 |
| Executable helpers | 1 | 1 | unchanged |
| Helper tests | 17 | 17 | unchanged; both pass |

The candidate changed `SKILL.md`, `references/custody-contract.md`, and stale fixture wording in `scripts/custody-ledger.test.mjs`. It added or removed no executable helper and changed no helper behavior.
