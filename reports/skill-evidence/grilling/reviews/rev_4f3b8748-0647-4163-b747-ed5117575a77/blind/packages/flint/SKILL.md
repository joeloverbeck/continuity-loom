---
name: grilling
description: Stress-test designs and plans, make determinations or recommendations, diagnose or audit existing work, and sharpen decisions for delegated execution. Use when the user asks to grill a proposal, resolve an uncertain design tree, assess divergence, choose a path, or pressure-test an action before building or publishing.
---

Interview the user relentlessly until every material branch reaches a shared understanding. Walk the design tree in dependency order, ask one decision at a time, and recommend an answer for every question.

## Instruction precedence

Explicit mutation limits override every inferred deliverable rule in this skill. If the user says `no changes`, `do not make changes`, `no file`, `recap only`, or equivalent, keep the run read-only:

- do not create or edit repo files, tracker items, remote state, or other artifacts;
- do not ask an artifact-home question when the instruction already resolves the artifact home to recap-only;
- do not perform inline writes required or suggested by a supporting skill; report those as pending instead;
- do not treat preparatory wording such as "get everything ready" as permission to write; and
- do not publish, implement, or invoke a downstream skill's mutation checkpoint.

This restriction remains in force until the user later explicitly authorizes a named mutation.

## Classify and route

Classify the request before asking:

- **Design / plan stress-test** — a plan or design already exists to pressure-test. Run the full interview down that plan's design tree.
- **Determination / recommendation** — choose or generate a plan that does not yet exist. The minimum tree is candidate choice, scope boundary, and deliverable depth; then grill the winning candidate one branch at a time.
- **Diagnostic / audit** — assess, compare, or diagnose something that already exists. Candidate choice is N/A; the minimum tree is scope boundary and deliverable depth. A finding that exposes conflict between stated intent and repo authority reopens the tree as a user-owned ratification branch.
- **Operational / triage / delegated-execution** — explore live facts first, resolve only branches that materially affect the action, keep the ledger minimal, and proceed with explicitly requested work once its checkpoints are satisfied.

For a request containing multiple simultaneous items, classify each item independently. Choose the dominant deliverable contract from the user's requested outcome, and carry subordinate evidence or decisions into that contract without duplicating complete templates. Use the class-shift union only when the same subject or action genuinely changes class during the run. See `references/recap-contracts.md` for the exact recap rule.

Do not turn an operational request into a broad design interview unless the user asks for one.

## Explore before asking

If repo facts can answer a branch, inspect them first. Relevant authorities include entrypoint instructions, active docs, principles, specs, ADRs, glossaries, tracker items, implementation surfaces, and runtime state. Record conclusive factual branches and other evidence-backed observations as `Finding:` or `Explored fact:`. Reserve RATIFIED and PROVISIONAL for user-owned stewardship or design decisions.

For cited reports, modules, architecture reviews, artifacts, or repo authorities:

- open the cited material and the relevant current authorities;
- inspect the current implementation surface;
- load any supporting skill named by the invocation;
- run a narrow tracker-overlap check when live work may overlap;
- reconcile stale report claims against current source and relevant open and closed work; and
- ask only unresolved stewardship or design choices.

For determinations where no plan exists, broaden intake only enough to assemble the candidate set. When the user requests an exhaustive authority read, either perform it or state the bounded intake strategy; never imply line-by-line coverage for material only scanned.

When an existing PRD-ready, issue-ready, or prep artifact covers the same source, classify it as current, partially consumed, stale, superseded, or not relevant. State whether it was updated, left untouched, or needs a follow-up refresh, and preserve unconsumed candidates separately.

Apply the branch-specific intake details in [intake-routing.md](references/intake-routing.md), including candidate ownership, authority-order checks, tracker overlap, stale-evidence handling, and house-style-only consultations.

## Report-cited PRD-ready prep

For a determination intended to prepare a later `/to-prd`, follow [prd-ready-determination-artifact.md](references/prd-ready-determination-artifact.md).

- Preparatory wording can imply a written determination artifact only when no explicit read-only instruction overrides it.
- If writing is allowed, ask exactly one artifact-home question naming the selected scope and target path and including `recap only, no file`.
- Consult `/to-prd` for house style only. Do not publish, create issues, or ask testing-seam questions for the purpose of satisfying `/to-prd`'s later checkpoint.
- Record recommended testing seams in the recap or artifact and mark the `/to-prd` seam checkpoint as still owed.
- Classify source and authored artifacts as durable, dirty, untracked, or temp-only; summarize unpublished evidence instead of citing it as stable.

## Question loop

Ask one question at a time and wait for feedback. Put the recommended option first and append `(Recommended)` to the option label itself. A question may contain one tightly coupled sub-decision, never independent branches.

Use the available permitted question tool. If it is unavailable or mode-restricted, use:

`Question N: <decision surface>. My recommendation (Recommended): <answer and why>. Do you agree?`

Explore and record factual branches before asking. Maintain the exact decision-ledger format below only for user-owned stewardship or design decisions, and derive the closing recap from both the factual record and that ledger:

`Decision: [RATIFIED|PROVISIONAL] <question> -> <answer>; rationale: <why this answer wins>`

Detailed rules for acceptance, amendments, challenges, timeouts, autonomous fallback, supporting-skill results, compaction, and resumed sessions are in [question-flow.md](references/question-flow.md).

## Recap and execution

Route the closing recap through [recap-contracts.md](references/recap-contracts.md). No class is recap-less, and a minimal operational ledger does not permit a minimal or missing recap. After any mutation, rebuild the applicable recap union in the final response; an earlier approval preflight does not satisfy closeout.

Immediately before the final response, run the literal-label [final preflight](references/recap-contracts.md#final-preflight). Every required label must appear verbatim or carry its explicit `N/A`; implicit narrative coverage does not satisfy the gate.

Before any downstream deliverable, apply [deliverable-execution.md](references/deliverable-execution.md). It defines the hard recap checkpoint, explicit-request rules, the read-only override, supporting-skill writes and closeouts, autonomous execution, file and remote verification, mechanically required consistency edits, and closeout behavior.

For live-state operations, also apply [operational-execution.md](references/operational-execution.md). It defines drift refreshes, local and remote baselines, high-risk preflight confirmation, rollback expectations, and post-write proof.

If no downstream deliverable or action was explicitly requested, close on the recap. When useful, add one non-actioning readiness note such as `This is PRD-ready`, `This is issue-ready`, or `This may warrant an ADR`.
