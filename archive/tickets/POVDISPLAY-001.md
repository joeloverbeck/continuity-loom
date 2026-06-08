# POVDISPLAY-001: Show POV by character name on the Generation Brief (select for `selected_pov`; humanized PROSE MODE line)

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `@loom/web` Generation Brief view (`packages/web/src/generation-brief/GenerationBriefView.tsx`). No schema, compiler, or validation change.
**Deps**: None

## Problem

The Generation Brief surfaces POV identity as raw UUIDs, which are unusable for an author:

1. **`selected_pov` is a free-text `<input>`** (`GenerationBriefView.tsx:249`). Its schema accepts only a record UUID or the literal `"omniscient"`. Typing a character name and pressing **Save Generation Brief** returns `400 malformed-draft` with issue `active_working_set.selected_pov` / "Invalid UUID" (reproduced live). The only way to set a POV today is to paste a UUID.
2. **The "PROSE MODE source:" line renders the raw `pov_character` UUID** — e.g. `PROSE MODE source: 019ea213-8f7e-73dc-8e5b-67ba95ca94fe / first / present` instead of `Jon Ureña / first / present` (`GenerationBriefView.tsx:93-103`).

Both should display the entity's `displayLabel` while continuing to store the canonical UUID (or `omniscient`/`variable` literal) internally. Confirmed safe: the stored UUID is never rendered into the compiled prompt — it is used only as a filter key (FACT `known_by`, BELIEF `holder`, SECRET `pov_access`) and as the POV override of PROSE MODE; the compiler emits human-readable `{pov_knows}` / `{pov_believes…}` statements. So "store UUID, show name" is the correct contract.

## Assumption Reassessment (2026-06-08)

1. **`selected_pov` schema, confirmed.** `packages/core/src/records/generation-brief.ts:25` — `selected_pov: z.union([recordId, z.literal("omniscient")]).optional()` (`recordId = z.uuid()`, `common.ts:7`). The draft schema mirrors it (`generation-brief-draft.ts:30`). **No schema change is required**; the select must continue to emit exactly a UUID, the literal `"omniscient"`, or `undefined`.
2. **Free-text input + save path, confirmed.** `GenerationBriefView.tsx:249-257` renders a plain `<input name="generationSession.active_working_set.selected_pov">`. Save (`GenerationBriefView.tsx:182-207` `save()` → `setGenerationBrief`) round-trips through `generationSessionDraftSchema.parse` on the server (`packages/server/src/generation-brief-routes.ts:144`), which returns `malformedDraft` (`generation-brief-routes.ts:29-35`) on an invalid UUID.
3. **Entity data source, confirmed.** `listRecords({ type: "ENTITY" })` (`packages/web/src/api.ts:277`) returns `RecordSummary` objects exposing `id` and `displayLabel` (`api.ts:135`). This is the same `displayLabel` the Working Set page already renders in its inline `<select>` controls (`packages/web/src/working-set/WorkingSetView.tsx:218,223`), so the pattern is established in-repo.
4. **`pov_character` value space, confirmed.** PROSE MODE's `pov_character` (STORY CONFIG) may be an entity UUID, the literal `"omniscient"`, or `"variable"`. The summary builder (`GenerationBriefView.tsx:93-103`) joins it verbatim. Humanization must resolve a UUID → `displayLabel` and pass `"omniscient"`/`"variable"` through (rendered as-is). `selected_pov` overrides `pov_character` at compile/validation time (`matrix-voice.ts`, `matrix-knowledge.ts`: `selected_pov ?? proseMode.pov_character`); this ticket does not change that precedence — it only changes display.
5. **Schema-extension check (additive-only):** this ticket extends no output schema. It does not add or change any field on the generation-time brief, story record, or prompt section; it only changes how two existing values are *displayed and entered* in one React view. No consumers of `selected_pov` or `pov_character` change.
6. **FOUNDATIONS principle under audit:** §27 "obvious POV and secret-boundary controls"; "The UI should respect power users without punishing ordinary users." §15 POV discipline (POV selection is a first-class continuity control). §29.11 quality checks: "make active working set selection clearer," "improve validation legibility," "reduce clerical friction without reducing authorial control." No §29 hard-fail is engaged: deterministic compilation (§8) and the secret firewall (§15) are untouched because the stored value and all downstream consumers are identical.
7. **Adjacent observation (not in scope).** The STORY CONFIG / PROSE MODE editor likely edits `pov_character` as a raw UUID too (same class of defect on a different page). It was not reported and is not part of this ticket; if confirmed it should become its own ticket rather than expand this one.

