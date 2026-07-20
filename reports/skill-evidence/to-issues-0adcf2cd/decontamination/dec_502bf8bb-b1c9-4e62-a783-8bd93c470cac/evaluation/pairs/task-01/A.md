# Recommended issue family for PRD #117

Using the supplied 2026-07-20 snapshot, PRD #117 is a closed, ratified source with no existing children or child-map comment. I recommend five child issues. No tracker change has been made.

Prefactoring verdict: no separate prefactor. The first slice establishes the shared, independently tested core contract that every later slice consumes; extracting anything earlier would leave only scaffolding.

1. **Add the versioned Cast Member draft prompt contract**
   - **Blocked by**: none
   - **User stories covered**: US1-US6 and US20; US1 is completed at the UI seam in Slice 3
   - **Acceptance criteria**:
     1. `@loom/core` exposes deterministic, versioned, copy-ready prompt text that reads no project or story state and changes no prose-template, compiler, compiler-contract, validation, or schema version.
     2. The prompt explains every fillable CAST MEMBER field, requires exact schema field names, licenses character-fitting inventions, forbids `entity_id` and unknown keys, and requires one fenced JSON object plus uncertainty and substantially-invented-field lists.
     3. The exchange metadata keys are fixed as `uncertainties` and `invented_fields`, pending ratification at this checkpoint, and are documented as metadata rather than record fields.
     4. A drift test enumerates the registered CAST MEMBER schema fields and fails when the prompt or its authority document falls out of sync.
     5. The new prompt-template authority is added at the already-ratified path recovered from durable provenance and registered in `docs/ACTIVE-DOCS.md` in the same change.
   - **Test seam**: table-driven `@loom/core` tests over the public prompt/template result, including version identity, record-free content, forbidden keys, metadata contract, and exact schema-field coverage.

2. **Parse Cast Member draft responses with tolerant per-field reporting**
   - **Blocked by**: Slice 1
   - **User stories covered**: US8-US12 and US16; report rendering and form merge are completed in Slice 3
   - **Acceptance criteria**:
     1. Pure `@loom/core` functions extract a single JSON object whether bare, fenced, or surrounded by ordinary assistant prose; no server API is added.
     2. If more than one plausible JSON object is present, the import is rejected as ambiguous with no mapped fields, pending ratification of that implementation latitude at this checkpoint.
     3. Each recognized field is validated independently against the registered CAST MEMBER schema. Valid fields survive invalid siblings; absent fields are absent from the mapping.
     4. Unknown keys, empty values, malformed entries, bad enum values, and attempted `entity_id` injection are omitted and each receives a specific skip reason. Nothing is silently dropped.
     5. The pure result separates filled fields, skipped fields with reasons, and needs-author items, including current entity selection, declared uncertainties, and declared inventions.
   - **Test seam**: table-driven `@loom/core` fixtures for valid, partial, malformed, adversarial, fenced, prose-wrapped, ambiguous, unknown-key, empty-value, bad-enum, and `entity_id`-injection inputs.

3. **Add safe Cast Member draft import to create flows**
   - **Blocked by**: Slices 1 and 2
   - **User stories covered**: US1, US7, US11-US13, and US15-US19; create-mode portion of US16
   - **Acceptance criteria**:
     1. The standalone and linked ENTITY-to-CAST create flows expose keyboard-operable, accessibly named Copy Draft Prompt and Import Draft actions.
     2. Copy writes exactly the versioned core prompt and gives accessible success or failure feedback; it makes no provider or other network request.
     3. Import presents a paste affordance, applies only returned valid fields, leaves absent fields untouched, and always preserves the form's existing or pre-bound `entity_id`.
     4. Before any non-empty form value is replaced, a confirmation names exactly the affected fields. Declining it leaves the form unchanged.
     5. After confirmation, the UI renders the three-band filled/skipped/needs-author report, including skip reasons, uncertainty text, and invented-field indicators.
     6. The prefilled form remains an unsaved draft. Only the existing explicit save action can write a record; cancel or navigation clears paste, report, and unsaved import state without project-store, working-set, prompt-context, or browser-storage residue.
   - **Test seam**: `@loom/web` editor-component interactions for clipboard behavior, dialog and recovery states, exact overwrite confirmation, report bands, partial merge, standalone and linked `entity_id` preservation, explicit save, cancellation/navigation cleanup, keyboard use, and accessible names; assert no fetch/provider call or persistent-browser-storage write.

4. **Extend safe Cast Member draft import to edit mode**
   - **Blocked by**: Slice 3
   - **User stories covered**: US14; edit-mode completion of US1, US7, and US15-US19
   - **Acceptance criteria**:
     1. Existing Cast Member dossiers expose the same Copy Draft Prompt and Import Draft actions without duplicating core parsing or merge policy.
     2. Import preserves the existing `entity_id`, leaves absent fields untouched, and requires the exact-field overwrite confirmation before changing any populated draft value.
     3. Imported edits remain visibly unsaved, render the same three-band provenance report, and reach the record only through explicit save.
     4. Cancel or navigation restores residue-free behavior: no automatic record mutation, persistence, prompt participation, provider call, or browser-storage residue.
   - **Test seam**: `@loom/web` edit-mode component tests over safe merge, confirmation accept/decline, `entity_id` preservation, report rendering, explicit save, cancellation/navigation, keyboard operation, accessible names, and absence of network or persistence side effects.

