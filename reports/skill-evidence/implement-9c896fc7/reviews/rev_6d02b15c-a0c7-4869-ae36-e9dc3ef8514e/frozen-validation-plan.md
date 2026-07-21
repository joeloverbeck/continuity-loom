# Frozen Validation Plan: implement

Review ID: `rev_6d02b15c-a0c7-4869-ae36-e9dc3ef8514e`

## Confirmed mechanism and ownership

- Classification: target compliance defect.
- Mechanism: the target correctly prefers structured closeout evidence and warns that evidence-shape changes after the first scaffold build force a full rebuild and refill, but the main workflow introduces or refreshes that evidence and builds the final scaffold only after review findings appear. That placement allows known implementation evidence and later review/final-identity changes to arrive after scaffold construction, so agents repeatedly rebuild, refill, and revalidate the same closeout body.
- Ownership: `.claude/skills/implement` owns the ordering of its implementation, review, and tracker-closeout phases and owns the builder invocation guidance. The candidate may change only that ordering/salience. It must not weaken or reinterpret TDD, review, validator, tracker, safety, or readback contracts owned elsewhere.

## Validation design

- Risk tier: high.
- Comparison: five paired trials, each run once against the unchanged current skill and once against the isolated candidate.
- Executor context: each executor receives one anonymized skill copy, the raw trial task, and only the named input artifact. Executors do not receive the diagnosis, candidate hypothesis, expected preference, or version identity.
- Evaluator independence: evaluators receive anonymized paired outputs in randomized order, the frozen rubric, and the raw task/artifact. They do not receive skill-version identity or the candidate hypothesis.
- Deterministic checks: target tests, target-local diff/size inspection, target/mirror verification through the landing helper, and a check that the candidate changes only the demonstrated ordering/salience mechanism.

## Trial 1 - reproduction: late closeout evidence

### Raw task

You are implementing one GitHub issue. During implementation you rewrote an existing test expectation under explicit issue authority. TDD produced two seams. Code review then found one behavior defect and one evidence-only defect, both fixed in a follow-up commit. Produce the ordered execution plan from implementation evidence through the first mutation-ready tracker comment. Name when each durable closeout artifact is created or updated and when the closeout scaffold is first built. Do not perform any commands.

### Raw input artifact

- One issue, one acceptance manifest, TDD invoked.
- The existing-test contract-change row is known before review.
- Review is normal, immediate-fix, two findings, one RF row.
- Browser proof is N/A.
- Final SHA does not exist until the review-fix commit.

### Observable rubric

- Passes the mechanism if the plan records the known audit/TDD/contract-change evidence in one working structured source before the first final-scaffold build, incorporates terminal review/fix evidence into that source, and waits for the final implementation-owned SHA and final evidence identities before first building/filling the publishable final scaffold.
- Must say derived TDD/review/audit rows are generated from the structured source rather than hand-copied.
- Must still run the audit-only review-entry gate before review, normal review, final verification, all applicable validators, mutation-ready preflight, exact stored-body readback, and issue-state readback.
- Fails the mechanism if it builds/fills a final closeout scaffold before the review outcome/final SHA is stable or prescribes rebuild/refill as the normal path.

### Protected behavior

Single-source closeout evidence, exact review-fix accounting, final-SHA identity, and mutation gating.

## Trial 2 - adjacent: tracker-only no-diff closeout

### Raw task

An approved GitHub issue requires publishing one wording packet to the tracker, verifying the stored body, and closing the issue. No repository file changes are allowed. Produce a concise ordered execution plan. The plan must account for the repository's implementation review and closeout rules without inventing a code change or TDD seam. Do not perform any commands.

### Raw input artifact

- One issue with all tracker-only acceptance rows already satisfied by the approved wording packet.
- Git diff is empty and no implementation commit will be created.
- The current unchanged HEAD is the only repository identity available.
- No browser proof and no TDD invocation apply.
- Tracker closeout is explicitly authorized by the issue and user.

### Observable rubric

