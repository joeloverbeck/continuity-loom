# Publication Protocol

Load this file only after the breakdown is explicitly approved or publication is explicitly pre-authorized. It owns every external write.

Publication is complete only when approved slice count equals verified created count; each issue matches the frozen body, title, labels, state, relationship, blockers, story posture, acceptance count, and checklist mapping; the approved parent/ledger or source posture is verified; forbidden values and placeholders are absent; temporary artifacts are removed; and final worktree status is known.

## Issue-body contract

Match fetched house style while preserving these required contents:

```markdown
## Parent

<parent token>

<!-- Or, in standalone/artifact source mode: -->
## Source and coordination

<source token>
<exact relationship>

## What to build

<end-to-end behavior and explicit handoffs>

## User stories covered

<approved mapping or specific N/A>

## Acceptance criteria

- [ ] <observable criterion>

## Blocked by

- <real backward issue reference or exact external prerequisite>

<!-- Or: None - can start immediately -->

## Principles

<governing doctrine and any deliberate exception>
```

Avoid volatile code paths and implementation snippets. Stable authority identifiers and concise decision-rich prototype excerpts are allowed.

## 1. Freeze and reconcile

Freeze one relationship mode and every approved title, dependency, label, story/checklist mapping, acceptance count, parent disposition, and ledger posture before staging.

- **Child mode** requires a parent token, exact parent state/labels after any approved transition, and a posted/skipped ledger posture.
- **Standalone-source mode** requires a tracker source token, state, and exact relationship; it has no parent ledger.
- **Artifact-source mode** requires a repo-relative primary path, every linked repo-relative evidence dependency exactly once, a publication ref, source token, and exact relationship. Every declared path must be tracked, clean, ref-visible, and content-identical.

Use `ready-for-agent` only when all decisions and prerequisites are explicit and repository checks support AFK implementation. Otherwise use `needs-triage` and record why. A fully specified browser-visible slice held only by an external gate still owes the complete checklist mapping.

Fresh-read available labels and, in child mode, the parent. Ready children may not coexist with a ready parent; apply only the transition explicitly approved at the checkpoint.

Run an exact-title all-state duplicate guard for every child. Preserve the tracker command's exit status separately from JSON filtering. Zero exact matches permits creation; one requires an explicit reuse/link/skip decision; multiple matches block. A failed read is not zero matches.

After interruption, rerun the guards. When a mutation may have reached the server but returns no usable result, reconcile before retrying: exact-title/body/labels for a child, or exact staged body among fresh parent comments for a ledger. Reuse and verify one exact match, retry only after proving none landed, and stop on ambiguity.

## 2. Stage resumable artifacts

Use outside-worktree temporary files when safely supported; otherwise use clearly temporary repo-local paths and the environment-approved edit/removal mechanism. Never publish a staging path.

Before a parent transition or child creation, stage:

1. one body per approved child;
2. the checklist run sheet;
3. any parent-ledger body;
4. a working publication ledger; and
5. later, the final family manifest.

The working ledger is JSON with `approvedCount` and one dependency-ordered entry per slice. Each entry freezes:

- `slice`, `title`, and positive `acceptanceCount`;
- `blockedBySlices` using exact earlier slice titles;
- existing tracker blockers in `prerequisiteIssues`;
- currently resolved tracker references in `blockers`;
- exact `externalBlockers`; and
- `number`, `url`, and `verifierStatus`, initially `null`.

Validate it initially and after every update:

```sh
node .claude/skills/to-issues/scripts/verify-published-family.mjs working-ledger "$WORKING_LEDGER"
```

`blockers` must equal `prerequisiteIssues` plus the issue references of already verified internal blockers. After verifying a blocker slice, update only the established edges on later entries.

For each affected slice, the run sheet has one row for every canonical browser-visible checklist item from `docs/agents/issue-tracker.md`:

`Slice | Checklist item | Covered by final AC mapping | N/A reason`

Use `AC <n> - "<verbatim excerpt>"` mappings whose ordinals and excerpts resolve to the staged body. Composite items must cover every named component. A genuinely unaffected slice gets one `browser-visible guidance checklist` row with `N/A - <specific reason>`. Let the validator report missing components; never pad an acceptance criterion with behavior the slice does not deliver.

## 3. Validate before each write

Validate every resolvable staged child with its exact relationship, blockers, story posture, acceptance count, placeholder pattern, and forbidden values:

```sh
node .claude/skills/to-issues/scripts/validate-publication.mjs child "$BODY_FILE" \
  --parent "PRD #<parent>" \
  --blocker "#<backward-blocker>" \
  --external-blocker "<exact external prerequisite>" \
  --expect-stories \
  --expect-ac-count <count> \
  --forbid-literal "<run-specific text>"
```

For either source mode, replace `--parent` with both `--source "<token>"` and `--source-relationship "<exact relationship>"`. Repeat blocker and forbidden options as needed. Use `--expect-no-blocker` only when neither tracker nor external blockers exist. Use `--placeholder-re` for non-default placeholders and `--forbid-pattern` only for intentional regular expressions.

Validate an affected current slice against the shared run sheet:

```sh
node .claude/skills/to-issues/scripts/validate-publication.mjs run-sheet "$RUN_SHEET" \
  --slice-body "<slice>=<body>" \
  --only-slice "<slice>"
```

When all references are resolved, run the same command without `--only-slice`, configuring every affected body and every `--unaffected-slice`. Pass the same forbidden values that can appear in the run sheet or bodies.

Validate a staged parent ledger after real child numbers exist:

```sh
node .claude/skills/to-issues/scripts/validate-publication.mjs ledger "$LEDGER_FILE" \
  --child "#<child>"
```

Use `--expect-story-coverage` only when story coverage is not already durable in child bodies.

