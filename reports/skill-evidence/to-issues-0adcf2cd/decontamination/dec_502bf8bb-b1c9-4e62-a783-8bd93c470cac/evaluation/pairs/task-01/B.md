# Proposed breakdown for PRD #117

I recommend seven child issues. The first makes the pending authority durable; the next two establish the ratified pure-core seams; the following three deliver complete browser flows; the last retires the superseded field guide only after the replacement ships. No tracker mutation has occurred.

1. **Title**: Publish and register the Cast Member draft-prompt authority
   - **Blocked by**: none
   - **User stories covered**: US2-US6 and US20 (authority ownership; user-visible behavior lands in later slices)
   - **Staged acceptance criteria**:
     - **AC 1** — The ratified Cast Member draft-prompt authority is authored at the exact path recorded by the durable PRD-prep artifact and defines every CAST MEMBER field's purpose, invention policy, strict fenced-JSON contract, `uncertainties` and substantially-invented-field reporting, and the prohibition on emitting or choosing `entity_id`.
     - **AC 2** — `docs/ACTIVE-DOCS.md` registers that document as the domain authority for this prompt surface.
     - **AC 3** — The authority states that the template is static, record-free, deterministic, separately versioned, schema-drift protected, and makes no provider call; it does not add a prompt class, assistance source profile, schema change, or compiler-contract change.
   - **Testing seam**: documentation conformance review against PRD #117 and the named active authorities; registry-link/path validation. This is an authority slice, not a code-bearing slice.

2. **Title**: Add the deterministic Cast Member draft prompt to `@loom/core`
   - **Blocked by**: 1 — Publish and register the Cast Member draft-prompt authority
   - **User stories covered**: US2-US6 and US20; Slice 4 completes the copy-to-clipboard user path
   - **Staged acceptance criteria**:
     - **AC 1** — `@loom/core` exposes a deterministic Cast Member draft template with its own version identity and the complete role framing, per-field semantics, and character-fitting invention rules defined by the authority.
     - **AC 2** — The output contract requests one fenced JSON object using exact schema field names plus `uncertainties` and the substantially-invented-field list, while explicitly forbidding `entity_id` and unknown keys and including no project record or story data.
     - **AC 3** — Pure-core tests prove deterministic output and version identity and fail when any CAST MEMBER schema field is not represented in the template contract, including `entity_id` as an explicitly forbidden field.
     - **AC 4** — Regression assertions show the prose template, compiler, compiler-contract versions, CAST MEMBER schema, and server surfaces remain unchanged.
   - **Testing seam**: `@loom/core` unit tests at the ratified pure-function seam. The browser consumes this API in Slice 4 and duplicates no template policy.

3. **Title**: Parse Cast Member draft responses tolerantly in `@loom/core`
   - **Blocked by**: 1 — Publish and register the Cast Member draft-prompt authority
   - **User stories covered**: US8-US12; Slices 5 and 6 complete their browser-visible paths
   - **Staged acceptance criteria**:
     - **AC 1** — Pure functions extract one JSON object from a bare object, a fenced block, or an object surrounded by assistant prose and return an explicit malformed-response result when no usable object exists.
     - **AC 2** — Mapping validates each submitted field independently against the registered CAST MEMBER schema, accepts every valid field despite invalid neighbors, preserves absent fields as absent, and never throws away the whole usable draft for one bad value.
     - **AC 3** — `entity_id`, unknown keys, empty values, malformed entries, and invalid enum values are excluded from fillable output and each produces its specific named skip reason.
     - **AC 4** — The result model separates filled fields, skipped fields with reasons, and needs-author items containing linked-entity selection, declared uncertainties, and substantially invented fields.
     - **AC 5** — Table-driven pure-core fixtures cover valid, partially valid, malformed, prose-wrapped, fenced, bad-enum, unknown-key, empty-value, and `entity_id`-injection cases without file, store, network, provider, or server I/O.
   - **Testing seam**: `@loom/core` table-driven unit tests at the ratified pure parse/map/report seam. Browser slices consume the returned shape and duplicate no validation policy.

4. **Title**: Copy the Cast Member draft prompt from the editor
   - **Blocked by**: 2 — Add the deterministic Cast Member draft prompt to `@loom/core`
   - **User stories covered**: US1-US6, US19, and the browser half of US20
   - **Staged acceptance criteria**:
     - **AC 1** — A clearly named, keyboard-operable copy action is available in Cast Member create, linked-create, and edit modes and copies the current versioned `@loom/core` template.
     - **AC 2** — The clipboard text is the complete self-contained template, including every field's purpose, invention rules, exact output contract, uncertainty/invention declarations, and the `entity_id` prohibition.
     - **AC 3** — Component tests prove the copied text contains no project records or story data and that invoking copy performs no network, provider, store, schema, server, or compiler action.
     - **AC 4** — Editor component tests cover keyboard operation, the accessible name, the observable clipboard result, and the existing editor modes' unchanged behavior.
   - **Testing seam**: existing `@loom/web` Cast Member editor component tests with a controlled clipboard; no end-to-end server seam is owed.

