# Deterministic Validation Results

## Concealed mapping

- A: unchanged current skill
- B: isolated candidate
- Mapping was disclosed only after the independent evaluator completed
  `raw/evaluation.md`.

## Target test set

Unchanged current skill:

- `node --test .claude/skills/implement/scripts/build-closeout-body.test.mjs`:
  26 passed, 1 failed.
- The failure was the existing assertion that `.agents/skills/implement` is not
  a symlink; the live mirror is a symlink.
- The other three target script test files: 54 passed, 0 failed.

Isolated candidate in a repository-shaped `/tmp` copy:

- `node --test .claude/skills/implement/scripts/build-closeout-body.test.mjs`:
  27 passed, 1 failed.
- The same pre-existing `.agents` mirror assertion failed.
- The other three target script test files: 54 passed, 0 failed.

Candidate-specific standalone command:

- Manifest generation from `fixtures/standalone-issue.json`: passed.
- `build-closeout-body.mjs ... --scope standalone --anchor 901 ... --size-plan
  --require-headroom`: passed.
- Size plan: 7,245 scaffold bytes, 58,291 remaining bytes, status `ok`.
- Rendered heading: `Implementation closeout for standalone issue #901`.
- Rendered parent and fixed-child fields were explicit standalone N/A values.

## Frozen-trial decision

- Trial 1: candidate preferred; both passed.
- Trial 2: candidate preferred; both passed.
- Trial 3: current passed, candidate failed because its executor omitted the
  explicit no-parent statement required by the frozen rubric.
- Trial 4: tie; both passed.
- Trial 5: tie; both passed.

Decision: rejected. The candidate was not noninferior on every protected core
behavior, so the acceptance gate did not permit landing.
