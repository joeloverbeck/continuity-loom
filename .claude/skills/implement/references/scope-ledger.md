# Scope and Progress Ledger

Read this before the first edit whenever implementation work is based on a PRD,
issue, issue range, or related tracker family.

## Resolve the Real Scope

Before editing code, identify the authoritative work items.

- Run `git status --short` before the first edit. Record unrelated dirty files in the ledger or progress note, leave them untouched, and do not edit or stage them unless they become in-scope.
- If the user names a PRD issue, fetch the PRD and also list related open child issues, blockers, and linked implementation tickets from the issue tracker.
- Treat the child issues as the implementation checklist unless the user explicitly says to implement only the parent PRD text.
- If the user names a set of issues, fetch each issue body and comments.
- For GitHub issue intake, use exact issue lookups with comments and structured fields, for example `gh issue view <n> --comments --json number,title,state,body,comments,labels,closed,closedAt,url`. For broad child or related-issue discovery, query compact fields first, then fetch exact bodies/comments only for the PRD and implementation issues that are in scope.
- As soon as a GitHub issue family or named issue set is confirmed, save one canonical ordered JSON snapshot of the exact issue bodies before building the ledger or acceptance manifest: `node .claude/skills/implement/scripts/capture-github-issues.mjs <issue...> --output /tmp/worldloom-issues.json`. Reuse that snapshot for the manifest, review, and closeout instead of concatenating several large `gh issue view` responses that may truncate. The helper preserves `number`, `title`, and `body`; fetch and inspect comments or other live fields separately with exact `gh issue view --comments --json ...` calls when they are authoritative.
- For GitHub PRD child discovery, search all issue states for explicit parent references, for example `gh issue list --state all --search "#<parent>" --json number,title,state,labels,url`, then exact-view each candidate body/comments to confirm whether it is a child, blocker, linked implementation ticket, or merely mentions the parent. Do not infer parent closeout readiness from search output alone.
- If any fetched PRD or issue has a `## Principles` section, treat that inline section as binding and read the domain-authority guidance selected by `docs/ACTIVE-DOCS.md` (in this repository, `docs/agents/domain.md`). Follow that guidance by reading `CONTEXT.md` and relevant `docs/adr/` entries when present, plus any principle or ADR documents named by the work item. Do not require `docs/principles/README.md` unless the active guidance points to it or the file exists.
- Build a progress ledger with one row per issue: issue number, title, dependencies/blockers, acceptance criteria, principles/ADR obligations or exceptions, planned evidence, test seams, and closeout state.
- Before adding or moving any helper, store/query function, persistence call, or cross-module entrypoint, record the seam, its owning module, the applicable principle/ADR or N/A, and why that placement is correct. Keep this decision visible until the implementation commit gate.
- When a parent PRD, child issue, implementation decision, glossary, or named contract defines a composite acceptance term, expand the ledger's acceptance entry into its required atoms and proof surfaces. For example, `provenance` may require `actor + timestamp + flow step` across `API + report + browser`; do not preserve only the umbrella noun.
- When the requested scope is a child issue, child issue range, or single implementation issue and related tracker items are discovered, classify every related item outside the requested scope before editing. For parent PRD closeout, list all related children, including any children beyond the requested scope; mark those children as already closed, enabling prerequisites, blocking, contextual/non-blocking backlog, intentionally excluded, or not actually related.
- If a related item outside the requested scope blocks an in-scope issue, promote it to an explicit enabling-prerequisite row in the ledger before editing. Implement and close that prerequisite only when its own acceptance criteria and conformance checks are satisfied and the user did not explicitly exclude it; otherwise leave the dependent issue or parent open and explain the blocker.
- Do not silently collapse multiple issues into a smaller "skeleton" or "first slice" when the user asked for the issues.
- If any acceptance criterion requires proof outside normal repo-local tests, preflight that proof mechanism before editing. This includes external services, cold LLM or fresh subagent probes, browser automation, credentials, network access, or nonlocal evidence. If the proof mechanism is unavailable, mark the affected row's closeout state `blocked`, quote the exact criterion, and ask whether to proceed with code-only partial implementation, reduced scope, or a field-test/handoff path. Do not let a missing external proof surface first at tracker closeout.

Use this compact ledger shape unless the issue set needs more detail:

When the work adds or moves an ownership-sensitive seam, include this line immediately before the table. Omit it only when the first-edit gate records ownership/placement as N/A:

`Ownership/placement decisions: <seam -> owning module; principle/ADR or N/A; placement reason>`

If related tracker items exist outside the requested scope, include this line immediately before the table. Omit zero-count categories, and omit the whole line when no true related items exist outside scope:

`Related tracker items outside requested scope: #N closed / #N enabling prerequisite / #N blocking / #N contextual non-blocking backlog / #N intentionally excluded / #N not actually related because ...`

| Issue | Blockers | Acceptance | Principles | Evidence | Test seam | Status | Closeout comment |
|---|---|---|---|---|---|---|---|
| #N | ... | ... | touched docs/ADRs or N/A | ... | ... | planned / in progress / satisfied / blocked / not done | ... |

Post the ledger to the conversation before the first edit. Update it when dependencies, blockers, evidence, or closeout state changes materially.

## First-Edit Gate

Do not edit until a visible ledger or progress note includes this line:

`Scope ledger posted: yes; no edits started; unrelated dirty files <listed/N/A>; in-scope issues <#...>; related tracker classification <done/N/A>; ownership/placement decisions <listed/N/A>.`

If the first useful user update is shorter than the full table, it must still name the in-scope issues, unrelated dirty files, whether related tracker classification is complete or N/A, and any ownership/placement decisions that are already known. Post or expand the full ledger before making the first code or docs edit.
