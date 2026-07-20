# Ash at Low Water: approved publication simulation manifest

## Simulation boundary and frozen intake

- Prep artifact: `reports/skill-evidence/playtest-to-issues/decontamination/dec_6b2af119-703e-49fe-b2f5-182c0989a060/corpus/task-07-ash-prepublication-approved/input-prd-prep.md`
- Prep SHA-256: `efaa1cb712057fac891d853d6ad0d6e592276d2942c078b4dd2683634115b5fe`
- Tracker snapshot: `reports/skill-evidence/playtest-to-issues/decontamination/dec_6b2af119-703e-49fe-b2f5-182c0989a060/corpus/tracker-snapshot-pre-ash.tsv`, captured `2026-07-19T10:26:50Z`
- Publication ref represented by the prep: `dafea24f08bb1ccb998b051ddce2ad85c842e133` on `main`, equal to `origin/main`
- User decision: approved publication of the four proposed tickets and the stated custody plan.
- Execution boundary: analysis-only. No network request, GitHub mutation, source/prep mutation, or temporary publication file was made. GitHub-assigned numbers, URLs, and exact-read payloads therefore remain symbolic slots and are not fabricated below.

The complete tracker snapshot has no exact-title match for any of the four approved titles. Issues `#100`, `#103`, `#109`, `#110`, `#111`, and `#112` are closed; only `#100`, `#103`, `#109`, and `#111` are relevant prior work, and none owns the complete scope of a proposed ticket. The workflow must repeat each exact-title guard immediately before its create call in a real publication run.

## Eight-line publication posture

1. **Decision scan:** publish exactly four independent tickets in source order: F004, F003, F005, F009. Route the methodology row and record no-create for F010. Create no PRD.
2. **Source relationship:** every ticket is a standalone non-PRD follow-up. It neither ratifies nor implements a remaining PRD candidate; this prep contains no intended or deferred PRD candidate.
3. **Parent disposition:** N/A. There is no truthful tracker parent and no parent mutation is approved.
4. **Source/target:** the temporary Ash at Low Water report conclusions are summarized, not cited; targets are four new GitHub issues. Closed issues are coordination evidence only, not parents.
5. **Prerequisites:** the supplied snapshot establishes label vocabulary and an empty intake duplicate result. A real run must repeat exact-title guards, stop on any new exact match, and never infer the next issue number from `#112`.
6. **Publication:** serial create/readback in the order F004, F003, F005, F009. Do not continue past an ambiguous create or failed per-issue verifier.
7. **Artifacts:** the report, three linked images, and prep are not clean publication-ref-visible artifacts. Issue bodies therefore contain `Temporary source summarized, not cited` and no local artifact link. This simulation does not authorize or perform source-artifact publication.
8. **Coverage:** the four tickets own F004/F003/F005/F009; `$skill-audit ".claude/skills/playtest"` owns the methodology review; F010 is no-create pending later continuation evidence; the PRD queue is exhausted.

## Frozen family manifest

```yaml
schemaVersion: 1
mode: approved-analysis-only-simulation
prepArtifact: reports/skill-evidence/playtest-to-issues/decontamination/dec_6b2af119-703e-49fe-b2f5-182c0989a060/corpus/task-07-ash-prepublication-approved/input-prd-prep.md
prepSha256: efaa1cb712057fac891d853d6ad0d6e592276d2942c078b4dd2683634115b5fe
publicationRef: dafea24f08bb1ccb998b051ddce2ad85c842e133
parent: null
artifactSource: null
temporarySource:
  relationship: summarized-not-cited
  report: Ash at Low Water playtest report
  reason: report, dependencies, and prep are absent from the publication ref
expectedIssueCount: 4
serialOrder: [F004, F003, F005, F009]
issues:
  - slot: ISSUE_F004
    title: ENTITY prompt-eligibility guidance correction
    labels: [bug, ready-for-agent]
    exactTitleAtIntake: absent
    dependsOn: []
  - slot: ISSUE_F003
    title: Required-list marker clarification
    labels: [bug, ready-for-agent]
    exactTitleAtIntake: absent
    dependsOn: []
  - slot: ISSUE_F005
    title: Structured-pressure warning copy correction
    labels: [bug, ready-for-agent]
    exactTitleAtIntake: absent
    dependsOn: []
  - slot: ISSUE_F009
    title: Linked CAST creation and activation handoff
    labels: [enhancement, ready-for-agent]
    exactTitleAtIntake: absent
    dependsOn: []
```

