# Scope and progress ledger

Use this before the first edit for PRD-, issue-, or issue-family work.

## Intake

1. Run `git status --short` and record unrelated changes. They remain user-owned unless the live scope explicitly adopts them.
2. Fetch each named item's exact live body, comments, state, and labels. For a PRD, discover candidate children/blockers across all states, then exact-read each candidate before classifying it.
3. Save one ordered body snapshot when later review or closeout needs a manifest:

```bash
node .claude/skills/implement/scripts/capture-github-issues.mjs <issue...> --output /tmp/implement-issues.json
```

Comments and mutable tracker state still require live exact reads.

4. Follow the repository's active authority map. If an item has `## Principles`, use the repository's domain guidance and named ADRs; do not assume a conventional principles path.
5. Preflight any criterion that depends on browser automation, credentials, network/service access, or a fresh-agent probe. If indispensable proof is unavailable, mark the criterion blocked before editing and ask whether the user wants a reduced implementation or handoff.

## Ledger

Keep one row per issue or explicit direct criterion:

| Work item | Dependencies/blockers | Exact acceptance and atoms | Authority/ADR | Proof seam | Artifact disposition | Status |
|---|---|---|---|---|---|---|
| #N / direct-C1 | ... | ... | ... / N/A | ... | archive/remain/N/A | planned / active / satisfied / blocked / not done |

Also record, when applicable:

- related items outside requested scope as closed, enabling, blocking, contextual, excluded, or unrelated;
- the owning module and rationale for a new helper, store/query function, persistence call, or cross-module entrypoint;
- every active spec, report, ticket, or requirements artifact named by the work and its final archival/active disposition;
- every atom and required proof surface behind composite acceptance terms.

A blocker outside scope becomes an enabling row only when the user did not exclude it and its own acceptance is implementable. Otherwise the dependent issue stays open. Do not choose among unresolved prerequisite designs.

## First-edit stop

Before editing, make the ledger visible and state: in-scope work, related-item classification, unrelated dirt, artifact disposition, ownership decisions, proof availability, and next exact action. A direct checklist may use criterion IDs rather than issue numbers; never invent tracker identity.

On resume, compare current `HEAD`, worktree, governing authority, ledger, and required proof processes/artifacts with the recorded frontier. Update drift before continuing; do not repeat completed discovery when the preserved inputs are still exact and current.
