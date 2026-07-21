No commands have been run and no files or tracker state have been changed. The issue number was not included in the input, so I use `ISSUE` below only as a planning label; execution would substitute the exact issue number before any command or evidence body is created.

## Plan

### 1. Establish exact scope before editing

1. Read the repository's root verification and change-authority guidance. Run the required initial worktree-status check and record every unrelated dirty path; those paths remain untouched and unstaged.
2. Fetch `ISSUE` by exact GitHub lookup, including number, title, state, body, comments, labels, close metadata, and URL. Save one canonical ordered JSON snapshot of its exact number/title/body with the repository capture helper. Comments remain a separate exact intake source when they add requirements or decisions.
3. Confirm that the issue is the sole requested implementation item. Classify any linked tracker item discovered in its body/comments as an enabling prerequisite, blocker, contextual backlog, intentionally excluded item, or not actually related. If a prerequisite blocks either acceptance criterion, add it to scope or leave `ISSUE` blocked; do not silently implement a reduced slice.
4. Because the issue contains `## Principles`, follow the repository-native authority route selected by `docs/ACTIVE-DOCS.md`: read the routed domain guidance, `CONTEXT.md` when present, applicable ADRs, and every authority named by the issue. Record either concrete alignment obligations or a deliberate, steward-approved exception. A contradiction is a stop, not an implementation detail.
5. Expand AC1, AC2, and the Principles check into authoritative atoms, proof surfaces, and any required event sequence. The given focused unit seam is the behavior proof surface. The issue has no UI impact, so browser/manual evidence is planned as N/A only after exact intake confirms that the browser contract, routes, rendered behavior, browser-consumed validation response, fixtures, and action path are unchanged. If exact intake disproves that premise, browser proof becomes required before editing.
6. Inventory any active spec, report, requirements set, or other completion artifact named by the issue and record its final disposition under repository authority. Record the existing server-validation seam's owning module and why the rule belongs there. If no helper, store/query function, persistence call, or cross-module entrypoint is added or moved, record ownership/placement as N/A; otherwise decide each placement before its first edit.
7. Post the visible scope ledger before editing:

   | Issue | Blockers | Acceptance | Principles | Evidence | Test seam | Status | Closeout comment |
   |---|---|---|---|---|---|---|---|
   | `ISSUE` | exact intake result | AC1 atoms/surfaces/sequence; AC2 atoms/surfaces/sequence | routed authorities and obligations | focused unit red/green plus canonical gates | named server-validation unit seam | planned | one issue comment with final evidence URL followed by verified close |

   The ledger will also state related-item classification, artifact disposition, and ownership/placement. The first-edit gate will then be posted with populated values: `Scope ledger posted: yes; no edits started; unrelated dirty files ...; in-scope issues ISSUE; related tracker classification ...; artifact disposition ...; ownership/placement decisions ....`

### 2. Implement at the one focused seam with TDD

1. Invoke the repository `tdd` workflow at the pre-agreed focused unit-test seam. Before the first red run, establish its durable pre-red ledger, acceptance atom map, acceptance sequence map, authority disposition, and the exact red assertion that should fail for the reported validation bug.
2. Start the durable verification-command ledger with the first command used as evidence. Every row will retain the exact command, output-derived result/counts, run count, and represented working tree or SHA. Unexpected setup or product failures remain separate rows rather than being rewritten as a clean run.
3. Add one focused regression test and prove the red is for the intended validation behavior, not a missing file, harness problem, or nearby assertion. Make the smallest production change in the existing server-validation owner, then rerun the identical focused test green and confirm the output shows the intended test file/seam actually ran. No existing test expectation will be rewritten unless the exact issue contract requires it; if it is, the required existing-contract-change TDD row will be added.
4. Run focused typechecking as appropriate, then the canonical root verification required by the input: lint, typecheck, full test suite, and build. Counts and results come only from those exact invocations.
5. Build the deterministic acceptance manifest from the saved issue JSON. Draft the working pre-close audit with three separately named rows: AC1, AC2, and Principles. Each satisfied Evidence cell will literally contain `atoms:`, `proof surfaces:`, and `sequence:`; a non-sequence-sensitive row will use a reasoned `sequence: N/A because ...`. Run the audit-only manifest validator in review-entry mode only after all three rows are truly `satisfied`.
6. Carry the full fielded TDD evidence into the durable audit, including pre-red recovery/reference, authority status, atom/sequence maps, the compact seam row, proof-server/browser N/A fields, existing-test contract-change disposition, evidence identities, and the complete `TDD evidence gate passed: durable sink ...` line. Because no review fix is expected, `TDD review-fix map` will say it is N/A because review created no TDD row changes.

Before staging, reconcile artifact disposition and rerun worktree status. Post the populated pre-stage gate:

`Implementation pre-stage gate passed: working pre-close audit drafted ...; blocked/not done rows none; artifact disposition ...; ownership/placement decisions ...; unrelated dirty files ....`

