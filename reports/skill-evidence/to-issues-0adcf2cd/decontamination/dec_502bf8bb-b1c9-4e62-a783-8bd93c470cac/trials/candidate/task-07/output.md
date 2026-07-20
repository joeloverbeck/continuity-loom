# Offline publication staging for PRD #94

Publication is authorized for exactly two child issues and one child-map comment. This offline trial made no GitHub calls and performed no tracker writes. The supplied family snapshot defines the intended titles and labels only; it does not prove that issues `#95` or `#96`, or any other matching issues, exist in this trial.

## Frozen publication posture

- **Decision scan:** No product or testing choice remains open in PRD #94. Canonical response property names and internal helper boundaries remain bounded implementation discretion for the spec.
- **Source relationship:** Child mode under `PRD #94`.
- **Parent disposition:** Preserve the supplied parent state and labels exactly: `CLOSED`, `bug`, `needs-triage`. Authorization permits the child-map comment, but no relabel, reopen, close, body rewrite, or other parent transition.
- **Source/target posture:** PRD #94 is sufficient tracker authority for both children. The spec is the first target; production behavior is the second.
- **Prerequisite posture:** “Enforce accepted-segment generation-context coherence end to end” is blocked by the verified issue number for “Specify accepted-segment generation-context coherence.”
- **Publication posture:** Create serially in dependency order, each `OPEN` with exactly `bug` and `ready-for-agent`; post the child map only after both children verify.
- **Artifact posture:** No local artifact is a publication source. Named documentation files are implementation targets, not claimed publication prerequisites.
- **Coverage gate:** Slice 1 owns US26 and pins the contract for US1–US25; slice 2 implements US1–US25 after the spec. No story is omitted.
- **Prefactoring verdict:** No separate prefactor. The spec is a coherent authority slice and the implementation is one end-to-end behavior revision; layer-based splitting would create half-migrated authority.

## Frozen issue family

1. **Specify accepted-segment generation-context coherence**
   - **Blocked by:** None
   - **User stories covered:** US26 directly; contract for US1–US25
2. **Enforce accepted-segment generation-context coherence end to end**
   - **Blocked by:** verified issue number for slice 1
   - **User stories covered:** US1–US25; US26 satisfied by slice 1

## Staged body: Specify accepted-segment generation-context coherence

```markdown
## Parent

PRD #94

## What to build

Create and register an active spec for the accepted-segment archive/draft coherence contract before production behavior changes. The spec must pin the zero-versus-nonzero state matrix, one mismatch diagnostic, archive-derived readiness evaluation, canonical existing-route metadata, manual editor-and-save recovery, no-mutation and accepted-prose boundaries, synchronized authority updates, regression seams, and completion/archive procedure.

## User stories covered

- US26 directly.
- US1–US25 are specified here and implemented by the dependent “Enforce accepted-segment generation-context coherence end to end” issue.

## Acceptance criteria

- [ ] A new active spec is registered in the active-doc registry and is the single approved contract for this behavior revision.
- [ ] The spec defines the full missing, matching, and mismatched context matrix for zero, one, and multiple accepted segments, including symmetric first-acceptance and final-deletion transitions.
- [ ] The spec fixes one `generation-context-accepted-segment-mismatch` diagnostic and requires all other readiness checks to use the archive-derived required context while the mismatch is reported.
- [ ] The spec defines one canonical existing-route response shape for saved context, required context, accepted-segment count, and coherence, without compatibility aliases or duplicate authority.
- [ ] The spec requires author-language status, accessible focus of the existing selector, explicit save and reload recovery, no automatic draft mutation, no accepted-prose use, and no provider request while incoherent.
- [ ] The spec maps the existing server, core, repository, and component regression seams; names every synchronized governing document from PRD #94; and defines its own completion and archive conditions.

## Blocked by

None - can start immediately

## Principles

Follow PRD #94 and the governing foundations it identifies: deterministic accepted-segment-count derivation, structurally saveable drafts, fail-closed readiness, accepted prose as output rather than context, local checks before explicit Generate, and one authority for lifecycle coherence. This issue changes authority only; it does not implement production behavior.
```

## Deferred staged body: Enforce accepted-segment generation-context coherence end to end

`#<SPEC_CHILD>` is the only permitted placeholder. Substitute the verified real number from slice 1 before validation or creation.

```markdown
## Parent

PRD #94

## What to build

Implement the approved spec through core readiness, existing server routes and persistence boundaries, Generation Brief, Prompt Preview, Generate, shared diagnostics, governing documentation, and regression coverage. Preserve structurally saveable drafts and accepted prose as output; do not add a migration, compatibility alias, automatic repair, duplicate lifecycle authority, new browser framework, or new provider boundary.

## User stories covered

- US1–US25.
- US26 is satisfied by prerequisite #<SPEC_CHILD>.

## Acceptance criteria

- [ ] Missing context defaults deterministically from accepted-segment count; matching context is coherent; contradictory saved context emits exactly `generation-context-accepted-segment-mismatch` for the zero/nonzero matrix.
- [ ] Acceptance, deletion, readiness reads, compilation, and blocked Generate never rewrite the saved Generation Brief; only the author's explicit ordinary save changes its context.
- [ ] While incoherent, Prompt Preview, compilation, candidate intake, Generate, and provider transport fail closed with the same blocker, produce no prompt bytes or provider request, and recompile only after an explicit matching save.
- [ ] All other readiness checks evaluate the archive-derived required context, so continuation handoff blockers cannot be bypassed and first-segment requirements cannot survive final-segment deletion.
- [ ] Existing Generation Brief responses expose one canonical set of saved context, required context, accepted-segment count, and coherence metadata without parallel compatibility fields.
- [ ] Generation Brief, Prompt Preview, and Generate show consistent author-language saved/required states and recovery; the action has an accessible name, keyboard activation focuses the existing context selector, Save remains available, and save plus reload clears only the mismatch.
- [ ] Regression coverage proves symmetric boundary changes, stable non-boundary acceptance/deletion, unchanged persistence outside explicit save, no migration/export/provenance change, and exclusion of a unique accepted-prose sentinel from validation, metadata, prompts, logs, and provider requests.
- [ ] The diagnostic inventory, compiler/schema authorities, stress suite and matrix, demo blocker recipe, and user guide are synchronized, and `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.