The validators are the canonical placeholder, patch-marker, machine-path, forbidden-value, section, blocker, story, acceptance-count, and checklist gates. Never mask a validator or search failure with `|| true`. Inspect relationship and tense wording manually; validation does not prove it.

For dependency-ordered publication, the pre-transition frontier is the valid working ledger plus every currently resolvable body and run-sheet slice. A dependent body with an unresolved backward placeholder stays deferred until its blocker exists; it does not block validating the earlier frontier.

Only after label proof, duplicate guards, working-ledger validation, current frontier validation, and forbidden-value checks pass may child mode apply the approved parent-label transition. Exact-read the parent immediately and require the approved labels plus unchanged open/closed state before the first create.

## 4. Publish serially

Create issues one at a time in dependency order. Use placeholders only for backward issue references. Forward handoffs use stable slice titles, never predicted numbers.

For each slice:

1. substitute only verified real blocker numbers;
2. rerun child validation and the current-slice run-sheet validation;
3. inspect relationship and state/tense wording;
4. create with `gh issue create --body-file`;
5. immediately verify the returned issue; and
6. update and revalidate the working ledger before continuing.

Canonical single-child verification:

```sh
node .claude/skills/to-issues/scripts/verify-published-family.mjs child "$ISSUE_NUMBER" "$BODY_FILE" \
  --title "$TITLE" \
  --parent "PRD #<parent>" \
  --state OPEN \
  --label enhancement \
  --label ready-for-agent \
  --blocker "#<backward-blocker>" \
  --external-blocker "<exact external prerequisite>" \
  --expect-stories \
  --expect-ac-count "$ACCEPTANCE_COUNT" \
  --forbid-literal "<run-specific text>"
```

Use source relationship options in source modes, repeat exact labels/blockers/forbidden values, and use `--expect-no-blocker` only for truly unblocked work. When nested tracker access is restricted, provide one fresh exact issue JSON through `--snapshot`.

Verification must prove exact title, full normalized body, state, label set, relationship, blocker arrays, story posture, acceptance count, and forbidden-value cleanliness. On failure, stop; do not advance the ledger as verified.

After success, record the returned number/URL, resolved blockers, and `"verifierStatus": "verified"`; resolve the now-real edge in later entries and revalidate the ledger.

On resume, read the working ledger first. Re-fetch and reverify every entry marked verified against its frozen body/count before retaining it. Reconcile entries with a number or URL but no verified status using the ambiguous-mutation rule, rerun duplicate guards, and resume at the first unpublished slice. Never recreate a verified slice.

## 5. Record the relationship

In child mode, post the approved child-map ledger only after all children verify. Match one exact fetched precedent when available. Include slice title/number, blocker map, checklist `yes` or specific N/A, and the ratified structural, dependency, durability, coordination, placement, and story decisions that are not already durable elsewhere. Validate and sweep the exact staged comment before posting, then reconcile an ambiguous comment result before retrying.

If the ledger is skipped, use the approved reason and fallback. A single child may default to `relationship rationale is complete in the issue body`. Put otherwise-chat-only rationale in the approved `## Breakdown decisions` location; honor an explicit decision to omit it.

Never change the parent body or open/closed state. Apart from the approved ledger comment, the only permitted parent mutation is the exact approved label transition.

Source modes have no parent ledger. Every child carries the exact `## Source and coordination` token and relationship. Artifact-source mode rechecks the primary artifact and every declared dependency during final verification.

## 6. Verify the complete family

Stage a JSON manifest with:

- `approvedCount`, `forbidLiterals`, `forbidPatterns`, `runSheet`, and `workingLedger`;
- exactly one relationship object:
  - `parent`: number, token, state, exact labels, and posted/skipped ledger details;
  - `source`: number, token, relationship, and state; or
  - `artifactSource`: path, dependencies, token, relationship, and publicationRef;
- one `children` entry per approved slice containing number, URL, title, bodyFile, slice, frozen acceptanceCount, state, exact labels, tracker `blockers`, `externalBlockers`, `checklistMapped`, and `noBlockerPhrase` only when both blocker arrays are empty.

Build child numbers, URLs, counts, and blockers from the verified working ledger. Include every forbidden literal/pattern used earlier. Artifact dependencies must be complete, unique, repo-relative, and exclude the primary path.

Run:

```sh
node .claude/skills/to-issues/scripts/verify-published-family.mjs "$FAMILY_MANIFEST"
```

If nested tracker access is restricted, supply a complete fresh snapshot set: `--child-snapshot "<number>=<json>"` for every child plus `--parent-snapshot` or `--source-snapshot` as applicable. Artifact-source snapshot mode needs all child snapshots and still checks Git durability. Partial or mismatched snapshot sets fail.

A nonzero verifier exit blocks completion. It must consume and validate the working ledger, full run sheet, staged/live-equal bodies, relationship object, exact labels/state/blockers/URLs/counts, parent ledger or source relationship, forbidden values, and artifact durability when applicable.

## 7. Clean up and report proof

Remove all staged bodies, run sheets, manifests, ledger files, and snapshots with the environment-approved mechanism. Prove every temporary path is absent, then run repository-root `git status --short`.

The final response must include:

- approved/verified count and one URL per slice;
- state, labels, relationship, and blocker/no-blocker proof per issue;
- checklist mapping and forbidden-value result per issue;
- exact parent disposition plus ledger posted/skipped reason, or verified source relationship and artifact durability;
- confirmation that final verification consumed the working ledger and cleanup removed it;
- temporary-file cleanup result; and
- final worktree status, naming unrelated or intentional dirt.

If publication context was interrupted or compacted, rerun any final verifier, ledger, cleanup, or proof step whose output is no longer present.
