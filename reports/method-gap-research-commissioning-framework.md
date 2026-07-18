---
title: "Commissioning Research on Method Gaps"
subtitle: "A general framework for auditing any skill, guide, or repeatable method"
artifact_type: "skill-foundation"
version: "1.0"
date: "2026-07-18"
source_scope:
  - "SKILL(29).md"
  - "method-gap-audit.md"
  - "foreign-genre-test.md"
  - "verdict-calibration.md"
  - "human-calibration.md"
---

# Commissioning Research on Method Gaps

## Purpose

This document defines how to commission research that can discover **missing parts of a method**, not merely improve the parts already present. It is intended as the conceptual and procedural foundation for a future skill that can audit any documented skill, guide, workflow, standard operating procedure, or other repeatable method.

The future skill's product should be a rigorous **research brief**. It should not perform the research itself, silently revise the audited method, or treat research recommendations as adopted merely because they sound authoritative.

## 1. The governing insight

An ordinary improvement loop is endogenous:

> use the method → encounter friction → diagnose the failure → repair the method

This loop is indispensable, but structurally bounded. It can usually detect that an existing instruction, instrument, gate, or handoff works badly. It is much less reliable at detecting that an entire **class of instruction or instrument is absent**, because absent machinery often produces no legible failure inside the method's current vocabulary.

A method-gap audit adds an exogenous vantage:

> inspect the method's claims and instruments → compare them with relevant external bodies of knowledge → identify capabilities the method cannot currently supply → adapt candidate instruments to the real operating envelope → test them cheaply → adjudicate separately

The audit complements the organic improvement loop. It does not replace it.

The crucial question is not:

> How could this method be better?

It is:

> What must this method know, distinguish, validate, control, or transfer that its present machinery cannot—and what established instrument classes elsewhere could supply that capability?

No bounded audit can prove that a method has no gaps. It can make a scoped, evidence-backed search and substantiate the gaps it finds.

## 2. Core vocabulary

| Term | Meaning |
| --- | --- |
| **Audited skill** | The skill, guide, workflow, or method being examined. |
| **Internal improvement loop** | The method's normal process for learning from use, friction, failures, tests, and revisions. |
| **Instrument** | A repeatable means of observing, measuring, comparing, deciding, validating, controlling, or transferring something the method depends on. An instrument may be a protocol, test, gate, record, model, rubric, calibration procedure, or decision rule. |
| **Method gap** | A materially consequential capability the method needs but does not adequately possess, usually because an instrument class, evidence bridge, control, or decision mechanism is absent. |
| **Ordinary friction** | Difficulty using machinery that already exists. This belongs primarily to the internal improvement loop. |
| **Missing organ** | A useful shorthand for machinery absent altogether, as opposed to existing machinery that is awkward, weak, or broken. |
| **External vantage** | A body of knowledge, out-of-distribution case, calibration control, or human observation that can expose assumptions invisible from inside the method. |
| **Cheapest first witness** | The smallest exercise capable of producing decision-relevant evidence about whether a proposed instrument is useful. It is a trial, not a full rollout. |
| **Adopted-lineage fence** | An explicit list of prior research findings already embodied in the method, which the new audit must treat as established rather than rediscovering. |
| **Settled negative** | An area deliberately excluded or rejected by the owner, stated as an intention rather than left to look like an accidental omission. |
| **Disposition** | An embedded recommendation verdict: adopt now, defer with a concrete trigger, or reject. |
| **Consumption boundary** | The rule that research findings re-enter the method only through its normal review, trial, and revision process. |

## 3. Decide whether the concern is actually a method-gap research problem

Not every weakness calls for research. The commissioning skill should classify the concern before opening an audit.