5. **Title**: Import assisted drafts safely while creating a Cast Member
   - **Blocked by**: 3 — Parse Cast Member draft responses tolerantly in `@loom/core`
   - **User stories covered**: US7-US13 and US15-US19 for standalone and linked creation
   - **Staged acceptance criteria**:
     - **AC 1** — A clearly named, keyboard-operable import dialog is available in standalone and linked Cast Member creation and accepts an author-pasted response without making a network or provider call.
     - **AC 2** — Import consumes the `@loom/core` result, prefills every accepted present field, leaves absent fields untouched, preserves the current or pre-bound `entity_id`, and duplicates no parse or validation policy in the browser.
     - **AC 3** — The editor renders three distinct bands for filled fields, every skipped field with its specific reason, and needs-author items including linked-entity selection, uncertainties, and substantially invented fields.
     - **AC 4** — Before replacing any non-empty draft value, a confirmation lists exactly the affected field names; declining it leaves the form unchanged, and accepting it changes only the listed present fields.
     - **AC 5** — Imported values remain an explicitly unsaved draft until the author uses the ordinary save action; cancelling or navigating away leaves no project-store, working-set, prompt-context, local-storage, or session-storage residue from the paste, report, or unsaved draft.
     - **AC 6** — Editor component tests cover valid and partially valid paste, overwrite accept/decline, report states, linked-entity preservation, save/cancel/navigation outcomes, keyboard operation, accessible names, and the no-network boundary.
   - **Testing seam**: existing `@loom/web` editor component interaction seam in both standalone-create and linked-create modes, backed by the pure-core fixtures from Slice 3.

6. **Title**: Refresh existing Cast Member drafts with protected merge semantics
   - **Blocked by**: 5 — Import assisted drafts safely while creating a Cast Member
   - **User stories covered**: US7-US12 and US14-US19 for edit mode
   - **Staged acceptance criteria**:
     - **AC 1** — The same import affordance and three-band report are available while editing an existing Cast Member, using the shared core result and browser interaction introduced by Slice 5.
     - **AC 2** — Fields absent from the paste remain unchanged, `entity_id` remains unchanged, and valid present fields can still be applied when other submitted fields are skipped.
     - **AC 3** — A pre-apply confirmation names exactly the non-empty existing fields that would change; declining changes nothing, while accepting changes only those confirmed present fields and leaves all other record fields intact.
     - **AC 4** — Import never saves automatically and cancel/navigation clears paste, report, and unsaved imported values without project-store, working-set, prompt-context, browser-storage, network, or provider residue.
     - **AC 5** — Editor component tests cover partially populated existing records, mixed-validity paste, exact overwrite lists, accept/decline, report/provenance states, entity preservation, ordinary save, cancel/navigation, keyboard operation, and accessible names.
   - **Testing seam**: existing `@loom/web` Cast Member editor component interaction seam in edit mode; regression coverage proves the create modes from Slice 5 remain unchanged.

7. **Title**: Archive the superseded Cast Member field guide after rollout
   - **Blocked by**: 4 — Copy the Cast Member draft prompt from the editor; 5 — Import assisted drafts safely while creating a Cast Member; 6 — Refresh existing Cast Member drafts with protected merge semantics
   - **User stories covered**: N/A — documentation and archival closeout; the product stories are delivered by Slices 2-6
   - **Staged acceptance criteria**:
     - **AC 1** — `reports/cast-member-record-field-guide.md` remains available until the copy/import feature is complete, then moves to the archive destination required by `docs/archival-workflow.md` with its superseded status preserved.
     - **AC 2** — Active references point to the new registered prompt authority rather than the superseded evidence-only field guide, without reviving the old extraction policy as active doctrine.
     - **AC 3** — Documentation/registry/link checks pass and the archive change does not modify runtime behavior, schema, compiler, validation, or prompt-context behavior.
   - **Testing seam**: archival-workflow conformance and repository documentation/reference checks; no code-bearing or browser seam.

## User-story coverage check