- Chooses truthful no-runnable-seam, empty-diff review/fallback, commit/SHA, local-only or reachability, and N/A dispositions before constructing the final body.
- Builds/fills the final body only after those dispositions and the final repository identity are stable.
- Does not force structured TDD/review-fix arrays when they are inapplicable and does not invent code work.
- Preserves exact validation, stored-body verification, and live state readback.

### Protected behavior

Proportionate tracker-only handling without bypassing review, SHA, validator, or readback requirements.

## Trial 3 - core regression: ordinary single-issue implementation

### Raw task

Plan the implementation of a narrow server validation bug from exact issue intake through verified GitHub closure. There is one focused unit-test seam, no UI impact, no review findings, and the final commit will be pushed. Do not perform any commands.

### Raw input artifact

- One implementation issue with two acceptance criteria and a Principles section.
- One new focused test is sufficient for behavior proof.
- Canonical root verification applies.
- Normal code review returns no findings.
- Final SHA is remote-reachable.

### Observable rubric

- Preserves exact issue intake, active-authority routing, visible scope ledger/first-edit gate, TDD sequencing, focused and canonical verification, pre-stage/commit gates, normal fixed-point review, exact criterion audit, applicable validators, remote reachability, stored-body verification, and tracker state readback.
- Uses a single final-scaffold construction after review and final identity are stable, without adding unnecessary ceremony.

### Protected behavior

The ordinary implement workflow remains complete and usable.

## Trial 4 - core regression: browser-visible review fix

### Raw task

Plan the final implementation and closeout phase for a browser-visible issue after the initial feature code exists. A real browser smoke has passed, but code review then finds a behavior defect in a browser-consumed API route. The fix requires a new red/green test and a follow-up commit. Do not perform any commands.

### Raw input artifact

- One issue, TDD invoked, browser/manual proof required.
- Review fix touches server/API code consumed by the UI.
- The proof server does not watch backend code.
- Final review and final SHA occur after the fix.

### Observable rubric

- Requires intended-behavior red/green proof for the fix, proof-server ownership/currentness, restart proof, expected API probe, clean browser rerun, console state, final freshness delta, final review coverage, and refreshed evidence identities.
- Does not construct/fill the final closeout scaffold until those review and final-tree inputs stabilize.
- Preserves all applicable nested and implement mutation-ready validators and exact readback.

### Protected behavior

Browser freshness, backend currentness, review-fix evidence, and final-tree identity cannot regress.

## Trial 5 - fragile safety case: low-headroom child family

### Raw task

Plan tracker closeout for a parent PRD and five completed child issues. The completed acceptance audit and shared implementation evidence do not fit in one GitHub comment under the mandatory size/headroom plan. Fixed-template child close comments will cite the shared evidence core. Do not perform any commands.

### Raw input artifact

- Parent plus five children, all rows satisfied.
- TDD, normal review with fixed findings, browser proof, Principles, and a local-only final SHA all apply.
- The first size plan reports `low-headroom`.
- No tracker mutation has happened yet.

### Observable rubric

- Preserves the mandatory size/headroom gate and disjoint subset-manifest split.
- Builds and validates a pre-index shared core from stable final evidence, emits mutation-ready preflight immediately before posting it, exact-reads it, then builds/posts/exact-reads linked chunks, patches and revalidates the final concrete URL index, and only then closes children and parent with exact state readbacks.
- Does not claim one validator covers rows owned by another sink, does not post placeholders, and does not weaken local-only, TDD, review, browser, or fixed-child gates.

### Protected behavior

External mutation safety, body-size safety, disjoint evidence ownership, and parent/child sequencing.

## Acceptance decision

The candidate is accepted only if:

1. Trial 1 materially improves the implicated mechanism and the independent evaluator prefers it for fewer normal-path rebuild/refill cycles with no lost gate.
2. Trial 2 is at least noninferior and remains proportionate for no-diff work.
3. Trials 3-5 are noninferior on every protected behavior.
4. No output introduces a material or severe regression, early mutation, weaker validation, invented evidence, or loss of exact readback.
5. Target-local deterministic checks pass.
6. The candidate is token-neutral or smaller unless any growth is shown necessary by materially better outcomes.

