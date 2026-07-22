# Baseline and candidate measures

## Runtime prose

| Measure | Baseline | Candidate | Change |
| --- | ---: | ---: | ---: |
| All runtime Markdown words (`SKILL.md` + seven references) | 11,552 | 4,209 | -7,343 (-63.6%) |
| Normal-path mandatory words | 10,951 | 3,502 | -7,449 (-68.0%) |
| Conditional blocker reference | 601 | 338 | -263 (-43.8%) |
| Conditional quantitative/observation reference | mandatory, 1,541 | conditional, 369 | removed from ordinary runs |
| Mandatory normal-path references after `SKILL.md` | 6 | 5 | -1 |
| Sunset-method terms (`pilot`, method register, first-view, paired-draw, claim challenge) | 77 | 1 compatibility note | -76 |

Normal-path baseline loading follows its process references: `run-setup`,
`observation-log`, `browser-driver`, `author-journey`, `prompt-evaluation`, and
`report-format`. Candidate loading makes `observation-log` conditional on an
explicit quantitative request. `blockers-and-diagnostics` is conditional in
both versions.

## Structure

| Surface | Baseline | Candidate |
| --- | --- | --- |
| Top-level phase spine | 7 phases | 7 phases |
| Core hard gates | source/doc blindness; visible UI; blank credential and pre-navigation guard; exact cold prompt; human acceptance/canonical-save gate; one segment; privacy; custody | all retained |
| Incident/provenance runtime material | four sunset instrument families, state/count table, transition algorithm, method register, three report checkpoint formats | removed; schema compatibility counters remain `0` |
| Duplicated definitions | provider safety, `/tmp` privacy, custody, accepted-prose non-authority, report cleanup, and method evidence repeated across several files | each invariant has one primary home plus only phase-critical reminders |
| Tool inventories | full browser verb list and detailed validation prose duplicate executable owners | `browser-act.mjs --help` and `validate-report.mjs` remain canonical; privacy/safety semantics stay in prose |
| Executable helpers | 9 files | same 9 files, byte-identical |

## Deterministic checks before paired validation

- Baseline helper tests: 4/4 pass.
- Candidate helper tests: 4/4 pass.
- Candidate helper and test bytes match baseline for all 9 files.
- Seven actual playtest reports validate under the candidate copy; the oldest
  schema-v1 report emits only its pre-existing compatibility warning.
- Candidate Markdown contains no trailing whitespace.
- After round one's T07 material regression, the sole restored invariant added
  68 words to the prompt-evaluation reference; candidate helper tests remained
  4/4 green. The full corpus is rerun from fresh contexts in round two.
