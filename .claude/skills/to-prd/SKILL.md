---
name: to-prd
description: Turn the current conversation into a PRD and publish it to the project issue tracker — no requirements interview, just synthesis of what you've already discussed; the seam confirmation is the sole checkpoint.
---

This skill takes the current conversation context and codebase understanding and produces a PRD — or, when the invocation covers a ratified program of several, one PRD per program entry. Do NOT interview the user about requirements — synthesize what you already know; the Step 2 seam confirmation is the sole sanctioned checkpoint.

The issue tracker and triage label vocabulary should have been provided to you — run `/setup-matt-pocock-skills` if not. Before publishing, read the project's issue-tracker and triage-label docs (per `CLAUDE.md` or `AGENTS.md`) if you haven't this session.

## Reference-Only Consultation

When another skill says to consult `/to-prd` for house style only, do not draft, stage, publish, label, or verify an issue. Reuse only the publication expectations that make the upstream artifact PRD-ready: the PRD template shape, source-durability posture, publication-package taxonomy, browser-visible checklist mapping, seam input expectations, label-readiness inputs, and final note that `/to-prd` was consulted for house style only.

In that branch, load only the needed sections of the [PRD body contract](references/prd-body.md), [source-durability rules](references/source-durability.md), and [publication-package and label rules](references/publication.md). Minimal load map: template shape and section expectations → the PRD body contract's template-conformance list; source posture and citation wording → the source-durability local-citation rules; title form, package taxonomy, label posture, and checklist-gate inputs → the publication reference's title, label-decision, and browser-visible checklist sections. A consultation that skips a mapped section for an input it produces is incomplete. Do not run the publication or closeout steps.

## Process

### 1. Establish intake and publication scope

Run `git status --short --untracked-files=all`, then read and complete the [intake and scope checklist](references/intake.md) in full. It covers entrypoint authority, domain vocabulary, ADR and principle intake, issue-tracker conventions, same-kind exemplar selection, and PRD-ready determination artifacts.

Done when the working notes explicitly account for every required intake item, the current source artifact is trusted, and the intended publication scope is known.

### 2. Ratify testing seams and publication package

Sketch out the seams at which you're going to test the feature. Existing seams should be preferred to new ones. Use the highest seam possible. If new seams are needed, propose them at the highest point you can. The fewer seams across the codebase, the better - the ideal number is one.

When the PRD's scope includes non-code deliverables (ADRs, specs, doc packs), sketch seams for the implementation surface only, and state in Testing Decisions which deliverables are covered by review/conformance mechanisms rather than tests.

When the PRD is a behavior-preserving refactor or architecture-seam hardening — a first-class PRD kind here, and often the dominant one — the seam sketch is usually not new seams at all: reuse the existing seams unchanged, treat the existing tests as the specification, and make behavior preservation the acceptance bar. State that explicitly rather than inventing new test seams. Such a sketch introduces no new seam, so it proceeds even if the seam confirmation times out.

If `/to-prd` follows a same-session determination that selected an intended PRD but marked product-scope decisions provisional, treat the user's explicit request to create or publish that intended PRD as ratification of the selected product scope unless they ask only for a draft, keep named decisions open, or revise the recommendation. This does not replace the Step 2 checkpoint: seams still need same-session ratification, timeout handling, or the unchanged-existing-seam exception.

Before drafting, classify the publication package as one of: a single intended PRD, a ratified multi-PRD program, or a first PRD plus deferred follow-on candidates. If a source artifact names follow-on PRD candidates but also selects a recommended first PRD, publish only that first PRD unless the user explicitly asks to publish the whole program; record the deferred candidates in Out of Scope or Further Notes so they are not silently ratified.

Before asking the sole checkpoint, bring forward every `still open` decision-closure ledger row whose user ratification could close it. In the same Step 2 question, name the decision, its proposed resolution when one exists, and its label consequence. A row the question omits or the user leaves open remains `still open` and forces `needs-triage`; approval of the seams or publication package does not silently approve that row. `resolved default` rows remain synthesis and do not require another question.

