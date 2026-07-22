---
status: accepted
---

# Capability admission fails closed but distinguishes stale data from an incompatible model

The strict structured-output gate admits a model before send by checking the cached per-model
`supported_parameters` union from OpenRouter's `/api/v1/models`, and it fails closed when it cannot
prove the exact strict envelope is supported: it never drops a parameter, loosens strict output,
enables provider fallback, changes the model, or sends anyway — the same fail-closed stance as
`docs/adr/0002-validation-gates-fail-closed.md`, applied to provider routing. But failing closed is
not enough on its own. A gate that cannot tell *missing or stale capability data* (recoverable by
refreshing the cached model list) from *data that proves the model is incompatible* (recoverable
only by choosing a different model) produces a misleading dead-end. When the `supported_parameters`
capture shipped (2026-07-21), every model cached before it lacked the field, so a fully capable
model such as `anthropic/claude-sonnet-5` was rejected with copy that told the author to pick a
different model — wrong cause, wrong fix.

The two admission categories are therefore kept distinct and drive different recovery.
`structured-output-capability-unknown` means the cached capability data is absent or empty; the fix
is to refresh the cached model list, and the assistance surface offers that refresh in place before
inviting another explicit Analyze. `structured-output-incompatible-model` means the cached data
proves the selected model cannot satisfy the envelope; the fix is to choose a model that advertises
strict structured output. The in-place refresh is a user-initiated, read-only `/api/v1/models` call
that persists capability data for every model; it is not a send. No path auto-refreshes,
auto-selects a model, or auto-resends the request.