Stage only implementation-owned source/test (and any intentional SHA-independent tracked evidence) files. Inspect the staged file list, then post:

`Implementation commit gate passed: staged files scoped yes; staged file list ...; working pre-close audit ...; blocked/not done rows none; artifact disposition ....`

Create one implementation commit. Any tracked evidence in that commit remains SHA-independent; the final SHA, reviewed-HEAD identity, and terminal review result belong in the later uncommitted closeout body/tracker comment.

### 3. Review, final verification, and push

1. Invoke the repository `code-review` workflow against the resolved pre-implementation commit as the fixed point and the implementation commit as reviewed HEAD. Use the normal Standards and Spec axes, with the exact issue, AC1, AC2, Principles authorities, diff, test, and verification sources in the review frame.
2. Record the stipulated terminal outcome as normal review evidence, not fallback: `Review: code-review against <resolved fixed point>; outcome no findings; verification rerun <canonical commands>.` The closeout review record will include the fixed-point SHA, reviewed HEAD SHA, Standards/Spec sections, exact acceptance coverage, zero-count axis summary, reviewer/recovery/cleanup fields required by the normal-review contract, and no fallback or immediate-fix block.
3. Because review has no findings, keep the implementation commit unchanged as the final commit. Rerun the focused test and all canonical root gates against that final commit so every published verification-ledger row represents the final SHA.
4. Push the final commit to the intended remote branch, then prove that exact SHA is remote-reachable. The closeout body will therefore say the local-only-SHA field is N/A; it will not use a local-only exception.
5. Refresh evidence identities after terminal review even though there were no fixes. List every current, historical-red, and superseded category explicitly, using `none` where empty. If every superseded category is empty, record the permitted sweep N/A; otherwise run a token sweep naming each superseded value and retain the exact no-active-proof result.

### 4. Build and validate the single-issue closeout body

1. Freeze the closeout shape only after the final SHA, final verification, review, push reachability, and identity refresh are stable. This is one issue, not a sibling/child family, so no parent rollup, fixed-child flow, split core, or audit chunks apply.
2. Generate one manifest-backed closeout scaffold in a temporary external sink, inspect its byte/headroom plan, and fill it without unresolved placeholders. The publishable body will identify the stable GitHub issue as its sink, never its local staging path.
3. The body will contain:

   - final remote-reachable SHA;
   - the final-SHA verification command ledger with exact counts and run counts;
   - the full TDD closeout preflight, compact row, and fielded TDD gate;
   - normal fixed-point review evidence with no findings;
   - `Principles/ADR conformance: no deliberate exceptions.` unless exact intake established an approved exception;
   - browser route/action, console, backend-currentness, and freshness fields all N/A with the exact no-browser-impact rationale confirmed during intake;
   - current, historical-red, and superseded evidence identities plus the superseded-token sweep;
   - exactly one manifest-matched audit row for AC1, AC2, and Principles, all with literal status `satisfied` and non-circular atoms/proof-surfaces/sequence evidence;
   - child state and local-only-SHA fields as N/A.

4. Inspect the exact body in bounded excerpts, verify its size is below GitHub's limit, sweep unresolved angle-token placeholders, and visually confirm the audit columns, grouped criteria, evidence labels, and literal statuses. Run the applicable TDD validator, normal-review validator, and implement closing validator with the acceptance manifest, Principles flag, and expected final SHA. No browser, fallback, child-family, local-only, or immediate-fix flags apply.
5. Immediately before the first tracker mutation, re-read the tracker-closeout gates, refresh the issue's exact live state, and rerun the implement validator with `--emit-preflight --mutation-ready`. Copy its emitted `Closeout preflight:`, `Closeout gate passed: audit sink ...`, `Post-comment verification next: ...`, and mutation-ready confirmation verbatim into the conversation. Also post the populated closeout-body-check line after untruncated inspection. A successful closing validation without those mutation-ready flags is diagnostic only.

### 5. Mutate GitHub only after every gate passes

1. Post the inspected closeout body to `ISSUE` with the body-file mechanism and capture the returned comment URL.
2. Before closing, verify that exact stored GitHub comment against the local body byte-for-byte as UTF-8. A mismatch, transport failure, or malformed readback keeps closure blocked.
3. Close `ISSUE` as completed with a short inline comment containing the final SHA and the verified evidence-comment URL.
4. Exact-read the issue by number and confirm its final closed state/reason and URL. If a mutation's result is ambiguous, use read-only lookup before considering any replay; never duplicate a comment or close command merely because readback failed. If readback cannot be restored, report the tracker state as unverified rather than claiming completion.
5. Run final worktree status, confirm unrelated dirt stayed untouched, and account for every temporary/untracked verification artifact as retained evidence or safely removed after publication. No browser or dev process should exist for this work. The final report will give the implementation commit SHA, remote reachability, canonical verification results, review outcome, evidence-comment URL, exact GitHub closed-state readback, and final worktree/artifact disposition.
