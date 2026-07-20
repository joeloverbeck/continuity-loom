# Baseline and candidate measurements

Only target-owned Markdown changed. The validator, its tests, and agent metadata are byte-identical.

| Measure | Current baseline | Candidate | Change |
| --- | ---: | ---: | ---: |
| `SKILL.md` words | 1,864 | 1,209 | -655 (-35.1%) |
| Mandatory `prep-format.md` words | 2,270 | 1,536 | -734 (-32.3%) |
| Normal target-owned runtime words | 4,134 | 2,745 | -1,389 (-33.6%) |
| Approximate target-owned runtime tokens (words x 1.33) | 5,498 | 3,651 | -1,847 |
| `SKILL.md` lines | 231 | 168 | -63 |
| `prep-format.md` lines | 386 | 289 | -97 |
| Workflow phases | 5 | 5 | unchanged |
| Executable source/draft/final validation commands | 4 | 4 | unchanged |
| Executable helpers | validator plus test | same byte hashes | unchanged |
| Separate phase-level “complete only when” restatements | 4 plus final gate | one final gate | -4 restatements |

## Mandatory and conditional references

Both versions retain the same normal-path authority set: `AGENTS.md`, `docs/ACTIVE-DOCS.md`,
`docs/FOUNDATIONS.md`, affected active authorities, `docs/agents/issue-tracker.md`,
`docs/agents/triage-labels.md`, `tickets/README.md`, the full `prep-format.md`, and `/to-prd` house
style. The candidate reduces the mandatory target-owned reference by 734 words. The guarded
`browser-driver.md` reference remains conditional on an unresolved contradiction.

## Structure

- Preserved: trigger, one-artifact scope, source stop/continue gate, exact provenance capture,
  frontier and prior-prep rules, disposition doctrine, strengths, destination taxonomy, package
  ordering, version migration, privacy, ticket packets, worktree equality, custody, and exact final
  keyed response.
- Consolidated: phase completion prose, first-action explanation, migration narration, freshness
  narration, and custody reminders.
- Retained uncertainty: the retired `$skill-audit` route, because downstream custody still names it
  and no frozen trial proves a replacement.
- Removed incident/provenance narration: none was present as a dated story; no current invariant
  was deleted merely because it entered during an audit-era commit.

## Pre-trial deterministic check

The candidate was installed into a fresh shared clone at the claimed commit. Its unchanged
`validate-prd-prep.test.mjs` suite passed 26/26 tests. Baseline/candidate SHA-256 values match for
the validator, validator tests, and `agents/openai.yaml`; only `SKILL.md` and
`references/prep-format.md` differ.
