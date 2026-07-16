# Publication Protocol

Read this file completely only after the Step 4 breakdown is approved or publication was explicitly pre-authorized. It is the approval-only branch of `to-issues`; do not stage bodies or mutate the tracker before reaching it.

## Completion criterion

Publication is complete only when:

- approved slice count equals verified created issue count;
- every issue has the approved title, state, labels, tracker relationship, dependencies, story coverage, acceptance criteria, and Principles section;
- every fully specified affected child has a validated final browser-visible guidance mapping, including a `needs-triage` child held solely by an external sequencing or readiness gate;
- published bodies and any ledger contain no placeholders or machine-local paths;
- child mode has a posted parent ledger or its approved fallback; standalone-source mode has the exact source relationship in every published body;
- temporary artifacts are absent; and
- final `git status --short` names only pre-existing or intentional changes.

## Issue body

Match fetched house style. This template defines required content, not mandatory section order. Choose exactly one tracker-relationship header:

```markdown
## Parent

<parent tracker reference for child mode>

<!-- Or, for standalone-source mode: -->

## Source and coordination

<source tracker reference>
<exact relationship, such as Blocks PRD #379>

## What to build

<concise end-to-end behavior and explicit handoffs>

## User stories covered

<approved story mapping; follow fetched house style if it deliberately keeps this out of bodies>

## Acceptance criteria

- [ ] <observable criterion>

## Blocked by

- <real backward issue reference, when applicable>
- <exact external prerequisite text, when no tracker issue owns the prerequisite and it applies>

<!-- Include whichever blocker kinds apply; or: None - can start immediately, only when neither kind exists -->

## Principles

<required conformance rule, touched principles/ADRs, and deliberate exceptions>
```

Avoid volatile code paths and snippets in issue prose. Stable principle, ADR, spec, and methodology identifiers are allowed. A prototype-derived decision snippet is allowed only when it is more precise than prose and is trimmed to the decision-rich portion.

## 1. Freeze publication posture

Freeze one tracker relationship for the run before staging. **Child mode** requires a parent token and the approved parent-ledger posture. **Standalone-source mode** requires a source token and exact relationship text in `## Source and coordination`; it has no parent ledger. Do not describe a predecessor, follow-on, or coordination issue as a child merely because its source is a tracker item.

For every approved slice, select the full house-style label set. Use `ready-for-agent` only when dependencies are explicit, all provisional or open decisions were resolved at approval, and repository implementability checks pass. Otherwise use `needs-triage` and record why.

For guided-flow, Prompt-out, Canon Workbench provenance, or browser-navigation work, read the repository issue-tracker guidance and map applicable browser-visible guidance items into final acceptance criteria before applying a ready label.

A fully specified affected slice held at `needs-triage` solely by an external sequencing or readiness gate still owes the complete checklist mapping. Reserve checklist N/A for a genuinely unaffected slice; the external gate is recorded separately as a blocker.

Verify every chosen label from fresh same-repository issue metadata or `gh label list`. Exact same-repository metadata is an acceptable fallback when label listing is transiently unavailable.

Run an exact-title duplicate guard for every approved child before staging:

```sh
TITLE='<child title>'
gh issue list --state all --search "\"$TITLE\" in:title" --json number,title,state,url,labels --limit 10 \
  | jq --arg title "$TITLE" '[.[] | select(.title == $title)]'
```

Zero matches permits creation. One exact match requires a reuse/link/skip decision unless duplicate creation was explicitly approved. Multiple exact matches are ambiguous and block publication. Fuzzy matches are not duplicates. Rerun this guard after interruptions or resumptions.

For read-only tracker commands in this protocol, a connectivity, rate-limit, or other transient API failure is not an empty result. First classify sandbox- or permission-shaped failures: when the environment provides an approved network-escalation mechanism, rerun the exact read-only command through that mechanism before counting the attempt as an API retry. Only failures after the permitted escalation use the retry-once-then-stop rule. If the escalated attempt and one API retry both fail, stop unless the protocol names a fresh-context fallback for that exact read.

