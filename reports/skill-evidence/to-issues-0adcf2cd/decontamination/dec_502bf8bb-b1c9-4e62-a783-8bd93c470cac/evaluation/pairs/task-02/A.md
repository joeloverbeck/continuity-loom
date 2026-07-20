Using the supplied offline snapshot, I would decompose PRD #84 into four child issues. The dependency shape is one shared-contract/prose owner, two assistance-surface slices that can then proceed in parallel, and one assurance capstone that alone owns the cross-pillar regression proof.

The snapshot contains the ratified PRD body but no comments payload. This is enough for the requested offline recommendation; before any real publication, the parent body, fresh comments, labels, existing children, exact-title duplicates, house style, and parent-ledger precedent would have to be re-read from the tracker. No tracker read or write is claimed here.

1. **Title**: Make payload-derived full labels authoritative in the shared compiler contract and Prose ordering
   - **Blocked by**: none
   - **User stories covered**: US7, US11, US12, US13, US16, US18
   - **Staged acceptance criteria**:
     1. One canonical payload-derived full-label behavior owns every model-facing label and label-based ordering input changed by this PRD; no stored browse-label fallback or parallel truncated/full compatibility alias remains. If live inspection shows that no single reusable seam currently exists, this issue owns extracting it rather than letting later surfaces invent separate semantics.
     2. Prose ordering is proved with at least two records whose stored labels share the first 80 characters, whose full-label suffixes differ, and whose ids are opposite the expected label order; full labels sort before the final id tie-break.
     3. Full labels remain uncompressed under prompt-size pressure, existing oversize fail/warn policy remains responsible for size handling, and identical inputs preserve identical bytes, escaping, and ordering.
     4. `docs/compiler-contract.md` and `docs/story-record-schema.md`, their relevant version/change-control surfaces, and focused Prose fixtures are updated with the same shared contract; `docs/FOUNDATIONS.md` remains unchanged.
     5. Stored browse labels and record-list/search/editor presentation remain unchanged and concise.

2. **Title**: Apply complete labels to Segment Reconciliation records and reference stubs
   - **Blocked by**: 1. Make payload-derived full labels authoritative in the shared compiler contract and Prose ordering
   - **User stories covered**: US1, US2, US3
   - **Staged acceptance criteria**:
     1. Reconciliation full-record serialization consumes the shared payload-derived label and emits one authoritative complete label; the conflicting stored browse-label variant is absent.
     2. Out-of-scope reference stubs use complete labels while remaining id/type/label-only, non-targetable, and free of the referenced record's excluded payload.
     3. Snapshot-builder and Reconciliation golden tests use deliberately conflicting stored/full labels and prove complete record/stub text, truncated-form exclusion, unchanged source counts, citation keys, escaping, prompt fingerprints, and deterministic output.
     4. `docs/segment-reconciliation-prompt-template.md` and the relevant template/compiler version and golden fixtures change with this surface; the cross-pillar matrix is explicitly left to issue 4.
     5. No accepted prose, candidate, note, hidden state, out-of-scope payload, or new proposal target enters the Reconciliation source profile.

3. **Title**: Apply complete labels to Record Hygiene records and reference summaries
   - **Blocked by**: 1. Make payload-derived full labels authoritative in the shared compiler contract and Prose ordering
   - **User stories covered**: US4, US5, US6
   - **Staged acceptance criteria**:
     1. Each Hygiene record block, ordering input, citation input, and model-facing label consumes the shared payload-derived label and exposes no competing stored browse label.
     2. Incoming and outgoing reference summaries use complete labels while ENTITY and CAST MEMBER payloads remain excluded; label derivation does not authorize any additional payload field.
     3. Hygiene golden tests use deliberately conflicting stored/full labels and prove one authoritative complete label, complete incoming/outgoing summaries, truncated-form exclusion, unchanged citation/source counts, escaping, and deterministic output.
     4. `docs/story-record-hygiene-prompt-template.md` and the relevant template/compiler version and golden fixtures change with this surface; the cross-pillar matrix is explicitly left to issue 4.
     5. No accepted prose, candidate, note, hidden state, ENTITY/CAST MEMBER payload, or other new source enters the Hygiene source profile.

