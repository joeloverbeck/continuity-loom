## Paused grill recap

**Topic:** Whether reconciliation assistance should replace one formal model call with two staged calls.

**Source:** The supplied paused-grill transcript. The three local playtest reports are available here only through that transcript’s summary; their paths and contents were not independently inspected.

**Selected section:** Reconciliation-assistance staged-call design.

**Inspected authorities:** Supplied transcript only.

Decision: RATIFIED prompt-context boundary -> accepted prose remains outside future prose-prompt context; rationale: preserve the established boundary around accepted prose.

Decision: RATIFIED assistance adoption boundary -> assistance output remains quarantined until explicit user adoption; rationale: prevent unreviewed assistance from becoming authoritative state.

Decision: RATIFIED first-stage authority -> the first stage may explain candidate consequences in readable prose but may not mutate records; rationale: keep comprehension separate from state change.

Decision: RATIFIED structured-operation review -> structured operations remain drafts and require per-operation review; rationale: preserve explicit user control over every durable change.

Decision: RATIFIED retry and provider behavior -> reject automatic retry loops and provider-specific hidden heuristics; rationale: keep execution behavior visible and provider-independent.

**Current recommendation (not ratified):** Keep the readable consequence audit separate from schema-shaped draft operations so a comprehension failure remains visible before formalization.

**Still unresolved:**

- Whether the second stage receives the full accepted segment again, or only the user-approved consequence set plus affected record snapshots.
- Whether one provider request may produce both next-brief suggestions and durable-record draft operations, or whether those outputs require separate review moments.

**Evidence:** Three local playtest reports observed empty or false-negative reconciliation outputs on unchanged prompts. Because executor/model identity was not controlled across all three, those observations do not establish a population failure rate. No paired staged-call prototype has been run.

**Tracker overlap:** N/A; not assessed in this recap-only turn.

**Supporting skill result:** N/A.

**External research:** Skipped; this turn is recap-only and network-free.

**Out of scope:** No remaining choice is being resolved now, and no prototype, repository change, artifact, or external mutation is being made.

**Resume point:** Choose the second-stage source contract first. That decision determines the privacy surface, token cost, and whether the formalizer can independently verify citations; then resolve whether next-brief suggestions and durable-record operations share a provider request and review moment.
