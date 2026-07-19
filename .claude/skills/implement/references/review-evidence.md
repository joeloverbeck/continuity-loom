# Review Evidence

Read this once implementation is ready for review, before pushing or closing
issues, and after any review-fix commit or amend.

## Review Before Closeout

Once the implementation is ready, invoke the repo `code-review` skill to review the work before pushing or closing issues.

The repo's code-review skill expects a fixed point. Use one of these routes:

- Commit the completed implementation locally, then run the `code-review` skill against `HEAD~1` or another fixed point before pushing or closing issues.
- If committing first would be inappropriate, run an explicit pre-commit review against `git diff HEAD` and say that you are adapting the review because no committed fixed point exists yet.
- If the `code-review` skill cannot run because a required mechanism is unavailable, including when sub-agents or other review tools are unavailable or policy-blocked, run a local two-axis review against the fixed point: standards/conventions and spec/acceptance. Defer to the `code-review` skill's fixed-point and tool-policy discovery rules before choosing fallback, and record whether fallback is due to unavailable tooling or policy-blocked delegation. Document the deviation and its reason, fix any findings, rerun the relevant gates, and include the review outcome in closeout evidence.
- If one review axis completes but another axis times out, fails, or becomes stale, keep the completed axis evidence, run local fallback for the missing or stale axis, and treat the closeout as local fallback evidence. Record `Review fallback: partial-axis fallback`, name the completed and fallback axes, include any available subagent IDs or statuses, and run the same fallback validators that apply to a full local fallback body.
- When local two-axis fallback is used during implementation closeout, carry forward the `code-review` skill's full mandatory fallback block into the durable closeout artifact, or link an adjacent durable sink that contains it. The one-line `Review fallback:` evidence line remains required, but it does not substitute for the review frame, including resolved fixed-point and reviewed HEAD SHAs, a diff command that uses the resolved fixed-point SHA rather than only `HEAD~1`, delegation policy source, `## Standards`, `## Spec`, PRD child coverage table when applicable, `Smell baseline applied:`, the shared evidence-identity block, axis summary, `Review fallback gate passed:` line, body-check token sweep, and any immediate-fix or TDD fields required by `code-review`. Do not label fallback evidence as `Review:`.
- If review finds no issues after the implementation commit, keep that commit as the final SHA; no second commit is needed. If review fixes happen after the implementation commit, stage only implementation-owned files and intentionally either amend the implementation commit or create a follow-up commit. Refresh the final SHA after the last commit, rerun required gates on the final tree, and use that final SHA in closeout comments.
- If review fixes create a follow-up commit instead of amending the implementation commit, keep the final review and closeout frame anchored at the original implementation fixed point through final `HEAD`. Do not default closeout review evidence to `HEAD~1` when that would cover only the review-fix commit.
- **Two-sink boundary.** Keep tracked implementation evidence separate from the publishable final closeout body. A tracked report committed with the implementation may name the fixed-point input and subject, but it must not carry its own final SHA, reviewed HEAD SHA, or terminal `Review:` result when adding those fields would require amending that same commit. Do not amend a tracked evidence report solely to append self-referential terminal review/SHA metadata. Put those final values in the uncommitted `/tmp` body, tracker comment, or another external durable sink; if a substantive review fix changes tracked evidence, re-review the final tree and record the terminal result externally.
- For behavior-changing review fixes, red-first evidence must fail for the intended review finding, not merely for a nearby or generic reason. If the first red command fails because of a missing test file, a generic invariant, an unrelated assertion, or any reason that does not prove the reviewed behavior is wrong, record it as `partial red - wrong reason: <reason>`, then add or adjust the smallest assertion that fails for the intended behavior and run that before patching. If a true intended-behavior red is impossible, record `red-first skipped because <specific reason>`.
- After any review-fix commit, decide whether the fix touches UI, route handlers, browser-consumed API shapes, fixture/data setup, or an action path covered by an earlier browser/manual smoke. If it does, rerun the smoke on the final tree before closeout, or record an explicit blocked reason in the closeout evidence. For touched server/API paths, first establish that the proof server loaded the reviewed code; a reachable stale process does not satisfy final-tree freshness. If the fix is a behavior-changing UI edit outside the smoked route/action path, `not affected` is acceptable only when you name the changed path, explain why the smoked route/action path and browser-consumed API/fixtures were untouched, and rerun targeted proof for the changed path.
- After any review-fix commit, complete this browser/manual freshness mini-gate before drafting closeout artifacts:
  - `Files touched since browser/manual smoke: <paths or none>`
  - `Affects UI/routes/browser-consumed API/fixtures/action path? <yes/no and why>`
  - `Backend process currentness: <N/A because no browser/manual evidence was used / N/A because browser proof has no backend/API dependency / server command and watch/reload mode; process or port ownership; restart/reload proof; expected API field/behavior probe>`
  - `Smoke freshness: <rerun command + observed outcome / N/A because ... / blocked because ...>`

