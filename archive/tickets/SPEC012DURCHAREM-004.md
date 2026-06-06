# SPEC012DURCHAREM-004: RecordBrowser `?create=<TYPE>` consumer

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — new `?create=<TYPE>` search-param consumer in `packages/web/src/records/RecordBrowser.tsx` that pre-opens a record create form
**Deps**: None

## Problem

The reminder banner's quick-links are deterministic deep links of the form `/records?create=<TYPE>` that must pre-open the matching create form. Today `RecordBrowser` reads only `?recordId`, which selects an **existing** record for editing (`RecordBrowser.tsx:212-223`) — it cannot open a blank create form. Without this consumer, a quick-link would navigate to `/records` but open nothing, and SPEC-012's verification bullet "a quick-link opens the records create form for its type" could not pass. This ticket adds the param consumer; it is independent of the banner and can land in parallel with the server chain. (SPEC-012 Deliverable 4, RecordBrowser half.)

## Assumption Reassessment (2026-06-06)

1. **Create rail exists and is the reuse target.** `packages/web/src/records/RecordBrowser.tsx:340-354` maps `recordTypes` to "Create {type}" buttons whose handler runs `if (recordType === "CAST MEMBER") setCastEditorRecord(null); else setGenericEditorRecord({ recordType })`. The new param consumer reuses this exact branch — no new editor is invented.
2. **Existing param is edit-only.** `searchParams.get("recordId")` (`RecordBrowser.tsx:212`) drives a `useEffect` that finds an existing record and calls `selectRecord(target)` (`:213-223`). `?create=<TYPE>` is a distinct, additive param; it does not change `?recordId` behavior. SPEC-012 §Approach (Quick-links) and §Deliverables 4 govern; the param name `?create=<TYPE>` was fixed during reassessment.
3. **Shared boundary under audit:** the records-surface URL contract. `<TYPE>` must be one of the 12 authority record types, all verified present in `@loom/core`'s `recordTypes` (`packages/core/src/records/registry.ts:39`): EVENT, FACT, RELATIONSHIP, EMOTION, OBJECT, LOCATION, ENTITY STATUS, CLOCK, OBLIGATION, CONSEQUENCE, OPEN THREAD, CAST MEMBER. An unrecognized `?create=` value must be ignored (open nothing), not crash.
4. **FOUNDATIONS principle restated:** §26 / §29.2 — suggested record types are deterministic navigation, not LLM extraction. This consumer is pure URL→form routing; it pre-fills no content and creates no record. §27 — it makes the manual record-update step faster without hidden mutation.

## Architecture Check

1. Reusing the create-rail branch (rather than duplicating editor-open logic) keeps a single source of truth for "open the create form for type T (CAST MEMBER → custom editor, else generic)". A `useEffect` keyed on the parsed `?create` value mirrors the existing `?recordId` effect, so the two params are structurally consistent.
2. No backwards-compatibility shim: `?create=` is a new param; `?recordId` is untouched and not aliased.

## Verification Layers

1. `?create=<TYPE>` opens the matching create form -> component test: rendering `RecordBrowser` at `/records?create=EVENT` shows the generic `RecordEditor` for EVENT; `/records?create=CAST MEMBER` shows `CastMemberEditor`.
2. Unknown / absent value is inert -> component test: `?create=NOT_A_TYPE` and no `?create` param render the normal browser (no editor, no crash).
3. No record created by navigation -> manual review + test: opening the create form issues no save/network write until the user submits.

## What to Change

### 1. Parse and act on `?create=<TYPE>`

In `packages/web/src/records/RecordBrowser.tsx`, alongside the existing `preselectedRecordId` logic (`:212`):

- Read `const createType = searchParams.get("create")`.
- In a `useEffect` keyed on `createType` (and `recordTypes`): if `createType` is a member of `recordTypes`, open the create form by reusing the create-rail branch — `CAST MEMBER → setCastEditorRecord(null)`, else `setGenericEditorRecord({ recordType: createType })`. If `createType` is absent or not a valid type, do nothing.
- Guard against re-opening on every render (open once per distinct `createType` value), consistent with the existing `recordId` effect.

## Files to Touch

- `packages/web/src/records/RecordBrowser.tsx` (modify)
- `packages/web/src/records/RecordBrowser.test.tsx` (modify)

## Out of Scope

- The reminder banner that emits these links — SPEC012DURCHAREM-005.
- Any new editor or change to `RecordEditor` / `CastMemberEditor` internals.
- Pre-filling record content from accepted prose — forbidden (FOUNDATIONS §20/§26); the form opens empty.
- `?recordId` edit behavior — unchanged.

## Acceptance Criteria

### Tests That Must Pass

1. `/records?create=EVENT` pre-opens the generic create form for EVENT; `/records?create=CAST MEMBER` pre-opens the CAST MEMBER custom editor.
2. `/records?create=<invalid>` and a plain `/records` render the normal browser with no editor open and no error.
3. Navigating with `?create=<TYPE>` creates no record and triggers no save request until the user submits the form.
4. `npm run typecheck && npm run lint && npm test && npm run build` all green.

### Invariants

1. `?create=<TYPE>` only routes to a create form; it never pre-fills content or persists a record.
2. Only the 12 valid `recordTypes` are honored; any other value is inert.

## Test Plan

### New/Modified Tests

1. `packages/web/src/records/RecordBrowser.test.tsx` — add cases rendering the browser under `MemoryRouter`/`useSearchParams` with `?create=EVENT`, `?create=CAST MEMBER`, an invalid value, and no param, asserting the correct editor opens (or none) and that no record is created.

### Commands

1. `npm test -- RecordBrowser` — targeted run of the records-browser suite.
2. `npm run typecheck && npm run lint && npm test && npm run build` — full pipeline.

## Outcome

Completed: 2026-06-06

Added `?create=<TYPE>` handling in `packages/web/src/records/RecordBrowser.tsx`. The browser now reads the `create` search param, validates it against registered `recordTypes`, and opens the same create form path used by the existing create rail (`CAST MEMBER` opens the custom editor; all other valid types open the generic editor). The existing `?recordId` edit behavior is unchanged, and navigation alone does not prefill or persist a record.

Extended `packages/web/src/records/RecordBrowser.test.tsx` with coverage for `/records?create=EVENT`, `/records?create=CAST%20MEMBER`, invalid `create` values, absent `create`, and no implicit create/update/working-set writes from deep-link navigation. No deviations from the ticket plan.

Verification:

- `npm test -- RecordBrowser` — passed.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed.
- `npm run build` — passed, with Vite's existing chunk-size warning.
