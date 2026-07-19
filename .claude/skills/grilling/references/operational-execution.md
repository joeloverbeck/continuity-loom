# Operational Execution

Rules for operational, triage, dependency-maintenance, and delegated-execution grilling runs.

## Establish the baseline

Explore live facts first and resolve only decisions that materially affect the action.

For local file edits:

- capture `git branch --show-current`, `git rev-parse HEAD`, and an unscoped `git status --short` before the first write;
- distinguish pre-existing or user-owned artifacts from intended outputs; and
- keep unrelated worktree changes untouched.

For tracker, remote, or other external mutations:

- capture affected issue or PR numbers, labels, dependency lines, refs, or resource identifiers before the first write;
- re-read the affected state before the final summary; and
- state explicitly when the repo worktree is untouched.

When a repository supplies evidence or local staging for an external mutation, capture its branch,
HEAD, and full worktree status even when no repo write is planned. Preserve those exact baseline
values for comparison. `Worktree untouched` means the run made no repo change; it does not mean the
worktree was clean or remained at the same HEAD.

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

Immediately before the final summary, refresh the same identity fields captured at baseline. For a
repository, re-run branch, HEAD, and full worktree status. For remote or tracker mutations, re-read
the exact affected resources.

Compare the initial and final values, then include exactly one closeout receipt:

- `Baseline: unchanged - <identity and status proof>`; or
- `Baseline: moved - <old identity/status> -> <new identity/status>; reconciliation: <what was reread or reverified>`.

When the baseline moved, verify that current content still contains the intended edits and that
every source or workflow surface used after the earlier snapshot remains valid. Report the
corrected state rather than repeating the earlier snapshot. Never use `remains clean` to mean only
that the run made no repo edits when the initial status was dirty or the HEAD changed.