| Concern | Proper route | Why |
| --- | --- | --- |
| Existing instructions are confusing, expensive, or unreliable in use | Organic friction/iteration loop | The method already represents the relevant capability. Repair what exists. |
| The documented method and its implementation disagree | Defect correction or conformance test | This is an implementation problem unless the disagreement reveals absent governance machinery. |
| A radically different task, audience, or operating regime may require machinery never exercised before | Out-of-distribution or “foreign case” pressure test | The quickest evidence may come from forcing the existing method through an uncovered case and recording missing organs. |
| A gate or evaluator may convict healthy work or pass defective work | Verdict calibration with known-positive and known-negative controls | The object of evaluation is the verdict function, not the subject it judges. |
| Analytical or simulated claims may not predict human experience | Paired human transfer calibration | The question is the transfer relationship between two evidence tiers; neither should simply overrule the other. |
| External fields may contain relevant instrument classes absent from the method | Method-gap research audit | This is the proper exogenous research question. |
| The owner disagrees with the method's goals, scope, or values | Policy decision | Research may inform the choice, but cannot make it. |

A proposed finding qualifies as a method gap only when all of the following are defensible:

1. The method needs the relevant capability to achieve or warrant one of its intended outcomes.
2. Existing machinery does not already supply the capability adequately.
3. The omission has a material consequence, not merely an aesthetic cost.
4. External prior art or a well-supported synthesis identifies a credible instrument class or failure model.
5. The instrument can plausibly be adapted to the method's actual operating envelope.
6. A cheap first witness can test its usefulness before full adoption.

If those conditions are not met, the proposal is more likely an optimization, feature wish, scope expansion, or relabeling of existing machinery.

## 4. When to commission an audit

Use cadence as guidance, not law. A method-gap audit is especially warranted when:

- the method has matured enough to possess stable machinery and an observable improvement history;
- several meaningful revisions have accumulated without an external audit;
- externally researched recommendations were recently adopted, changing the baseline the next audit must examine;
- the friction ledger contains recurring failures that internal adjudication cannot explain;
- landing or revision reports repeatedly carry forward known gaps or judgment calls;
- the method begins making stronger claims than its evidence machinery was designed to support;
- the operating envelope, user population, scale, or consequence of error materially changes; or
- an out-of-distribution pressure test exposes missing organs that require prior-art research rather than a local patch.

A rough default is to reconsider the audit after about ten meaningful method versions, and always after adopting a substantial prior research line. This should remain a configurable heuristic.

Before recommending a run, census the audit lineage:

- date and method version of the most recent audit;
- brief authored but research not yet returned;
- report returned but not yet adjudicated or consumed;
- prior recommendations adopted, rejected, or deferred;
- any deferred recommendation whose trigger has now fired.

Do not commission overlapping audits merely because the census is inconvenient. One authorization should produce one bounded audit, and the owner should make the final choice to run, narrow, postpone, or decline it.

## 5. Evidence the commissioner must assemble

The quality of the audit is bounded by the quality of its executor contract. Assemble enough evidence for the researcher to inspect the method actually in force, not an idealized summary.

### 5.1 Current method package

- the authoritative skill, guide, or workflow;
- its supporting references, templates, schemas, tests, and evaluators;
- the current version and changelog;
- intended outcomes and declared scope;
- the authority structure: who or what may decide, block, override, or revise;
- the real operating envelope, including maintainer count, time, compute, tools, participant access, privacy constraints, and acceptable recurring burden.

### 5.2 Empirical history

- trial, use, or execution records;
- friction and snag ledgers;
- consumption, adjudication, and landing records;
- known gaps carried forward;
- next-iteration priorities;
- manual exceptions and recurring judgment calls;
- tests that pass despite known unease, and failures that current categories do not explain.

### 5.3 Research lineage

- all prior method-gap briefs and reports;
- other completed research lines relevant to the method;
- the disposition of every material recommendation;
- exact locations where adopted recommendations entered the method;
- rejected or deferred recommendations, with reasons and reopening triggers.

Raw records should be retained whenever possible. Later methods may be able to re-read evidence that the current method could not interpret.

### 5.4 Research channel and source access

Choose an evidence-delivery mode the research executor can actually use:

- direct references when the executor has verified access to the authoritative sources;
- an attached or materialized evidence bundle when files can be transferred; or
- an inline brief when the executor cannot fetch private or local materials.

Never commission research against inaccessible paths and assume the executor will infer their contents. For private methods, state what may leave the private environment, what must be sanitized, and whether the brief must inline all necessary internal evidence. Also state whether external browsing is allowed, the required currency date, and any source restrictions.

## 6. Map the method before searching for gaps

The commissioner does not need to solve the audit, but it should give the researcher a functional map of the current machinery. At minimum, map:

