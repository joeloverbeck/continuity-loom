# Method decision

Software red-green-refactor does not apply. This task changes no software behavior and asks for controlled comparative evidence. A fabricated failing test would neither establish the comparison nor protect its validity. Use a preregistered, cold A/B evidence protocol instead, and keep all work in the study's evidence area: no product files, stored story data, authority documents, OpenRouter requests, or other network access.

# Controlled comparison

Before either drafting run, freeze a comparison packet containing:

- the exact bounded dossier bytes and a checksum;
- contract A, the current full-dossier contract;
- contract B, the required-core-plus-explicit-optional counterfactual;
- the common drafting instruction, with the contract text occupying the only differing slot;
- one scoring sheet with operational definitions for every measure;
- the bounded-promotion procedure and allowed correction operations;
- run identifiers, ordering, drafter/evaluator identities, timestamps, and any deviations.

Do not tune the instructions, dossier, time allowance, tools, promotion rules, or rubric after seeing the first result. Strip contract-identifying labels from drafts before evaluation. Run A and B in fresh contexts with no access to the sibling output. Prefer two independent cold drafters and a blind evaluator. If only one drafter is available, use fresh contexts, randomize which contract runs first, and record order/carryover as a confound; do not describe that single pair as general product proof.

# Execution sequence

1. **Preflight.** Verify both run packets contain byte-identical dossier and common-instruction sections, differ only in the contract slot, and have no product/provider integration enabled. A second person or a mechanical diff should attest to the one-variable condition before drafting begins.
2. **Cold draft A.** Give the drafter only the common packet plus contract A. Preserve the unedited output, duration, and any clarification requests.
3. **Cold draft B.** Repeat in a new context with the identical packet plus contract B. Preserve the same evidence. Do not reveal draft A or its evaluation.
4. **Blind pre-promotion scoring.** Relabel the outputs X and Y. The evaluator scores both against the frozen sheet and records atomic observations with locations in the output. Contract preference is not scored yet.
5. **Apply the same bounded promotion.** For each draft, an author may make only preregistered corrections grounded in the supplied dossier: fill an omitted required field, remove or qualify an unsupported claim, move optional material, or repair a structural violation. No new research, provider request, dossier expansion, or discretionary rewrite is allowed. Preserve the edit log and promoted output.
6. **Blind post-promotion scoring.** Re-run the unchanged sheet on both promoted outputs. Evaluate downstream prompt utility with the same frozen downstream task and evaluator; do not send either draft to a provider or mutate a real story/project.
7. **Unblind and analyze.** Compare A and B only after both pre/post score sheets are locked. Report within-pair deltas, not a generalized effect claim.
8. **Disposition.** Select exactly one allowed disposition from the evidence and place it as the final line of the report.

# Frozen measurements

Record raw observations before interpretation:

| Measure | Pre/post observation |
| --- | --- |
| Structural compliance | Required fields present, prohibited/optional fields misplaced, and format violations; list each violation and its location. |
| Invention pressure | Count dossier-unsupported assertions, with the source check and severity recorded for each; also record clarification requests or visible pressure to guess. |
| Author correction cost | Number and type of bounded edit operations plus elapsed correction time. Time is supporting evidence, not a substitute for the edit log. |
| Truthful readiness | Apply one frozen readiness checklist and record pass/fail per item, including unresolved uncertainty rather than treating polish as readiness. |
| Downstream prompt utility | Blind evaluator scores whether the promoted content supplies the frozen downstream task's required facts without unsupported or irrelevant material; record item-level reasons. |

For every score, retain the atomic evidence first and the numeric/category roll-up second. Keep evaluator notes such as “required relationship absent at paragraph 3” under **Observation**. Put causal claims such as “the required-core contract reduced pressure to invent” under **Interpretation** and tie each claim to the observations that support it.

# Evidence retention and report shape

Retain the frozen packet, checksum/diff attestation, raw A/B drafts, blinded X/Y mapping, pre/post score sheets, promotion edit logs, promoted drafts, run metadata, and a deviations/confounds log. The report should contain:

1. method and preregistration;
2. raw observations and paired pre/post measurements;
3. interpretation;
4. limitations and confounds;
5. the bounded recommendation.

Explicitly state that the exercise is local, bounded, and not general product proof. Do not silently resolve disagreement between measures: show it and explain how it affected the recommendation. The report must end with exactly one of these lines, with no hybrid or extra disposition:

`Disposition: retain current contract`

`Disposition: reopen the closed implementation issue`

`Disposition: promote a new product rule for separate approval`

The line is chosen only after the locked comparison is analyzed; this execution plan does not preselect it.
