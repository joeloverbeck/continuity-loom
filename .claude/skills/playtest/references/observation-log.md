# Observation Scratchpad

Append throughout the run. Do not reconstruct the experience from memory at report time. Preserve
earlier misunderstandings and append corrections rather than rewriting history.

## Contents

- [Required opening blocks](#required-opening-blocks)
- [Observation entry](#observation-entry)
- [Quantitative journey ledger](#quantitative-journey-ledger)
- [Method evidence checkpoints](#method-evidence-checkpoints)
- [Evidence-basis vocabulary](#evidence-basis-vocabulary)
- [Classification vocabulary](#classification-vocabulary)
- [Severity](#severity)
- [Corrections](#corrections)

## Required opening blocks

```markdown
# Continuity Loom Playtest Scratchpad

## Run identity

- Run ID:
- Mode: new_story | continuation
- Prior report:
- Project path:
- Report path:
- Evidence directory:
- Scratch directory:
- Started at:
- Repository HEAD:
- Worktree baseline:

## Story intent

- Intended story:
- Intended next local segment:
- Intended stopping point:
- Intended characters and functions:
- Continuity and physical constraints:
- Knowledge, POV, and reveal constraints:
- Voice and prose expectations:
- Content boundaries:
- Non-goals / do not force:

## Pre-use expectations

- Expected first steps:
- Expected useful records:
- Expected private-note use:
- Expected working-set behavior:
- Expected Generation Brief work:
- Expected assistance:
- Sealed mental model:

## Method pilot plan

- Independent Claim Challenges (standing check): eligible-after-draft | no-decision-driving-claims | pending-unavailable
- Change Review delta comparison (standing method): triggers-on-continuity-planning | not-triggered | pending-unavailable; at most two per run
```

## Observation entry

Use one entry for every meaningful strength, snag, friction, confusion, defect, blocker,
expectation mismatch, recovery, or prompt-quality result:

```markdown
## Observation O007

- Timestamp:
- Surface:
- Journey phase:
- Intended action:
- Expectation before acting:
- Visible situation:
- Action through visible UI:
- Actual result:
- Observed fact:
- Author interpretation:
- Expected versus actual:
- Classification:
- Category:
- Severity:
- Confidence:
- Repetition / frequency:
- Evidence:
- Recovery or workaround:
- Desired author-visible outcome:
- Related prompt / field / prior finding:
- Notes:
```

Keep observed fact separate from interpretation. A later technical diagnostic may explain a
visible issue, but it does not replace what the author experienced.

## Quantitative journey ledger

Use this ledger only when the invocation asks for action counts, authored-field counts, setup
cost, promotion cost, or another quantitative journey comparison. Otherwise leave its prepared
status `inactive` and do not create measurement work merely because the section exists.

When active, name the requested boundaries before browser launch and append one privacy-safe row
immediately after each candidate action. Record only visible labels and a short action summary;
never copy field values, record payloads, prompt text, candidate prose, or accepted prose.

```markdown
## Quantitative journey ledger

- Status: active
- Requested boundaries:
- Comparison / shortest-path question:

| ID | Timestamp | Phase | Visible action | Kind | Field label / instance | Distinct field? | Successful write / selection? | Counted? | Exclusion reason |
| -- | --------- | ----- | -------------- | ---- | ---------------------- | --------------- | ----------------------------- | -------- | ---------------- |
| A001 | ... | project setup | Open Create Project | navigation | — | no | no | yes | — |

### Quantitative boundary snapshots

| Boundary | Through action ID | Counted visible actions | Distinct authored fields | Successful writes / selections | Notes |
| -------- | ----------------- | ----------------------: | -----------------------: | -----------------------------: | ----- |
| First readiness | <last-id> | <n> | <n> | <n> | ... |
```

Use the fixed kinds `navigation`, `control`, `field-write`, `selection`, `submit`, and
`inspection`. `Visible action` names what the author did, never the authored value. Boundary
snapshots are cumulative through a stable action ID; calculate later deltas from those snapshots
instead of reconstructing the journey from memory.

Keep the observed path intact. If the request also asks for a shortest demonstrated path, mark
which successful checks or navigation steps are removable and calculate that path separately;
never rewrite the observed count to make it look minimal.

## Method evidence checkpoints

Keep these blocks in the scratchpad only when the instrument naturally triggers. Do not copy story
substance, full prompts, raw responses, candidate prose, or accepted prose into them.

### Change Review Delta Comparison

Seal the independent canonical-update baseline before compiling the Accepted-Segment Change Review
prompt and before any segment-derived canonical edit. Record the privacy-safe adjudication only; keep
exact story-bearing baseline text and raw responses in the temporary exchange directory. A run holds
at most two comparisons.

```markdown
- Segment sequence:
- Record scope: active_working_set | whole_project
- Prompt fingerprint:
- Baseline in-profile count:
- Baseline out-of-profile count:
- Six-dimension disposition: <per dimension: change expected | no change expected | uncertain>
- Correspondence counts: matched=<n>; baseline-only=<n>; review-only-accepted=<n>; review-only-rejected=<n>; partial=<n>; unscorable=<n>
- Coverage disagreements (0-6):
- Substitution verdict: discovery-complete for this episode | materially reduced discovery work | independent audit still required | unsafe or misleading | not assessable
- Related finding IDs: <F-ids for every material discrepancy, or none - reason>
```

### Independent Claim Challenges

Challenge no more than three claims that are blockers or major findings, drive the executive
assessment, make a likely-layer/causal inference intended to drive product work, or preserve a
strength that constrains change. Put all eligible claims for this report into one privacy-safe
packet. Send it to one new fresh context. For each claim include the ID and exact proposed wording, observed visible fact,
expected versus actual, reproduction, cited artifact identity or sanitized crop, and the operator
interpretation and confidence. Exclude remedies and all raw story, prompt, response, candidate, and
accepted-prose material. Require one rival explanation and one observable discriminator per claim.

Store each exact packet temporarily under the run's exchange directory. If it references a
sanitized crop, include the crop's SHA-256 in the packet. The durable packet fingerprint is the
lowercase SHA-256 of the exact UTF-8 packet bytes sent to the challenger.

```markdown
| Claim ID | Eligibility reason | Timestamp | Executor host | Executor model | Model identity exposed | Packet fingerprint | Status                                       | Rival explanation | Observable discriminator | Operator resolution | Evidence basis |
| -------- | ------------------ | --------- | ------------- | -------------- | ---------------------- | ------------------ | -------------------------------------------- | ----------------- | ------------------------ | ------------------- | -------------- |
| F001     | ...                | ...       | ...           | ...            | true/false             | <sha256>           | supported/narrowed/contradicted/insufficient | ...               | ...                      | ...                 | ...            |
```

The challenger advises; the main operator decides the report wording and must explain any
resolution that differs from the challenge. Do not vote, auto-delete a claim, or ask the
challenger to validate product semantics.

## Evidence-basis vocabulary

Tag each schema-v2 or schema-v3 Prioritized Finding and each challenged claim with one or more
comma-separated values from this fixed vocabulary:

- `direct-visible`
- `reproduced`
- `source-confirmed`
- `independent-supported`
- `independent-narrowed`
- `independent-contradicted`
- `independent-insufficient`
- `paired-concordant`
- `paired-discordant`
- `cross-run-recurrent`
- `counterfactual-suggestive`
- `single-observer-inference`

Tags describe the evidence actually obtained; they are not scores or confidence upgrades. Do not
tag routine observations that never become decision-driving claims. The `paired-concordant` and
`paired-discordant` tags belong only to historical Paired-Draw Check evidence; do not reuse them for
the Change Review delta comparison, which records its own correspondence and coverage tallies.

## Classification vocabulary

Use one primary classification:

- `strength`
- `friction`
- `confusion`
- `defect`
- `blocker`
- `prompt-contract-mismatch` — the compiled prompt asks for output that does not serve the
  author's need, even when the model follows it;
- `model-output-failure` — the response fails or underuses an otherwise useful prompt contract;
- `low-value-output` — the response is valid but its signal-to-noise or adoption value is poor.

Use one primary category where applicable: onboarding, project-setup, information-architecture,
story-configuration, records, private-notes, active-working-set, generation-brief, readiness,
prompt-inspection, prose-prompt, candidate, acceptance, accepted-segments, ideate,
record-hygiene, accepted-segment-change-review, continuation, persistence, accessibility, layout,
performance, diagnostics, privacy, or provider-safety.

## Severity

- `blocker` — prevents meaningful continuation or the one-segment boundary after recovery.
- `major` — breaks or seriously misleads a core authoring, continuity, prompt, or acceptance task.
- `moderate` — meaningful recoverable friction or a prompt problem likely to change author work.
- `minor` — localized wording, presentation, or interaction cost.
- `note` — tentative, low-impact, or unconfirmed observation.
- `strength` — behavior worth preserving.

## Corrections

```markdown
## Correction O012

- Supersedes: O007
- New visible evidence:
- Corrected observed fact:
- Corrected interpretation:
- Corrected classification:
- Final-report treatment:
```

Never delete or rewrite the superseded entry. The final report uses corrected facts while
preserving a reasonable initial misunderstanding when that misunderstanding is itself useful UX
evidence.

**Completion criterion:** every meaningful first occurrence, repeat, expectation mismatch,
prompt verdict, retry, edit burden, recovery, accepted-segment milestone, and post-acceptance
decision has a contemporaneous entry or checkpoint. When quantitative tracking is active, every
candidate action has a contemporaneous ledger row and every requested boundary has a reconciled
snapshot.