| Method element | Questions to record |
| --- | --- |
| Intended outcome | What is the method meant to produce, prevent, or warrant? |
| Material claim | What does the method claim to know or establish? |
| Instrument | How is that claim observed, tested, measured, or decided? |
| Evidence artifact | What record makes the judgment inspectable later? |
| Threshold or rule | What distinguishes pass, fail, escalation, or uncertainty? |
| Authority | Who or what owns the judgment? |
| Failure route | What happens when the evidence is absent, contradictory, or ambiguous? |
| Feedback route | How does an observed failure become a method revision? |

This map prevents the researcher from mistaking unfamiliar terminology for missing capability. It also makes blank cells visible without declaring in advance that every blank is a gap.

## 7. Fence the audit so each run is a true delta

### 7.1 Adopted-lineage fence

Enumerate every completed research line whose recommendations have already been adopted. For each, record:

- the research line or audit;
- the capability it added;
- where that capability now lives;
- the adoption date or version; and
- any known limitation that remains open.

Tell the researcher explicitly:

> Treat this as established machinery. Do not re-derive or re-commission it unless you find credible evidence that it does not provide the claimed capability, conflicts with another instrument, or needs extension under a newly declared operating condition.

Every new method-gap audit is a delta over all predecessors, including earlier method-gap audits. Without this fence, repeated audits converge on the same conspicuous recommendations and create the illusion of progress.

### 7.2 Settled-negative fence

State deliberate exclusions as negative intentions:

- what is excluded;
- whether it is excluded permanently or only from this run;
- why the owner excluded it; and
- what evidence or condition, if any, would justify reopening it.

“Not mentioned” is not a fence. A locked or literal researcher will reasonably treat silence as unexplored territory and raise the area again.

### 7.3 Operating-envelope fence

State constraints as design requirements for recommendations, not as apologetic footnotes. Examples include:

- one maintainer rather than an institution;
- hobby or small-team scale;
- desktop rather than cluster compute;
- no standing participant pool;
- limited access to domain experts;
- private rather than publishable source materials;
- strict caps on recurring ceremony or recordkeeping.

The audit should adapt instruments to this envelope. It should not recommend importing an institutional framework whole.

## 8. Generate candidate areas without trapping the research inside them

Candidate areas should be grounded in the method's own interval evidence. Mine:

- findings left unconsumed or preserved only as context;
- known gaps carried forward through revisions;
- next-iteration priorities that repeatedly fail to land;
- decisions dependent on undocumented expert judgment;
- claims with no explicit evidence instrument;
- gates never tested against known-good and known-bad cases;
- proxies whose relationship to the desired outcome is assumed rather than checked;
- analytical claims with no transfer bridge to actual users or environments;
- task classes or operating regimes the method has never exercised;
- artifacts that are collected but never affect a decision; and
- places where contradictory evidence has no printed route.

These are **candidate gap areas**, not predetermined conclusions. The brief must also require an open-ended sweep for gap classes neither the owner nor the existing method can name. Otherwise the “external” audit remains captive to the method's current ontology.

## 9. Choose external bodies of knowledge by function

Do not commission a generic best-practices survey. Select external fields because they solve a functional problem the audited method appears to have.

Typical sources include:

- measurement and psychometric theory for construct validity, proxy quality, uncertainty, and scale design;
- simulation verification and validation for model correctness, validation domains, sensitivity, and credibility claims;
- evaluation science and experimental design for comparator choice, bias, controls, and evidence strength;
- safety, assurance, reliability, and quality engineering for hazards, evidence cases, independence, escalation, and failure containment;
- human factors, HCI, learning science, or implementation science for transfer into actual use;
- software verification and testing research for oracle quality, coverage, mutation, negative controls, and regression design;
- operations research and decision science for policy comparison, trade-offs, resource constraints, and robust decisions; and
- domain-specific research for failure modes peculiar to the subject matter.

The relevant comparison is between **capabilities and instruments**, not between vocabularies. A method need not adopt another field's terminology or entire framework to borrow one useful instrument.

## 10. The executor's research questions

Every commissioned audit should answer the following:

