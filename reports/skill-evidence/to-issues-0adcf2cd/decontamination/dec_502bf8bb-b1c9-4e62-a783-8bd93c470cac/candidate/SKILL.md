---
name: to-issues
description: Break a plan, spec, or PRD into independently-grabbable issues on the project issue tracker using tracer-bullet vertical slices.
disable-model-invocation: true
---

# To Issues

Break a plan into the smallest useful family of independently grabbable vertical slices, recommend the family, and publish it only after explicit authorization.

Use the repository's tracker and triage-label authorities. In this repository they are `docs/agents/issue-tracker.md` and `docs/agents/triage-labels.md`; otherwise follow the tracker configuration named by the project agent instructions. If none exists, route to `/setup-matt-pocock-skills`.

## 1. Establish live source truth

Resolve the exact source before drafting.

- For a named tracker item, use an in-context body only when it was authored or fetched this session, and always fetch fresh comments. Otherwise fetch the full body and comments.
- For “the PRD we just made” or similar wording, use the latest unambiguous in-session item, state the resolved number, and exact-read it. If discovery yields multiple plausible items, ask for the number.
- Check for an existing child-map ledger. Verify listed children and exact titles; report an existing complete breakdown and stop unless the user explicitly asks to replace, supplement, or re-break it.
- Exact-read named siblings, prerequisites, coordination items, and prior children whose state affects scope or dependency wording. Classify each as hard blocker, current context, or coordination-only. Keep discovery bounded; do not treat a failed or truncated read as an empty result.

Scan the source and fresh comments for unresolved choices: provisional, unratified, timed-out, open-to-veto, grooming-delegated, TBD, or otherwise undecided behavior. Inspect modal wording rather than treating words such as “may” as automatic blockers. Classify each hit as:

1. blocking open decision;
2. implementation latitude that the checkpoint can ratify; or
3. irrelevant prose.

Also verify material claims that a mechanism, seam, policy, or behavior already exists. Classify each as verified current, present-but-materially-different, or absent. Never encode an unverified premise as settled. Route unresolved structure into the approval checkpoint, a first spec/document blocker, or `needs-triage`; if no truthful route exists, stop.

Choose one relationship per proposed issue:

- **Child mode**: implements a tracker parent.
- **Standalone-source mode**: derives from a tracker item but is a predecessor, follow-on, or coordination issue; put the exact relationship in `## Source and coordination`.
- **Artifact-source mode**: derives from a durable local artifact without a truthful tracker parent; use its repo-relative path, publication ref, source token, and exact relationship.

In child mode, exact-read the parent state and labels against the canonical triage roles. If ready children would coexist with a `ready-for-agent` parent, the checkpoint must propose an explicit truthful non-AFK parent-label transition. Never invent an unlabeled holding state or alter the parent without authorization.

When the user asks whether to split an existing issue, assess granularity first. If it is already one coherent vertical or document/process unit, explain why splitting would add no implementation value and stop.

## 2. Inspect the implementation surface

Explore only as needed to make scopes, ownership, dependencies, and test seams truthful. Use repository glossary and ADR vocabulary, targeted searches, and the live package/module boundaries. Run `git status --short`; preserve unrelated dirt.

Verify source claims about existing code and look for a prefactor that makes the slices independently implementable. A prefactor is its own earlier slice only when it leaves a coherent verified state and materially simplifies later work.

## 3. Draft tracer-bullet slices

Each code-bearing issue delivers a narrow complete behavior through every affected layer. Do not split by schema/API/UI merely to create parallel work.

- Respect explicitly excluded layers and assert their unchanged boundary where useful.
- A refactor may be one slice when splitting would create a half-migrated intermediate state.
- A repository-owned sub-application seam may be a complete slice when it is independently verifiable; a later consumer slice must name the handoff and duplicate no policy.
- Document, spec, ADR, and policy work may be blocker issues. Docs-only work splits only when the downstream application is an independently reviewable unit.
- Any behavior intentionally completed later names the handoff in both issue bodies.
- One issue is a valid result. Optimize for the smallest complete family, not an issue count.

Every issue needs an observable test seam, honest blocker graph, and explicit story coverage when the source has stories.

### Artifact and authority integrity

Inventory every cited or newly introduced local artifact:

`Artifact | Exact path or stable identifier | Role | Publication-ref result | Disposition`

Use roles `implementation prerequisite`, `summarized provenance`, `implementation target`, or `planned artifact`. Resolve stable identifiers to exact paths and run:

