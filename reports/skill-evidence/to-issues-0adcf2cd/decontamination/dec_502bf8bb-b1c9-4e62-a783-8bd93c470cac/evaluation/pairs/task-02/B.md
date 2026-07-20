# Recommendation checkpoint for PRD #84

I recommend five child issues in three dependency waves. The prefactor is justified: it moves the already-correct Ideate behavior onto one reusable full-label seam without changing prompt bytes, leaves a coherent verified state, and lets the three defect-bearing surfaces proceed independently. The capstone owns the cross-pillar regression once; the surface issues retain only their focused goldens.

## Proposed family

1. **Canonicalize payload-derived prompt labels on the Ideate path**
   - **Blocked by**: none
   - **User stories covered**: US8, US13
   - **Scope**: Extract or designate one pure payload-to-full-label contract and keep Ideate on it. This issue owns the shared contract; later issues consume it rather than adding surface-local label semantics.
   - **Acceptance criteria**:
     - Ideate uses the shared derivation with no stored-browse-label fallback and no change to prompt bytes, citation-key shape, citation ordering, source profile, or escaping for equivalent inputs.
     - A deliberately conflicting stored browse label and payload-derived label proves that the complete payload-derived value wins.
     - Existing Ideate behavior is captured before/reflected through the refactor, and scoped core tests plus the applicable changed-source assurance pass.
   - **Test seam**: shared-derivation unit coverage plus the existing Ideate compiler/golden seam.

2. **Order Prose records by complete payload-derived labels**
   - **Blocked by**: Canonicalize payload-derived prompt labels on the Ideate path
   - **User stories covered**: US7
   - **Scope**: Route the Prose label comparison/tie-break through the shared contract; do not change Prose sources, serialization, or the final record-id tie-break.
   - **Acceptance criteria**:
     - Two labels with the same first 80 characters, different suffixes, and ids arranged opposite to label order sort by complete labels and use id only after full-label equality.
     - Conflicting browse labels cannot influence Prose prompt ordering.
     - Identical inputs remain byte-for-byte deterministic, including existing escaping and record-type ordering.
   - **Test seam**: focused Prose ordering unit/golden coverage with the adversarial same-prefix fixture.

3. **Serialize complete labels in Segment Reconciliation records and stubs**
   - **Blocked by**: Canonicalize payload-derived prompt labels on the Ideate path
   - **User stories covered**: US1, US3
   - **Scope**: Apply the shared contract to in-scope records and out-of-scope reference stubs, update the Segment Reconciliation template authority and applicable version/goldens, and remove contradictory duplicate label fields rather than retaining an alias.
   - **Acceptance criteria**:
     - Full records serialize one authoritative complete label and contain no truncated browse-label variant.
     - Stubs remain minimal id/type/complete-label records, non-targetable, and do not import the referenced payload or any new source.
     - Citation keys, source counts, escaping, metadata/fingerprints, and deterministic output remain unchanged except for the corrected label bytes.
   - **Test seam**: snapshot-builder fixtures plus the Reconciliation compiler golden seam, including conflicting stored/full labels.

4. **Serialize complete labels in Record Hygiene records and references**
   - **Blocked by**: Canonicalize payload-derived prompt labels on the Ideate path
   - **User stories covered**: US4, US5, US6
   - **Scope**: Apply the shared contract to record blocks and incoming/outgoing reference summaries, update the Record Hygiene template authority and applicable version/goldens, and preserve every source-profile exclusion.
   - **Acceptance criteria**:
     - Each Hygiene record exposes one authoritative complete label; incoming and outgoing references use complete labels and never emit the conflicting stored variant.
     - ENTITY and CAST MEMBER labels may be derived, but their excluded payload fields remain absent; no accepted prose, candidate, note, hidden state, or out-of-scope payload becomes a source.
     - Citation keys, source counts, ordering, escaping, and deterministic output remain stable apart from corrected label bytes.
   - **Test seam**: snapshot-builder fixtures plus Hygiene compiler goldens for records, incoming references, outgoing references, and excluded payload types.

5. **Lock the full-label invariant with one cross-pillar regression and shared authorities**
   - **Blocked by**: Order Prose records by complete payload-derived labels; Serialize complete labels in Segment Reconciliation records and stubs; Serialize complete labels in Record Hygiene records and references
   - **User stories covered**: US2, US9-US12, US14-US18
   - **Scope**: Own the one family-level regression matrix, shared compiler/schema authority wording, and final version/golden/assurance audit. Do not recreate each surface's focused tests here.
   - **Acceptance criteria**:
     - One matrix proves Prose, Ideate, Hygiene, and Reconciliation all ignore conflicting browse labels for model-facing text and ordering while preserving their distinct source profiles.
     - Fixtures cover long belief/fact/event/pressure labels, equal 80-character prefixes, opposite ids, `<`, `>`, `&`, Unicode, and punctuation; repeated identical inputs produce identical bytes and citation order.
     - Prompt inspection contains no truncated variant, labels are never shortened for budget pressure, and existing oversize fail/warn behavior remains the only size policy.
     - `docs/compiler-contract.md`, `docs/story-record-schema.md`, both assistance template authorities, applicable versions, and affected goldens agree on one current complete-label contract with no compatibility alias.
     - Record-list UI/browse labels, server/API behavior, stored record shape, citation formats, record-type ordering, provider behavior, and source boundaries are unchanged.
     - Scoped coverage and changed-source mutation obligations are complete for every changed locked-pillar source, with Reconciliation retaining its documented advisory/deferred posture, and the canonical lint, typecheck, test, and build gates pass.
   - **Test seam**: a single cross-pillar compiler matrix plus authority/version/golden consistency review and canonical repository gates; no browser or external-LLM test.

