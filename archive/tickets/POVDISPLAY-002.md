# POVDISPLAY-002: Render the compiled `<prose_mode>` POV by entity name, not its UUID

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `@loom/core` compiler (`packages/core/src/compiler/sections/front.ts`), compiler-contract doc (`docs/compiler-contract.md`), version constants (`packages/core/src/version.ts`), and the two compiler test baselines (`golden-first-segment.prompt.txt`, `compiler-front-sections.test.ts`). No schema, validation, or storage change.
**Deps**: None. (Completes the cross-surface POV-display contract begun by `archive/tickets/POVDISPLAY-001.md`, which fixed only the Generation Brief React view.)

## Problem

The deterministic compiler renders the POV line of `<prose_mode>` as the raw stored UUID instead of the character's name. Observed in the generated prompt preview:

```
<prose_mode>
POV: 019ea213-8f7e-73dc-8e5b-67ba95ca94fe
Person: first
...
```

`pov_character` is, per `docs/story-record-schema.md:76`, `entity_id | omniscient | variable`. The resolver at `packages/core/src/compiler/sections/front.ts:32` passes the stored value through verbatim with no id→name lookup, so an entity UUID lands directly in the prompt. Every other identity rendering in the compiler resolves a name first (cast dossiers via `record.metadata?.displayLabel`, `packages/core/src/compiler/sections/cast.ts:236-238`); the POV line was simply never given that lookup. The bug is encoded in the frozen baseline: `packages/core/test/golden-first-segment.prompt.txt` shows `POV: 019b0298-…`, and `packages/core/test/compiler-front-sections.test.ts:171` actively asserts the buggy `POV: ${povId}`.

This violates two governing rules:
- A UUID in a prose-facing section is a "raw database dump", which `FOUNDATIONS.md:233` and `:250` forbid — the compiler must render records into prose-facing sections, not raw IDs.
- `docs/compiler-contract.md §9` lists record IDs as **validation-only**, "unless deliberately exposed for debugging outside the generated prompt." A POV UUID in the compiled prompt breaches that.

The contract is "store the UUID, render the name" — identical to what `POVDISPLAY-001` established for the Generation Brief view. Note `POVDISPLAY-001`'s premise ("the stored UUID is never rendered into the compiled prompt") was wrong for `<prose_mode>`; this ticket corrects that uncovered surface.

## Assumption Reassessment (2026-06-08)

1. **Resolver and value space, confirmed.** `packages/core/src/compiler/sections/front.ts:32` returns `valueOrEmpty(snapshot.storyConfig.proseMode?.pov_character, "pov_character")`. `valueOrEmpty`/`renderValue` (`front.ts:165-180`) only trim strings. `proseModeSchema.pov_character` is `z.union([recordId, z.enum(["omniscient", "variable"])])` (`packages/core/src/records/global-config.ts:39`). So the value reaching the resolver is an entity UUID, the literal `"omniscient"`, or the literal `"variable"`.
2. **Name-resolution pattern, confirmed.** The established in-compiler pattern is `record.metadata?.displayLabel ?? record.id` (`packages/core/src/compiler/sections/cast.ts:236-238`). Records in the snapshot carry `metadata.displayLabel` (`packages/core/src/validation/snapshot.ts:14-21`; populated server-side at `packages/server/src/snapshot-builder.ts:150-161`). For ENTITY records `metadata.displayLabel` equals `payload.display_name` (e.g. demo `packages/core/src/demo/letter-under-flour-bin.ts:104-113`).
3. **Deterministic-compilation surface under audit (template constant § matrix).** The resolver reads only `snapshot.storyConfig.proseMode` and `snapshot.records` — both already inside the deterministic snapshot. No LLM, no hidden state, no new source. `FOUNDATIONS.md §8` determinism and `§15` secret firewall are untouched: the stored `pov_character` value and every downstream consumer (`selected_pov ?? pov_character` precedence in `matrix-voice`/`matrix-knowledge`) are unchanged — only the prompt-facing **display** of one placeholder changes.
4. **FOUNDATIONS principle motivating the ticket.** Compiler "render[s] records into prose-facing prompt sections, not raw database dumps" (`FOUNDATIONS.md:233`); prompt-facing rendering uses human-readable values (`:250`). Restated: a POV UUID is a raw-ID leak into a prose-facing section and must become a name.
5. **Snapshot scope / fallback, confirmed.** The compiler snapshot contains only **selected** records (`packages/server/src/snapshot-builder.ts:119-140` iterates `active_working_set.selected_records`). When `pov_character` references an entity not in the selected set, the id→name lookup finds nothing and falls back to the raw id (matching `cast.ts:236-238`). Surfacing that case to the author is **POVDISPLAY-003** and is explicitly out of scope here.
6. **Change-control obligation (additive display change, no schema change).** `docs/compiler-contract.md §10` requires that any change to a prompt placeholder's rendering update the compiler contract **in the same revision**. The `{pov_character}` row (currently grouped at `compiler-contract.md:95`) and the §9 ID-handling note must be updated here. The golden re-baseline guard (`compiler-golden.test.ts:162` "Re-baseline this fixture only with a deliberate template/compiler/contract version change.") requires a deliberate version bump alongside the new baseline.
7. **Baselines affected, confirmed.** (a) Byte-for-byte golden uses `demoRecords` + demo proseMode (`pov_character = elinEntity`, all records selected) → must change to `POV: Elin Vale` (`compiler-golden.test.ts:152-164`, `golden-first-segment.prompt.txt`). (b) `compiler-front-sections.test.ts` `povId` (`:10`) is **not** in `selected_records` (`:61`) and has no ENTITY record, so it currently exercises the fallback path; the fixture must add a selected ENTITY record with a `displayLabel` for `povId` so the test can assert the resolved **name** at `:171`. (c) `goldenInput()`'s `pov_character` is CAST MEMBER `…501` (`compiler-golden.test.ts:16-19`, selected), which resolves to displayLabel "Mara"; any prose_mode assertion there must reflect the name.

