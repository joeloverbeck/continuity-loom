---
name: implement
description: "Implement a piece of work based on a PRD, issues, or an explicit user-approved scope."
disable-model-invocation: true
---

# Implement

Implement the requested work as one evidence-backed transaction: resolve the live scope, make owned changes, verify the final tree, review it, and mutate the tracker only when closeout proof is complete.

## Phase references

Read a selected reference completely before acting in that phase:

- Tracker-backed intake: [references/scope-ledger.md](references/scope-ledger.md)
- Tests, implementation, browser/manual proof, verification, and staging: [references/implementation-evidence.md](references/implementation-evidence.md)
- Fixed-point review and post-review refresh: [references/review-evidence.md](references/review-evidence.md)
- Any issue comment or close mutation: [references/tracker-closeout-gates.md](references/tracker-closeout-gates.md)
- Parent/child or multi-issue closeout: [references/child-family-closeout.md](references/child-family-closeout.md)
- Building a long closeout body, acceptance manifest, split body, or blocked handoff: [references/closeout-templates.md](references/closeout-templates.md)

## 1. Establish authority and scope

Before the first edit:

1. Read repository instructions and the active authority map.
2. Run `git status --short`; record unrelated dirt and do not edit, stage, or revert it.
3. For tracker work, fetch the exact live issue/PRD bodies, comments, labels, state, dependencies, and related children. Save one ordered issue-body snapshot with `capture-github-issues.mjs` when a manifest will be needed.
4. Build a visible ledger per issue or explicit criterion: dependency, exact acceptance, authority/ADR obligations, proof seam, artifact disposition, ownership of any new cross-module entrypoint, and closeout state.
5. Preflight any required nonlocal proof—browser, credentials, service, network, or fresh-agent probe. If indispensable proof or a prerequisite decision is unavailable, make no speculative edit; report the exact blocker and required decision. Repeated reads do not create authority.

For a direct user-approved checklist, do not invent a tracker identity. After a decision pause, interruption, or compaction, treat the return as a resume boundary: compare current `HEAD`, worktree, governing authority, ledger, and any proof process with the recorded frontier before editing.

Do not collapse a requested issue set into a smaller slice. Integrated implementation is allowed when issues are technically inseparable, but evidence and disposition remain per issue.

## 2. Implement and verify

- Work issue-by-issue or by the explicitly recorded integrated seam.
- Use the repository `tdd` skill when available. An issue-named seam is pre-agreed unless it conflicts with live architecture; otherwise derive the narrowest public seam and follow `tdd` confirmation rules. Docs-only criteria use direct conformance evidence instead of invented tests.
- Keep a verification-command ledger with the exact command, observed result/count, run count, and represented tree/SHA. Setup-only failures remain recorded and must be rerun after repair.
- For UI or browser-consumed behavior, prove the production route and user action path in a real browser. Record actual URL/process ownership, observed outcome, console state, final-tree freshness, backend currentness when applicable, artifact disposition, and cleanup. Never reuse an unrelated port owner or raw-copy a live stateful store as proof.
- Before review, audit every acceptance item exactly. A satisfied row names the required atoms, concrete proof surfaces, and ordered sequence evidence—or explains why sequence is not applicable. Nearby or planned behavior is not proof.
- Reconcile completed active specs/reports under repository archival rules. Stage only owned files after inspecting both worktree and staged file lists.

Do not enter review with an unresolved required row unless the intended outcome is a blocked handoff that leaves the issue open.

## 3. Review the actual final tree

Invoke the repository `code-review` skill against a resolved fixed point before push or tracker closeout. Use its own authorized fallback only when its contract says fallback applies.

If review finds a behavior defect, preserve the finding, add intended-behavior red/green proof when possible, fix it, and rerun every affected gate. Amend or add a follow-up commit intentionally using only owned files. Then refresh the final SHA, review frame, verification ledger, browser/backend freshness, closeout body, and evidence identities. Review must cover the actual final `HEAD`, including review-fix commits.

Tracked implementation evidence and publishable closeout evidence are separate sinks. A tracked report may identify its fixed point and subject, but must not be amended merely to contain the SHA or terminal review result of the commit that contains that report. Put self-referential final fields in an external durable sink such as the tracker body.

## 4. Close out, or stop safely

No tracker mutation is allowed until all applicable gates in `tracker-closeout-gates.md` pass on the exact body:

- exact acceptance/Principles rows are all `satisfied`;
- final SHA identifies the verified and reviewed tree, with actual remote reachability recorded;
- final-tree verification, TDD or reasoned N/A, review, browser/manual or reasoned N/A/blocked, and evidence freshness are present;
- `validate-closeout-body.mjs` succeeds with `--expected-final-sha`, `--emit-preflight`, and `--mutation-ready`, and its emitted preflight is made visible verbatim.

After posting a long GitHub body, exact-read it with `verify-github-comment-body.mjs` before closing. If mutation output is ambiguous, perform a read-only lookup before any replay. Close children only after their own proof; exact-read every child state before closing a parent; exact-read all final issue states and commit visibility before claiming completion.

If any required proof remains blocked or `not done`, do not comment or close merely to create progress. Leave affected issues open and return the blocked handoff from `closeout-templates.md` with the verified frontier and next exact action.

Finish by reporting the final SHA or explicit no-commit decision, verification/review result, live tracker state, browser/process cleanup, and remaining unrelated dirt.