Dependency waves are therefore:

- **Wave 1**: issue 1.
- **Wave 2, parallel**: issues 2, 3, and 4 after issue 1 is verified.
- **Wave 3**: issue 5 after all Wave 2 issues are verified.

## Checkpoint postures

- **Decision scan:** The supplied parent says all product, mechanism, testing-seam, and label decisions are ratified; no blocking open decision appears in the supplied body. Exact helper/test-file placement is implementation latitude constrained by the acceptance criteria. Because live code and comments were intentionally unavailable in this offline trial, the first issue must prove the claimed existing Ideate behavior rather than treating it as independently verified current state.
- **Source relationship:** Child mode. All five issues implement PRD #84. The separately mentioned candidate-intake PRD is coordination context, not a technical blocker; its tracker identity was not supplied and must not be invented.
- **Parent disposition:** Keep #84 `CLOSED` with its current `bug` and `needs-triage` labels at this checkpoint. No reopen, relabel, close, or comment is authorized. I recommend a child-map ledger on #84 if publication is later approved because the three waves, shared-contract owner, story allocation, and capstone ownership would otherwise have to be reconstructed.
- **Source/target posture:** Changes stay in the platform-free compiler/core and its active authorities/tests. Web browse-label behavior, storage shape, server/API behavior, provider transport, accepted/candidate prose, citation contracts, and all assistance source profiles are explicit unchanged boundaries.
- **Prerequisite posture:** Issue 1 is the sole prefactor. Issues 2-4 depend only on it and can proceed in parallel. Issue 5 is the sole integration/cross-pillar blocker and depends on all three. No external or candidate-intake dependency is asserted from the supplied evidence.
- **Publication posture:** Recommendation only. No bodies are staged and no tracker write has occurred. A future authorized run must reconcile exact-title duplicates, create serially in dependency order, exact-read each child, and verify the ledger/family; none of those actions is implied here.
- **Artifact posture:** The tracker body is sufficiently detailed to decompose without a duplicative document blocker. No publication ref was supplied, so none of the named local documents is claimed durable or byte-identical at a ref.
- **Coverage gate:** US1-US18 are each assigned exactly once above. Surface issues own localized behavior and goldens; issue 5 alone owns cross-pillar proof, shared-authority agreement, final assurance, and the unchanged-UI boundary. No story is omitted or delegated to an unnamed future issue.

## Artifact inventory

| Artifact | Exact path or stable identifier | Role | Publication-ref result | Disposition |
|---|---|---|---|---|
| Foundations | `docs/FOUNDATIONS.md` | summarized provenance | Not supplied/checkable in the frozen trial | Do not modify unless an actual conflict is found; no conflict is asserted |
| Compiler contract | `docs/compiler-contract.md` | implementation target | Not supplied/checkable in the frozen trial | Issue 5 owns invariant/order/serialization agreement |
| Story-record schema | `docs/story-record-schema.md` | implementation target | Not supplied/checkable in the frozen trial | Issue 5 owns model-facing-label/source-boundary agreement |
| Reconciliation template | `docs/segment-reconciliation-prompt-template.md` | implementation target | Not supplied/checkable in the frozen trial | Issue 3 updates it; issue 5 verifies family agreement |
| Hygiene template | `docs/story-record-hygiene-prompt-template.md` | implementation target | Not supplied/checkable in the frozen trial | Issue 4 updates it; issue 5 verifies family agreement |
| Robustness policy | `docs/robustness-testing.md` | summarized provenance | Not supplied/checkable in the frozen trial | Apply the parent-summarized assurance posture; verify the live authority before implementation |
| Cross-pillar full-label matrix | stable identifier: `full-label cross-pillar regression` | planned artifact | N/A until its existing/new test path is resolved | Issue 5 is the sole owner; do not duplicate it in issues 1-4 |

Please confirm the five-slice granularity, three-wave dependency graph, child relationship, unchanged parent state/labels, `bug` + `ready-for-agent` labels for the proposed children, and whether the recommended child-map ledger should be posted. If the ledger is declined, please also confirm whether its dependency/story rationale should go into issue 1 under `## Breakdown decisions` or intentionally stay out of the tracker.

Approval would authorize **no parent state or label transition**, creation of these five `bug` + `ready-for-agent` children in Wave 1 → parallel Wave 2 → Wave 3 order, exact child relationships to #84, and—if accepted—the child-map ledger comment on #84; the present prompt authorizes none of those tracker actions.

