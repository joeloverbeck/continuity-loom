This is the implementation and closeout plan only. I have not run any repository, test, Git, or tracker command.

1. Establish exact scope before editing.

   - Run the initial worktree check and record every pre-existing dirty path. Those paths remain untouched and unstaged unless exact issue intake makes one in scope.
   - Fetch the named issue by exact number with its full body, comments, title, state, labels, and URL. Save the canonical ordered issue-body JSON with the implement capture helper; use that same snapshot for the manifest, review, and closeout. Check explicit links and references for blockers or related tracker work, exact-view any candidates, and classify each as enabling, blocking, contextual, excluded, or unrelated. Do not infer relationships from search results alone.
   - Extract AC1 and AC2 verbatim. Expand any composite term into its authoritative atoms, proof surfaces, and sequence requirement. Inventory any active spec, report, or completion artifact named by the issue and decide whether it remains active, is marked complete, or is archived under repository authority.
   - Because the issue has a `## Principles` section, follow the repository authority route before coding: read the required root conformance guidance, `docs/ACTIVE-DOCS.md`, the active domain guidance, `CONTEXT.md` if present, relevant ADRs, every authority named by the issue, and `docs/principles/FOUNDATIONS.md` for this runtime validation change. Record concrete obligations or a steward-approved exception; stop rather than implement a contradiction.
   - Identify the existing server validation seam and its owning module. A new or moved helper, persistence call, or cross-module entrypoint requires an explicit ownership/placement decision; otherwise record ownership/placement as N/A because the fix stays within the existing validator seam.
   - Preflight the focused unit-test command. Per the supplied work contract, that is the sufficient behavior proof and there is no UI surface. Record browser/manual proof as N/A only with the exact basis that the issue is server-only and does not change UI, routes, rendered behavior, browser-consumed shapes/fixtures, or user action paths; if exact intake contradicts that basis, stop and add the required browser/API proof instead.

   Post this ledger before the first edit:

   | Issue | Blockers | Acceptance | Principles | Evidence | Test seam | Status | Closeout comment |
   |---|---|---|---|---|---|---|---|
   | issue number from intake | exact blockers or none | AC1 and AC2 verbatim, with atoms/surfaces/sequence expanded | named Principles/ADRs and conformance basis | focused unit test; canonical root gates; fixed-point review | existing server validator at the highest practical focused seam | planned | single inspected closeout comment |

   Also post the required artifact-disposition and ownership/placement lines, followed by the filled first-edit gate: `Scope ledger posted: yes; no edits started; unrelated dirty files ...; in-scope issues ...; related tracker classification ...; artifact disposition ...; ownership/placement decisions ....`

2. Implement test-first at the single focused seam.

   - Read and invoke the repository `tdd` skill. Before the first red, create its durable pre-red ledger with the fielded preflight, exact acceptance atom and sequence maps, authority disposition, and the focused seam.
   - Add the smallest test that demonstrates the validation bug. Run only that focused test and retain the intended failure, including the exact command and output-derived result. If it fails for setup or the wrong reason, classify that attempt and obtain an intended-behavior red before patching.
   - Make the narrow validator change in its owning server module. Run the identical focused test to green, then run the relevant focused typecheck/test checks. Update the scope ledger and the durable verification-command ledger with every exact command, observed counts/result, run count, and represented working tree.
   - Carry the full fielded `TDD evidence gate passed: durable sink ...` line into the eventual closeout sink. With no review findings, the TDD review-fix map will say that review created no TDD row changes.

