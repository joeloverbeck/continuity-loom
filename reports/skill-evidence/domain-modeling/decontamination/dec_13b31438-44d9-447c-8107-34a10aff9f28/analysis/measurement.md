# Baseline and candidate measurement

Counts use `wc`; words are the runtime token proxy required by the workflow.

| Variant | Runtime file | Lines | Words | Bytes |
|---|---|---:|---:|---:|
| Current | `SKILL.md` | 108 | 1,184 | 7,854 |
| Current | `CONTEXT-FORMAT.md` | 61 | 488 | 3,261 |
| Current | `ADR-FORMAT.md` | 54 | 528 | 3,317 |
| Current total | all runtime files | 223 | 2,200 | 14,432 |
| Candidate | `SKILL.md` | 45 | 427 | 3,028 |
| Candidate | `CONTEXT-FORMAT.md` | 54 | 269 | 1,895 |
| Candidate | `ADR-FORMAT.md` | 31 | 208 | 1,445 |
| Candidate total | all runtime files | 130 | 904 | 6,368 |

Candidate reduction: 1,296 words (58.9%), 8,064 bytes (55.9%), and 93 lines (41.7%).

## Runtime-loaded paths

| Use path | Current words | Candidate words | Change | Mandatory skill-local references |
|---|---:|---:|---:|---|
| Supporting-role no-change | 1,184 | 427 | -63.9% | none |
| Glossary change | 1,672 | 696 | -58.4% | `CONTEXT-FORMAT.md` in both |
| ADR decision | 1,712 | 635 | -62.9% | `ADR-FORMAT.md` in both |

Repository routing may additionally require `docs/agents/domain.md` and an active-doc registry in either variant; the candidate does not remove those applicability checks.

## Structural comparison

| Measure | Current | Candidate |
|---|---|---|
| Routing hard gate | Three ordered probes plus command-shape prohibitions | Same three semantic checks without command-shape narration |
| Glossary eligibility definition | Main skill and context reference | Context reference only; main skill dispatches to it |
| Multi-context routing definition | Main skill and context reference | Context reference only |
| ADR qualification/ownership definition | Main skill and ADR reference | ADR reference only; main skill dispatches to it |
| Supporting-role result states | Settled and provisional lines plus ratification/veto lifecycle | Same two result states, no lifecycle ceremony |
| Incident/provenance passages | none literal | none |
| Audit/process-ceremony passages | optional-read command prohibition, mutation-checkpoint path identity, ratification refresh lifecycle | none |
| Executable helpers | none | none |

The candidate keeps the same three runtime files and adds or removes no executable helper.
