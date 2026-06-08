# SECRETPROMPT-001: Resolve SECRET holder/non-holder entity IDs to display names in the compiled prompt

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `packages/core/src/compiler/sections/front.ts` (`secret_holders`, `secret_non_holders_to_protect` resolvers + a shared id→label helper); regression coverage in `packages/core/test/compiler-front-sections.test.ts` and the golden fixture (`packages/core/test/compiler-golden.test.ts`). Docs sync: `docs/compiler-contract.md` rows 128–129 and §9. No schema, validation, or stored-data change.
**Deps**: None

## Problem

The `<secrets_and_reveal_constraints>` prompt block renders raw entity UUIDs instead of character names. Reproduced from a live prompt preview:

```
Secret holders:
- 019ea1b1-3957-705f-8332-d3a06305ccd3

Characters who must not know yet:
- 019ea274-2ac7-7413-86d1-5ed979d2a04c
```

These should read the entities' display names (e.g. `Ane Arrieta`, the protected character's name), matching how `{pov_character}` already resolves a POV UUID to its display label.

Root cause: the `secret_holders` and `secret_non_holders_to_protect` resolvers (`front.ts:130-136`) project the payload arrays with `listLine(...)` (`front.ts:229-235`), a plain comma/`asString` join with **no id→label resolution**. By contrast `renderPovCharacter` (`front.ts:186-199`) looks the id up in `snapshot.records` and calls `displayLabel(record)` (`front.ts:201-204`). The secret resolvers never received the same treatment.

This also contradicts `docs/compiler-contract.md` §9, which states record IDs are "validation-only by default" and names `{pov_character}` as "the one prompt-facing id-derived value". `{secret_holders}` and `{secret_non_holders_to_protect}` are in fact two more id-derived prompt-facing values; the fix brings the code into line with that principle and updates §9 to admit them (change-control rule §10 requires the contract to move in the same revision).

## Assumption Reassessment (2026-06-08)

1. **Bug site, confirmed.** `packages/core/src/compiler/sections/front.ts:130-136` — `secret_holders` = `listLine(payload.holders)`, `secret_non_holders_to_protect` = `listLine(payload.non_holders_to_protect)`. `listLine` (`front.ts:229-235`) only `asString`-joins; it does not resolve ids. The template surfaces them under "Secret holders:" / "Characters who must not know yet:" (`packages/core/src/compiler/template-constants.ts:178-182`).
2. **Established resolution pattern, confirmed.** `renderPovCharacter` (`front.ts:186-199`) resolves a single POV id via `snapshot.records.find(r => r.id === id)` → `displayLabel(record)` (`front.ts:201-204`), where `displayLabel` returns `record.metadata?.displayLabel || asString(record.displayLabel) || record.id`. Every record in the snapshot carries a non-empty `metadata.displayLabel` (`packages/core/src/records/metadata.ts:7`), and ENTITY/CAST records derive it from identity (see `archive/tickets/CASTLABEL-001`). The fix applies this same lookup to each id in the holder arrays.
3. **No prior decision to reverse.** `archive/tickets/POVDISPLAY-001.md:16` asserted "the stored UUID is never rendered into the compiled prompt … used only as a filter key (… SECRET `pov_access`)". That assertion was incomplete: `{secret_holders}`/`{secret_non_holders_to_protect}` *do* render the id. This is a genuine defect, not an intentional design choice — there is no deliberate "render ids" decision in `tickets/`/`archive/tickets/` to overturn.
4. **FOUNDATIONS principle under audit.** §15 (POV/knowledge/secrets discipline: the prompt must state "who holds a secret" and "who must not know yet" legibly) and §8 (deterministic compilation). The id→label resolution is a pure, deterministic snapshot lookup with no LLM; it does not touch the secret firewall — leakage/protection logic (`renderPovDoesNotKnow` `front.ts:284-297`, `universal-blockers.ts:245-256`, `matrix-voice.ts:198`) keys off raw ids and is left unchanged. No §29.6 hard-fail is engaged; §29.6 "omit secret holders/non-holders…" is improved.
5. **Deterministic-compilation surface.** The change is confined to the projection inside two existing resolvers plus a shared helper; it does not alter record selection, the `isActiveSecret` predicate (`front.ts:242-244`), ordering (`ordering.ts`), empty-state behavior (`empty-states.ts:76`), or the placeholder map (`placeholder-map.ts:83`). Output stays deterministic for identical snapshots.
6. **No schema change.** `holders: z.array(recordId)` and `non_holders_to_protect: z.union([z.array(recordId), z.enum(["all_except_holders","none"])])` (`packages/core/src/records/knowledge.ts:68-69`) are unchanged. The literals `all_except_holders` and `none` are rendered to friendly phrases at the compile boundary only.
7. **Adjacent observation (not in scope).** `{onstage_entities}`, `{offstage_pressuring_entities}`, and `{possessions}` derive from free-text current-state fields (`front.ts:52-68`), a different input class, and were not reported. If id-rendering is later confirmed there, it becomes its own ticket — do not expand this one.

## Architecture Check

1. A single shared helper (e.g. `resolveEntityLabels(snapshot, value)`) that maps an id-or-id-array to display labels via the existing `snapshot.records` lookup + `displayLabel`, with the two literal sentinels handled explicitly, is the minimal correct fix. It reuses the `displayLabel` mechanism already proven for POV rather than introducing a second resolution path, and keeps the two resolvers one-liners. No id→name cache or cross-snapshot index is warranted (YAGNI; the snapshot is already in memory and small).
2. No backwards-compatibility shim: `listLine` keeps serving the non-entity list placeholders (`allowed_surface_cues`, `reveal_triggers`, `forbidden_reveals`); only the two entity-id placeholders switch to the resolver. No dual rendering path is retained.

