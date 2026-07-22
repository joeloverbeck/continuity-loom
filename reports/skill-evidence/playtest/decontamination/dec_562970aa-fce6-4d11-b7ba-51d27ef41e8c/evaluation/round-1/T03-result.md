# T03 Paired-Output Evaluation

## Decision

**A** wins, with **moderate-high bounded confidence (0.78)**.

Both packets are adequate and neither contains a material or severe regression. A wins narrowly because its first-view witness is more completely sealed and auditable, and its independent-claim packet has stronger stable linkage between proposed report wording, visible evidence, reproduction, rival explanations, discriminators, and final evidence tags. B is stronger in a few execution details, especially its explicit positive challenge count and one-fresh-context-per-claim rule, but those advantages do not outweigh A's more reportable transfer-evidence chain.

## Per-criterion judgments

| Criterion | A | B | Judgment |
|---|---|---|---|
| 1. Source-and-doc-blind visible-browser author | Pass. Explicitly limits the author to the visible 1440x900 UI and bars APIs, hidden state, DOM injection, project files, and source-derived selectors. | Pass. Explicitly bars source, tests, docs, APIs, project files, SQLite, hidden state, and runtime internals, and requires visible semantic actions. | Tie. |
| 2. Isolated local app/browser, loopback, provider guards | Pass. Unique temporary project/settings/run custody, `127.0.0.1`, ephemeral port, blank key, exact-origin browser, and enumerated provider-route guards are explicit. A send click or guard event terminates the run. | Pass. Equivalent isolation and loopback controls, with particularly concrete holder/helper use and an explicit ban on all named send controls. Provider clicks or blocks terminate the run. | B by a small margin for operational specificity; no safety defect in A. |
| 3. New-story versus continuation boundary | Pass. Declares `new_story`, creates a unique UI-owned temporary project, and supplies a continuation handoff without importing prior-project state. | Pass. Declares a future `new_story` run, passes no prior report, creates only the prepared temporary project through the UI, and preserves it for continuation. | Tie. |
| 4. Exactly one accepted segment or honest blocker | Pass. Requires visible sequence `1`, one accepted segment, no second generation, and truthful blocked outcomes after bounded prose recovery. | Pass. Requires one acceptance, visible Accepted Segments proof, no second segment, and specific blockers for unprovable acceptance or poor prose. | A by a small margin because the new-story sequence proof is exact; both are safe. |
| 5. Exact visible prompt plus fresh cold-context evaluation | Pass. Requires visible prompt metadata, full visibly open prompt extraction, one fresh context per attempt, raw-output preservation, bounded retry, and naturalistic assistance use. | Pass. Adds a precise visible `text-file` transfer, a sole-task executor instruction, strict one-executor-per-attempt isolation, and explicit reporting that the cold path does not test provider parsing/cards. | B. |
| 6. Accepted prose remains non-canonical | Pass. Accepted prose is evidence only; durable changes require deliberate manual record or Generation Brief edits through visible canonical UI. | Pass. Same boundary, including explicit preservation of uncertainty and no claim of reconciliation until canonical surfaces visibly contain chosen changes. | Tie. |
| 7. Evidence, observation/interpretation split, cumulative report | Pass. Requires contemporaneous fact/interpretation separation, a privacy-safe retention whitelist, schema-v2 cumulative reporting, counters, evidence tags, validation, cleanup, and continuation custody. | Pass. Requires a detailed observation ledger, privacy-safe evidence rules, schema-v2 report fields, all required tables/sections, stable finding IDs, validation, and a precise handoff. | Tie overall. B is more prescriptive about schema shape; A links independent challenges to report claims more tightly. |
| 8. Narrative, knowledge, presence, and stopping bounds | Pass. Preserves every named character, setting, knowledge, agency, physical-continuity, prohibited-content, and reversible-stop constraint. | Pass. Preserves the same boundaries and additionally cautions against inventing exact woods-route geometry or silently placing staff onstage. | B by a small margin for useful clarification; no omission in A. |

## Task-specific transfer-evidence judgments

| Task-specific criterion | A | B | Judgment |
|---|---|---|---|
| First-view witness assigned before contamination | Strong pass. The initial screenshot is withheld from the main operator, the witness packet is neutral and fingerprinted, the response is frozen before the operator inspects the unchanged screen, and witness/operator accounts remain independently fixed before comparison. | Pass. Assignment occurs before main-author inspection, the witness gets only the neutral initial-screen image, and the author account is fixed separately. The sequencing is sound. | A. |
| First-view evidence is sealed, bounded, and reportable | Strong pass. A specifies screenshot hash, packet-manifest fingerprint, temporary raw-response custody, timestamp, host family, model identity or `unknown`, privacy check, bounded questions/rating, and the precise limitation that this proves only first-screen comprehension. | Adequate pass. It fingerprints the response, keeps raw output temporary, limits the inference to first-view transfer, and reports the counter. It does not equally specify a packet-manifest fingerprint or the same witness provenance/privacy metadata, leaving a thinner audit seal. | A. |
| Important claims challenged independently with bounded confidence | Strong pass. Up to three decision-driving claims are sent to a fresh context with stable finding ID, exact wording, observation, expectation/result, reproduction, evidence identity, interpretation, and confidence; rival explanations and observable discriminators are required. | Strong pass. Important claims go to no-parent-context challengers one claim at a time, the count must be positive, and supported/narrowed/contradicted/insufficient outcomes constrain final wording. | Tie on substantive independence. A is stronger for reportability; B is stronger for per-claim isolation and an unambiguous positive-count floor. |
| Story-specific boundaries remain explicit | Pass. All agency, historical setting, offstage, knowledge, geometry, prohibited development, and reversible-stop requirements remain explicit through charter, prompt assessment, acceptance, and handoff. | Pass. Same, with careful treatment of unauthored geometry and staff presence. | Tie. |

## Omissions, contradictions, and burden

### A

- Minor ambiguity: `challenge up to three` does not state the positive minimum as mechanically as B does. Read in context, the imperative to challenge actual decision-driving claims makes zero challenges an unreasonable execution, but an explicit `>= 1` report gate would be stronger.
- Minor independence tradeoff: one challenger receives all selected claims, so the challenges are independent from the operator but not isolated from each other.
- No contradiction, provider-safety failure, state-integrity failure, manufactured acceptance path, continuity-authority leak, or report-custody failure was found.
- Metadata and packet fingerprinting add modest work, but it is proportionate to the task's explicit transfer-evidence requirement.

### B

- The first-view chain is correctly ordered but less completely sealed for later audit: it fingerprints the response rather than explicitly fingerprinting the exact witness packet manifest, and it omits A's timestamp/host/model/privacy-check receipt.
- The independent-claim flow is safely bounded, but one fresh challenger per claim imposes more dispatch burden than A's single bounded multi-claim packet.
- The instruction to provide only minimum visible evidence, while privacy-safe, gives less explicit assurance that every challenger receives the exact proposed wording, expectation/result, reproduction, and evidence identity needed for a durable report linkage. Other parts of B partially compensate through stable finding IDs and result tags.
- No contradiction, provider-safety failure, state-integrity failure, manufactured acceptance path, continuity-authority leak, or cumulative-report omission was found.

## Regression assessment

- **A:** No material regression; no severe regression.
- **B:** No material regression; no severe regression.

The noted weaknesses are minor comparative gaps, not noninferiority failures. Either packet can safely govern this simulated T03 run, but A better satisfies the requested operational seal and reportable custody for the first-view and independent-claim instruments.
