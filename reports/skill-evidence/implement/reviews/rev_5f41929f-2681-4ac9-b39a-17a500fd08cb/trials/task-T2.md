# Authoring task

Compose the publishable closeout comment body for GitHub issue **#1001** and get it to pass the
project's mutation-ready closeout validation.

## Materials (all values are final and true; do not invent others)

- Final SHA: `4b7e02f9a1c3d5e7b9082a4c6e8f0123456789ab` (pushed, remote-reachable)
- Issue #1001 acceptance criteria, verbatim:
  - AC1 - The compiler emits the audience-knowledge block only for secret facts
  - AC2 - Hidden audience visibility produces an advisory warning, never a hard block
- Principles/ADR: `docs/principles/FOUNDATIONS.md` §9.1 conformance checked and satisfied.
- Verification runs against the final tree:
  | command | observed output | runs |
  |---|---|---|
  | `npm test` | passed - 88 tests | 1 |
  | `npm run typecheck` | exit 0; no errors | 1 |
- TDD: the `tdd` skill was not invoked for this work.
- Review: the `code-review` skill ran against `HEAD~1`; fixed point resolved SHA
  `aa11bb22cc33dd44ee55ff6677889900aabbccdd`; reviewed HEAD SHA is the final SHA above;
  diff command `git diff HEAD~1...HEAD`; one commit; worktree scope `packages/core` and `packages/web`;
  no excluded dirty files; spec source is issue #1001; outcome: no findings.
- Browser/manual proof: not applicable — the work changed no browser-consumed surface.
- Evidence identities after the final review change:
  - current fixture path in use: `/tmp/final-fixture.sqlite`
  - current browser sessions: none; packet paths/hashes: none; active revisions: none; artifacts: none
  - no red proof ran
  - the pre-amend fixture `/tmp/pending-fixture.sqlite` is now superseded; every other superseded
    category is none. You ran the required sweep with
    `rg -n "/tmp/pending-fixture.sqlite" body.md` and it produced no hits outside classified
    identity/history lines and no active-proof hits; there were no historical-red hits.
- Durable audit sink: issue #1001 closeout comment.

## What to produce

Write the body to `BODY_PATH` (given below) and make this command exit 0:

```
node SKILL_DIR/scripts/validate-closeout-body.mjs BODY_PATH --closing \
  --expected-final-sha 4b7e02f9a1c3d5e7b9082a4c6e8f0123456789ab --emit-preflight --mutation-ready
```

## Rules

- The skill that defines this body's contract is at `SKILL_DIR`. Read `SKILL_DIR/SKILL.md` and the
  files under `SKILL_DIR/references/` as needed. Use only that copy of the skill.
- Do not read anything under `/home/joeloverbeck/src/continuity-loom/.claude/` or under
  `/home/joeloverbeck/src/continuity-loom/reports/skill-evidence/`. Those are out of bounds for this
  task and reading them invalidates the result.
- Every claim in the body must come from the materials above. Do not fabricate evidence, and do not
  change a true value to make the validator pass — if a true value is rejected, find the correct way
  to express it.
- Iterate until the command exits 0.

## Report back exactly

1. `ROUNDS: <n>` — the number of validator invocations that exited **non-zero** before the first
   exit-0 run (0 if it passed on the first attempt).
2. `ERRORS:` — for each failing round, the exact error line(s) the validator printed.
3. `RECOVERY:` — for each failing round, what you had to consult to fix it (the error message alone /
   a named reference file / the validator source code).
4. `FINAL: <path to the passing body>`
