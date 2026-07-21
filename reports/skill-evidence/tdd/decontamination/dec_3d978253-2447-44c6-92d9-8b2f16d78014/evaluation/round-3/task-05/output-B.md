# Applicability

Software red-green-refactor is not the right method for this task. The requested output is controlled evidence about two drafting contracts, not a behavior-changing code implementation. A fabricated failing test would add a new variable without proving anything about the drafting contracts. Use the supplied paired-comparison method and its own verification controls.

# Frozen comparison protocol

Before any exercise, create a run manifest that freezes:

- each bounded dossier, including an identifier/version or content hash;
- contract A, the current full-dossier contract;
- contract B, the required-core-plus-explicit-optional counterfactual;
- a mechanical diff proving the drafting contract is the only intended difference;
- the exact drafting instructions shared by both arms;
- the bounded promotion operation shared by both arms;
- the evaluation rubric, scoring anchors, observation form, and disposition rule; and
- the cold-session procedure, evaluator blinding procedure, run order, and permitted tools.

Do not revise a dossier, prompt, rubric, promotion step, or scoring definition between arms. Run each arm in a fresh context with no transcript or artifact from the other arm available. If the same author must run both arms, counterbalance arm order across dossiers and record the unavoidable learning/carryover confound. Prefer separately cold drafters and a label-blind evaluator where feasible. The contract itself cannot be hidden from the drafter, but neutral A/B labels can hide the evaluator's assumptions about which contract is current.

No arm may make a product mutation, OpenRouter/provider request, stored-data change, or authority-document change. Use only the frozen local dossiers and exercise artifacts. Verify those boundaries in the run manifest before and after each exercise; any violation invalidates the affected pair rather than becoming evidence for either contract.

# Execution sequence

For every dossier:

1. Instantiate two otherwise identical run packets. Confirm their only diff is contract A versus contract B.
2. Run A in its assigned cold session. Preserve the raw draft, questions raised, assumptions made, elapsed effort, and author interventions without cleaning them up.
3. Run B independently with the same capture fields.
4. Apply the identical bounded promotion to both drafts. Do not repair either draft before measuring the promotion result unless author correction is the defined measurement; in that case, use the same stopping rule and correction permissions in both arms.
5. Have the evaluator score both artifacts from the frozen rubric, recording concrete artifact references for every score. Resolve scorer disagreement using a predeclared rule, not an arm-specific judgment.
6. Compare only within matched dossier pairs first. Aggregate across dossiers only as a bounded summary, never as general product proof.

Measure the five required outcomes distinctly:

- **Structural compliance:** required elements present, forbidden or misplaced elements, and promotion failures, using a fixed checklist.
- **Invention pressure:** unsupported assertions, invented details, forced guesses, and clarification requests, each tied to dossier evidence.
- **Author correction cost:** corrections, editing passes, intervention time, and unresolved corrections under one fixed stopping rule.
- **Truthful readiness:** whether the artifact accurately signals ready/not-ready without hiding unsupported or absent information.
- **Downstream prompt utility:** the promoted artifact's usefulness under one frozen, provider-free evaluation procedure. Use fixed inspection questions or a deterministic local prompt construction; do not substitute a live model judgment.

Keep measurements as literal counts, checklist results, timings, and cited observations. Put causal explanations, preferences, and product implications in a separate interpretation section. Record missing runs, order effects, evaluator disagreement, dossier representativeness, author familiarity, rubric sensitivity, and any deviations as limitations/confounds.

# Evidence retention and conclusion

Retain a self-contained evidence bundle containing the manifest, contract snapshots and diff, dossier hashes, cold-session attestations, raw paired drafts, intervention/correction logs, promoted artifacts, individual score sheets, pairwise comparisons, deviations, and a summary that links every claim back to those records. Mark invalid or incomplete pairs; do not silently exclude them.

Predeclare how the bounded findings map to a recommendation, but do not select the outcome before the evidence is complete. The final report must end with exactly one of these dispositions, verbatim and without presenting alternatives as co-recommendations:

- `retain current contract`
- `reopen the closed implementation issue`
- `promote a new product rule for separate approval`

Whichever disposition is selected, qualify it as the conclusion of this bounded exercise. It is not general product proof and does not itself authorize a product or authority change.
