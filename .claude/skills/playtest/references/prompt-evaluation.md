# Cold Prompt Evaluation

## Contents

- [Exchange protocol](#exchange-protocol)
- [Universal usefulness verdict](#universal-usefulness-verdict)
- [Change Review delta comparison](#change-review-delta-comparison)
- [Prose prompt](#prose-prompt)
- [Generation Brief field-influence ledger](#generation-brief-field-influence-ledger)
- [Targeted counterfactual](#targeted-counterfactual)
- [Assistance prompts](#ideate)
- [Temporary artifact cleanup](#temporary-artifact-cleanup)

## Exchange protocol

For every prompt kind, establish the author need and expected result in the scratchpad before
opening the prompt inspector. Record visible prompt metadata: kind, fingerprint, template/compiler
versions when shown, scope, record/field counts, and any readiness or source disclosure.

With the exact prompt visibly open, use `browser-act.mjs text-file` to write its complete visible
text under the run's `/tmp/.../exchange/` directory. Do not print the prompt to terminal output,
copy it into the report, or read it from an API or project file.

Dispatch one genuinely fresh cold-context subagent through the current host's context-isolation
mechanism:

- **Claude:** use a fresh `general-purpose` subagent.
- **Codex:** spawn a subagent with `fork_turns: "none"`, or the host's current equivalent that
  passes no parent-conversation turns.

The mechanism must not copy or fork the parent conversation. Give the subagent only this
instruction, substituting the absolute path:

```text
Read exactly the complete prompt in <absolute-prompt-file> and perform it as the sole task.
Do not inspect the repository, any other file, the parent conversation, or prior responses.
Return only the output requested by that prompt.
```

When raw-response custody or visible UI entry requires a file, append only this delivery
instruction, substituting a new absolute path under the same run's exchange directory:

```text
Write the requested output verbatim to <absolute-response-file> instead of returning its contents.
Return only: Response saved.
```

Do not add the story premise, desired answer, suspected weakness, prior report, or evaluator's
expectations. One fresh subagent serves one attempt. Receive the raw response through the selected
delivery mode, inspect it before editing, and keep any saved copy only in the run's temporary
exchange directory. If the host cannot launch a genuinely fresh subagent, the prompt-evaluation
contract is unavailable; follow the blocker policy rather than simulating a cold response in the
parent context.

Never send an assistance response into the app's provider-result scratch surface by interception,
mocking, API calls, or DOM injection. This run evaluates the compiled prompt and response; it does
not claim coverage of provider response parsing or assistance-result cards. Re-author adopted
suggestions through canonical visible editors.

## Universal usefulness verdict

For each raw response, record:

- the author need and pre-response expectation;
- output-contract and structural compliance;
- factual/continuity grounding and invented unsupported claims;
- relevance to the immediate author decision;
- actionable outputs versus no-change, generic, duplicative, or merely descriptive output;
- omissions, overreach, contradictions, and false positives;
- what the author adopted, rejected, or had to reinterpret;
- the work needed to turn the response into useful canonical edits or accepted prose;
- whether the likely cause is the prompt contract, model execution, source data, UI workflow, or
  not assessable;
- a verdict: `useful`, `mixed`, `low-value`, `misleading`, `malformed`, or `blocked`;
- confidence, remembering that one stochastic response is suggestive rather than proof.

Separate **prompt-contract mismatch** from **model-output failure**. If the prompt explicitly asks
for a low-value class of output and the model supplies it, the prompt—not model compliance—is the
primary issue.

## Change Review delta comparison

Run this whenever the latest accepted segment causes the playtester to plan story-continuity work.
It replaces the retired Segment Reconciliation paired-draw pilot and is a standing part of the
method, not a bounded pilot: it does not reuse the paired-draw counter, evidence tags, or pilot
machinery. A run contains at most two comparisons — unfinished inherited work at continuation entry
and new work after accepting the run's new segment. Mechanical housekeeping alone, such as changing
`generation_context`, does not trigger a comparison, and a sincere no-change assessment keeps the
existing naturalistic skip.

### Seal the baseline first

Before compiling the Accepted-Segment Change Review prompt and before any segment-derived canonical
edit, inspect the latest segment and current canonical surfaces through the visible UI, then seal an
independent canonical-update baseline as a temporary file under the run's `/tmp/.../exchange/`
directory. The baseline is a frozen comparator authored from the playtester's own reading, never
ground truth: a later review-only item may be a real discovery the playtester first missed.

Include every segment-derived intended change in the baseline and classify each as:

- **in-profile** — a semantic record delta within the chosen disclosed record scope, or one of Change
  Review's nineteen CURRENT AUTHORITATIVE STATE / IMMEDIATE HANDOFF paths; or
- **out-of-profile** — an exact create, deactivate, or archive operation, an Active Working Set
  membership change, an unsupported Generation Brief field, a full proposed canonical value, or other
  work the active Change Review contract cannot produce.

Independently disposition each of Change Review's six coverage dimensions as `change expected`,
`no change expected`, or `uncertain`:

1. spatial, material, and bodily state;
2. time, clocks, and ongoing processes;
3. facts, knowledge, beliefs, and secrets;
4. intentions, plans, commitments, promises, and open pressures;
5. emotions and relationships;
6. immediate next-segment handoff.

### Freeze the scope, then draw once

Freeze the smallest explicit record scope that makes the comparison fair: `active_working_set` only
when every implicated existing record is already inside it, otherwise `whole_project`. Never widen
the scope after viewing output.

Extract the exact visibly inspected Change Review prompt with `text-file` and run it once in one
genuinely fresh cold context under the [exchange protocol](#exchange-protocol). Do not press the
app's Analyze control, make no OpenRouter request, and take no quality retry for weak, empty,
malformed, or misleading output. Bounded harness recovery is available only when no substantive
response was produced at all. The single draw increments `cold_assistance_attempts` once.

Never intercept, mock, inject, or import a cold Change Review response into the app's provider-result
scratch surface. This path evaluates the compiled prompt and its response; it does not exercise
provider response parsing or the result cards.

### Adjudicate correspondence and coverage

Keep the baseline unchanged, then adjudicate item correspondence between the baseline and the
untouched response as one of `matched`, `baseline-only`, `review-only accepted`,
`review-only rejected`, `partial`, or `unscorable`. Compare the six returned coverage rows separately
against the sealed six-dimension disposition and count the dimensions that disagree.

Record one episode-level substitution verdict: `discovery-complete for this episode`,
`materially reduced discovery work`, `independent audit still required`, `unsafe or misleading`, or
`not assessable`.

Treat a discrepancy as a finding when it could omit or misdirect canonical work, force the author to
repeat the independent audit, falsely reassure through coverage, or make the workflow unusable.
Preserve the existing likely-layer distinctions among prompt contract, model execution,
source/scope, UI workflow, and not assessable. Every material discrepancy must map to a Cumulative
Finding Ledger ID; use `none - <reason>` only when all observed differences are genuinely
nonmaterial.

Only after the comparison, independently author and explicitly save any chosen canonical changes
through the visible editors. Exact story-bearing baseline text and the raw response stay temporary;
the report retains only privacy-safe counts, verdicts, fingerprints, and the minimum evidence a
material finding needs.

## Prose prompt

Allow one initial cold response and, when it is meaningfully poor or malformed, one retry through a
new cold subagent using the unchanged exact prompt. Preserve separate raw assessments. Do not tell
the second subagent what the first did wrong. Choose the response an author would rather work from,
then assess visible editing burden after pasting it as a user-supplied candidate.

Judge the prose on local-segment scope, manual directive, current state, physical continuity, POV
and knowledge limits, reveal locks, intended cast participation, voice, story configuration,
stop-point discipline, unsupported durable change, genericity, and prose quality. A polished
response that ignores an important populated field is still a prompt-utility concern.

## Generation Brief field-influence ledger

Before compilation, add one row per deliberately populated prompt-facing field:

```markdown
| Field | Author need | Intended observable influence | Visible prompt evidence | Response evidence | Verdict | Confidence |
| ----- | ----------- | ----------------------------- | ----------------------- | ----------------- | ------- | ---------- |
```

Before dispatch, use the visible prompt inspector and its search control to check whether the
field's distinctive saved value and relevant label appear. Record `present`, `absent`, or
`unclear`, plus the visible section/placement and whether the value appears prominent enough for
the intended use. Do not copy the full field body into the scratchpad or report. This observation
separates a UI/compiler omission from a field that reached the model but had no observable effect.

Use these verdicts:

- `used` — the output observably follows the field;
- `partly used` — some intended influence is visible but important substance is absent;
- `not compiled` — a saved field presented as prompt-facing is absent from the visible compiled
  prompt;
- `not observably used` — the output had a fair opportunity but shows no meaningful influence;
- `contradicted` — the output conflicts with the field;
- `not assessable` — the local segment stopped before the influence could reasonably appear or
  another authority masks attribution.

Do not count validation-only focus tags, author-only metadata, ids, or blank optional fields as
ignored prompt content. Do record when the UI asks the author to maintain such data without making
its non-prompt purpose understandable.

A single `not observably used` row is a finding candidate, not causal proof. Carry the field row
forward in the cumulative report so repeated natural runs can strengthen or disprove the concern.

## Targeted counterfactual

Use at most one counterfactual per run and only when an intentionally important field is visibly
present in the compiled prompt but appears ignored, and the result could materially distinguish
prompt salience from author expectation.
Create a temporary diagnostic copy of the exact prompt that changes only that field—remove it or
make its intended influence more explicit—then send the copy to a new cold subagent.

Never use counterfactual prose in the app, records, brief, accepted segment, or continuation state.
Label the comparison as a diagnostic probe, document the one changed variable, and report it as
suggestive because stochastic model variation remains a confound. Skip the probe when it would not
change a product decision.

## Ideate

Assess whether ideas/questions are distinct, grounded, locally usable, non-prose, and relevant to
the author's actual uncertainty. Count outputs the author would seriously consider or adopt. Note
generic restatements, disguised branches, infeasible options, repeated dominant transitions,
record citation problems, or ideas that merely rephrase the existing directive.

## Record Hygiene

Separate findings that recommend an author change (`REWORD`, `MAKE_SPECIFIC`, `MERGE`,
`DEACTIVATE`, `REMOVE`, or a concrete unresolved `HUMAN_REVIEW`) from no-change findings such as
`KEEP_DISTINCT` or legitimate-near-match confirmation. Count both, and record:

- change findings the author agrees with and manually applies;
- change findings rejected as false positive, unsafe, or not worth the effort;
- no-change findings that prevented a real mistake versus those that merely consumed attention;
- obvious overlaps or stale records the output missed;
- whether the prompt contract itself appears to reward exhaustive reassurance over sparse action.

The desired product value is not the largest valid finding set. It is a trustworthy, high-signal
answer to "what should I actually change?" while preserving necessary caution against unsafe
merges and removals.

## Accepted-Segment Change Review

Assess whether the returned `items` identify real durable changes the latest accepted segment
introduces, contrast them against current records and the nineteen CURRENT AUTHORITATIVE STATE and
IMMEDIATE HANDOFF review paths, stay paraphrased rather than echoing accepted prose, carry a valid
`evidence_excerpt` witness for each `established change`, cite resolvable evidence and contrast keys,
use valid epistemic-status and retention-horizon values, avoid inventing canon or drafting future
possibilities, and tell the author what genuinely needs manual work. Confirm each of the six
`coverage` rows is reasoned. Count items adopted, rejected, redundant with existing state,
over-specific, missing, or malformed. When the accepted segment drove continuity planning, adjudicate
the response against the sealed baseline under
[Change Review delta comparison](#change-review-delta-comparison).

## Temporary artifact cleanup

Keep exact prompts, raw responses, and sealed Change Review baselines only until the final report is
validated. Then delete the exchange directory. The report retains fingerprints, structured verdicts,
counts, correspondence and coverage tallies, adoption and editing burden, and only the shortest
excerpt necessary to make a finding intelligible. Exact story-bearing baseline text never enters a
durable report.

**Completion criterion:** every invoked prompt has a raw-response verdict and adoption ledger;
every intentionally populated prompt-facing Generation Brief field is accounted for; retry and
counterfactual limits are respected; and no exact prompt or raw response survives outside `/tmp`.
