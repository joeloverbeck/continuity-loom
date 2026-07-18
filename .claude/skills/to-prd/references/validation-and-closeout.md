# Validation and Closeout

Read this file in full during Step 3 of [`to-prd`](../SKILL.md) before validating, creating, or recovering an intended issue.

## Staged-body validator

For a staged body file, run the skill-local validator before `gh issue create`. Put the validation policy in one temporary JSON manifest: `expectChecklist`, `approvedSources`, and `disallowedSources`. Every cited durable local path belongs in `approvedSources`; any extracted local or root authority path omitted from that allowlist fails validation. Every summarized, dirty, untracked, temp-only, publication-ref-missing, or publication-ref-content-different source belongs in `disallowedSources`. Set `expectChecklist` to `true` whenever the browser-visible guidance checklist gate applies.

Create the policy manifest with the environment-approved editing mechanism after source extraction, then reuse that same file for staged and published validation, including across fresh shells or resumed sessions:

```json
{
  "expectChecklist": true,
  "approvedSources": [
    "docs/FOUNDATIONS.md"
  ],
  "disallowedSources": [
    "reports/example-local-prep.md"
  ]
}
```

```sh
BODY_FILE=path/to/prd-body.md
POLICY_FILE=path/to/prd-body.policy.json
node .claude/skills/to-prd/scripts/validate-prd-body.mjs "$BODY_FILE" --policy-file "$POLICY_FILE"
```

If any item fails, edit the body before publishing. Set `expectChecklist` to `false` only when the gate does not apply; the validator rejects a checklist marker whose expectation was not declared. For a checklist-gated PRD, `checklistMissing` must be empty: every canonical item loaded from `docs/agents/issue-tracker.md` must have a row or stable anchor in the PRD body, and each row must identify a covering PRD home or `N/A - <reason>`.

The validator also emits `localSourcePaths`, `unexpectedLocalSourcePaths`, `adrShorthands`, `resolvedAdrPaths`, and `unresolvedAdrShorthands`; its resolver does not replace the direct Git durability checks on the emitted paths. After publication, if validation shows a section is malformed or incomplete, edit the issue and re-run verification before final reporting.

## Final status-language pass

After all pre-create checks pass and before `gh issue create`, run a final status-language pass over the staged body. Completed intake, durability, template, checklist, label-existence, duplicate, and seam-confirmation gates should be recorded as facts, not future work: replace stale gate phrasing such as "should be checked", "must be checked before publication", or "if the body passes" with "was checked", "passed", or "is appropriate because..." when that proof has actually been gathered. Keep provisional language only for implementation decisions, sequenced follow-ons, or genuinely open decisions.

A compact sweep is useful before create; inspect hits rather than treating them as automatic failures:

```sh
BODY_FILE=path/to/prd-body.md
status_scan=0
rg -n "should be checked|must be checked before publication|if the body passes|pending publication|TBD before publication" "$BODY_FILE" || status_scan=$?
if [ "$status_scan" -eq 1 ]; then
  printf 'status-language scan: no matches\n'
elif [ "$status_scan" -ne 0 ]; then
  exit "$status_scan"
fi
```

`rg` exit `1` means the scan found no stale language and is a pass. Exit `0` leaves the matching lines visible for intent review; any other exit is a tool failure and must stop publication.

## Published-body readback

After creation, verify tracker metadata with `gh issue view`: the exact title, chosen labels, state, URL, and issue number. Compare the published body with the latest approved staged body, then run the same skill-local validator against the published body with `--stdin` and the exact staged-body checklist, approved-source, and disallowed-source options. This readback proves exact staged-to-published body identity after normalizing the expected final newline, then verifies the required PRD sections, seam note, browser-visible checklist when applicable, machine-local path exclusion, local and root authority citation allowlist, disallowed-source exclusion, and ADR resolution.

Fetch the published body exactly once and reuse that stored snapshot for both identity comparison and validation. Do not fan out body reads or pipe raw `gh issue view ... --jq '.body'` output directly to `cmp`; normalize the expected final newline exactly as the recipe does so retries cannot compare different snapshots and CLI display newlines do not create false mismatches.

