---
name: code-review
description: Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes — Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/PRD asked for?). Prefers parallel sub-agents when policy permits, otherwise runs a local two-axis fallback. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to "review since X".
---

Two-axis review of the diff between `HEAD` and a fixed point the user supplies:

- **Standards** — does the code conform to this repo's documented coding standards?
- **Spec** — does the code faithfully implement the originating issue / PRD / spec?

**Orientation.** The core review is Steps 1–5 (pin the fixed point, identify the spec and standards sources, run both axes, aggregate) plus the sub-agent prompts. The immediate-fix compact shape, TDD closeout gate, and evidence-identity / backend-currentness handoff fields further down apply only when this skill is invoked by the `implement` skill for tracker closeout; a standalone "review since X" needs only the core.

Both axes should run as **parallel sub-agents** when the available tool policy permits it, so they don't pollute each other's context. Tool availability alone is not permission: if the sub-agent tool policy requires explicit user authorization and the user did not grant it, treat sub-agents as policy-blocked. If sub-agents are unavailable or policy-blocked, run both axes locally in separate sections and document the deviation.

The issue tracker should have been provided to you — run `/setup-matt-pocock-skills` if `docs/agents/issue-tracker.md` is missing.

## Process

### 1. Pin the fixed point

Whatever the user said is the fixed point — a commit SHA, branch name, tag, `main`, `HEAD~5`, etc. If they didn't specify one, ask for it.

Exception: when invoked as part of implementation closeout after the implementation has already been committed locally, default to `HEAD~1` unless the user or calling skill supplied a different fixed point.

If review findings are fixed in one or more follow-up commits, keep the original fixed point for any final or residual implementation-closeout review. Use the new `HEAD~1` only when explicitly reviewing just the follow-up fix commit; otherwise it drops the original implementation diff from the review frame.

Capture the fixed-point input, the resolved fixed-point SHA (`git rev-parse <fixed-point>`), the reviewed HEAD SHA (`git rev-parse HEAD`), the durable diff command `git diff <resolved-fixed-point-sha>...HEAD` (three-dot, so the comparison is against the merge-base), and the list of commits via `git log <resolved-fixed-point-sha>..HEAD --oneline`. Use the resolved SHA in durable closeout artifacts; relative refs such as `HEAD~1` are acceptable as the input, but not as the only durable review frame.

Validator expectation: in the durable review frame, write the diff command with the resolved fixed-point SHA itself, for example `git diff abc1234...HEAD`. Do not leave `HEAD~1...HEAD`, `main...HEAD`, or another relative/name ref as the only diff command after recording the resolved SHA.

Run `git status --short` before fixing the review inputs. If the worktree is dirty, state whether the review covers only the committed diff or also staged/unstaged work. The default implementation-closeout review covers committed changes only; label dirty files as excluded unless the user asked for a work-in-progress review. For work-in-progress review, add `git diff --cached` and `git diff` as explicit inputs to both axes, alongside the committed diff when relevant.

Before going further, confirm the fixed point resolves (`git rev-parse <fixed-point>`) and the diff is non-empty. A bad ref or empty diff should fail here — not inside two parallel sub-agents.

### 2. Identify the spec source

Look for the originating spec, in this order:

1. Issue references in the commit messages (`#123`, `Closes #45`, GitLab `!67`, etc.) — fetch via the workflow in `docs/agents/issue-tracker.md`.
2. When invoked as part of implementation closeout, the originating PRD/issues already resolved by the implementation workflow count as the spec source; cite those issue numbers and any created spec file.
3. A path the user passed as an argument.
4. A PRD/spec file under `docs/specs/`, `docs/`, or `.scratch/` matching the branch name or feature.
5. If nothing is found, ask the user where the spec is. If they say there isn't one, the **Spec** sub-agent will skip and report "no spec available".

If the chosen issue, PRD, or spec has a `## Principles` section, treat that inline section as binding and read the domain-authority guidance selected by `docs/ACTIVE-DOCS.md` (in this repository, `docs/agents/domain.md`). Follow that guidance by reading `CONTEXT.md` and relevant `docs/adr/` entries when present, plus any principle or ADR documents named by the source. Treat those authorities as part of the Spec axis: they are conformance requirements, not optional background. Do not require `docs/principles/README.md` unless the active guidance points to it or the file exists. If the diff contradicts an applicable authority, flag it explicitly using the repo's contradiction wording.

Before dispatch, write `Pre-dispatch Spec source inventory:` to the durable review sink. List every selected issue, PRD, spec, principle, and ADR as a concrete issue/PR identifier or path, separated with ` | `; use the exact single value `no spec available` only after the no-spec route above is confirmed. A tracker comment is concrete when recorded as its URL or as `issue #N comment <comment-id>` / `PR #N comment <comment-id>`. This inventory is the dispatch authority, not a retrospective summary.

