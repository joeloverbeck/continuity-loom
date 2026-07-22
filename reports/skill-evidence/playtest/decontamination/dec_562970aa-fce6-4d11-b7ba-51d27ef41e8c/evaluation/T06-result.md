# T06 Paired Evaluation Result

## Decision

**A wins.** Both packets are highly executable and satisfy nearly all shared and task-specific requirements, but A preserves the discovery/state boundary more cleanly and with less operator burden. B explicitly permits the fracture to be established as a current fact before the segment. That weakens the required discovery boundary and invites an unnecessary pre-acceptance canonical record for what is supposed to be discovered and verified in the prose.

## Per-criterion judgment

1. **Source-and-doc-blind visible-browser authorship — tie.** Both restrict the product journey to visible UI interaction, prohibit source-derived selectors, APIs, project-file inspection, hidden state, and runtime evaluation, and defer reporting-authority reads until after the blind journey. B is slightly more explicit about the exact late reads, but this does not materially improve compliance.

2. **Isolation, loopback, and provider safety — tie.** Both require an isolated config/browser/project, `127.0.0.1`, an ephemeral port, a blank OpenRouter key, pre-navigation network/provider guards, and immediate blocking on a send attempt. B adds a bounded Chromium recovery and a more explicit provider-block termination rule; A already provides an adequate guarded contract.

3. **New-story versus continuation and project boundary — tie.** Both correctly identify a new-story run with no prior report, create a unique `/tmp` project through the UI, preserve it for continuation, and prohibit substitution or mutation of historical project state.

4. **Exactly one accepted segment or honest blocker — tie.** Both require one visible acceptance, sequence proof in Accepted Segments, no second segment, bounded recovery, and a truthful blocked outcome when acceptance cannot be earned. B enumerates blocker classes somewhat more thoroughly; A remains adequate.

5. **Exact prompt inspection and cold evaluation — B, slight.** Both require visible inspection and exact prompt extraction, fresh isolated evaluation without OpenRouter, raw-response assessment before editing, at most one unchanged-prompt retry, and no manufactured success. B is clearer that unavailable fresh isolation is a named blocker and that an absent Segment Reconciliation surface must be reported rather than sought through a hidden path. This is a useful precision advantage, not enough to offset B's task-specific state regression.

6. **Accepted-prose authority boundary — A.** Both state that accepted prose is evidence rather than canon and require manual canonical edits. A additionally keeps the fracture explicitly as an intended in-segment discovery rather than a pre-run fact. B says the fracture "may be established as physically present at segment start" inside its canonical-record instructions. Even though B separately warns against implying Nera knows it, this authorizes premature durable state and blurs the exact discovery-versus-known-state distinction the task is testing.

7. **Evidence, observation, and cumulative report — tie.** Both separate visible observation from interpretation, retain only finding-specific privacy-safe evidence, exclude prompts/prose/private run material from durable evidence, require a cumulative schema-conforming report, preserve blocked-section honesty, validate after cleanup, shut down only run-owned processes, and compare final custody with the baseline. B supplies more explicit evidence-tag and double-validation language; A covers the same substantive guarantees with lower reading burden.

8. **Narrative, presence, knowledge, and stopping boundaries — A.** Both strongly enforce Nera-only close third, pressure solely through the existing paper order, no live Iven speech/location/action/interiority, all forbidden-presence exclusions, the required procedural sequence, and a stop before Iven appears. A is stricter about not pre-authoring the fracture as known record state. B's caveat that Nera need not know the pre-established fracture reduces knowledge leakage but does not remove the continuity-authority leakage.

9. **Offstage-pressure minimality — A.** A asks for one minimal Nera dossier, one ENTITY-first Iven record, and an order record only if the visible workflow cannot otherwise carry the atomic pressure. B remains disciplined about Iven but also directs creation or update of whatever prototype/current-condition, noon-test, and order records are visibly necessary and expressly permits pre-establishing the fracture. That creates more opportunity for record inflation than the task warrants.

10. **Operator burden — A.** A is materially shorter while preserving the safety, evidence, acceptance, report, and custody contracts. B's extra blocker/report detail is useful, but much of its additional wording repeats already established constraints. Its additional record-state discretion also creates a judgment call the operator should not need to make.

## Omissions, contradictions, and regressions

### A

- Minor omission: it does not name `cold-subagent-unavailable` or explicitly say what to do if the Segment Reconciliation surface is absent, though its honest-blocker and visible-UI rules substantially constrain the correct response.
- No contradiction with the task.
- **Material regression: no.**
- **Severe regression: no.**

### B

- Contradiction/state leakage: the canonical-record section permits the fracture to be established before the segment, while the charter and task require Nera to discover it in the segment. The qualification that she still inspects and verifies it preserves dramatic action but does not preserve the clean pre-run authority boundary.
- Minimality burden: the broader invitation to create prototype/current-condition/noon-test records is more expansive than A's strictly conditional additional order record.
- Safety, provider, acceptance-proof, report, and custody handling are otherwise strong; there is no manufactured completion or provider authorization.
- **Material regression: yes — premature fracture/current-state authority and resulting minimal-record dilution.**
- **Severe regression: no.**
