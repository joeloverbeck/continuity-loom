# Proposed execution/evidence/closeout transcript

1. **Resolve live authority and scope before editing.**

   - Read the repository instructions, active-authority map, and every active document they route to for the shared UI primitive, runtime validation, game UI, action anchors, and evidence artifacts.
   - Exact-read issues #69, #70, and #71, including bodies, comments, labels, states, dependency links, and all related children/blockers. Capture the three issue bodies in that order, then derive the acceptance manifest from the captured bodies. The live comments and states remain subject to exact readback at closeout.
   - Run the initial worktree-status check. Match the dirty ADR and untracked context document to the exact paths named by the issue bodies. Because the issues explicitly require those pending authorities to land with the implementation, adopt those two artifacts into scope, inspect their full diffs/content, and record any active-doc registration or reconciliation they require. All other dirt stays user-owned and is neither edited, staged, nor reverted.
   - Inspect the current owning modules and callers. Record the shared React UI package/module as the owner of `Glyph`; do not create a game-local duplicate or broaden unrelated entrypoints. Record the existing game components as owners of the market-card, player-mat, and legend retrofits.
   - Preflight indispensable browser proof before the first edit: confirm the browser wrapper is available, inspect configured UI/API ports and their owners, and choose isolated proof-owned loopback ports if defaults are occupied. Do not stop or reuse unrelated port owners. Confirm that the Vite proxy/API settings can be aligned on the isolated ports and that a durable screenshot can be retained at the repository-authorized evidence location. If this proof cannot be made available, make no speculative edit and return a blocked handoff naming the missing capability and decision.
   - Publish the first-edit ledger:

     | Work item | Dependencies/blockers | Exact acceptance and atoms | Authority/ADR | Proof seam | Artifact disposition | Status |
     |---|---|---|---|---|---|---|
     | #70 | Parent #69; pending authority artifacts | Exact body-derived rows; expected atoms include one shared `Glyph` primitive and the specified runtime validation behavior | Named dirty ADR and context document, plus active UI authority | Shared primitive's public React/runtime boundary; focused package tests | ADR/context land with work; generated test artifacts per repo policy | planned |
     | #71 | #70; parent #69 | Exact body-derived rows; expected atoms include market cards, player mat, legend, required screenshot, and preservation of every enabled action anchor | Same named authority plus game/UI authority | Existing game UI/parity tests and real browser decision path | Screenshot retained as durable acceptance evidence | planned |
     | #69 | #70 and #71 CLOSED | Parent's exact rollup/Principles rows | Parent and named authority | Verified child states plus shared final-tree evidence | Durable parent rollup | planned |

     The ledger also lists every exact manifest check, its required proof surface, any Principles/ADR obligation, the unrelated-dirt inventory, the two adopted authority files, the screenshot destination, and the isolated browser-process plan. No criterion is marked satisfied yet.

2. **Implement #70 test-first at the shared public seam.**

   - Read and follow the repository TDD workflow. Add the smallest focused tests that exercise `Glyph` through its public consumer-facing React/runtime boundary. Cover every validation atom stated by #70, including accepted inputs and the exact invalid-input behavior; do not infer a weaker contract from nearby components.
   - Run the focused command and record an intended behavioral red: exact command, failing assertion/count, run count, and represented working tree. A dependency, runner, or stale-build failure is setup evidence, not red; repair setup, preserve that record, and rerun until the intended assertion fails.
   - Implement the minimal shared primitive and validation in its confirmed owning module. Run the same focused command to green, then the relevant package typecheck/tests. Record exact result counts and working-tree identity.
   - Audit #70's rows immediately. Each provisional satisfied row states `atoms:`, concrete `proof surfaces:`, and `sequence:` (for example, render request -> validation -> accepted render or invalid-input rejection). Keep any unsupported row `not done`.

