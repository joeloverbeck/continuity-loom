# Frozen Validation Plan: grilling recap-union labels

Frozen before any candidate directory or candidate edit existed.

## Confirmed mechanism and ownership

- Ownership: target compliance defect in `.claude/skills/grilling/references/recap-contracts.md`.
- Mechanism: a same-subject diagnostic-to-operational class shift requires the union of both literal-label scans, but three semantically overlapping field groups use different labels: `Verdict` / `Finding`, `Rejected/no-op alternatives` / `Rejected operations`, and `External research` plus `Freshness` / `Freshness/external research`. The target does not define whether overlapping content is consolidated or duplicated, so a compliant executor can only guess or emit redundant labels.
- Change boundary: clarify only class-shift union normalization and its final-preflight scan. Do not alter single-class contracts, simultaneous-mixed-request routing, mutation authorization, or supporting-skill composition.

## Risk tier

High. The change touches the final-preflight scope boundary and class-union behavior used across the skill, so five paired trials are required.

## Executor and evaluator independence

- Use two independent fresh agents as executors. Give each executor one anonymized skill package, the five raw trial files, and no diagnosis, candidate hypothesis, expected winner, other-version output, or version mapping.
- Each executor must produce one raw response per trial without modifying repository state.
- Randomize the two output sets as `Alpha` and `Beta` before evaluation.
- Use a third independent fresh agent as evaluator. Give it only the frozen trial files, this rubric, and the anonymized raw outputs. Do not disclose the version mapping, diagnosis, or intended repair.
- The root agent performs deterministic file/link/mirror checks separately and applies the acceptance gate only after receiving the blind evaluation.

## Paired trials

### T1 — fresh reproduction: same-subject diagnostic to operational shift

- Raw task and artifacts: `trial-inputs/t1-diagnostic-to-operational.md`.
- Protects: one unambiguous closing recap for the implicated class shift.
- Pass rubric: preserves the diagnostic verdict and operational mutation/read-back facts; provides every non-overlapping required field; gives each overlapping fact one clear output home; does not repeat the same fact under near-synonymous labels merely to satisfy both scans.
- Comparison rubric: prefer the response whose label set is explicitly and consistently derivable from the held skill. Redundant duplicate fields or omitted provenance fail.

### T2 — adjacent union: design stress-test to operational execution

- Raw task and artifacts: `trial-inputs/t2-design-to-operational.md`.
- Protects: a different genuine class shift remains complete.
- Pass rubric: preserves ratified decisions and the complete operational closeout, including baseline, exact mutation, and read-back; does not invent diagnostic-only obligations.
- Comparison rubric: candidate must be noninferior in completeness, clarity, and action-boundary fidelity.

### T3 — core regression: diagnostic-only audit

- Raw task and artifacts: `trial-inputs/t3-diagnostic-only.md`.
- Protects: the diagnostic literal-label contract.
- Pass rubric: includes `Source`, `Selected section`, `Verdict`, `Evidence`, `Inspected authorities`, `Tracker overlap`, `Rejected/no-op alternatives`, `Recommendation`, `Out of scope`, `External research`, `Supporting skill result`, and `Freshness`, using explicit `N/A` where supplied.
- Comparison rubric: candidate must preserve every required label and factual distinction.

### T4 — core regression: operational-only mutation

- Raw task and artifacts: `trial-inputs/t4-operational-only.md`.
- Protects: the compact operational contract and post-write proof.
- Pass rubric: includes `Context`, `Finding`, `Evidence`, `Rejected operations`, `Recommendation`, `Out of scope`, and `Freshness/external research`; includes exactly one baseline receipt plus exact touched resource and read-back proof.
- Comparison rubric: candidate must preserve every required field and not add diagnostic-template duplication.

### T5 — fragile boundary: simultaneous independent mixed request

- Raw task and artifacts: `trial-inputs/t5-simultaneous-mixed.md`.
- Protects: simultaneous mixed items are not misclassified as a class shift.
- Pass rubric: uses the dominant operational recap, carries the independent diagnostic verdict and evidence inside it, preserves operational mutation proof, and does not reproduce a second complete diagnostic template or apply same-subject class-shift normalization blindly.
- Comparison rubric: candidate must be noninferior on classification, completeness, and concision.

## Deterministic checks

Run on both packages where comparison matters and on the candidate before landing:

1. all relative Markdown links in the target package resolve;
2. the target package contains no absolute repository-specific paths;
3. the live `.agents/skills/grilling` path remains a symlink to the `.claude` target (landing helper verifies this again);
4. candidate diff is limited to the demonstrated recap-union mechanism;
5. `git diff --check` passes for the candidate patch and eventual landing;
6. runtime word/byte counts are recorded, and any growth must be necessary and supported by better T1 behavior.

## Acceptance rule

Accept only if the candidate materially resolves T1, is noninferior on T2-T5, introduces no scope or authorization regression, passes every deterministic check, and any runtime growth is minimal and necessary. Otherwise record rejection and leave the live target unchanged.
