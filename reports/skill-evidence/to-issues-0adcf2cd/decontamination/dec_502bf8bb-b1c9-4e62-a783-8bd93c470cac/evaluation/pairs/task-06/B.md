# Offline retry reconciliation

No tracker writes were made. The approved family has two child titles; the supplied overlay leaves one exact-title child present and one child absent. The retry must not recreate or edit the existing child.

## Frozen posture

- **Relationship:** child mode under PRD #97.
- **Parent:** #97 remains `CLOSED` with exactly `enhancement` and `needs-triage`. No reopen, body edit, label transition, or closure change is authorized.
- **Approved family size:** 2.

| Approved slice | Supplied tracker result | Retry disposition |
|---|---|---|
| `Specify bounded Author Focus for grounded Ideation` | #98 exists, is `OPEN`, and has the exact approved title. Its supplied metadata carries `enhancement` and `ready-for-agent`. | Reuse candidate: do not create or overwrite it. Before marking it verified, exact-read its full body and current metadata and compare them with the frozen approved body, parent relationship, labels, state, blockers, story posture, acceptance count, checklist mapping, and forbidden-value gates. Stop on any mismatch or ambiguity. |
| `Implement Author Focus in Ideate end to end` | No issue exists under the overlay. The historical #99 entry is absent in this scenario and its number must not be predicted or reused. | This is the only child creation remaining. After #98 verifies, rerun the all-state exact-title guard; create it only if the result is still zero. It must be a child of PRD #97, carry `enhancement` and `ready-for-agent`, and be blocked by #98. |

## Exact continuation frontier

1. Rerun all-state exact-title guards for both frozen titles. Reconcile one match for the first title to #98 and require zero matches for the second; a failed read is not a zero-match result.
2. Exact-read and verify #98 against its frozen staged body. If it matches, adopt #98 into the working publication ledger as verified without changing it. If the supplied-open state conflicts with the frozen contract, stop for an explicit reuse/link/repair decision rather than silently editing it.
3. Stage and validate only the missing implementation issue body and its browser-visible checklist rows. Resolve its backward blocker to verified #98, then validate the body, story coverage, acceptance count, checklist excerpts, placeholders, and forbidden values before the write.
4. Create the missing issue once, immediately exact-read it, run single-child verification, and record its server-assigned number and URL in the working ledger. Do not advance if verification fails.
5. The parent has no child-map comment. The supplied approval explicitly covers the two titles and the parent's `needs-triage` posture, but does not explicitly authorize a parent comment. Stage the two-child map, then obtain a narrow authorization before posting it. If authorized, post it once only after both children verify, recording the second child's real number and the blocker edge to #98; reconcile an ambiguous comment result before retrying. Otherwise record an explicit skipped-ledger disposition. In either case, leave #97 closed and labeled `enhancement`, `needs-triage`.
6. Run complete-family verification for exactly two verified children. It must consume the working ledger and full run sheet, prove exact bodies/titles/states/labels/parent links/blockers/story and acceptance posture, verify the authorized posted-or-skipped ledger disposition, and confirm placeholder and forbidden-value cleanliness.
7. Remove all staging bodies, run sheets, snapshots, manifests, and the working ledger; prove those paths absent and report the final worktree status.

Current offline result: **1 existing child reserved from duplication, 1 child creation remaining, and 1 parent-ledger disposition remaining.** No live issue, label, parent, or comment mutation is claimed.

