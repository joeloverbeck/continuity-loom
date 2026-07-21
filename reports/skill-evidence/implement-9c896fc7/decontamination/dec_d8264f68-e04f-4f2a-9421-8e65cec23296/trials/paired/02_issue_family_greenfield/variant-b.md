# Proposed execution and closeout transcript

## 1. Resolve the live scope before editing

1. Read the repository instructions, active authority map, and every authority or ADR named by PRD #1 or issues #2 through #9.
2. Record the pre-implementation fixed point (`HEAD`, branch, and remotes), then run `git status --short`. Classify the existing documentation edits as unrelated, user-owned dirt. They are excluded from every edit, stage, commit, and cleanup action.
3. Exact-read PRD #1 and issues #2 through #9, including body, comments, labels, state, dependencies, and blockers. Discover any additional parent-linked candidates across open and closed states, exact-read them, and classify them as enabling, blocking, contextual, excluded, or unrelated rather than assuming that #2 through #9 are the complete family.
4. Save one ordered immutable body snapshot:

   ```text
   node .claude/skills/implement/scripts/capture-github-issues.mjs 1 2 3 4 5 6 7 8 9 --output /tmp/implement-issues.json
   ```

   Live comments and state will still be reread at closeout.
5. Build the acceptance manifest and audit scaffold from that snapshot. Copy every acceptance and Principles/ADR check into the ledger; expand composite language into explicit atoms. Do not infer missing acceptance from the fixture or assign workstreams to issue numbers until the exact bodies establish that mapping.
6. Resolve the dependency DAG from the issue bodies. The first implementation action will be the earliest unblocked issue in that live DAG, not merely the lowest issue number. Integrated changes are allowed only where the bodies' public seam makes them technically inseparable; evidence and closure remain separate for all eight children.

### Initial scope ledger

| Work item | Dependencies/blockers | Exact acceptance and atoms | Authority/ADR | Proof seam | Artifact disposition | Status |
|---|---|---|---|---|---|---|
| #1 | All exact parent-linked blockers; especially #2-#9 | Parent close predicate copied from live body; exact CLOSED readback for every child is an additional required sequence | Parent Principles/ADRs or N/A | Verified child rollup plus exact state reads | Parent rollup remains on tracker | planned; never closes early |
| #2 | Exact body DAG | Exact live atoms, including any quantified or lifecycle terms | Named authority or N/A | Body-named public seam or direct conformance seam | Recorded from body | planned |
| #3 | Exact body DAG | Exact live atoms | Named authority or N/A | Body-named public seam or direct conformance seam | Recorded from body | planned |
| #4 | Exact body DAG | Exact live atoms | Named authority or N/A | Body-named public seam or direct conformance seam | Recorded from body | planned |
| #5 | Exact body DAG | Exact live atoms | Named authority or N/A | Body-named public seam or direct conformance seam | Recorded from body | planned |
| #6 | Exact body DAG | Exact live atoms | Named authority or N/A | Body-named public seam or direct conformance seam | Recorded from body | planned |
| #7 | Exact body DAG | Exact live atoms | Named authority or N/A | Body-named public seam or direct conformance seam | Recorded from body | planned |
| #8 | Exact body DAG | Exact live atoms | Named authority or N/A | Body-named public seam or direct conformance seam | Recorded from body | planned |
| #9 | Exact body DAG | Exact live atoms | Named authority or N/A | Body-named public seam or direct conformance seam | Recorded from body | planned |

For each new package, exporter, query, or cross-module entrypoint, add the owning module and the nearby-callers rationale to its row before creating it. Record whether generated fixtures, reports, and docs remain active, are retained as durable evidence, or must be archived under repository policy.

## 2. Preflight the proof and settle the oracle conflict

Before the first edit:

- Confirm the checked-in Python harness's documented invocation, interpreter requirements, deterministic inputs, and output contract. Execute its existing self-check only in the real run; absence of a Node package manifest or test runner is a setup condition, not behavioral red evidence.
- Confirm Node/package-manager requirements, dependency-install availability, GitHub authentication, push access, and whether the CI issue requires an actual remote workflow run. If a green hosted run is acceptance evidence, remote CI access is indispensable and must be available before closeout.
- Confirm the issue-named public rules-engine seam and its owning package. TDD will operate at that seam; internal helper tests may supplement it but cannot replace it.
- Confirm that deterministic fixture export can be rerun from the checked-in harness and that fixture provenance can be recorded with a stable logical ID and content hash.
- Record browser proof as N/A only if the exact bodies contain no UI, route, browser-consumed API/data, or user action path. The reason will be explicit: the delivered surface is a package-level rules engine, fixture pipeline, CI, and documentation. If an exact body does include a browser-consumed surface, preflight a proof-owned production server and real-browser route instead.

The refill-timing discrepancy is an authority gate, not an implementation detail:

1. Quote the exact oracle designation and the exact conflicting sentence into the private scope ledger.
2. If the live authority explicitly makes the Python harness behavior binding and the conflicting sentence is descriptive rather than an acceptance atom, record that interpretation: the port must reproduce the harness's refill transition exactly, the exporter must preserve it, and neither the harness nor fixtures may be changed merely to match the prose. Add a boundary fixture and a public-seam parity test that expose the timing.
3. If the contradictory sentence is itself a literal acceptance requirement, or the authority order is not explicit, mark that child `blocked` and mark every semantic dependent `blocked`. Ask for an issue-body/authority decision before any semantic implementation. Independent bootstrap work may proceed only if it cannot encode either timing, but the conflicting child, its dependents, and PRD #1 remain open. Repeated reads do not resolve the contradiction.

The visible first-edit note will state the live DAG, exact in-scope rows, related-item classifications, unrelated documentation dirt, artifact dispositions, ownership decisions, proof availability, the refill decision or blocker, and the next exact issue/seam.

## 3. Implement in dependency order with issue-specific evidence

Use the repository `tdd` workflow at the highest practical public seam. Maintain a verification ledger from the first pass/fail command, recording exact command, observed result and counts, run count, and represented working tree or SHA.

1. **Workspace bootstrap issue.** Add only the manifest, workspace/package structure, strict TypeScript configuration, test runner, lint/build scripts, and minimal public package boundary required by its exact body. For configuration-only atoms, use direct conformance evidence and an explicit TDD N/A; for executable bootstrap behavior, first obtain a meaningful failing test after the runner works. A pre-bootstrap “command not found” or missing-manifest failure is setup evidence, not red.
2. **Deterministic fixture-export issue.** Add a narrow exporter owned beside the harness/fixture pipeline. First make reproducibility and schema assertions fail for the intended reason, then implement stable ordering, stable serialization, fixed inputs/seeds, provenance, and the exact harness invocation. Export twice from the same source and prove byte identity/hash identity. Include the refill boundary without altering oracle semantics.
3. **TypeScript-port issue.** Establish a red test through the issue-named public rules-engine seam using oracle-derived inputs and expected transitions. Port the behavior in the owning package with no convenience cross-package entrypoint. Turn the focused public-seam test green.
4. **Replay and parity issues.** Keep their acceptance rows distinct even if they share fixtures. Replay full transition sequences rather than comparing disconnected snapshots. Parity evidence must cover every exported case and compare ordered state transitions/output, including the refill boundary. Record fixture count, assertion/case count, and any quantified coverage exactly; representative samples do not satisfy “all fixtures” language.
5. **CI issue.** Make the workflow invoke the same canonical commands and deterministic checks used locally. Prove that fixture generation leaves the final tree clean. If its acceptance requires hosted CI, push the reviewed candidate commit and record the exact successful run/check URL; a locally parsed workflow file is not a substitute.
6. **Documentation issue.** Update only the active docs named by authority. Document the public seam, oracle/fixture regeneration contract, replay/parity use, and exact refill semantics selected by authority. Use conformance review and TDD N/A unless the docs issue also owns executable examples, in which case run them.
7. After each issue or integrated seam, challenge every claimed row against its exact body. A `satisfied` Evidence cell must contain `atoms:`, concrete `proof surfaces:`, and `sequence:` ordered proof or a justified sequence N/A. Unsupported rows remain `blocked` or `not done`; no issue is closed incrementally merely because implementation appears nearby.

