# Recommendation: resolve one source-path fact, then publish self-contained children

Do not create issues yet. PRD #117 contains enough durable, tracker-visible requirements for the children to stand alone without linking to the preparation report. However, the PRD says the report contains the exact ratified filename for the new prompt-template authority, and the scenario establishes that report is untracked and absent from `origin/main`. That filename must not be guessed or represented as reachable.

Recommended resolution: at this checkpoint, supply or ratify the exact repo-relative path for the new authority document and place that path directly in the first child. The children should not cite `reports/cast-member-draft-import-prd-prep.md`. If the exact path cannot be ratified here, stop publication until the report is tracked, clean, visible at the chosen publication ref, and byte-identical there. No commit, URL, or visibility claim is implied now.

## Proposed family

1. **Copy a schema-complete Cast Member draft prompt**
   - **Blocked by**: ratification of the exact new authority-document path
   - **User stories covered**: US1-US6, US20
   - **Observable seam**: a deterministic, versioned `@loom/core` template covers every fillable Cast Member field and the required JSON/invention/uncertainty contract; schema drift fails a test; create, linked-create, and edit editors copy only static record-free text through an accessible control. The exact-path authority document is added and registered in the active-doc registry.

2. **Import tolerant external drafts into new Cast Member forms**
   - **Blocked by**: Copy a schema-complete Cast Member draft prompt
   - **User stories covered**: US7-US13, US17-US19
   - **Observable seam**: pure core tests accept fenced or prose-wrapped JSON, retain valid fields independently, and report specific reasons for invalid, unknown, empty, or injected `entity_id` values; component tests cover paste, the three-band report, linked-entity preservation, explicit save, cancel/navigation residue, accessible operation, and absence of server/provider calls.

3. **Merge imports safely into existing or populated dossiers**
   - **Blocked by**: Import tolerant external drafts into new Cast Member forms
   - **User stories covered**: US14-US16; re-verifies US13, US17, and US18 at the merge boundary
   - **Observable seam**: edit-mode and already-populated-form tests prove absent fields remain untouched, non-empty replacements require a confirmation naming the exact affected fields, cancellation preserves prior values, and `entity_id` remains unchanged. Once the complete workflow ships, archive `reports/cast-member-record-field-guide.md` as superseded under the repository workflow.

**Prefactoring verdict:** no separate prefactor. The core template/output contract belongs in slice 1 and the pure parser/report contract belongs in slice 2; extracting either without its observable UI would create a half-delivered unit.

## Approval checkpoint

- **Decision scan:** The PRD declares the behavior and test seams ratified. One publication-blocking fact is unavailable: the exact authority-document path. Ratifying that path here is bounded implementation latitude; otherwise the report must first become durable.
- **Source relationship:** Child mode; all three issues implement closed PRD #117. They derive requirements from its body, not from the local report.
- **Parent disposition:** Leave #117 closed and leave its labels unchanged. Do not reopen, relabel, or comment without authorization. Because this is a multi-child family, I recommend an authorized `# Child Issue Map` comment after all children verify.
- **Source/target posture:** #117 remains the durable requirements summary. Each child must restate its complete acceptance contract and exclusions; none may claim the local report is tracker-reachable. No server surface, schema change, prose-compiler change, persistence of assistance output, or automatic save is introduced.
- **Prerequisite posture:** The exact authority path is a pre-publication blocker. After it is ratified, publish in the order 1, 2, 3; those dependencies reflect the shared output contract and then the existing-form extension.
- **Publication posture:** Recommendation only; no staging or tracker mutation has occurred. After approval and exact-path resolution, create three issues serially with `enhancement` and `ready-for-agent`, verify each before continuing, then post and verify the child map. If the path remains unresolved, create nothing rather than publishing misleading `needs-triage` children.
- **Artifact posture:** `reports/cast-member-draft-import-prd-prep.md` is **summarized provenance**, currently untracked and not visible at the publication ref; disposition: omit it from child citations, or make it durable before use. The new authority document is a **planned artifact** whose exact path awaits ratification. `reports/cast-member-record-field-guide.md` is an **implementation target** for final archival; its live durability must be checked before final bodies are staged, because this offline snapshot does not prove it.
- **Coverage gate:** US1-US20 are owned by the three slices. The PRD's browser checklist maps to slice 1 for entry point, prompt contents/freshness, external-LLM boundary, and accessibility; slice 2 for states, validation/recovery, canon/provenance, persistence, and accessibility; and slice 3 for overwrite warning/recovery, persistence, and accessibility. Final staged bodies still need verbatim AC-to-checklist mappings before publication.

Please confirm the three-slice granularity and dependency order, provide or ratify the exact authority-document path, approve child mode with `enhancement` plus `ready-for-agent`, confirm that #117 stays closed and unchanged, confirm omission of the non-durable report, and approve posting the child-map ledger.

Approval of that checkpoint would authorize exactly: no parent-label transition; creation of the three named child issues with `enhancement` and `ready-for-agent` in dependency order 1 then 2 then 3; omission of the untracked report from their citations; and one verified `# Child Issue Map` comment on #117 after all three children verify.

