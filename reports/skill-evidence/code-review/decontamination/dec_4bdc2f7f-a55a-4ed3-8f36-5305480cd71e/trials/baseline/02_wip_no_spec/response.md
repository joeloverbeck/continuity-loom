I would first pin and record the review frame, then dispatch only the Standards axis because the user has already confirmed that no spec exists.

Review frame: fixed point input `HEAD~2`; fixed point resolved SHA `3333333333333333333333333333333333333333`; reviewed HEAD SHA `4444444444444444444444444444444444444444`; committed diff command `git diff 3333333333333333333333333333333333333333...HEAD`; commit list captured with `git log 3333333333333333333333333333333333333333..HEAD --oneline`; worktree scope includes the committed three-dot diff, staged tracked changes from `git diff --cached`, and unstaged tracked changes from `git diff`; excluded dirty file `notes.txt` because the user explicitly excluded the untracked file.

Pre-dispatch Standards source inventory: `AGENTS.md` | `docs/FOUNDATIONS.md` | smell baseline

Pre-dispatch Spec source inventory: no spec available

The Standards reviewer `standards-wip` receives the resolved committed diff command and commit list, both WIP diff inputs, the exact Standards inventory, and the full smell baseline. The Spec reviewer is skipped. After collecting the Standards result, I would close `standards-wip` and record its completed status plus the actual cleanup disposition and proof rather than inventing a cleanup result.

## Standards

Initial finding count: 2. Worst severity: hard.

- Hard violation — staged `packages/server/src/routes.ts`: the listen host is `0.0.0.0`. This violates the localhost-only rule in `AGENTS.md` and `docs/FOUNDATIONS.md`, which requires server paths to bind only to `127.0.0.1`.
- Judgement call — possible **Divergent Change** in unstaged `packages/web/src/App.tsx`. This is a smell-baseline heuristic, not a hard violation; the changed module appears to be taking on more than one reason to change.

Handoff Standards source inventory: `AGENTS.md` | `docs/FOUNDATIONS.md` | smell baseline

## Spec

Initial finding count: 0. Worst severity: none.

The Spec axis was skipped because the user confirmed there is no originating issue, PRD, or spec. Disposition: no spec available.

Spec sequence coverage: sequence: N/A because there is no acceptance source to evaluate.

Handoff Spec source inventory: no spec available

Axis summary: Standards 2/hard (worst: server binds to `0.0.0.0`), Spec 0/none (no spec available).