5. **Archive the superseded Cast Member field guide**
   - **Blocked by**: Slice 4
   - **User stories covered**: N/A — this owns the explicit documentation-and-archival closeout requirement
   - **Acceptance criteria**:
     1. `reports/cast-member-record-field-guide.md` remains operational until Slices 1-4 are complete, then moves to the archive according to `docs/archival-workflow.md` as superseded by the new prompt-template authority.
     2. Active-doc registration and repository references point to the new authority without leaving a duplicate active authority or reviving archived v1 guidance.
     3. The archival change does not alter the ratified invention policy or any runtime behavior.
   - **Test seam**: repository doc/registry checks plus targeted reference searches confirm one active authority, the archived guide at its governed destination, and no stale active links.

## Coverage and dependency gate

| Source coverage | Owning slice(s) |
| --- | --- |
| US1 | 1 defines the copy payload; 3 exposes it; 4 extends it to edit mode |
| US2-US6 | 1 |
| US7 | 3, then 4 for edit mode |
| US8-US10 | 2, exercised through 3 and 4 |
| US11-US12 | 2 produces report data; 3 and 4 render it |
| US13 | 3 |
| US14 | 4 |
| US15 | 3 and 4 |
| US16 | 2 omits absent fields; 3 and 4 preserve existing values during merge |
| US17-US19 | 3 and 4 |
| US20 | 1 |
| New authority and field-guide archival | 1 and 5 |
| No server/schema/compiler/prose-template/validation expansion | boundary asserted in Slices 1-4 |

The implementation order is `1 -> 2 -> 3 -> 4 -> 5`; Slice 3 requires both core products. There is no same-wave claim and no hidden server slice.

For the parent-supplied browser checklist, final staged-body validation must map entry and availability to Slice 3 AC1 and Slice 4 AC1; visible states/actions/outcomes to Slice 3 AC2-AC6 and Slice 4 AC2-AC4; validation/warning/error/recovery to Slice 2 AC2-AC5 and Slice 3 AC3-AC5; prompt contents/freshness to Slice 1 AC1-AC4 and Slice 3 AC2; the external-LLM boundary to Slice 3 AC2/AC6 and Slice 4 AC4; canon/prose visibility and persistence/provenance to Slice 3 AC5-AC6 and Slice 4 AC3-AC4; and browser/accessibility regression to both UI test seams. Before publication, the run sheet should replace these shorthand references with verbatim excerpts from the staged bodies.

## Publication checkpoint

- **Decision scan:** The snapshot says every product decision and testing seam is ratified and no follow-on is deferred. I propose ratifying two bounded implementation choices here: metadata keys `uncertainties`/`invented_fields`, and rejection without form changes when envelope extraction finds multiple plausible JSON objects. The exact ratified filename for the new authority is an evidence gap in this snapshot, not an invitation to choose a new name.
- **Source relationship:** Child mode under PRD #117. Each body should identify #117 as its parent and use the blocker chain above.
- **Parent disposition:** Leave #117 closed and leave its `enhancement` and `needs-triage` labels unchanged. I recommend one `# Child Issue Map` comment because future implementers otherwise have to reconstruct the contract ownership, story split, dependency chain, and artifact gate.
- **Source/target posture:** The supplied source is sufficient for behavior and boundaries, but the offline corpus does not verify current implementation claims. Targets are `@loom/core`, the Cast Member editor in `@loom/web`, active documentation, and archival workflow; there is explicitly no server, schema, compiler, prose-template, validation-rule, provider, or persistence target.
- **Prerequisite posture:** The only pre-creation gate is to resolve a publication ref, verify the claimed durable determination artifact, and recover the already-ratified authority filename. Then the five implementation blockers are exactly the order shown above. If the artifact or ratified path cannot be verified, stop rather than inventing it.
- **Publication posture:** This is recommendation only. After approval and the artifact gate, stage and validate five bodies, reconcile exact-title duplicates, create them serially in dependency order, verify each readback, and post the approved child map. Proposed labels for each child are `enhancement` plus `ready-for-agent`; declared blockers still govern execution order.
- **Artifact posture:** See the inventory below. No local artifact is represented as durable from this offline snapshot.
- **Coverage gate:** All 20 stories and every explicit documentation, testing, residue, locality, linkage, and unchanged-boundary requirement have an owner above. Publication is blocked if staged-body validation loses any mapping.

| Artifact | Exact path or stable identifier | Role | Publication-ref result | Disposition |
| --- | --- | --- | --- | --- |
| PRD #117 | tracker issue `#117` | implementation prerequisite | Supplied tracker snapshot only; no live refresh permitted | Use as child parent; exact-read live state before any real publication |
| PRD-prep determination | `reports/cast-member-draft-import-prd-prep.md` | summarized provenance | Parent claims tracked and visible, but no ref was supplied or verified | Resolve ref and run durability verification before staging; use only to recover the ratified authority filename/evidence |
| Current field guide | `reports/cast-member-record-field-guide.md` | implementation target | Not verified in the offline corpus | Keep operational until Slice 4 completes; archive only in Slice 5 |
| New Cast Member draft prompt authority | Ratified path not present in the supplied snapshot | planned artifact | Not yet authored and therefore non-durable | Recover, do not invent, its exact ratified path; create and register it in Slice 1 |

Please confirm the five-slice granularity and blocker order; the two proposed implementation choices; child mode and child labels; leaving the closed parent and its labels unchanged; the artifact verification gate; and posting the child-map ledger. If you decline the ledger, please also say whether its durability and ownership rationale should go into Slice 1 under `## Breakdown decisions` or intentionally stay out of the tracker.

An explicit **“Approve as proposed”** authorizes no parent-label transition; creation of the five child issues under #117 in the order Slice 1, Slice 2, Slice 3, Slice 4, Slice 5, each labeled `enhancement` and `ready-for-agent` with the blockers above; and one `# Child Issue Map` comment on #117 after the artifact gate, while leaving #117 closed and its existing labels unchanged.