| Stories | Primary owner | Completion handoff |
|---|---|---|
| US1 | Slice 4 | Slice 2 supplies the template copied by the editor |
| US2-US6 | Slices 1, 2, and 4 | Authority, deterministic core content, then observable copy path |
| US7 | Slices 5 and 6 | Create and edit modes respectively |
| US8-US12 | Slices 3, 5, and 6 | Pure parse/map/report behavior, then create/edit rendering |
| US13 | Slices 5 and 6 | Linked-create and edit preservation regressions |
| US14 | Slice 6 | Edit-mode import availability |
| US15-US16 | Slices 5 and 6 | Safe merge/overwrite behavior in create and edit modes |
| US17-US18 | Slices 5 and 6 | Unsaved quarantine and residue-free exit in both modes |
| US19 | Slices 4-6 | Copy and both import paths prove the no-network/provider boundary |
| US20 | Slices 1, 2, and 4 | Durable contract, core version/drift test, and editor consumption |

All twenty stories have an owner; none is deferred.

## Browser-visible guidance mapping

| Slice | Checklist item | Covered by staged AC | N/A reason |
|---|---|---|---|
| Publish and register the Cast Member draft-prompt authority | browser-visible guidance checklist | N/A | authority-only blocker; Slices 4-6 own browser behavior |
| Add the deterministic Cast Member draft prompt to `@loom/core` | browser-visible guidance checklist | N/A | pure-core template seam; Slice 4 owns its browser consumption |
| Parse Cast Member draft responses tolerantly in `@loom/core` | browser-visible guidance checklist | N/A | pure-core parse/report seam; Slices 5-6 own its browser consumption |
| Copy the Cast Member draft prompt from the editor | entry point and availability | AC 1 — "copy action is available in Cast Member create, linked-create, and edit modes" | - |
| Copy the Cast Member draft prompt from the editor | prompt preview contents and freshness | AC 2 — "clipboard text is the complete self-contained template" | - |
| Copy the Cast Member draft prompt from the editor | user-initiated external LLM boundary | AC 3 — "invoking copy performs no network, provider, store, schema, server, or compiler action" | - |
| Copy the Cast Member draft prompt from the editor | browser and accessibility regression scenario | AC 4 — "keyboard operation, the accessible name, the observable clipboard result" | - |
| Import assisted drafts safely while creating a Cast Member | entry point and availability | AC 1 — "available in standalone and linked Cast Member creation" | - |
| Import assisted drafts safely while creating a Cast Member | user-visible states, actions, and outcomes | AC 3 — "three distinct bands for filled fields, every skipped field with its specific reason, and needs-author items" | - |
| Import assisted drafts safely while creating a Cast Member | validation, warning, error, and recovery behavior | AC 4 — "confirmation lists exactly the affected field names; declining it leaves the form unchanged" | - |
| Import assisted drafts safely while creating a Cast Member | user-initiated external LLM boundary | AC 1 — "accepts an author-pasted response without making a network or provider call" | - |
| Import assisted drafts safely while creating a Cast Member | canon and prose boundary visibility | AC 5 — "Imported values remain an explicitly unsaved draft until the author uses the ordinary save action" | - |
| Import assisted drafts safely while creating a Cast Member | persistence, migration, export, and provenance | AC 5 — "leaves no project-store, working-set, prompt-context, local-storage, or session-storage residue" | - |
| Import assisted drafts safely while creating a Cast Member | browser and accessibility regression scenario | AC 6 — "keyboard operation, accessible names, and the no-network boundary" | - |
| Refresh existing Cast Member drafts with protected merge semantics | entry point and availability | AC 1 — "available while editing an existing Cast Member" | - |
| Refresh existing Cast Member drafts with protected merge semantics | user-visible states, actions, and outcomes | AC 1 — "same import affordance and three-band report" | - |
| Refresh existing Cast Member drafts with protected merge semantics | validation, warning, error, and recovery behavior | AC 3 — "pre-apply confirmation names exactly the non-empty existing fields that would change" | - |
| Refresh existing Cast Member drafts with protected merge semantics | user-initiated external LLM boundary | AC 4 — "without ... network, or provider residue" | - |
| Refresh existing Cast Member drafts with protected merge semantics | canon and prose boundary visibility | AC 4 — "Import never saves automatically" | - |
| Refresh existing Cast Member drafts with protected merge semantics | persistence, migration, export, and provenance | AC 4 — "clears paste, report, and unsaved imported values without project-store ... browser-storage ... residue" | - |
| Refresh existing Cast Member drafts with protected merge semantics | browser and accessibility regression scenario | AC 5 — "keyboard operation, and accessible names" | - |
| Archive the superseded Cast Member field guide after rollout | browser-visible guidance checklist | N/A | documentation/archive closeout after all browser slices complete |

