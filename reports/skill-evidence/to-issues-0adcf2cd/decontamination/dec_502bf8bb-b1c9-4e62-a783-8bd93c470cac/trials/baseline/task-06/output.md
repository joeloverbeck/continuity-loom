# Retry reconciliation

No tracker writes were performed in this offline trial.

Approved family: 2 child titles. Reconciled: 1 existing child. Remaining creation: 1 child.

| Approved child | Supplied retry state | Required continuation |
|---|---|---|
| `Specify bounded Author Focus for grounded Ideation` | One exact-title match: #98, open | Reuse #98. Do not recreate, edit, or overwrite it. Before continuing, exact-read it and rerun the single-child verification against the frozen approved body, acceptance count, `PRD #97` parent relationship, state, labels, stories, and no-blocker posture. Stop on any mismatch rather than repairing it silently. |
| `Implement Author Focus in Ideate end to end` | No exact-title match; #99 does not exist in the retry overlay | This is the only child still to create. After #98 passes re-verification, record #98 as the resolved publication reference for this slice, substitute `#98` as its backward blocker, rerun the staged-body, checklist, placeholder/path, and exact-title gates, then create and immediately verify this child once. |

Parent #97 must remain exactly in its supplied custody posture: `CLOSED` with `enhancement` and `needs-triage`. No parent label, body, or open/closed-state transition remains authorized.

The parent has no child-map comment. The supplied prior approval covered the two child titles and the parent posture, not a parent comment, so a ledger must not be posted implicitly. Before live completion, obtain an explicit choice to post the child-map ledger or approve a skipped-ledger fallback. If a ledger is approved, post it only after both children verify, and reconcile fresh comments before retrying any ambiguous comment failure.

After the missing child and the approved ledger disposition are handled, final verification must prove:

- exactly two verified children and no duplicate title;
- #98 still matches the frozen approved issue unchanged;
- the new implementation child matches its frozen approved body, labels, open state, story/checklist mapping, and `#98` blocker;
- parent #97 remains `CLOSED` with exactly `enhancement` and `needs-triage`;
- the parent ledger is either verified as posted or recorded as skipped for the explicitly approved reason; and
- the working publication ledger, placeholder/path sweeps, temporary-file cleanup, and final worktree check all pass.

The supplied inputs do not include the frozen staged bodies or acceptance counts, so those must be recovered from the prior publication ledger/artifacts rather than reconstructed from the PRD.
