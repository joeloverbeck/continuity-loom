# T05 Paired Evaluation Result

## Decision

**A wins, narrowly.** Both packets satisfy the central T05 requirement: the
test is an author-only decision, assistance remains advisory, and prose cannot
be compiled until the author has manually entered and visibly saved the chosen
test in canonical UI state. A is safer at the continuation seam because it
requires the visible Segment 2 archive and supplied continuation contract to
reconcile, and blocks rather than guessing if they do not. B records a sequence
discrepancy but then defines the next segment as the visible latest sequence
plus one, leaving a path to continue a drifted historical project whose state no
longer matches the task.

## Per-criterion judgments

| Criterion | A | B |
|---|---|---|
| 1. Source-and-doc-blind visible author journey | **Pass.** Explicitly limits the operator to visible UI and field help and prohibits source, hidden state, direct APIs, and internal selectors. | **Pass.** Equally explicit, including a prohibition on using DOM or project files to advance the story. |
| 2. Isolated local app/browser, loopback, provider guard | **Pass.** Fresh run-owned app and browser, isolated temporary state, `127.0.0.1`, blank credential, exact-origin enforcement, and terminal handling for a click attempt or guard event. | **Pass.** Provides the same protections and truthful terminal handling. |
| 3. Continuation identity and prior report/project boundary | **Strong pass.** Restricts intake to the sole prior report and its `/tmp` project, visibly checks sequence 2 and its endpoint, and blocks if archive and contract cannot be safely reconciled. | **Partial pass; material ambiguity.** Preserves the sole prior report and project, but says to record a Segment 2 discrepancy and later accept at visible-latest-plus-one. It does not make a mismatch an explicit stop condition, so the operator could mutate a drifted continuation rather than execute the specified Segment 2-to-3 run. |
| 4. Exactly one accepted segment or honest blocker | **Pass.** Requires one acceptance, visible sequence-3 proof, no completion claim without proof, and named blocker paths. | **Pass apart from the continuation-seam ambiguity above.** Requires one visible acceptance and honest blockers, and rejects replacement-level prose rewriting. |
| 5. Exact prompt inspection and fresh cold evaluation | **Pass.** Custodies exact visible prompt bytes, uses a new context for every attempt/surface, forbids OpenRouter, assesses untouched output, and permits only one unchanged-prompt retry. | **Pass.** Comparable cold-context isolation, exact prompt custody, retry limit, untouched-response assessment, and no-provider discipline. |
| 6. Accepted prose remains non-canonical | **Pass.** Explicitly says the test must pre-exist in canonical state and all other durable changes require independent author decisions and visible canonical edits. | **Pass.** Keeps accepted prose and reconciliation advisory and requires manual, independently accepted canonical changes. |
| 7. Visible evidence and cumulative report | **Pass.** Separates observation from inference, protects sensitive artifacts, carries inherited findings, requires all report sections and validation, and preserves the continuation project. | **Pass.** Slightly more explicit on section ordering, handoff fields, pilot counters, shutdown, and final custody. |
| 8. Task-specific narrative, knowledge, presence, and stopping boundaries | **Pass.** Preserves room/date, Clara POV, sleeping and silent Daniel, no speaking staff, ordinary 1972 objects, testimony independence, hidden question/result, no proof, breakfast limit, and exact stop. | **Pass.** Preserves the same complete boundary set and repeats it in the acceptance checklist. |
| Author-only invention and explicit canonical save before prose | **Strong pass.** Requires an explicit author choice, rationale, manual re-authoring, UI save, visible saved-value verification, and an `author-decision-unresolved` blocker before compilation if the gate cannot be met. | **Strong pass.** Requires independent author choice, manual canonical entry, a visibly saved canonical state, and a hard pre-prose blocker. Its wording is slightly less crisp about a discrete post-save value verification, but the saved-state check is sufficient. |
| Omissions, contradictions, and custody | **No material omission or contradiction.** Custody is narrow and the project survives. | **One material state/custody ambiguity:** archive sequence drift is recorded rather than unequivocally blocked. The packet otherwise has no material contradiction and preserves project/report custody. |
| Operator burden | **Lower and proportionate.** Detailed, but its checks directly support the shared or T05-specific contract. | **Higher without improving the T05 decision boundary.** The awaiting-disposition pilot and method-register bookkeeping adds task-extraneous operational load, though it is not itself unsafe. |

## Regression classification

- **A:** no material regression; no severe regression.
- **B:** one **material** regression in continuation-state safety because a
  visible Segment 2 mismatch is not an explicit terminal gate. No severe
  regression: B does not authorize provider use, false acceptance, automatic
  canonization, source/doc reading, or omission of the cumulative report.

