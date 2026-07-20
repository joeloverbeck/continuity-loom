# Task 04 — partial publication resume

## Raw prompt
Resume the approved PRD #117 issue publication after an interrupted session. Two issues were created before interruption. Finish only if the supplied state proves it is safe; otherwise present the changed checkpoint.

## Inputs

- `../inputs/issue-117.json`
- `../inputs/family-117-current.json` supplies the real family metadata used to construct the overlay.
- Overlay: only #118 and #119 exist; their exact titles match the first two slices in the current family snapshot. #120 and #121 do not exist. No child-map comment exists. Parent labels remain `enhancement` plus `needs-triage`.
- Prior approval covered the four-slice family and no parent label transition. The target branch and source artifacts have not changed.

## Success observations

The response should reconcile exact created state, preserve the original dependency ordering, avoid duplicates, distinguish remaining authorized writes from any newly discovered delta, and either stage the safe continuation or present only the changed checkpoint. It must not infer authorization for a parent transition.