## Architecture Check

1. A dedicated `pov_character` resolver that reuses the existing `displayLabel`-lookup pattern keeps name resolution consistent with cast rendering and confines the change to one placeholder. It reads only snapshot-internal data, preserving determinism and the existing `selected_pov ?? pov_character` precedence untouched. Pulling `{pov_character}` into its own compiler-contract row (out of the grouped style row) is cleaner than overloading the grouped row's shared "missing behavior", because this placeholder now has distinct resolution semantics (id→label + literal pass-through + id fallback).
2. No backwards-compatibility aliasing/shims: the verbatim pass-through is replaced outright; no dual render path is retained. Stored value and consumers are identical.

## Verification Layers

1. POV UUID is resolved to the entity `displayLabel` in `<prose_mode>` -> component test (`compiler-front-sections.test.ts`: a selected ENTITY record with `displayLabel` for the POV id renders `POV: <name>`, never the bare UUID).
2. `"omniscient"`/`"variable"` literals pass through unchanged -> component test asserting each literal renders verbatim.
3. Unresolvable POV (entity not selected) falls back to the raw id without throwing -> component test (POV id absent from records still compiles; documents the POVDISPLAY-003 boundary).
4. Whole-prompt determinism preserved and baseline deliberately re-based -> golden test passes byte-for-byte against the updated `golden-first-segment.prompt.txt` with bumped compiler/contract versions; `compilePrompt` remains pure (no determinism regression).
5. Stored value and consumers unchanged -> grep-proof that no `pov_character`/`selected_pov` consumer (`matrix-voice`, `matrix-knowledge`, schemas, repository) is modified.

## What to Change

### 1. Resolve the POV display name (`packages/core/src/compiler/sections/front.ts`)

- Replace the `pov_character` entry (`:32`) with a resolver that:
  - returns the literal verbatim when the value is `"omniscient"` or `"variable"`;
  - otherwise treats the value as a record id, finds the matching record in `snapshot.records`, and returns `record.metadata?.displayLabel`;
  - falls back to the raw value (the id) when no record matches or the value is blank, then through `EMPTY_STATE_CONSTANTS.pov_character` for the empty case — mirroring `cast.ts:236-238` and the existing `valueOrEmpty` empty-state behavior.
- Keep the resolver registered with the same `required: true` / `missingBehavior: "block"` wrapper as the other front resolvers (`front.ts:149-163`).

### 2. Update the compiler contract (`docs/compiler-contract.md`)

- Split `{pov_character}` out of the grouped row at `:95` into its own row: deterministic source = PROSE MODE `pov_character` resolved to the referenced record's `displayLabel`; `omniscient`/`variable` render as literals; when the referenced entity is not among selected records the raw id renders and POVDISPLAY-003's warning applies.
- Add a sentence to §9 noting the POV id is resolved to a human label for `<prose_mode>` and is therefore the one id-derived value that is intentionally rendered as a name (not a raw-ID debug exposure).

### 3. Bump contract/compiler versions (`packages/core/src/version.ts`)

