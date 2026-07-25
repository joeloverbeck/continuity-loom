# Frozen validation plan — rev_301fd08e-0548-4b97-903c-67b9970967a1

Frozen before any candidate existed. Target `.claude/skills/code-review`, baseline hash
`2967265361ebe8d7d3d27aed4f89d32e7489548b4441dd562d0bf2619ddab3c7`.

## Mechanism under test

The normal-review closeout validators reject closeout field values that already satisfy the
skill's stated requirement, and their rejection messages do not name the accepted forms, so an
author revises by guessing across repeated validator rounds.

1. `review-evidence-contract.mjs` `validateSequenceSource` requires a proof token from a closed,
   inflection-brittle alternation. A cell that names its observing proof is rejected whenever the
   author uses an ordinary inflection or synonym (`tests`, `covered by`, `exercised by`,
   `confirmed by`, `checked by`, `proven`, `proof`, `traced`).
2. `validate-review-normal-body.mjs` `concreteSpecSource` rejects `issue #N comment ID <digits>`,
   the exact form `SKILL.md:51` instructs the author to write.

## Risk tier

**high** — the change widens two acceptance gates in a closeout contract shared by the normal and
fallback review validators. Five-plus paired trials required, including a vacuity/safety case.

## Deterministic checks (primary instrument)

- **D1 — existing suites.** `validate-review-normal-body.test.mjs` and
  `validate-review-fallback-body.test.mjs` run on current and candidate in a sibling-complete temp
  tree (the fallback validator imports `../../tdd/scripts/validate-tdd-closeout-body.mjs`).
  Pass criterion: candidate counts equal current counts, zero new failures.
- **D2 — frozen verdict matrix.** Each case run against both versions through the public
  validator surface. Pass criterion: every flip case flips reject→accept, every safety case
  rejects on both, every preserved case accepts on both.

  | ID | Field value | Current | Candidate must |
  |---|---|---|---|
  | F1 | `sequence: load -> save -> reload, covered by the four settings tests` | reject | accept |
  | F2 | `sequence: build -> inspect -> derive, exercised by the presenter regression tests` | reject | accept |
  | F3 | `sequence: request -> accept -> export, confirmed by the archive test suite` | reject | accept |
  | F4 | `sequence: classify -> present -> recover, proven by the workflow tests` | reject | accept |
  | F5 | `sequence: write -> read, traced in the request logs` | reject | accept |
  | F6 | `sequence: load -> save, shown by the sequence proof in the presenter suite` | reject | accept |
  | F7 | Spec inventory entry `issue #180 comment ID 5052198448` | reject | accept |
  | S1 | `sequence: load -> save -> reload` (no proof language) | reject | reject |
  | S2 | `sequence: settings load, compile, admit, observed by the settings test` (no order token) | reject | reject |
  | S3 | `sequence: N/A` (unjustified) | reject | reject |
  | S4 | `sequence: TBD` (unresolved) | reject | reject |
  | S5 | `sequence: load -> save -> reload, it is fine` (order, no proof) | reject | reject |
  | S6 | Spec inventory entry `issues #181-#183` (range hides which issue) | reject | reject |
  | S7 | Spec inventory entry `issue #180 comment ID abc` (non-numeric) | reject | reject |
  | S8 | Standards inventory `AGENTS.md, CLAUDE.md, smell baseline` (comma) | reject | reject |
  | S9 | Standards inventory without the smell baseline | reject | reject |
  | P1 | `sequence: load -> save -> reload, observed by the settings test` | accept | accept |
  | P2 | `sequence: N/A because the acceptance is not sequence-sensitive` | accept | accept |
  | P3 | Spec inventory entry `issue #180 comment 5052198448` | accept | accept |
  | P4 | Spec inventory `issue #180 \| docs/specs/README.md`, Standards fixture baseline | accept | accept |

- **D3 — message diagnosability.** For one rejected sequence cell and one rejected Spec inventory
  entry, assert whether the message names the accepted forms. Current is expected to fail;
  candidate must name them. Protects the "revise by guessing" half of the mechanism.

## Paired blind trials

Independent agents, version-blind, minimal task-local context: each receives the raw authoring
task, the body fixture, and the validator directory it must run, with no diagnosis, no intended
repair, and no version label. Metric per trial: number of validator rounds until zero errors, plus
whether the agent had to read validator source to recover.

- **T1 — reproduction (sequence).** Author the acceptance-source `sequence:` cells for a
  three-issue coverage table from supplied evidence, then run the normal-body validator until it
  passes. Protects: the implicated mechanism.
- **T2 — adjacent capability (inventory).** Author the four source-inventory fields from a supplied
  authority list that includes a tracker comment reference, then validate. Protects: the same
  "reject → guess → revise" surface exercised through a different field.
- **T3 — core regression, normal path.** A complete no-fix normal body with a genuine defect
  (missing smell baseline) must be reported as invalid with the same finding on both versions.
- **T4 — core regression, fallback path.** The fallback validator's own suite and one fallback body
  must behave identically on both versions.
- **T5 — safety/vacuity.** A body whose sequence cells assert proof without naming ordered events,
  and one that lists events with no proof claim, must be rejected on both versions. Protects the
  gate the widening could hollow out.

## Evaluator independence

D1–D3 are deterministic and self-evaluating. T1/T2 agents are told to report rounds and their
recovery route only; version identity is concealed by giving each agent a labelled copy
(`skills-a` / `skills-b`) whose mapping is not disclosed to the agent.

## Acceptance gate

Candidate accepted only if: every D2 flip case flips, every D2 safety and preserved case is
unchanged, D1 counts match, D3 improves on the candidate, and no trial shows a material or severe
regression. Behavioral tie on T1/T2 does not by itself reject, because the memoized front-loading
effect collapses round counts; D2 plus D3 are the decisive instruments.
