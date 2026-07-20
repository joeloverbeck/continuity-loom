# Analysis-only publication simulation: Ash at Low Water

## Frozen intake

- Fixture bytes stand in for `reports/playtest-ash-at-low-water-2026-07-19T102650Z-prd-prep.md`; no prep rewrite or migration is authorized.
- Prep SHA-256: `efaa1cb712057fac891d853d6ad0d6e592276d2942c078b4dd2683634115b5fe`.
- Tracker truth is the supplied snapshot. It proves `bug`, `enhancement`, and `ready-for-agent` exist and contains no exact-title match for any of the four approved tickets. Closed issues #100, #103, and #111 are related but narrower owners, not duplicates.
- Approved target order is source order. All four tickets are independent and have no tracker or external blocker.

| Item | Approved title | Labels | AC count | Checklist |
| --- | --- | --- | ---: | --- |
| F004 | ENTITY prompt-eligibility guidance correction | `bug`, `ready-for-agent` | 5 | all eight supplied browser-visible components mapped |
| F003 | Required-list marker clarification | `bug`, `ready-for-agent` | 5 | all eight supplied browser-visible components mapped |
| F005 | Structured-pressure warning copy correction | `bug`, `ready-for-agent` | 5 | all eight supplied browser-visible components mapped |
| F009 | Linked CAST creation and activation handoff | `enhancement`, `ready-for-agent` | 8 | all eight supplied browser-visible components mapped |

Prefactoring: none; each approved packet is already a complete, independently verifiable slice.

## Frozen publication posture

- Decision scan: supplied prep; the no-schema-change, no-auto-write, warning-only, and optional-CAST decisions are closed by the packets and the user's approval.
- Source relationship: artifact-source mode, with no tracker parent.
- Parent disposition: N/A; no parent ledger or parent mutation.
- Source/target: the playtest report below would source exactly the four tickets above.
- Prerequisites: no issue dependency; artifact durability is a hard prepublication gate.
- Publication: serial in the table order, with the frozen labels; every returned issue must be exact-read before the next create.
- Artifacts: `origin/main` is the shared publication ref. The primary report and all three dependencies are local-only/not ref-visible at intake; the prep is separately untracked and must not be cited.
- Coverage: the prep has findings rather than user stories, so story coverage is N/A; each final body must preserve its supplied eight-component browser-visible mapping.

```json
{
  "artifactSource": {
    "path": "reports/playtest-ash-at-low-water-2026-07-19T102650Z.md",
    "dependencies": [
      "reports/assets/playtest-ash-at-low-water-2026-07-19T102650Z/accepted-segment-reminder.png",
      "reports/assets/playtest-ash-at-low-water-2026-07-19T102650Z/iven-active-working-set.png",
      "reports/assets/playtest-ash-at-low-water-2026-07-19T102650Z/iven-linked-cast-created.png"
    ],
    "token": "Playtest report reports/playtest-ash-at-low-water-2026-07-19T102650Z.md",
    "relationship": "Standalone non-PRD follow-up from the playtest report; it neither ratifies nor implements remaining PRD candidates.",
    "publicationRef": "origin/main"
  }
}
```

## Publication/readback manifest

The approved issue set is not publishable at this frontier. Artifact-source mode requires the primary report and every declared dependency to be tracked, clean, visible, and content-identical at the same publication ref. The supplied intake says they are not. The approval covers the four issue creations and custody plan, not publication of those four exact local paths. The workflow therefore must not stage bodies, create issues, or claim readback success.

```json
{
  "approvedCount": 4,
  "createdCount": 0,
  "exactTitleGuards": {
    "ENTITY prompt-eligibility guidance correction": 0,
    "Required-list marker clarification": 0,
    "Structured-pressure warning copy correction": 0,
    "Linked CAST creation and activation handoff": 0
  },
  "workingPublicationLedger": [
    {"slice":"ENTITY prompt-eligibility guidance correction","acceptanceCount":5,"blockedBySlices":[],"number":null,"url":null,"verifierStatus":null},
    {"slice":"Required-list marker clarification","acceptanceCount":5,"blockedBySlices":[],"number":null,"url":null,"verifierStatus":null},
    {"slice":"Structured-pressure warning copy correction","acceptanceCount":5,"blockedBySlices":[],"number":null,"url":null,"verifierStatus":null},
    {"slice":"Linked CAST creation and activation handoff","acceptanceCount":8,"blockedBySlices":[],"number":null,"url":null,"verifierStatus":null}
  ],
  "singleIssueReadbacks": [],
  "familyVerification": "not run; no lawful creation frontier",
  "requiredResumeGate": "obtain explicit authorization for the exact primary report and three dependency paths, publish them, verify all four paths at origin/main, then rerun all four exact-title guards before staging"
}
```

