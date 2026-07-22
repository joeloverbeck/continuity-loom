# Observation and Quantitative Log

`prepare-run.mjs` creates the run scratchpad. Append observations during the
journey; never reconstruct them from memory. Preserve an early misunderstanding
and append a correction rather than rewriting history.

For each meaningful strength, friction, confusion, defect, blocker, prompt
verdict, retry, recovery, acceptance milestone, or post-acceptance decision,
record:

- timestamp, surface, phase, intended action, and expectation;
- visible situation, action, and actual result;
- observed fact separately from interpretation and impact;
- classification, category, severity, confidence, and repetition;
- privacy-safe evidence, workaround/recovery cost, and desired visible outcome.

Use stable `F###` IDs only when an observation enters the cumulative report
ledger. Append corrections with the superseded observation ID, new evidence, and
final-report treatment.

## Quantitative ledger — explicit requests only

Activate this section only when the invocation asks for action counts,
authored-field counts, setup/promotion cost, or another quantitative comparison.
Name the measured boundaries before browser launch.

Count one action when a visible control is successfully actuated for navigation,
authoring, submission, or purposeful inspection. Count a product-visible failed
activation when it becomes an observation. Do not count passive screenshots,
waits, shell/helper work, cold-subagent work, or automation locator failures.

Count each intentionally written or selected visible field instance once as a
distinct field; re-edits add writes but not distinct fields. Untouched defaults
and blank optional fields do not count. Buttons are actions, not fields.

```markdown
| ID | Timestamp | Phase | Visible action | Kind | Field label / instance | Distinct field? | Successful write / selection? | Counted? | Exclusion reason |
| -- | --------- | ----- | -------------- | ---- | ---------------------- | --------------- | ----------------------------- | -------- | ---------------- |

| Boundary | Through action ID | Counted visible actions | Distinct authored fields | Successful writes / selections | Notes |
| -------- | ----------------- | ----------------------: | -----------------------: | -----------------------------: | ----- |
```

Use kinds `navigation`, `control`, `field-write`, `selection`, `submit`, and
`inspection`. Append cumulative boundary snapshots through stable action IDs and
derive later deltas from them. If a shortest demonstrated path is requested,
calculate it separately; never rewrite the observed path.

Keep the ledger value-free: labels, action kinds, booleans, counts, and short
summaries only—no story values, payloads, prompts, responses, or prose.
