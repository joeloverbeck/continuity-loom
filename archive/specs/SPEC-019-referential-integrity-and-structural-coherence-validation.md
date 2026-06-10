# SPEC-019 — Referential Integrity and Structural Coherence Validation

**Status**: COMPLETED
**Feature name:** Referential Integrity & Structural Coherence Validation
**Classification:** product-behavior (new deterministic validation blockers/warnings on the prompt-readiness gate, a validation-snapshot shape extension, and same-revision amendments to the compiler contract, validation rule inventory, story-record schema, and stress docs. No compiler-rendering changes; no FOUNDATIONS amendment.)
**Governing authority:** `docs/FOUNDATIONS.md`
**Supporting authorities:** `docs/compiler-contract.md`, `docs/validation-rule-inventory.md`, `docs/story-record-schema.md`, `docs/stress-suite.md`, `docs/stress-coverage-matrix.md`

> Section style note: this spec uses the canonical `specs/` section set parsed by `reassess-spec` and `spec-to-tickets` (Problem Statement, Approach, Deliverables, FOUNDATIONS Alignment, Verification, Out of Scope, Risks & Open Questions).

---

## Brainstorm Context

**Original request.** Ensure a prompt cannot be generated when the combination of generation-brief fields and story records is narratively incorrect or lacking, analyzed in alignment with `docs/**`. Hard constraint from the user: **no heuristic validation** (no checking for certain words in field contents) — only what can truly be validated deterministically.

**Scope decisions (user-confirmed via AskUserQuestion, 2026-06-10).**
1. **Severity for existing-but-unselected referents:** hybrid by requiredness — blocker when the unresolved reference fills a readiness-required or context-gated-required prompt lane (per the compiler-contract §4 requiredness matrix); warning in optional lanes. Nonexistent (dangling) referents and type mismatches are blockers everywhere.
2. **POV reversal:** `pov-character-not-selected` follows the chosen posture. `{pov_character}` is a readiness-required line, so an unselected POV referent becomes a **blocker**, deliberately reversing the documented must-not-block warning row in `docs/compiler-contract.md` §6. The contract row is amended in the same revision.
3. **Deletion-dangling brief references:** validation-only. Do **not** extend pruning to user-authored brief fields; the dangling-reference blocker catches deletions with a legible, actionable diagnostic. `pruneWorkingSetReferences` stays as-is.
4. **Snapshot extension:** add a deterministic, validation-only project record index (record id → record type) to `ValidationSnapshot` so validation can distinguish dangling (deleted/nonexistent) from existing-but-unselected and emit precise diagnostics. The compiler must never read it.

