---
name: playtest-to-issues
description: Take custody of a validated playtest PRD-prep portfolio before PRD publication by resolving every non-PRD follow-up to a verified issue, existing owner, routed workflow, or explicit no-create disposition, then returning only the unconsumed PRD queue. Use after playtest-prd-prep produces a *-prd-prep.md report, when asked to create that report's individual issues, or when to-prd detects a playtest prep without a current custody receipt.
---

# Playtest To Issues

Own the handoff between `playtest-prd-prep` and `/to-prd`. Every row in
`## Non-PRD Follow-Up` remains in custody until it has a verified owner or an explicit,
evidence-backed disposition. Do not draft or publish a PRD.

## 1. Freeze the portfolio

Require one exact `reports/*-prd-prep.md` path; reject source reports and ambiguous globs. Run:

```bash
node .claude/skills/playtest-to-issues/scripts/custody-ledger.mjs intake <prep-artifact>
```

Use the returned source report, prep hash, contract diagnostics, first action, publication package,
non-PRD rows, ticket packets, and PRD candidates as the complete inventory. Only `current` and
`legacy-compatible` pass. For `migration-required`, stop and surface the exact producer
invocation returned by intake. `invalid` also stops custody. Never repair, reinterpret, or migrate
the prep here; only `$playtest-prd-prep` may rewrite its same-stem artifact.

Capture branch, HEAD, publication ref, and
`git status --short --untracked-files=all`. Read `AGENTS.md`, `docs/ACTIVE-DOCS.md`,
`docs/FOUNDATIONS.md`, the tracker/label docs, and the active authorities for affected surfaces.
Classify the source report, each linked repo-relative evidence dependency, and the prep artifact
separately for worktree and publication-ref durability.

## 2. Resolve custody

For every non-PRD row, read its matching disposition and authority-map evidence. For a current
`ticket - <name>` destination, also read the named ticket packet; for a legacy-compatible artifact,
record any missing modern packet fields as an intake limitation. Refresh code/test evidence and
search open and relevant closed tracker work using source IDs, scoped terms, and exact-title guards.
Fetch likely owners by number; an empty or failed read never proves that no owner exists.

Assign exactly one disposition:

- `published`: an approved new issue was created and exact-read;
- `existing-owner`: an exact-read issue owns the complete live work;
- `routed`: a current non-tracker workflow owns the row;
- `no-create`: current evidence proves it covered, rejected, superseded, or unnecessary; or
- `blocked`: evidence, durability, tracker access, route validity, or a user decision prevents
  truthful custody.

Treat the producer destination and current evidence as proposals, not automatic publication.
Bounded ticket, coverage, doc-correction, and verification work may become issues when still live
and actionable. Verification work need not carry a false `bug` or `enhancement` label. Never
reopen, relabel, comment on, or close an existing issue without approval for that mutation.

Read the [custody ledger contract](references/custody-contract.md) before creating the temporary
ledger. Keep one entry per source row in source order. A grouped owner is valid only when its body
and acceptance proof name every grouped row. The contract owns route validation, ledger fields,
blocked custody, and receipt rendering.

For every PRD candidate, assign `remaining`, `consumed`, `rejected`, or `blocked`. Classify
the exact substantive first action as `satisfied`, `owned`, `not-required`, or `blocked`.
Preserve candidate order and role. Do not promote non-PRD work to avoid an individual disposition
or bundle deferred candidates into the first PRD.

## 3. Present the custody checkpoint

Read [`../to-issues/SKILL.md`](../to-issues/SKILL.md) completely and apply its preapproval issue
breakdown and checklist-mapping contract. Do not stage bodies or load its approval-only publication
protocol yet.

Before mutation, present:

1. every non-PRD row, proposed disposition, owner/title/route, labels, blocker, and evidence;
2. the first action and status;
3. the ordered PRD queue, including consumed or rejected candidates for contrast; and
4. the eight `to-issues` publication postures: decision scan, source relationship, parent
   disposition, source/target, prerequisites, publication, artifacts, and coverage.

Map each affected browser-visible checklist component to final acceptance criteria; give specific
N/A reasons for verification or process work. Include duplicate-search and durability results.

Artifact-source mode requires the canonical report and every linked dependency to be clean,
content-identical, and visible at the same publication ref, with no truthful tracker parent. If
required paths are not durable, obtain explicit authorization to publish those exact paths and
verify them at the ref before requesting issue-publication approval. Never cite an untracked prep
artifact as durable source. Each proposed issue must include `## Source and coordination`, the
durable report token, and state that it is a standalone non-PRD follow-up that neither ratifies nor
implements remaining PRD candidates. Parent disposition and ledger are N/A.

If current evidence already gives every row custody, finish read-only. Otherwise ask one approval
question for exactly the listed issue creations and named existing-issue mutations, then stop.

## 4. Publish only the approved set

After approval, read
[`../to-issues/references/publication-protocol.md`](../to-issues/references/publication-protocol.md)
completely and follow its artifact-source staging, serial creation, exact-read, recovery,
family-verification, and cleanup rules. Do not duplicate that machinery here.

Set the report as `artifactSource.path` and list every linked dependency in
`artifactSource.dependencies`, including an empty array when there are none. Freeze the approved
custody ledger before staging. After each verified creation, update both publication and custody
ledgers. Stop on an ambiguous mutation or failed verifier and reconcile the exact title before any
retry. Approval does not authorize unlisted work.

## 5. Close custody and return the queue

Validate the ledger and use the contract's renderer:

```bash
node .claude/skills/playtest-to-issues/scripts/custody-ledger.mjs validate \
  <prep-artifact> <custody-ledger.json>
```

Structural errors must be fixed. Any blocked row, candidate, or first action requires the blocked
renderer and prevents `/to-prd`. Otherwise use the passing renderer. Never hand-format either
receipt.

Capture the final branch and full worktree before rendering. Remove every temporary ledger,
staged body, run sheet, manifest, and snapshot; prove absence; then recapture branch and worktree.
Emit the captured receipt verbatim only when cleanup succeeded and the recaptured values still
match its inputs.

Completion requires an unchanged prep hash, exact inventory coverage, exact-read owners,
family-verified approved creations, a validator-backed receipt, and no temporary artifacts. Return
only the renderer's ordered remaining PRD queue: its first candidate is the next `$to-prd`
invocation; an exhausted queue has no `/to-prd` action.