3. **Implement #71 test-first without weakening enabled action anchors.**

   - Add focused component/parity tests for the exact market-card, player-mat, and legend requirements. Add assertions that identify all enabled action anchors required by the live issue and prove that the retrofit preserves their enabled state and action identity, rather than merely proving that glyphs render nearby.
   - Run the focused/parity command and preserve the intended red with exact failure counts and tree identity. Implement the three retrofits through the shared `Glyph`; do not introduce parallel icon rendering or compatibility aliases.
   - Rerun to green. Exercise the relevant user-action sequence at the highest practical automated seam so the evidence shows enabled anchor -> activation -> expected application response. Record separate #71 acceptance rows even if #70 and #71 are committed together.
   - Reconcile the dirty ADR and untracked context document against the live issue wording and active authority. Make only issue-required changes, add any required active-document registration, and treat these documents as conformance evidence with TDD N/A where no runnable behavior exists.

4. **Obtain real browser and screenshot proof for #71.**

   - Start proof-owned UI and API processes on the preflighted free loopback ports, with Vite proxy/API configuration explicitly aligned. Record launch commands, PIDs/sessions, actual URL, port ownership, and the source revision/tree loaded by each process. Probe the expected backend behavior so mere reachability is not used as backend-currentness proof. Use an application-consistent isolated fixture; never raw-copy a live stateful store.
   - Open the actual production navigation route with the browser wrapper, reach the game's market decision state through the real user path, and inspect market cards, player mat, and legend. For every issue-named enabled action anchor, exercise the action path and record the ordered observation that it remains enabled and invokes the expected behavior.
   - Capture the required screenshot at the repository-authorized durable evidence path, recording logical ID, path, content hash, viewport, route, and represented tree. Record the browser console warning/error count and require a clean, relevant session. A component preview, server-rendered fragment, or screenshot of a nearby state does not satisfy the criterion.
   - If the screenshot is tracked, stage it with the implementation. The final evidence will state that the only later tree change, if any, was addition of the evidence image itself; any later runtime/UI change requires a fresh clean-session browser run and regenerated screenshot.
   - Stop only proof-owned processes after evidence is complete, record their cleanup, and leave unrelated owners on occupied default ports untouched.

5. **Audit, verify, and create the implementation fixed point.**

   - Run the relevant focused #70 tests, #71 component/parity tests, and then the repository canonical gates for this shared UI/cross-package change: lint, typecheck, full tests, and build. The verification ledger records each exact command, observed result/counts, run count, and represented working tree; setup failures and superseded runs remain historical rather than being presented as final evidence.
   - Re-read every acceptance and Principles/ADR row against the exact captured wording. Mark a row `satisfied` only when its evidence names non-circular atoms, concrete proof surfaces, and ordered sequence evidence or a justified sequence N/A. Explicitly map the screenshot, console state, backend currentness, action-anchor sequence, and artifact disposition to #71.
   - Generate the acceptance audit/closeout scaffold and run the audit-only review-entry validator against the complete manifest. Any unresolved row blocks review entry and closeout.
   - Re-run worktree status, inspect both unstaged and staged file lists, and stage only: the owned `Glyph` implementation/tests, the three owned retrofit/test surfaces, the issue-required ADR/context/registration changes, and the authorized screenshot evidence. Make the exact staged file list visible before committing. Commit the owned implementation and record the pre-implementation commit as the fixed review base.
   - On committed `HEAD`, rerun all final-tree canonical gates and any focused tests needed for exact counts. Re-run or explicitly refresh the browser proof against that `HEAD`; if only the tracked screenshot artifact changed after the browser run, prove that no browser-consumed source changed. Otherwise repeat the full clean browser sequence and replace the screenshot before proceeding.