1. What consequential claims, decisions, or transfers does the method make?
2. What current instruments warrant each one?
3. Which failure modes can the current instruments detect, and which can they not detect?
4. Which apparent gaps are already covered under different terminology?
5. What external instrument classes address the uncovered capabilities?
6. What evidence supports those instruments, and under what conditions?
7. How must each instrument be adapted to the declared operating envelope?
8. What new burden, failure mode, or false confidence might the adaptation introduce?
9. What is the cheapest first witness that could support or falsify its usefulness here?
10. Should the owner adopt it now, defer it until a named trigger, or reject it?
11. What important gap classes appeared in the open-ended sweep beyond the commissioned candidates?

The researcher should challenge the premise of each candidate. Confirmation of the owner's suspicions is not the goal.

## 11. The recommendation bar

Every recommendation must be self-adjudicating enough for the owner to make a decision. Require all of these fields:

| Required field | What it must establish |
| --- | --- |
| **Gap** | The missing capability, stated independently of the proposed solution. |
| **Consequence** | What the method cannot reliably know, distinguish, prevent, or transfer because of the gap. |
| **Current coverage** | Why existing machinery does not already close the gap. |
| **Prior art** | The external instrument or failure model, with claim-level citations. |
| **Adapted instrument** | The smallest coherent form suitable for the actual operating envelope. |
| **Assumptions and limits** | Conditions under which the adaptation is expected to work, and what it still cannot establish. |
| **Cost order** | Approximate one-time and recurring costs in maintainer time, compute/tooling, participants, and dependencies. Order of magnitude is better than false precision. |
| **Cheapest first witness** | A one-trial-sized exercise, its required artifacts, and the observation that would count for or against adoption. |
| **Risks** | Ceremony, gaming, false assurance, duplicated machinery, maintenance burden, or new failure modes. |
| **Disposition** | Adopt now, defer with a concrete trigger, or reject—with reasons. |
| **Landing target** | If adopted later, which part of the method would own the instrument. This is a proposal, not an edit. |

The three dispositions mean:

- **Adopt now:** the gap is material, the adapted instrument is feasible, and the first witness is proportionate.
- **Defer with trigger:** the instrument may become worthwhile, but only when an explicit condition fires—for example scale, corpus growth, a new user class, repeated failure, or cheaper tooling.
- **Reject:** the capability is outside intended scope, already covered, unsupported, disproportionate, or incompatible with the operating envelope.

“Interesting,” “future work,” and “consider adopting” are not dispositions.

## 12. Citation and evidence discipline

Require full bibliographic citations for external claims. If the researcher cannot verify a source, mark the claim **relayed—unverified** rather than laundering uncertainty through confident prose.

The adoption process should independently verify decision-critical citations before changing the method. This matters especially when the researcher is an LLM or when references are difficult to access.

Additional rules:

- cite the claim the source supports, not merely the surrounding topic;
- distinguish empirical support, expert consensus, analogy, and the researcher's inference;
- prefer original or authoritative sources where practical;
- report contrary evidence and domain limitations;
- do not treat the existence of a named framework as evidence that the audited method needs it; and
- retain enough source detail for later re-verification.

## 13. Required report shape

Commission one consolidated report with:

1. **Audit scope and operating envelope**
2. **Current method and adopted-lineage summary**
3. **Per-area findings**, with recommendations and dispositions embedded beside the evidence
4. **Open-ended sweep**, including gap classes not named in the brief
5. **Rejected and already-covered candidates**, so later audits do not repeat them without cause
6. **Cross-cutting conflicts and dependencies** between proposed instruments
7. **Prioritized adoption roadmap**, ordered by expected value, feasibility, dependency, and witness cost
8. **Citation-verification register**, including every relayed-unverified claim
9. **Appendix of candidate witnesses and expected artifacts**

Do not separate recommendations from the evidence needed to judge them. Do not produce an unranked catalogue of literature or “best practices.”

## 14. The consumption boundary

The commissioning skill ends when it emits a complete research brief and hands it to the authorized research mechanism. If that mechanism must be invoked by the owner, the skill should provide the exact ready-to-run invocation and stop.

The research report itself should not directly alter the audited skill. After return:

1. verify critical citations;
2. adjudicate every recommendation against scope and constraints;
3. run the cheapest first witness where evidence is insufficient for adoption;
4. route domain-output findings separately from method findings;
5. revise the skill only through its normal change process;
6. record what was adopted, rejected, or deferred and why; and
7. add adopted recommendations to the lineage fence for the next audit.

Where a proposed instrument concerns evaluator accuracy, out-of-distribution coverage, or human transfer, route it to the corresponding calibration or pressure-test machinery instead of pretending that a prose revision alone closes the gap.

## 15. Ready-to-use research brief template

```markdown
# Research Brief — Method-Gap Audit of [AUDITED SKILL]

## 0. Commission

- Audited method: [name, path, version]
- Decision owner: [owner]
- Commissioner: [person or skill emitting this brief]
- Research executor: [executor or research mechanism]
- Audit date: [date]
- Prior audit: [date/version or never]
- In-flight or unconsumed work: [none or exact state]
- Internal-source access mode: [direct / attached bundle / fully inlined]
- External-research access: [allowed sources, currency date, restrictions]
- Privacy and sanitization posture: [rules]

This commission asks for a bounded, evidence-backed audit of missing method
capabilities. It does not authorize edits to the audited method.

## 1. Objective

Identify consequential instrument classes, evidence bridges, controls, or
decision machinery that [AUDITED SKILL] needs but does not adequately possess.
Compare by function, not terminology. Complement the internal improvement loop;
do not replace it.

The audit cannot establish that no further gaps exist.

## 2. Intended outcomes and internal improvement loop

- Intended outcomes: [list]
- Material claims the method makes: [list]
- Normal use → evidence → adjudication → revision loop: [describe]
- Authority and escalation structure: [describe]

## 3. Operating envelope

- Maintainers: [count/roles]
- Available time: [range]
- Compute and tools: [limits]
- Participants/users/experts: [access]
- Privacy or publication constraints: [limits]
- Maximum acceptable recurring burden: [limit]
- Other non-negotiable constraints: [list]

Adapt every recommendation to this envelope. Do not import institutional
frameworks whole.

## 4. Evidence packet

### Current method
- [authoritative files and versions]

### Supporting machinery
- [templates, schemas, tests, evaluators, examples]

### Empirical history
- [trial records, friction ledgers, landing reports, known gaps, judgment calls]

### Prior research and adjudication
- [briefs, reports, dispositions, adoption records]

## 5. Adopted-lineage fence

Treat the following as established machinery. Do not re-derive or recommend it
again unless credible evidence shows a capability failure, conflict, or new
operating condition.

| Research line | Adopted capability | Current location | Version/date | Remaining limit |
| --- | --- | --- | --- | --- |
| [item] | [capability] | [location] | [version] | [limit] |

## 6. Settled-negative and run-scope fences

| Area | Status | Reason | Reopen trigger, if any |
| --- | --- | --- | --- |
| [area] | permanent exclusion / excluded this run | [reason] | [trigger or none] |

Do not silently reopen these areas.

## 7. Candidate gap areas

These are hypotheses, not conclusions. Challenge them.

1. [candidate, with interval evidence]
2. [candidate, with interval evidence]

Also perform an open-ended sweep for unnamed gap classes outside this list but
inside the declared scope.

## 8. External knowledge bases

Investigate fields selected for functional relevance:

- [field → capability or failure problem]
- [field → capability or failure problem]

Add other fields when the open sweep justifies them.

## 9. Research tasks

1. Reconstruct the audited method's claim–instrument–evidence map.
2. Check whether each candidate is already covered under different terminology.
3. Identify materially consequential detection, validation, control, decision,
   or transfer failures.
4. Find and assess relevant external instrument classes and contrary evidence.
5. Adapt credible instruments to the operating envelope.
6. Specify the cheapest first witness and required artifacts for each.
7. Give every recommendation an adopt-now, defer-with-trigger, or reject verdict.
8. Perform the open-ended sweep.
9. Prioritize the surviving recommendations as a coherent roadmap.

## 10. Recommendation contract

Every recommendation must contain:

- gap;
- consequence;
- current coverage analysis;
- cited prior art;
- adapted instrument;
- assumptions and limits;
- one-time and recurring cost order;
- cheapest first witness and decision signal;
- risks and dependencies;
- adopt-now / defer-with-trigger / reject disposition; and
- proposed landing target.

## 11. Citation rules

Provide full bibliographic citations tied to supported claims. Mark anything not
verified as `relayed—unverified`. Distinguish sourced fact from inference and
report material contrary evidence.

## 12. Deliverable

Return one consolidated report containing:

1. scope and method map;
2. per-area findings with embedded dispositions;
3. open-ended sweep;
4. already-covered and rejected candidates;
5. conflicts and dependencies;
6. prioritized adoption roadmap;
7. citation-verification register; and
8. witness appendix.

## 13. Authority boundary

Do not edit [AUDITED SKILL]. Do not mark a recommendation adopted. The owner will
verify, adjudicate, witness where necessary, and land accepted changes through
the method's normal revision process.

## 14. Completion condition

The commission is complete when the consolidated report satisfies every
deliverable and every recommendation satisfies the recommendation contract—or
when the report explicitly records that a scoped area yielded no defensible
method gap.
```

