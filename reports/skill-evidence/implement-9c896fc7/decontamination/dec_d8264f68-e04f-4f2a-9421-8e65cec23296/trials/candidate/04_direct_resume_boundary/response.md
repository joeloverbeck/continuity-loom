**Agent — resume**

Proceeding with the approved single `BoardFacts` seam. This is a direct, user-approved implementation checklist, so I will not invent a GitHub issue or perform any tracker mutation.

The approval resolves the seam decision, but the pause makes this a resume boundary. Before the first edit, I compare the current `HEAD`, worktree, governing authorities, saved checklist, and any proof process or port ownership with the recorded pre-pause frontier. I carry forward unrelated dirt unchanged. If the repository or authority has drifted in a way that invalidates the selected seam, I stop and report that conflict; otherwise the existing checklist remains the scope ledger and the single `BoardFacts` seam is pre-agreed.

**Agent — execution**

I confirm from nearby callers and the current architecture which module owns `BoardFacts`, because it is a cross-module entrypoint, and keep its interface no broader than the approved flow requires.

I then invoke the repository TDD workflow at the highest practical public `BoardFacts` seam. The approved seam does not need another design checkpoint unless live architecture contradicts it. For each behavior in the checklist, I obtain intended-behavior red evidence, make the smallest implementation change, and rerun to green before refactoring. Setup or harness failures are recorded separately and are not treated as behavioral red evidence.

From the first evidentiary command onward, I maintain a ledger containing the exact command, observed result and counts, run count, and represented working tree or SHA. I use focused checks during development and then run every canonical repository gate required by the final blast radius. If the change reaches UI, browser-consumed data, routes, fixtures, or a user action path, I preflight an isolated proof-owned process and exercise the production path in a real browser, recording the URL, route and action sequence, observed result, console state, backend currentness, artifact disposition, and cleanup. If none of those surfaces changes, I record browser proof as N/A with the concrete reason.

Before review, I audit every checklist item against its exact wording. Each satisfied row names its required atoms, concrete proof surfaces, and ordered sequence evidence, or explains why sequence is not applicable. Unsupported rows remain `blocked` or `not done`; I do not enter success review with one unresolved. I reconcile artifacts, refresh worktree status, identify unrelated dirt again, inspect the staged file list, and stage only implementation-owned files.

**Agent — review and refresh**

On the preferred route, I create an implementation-owned commit and invoke the repository `code-review` skill over the resolved pre-implementation fixed point through the actual `HEAD`. If repository or user policy makes a commit inappropriate, I instead review the explicit WIP diff and state that no committed fixed point exists. I carry the code-review skill's canonical two-axis handoff into the closeout evidence unchanged.

Every review finding is preserved. For a behavior-changing finding, I add intended-behavior red evidence when possible, apply the narrow fix, rerun affected tests and canonical gates, refresh any browser or backend proof made stale, stage only owned files, and intentionally amend or add a follow-up commit. The review remains anchored at the original fixed point and is rerun as needed until it covers the final `HEAD`. After each review-era change, I refresh the final SHA, actual remote-reachability status, verification ledger, evidence identities, and acceptance audit.

**Agent — closeout**

There is no issue to comment on or close. The final report therefore records:

- the approved seam and the disposition of every direct-checklist item;
- the final implementation commit SHA, or an explicit no-commit decision if policy required a WIP-only result;
- whether that SHA is locally present and whether it was actually published remotely, without claiming a push that was not requested;
- the canonical TDD result, final-tree verification ledger, and canonical code-review result;
- browser/manual proof or the reasoned N/A, including proof-process cleanup;
- artifact disposition and ownership of the `BoardFacts` entrypoint; and
- remaining unrelated dirt, explicitly untouched.

If any required proof is unavailable, an acceptance row remains unresolved, or review cannot be made current for the final tree, I stop without presenting the implementation as complete and return the verified frontier plus the next exact action needed. Otherwise I report completion against the final reviewed tree, with tracker state explicitly `N/A — direct request; no issue created or mutated`.