### 3. Identify the standards sources

Anything in the repo that documents how code should be written, such as `CODING_STANDARDS.md` or `CONTRIBUTING.md`.

Also include root agent instructions such as `CLAUDE.md` or `AGENTS.md`, plus repo agent docs they point to, when they define coding, review, tracker, or verification conventions. Principle documents identified in step 2 belong to the Spec axis unless they also state a coding or workflow convention.

Before dispatch, write `Pre-dispatch Standards source inventory:` to the same durable sink. List every standards-source file as a concrete path and include the literal `smell baseline`, separated with ` | `. Do not substitute summaries such as `repository conventions` or `package boundaries` for the files that establish those rules.

On top of whatever the repo documents, the Standards axis always carries the **smell baseline** below — a fixed set of Fowler code smells (_Refactoring_, ch.3) that applies even when a repo documents nothing. Two rules bind it:

- **The repo overrides.** A documented repo standard always wins; where it endorses something the baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation — and, like any standard here, skip anything tooling already enforces.

Each smell reads *what it is* → *how to fix*; match it against the diff:

- **Mysterious Name** — a function, variable, or type whose name doesn't reveal what it does or holds. → rename it; if no honest name comes, the design's murky.
- **Duplicated Code** — the same logic shape appears in more than one hunk or file in the change. → extract the shared shape, call it from both.
- **Feature Envy** — a method that reaches into another object's data more than its own. → move the method onto the data it envies.
- **Data Clumps** — the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
- **Primitive Obsession** — a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
- **Repeated Switches** — the same `switch`/`if`-cascade on the same type recurs across the change. → replace with polymorphism, or one map both sites share.
- **Shotgun Surgery** — one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
- **Divergent Change** — one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
- **Speculative Generality** — abstraction, parameters, or hooks added for needs the spec doesn't have. → delete it; inline back until a real need shows.
- **Message Chains** — long `a.b().c().d()` navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
- **Middle Man** — a class or function that mostly just delegates onward. → cut it, call the real target direct.
- **Refused Bequest** — a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.

### 4. Run both review axes

Use the available sub-agent mechanism, if permitted, with two independent read-only review tasks. Prefer running the axes in parallel; if the tool surface uses different role names, choose the closest general read-only reviewer role. If sub-agent tools may be deferred or lazy-loaded, perform the minimal tool-discovery check needed to inspect the surfaced sub-agent policy before deciding. If the discovered policy requires explicit user authorization to spawn agents and the user did not grant it, record `policy-blocked` and do not spawn. If the discovered policy says spawning agents requires explicit user authorization and the user did not explicitly ask for sub-agents, delegation, parallel agents, or parallel agent work, the discovery check is complete: record `policy-blocked`, skip sub-agent prompt inspection/preparation, and proceed directly to local fallback. If sub-agents are unavailable or policy-blocked, run both axes locally against the same fixed point, keep the analysis separated under the same headings, and state that the fallback path was used.

After collecting sub-agent outputs, close every review sub-agent or session started for the review before handing back to `implement` or reporting completion. Record each review sub-agent ID and final status in the review evidence. Also record `Review subagent cleanup:` with one disposition per axis: `closed`, `close operation unavailable after terminal completion`, `auto-disposed after terminal completion`, or an explicit failed/still-running cleanup state. Follow it with `Review subagent cleanup proof:` covering every reviewer ID on both axes. A `closed` disposition requires the successful close-operation result; unavailable-close requires terminal status plus proof that no close capability surfaced; `auto-disposed` requires a post-terminal live-inventory absence or an unavailable/unaddressable follow-up result. Terminal completion alone never proves closure or auto-disposal. When the tool surface has no close primitive, wait for terminal completion and record the unavailable-close disposition; do not relabel terminal completion as closed or auto-disposed.

Record `Review recovery: none` when every required reviewer output completed normally. If a reviewer is interrupted after partial output, preserve the raw output in the durable sink and obtain the missing output from that same reviewer or a fresh reviewer. Record one exact recovery field naming the pass, axis, interrupted reviewer and partial-output state, durable raw-output sink, completing reviewer and terminal status, and the passed output-gate rerun; for example, `Review recovery: P1 Spec reviewer spec-1 interrupted after partial output; raw output preserved in durable sink issue #117 comment 5017616209; completion obtained from fresh reviewer spec-2 completed; output gate rerun passed`. Name every interrupted and recovery reviewer in `Review subagents:` and cleanup proof. If the main agent supplies, synthesizes, or completes required reviewer output, classify the entire review as local fallback, read [fallback-evidence.md](fallback-evidence.md), and do not publish a normal `Review:` result.

