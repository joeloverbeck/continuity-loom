# CASTLABEL-001: Fix the CAST MEMBER label-field key mismatch in display-label derivation

**Status**: PENDING
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `packages/core/src/records/editor-descriptors.ts` (`labelFieldsByType` key); regression test in `packages/core/test/editor-descriptors.test.ts`. No schema, compiler, validation, or stored-data change.
**Deps**: None

## Problem

Every CAST MEMBER record gets the generic display label **"Cast Member"** instead of a label derived from its identity. In the working-set CAST MEMBER section and the Records browser, two distinct cast members (e.g. *Ane Arrieta* and *Jon Ureña*) both render as "Cast Member", so the user cannot tell which character a `band` / `local_function` control or row belongs to.

Root cause: `deriveDisplayLabel` looks up `labelFieldsByType[recordType]`, but the map registers cast members under the key **`CAST_MEMBER`** (underscore) while the actual record-type string is **`"CAST MEMBER"`** (space). The lookup misses, and derivation falls through to `titleCase("CAST MEMBER")` → "Cast Member". Every other multi-word type ("ENTITY STATUS", "OPEN THREAD", "VISIBLE AFFORDANCE") uses the correct spaced key; `CAST_MEMBER` is the lone typo.

This ticket fixes the derivation function so newly created/edited cast members get correct labels. Repairing already-persisted "Cast Member" labels in existing projects is **CASTLABEL-002**; associating the band/local_function controls with the cast member is **CASTLABEL-003**.

## Assumption Reassessment (2026-06-07)

1. The bug is a single-character-class typo: `packages/core/src/records/editor-descriptors.ts:110` declares `CAST_MEMBER: ["identity.one_line", "entity_id"]`. The canonical record-type string is `"CAST MEMBER"` (`packages/core/src/records/cast-member.ts:150`, `recordType: "CAST MEMBER"`). `deriveDisplayLabel` (`editor-descriptors.ts:155-165`) keys the map by the record-type string, so the entry is unreachable and derivation returns `titleCase(recordType)`.
2. `docs/story-record-schema.md` §5 establishes CAST MEMBER has no own name field; the meaningful identity text is `identity.one_line` (e.g. "Ane Arrieta, 18, …"), with `entity_id` as a fallback. The map's intended field order `["identity.one_line", "entity_id"]` is correct; only its key is wrong. `truncateLabel` already bounds the rendered length.
3. No FOUNDATIONS enforcement surface is altered: derivation remains deterministic and pure (`deriveDisplayLabel` is `@loom/core`, no platform/LLM dependency). This change makes derivation conform to FOUNDATIONS §8 (deterministic compilation source) and indirectly protects §17 / §4.8 (character voice is continuity) by giving each cast member a distinct identity surface — see CASTLABEL-002 for the prompt-leakage consequence.
4. Adjacent contradiction uncovered during reassessment: existing records already store the wrong label (separate concern → CASTLABEL-002), and the working-set control labels are bare field names (separate concern → CASTLABEL-003). Both are classified as separate follow-up tickets, not part of this diff.
5. Test gap confirmed: `packages/core/test/editor-descriptors.test.ts:133-139` covers ENTITY/FACT/UNKNOWN derivation but has **no** CAST MEMBER case, which is why the typo shipped.

## Architecture Check

1. Renaming the key to the canonical `"CAST MEMBER"` string is the minimal, correct fix: it makes the map consistent with every other multi-word type and with the single source of truth for the type string (`recordTypeRegistry` / `definition.recordType`). No new indirection, no lookup-normalization layer (which would mask future typos rather than prevent them).
2. No backwards-compatibility alias is introduced. The old `CAST_MEMBER` key is removed outright, not kept alongside the corrected key.

## Verification Layers

1. `labelFieldsByType` has a `"CAST MEMBER"` key and no `CAST_MEMBER` key → codebase grep-proof (`grep -n 'CAST_MEMBER\|"CAST MEMBER"' packages/core/src/records/editor-descriptors.ts`).
2. `deriveDisplayLabel("CAST MEMBER", { identity: { one_line: "…" } })` returns the truncated `one_line`, not "Cast Member" → unit test in `editor-descriptors.test.ts`.
3. Derivation stays deterministic and pure (no platform import added) → FOUNDATIONS §8 alignment check + existing core import-boundary lint.

## What to Change

### 1. Correct the label-field map key

In `packages/core/src/records/editor-descriptors.ts`, change the map entry key `CAST_MEMBER` → `"CAST MEMBER"` (value `["identity.one_line", "entity_id"]` unchanged).

### 2. Add CAST MEMBER derivation regression test

In `packages/core/test/editor-descriptors.test.ts`, extend the "derives display labels from representative payloads" test (or add a sibling) to assert:
- `deriveDisplayLabel("CAST MEMBER", { identity: { one_line: "Ane Arrieta, 18, a self-employed sex worker." } })` returns the (truncated) `one_line` text, not `"Cast Member"`.
- A cast member with empty `identity.one_line` falls back to `entity_id`.

## Files to Touch

- `packages/core/src/records/editor-descriptors.ts` (modify)
- `packages/core/test/editor-descriptors.test.ts` (modify)

## Out of Scope

- Repairing already-persisted `display_label` values in existing projects (CASTLABEL-002).
- Working-set `band` / `local_function` control labelling and accessibility (CASTLABEL-003).
- Any change to how `band` / `local_function` values are compiled or validated (confirmed correct; no change needed).

## Acceptance Criteria

### Tests That Must Pass

1. New CAST MEMBER case in `packages/core/test/editor-descriptors.test.ts` asserts non-generic derivation.
2. `npm test` (builds `@loom/core` then runs Vitest) is green.
3. `npm run typecheck` and `npm run lint` pass.

### Invariants

1. `deriveDisplayLabel` resolves the label-field list for the canonical `"CAST MEMBER"` type string (no underscore variant remains).
2. Derivation remains deterministic and pure — identical payload yields identical label, with no platform/LLM dependency.

## Test Plan

### New/Modified Tests

1. `packages/core/test/editor-descriptors.test.ts` — add CAST MEMBER derivation assertion (primary fix proof + permanent regression guard for the typo class).

### Commands

1. `npm test -- editor-descriptors`
2. `npm run typecheck && npm run lint && npm test`
