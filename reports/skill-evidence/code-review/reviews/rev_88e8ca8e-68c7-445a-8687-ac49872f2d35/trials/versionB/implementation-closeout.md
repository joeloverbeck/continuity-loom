# Normal review handoff to `implement`

Read this file only when `implement` invokes `code-review` for tracker closeout. It is the code-review overlay, not the combined tracker-body owner. `implement` owns body construction, manifests, body-size planning, publication, and exact readback; `tdd` owns its preflight, compact rows, RF maps, and fielded gate; [evidence-identities.md](evidence-identities.md) owns the shared identity block.

## Handoff invariants

Before returning a normal `Review:` line, preserve in the durable sink:

- fixed-point input, resolved fixed-point SHA, reviewed HEAD SHA, resolved-SHA three-dot diff command, commit list, and worktree scope;
- visible initial `## Standards` and `## Spec` outcomes;
- `Review subagents:`, `Review recovery:`, `Review subagent cleanup:`, and `Review subagent cleanup proof:` for every initial, final, interrupted, or recovery reviewer;
- exact pre-dispatch authority inventories and exact handoff copies;
- per-axis summary, residual findings, accepted-residual records, and parent/issue coverage when applicable;
- `Browser/manual evidence freshness:`, `Browser/manual console state:`, `Backend process currentness:`, and one complete `Evidence identity refresh:` block;
- named verification on the final reviewed tree and one closeout-ready evidence line.

For a no-fix review, `Handoff Standards source inventory:` and `Handoff Spec source inventory:` copy the pre-dispatch entry sets without adding, dropping, or summarizing entries. If no files changed after a no-finding or accepted-residual review, verification may say no rerun was needed because the unchanged reviewed tree already passed named gates.

For immediate fixes, add `Initial Standards outcome:`, `Initial Spec outcome:`, `Final Standards outcome:`, `Final Spec outcome:`, `Findings found:`, `Fixes made:`, `TDD/review-fix evidence:`, `TDD closeout gate:`, `Verification rerun:`, `Commit handling:`, and `Residual findings:`. Record every finding once in an immutable table:

```markdown
| Finding ID | Review pass | Axis | Reviewer | Original finding | Repair class | TDD disposition | Repair | Rerun evidence | Final status |
|---|---|---|---|---|---|---|---|---|---|
| P1-spec-1 | P1 | Spec | spec-reviewer-id | original finding | behavior | RF-1 | repair | affected/full-axis rerun | fixed |
```

Before final re-review, create `Final-review Standards source inventory:` and `Final-review Spec source inventory:` from every pre-dispatch entry plus any authority introduced by a fix, approval, clarification, or reviewer follow-up. Copy those sets exactly into the Handoff inventories. A later supplied Spec source may replace an earlier exact `no spec available` disposition.

Do not erase found-and-fixed history by reporting `no findings`. Make `Findings found` equal the ledger row count and reconcile initial/final counts. Accepted residuals require one record each, one field per line: `Accepted residual:`, `Axis:`, `Source:`, `Rationale:`, `Revisit trigger:`, plus the literal `unhandled findings none beyond accepted residuals`.

## Conditional evidence owners

When TDD or review-fix evidence is required, read and use the current [TDD closeout contract](../tdd/closeout-evidence.md); include or link its canonical evidence once and run nested validation. Do not copy its evolving field inventory here. The routed contract includes `Evidence-only proof server preflight:` and its `proof server preflight` gate field. For a multi-pass review or more than one TDD review fix, use the implement-owned structured evidence input and builder option `--evidence-input <evidence.json> --immediate-fix --tdd-parent-rollup`. Do not hand-copy those derived fields.

Always refresh the complete shared block from [evidence-identities.md](evidence-identities.md), even when TDD did not run. A published current artifact is not safe to remove until closeout is complete and its retained-or-removed disposition is recorded.

When no browser/manual evidence was used, record explicit N/A values for freshness, console state, and backend currentness. Otherwise:

- rerun browser/manual evidence on the final tree when a behavior-changing fix touches its route, browser-consumed API, fixture, or action path, or mark the proof blocked/stale;
- record 0 errors and 0 warnings or classify unrelated console output with evidence; rerun a clean session after HMR/session/setup contamination;
- record server command and watch/reload mode, process or port ownership, restart/reload proof after relevant edits, and the expected API field/behavior probe;
- when current identities name a stateful fixture, record its snapshot method, source, and expected-state probe, or the exact no-copy disposition; SQLite with possible WAL state requires `.backup` or a checkpoint-aware copy rather than raw `cp`;
- for a non-semantic later edit, name the changed path and reason, explain why the earlier route/action/API/fixture is untouched, inspect the diff, and cite targeted proof;
- when only commit metadata followed proof on identical tracked bytes, record that fact and a clean `git diff HEAD -- <owned files>` check.

## Exact acceptance and body validation

For parent PRDs, child families, and sibling issue sets, retain the Spec review's per-issue table, individual user-story rows, named criteria, composite atoms/proof surfaces, and sequence dispositions. A broad range such as `US1-US36` identifies a boundary but does not replace individual story rows. Use the acceptance manifest supplied or built by `implement`; code-review does not own its publication workflow.

When the durable sink is a local normal-review body, run:

```bash
node .claude/skills/code-review/scripts/validate-review-normal-body.mjs <body.md> [flags]
```

Select only applicable flags: `--immediate-fix`, `--parent-prd`, `--child-family`, `--issue-set`, `--browser`, `--tdd`, `--tdd-parent-rollup`, and `--closing`. Parent/child/issue-set and parent-rollup modes require `--acceptance-manifest <path>`. Closing validation that includes TDD also requires `--expected-final-sha "$(git rev-parse HEAD)"`. The validator's 65,536-byte body maximum is a current closing check; `--max-bytes <positive integer>` may only lower it or match the tracker's documented limit. If the sink is not local, apply the same manifest, table, sequence, identity, size, and closing-sink checks manually and record why the script was N/A.

For multi-pass or split closeouts, follow the implement-owned [closeout template contract](../implement/references/closeout-templates.md) and [Large Tracker Body Workflow](../implement/references/closeout-templates.md#large-tracker-body-workflow). Keep the complete normal review evidence once in the shared evidence core, validate that core with the normal review contract and every implement-owned check, and ensure linked chunks must not repeat normal review evidence or claim to revalidate it.

## Caller lines

Use exactly one truthful closeout-ready line after the durable evidence:

- `Review: code-review against <fixed point>; outcome no findings; verification rerun <commands>.`
- `Review: code-review against <fixed point>; outcome findings fixed in SHA <sha>; verification rerun <commands>.`
- `Review: code-review against <fixed point>; outcome accepted residuals recorded <count/source/rationale/revisit trigger>; unhandled findings none beyond accepted residuals; verification rerun <commands>.`

Fallback output is owned by [fallback-evidence.md](fallback-evidence.md) and must use `Review fallback:`, never `Review:`.