6. **Review the actual final tree and refresh after every finding.**

   - Invoke the repository code-review workflow from the resolved pre-implementation fixed point through current `HEAD`, covering both standards and exact #70/#71/#69 specification conformance. Carry its canonical review result into the closeout evidence unchanged.
   - Preserve every finding. For a behavior defect, add the smallest intended-behavior red at the owning seam when possible, fix it, rerun the affected focused and canonical gates, and regenerate browser/screenshot evidence if the changed files can affect UI, routes, APIs, fixtures, or the action path. Create an intentional follow-up commit or amend using only owned files.
   - After every review fix, refresh final SHA, review coverage through current `HEAD`, final-tree command rows, screenshot/hash, console state, backend currentness, and current/historical/superseded evidence identities. Review is complete only when both axes cover the actual final `HEAD` and all findings are either fixed or truthfully recorded as accepted residuals in the validator-derived form.
   - Push the final reviewed commit when repository policy requires remote tracker closeout. Verify actual remote reachability of the exact final SHA; a successful push message alone is insufficient.

7. **Build and validate shared closeout evidence before any tracker mutation.**

   - From the captured #69/#70/#71 manifest and structured evidence, build the parent-scoped shared body with separate exact audit rows for every check, parent-rollup TDD, canonical review, Principles/ADR conformance, browser evidence, evidence-identity ledger, size plan, and the correct pending-child/final-child mode. Fill it only from final-tree evidence.
   - Inspect body byte size, all relevant sections, every literal status, all SHA occurrences, and unresolved placeholders. If headroom is low, use disjoint manifests: post/exact-read a pre-index core, post/exact-read each audit chunk, patch the core with verified HTTPS chunk URLs, revalidate final-index state, and exact-read it again. No chunk may claim another subset's rows.
   - Run the TDD validator, normal-review validator, implement closing validator, and finally the implement validator with the exact final SHA, acceptance manifest, emitted preflight, and mutation-ready mode. Make the emitted closeout preflight, gate-passed line, post-comment next step, mutation-ready confirmation, and any accepted-residual summary visible verbatim. A plain closing validation is not mutation authorization.
   - If any exact row is `blocked` or `not done`, or the final SHA, remote reachability, review, browser freshness, screenshot, console, backend, or process disposition is missing, perform no progress comment/close mutation for that affected scope. Return the blocked-handoff table with live states, verified frontier, missing proof, next exact action, and keep the affected child and #69 open.

8. **Close children first, then parent, with exact readback.**

   - Post the validated shared evidence body to #69 using the body file, capture its URL, and byte-for-byte verify the stored UTF-8 body before either child cites it. If the post output is ambiguous, preserve it and retry only read-only lookup; do not replay the mutation without proof it failed.
   - Substitute the real final SHA and verified rollup URL into this fixed child text, display the exact final line once, and use it unchanged for both eligible children: `Completed by <final-sha>. Evidence: <verified-rollup-url>`.
   - Close #70 only after confirming all #70 rows are satisfied, then exact-read its number, CLOSED state, state reason, URL, and relevant close comment. Close #71 only after confirming all #71 rows—including durable screenshot and enabled-action-anchor sequence—are satisfied, then perform the same exact readback. Do not infer either state from search results or the close command's exit status.
   - Record those exact CLOSED states in durable parent evidence. Rebuild the #69 body in final-child mode, including the verified child-state readbacks; rerun all affected validators through emitted-preflight mutation-ready on the exact final body, post it, and byte-verify its stored body. Only then close #69 with a short pointer to that verified final parent evidence and exact-read #69.
   - If a child close reports success but readback is unavailable, preserve the mutation evidence and perform only read-only retries. Treat the state as unverified and leave #69 open rather than replaying the close or inferring completion.

9. **Final readback and handoff.**

   - Exact-read #69, #70, and #71 again, including final states/reasons and latest relevant evidence pointers. Reconfirm the final SHA's actual remote visibility, the final verification/review identities, and the final worktree status.
   - Report the final SHA, canonical verification and review results, verified CLOSED states for all three issues, screenshot path/hash and browser/console/backend freshness, proof-process cleanup, authority-artifact disposition, and remaining unrelated dirt. Claim completion only if those reads all agree with the final reviewed tree.