4. **Title**: Prove the full-label invariant across Prose, Ideate, Hygiene, and Reconciliation
   - **Blocked by**: 1. Make payload-derived full labels authoritative in the shared compiler contract and Prose ordering; 2. Apply complete labels to Segment Reconciliation records and reference stubs; 3. Apply complete labels to Record Hygiene records and reference summaries
   - **User stories covered**: US8, US9, US10, US14, US15, US17
   - **Staged acceptance criteria**:
     1. One cross-pillar matrix, owned only by this issue, feeds conflicting stored/full labels through Prose, Ideate, Hygiene, and Reconciliation and proves every model-facing text and ordering surface ignores the stored browse-label value; Ideate's existing full-label citation behavior and source profile remain unchanged.
     2. Prompt-inspection/golden readback contains complete labels and no truncated browse-label variant, including two long same-prefix labels whose suffixes determine order.
     3. Integrated regression cases cover `<`, `>`, `&`, Unicode, and punctuation and preserve canonical payload JSON, escaping, type ordering, id final tie-breaks, citation-key shapes, source counts, prompt fingerprints, non-targetable Reconciliation stubs, and Hygiene payload exclusions.
     4. The capstone verifies that compiler, schema, both assistance templates, relevant versions, and affected goldens agree on the one contract; it does not reopen UI browse-label behavior or introduce a second label derivation.
     5. Scoped core coverage and changed-source mutation evidence are recorded for every changed locked-pillar source, retaining Reconciliation's documented advisory/deferred pre-activation posture, and `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.

The implementation waves are therefore:

| Wave | Issues | Parallelism |
|---|---|---|
| 1 | 1 | Shared contract and Prose correction establish the only reusable label seam. |
| 2 | 2 and 3 | Reconciliation and Hygiene can be implemented in parallel once issue 1's contract is available. |
| 3 | 4 | The capstone runs only after all three producer slices; it owns the single cross-pillar matrix and integrated assurance evidence. |

Prefactoring: no separate prefactor issue is needed. Issue 1 includes the bounded consolidation required to make the shared label seam real and delivers the complete Prose-ordering correction, avoiding a half-migrated helper-only issue.

The source's first program entry (user-supplied candidate intake) is coordination-only for this family: PRD #84 calls it a trial-run blocker but also says the two PRDs are technically independent. It does not block any of these four implementation issues.

### Browser-visible guidance mapping

This changes prompt-inspection bytes but not browser navigation or interaction. The deterministic snapshot/compiler seams remain the acceptance boundary, so no new browser smoke is owed.

| Slice | Checklist item | Covered by staged AC | N/A reason |
|---|---|---|---|
| All | package source cited | - | Repository-native compiler defect; no external methodology package governs it. |
| 1 | decision-point contract named | AC 1 - "One canonical payload-derived full-label behavior owns every model-facing label and label-based ordering input" | - |
| 2 | decision-point contract named | AC 1 - "Reconciliation full-record serialization consumes the shared payload-derived label" | - |
| 3 | decision-point contract named | AC 1 - "Each Hygiene record block, ordering input, citation input, and model-facing label consumes the shared payload-derived label" | - |
| All | required, optional, skippable, and severity-dependent fields visible | - | No author-entered instrument or skippable field changes. |
| 1 | doctrine at the actual decision point | AC 4 - "`docs/compiler-contract.md` and `docs/story-record-schema.md` ... are updated with the same shared contract" | - |
| 2 | doctrine at the actual decision point | AC 4 - "`docs/segment-reconciliation-prompt-template.md` ... change[s] with this surface" | - |
| 3 | doctrine at the actual decision point | AC 4 - "`docs/story-record-hygiene-prompt-template.md` ... change[s] with this surface" | - |
| 4 | prompt packet preview, source manifest, and cold external LLM test | AC 2 - "Prompt-inspection/golden readback contains complete labels and no truncated browse-label variant"; AC 3 preserves source counts and boundaries | Cold external LLM behavior does not change and no external call is required. |
| 2 and 3 | advisory/canon separation visible | Slice 2 AC 5 and slice 3 AC 5 preserve the assistance source profiles and add no canon source | - |
| All | skip path and reason storage | - | Deterministic compiler correction has no user-declinable instrument or stored skip reason. |
| 4 | blockers/substance validation | AC 1 - "One cross-pillar matrix ... proves every model-facing text and ordering surface ignores the stored browse-label value"; AC 5 owns assurance gates | - |
| All | current, next, and resume state | - | No workflow or resume transition changes. |
| 4 | read-side audit or provenance link | AC 2 - "Prompt-inspection/golden readback contains complete labels and no truncated browse-label variant" | - |
| 4 | cognitive walkthrough scenario | AC 2 - "including two long same-prefix labels whose suffixes determine order" | - |

