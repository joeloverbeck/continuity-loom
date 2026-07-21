# Ordered execution and closeout transcript

## 1. Read-only intake and scope resolution

1. Run `git status --short` before any edit. Copy every pre-existing dirty path into the ledger, classify the reported documentation edits as unrelated, and promise not to edit or stage them.
2. Read the repository's root instructions and verification guidance. Confirm that the repository has no package manifest or test runner yet; do not treat missing modules or missing binaries as a behavioral test failure.
3. Fetch exact structured bodies and comments for PRD #1 and issues #2 through #9:

   ```bash
   gh issue view 1 --comments --json number,title,state,body,comments,labels,closed,closedAt,url
   gh issue view 2 --comments --json number,title,state,body,comments,labels,closed,closedAt,url
   # Repeat exact lookups for #3 through #9.
   ```

4. Search all issue states for references to `#1`, then exact-view each candidate. Classify every related item outside #2-#9 as already closed, an enabling prerequisite, blocking, contextual/non-blocking backlog, intentionally excluded, or not actually related. The parent cannot be treated as ready merely because the requested eight children are the obvious search results.
5. Save one ordered canonical snapshot of #1-#9 and use it for every later manifest, audit, review, and closeout check:

   ```bash
   node .claude/skills/implement/scripts/capture-github-issues.mjs 1 2 3 4 5 6 7 8 9 --output /tmp/issue-family-1-9.json
   node .claude/skills/implement/scripts/build-acceptance-manifest.mjs /tmp/issue-family-1-9.json --output /tmp/acceptance-manifest-1-9.json --audit-output /tmp/acceptance-audit-1-9.md
   ```

6. Copy every acceptance checkbox, parent PRD section check, user story, and Principles check into the ledger. Expand composite rules-engine terms into their named atoms and proof surfaces. Record the dependency graph from the issue bodies and topologically sort the implementation work; do not assume issue-number order.
7. If any item has `## Principles`, follow the repository-native authority route, read the named domain/ADR sources, and record conformance obligations before coding.
8. Preflight every nonlocal proof requirement before editing. In particular, if the CI issue requires an observed GitHub Actions run rather than only a checked workflow file, establish that the workflow can be pushed/triggered and read. If that mechanism is unavailable, mark the exact CI criterion and its issue `blocked` and ask whether to proceed with code-only partial implementation; do not discover that limitation during closeout.
9. Locate the checked-in Python harness and run the smallest read-only oracle probe needed to establish its refill event order and deterministic output contract. The harness is the named fidelity oracle, so the TypeScript port and parity tests must preserve its observed refill timing. Record the conflicting child prose as an issue-text inconsistency; do not change the oracle or rewrite a parity expectation merely to match the prose. If the exact issue body makes both the conflicting prose and oracle parity independently normative with no precedence rule, stop here with that issue `blocked` and request an authoritative correction. No issue or PRD may close while that contradiction remains.

## 2. Initial ownership and artifact decisions

Ownership/placement decisions:

- Root workspace bootstrap owns the package manifest, lockfile, TypeScript configuration, root scripts, and runner configuration.
- The rules-engine workspace/module named by the issues owns the public TypeScript seam. Its API is tested through that public export, not through private internals.
- The checked-in Python harness remains the fidelity oracle. A narrowly owned exporter beside the oracle may produce deterministic fixtures, but production TypeScript must not invoke Python at runtime.
- Generated parity fixtures live in the test-fixture location named by the issue family and carry deterministic provenance. Replay/parity tests own consumption of those fixtures.
- CI configuration lives at the repository workflow boundary and invokes the same root commands used locally.
- Documentation for the public seam, fixture regeneration, replay contract, and CI belongs in the exact active docs named by the issues. Pre-existing unrelated documentation dirt remains untouched.

Artifact disposition:

- PRD #1 and issues #2-#9 remain active until their tracker closeout gates pass.
- The Python oracle and committed deterministic fixture set remain active implementation artifacts.
- Temporary exports, transcripts, body files, and proof packets remain under `/tmp`; retain any artifact named by a published evidence-identity inventory until closeout is complete, then record whether it was retained or removed.
- Any active requirements/report artifact named by the live issue bodies receives its repository-prescribed completion/archive disposition before staging. Otherwise artifact disposition is N/A because GitHub is the authority.
- Unrelated dirty documentation remains neither staged nor modified.

Initial progress ledger, populated with the exact live titles, dependency edges, and criterion text before the first edit:

| Issue | Dependencies/blockers | Acceptance and authority | Planned evidence and highest practical seam | Status | Closeout state |
|---|---|---|---|---|---|
| #1 | Every verified child of PRD #1; explicitly #2-#9 | Every generated parent PRD, user-story, decision, testing, Principles, and child-map check | Exact parent audit rows; reviewed implementation; exact CLOSED readback for all related children | planned | open; blocked from closure by child states |
| #2 | Exact edges from canonical snapshot | Every generated #2 check, copied verbatim | Evidence and test seam derived from #2; bootstrap/no-runner criteria may be evidence-only until tooling exists | planned | open |
| #3 | Exact edges from canonical snapshot | Every generated #3 check, copied verbatim | Evidence and test seam derived from #3 | planned | open |
| #4 | Exact edges from canonical snapshot | Every generated #4 check, copied verbatim | Evidence and test seam derived from #4 | planned | open |
| #5 | Exact edges from canonical snapshot | Every generated #5 check, copied verbatim | Evidence and test seam derived from #5 | planned | open |
| #6 | Exact edges from canonical snapshot | Every generated #6 check, copied verbatim | Evidence and test seam derived from #6 | planned | open |
| #7 | Exact edges from canonical snapshot | Every generated #7 check, copied verbatim | Evidence and test seam derived from #7 | planned | open |
| #8 | Exact edges from canonical snapshot | Every generated #8 check, copied verbatim | Evidence and test seam derived from #8 | planned | open |
| #9 | Exact edges from canonical snapshot | Every generated #9 check, copied verbatim | Evidence and test seam derived from #9 | planned | open |

The published ledger replaces each “every generated check” summary with one exact row per generated check before implementation or closeout; no acceptance checkbox is grouped or inferred from this planning shorthand.

`Scope ledger posted: yes; no edits started; unrelated dirty files exact pre-existing documentation paths from initial git status listed in the ledger; in-scope issues #1, #2, #3, #4, #5, #6, #7, #8, #9; related tracker classification done; artifact disposition listed; ownership/placement decisions listed.`

## 3. Issue-by-issue implementation

Proceed only after the refill conflict and any nonlocal-proof preflight are resolved. Follow the exact dependency graph, one issue at a time. If two children are technically inseparable, record that before coding, implement them in one integrated pass, and retain separate criteria, TDD rows, evidence, and closeout state for each issue.

1. **Workspace bootstrap owner.** Establish the minimal workspaces, strict TypeScript configuration, package scripts, runner, lint/typecheck/build commands, and lockfile required by the issue. Because no runner exists at intake, do not claim a red merely because a command or module is absent. After the manifest changes, run the repository's dependency install/synchronization command before interpreting tests. Then exercise the highest practical public import/command seam and record focused green evidence.
2. **Deterministic fixture-export owner.** Invoke the repository TDD workflow at the exporter seam. Add the smallest assertion for stable schema, event order, and byte-for-byte deterministic output. Run the named Python oracle twice from the same input; compare outputs and SHA-256 identities. Preserve provenance and ensure fixture regeneration produces no unreviewed diff on a second run.
3. **Public TypeScript rules-engine owner.** Restate the public seam from the issue as pre-agreed. Add contract tests through the public export. The first behavior red must fail for the intended missing/mismatched rule behavior, not for stale build output, an absent package, or a bad import. Implement the narrowest port with deterministic state transitions and no Python runtime dependency.
4. **Replay/parity owner.** Parameterize parity over every named fixture and every quantified case required by the issues; do not substitute representative sampling. Compare the TypeScript event/state sequence with the Python oracle, including the refill boundary. For refill timing, prove the order on one active replay instance—pre-refill state, triggering action, refill event, and observer—rather than comparing independent snapshots. Add repeat-run evidence that the same input yields the same output.
5. **Remaining functional children.** Continue in topological order, deriving a conservative public seam from each exact criterion. Use red-green-refactor where a runnable seam exists. Record docs-only and configuration-only criteria as evidence-only instead of inventing a unit test. Any changed existing expectation receives an `existing contract-change expectation` TDD row tied to the exact authorizing criterion.
6. **CI owner.** Make the workflow run the same install, lint, typecheck, test, and build commands used locally. Validate its syntax and local command equivalence. If acceptance requires an actual hosted run, retain the workflow URL/run result; a checked YAML file alone is not proof.
7. **Documentation owner.** Document only the shipped public seam, oracle/fixture regeneration contract, refill timing, replay/parity usage, and CI commands. Confirm docs examples execute against the final API. Record browser smoke as N/A only after exact intake confirms the family changes no UI, route, browser-consumed API shape, rendered behavior, browser fixture, or user action path.

Before the first command used as evidence, start this durable command ledger and append observed output-derived counts rather than reconstructing them later:

| Exact command | Observed result/counts | Run count | Represented SHA/tree |
|---|---|---:|---|
| Exact Python oracle/export command from the repository | failed/passed plus fixture and replay counts | positive integer | named working tree or final SHA |
| Exact focused runner command for the public rules-engine seam | failed/passed plus tests/files run | positive integer | named working tree or final SHA |
| Exact full parity/replay command | failed/passed plus fixture/case counts | positive integer | named working tree or final SHA |
| Dependency synchronization command selected by the root manifest | passed/failed with install result | positive integer | named working tree or final SHA |
| `npm run lint` | passed/failed with output-derived count | positive integer | named working tree or final SHA |
| `npm run typecheck` | passed/failed with output-derived count | positive integer | named working tree or final SHA |
| `npm test` | passed/failed with output-derived suites/tests | positive integer | named working tree or final SHA |
| `npm run build` | passed/failed with output-derived workspace/build count | positive integer | named working tree or final SHA |
| Exact hosted CI proof command/readback, when required | passed/blocked plus run URL/status | positive integer | final SHA |

After each issue, update its ledger row from `planned` to `in progress`, `satisfied`, or `blocked`; keep dependent rows and the parent open while a blocker exists. Run focused tests and typechecking regularly. After changing a public workspace export, rebuild upstream output before a consumer test if workspace resolution uses built artifacts; stale-output failures are setup-only and must be rerun after the build.

## 4. Working audit, staging, commit, and review

1. Generate/fill the working audit from `/tmp/acceptance-manifest-1-9.json`. It contains exactly one row per parent and child check, with the exact columns `Acceptance criterion or conformance check` and `Status`. Every satisfied Evidence cell contains:

   - `atoms:` every authoritative atom;
   - `proof surfaces:` concrete test path, exact command, fixture identity, documentation path, CI URL, or tracker anchor for each atom;
   - `sequence:` ordered events and observer for order-sensitive criteria, or a justified `sequence: N/A because the criterion is not sequence-sensitive`.

2. Run the acceptance exactness challenge against the canonical issue snapshot. Any unsupported, substituted, sampled, or contradictory condition becomes `blocked` or `not done`; it does not enter review as satisfied.
3. Run audit-only validation with `--review-entry --acceptance-manifest /tmp/acceptance-manifest-1-9.json` only when every row is satisfied. Reconcile fixture/report disposition and rerun `git status --short`.

`Implementation pre-stage gate passed: working pre-close audit drafted in the inspected issue-family audit sink; blocked/not done rows none; artifact disposition reconciled; ownership/placement decisions recorded; unrelated dirty files exact pre-existing documentation paths listed.`

4. Stage only implementation-owned paths explicitly. Inspect `git diff --cached --name-only`; the unrelated documentation paths must not appear.

`Implementation commit gate passed: staged files scoped yes; staged file list exact implementation-owned paths from cached diff; working pre-close audit inspected issue-family audit sink; blocked/not done rows none; artifact disposition reconciled.`

5. Commit the implementation locally. Invoke the repository `code-review` workflow against the resolved pre-implementation fixed point through the implementation `HEAD`, covering both Standards and Spec. The Spec review uses the exact #1-#9 snapshot and includes one coverage row per issue plus exact parent PRD coverage.
6. Fix every review finding. Behavior-changing fixes receive intended-red/green proof; do not count wrong-reason red failures. Stage only owned files, amend or make a follow-up commit intentionally, and keep the review frame anchored at the original fixed point through final `HEAD`. Re-review after every substantive fix until there are no unhandled findings, or record accepted residuals with axis/source/rationale and the exact `unhandled findings none beyond accepted residuals` disposition.
7. On the final commit, rerun every canonical command and required hosted/fixture/parity proof. Publish only command-ledger rows representing the final SHA. Refresh current, historical-red, and superseded evidence identities and run a superseded-token sweep against the exact closeout sink.
8. Decide reachability. If the final SHA is remote-reachable, record the branch proof. If it is not and no repository policy requires push, use the full sentence: `Local-only SHA: FINAL_SHA is not remote-reachable because no push was requested or performed; local-only closeout is acceptable because the user requested implementation and tracker closeout without a push or PR.` If policy requires remote reachability, push and verify it before closing; otherwise keep tracker closeout blocked.

## 5. Final closeout ledger

The final audit is not an issue-level summary. Under each issue below, the manifest expands to one exact row per acceptance or conformance check, and every row must be `satisfied` before that issue can close.

