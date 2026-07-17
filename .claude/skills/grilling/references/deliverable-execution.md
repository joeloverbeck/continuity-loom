# Deliverable Execution

Rules for moving from a grilling recap into documents, issues, code, implementation, publication, or other mutations.

## Explicit read-only override

An explicit `no changes`, `do not make changes`, `no file`, `recap only`, or equivalent instruction overrides inferred artifact creation, preparatory-write rules, supporting-skill inline writes, autonomous execution, and publication checkpoints.

While that instruction is active:

- produce only conversational findings, recommendations, decisions, and readiness notes;
- treat any required supporting-skill write as pending;
- do not ask an artifact-home question when recap-only is already selected;
- do not create optional or mechanically related artifacts; and
- wait for a later explicit authorization naming the mutation before writing.

## Determine whether a deliverable was requested

A downstream deliverable includes documents, issues, code, implementation, publication, tracker edits, or any other persistent mutation.

Preparatory wording such as `get everything ready to create PRDs` can count as an explicit request for a written determination artifact only when no read-only instruction overrides it. If writing is permitted, one artifact-home question may resolve both selected scope and target path, and must include `recap only, no file`.

If no downstream deliverable or action was explicitly requested, close on the recap. Do not create an artifact or ask a second artifact-specific question.

## Hard recap checkpoint

Before a downstream deliverable, the recap is a hard checkpoint whenever at least one RATIFIED user-owned stewardship or design decision shaped the plan. Show ratified decisions, list PROVISIONAL decisions separately, and ask the final confirmation as the last question.

Do not start the deliverable until the user confirms. A follow-up such as `proceed`, `implement this`, or `implement all` satisfies that confirmation.

Explored facts recorded as RATIFIED do not by themselves trigger a blocking confirmation in delegated operational work. If the deliverable was explicitly requested up front and no unresolved user-owned choice remains, record the facts in the final recap and proceed.

In a diagnose-and-fix or audit-plus-edit hybrid, a terminal option selection or prose confirmation can satisfy the checkpoint when it already enumerates the exact deliverable shape. This does not let an ordinary mid-interview acceptance skip the final checkpoint.

## Supporting-skill writes

Mandatory inline writes from a supporting skill are not optional downstream deliverables, but they may occur only when:

- no explicit read-only instruction forbids mutation; and
- every branch governing whether standing files change this session is resolved.

Until then, hold the changes aside and list them as pending in the recap. If the supporting skill concludes no update is owed, report that as a supporting-skill result, not as a decision.

## Autonomous deliverables

When the run is explicitly autonomous or execution was delegated up front and every unresolved branch is PROVISIONAL, present the provisional recap as a record, list all decisions open to veto, and proceed only with the deliverable or action explicitly requested.

Do not create extra downstream artifacts from provisional decisions. An active read-only instruction still forbids mutation.

## Execute the confirmed scope

Edits mechanically required for the confirmed deliverable's internal consistency are in scope without another confirmation when they trace to a ratified decision or the artifact's own consistency rules. Examples include version markers, index rows, and required derived-document resynchronization. Enumerate them in the final summary.

For local file writes:

1. immediately before the first write, run `git status --short` and `git branch --show-current`;
2. preserve unrelated worktree changes;
3. run the repository's canonical verification gates when the deliverable includes code; and
4. immediately before the final summary, run `git status --short` and `git branch --show-current` again.

Report each relevant verification gate as passed, failed, or unavailable with a reason. Never claim code implementation complete on unrun required gates.

For tracker or external mutations, re-read every affected item before the summary and show the read-back proving the intended end state.

For direct remote commits, use the remote baseline and read-back rules in [operational-execution.md](operational-execution.md); the local worktree checklist is N/A.

If the baseline moved mid-session, verify the final content still includes the session's intended edits and report the corrected state.

## Closeout

For PRD-ready or issue-ready closes, include the provenance required by [recap-contracts.md](recap-contracts.md) so a later publication pass does not need to reconstruct it from chat.

Skip an additional confirmation when no question was answered or every answered branch remains PROVISIONAL. Close on the recap, open to veto, unless an explicitly requested autonomous deliverable is permitted above.