`ISSUE_F004`, `ISSUE_F003`, `ISSUE_F005`, and `ISSUE_F009` are result slots. Each is filled only from the corresponding successful create response and then replaced by an exact-read record containing `number`, `url`, `state`, `title`, `labels`, and the complete body. They are not projections of `#113` through `#116`.

## Staged issue bodies

### ISSUE_F004 — `ENTITY prompt-eligibility guidance correction`

Labels: `bug`, `ready-for-agent`

```markdown
## Problem

The browser labels `ENTITY.short_description` as prompt-facing whenever a selected entity carries material pressure. The active compiler contract is narrower: only a selected non-person ENTITY can render that description in the material-pressure section, and a person ENTITY does not gain that prompt lane merely by being selected or named as offstage pressure. The current help therefore invites authors to invest in text the prose prompt will omit.

## Product rule

Field help must distinguish non-person material-pressure description from person identity/offstage selection. It must explain that a pressure-only offstage person can remain ENTITY-first, with current local pressure authored in the Generation Brief, and that a CAST dossier is an explicit later deepening choice rather than a prerequisite.

## Scope

Correct person versus non-person `ENTITY.short_description` help, retain the ENTITY-first offstage route, and pin the existing compiler inclusion/exclusion behavior with focused regressions. Affected surfaces are the `packages/core` story-record field-guidance registry and pressure-compiler regression coverage, plus the `packages/web` record-editor field-help rendering and component coverage. Active authorities and skills remain unchanged.

## Final acceptance criteria

- A person ENTITY's short-description help states that this field does not compile into the material-pressure lane merely because the ENTITY is selected or referenced offstage.
- A non-person ENTITY's help states the existing selection and material-pressure eligibility accurately.
- The help does not imply that every offstage person needs a CAST dossier; it identifies the Generation Brief as the current local-pressure surface and CAST as optional durable deepening.
- No record schema, stored payload, selection rule, prompt section, prompt bytes, fingerprint, provider boundary, or migration changes.
- Core field-guidance coverage, record-editor component coverage, and compiler positive/negative cases prove the text and unchanged eligibility.
- Existing ENTITY Create/Edit field help remains the entry point; person and non-person help states name the actual prompt outcome before save.
- Prompt Preview bytes and freshness remain unchanged, with explicit positive non-person and negative person compiler assertions.
- Keyboard and accessible-description coverage verifies the person and non-person editor states.

## Preservation and testing

Preserve F002 and F006: ENTITY-first offstage pressure, the offstage boundary, and the absence of automatic CAST promotion. Use the existing field-guidance registry coverage, `RecordEditor` help behavior, and positive non-person/negative person cases in `compiler-pressure-sections`.

## Out of scope

Compiling person ENTITY descriptions, duplicating active CAST authority, changing `roles_in_story`, auto-creating CAST records, changing validation readiness, persistence, migration, export, provenance, or the user-initiated external-model boundary.

## Source and coordination

Temporary source summarized, not cited: the local Ash at Low Water playtest report and evidence are not publication-ref-visible.

This is a standalone non-PRD follow-up. It neither ratifies nor implements any remaining PRD candidate; the source prep has no remaining PRD candidate. Parent disposition: N/A.
```

### ISSUE_F003 — `Required-list marker clarification`

Labels: `bug`, `ready-for-agent`

