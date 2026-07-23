---
name: code-review
description: Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes — Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/PRD asked for?). Prefers parallel sub-agents when policy permits, otherwise runs a local two-axis fallback. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to "review since X".
---

# Two-axis code review

Review one change set independently against:

- **Standards** — the repository's documented coding and workflow rules, plus the judgement-only smell baseline below.
- **Spec** — the originating issue, PRD, spec, principles, and applicable domain authorities.

Do not let one axis mask the other. Report both initial results before fixing anything, and never choose a single winner across axes.

This file is the complete standalone review path. When `implement` invokes the review for tracker closeout, also read [implementation-closeout.md](implementation-closeout.md) before dispatch and handoff. Read [fallback-evidence.md](fallback-evidence.md) only if independent reviewers cannot complete both axes. Read [evidence-identities.md](evidence-identities.md) only when the implementation-closeout path requires proof identities.

If `docs/agents/issue-tracker.md` is missing, route setup to `/setup-matt-pocock-skills` before continuing.

## 1. Pin the review frame

Use the fixed point the user supplied. If none was supplied, ask for it. During implementation closeout after a local implementation commit, default to `HEAD~1` unless the caller supplied another fixed point.

Resolve and retain:

- fixed-point input and `git rev-parse <fixed-point>` result;
- reviewed `HEAD` SHA;
- `git diff <resolved-fixed-point-sha>...HEAD` using the resolved SHA;
- `git log <resolved-fixed-point-sha>..HEAD --oneline`;
- `git status --short` and the review's worktree scope.

Keep the original fixed point when review fixes add commits. Use a later `HEAD~1` only when the user explicitly asks to review just the follow-up commit.

By default an implementation-closeout review covers committed changes and identifies dirty paths as excluded. A requested work-in-progress review must give both axes the committed diff plus `git diff --cached` and `git diff` as applicable; name excluded untracked or unrelated files.

Fail before reviewer dispatch if the fixed point does not resolve or the intended diff is empty. This run does not broaden the skill to tracker-only or other intentionally empty-diff reviews.

## 2. Freeze the authorities

### Spec sources

Select sources in order:

1. Issue or PR references in commit messages, fetched through the repository tracker guide.
2. Issues/PRDs already resolved by the invoking implementation workflow.
3. A source path supplied by the user.
4. A matching PRD/spec under `docs/specs/`, `docs/`, or `.scratch/`.
5. Ask the user. If they confirm none exists, record exactly `no spec available` and skip only the Spec reviewer.

If a source has `## Principles`, follow the authority route selected by `docs/ACTIVE-DOCS.md` and `docs/agents/domain.md`: read `CONTEXT.md`, relevant ADRs, and named principle documents when present. These are Spec requirements unless they also define coding or workflow conventions.

Before dispatch, write `Pre-dispatch Spec source inventory:` with concrete issue/PR identifiers, tracker comment URLs or `issue #N comment ID`, and paths separated by ` | `. Do not use a retrospective summary as the authority list.

### Standards sources

