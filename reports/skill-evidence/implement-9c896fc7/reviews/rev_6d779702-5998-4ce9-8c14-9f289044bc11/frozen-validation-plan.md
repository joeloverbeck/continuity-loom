# Frozen validation plan — rev_6d779702-5998-4ce9-8c14-9f289044bc11

Frozen before any candidate existed. Target: `.claude/skills/implement`, baseline hash
`b4857a8635d28a746cbb42f33a3713462b846d0591a71398b8eeabe4129e2f59`.

## Risk tier

**high** — the change alters the acceptance boundary of a closeout validation gate (what counts
as an unresolved value and as a concrete proof anchor). Weakening that boundary is the primary
regression risk, and the gate is consumed by closeout flows shared with the tdd and code-review
skills. Six paired trials (five required for escalation, plus one blind authoring trial).

## Confirmed mechanisms under test

- **M-A** `validate-closeout-body.mjs` flags a `satisfied` row as "contains an unresolved value"
  when the placeholder word blacklist `\b(?:TODO|TBD|pending|unknown)\b` matches text that is a
  quoted literal identifier rather than a status value.
- **M-B** `concreteProofAnchor` rejects a bare source filename (`evolution.mjs`,
  `status.mjs:226`) inside `proof surfaces:` while accepting a bare `notes.md` or `config.json`,
  and while accepting any slash-bearing source path.

## Trials

Each trial runs against **both** the unchanged live skill and the isolated candidate. Trial
fixtures are built from the same harness shape as `validate-closeout-body.test.mjs` (manifest via
`build-acceptance-manifest.mjs`, body via the existing full closeout fixture) so that only the
evidence cell under test varies.

### T1 — reproduction of M-A (must flip to accept)

Raw input: an `--audit-only --review-entry` body whose single satisfied row cites, in
`proof surfaces:`, a real test path **and** the literal test title
`a pending-cooldown gate state never removes a ready target from the census`.
Observable pass/fail: validator exit code 0.
Expected current: non-zero, error `contains an unresolved value`.
Protects: an author may cite a real repository identifier whose name contains gate vocabulary
without renaming the repository artifact.

### T2 — reproduction of M-B (must flip to accept)

Raw input: satisfied row whose `proof surfaces:` names only bare source files —
`evolution.mjs` and `status.mjs:226`.
Observable pass/fail: validator exit code 0.
Expected current: non-zero, error `proof surfaces must name a concrete test, command, path,
route, URL, or tracker reference`.
Protects: a named concrete source file is a concrete anchor, on the same footing as the bare
`.md`/`.json` filenames the gate already accepts.

### T3 — safety: genuine unresolved values must still be rejected (both versions)

Raw inputs, one body each: (a) `proof surfaces: TODO`; (b) `sequence: pending`;
(c) `atoms: unknown`; (d) prose placeholder `proof surfaces: browser check pending`.
Observable pass/fail: non-zero exit with the unresolved-value error, on **both** versions.
Protects: the gate's actual purpose. Any candidate that accepts one of these fails outright.

### T4 — safety: vacuous or circular proof surfaces must still be rejected (both versions)

Raw inputs, one body each: (a) `proof surfaces: verified locally by inspection`;
(b) `proof surfaces: the tests pass`; (c) `proof surfaces: all named items`.
Observable pass/fail: non-zero exit on **both** versions ((a)/(b) anchor error, (c) circular
error). Protects: the anchor requirement is not loosened into nothing.

### T5 — unrelated core regression (deterministic)

`node --test` over every implement script test file
(`build-closeout-body.test.mjs`, `validate-closeout-body.test.mjs`,
`capture-github-issues.test.mjs`, `verify-github-comment-body.test.mjs`) on both versions.
Observable pass/fail: identical pass counts, zero failures on both.
Protects: the whole closeout build/validate contract outside the two mechanisms.

### T6 — blind independent-agent authoring trial

Two fresh subagents, each handed one unlabeled validator copy in its own sandbox plus the
skill's authoring guidance excerpt, and the same raw task: write the satisfied audit row for a
criterion whose only proof is a test titled `a pending-cooldown gate state never removes a ready
target from the census` living in `status.test.mjs`, plus the source file `status.mjs`; iterate
against the validator until it passes.
Neither agent is told the diagnosis, the intended repair, which version it holds, or that a
comparison exists. Reported per agent: (i) number of validate rounds to pass, (ii) every file it
changed anywhere outside the closeout body, (iii) whether it altered any repository identifier
purely for validator compatibility.
Observable comparison rubric: fewer validate rounds is better; **any** change to a repository
identifier made solely for validator compatibility is a material defect for that version.
Protects: the field consequence recorded in `evt_3d45297f` (a repository test renamed for
validator compatibility).

## Deterministic checks

- `node --test .claude/skills/implement/scripts/*.test.mjs` — both versions (T5).
- Candidate-only, before landing: the same suite including the new regression tests added to
  `validate-closeout-body.test.mjs`.

## Out of scope for this review

`evt_3d45297f` also records the **tdd** closing validator rejecting verification-ledger rows
reading `passed 21 of 21; failed 0`. That check lives in
`.claude/skills/tdd/scripts/validate-tdd-closeout-body.mjs`, outside this target. It is routed
factually to that owner in the review report and is not repaired here.
