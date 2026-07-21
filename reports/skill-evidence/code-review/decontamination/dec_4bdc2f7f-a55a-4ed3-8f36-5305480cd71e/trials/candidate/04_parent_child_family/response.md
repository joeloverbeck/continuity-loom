# Spec reviewer dispatch requirements

This packet is prepared but is not dispatchable until the caller supplies a fixed point. The review frame must record the fixed-point input, its resolved SHA, the reviewed `HEAD` SHA, `git diff <resolved-fixed-point-sha>...HEAD`, `git log <resolved-fixed-point-sha>..HEAD --oneline`, and `git status --short` with the included and excluded worktree scope. The intended diff must be non-empty.

`Pre-dispatch Spec source inventory: issue #200 from review-inputs/issues.json | issue #201 from review-inputs/issues.json | issue #202 from review-inputs/issues.json`

The packet must include the exact contents for all three issues from `review-inputs/issues.json`, not a retrospective summary. It must separately identify `review-inputs/manifest.json` as the acceptance manifest and verify that its exact issue keys are #200, #201, and #202. It must also include the resolved diff command, commit list, and any applicable WIP diff inputs.

The Spec reviewer must report missing or partial requirements, scope creep, and incorrect implementations, quoting the acceptance source for each finding. Narrative prose is limited to 400 words, excluding the mandatory tables and ledgers below.

The reviewer may return zero residuals only after filling this issue table with concrete evidence from the reviewed tree:

| Issue | Acceptance source | Evidence reviewed | Findings/residuals |
|---|---|---|---|
| #200 | Exact parent issue in `review-inputs/issues.json`: parent solution, decisions, principles, child map, US1 authors can inspect provenance, and US2 authors can export provenance | Evidence for every parent ledger row below plus the #201 and #202 child rows | State findings, or `none`; sequence: US1 uses accept segment -> provenance persists -> report renders it, observed by integration test `provenance-flow`; US2 is N/A for ordering because its export acceptance is not order-sensitive |
| #201 | Exact child issue in `review-inputs/issues.json`: provenance atoms `actor`, `timestamp`, and `flow step`; proof surfaces API and rendered report | Evidence that independently proves all three atoms on both required surfaces, including the production report route | State findings, or `none`; sequence: accept segment -> provenance persists -> report renders it, observed by integration test `provenance-flow` |
| #202 | Exact child issue in `review-inputs/issues.json`: export JSON and download UI | Evidence for JSON export and for the production-route download action path | State findings, or `none`; sequence: N/A because #202 makes order non-acceptance-sensitive, while both required surfaces must still be proved independently |

Parent acceptance must additionally remain keyed rather than being collapsed into the issue row:

| Parent key | Acceptance source | Required evidence disposition |
|---|---|---|
| Solution | #200 exact issue body | Quote the solution and map it to reviewed evidence |
| Decisions | #200 exact issue body | Enumerate each decision and map it to reviewed evidence |
| Principles | #200 exact issue body and every authority it routes to | Enumerate each principle and map it to reviewed evidence |
| Child map | #200 exact issue body and `review-inputs/manifest.json` | Show #201 and #202 individually; do not replace them with a range or family summary |
| US1 | #200: authors can inspect provenance | Map to #201's atoms, API/report surfaces, and ordered `provenance-flow` proof |
| US2 | #200: authors can export provenance | Map to #202's export JSON and download UI proof; sequence N/A because order is not acceptance-sensitive |

#201's composite term must be atomized into `actor`, `timestamp`, and `flow step`, and each atom must be checked on both API and rendered-report proof surfaces. #202's two acceptance surfaces must likewise be checked independently.

Because the changes cover a rendered report and a download UI, `no browser/manual evidence` cannot be accepted silently. The reviewer must challenge that N/A disposition and verify the production route and real report/download action path using concrete evidence. If the supplied integration or other automated evidence does not exercise those production surfaces, the reviewer must report a proof residual or blocker rather than zero findings. Repository-local evidence for an adjacent or inactive component is insufficient.

A zero-residual response is rejected if it omits the per-issue table, any parent ledger row, an individual user story, a named atom or proof surface, or a sequence disposition. Request completion from the reviewer; if completion cannot be obtained, switch the entire review to local fallback rather than synthesizing a normal reviewer result.

Reviewer custody must record both reviewer IDs and terminal statuses. On the stated normal path, record `Review recovery: none`, then either close both reviewers or use `close operation unavailable after terminal completion` with cleanup proof that each named reviewer completed and no close capability surfaced.

# No-fix implementation handoff

The durable sink is `review-body.md`. It must retain, rather than merely link to, all of the following:

- the complete pinned review frame and worktree scope;
- visible `## Standards` and `## Spec` sections, each stating initial finding count `0`, worst severity `none`, and findings `none`;
- both reviewer IDs/statuses, `Review recovery: none`, cleanup dispositions, and cleanup proof;
- the exact pre-dispatch inventories and exact, entry-for-entry `Handoff Standards source inventory:` and `Handoff Spec source inventory:` copies;
- the three-row issue coverage table and six-row parent keyed ledger above, completed with concrete reviewed evidence;
- per-axis summaries and `Residual findings: none`;
- named verification that passed on the reviewed final tree and one closeout-ready evidence line.

Because no browser/manual evidence was used, the handoff must say exactly:

`Browser/manual evidence freshness: N/A because no browser/manual evidence was used.`

`Browser/manual console state: N/A because no browser/manual evidence was used.`

`Backend process currentness: N/A because no browser/manual evidence was used.`

It must also contain one complete `Evidence identity refresh:` block. The current packet inventory must give the actual paths and hashes for `review-inputs/issues.json` and `review-inputs/manifest.json`; active revisions must give the resolved fixed-point and reviewed-HEAD identities; and artifacts must include the durable evidence identity for `review-body.md`. Browser sessions and fixtures may be `none` only if that is true of the actual run. With no fixes or evidence reruns, historical red identities may be `none`, every superseded category may be `none`, and the sweep may say `N/A because every superseded category is none`. The omitted hashes and revision IDs must be measured from the run, not invented.

No verification rerun is required merely for handoff when no files changed after review, but `review-body.md` must name the gates that passed on the unchanged reviewed tree. `provenance-flow` is the only named gate supplied here; any other gate used to justify the zero-finding result must be copied from the actual review evidence.

Validate the completed body with the applicable no-fix flags (and no `--immediate-fix`, `--browser`, `--tdd`, `--tdd-parent-rollup`, or `--issue-set` flag):

```bash
node .claude/skills/code-review/scripts/validate-review-normal-body.mjs review-body.md --parent-prd --child-family --closing --acceptance-manifest review-inputs/manifest.json
```

After validation, the caller line must use this exact shape:

`Review: code-review against the recorded fixed-point input; outcome no findings; verification rerun no rerun was needed because the unchanged reviewed tree already passed the named gates recorded in review-body.md.`

That line is not yet truthfully publishable from the supplied facts: the fixed-point input and SHA, reviewed `HEAD`, reviewer identities/cleanup proof, packet hashes, complete concrete evidence cells, and all named final-tree gates were not supplied. Those values must be copied from the actual run. In addition, the claimed zero-finding Spec result remains acceptable only if its response contains the required tables and proves the production report and download action paths despite browser/manual N/A; otherwise the response must be completed or the review reclassified as fallback.