3. Prove exact acceptance and prepare the implementation commit.

   - Run the canonical root gates required here: `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. Preserve exact observed results rather than reconstructed summaries.
   - Build the deterministic acceptance manifest from the saved exact issue JSON. It must yield one row for AC1, one for AC2, and one Principles/conformance row. Fill a working audit with the exact columns `Acceptance criterion or conformance check`, `Evidence`, and `Status`. Every satisfied Evidence cell must independently contain `atoms:`, `proof surfaces:`, and `sequence:`; use a justified sequence N/A only for a truly non-sequence-sensitive criterion.
   - Run the pre-review exactness challenge against the original issue wording. Any missing atom or surface remains `blocked` or `not done` and keeps the issue open. Validate the audit against the manifest in audit-only review-entry mode only after all three rows are literally `satisfied`.
   - Reconcile artifact disposition, rerun the worktree check, and publish the filled implementation pre-stage gate. Stage only implementation-owned source/test files, inspect the staged file list, publish the filled implementation commit gate, and create one focused implementation commit. Do not place that commit's own final SHA or terminal review result in a tracked report.

4. Review the committed fixed point.

   - Read and invoke the repository `code-review` skill against the resolved pre-implementation commit through the implementation `HEAD` (normally the resolved `HEAD~1` fixed point for this one-commit change).
   - Record the normal two-axis Standards and Spec review frame, source inventories, reviewed fixed-point SHA, reviewed HEAD SHA, diff command, issue coverage for AC1, AC2, and Principles, and the no-findings results. The closeout line will have the form `Review: code-review against ...; outcome no findings; verification rerun ...`. Do not use fallback or immediate-fix fields.
   - Because review finds nothing, keep the implementation commit unchanged as the final SHA. Refresh all current, historical-red, and superseded evidence identity categories and run the superseded-token sweep even when most categories are `none`.

5. Verify and push the exact final commit.

   - Rerun the focused test and all four canonical root gates against the committed final SHA so every published verification-ledger row represents that SHA. Confirm the reviewed HEAD and `HEAD` are identical and that no tracked content changed after review.
   - Push the final commit to the intended remote branch. Prove that the exact SHA is remote-reachable; the local-only exception is N/A.
   - Rerun the worktree check and confirm only the previously recorded unrelated dirt remains.

6. Build and validate the publishable closeout body.

   - Build the uncommitted closeout body under `/tmp` from the single-issue manifest, with normal review and Principles enabled. Run the size/headroom plan before filling it. Keep local staging paths out of all publishable sink fields.
   - Include: final remote-reachable SHA; the final-SHA verification ledger; complete TDD evidence; normal review frame and no-findings result; `Principles/ADR conformance: no deliberate exceptions.` (or the exact approved exception if intake required one); browser/manual evidence, console state, backend currentness, and freshness as justified N/A; the evidence-identity refresh and superseded-token sweep; and the three exact satisfied audit rows.
   - Inspect bounded excerpts, byte size, unresolved placeholders, literal status values, all required labels, and grouped criteria without relying on truncated output. Validate the normal review body and then the implement closing body with the expected final SHA, `--principles`, and the acceptance manifest. No browser, fallback, local-only, child-family, or immediate-fix flags apply under the stated facts.
   - Immediately before mutation, reread the tracker closeout gates, rerun the implement closing validator with `--emit-preflight --mutation-ready`, and copy its emitted `Closeout preflight:`, `Closeout gate passed: audit sink ...`, `Post-comment verification next: ...`, and mutation-ready confirmation verbatim into the conversation. Also record the exact closeout-body-check line. If any required field is false or implicit, repair and revalidate instead of mutating the tracker.

7. Mutate GitHub once, then verify every result.

   - Post the inspected body to the issue using the body-file path and capture the returned comment URL.
   - Before closing, exact-read that URL with the body verifier and require a byte-for-byte UTF-8 match. On a readback failure, preserve the mutation output and retry only the read-only lookup; do not repost blindly.
   - Close the issue as completed with a short inline comment that cites the final SHA and verified evidence-comment URL.
   - Exact-view the issue by number and require live state `CLOSED` with the expected reason, URL, and final comment reference. Run the final worktree check, report unrelated dirt and any retained verification artifact disposition, and only then report completion with the final SHA, pushed branch/reachability, verification results, review no-findings result, evidence URL, and verified GitHub closure.
