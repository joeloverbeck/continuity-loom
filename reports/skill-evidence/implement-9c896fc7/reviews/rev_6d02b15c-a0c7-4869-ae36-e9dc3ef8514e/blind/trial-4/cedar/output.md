# Final implementation and closeout plan

No commands have been performed. The earlier browser smoke is now preliminary because the review fix changes a browser-consumed API route. It cannot support closeout until the fixed backend is loaded by a fresh proof server and the route/action path is exercised again on the final tree.

## 1. Re-establish the working frame

Before the review-fix edit, re-read the exact issue acceptance source and update the existing scope ledger with the review finding, the affected acceptance criterion, the API-route test seam, planned final browser proof, and closeout state `in progress`. Re-run the worktree status check, preserve unrelated dirt, and record whether the fix adds or moves any ownership-sensitive helper or cross-module entrypoint. If the original first-edit gate is not already present in the durable working record, post it before editing:

`Scope ledger posted: yes; no edits started; unrelated dirty files <listed/N/A>; in-scope issues <#...>; related tracker classification <done/N/A>; artifact disposition <listed/N/A>; ownership/placement decisions <listed/N/A>.`

Keep the issue open during this phase. The pre-fix browser result, pre-fix verification rows, and initial review result remain historical evidence, not final-tree proof.

## 2. Repair the behavior red/green

Invoke the repository TDD workflow at the narrowest durable API-route seam that proves the reviewed defect.

1. Record the TDD pre-red preflight and compact row in the durable TDD sink before the first red command. Add a keyed `RF-1` review-fix row tied to the original review finding and affected issue/seam.
2. Add the smallest regression test that expresses the intended route behavior. The red must fail because the reviewed behavior is wrong. A missing file, generic invariant, unrelated assertion, or other wrong failure is only `partial red - wrong reason`; refine the assertion and obtain the intended red before changing production code.
3. Apply the minimal server/API fix, preserving the route's owning-module boundary.
4. Run the exact focused test to green, then the relevant server/API suite and focused typecheck. Append every evidence-bearing invocation to the verification-command ledger with its exact observed result/counts, run count, and represented working tree.
5. Update the TDD compact row and `TDD review-fix map` with the intended red, green result, durable regression-test path, browser freshness disposition, backend-currentness disposition, and evidence-identity refresh disposition. Preserve the full fielded `TDD evidence gate passed: durable sink ...` line for closeout.

If the fix rewrites an existing contract expectation, add the required `existing contract-change expectation` TDD row before generating final evidence.

## 3. Audit, stage, and create the follow-up commit

Refresh the working pre-close audit against every exact acceptance and Principles/ADR check. Every satisfied row must name the authoritative `atoms:`, concrete `proof surfaces:`, and `sequence:` proof or a justified sequence N/A. The browser-dependent row remains not done until the final-tree smoke passes.

Before staging, make the implementation pre-stage gate visible with the audit sink, any blocked/not-done rows, artifact disposition, ownership decisions, and unrelated dirty files. Re-run the worktree status check, stage only implementation-owned fix/test files, inspect the staged file list, and then publish the implementation commit gate with the exact staged paths.

Create an intentional follow-up commit for the review fix. This commit becomes the candidate final SHA. Do not amend a tracked evidence report merely to insert its own SHA or terminal review result; those self-referential values belong in the external closeout body.

## 4. Re-prove the browser path with the current backend

Because the proof server does not watch backend code, reachability alone is insufficient. After the follow-up commit and the build needed by the server:

1. Inspect configured ports and process ownership. Do not reuse or stop unrelated pre-existing processes; use proof-owned isolated ports if necessary and record the aligned UI proxy/API base.
2. Stop only the previous proof-owned stale server, then start a proof-owned server from the post-fix build. Record the server command, the fact that it has no backend watch/reload mode, process/port ownership, and restart proof.
3. Probe the expected fixed API field or behavior directly before the UI assertion. This is the backend-process currentness proof.
4. Open a clean browser session and rerun the production route and real user decision/action path. Record route, action path, observed result, and console state. The final proof should have zero errors and warnings, or classify any unrelated output with evidence.
5. Record the freshness mini-gate:
   - `Files touched since browser/manual smoke: <fix/test paths>`
   - `Affects UI/routes/browser-consumed API/fixtures/action path? yes — the reviewed API route is consumed by this path`
   - `Backend process currentness: <server command; no watch/reload mode; process/port ownership; restart proof; expected API behavior probe>`
   - `Smoke freshness: <rerun command and observed outcome>`

The original browser session/artifacts should be classified as superseded evidence; the new clean session and proof artifacts are current evidence. Stop the proof-owned browser/server processes after evidence is safely recorded.

