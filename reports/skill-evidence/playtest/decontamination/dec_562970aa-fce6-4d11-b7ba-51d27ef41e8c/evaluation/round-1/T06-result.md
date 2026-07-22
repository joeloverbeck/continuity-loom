# T06 Paired-Output Evaluation

## Decision summary

- **Preferred output:** B
- **Confidence:** 0.78 (bounded; both packets are strong and the margin is narrow)
- **Material noninferiority regression:** neither A nor B
- **Severe noninferiority regression:** neither A nor B

Both outputs are adequate operator packets. B wins narrowly because it states the
minimal-record rule more precisely, explicitly prevents the undiscovered fracture
from being backfilled as already known, requires sequence `1` for the new story,
and closes the reporting/custody loop with an explicit terminal-response contract.

## Shared-criterion judgments

| Criterion | A | B | Comparative judgment |
| --- | --- | --- | --- |
| 1. Source-and-doc-blind visible-browser author journey | Pass | Pass | Both clearly prohibit product source/docs, APIs, hidden state, and non-visible advancement during the journey. |
| 2. Isolated loopback app/browser and provider guard | Pass | Pass | Both require unique run paths, isolated configuration, `127.0.0.1`, blank provider credentials, fresh browser context, guarded routes, and blocker status on a send attempt. |
| 3. New-story versus continuation boundary | Pass | Pass | Both identify this as `new_story` and preserve the new project. B is slightly clearer that no prior report or historical project is in scope and requires `prior_report: null`. |
| 4. Exactly one accepted segment or honest blocker | Pass | Pass | Both require explicit visible acceptance, archive verification, no second segment, bounded recovery, and honest blocked status. B is more exact about the expected new-story sequence being `1`; A asks for a positive new sequence in the acceptance gate and later report metadata. |
| 5. Exact visible prompt and naturally invoked cold evaluation | Pass | Pass | Both extract the visible prompt without printing it, use fresh isolated contexts, forbid OpenRouter requests, permit at most one unchanged-prompt retry, and naturally invoke Segment Reconciliation while skipping other assistance unless sincere need arises. |
| 6. Accepted prose remains non-canonical | Pass | Pass | Both treat accepted prose and assistance output as evidence only and require explicit visible author edits for durable state. Both keep Iven unchanged unless genuinely warranted. |
| 7. Evidence, observation/interpretation, and cumulative report | Pass | Pass | Both require contemporaneous observations, fact/inference separation, privacy-safe retained evidence, a cumulative schema-v2 report, post-cleanup validation, and custody comparison. B has the stronger terminal-response checklist; A has the stronger explicit report-section ordering and table-shape instruction. |
| 8. Task-specific narrative, knowledge, presence, and stop boundaries | Pass | Pass | Both preserve Nera as the only onstage close-third viewpoint, keep Iven documentary and offstage, forbid all listed additions, complete the required action chain, keep the ferry unmanned, and stop before Iven appears. |

## Task-specific judgments

### Offstage-pressure minimality

- **A:** Pass, with a small burden risk. It strongly prohibits biography,
  appearance, relationships, voice, live status, motivation, and location for
  Iven. However, its expected-record language can be read as inviting separate
  prototype, order, fracture/opening-knowledge, and physical-continuity records,
  even though later language limits these to what the visible workflow needs.
- **B:** Strong pass. It specifies one Nera dossier, one minimal ENTITY-first Iven
  record, and an order record only if the visible workflow cannot otherwise carry
  that atomic continuity. It expressly says the fracture is a segment discovery
  and must not be backfilled as already known.
- **Judgment:** B is more reliably minimal and imposes less risk of record
  inflation.

### Presence and knowledge leakage

- **A:** Strong pass. It rejects Iven speech, current action/location, interior
  state, arrival, response, implied live communication, and any extra presence.
  It also distinguishes Nera's opening lack of verification from the segment's
  end state.
- **B:** Strong pass. It applies the same boundaries at charter, record, working
  set, prompt assessment, acceptance, reconciliation, and continuation-handoff
  stages. Its explicit prohibition on backfilling fracture knowledge is a small
  additional safeguard.
- **Judgment:** B by a small margin.

### Acceptance and post-acceptance authority proof

- **A:** Pass. It requires one visible acceptance, Accepted Segments proof, the
  durable-change reminder, manual canonical edits, and reopening canonical
  surfaces to confirm claimed changes.
- **B:** Pass. It requires visible sequence `1`, acceptance-state proof without
  retained prose, manual canonical edits, and a continuation-ready handoff that
  keeps Iven's possible arrival unresolved.
- **Judgment:** Tie on substance. A is more explicit about reopening canonical
  surfaces; B is more exact about sequence and terminal custody reporting.

## Omissions, contradictions, safety/state-integrity failures, and burden

### A

- No safety or state-integrity failure found.
- No contradiction with the one-person/offstage-only story boundary found.
- Minor omission: it does not give an explicit terminal-response field list,
  even though its report, validation, shutdown, project-preservation, and custody
  requirements are otherwise complete.
- Minor burden risk: its broader expected-record wording could lead an operator
  to create more atomic continuity records than the task needs.
- Minor precision gap: new-story archive proof is described as a positive new
  sequence rather than consistently requiring sequence `1`.

### B

- No safety or state-integrity failure found.
- No contradiction with the one-person/offstage-only story boundary found.
- No material report or custody omission found.
- Minor unnecessary burden: the detailed `awaiting-disposition` pilot and method-
  register bookkeeping is not needed to preserve T06's narrative or safety
  contract, though it is explicitly non-operative and does not distort the run.
- Minor report specificity tradeoff: it refers to required report sections and
  selected reporting authorities rather than enumerating the exact section order
  and table shapes inside the packet, as A does.

## Final determination

**B is preferred.** Its advantage is narrow but task-relevant: it gives the
cleaner minimal-record rule and the clearest guard against knowledge-state
inflation while retaining the complete acceptance, authority, evidence, report,
shutdown, and custody contracts. Neither output contains a material or severe
noninferiority regression.
