# Deterministic check results — candidate

Candidate diff (isolated to intended files):
- `SKILL.md` +383 bytes (one §4 pointer clause to the recipe)
- `references/closeout-templates.md` +5640 bytes (new "Tracker-Only / Zero-Code-Diff Closeout" section)
- No script changed; `diff -rq` shows only these two files differ from the live target.

- **D1** candidate `build-closeout-body.test.mjs`: 26 pass / 1 fail. The sole failure is
  "Codex implement adapter is independent…", which reads `.agents/skills/implement` relative
  to the canonical location; run from the copied candidate path it cannot resolve. Confirmed
  environmental: the same test PASSES at the live canonical location (27/27). The
  guidance-conformance test "closeout guidance documents structured splits, audit rows, and
  withheld-fixture currentness" (the test that failed the PRIOR candidate) **passes**.
- **D2** candidate `validate-closeout-body.test.mjs`: 43 pass / 0 fail.
- **D3 (centerpiece)** `deterministic/tracker-only-filled.md` (a filled instance of the recipe
  body, one 40-hex SHA) PASSES
  `validate-closeout-body.mjs … --closing --expected-final-sha aaa…aaa --emit-preflight
  --mutation-ready` in ONE shot, exit 0 ("Mutation-ready closeout validation passed"). The
  current skill provides no tracker-only recipe at all, so a builder on the current skill must
  hand-synthesize this body field by field.
- **D5** candidate `capture-github-issues.test.mjs` 4/4 and
  `verify-github-comment-body.test.mjs` 4/4: pass.

All acceptance-required deterministic checks (D1 modulo the confirmed environmental adapter
failure, D2, D3, D5) pass. The prior candidate's fatal deterministic failure is avoided.
