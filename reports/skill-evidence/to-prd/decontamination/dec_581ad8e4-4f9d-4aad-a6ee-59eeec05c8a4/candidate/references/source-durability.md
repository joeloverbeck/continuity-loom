# Source Durability

Read this file in full during Step 3 of [`to-prd`](../SKILL.md). Run the gate
before creation and again against the published-body readback.

## Temporary and undurable sources

Never publish machine-local staging paths or cite an artifact whose consulted
bytes are not durable. Summarize its ratified conclusion and say `temporary
source summarized, not cited`, or identify a ratified deliverable as pending
authoring/publication without emitting a nonexistent extractable path. If exact
source bytes are indispensable and unavailable, stop instead of paraphrasing.

Stage bodies outside the worktree when the environment permits, otherwise in a
clearly temporary repo-local path. Use the environment-approved edit/removal
mechanism and prove cleanup.

## Source extraction

Run the skill validator in extraction mode over the full staged body:

```sh
node .claude/skills/to-prd/scripts/validate-prd-body.mjs \
  <body-file> --extract-sources
```

It extracts filename-bearing paths below `docs/`, `reports/`, and `archive/`,
the root authorities it recognizes, and ADR shorthand. Backtick an intentional
extensionless artifact path; ordinary slash compounds are not citations.

For every cited `localSourcePaths` and uniquely resolved `resolvedAdrPaths`
entry, prove the same four facts against the resolved publication ref (normally
`origin/main`):

| Path | Clean | Tracked | Visible on publication ref | Content matches ref |
|---|---|---|---|---|
| `<source>` | `yes/no` | `yes/no` | `yes/no` | `yes/no` or `N/A - no publication-ref blob` |

Use direct observable Git checks:

```sh
git status --porcelain -- <path>
git ls-files --error-unmatch <path>
git ls-tree -r --name-only <publication-ref> -- <path>
git diff --quiet <publication-ref> -- <path>
```

Run the content comparison only after tracked and publication-ref visibility
pass, and capture its exit status. Every cell must be `yes` for a durable
citation. `N/A - no publication-ref blob` is non-durable, not a pass. Replace a
failed citation with an accurate summary/pending note or stop when the PRD
cannot remain accurate without it.

Resolve each `ADR NNNN` shorthand to exactly one
`docs/adr/<number>-*.md` file and apply the same gate. Missing or ambiguous ADRs
must be replaced with a durable explicit citation, summarized without stable-
citation wording, or treated as a blocker.

Preserve a row per source for both staged and published runs. Do not infer the
published result from the staged one.

