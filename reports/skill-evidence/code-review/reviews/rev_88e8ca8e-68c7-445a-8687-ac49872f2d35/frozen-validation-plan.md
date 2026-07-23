# Frozen validation plan — rev_88e8ca8e-68c7-445a-8687-ac49872f2d35

Frozen BEFORE any candidate was constructed.

## Risk tier

**Ordinary.** Doc-only change, one file (`implementation-closeout.md`), one sentence. No
change to destructive/external actions, state integrity, confidentiality, shared conventions
across skills, triggering/scope boundaries, a broad workflow section, multiple major behaviors,
or substantial deletion/reorg. Minimum three paired trials.

## Confirmed mechanism under test

The normal-body validator extracts each accepted-residual field with a line-anchored regex
(`fieldPattern` in `review-evidence-contract.mjs`: `^\s*[-*]?\s*(?:\*\*)?<label>(?:\*\*)?:\s*(.+)$`,
flags `im`/`gim`, no `s`). So `Axis`, `Source`, `Rationale`, `Revisit trigger` are only extracted
when each field label starts its own line. The point of use (`implementation-closeout.md:29`)
lists the fields inline ("record each with `Accepted residual:`, `Axis:`, ...") with no per-line
signal; the per-line rule lives only in `evidence-identities.md` §"Validator-passing field
examples". A first-attempt inline record is rejected → reformatting round (the #149 friction).

## Discriminating metric

**First-attempt accepted-residual format compliance**: does a blind executor, drafting the
accepted-residual evidence block from the real closeout reading path, produce a block whose fields
all extract cleanly on the FIRST attempt (before running the validator)?

Executors get the identical real reading path for BOTH versions — `SKILL.md` +
`implementation-closeout.md` + `evidence-identities.md` — differing only in the
`implementation-closeout.md` bytes. Executors are blind to version label, to the diagnosis, and
to the intended repair. The reviewer runs the validator on their raw first attempts as the
objective pass/fail. Executors are NOT told to run the validator (measuring first attempt, not
front-loaded iterate-to-green, which would tie by construction).

## Paired trials (each run on current AND candidate)

### T1 — Repro (2 executors per version)
Closeout: one immediate fix already made + exactly ONE intentionally-accepted residual on the
**Standards** axis. Task: draft the accepted-residual evidence block for the closeout body.
- **Pass**: first-attempt block passes `validateAcceptedResiduals` inside
  `validate-review-normal-body.mjs` — title present, `Axis` ∈ {Standards,Spec}, `Source`,
  `Rationale`, `Revisit trigger` all extracted and concrete, plus the literal
  `unhandled findings none beyond accepted residuals`.
- **Protects**: the implicated mechanism (first-attempt accepted-residual format compliance).

### T2 — Adjacent (1 executor per version)
Same setup but TWO accepted residuals: one **Standards**, one **Spec**.
- **Pass**: both records extract cleanly on first attempt (same field criteria for each).
- **Protects**: same capability exercised differently (multiple records, both axes).

### T3 — Core regression (1 executor per version)
Closeout with immediate fixes and residual findings = **none** (no accepted residuals).
Task: draft the residual-findings disposition.
- **Pass**: executor writes a "Residual findings: none"-class disposition and does NOT
  hallucinate a spurious accepted-residual block; a full normal-body validation of the assembled
  body passes.
- **Protects**: the no-residual normal path is not disturbed by the candidate wording.

## Deterministic checks

- **D1**: `diff` of candidate vs live target changes ONLY `implementation-closeout.md` — no
  script/validator bytes change → validator behavior byte-identical between versions.
- **D2**: A complete reference closeout body using the candidate-formatted accepted-residual
  block passes `node .claude/skills/code-review/scripts/validate-review-normal-body.mjs`
  with the applicable flags (candidate self-consistency).
- The existing validator test suites (`validate-review-normal-body.test.mjs`) remain valid by
  construction because no script bytes change (spot-run once).

## Acceptance gate (step 7 restated for this review)

Candidate passes only if it resolves the mechanism on T1 (raises first-attempt compliance),
is noninferior on T2/T3, introduces no regression, passes D1/D2, and is materially better on the
mechanism rather than merely reworded. Behaviorally tied → prefer candidate only if meaningfully
smaller or clearer; otherwise the live skill stays unchanged (a valid successful outcome).

## Evaluator independence

Executors: fresh independent subagents, minimal task-local context, blind to version/diagnosis/
intended repair. Version labels concealed (files given as an unlabeled reading path). Objective
pass/fail computed by the reviewer via the deterministic validator, not by the executors.
