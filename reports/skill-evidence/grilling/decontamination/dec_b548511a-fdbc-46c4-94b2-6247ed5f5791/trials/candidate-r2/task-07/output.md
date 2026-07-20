# Recap

Topic: whether reconciliation assistance should replace one formal model call with two staged calls.

Current recommendation: keep the readable consequence audit separate from schema-shaped draft operations so a comprehension failure remains visible before formalization. This is the recommended direction, not a final decision on the unresolved source and review contracts.

## Settled decisions

Decision: [RATIFIED] May accepted prose enter future prose-prompt context? -> No; accepted prose remains outside that context; rationale: preserve the accepted-prose boundary.

Decision: [RATIFIED] When may reconciliation-assistance output affect records? -> Only after explicit user adoption; rationale: assistance output remains quarantined until then.

Decision: [RATIFIED] What may the first stage do? -> Describe candidate consequences in readable prose but not mutate records; rationale: keep comprehension separate from state change.

Decision: [RATIFIED] How are structured operations handled? -> They remain drafts and require per-operation review; rationale: durable changes need explicit scrutiny.

Decision: [RATIFIED] Should the design use automatic retry loops or provider-specific hidden heuristics? -> No; rationale: the user rejected both mechanisms.

## Unresolved decisions

- The second-stage source contract: either resend the full accepted segment, or provide only the user-approved consequence set plus affected record snapshots. This choice determines the privacy surface, token cost, and whether the formalizer can independently verify citations.
- Whether one provider request may produce both next-brief suggestions and durable-record draft operations, or those outputs require separate review moments.

## Evidence and limits

Finding: three local playtest reports observed empty or false-negative reconciliation outputs on unchanged prompts.

Evidence limit: executor/model identity was not controlled across all three reports, so these observations do not establish a population failure rate. No paired staged-call prototype has been run.

Freshness limit: this recap uses only the supplied frozen transcript. I did not refresh current authorities, implementation, runtime state, or tracker overlap, so none of those live surfaces has been verified here.

## Actions not taken

No new decision question was asked. No prototype, network call, repository change, deliverable, or external mutation was performed.

Exact resume point: choose whether the second stage receives the full accepted segment again or only the user-approved consequence set plus affected record snapshots. After that source contract is settled, resume with the review-boundary decision for next-brief suggestions versus durable-record draft operations.