## 16. Recommended behavior of the future commissioning skill

### Responsibility envelope

The skill should:

1. census prior audit lineage and in-flight state;
2. recommend whether an audit is due, with evidence;
3. let the owner authorize, narrow, postpone, or decline it;
4. read the current method, prior audits, adoption history, and interval records;
5. build the adopted-lineage, settled-negative, and operating-envelope fences;
6. generate evidence-grounded candidate areas while preserving an open sweep;
7. interview the owner only for choices that materially change scope or posture;
8. emit the completed research brief; and
9. hand off to the authorized research mechanism, restating the consumption boundary.

The skill should not:

- conduct a generic literature review without a method map;
- infer that an absent term means an absent capability;
- recommission adopted research;
- silently reopen settled negatives;
- decide policy questions for the owner;
- run unrelated calibration or pressure tests without authorization;
- adopt recommendations or edit the audited method; or
- claim that the absence of discovered gaps proves completeness.

### Inputs

- required: audited skill or method identity;
- optional: requested candidate area, cadence-only census, or explicit scope restriction;
- discovered: current version, prior audits, interval evidence, constraints, and adoption history;
- owner-supplied when missing: policy exclusions, acceptable burden, and material scope choices.

### Outputs

- an audit census;
- one recommendation to run, postpone, or decline;
- if authorized, one executor-ready research brief;
- a ready invocation or handoff instruction for the research mechanism; and
- no direct revision to the audited method.

### Lineage state

Use a stable, searchable marker for each run. Record at least:

- audited skill and version;
- commission date;
- brief identifier;
- report identifier when returned;
- consumption state;
- dispositions; and
- adopted landing version.

Filename conventions are useful, but the invariant is recoverable provenance rather than any particular repository layout.

## 17. Commission quality gate

Before emitting the brief, verify:

- [ ] The audited method and version are unambiguous.
- [ ] Intended outcomes, claims, instruments, evidence, and authority are mapped sufficiently for comparison.
- [ ] The actual operating envelope is explicit.
- [ ] Every prior adopted research line is fenced.
- [ ] Rejected, deferred, and deliberately excluded areas are visible.
- [ ] Candidate areas come from evidence rather than intuition alone.
- [ ] Candidate areas are hypotheses, not foregone conclusions.
- [ ] An open-ended sweep is mandatory.
- [ ] External fields are selected by functional relevance.
- [ ] Every recommendation must include prior art, adaptation, cost, first witness, and disposition.
- [ ] Citation verification and `relayed—unverified` handling are explicit.
- [ ] The report shape includes negative findings and a prioritized roadmap.
- [ ] The research executor has no authority to edit or adopt.
- [ ] The post-report consumption route is named.
- [ ] The brief makes no claim that the audit can prove completeness.

## 18. Common commissioning failures

### Generic best-practices shopping

The executor returns fashionable frameworks instead of capability analysis. Prevent this with a current-method map, functional research questions, and the recommendation contract.

### Rediscovery masquerading as discovery

The report recommends machinery already adopted under another name. Prevent this with an explicit adopted-lineage fence and a required current-coverage analysis.

### Candidate capture

The report only validates the owner's nominated concerns. Prevent this by labeling candidates as hypotheses and requiring an open-ended sweep.