```markdown
## Problem

Generic record editors mark structurally required list properties with the same star used for scalar values, even when the schema lawfully accepts an empty list. In the source run, starred `roles_in_story` and CAST list fields looked incomplete despite saving as empty. The ambiguity makes authors invent content to satisfy a requirement that does not exist.

## Product rule

Requiredness guidance must distinguish “the property is structurally present” from “the list needs at least one item.” Every list field that accepts zero items says so; any list with a true minimum says the minimum. Existing schemas, defaults, validation, and prompt behavior remain authoritative.

## Scope

Add adjacent accessible item-count guidance for structurally required lists, preserve true minimums where present, and prove unchanged empty-array persistence in both editor families. Affected surfaces are `packages/core` editor descriptors and list-schema metadata, `packages/web` field help plus generic and CAST record editors, and component, descriptor, and serialization tests. Active docs and skills remain unchanged.

## Final acceptance criteria

- The visible requiredness convention explains the structural meaning of a star for collection fields.
- `ENTITY.roles_in_story` and the required CAST core lists that accept `[]` expose an adjacent, accessible “may be empty” meaning without fabricated default values.
- A collection with a nonzero minimum, if present in the descriptor registry, does not receive the empty-list message and exposes its real minimum instead.
- Empty arrays continue to save and round-trip exactly; no array minimum, record payload, compiler rule, export shape, or migration changes.
- Generic Record Editor and CAST Editor component tests cover empty lawful lists, accessible names/descriptions, add/remove behavior, save, reload, and a nonempty-control case.
- Existing generic and CAST Create/Edit labels and help remain available; empty-lawful, item-present, and true-minimum states have distinct visible wording.
- Keyboard and screen-reader descriptions cover add/remove, save, and reload behavior across both editor families.

## Preservation and testing

Preserve F002: the low-friction ENTITY-first path remains lawful without fabricated role or dossier content. Use existing editor-descriptor parsing plus `FieldHelp`, `RecordEditor`, and `CastMemberEditor` component save/reload behavior for list fields.

## Out of scope

Requiring role tags, changing CAST dossier completeness, changing field stars for scalar values, adding backwards-compatibility fields, changing prompt input or compile rules, or creating prose-derived authority.

## Source and coordination

Temporary source summarized, not cited: the local Ash at Low Water playtest report and evidence are not publication-ref-visible.

This is a standalone non-PRD follow-up. It neither ratifies nor implements any remaining PRD candidate; the source prep has no remaining PRD candidate. Parent disposition: N/A.
```

### ISSUE_F005 — `Structured-pressure warning copy correction`

Labels: `bug`, `ready-for-agent`

```markdown
## Problem

The diagnostic correctly detects that no active CLOCK, OBLIGATION, or OPEN THREAD record is selected, but its readiness title says local pressure may be under-specified and its fastest action tells the author to select a pressure record. That framing contradicts the active warning recipe, which says a manually sufficient local unit can proceed without any of those record types.

## Product rule

The warning describes the absence of structured clock/obligation/thread pressure and offers record selection as an optional strengthening action. It never judges manual pressure insufficient merely from that absence. Detection, code, warning severity, readiness, and provider gating remain unchanged.

## Scope

Replace the warning title, summary, and fastest-fix language with neutral structured-pressure absence and optional-strengthening copy across Generation Brief, Prompt Preview, and Generate. Affected surfaces are the `packages/core` readiness-copy mapping and warning-contract tests and the `packages/web` shared readiness rendering. The active validation inventory and demo recipes already state the correct behavior and require no rule change.

## Final acceptance criteria

- Warning title, summary, and next action consistently say that no structured clock, obligation, or open thread is selected.
- Copy says generation can proceed and selection is optional when the author's local directive/current state already supplies enough pressure.
- The existing diagnostic fires for the same deterministic fixture, remains warning-only, and disappears under the same existing structured-record condition.
- Generation Brief, Prompt Preview, and Generate render the same corrected warning family without changing availability or provider-call behavior.
- No heuristic scans free-form prose, no additional suppressor is introduced, and no validation-inventory code or record schema changes.
- The warning's target, optional action, and natural clearing condition are explicit and keyboard-accessible on all three pages.
- Preview bytes, freshness, persistence, migration, export, provenance, and the Generate-only provider boundary remain unchanged.

## Preservation and testing

Preserve F002 and F006: sufficient author-authored local/offstage pressure and the warning-only path without manufacturing an onstage escalation. Use existing `validation-warnings-security`, readiness-copy, and `readiness-cross-page` suites to prove the same predicate, severity, action family, and three-page rendering.

## Out of scope

Inferring pressure quality from prose, making a pressure record mandatory, broadening the diagnostic predicate, changing readiness severity, or deriving validation authority from free-form text.

## Source and coordination

Temporary source summarized, not cited: the local Ash at Low Water playtest report and evidence are not publication-ref-visible.

This is a standalone non-PRD follow-up. It neither ratifies nor implements any remaining PRD candidate; the source prep has no remaining PRD candidate. Parent disposition: N/A.
```

