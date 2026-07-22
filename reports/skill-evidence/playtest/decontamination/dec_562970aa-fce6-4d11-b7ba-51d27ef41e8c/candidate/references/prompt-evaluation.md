# Cold Prompt Evaluation

## Exact exchange

Before opening a prompt inspector, record the author need and expected useful
result. Record visible kind, fingerprint, versions, scope, counts, readiness, and
source disclosure.

With the exact prompt visibly open, use `browser-act.mjs text-file` to save its
complete text under the run's `/tmp/.../exchange/` directory without printing it.
Dispatch one genuinely fresh cold-context subagent. In Codex use `fork_turns:
"none"`; use the host's equivalent elsewhere. Give it only:

```text
Read exactly the complete prompt in <absolute-prompt-file> and perform it as the sole task.
Do not inspect the repository, any other file, the parent conversation, or prior responses.
Return only the output requested by that prompt.
```

When file custody is necessary, add only:

```text
Write the requested output verbatim to <absolute-response-file> instead of returning its contents.
Return only: Response saved.
```

One fresh agent serves one attempt. Never add the premise, desired answer,
suspected weakness, prior report, evaluator expectations, or earlier output. If
fresh isolation is unavailable, stop with `cold-subagent-unavailable`; do not
simulate cold evaluation in the parent. Assistance output is never injected into
provider-result UI by interception, API, mock, or DOM manipulation.

For a visible static clipboard-drafting surface, exercise its **Copy prompt**
control as the author action before using `text-file` to custody those same
visibly rendered bytes. Send only that local file to the fresh executor, import
the response through the visible paste/import flow, review and correct it before
an explicit canonical Save, and verify that any later participation or cast-band
change does not silently mutate the record, canon, or working-set membership.

## Assess every untouched response

Record contract compliance; grounding and unsupported invention; relevance;
actionable versus generic/no-change output; omissions, overreach,
contradictions, and false positives; adoption/rejection; repair burden; likely
layer (`prompt contract`, `model execution`, `source data`, `UI workflow`, or
`not assessable`); verdict (`useful`, `mixed`, `low-value`, `misleading`,
`malformed`, or `blocked`); and bounded confidence. Distinguish a prompt that
asks for low-value work from a model that fails an adequate contract.

For prose, assess local scope, directive, current/physical state, POV/knowledge,
reveal locks, cast participation, voice, content policy, stop discipline,
unsupported durable change, genericity, and prose quality. Allow one retry only
when the first response is materially poor or malformed, using the unchanged
exact prompt in another fresh context with no critique. Choose the response an
author would prefer to edit.

## Generation Brief influence

Before compilation, record one row per deliberately populated prompt-facing
field:

```markdown
| Field | Author need | Intended observable influence | Visible prompt evidence | Response evidence | Verdict | Confidence |
| ----- | ----------- | ----------------------------- | ----------------------- | ----------------- | ------- | ---------- |
```

Search the visible inspector for the field's distinctive saved value and label.
Record `present`, `absent`, or `unclear`, placement/prominence, and one verdict:
`used`, `partly used`, `not compiled`, `not observably used`, `contradicted`, or
`not assessable`. Do not count validation-only controls, author-only metadata,
IDs, or blank optional fields as ignored prompt content.

Use at most one counterfactual per run, only when an important visibly compiled
field appears ignored and one-field comparison could change a product decision.
Change only that field in a temporary prompt copy and use a fresh agent. The
result is suggestive, diagnostic only, and never enters the app or continuity.

## Assistance-specific value

- **Ideate:** grounded, distinct, locally usable non-prose options/questions;
  reject restatements, disguised branches, infeasible choices, and citation
  problems.
- **Record Hygiene:** separate actual change proposals from `KEEP_DISTINCT` or
  other no-change reassurance. Record agreed/rejected changes, missed overlap,
  unsafe merges, and whether exhaustive reassurance crowds out action.
- **Segment Reconciliation:** require real durable deltas contrasted with current
  state, paraphrased evidence, valid targets/shapes, no invented canon, and clear
  manual work. Count adopted, rejected, redundant, over-specific, missing, and
  malformed proposals.

Keep exact prompts and raw responses only until the report first validates. Then
delete the exchange directory; retain only fingerprints, verdicts, counts,
burden, and the shortest necessary excerpt.
