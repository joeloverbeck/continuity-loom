# Recap Contracts

Which recap a grilling run owes, and what has to be in it. `SKILL.md` routes here; this file is the authority for recap shape.

## Class → recap routing

| Class | Recap contract | Notes |
|---|---|---|
| Design / plan stress-test | Ratified-decision ledger, plus the provenance clauses below when the run cites a report, module, architecture review, artifact, or repo authority | Add the PRD-ready provenance clauses whenever the run closes PRD-ready or issue-ready. |
| Determination / recommendation | [PRD-ready / issue-ready recap checklist](#prd-ready--issue-ready-recap-checklist) | The recap *is* the deliverable — it carries the determination. |
| Diagnostic / audit | [Diagnostic / audit recap checklist](#diagnostic--audit-recap-checklist), then the [final preflight](#final-preflight) | Candidate set and winning candidate may be `N/A`. |
| Operational / triage / delegated-execution | [Operational recap](#operational-recap) — always owed, at minimum | "Keep the ledger minimal" bounds the *branch count*, never the recap. An operational run is never recap-less. |

### Deciding which contract applies

Route by the **subject** of the run, not by the kind of evidence used to investigate it. Live commands, refs, tracker reads, and API calls are how you gather evidence in *every* class; using them does not by itself make a run operational.

The two tests are independent, so apply both:

- **Subject** — is it live operational state (a branch, a queue, a deploy, a running process), or a durable artifact (a report, PRD, issue, spec, ADR, architecture review)?
- **Action** — does the run end in a verdict, a written artifact, or a mutation of live state?

A run whose subject is a **durable artifact** and whose action is **operational** — for example, diagnosing why a set of published tracker issues is blocked and then mutating them — owes the [Operational recap](#operational-recap) **plus** the durable-artifact provenance fields listed there. That is a union, not a choice between the two contracts.

### Class shift

A class can shift mid-session as facts surface. When it does, the recap owed is the **union** of the contracts for every class the run actually occupied — a run that begins diagnostic and resolves into execution owes both the diagnostic verdict fields and the operational mutation fields. Do not let the later class silently retire the earlier class's provenance.

### Simultaneous mixed requests

When one user request contains multiple independent items at the same time, classify each item separately. Choose the recap contract for the dominant requested deliverable, then include the subordinate item's required evidence, finding, recommendation, or decision fields inside that recap without reproducing a second complete template.

For example, a request containing one concrete diagnostic and one design determination should use the determination or diagnostic contract that matches the requested final deliverable, while still preserving the other item's verdict and evidence. Apply the class-shift union only when the same subject or action actually changes class, or when one action genuinely spans multiple classes; mere coexistence of independent items is not a class shift.

## PRD-ready / issue-ready recap checklist

Keep this checklist visible during determination and report-cited grilling runs. The closing recap must include:

- the source artifact path or identifier;
- selected section/title when applicable;
- key inspected authorities and their paths;
- the candidate set when applicable;
- the winning candidate or verdict;
- key rejected alternatives;
- relevant tracker IDs or backlog items;
- explicit out-of-scope boundaries;
- a supporting-skill result line (for example the domain-model outcome) when a supporting skill was in play;
- `External research: used/skipped and why` if the user explicitly allowed online or deep research.

If the run will create a written PRD-ready or issue-ready determination artifact, also classify cited local source artifacts as durable, dirty, untracked, or temp-only. When a source is not durable, record "pending local publication" or "summarized, not cited" wording so the later publication skill does not treat it as stable. Classify the authored determination artifact itself as new/untracked, dirty, tracked-clean, or publication-ref-visible as applicable, so the next publication pass does not cite it as stable before it is.

For written PRD-ready determination artifacts, follow the quick path and skeleton in the skill's `references/prd-ready-determination-artifact.md` unless repo-local prior art provides a stronger structure. Adapt the headings, but preserve source status, verdict, evidence, authority findings, selected candidate, rejected alternatives, publication inputs, and freshness boundaries.

If a later `/to-prd` or `/to-issues` pass would have to reconstruct provenance from conversation context, the recap is incomplete.

## Diagnostic / audit recap checklist

When the request asks for an assessment, comparison, divergence check, or recommendation about an existing artifact rather than choosing among candidate plans, the closing recap must include the source artifact path or identifier, selected section/title when applicable, the verdict, key evidence, inspected authorities, tracker or backlog overlap, rejected or no-op alternatives, the recommendation, explicit out-of-scope boundaries, `External research: used/skipped and why` when the prompt allowed it, a supporting-skill result line when a supporting skill was in play, and a freshness note when the verdict depends on drift-prone live state such as tracker/issue state, `HEAD`, or CI.

Candidate set and winning candidate may be `N/A` in this sub-case.

When such an audit is report-cited and closes PRD-ready or issue-ready, this checklist is the base — add the provenance clauses from the [PRD-ready / issue-ready recap checklist](#prd-ready--issue-ready-recap-checklist) above (candidate set, winning candidate, key rejected alternatives, tracker IDs, inspected authority paths).

Use `Finding:` or `Explored fact:` lines for factual conclusions and evidence-backed observations. Reserve `Decision:` lines for actual user-owned stewardship or design choices.

## Final preflight

Before sending a concise diagnostic, scan the answer for these labels or their explicit `N/A`: `Source`, `Selected section`, `Verdict`, `Evidence`, `Inspected authorities`, `Tracker overlap`, `Existing prep artifact status` when any was found, `Rejected/no-op alternatives`, `Recommendation`, `Out of scope`, `External research`, `Supporting skill result`, and `Freshness`.

Concision is fine, but do not drop a required provenance field merely because no document or issue is being written.

## Operational recap

Every operational / triage / delegated-execution run owes this recap at minimum. Use this compact shape rather than forcing the report-oriented fields:

`Context`, `Finding`, `Evidence`, `Rejected operations`, `Recommendation`, `Out of scope`, `Freshness/external research`.

Name the commands, refs, issue IDs, URLs, or process identifiers that supplied the evidence — a reader must be able to re-run the diagnosis.

When the run's **subject** is a durable artifact (a report, PRD, issue, spec, ADR, or architecture review), add these provenance fields to the shape above: `Source`, `Inspected authorities`, `Tracker overlap`, `Supporting skill result` when a supporting skill was in play, and `Existing prep artifact status` when one was found. This is the union case described under [Deciding which contract applies](#deciding-which-contract-applies).

When the run **mutated live state**, also record what changed and the proof it changed as intended: the exact issues, refs, or resources touched, and the read-back that verified the end state.

An approval preflight or earlier recap does not satisfy final closeout after a live mutation.
Rebuild the complete applicable union in the final response from current proof, including source,
authorities, tracker overlap, supporting-skill result, rejected operations, out-of-scope boundary,
freshness and external-research posture, mutations, and read-back. The reader must not need an
earlier message to reconstruct final provenance.

Mark artifact-only fields such as selected section/title as `N/A` when they truly do not apply — but never omit freshness, out-of-scope boundaries, or rejected operations.