### ISSUE_F009 — `Linked CAST creation and activation handoff`

Labels: `enhancement`, `ready-for-agent`

```markdown
## Problem

The global CAST creation flow explains and recovers from a missing ENTITY, and Working Set rows show linked human names. An author starting from an existing active person ENTITY still lacks a direct linked-dossier action. After a successful CAST save, the browser returns to records without presenting the remaining explicit activation steps, forcing repeated navigation and record matching.

## Product rule

An eligible person ENTITY detail offers one direct action to create its linked CAST dossier with that ENTITY relationship preselected. If a current linked CAST already exists, the detail opens that dossier rather than inviting a duplicate. After successful creation, the browser presents explicit next actions to add the new dossier to the Active Working Set or open that surface; membership and cast-band assignment occur only through user actions and band choice remains manual.

## Scope

Add truthful create/open linked-CAST actions on eligible ENTITY detail, relationship preselection without a write, save-state recovery, and an explicit post-save add/open handoff while reusing existing record and membership APIs. Affected surfaces are the `packages/web` Records Browser, CAST editor, Active Working Set, navigation, and API-client state; existing `packages/server` record/reference and working-set routes plus persistence tests; `docs/user-guide.md`; and browser, component, server-route, and accessibility coverage. No compiler, schema, or storage-authority change is included.

## Final acceptance criteria

- An active, unarchived person ENTITY with no current linked CAST exposes an accessible `Create linked CAST MEMBER` action; non-person and archived ENTITY states do not falsely expose it.
- Invoking the action opens the existing CAST editor with the known ENTITY relationship visibly preselected but makes no write before `Create Record`.
- An ENTITY with a current linked CAST exposes `Open linked CAST MEMBER` and does not encourage a duplicate; missing or archived-link states receive truthful recovery copy.
- Failed CAST save retains all authored dossier values and the originating ENTITY relationship for correction and retry.
- Successful save confirms the linked human identity and offers explicit `Add to Active Working Set` and `Open Active Working Set` actions. No membership write occurs until the author activates the add action.
- Add failure remains visible and retryable. Successful add selects only the saved CAST record and does not assign a cast band, local function, or prompt role automatically.
- Prompt Preview contents and freshness change only after the same existing explicit selection and band operations; record creation alone does not silently alter what compiles.
- Records-browser, CAST editor, Working Set, persistence, and accessibility tests cover create, existing-link, archived/missing-link, save failure, add failure, explicit success, keyboard focus, and reload.
- Relationship preselection comes only from the durable selected ENTITY; only explicit Create and Add actions write existing record/membership shapes.

## Preservation and testing

Preserve F002, F007, and F010: optional ENTITY-first deepening, explicit durable writes and canon boundaries, and complete active/onstage CAST compilation without automatic activation. Extend existing `RecordBrowser`, `CastMemberEditor`, `WorkingSetView`, record-route, and working-set-route coverage with one browser-level create-to-explicit-add journey.

## Out of scope

Mandatory CAST for offstage pressure, automatic dossier creation, automatic working-set membership, inferred cast bands, prose-derived fields, schema migration, compiler change, or reopening `#103` or `#111`.

