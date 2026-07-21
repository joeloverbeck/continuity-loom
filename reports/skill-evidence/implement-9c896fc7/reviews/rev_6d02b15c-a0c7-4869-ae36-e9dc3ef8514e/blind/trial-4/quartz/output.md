The original browser smoke is preliminary, not final evidence. The review fix changes a browser-consumed API route, and the proof server does not reload backend code, so closeout must include a rebuilt/restarted proof server and a clean browser rerun against the final post-fix tree.

## Execution plan

1. Re-establish the issue ledger before the review-fix edit.

   - Re-read the exact issue acceptance criteria and any Principles/ADR checks from the preserved authoritative issue data.
   - Rerun the worktree status check, list unrelated dirt, and leave it untouched.
   - Update the ledger with the review finding, the affected API-route seam, the planned regression test, browser proof, final-review requirement, and closeout state `not done` until all evidence is fresh.
   - Record any ownership/placement decision if the fix adds or moves a helper, store/query function, persistence call, or cross-module entrypoint.

2. Repair the behavior through the invoked TDD workflow.

   - Give the review finding an immutable review ID and map it to a TDD review-fix ID such as `RF-1`.
   - Before changing production code, make the TDD preflight and proposed route/API seam durable. Add the smallest regression assertion that exercises the defective behavior at the highest practical route/API layer.
   - Run the focused test and retain a red result that fails for the exact reviewed defect. If it first fails for setup, a missing test, or another wrong reason, record `partial red - wrong reason: ...`, correct the assertion/setup, and obtain the intended red before patching.
   - Apply the narrow production fix, rerun the same test to green, and run the relevant focused server/web tests and typecheck. Update the TDD compact row and keyed review-fix map with the red command/failure, green command/result, issue/seam, durability path, acceptance atoms, proof surfaces, sequence, browser-freshness disposition, backend-currentness disposition, and evidence-identity disposition.
   - Start or update the durable verification-command ledger from actual outputs; each row must retain the exact command, observed counts/result, run count, and represented working tree or SHA.

3. Refresh the working acceptance audit before staging.

   - Recheck every issue criterion and Principles/ADR row against the post-fix behavior. Every `satisfied` row must prove the exact wording and contain literal `atoms:`, `proof surfaces:`, and `sequence:` fields; use a justified sequence N/A only for a genuinely non-sequential criterion.
   - Keep the issue open if any row remains `blocked` or `not done`.
   - Reconcile artifact disposition and ownership/placement decisions, then expose the implementation pre-stage gate with the audit sink, zero remaining blocked/not-done rows, unrelated dirt, and disposition results.
   - Rerun worktree status, stage only implementation-owned files, inspect the staged file list, expose the implementation commit gate, and create the intentional follow-up review-fix commit. Do not amend a tracked evidence report merely to insert the SHA it would thereby invalidate.

4. Establish the final SHA and rerun verification on exactly that tree.

   - Treat the follow-up commit as the candidate final SHA. Run the repository-required canonical verification gates for the change's blast radius plus the focused regression test, and copy only final-SHA results into the publishable verification ledger.
   - If any verification-driven edit is needed, make another scoped commit and restart the final-SHA, verification, browser, review, and closeout-refresh loop.

5. Replace the stale browser evidence with final-tree proof.

   - Record the files touched since the earlier smoke and classify the API-route change as affecting the browser-consumed path.
   - Inspect configured ports and process ownership. Preserve unrelated pre-existing processes and use proof-owned isolated ports if necessary.
   - Because the server does not watch backend code, rebuild as required and restart the proof-owned server from the final SHA. Record the server command, no-watch mode, process/port ownership, and restart proof. Probe the expected fixed API behavior before trusting the UI.
   - Use a clean browser session to exercise the actual production route and user decision/action path, record the observed rendered/API outcome, and capture console state. The target final evidence is a browser smoke rerun passed on the final tree with 0 errors and 0 warnings, or an evidence-backed classification of unrelated output.
   - Record the freshness mini-gate explicitly: files touched since the old smoke; why they affect the UI-consumed API; backend process currentness; and the final rerun outcome. Stop only proof-owned browser/server processes after evidence capture.