No issue numbers or URLs are predicted. After the resume gate passes, each body must carry the exact artifact token and relationship above, `None - can start immediately`, its frozen AC count and label set, and the supplied acceptance/checklist mapping. Creation must remain serial; each returned number, URL, open state, exact labels, full body, zero-blocker posture, source relationship, placeholder/path sweep, and AC count must be verified before ledger advancement. Final family verification must consume the completed working ledger and recheck artifact durability.

## Non-PRD custody ledger

The stale `$skill-audit` destination is not a valid current route. No current `skill-audit` skill exists. `$skill-evolution` is evidence-gated and may land changes, so it does not accept the requested report-only pilot review; `$legacy-skill-decontamination` owns one-time retired-audit accretion, not pilot disposition. The methodology row therefore remains blocked pending an explicit current owner or direct `keep`, `revise`, or `retire` decision.

F010 can route to `$playtest "reports/playtest-ash-at-low-water-2026-07-19T102650Z.md"`: the current skill accepts a supplied prior report for one continuation segment and the requested later-dossier measurement, while leaving product issue creation unowned until evidence exists.

```json
{
  "schemaVersion": 1,
  "prepArtifact": "reports/playtest-ash-at-low-water-2026-07-19T102650Z-prd-prep.md",
  "prepSha256": "efaa1cb712057fac891d853d6ad0d6e592276d2942c078b4dd2683634115b5fe",
  "firstOperationalAction": {
    "value": "publish the four bounded ticket candidates after exact-title duplicate readback, preserving their explicit-write and no-schema-change constraints",
    "status": "blocked",
    "evidence": "All four exact-title guards are empty and publication is approved, but the mandatory artifact-source primary and dependencies are not durable at origin/main and their publication was not explicitly authorized."
  },
  "nonPrd": [
    {"item":"F004","disposition":"blocked","reason":"artifact-source durability gate failed","evidence":"No exact-title owner exists; approved creation cannot start until the report and all dependencies are durable at origin/main."},
    {"item":"F003","disposition":"blocked","reason":"artifact-source durability gate failed","evidence":"No exact-title owner exists; approved creation cannot start until the report and all dependencies are durable at origin/main."},
    {"item":"F005","disposition":"blocked","reason":"artifact-source durability gate failed","evidence":"No exact-title owner exists; approved creation cannot start until the report and all dependencies are durable at origin/main."},
    {"item":"F009","disposition":"blocked","reason":"artifact-source durability gate failed","evidence":"Closed #103 and #111 are narrower; approved creation cannot start until the report and all dependencies are durable at origin/main."},
    {"item":"Playtest methodology pilots","disposition":"blocked","reason":"the named $skill-audit route is retired and no compatible current report-only owner was supplied","evidence":"Current route validation found no skill-audit; skill-evolution and legacy-skill-decontamination reject this ownership shape."},
    {"item":"F010","disposition":"routed","route":"$playtest \"reports/playtest-ash-at-low-water-2026-07-19T102650Z.md\"","evidence":"The current playtest trigger accepts continuation from a supplied report through one accepted segment and supports the requested future continuation evidence without preauthorizing a product issue."}
  ],
  "prds": []
}
```

Structural ledger validation would pass, but custody would be incomplete: 1/6 non-PRD rows resolved, five blocked rows, the first action blocked, and zero PRD candidates. The required renderer is `render-blocked-receipt`, after capturing the real final branch/worktree and proving temporary publication artifacts absent. It must report `PRD queue: blocked - 0 remaining candidates` and `Next PRD action: blocked - resolve follow-up custody first`; a passing receipt and `/to-prd` handoff are forbidden.

## Residual PRD queue

`[]` — empty, but not releasable while custody is blocked.