- Bump `compiler.version` (`1.1.0` → `1.2.0`) and `contract.version` (`1.1.0` → `1.2.0`) to signal the deliberate rendering + contract change. Leave `templates.version` at `1.0.0` (no template-constant change). Update the hardcoded version literals in the compiler tests to match (`compiler-golden.test.ts:139,157`).

### 4. Re-baseline the test fixtures

- `packages/core/test/golden-first-segment.prompt.txt`: change the prose_mode POV line to `POV: Elin Vale`.
- `packages/core/test/compiler-front-sections.test.ts`: add a selected ENTITY record (`id = povId`, `metadata.displayLabel = "<name>"`) to `records` and `selected_records`, and change the `:171` assertion from `POV: ${povId}` to the resolved name. Add the literal-pass-through and unresolved-fallback assertions (Verification Layers 2–3).

## Files to Touch

- `packages/core/src/compiler/sections/front.ts` (modify)
- `docs/compiler-contract.md` (modify)
- `packages/core/src/version.ts` (modify)
- `packages/core/test/golden-first-segment.prompt.txt` (modify)
- `packages/core/test/compiler-golden.test.ts` (modify — version literals; prose_mode name assertion if present)
- `packages/core/test/compiler-front-sections.test.ts` (modify)

## Out of Scope

- Any author-facing surfacing of an unresolvable/unselected POV entity (warning/blocker) — that is POVDISPLAY-003.
- Changing `pov_character`/`selected_pov` schemas, the `selected_pov ?? pov_character` precedence, or any downstream consumer.
- The Generation Brief / STORY CONFIG editor UI (already handled by POVDISPLAY-001; the editor's own `pov_character` entry, if still raw, remains its own ticket per POVDISPLAY-001 item 7).
- Multi-POV-per-prompt support.

## Acceptance Criteria

### Tests That Must Pass

1. `compiler-front-sections.test.ts`: a selected ENTITY record with `displayLabel` for the POV id renders `<prose_mode>` POV as that name; no bare UUID appears in the section.
2. `compiler-front-sections.test.ts`: `pov_character = "omniscient"` and `= "variable"` render the literal verbatim.
3. `compiler-front-sections.test.ts`: a `pov_character` id absent from selected records compiles without throwing and renders the raw id (documented fallback; POVDISPLAY-003 boundary).
4. `compiler-golden.test.ts`: the byte-for-byte golden matches the updated `golden-first-segment.prompt.txt` (`POV: Elin Vale`) with bumped versions.
5. `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. No record UUID is rendered into `<prose_mode>` when the referenced record is present in the snapshot.
2. The stored `pov_character`/`selected_pov` values and every downstream consumer are unchanged (display-only change).
3. `compilePrompt` stays deterministic and pure; the `@loom/core` import boundary is not crossed (no `node:*`/framework imports added).

### Invariants → proof

1. Invariant 1 → `compiler-front-sections.test.ts` + golden assertion.
2. Invariant 2 → grep-proof no consumer/schema file modified.
3. Invariant 3 → existing core boundary test + golden determinism test.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-front-sections.test.ts` — add a selected POV ENTITY record; assert name rendering, literal pass-through, and unresolved fallback; rationale: this is the unit surface where the resolver behavior is observable.
2. `packages/core/test/golden-first-segment.prompt.txt` + `compiler-golden.test.ts` — re-baseline the demo first-segment prompt and version literals; rationale: locks the end-to-end prompt output for the demo.

### Commands

1. `npm test --workspace @loom/core -- compiler-front-sections` (targeted resolver proof).
2. `npm test --workspace @loom/core -- compiler-golden` (baseline proof).
3. `npm run lint && npm run typecheck && npm test` (full-pipeline gate per CLAUDE.md).

## Outcome

Completion date: 2026-06-08

Changed the core front-section compiler so `{pov_character}` renders the selected POV record's human display label instead of a raw UUID, while preserving `omniscient` and `variable` literal rendering and retaining the raw-id fallback for unresolved selected-record lookups. Updated the compiler contract, bumped compiler/contract versions to `1.2.0`, rebaselined the first-segment golden prompt to `POV: Elin Vale`, and updated route/test metadata expectations to the new versions.

Deviation from original plan: the server validation snapshot uses `metadata.displayLabel`, but the exported core demo fixture used by the golden prompt carries its display label as a top-level `displayLabel`. The resolver handles both label shapes, with server production snapshots still using the metadata path.

Verification results:

- `npm test --workspace @loom/core -- compiler-front-sections` passed.
- `npm test --workspace @loom/core -- compiler-golden` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 99 files, 625 tests.
