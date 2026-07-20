## Paused recap

Topic: Whether reconciliation assistance should replace one formal model call with two staged calls.

Current recommendation: Keep the readable consequence audit separate from schema-shaped draft operations, so a comprehension failure is visible before formalization.

Settled decisions:

- Accepted prose remains outside future prose-prompt context.
- Assistance output remains quarantined until the user explicitly adopts it.
- The first stage may describe candidate consequences in readable prose, but it may not mutate records.
- Structured operations remain drafts and require per-operation review.
- Automatic retry loops and provider-specific hidden heuristics are rejected.

Unresolved decisions:

1. Whether the second stage receives the full accepted segment again or only the user-approved consequence set plus affected record snapshots. This choice determines the privacy surface, token cost, and whether the formalizer can independently verify citations.
2. After that, whether one provider request may produce both next-brief suggestions and durable-record draft operations, or whether those outputs need separate review moments.

Evidence and limits:

- Finding: Three local playtest reports observed empty or false-negative reconciliation outputs on unchanged prompts.
- Limitation: Executor/model identity was not controlled across all reports, so those observations do not establish a population failure rate.
- Finding: No paired staged-call prototype has been run.

No new question was asked, and no file, prototype, network request, repository change, or external mutation was made.

Resume point: Choose the second-stage source contract first; then resolve the output/review boundary using that decision.