Resolve the intended triage and type-label posture far enough before this checkpoint to detect missing labels. If a required label is absent, include its exact proposed name, color, description, and creation command in the same Step 2 publication-package question, using the repository triage-label authority for canonical roles. Never discover and silently create a missing label after the sole checkpoint has passed.

Check with the user that the exact seams, publication package, and every presented open decision match their expectations. This is a mandatory Step 2 checkpoint unless the current conversation already contains a valid same-session seam receipt and the user asks to publish or create the intended PRD. A valid receipt either comes from an earlier `/to-prd` Step 2 answer that explicitly ratified the exact seams, publication package, and presented decision rows, or from an upstream handoff that explicitly says the `/to-prd` seam checkpoint was satisfied and names the user ratification and decision dispositions. A prep, grilling, recommendation, or handoff that says the checkpoint is still owed, open, or pending never counts as a receipt, even when it recommends exact seams; ask the Step 2 question in that case. When a valid receipt exists, record `## Testing Decisions` and `## Further Notes` with the ratified seams and decision dispositions. Otherwise, ask the seam-confirmation, publication-package, and open-decision question and wait. If that actual prompt goes unanswered — or the session is explicitly autonomous/away — proceed only when the sketch reuses existing seams unchanged, and record in Further Notes that seam confirmation timed out and the seams are open to veto. If the sketch proposes any new seam, stop without publishing and leave the sketch as the turn's deliverable.

Done when the exact testing seams and publication package are either ratified in-session or covered by the unchanged-existing-seam timeout exception, and every decision-closure row is ratified, a supported `resolved default`, or explicitly `still open` with its `needs-triage` consequence preserved; any new unratified seam stops the run before publication.

### 3. Draft, validate, publish, and verify

For every intended PRD in the package:

1. Read the [PRD body contract](references/prd-body.md) in full before drafting.
2. Read the [source-durability rules](references/source-durability.md) in full before creating a staged body or relying on local sources.
3. Read the [publication-package and label rules](references/publication.md) in full before finalizing the title, staging the issue, or choosing labels.
4. Read the [validation and closeout procedure](references/validation-and-closeout.md) in full before validation or issue creation, then follow it through published-body readback, recovery if needed, and cleanup.

After those reads, execute each issue in this order:

1. Finalize the title and run the exact-title duplicate guard before creating the staged body.
2. Draft the staged body and complete source extraction, ADR resolution, decision closure, the durability ledger, the label decision, and the browser-visible checklist gate.
3. Create the reusable validator-policy manifest, validate the staged body, and run the final status-language pass.
4. Create the issue, verify its metadata and published body with the same policy manifest, rerun durability, and remove every temporary body and policy file.
5. Complete the [final closeout ledger](references/validation-and-closeout.md#final-closeout-ledger).

Apply all four references separately to every issue in a ratified program. Do not publish until the staged body, source-durability gate, exact-title duplicate guard, label decision, and applicable browser-visible checklist gate all pass.

## Final Response Blocker

This blocker governs the completion response after Step 3 publication work begins. It does not forbid the interim Step 2 turn that asks the seam-confirmation question and waits, nor the Step 2 stop that leaves an unratified new-seam sketch as the turn's deliverable. In either interim response, state that publication has not begun and do not claim closeout.

Do not send the final answer until the [final closeout ledger](references/validation-and-closeout.md#final-closeout-ledger) reconciles the verified tracker readbacks and local cleanup evidence. Include the issue number, URL, exact title, state, and labels; staged- and published-body identity and validator results; cited-source and ADR durability results with the publication ref; seam and browser-checklist outcome; deferred follow-ons or program sequencing; temporary-body and policy-file cleanup proof; and final branch plus `git status --short --untracked-files=all`. List and classify every remaining dirty path individually; grouped counts or unnamed path families do not satisfy the blocker. Do not claim any gate that lacks current evidence. If interrupted, resumed, or compacted after publication begins, rerun every blocker check whose output is no longer in context before reporting completion.

Done only when every intended issue satisfies this blocker and every temporary body is absent.