For a no-fix review, copy the dispatch authorities into `Handoff Standards source inventory:` and `Handoff Spec source inventory:` without adding, dropping, or summarizing entries. For an immediate-fix review, write `Final-review Standards source inventory:` and `Final-review Spec source inventory:` before the final re-review. Begin with every pre-dispatch entry and add every authority introduced by a fix, approval, clarification, or reviewer follow-up; a final Spec inventory may replace an exact pre-dispatch `no spec available` disposition when a source is supplied later. If a new authority appears while the final pass is underway, update the final-review inventory and ensure the final reviewer evaluates it. At handoff, copy the final-review inventories exactly into the two Handoff inventories. Re-read and reconcile the applicable sets before reporting zero findings or returning to `implement`.

When local fallback is required, read [fallback-evidence.md](fallback-evidence.md) before reviewing or handing back to `implement`. It owns the non-bypassable fallback gate, local fallback checklist, mandatory durable output, body validator flags, and caller handoff stop.

For normal and fallback review alike, use validator-safe prose in compact review, TDD, audit, and evidence-identity values: avoid HTML-like angle tokens such as a backticked body tag and spell them in prose, for example `document body`. Follow [evidence-identities.md](evidence-identities.md) before proof cleanup as well as before handoff. A published current artifact is not safe to remove until closeout is complete and its retained-or-removed disposition is recorded; after removal, durable evidence must not imply that the local artifact remains inspectable.

Normal review immediate-fix handoff stop for `implement`: when sub-agent review ran normally and any findings were fixed before closeout, inspect the durable sink before returning the closeout-ready `Review:` line. It must contain the exact `Initial Standards outcome`, `Initial Spec outcome`, `Final Standards outcome`, `Final Spec outcome`, `Findings found`, keyed review finding ledger, `Fixes made`, `Review subagents`, `Review recovery`, `Review subagent cleanup`, `Review subagent cleanup proof`, `Pre-dispatch Standards source inventory`, `Pre-dispatch Spec source inventory`, `Final-review Standards source inventory`, `Final-review Spec source inventory`, `Handoff Standards source inventory`, `Handoff Spec source inventory`, `Browser/manual evidence freshness`, `Browser/manual console state`, `Backend process currentness`, `Evidence identity refresh`, `Verification rerun`, `Residual findings`, and `Axis summary` fields; use the explicit no-browser N/A values when browser/manual evidence was not used. Fill the shared block from [evidence-identities.md](evidence-identities.md), whether or not TDD ran. When TDD/review-fix evidence was required, it must also contain `TDD/review-fix evidence` and `TDD closeout gate`. Re-read [the canonical TDD closeout contract](../tdd/closeout-evidence.md) before filling those TDD fields; the current contract requires `Pre-red evidence reference:`, `Acceptance atom map:`, `Acceptance sequence map:`, `Evidence-only proof server preflight:`, `Evidence-only backend process currentness:`, and `Evidence identity refresh:` in the preflight, `atoms:`, `proof surfaces:`, `sequence:`, and applicable `RF-N` IDs in compact rows, `proof server preflight` in the literal gate, and one keyed `TDD review-fix map` row per finding with backend-currentness and identity-refresh dispositions. Reuse the same identity block rather than duplicating it. If any required field is missing or label-drifted, stop and fill it before handing back to `implement`.

Normal review no-fix handoff stop for `implement`: when sub-agent review ran normally and no findings were fixed before closeout, preserve this compact handoff evidence in the conversation, implementation ledger, or durable closeout sink before returning the closeout-ready `Review:` line:

- **Review subagents**: `<Standards and Spec sub-agent IDs and final statuses>`
- **Review recovery**: `<none / structured interrupted-review recovery record; local synthesis requires fallback instead>`
- **Review subagent cleanup**: `<Standards <closed / close operation unavailable after terminal completion / auto-disposed after terminal completion>; Spec <same / explicit failed or still-running state>>`
- **Review subagent cleanup proof**: `<Standards <every reviewer ID; successful close result / terminal status plus no close capability / post-terminal inventory absence or unaddressable follow-up>; Spec <same>>`
- **Pre-dispatch Standards source inventory**: `<concrete path | concrete path | smell baseline>`
- **Pre-dispatch Spec source inventory**: `<issue #N | concrete spec path / no spec available>`
- **Handoff Standards source inventory**: `<the exact same entry set as Pre-dispatch Standards source inventory>`
- **Handoff Spec source inventory**: `<the exact same entry set as Pre-dispatch Spec source inventory>`
- **Axis summary**: `Standards <count/worst>, Spec <count/worst>`
- **Residual findings**: `<none / accepted residual records below; unhandled findings none beyond accepted residuals>`
- **Accepted residual**: `<title>` when a finding is intentionally accepted
  - **Axis**: `<Standards / Spec>`
  - **Source**: `<reviewer finding plus file/hunk or acceptance source>`
  - **Rationale**: `<why closeout is allowed without a fix>`
  - **Revisit trigger**: `<concrete condition / N/A because permanently accepted judgement>`
