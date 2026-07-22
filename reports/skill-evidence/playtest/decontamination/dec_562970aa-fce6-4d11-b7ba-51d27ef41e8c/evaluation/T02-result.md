# T02 Paired Evaluation Result

## Decision

**B wins.** B is more state-safe and execution-complete. The decisive difference is continuation custody: B requires sequence 1 to be the latest accepted segment before mutation, and requires sequence 2 with no sequence 3 afterward. A verifies that sequence 1 exists before work and that sequence 2 exists after acceptance, but never proves that the single Accept action created sequence 2 rather than sequence 3 in an already-advanced project.

## Regression classification

- **A: material regression; not severe.** Its pre/post acceptance checks leave a material false-completion and historical-project custody risk. The rest of the packet is broadly safe and does not directly authorize a severe failure.
- **B: no material or severe regression.** Its remaining weaknesses are minor burden and wording issues, not outcome-threatening defects.

## Per-criterion judgments

### 1. Source-and-doc-blind visible-browser authorship

- **A: Pass.** It uses the visible Open form and visible canonical surfaces, limits repository instructions to closeout after the journey, and keeps prompt inspection in the UI. It is less explicit than B about forbidding source-derived selectors, direct APIs, and stored-state inspection.
- **B: Strong pass.** It expressly makes the packet simulation-only, requires visible actions and settled visible-state inspection, forbids direct APIs/source-derived selectors/stored-state inspection, and postpones `AGENTS.md` and active-doc routing reads until the blind journey has ended.
- **Judgment: B.**

### 2. Local isolation, loopback binding, and provider-request safety

- **A: Pass.** It requires isolated settings, a fresh production process on `127.0.0.1`, a blank OpenRouter key, pre-navigation diagnostics, and terminal blocking on any provider attempt.
- **B: Strong pass.** It adds receipt-owned paths, safe app/browser session holders, an ephemeral origin, off-origin rejection, route blocking, explicit forbidden controls, narrow recovery, and truthful provider counters. Its provider-attempt terminal rule is unambiguous.
- **Judgment: B.**

### 3. Continuation identity and supplied project/report boundary

- **A: Material weakness.** It correctly uses the supplied report and exact project, blocks instead of reconstructing a missing project, and forbids replacement. However, it does not require sequence 1 to be latest before mutation or prove sequence 2 is latest afterward. An already-advanced project could receive another acceptance while A merely reconfirms the pre-existing sequence 2.
- **B: Strong pass.** It seals the sole report and project locator, validates the path, requires sequence 1 and no later accepted sequence at entry, forbids clone/replacement, and requires sequence 2 with no sequence 3 at exit.
- **Judgment: B, decisively.**

### 4. Exactly one accepted local prose segment or honest blocker

- **A: Pass with the custody qualification above.** It limits prose to two cold attempts, blocks on replacement-level rewriting, performs one visible Accept, and requires visible sequence-2 proof. The proof is insufficiently tied to the Accept action.
- **B: Strong pass.** It defines entry and terminal cardinality, permits exactly one visible Accept, requires a settled locally/user-supplied sequence 2, forbids even drafting a third segment, and specifies blocker reporting for unavailable proof.
- **Judgment: B.**

### 5. Exact visible prompt inspection and fresh cold-context evaluation

- **A: Pass.** It covers prompt metadata, distinctive-value searches, exact prompt extraction, genuinely fresh non-forked contexts, untouched-response assessment, Ideate, Prose, Reconciliation, and Record Hygiene without provider requests.
- **B: Strong pass.** It supplies the exact minimal cold-dispatch contract, file-custody variant, `cold-subagent-unavailable` blocker, response-assessment dimensions, retry ceiling, prompt-field influence table, and narrowly bounded counterfactual.
- **Judgment: B.**

### 6. Accepted prose remains non-canonical

- **A: Strong pass.** It repeatedly distinguishes evidence from authority, forbids prompt-facing import, requires manual canonical edits, and limits reconciliation to explicit supported deltas.
- **B: Strong pass.** It makes the distinction part of the returning-author mental model, bars copying accepted prose into authority surfaces, requires independently authored visible canonical edits, and delays reminder acknowledgement until those edits exist.
- **Judgment: Tie.**

### 7. Evidence, observation/interpretation separation, and cumulative report

- **A: Pass.** It requires contemporaneous separated observations, privacy-safe retained evidence, inherited finding custody, a schema-v2 cumulative report with sixteen sections, two validation passes, cleanup, worktree comparison, and a terminal custody statement. It does not enumerate the sixteen section names or exact completed/blocked frontmatter semantics.
- **B: Strong pass.** It defines finding fields, evidence retention and deletion boundaries, inherited-ID handling, all sixteen ordered report sections, completed/blocked values, unreached-section language, evidence-index behavior, validator passes, cleanup ordering, final-delta limits, and run-root/project-path separation.
- **Judgment: B.**

### 8. Task-specific narrative, knowledge, presence, and stopping boundaries

- **A: Strong pass.** It preserves Hina's ego-dystonic OCD portrayal, Calen's injured crossbar role, sword dormancy, movement geometry, one non-breaching impact, shared listening breaths, unknown threat, and exact warning endpoint.
- **B: Strong pass.** It preserves all of A's boundaries and further seals POV/tense, participants, offstage identity/intent/capability locks, physical competence, geometry, voice, and unsupported-delta exclusions. The suggestion to use a compressed/present-minor function for Calen "if still accurate" is slightly fussy, but it does not override the explicit requirements that he remain physically active and deliver the warning.
- **Judgment: B.**

## Safety, state, report, and custody findings

- **A omission:** no explicit latest-sequence/no-sequence-3 invariant. This is the sole material failure because it can disconnect the acceptance claim from the actual mutation and damage continuation custody.
- **A omission:** less explicit prohibition of direct API/state inspection and less exact blocked-report/frontmatter handling. These increase operator interpretation burden but are not independently material.
- **A contradiction:** none direct. "Expected sequence 2" is consistent with the task, but too weak as a gate.
- **B omission:** no material omission found.
- **B contradiction:** none material. Its post-journey doc read is explicitly outside the source-and-doc-blind author journey and therefore does not violate the rubric.
- **B custody:** strongest of the pair. It separates project, run root, repository evidence, scratch, and exchange custody and protects the historical project during cleanup.

## Operator burden

- **A:** Lower reading and execution burden. Its concise structure is easier to scan, but some of that economy comes from leaving critical state identity and report details implicit.
- **B:** Higher reading burden and more procedural ceremony, especially around helper commands, action tooling, field-influence evidence, recovery, and report validation. Most of this is justified by the rubric and reduces ambiguity. The minor excess does not outweigh its state-safety advantage.

## Final rationale

B wins on a consequential correctness boundary, not merely completeness or prose quality. A would otherwise be adequate, but its acceptance proof can validate the existence of sequence 2 without proving that the run began at sequence 1 or that its one Accept produced sequence 2. B closes that gap and provides the stronger safety, custody, and terminal-report contract while preserving every task-specific boundary.