## Architecture Check

1. A `<select>` bound to the existing union (option values = entity `id`, plus `"omniscient"`, plus an empty "use default" option) eliminates the invalid-UUID failure class at the source while keeping the stored contract identical — the server schema and every `selected_pov` consumer are unchanged. Resolving `pov_character` → `displayLabel` for the summary reuses the same fetched entity list, so both fixes share one data dependency and one id→label lookup. Keeping the markup inline in `GenerationBriefView` matches the established inline-`<select>` pattern in `WorkingSetView`; extracting a shared `EntitySelect` component is unwarranted for two call sites (YAGNI).
2. No backwards-compatibility aliasing/shims: the free-text input is replaced outright; no dual input path is retained.

## Verification Layers

1. `selected_pov` select emits only a UUID, `"omniscient"`, or `undefined`, so a save can never produce the "Invalid UUID" malformed-draft -> schema validation (component test: selecting each option type yields a body that passes `generationSessionDraftSchema`; selecting "use default" yields `selected_pov: undefined`).
2. The select shows entity `displayLabel`s and the currently-selected POV is reflected by name -> manual review (browser: open red-bunny; the field shows "Jon Ureña"/"Ane Arrieta"/"Marisa Arrieta" + "Omniscient" + "Use PROSE MODE default").
3. The PROSE MODE source line shows the entity name (or `omniscient`/`variable` literal), never a bare UUID -> manual review + component test asserting `Jon Ureña / first / present` for a UUID `pov_character`.
4. No change to stored value or prompt output -> FOUNDATIONS alignment check (§8 determinism, §15 firewall: `selected_pov`/`pov_character` stored values and all core consumers unchanged; grep-proof that no core file is modified by this ticket).

## What to Change

### 1. Load the entity list (`GenerationBriefView.tsx`)

- Add `listRecords({ type: "ENTITY" })` to the existing `Promise.all([...])` in the load effect (`GenerationBriefView.tsx:78`). Store the resulting summaries (id + `displayLabel`) in component state (e.g. `povEntities`). Handle the not-ok branch the same way other loads do (leave the list empty; the select still offers "Omniscient" and "Use PROSE MODE default").

### 2. Replace the `selected_pov` input with a `<select>` (`GenerationBriefView.tsx:249-257`)

- Render `<select value={activeWorkingSet.selected_pov ?? ""} onChange={…}>` with options:
  - `<option value="">Use PROSE MODE default</option>` → maps to `selected_pov: undefined`.
  - `<option value="omniscient">Omniscient</option>`.
  - one `<option value={entity.id}>{entity.displayLabel}</option>` per loaded ENTITY, ordered by `displayLabel`.
- `onChange`: `updateActiveWorkingSet({ selected_pov: event.target.value === "" ? undefined : event.target.value })` (empty string → `undefined`; any other value is already a valid UUID or `"omniscient"`).
- Edge case: if the stored `selected_pov` UUID has no matching loaded entity (dangling/pruned), still render it as a selectable option so the value is not silently dropped from the control (label it by its id, e.g. `Unknown entity (<id-prefix>)`). Keep the existing `BriefFieldHelp` line.

### 3. Humanize the PROSE MODE source line (`GenerationBriefView.tsx:93-103`)

