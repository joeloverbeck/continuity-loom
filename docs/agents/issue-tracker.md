# Issue tracker: GitHub

Engineering-workflow issues and PRDs for this repo live as GitHub issues. Use the `gh` CLI for all tracker operations.

Existing repository-native implementation tickets under `tickets/` remain governed by `tickets/README.md`.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply or remove labels**: `gh issue edit <number> --add-label "..."` or `--remove-label "..."`
- **Close an issue**: `gh issue close <number> --comment "..."`

Infer the repository from `git remote -v`; `gh` does this automatically when run inside the clone.

## Pull requests as a triage surface

**PRs as a request surface: yes.**

External pull requests run through the same labels and states as issues. Collaborators' in-flight pull requests are excluded.

- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>`
- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments`, then keep only `authorAssociation` values of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE`
- **Comment, label, or close**: use `gh pr comment`, `gh pr edit --add-label` or `--remove-label`, and `gh pr close`

GitHub shares one number space across issues and pull requests. Resolve an ambiguous reference such as `#42` with `gh pr view 42`, falling back to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Read the corresponding GitHub issue with `gh issue view <number> --comments`.