6. Run final code review over the whole implementation range.

   - Invoke the repository `code-review` workflow after the fix. Anchor the final review at the original implementation fixed point and review through the final `HEAD`; do not use `HEAD~1` if that would cover only the follow-up fix commit.
   - Preserve the initial finding and its repair ledger, including its review ID, axis, reviewer, repair class, `RF-1` mapping, repair, rerun evidence, and final `fixed` status. Complete fresh final Standards and Spec passes against the final SHA and record the terminal line in the external closeout sink, for example: `Review: code-review against [resolved fixed point]; outcome findings fixed in SHA [final SHA]; verification rerun [final-tree commands].`
   - If final review finds another behavior defect, repeat the red/green, scoped commit, canonical verification, proof-server restart, browser rerun, and final-review loop. Closeout cannot proceed with unhandled findings.

7. Perform the post-review evidence refresh.

   - Keep the tracked implementation evidence SHA-independent and put final SHA, reviewed-HEAD, terminal review, and mutation-gate fields in an external publishable sink.
   - Refresh all evidence identities after the final review: current fixture/session/packet/revision/artifact identities, historical red identities, superseded identities, and a token sweep naming each superseded value and proving no active-proof hits.
   - Recompute final browser freshness against every file changed after the rerun. A later behavior or evidence-affecting edit reopens the restart/rerun/review cycle; commit metadata alone may be recorded as content-unchanged only when no tracked content changed.

## Closeout plan

8. Build and inspect one final single-issue closeout body from saved exact issue data and its deterministic acceptance manifest.

   - Include the exact audit table columns `Acceptance criterion or conformance check` and `Status`; name every checkbox/check separately; require every issue row to be literally `satisfied`.
   - Include final-SHA verification-ledger rows, the full fielded TDD closeout gate and `RF-1` map, normal-review immediate-fix evidence, Principles/ADR conformance or explicit N/A, browser route/action/outcome, console state, backend currentness, final freshness delta, and the evidence-identity refresh/sweep.
   - If the SHA is not remote-reachable and policy permits local-only closeout, include the full `Local-only SHA:` explanatory sentence; otherwise push first or keep closeout blocked.
   - Check body size and headroom, remove unresolved placeholders, inspect bounded excerpts without truncation, and visually confirm exact criteria and status literals.

9. Run all applicable validators against the exact body.

   - Validate the TDD evidence as closing evidence for the expected final SHA.
   - Validate normal review evidence with the immediate-fix, browser, TDD, closing, and expected-final-SHA conditions that apply.
   - Validate the implement closeout body with the acceptance manifest and expected final SHA. Immediately before the first tracker mutation, reread the tracker-closeout gates and rerun the implement validator with `--emit-preflight --mutation-ready`.
   - Copy the validator-emitted `Closeout preflight:`, `Closeout gate passed: audit sink ...`, mutation-ready confirmation, and `Post-comment verification next:` output verbatim. A plain closing-validation success is not mutation-ready.

10. Only after every gate passes, perform tracker closeout in this order.

   - Post the inspected body, capture the returned comment URL, and exact-read/verify the stored UTF-8 body before any close command.
   - Close the issue with a short pointer to that verified evidence URL and the final SHA.
   - Read the issue back by exact number and confirm its closed state. If a mutation result is ambiguous, use read-only verification and do not replay it unless readback proves it did not take effect.
   - Finish with worktree status, proof-process cleanup, and an explicit disposition for any untracked evidence artifact. Report completion only with the final SHA, terminal review result, canonical verification, fresh browser proof, verified closeout-comment URL, and live tracker-state readback.

Planning only: no implementation, verification, browser, commit, or tracker command has been performed.