## Verification Layers

1. A SECRET whose `holders`/`non_holders_to_protect` reference selected ENTITY records renders those entities' `displayLabel`s, never bare UUIDs → component test in `compiler-front-sections.test.ts` asserting the rendered block contains the display name and not the id.
2. A holder id with no matching record in the snapshot falls back to the raw id (no crash, no dropped entry) → unit test with a dangling id, mirroring the POV dangling-id precedent.
3. The literals `all_except_holders` and `none` render as human-readable phrases, not as the raw tokens → unit test for each literal value of `non_holders_to_protect`.
4. Output remains deterministic and the contract stays in sync → golden test (`compiler-golden.test.ts`) regenerated/updated; `docs/compiler-contract.md` §9 + rows 128–129 grep-proof that the doc names `{secret_holders}`/`{secret_non_holders_to_protect}` as id-derived display-resolved values.

## What to Change

### 1. Add a shared entity-label resolver (`front.ts`)

- Add `resolveEntityLabels(snapshot, value)`:
  - If `value` is `"all_except_holders"` → render `Everyone except the secret holders`.
  - If `value` is `"none"` → render the existing empty-state phrasing for that placeholder (no protected non-holders).
  - If `value` is an array → for each id, `snapshot.records.find(r => r.id === id)`; resolved → `displayLabel(record)`, unresolved → raw id (graceful fallback). Join with `, `.
  - Otherwise fall through to `asString`.

### 2. Switch the two resolvers (`front.ts:130-136`)

- `secret_holders`: `(payload) => resolveEntityLabels(snapshot, payload.holders)`.
- `secret_non_holders_to_protect`: `(payload) => resolveEntityLabels(snapshot, payload.non_holders_to_protect)`.
- Keep the existing `bulletRecords(...).join("\n") || EMPTY_STATE_CONSTANTS.*` wrapping.

### 3. Sync the compiler contract (`docs/compiler-contract.md`)

- Rows 128–129: note that `SECRET.holders` / `SECRET.non_holders_to_protect` are resolved to the referenced records' display labels (raw-id fallback when a referenced entity is absent from the snapshot), and that `all_except_holders`/`none` render as deterministic phrases.
- §9: amend the sentence calling `{pov_character}` "the one prompt-facing id-derived value" to also list `{secret_holders}` and `{secret_non_holders_to_protect}` as id-derived values resolved to display labels.

## Files to Touch

- `packages/core/src/compiler/sections/front.ts` (modify)
- `packages/core/test/compiler-front-sections.test.ts` (modify)
- `packages/core/test/compiler-golden.test.ts` (modify — regenerate the affected golden snapshot if holder labels appear in it)
- `docs/compiler-contract.md` (modify)

## Out of Scope

- Any change to the SECRET schema, the `holders`/`non_holders_to_protect` storage shape, or the secret-leakage/protection validation logic.
- `{onstage_entities}`, `{offstage_pressuring_entities}`, `{possessions}` and other current-state free-text id surfaces (see Assumption Reassessment item 7).
- Adding a new validation blocker or warning for an unresolved holder id — raw-id fallback is sufficient and matches the POV precedent.
- `clue_carriers` compilation (SECRETPROMPT-002) and `secret_kind` usage (SECRETPROMPT-003).

## Acceptance Criteria

### Tests That Must Pass

1. Compiling a snapshot with an active SECRET whose `holders` = `[entityA.id]` and `non_holders_to_protect` = `[entityB.id]` produces a `<secrets_and_reveal_constraints>` block listing `entityA`/`entityB` display labels and containing neither UUID.
2. A dangling holder id (no matching record) renders the raw id without throwing or dropping it.
3. `non_holders_to_protect: "all_except_holders"` and `"none"` each render their deterministic human-readable phrase.
4. `npm run lint && npm run typecheck && npm test` pass (includes the regenerated golden test).

### Invariants

1. No SECRET holder or protected non-holder entity id is rendered as a bare UUID when a matching record exists in the snapshot.
2. The stored SECRET payload and all secret-firewall/validation consumers (which key off raw ids) are unchanged; compilation stays deterministic for identical snapshots.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-front-sections.test.ts` — add cases for label resolution, dangling-id fallback, and both literal sentinels; rationale: these are the smallest surfaces that prove the defect is fixed without leakage regressions.
2. `packages/core/test/compiler-golden.test.ts` — update the golden prompt if a holder/non-holder label appears in the fixture, so the canonical prompt reflects names.

### Commands

1. `npm test --workspace @loom/core -- compiler-front-sections` (targeted proof).
2. `npm run lint && npm run typecheck && npm test` (full-pipeline gate per CLAUDE.md, includes golden + boundary tests).

## Outcome

Completed: 2026-06-08

What changed:

- `SECRET.holders` and `SECRET.non_holders_to_protect` now resolve referenced record ids to display labels in the compiled secrets prompt block, with raw-id fallback when a referenced record is absent from the selected snapshot.
- `all_except_holders` and `none` protected-non-holder sentinels now render as deterministic human-readable phrases.
- Focused compiler tests cover display-label resolution, dangling-id fallback, and both sentinel values.
- The golden demo prompt now renders `Elin Vale` and `Niko Bram` instead of their UUIDs.
- `docs/compiler-contract.md` now lists these two placeholders as prompt-facing id-derived values alongside `{pov_character}`.

Deviations from original plan:

- None.

Verification:

- `npm test --workspace @loom/core -- compiler-front-sections` passed.
- `npm test --workspace @loom/core -- compiler-golden` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 99 files, 655 tests.
