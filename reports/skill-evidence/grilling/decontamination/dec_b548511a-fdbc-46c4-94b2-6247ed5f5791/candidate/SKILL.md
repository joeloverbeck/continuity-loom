---
name: grilling
description: Stress-test designs and plans, make determinations or recommendations, diagnose or audit existing work, and sharpen decisions for delegated execution. Use when the user asks to grill a proposal, resolve an uncertain design tree, assess divergence, choose a path, or pressure-test an action before building or publishing.
---

Interview the user until every material branch reaches a shared understanding. Walk the design tree in dependency order, ask one decision at a time, and recommend an answer for every question.

## Guardrail

An explicit `no changes`, `no file`, `recap only`, or equivalent instruction keeps the run read-only until the user authorizes a named mutation. Do not write artifacts, mutate local or remote state, perform supporting-skill writes, ask where to write, or invoke a downstream mutation checkpoint. Preparatory wording alone is not authorization.

## Classify and route

Classify before asking:

- **Design / plan stress-test** — pressure-test an existing plan down its material design tree.
- **Determination / recommendation** — assemble candidates, then resolve candidate choice, scope, and deliverable depth before grilling the winning path.
- **Diagnostic / audit** — assess something that exists; produce a findings verdict and recommendation. Reopen user intent only when recorded authority and stated intent conflict.
- **Operational / triage / delegated execution** — establish live facts, resolve only action-changing branches, and perform only the work explicitly requested once its checkpoints are satisfied.

Classify simultaneous independent items separately and use the dominant requested outcome for the recap. Accumulate contracts only when the same subject genuinely changes class. Never turn operational work into a broad design interview without the user's request.

## Explore before asking

Inspect facts that can settle branches: entrypoint guidance, active authorities, specs, ADRs, glossary, implementation, runtime state, and relevant tracker work. Record conclusions as `Finding:` or `Explored fact:`; reserve decisions for user-owned choices.

For cited reports or artifacts, inspect the selected material, current authorities, implementation surface, and narrow tracker overlap where relevant. Reconcile stale claims against current source and completed work. Load a named supporting skill, or a repository design-vocabulary skill when the question is specifically about module depth or seams. If a requested broad read is bounded, say so rather than implying exhaustive coverage.

For a determination without a plan, broaden intake only enough to build a non-duplicative candidate set. Classify matching prep artifacts as current, partly consumed, stale, superseded, or irrelevant. Apply branch details from [intake-routing.md](references/intake-routing.md) only when those cases arise.

## Question loop

Ask one question at a time and wait. Put the recommended option first and mark it `(Recommended)`. One question may contain one tightly coupled sub-decision, never independent branches.

Use a permitted question tool when available. Otherwise ask:

`Question N: <decision surface>. My recommendation (Recommended): <answer and why>. Do you agree?`

Maintain ledger lines only for user-owned choices:

`Decision: [RATIFIED|PROVISIONAL] <question> -> <answer>; rationale: <why>`

Facts are not decisions. Use `PROVISIONAL` only for unconfirmed answers in an explicitly autonomous or unattended run. Reply handling, tool details, and resume behavior live in [question-flow.md](references/question-flow.md).

## Recap and execution

Close every run with the applicable content-based recap from [recap-contracts.md](references/recap-contracts.md). Preserve the evidence, verdict or decisions, recommendation, scope boundary, freshness, and exact resume point; do not add empty provenance fields that do not help the handoff.

When the request is specifically to prepare a later `/to-prd`, apply [prd-ready-determination-artifact.md](references/prd-ready-determination-artifact.md). A written artifact is allowed only when requested and not barred by the guardrail.

Before any document, issue, code, publication, or other persistent mutation, apply [deliverable-execution.md](references/deliverable-execution.md). For live-state work, also apply [operational-execution.md](references/operational-execution.md).

If no downstream action was explicitly requested, stop at the recap. When useful, state readiness such as `PRD-ready`, `issue-ready`, or `may warrant an ADR` without taking the action.
