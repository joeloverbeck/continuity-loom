---
status: accepted
---

# Capability admission follows the finalized request and distinguishes stale data from incompatibility

Before any completion send, Continuity Loom builds one complete non-streaming OpenRouter request.
Capability admission derives its requirements only from properties present in that finalized
object, checks the cached per-model `supported_parameters` union from OpenRouter's `/api/v1/models`,
and passes the same admitted object to transport. It never admits a settings approximation,
rebuilds the envelope after admission, drops a parameter, loosens strict output, enables provider
fallback, changes the model, or sends anyway — the same fail-closed stance as
`docs/adr/0002-validation-gates-fail-closed.md`, applied to provider routing.

The mapping is provider-neutral: `response_format` is required only when present;
`structured_outputs` is additionally required for strict JSON Schema; `temperature` and `top_p`
are required only when those explicit sampling properties are present; either advertised
completion-length alias satisfies the completion ceiling; and tools or tool choice are required
only when declared. OpenRouter required-parameter routing remains enabled, while fallbacks,
transforms, and plugins remain disabled. A provider-default temperature is an explicit local intent
to omit the property, not an inferred numeric value or a model-specific exception.

Failing closed is not enough on its own. The admission categories remain distinct and drive
different manual recovery:

- `structured-output-capability-unknown` means cached capability data is absent or empty. Refresh
  the cached model list, inspect again, and invoke the existing action explicitly.
- `structured-output-incompatible-model` means cached data proves one or more exact finalized
  request requirements are missing. The result carries the complete missing-capability set.
  Temperature or Top P failures permit a deliberate sampling-setting change or a compatible model;
  response format, strict structured output, completion length, tools, or tool choice require a
  model compatible with the named requirement. Inspect again before an explicit retry.
- transport and provider failures happen only after admission and retain their own safe recovery.

The model-list refresh is a user-initiated, read-only `/api/v1/models` call that persists non-secret
capability data; it is not a completion send. No path auto-refreshes, edits sampling intent,
auto-selects a model, retries, repairs, falls back, or resends. Request fingerprints bind send
eligibility to the provider configuration the author inspected, separately from prompt
fingerprints.
