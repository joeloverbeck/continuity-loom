# Cold Prompt Evaluation

## Contents

- [Exchange protocol](#exchange-protocol)
- [Universal usefulness verdict](#universal-usefulness-verdict)
- [Paired-draw pilot](#paired-draw-pilot)
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

## Paired-draw pilot

Use this instrument only while its Authoritative pilot state is `active`, and for at most one
naturally qualifying assistance prompt in a run. During the initial pilot, only Segment
Reconciliation is eligible, and only when a legally valid no-change answer versus a substantive
proposal would materially alter the author's durable-continuity work. Do not force acceptance,
create extra records, or invoke reconciliation solely to obtain a pair.

Before either draw:

1. Save one exact visible prompt and its lowercase SHA-256 fingerprint.
2. State why the prompt qualifies and predeclare informative structural classes. For Segment
   Reconciliation, begin with `substantive-change`, `reasoned-no-change`, `empty-no-change`,
   `malformed`, and `blocked`; refine only before dispatch.
3. Prepare two identical cold-context tasks using the same prompt bytes and delivery instruction.

Launch Draws A and B in separate fresh contexts before inspecting either response. If the host
cannot launch them concurrently, seal both tasks first, launch B regardless of Draw A's outcome,
and never tell B about A. Do not take a third draw. Both draws increment
`cold_assistance_attempts`; the pair is neither a retry nor a counterfactual.

Assess each untouched response separately against the universal usefulness verdict before choosing
whether to re-author anything. Then classify the pair as one of:

- `concordant-substantive`
- `concordant-no-change`
- `discordant`
- `both-poor-or-malformed`
- `blocked`

For each draw record timestamp, executor host family, exact model identifier only when exposed by
the host (otherwise `unknown`), model-identity exposure boolean, and the shared prompt fingerprint.
Record what this exact pair supports, what it cannot establish, and how it changes likely-layer
attribution. Two draws can reveal local concordance or discordance; they cannot establish a rate,
stability, model independence, or the cause of variation.

The pilot stops after two naturally qualifying pairs for an explicit `keep`, `revise`, or `retire`
decision. A run with no qualifying prompt records the pilot as pending and makes no pair.

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

## Segment Reconciliation

Assess whether proposals identify real durable changes from the latest segment, contrast them
against current records/brief, remain paraphrased, cite evidence, use valid targets and shapes,
avoid inventing canon, and tell the author what genuinely needs manual work. Count proposals
adopted, rejected, redundant with existing state, over-specific, missing, or malformed.

## Temporary artifact cleanup

Keep exact prompts and raw responses only until the final report is validated. Then delete the
exchange directory. The report retains fingerprints, structured verdicts, counts, adoption and
editing burden, and only the shortest excerpt necessary to make a finding intelligible.

**Completion criterion:** every invoked prompt has a raw-response verdict and adoption ledger;
every intentionally populated prompt-facing Generation Brief field is accounted for; retry and
counterfactual limits are respected; and no exact prompt or raw response survives outside `/tmp`.
