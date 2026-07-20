Publication is authorized, but this trial is offline. I made no GitHub calls or tracker mutations, and I do not treat the historical `#95`/`#96` records as proof that these writes occurred in this trial.

The frozen publication posture is child mode under PRD #94, with two children published serially using `bug` and `ready-for-agent`, followed by the approved child-map comment. PRD #94 receives no other mutation. Its supplied state remains `CLOSED`, its labels remain exactly `bug` and `needs-triage`, and its body remains unchanged; I will not close, reopen, relabel, or rewrite it.

1. **Specify accepted-segment generation-context coherence**
   - **Parent**: PRD #94
   - **Blocked by**: None; create first.
   - **User stories covered**: US22, US23, and US26; establishes the contract used by the remaining stories.
   - **Labels**: `bug`, `ready-for-agent`
   - **Acceptance criteria**:
     - A new active spec is registered in the active-doc registry before production behavior changes.
     - The spec defines the zero-versus-nonzero accepted-segment state matrix for missing, matching, and contradictory saved contexts, including first acceptance, final deletion, later acceptance, and non-final deletion.
     - The spec pins the stable `generation-context-accepted-segment-mismatch` diagnostic, author-language copy, affected target, focus action, archive-derived readiness evaluation, and manual selector-and-save recovery.
     - The spec defines one canonical existing-route metadata shape for saved context, required context, accepted-segment count, and coherence, with no compatibility alias, migration, or automatic draft mutation.
     - The spec pins the no-prompt-bytes/no-provider-call boundary, accepted-prose exclusion, synchronized authority updates, test seams, and completion/archive procedure.
   - **Principles**: Preserve deterministic normalization, draftability, fail-closed readiness, author-owned fields, accepted prose as output, local-only checking, and existing route/component seams from PRD #94 and `docs/FOUNDATIONS.md`.

2. **Enforce accepted-segment generation-context coherence end to end**
   - **Parent**: PRD #94
   - **Blocked by**: the real issue number returned and verified for “Specify accepted-segment generation-context coherence”; create second, never with a predicted number.
   - **User stories covered**: US1-US25; implements the contract established for US22, US23, and US26.
   - **Labels**: `bug`, `ready-for-agent`
   - **Acceptance criteria**:
     - Core/server readiness derives the required context only from zero-versus-nonzero accepted-segment count, preserves any structurally valid saved value, and emits the one mismatch blocker when saved and required values disagree.
     - While mismatched, all other checks use the archive-derived required context; draft Save remains available, while Prompt Preview, compilation, candidate intake, Generate, and provider transport fail closed.
     - Existing Generation Brief routes expose one truthful saved/required/count/coherence shape without duplicate authority or storage migration.
     - Generation Brief, Prompt Preview, and Generate show consistent author-language saved and required values, blocker state, outcome, and recovery action; recovery focuses the existing selector and requires an explicit save plus fresh evaluation.
     - The recovery control has accessible names and keyboard focus behavior, and save/reload clears the mismatch deterministically while leaving applicable handoff blockers visible.
     - Acceptance, deletion, readiness, compilation, and blocked generation do not rewrite the saved Generation Brief; additional acceptance and non-final deletion do not create false transitions; accepted prose text never enters diagnostics, prompts, logs, or provider requests.
     - Existing server, core, component, persistence, and cross-page seams cover both symmetric transitions, stale existing projects, zero provider calls while blocked, the accepted-prose sentinel, and shared diagnostic behavior.
     - The Compiler Contract, Story Record Schema, validation inventory, stress suite and matrix, demo blocker recipes, and user guide are synchronized, and `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.
   - **Principles**: Implement the spec and PRD #94 without automatic mutation, new lifecycle authority, accepted-prose context, LAN/cloud behavior, or weakened readiness/provider gates.

Browser-visible guidance is N/A for the first, docs-only contract issue. For the implementation issue, the final run sheet must map all eight canonical items carried by PRD #94 to the corresponding final acceptance criteria above: entry points; visible states/actions/outcomes; validation and recovery; prompt-preview freshness; the user-initiated external-model boundary; canon/prose boundaries; persistence/migration/provenance; and browser/accessibility regression behavior.

At an online execution checkpoint I would:

1. Exact-read PRD #94 and run exact-title duplicate guards for both titles. One exact match must be reconciled and verified rather than duplicated; multiple matches stop publication.
2. Stage and validate both bodies, their story/checklist mappings, and a two-entry working ledger. No parent-label transition is staged or run.
3. Create and exact-read-verify the specification child first. Substitute its verified real number into the implementation child, revalidate, create it, and exact-read-verify its title, body, open state, exact labels, parent relationship, and blocker.
4. After both children verify, post the approved `# Child Issue Map` comment using their real numbers and dependency order. Exact-read the comment back from PRD #94.
5. Exact-read PRD #94 again and require `CLOSED` plus exactly `bug` and `needs-triage`, with its body unchanged. Any drift blocks closeout; it does not authorize a corrective parent transition.

Planned closeout would report two approved children matched by two verified issue URLs, per-child labels/state/relationship/blocker and checklist proof, the exact child-map comment URL, and explicit proof that PRD #94 received only the authorized comment and no state, label, or body transition.
