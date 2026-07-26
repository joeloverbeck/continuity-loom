---
status: accepted
---

# Output policy selects the Prose or Assistance completion ceiling

Continuity Loom stores exactly two global local OpenRouter completion ceilings:
the Prose ceiling, defaulting to 2,048 tokens, and the Assistance ceiling,
defaulting to 8,192 tokens. Both are positive-integer upper bounds, not target
lengths, guarantees, or estimates of required output size.

The existing output policy is the single selection boundary. Generate uses the
Prose ceiling. Ideation, Record Hygiene, Cast Possibilities full analysis and
target regeneration, and Accepted-Segment Change Review use the Assistance
ceiling. The selected value is serialized as `max_completion_tokens` in the
one finalized non-streaming request. Inspection discloses its Prose or
Assistance class and value, and the provider-request fingerprint binds send
eligibility to that finalized request. Changing only the unused ceiling does
not change the request or its fingerprint.

A valid legacy settings file with one positive `maxOutputTokens` value migrates
that value unchanged into both canonical fields in one atomic replacement.
This preserves the author's prior cost boundary rather than silently granting
assistance a larger allowance. Once migration succeeds, the legacy key is
removed and no fallback reader or alias remains. Invalid input or a failed
replacement leaves the original file intact and prevents the invalid settings
from becoming active.

## Considered Options

- Keep one global ceiling. Rejected because prose drafting and strict
  structured assistance have materially different output contracts, while one
  control cannot express independent author-owned cost boundaries.
- Add one setting per workflow. Rejected because workflow proliferation would
  duplicate policy, create competing defaults, and make inspection and
  freshness harder to reason about. The meaningful boundary is prose versus
  strict assistance.
- Migrate legacy Prose to the old value but raise Assistance automatically to
  8,192. Rejected because migration must preserve the configured cost ceiling;
  8,192 is guidance for new configurations, not authority to alter inherited
  settings.
- Derive or adjust a ceiling from prompt size, schema, model, records, prior
  output, cost, or usage. Rejected because this would manufacture an
  output-size oracle and weaken explicit author control.

## Consequences

Settings persistence, API, and UI expose the canonical pair globally; projects,
exports, backups, prompt sources, and assistance scratch gain no setting.
Prompt bytes and prompt/output versions do not change. Accepted OpenRouter
prose continues to record the actual sent limit in its existing provenance
field; assistance creates no accepted provenance. Suitability and context
warnings remain non-gating inspection guidance, and neither warning changes a
setting or sends, retries, continues, or resends a completion.

ADR 0007 extends this same output-policy boundary with mandatory class-specific
reasoning effort and exclusion. It does not replace this ADR's ceiling
ownership or cost-preserving migration rule.