```sh
node .claude/skills/to-issues/scripts/check-artifact-durability.mjs <publication-ref> <path> [<path>...]
```

Durable means tracked, clean, visible at the resolved ref, and byte-identical. Exit 1 is a real non-durable result; exit 2 is a check failure. Use the documented per-path Git fallback only when the helper genuinely cannot run.

Before adding a document blocker, apply the sufficiency test: every material child acceptance criterion must trace to the parent body, fresh parent comments, or tracked doctrine. A sufficiently detailed parent is a durable issue-linked summary; do not create a blocker merely to publish duplicated provenance. If implementation-critical detail exists only in local or unwritten material, publish/review it first, move it into durable tracker context, or stop.

Resolve authority order from the repository instructions and active-doc registry. When the source conflicts with governing doctrine, do not silently propagate either version: show the conflict and proposed correction in the approval checkpoint, then encode only the ratified resolution. Never rewrite the parent as part of this skill.

### House style

Fetch one or two exact recent child bodies and match their title, section order, voice, and acceptance-criteria conventions. For a multi-issue child-mode proposal, fetch at most one exact recent `# Child Issue Map` comment when available; use it only for ledger style, and do not broad-fetch comment bodies to find one.

## 4. Present the approval checkpoint

Present the proposed family as:

```markdown
1. **Title**: <short descriptive name>
   - **Blocked by**: <none, slice titles, tracker prerequisites, or exact external prerequisite>
   - **User stories covered**: <source IDs or N/A with reason>
```

Assign temporary `US1`, `US2`, … ordinals to unnumbered source stories and map them unambiguously. Include one prefactoring verdict.

Then include all eight postures with concrete values:

- `Decision scan:`
- `Source relationship:`
- `Parent disposition:`
- `Source/target posture:`
- `Prerequisite posture:`
- `Publication posture:`
- `Artifact posture:`
- `Coverage gate:`

The fields must agree with the slices: every requirement is owned or explicitly already satisfied; every blocker appears in the dependency order; every non-durable artifact has a truthful disposition; the parent cannot compete with ready children; and labels reflect unresolved decisions.

For browser-visible work, read the checklist between the markers in `docs/agents/issue-tracker.md`. Map every applicable item to a proposed/final acceptance criterion and give a specific N/A only for genuinely unaffected slices. Before publication, the final run sheet must use `AC <n> - "<verbatim excerpt>"` mappings against the staged bodies; external gating does not make an affected slice N/A.

Ask the user to confirm:

- granularity and dependencies;
- any ratified implementation latitude or doctrine correction;
- source relationship, labels, parent disposition, and artifact posture;
- for multi-issue child mode, whether to post the child-map ledger; and
- if the ledger is declined, whether durable rationale belongs in the first relevant child or intentionally stays out of the tracker.

End with one explicit sentence saying exactly which parent-label transition, issue creations, labels, dependency order, and ledger/source action approval authorizes. A single-slice checkpoint may be compact but still covers all eight postures.

Do not stage bodies or mutate the tracker without explicit approval or explicit pre-authorization. A timeout or unavailable approval tool is not approval. Iterate on the proposal until authorized.

If ledger judgment is delegated, post it when future implementers would otherwise need to reconstruct structural, dependency, durability, coordination, or story decisions from chat. If the user declines a ledger but leaves rationale placement undecided, put a concise `## Breakdown decisions` note in the first relevant child and state that default before publication. Honor an explicit request to keep it out.

## 5. Publish after approval

After authorization, read [`references/publication-protocol.md`](references/publication-protocol.md) completely and execute it. It is the canonical owner of staging, duplicate safety, parent transition, validation, serial creation, immediate readback, resume, ledger/source verification, family verification, cleanup, and final proof.

Execution spine:

1. Freeze the approved family and relationship posture.
2. Reconcile exact-title duplicates and any prior partial publication.
3. Stage and validate the working ledger, issue bodies, and checklist run sheet.
4. Apply only the approved parent transition, then publish serially in dependency order.
5. Verify each issue before continuing and update the working ledger.
6. Post the approved parent ledger or preserve the exact source relationship.
7. Run final family verification, remove temporary artifacts, and report live proof.

Publication is complete only when approved count equals verified count, every issue and dependency matches the staged contract, the parent/ledger or source posture is verified, checklist and forbidden-value gates pass, temporary artifacts are gone, and final worktree status is reported.