- **Parent PRD coverage**: `<N/A / parent PRD row present / same-sink exact audit rows cited>` when parent PRD closeout is in scope
- **Browser/manual N/A checked**: `<N/A / exact issue or PRD criterion plus unchanged browser contract/routes/rendered behavior/validation response/fixtures/action path>` when issue-level browser/manual N/A is part of the acceptance source
- **Browser/manual evidence freshness**: `<final-tree rerun evidence / justified not affected with changed path and targeted proof / blocked or stale reason / N/A because no browser/manual evidence was used>` when browser/manual evidence was used or the normal validator is run with `--browser`
- **Browser/manual console state**: `<0 errors and 0 warnings / classified unrelated output with evidence / blocked reason / N/A because no browser/manual evidence was used>` when browser/manual evidence was used or the normal validator is run with `--browser`
- **Backend process currentness**: `<server command and watch/reload mode; process or port ownership; restart/reload proof; expected API field/behavior probe; when Current evidence identities names non-none fixture paths under --browser, stateful fixture snapshot method <method>; snapshot source <source>; expected-state probe <probe>, or N/A because no stateful fixture was copied / N/A because browser proof has no backend/API dependency / N/A because no browser/manual evidence was used / blocked because ...>`; always include this field and use the explicit no-browser N/A when applicable
- **Spec sequence coverage**: `<sequence: ordered events plus the proof that observes their order / sequence: N/A because ...>` when an issue coverage table does not carry per-row sequence dispositions
- **Evidence identity refresh**: `<paste the complete shared block from evidence-identities.md; required whether or not TDD ran>`
- **Review evidence line**: `<copy-ready Review: line below>`

For a multi-pass review or more than one TDD review fix, use the structured evidence JSON defined by the implement-owned [closeout template contract](../implement/references/closeout-templates.md) and add `--evidence-input <evidence.json> --immediate-fix --tdd-parent-rollup` to the normal-review builder command. Start the structured finding ledger with the first finding and append each later review pass and RF mapping to the same input. Treat it as the single source for compact TDD rows, RF rows, the review-finding ledger, finding counts and worst severities, issue/seam accounting, and repeated TDD/review summaries. Do not hand-copy those derived fields or maintain a second manual version after generation. Fill remaining non-derived placeholders and run the applicable validators.

