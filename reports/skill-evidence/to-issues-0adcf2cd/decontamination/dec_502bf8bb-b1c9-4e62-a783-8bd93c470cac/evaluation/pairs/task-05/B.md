# Recommendation checkpoint for PRD #117

Do not treat `reports/cast-member-draft-import-prd-prep.md` as published or tracker-reachable. In this scenario it is untracked and absent from `origin/main`. The PRD body durably records almost all implementation decisions, so the code-bearing children can stand on PRD #117 plus tracked authorities; however, the exact ratified filename for the new prompt authority exists only in the pending report. That missing fact must be made durable before implementation depends on it.

Recommended breakdown:

1. **Title**: Publish the Cast Member draft-import authority decision
   - **Blocked by**: none
   - **User stories covered**: N/A — documentation/durability prerequisite
   - **Staged acceptance**: review and either commit the cited prep report or restate its implementation-critical conclusion in a durable tracker/authority surface; record the exact prompt-authority path; prove the resulting source is visible and content-identical at the publication ref. No invented commit, URL, or filename.

2. **Title**: Copy a schema-synchronized Cast Member draft prompt
   - **Blocked by**: 1
   - **User stories covered**: US1-US6, US20
   - **Staged acceptance**: add the deterministic versioned core template, its registered authority document, schema-drift tests, and accessible create/edit copy affordance; copied text contains no project records, `entity_id`, provider call, or compiler change.

3. **Title**: Import tolerant drafts into a new Cast Member form
   - **Blocked by**: 2
   - **User stories covered**: US7-US13, US16-US19
   - **Staged acceptance**: pure core parsing/mapping accepts fenced or prose-wrapped JSON, validates independently per field, and reports every skip; the browser prefills only present valid fields, preserves linked `entity_id`, displays the three-band report, writes nothing until Save, and leaves no residue or network activity.

4. **Title**: Safely refresh an existing Cast Member dossier
   - **Blocked by**: 3
   - **User stories covered**: US14-US18
   - **Staged acceptance**: edit-mode import lists exact non-empty overwrites before applying them, leaves absent fields and linkage untouched, remains review-before-save and residue-free, and archives the superseded field guide only when the complete replacement flow ships.

Prefactoring: none; the ratified `@loom/core` pure-function seam and existing editor component seam already support these slices.

| Slice | Browser-visible guidance coverage |
|---|---|
| 1 | N/A — authority/durability prerequisite only |
| 2 | entry point and availability; prompt contents/freshness; external-LLM boundary; keyboard/accessibility |
| 3 | visible states/actions/outcomes; validation/recovery; canon/provenance; persistence; keyboard/accessibility |
| 4 | overwrite warning/recovery; save/cancel outcomes; persistence/residue; keyboard/accessibility |

Decision scan: supplied issue snapshot; `pending authoring` is a real planned artifact and the report's historical visibility claim is superseded by the scenario. No other open design decision is stated.

Source relationship: child issues implementing closed PRD #117.

Parent disposition: leave #117 closed with `enhancement` and `needs-triage`; no label change, reopen, comment, or closure action is authorized.

Source/target posture: #117 is the durable product-decision source; create the four issues above only after approval. Code children must cite #117, tracked authorities, and slice 1—not claim the local report is currently reachable.

Prerequisite posture: slice 1 is a hard blocker; then 2, 3, and 4 proceed in order. No other blocker is supplied.

Publication posture: proposed labels are `enhancement` and `needs-triage`; publish in 1→2→3→4 order only after approval. Recommend a parent child-map comment because it preserves the artifact and dependency decision, but posting it also requires explicit authorization.

Artifact posture: publication ref `origin/main`; two-row inventory: the prep report is summarized provenance, untracked and absent, so non-durable; the prompt-authority document is a planned artifact whose exact path is unresolved. Slice 1 must make the missing decision durable before dependent work can be AFK-ready.

Coverage gate: all US1-US20 are assigned; all eight browser-visible checklist themes in the PRD are staged across slices 2-4, with slice 1 specifically N/A.

Does this four-slice granularity and dependency chain feel right? Please approve either (a) the recommended slice-1 durability blocker, or (b) supplying and ratifying the exact prompt-authority filename now so the parent/first child can durably carry that fact without publishing the prep report. Approval must also explicitly cover the parent-child ledger comment. This offline trial makes no tracker mutation.