Read concrete repository standards such as `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, and the agent/domain guides they select. Before dispatch, write `Pre-dispatch Standards source inventory:` with every concrete path plus the literal `smell baseline`, separated by ` | `.

Apply this fixed smell baseline only to matters tooling does not already enforce. Repository rules override it, and every smell is a labelled judgement call rather than a hard violation:

- **Mysterious Name** — a name does not reveal purpose; rename or clarify the design.
- **Duplicated Code** — the same logic shape appears repeatedly; extract the shared shape.
- **Feature Envy** — behavior reaches into another object's data more than its own; move it toward that data.
- **Data Clumps** — fields or parameters repeatedly travel together; introduce one concept.
- **Primitive Obsession** — a primitive stands in for a domain concept; give it a focused type.
- **Repeated Switches** — the same type cascade recurs; centralize the choice or use polymorphism.
- **Shotgun Surgery** — one logical change forces scattered edits; gather what changes together.
- **Divergent Change** — one module changes for unrelated reasons; separate responsibilities.
- **Speculative Generality** — abstraction exists for needs the spec lacks; remove it.
- **Message Chains** — callers navigate deep object structure; hide the walk behind an owned method.
- **Middle Man** — a layer mostly delegates; call the real owner directly.
- **Refused Bequest** — an implementation ignores most inherited behavior; prefer composition.

## 3. Run independent axes

Use two parallel, read-only reviewers when the surfaced tool policy permits. Tool availability is not authorization. If the policy requires explicit user authorization and it was not given, record `policy-blocked` without preparing reviewer prompts and use local fallback. If reviewers are unavailable for another reason, also use fallback.

### Standards reviewer packet

Include the resolved diff command and commit list, any WIP diff inputs, the exact Standards inventory, the contents of its source files, and the full smell baseline above. Ask for every documented-standard breach by file/hunk with its source, plus labelled smell judgements quoting the hunk. Require hard violations and judgement calls to be distinguished and keep the response under 400 words.

### Spec reviewer packet

Include the same review frame and WIP inputs, the exact Spec inventory, and every selected source. Ask for missing or partial requirements, scope creep, and incorrectly implemented requirements; require the quoted source for each finding. Keep narrative prose under 400 words; mandatory coverage tables and keyed ledgers are excluded from this limit.

Before a zero-residual result, require exact acceptance rather than broad equivalence:

- For a PRD child family or two or more sibling issues, include `Issue | Acceptance source | Evidence reviewed | Findings/residuals` with one row per reviewed issue.
- When closing a parent PRD, cover the parent solution, decisions, principles, child map, and every individual user story through parent or same-sink keyed rows.
- Enumerate named criteria and checklist items. Resolve composite terms into their defined atoms and proof surfaces.
- Every zero-residual issue row must include `sequence:` with ordered events and observing proof, or `sequence: N/A because ...`. Without a coverage table, include `Spec sequence coverage:` in the same form.
- Verify routed or multi-surface UI requirements on the production route and action path, not an adjacent or inactive surface.
- Challenge browser/manual N/A whenever the diff changes a browser contract, route, rendered behavior, validation response, fixture, or action path.
- For required cold LLM, fresh-agent, packet, credentialed-service, or other nonlocal proof, inspect the exact artifact/result or report the blocker; repository-local tests are not a substitute unless the source permits one.

Output hard stop: Reject a zero-residual Spec response that omits a required coverage table, keyed map, ledger, or sequence disposition. Request completion or switch the entire review to local fallback before aggregation.

### Reviewer custody

Record reviewer IDs and terminal statuses. Close each reviewer when a close operation exists. Otherwise use the truthful disposition `close operation unavailable after terminal completion` with proof that each reviewer completed and no close capability surfaced; use `auto-disposed` only with post-terminal absence or an equivalent unaddressable-follow-up result.

Record `Review recovery: none` on the ordinary path. If a reviewer is interrupted after partial output, preserve the raw output durably and obtain the missing output from that reviewer or a fresh one. Record the pass, axis, both reviewer IDs/statuses, partial-output sink, and passed output-gate rerun. If the main agent synthesizes or completes required reviewer output, classify the whole review as local fallback; never publish it as a normal `Review:` result.

When fallback is required, read and follow [fallback-evidence.md](fallback-evidence.md), keep the axes separated, and label the caller handoff `Review fallback:`.

## 4. Report, then repair if authorized

Before any patch, amend, commit, or reviewer follow-up, present visible `## Standards` and `## Spec` sections. Each states its initial finding count, worst severity (or `none`), and findings (or `none`; use the confirmed no-spec disposition). Preserve the reviewer ordering and do not merge or rerank the axes.

End the review with one line giving each axis's count and worst issue. Explain accepted residuals separately with axis, source, rationale, and a concrete revisit trigger; never summarize them as no findings.

If fixes are authorized after the initial reports:

- retain an immutable `P<pass>-standards|spec-<ordinal>` row for every finding;
- keep the original fixed point and re-review each affected axis through final `HEAD`; run both axes when the fix may affect both;
- state why any axis not rerun still covers the final tree;
- distinguish findings found from residual findings and record amend/follow-up commit handling;
- for behavior-changing fixes, invoke the repository `tdd` skill where possible and retain intended-red, wrong-reason/skip, green, and review-fix mapping evidence;
- for missing-proof-only fixes, run the smallest assertion and classify a passing assertion without code change as coverage-only;
- for Standards-, ADR-, docs-, or conformance-only fixes that do not change acceptance behavior, say so rather than inventing a behavioral red;
- rerun or explicitly invalidate browser/manual proof when a fix changes a UI route, browser-consumed API shape, fixture, or covered action path.

If the review resumes after compaction or interruption, re-resolve the fixed point and `HEAD`, rerun status/non-empty-diff/commit-list checks, re-read both pre-dispatch inventories, and reconstruct reviewer recovery from preserved output and actual statuses before reporting.

## 5. Implementation closeout only

When invoked by `implement`, follow [implementation-closeout.md](implementation-closeout.md) after the two-axis report. It owns normal handoff fields, immediate-fix accounting, source-inventory propagation, browser/currentness and identity triggers, nested TDD validation, body validator flags, and the `Review:` line. The `implement` skill remains the owner of combined body construction, acceptance manifests, large-body splitting, publication, and tracker readback.

For normal and fallback closeout values, use validator-safe prose; avoid HTML-like angle tokens and unresolved placeholder words. Do not load this closeout branch for a standalone review.

