# Operational Execution

Load this reference for live local, tracker, remote, deployment, process, or dependency state.

## Establish and refresh

Before a write, capture the smallest identity that can prove what changed.

- For repository work, capture branch, HEAD, and full short status; separate pre-existing/user work from intended outputs.
- For tracker or remote work, capture exact issue, PR, label, ref, resource, or remote-file identity.
- When repository state supports an external action, capture both the repository baseline and the external target.

Refresh drift-prone facts before the verdict and again before acting when practical. Prefer exact projected reads over broad listings. If access prevents refresh, name the limitation and scope the recommendation to the verified snapshot.

## High-risk or outward-facing checkpoint

Before a destructive, hard-to-recover, shared-branch, publication, tracker, or other outward-facing mutation:

1. verify the intended starting state and any in-progress operation;
2. name the rollback or backup path;
3. enumerate the exact commands or edits, targets, and labels;
4. state the expected end state; and
5. obtain explicit confirmation.

An up-front request does not replace this visible checkpoint for high-risk or outward-facing writes.

## Verify and close

After acting, use the smallest truthful proof: status, graph, diff, test or health check, tracker readback, remote content, or process state.

Immediately before closeout, refresh the same identities captured at baseline. Compare initial and final state, explain any intervening movement, and verify the intended result against the refreshed state. “Worktree untouched” means this run made no repository change; it does not mean the worktree was clean or HEAD stayed fixed.

Report the exact resources changed and their readback. Keep unrelated worktree and external state untouched.
