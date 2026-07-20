# Publication Package and Labels

Read this file in full during Step 3 of [`to-prd`](../SKILL.md).

## Title and duplicate guard

Use `PRD: <name> — <key mechanisms>` unless same-kind house style proves a
different published punctuation convention. Set it with `--title`; the body
starts with its untitled preamble.

Before staging or creating, search all issue states and filter valid tracker JSON
by exact `.title` equality. A tracker error, empty response, or invalid JSON is a
read failure, never a zero-match result.

- zero exact matches: creation may proceed;
- one exact match: recover and verify that issue without mutating it unless the
  request separately authorizes repair;
- multiple exact matches: stop and report the ambiguity.

Do not retry creation after an uncertain result until a successful exact-title
read proves whether the issue exists.

## Program of PRDs

Apply the complete per-PRD workflow to every explicitly ratified program entry.
The Step 2 package names issue count, order, dependencies, and label posture.
Before issue numbers exist, use generic sibling references. Afterwards either
edit bodies and verify them or post one byte-identical sequence comment to every
issue naming concrete numbers, titles, position, dependency semantics, and any
label-flip condition.

For sequence comments, read each issue's comments once and require exactly one
exact body match with the tested helper:

```sh
gh issue view <number> --json comments \
  | node .claude/skills/to-prd/scripts/verify-sequence-comment.mjs \
      --expected-body "$SEQUENCE_COMMENT"
```

Zero or duplicate matches fail closeout; a failed read does not authorize a
repost.

## Label decision

Choose labels from the PRD's decision state before creation. Prefer current
same-kind or exact-issue metadata as existence proof; use `gh label list` only
when that proof is absent or creation may be necessary.

Use a verified existing type label: `bug` for a confirmed defect, `enhancement`
for net-new behavior, or `documentation` for doc-only work. Use the repository's
triage labels:

- **Ready:** all product decisions and seams are ratified; apply
  `ready-for-agent` after every pre-label acceptance gate passes.
- **Needs triage:** any decision or unchanged-seam timeout remains open to veto;
  apply `needs-triage`, never `ready-for-agent`.
- **Sequenced:** an otherwise ratified PRD blocked by an unclosed predecessor
  uses the repo's blocked-equivalent label, or `needs-triage` when none exists,
  and records the exact label-flip condition.

A recommended implementation refinement does not force `needs-triage` when the
PRD remains AFK-actionable. A user label choice made in Step 2 governs. Missing
labels may be created only when Step 2 ratified the canonical name, color,
description, and command from the triage authority; do not rewrite existing
label metadata during publication.

## Browser-visible guidance checklist

For browser-visible behavior/workflows, prompt preview or inspection,
user-initiated external-model calls, or candidate/accepted-output handling, use
the canonical checklist between the markers in `docs/agents/issue-tracker.md`.
Before `ready-for-agent`, add the exact heading
`Browser-visible guidance checklist mapping` and map every item to a concrete
PRD section or `N/A - <specific reason>`. Declare `expectChecklist: true` in the
validator policy. Any applicable unmapped item forces `needs-triage`.