If a tracker mutation returns an error or no usable URL after the request may have reached the server, do not blindly rerun it. Reconcile first: for issue creation, rerun the exact-title guard and inspect the one exact match's body and labels; for a parent comment, inspect fresh parent comments for the exact staged body. Reuse and verify one exact match, retry only after confirming that no mutation landed, and stop on multiple matches.

## 2. Stage bodies and the checklist run sheet

Use outside-worktree temporary files when the environment permits safe edit and cleanup. In Codex-style sessions, use `apply_patch` for temporary files too. Otherwise use clearly temporary repo-local paths such as `reports/.tmp-<parent>-issue-<slice>.md`. Never publish a staging path.

Create a temporary JSON working publication ledger beside the staged artifacts before the first create call. Record the approved slice count and one entry per approved slice in dependency order. An unpublished entry has its approved `slice`, `title`, `blockers`, and `externalBlockers`, with `number`, `url`, and `verifierStatus` set to `null`. This ledger is the resumable source of publication state; do not rely on issue numbers held only in chat.

```json
{
  "approvedCount": 1,
  "entries": [
    {
      "slice": "Contract slice",
      "title": "Contract slice",
      "number": null,
      "url": null,
      "blockers": [],
      "externalBlockers": [],
      "verifierStatus": null
    }
  ]
}
```

For each fully specified affected slice, the local run sheet must contain exactly these eleven rows, even when the slice remains `needs-triage` solely because of an external sequencing or readiness gate:

| Checklist item | Required mapping |
|---|---|
| package source cited | `AC N - "verbatim excerpt"` or specific N/A |
| decision-point contract named | `AC N - "verbatim excerpt"` or specific N/A |
| required, optional, skippable, and severity-dependent fields visible where relevant | `AC N - "verbatim excerpt"` or specific N/A |
| doctrine at the actual decision point | `AC N - "verbatim excerpt"` or specific N/A |
| prompt packet preview, source manifest, and cold external LLM test | `AC N - "verbatim excerpt"` or specific N/A |
| advisory/canon separation visible | `AC N - "verbatim excerpt"` or specific N/A |
| skip path and reason storage | `AC N - "verbatim excerpt"` or specific N/A |
| blockers/substance validation | `AC N - "verbatim excerpt"` or specific N/A |
| current, next, and resume state | `AC N - "verbatim excerpt"` or specific N/A |
| read-side audit or provenance link | `AC N - "verbatim excerpt"` or specific N/A |
| cognitive walkthrough scenario | `AC N - "verbatim excerpt"` or specific N/A |

Use columns `Slice | Checklist item | Covered by final AC mapping | N/A reason`. Every applicable row uses one or more exact mappings in the form `AC <n> - "<verbatim excerpt from that AC>"`; separate multiple mappings with semicolons. The validator resolves the cited ordinal, proves each excerpt belongs to that exact acceptance criterion, and prints the resolved AC text in its report. A bare ordinal, an excerpt without its ordinal, or an excerpt copied from a different AC fails validation.

For a composite checklist item, the resolved AC text must cover every named component. One AC may cover multiple components, multiple exact mappings may divide them, or an AC may encode an explicit cross-slice handoff that names the component and the slice that closes it. Do not map a row such as `prompt packet preview, source manifest, and cold external LLM test` to criteria that cover only preview and manifest. Every inapplicable row uses `N/A - <specific reason>`. An unaffected slice gets one `browser-visible guidance checklist` row with a specific N/A reason. A generic body criterion or final-ledger `yes` never substitutes for this run sheet.

Composite coverage is semantic, not a demand to copy checklist labels into issue prose. Use the repository's governed terms when they prove the same behavior: a governed deferral or decline can satisfy the skip-path component; a recorded, retained, or persisted reason/rationale can satisfy reason storage; and an explicit refusal of incomplete work, material, evidence, or completion can satisfy substance validation. The validator keeps negative controls for each alternative. Do not add phrases such as `skip path and reason storage` or `substance validation` solely to make the checker pass.

## 3. Validate staged artifacts

The staged-artifact validator is the canonical check for content, patch markers, default placeholders, `/home/`, `/tmp`, sections, blockers, story coverage, AC count, and exact checklist-to-AC mappings:

