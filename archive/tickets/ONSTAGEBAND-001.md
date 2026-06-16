# ONSTAGEBAND-001: Block generation when an onstage character's cast dossier is Unassigned or offstage

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — new deterministic validation blocker `onstage-cast-band-missing` in `@loom/core`; updates `docs/validation-rule-inventory.md` and `docs/compiler-contract.md`.
**Deps**: None

## Problem

A character is modeled as two linked records: an `ENTITY` record (its id goes into the Generation Brief's `current_authoritative_state.onstage_entities`) and a `CAST MEMBER` record whose `entity_id` points at that ENTITY and carries the dossier. The dossier only reaches the prompt through a cast band in the Active Working Set: `active_onstage_cast_full` (full dossier) or `present_minor_cast_compressed` (compressed notes). A cast member left **Unassigned** (the UI dropdown's `"none"`, i.e. no band) or in **`offstage_relevant_cast`** contributes no present-cast dossier.

In two recent stories the author selected a character as onstage but left its CAST MEMBER at **Unassigned**, so the dossier was never compiled into the prompt and the model wrote the onstage character with no voice/body/pressure authority. No validation rule catches this: the onstage-entities lane only checks that the id resolves to a selected ENTITY (`onstage-entity-reference-invalid`), and the cast-band lanes only check the reverse direction (a band member resolves to a selected CAST MEMBER). Nothing connects "this character is onstage" to "is its dossier actually in a rendered band."

This ticket adds a deterministic, fail-closed blocker: if a selected CAST MEMBER is linked (`entity_id`) to an onstage entity but is **Unassigned** or in **offstage relevance**, block prompt preview/compilation/generation and tell the author to fix the band in the Active Working Set. `present_minor_cast_compressed` is acceptable (it renders), matching the reporter's "Unassigned or even offstage relevance" framing.

## Assumption Reassessment (2026-06-16)

