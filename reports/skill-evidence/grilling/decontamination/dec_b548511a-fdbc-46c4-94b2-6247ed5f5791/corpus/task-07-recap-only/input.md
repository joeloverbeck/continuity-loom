# Frozen paused-grill transcript

Topic: whether a reconciliation-assistance redesign should replace one formal model call with two staged calls.

Resolved:

- Accepted prose remains outside future prose-prompt context.
- Assistance output is quarantined until explicit user adoption.
- The first stage may describe candidate consequences in readable prose but may not mutate records.
- Any structured operations remain drafts and require per-operation review.
- The user rejected automatic retry loops and provider-specific hidden heuristics.

Current recommendation:

- Keep the readable consequence audit separate from schema-shaped draft operations so comprehension failure is visible before formalization.

Still unresolved:

- Whether the second stage receives the full accepted segment again or only the user-approved consequence set plus affected record snapshots.
- Whether one provider request may produce both next-brief suggestions and durable-record draft operations, or those outputs need separate review moments.

Evidence boundary:

- Three local playtest reports observed empty or false-negative reconciliation outputs on unchanged prompts.
- The executor/model identity was not controlled across all reports, so the observations do not establish a population failure rate.
- No paired staged-call prototype has been run.

Next decision when resumed:

- Choose the second-stage source contract; that choice determines privacy surface, token cost, and whether the formalizer can independently verify citations.