```sh
node .claude/skills/to-issues/scripts/validate-publication.mjs child "$BODY_FILE" \
  --parent "PRD #<parent>" \
  --blocker "#<backward-blocker>" \
  --external-blocker "<exact external prerequisite text>" \
  --forbid-pattern '<run-specific-token-or-path-pattern>' \
  --expect-stories \
  --expect-ac-count <count>
```

For standalone-source mode, replace `--parent` with both relationship arguments:

```sh
node .claude/skills/to-issues/scripts/validate-publication.mjs child "$BODY_FILE" \
  --source "PRD #<source>" \
  --source-relationship "Blocks PRD #<source>" \
  --expect-no-blocker \
  --expect-stories \
  --expect-ac-count <count>
```

Repeat `--blocker` for every expected backward reference and `--external-blocker` for every exact non-tracker prerequisite. Put each external prerequisite in its own `## Blocked by` bullet. Use `--expect-no-blocker` only when neither tracker nor external blockers exist. Use `--placeholder-re` when the run uses tokens outside the default `#SLICE|PLACEHOLDER` pattern.

Repeat `--forbid-pattern` for every additional run-specific token or machine-local path regex. The validator preserves the distinction mechanically: no match passes, a match fails validation, and an invalid regex is a usage error. Apply the same options to ledger validation and to current-slice or full run-sheet validation when those artifacts can carry the pattern.

For a shared multi-slice run sheet, the default command must configure every slice represented in that file:

```sh
node .claude/skills/to-issues/scripts/validate-publication.mjs run-sheet "$RUN_SHEET" \
  --slice-body "<slice 1>=<body 1>" \
  --slice-body "<slice 2>=<body 2>" \
  --unaffected-slice "<unaffected slice>"
```

During serial publication, validate only the current configured slice with `--only-slice`; the remaining run-sheet rows are intentionally ignored for that invocation:

```sh
node .claude/skills/to-issues/scripts/validate-publication.mjs run-sheet "$RUN_SHEET" \
  --slice-body "<current slice>=<current body>" \
  --only-slice "<current slice>"
```

The `--only-slice` value must also be configured by `--slice-body` or `--unaffected-slice`. Both forms apply placeholder, patch-marker, and machine-local path checks to every configured affected child body. Use the current-slice form during serial substitution; a configured body that still contains a staging placeholder must fail. Run the full all-slice form only after every substitution is complete and again before final family verification.

Validate the staged parent ledger with every expected child:

```sh
node .claude/skills/to-issues/scripts/validate-publication.mjs ledger "$LEDGER_FILE" \
  --child "#<child-1>" \
  --child "#<child-2>"
```

The validator does not replace relationship/tense review, live tracker readback, or cleanup proof.

## 4. Run a status-preserving negative sweep

The canonical sweep is the staged-artifact validator's repeatable `--forbid-pattern` option. Pass every run-specific token or machine-local path regex on each child, ledger, and applicable run-sheet invocation. Never replace it with `rg ... || true`; that hides real command failures.

If a one-off investigation cannot be expressed through the validator, use this status-preserving shell fallback:

```sh
if sweep_output="$(rg --no-filename -n '<run-specific-token-or-path-pattern>' "$BODY_FILE" 2>&1)"; then
  sweep_status=0
else
  sweep_status=$?
fi
case "$sweep_status" in
  0) printf '%s\n' "$sweep_output"; exit 1 ;;
  1) ;;
  *) printf '%s\n' "$sweep_output" >&2; exit "$sweep_status" ;;
esac
```

Exit 1 with no output is the clean no-hit case. Exit 0 means actionable content was found. Exit greater than 1 is a command failure. Rerun validation with every `--forbid-pattern` after each substitution or body edit; rerun the shell fallback too when it was needed. Do not batch these gates with the corresponding tracker creation call.

## 5. Publish serially in dependency order

Create blockers first. Use placeholder substitution only for backward references, replacing each placeholder with the real returned number before validating and creating the dependent issue. Name forward handoffs by stable slice title, never by predicted issue number.

After each substitution:

