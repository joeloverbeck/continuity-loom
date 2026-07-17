# Operational Execution

Rules for operational, triage, dependency-maintenance, and delegated-execution grilling runs.

## Establish the baseline

Explore live facts first and resolve only decisions that materially affect the action.

For local file edits:

- run `git status --short` before the first write;
- capture the current branch;
- distinguish pre-existing or user-owned artifacts from intended outputs; and
- keep unrelated worktree changes untouched.

For tracker, remote, or other external mutations:

- capture affected issue or PR numbers, labels, dependency lines, refs, or resource identifiers before the first write;
- re-read the affected state before the final summary; and
- state explicitly when the repo worktree is untouched.

For a versioned repo file committed directly on the remote, the local worktree checklist is N/A. Capture the pre-write path, blob SHA, and branch; state that the local worktree is untouched; and prove the end state with a remote read-back of committed content.

## Refresh drift-prone facts

Refresh drift-prone live facts before freezing the verdict whenever practical. Examples include Git refs, issue and PR state, CI, registries, deployments, and running processes.

Keep reads bounded. Prefer exact projected reads such as `gh issue view <n>` with a `--jq` projection over broad searches or all-state listings.

If permissions, network access, or tool limits block refresh, record the limitation in the evidence and scope the recommendation to the verified snapshot.

## High-risk checkpoint

Require a hard checkpoint before:

- ref rewrites or resets;
- branch deletion or force push;
- broad file deletion;
- irreversible migration;
- commands that can orphan or discard state;
- creating or editing issues or pull requests;
- merging into a shared or default branch;
- posting comments or changing labels;
- pushing branches; or
- committing or pushing to a default or protected branch.

Before acting:

1. verify the clean or intentionally dirty starting state;
2. check for in-progress operations when relevant;
3. create or name a rollback or backup path;
4. state the exact commands or outward-facing edits, targets, and labels;
5. state the expected end state; and
6. get explicit confirmation.

An up-front request grants general permission but does not replace this visible preflight enumeration for high-risk or outward-facing writes.

After acting, verify the result with the smallest truthful proof surface: status, graph, diff, health check, tracker read-back, remote content read-back, or command output.

## Operational closeout

Immediately before the final summary, refresh the relevant baseline again. For local file writes, re-run `git status --short` and `git branch --show-current`. For remote or tracker mutations, re-read the exact affected resources.

If the baseline moved during the session, verify that committed or current content still matches the intended edits and report the corrected state rather than repeating the earlier snapshot.
