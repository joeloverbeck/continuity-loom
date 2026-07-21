# Frozen paired-trial corpus

The five tasks below were frozen before the baseline skill was read for removal
opportunities. They exercise two common architecture-design uses, a state-integrity
branch, an adjacent composition-root case, and a regression case against premature
abstraction.

All repository inputs are pinned to commit
`5e6c9a18186aa468512da83656a490fb0bfca59f`. Each task's `inputs.md` records the
Git blob identities. Trial runners must use those bytes (the current worktree bytes
match at corpus-freeze time) and may inspect imports and directly related tests only
when needed to understand the listed input.

The trial wrapper may tell a runner which unlabeled skill snapshot to follow. The
raw user prompt, artifacts, and rubric must otherwise remain unchanged.