Expected verification-ledger categories, with exact commands taken from the bootstrapped repository rather than guessed, are:

| Evidence category | Required observation | Freshness requirement |
|---|---|---|
| Python oracle self-check/invocation | Exact exit/result and harness case count | Run against the source used for final export |
| Fixture export reproducibility | Two clean exports are byte/hash identical; stable provenance recorded | Final tree |
| Focused public-seam TDD | Intended red, then green, for the exact issue atoms | Rerun after every relevant fix |
| Replay/parity suite | Exact fixture/case/assertion counts; ordered sequences agree with oracle | Final tree and final fixture identity |
| `npm run lint` | Pass with output-derived counts/result | Final tree |
| `npm run typecheck` | Pass with output-derived counts/result | Final tree |
| `npm test` | Pass with output-derived test counts | Final tree |
| `npm run build` | Pass with output-derived result | Final tree |
| CI, if required | Exact final-SHA remote run/check is successful | Final remote SHA |
| Browser/manual | Real production path evidence, or reasoned N/A as above | Reassess after every relevant edit |

Unexpected setup failures remain in the historical ledger, are repaired, and are followed by the exact rerun. Only passing final-tree rows enter closeout evidence.

## 4. Stage, commit, and review the actual final tree

1. Reconcile all generated fixture/report/doc dispositions. Rerun `git status --short`, inspect the owned diff, and run the audit-only review-entry validator against the complete acceptance manifest. No unresolved row may enter normal closeout review.
2. Make the pre-stage note visible: audit sink, unresolved-row count, artifact dispositions, ownership decisions, unrelated documentation dirt, and exact files to stage.
3. Stage explicit implementation-owned paths only. Inspect `git diff --cached --name-only`; if any pre-existing documentation edit appears, unstage it without reverting the user's file. Commit the owned implementation. Preserve the original pre-implementation fixed point for review.
4. Invoke the repository `code-review` workflow over the resolved pre-implementation fixed point through `HEAD`, covering both Standards and Spec. Carry its canonical result unchanged into durable evidence.
5. Preserve every review finding. For a behavior defect, obtain intended-behavior red when possible, add the smallest durable regression at the public seam, fix it, rerun affected focused and canonical gates, and intentionally amend or add an owned follow-up commit. Keep review anchored at the original fixed point so implementation plus fixes are covered.
6. After any review-time change, refresh final SHA, review coverage of current `HEAD`, every stale verification row, fixture identity, oracle parity, CI currentness, browser/manual N/A or proof, and all closeout-body evidence identities. Sweep out superseded active tokens while retaining genuine historical reds/findings as historical evidence.
7. Push the final implementation-owned commit when tracker closeout requires remote reachability. Record proof that the exact final SHA is reachable on the intended remote and, where applicable, that CI for that SHA is green. Do not amend a tracked report merely to insert the SHA of the commit that contains it; final self-referential fields belong in the tracker body.

## 5. Build and validate the child-family evidence

1. Re-exact-read #1 through #9 and compare current bodies/comments/state with the intake snapshot. Any acceptance or dependency drift updates the ledger and invalidates affected evidence.
2. Build a completed child manifest for #2 through #9 and a separate parent-close manifest for #1. Every child row must now be literally `satisfied`; otherwise use the blocked handoff below and perform no tracker mutation.
3. Build the shared child-family rollup on PRD #1 with the final SHA, remote reachability, final-tree command ledger, canonical TDD evidence or per-row reasoned N/A, canonical review result, Principles/ADR conformance or N/A, browser/backend/console/freshness evidence or reasoned N/A, artifact dispositions, and current/historical/superseded evidence identities.
4. Run the size plan with required headroom before filling/publishing the long body. If low-headroom or oversized, partition the completed audit into disjoint manifests, publish and exact-read a split pre-index core, publish and exact-read every chunk, patch the core with verified HTTPS chunk URLs, revalidate final-index state, and exact-read the patched core. No chunk repeats or reinterprets core evidence.
5. Inspect the exact completed body, UTF-8 byte size, every audit row/status, and unresolved placeholders. Run the applicable TDD validator, normal-review validator, ordinary implement closing validator, and finally the implement validator with the exact final SHA, acceptance manifest, `--emit-preflight`, and `--mutation-ready`. Make the emitted `Closeout preflight:`, `Closeout gate passed:`, `Post-comment verification next:`, mutation-ready confirmation, and any machine-derived `Accepted residuals:` summary visible verbatim. Any body change makes the affected inspection and validators stale.

