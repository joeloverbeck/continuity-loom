# REFUNION-002: Restore entity selection for known_by and owed_to (generalize sentinel-reference-list detection)

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `@loom/core` record-editor descriptor logic (`packages/core/src/records/editor-descriptors.ts`); no schema, API, or compiler change.
**Deps**: None. (Edits the same file/function area as REFUNION-001 — coordinate merges; no logical dependency.)

## Problem

Several fields whose schema is "an array of entity references **or** a set of sentinel values" render as a bare enum dropdown that **drops the entity-array option**, so the author cannot name specific entities:

- `known_by` → **EVENT** (`packages/core/src/records/causal-pressure.ts:30`) and **FACT** (`packages/core/src/records/knowledge.ts:18`): doc says `list[entity_id] | public | unknown` (`docs/story-record-schema.md`), but the editor shows only `public`/`unknown`.
- `owed_to` → **OBLIGATION** (`causal-pressure.ts:106`): doc allows a list of creditor entities or `public`/`institution`/`self`/`unknown`, but the editor shows only the sentinels.

These do **not** raise a validation error (submitting `"public"` is valid), so the defect is silent capability loss, not a hard failure — the same descriptor-detection family as REFUNION-001.

Root cause: `isSentinelReferenceListSchema` (`editor-descriptors.ts:376-388`) is hard-gated to `roleForField(name) !== "non_holder_to_protect"` (line 377), so **only** `SECRET.non_holders_to_protect` gets the `sentinel_reference_list` widget. Every other field of the same shape misses it, fails the subsequent reference/sentinel-reference checks (the union's reference arm is an *array*, not a bare uuid-string), and falls to the enum branch at line 267 (`enumValuesForSchema` returns the sentinels).

## Assumption Reassessment (2026-06-08)

1. **The hard-coded role gate is the defect.** Confirmed at `editor-descriptors.ts:377`. Removing it in favor of a structural check makes the detector fire for any reference-role union whose non-sentinel arms are all reference arrays and which carries sentinels.
2. **Exact affected fields enumerated** (grep `z.union([z.array(recordId)` over `packages/core/src/records/*.ts`): `known_by` (EVENT, FACT), `owed_to` (OBLIGATION), `non_holders_to_protect` (SECRET). `CONSEQUENCE.holder_or_target` (`causal-pressure.ts:119`) is `z.union([z.array(recordId), recordId, z.enum([...])])` — it has a **bare `recordId` arm**, a deliberately different 3-arm shape.
3. **Shared boundary under audit:** the `FieldKind` classification consumed by `RecordEditor.tsx`. `sentinel_reference_list` already has a full render path (`SentinelReferenceListField`, `RecordEditor.tsx:388-447`) and prune/default handling (`RecordEditor.tsx:110-116`, `74-76`). No new kind is introduced.
4. **FOUNDATIONS principle under audit — §15 (POV/knowledge/secrets).** `known_by` governs who knows an event/fact; restoring entity selection lets authors scope knowledge correctly. The change must **not** weaken the secret firewall: `SECRET.non_holders_to_protect` must keep rendering identically. Verified — `non_holders_to_protect`'s union (`knowledge.ts:69`, `[array(recordId), enum]`) satisfies the new structural rule (reference-array arm + sentinels, every non-sentinel arm is a reference array), so it continues to classify as `sentinel_reference_list` exactly as today.
5. **HARD-GATE / fail-closed check:** descriptor classification is authoring-UI only; it does not gate validation, compilation, or sending. No deterministic-compilation surface is touched (no compiler section reads these fields).
6. **Schema-consumer check:** No schema change. `extractReferences` already conditionally extracts `known_by`/`owed_to` as references when they are arrays (`causal-pressure.ts:160`, `196`); the widget now produces those arrays directly. Default value is unchanged (`fieldDefault` for a required `sentinel_reference_list` returns the first sentinel, `RecordEditor.tsx:74-76` — same first-sentinel default the enum produced), so no stored-data regression.
7. N/A — no rename/removal.
8. **Adjacent contradiction — `CONSEQUENCE.holder_or_target`:** classified as **future cleanup / separate ticket**. Its bare-`recordId` arm currently routes it to `isSentinelReferenceSchema` → a single picker, losing the multi-entity array option — a distinct sub-defect. The structural rule in this ticket **excludes** it (the bare-recordId arm fails "every non-sentinel arm is a reference array"), so `holder_or_target` is left exactly as-is and is **not** silently changed here.

## Architecture Check

1. Replacing the role literal with a structural predicate (reference role + sentinel-bearing union whose non-sentinel arms are all reference arrays) fixes the whole coherent family (`known_by`, `owed_to`) with one rule, keeps `non_holders_to_protect` working, and precisely excludes the differently-shaped `holder_or_target`. Cleaner and more extensible than enumerating additional role literals.
2. No backwards-compatibility aliases or shims; the special-cased role gate is removed outright.

## Verification Layers

1. **Newly-correct invariant** (`known_by` on EVENT + FACT and `owed_to` on OBLIGATION classify as `sentinel_reference_list` with the right `referenceRole` and sentinel `enumValues`) → schema validation + codebase grep-proof via `packages/core/test/editor-descriptors.test.ts`.
2. **Non-regression invariant** (`SECRET.non_holders_to_protect` still `sentinel_reference_list`) → `editor-descriptors.test.ts` assertion (secret-firewall guard, FOUNDATIONS §15).
3. **Exclusion invariant** (`CONSEQUENCE.holder_or_target` still `sentinel_reference`, unchanged) → `editor-descriptors.test.ts` assertion.
4. **Authoring invariant** (an EVENT can set `known_by` to specific entities and submit an array) → component test in `packages/web/src/records/RecordEditor.test.tsx` + manual review.

## What to Change

### 1. Generalize `isSentinelReferenceListSchema`

In `packages/core/src/records/editor-descriptors.ts`, replace the role-literal guard with a structural one:

```ts
function isSentinelReferenceListSchema(schema: z.ZodType, name: string): boolean {
  if (!referenceTargetsByRole[roleForField(name)] || schemaType(schema) !== "union") {
    return false;
  }
  const options = unionOptions(schema);
  const hasSentinels = enumValuesForSchema(schema).length > 0;
  if (!hasSentinels) {
    return false;
  }
  // Every non-sentinel arm must be a reference array (excludes holder_or_target's bare recordId arm).
  const nonSentinelArms = options.filter((option) => enumValuesForSchema(option).length === 0);
  return (
    nonSentinelArms.length > 0 &&
    nonSentinelArms.every(
      (option) => schemaType(option) === "array" && isReferenceSchema(arrayElement(option), name)
    )
  );
}
```

This keeps the check ahead of `isSentinelReferenceSchema` (line 226), so `known_by`/`owed_to`/`non_holders_to_protect` resolve to `sentinel_reference_list`, while `holder_or_target` (bare-recordId arm fails the `every`) falls through to `isSentinelReferenceSchema` unchanged.

## Files to Touch

- `packages/core/src/records/editor-descriptors.ts` (modify)
- `packages/core/test/editor-descriptors.test.ts` (modify)
- `packages/web/src/records/RecordEditor.test.tsx` (modify)

## Out of Scope

- `causes`/`effects` (REFUNION-001).
- `CONSEQUENCE.holder_or_target` multi-vs-single picker defect (deliberately excluded; its own ticket if pursued).
- `SECRET.discovered_by` (`knowledge.ts:56`) — a `recordId | enum` field whose role has no `referenceTargetsByRole` entry; separate concern.
- Any prompt-compilation change.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -w @loom/core` — `editor-descriptors.test.ts` asserts `known_by` (EVENT + FACT) and `owed_to` (OBLIGATION) have `kind === "sentinel_reference_list"` with `referenceRole` (`known_by`/`owed_to`) and their sentinel `enumValues`.
2. `npm test -w @loom/core` — regression asserts `SECRET.non_holders_to_protect` is still `sentinel_reference_list` and `CONSEQUENCE.holder_or_target` is still `sentinel_reference`.
3. `npm test -w @loom/web` — `RecordEditor.test.tsx`: switching EVENT `known_by` to `specific_entities`, adding an entity, and submitting yields an array payload.
4. `npm run lint && npm run typecheck && npm test` — full pipeline green.

### Invariants

1. The secret-firewall field `SECRET.non_holders_to_protect` renders identically before and after this change (FOUNDATIONS §15).
2. No field with a bare single-reference union arm is reclassified by this change (`holder_or_target` unaffected).

## Test Plan

### New/Modified Tests

1. `packages/core/test/editor-descriptors.test.ts` — positive (`known_by`×2, `owed_to`), non-regression (`non_holders_to_protect`), and exclusion (`holder_or_target`) assertions.
2. `packages/web/src/records/RecordEditor.test.tsx` — `known_by` specific-entities authoring round-trip.

### Commands

1. `npm test -w @loom/core -- editor-descriptors` and `npm test -w @loom/web -- RecordEditor`
2. `npm run lint && npm run typecheck && npm test`

## Outcome

Completed: 2026-06-08

Changed `packages/core/src/records/editor-descriptors.ts` so `sentinel_reference_list` classification is structural instead of hard-coded to `non_holders_to_protect`. EVENT and FACT `known_by`, OBLIGATION `owed_to`, and SECRET `non_holders_to_protect` now use the existing sentinel-plus-reference-list widget when their schema is a sentinel-bearing union whose non-sentinel arms are reference arrays. `CONSEQUENCE.holder_or_target` remains a single `sentinel_reference` because its union includes a bare single-reference arm.

Added core descriptor tests for the affected fields, the secret-firewall non-regression, and the `holder_or_target` exclusion. Added a web RecordEditor test proving EVENT `known_by` can be switched to `specific_entities`, selected through an entity picker, and submitted as an array.

Deviations: none.

Verification:

- `npm run build -w @loom/core` passed before the web package-local test so `@loom/web` consumed fresh core dist output.
- `npm test -w @loom/core -- editor-descriptors` passed.
- `npm test -w @loom/web -- RecordEditor` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 99 files, 679 tests.