## Artifact inventory

This offline snapshot supplies no publication-ref name, so these are intake dispositions, not live durability claims.

| Artifact | Exact path or stable identifier | Role | Publication-ref result | Disposition |
|---|---|---|---|---|
| Ratified PRD-prep determination | `reports/cast-member-draft-import-prd-prep.md` | summarized provenance | Source says tracked and visible, but ref identity was not supplied or rechecked offline | Resolve the publication ref and run content-identity durability preflight before staging; PRD #117 carries the ratified product decisions, but the prep artifact is still needed to resolve the exact authority filename |
| Cast Member prompt authority | Stable identifier: new Cast Member draft-prompt domain authority; exact filename is recorded only in the prep artifact | planned artifact | Not yet authored according to the source | Slice 1 is the document blocker; resolve and freeze the exact path before any issue body is staged |
| Existing field guide | `reports/cast-member-record-field-guide.md` | implementation target and superseded provenance | Not rechecked offline | Slice 1 absorbs needed doctrine into the new authority; Slice 7 archives this path only after rollout |
| Project constitution | `docs/FOUNDATIONS.md` | implementation prerequisite | Not rechecked offline | Verify content identity at the resolved ref; no amendment is proposed |
| Active authority registry | `docs/ACTIVE-DOCS.md` | implementation target | Not rechecked offline | Verify content identity at the resolved ref; Slice 1 updates it |
| CAST MEMBER schema authority | `docs/story-record-schema.md` | implementation prerequisite | Not rechecked offline | Verify content identity at the resolved ref; schema remains unchanged |
| Archival workflow | `docs/archival-workflow.md` | implementation prerequisite | Not rechecked offline | Verify content identity at the resolved ref; Slice 7 follows it |

Prefactoring: none proposed. The PRD ratifies existing `@loom/core` pure-function and `@loom/web` editor-component seams, and the supplied offline snapshot contains no code evidence that would justify a prefactor issue.

Decision scan: supplied exact body snapshot; the only open-decision phrase is the explicit negative "no seam is open to veto"; all product and testing-seam decisions are stated as ratified, so no unresolved decision is being smuggled into the slices.

Source relationship: child mode — all seven issues implement the scope of PRD #117.

Parent disposition: #117 is already `CLOSED` with `enhancement` and `needs-triage`; no reopen, relabel, close, or other parent-state transition is proposed, so there is no simultaneous AFK-ready parent/child ownership.

Source/target posture: PRD #117 is the durable tracker source; the target is exactly the seven child issues listed above, with no server, schema, compiler-contract, OpenRouter, other-record-type, persistence, or automatic-save work added.

Prerequisite posture: Slice 1 blocks Slices 2 and 3; Slice 2 blocks Slice 4; Slice 3 blocks Slice 5; Slice 5 blocks Slice 6; Slices 4-6 block Slice 7. No sibling tracker blocker is supplied. Before publication, live preflight must resolve the publication ref and exact planned authority path and verify the seven artifact rows; a contradiction returns to this checkpoint instead of being guessed through.

Publication posture: after approval and successful live preflight, create the seven children in dependency order with labels `enhancement` and `ready-for-agent`, then post one `# Child Issue Map` ledger comment on #117 recording issue links, dependency order, story coverage, the closed-parent/no-transition posture, and the artifact decision. Exact-title duplicate guards and live readback are required before and after each create. No parent label or state change is included.

Artifact posture: publication ref not supplied; seven inventory rows; one planned, unauthored authority is routed through Slice 1, one superseded operational guide is retained until Slice 7, and every existing path requires tracked/ref-visible/content-identical preflight before publication. No local path is represented as proven durable by this offline response.

Coverage gate: US1-US20 are all mapped above; all eight browser-visible guidance items are mapped to staged acceptance criteria for Slices 4-6, with specific seam-based N/A rows for the authority, pure-core, and archival slices; no server checklist mapping is owed because the PRD explicitly adds no server surface.

Does this seven-slice granularity feel right, are the dependency relationships correct, and should any slices be merged or split? If you approve the numbered family and its decision, tracker, parent-disposition, source/target, prerequisite, publication, artifact, and coverage postures, then—only after the live preflight matches this supplied snapshot—I will create these seven child issues in the dependency order shown with labels `enhancement` and `ready-for-agent`, and post the parent child-map ledger on closed PRD #117. I will not reopen, relabel, or close #117 or any other issue. If preflight reveals a different path, ref result, existing child, child-map, or parent state, I will stop and return with the exact discrepancy rather than mutate the tracker.