### Institutional-scale recommendations

The report imports processes requiring teams, infrastructure, or participant pools the owner does not have. Prevent this by making the operating envelope binding and requiring cost orders and adapted instruments.

### Recommendation without witness

The report proposes a large method revision without a cheap way to learn whether it helps. Reject any recommendation lacking a falsifiable first witness.

### Evaluator–subject confusion

The report treats a bad verdict as proof that the work being judged is bad. Route uncertainty about the gate itself to known-ground-truth verdict calibration.

### Evidence-tier substitution

Human experience, analytical results, and simulations are allowed to overrule each other without an explicit transfer rule. Pair claims across tiers and route divergence; do not let tiers vote indiscriminately. Treat small-sample human observations as calibration evidence with disclosed width, not as broad threshold-clearing verdicts.

### Citation laundering

Unverified references become confident claims. Require full citations, label uncertainty, and re-verify before adoption.

### Research-to-revision collapse

The audit edits the method directly, bypassing adjudication and trials. Preserve the consumption boundary: commission, research, verify, witness, adjudicate, then revise.

## 19. Packaging this foundation as a skill

This document is a design foundation, not an appropriately sized `SKILL.md`. When implementing it, use progressive disclosure:

```text
commission-method-gap-research/
├── SKILL.md
└── references/
    ├── research-brief-template.md
    ├── gap-classifier-and-recommendation-contract.md
    └── lineage-and-cadence.md
```

Keep `SKILL.md` imperative and compact. It should contain only:

- the trigger and responsibility boundary;
- the census → authorize → assemble delta → interview material choices → emit brief → handoff workflow;
- the non-negotiable fences;
- the completion condition; and
- direct pointers explaining exactly when to load each reference.

Put the long template, taxonomies, checklists, and examples in the reference files. Do not duplicate them between the skill body and references. A deterministic census script is worthwhile only if the audited methods share stable lineage conventions; otherwise let the skill discover and state the convention for each method rather than hard-coding one repository layout.

An eventual skill should use frontmatter containing only `name` and `description`. A suitable responsibility-oriented name would be `commission-method-gap-research`. Its description should trigger on requests to commission external research into missing methodology, audit an existing skill's methodological blind spots, or census prior method-gap research. It should explicitly avoid triggering for ordinary clarity reviews, implementation fixes, or generic literature searches.

Representative trigger examples:

- “Commission research into method gaps in this skill.”
- “Audit this guide for classes of method its own iteration loop cannot discover.”
- “Build a research brief to find missing validation machinery in this workflow.”
- “Census the prior method-gap audits and tell me whether another is due.”

Representative non-triggers:

- “Rewrite this skill so it is clearer.”
- “Fix the bug in this workflow.”
- “Find papers about this domain.”
- “Pressure-test this method on a specific unusual case.”

Before installing the eventual skill, forward-test it on several structurally different methods. The critical test is whether it discovers and respects each method's own lineage, constraints, and authority model rather than mechanically reproducing the tabletop-game vocabulary that generated this foundation.

## 20. Source-derived design lineage

This framework generalizes the following contributions from the source documents:

| Source | Generalized contribution |
| --- | --- |
| `SKILL(29).md` | Exogenous lenses complement endogenous friction; census lineage first; one owner authorization at a time; dispatch rather than direct revision; return findings through the normal consumption route. |
| `method-gap-audit.md` | Adopted-lineage fences, settled negatives, constraint-adapted recommendations, cost orders, cheapest first witnesses, embedded dispositions, citation discipline, open-ended sweep, and a prioritized roadmap. |
| `foreign-genre-test.md` | Distinguish missing organs from ordinary friction; use coverage censuses and maximally foreign cases to expose what existing trials could never demand. |
| `verdict-calibration.md` | Treat gate accuracy as a separate object of study; use known-defective and known-healthy controls rather than scoring only the subject. |
| `human-calibration.md` | Pair analytical and human evidence at the claim level; preserve small-sample honesty, raw records, and explicit divergence routing rather than allowing one tier to substitute for another. |

The distinctive unit is not “research about a skill.” It is a **lineage-aware commission for externally grounded, constraint-adapted missing-instrument discovery, with cheap witnesses and no automatic authority to revise**.