**Premise verification (all verified directly against the working tree, 2026-06-10):**
- `packages/core/src/compiler/labels.ts:8-16` — `resolveRecordLabel` falls back to the raw id when the referenced record is not in the snapshot.
- `packages/core/src/records/working-set-integrity.ts:55-75` — pruning covers only `active_working_set` fields; `current_authoritative_state` references are never pruned on record deletion.
- `packages/core/src/records/generation-brief.ts:33-36,41` — `current_location: recordId | nonemptyString`; `onstage_entities: recordId[]`; `offstage_pressuring_entities: recordId[]`; `entity_statuses: nonemptyString | recordId[]`.
- `packages/core/src/validation/snapshot.ts:42-47` — `ValidationSnapshot` carries only `records` (selected), `generationSession`, `storyConfig`, `versions`; no project-wide existence knowledge.
- `packages/server/src/snapshot-builder.ts:129-139,52-54` — only `selected_records` gets existence enforcement, failing the whole build with an opaque 422 `malformed-validation-source` body.
- `packages/server/src/snapshot-builder.ts:166-186` — `castBandAssignments` uses one `Map`, so an id appearing in multiple cast bands silently keeps only the last band.
- `packages/core/src/compiler/sections/cast.ts:174-186` — `current_cast_voice_pressure` entries render only via a matched cast member's render loop; entries whose `cast_member_id` matches no rendered cast member are silently dropped (overrides analogous at `:198`).
- `packages/core/src/validation/rules/warnings.ts:19-37` — `pov-character-not-selected` is a warning today.
- `packages/core/src/records/registry.ts:21,53` and per-type `extractReferences` declarations (`entity.ts:61,66`, `causal-pressure.ts:157,170,178,194`, `knowledge.ts:92,101,109`, `relationship-emotion.ts:111,121`, `space-material.ts:94,106`, `cast-member.ts:152`) — a reference-extraction mechanism (`extractRecordReferences`, exported at `packages/core/src/index.ts:166`) already exists and its per-type coverage is **already complete for every recordId-typed payload field** (verified field-by-field, 2026-06-10). It has **no validation consumer**, but it is **not dormant**: `packages/server/src/record-repository.ts:205,258` consume the per-type `extractReferences` to populate a `record_references` table, and `assertNoActiveInboundReferences` (`:516`) gates **archive** (`:320`) and **delete** (`:327`), throwing `RecordIntegrityError` when a record has active inbound references. `incomingReferencesForRecord` (`:480`) counts only non-archived referrers (`r.archived = 0`).
- `packages/core/src/records/relationship-emotion.ts:34-35` — `RELATIONSHIP.from`/`to` are plain `recordId` fields with no self-reference refinement.
- `packages/core/src/records/space-material.ts:53-55,68` — `OBJECT.owner/carried_by: recordId | none/unknown`; `current_location: recordId | carried_by_holder/unknown/offstage`; `AFFORDANCE.available_to: recordId | group/any_onstage`.
- `packages/core/src/records/entity.ts:43-52` — `ENTITY STATUS.location: recordId | unknown/concealed/offstage/not_applicable`.
- `packages/server/src/compile-routes.ts` — `/api/compile` correctly refuses on `validation.isBlocked` (fail-closed gate intact).
- `packages/server/src/record-repository.ts:306` — `listRecords` exists; the project record index is buildable without new storage APIs.
- `packages/core/src/version.ts:33-36` — contract version `1.2.0` (this spec bumps it).
- `packages/core/src/compiler/sections/front.ts:51-56` and `packages/core/src/compiler/sections/records-tail.ts:149-154` — selected `current_location` and record-id-array `entity_statuses` values now resolve through prompt-facing display-label helpers; unresolved values still fall back to raw ids, which this spec validates before compilation.