1. rerun child validation with every repeatable `--forbid-pattern`;
2. rerun the current-slice run-sheet validation with every repeatable `--forbid-pattern`;
3. inspect relationship and tense words such as `blocked by`, `depends on`, `sibling`, `consumes`, `closed`, `completed`, `implemented`, `open`, and `ready`; and
4. only then call `gh issue create --body-file`.

Never replace either validator invocation with `rg ... || true`.

Create issues one at a time and stop on the first failure. Predicted identifiers are a fallback only for strictly backward references with chained creation and immediate prediction verification. If creation fails ambiguously, apply the mutation-reconciliation rule in Step 1 before deciding whether a retry is safe.

Immediately verify each created issue with one fetch through the single-child verifier:

```sh
node .claude/skills/to-issues/scripts/verify-published-family.mjs child "$ISSUE_NUMBER" "$BODY_FILE" \
  --title "$TITLE" \
  --parent "PRD #<parent>" \
  --state OPEN \
  --label enhancement \
  --label ready-for-agent \
  --blocker "#<backward-blocker>" \
  --external-blocker "<exact external prerequisite text>" \
  --forbid-pattern '<run-specific-token-or-path-pattern>' \
  --expect-stories \
  --placeholder-re '#SLICE|PLACEHOLDER'
```

For standalone-source mode, replace `--parent` with `--source` and `--source-relationship` using the exact approved strings.

Repeat label and blocker options exactly as approved. Use `--expect-no-blocker` instead of blocker options only when neither tracker nor external blockers exists. The verifier fetches the issue once, normalizes Markdown before comparing the full staged body, requires the exact label set and state, and checks the parent, required sections, story posture, blockers, placeholders, and machine-local paths. Correct defects with the tracker edit command and rerun this verifier before continuing.

After the single-child verifier passes, immediately update that slice's working-publication-ledger entry with the actual issue number, returned URL, exact resolved tracker and external blockers, and `"verifierStatus": "verified"`. Update no other entry speculatively. If the create or verification fails, leave the entry unpublished or record `"verifierStatus": "failed"`, then stop.

On resume, read the working publication ledger before any duplicate guard or create call. Re-fetch each entry marked `verified`, rerun its single-child verifier against the staged body, and retain it only if number, URL, blockers, labels, and body still pass. Reconcile any entry with a number or URL but no verified status using the ambiguous-mutation rule in Step 1. Resume at the first unpublished slice in dependency order; never recreate an already verified slice.

## 6. Parent ledger or standalone source

This section branches on the frozen tracker relationship. Standalone-source mode has no parent ledger: the staged and published `## Source and coordination` section is the durable relationship record, and its exact source token and relationship text are verified in Steps 5 and 7.

In child mode, when approved, post a child-map ledger after all children exist. Match the fetched parent-ledger heading/table style and any stable repository disclaimer; do not invent a disclaimer when tracker docs and precedent are silent.

Include:

- slice title, issue number, and blocker map;
- checklist mapped `yes` or specific N/A;
- ratified structural, durability, coordination, dependency, placement, and story-coverage decisions; and
- compact story coverage when it is not durable in child bodies.

Validate and sweep the staged comment before `gh issue comment`. Relationship wording must describe newly created children truthfully.

If comment publication fails ambiguously, apply the mutation-reconciliation rule in Step 1 against fresh parent comments before retrying.

If the ledger was declined, use the approved fallback. For a single child whose issue body carries the complete relationship rationale, the approved default reason is `relationship rationale is complete in the issue body`. When structural or durability rationale would otherwise exist only in chat and the user did not choose, default to a concise `## Breakdown decisions` section in the first relevant child. If the user explicitly chose no tracker rationale, honor it and report the choice.

Never close or modify the parent body, labels, or state. A permitted ledger comment is additive and is the only parent mutation this skill performs.

## 7. Verify the live published family

Before cleanup, create a local JSON manifest and run the family verifier. Paths resolve from the repository working directory.

