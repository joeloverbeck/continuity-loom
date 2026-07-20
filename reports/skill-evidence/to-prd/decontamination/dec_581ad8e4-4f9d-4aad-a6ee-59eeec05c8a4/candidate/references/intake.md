# Intake and Scope

Read this file in full during Step 1 of [`to-prd`](../SKILL.md).

## Repository and authority intake

Preserve the exact output of `git status --short --untracked-files=all` as the
intake baseline, including `clean` when it emits no rows. Unrelated dirt may
remain untouched. A cited dirty or untracked source must pass the source-
durability rules before publication.

Follow the loaded repo entrypoint (`CLAUDE.md` or `AGENTS.md`) to the domain
vocabulary, domain workflow, principles, relevant ADRs, tracker instructions,
and triage-label authority. Record absent entrypoint-named authorities instead
of silently skipping them. Resolve an ADR number to exactly one
`docs/adr/<number>-*.md` path before using it.

Retain enough intake evidence to prove:

- the worktree baseline and loaded entrypoint;
- domain vocabulary/workflow and relevant principles/ADRs, or explicit N/A;
- tracker and triage-label authorities;
- the source artifact and its current trust posture; and
- the same-kind PRD exemplar or explicit no-exemplar fallback.

## Same-kind PRD exemplar

Use one or two recent published PRDs of the same shape (feature flow,
architecture seam, doc pack, and so on) for title, preamble, story, label, and
cross-reference style. Start with compact issue metadata and exact `PRD:` titles,
then fetch only the sections needed; do not pull every PRD body in a broad
search. A compact starting point is:

```sh
gh issue list --state all --search '"PRD:" in:title <topic>' \
  --json number,title,state,url,labels,updatedAt --limit 20
```

If no same-kind exemplar exists, record that fact and use the local body
contract plus tracker and triage-label authorities. Do not import another
repository's vocabulary.

## PRD-ready artifacts

Read any referenced `reports/*-prd-prep.md` before drafting. Refresh its source
durability, tracker freshness, cited authorities, and documented final-mode
validator. A structural validator refreshes only the claims it checks; if none
exists, record that and rebuild trust from the source and authorities.

Use the artifact's selected first PRD unless the user revises it, asks only for a
draft, or explicitly ratifies a multi-PRD program. Keep deferred candidates in
Out of Scope or Further Notes.

For `reports/playtest-*-prd-prep.md`, require a current
`## Playtest Follow-Up Custody Receipt` for the exact live artifact. It must
match the live SHA-256, pass the custody validator, dispose every non-PRD row,
and leave no blocked first-action or portfolio row. Otherwise suspend `to-prd`
and run `$playtest-to-issues "<prep-artifact>"`; resume only from its ordered
remaining PRD queue. This applies even when the prep declares zero non-PRD rows.

Build a decision ledger before Step 2:

| Decision | Source status | Resolution | Evidence | Label consequence |
|---|---|---|---|---|
| `<decision>` | `ratified` / `recommended` / `open` | `ratified` / `resolved default` / `still open` | `<authority or source>` | `ready` / `needs-triage` |

Use `resolved default` only when the artifact, durable authority, and same-kind
prior art select one AFK-actionable direction without changing product scope.
Record it in Implementation Decisions without calling it user ratification.
Carry every user-closable `still open` row into Step 2; any row left open remains
in Further Notes and forces `needs-triage`.

If the exact intended title already exists, recover and verify that issue rather
than republishing it. When the user asks for remaining scope, exclude consumed,
verification-only, evidence-only, and covered work; advance only a genuine next
PRD. Report source exhaustion when no PRD-scale candidate remains.

For long authorities or source artifacts, use line counts, heading/key searches,
and targeted complete sections so tool truncation cannot masquerade as a full
read. If indispensable exact bytes are missing, stop with `needs-info` and ask
only for those bytes or a durable source containing them.

