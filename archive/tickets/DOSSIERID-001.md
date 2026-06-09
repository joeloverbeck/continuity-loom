# DOSSIERID-001: Stop rendering the `entity_id` UUID inside active cast dossiers

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `packages/core/src/compiler/sections/cast.ts`, `docs/compiler-contract.md` (row 145), possibly `packages/core/test/*` goldens/fixtures
**Deps**: None

## Problem

Active/onstage cast dossiers render the cast member's `entity_id` as a visible field. The compiled dossier looks like:

```
## Marisa Arrieta, 35, alcoholic night-shift cleaner …
entity_id:
019ea274-2ac7-7413-86d1-5ed979d2a04c
```

The raw UUID is leaked into the prose prompt. The dossier header `## <displayLabel>` already identifies the character, and `compiler-contract.md` §9 classifies record IDs as **validation-only by default** ("record IDs unless deliberately exposed for debugging outside the generated prompt"). `entity_id` is a link to the cast member's ENTITY record — it carries no prose-writer value and contradicts FOUNDATIONS §8 ("render records into prose-facing prompt sections, not raw database dumps").

## Assumption Reassessment (2026-06-08)

<!-- Items 1-3 always required. -->

1. **`entity_id` is rendered because it is first in the dossier field order.** Confirmed: `packages/core/src/compiler/sections/cast.ts:12-28` defines `activeDossierFieldOrder` with `"entity_id"` as element 0; `renderDossier` (`cast.ts:110-122`) maps each field through `renderDossierField` (`cast.ts:124-131`), which emits `entity_id:\n<value>` for any populated field. The header is `## ${displayLabel(record)}` (`cast.ts:121`), which already names the character via `deriveFullDisplayLabel` (`labels.ts:4-6`).
2. **No prompt-rendering test asserts the `entity_id:` line.** Confirmed: the dossier field-coverage test (`packages/core/test/compiler-cast-sections.test.ts:231-251`) asserts prose field *values* only; the core-first-order test (`:253-265`) references `identity:`, `voice_anchor:`, etc., but never `entity_id`. The `entity_id` references in `packages/server/src/*.test.*` assert the stored CAST MEMBER **payload schema** (e.g. `phase4-gate.e2e.test.ts:264-270`, `record-routes.test.ts:187`), not the compiled prompt — those are unaffected. `golden-first-segment.prompt.txt` has no active cast (`None active`), so it is unaffected.
3. **Shared boundary under audit:** the CAST MEMBER → dossier rendering contract in `compiler-contract.md` row 145 ("Include all populated fields … Render structured fields core-first: identity, …"). Row 145 says "include all populated fields" but §9 simultaneously classes IDs as validation-only. This ticket resolves that tension by excluding `entity_id` from the dossier field set in both code and row 145.

5. **Deterministic-compilation surface:** removing `entity_id` from `activeDossierFieldOrder` is a pure deterministic change; the `entity_id` payload field remains in the schema and continues to drive validation/reference resolution (`labels.ts:resolveRecordLabel`, `causal-pressure.ts` reference extraction). It is only removed from the *prompt-facing* dossier render. Secret firewall (§15) untouched.

6. **Schema-extension check:** this is **not** a schema change. `entity_id` stays on the CAST MEMBER record (consumed by display-label resolution and reference targeting). Only its prompt rendering is removed. No consumer of the stored field is affected.

8. **Adjacent contradiction classification:** the `compiler-contract.md` row 145 "include all populated fields" wording vs §9 "IDs validation-only" is a **required consequence** corrected here (row 145 amended to "all populated fields except record-reference IDs such as `entity_id`"). The editor-section grouping in `cast-member-sections.ts:29` that also lists `entity_id` under "identity" is a **UI/editor descriptor concern, not prompt leakage** — left as a separate matter (out of scope).

## Architecture Check

1. Dropping `entity_id` from the single source of dossier field order (`activeDossierFieldOrder`) is the minimal, exact fix — the field is rendered nowhere else in the dossier. Alternatives (resolving `entity_id` to a label) are pointless because the header already names the character; rendering it at all duplicates the header and leaks an internal handle.
2. No backwards-compatibility shims. The field is removed from the render list outright.

## Verification Layers

1. No compiled active dossier contains an `entity_id:` line or a bare record UUID -> new grep-style unit assertion on the dossier body.
2. The dossier still renders all prose fields core-first (identity → voice_anchor → …) -> existing `compiler-cast-sections.test.ts:253-265` (unchanged, still green).
3. `entity_id` remains on the stored CAST MEMBER payload and still resolves references -> codebase grep-proof (`entity_id` present in `cast-member.ts` schema; server payload tests still pass).

## What to Change

### 1. Remove `entity_id` from the dossier field order

In `packages/core/src/compiler/sections/cast.ts`, delete `"entity_id"` from `activeDossierFieldOrder` (`cast.ts:13`). `identity` becomes the first rendered field, matching the core-first-order assertion already in the test suite.

### 2. Update `docs/compiler-contract.md` row 145

Amend the dossier mapping note to: "Include all populated fields **except record-reference IDs (e.g. `entity_id`), which remain validation-only per §9**. Render structured fields core-first: identity, …".

## Files to Touch

- `packages/core/src/compiler/sections/cast.ts` (modify)
- `docs/compiler-contract.md` (modify) — row 145
- `packages/core/test/compiler-cast-sections.test.ts` (modify) — add the no-`entity_id` assertion

## Out of Scope

- The CAST MEMBER `entity_id` schema field itself (kept; used by validation/reference resolution).
- The editor-section descriptor grouping in `packages/core/src/records/cast-member-sections.ts` (UI concern; no prompt leakage).
- Present-minor / offstage compressed notes (they render `identity.one_line`, not `entity_id`).

## Acceptance Criteria

### Tests That Must Pass

1. New assertion: the compiled `active_cast_full_dossiers` body does **not** contain `entity_id:` nor a bare UUID matching the cast member's record id.
2. Existing core-first-order and field-coverage tests in `compiler-cast-sections.test.ts` remain green.
3. `npm run lint && npm run typecheck && npm test`.

### Invariants

1. No record-reference UUID appears in any active cast dossier (FOUNDATIONS §8, §22; `compiler-contract.md` §9).
2. `entity_id` remains a valid, stored CAST MEMBER payload field for validation/reference use.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-cast-sections.test.ts` — assert no `entity_id:`/UUID in the dossier body; confirm `identity:` is now the first rendered field.

### Commands

1. `npm test -- compiler-cast-sections`
2. `npm run lint && npm run typecheck && npm test`

## Outcome

Completed on 2026-06-08.

Removed `entity_id` from active/onstage cast dossier rendering while leaving the stored CAST MEMBER schema field intact for reference and validation use. Updated the compiler contract to state that record-reference IDs such as `entity_id` remain validation-only and are excluded from prompt-facing dossiers.

Added a cast compiler test asserting active dossiers contain no `entity_id:` label, no referenced entity UUID, no cast record UUID, and no UUID-shaped record-reference value.

Deviation from original plan: none.

Verification:

- `npm test -- compiler-cast-sections` passed.
- `npm run lint && npm run typecheck && npm test` passed with loopback binding allowed for server tests.