```json
{
  "approvedCount": 2,
  "forbidPatterns": ["reports/\\.tmp-private"],
  "runSheet": "reports/.tmp-parent-run-sheet.md",
  "workingLedger": "reports/.tmp-parent-working-publication.json",
  "parent": {
    "number": 100,
    "token": "PRD #100",
    "state": "OPEN",
    "ledger": {
      "status": "posted",
      "commentUrl": "https://github.com/owner/repo/issues/100#issuecomment-123",
      "bodyFile": "reports/.tmp-parent-ledger.md"
    }
  },
  "children": [
    {
      "number": 101,
      "url": "https://github.com/owner/repo/issues/101",
      "title": "Contract slice",
      "bodyFile": "reports/.tmp-parent-issue-1.md",
      "slice": "Contract slice",
      "state": "OPEN",
      "labels": ["enhancement", "ready-for-agent"],
      "blockers": [],
      "externalBlockers": [],
      "noBlockerPhrase": "None - can start immediately",
      "checklistMapped": "yes"
    },
    {
      "number": 102,
      "url": "https://github.com/owner/repo/issues/102",
      "title": "Consumer slice",
      "bodyFile": "reports/.tmp-parent-issue-2.md",
      "slice": "Consumer slice",
      "labels": ["enhancement", "ready-for-agent"],
      "blockers": ["#101"],
      "externalBlockers": [],
      "checklistMapped": "N/A - server metadata seam only"
    }
  ]
}
```

An externally gated child omits `noBlockerPhrase` and records its exact bullet text separately:

```json
{
  "blockers": [],
  "externalBlockers": ["P-03 conformance repair with a current active-route packet"],
  "checklistMapped": "yes"
}
```

For a skipped ledger, use `"ledger": {"status": "skipped", "reason": "<approved reason>"}`. List exact non-tracker prerequisite bullets in `externalBlockers`; `noBlockerPhrase` is valid only when both `blockers` and `externalBlockers` are empty. `checklistMapped: yes` configures the child as an affected run-sheet slice regardless of label; an `N/A - ...` value configures it as genuinely unaffected.

`forbidPatterns` is required even when empty. Copy every run-specific `--forbid-pattern` regex into it; do not fold those patterns only into `placeholder-re`. Build the final manifest's child numbers, URLs, and blocker arrays from the working publication ledger, then point `workingLedger` at that file. The family verifier requires every approved entry to be verified and match the manifest plus live issue URL before it reruns the same forbidden patterns across the run sheet, every published child, and any posted parent ledger.

For standalone-source mode, replace the top-level `parent` object with `source` and omit `ledger`:

```json
{
  "source": {
    "number": 379,
    "token": "PRD #379",
    "relationship": "Blocks PRD #379",
    "state": "OPEN"
  }
}
```

Run:

```sh
node .claude/skills/to-issues/scripts/verify-published-family.mjs "$FAMILY_MANIFEST"
```

The verifier validates the working publication ledger, reruns the complete checklist sheet, and fetches every published issue live through `gh`. In child mode it also fetches the parent and verifies the parent token plus posted ledger or skipped-ledger reason. In standalone-source mode it fetches the source and verifies the exact source token and relationship in every staged and published body. It also verifies exact blockers, labels, state, title, body equality, live URL, and every custom forbidden pattern. A nonzero exit blocks final reporting.

## 8. Cleanup and final response

Delete all staged bodies, run sheets, manifests, parent-ledger files, and working-publication-ledger files with the environment-approved edit/removal mechanism. Prove every temporary path is absent, then run `git status --short` from the repository root. Do not path-scope Git status to an outside-worktree temp path.

Final Response Blocker: do not report publication complete unless the final answer includes:

- approved-created count match;
- one issue URL per approved slice;
- state and label proof per issue;
- parent or standalone-source relationship plus individual tracker-blocker, external-blocker, or no-blocker proof per issue;
- placeholder/path sweep result per issue;
- checklist mapped `yes` or specific N/A per issue;
- child-mode parent ledger posted/skipped and reason, or standalone-source relationship verified;
- working publication ledger consumed by final verification and removed;
- temporary-file cleanup result; and
- final worktree status with unrelated or intentional dirty files called out.

If interrupted or compacted after publication begins, rerun any family, ledger, cleanup, or final-response proof whose output is not still present in current context.
