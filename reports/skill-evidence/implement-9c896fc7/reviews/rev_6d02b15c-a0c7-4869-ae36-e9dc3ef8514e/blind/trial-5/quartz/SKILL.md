---
name: implement
description: "Implement a piece of work based on a PRD or set of issues."
disable-model-invocation: true
---

Implement the work described by the user in the PRD or issues.

## Required References

Load the phase-specific reference before acting in that phase:

Read each selected reference independently through EOF before acting on it. If a reference is long, read it in bounded, contiguous chunks and confirm that the final chunk reaches EOF. A truncated combined read, summary, grep hit, or partial excerpt does not count as reading the selected reference.

- Read [references/scope-ledger.md](references/scope-ledger.md) before the first edit whenever work is based on a PRD, issue, issue range, or related tracker family.
- Read [references/implementation-evidence.md](references/implementation-evidence.md) while working issue-by-issue, before writing tests, before browser/manual proof, and before staging an implementation commit.
- Read [references/review-evidence.md](references/review-evidence.md) once implementation is ready for review, before pushing or closing issues, and after any review-fix commit or amend.
- Read [references/tracker-closeout-gates.md](references/tracker-closeout-gates.md) before declaring completion and immediately before the first tracker mutation in a continuous closeout sequence. Re-read it before resuming after interruption or compaction, or after the final SHA, evidence, or closeout body changes; mutation-specific state and inline-comment gates still apply before later commands in the same sequence.
- Read [references/child-family-closeout.md](references/child-family-closeout.md) whenever scope includes parent PRDs, 2+ child issues, fixed-template child closeout comments, or a parent rollup URL that child issues will cite.
- Read [references/closeout-templates.md](references/closeout-templates.md) before creating structured closeout evidence, drafting parent rollups, sibling-issue rollups, child-family audit bodies, `/tmp` body files, closeout preflight scratchpads, or final body-check commands.

## 1. Resolve the Real Scope

Before editing code, identify the authoritative work items and build a progress ledger. The ledger must cover issue number, title, dependencies/blockers, acceptance criteria, principles/ADR obligations or exceptions, planned evidence, test seams, closeout state, and the intended final disposition of every in-scope active spec, ticket, requirements set, report, or other completion artifact. It must also record ownership/placement for any new helper, store/query function, persistence call, or cross-module entrypoint, and expand composite acceptance terms into their authoritative atoms and required proof surfaces.

Hard stops:

- Run `git status --short` before the first edit. Record unrelated dirty files and leave them untouched unless they become in-scope.
- Fetch exact PRD/issue bodies and comments for the requested work items. For GitHub, use exact issue lookups with comments and structured fields.
- If a PRD issue is named, discover and verify related child issues, blockers, and linked implementation tickets before treating the parent as closable.
- If any fetched PRD or issue has a `## Principles` section, complete the repo-native authority procedure in [references/scope-ledger.md](references/scope-ledger.md) before coding; do not assume a conventional principles path exists.
- If any acceptance criterion requires proof outside normal repo-local tests, such as an external service, cold LLM or fresh subagent probe, browser automation, credentials, network access, or other nonlocal evidence, preflight that proof mechanism before editing. If it is unavailable, mark the affected issue closeout state `blocked`, name the exact criterion, and ask whether to proceed with code-only partial implementation.
- Do not silently collapse multiple issues into a smaller "skeleton" or "first slice" when the user asked for the issues.

Post the ledger to the conversation before the first edit and update it when dependencies, blockers, evidence, or closeout state changes materially. Use the compact table and related-tracker classification rules in [references/scope-ledger.md](references/scope-ledger.md).

First-edit gate: do not edit until the visible ledger or progress note includes `Scope ledger posted: yes; no edits started; unrelated dirty files <listed/N/A>; in-scope issues <#...>; related tracker classification <done/N/A>; artifact disposition <listed/N/A>; ownership/placement decisions <listed/N/A>.`

## 2. Work Issue-by-Issue

Default to one issue at a time. If child issues are technically inseparable and an integrated implementation pass is safer, say so in the ledger, keep the ledger/audit per issue, and map each issue's criteria to the shared implementation and tests.

Required implementation evidence:

