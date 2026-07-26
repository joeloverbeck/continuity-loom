---
status: accepted
---

# Output policy requires explicit excluded reasoning

Every finalized OpenRouter completion request uses reasoning. Output policy
selects one stored effort together with its existing output class and ceiling:
Prose uses `proseReasoningEffort`; Assistance uses
`assistanceReasoningEffort`. The only valid efforts are `minimal`, `low`,
`medium`, `high`, `xhigh`, and `max`. Fresh settings default both classes to
`low`; there is no disabled, automatic, provider-default, alias, or token-budget
form.

The request contains exactly `reasoning: { effort, exclude: true }`. Reasoning
content is never an application output: transport positively projects candidate
content and safe aggregate usage only, so provider reasoning text, details, and
summaries cannot enter DTOs, logs, scratch, project storage, accepted
provenance, exports, backups, or later prompt context. A safe aggregate
reasoning-token count may appear transiently in diagnostics.

Model-list decoding treats `supported_efforts: null` as all six canonical
efforts, an array as only its recognized non-`none` members, and an omitted or
malformed value as unknown. Before transport, admission requires a current
cached entry that explicitly supports the selected effort and every other
finalized-request capability. Unknown data requires an explicit model-list
refresh; known incompatibility preserves the stored choice and requires an
explicit model or effort change. Inspection, refresh, settings changes, and
errors never send or retry a completion.

The provider-request fingerprint binds prompt bytes, model, output class,
ceiling, effort, exclusion, and the selected model's current capability
snapshot. Any applicable change requires fresh inspection. Every admitted
Generate or Assistance action still makes exactly one explicit non-streaming
request.

A valid settings file that predates reasoning fields is atomically and
idempotently migrated by adding `low` only for each missing class field. Its
model, sampling settings, ceilings, cached model list, and other class effort
remain unchanged. No project file is read or written by this migration.

## Considered Options

- Provider-default or automatic reasoning was rejected because inspection and
  freshness could not name the actual author-owned request intent.
- A reasoning token budget was rejected because OpenRouter's discrete effort
  capability is the admission contract and a second budget would duplicate the
  completion ceiling.
- Returning reasoning text for debugging was rejected because model scratch is
  neither candidate content nor continuity authority and would expand every
  custody boundary.

## Consequences

Global Settings and Prompt Inspector disclose class, ceiling, effort,
mandatory reasoning, exclusion, supported efforts, and any blocker. A stored
incompatible effort remains visible until the author changes it. Below-default
ceiling warnings remain non-gating and never mutate settings. This decision
does not add project schema fields or accepted-provenance fields; those remain
separate work.