1. **Cast↔entity linkage and onstage source (verified in code).** `CAST MEMBER.entity_id` is a required `recordId` referencing an ENTITY (`packages/core/src/records/cast-member.ts:81`; `extractReferences` at `:152`). Onstage selection is `current_authoritative_state.onstage_entities: z.array(recordId)` (`packages/core/src/records/generation-brief.ts:34`), and `validateOnstageEntityReferences` already constrains each id to a selected `ENTITY` record (`packages/core/src/validation/rules/referential-brief.ts:31-44`).
2. **Bands and "Unassigned" semantics (verified in code).** Bands are `active_onstage_cast_full` (array of `{cast_member_id, local_function}`), `present_minor_cast_compressed`, `offstage_relevant_cast` (`packages/core/src/records/generation-brief.ts:8-24`). The snapshot builder writes each selected record's band onto `ValidationRecord.castBand` (`packages/server/src/snapshot-builder.ts:200-219, 162, 176-198`); a selected cast member in no band has `castBand === undefined`. The Working-Set UI band dropdown only renders for cast members already in the selected working set and offers `Unassigned` (`none`), `active`, `present_minor`, `offstage` (`packages/web/src/working-set/WorkingSetView.tsx:214,231,240-243`), confirming "Unassigned" = selected-but-unbanded — therefore present in `snapshot.records` and detectable without changing snapshot assembly.
3. **Compiler rendering by band (verified in code).** Only `active_onstage_cast_full` renders the full dossier; `present_minor_cast_compressed` renders compressed notes; `offstage_relevant_cast` renders into the offstage section (`packages/core/src/compiler/sections/cast.ts:80-107`). So the deterministic "rendered as present" set is `{active_onstage_cast_full, present_minor_cast_compressed}`.
4. **FOUNDATIONS principle under audit.** This is a fail-closed validation gate (§4.5, §11) protecting active-working-set integrity (§6.2, §7) and active-cast dossier authority (§8, §17). FOUNDATIONS §11 lists "missing onstage cast when required by prose mode" among hard validation conditions; the blocker proves a deterministic gap (an onstage character whose dossier is structurally absent from the rendered bands) without an LLM. It does **not** auto-assign a band (that would violate §7's "must not override the user by silently adding"); it blocks and instructs.
5. **Enforcement-surface / determinism check.** The rule reads only existing snapshot inputs (`snapshot.records[*].castBand`, `record.payload.entity_id`, `current_authoritative_state.onstage_entities`); it is pure and deterministic, touches neither the secret firewall (§15) nor compiled prompt output for valid inputs, and therefore does **not** require a `contract.version`/`compiler.version` bump (compiled output for already-valid sessions is unchanged). The compiler-contract **document** must still be updated per its §10 change-control rule because a blocker row is added.
6. **Schema extension check.** No schema field is added or changed. `DIAGNOSTIC_CODES` gains one member (`onstageCastBandMissing`); the drift test `packages/core/test/validation-rule-inventory.test.ts` requires the new code to (a) be emitted by a registered rule at the declared severity and (b) have a matching `docs/validation-rule-inventory.md` row — so code + rule + inventory row must land in the same revision. Default ideation applicability is `applies` (the code is not added to `proseOnlyBlockerCodes` in `packages/core/src/validation/kind-applicability.ts:4-17`), which is correct because the ideation prompt also renders cast bands (`docs/compiler-contract.md §3.2`).
7. **Blast-radius grep.** No existing rule cross-checks `onstage_entities` against cast-band membership (`grep -rin "onstage" packages/core/src/validation/rules` shows only band→record direction and onstage/offstage/status contradictions). No test asserts a total rule count; `validation-rule-inventory.test.ts:25` asserts `rows` length equals the diagnostic-code-set size (self-consistent once the row is added). The capstone test (`packages/core/test/validation-taxonomy-capstone.test.ts`) asserts specific code presence, not counts.
8. **Adjacent contradiction (classified as out of scope).** An onstage `entity_kind: "person"` ENTITY with **no** CAST MEMBER at all (or whose CAST MEMBER is entirely unselected) is a related but distinct defect; the snapshot cannot read unselected cast payloads (`snapshot.records` holds only selected records — `packages/server/src/snapshot-builder.ts:139-163`), and forcing dossiers for arbitrary onstage entities risks over-blocking non-person entities. This is future cleanup that must become its own ticket, not part of this change.

## Architecture Check

1. A small dedicated rule file (`onstage-cast-band.ts`) registered in `rules/index.ts` mirrors the existing one-concern-per-file layout (`cast-band.ts`, `referential-brief.ts`, `structural-contradiction.ts`) and keeps an onstage↔band cross-cut discoverable rather than buried inside an unrelated rule group. The implementation reuses the established pattern in `validateOnstageEntityStatuses` (build an onstage-id `Set`, iterate `snapshot.records`, read `payload.entity_id`) so no new infrastructure is introduced.
2. No backwards-compatibility aliasing/shims introduced. One additive `DIAGNOSTIC_CODES` member and one additive rule; no existing code path or schema field changes.

## Verification Layers

1. Onstage character with Unassigned dossier blocks → schema validation (Vitest: `runValidation(buildValidationSnapshot(...))` yields a `onstage-cast-band-missing` blocker).
2. Onstage character in offstage relevance blocks; active/present-minor passes → schema validation (parametrized Vitest cases over the four band states).
3. Non-person / dossier-less onstage entity does not block → schema validation (onstage ENTITY with no linked selected CAST MEMBER yields no blocker).
4. Diagnostic-code/inventory/severity drift stays consistent → FOUNDATIONS alignment check + codebase grep-proof (`validation-rule-inventory.test.ts` passes; new code present in `DIAGNOSTIC_CODES`, the new rule, and the inventory row).
5. Compiler-contract blocker taxonomy stays in sync → manual review (new code listed in `docs/compiler-contract.md §6` per its §10 change-control rule).

## What to Change

### 1. New diagnostic code

In `packages/core/src/validation/types.ts`, add to `DIAGNOSTIC_CODES`:

```ts
onstageCastBandMissing: "onstage-cast-band-missing",
```

(Assumption — rename if preferred: the slug `onstage-cast-band-missing`. The whole row set just needs code, rule, and inventory row to agree.)

### 2. New validation rule

Create `packages/core/src/validation/rules/onstage-cast-band.ts` exporting `onstageCastBandRules: readonly ValidationRule[]`:

- Build `onstageIds = new Set(snapshot.generationSession.current_authoritative_state?.onstage_entities ?? [])`.
- For each `record` in `snapshot.records` where `record.type === "CAST MEMBER"`: read `entity_id` from its payload (mirror `objectPayload()` from `structural-contradiction.ts`).
- If `onstageIds.has(entity_id)` **and** `record.castBand` is `undefined` (Unassigned) or `"offstage_relevant_cast"`, emit a **blocker** with:
  - `code: DIAGNOSTIC_CODES.onstageCastBandMissing`
  - `severity: "blocker"`
  - `affected: [{ recordId: record.id, field: "generationSession.active_working_set" }]`
  - author-actionable `message` naming the character via `record.metadata?.displayLabel` and the current band state (Unassigned vs offstage), e.g. `"Onstage character \"<label>\" is <Unassigned|in offstage relevance>, so its dossier will not be compiled. Assign it to active/onstage full or present-minor compressed, or remove it from onstage entities."`
  - `whyItMatters`: an onstage character must have its dossier rendered as present so voice/body/pressure authority compiles deterministically.
  - `suggestedActions: ["promote-cast", "revise", "deselect"]`

### 3. Register the rule

In `packages/core/src/validation/rules/index.ts`, import `onstageCastBandRules` and spread it into `validationRules` (place adjacent to `...castBandRules` / `...referentialBriefRules`).

### 4. Inventory doc row (drift-test required)

In `docs/validation-rule-inventory.md`, add a row (Referential Integrity or Universal Blockers table) with severity `blocker`, ideation applicability `applies`, FOUNDATIONS §11 clause `§11.3 / §11.5`, description: "Onstage character's selected CAST MEMBER is Unassigned or in offstage relevance, so its dossier is not compiled as present cast.", stress cases `—`.

### 5. Compiler-contract sync (change-control required)

In `docs/compiler-contract.md §6`, add `onstage-cast-band-missing` to the "Implemented reference and structural blocker codes" list (alongside the existing `cast-band-*` / `onstage-*` codes), so the blocker taxonomy stays in sync with `packages/core`.

## Files to Touch

- `packages/core/src/validation/types.ts` (modify) — add `onstageCastBandMissing`
- `packages/core/src/validation/rules/onstage-cast-band.ts` (new) — the rule
- `packages/core/src/validation/rules/index.ts` (modify) — register the rule
- `packages/core/test/validation-onstage-cast-band.test.ts` (new) — unit tests
- `docs/validation-rule-inventory.md` (modify) — inventory row
- `docs/compiler-contract.md` (modify) — §6 blocker-code list

## Out of Scope

- Forcing a dossier for an onstage `entity_kind: "person"` ENTITY that has no CAST MEMBER (or only an unselected one) — distinct defect; snapshot cannot read unselected payloads; its own ticket (see Assumption Reassessment item 8).
- Any UI auto-assignment of bands or a non-blocking "What Will Compile" warning — the blocker surfaces through the existing readiness checklist; no `packages/web` change is required.
- Any `contract.version` / `compiler.version` bump or golden-prompt change — compiled output for already-valid sessions is unchanged.
- Adding a new `docs/stress-suite.md` case — sibling structural blockers carry `—` for stress cases; the focused unit test is the verification boundary.

## Acceptance Criteria

### Tests That Must Pass

1. New unit test: onstage entity + selected linked CAST MEMBER with `castBand` undefined (Unassigned) → result contains `onstage-cast-band-missing` blocker; `isBlocked === true`.
2. New unit test: same with band `offstage_relevant_cast` → blocker present; with `active_onstage_cast_full` and with `present_minor_cast_compressed` → no `onstage-cast-band-missing` blocker.
3. New unit test: onstage ENTITY with no linked selected CAST MEMBER → no `onstage-cast-band-missing` blocker (does not over-block non-person/dossier-less onstage entities).
4. `npm test --workspace @loom/core -- validation-rule-inventory` passes (code set, severity, and ideation applicability stay consistent).
5. Full pipeline: `npm run lint && npm run typecheck && npm test`.

### Invariants

1. The blocker fires only from existing deterministic snapshot inputs (`record.castBand`, `record.payload.entity_id`, `current_authoritative_state.onstage_entities`) — no LLM, no new snapshot input, no read of unselected record payloads.
2. `present_minor_cast_compressed` and `active_onstage_cast_full` never trip this blocker; only Unassigned and `offstage_relevant_cast` do.
3. `DIAGNOSTIC_CODES`, the registered rule, and the `docs/validation-rule-inventory.md` row remain in 1:1 agreement (drift test green).

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-onstage-cast-band.test.ts` — new; parametrized over the four band states plus the dossier-less onstage entity case, asserting blocker presence/absence and `isBlocked`.
2. `packages/core/test/validation-rule-inventory.test.ts` — no edit expected; it must stay green once the new code, rule, and inventory row are added (proves the same-change drift contract).

### Commands

1. `npm test --workspace @loom/core -- validation-onstage-cast-band`
2. `npm test --workspace @loom/core -- validation-rule-inventory`
3. `npm run lint && npm run typecheck && npm test`

## Outcome

Completed: 2026-06-16

Implemented the deterministic `onstage-cast-band-missing` blocker in `@loom/core`. The rule reads only validation snapshot inputs: selected CAST MEMBER `payload.entity_id`, `record.castBand`, and `current_authoritative_state.onstage_entities`. It blocks linked selected cast dossiers that are Unassigned or in `offstage_relevant_cast`, while allowing `active_onstage_cast_full`, `present_minor_cast_compressed`, and onstage entities with no linked selected CAST MEMBER.

Added focused coverage in `packages/core/test/validation-onstage-cast-band.test.ts` and updated the validation taxonomy capstone fixture so the cloned demo validation records carry the same active/onstage cast-band annotations that the demo generation session declares. Updated `docs/validation-rule-inventory.md` and `docs/compiler-contract.md` so the diagnostic inventory and compiler contract blocker taxonomy stay in sync.

Deviations from plan: the implementation also updated `packages/core/test/validation-taxonomy-capstone.test.ts` after the full suite exposed that its demo snapshot fixture had selected onstage CAST MEMBER records without snapshot `castBand` annotations. No browser smoke was run because this ticket changes pure core validation and documentation only; no UI route or request shape changed.

Verification:

- `npm test --workspace @loom/core -- validation-onstage-cast-band` — passed.
- `npm test --workspace @loom/core -- validation-rule-inventory` — passed.
- `npm test --workspace @loom/core -- validation-taxonomy-capstone` — passed after fixture alignment.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed, 130 files and 948 tests.
- `npm run build` — passed; Vite reported the existing large-chunk warning.