## 5. Run final review over the full implementation range

Invoke the repository `code-review` workflow again after the fix. Anchor the final review at the original implementation fixed point and review through final `HEAD`, so the frame covers both the initial implementation commit and the follow-up fix commit. Do not use `HEAD~1` as the closeout frame if that would cover only the fix.

Preserve the initial finding under an immutable ID such as `P1-spec-1` or `P1-standards-1`, link it to `RF-1`, and record the repair, rerun evidence, and final status `fixed`. Both Standards and Spec final passes must cover the candidate final SHA. The durable normal-review line should state:

`Review: code-review against <original fixed point>; outcome findings fixed in SHA <final SHA>; verification rerun <commands>.`

If final review produces another behavior-changing finding, repeat the red/green, commit, backend restart, clean-browser smoke, final verification, and review loop. Closeout remains blocked until the final reviewed `HEAD` has no unhandled findings or only explicitly accepted residuals recorded under the required residual contract.

## 6. Verify the final SHA and refresh evidence

Once review is clean, run focused regression verification and the repository's canonical gates for this server/UI blast radius: lint, typecheck, test, and build. Publish only verification-command ledger rows that represent the final SHA. If any gate causes a content change, create the necessary commit and repeat review and all affected browser-freshness steps.

Then perform the post-review evidence-identity refresh:

- `Current evidence identities:` final browser session, proof artifacts, fixture identity if any, and active revision.
- `Historical red identities retained:` the red-only test evidence categories, or the exact all-none disposition where applicable.
- `Superseded evidence identities:` the pre-fix browser session/artifacts, pre-fix revision, and any replaced proof identities.
- `Superseded-token sweep:` an exact search naming each normalized superseded value, with no hits outside classified identity/history lines and no active-proof hits; classify historical-red hits.

Recheck final browser freshness against every file touched since the rerun, including evidence or documentation edits. Commit metadata alone may use the content-unchanged disposition; any later behavior change to the UI, route, browser-consumed API, fixture, or action path requires another browser rerun.

## 7. Build and validate the final closeout body

Freeze the closeout shape only now. Reuse the saved exact issue JSON and deterministic acceptance manifest. Because review found and fixed a behavior defect, create one structured evidence JSON containing the exact audit rows, TDD rows, `RF-1`, and the immutable review-finding row, then generate the normal-review closeout scaffold with immediate-fix, TDD, and browser branches enabled. Run the size/headroom plan before filling it; stop and split evidence if it reports low headroom or exceeds the tracker ceiling.

Keep the two sinks separate: tracked evidence remains SHA-independent, while the uncommitted closeout body owns final SHA, reviewed HEAD SHA, terminal review result, final verification, and tracker gates.

The inspected body must contain:

- the exact audit table columns `Acceptance criterion or conformance check` and `Status`, with every issue row literally `satisfied`;
- `atoms:`, `proof surfaces:`, and `sequence:` in every satisfied Evidence cell;
- final-SHA verification ledger rows;
- complete TDD preflight, compact row, `TDD review-fix map`, and fielded TDD gate;
- normal code-review evidence with the immediate-fix finding ledger and the original-fixed-point-to-final-HEAD frame;
- final browser route/action/outcome, console state, backend-process currentness, and freshness delta;
- current, historical-red, and superseded identity inventories plus the token sweep;
- `Principles/ADR conformance:` with the actual result or explicit N/A;
- remote reachability, or the full `Local-only SHA:` explanatory sentence only when local-only closeout is explicitly allowed.

Inspect the exact body in bounded excerpts, check byte size and unresolved placeholders, visually confirm grouped criteria/statuses, and run the applicable TDD, normal-review (`--immediate-fix`, browser, and TDD), and implement closing validators against the expected final SHA. Immediately before the first tracker mutation, rerun the implement validator with `--emit-preflight --mutation-ready` and copy its emitted `Closeout preflight:`, `Closeout gate passed:`, mutation-ready confirmation, `Post-comment verification next:`, and any residual summary verbatim. A plain closing validation is not mutation-ready.

## 8. Tracker closeout and final readback

Only after every gate passes, post the inspected body, capture the returned comment URL, and verify the stored UTF-8 body exactly before closing the issue. Then close with a short pointer to that verified evidence and exact-read the issue number/state. If a mutation succeeds but readback fails, preserve the returned URL/output and retry only the read-only lookup; do not replay a mutation unless readback proves it did not take effect.

Finish with a final worktree status check, report unrelated dirt and the disposition of untracked proof artifacts, confirm proof-owned processes are stopped, and report the final SHA/reachability, final review result, canonical verification, verified evidence URL, and live tracker state.