| Issue | Required final ledger state | Required closeout evidence | Tracker disposition |
|---|---|---|---|
| #2 | Every manifest row for #2 `satisfied` | Exact atoms/surfaces/sequence, final-SHA command ledger, TDD/evidence-only row, review coverage | close only after rollup exact-read |
| #3 | Every manifest row for #3 `satisfied` | Exact atoms/surfaces/sequence, final-SHA command ledger, TDD/evidence-only row, review coverage | close only after rollup exact-read |
| #4 | Every manifest row for #4 `satisfied` | Exact atoms/surfaces/sequence, final-SHA command ledger, TDD/evidence-only row, review coverage | close only after rollup exact-read |
| #5 | Every manifest row for #5 `satisfied` | Exact atoms/surfaces/sequence, final-SHA command ledger, TDD/evidence-only row, review coverage | close only after rollup exact-read |
| #6 | Every manifest row for #6 `satisfied` | Exact atoms/surfaces/sequence, final-SHA command ledger, TDD/evidence-only row, review coverage | close only after rollup exact-read |
| #7 | Every manifest row for #7 `satisfied` | Exact atoms/surfaces/sequence, final-SHA command ledger, TDD/evidence-only row, review coverage | close only after rollup exact-read |
| #8 | Every manifest row for #8 `satisfied` | Exact atoms/surfaces/sequence, final-SHA command ledger, TDD/evidence-only row, review coverage | close only after rollup exact-read |
| #9 | Every manifest row for #9 `satisfied` | Exact atoms/surfaces/sequence, final-SHA command ledger, TDD/evidence-only row, review coverage | close only after rollup exact-read |
| #1 | Every generated parent PRD row `satisfied`; every true child verified CLOSED by exact number | Parent solution/stories/decisions/testing/Principles/child map, final review, post-child state readback | close last |

Shared closeout evidence also contains final SHA/reachability, final verification counts, full TDD gate or justified N/A per evidence-only row, `Review:` or full `Review fallback:` evidence, Principles/ADR conformance or N/A, browser evidence/console/freshness N/A with the exact no-browser-surface reason, and the complete evidence-identity refresh.

## 6. Child-family tracker mutation sequence

1. Because this family has eight children, choose one parent PRD rollup as the durable audit sink. Build the parent body under `/tmp` from the completed manifest/audit. Run the mandatory `--size-plan --require-headroom` gate before filling it. If it reports `low-headroom` or `exceeds-limit`, split the audit into disjoint subset manifests: post and exact-read a validated shared core first, post and exact-read each linked audit chunk, patch the core with the verified HTTPS chunk index, revalidate with `--split-core-final`, and exact-read it again. Never compress away atoms or proof surfaces.
2. Inspect the exact body in bounded excerpts; check byte size; sweep unresolved angle tokens; visually verify grouped criteria, status literals, review/TDD/browser/identity fields, and stable sink wording. Do not publish a `/tmp` staging path.
3. Run all applicable TDD, normal-review or fallback-review, and implement closing validators against the exact body and acceptance manifest. Include `--expected-final-sha`, plus `--principles`, `--local-only`, `--review-fallback`, and `--fixed-child-pending` only when their conditions apply.
4. Immediately before the first tracker mutation, rerun the implement validator with `--emit-preflight --mutation-ready`. Copy its exact `Closeout preflight:`, `Closeout gate passed: audit sink ...`, `Post-comment verification next:`, mutation-ready confirmation, and accepted-residual summary into the durable transcript. A plain successful closing validation is not mutation-ready.
5. Post the parent rollup first with `gh issue comment 1 --body-file ...`, capture the returned comment URL, and exact-read the stored UTF-8 body with `verify-github-comment-body.mjs`. On mismatch or readback failure, do not replay the mutation; use a read-only retry and continue only after exact verification.
6. Use fixed-template child closeout. After the real parent URL exists, inspect this exact string once and preserve it unchanged:

   `Fixed child final inline close comment inspected: Completed by FINAL_SHA. Evidence: PARENT_ROLLUP_COMMENT_URL`

7. Close #2 through #9 only if each issue's own audit rows are all `satisfied`, using the exact inspected inline string. Do not close a blocked child merely because siblings passed.
8. Read each child state back by exact issue number with output-bounded state-only queries. If a close result is ambiguous, verify before replaying. Record a durable post-child verification that explicitly names `#2 CLOSED`, `#3 CLOSED`, `#4 CLOSED`, `#5 CLOSED`, `#6 CLOSED`, `#7 CLOSED`, `#8 CLOSED`, and `#9 CLOSED` in a parent rollup patch, follow-up parent comment, or inspected parent close comment.
9. Re-read the closeout gates and refresh/revalidate any parent body or close comment changed by the child-state evidence. Exact-view all other related children discovered during intake. Close PRD #1 only when every true blocking child is verified CLOSED and every parent audit row is satisfied.
10. Exact-read #1-#9 again after the parent close. Report completion only if all nine states are confirmed CLOSED. Run final `git status --short`, report the final SHA and reachability, confirm unrelated documentation dirt is unchanged, stop only proof-owned processes/sessions, and record the retained-or-removed disposition of temporary evidence artifacts. If any state readback is unavailable, report it as unverified and keep the parent completion claim blocked.