For sibling or parent implementation closeouts that need size planning or split evidence, follow the implement-owned [Large Tracker Body Workflow](../implement/references/closeout-templates.md#large-tracker-body-workflow). It is the sole authority for builder selection, selectors, size gates, manifest partitioning, publication order, exact reads, and the patched core index. Code-review owns only the normal-review overlay: keep the complete normal review evidence once in the shared evidence core and validate that core with the normal review contract as well as every implement-owned check. Linked chunks must not repeat normal review evidence or claim to revalidate it. Do not copy the implement-owned CLI or sequence into this skill.

When the normal-review sink is a local body file, run `node .claude/skills/code-review/scripts/validate-review-normal-body.mjs <body.md>` before handing back. Add `--immediate-fix` when findings were fixed, `--parent-prd` when parent PRD closeout is in scope, `--child-family` for PRD child issue families, `--issue-set` when two or more sibling issues are reviewed without parent/child semantics, `--browser` when browser/manual evidence was used, `--tdd` when the body includes normal TDD closeout evidence, `--tdd-parent-rollup` instead of `--tdd` when that evidence uses the parent-rollup compact table, and `--closing` when the exact body will be posted or linked for tracker closeout. When closing validation includes TDD evidence, also pass `--expected-final-sha "$(git rev-parse HEAD)"`; the normal validator forwards that live SHA to nested TDD validation. Closing mode enforces a 65,536-byte body maximum by default; `--max-bytes <positive integer>` may lower that ceiling or match another tracker's documented contract, but must not be used to bypass GitHub's limit. `--parent-prd`, `--child-family`, and `--issue-set` each require `--acceptance-manifest <path>` generated from saved exact issue JSON; combine parent/child scope flags when both are in scope, and include every reviewed issue number in the manifest. The normal validator forwards that manifest and the applicable scope flags to nested TDD validation, and `--tdd-parent-rollup` itself requires the same manifest even when no other scope flag is present. If no local body file exists, apply the same manifest, table, sequence, identity, size, and closing-sink checks manually and record that the script was N/A because the sink was not local.

When invoked by the repo `implement` skill, also emit one closeout-ready review evidence line after the two-axis report, matching the caller's format:

- `Review: code-review against <fixed point>; outcome <no findings / findings fixed in SHA ...>; verification rerun <commands>.`
- `Review: code-review against <fixed point>; outcome accepted residuals recorded <count/source/rationale/revisit trigger>; unhandled findings none beyond accepted residuals; verification rerun <commands>.`
- `Review fallback: <why code-review could not run>; standards/spec result <...>; fixes <none / SHA ...>; verification rerun <commands>.`

If fallback was used, the closeout-ready line must start `Review fallback:` exactly. Do not use `Review:` for fallback reviews.

If normal sub-agent review reports accepted residuals, do not summarize the outcome as `no findings`. The durable handoff must record each residual separately with `Accepted residual:`, `Axis:`, `Source:`, `Rationale:`, and `Revisit trigger:` fields, and must state that no unhandled findings remain beyond accepted residuals. `Revisit trigger:` must name a concrete condition that reopens the decision, or say `N/A because permanently accepted judgement` when the decision is intentionally permanent.

If review reports no findings, or only accepted residuals, and no files change after review, `verification rerun` may state that no rerun was needed after review because the unchanged final tree already passed named gates. In that case, cite those gates explicitly and keep the implementation commit SHA as the reviewed SHA.

For behavior-changing review fixes that touch UI, route handlers, browser-consumed API shapes, fixtures, or an action path adjacent to earlier browser/manual evidence, `not affected` is acceptable only when the review evidence names the changed path, explains why the earlier evidence route/action path and browser-consumed API/fixtures were untouched, and reruns targeted proof for the changed path. Otherwise rerun the browser/manual evidence on the final tree or mark it blocked/stale.

When browser/manual proof consumes a backend, reachability alone is not currentness. Before accepting the final UI result, record `Backend process currentness:` with the server command and watch/reload mode, process or port ownership from the proof's execution context, restart/reload proof after relevant server/API edits, and the expected API field or behavior probe. When `Current evidence identities:` names non-`none` fixture paths, also record `stateful fixture snapshot method`, `snapshot source`, and `expected-state probe`, or the exact disposition `N/A because no stateful fixture was copied`. For SQLite with possible live WAL state, use `.backup` or a checkpoint-aware copy; raw `cp` is not snapshot proof. If a stale process or fixture caused an error or currentness is uncertain, restart the proof-owned backend, rebuild the fixture consistently, and rerun in a clean browser session. Use a reasoned N/A only when no browser/manual evidence was used or the browser proof has no backend/API dependency.

If the later review fix is non-semantic formatting, comment wording, documentation, or closeout text, inspect the diff and record `Browser/manual evidence freshness: not affected because changed path <path> is <non-semantic reason>; earlier evidence route/action/API/fixture <route/action/API/fixture> is untouched; diff inspected and targeted proof <command> passed` instead of rerunning browser/manual evidence.

If the final browser/manual proof ran on the same tracked file content that was later committed, do not force a fake rerun only to attach a SHA. Record `Browser/manual evidence freshness: not affected because git commit metadata only; no tracked file content changed after the proof; earlier evidence route/action/API/fixture <route/action/API/fixture> is untouched; targeted proof git diff HEAD -- <owned files> passed or was empty`.

**Standards sub-agent prompt** — include:

- The full diff command and commit list.
- Any staged/unstaged WIP diff inputs captured in step 1.
- The list of standards-source files you found in step 3, **plus the smell baseline from step 3** pasted in full — the sub-agent has no other access to it.
- The exact `Pre-dispatch Standards source inventory` value. Do not dispatch if the files in the prompt differ from that inventory.
- The brief: "Report — per file/hunk where relevant — (a) every place the diff violates a documented standard: cite the standard (file + the rule); and (b) any baseline smell you spot: name it and quote the hunk. Distinguish hard violations from judgement calls — documented-standard breaches can be hard, but baseline smells are always judgement calls, and a documented repo standard overrides the baseline. Skip anything tooling enforces. Under 400 words."

**Spec sub-agent prompt** — include:

- The diff command and commit list.
- Any staged/unstaged WIP diff inputs captured in step 1.
- The path(s), issue number(s), or fetched contents for every spec source.
- The exact `Pre-dispatch Spec source inventory` value. Do not dispatch if the prompt sources differ from that inventory.
- If the spec source is a PRD child issue family or two or more sibling issues, require a compact per-issue coverage table: `Issue | Acceptance source | Evidence reviewed | Findings/residuals`. Every reviewed issue should have a row before reporting zero residual Spec findings.
- If the parent PRD itself is being closed by the implementation workflow, require a parent PRD row in that table, or a citation to exact same-sink audit rows that cover the parent PRD's solution, implementation decisions, testing decisions, principles, and child map.
- If a reviewed issue, parent PRD row, PRD criterion, or acceptance source contains a named list of required items, require the `Acceptance source` cell to enumerate concrete items such as `AC1`, `criterion 2`, or checklist IDs, split them into multiple rows, or cite adjacent exact acceptance table rows/range before reporting zero residual Spec findings. Broad issue or parent summaries are not enough.
- For parent PRD user-story inventories, require one keyed row per individual `USN` in the coverage table or an adjacent keyed map. A broad range such as `US1-US36` may identify the inventory boundary but does not replace individual story rows.
- If an acceptance source uses a composite term, require the reviewer to resolve it through authoritative issue/PRD definitions, implementation decisions, glossaries, or named contracts, then enumerate its atoms and required proof surfaces in the `Acceptance source` cell or an adjacent keyed map before reporting zero residual Spec findings. For example, `provenance` may mean `actor + timestamp + flow step` across `API + report + browser`; evidence for the umbrella noun alone is incomplete.
- Require every zero-residual issue coverage row to include `sequence:` in its `Acceptance source`: name the ordered events and the proof that observes their order, or use `sequence: N/A because ...` when the criterion is not sequence-sensitive. Independently observed states do not prove a required transition order. When no issue coverage table applies, require a `Spec sequence coverage:` field with the same ordered-proof or justified-N/A shape before reporting zero Spec findings.
- For routed, guided-flow, or multi-surface UI work, require the reviewer to verify acceptance on the production route and action path the user actually reaches, and to reject legacy, adjacent, inactive, or full-workspace-only surfaces as proof for active routed requirements.
- If an acceptance item says browser/manual proof is N/A, require the reviewer to verify that the diff does not change browser contract, routes, rendered behavior, validation response, fixtures, or action path. If any of those browser-consumed surfaces changed, the reviewer must require browser/manual evidence or report a residual finding.
- Require an exact-acceptance challenge before zero Spec findings: every acceptance item must map to evidence for the exact condition the source names, and broad `equivalent`, `representative`, `active-route replay`, or nearby-surface proof must be rejected unless the spec explicitly permits substitution.
- If an acceptance item requires cold external LLM, fresh subagent, packet-read, credentialed service, or other nonlocal proof, require the reviewer to verify the exact artifact/result, blocker, or same-sink audit row before reporting zero residual Spec findings; repo-local tests alone are not proof for those criteria.
- Any `## Principles` section from the spec source, plus the repo-native domain authority and named principle/ADR documents read in step 2.
- The brief: "Report: (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong. Quote the spec line for each finding. Keep narrative prose under 400 words; mandatory coverage tables and keyed ledgers are excluded from this limit."
- Output hard stop: Reject a zero-residual Spec response that omits any required coverage table, keyed map or ledger, or sequence disposition. Request a completed response, or finish the Spec axis through local fallback, before aggregation.

If the spec is missing, skip the Spec sub-agent and note this in the final report.

### 5. Aggregate

**Pre-fix reporting gate.** After both initial axis results are available and before any patch, amend, commit, or reviewer follow-up task, present the two reports under visible `## Standards` and `## Spec` headings, verbatim or lightly cleaned. Each axis block must state its initial finding count, worst severity (or `none`), and findings (or `none`; for a missing spec, use the required no-spec disposition). Do **not** merge or rerank findings — the two axes are deliberately separate (see _Why two axes_). Do not proceed to fixes until both blocks are visible; a later durable closeout or an announcement of only one axis does not satisfy this gate. If time is short, use compact content under both headings.

If local fallback was used during implementation closeout, emit the mandatory local fallback block from step 4 before the implementation pre-close audit. The pre-close audit may duplicate review evidence, but it does not substitute for the delegation policy source, `## Standards`, `## Spec`, and any issue coverage table required by this skill.

If the review resumes, compacts, or is interrupted before final reporting, revalidate the review frame before presenting results: rerun fixed-point resolution, `git status --short`, the non-empty diff check, and the commit list, then re-read the durable pre-dispatch Standards and Spec source inventories. If either inventory is missing or stale, reconstruct it before reporting. Reconcile Handoff against pre-dispatch for a no-fix review and against the source-preserving Final-review inventories for an immediate-fix review. Also reconstruct `Review recovery:` from preserved raw reviewer output and actual reviewer statuses; never relabel main-agent synthesis as normal sub-agent completion.

End with a one-line summary: total findings per axis, and the worst issue _within each axis_ (if any). Don't pick a single winner across axes — that's the reranking the separation exists to prevent.

After the pre-fix reporting gate, if fixes are made immediately, rerun the relevant verification, state whether the commit was amended or followed by a new commit, and include the review outcome in the implementation closeout evidence. After each review-fix amend or follow-up commit, rerun the affected review axis, or the full two-axis review when the fix could affect both axes, against the original fixed point through final `HEAD` before reporting `Residual findings: none`; if an axis is not rerun, record why the original review still covers the final tree. When a finding requires a behavior change, invoke the repo `tdd` skill where possible: add or adjust the smallest assertion first and run it red before fixing. If the red command fails for the wrong reason (missing file, generic invariant, unrelated assertion, or any failure that does not prove the intended behavior), record `partial red - wrong reason: <reason>`, then add or adjust the smallest assertion that fails for the intended behavior before patching; if impossible, record an explicit red-first skipped reason. If the code was already fixed to protect the tree or unblock verification, record that red-first was skipped and why. For behavior-changing review fixes, generic wording such as `fixed and covered` is not enough; the closeout must include the red command/failure or an explicit `red-first skipped because ...` reason. If a review finding is missing proof or coverage only, add the smallest assertion and run it; if it passes without code changes, record `coverage-only review fix; red-first N/A because behavior already existed and no code changed`; if it fails, treat the finding as missing behavior and use the normal TDD red-green path. If a review finding is Standards-only, ADR-only, or conformance-only and the fix does not change acceptance behavior, record that acceptance behavior did not change, use `red-first skipped because Standards-only/conformance-only fix did not change behavior` when TDD/review-fix evidence is required, rerun the affected review axis against the original fixed point through final `HEAD`, and state why any unrerun axis still covers the final tree. If a review fix touches UI, route handlers, browser-consumed API shapes, fixtures, or an action path covered by earlier browser/manual evidence, rerun that evidence on the final tree or record an explicit blocked/stale reason.

For immediate-fix closeout, use this compact shape after the two axis reports:

- **Initial Standards outcome**: `<count/worst plus findings before fixes>`
- **Initial Spec outcome**: `<count/worst plus findings before fixes>`
- **Final Standards outcome**: `<count/worst after re-review against the original fixed point through final HEAD>`
- **Final Spec outcome**: `<count/worst after re-review against the original fixed point through final HEAD>`
- **Findings found**: `<integer count and short titles>`

| Finding ID | Review pass | Axis | Reviewer | Original finding | Repair class | TDD disposition | Repair | Rerun evidence | Final status |
|---|---|---|---|---|---|---|---|---|---|
| P1-standards-1 | P1 | Standards | <initial reviewer ID> | <original finding> | <behavior / coverage-only / Standards-only / ADR-only / conformance-only / docs-only / evidence-only> | <RF-N / structured red-green proof / coverage-only reason / red-first skipped because ... / partial red reason / N/A because accepted residual ...> | <repair or accepted-residual disposition> | <affected/full-axis rerun evidence> | <fixed / accepted residual> |

Give every finding discovered in every review pass exactly one immutable row. Use `P<pass>-standards|spec-<ordinal>` IDs, keep later-pass findings in later `P<N>` rows, make `Findings found` equal the total row count, and reconcile P1 rows with the initial axis counts and accepted-residual rows with the final axis counts.

- **Fixes made**: `<files/behavior changed, proof/coverage added, or none>`
- **Review subagents**: `<Standards/Spec initial and final review sub-agent IDs and final statuses, or N/A because local fallback was used>`
- **Review recovery**: `<none / P<pass> <axis> reviewer <ID> interrupted after partial output; raw output preserved in durable sink <reference>; completion obtained from same/fresh reviewer <ID> completed; output gate rerun passed / N/A because local fallback was used>`
- **Review subagent cleanup**: `<Standards <closed / close operation unavailable after terminal completion / auto-disposed after terminal completion>; Spec <same / explicit failed or still-running state> / N/A because local fallback was used>`
- **Review subagent cleanup proof**: `<Standards <every reviewer ID; successful close result / terminal status plus no close capability / post-terminal inventory absence or unaddressable follow-up>; Spec <same> / N/A because local fallback was used>`
- **Pre-dispatch Standards source inventory**: `<concrete path | concrete path | smell baseline / N/A because local fallback was used>`
- **Pre-dispatch Spec source inventory**: `<issue #N | issue #N comment <comment-id> | concrete spec path | no spec available / N/A because local fallback was used>`
- **Final-review Standards source inventory**: `<every Pre-dispatch Standards entry plus concrete authorities introduced before final re-review / N/A because local fallback was used>`
- **Final-review Spec source inventory**: `<every Pre-dispatch Spec entry plus concrete authorities introduced before final re-review; may replace exact no spec available when a source arrived later / N/A because local fallback was used>`
- **Handoff Standards source inventory**: `<the exact same entry set as Final-review Standards source inventory / N/A because local fallback was used>`
- **Handoff Spec source inventory**: `<the exact same entry set as Final-review Spec source inventory / N/A because local fallback was used>`
- **TDD/review-fix evidence**: `<red command/failure per behavior-changing fix, partial red - wrong reason: <reason> plus follow-up intended red if applicable, coverage-only review fix reason, red-first skipped because Standards-only/conformance-only fix did not change behavior, explicit red-first skipped because ..., or linked keyed TDD review-fix map>`
- **Spec sequence coverage**: `<sequence: ordered events plus observing proof / sequence: N/A because ...>` when issue rows do not carry it
- **TDD closeout gate**: `<canonical TDD closeout preflight, compact rows, keyed review-fix map, and full fielded gate from ../tdd/closeout-evidence.md present or explicitly linked; includes Pre-red recovery status, durable anchored Pre-red evidence reference, Acceptance atom map, Acceptance sequence map, per-row atoms:, proof surfaces:, sequence:, and applicable RF-N IDs, Evidence-only proof server preflight:, Evidence-only backend process currentness, Evidence identity refresh with historical red identities, backend-currentness and identity-refresh dispositions for review fixes, and Evidence-only browser console state when browser/manual evidence-only rows exist: TDD evidence gate passed: durable sink <conversation/comment URL/stable issue reference before tracker URL exists>; compact table/header <present after structural check/equivalent fields present after structural check>; seams accounted for <all listed / exceptions named>; CONTEXT.md status <present/absent/N/A>; ADRs/principles/docs status <aligned because authorities and concrete basis / approved amendment or exception with durable authority reference / N/A because ...>; sequence evidence <present/N/A>; evidence identities <present/N/A>; partial-red / red-first skip reasons <none/listed>; evidence-only rows <none/listed>; proof server preflight <present/N/A>; existing-test contract-change rows <none / listed expectation-rewrite rows> / N/A because no tdd skill was invoked>`
- **Verification rerun**: `<commands and browser/manual checks>`
- **Browser/manual evidence freshness**: `<browser smoke rerun passed on final tree for route/action/API/fixture <route/action/API/fixture> with observed outcome <outcome> / rerun evidence on final tree / not affected because changed path <path> is outside the earlier evidence route/action/API/fixture <route/action/API/fixture> and targeted proof <command> passed / not affected because changed path <path> is non-semantic formatting, comment wording, documentation, or closeout text; earlier evidence route/action/API/fixture <route/action/API/fixture> is untouched; diff inspected and targeted proof <command> passed / not affected because git commit metadata only; no tracked file content changed after the proof; earlier evidence route/action/API/fixture <route/action/API/fixture> is untouched; targeted proof git diff HEAD -- <owned files> passed or was empty / explicit blocked or stale reason / N/A because no browser/manual evidence was used>`
- **Browser/manual console state**: `<0 errors and 0 warnings / classified unrelated output with evidence / rerun clean session because HMR, reused session, or agent-induced setup/request error tainted proof / N/A because no browser/manual evidence was used>`
- **Backend process currentness**: `<server command and watch/reload mode; process or port ownership; restart/reload proof; expected API field/behavior probe; when Current evidence identities names non-none fixture paths under --browser, stateful fixture snapshot method <method>; snapshot source <source>; expected-state probe <probe>, or N/A because no stateful fixture was copied / N/A because browser proof has no backend/API dependency / N/A because no browser/manual evidence was used / blocked because ...>`
- **Evidence identity refresh**: `<paste the complete shared block from evidence-identities.md; refresh it after every review fix or evidence rerun>`
- **Commit handling**: `<unchanged implementation commit SHA / amended commit SHA / follow-up commit SHA / no commit yet>`
- **Residual findings**: `<remaining Standards and Spec findings after affected/full-axis re-review against the original fixed point through final HEAD, or none; use the accepted-residual record shape above for each intentionally accepted finding>`
- **Parent PRD coverage**: `<N/A / parent PRD row present / same-sink exact audit rows cited>` when parent PRD closeout is in scope
- **Review evidence line**: `<copy-ready Review: line above>`
- **Axis summary**: `Standards <count/worst>, Spec <count/worst>`

## Why two axes

A change can pass one axis and fail the other:

- Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking the other.