## Blocked by

- #<SPEC_CHILD>

## Principles

Implement PRD #94 and its approved active spec as one deterministic end-to-end rule. Accepted-segment count is the sole lifecycle fact; saved author data changes only through explicit save; all readiness-dependent entry points share one fail-closed result; accepted prose never becomes context.
```

## Browser-visible checklist run sheet

| Slice | Checklist item | Covered by final AC mapping |
| --- | --- | --- |
| Specify accepted-segment generation-context coherence | browser-visible guidance checklist | N/A - documentation-only authority slice; it changes no runtime or browser behavior. |
| Enforce accepted-segment generation-context coherence end to end | entry point and availability | AC 3 - “Prompt Preview, compilation, candidate intake, Generate, and provider transport fail closed”; AC 6 - “Generation Brief, Prompt Preview, and Generate show consistent author-language saved/required states and recovery” |
| Enforce accepted-segment generation-context coherence end to end | user-visible states, actions, and outcomes | AC 6 - “show consistent author-language saved/required states and recovery” and “save plus reload clears only the mismatch” |
| Enforce accepted-segment generation-context coherence end to end | validation, warning, error, and recovery behavior | AC 1 - “emits exactly `generation-context-accepted-segment-mismatch`”; AC 3 - “fail closed with the same blocker”; AC 6 - “save plus reload clears only the mismatch” |
| Enforce accepted-segment generation-context coherence end to end | prompt preview contents and freshness | AC 3 - “produce no prompt bytes or provider request, and recompile only after an explicit matching save” |
| Enforce accepted-segment generation-context coherence end to end | user-initiated external LLM boundary | AC 3 - “provider transport fail closed” and “produce no ... provider request” |
| Enforce accepted-segment generation-context coherence end to end | canon and prose boundary visibility | AC 7 - “exclusion of a unique accepted-prose sentinel from validation, metadata, prompts, logs, and provider requests” |
| Enforce accepted-segment generation-context coherence end to end | persistence, migration, export, and provenance | AC 2 - “only the author's explicit ordinary save changes its context”; AC 7 - “no migration/export/provenance change” |
| Enforce accepted-segment generation-context coherence end to end | browser and accessibility regression scenario | AC 6 - “the action has an accessible name, keyboard activation focuses the existing context selector” |

## Authorized execution sequence

1. Fresh-read parent #94 and available labels. Require `CLOSED` with exactly `bug` and `needs-triage`; if it differs, stop because no transition was authorized.
2. Run an all-state exact-title duplicate guard for each frozen title. Zero matches permits creation. One pre-existing match requires an explicit reuse/link/skip decision after exact verification; multiple matches or a failed read block publication. Do not infer matches from the supplied historical family.
3. Stage the two bodies, run sheet, child-map template, and a working ledger with `approvedCount: 2`. Validate the ledger and every currently resolvable body. The second body remains deferred until slice 1 has a verified real number.
4. Do **not** transition the parent. Exact-read it again immediately before the first create and require the same state and labels.
5. Create slice 1 `OPEN` with exactly `bug` and `ready-for-agent`; immediately exact-read and verify title, normalized body, labels, state, parent relationship, no-blocker phrase, story posture, acceptance count `6`, checklist N/A, and forbidden-value cleanliness. Record its number and URL in the working ledger.
6. Replace only `#<SPEC_CHILD>` in slice 2, validate it and its run-sheet rows, then create it `OPEN` with exactly `bug` and `ready-for-agent`. Immediately exact-read and verify the same contract plus its backward blocker, acceptance count `8`, checklist mappings, and forbidden-value cleanliness. Update and validate the working ledger.
7. After both children verify, post this child map once, substituting only verified numbers:

   ```markdown
   # Child Issue Map

   - #<SPEC_CHILD> — Specify accepted-segment generation-context coherence — starts immediately.
   - #<IMPLEMENTATION_CHILD> — Enforce accepted-segment generation-context coherence end to end — blocked by #<SPEC_CHILD>.

   Story coverage: #<SPEC_CHILD> owns US26 and pins the contract for US1–US25; #<IMPLEMENTATION_CHILD> implements US1–US25. The spec is the only prerequisite slice; no separate prefactor is needed. Browser-visible checklist coverage is N/A for the documentation-only spec and fully mapped in the implementation issue. No local artifact is a publication source.

   Parent disposition: PRD #94 remains `CLOSED` with `bug` and `needs-triage`; this map records the authorized relationship and does not reopen, relabel, rewrite, or otherwise transition it.
   ```

8. Re-fetch parent comments and verify one exact staged child-map comment, both child bodies, backward dependency, exact labels and states, and unchanged parent body/state/labels. Run complete-family verification from the working ledger and run sheet, remove all temporary artifacts, prove their absence, and report final worktree status.

No closeout may claim publication until the live proof shows `approved 2 / verified 2`, one URL per verified child, the exact child-map comment, and unchanged parent custody. This trial supplies staging only, so the current verified publication count is **0**.
