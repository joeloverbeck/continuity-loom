# Publication Package and Labels

Read this file in full during Step 3 of [`to-prd`](../SKILL.md) before staging or creating each intended issue.

## Title and exact-title duplicate guard

Title the issue `PRD: <name> — <key mechanisms>`, matching prior PRDs. Preserve the same published title punctuation as same-kind exemplars, including the em dash in `PRD: <name> — <key mechanisms>` when that is the house style; ASCII-only local editing defaults do not require downgrading tracker issue titles unless the tracker or CLI rejects the character. The issue title is set via `--title`; the body (or `--body-file`) begins at the preamble and must not repeat the title as an H1 heading.

Once each intended title is final, run an exact-title duplicate guard before staging or creating its issue. Use tracker search only to collect candidates, then filter the returned JSON by exact `.title` equality; fuzzy and body-only matches are not duplicates. Zero exact matches permits creation. One exact match means recover and verify that issue instead of creating another. Multiple exact matches are ambiguous: stop and report them rather than choosing silently.

```sh
TITLE='PRD: <name> — <key mechanisms>'
candidate_json="$(gh issue list --state all --search "\"$TITLE\" in:title" --json number,title,state,url,labels,updatedAt --limit 20)" || {
  printf 'exact-title tracker read failed\n' >&2
  exit 1
}
test -n "$candidate_json" || {
  printf 'exact-title tracker read returned empty output\n' >&2
  exit 1
}
exact_matches="$(printf '%s\n' "$candidate_json" | jq --arg title "$TITLE" '[.[] | select(.title == $title)]')" || {
  printf 'exact-title tracker read returned invalid JSON\n' >&2
  exit 1
}
printf '%s\n' "$exact_matches"
```

A nonzero tracker command, empty output, or invalid JSON is a tracker-read failure, never a zero-match result. Retry the same read under the active environment's network and approval rules; do not stage or create the issue until one successful read yields a valid exact-match array.

## Program of PRDs

When the invocation or its source determination covers several sequenced PRDs (for example "create PRDs as necessary" over a ratified program), the per-PRD workflow applies to each body — every body gets its own artifact sweep, template validation, publication, and verification. Publication packaging (how many issues now, their sequence and dependencies, and — when the label is not fully determined by decision status — the publication label) rides the Step 2 checkpoint as one additional question in the same call — still the sole checkpoint.

Bodies drafted before issue numbers exist reference siblings generically ("the first program PRD"); after creation, resolve those references to concrete numbers via a sequence comment on each issue or a body edit, stating each PRD's position and any label flip condition. If sequence comments are used, post the same concrete sequence comment to every issue in the program and verify each issue with `gh issue view --json comments` that the comment is present and names the concrete issue numbers. If body edits are used instead, verify each edited body contains the concrete sibling numbers before final reporting.

## Publication label decision

Choose the publication label from the PRD's decision status before creating the issue. Label proof order: first use current same-kind exemplar metadata or exact issue metadata that already shows the chosen labels; call `gh label list` only when no current issue metadata proves the exact labels or label creation may be needed.

For this label decision, the explicit create/publish request described in Step 2 ratifies only the selected product scope; unresolved seam decisions, draft-only requests, named open decisions, or revised recommendations still count as unresolved. Distinguish a blocking open decision — an unresolved scope or seam choice that leaves the PRD not AFK-actionable — from a recommended-default note, a specified implementation direction the body records as open to groomer refinement: a recommended-default note does not by itself force `needs-triage` when product scope and seams are ratified and an AFK agent could implement the specified direction as written. If the user makes an explicit label choice at the Step 2 publication/packaging checkpoint, that choice governs the label and is recorded as ratification.

Apply this taxonomy:

- **Ready.** If no provisional, unratified, timed-out, or open-to-veto decisions remain, verify the `ready-for-agent` label exists (create it per the project's triage-label doc if absent; a verification earlier in the same session suffices), then apply it. No additional triage round-trip is needed, but any pre-label acceptance checks imposed by the project's issue-tracker doc still apply.
- **Needs triage.** If any provisional, unratified, timed-out, or open-to-veto decision remains, do not apply `ready-for-agent`; apply `needs-triage` instead, verify that label exists the same way, and record in the final report that the PRD is not AFK-ready until those decisions are ratified.
- **Sequenced.** A fully-ratified PRD whose start is blocked by an unclosed predecessor uses the repo's blocked-equivalent label by default; when the repo has no dedicated blocked label, use `needs-triage`. Record the evidence-based label-flip condition on the issue itself and report the PRD as sequenced, not as unratified. If the predecessor is not yet represented by a durable tracker issue or PR, the body must name the predecessor action, explain why it blocks the start, and state the evidence that permits the label flip; the missing tracker number does not make the sequenced PRD `ready-for-agent`.

A current `gh issue list` or `gh issue view` response from the same repo that shows the exact chosen label is sufficient label-existence verification; use `gh label list` only when no current issue metadata has shown it or label creation may be needed.

Apply the chosen triage label alongside whatever non-triage type label the same-kind exemplar PRDs carry (for example `enhancement`), confirmed from the exemplar's fetched metadata rather than assumed.

## Browser-visible guidance checklist gate

In this repo, a PRD touching a guided flow, prompt-out, Canon Workbench provenance, or browser workflow navigation must satisfy the issue-tracker doc's browser-visible guidance acceptance checklist before `ready-for-agent` is applied.

Treat this as a checked gate, not a self-assertion: before applying `ready-for-agent`, enumerate the issue-tracker doc's acceptance items and confirm each maps to a PRD section that carries it (the provenance preamble, Problem Statement/Solution, User Stories, Implementation Decisions, Testing Decisions, or Principles — package-source and doctrine citations typically live in the preamble and Principles), applying the same mechanized rigor as the template-conformance and post-publication checks.

For every PRD subject to this gate, add an explicit body paragraph or table headed with the exact marker `Browser-visible guidance checklist mapping` before publication; for each checklist item, record the PRD home that covers it or `N/A - <reason>`. For staged bodies subject to this gate, check that the marker is present before publication, and include a `hasChecklist` or equivalent body readback check after publication.

Distinguish an item whose trigger condition is absent from an item that applies but is unhomed: many issue-tracker acceptance items are conditional ("where relevant", "when prompt-out is in scope", "when the slice writes records", "when an instrument can be declined", "when the browser task grammar changes"), and an item whose condition does not hold is N/A — record it and move on; it does not force `needs-triage`. Only an item that applies but has no home in the body is unmet; if any applicable item is unmet, apply `needs-triage` instead and name the unmet items in the final report.
