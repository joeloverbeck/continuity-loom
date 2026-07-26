# Question Flow

Detailed questioning, fallback, ledger, and resume rules for `grilling`.

## Question format

Ask questions one at a time and wait for feedback. Asking multiple independent branches at once is bewildering.

- Put the recommended option first and append `(Recommended)` to that option's `label` field itself, not only to framing prose.
- A question may carry one tightly coupled sub-decision when both share one decision surface. Never bundle independent branches.
- Use the available and permitted question tool. If the active mode or harness says it is unavailable, Plan-only, or otherwise not callable, do not probe-call it; use prose.
- When options represent concrete artifacts such as code shapes, file layouts, deliverable structures, or config, use a supported preview field for side-by-side comparison. Do not use previews for simple preferences.
- Prose fallback: `Question N: <decision surface>. My recommendation (Recommended): <answer and why>. Do you agree?`

If higher-priority response requirements add a footer, citation block, or mandatory trailing content, put the decision question immediately before that content and do not add a second prompt after it.

Keep framing before a question to a few sentences. Save supporting detail for the recap.

## Handling replies

- A clear acceptance such as `proceed with your recommendation` ratifies the current recommended answer and advances to the next unresolved branch. It does not skip a required final recap checkpoint.
- Acceptance plus a correction, constraint, or refinement ratifies the branch and creates a separate ledger line for the amendment. Restate the amendment in the next question's framing so the user can veto the interpretation.
- A clarification request, challenge, or `why` question is not an answer. Respond directly, revise the recommendation if needed, and do not ledger or advance the branch until the decision is confirmed.
- A question-tool call rejected with a note that the user wants to clarify is a clarification request, not an answer or a veto. Ask in prose what needs clarifying, do not ledger or advance the branch, and re-present or amend the question once the clarification resolves.
- If the user delegates all remaining branches, resolve them with recommended answers marked PROVISIONAL, present them as open to veto, and retain any required final recap checkpoint.

An explicit grilling invocation is consent to blocking questions. Generic autonomy framing does not suppress live questions. Only an explicit statement that the user is away, or a scheduled or unattended run, justifies going provisional before a timeout.

## Timeout fallback

When only prose questions are available, autoresolution is unavailable: ask one question and wait unless the run is explicitly autonomous.

If the first question times out after a long context dump, or a later question times out just after active engagement, consider re-asking that one question once. If the user is known to be away or the run is autonomous, skip the re-ask.

After an unanswered question, use one fallback round:

1. Batch the remaining highest-impact branches up to the active question tool's limit.
2. Re-include the timed-out branch when it is among the highest-impact branches.
3. Phrase downstream questions conditionally on the recommended upstream answer.
4. Resolve branches that do not fit by exploration where possible; otherwise apply the recommendation and mark it PROVISIONAL.
5. If the batch is unanswered, apply the recommendations and continue with PROVISIONAL ledger lines.
6. If the batch is answered, treat that as re-engagement and return to one-at-a-time questions. Upgrade branches defaulted only because they did not fit the batch into live questions.

A vetoed upstream answer voids its dependent ledger lines.

The closing recap lists PROVISIONAL decisions separately as open to veto. Proceed to a downstream deliverable only if it was explicitly requested and the deliverable rules permit it. A determination or recommendation contained in the recap is itself the requested determination; it does not imply another artifact.

## Explore instead of asking

When repo authorities or live facts can answer a branch, explore first.

- Record conclusive factual branches and material evidence that is not a design choice under `Explored facts:`, `Finding:`, or `Explored fact:`. Treat a conclusive fact as settled for question routing, not as a decision.
- Do not re-ask a conclusively answered factual branch.
- If facts leave a stewardship or design choice unresolved, ask only that choice and cite the explored fact in the rationale.
- If the answer depends on user intent rather than repo truth, keep it open to correction.

## Decision ledger

Use exactly:

```text
Decision: [RATIFIED|PROVISIONAL] <question> -> <answer>; rationale: <why this answer wins>
```

Examples:

```text
Decision: RATIFIED severity boundary -> neutral thresholds stay shared; rationale: other flows need the same skip threshold.
Decision: PROVISIONAL ADR need -> create one short ADR; rationale: the user is away and the trade-off is hard to reverse.
```

Mark RATIFIED only when the user confirms a stewardship or design decision. Mark PROVISIONAL when a stewardship or design answer comes from timeout fallback, autonomous execution, or an unconfirmed recommendation. Facts never receive either decision status.

Keep the ledger in conversation for short sessions. Create a scratchpad only when session length or branch count makes in-context tracking unreliable.

If a supporting skill concludes that no update is owed, report it as `Supporting skill result: ...`; do not manufacture a decision ledger line unless the user actually ratified a stewardship choice.

## Resume behavior

After compaction or a resumed interview:

- reconstruct the ledger from available conversation state;
- revalidate cited artifacts and current files when needed;
- restate known decisions; and
- continue from the shallowest unresolved branch.

After a provisional close, each veto reopens that ledger line and all dependent lines. Untouched lines remain ratified.