### Artifact inventory

No pending, untracked, session-created, or not-yet-authored source artifact is named by the supplied PRD. The six cited repository authorities still need publication-ref identity verification before a real publication run because this offline corpus does not supply a ref or file state.

| Artifact | Exact path | Role | Publication-ref result | Disposition |
|---|---|---|---|---|
| Foundations | `docs/FOUNDATIONS.md` | implementation prerequisite | Not evaluated in offline snapshot | Verify unchanged and durable before publication; no issue proposes amending it. |
| Compiler contract | `docs/compiler-contract.md` | implementation target | Not evaluated in offline snapshot | Issue 1 owns the required contract correction and version posture. |
| Story-record schema | `docs/story-record-schema.md` | implementation target | Not evaluated in offline snapshot | Issue 1 owns the model-facing-label correction while preserving source boundaries. |
| Reconciliation template | `docs/segment-reconciliation-prompt-template.md` | implementation target | Not evaluated in offline snapshot | Issue 2 owns the surface-specific update. |
| Hygiene template | `docs/story-record-hygiene-prompt-template.md` | implementation target | Not evaluated in offline snapshot | Issue 3 owns the surface-specific update. |
| Robustness testing | `docs/robustness-testing.md` | implementation prerequisite | Not evaluated in offline snapshot | Issue 4 consumes its coverage/mutation policy without redefining behavior. |

Decision scan: supplied offline PRD body; the ratification preamble and final note say no product, mechanism, testing-seam, or label decision remains open to veto. The modal-language hits describe allowed test retention and technical independence, not open decisions. One implementation premise could not be code-verified in this corpus: approval should ratify issue 1's ownership of consolidating the canonical derivation if the live code has more than one seam.

Source relationship: child mode; all four proposed issues implement PRD #84.

Parent disposition: supplied state is CLOSED with `bug` and `needs-triage`; it is not an AFK-ready competing owner, so no parent label transition or reopen is proposed. Any later parent comment would require explicit authorization.

Source/target posture: authoritative source is the supplied PRD #84 body; the exact target set is the four titled child issues above, with no candidate-intake issue and no UI browse-label issue added.

Prerequisite posture: hard blockers are issue 1 before issues 2 and 3, then issues 1-3 before issue 4; issues 2 and 3 are same-wave parallel work. Candidate intake is coordination-only. No other external implementation prerequisite is asserted; fresh comments and live premise/durability checks remain pre-publication verification gates.

Publication posture: if separately authorized after this checkpoint, publish in waves 1, 2, 3 with labels `bug` and `ready-for-agent`; preserve the exact child relationship to #84. A parent `# Child Issue Map` ledger is recommended after creation because the shared-contract owner, parallel wave, capstone owner, and source-boundary decisions would otherwise live only in chat, but no ledger precedent was available in the supplied offline corpus and posting it requires explicit authorization.

Artifact posture: publication ref unavailable; six local artifact rows inventoried. No pending/local-only source is represented as durable. Before publication, verify all six exact paths against the resolved publication ref; a failed prerequisite/summary check must be routed to a document blocker or durable issue-linked summary, while implementation targets remain owned by issues 1-3 as listed.

Coverage gate: US1-US18 are all assigned across the four slices; the four compiler/assistance surfaces are Prose (1), Reconciliation (2), Hygiene (3), and Ideate plus integrated cross-pillar proof (4). Prompt-inspection guidance is mapped above; browser workflow, external-model behavior, and new browser smoke are specifically N/A.

Does this four-slice granularity feel right? In particular:

- Are the wave-1 shared-contract ownership and wave-2 Reconciliation/Hygiene parallelism correct?
- Should any slice be merged or split?
- Do you ratify issue 1 owning bounded consolidation if live inspection finds multiple current full-label seams?
- Is the closed parent posture correct, with no label transition or reopen?
- If publication is separately authorized later, should the proposed parent child-map ledger be posted?

I will stop at this recommendation checkpoint. Approval of the recommendation alone does not authorize tracker changes; a later explicit publication instruction would still be required. Before such publication, the live source/comments, existing children, duplicates, parent state, authority durability, house style, and ledger precedent must be revalidated.