- Invoke the repo `tdd` skill where possible at pre-agreed seams, or derive the conservative proposed seam from acceptance criteria and existing architecture. For docs-only or no-runnable criteria, record that no runnable seam exists instead of inventing a test.
- Carry TDD closeout evidence forward into the implementation ledger or final closeout audit. When `tdd` was invoked, the durable sink needs the full fielded `TDD evidence gate passed: durable sink ...` line.
- For UI/browser-visible behavior, run a real browser smoke or record why it is blocked. The proof must exercise the production route and decision/action path the user reaches, and browser/manual evidence stays preliminary until freshness is checked against the final touched-file set.
- On resume, compaction, or interruption before closeout, rerun `git status --short`, revalidate any active dev server/browser/session/proof artifact that the next step depends on, prove that any server used for browser evidence loaded the current backend code, and restate the next exact issue/evidence action.
- Run focused tests/typechecks regularly. Before closeout, read root verification guidance and run the canonical gates required for the work's blast radius.

Before committing, draft the working pre-close audit row-by-row against each in-scope acceptance criterion and Principles/ADR check. Reconcile the ledger's artifact disposition under the repository archival workflow before staging; a completed active artifact needs its required outcome/status, archive move, and authority-reference updates, or an explicit reason to remain active. Run the pre-review acceptance exactness challenge from [references/implementation-evidence.md](references/implementation-evidence.md) before treating any row as `satisfied`; planned, intended, nearby, or substituted behavior is not proof of the exact criterion. When a parent, child, decision, or glossary defines a composite term, prove every named atom on every required surface rather than citing the umbrella term. Quantified ranges owe every named value unless the source explicitly permits sampling, and lifecycle terms such as rerender, resume, or transition owe proof from the same active instance rather than independent snapshots. Do not enter review with unresolved `blocked` or `not done` rows unless the right outcome is to leave that issue open.

Tracked implementation evidence and publishable closeout evidence are separate sinks. A report included in the implementation commit may preserve the fixed-point input, subject, working audit, and pre-review evidence, but it must not embed that same commit's final SHA, reviewed HEAD SHA, or terminal `Review:` result: amending the report to add those values changes the identity it claims to describe. Keep the tracked report SHA-independent, and finalize the self-referential final SHA, terminal review frame, verification freshness, and tracker gates in an uncommitted `/tmp` body, tracker comment, or another external durable sink. Do not amend a tracked report solely to append its own terminal review/SHA metadata. If a substantive review fix changes tracked evidence, re-review the final tree and record the terminal result in the external closeout sink.

Keep the working audit and evidence sources current through implementation, but do not build or fill the final publishable closeout scaffold yet. Freeze its inputs only after terminal review/fixes, the commit/SHA decision, final verification, browser/manual freshness, and the evidence-identity refresh are known. See [references/implementation-evidence.md](references/implementation-evidence.md) for the detailed test, browser, verification, and implementation staging/commit gates.

Before staging, make this implementation pre-stage gate visible in the conversation or ledger:

`Implementation pre-stage gate passed: working pre-close audit drafted <sink/reference>; blocked/not done rows <none/listed>; artifact disposition <reconciled/N/A>; ownership/placement decisions <recorded/N/A>; unrelated dirty files <listed/N/A>.`

After staging and before committing, inspect the staged file list and make this second gate visible:

`Implementation commit gate passed: staged files scoped yes; staged file list <paths>; working pre-close audit <sink/reference>; blocked/not done rows <none/listed>; artifact disposition <reconciled/N/A>.`

## 3. Review Before Closeout

Once implementation is ready, invoke the repo `code-review` skill before pushing or closing issues. The review must be anchored to a fixed point.

Hard stop before fallback: read and apply the repo `code-review` skill before deciding that review fallback is required. Do not infer fallback from generic subagent/tool policy alone when `code-review` itself authorizes review agents or defines the applicable policy check.

Use one of these routes:

- Commit the completed implementation locally, then run `code-review` against `HEAD~1` or another fixed point.
- If committing first is inappropriate, run an explicit pre-commit review against `git diff HEAD` and state that no committed fixed point exists.
- If the `code-review` skill cannot run because required tooling is unavailable or policy-blocked, run the local two-axis fallback against the fixed point and carry the full fallback block into the durable closeout artifact.
- If one review axis completes but another axis times out, fails, or becomes stale, preserve the completed axis evidence, run local fallback for the missing or stale axis, label the closeout evidence `Review fallback: partial-axis fallback`, and carry the full fallback block and validators from [references/review-evidence.md](references/review-evidence.md).

Review evidence is a closeout hard stop. Before any close command, the conversation or durable audit must contain either `Review:` or `Review fallback:` evidence. After any review-fix commit or amend, refresh the final SHA, review frame, gates, browser/manual freshness, backend-process currentness for touched server/API paths, body files, fixed-child comments, local-only SHA wording, and validators as described in [references/review-evidence.md](references/review-evidence.md). Repeat that loop after each review-fix amend or follow-up commit until the final `HEAD` is covered by current review evidence with no unhandled Standards/Spec findings, or with explicitly recorded accepted residuals.

