# Spec reviewer dispatch requirements

Pre-dispatch Spec source inventory: issue #200 | issue #201 | issue #202

Dispatch the resolved three-dot diff command, commit list, and the exact saved contents of all three issues. The dispatch must state that `review-inputs/issues.json` is the saved exact issue source and that `review-inputs/manifest.json` contains #200, #201, and #202. The manifest is the coverage-validation input; it does not replace the concrete issue inventory above.

Require the Spec reviewer to return the following coverage shape. The reviewer must replace each proof instruction with the exact diff hunk, test, report, or production-route evidence actually inspected; broad labels such as “parent PRD coverage,” “provenance,” or “UI covered” are insufficient.

| Issue | Acceptance source | Evidence reviewed | Findings/residuals |
|---|---|---|---|
| #200 | #200-US1: authors can inspect provenance; resolve provenance as `actor` + `timestamp` + `flow step`, with proof on API + rendered report; sequence: accept segment -> provenance persists -> report renders it, with the order observed by integration test `provenance-flow` | Cite the exact #201 implementation hunks and `provenance-flow` assertions that prove every atom, both surfaces, and the transition order | Reviewer fills after exact-acceptance challenge |
| #200 | #200-US2: authors can export provenance; resolve this through #202 as export JSON + download UI; sequence: N/A because #202 says order is not acceptance-sensitive | Cite the exact export implementation and the proof for the production download action path | Reviewer fills after exact-acceptance challenge |
| #200 | Parent closeout authority: solution; implementation decisions; testing decisions; Principles; child map #201 + #202; sequence: N/A because this row audits authority and child coverage rather than a runtime transition | Cite exact same-sink audit rows for all five parent areas, or review and record each area directly here | Reviewer fills after exact-acceptance challenge |
| #201 | Provenance atoms: `actor` + `timestamp` + `flow step`; required proof surfaces: API + rendered report; sequence: accept segment -> provenance persists -> report renders it, observed in order by integration test `provenance-flow` | Cite exact API and rendered-report hunks plus the assertions in `provenance-flow` for all atoms, both surfaces, and the order | Reviewer fills after exact-acceptance challenge |
| #202 | Required items: export JSON + download UI; verify the production route and download action path the author actually reaches; sequence: N/A because the issue states order is not acceptance-sensitive | Cite exact export JSON proof and exact production-route download-UI/action proof | Reviewer fills after exact-acceptance challenge |

The dispatch brief is: report missing or partial requirements, unrequested behavior, and apparently implemented but incorrect behavior; quote the governing issue text for every finding. Before returning zero residual Spec findings, perform the exact-acceptance challenge for every row. The zero-result output gate rejects a response that omits the per-issue table, either individual #200 user-story row, the parent authority row (or its exact same-sink audit citation), the #201 atom/surface expansion, or any sequence disposition.

The no-browser fact needs an explicit challenge. #202 requires a download UI, so the reviewer must verify the production route and user action path. “No browser/manual evidence was used” cannot itself prove that requirement or justify N/A. If the reviewer cannot cite exact permitted proof of the active route and download action, the Spec axis must report a residual finding rather than zero findings. The same exactness applies to #201's rendered-report surface.

# No-fix implementation handoff

The source-preservation fields are:

- Pre-dispatch Spec source inventory: issue #200 | issue #201 | issue #202
- Handoff Spec source inventory: issue #200 | issue #201 | issue #202
- Parent PRD coverage: parent PRD row present, with individual #200-US1 and #200-US2 rows plus direct coverage of solution, implementation decisions, testing decisions, Principles, and child map #201 + #202
- Residual findings: none, but only after the Spec output gate and active-UI proof challenge above pass
- Axis summary: Standards 0/none, Spec 0/none, but only after that gate passes
- Browser/manual evidence freshness: N/A because no browser/manual evidence was used
- Browser/manual console state: N/A because no browser/manual evidence was used
- Backend process currentness: N/A because no browser/manual evidence was used
- Spec sequence coverage: carried by every coverage row above
- Evidence identity refresh: current fixture paths none; browser sessions none; packet paths/hashes none; active revisions must name the reviewed HEAD SHA from the review frame; artifacts none. Historical red identities retained: none. Superseded evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none. Superseded-token sweep: N/A because every superseded category is none.

The handoff must also copy the exact pre-dispatch Standards inventory unchanged into the Handoff Standards inventory, record both reviewer IDs with `completed` status, record `Review recovery: none`, and record an allowed cleanup disposition and proof for each reviewer. Normal completion alone is not cleanup proof. The supplied facts contain neither reviewer IDs, cleanup results, nor the Standards inventory, so those values must be copied from the actual review record rather than invented.

No verification rerun is needed merely because no files changed after review, but the handoff must name the final-tree gates that had already passed. Those gate names, the fixed-point input and resolved SHA, reviewed HEAD SHA, diff command, commit list, and worktree scope are also absent from the scenario. Consequently a closeout-ready `Review:` line cannot yet be truthfully emitted. Once those facts and the active-UI proof are present, its shape is:

`Review: code-review against the recorded fixed point; outcome no findings; verification rerun no rerun needed after review because the unchanged final tree already passed the named recorded gates.`

Validate the completed local sink with:

```bash
node .claude/skills/code-review/scripts/validate-review-normal-body.mjs review-body.md --parent-prd --child-family --acceptance-manifest review-inputs/manifest.json --closing
```

Do not add `--browser` because no browser/manual evidence was used, and do not add `--tdd-parent-rollup` because the parent-rollup compact TDD table is not in use. If the #202 production-route requirement cannot pass the exact-acceptance challenge without browser/manual evidence, obtain that evidence and then validate with `--browser`, or retain the Spec finding; do not publish a zero-finding handoff by treating the current no-browser fact as proof.
