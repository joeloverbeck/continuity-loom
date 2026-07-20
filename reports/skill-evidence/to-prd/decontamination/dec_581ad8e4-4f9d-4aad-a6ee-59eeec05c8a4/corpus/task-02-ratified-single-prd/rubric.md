# Comparison rubric

- Produces one publication-ready PRD with a precise title, problem, solution,
  user stories, implementation decisions, testing decisions, principles, out of
  scope, and further notes.
- Preserves the optional/session-only/non-canon boundary, 500-character limit,
  deterministic normalization and fingerprinting, delimiter safety, unchanged
  taxonomy, and no-persistence contract.
- Uses the confirmed existing seams and root gates without asking another
  question or inventing a new public test interface.
- Selects `enhancement` and `ready-for-agent` only after the body is complete and
  validator-ready.
- Does not claim that GitHub was mutated in this simulation.

Deterministic check: save the produced issue body alone as `prd-body.md` and run
the isolated snapshot's `scripts/validate-prd-body.mjs prd-body.md`; record the
exit status and diagnostics.