## 6. Mutate the tracker in dependency-safe order

No comment or close command occurs before the preceding gates pass on the exact body.

1. Post the shared rollup to PRD #1 using a body file. Capture the returned URL and exact-read the stored UTF-8 body with `verify-github-comment-body.mjs`. A returned URL alone is not verification.
2. Substitute the real final SHA and verified rollup URL into this fixed child-close text, display the exact final text before the first close, and use it unchanged for every satisfied child:

   ```text
   Completed by <final-sha>. Evidence: <verified-rollup-url>
   ```

3. Close #2 through #9 only when that child's own rows are satisfied, following the live dependency ordering. After each mutation, exact-read that issue by number and record its `CLOSED` state/state reason/URL. If a mutation appears successful but readback fails, preserve its output and retry only the read-only lookup; do not replay the mutation unless readback proves it did not take effect.
4. Exact-read all eight children again in one bounded per-number pass. The parent ledger transitions to `satisfied` only when every one of #2, #3, #4, #5, #6, #7, #8, and #9 is confirmed `CLOSED` and no additional exact-read parent blocker remains.
5. Build the final parent-close body from the #1 manifest. It must include the verified child-rollup URL and durable exact child-state ledger, plus every parent-specific acceptance/Principles row. Inspect and validate this exact body through the same applicable validator chain, ending with final-SHA `--emit-preflight --mutation-ready`.
6. Post the parent-close body, capture its URL, exact-read the stored bytes, then close PRD #1 with a short pointer to that verified evidence. Exact-read #1 after the close.
7. Before claiming completion, exact-read #1 through #9 again, verify the final SHA's actual remote visibility and final-SHA CI if required, inspect latest relevant comments, run `git status --short`, and stop only proof-owned processes. Report that the pre-existing documentation dirt remains untouched and classify each retained/removed evidence artifact.

### Terminal closeout ledger

| Work item | Closure predicate | Durable evidence | Permitted terminal state |
|---|---|---|---|
| Each of #2-#9 | Every exact row `satisfied`; final SHA verified/reviewed/reachable; all applicable TDD, verification, CI, authority, and browser/manual gates current | Exact-read shared rollup plus unchanged fixed child comment and exact state readback | Close individually as completed |
| #1 | Parent-specific rows `satisfied`; verified shared rollup; exact durable `CLOSED` readback for #2-#9; no other live blocker | Exact-read parent-close body and exact parent state readback | Close only after every child |
| Any blocked child | At least one exact row `blocked` or `not done`, including unresolved refill authority or unavailable indispensable CI proof | Blocked handoff; no progress comment | Remains open |
| #1 when any child is open/unverified | Child sequence predicate incomplete | Blocked parent row naming exact child/state blocker | Remains open |

## Blocked closeout form

If the refill conflict, proof access, review, final SHA, CI, or any exact acceptance row cannot be resolved, stop without commenting or closing and return:

```markdown
Blocked closeout handoff for PRD #1 / issues #2-#9

- Live tracker state: <exact per-number readback>
- Verified implementation frontier: <owned files and commit, or explicit no-commit decision>
- Final-tree verification: <exact commands/results or blocker>
- Review: <canonical review line, or N/A because review was not reached>
- Browser/process/artifact disposition: <facts or reasoned N/A>

| Work item | Exact criterion | Satisfied evidence or missing proof | Next exact action | Status |
|---|---|---|---|---|
| #N | <verbatim criterion> | atoms: ...; proof surfaces: ...; sequence: ...; or exact blocker | <authority decision, proof, or repair needed> | satisfied / blocked / not done |
```

The blocked child and every dependent issue remain open; PRD #1 remains open. Completion is reported only with the final SHA (or an explicitly authorized and policy-permitted local-only decision), final verification/review result, exact live states for #1 through #9, process cleanup, artifact disposition, and the remaining unrelated documentation dirt.
