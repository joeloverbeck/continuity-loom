# Observation Scratchpad

Append throughout the run. Do not reconstruct the experience from memory at report time. Preserve
earlier misunderstandings and append corrections rather than rewriting history.

## Contents

- [Required opening blocks](#required-opening-blocks)
- [Observation entry](#observation-entry)
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

- Cold First-View Witness: <authoritative state>; eligible | not-eligible | pending-unavailable
- Paired-Draw Check: <authoritative state>; eligible-if-natural | not-eligible | pending-unavailable
- Independent Claim Challenges: <authoritative state>; eligible-after-draft | no-decision-driving-claims | pending-unavailable
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

## Method evidence checkpoints

Keep these blocks in the scratchpad only when the instrument naturally triggers. Do not copy story
substance, full prompts, raw responses, candidate prose, or accepted prose into them.

### Cold First-View Witness

```markdown
| Packet fingerprint | Timestamp | Executor host | Executor model                   | Model identity exposed | First-action summary | Expectation mismatch | Unclear terms count | Clarity                    | Main-operator comparison | Privacy check |
| ------------------ | --------- | ------------- | -------------------------------- | ---------------------- | -------------------- | -------------------- | ------------------: | -------------------------- | ------------------------ | ------------- |
| <sha256>           | <UTC>     | <host family> | <exact exposed model or unknown> | true/false             | ...                  | ...                  |                   0 | clear/partly-clear/unclear | ...                      | passed        |
```

### Paired-Draw Check

Record the predeclared eligibility and output classes before either draw. Preserve separate raw
assessments and adoption decisions.

```markdown
- Prompt kind:
- Prompt fingerprint:
- Eligibility reason:
- Informative output classes:
- Pair class: concordant-substantive | concordant-no-change | discordant | both-poor-or-malformed | blocked
- What the pair supports:
- What the pair cannot establish:
- Effect on likely-layer attribution:
- Counterfactual used: yes | no

| Draw | Timestamp | Executor host | Executor model | Model identity exposed | Prompt fingerprint | Structural class | Usefulness verdict | Author adoption | Burden |
| ---- | --------- | ------------- | -------------- | ---------------------- | ------------------ | ---------------- | ------------------ | --------------- | ------ |
| A    | ...       | ...           | ...            | true/false             | ...                | ...              | ...                | ...             | ...    |
| B    | ...       | ...           | ...            | true/false             | ...                | ...              | ...                | ...             | ...    |
```

### Independent Claim Challenges

Challenge no more than three claims that are blockers or major findings, drive the executive
assessment, make a likely-layer/causal inference intended to drive product work, or preserve a
strength that constrains change. Put all eligible claims for this report into one privacy-safe
packet. Send it either to the Phase-A witness after its first-view response is frozen or to one new
fresh context. For each claim include the ID and exact proposed wording, observed visible fact,
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

Tag each schema-v2 Prioritized Finding and each challenged claim with one or more comma-separated
values from this fixed vocabulary:

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
tag routine observations that never become decision-driving claims.

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
record-hygiene, segment-reconciliation, continuation, persistence, accessibility, layout,
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
decision has a contemporaneous entry or checkpoint.
