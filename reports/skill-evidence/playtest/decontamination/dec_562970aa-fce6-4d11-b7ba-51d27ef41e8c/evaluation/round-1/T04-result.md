# T04 Blind Paired-Output Evaluation

## Scope

This judgment compares only the frozen shared rubric, the T04 task-specific criteria, and outputs A and B. It does not infer output provenance or diagnose decontamination.

## Per-criterion judgments

| Criterion | A | B | Judgment |
| --- | --- | --- | --- |
| 1. Source-and-doc-blind author using the visible browser UI | Pass. It explicitly defers repository-authority reads until after the browser journey and prohibits APIs, hidden state, source-derived knowledge, and project-file inspection. | Pass. It likewise separates the blind browser journey from post-journey report routing and confines story interaction to visible UI controls. | Tie. |
| 2. Isolated local app/browser, loopback binding, and provider-request guard | Pass. It requires unique isolated sessions, blank credentials, `127.0.0.1`, guarded external origins and send endpoints, and terminal blocking on any send attempt. | Pass. It supplies similarly guarded app/browser setup, literal isolated paths, loopback-only binding, blank credentials, and terminal handling for a click or guard event. | Tie. |
| 3. Continuation identity and supplied report/project boundary | Pass. It names the sole prior report, uses only its `/tmp` project locator, treats the stated endpoint as an expectation pending visible archive confirmation, and forbids reconstruction or substitution. | Pass. It names the same sole report and project-locator rule, requires visible archive confirmation, and blocks on missing or ambiguous state. | Slight edge A for the especially clear distinction between supplied expectation and visibly established state, but both are adequate. |
| 4. Exactly one accepted local prose segment or honest blocker | Pass. It permits only the sequence-1-to-2 advance, requires visible archive proof, prohibits a second compile/acceptance, and provides truthful blocker paths. | Pass. It requires exactly one sequence-2 acceptance with visible proof and blocks on unavailable, ambiguous, or unusable paths. | Tie. |
| 5. Exact prompt and naturally invoked assistance evaluated in fresh cold context without OpenRouter | Pass. It extracts only a visibly open prompt, gives a fresh context only the prescribed file instruction, permits one unchanged retry, and keeps all provider controls forbidden. It also prevents Ideate or the prose evaluator from choosing the three facts. | Pass overall. It has the same cold-file isolation, retry cap, prompt assessment, and provider prohibition. However, its Ideate clause permits system-proposed source-path options before the author chooses the facts, creating a small tension with its otherwise strong author-choice boundary. | A is better. The B tension is minor, not a material failure. |
| 6. Accepted prose remains non-canonical; durable changes require explicit author action | Pass. It repeatedly separates assertion, source path, and verified truth; forbids treating accepted prose as authority; and requires deliberate Record or Generation Brief edits. | Pass. It explicitly says acceptance does not convert prose into continuity authority and requires manual re-authoring of selected durable deltas. | Slight edge A because it more directly forbids representing the three propositions as globally true and specifies bounded provenance and verification status before acceptance. |
| 7. Visible evidence, observation/interpretation separation, cumulative truthful report, and custody | Pass. It defines structured observation, privacy-safe retained evidence, cumulative finding carry-forward, sequence-conditioned status, validation before and after scratch deletion, and worktree-delta checks. | Pass. It separates observed evidence from interpretation, requires a cumulative standalone report and stable ledger, validates after cleanup, preserves the continuation project, and conditions completed status on visible proof. | Tie. Neither omits the cumulative report contract or claims unearned completion. |
| 8. T04 narrative, knowledge, presence, agency, and stopping boundaries | Pass. It preserves the room/date, Clara's control, Tomás's paperwork and lent pencil, exactly three author-chosen assertions, Daniel's offstage coma, epistemic limits, staff pressure, and a reversible local stop. | Pass overall. It preserves all required scene, presence, knowledge, and agency limits. It additionally fixes the reversible stop to Clara deciding whether to permit one further source-path clarification; that is safe but more creatively prescriptive than the task requires. | A is better for preserving the requested boundary without silently narrowing the author's reversible-choice design. |

## Cross-cutting findings

- **Omissions:** Neither output has a material rubric omission. B is less explicit than A about how pre-acceptance representations of the three facts avoid becoming globally verified truth, but its later epistemic and canonical-state safeguards substantially cover the risk.
- **Contradictions:** No direct safety or state-integrity contradiction appears. B has a minor internal tension between facts being independently author-chosen and Ideate being allowed to offer source-path options before those choices are fixed.
- **Safety and state integrity:** Both prohibit provider requests, direct state access, false sequence claims, project substitution, automatic canon promotion, and continuation-project deletion. No material or severe safety/state-integrity failure is present.
- **Report and custody:** Both require a cumulative evidence-backed report whose status matches visible proof, preserve inherited findings, constrain durable evidence, validate the report, and compare final custody against baseline. No material report/custody failure is present.
- **Unnecessary burden:** A adds task-extraneous pilot-state bookkeeping and a terminal disposition request. B adds a light accessibility sweep and an unnecessarily specific final-choice formulation. These are minor burdens; B's specificity reaches further into the creative contract and therefore weighs slightly more in this task.

## Noninferiority assessment

- **A:** No material or severe noninferiority regression.
- **B:** No material or severe noninferiority regression. Its author-choice/Ideate tension and over-specific stopping choice are minor regressions only.

## Final decision

**Decision: A.** A is more precise at the two most task-sensitive seams: keeping the three facts genuinely author-owned and preserving a reversible stopping boundary without inventing the exact choice. Both outputs are broadly safe and adequate, so the margin is modest.

**Confidence: 0.77 (bounded, moderately high).**