```sh
gh issue view <number> --json number,title,labels,state,url \
  --jq '{number,title,state,url,labels:[.labels[].name]}'

test -f "$POLICY_FILE" || { printf 'validator policy manifest is missing\n' >&2; exit 1; }
published_body="$(gh issue view <number> --json body --jq '.body')" || {
  printf 'published-body tracker read failed\n' >&2
  exit 1
}
test -n "$published_body" || {
  printf 'published-body tracker read returned an empty body\n' >&2
  exit 1
}
cmp -s "$BODY_FILE" <(printf '%s\n' "$published_body") || {
  printf 'published body differs from the latest approved staged body\n' >&2
  exit 1
}
printf 'staged/published body identity: match\n'
printf '%s\n' "$published_body" \
  | node .claude/skills/to-prd/scripts/validate-prd-body.mjs --stdin --policy-file "$POLICY_FILE"
```

If the body fetch exits nonzero or returns an empty body, classify the attempt as a tracker-readback failure rather than a body-validation failure. Retry the same readback under the active environment's network and approval rules; do not edit the issue unless a successfully retrieved body then fails validation.

An identity mismatch is a published-body verification failure even when the published validator would still pass. If the body needs repair, edit the staged body file first, rerun staged validation and status-language checks, then update the issue from that file so it remains the latest approved comparison authority.

Use the published validator output only when exact body identity passes, the validator matches the staged configuration, and it returns no failures. Rerun the [source-durability gate](source-durability.md#durability-gate) for every emitted `localSourcePaths` and `resolvedAdrPaths` entry; the helper does not replace Git durability proof.

An unresolved or ambiguous ADR shorthand, unexpected local source, leaked disallowed source, dirty source, untracked source, publication-ref-missing source, or source whose consulted content differs from the publication ref is a verification failure. Repair the issue body or durability posture and rerun both the helper and the direct Git checks before final reporting.

## Interruption, recovery, and cleanup

If interrupted, resumed, or compacted before issue creation begins, do not rely on remembered pre-create state. Re-run `git status --short --untracked-files=all`, the exact-title duplicate search, cited-source durability checks, ADR shorthand resolution, label proof, staged-body template/checklist/local-path validation, and the final status-language pass before publishing.

If interrupted, resumed, or compacted after issue creation begins, first recover the issue number without creating a duplicate. When the number is unknown, do not retry `gh issue create` until you have rerun the failure-safe exact-title duplicate guard from [publication.md](publication.md#title-and-exact-title-duplicate-guard); use the single exact-title match, stop and report if multiple matches exist, and retry creation only after a successful tracker read proves no matching issue was created. Then re-run the compact `gh issue view` verification, re-check exact staged-to-published body identity, re-check the published body's local-source paths against the approved durable citation list, resolve any published ADR shorthands and re-check the resolved ADR paths, check whether any temporary body file still exists and remove it if needed, then re-run `git status --short --untracked-files=all` before final reporting.

Remove every temporary body and validator-policy file you created using the environment-approved edit/removal mechanism, run `git status --short --untracked-files=all`, and classify every remaining dirty path against the preserved intake baseline as pre-existing, concurrent, or intentional. For temporary files outside the repository, verify cleanup with direct existence checks such as `test ! -e <path>`; repo-local Git status cannot prove cleanup of files outside the worktree.

## Final closeout ledger

Before the final response, reconcile tracker proof, exact staged-to-published body identity, validator results, staged and published durability ledgers, seam/checklist outcome, deferred or sequenced work, and temporary-file cleanup. Compare the final `git status --short --untracked-files=all` with the preserved intake baseline, then reproduce one row per remaining path:

| Path | Final status | Class | Ownership |
|---|---|---|---|
| `<exact path>` | `<git status code>` | `pre-existing` / `concurrent` / `intentional` | `not changed by this run` / `appeared or changed outside this run after intake` / `<why this run owns it>` |

`pre-existing` means the exact path/status row was present in the intake baseline and this run did not own a change to it. `concurrent` means the row was absent from the intake baseline, or changed after intake outside this run's ownership. `intentional` means this run owns the final dirty state. Do not label a final-only path as pre-existing merely because it is present when closeout runs.

Do not collapse paths into counts or unnamed families. If the worktree is clean, record `clean` instead of inventing a row. The final answer must name the branch and publication ref separately; neither substitutes for the per-path ledger.
