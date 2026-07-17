# Source Durability

Read this file in full during Step 3 of [`to-prd`](../SKILL.md) before staging or publishing any intended PRD. Run the durability gate both before creation and after published-body readback.

## Ephemeral sources and staged bodies

Before publishing, sweep the whole PRD for ephemeral local paths (for example `/tmp/...`, temp files, or machine-local scratchpads); durable PRDs should summarize those artifacts' relevant conclusions or first archive the artifact somewhere durable before citing it. When the user cited a temporary report or scratch artifact, preserve the selected finding/title and a short "temporary source summarized, not cited" note in the preamble or Further Notes instead of publishing the local path. Temporary body files are fine as local staging, but sweep the PRD body itself and never cite the staging path in the published issue.

For staged issue bodies, prefer an outside-worktree path such as `/tmp/<repo-slug>-prd-<slug>.md` when the active environment permits creating it safely. If the active editing rules forbid shell write tricks or make outside-worktree editing awkward, use a clearly temporary repo-local hidden file such as `reports/.tmp-prd-<slug>.md`, create and delete it with the environment-approved edit mechanism, and verify cleanup before final reporting. In Codex-style sessions, create and delete both `/tmp` and repo-local staged body files with the environment-approved edit mechanism (`apply_patch` when available) rather than shell redirection, heredocs, or unapproved `rm`.

## Local source citations

When the PRD cites a local ADR, spec, principle, methodology document, report, research brief, field-trial report, issue/PR, or other source artifact that was created or modified in this session — or ratified this session as a decision to author later but not yet written — check its repo durability before publishing. If a cited local document or source artifact is untracked or otherwise not yet durable, do not silently present it as a stable published artifact: either summarize its ratified conclusion without durable-citation wording, or record in Further Notes that the artifact is pending local repo publication (for a ratified-but-unwritten artifact, note it as pending authoring and publication, not merely publication). Do not add a second user checkpoint for this; the seam confirmation remains the sole checkpoint.

For staged bodies, run a repo-local artifact sweep before the template check. Extract local-looking source paths, decide which are actual source citations rather than examples, and verify each cited artifact is tracked or otherwise durable. The extractor recognizes sources under `docs/`, `reports/`, and `archive/`, plus cited root authority files `CONTEXT.md`, `CONTEXT-MAP.md`, `CLAUDE.md`, and `AGENTS.md`:

```sh
BODY_FILE=path/to/prd-body.md
node .claude/skills/to-prd/scripts/validate-prd-body.mjs "$BODY_FILE" --extract-sources
```

For each emitted path that the PRD relies on as a source citation, run `git ls-files --error-unmatch <path>` or an equivalent repo-durability check before publishing. Tracked-ness alone is not durability: also intersect the cited paths with `git status --porcelain` — a cited file that is modified, staged, or untracked carries content no commit contains yet, and when the citation leans on that session-authored content, it gets the same treatment as an untracked artifact. Also verify publication-ref visibility for every tracked/clean cited source path: resolve the repository publication ref, normally `origin/main` or the default branch remote ref, and run `git ls-tree -r --name-only <publication-ref> -- <paths>`.

Path visibility is not content durability. A clean tracked file may come from a local commit that the publication ref does not contain, while an older file still exists at the same path on the ref. Evaluate content identity only after both tracked and publication-ref-visible checks succeed. When either prerequisite fails, record content identity as `N/A - no publication-ref blob`; do not interpret a successful `git diff --quiet` result for an untracked or ref-absent path as a match, because Git may have no compared blob for that working-tree path. For a tracked, visible cited path, run `git diff --quiet <publication-ref> -- <path>` (or an equivalent blob-identity comparison) against the live working-tree content the PRD actually consulted. Exit status `0` then proves the content matches; exit status `1` means the cited content differs from the publication ref and is pending local publication even when `git status` is clean and `git ls-tree` finds the path. If a cited artifact is missing from the publication ref or its relied-on content differs, replace the citation with a conclusion summary plus "pending local publication" wording, or stop before publishing when the PRD cannot be accurate without a stable source citation. If a cited artifact fails any tracked, clean, publication-ref path, or publication-ref content check, replace the citation with a conclusion summary plus "temporary source summarized, not cited" wording, or record that the artifact is pending authoring/commit/publication as appropriate.

## Durability gate

Use direct repo commands for the durability proof rather than wrapping `git` calls inside a helper that can fail under the active sandbox. After path extraction and ADR shorthand resolution, run the tracked, status, and publication-ref path checks for every staged-body source; run the content comparison only for paths that are tracked and publication-ref-visible. After the published validator readback, repeat that ordered gate for each emitted `localSourcePaths` and `resolvedAdrPaths` entry:

```sh
git status --porcelain -- <paths>
git ls-files --error-unmatch <paths>
git ls-tree -r --name-only <publication-ref> -- <paths>
# only after the tracked and publication-ref path checks above succeed:
git diff --quiet <publication-ref> -- <path>
```

A clean status, tracked-path readback, publication-ref path readback, and a zero-exit content comparison together are the durable-citation proof. Run the content comparison separately or inspect its exit status explicitly; a quiet command with no captured status is not proof. The publication ref is normally `origin/main`; if it is not, substitute the resolved default branch ref and name it in the final report.

Record the proof as a labeled ledger with one row per emitted source or resolved ADR. Unlabeled bulk output, an unexplained empty status command, or grouped path counts do not prove that the same path set passed every check:

| Path | Clean | Tracked | Visible on publication ref | Content matches ref |
|---|---|---|---|---|
| `<source path>` | `yes/no` | `yes/no` | `yes/no` | `yes/no` |

This inline run-sheet pattern keeps the required checks as direct Git commands while making every result auditable:

```sh
PUBLICATION_REF=origin/main
SOURCE_PATHS=(<one path per validator-emitted source and resolved ADR>)

for path in "${SOURCE_PATHS[@]}"; do
  clean=no
  test -z "$(git status --porcelain -- "$path")" && clean=yes

  tracked=no
  git ls-files --error-unmatch "$path" >/dev/null 2>&1 && tracked=yes

  visible=no
  git ls-tree -r --name-only "$PUBLICATION_REF" -- "$path" | rg -Fx -- "$path" >/dev/null && visible=yes

  content_match="N/A - no publication-ref blob"
  if test "$tracked" = yes && test "$visible" = yes; then
    content_match=no
    git diff --quiet "$PUBLICATION_REF" -- "$path" && content_match=yes
  fi

  printf '| `%s` | %s | %s | %s | %s |\n' "$path" "$clean" "$tracked" "$visible" "$content_match"
done
```

Every durability prerequisite must be `yes` before the path may remain a durable citation. `N/A - no publication-ref blob` is explicit proof that the content comparison was inapplicable and the path is non-durable, not a passing cell. Preserve the completed ledger for both the staged and published durability runs; do not infer the second run from the first.

Also scan for ADR shorthand such as `ADR 0006`, `ADR 0008`, or `ADR 0009`. Resolve each unique shorthand reference to exactly one `docs/adr/<number>-*.md` file and run the same tracked, dirty, publication-ref path, and publication-ref content checks on that resolved path. If no ADR file resolves, or more than one file resolves, treat the shorthand as unresolved and either cite a durable explicit path, summarize the decision without a stable citation, or stop before publishing if the PRD cannot be accurate without it.