- When building `proseModeSummary`, resolve the first component: if `pov_character` matches a loaded entity `id`, substitute its `displayLabel`; if it is `"omniscient"` or `"variable"`, render the literal as-is; otherwise fall back to the raw value. Because this lookup needs the entity list, compute the summary after the entities resolve (move the summary derivation to depend on both the config payload and `povEntities`, e.g. via a `useMemo`/derived value rather than setting it inside the load `.then` before entities exist).

## Files to Touch

- `packages/web/src/generation-brief/GenerationBriefView.tsx` (modify)
- `packages/web/src/generation-brief/GenerationBriefView.test.tsx` (modify — add/extend tests; create if no co-located test exists)

## Out of Scope

- Any change to `selected_pov` / `pov_character` schemas, the compiler, validation rules, or the precedence of `selected_pov` over `pov_character`.
- The STORY CONFIG / PROSE MODE editor's own `pov_character` UUID entry (separate page; own ticket if confirmed — see Assumption Reassessment item 7).
- Multi-POV-per-prompt support (`selected_pov` remains a single value overriding PROSE MODE for the whole generation; this matches current behavior and FOUNDATIONS).
- Extracting a reusable entity-select component.

## Acceptance Criteria

### Tests That Must Pass

1. Component test: rendering the Generation Brief with a mocked ENTITY list shows a `<select>` for `selected_pov` whose options include each entity `displayLabel`, an "Omniscient" option, and a "Use PROSE MODE default" option.
2. Component test: choosing an entity option then saving sends `active_working_set.selected_pov` equal to that entity's UUID; choosing "Use PROSE MODE default" sends `selected_pov` undefined; neither produces a malformed-draft response shape.
3. Component test: a `pov_character` UUID matching a loaded entity renders the PROSE MODE line as `<displayLabel> / <person> / <tense>` (no bare UUID); `omniscient`/`variable` render literally.
4. `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. The value stored for `selected_pov` is always a valid entity UUID, the literal `"omniscient"`, or `undefined` — the UI can no longer submit a free-text non-UUID.
2. No UUID is rendered as the human-facing POV in either the select or the PROSE MODE source line when a matching entity exists.
3. No `@loom/core` file is modified; stored values and all `selected_pov`/`pov_character` consumers are unchanged.

## Test Plan

### New/Modified Tests

1. `packages/web/src/generation-brief/GenerationBriefView.test.tsx` — assert the select options, the save payload for each option, and the humanized PROSE MODE line; rationale: covers both the invalid-UUID fix and the display fix at the one surface they share.

### Commands

1. `npm test --workspace @loom/web -- GenerationBriefView` (targeted component proof) — adjust to the repo's Vitest invocation if the workspace filter differs.
2. `npm run lint && npm run typecheck && npm test` (full-pipeline gate per CLAUDE.md).
3. Narrower-command rationale: a co-located component test is the correct boundary because the entire change lives in one React view with no engine/schema impact; the full pipeline then confirms no cross-package type regression.

## Outcome

Completed: 2026-06-08

What changed:

- `GenerationBriefView` now loads ENTITY record summaries, renders `selected_pov` as a select with "Use PROSE MODE default", "Omniscient", and entity display-label options, and preserves dangling stored UUID values as explicit unknown-entity options.
- The PROSE MODE source line now resolves matching `pov_character` UUIDs to entity `displayLabel` while leaving `omniscient` and `variable` literals intact.
- Generation Brief tests now cover entity options, canonical UUID save payloads, default `undefined` save payloads, matching UUID humanization, literal rendering, and dangling UUID preservation. The cross-page readiness test mock was updated for the new `listRecords` dependency.

Deviations from original plan:

- None. No core files, schemas, compiler logic, validation logic, or downstream `selected_pov`/`pov_character` consumers changed.

Verification results:

- `npm test --workspace @loom/web -- GenerationBriefView` — passed.
- `npm test --workspace @loom/web -- readiness-cross-page` — passed after updating the existing mock for the new API dependency.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed.
