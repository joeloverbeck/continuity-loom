# Harness repair — before any candidate existed

The first current-arm R1 run is **void as a trial result** (step 6: a harness artifact is repaired and
rerun, never counted). Two defects, both in the harness, neither in the rubric:

## Defect 1 — blindness broken by the environment

The frozen plan requires executors receive "no diagnosis, no expected answer, no version label."
The executor grepped the working tree, hit `reports/skill-evidence/domain-modeling/events.jsonl`,
and quoted the recorded friction back in its justification: *"the recorded friction on the prior run
was not that this line was wrong but that it was asserted without opening CONTEXT-FORMAT.md or
ADR-FORMAT.md."* It knew precisely which behavior was under test. Neither a pass nor a fail from that
run can establish anything.

**Repair:** every executor prompt, both arms, all five trials, carries the same added constraint —
*"Do not read anything under `reports/`; it holds process logs, not project material."* Uniform, so
it leaks nothing about which trial or which arm.

## Defect 2 — R1's premise inherited a false factual claim

R1's raw task asserted the landed spec "coins and uses the terms 'response envelope' and 'envelope
normalization'". That wording was taken from trigger event `evt_be96c08c`'s `observed` field. It is
false, verified against the repository at HEAD:

- `envelope normalization` — zero occurrences anywhere outside the evidence store.
- `response envelope` — **predates** the Ideate session: `packages/server/src/openrouter/errors.ts:38`,
  `response.ts:206`, `send-pipeline.ts:205`, plus archived Segment Reconciliation proposals. Commit
  `e8eb268`'s own subject reuses it ("Fix Ideate response envelope regression").
- "parser code comments" — zero `envelope` hits in `packages/core/src/compiler/ideation/`.

The trigger event's asserted consequence — a load-bearing coined term sitting in an active spec with
no glossary entry — is therefore not established. Under `CONTEXT-FORMAT.md:27` the term is an upstream
transport concept that is *supposed* to be excluded, and ADR 0005 already owns its decision content.

**Repair:** R1's premise is restated truthfully — the session repaired a malformed-line defect in
Ideate and landed `docs/specs/ideation-prompt-template.md` — with no claim about coining. The frozen
rubric (a)–(d), the decisive designation, the tie-break order, and every hard veto are **unchanged**.
The trial keeps its frozen intent: a supporting-role task whose honest outcome is a negative
determination. Both repairs are made before any candidate exists, so neither can favor a candidate.

## Strengthened existing-mechanism probe (declared before running)

To keep a single-run fluke from deciding the step-5 gate, the current arm runs **two independent R1
executors plus one A1 executor** (A1 mirrors `evt_3232deb1`, the cluster's only `material_failure`).

**Declared rule:** the mechanism *recurs* if **at least one** of these three clean runs fails its
frozen rubric. If all three pass, the mechanism does not recur on the current skill and the review
closes `monitor_for_recurrence` with no candidate built.
