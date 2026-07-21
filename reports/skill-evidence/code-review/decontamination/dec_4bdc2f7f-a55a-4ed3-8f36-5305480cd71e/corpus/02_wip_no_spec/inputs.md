# Scenario facts

- User request: `Review since HEAD~2, including my uncommitted changes. There is no spec.`
- `HEAD~2` resolves to `3333333333333333333333333333333333333333`; reviewed `HEAD` is `4444444444444444444444444444444444444444`.
- The committed three-dot diff is non-empty. `git status --short` reports staged `packages/server/src/routes.ts`, unstaged `packages/web/src/App.tsx`, and untracked `notes.txt`.
- The user wants committed, staged, and unstaged tracked changes reviewed; `notes.txt` is explicitly excluded.
- Standards sources: `AGENTS.md` and `docs/FOUNDATIONS.md`.
- Delegation is permitted. Standards reviewer `standards-wip` completes with one hard finding: the staged server listen host is `0.0.0.0`, violating the localhost-only rule. It reports one possible judgement-call `Divergent Change` smell in `App.tsx`.
- The user confirmed there is no originating issue, PRD, or spec.