## Source and coordination

Temporary source summarized, not cited: the local Ash at Low Water playtest report and evidence are not publication-ref-visible.

Closed `#103` owns missing-ENTITY prerequisite guidance and closed `#111` owns linked names in Working Set rows; neither owns this direct create/open and explicit activation handoff.

This is a standalone non-PRD follow-up. It neither ratifies nor implements any remaining PRD candidate; the source prep has no remaining PRD candidate. Parent disposition: N/A.
```

## Serial publication and exact-read run sheet

For each row below, the real workflow performs the guard, create, readback, and verification before advancing. The simulation records the required operations but leaves result slots unresolved.

| Seq. | Source | Exact-title guard | Create | Required exact readback |
| ---: | --- | --- | --- | --- |
| 1 | F004 | Search exact title `ENTITY prompt-eligibility guidance correction`; intake result: none | Create from frozen F004 body with exact labels; store response in `ISSUE_F004` | Fetch returned number; require `OPEN`, exact title, exact body, labels exactly `bug, ready-for-agent`, repository URL, and both source-and-coordination statements |
| 2 | F003 | Search exact title `Required-list marker clarification`; intake result: none | Create from frozen F003 body with exact labels; store response in `ISSUE_F003` | Fetch returned number; require `OPEN`, exact title, exact body, labels exactly `bug, ready-for-agent`, repository URL, and both source-and-coordination statements |
| 3 | F005 | Search exact title `Structured-pressure warning copy correction`; intake result: none | Create from frozen F005 body with exact labels; store response in `ISSUE_F005` | Fetch returned number; require `OPEN`, exact title, exact body, labels exactly `bug, ready-for-agent`, repository URL, and both source-and-coordination statements |
| 4 | F009 | Search exact title `Linked CAST creation and activation handoff`; intake result: none | Create from frozen F009 body with exact labels; store response in `ISSUE_F009` | Fetch returned number; require `OPEN`, exact title, exact body, labels exactly `enhancement, ready-for-agent`, repository URL, and both source-and-coordination statements |

On an ambiguous create, failed read, title/body mismatch, state mismatch, or label mismatch: stop immediately; exact-title search the attempted title; reconcile whether a unique issue was created; never retry until that identity is known. No relabel, reopen, comment, close, or mutation of `#100`, `#103`, `#109`, `#110`, `#111`, or `#112` is authorized.

After all four per-issue verifiers pass, the family verifier must require exactly four unique new open issues, preserve the serial order, prove all four exact titles and label sets, prove no parent, prove the standalone/non-PRD and summarized-not-cited statements in every body, and prove that no issue claims to ratify a PRD. Only then may the four result slots be written into custody as `published` with `verifierStatus: verified`.

## Post-readback custody ledger manifest

The following is the ledger state to freeze only after the four exact readbacks and family verifier succeed. Symbolic issue fields must be replaced from those reads before validation; they are not valid final receipt values.

