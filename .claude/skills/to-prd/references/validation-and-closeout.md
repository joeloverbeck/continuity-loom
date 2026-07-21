# Validation and Closeout

Read this file in full during Step 3 of [`to-prd`](../SKILL.md) before validation
or issue creation.

## Staged body

Create one temporary validator-policy JSON file and reuse it for staged and
published validation:

```json
{
  "expectChecklist": true,
  "approvedSources": ["docs/principles/FOUNDATIONS.md"],
  "disallowedSources": ["reports/example-local-prep.md"]
}
```

Every durable cited path belongs in `approvedSources`. Every summarized,
untracked, dirty, temp-only, ref-missing, or ref-different path belongs in
`disallowedSources`; it must not occur in the body. Set `expectChecklist` only
when the publication rules say the checklist applies.

```sh
node .claude/skills/to-prd/scripts/validate-prd-body.mjs \
  <body-file> --policy-file <policy-file>
```

Do not create the issue until the validator reports no failures, including no
missing checklist items, unexpected/disallowed sources, unresolved ADRs,
template failures, bad story forms, or missing seam markers. Complete the direct
Git durability gate for its emitted source paths. Review the final body once for
stale language that presents completed publication gates as future work.

## Published readback

After creation, exact-read and retain one metadata snapshot and one body snapshot.
Verify number, exact title, sorted label set, `OPEN` state, and URL. Compare the
published body byte-for-byte with the approved staged body, normalizing only the
expected final newline. Then validate that retained body with `--stdin` and the
same policy file, and repeat the direct durability ledger for its emitted paths.

```sh
gh issue view <number> --json number,title,labels,state,url
gh issue view <number> --json body --jq '.body'
node .claude/skills/to-prd/scripts/validate-prd-body.mjs \
  --stdin --policy-file <policy-file>
```

A nonzero, empty, or invalid tracker read is a readback failure, not evidence of
missing or malformed tracker state. Retry the read under the active approval
rules. If valid metadata differs, repair only metadata. If body identity or
validation fails, update the staged body first, rerun every pre-create body gate,
then update the issue and repeat the complete readback. Never claim validator
success when identity failed or a different policy was used.

## Recovery and cleanup

After interruption before creation, rerun worktree, exact-title, durability,
ADR, label, body/policy, checklist, seam, and final-language gates. After an
uncertain creation, recover the issue number with the exact-title guard before
any create retry. One match is the recovery target; multiple matches stop the
run. Then repeat full metadata/body validation and durability.

Remove every temporary body and policy with the approved removal mechanism and
prove absence, including outside-worktree files.

## Final closeout ledger

Reconcile tracker metadata, staged/published identity, validators, both
durability ledgers, seam/checklist disposition, deferred or sequenced work,
sequence-comment/body-link verification, and temporary cleanup. Compare final
`git status --short --untracked-files=all` with the intake baseline. Record each
remaining exact path/status as pre-existing, concurrent, or intentional and name
its ownership; record `clean` when there are no rows. Also name the final branch
and publication ref.

