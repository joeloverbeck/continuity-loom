# Issue tracker: GitHub

Engineering-workflow issues and PRDs for this repo live as GitHub issues. Use the `gh` CLI for all tracker operations.

The repository-native `specs/` and `tickets/` workflow is retired; GitHub is the sole change-intake surface. `tickets/README.md` and `tickets/_TEMPLATE.md` remain only as historical format references.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply or remove labels**: `gh issue edit <number> --add-label "..."` or `--remove-label "..."`
- **Close an issue**: `gh issue close <number> --comment "..."`

Infer the repository from `git remote -v`; `gh` does this automatically when run inside the clone.

## Browser-visible guidance acceptance checklist

A PRD or implementation issue is checklist-gated when it changes browser-visible behavior, browser workflow or navigation, prompt preview or inspection, user-initiated external-model invocation, or candidate/accepted-output handling. Map every canonical item below to the PRD or issue section that specifies it, or record `N/A - <specific reason>` when its condition is outside the change's scope. An external dependency is not an N/A reason.

The markers and backticked item labels are machine-read by repository publication validators. Keep each canonical label unique and preserve this bullet form when editing the checklist.

<!-- browser-visible-guidance-checklist:start -->
- `entry point and availability`: where the user reaches the behavior and the conditions that enable, disable, or hide it.
- `user-visible states, actions, and outcomes`: the labels, controls, state transitions, and resulting user-visible state.
- `validation, warning, error, and recovery behavior`: blocker/warning distinctions, failures, confirmations, and recovery paths visible to the user.
- `prompt preview contents and freshness`: when prompt compilation or inspection is in scope, what is shown and how the UI prevents stale or mismatched prompt use.
- `user-initiated external LLM boundary`: when network generation or assistance is in scope, which action sends data and which paths make no provider call.
- `canon and prose boundary visibility`: when records, candidates, accepted prose, or assistance output are in scope, how the UI preserves their distinct authority roles.
- `persistence, migration, export, and provenance`: when stored data or accepted output is in scope, what persists, migrates, exports, and identifies its origin.
- `browser and accessibility regression scenario`: the highest applicable browser or component seam, including keyboard or accessible-name behavior when interaction changes.
<!-- browser-visible-guidance-checklist:end -->

Before applying `ready-for-agent`, verify every applicable item has a concrete home. An applicable but unhomed item keeps the issue at `needs-triage`; an item with a specific N/A reason does not.

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
