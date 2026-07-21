# Deterministic checks

## Passed before landing

- Helper `record-validation`: accepted, high risk, seven trials.
- Corpus completeness: seven prompts, inputs, and rubrics present.
- Baseline output completeness: seven non-empty responses.
- Candidate output completeness: seven non-empty responses.
- Blinding integrity: all fourteen A/B response copies byte-match their mapped
  sources.
- Candidate relative reference: `HTML-REPORT.md` exists beside `SKILL.md`.
- Candidate whitespace comparison: `git diff --no-index --check` emitted no
  whitespace error.
- Live-target immutability: both live file hashes matched the claimed baseline
  before landing.
- Agent mirror: `.agents/skills/improve-codebase-architecture` resolves to
  `../../.claude/skills/improve-codebase-architecture`.
- Executable helper delta: none; both versions contain only Markdown files.

## Validator mismatch, unchanged

The external generic `quick_validate.py` rejected both baseline and candidate
with the identical message:

`Unexpected key(s) in SKILL.md frontmatter: disable-model-invocation.`

The live skill already uses this host field and the candidate preserves it. This
check therefore provides parity evidence, not a candidate failure.

## Passed after landing

- Live target is byte-identical to the validated candidate directory.
- Live target hash in helper state:
  `76ae338982455c854f5b35b6a6c76491c5e0364354bb95f3ae853783fb2c769c`.
- `.agents` mirror still resolves to the live `.claude` target.
- `git diff --check` passes for both live target files.
- Helper event stream ends in `validation_completed`, `change_landed`, and one
  `decontamination_completed` event with outcome
  `validated_simplification_landed`.
- Gate state is closed and names this run as `last_completed_review_id`.
- Final report exists at the helper-prescribed path.
