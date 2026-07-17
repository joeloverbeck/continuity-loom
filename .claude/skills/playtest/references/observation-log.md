# Observation Scratchpad

Append throughout the run. Do not reconstruct the experience from memory at report time. Preserve
earlier misunderstandings and append corrections rather than rewriting history.

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
- Blind mental model:
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
