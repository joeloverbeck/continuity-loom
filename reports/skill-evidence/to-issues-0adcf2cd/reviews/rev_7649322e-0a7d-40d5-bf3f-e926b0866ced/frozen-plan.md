# Frozen validation plan — rev_7649322e-0a7d-40d5-bf3f-e926b0866ced

Frozen before any candidate existed. No trial may be added, removed, or reworded after this point.

## Confirmed mechanism

The skill's own staged-artifact documentation states shapes that the skill's own validators reject.
An author following the documentation produces artifacts that fail the gate on first submission, and
recovery requires reading validator source. Five divergence sites are implicated by the trigger events:

1. run-sheet rows shown without the required leading/trailing pipes (`parseChecklistRows` needs `/^\|.*\|$/`)
2. `blockedBySlices` documented as "exact earlier slice titles"; validator matches the `slice` identifier
3. `## Blocked by` bullets documented as free prose; every `#N` in a bullet is parsed as a declared blocker
4. posted-ledger contents listed without the required literal `Breakdown decisions` heading
5. manifest fields listed without value shapes (`checklistMapped` string, nested `parent.ledger` object)

## Risk tier

**high** — the edited reference governs external tracker writes (issue creation, parent mutation,
ledger comments). Minimum five paired trials; nine are frozen below.

## Evaluator-independence requirements

- Every authoring trial runs in an independent subagent with no diagnosis, no intended repair, no
  expected answer, and no version label.
- Executors receive a neutral documentation bundle in a scratch directory (`docs-A` / `docs-B`,
  assignment concealed and varied per trial) containing only `SKILL.md` and `publication-protocol.md`.
- Executors are forbidden from reading `.claude/skills/to-issues/scripts/**`. This is the measured
  condition: the incidents are about authoring from documentation alone. Any executor that reports
  reading validator source invalidates that trial run and it is rerun with a fresh executor.
- Grading is mechanical (exported validator functions, exit codes) for T1–T7 and T9. T8 uses a blind
  rubric scored by an evaluator that does not know which version produced which output.

## Paired trials

Each trial runs against the unchanged live skill and the candidate.

### T1 — reproduction: checklist run sheet (affected slice)
- Task: `trials/t1-task.md`, inputs `trials/t1-body.md`
- Check: `validateRunSheet` reports `rowCount >= 1`, and every check for the slice is true
- Protects: run-sheet authorability from documentation

### T2 — reproduction: working publication ledger
- Task: `trials/t2-task.md`
- Check: `validateWorkingPublicationState(ledger).errors` is empty
- Protects: dependency-edge freezing before any tracker write

### T3 — reproduction: child body whose Blocked by bullet narrates the dependency
- Task: `trials/t3-task.md`
- Check: `validateChild` — all checks true, notably `hasOnlyExpectedBlockers`
- Protects: blocker-array truthfulness on the published issue

### T4 — reproduction: parent child-map ledger comment body
- Task: `trials/t4-task.md`
- Check: `validateLedger` — all checks true, notably `hasBreakdownDecisions`
- Protects: durable breakdown rationale on the parent

### T5 — reproduction: final family manifest
- Task: `trials/t5-task.md`
- Check: `validateManifest(manifest)` returns zero errors
- Protects: final family verification being reachable at all

### T6 — adjacent: run sheet spanning one affected and one unaffected slice
- Task: `trials/t6-task.md`, inputs `trials/t6-body.md`
- Check: `validateRunSheet` with the unaffected slice declared — all checks true
- Protects: the same capability exercised through the N/A path

### T7 — core regression: standalone-source child body, no blockers
- Task: `trials/t7-task.md`
- Check: `validateChild` in standalone-source mode with `expectNoBlocker` — all checks true
- Protects: the issue-body contract adjacent to an edited section

### T8 — core regression: approval checkpoint fidelity
- Task: `trials/t8-task.md`
- Check: blind rubric — slice block format, all eight postures with concrete values, prefactoring
  verdict, explicit authorization sentence, no tracker mutation proposed without approval
- Protects: SKILL.md section 4 behavior

### T9 — safety invariant: gate strength unchanged
- Deterministic, no executor
- Check: `node --test` passes on all three script test files for both versions, and no byte under
  `scripts/` differs between the live target and the candidate
- Protects: the prohibition on weakening validation gates

## Acceptance rule (frozen)

Candidate passes only if: T1–T5 fail on current and pass on candidate for at least the divergence
sites they exercise; T6–T8 are noninferior; T9 is exactly equal; no new failure appears anywhere;
and any growth is confined to the divergence sites.