If any amend or follow-up commit happens after review starts or after closeout artifacts are drafted, including evidence-only report/docs/artifact changes, run a post-amend closeout refresh before any tracker mutation:

- Refresh the final SHA and remote reachability, then replace stale SHA references in closeout bodies, issue comments, final response notes, and validator inputs.
- Recheck that the review frame still covers the final `HEAD`; if not, rerun review or extend the fixed-point frame rather than relying on the pre-amend review wording.
- Rerun required gates when the final tree changed, or state why the amend was closeout-text-only and did not require gate reruns.
- Recompute browser/manual freshness against files changed since the last smoke, including evidence artifacts and coverage/docs that affect the closeout claim.
- Re-establish backend-process currentness when server or browser-consumed API code changed after the proof server started.
- Refresh evidence identities after the final review change. Record `Current evidence identities:` and `Superseded evidence identities:` across fixture paths, browser sessions, packet paths/hashes, active revisions, and artifacts. Always record `Historical red identities retained:` so red-only identifiers are not mistaken for stale active proof; use `none` when no red proof ran, otherwise enumerate all five categories. Then run a `Superseded-token sweep:` against the exact closeout body and linked evidence, naming every normalized exact superseded value and the `rg`/`grep` command. Record the combined result as `no hits outside classified identity/history lines and no active-proof hits`, followed by any classified historical-red hits; use the explicit all-categories-none N/A wording only when every superseded category is `none`.
- Re-inspect body files, fixed-child inline comments, local-only SHA wording, evidence-identity fields, and all applicable validators after the SHA/body refresh.

The evidence-identity refresh is required even when review made no fixes: it proves that the final closeout body points only at the evidence that belongs to the reviewed tree. List every category explicitly, using `none` for an empty category. A broad statement such as “evidence refreshed” is not sufficient. If any superseded token still appears because it is historical context rather than an active citation, name the exact occurrence and why it cannot be mistaken for current proof; otherwise remove it before closeout.

Within each identity category, serialize multiple values with ` | `, for example `fixture paths /tmp/old-a.sqlite | /tmp/old-b.sqlite`. The shared review validator normalizes each value independently, stripping Markdown code/emphasis wrappers and trailing punctuation; it also accepts legacy comma-separated lists when every comma item is Markdown-wrapped. The `Superseded-token sweep:` must name every normalized value individually rather than repeating or depending on the category's raw formatted string.

Review evidence is a closeout hard stop. Before running any issue-close command, record one of these lines in the conversation or closeout audit:

- `Review: code-review against <fixed point>; outcome <no findings / findings fixed in SHA ...>; verification rerun <commands>.`
- `Review: code-review against <fixed point>; outcome accepted residuals recorded <count/source/rationale>; unhandled findings none beyond accepted residuals; verification rerun <commands>.`
- `Review fallback: <why code-review could not run>; standards/spec result <...>; fixes <none / SHA ...>; verification rerun <commands>.`

If normal `code-review` reports findings that are intentionally accepted rather than fixed, the durable closeout sink must name each accepted residual's axis, source, and rationale, and must state that no unhandled findings remain beyond the accepted residuals. Run the implement closeout validator with `--emit-final-summary` (or use the same summary emitted by `--mutation-ready`) and carry its machine-derived `Accepted residuals:` line into the final response. Preserve the accepted-residual count and affected axes, cite the durable record, and use `unhandled findings none beyond accepted residuals`; do not summarize either the closeout sink or final response as `no findings` or `no remaining findings`.

## Commit/SHA Decision Before Tracker Closeout

Before drafting closeout bodies or running tracker mutations, decide how the verified implementation tree will be identified:

- If tracker closeout is requested and committing is allowed, create or reuse a commit that contains only implementation-owned files, then rerun the required verification on that final tree or state why the post-commit change was closeout-text-only.
- If committing is inappropriate because the worktree contains unrelated user changes, the user forbids commits, or the implementation is intentionally left as WIP, record `Commit/SHA decision: no implementation commit; tracker closeout blocked because no final SHA represents the verified tree.`
- If repo policy and the user explicitly allow local-only closeout, use the local-only SHA path in `tracker-closeout-gates.md`; otherwise do not close tracker issues without a final SHA.
- If the implementation is otherwise complete but blocked by missing external proof, keep the issue open and carry the commit/SHA decision into the blocked-closeout handoff instead of forcing a closeout body.

When local two-axis fallback is used, include this copy-ready block from the repo `code-review` skill in the durable closeout artifact, or link an adjacent durable sink that contains it. Do not replace it with only the one-line `Review fallback:` summary.

```markdown
Review frame: fixed point input <ref>; fixed point resolved SHA <sha>; reviewed HEAD SHA <sha>; diff command `git diff <resolved-fixed-point-sha>...HEAD` with the resolved SHA, not only `HEAD~1...HEAD` or another relative/name ref; commits <git log <resolved-fixed-point-sha>..HEAD --oneline>; worktree scope <committed diff only / WIP inputs included>, excluded dirty files <none / paths>; spec source <issues/spec paths>.

## Standards

Fallback used: <unavailable tooling / policy-blocked delegation / partial-axis fallback / other reason>.
Delegation policy source: <tool metadata/policy inspected / no sub-agent surface found / partial-axis fallback with completed/fallback axes and subagent IDs/statuses / N/A because fallback was not delegation-related>.
Sources reviewed: <exact standards-source files or issue numbers; root agent instructions; smell baseline; named Principles/ADRs only when they state coding/workflow conventions>.
Smell baseline applied: <yes / skipped because ...>.
Findings: <none / bullets with file+hunk and standard or smell label>.

## Spec

Sources reviewed: <exact issue/PRD/spec files, named Principles/ADRs when applicable>.

| Issue | Acceptance source | Evidence reviewed | Findings/residuals |
|---|---|---|---|
| #N | <issue/spec/criterion; enumerate named list items; for composite terms enumerate atoms and proof surfaces or cite an adjacent keyed map; sequence: ordered events plus observing proof / N/A because the criterion is not sequence-sensitive> | <diff/tests/docs reviewed> | <none / finding> |

For zero-residual child-family reviews, this exactness rule also applies to
parent PRD rows. A broad parent summary is not enough. Either enumerate the
parent's concrete PRD sections or cite the exact audit rows in the same durable
sink, for example:

| #PARENT | exact acceptance audit table rows below for #PARENT PRD solution, implementation decisions, testing decisions, principles, and child map | <diff/tests/docs reviewed> | none |

Findings: <none / bullets with quoted spec line>.

TDD closeout gate: <canonical TDD closeout preflight, compact rows, keyed review-fix map, and full fielded gate from `.claude/skills/tdd/closeout-evidence.md` present or explicitly linked; includes Pre-red recovery status, durable anchored Pre-red evidence reference, Acceptance atom map, Acceptance sequence map, per-row atoms:, proof surfaces:, sequence:, and applicable RF-N IDs, Evidence-only backend process currentness, Evidence identity refresh with historical red identities, backend-currentness and identity-refresh dispositions for review fixes, and Evidence-only browser console state when browser/manual evidence-only rows exist: TDD evidence gate passed: durable sink <conversation/comment URL/stable issue reference before tracker URL exists>; compact table/header <present after structural check/equivalent fields present after structural check>; seams accounted for <all listed / exceptions named>; CONTEXT.md status <present/absent/N/A>; ADRs/principles/docs status <present/N/A>; sequence evidence <present/N/A>; evidence identities <present/N/A>; partial-red / red-first skip reasons <none/listed>; evidence-only rows <none/listed>; existing-test contract-change rows <none / listed expectation-rewrite rows> / N/A because no tdd skill was invoked>. When listing an existing-test contract-change row in the compact TDD table, use `Seam` = `existing contract-change expectation`, and make the red/failure cell begin with `existing contract-change expectation in <test file> because ...`.

Browser/manual evidence freshness: <rerun evidence on final tree / not affected because changed path <path> is outside the earlier evidence route/action/API/fixture <route/action/API/fixture> and targeted proof <command> passed / not affected because changed path <path> is non-semantic formatting, comment wording, documentation, or closeout text; earlier evidence route/action/API/fixture <route/action/API/fixture> is untouched; diff inspected and targeted proof <command> passed / explicit blocked or stale reason / N/A because no browser/manual evidence was used>
Browser/manual console state: <0 errors and 0 warnings / classified unrelated output with evidence / rerun clean session because HMR, reused session, or agent-induced setup/request error tainted proof / N/A because no browser/manual evidence was used>
Backend process currentness: <server command and watch/reload mode; process or port ownership; restart/reload proof; expected API field/behavior probe / N/A because browser proof has no backend/API dependency / N/A because no browser/manual evidence was used / blocked because ...>

Evidence identity refresh:
- Current evidence identities: fixture paths <paths/none>; browser sessions <names/none>; packet paths/hashes <paths and hashes/none>; active revisions <IDs/none>; artifacts <paths/IDs/none>
- Historical red identities retained: <fixture paths ...; browser sessions ...; packet paths/hashes ...; active revisions ...; artifacts ... / none>
- Superseded evidence identities: fixture paths <paths/none>; browser sessions <names/none>; packet paths/hashes <paths and hashes/none>; active revisions <IDs/none>; artifacts <paths/IDs/none>
- Superseded-token sweep: <command/result showing no active-proof hits, with historical-red occurrences classified / N/A because every superseded category is none>

If findings were fixed before closeout, include this block before the axis summary:

- **Findings found**: `<integer count and short titles>`

| Finding ID | Review pass | Axis | Reviewer | Original finding | Repair class | TDD disposition | Repair | Rerun evidence | Final status |
|---|---|---|---|---|---|---|---|---|---|
| P1-standards-1 | P1 | Standards | <reviewer ID or local fallback> | <original finding> | <behavior / coverage-only / Standards-only / ADR-only / conformance-only / docs-only / evidence-only> | <RF-N / structured red-green proof / coverage-only reason / red-first skipped because ... / partial red reason / N/A because accepted residual ...> | <repair or accepted-residual disposition> | <affected/full-axis rerun evidence> | <fixed / accepted residual> |

Give every finding from every review pass one immutable `P<pass>-standards|spec-<ordinal>` row. The integer in `Findings found` must equal the total row count; for normal review, P1 rows must also reconcile with the initial per-axis counts and accepted-residual rows with the final per-axis counts.

- **Fixes made**: `<files/behavior changed, proof/coverage added>`
- **TDD/review-fix evidence**: `<red command/failure per behavior-changing fix, partial red - wrong reason: <reason> plus follow-up intended red if applicable, coverage-only review fix reason, red-first skipped because Standards-only/conformance-only fix did not change behavior, explicit red-first skipped because ..., or linked keyed TDD review-fix map>`
- **Verification rerun**: `<commands and browser/manual checks>`
- **Commit handling**: `<unchanged implementation commit SHA / amended commit SHA / follow-up commit SHA / no commit yet>`
- **Residual findings**: `<remaining Standards and Spec findings, or none>`

Axis summary: Standards <count/worst>, Spec <count/worst>

Review fallback gate passed: frame <yes>; delegation policy source <yes>; Standards <yes>; Spec <yes>; child table <yes/N/A>; smell baseline <yes>; evidence identities <yes>; found-vs-residual <yes/N/A>; closeout line <yes/N/A>; immediate-fix block <yes/N/A>; tdd fielded closeout gate <yes after structural check/N/A>; verification/browser freshness <yes/N/A>.
Review fallback: <required when invoked by implement: why code-review could not run; standards/spec result <...>; fixes <none / SHA ...>; verification rerun <commands> / N/A when not invoked by implement>.
```

After filling or linking the fallback block, inspect the final durable body directly using the `code-review` body-check token sweep. Do not close issues if the body lacks `fixed point resolved SHA`, `reviewed HEAD SHA`, a diff command that uses the resolved fixed-point SHA, `Review fallback gate passed: frame`, `closeout line`, `verification/browser freshness`, exact child acceptance sources when a child table is required, or the exact `Review fallback:` closeout-ready line when fallback was used. Do not close if fallback evidence is mislabeled as `Review:`.

Before the implementation commit or any review-fix commit, rerun `git status --short`, identify unrelated existing changes, and stage only files owned by the implementation. Leave unrelated dirty files untouched and report them in the final response.
