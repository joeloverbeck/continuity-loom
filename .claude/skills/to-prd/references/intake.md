# Intake and Scope

Read this file in full during Step 1 of [`to-prd`](../SKILL.md).

## Repo and authority intake

Explore the repo to understand the current state of the codebase, if you haven't already. Run `git status --short` during intake and preserve its exact path/status output as the intake worktree baseline, including an explicit `clean` baseline when it emits no rows. If dirty files are unrelated to the PRD and are not cited by it, continue and mention them in final reporting; if a dirty or untracked file is cited by the PRD, apply the source-durability gate before publishing.

If repo entrypoint guidance (`CLAUDE.md` or `AGENTS.md`) is not already loaded this session, read it and follow it to the domain vocabulary source, relevant ADRs, principles authority, issue tracker docs, and triage-label docs before drafting. When a source artifact, exemplar, or entrypoint names an ADR by number, resolve the exact `docs/adr/<number>-*.md` path with the uniqueness rule in the source-durability reference before opening it; do not guess ADR filenames.

Before drafting, make the intake state explicit in your working notes:

- `git status` checked and its exact path/status baseline preserved;
- entrypoint guidance read or still in context;
- domain vocabulary source read or intentionally N/A;
- domain workflow doc named by the entrypoint read or N/A;
- issue-tracker and triage-label docs read;
- relevant ADRs and principles authority read;
- source artifact loaded; and
- same-kind PRD exemplars fetched.

If an entrypoint-named item does not exist, record it as absent rather than silently skipping it. Use the project's domain glossary vocabulary throughout the PRD, and respect any ADRs in the area you're touching.

## Same-kind PRD exemplars

Fetch the most recent published PRD issue(s) of the same kind/shape (e.g. feature-flow vs. architecture-seam vs. doc-pack) and match their house style — title format, provenance preamble, story phrasing, and cross-referencing conventions. The tracker mixes PRD kinds, so the most recent PRD overall may be a different shape than what you're writing; when it is, fall back to the most recent same-kind PRD for house style.

Start with a compact issue list that fetches only small fields such as number, title, state, URL, labels, and updated time; do not include full bodies in a broad PRD list. Broad issue search can match issue bodies or backlog notes, so filter exemplar candidates to issue titles that start with `PRD:` before selecting the same-kind PRDs to emulate. Then fetch the one or two relevant PRDs by number with `gh issue view`; for very large exemplars, start with compact metadata plus a bounded body slice or named key sections, and fetch the full body only if house style remains unclear.

For same-kind PRD exemplar intake, prefer this bounded shape before any full-body fetch:

```sh
gh issue list --state all --search '"PRD:" in:title <topic terms>' --json number,title,state,url,labels,updatedAt --limit 20
gh issue view <number> --json number,title,state,url,labels,body --jq '{number,title,state,url,labels:[.labels[].name],preamble:(.body|split("## Problem Statement")[0]),testing:((.body|split("## Testing Decisions"))[1] // "" | split("## Principles")[0]),outOfScope:((.body|split("## Out of Scope"))[1] // "" | split("## Further Notes")[0])}'
```

If a candidate body is still too large or the house style remains unclear, fetch only the named section needed for the decision you are making before falling back to the full body.

If the bounded search yields no published PRD title of the same kind, record `Same-kind PRD exemplar: none published` and use the local [PRD body contract](prd-body.md), the repository issue-tracker document, and the triage-label document as the bootstrap authorities. Absence of an exemplar is not a publication blocker and does not justify borrowing another repository's terminology. Carry the no-exemplar state into the publication-package decision so title and type-label fallbacks are applied explicitly.

## PRD-ready determination artifacts

If the conversation or user references a PRD-ready determination artifact such as `reports/*-prd-prep.md`, read it before drafting. Refresh its source durability, tracker freshness, and any cited authority that could have drifted. Treat its selected first PRD as the intended publication scope unless the user revises it, asks only for a draft, or keeps decisions open. Preserve its deferred follow-on candidates in Out of Scope or Further Notes unless the user explicitly asks to publish a multi-PRD program or bundle them into the current PRD.

Before the seam checkpoint, extract every named provisional decision, label-downgrade condition, open mechanism, and open-to-veto note into a decision-closure ledger:

| Decision | Source status | Resolution | Evidence | Label consequence |
|---|---|---|---|---|
| `<scope or mechanism>` | `ratified by source` / `recommended` / `open` | `ratified by source` / `resolved default` / `still open` | `<durable authority, same-kind prior art, or source passage>` | `ready` / `needs-triage` |

Use `resolved default` only when the source artifact, durable authority, and same-kind prior art together select one AFK-actionable direction without changing product scope. Record that direction and its rationale in `## Implementation Decisions`; it is synthesis, not a second user checkpoint. A decision that remains genuinely open stays explicit in `## Further Notes` and forces `needs-triage` under the publication rules. The user's instruction to publish the selected product scope does not silently ratify an open mechanism or erase a label-downgrade condition.

If live tracker readback shows that the selected first PRD was already published or closed, do not recover or republish it as the current intended issue merely because the prep artifact still names it first. Read its exact body, child map or closeout evidence when present, and current implementation surface, then make a source-exploitation ledger that classifies every original candidate as `consumed by <issue>`, `next PRD`, `verification/reopen`, `evidence-only`, or `covered/no-op`. When the user asks for remaining or unexploited scope, promote only the next genuine `next PRD` candidate into the Step 2 seam checkpoint; verification/reopen bugs and field-replay evidence remain explicit follow-ups rather than being inflated into PRDs. If no `next PRD` candidate remains, report that the source is exhausted at PRD scale instead of publishing a duplicate.

For long PRD-ready determination artifacts, rebuild trust with bounded reads before drafting or asking the seam checkpoint. First run a line count such as `wc -l <artifact>` and a heading/key-field search such as `rg -n "^(#|##|###|Decision:|Suggested|Publication package|Recommended testing seams|Likely labels|Source durability|Tracker freshness|Browser-visible guidance checklist)" <artifact>`. Then read targeted slices around the selected scope, deferred follow-ons, publication inputs, and freshness/boundaries. If a broad read or parallel read truncates the evidence surface, rerun with smaller slices and do not carry forward conclusions from the truncated output.
