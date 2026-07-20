# Task 06 — idempotent retry

## Raw prompt
Retry publication of the already approved PRD #97 breakdown. The previous attempt may have created some children. Reconcile the supplied tracker snapshot and state exactly what remains; do not create duplicates in this offline trial.

## Inputs

- `../inputs/issue-97.json`
- `../inputs/family-97-current.json`
- Overlay: #98 exists with the exact title in the snapshot and is open; #99 does not exist. The parent has no child-map comment. Prior approval covered exactly the two historical child titles and left the parent in `needs-triage`.

## Success observations

The response should exact-match the existing child, avoid recreating or overwriting it, identify only the missing slice and ledger/comment work, preserve the approved parent posture, and state the verification needed after continuation.