```json
{
  "schemaVersion": 1,
  "prepArtifact": "reports/skill-evidence/playtest-to-issues/decontamination/dec_6b2af119-703e-49fe-b2f5-182c0989a060/corpus/task-07-ash-prepublication-approved/input-prd-prep.md",
  "prepSha256": "efaa1cb712057fac891d853d6ad0d6e592276d2942c078b4dd2683634115b5fe",
  "firstOperationalAction": {
    "value": "publish the four bounded ticket candidates after exact-title duplicate readback, preserving their explicit-write and no-schema-change constraints",
    "status": "satisfied",
    "evidence": "ISSUE_F004, ISSUE_F003, ISSUE_F005, and ISSUE_F009 were serially created, exact-read, and passed the four-issue family verifier."
  },
  "nonPrd": [
    {
      "item": "F004",
      "disposition": "published",
      "issueNumber": "{{ISSUE_F004.number}}",
      "issueUrl": "{{ISSUE_F004.url}}",
      "liveState": "OPEN",
      "labels": ["bug", "ready-for-agent"],
      "verifierStatus": "verified",
      "evidence": "Exact staged/published body and metadata verifier passed; the family verifier included F004."
    },
    {
      "item": "F003",
      "disposition": "published",
      "issueNumber": "{{ISSUE_F003.number}}",
      "issueUrl": "{{ISSUE_F003.url}}",
      "liveState": "OPEN",
      "labels": ["bug", "ready-for-agent"],
      "verifierStatus": "verified",
      "evidence": "Exact staged/published body and metadata verifier passed; the family verifier included F003."
    },
    {
      "item": "F005",
      "disposition": "published",
      "issueNumber": "{{ISSUE_F005.number}}",
      "issueUrl": "{{ISSUE_F005.url}}",
      "liveState": "OPEN",
      "labels": ["bug", "ready-for-agent"],
      "verifierStatus": "verified",
      "evidence": "Exact staged/published body and metadata verifier passed; the family verifier included F005."
    },
    {
      "item": "F009",
      "disposition": "published",
      "issueNumber": "{{ISSUE_F009.number}}",
      "issueUrl": "{{ISSUE_F009.url}}",
      "liveState": "OPEN",
      "labels": ["enhancement", "ready-for-agent"],
      "verifierStatus": "verified",
      "evidence": "Exact staged/published body and metadata verifier passed; the family verifier included F009 without reopening #103 or #111."
    },
    {
      "item": "Playtest methodology pilots",
      "disposition": "routed",
      "route": "$skill-audit \".claude/skills/playtest\"",
      "evidence": "The prep assigns the Paired-Draw Check, Independent Claim Challenge, and deferred first-view witness to a report-only playtest skill audit; the route is ownership, not execution or a direct skill edit."
    },
    {
      "item": "F010",
      "disposition": "no-create",
      "reason": "One accepted segment supplies no repeatable evidence of an author-visible product gap, so product issue creation remains premature until a continuation playtest measures repayment.",
      "evidence": "The source found all 22 populated CAST scalar fields in deterministic prompt output but did not test a later local unit; a future continuation must measure interaction count, correction burden, deterministic reuse, cold-context quality, and boundary preservation."
    }
  ],
  "prds": []
}
```

The route row is not an instruction to execute or edit the playtest skill during this custody pass. Before a real ledger freeze, the workflow's route-contract gate must exact-read the current owning skill and record that its trigger and report-only invocation remain compatible; this analysis-only corpus does not substitute a fabricated live contract read.

## Receipt execution manifest

No passing custody receipt is claimed in this simulation because no GitHub issue was actually created or exact-read. After a real run resolves all four result slots, completes the route-contract check, and validates the frozen ledger, it must:

1. Capture the final branch and exact full-worktree status.
2. Run the custody validator against the unchanged prep bytes and fully resolved ledger.
3. Render—not hand-format—the `## Playtest Follow-Up Custody Receipt` from those exact inputs.
4. Require `Non-PRD custody: 6/6`, the first action status `satisfied`, four verified `published` rows, one exact `routed` row, one evidence-backed `no-create` row, `PRD queue: exhausted`, and `Next PRD action: none - PRD queue exhausted`.
5. Remove every temporary body, run sheet, family manifest, publication ledger, custody ledger, and snapshot; prove absence; recapture branch and full-worktree status; emit the captured renderer output only if those final values still match.

Until those steps occur, the content above is an exact execution manifest with unresolved result slots, not evidence that publication or custody completion happened.

## Residual PRD queue

`[]`

PRD queue: exhausted. Next PRD action: none.
