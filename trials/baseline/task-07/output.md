## Paused recap

Decision: RATIFIED prompt-context boundary -> accepted prose remains outside future prose-prompt context; rationale: accepted prose must not become generation context for later prose.

Decision: RATIFIED adoption boundary -> assistance output stays quarantined until the user explicitly adopts it; rationale: assistance must not silently become story state.

Decision: RATIFIED first-stage authority -> the first stage may explain candidate consequences in readable prose but may not mutate records; rationale: comprehension comes before formalization or state change.

Decision: RATIFIED operation review -> structured operations remain drafts and require per-operation review; rationale: each durable-record change needs explicit scrutiny.

Decision: RATIFIED hidden behavior boundary -> no automatic retry loops or provider-specific hidden heuristics; rationale: failures and behavior changes must remain visible.

Current recommendation, not yet ratified: keep the readable consequence audit separate from schema-shaped draft operations so a comprehension failure is visible before formalization. The overall move from one formal call to two staged calls remains undecided.

Explored fact: three local playtest reports observed empty or false-negative reconciliation output with unchanged prompts.

Explored fact: executor/model identity was not controlled across all three reports, so this evidence does not establish a population failure rate.

Explored fact: no paired staged-call prototype has been run.

Still unresolved:

- Whether stage two receives the full accepted segment again, or only the user-approved consequence set plus affected record snapshots.
- Whether one provider request may produce both next-brief suggestions and durable-record draft operations, or those outputs require separate review moments.

Resume point: decide the second-stage source contract first. That decision controls the privacy surface, token cost, and whether the formalizer can independently verify citations; the output/review split follows after it.

Out of scope for this pause: choosing either unresolved branch, prototyping the staged flow, implementing it, or publishing any artifact. No file, repository, tracker, network, or external state was changed.