**Prior-decision coordination.** `docs/narrative-theory-blocker-roadmap.md` is the standing prior decision on this surface: a non-binding candidate list whose promotion requires a §29-clearing spec. This spec deliberately promotes **none** of its candidates — every "partially deterministic" candidate depends on either prose interpretation (barred by the user's no-heuristic constraint and FOUNDATIONS §11) or structured fields that do not exist yet (e.g. structured story time for clock-deadline expiry). The deterministic gap this spec closes — referential and enum-level structural integrity — is not on the roadmap. The 2026-06-09 triage records (`triage/`) cover different surfaces and are untouched; the one prior decision this spec reverses (POV-not-selected as a warning) carries explicit user sign-off (scope decision 2). The `EVENT.sequence_order` deferral stands.

**Research note.** External research was skipped: codebase exploration pinned the gaps statically with `file:line` evidence (pure deterministic `@loom/core` surfaces), and the in-repo roadmap already embodies the narrative-theory research pass for this domain.

---

## Problem Statement

The implemented validation pipeline (50+ deterministic rules) is comprehensive on presence/completeness (is required state filled in?) and covers a handful of contradictions, but the **identity layer** — whether the record ids that wire the generation brief and the selected records together actually point at real, selected, correctly-typed records — is almost entirely unvalidated:

1. Brief fields (`onstage_entities`, `offstage_pressuring_entities`, recordId-form `current_location`, recordId-form `entity_statuses`) are never checked; an unresolvable id compiles as a raw UUID into readiness-required prompt lines (`labels.ts:15`). Record deletion makes this permanent because brief fields are never pruned.
2. Record-internal entity references (`PLAN.holder`, `BELIEF.holder`, `EMOTION.holder`, `INTENTION.holder`, `OBLIGATION.owed_by/owed_to`, `RELATIONSHIP.from/to`, `SECRET.holders/non_holders_to_protect`, `OBJECT.owner/carried_by`, `EVENT.participants/causes/effects`, `ENTITY STATUS.entity_id/location`, `AFFORDANCE.available_to`, `CAST MEMBER.entity_id`) are never validated; the prompt-facing lanes the compiler contract §9 lists as "resolved to display labels" silently degrade to raw ids.
3. Cast-band coherence is unvalidated: one id can sit in multiple bands (last band silently wins), band ids are not checked to be CAST MEMBER records, and `current_cast_voice_pressure`/`cast_voice_overrides` entries whose `cast_member_id` attaches to no rendered cast member are **silently discarded** — user-authored nuance vanishes against FOUNDATIONS §8.
4. Deterministic enum/id cross-record contradictions go undetected: an entity both onstage and offstage-pressuring; an onstage entity whose selected ENTITY STATUS places it `offstage`/`concealed` or at a different location record than the scene; `OBJECT.current_location: "carried_by_holder"` with `carried_by: "none"`; `RELATIONSHIP.from === to`.

All of these are "narratively incorrect or lacking" states that currently compile and send. Every one is detectable by pure id equality, enum equality, or set membership — no text inspection.

## Approach

Add a **referential-integrity and structural-coherence rule family** to the deterministic validation engine, graded by the existing requiredness matrix, and extend the validation snapshot with a project-wide record index so dangling and unselected references are distinguishable.

Reference classification is uniform: every checked reference is `selected` (in `snapshot.records`), `unselected` (in the project record index but not selected), or `dangling` (absent from the index). Severity doctrine, fixed by the user's scope decisions:

- **dangling → blocker** everywhere (FOUNDATIONS §11 clause 3: the brief or a selected record names story state that does not exist);
- **type mismatch → blocker** everywhere (e.g. an `onstage_entities` id resolving to a CLOCK);
- **unselected → blocker** when the reference fills a readiness-required or context-gated-required prompt lane (clause 2: the required line has no truthful deterministic state — a raw UUID is not one); **warning** in optional lanes, generalizing and superseding today's `pov-character-not-selected` pattern.

Record-internal references reuse the existing `extractRecordReferences` infrastructure rather than hand-written walkers. Its per-type declarations are already complete and already consumed server-side for archive/delete integrity (`record_references` table); the new work is a **validation** consumer plus a drift test that locks completeness so a future recordId-typed schema field cannot silently escape validation. Structural-contradiction rules (onstage/offstage overlap, status-location contradiction, object holder incoherence, self-relationship) are plain enum/id comparisons.

**Spec invariant: no content heuristics.** No new rule may inspect, pattern-match, or keyword-scan prose field contents. Permitted operations are exactly: id equality/lookup, record-type comparison, enum comparison, and set membership. This invariant binds ticket decomposition and review.

The compiler is untouched: raw-id fallback rendering remains for optional lanes (now always accompanied by a warning), required lanes never reach the compiler because they block. The compiler must not read the new index — resolving unselected records' labels at compile time would silently include unselected content (§29.3).

## Deliverables

### D1 — Project record index in the validation snapshot
- Extend `ValidationSnapshot` (and `BuildValidationSnapshotInput`) with a validation-only `projectRecordIndex: Readonly<Record<string, string>>` (record id → record type) covering all non-archived project records.
- `packages/server/src/snapshot-builder.ts` populates it via `record-repository.ts` `listRecords`.
- Determinism is preserved: the index is part of the snapshot input; same snapshot → same result. Document in `docs/compiler-contract.md` that the index is a validation-only source the compiler must never read (§9 validation-only list).
- **Salience-size carveout (required):** the `prompt-middle-salience-risk` warning measures `JSON.stringify(snapshot).length > 5000` (`packages/core/src/validation/rules/warnings.ts:40`). Adding `projectRecordIndex` to `ValidationSnapshot` would inflate that measurement and could spuriously trip the warning on existing projects. The salience-size computation must exclude `projectRecordIndex` (measure a projection that omits it), with a regression test proving the index does not move the threshold. See Risk 5.

### D2 — Reference classification helper and severity lane table
- A shared validation helper classifying a reference as `selected` / `unselected` / `dangling` and checking expected record type(s).
- An explicit **severity lane table** (added to `docs/compiler-contract.md` §6) enumerating every checked reference lane, its expected record type(s), and its unselected-case severity derived from the §4 requiredness column. The lane table is the single authority; rules implement it.

### D3 — Brief-field reference rules (new diagnostic codes)
- `onstage-entity-reference-invalid` (blocker): each `onstage_entities` id must exist, be ENTITY-typed, and be selected (readiness-required lane — all three failure modes block).
- `offstage-entity-reference-invalid`: dangling/type-mismatch block; unselected blocks only when offstage pressure/interruption context makes the lane required (context-gated), else warns.
- `entity-statuses-reference-invalid`: recordId-form `entity_statuses` entries must exist and be ENTITY STATUS-typed (blockers); unselected severity context-gated.
- `current-location-reference-invalid`: a `current_location` value that matches the project index must be LOCATION-typed (else blocker) and selected (readiness-required lane → blocker). A value matching nothing in the index is treated as a prose scene-space label (prose passthrough sanctioned by contract §9: "`{current_location}` prose values pass through verbatim when they do not match a selected record") — no diagnostic.

### D4 — Working-set and cast-band coherence rules
- `cast-band-duplicate-membership` (blocker): one id in more than one of `active_onstage_cast_full` / `present_minor_cast_compressed` / `offstage_relevant_cast`.
- `cast-band-reference-invalid` (blocker): band ids must be in `selected_records` and resolve to CAST MEMBER records.
- `selected-pov-reference-invalid`: `selected_pov` dangling or not ENTITY/CAST MEMBER-typed → blocker; existing-but-unselected → blocker (readiness-required lane). Supersedes `pov-character-not-selected`, which is **removed** from the warning set; the contract §6 must-not-block row is deleted in the same revision (user-signed-off reversal, scope decision 2).
- `voice-pressure-attachment-invalid`: `current_cast_voice_pressure[]`/`cast_voice_overrides[]` `cast_member_id` dangling or not CAST MEMBER-typed → blocker; existing but attached to no cast-band member (today's silent-drop case) → warning (optional lane). Either way the silent discard ends.

### D5 — Record-internal reference rules
- `extractReferences` declarations are **already complete** for every recordId-typed payload field across all record types (audited 2026-06-10: `SECRET.holders/non_holders_to_protect` at `knowledge.ts:109`, `OBJECT.owner/carried_by/current_location` at `space-material.ts:94`, `RELATIONSHIP.from/to` at `relationship-emotion.ts:111`, `AFFORDANCE.available_to` at `space-material.ts:106`, `EVENT.participants/causes/effects/known_by` at `causal-pressure.ts:157`, `FACT.known_by` at `knowledge.ts:92`, `ENTITY STATUS.entity_id/location` at `entity.ts:66`, `CAST MEMBER.entity_id` at `cast-member.ts:152`, plus the holder/owed/holder_or_target declarations). **Do not re-add these** — the deliverable is the **drift test** asserting every recordId-typed schema field is either extracted or explicitly exempted with a reason, which converts the current ad-hoc completeness into a guaranteed invariant.
- Wire a **new validation consumer** of `extractRecordReferences` (validation does not consume it today; the only existing consumer is the server's `record_references` integrity table).
- `record-reference-dangling` (blocker): any extracted reference from a selected record whose target is absent from the project index. **Coordination with the existing integrity guard:** `assertNoActiveInboundReferences` already blocks archiving/deleting a record while active records reference it, so a dangling record-internal reference is only reachable via the narrow archived-referrer / archived-target path (`incomingReferencesForRecord` counts only `r.archived = 0`). This rule is the validation-time safety net for that residual state; it must not duplicate or replace the repository's write-time guard.
- `record-reference-type-mismatch` (blocker): extracted reference resolving to a record type outside the lane's expected set.
- `record-reference-unselected`: severity per the D2 lane table — e.g. SECRET holder/non-holder lanes block when the secret is active; PLAN holder blocks when the plan is meant to drive prose or the hidden-plan tag is set; EVENT participants, AFFORDANCE `available_to`, OBJECT owner/carried_by, BELIEF/EMOTION/INTENTION holders, RELATIONSHIP endpoints warn.

### D6 — Structural contradiction rules
- `onstage-offstage-entity-overlap` (blocker): same id in `onstage_entities` and `offstage_pressuring_entities`.
- `onstage-entity-status-contradiction` (blocker): an onstage entity whose selected ENTITY STATUS has `location: "offstage"` or `"concealed"`, or a location recordId that differs from a recordId-form `current_location`. Enum values `unknown`/`not_applicable` do not block.
- `object-location-holder-incoherence` (blocker): `OBJECT.current_location: "carried_by_holder"` with `carried_by: "none"`. (`carried_by: "unknown"` does not block — "someone unidentified has it" is coherent.)
- `relationship-self-reference` (blocker): `RELATIONSHIP.from === to`. Implemented as a validation rule, not a Zod refinement, so already-saved records load and surface a legible diagnostic instead of failing parse (named assumption 1 from the brainstorm).

### D7 — Legible snapshot-build failure for dangling `selected_records`
- `snapshot-builder.ts` currently returns an opaque 422 when a `selected_records` id no longer exists. Make the failure body identify the dangling id(s) and the fix (remove from working set), and surface it in the readiness UI as an actionable diagnostic rather than a generic error. Fail-closed behavior is unchanged.

### D8 — Same-revision doc and version amendments
- `docs/compiler-contract.md`: bump contract pin to `1.3.0` (with `packages/core/src/version.ts` `contract.version`; `template.version` and `compiler.version` stay unchanged since the compiler is untouched); add the D2 severity lane table and new blocker/warning rows to §6; delete the POV must-not-block bullet from the §6 "Warnings that must not block" list **and** amend the §4 `{pov_character}` placeholder-mapping row (line 99), whose missing-behavior cell currently reads "falls back to raw id with a non-blocking `pov-character-not-selected` warning" — both must flip to block on an unresolved/unselected POV referent, or §4 and §6 will contradict each other post-amendment (FOUNDATIONS §8 drift); amend the §9 raw-id paragraph (raw-id fallback persists only in optional lanes and is always warning-surfaced; required lanes block before compilation); note the validation-only project record index in the §9 validation-only list.
- `docs/validation-rule-inventory.md`: add every new diagnostic code with severity and FOUNDATIONS §11 clause mapping; remove `pov-character-not-selected` (superseded by `selected-pov-reference-invalid`); keep the drift test green in the same change.
- `docs/story-record-schema.md`: validation-requirement notes on every field gaining a referential or coherence check.
- `docs/stress-suite.md` + `docs/stress-coverage-matrix.md`: new stress cases covering each new diagnostic code (dangling, unselected-required, unselected-optional, type mismatch, band duplication, onstage/offstage overlap, status-location contradiction, object incoherence, self-relationship, orphaned voice pressure), with matrix rows in the same change.
- No `docs/FOUNDATIONS.md` amendment: §11's hard-validation list is explicitly non-exhaustive, and §6.2/§7 already sanction blocking when required state is structurally missing.

## FOUNDATIONS Alignment

| Principle | Stance | Rationale |
|---|---|---|
| §4.5 / §11 fail closed @ validation gate | aligns | Every new blocker maps to §11 taxonomy clause 2 (required lane lacks truthful deterministic state — a raw UUID is not one) or clause 3 (hard contradiction between selected records/fields). The POV flip is argued under clause 2 and carries explicit user sign-off as a reversal of the contract §6 warning row. |
| §11 deterministic, no-LLM, no semantic inference @ validation | aligns | The spec invariant restricts all new rules to id/enum/set operations; content heuristics are prohibited by construction, honoring the user's constraint. |
| §6.2 / §7 active working set supremacy @ validation gate | aligns | Rules block or warn; nothing silently selects, deselects, prunes, or repairs. Deletion-dangling is surfaced, not auto-cleaned (scope decision 3). |
| §29.3 no silent inclusion @ prompt compilation | aligns | The project record index is validation-only; the compiler never reads it, so unselected records' content and labels never enter the prompt. |
| §8 preserve author-written nuance @ prompt compilation | aligns | `voice-pressure-attachment-invalid` ends the silent discard of authored voice pressure and overrides. |
| §29.5 warnings never gate; no blocking below true blockers | aligns | New warnings stay non-gating; draft saving is untouched (validation gates preview/compile/send only); the severity split is documented per lane in the contract. |

## Verification

- Unit tests in `packages/core` for every new rule: dangling, unselected-required, unselected-optional, type-mismatch, and each contradiction case, plus negative tests (selected/coherent state produces no diagnostic; enum sentinels `unknown`/`not_applicable`/`none` behave as specified).
- The `extractReferences` drift test (D5) and the existing `validation-rule-inventory.test.ts` drift test both pass with the updated inventory.
- Golden prompt baseline is **byte-for-byte unchanged** for valid snapshots — proof the compiler is untouched.
- **Compiler index-invariance test:** compile one valid snapshot with two different `projectRecordIndex` values and assert byte-identical output, structurally locking the §29.3 guarantee that the compiler never reads the validation-only index (the golden baseline alone proves the compiler is untouched, not that it ignores the new field's contents).
- Server tests for D7's structured failure body; snapshot-builder test for index population.
- New stress cases runnable per `docs/stress-suite.md` conventions; matrix updated in the same revision.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all pass.

## Out of Scope

- Promoting any `docs/narrative-theory-blocker-roadmap.md` candidate (all fail the no-heuristic constraint or need new structured fields; the roadmap stays non-binding and unchanged).
- Structured story time / clock-deadline expiry checking (needs a schema spec first).
- Additional compiler-rendering changes, including removing raw-id fallback from optional lanes. The adjacent `current_location`/`entity_statuses` display-label fixes are complete separately in `archive/tickets/CURSTATELABEL-002.md` and `archive/tickets/CURSTATELABEL-003.md`.
- Extending pruning to generation-brief fields (rejected, scope decision 3).
- Any keyword/content-based validation, including changes to the existing text-marker rules (`local-prose-scope-violation`, contamination markers); they are prior art outside this spec.
- `EVENT.sequence_order` wiring (standing deferral).
- LLM-assisted anything.

## Risks & Open Questions

1. **Production-project friction.** Existing projects may immediately surface new blockers (e.g. unselected onstage entities that previously compiled as raw ids). This is the intended fail-closed behavior, but diagnostics must name the offending field/record and the one-step fix (select the record / remove the reference) per §11 legibility. Stress cases should include a realistic migration-shaped fixture.
2. **Adjacent compiler display-label fixes:** `current_location` and record-id-array `entity_statuses` display-label rendering were deliberately excluded from this validation spec and completed separately in `archive/tickets/CURSTATELABEL-002.md` and `archive/tickets/CURSTATELABEL-003.md` (2026-06-10). This spec still owns validation of dangling, mistyped, and unselected references before compilation.
3. **Lane-table boundaries.** The exact required-vs-optional grading of every record-internal lane (D5) must be re-derived from the contract §4 requiredness column at decomposition time; this spec fixes the doctrine and the table's authority location, not every cell.
4. **`known_by` / `causes` / `effects` union ambiguity.** Fields typed `recordId[] | sentinel/prose` can only be reference-checked on values that match the project index; values matching nothing are treated as prose/sentinel and skipped, mirroring D3's `current_location` rule. A collision (prose string that equals a record id) is theoretically possible but practically negligible with generated ids.
5. **Index size.** The project record index grows with project size; it is ids and type strings only. The existing `prompt-middle-salience-risk` warning keys off snapshot JSON size (`JSON.stringify(snapshot).length > 5000`, `warnings.ts:40`), so the index would otherwise inflate that measurement. **Resolved into D1** as a required salience-size carveout (exclude `projectRecordIndex` from the measured projection, with a regression test); this entry remains only to record the interaction.

## Outcome

Completed on 2026-06-10.

- D1/D2 landed in `archive/tickets/SPEC019REFINTSTR-001.md` and `archive/tickets/SPEC019REFINTSTR-002.md`: validation snapshots now carry a deterministic project record index, salience-size warnings exclude it, and reference classification distinguishes selected, unselected, and dangling ids.
- D3/D4 landed in `archive/tickets/SPEC019REFINTSTR-003.md` and `archive/tickets/SPEC019REFINTSTR-004.md`: generation-brief, cast-band, selected-POV, and voice-pressure reference validation now blocks or warns by lane requiredness.
- D5/D6 landed in `archive/tickets/SPEC019REFINTSTR-005.md` and `archive/tickets/SPEC019REFINTSTR-006.md`: record-internal extracted references and deterministic structural contradictions now validate through the core rule registry.
- D7 landed in `archive/tickets/SPEC019REFINTSTR-007.md`: stale `selected_records` snapshot-build failures remain fail-closed but now enumerate dangling ids and the working-set fix.
- D8 landed in `archive/tickets/SPEC019REFINTSTR-008.md` and `archive/tickets/SPEC019REFINTSTR-009.md`: stress docs/matrix, compiler contract, story schema notes, and contract version `1.3.0` are updated.

Final verification:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build` (passed with the existing Vite large-chunk warning)
- Active ticket sweep: no `tickets/SPEC019REFINTSTR-*` files remain; archived tickets 001–009 are present.
- Contract/version grep checks passed: `docs/compiler-contract.md` and `packages/core/src/version.ts` both use contract `1.3.0`; no `pov-character-not-selected` remains in active contract/code/inventory surfaces; no package test assertion remains at `contract: "1.2.0"`.