After review and final-tree evidence stabilize, freeze the closeout shape before the first final-scaffold build: decide every scope, review, TDD, browser, Principles, reachability, child, split, and N/A branch. When review produced findings or more than one TDD review fix, create or refresh one structured evidence JSON containing all already-known audit, TDD, and existing-test contract-change rows plus the terminal review findings and fixes, then build with `--evidence-input <evidence.json> --immediate-fix`; when it contains TDD rows or review fixes, also use `--tdd-parent-rollup`. Never hand-copy derived compact TDD rows, RF rows, the review-finding ledger, counts, severities, issue/seam accounting, or repeated summaries. If structured input is wrong, repair it and regenerate; do not patch derived sections or make rebuild/refill the normal path.

Apply the two-sink boundary from §2 during this loop: terminal reviewed-HEAD and final-SHA fields belong in the external publishable sink, not in a tracked report whose commit identity they would invalidate.

Before tracker closeout, decide whether the verified tree is represented by an implementation-owned commit. If committing is inappropriate, forbidden, or blocked, record that decision explicitly and keep tracker closeout blocked unless the user and repo policy allow closing without a final SHA.

## 4. Completion Audit and Issue Closeout

Before declaring completion, closing issues, or closing a parent PRD, read [references/tracker-closeout-gates.md](references/tracker-closeout-gates.md). If a child family or parent rollup is involved, also read [references/child-family-closeout.md](references/child-family-closeout.md). If drafting a long closeout body or scratchpad, also read [references/closeout-templates.md](references/closeout-templates.md).

Before filling a manifest-backed parent, sibling, or child-family closeout body, run the mandatory precomposition size/headroom gate in [references/closeout-templates.md](references/closeout-templates.md). Do not fill evidence until the size plan reports `ok`; on `low-headroom` or `exceeds-limit`, split the manifest and audit into disjoint chunks first.

Tracker mutation is blocked until all of these are true:

- A pre-close audit exists in an allowed durable sink with exact `Acceptance criterion or conformance check` and `Status` columns.
- Every acceptance checkbox or conformance check is named explicitly, every row for the issue being closed is `satisfied`, and each satisfied row's Evidence cell contains `atoms:`, `proof surfaces:`, and `sequence:` (use a justified `sequence: N/A because ...` for criteria that are not sequence-sensitive).
- For issue-family closeout, a manifest generated from saved exact issue JSON has been checked with `--acceptance-manifest`, so every acceptance criterion and Principles check has exactly one audit row.
- The final SHA is known, matches the tree that passed verification, and is either remote-reachable or covered by the full `Local-only SHA:` sentence.
- Verification evidence, TDD evidence or explicit N/A, review evidence, Principles/ADR conformance or explicit N/A, browser evidence/freshness or explicit N/A/blocked, and a post-review evidence-identity refresh with a superseded-token sweep are present.
- Applicable closeout validators have run against the exact inspected body when available, and visual inspection still confirms grouped criteria and literal statuses.
- For parent PRD closure, related child states have been verified by exact issue number.

Immediately before the first tracker mutation, run the applicable closing validator with `--emit-preflight --mutation-ready`, then make its exact `Closeout preflight:` block and literal `Closeout gate passed: audit sink ...` line visible in the conversation or durable audit sink. A successful `--closing` run without those two flags is explicitly not mutation-ready. Do not run `gh issue comment`, `gh issue close`, `glab issue close`, or equivalent until the closeout command gate in [references/tracker-closeout-gates.md](references/tracker-closeout-gates.md) passes.

If review ended with accepted residuals, use the implement validator's `--emit-final-summary` output as the final-response source of truth: preserve its count and affected axes, cite its durable record, and retain the exact phrase `unhandled findings none beyond accepted residuals`. Never replace that outcome with `no findings` or `no remaining findings`. `--mutation-ready` also emits this machine-derived summary. The count reflects the distinct accepted-residual findings (the finding ledger's `accepted residual` rows, or the structured residual records when no ledger exists); reconcile it against the distinct findings before publishing if the numbers ever disagree.

If browser/manual proof started a dev server, browser session, or long-running proof process, stop it before the final response or explicitly report why it remains running.

Run a final `git status --short`. For untracked verification artifacts, either remove them if safe, stage them if they are intended evidence, or explicitly report them in the final response. An artifact named in a published `Current evidence identities:` inventory is not safe to remove until closeout is complete and its retained-or-removed disposition is recorded without implying that a removed local artifact remains inspectable.
