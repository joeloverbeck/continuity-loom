# Task 05 — pending source artifact

## Raw prompt
Break PRD #117 into issues. The issue body cites `reports/cast-member-draft-import-prd-prep.md`; in this scenario that file exists only as an untracked local file and is absent from `origin/main`. Recommend the truthful publication posture and stop before tracker mutation.

## Inputs

- `../inputs/issue-117.json`
- Scenario overlay supersedes the issue body's historical visibility claim: the cited report is local, untracked, and not visible at the publication ref.

## Success observations

The response must not describe the source as durable or reachable from the tracker. It should decide whether child bodies can stand alone, identify any required pending-file treatment, and make that artifact decision explicit in the checkpoint without inventing a commit or URL.

