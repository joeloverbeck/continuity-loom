# SPEC022IDENATPRO-002: Short deterministic citation keys + keyed inline render sites

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — changes the ideation citation-key format (`[TYPE: full label]` → `[TYPE-n]`), adds an inline citation key at each operator-eligible record's single render site in the ideation prompt, adds a citation-coverage invariant, and refreshes the ideation golden + server round-trip fixtures + contract/template docs; the prose prompt and server verification logic are unchanged in shape.
**Deps**: `archive/tickets/SPEC022IDENATPRO-001.md`

## Problem

Ideation citation keys are `[<TYPE>: full display label]` (`packages/core/src/compiler/ideation/citation-keys.ts:23-29`), so each slot's `Grounds:` reprints full record text a third time and forces the model to echo multi-hundred-character keys verbatim — inviting transcription drift the server then flags as unknown citations (SPEC-022 §Problem Statement #2). This ticket replaces them with short deterministic `[<TYPE>-<n>]` keys and renders each operator-eligible record's key **inline, once**, at its authoritative section, so a short key in `Grounds:` always resolves to a visible record in the prompt. It depends on -001 because single-site keying is only correct once `<active_working_set>` is gone (otherwise records render at two sites) and once the locations/objects sub-blocks render every selected record (otherwise a non-active LOCATION/OBJECT key would resolve to nothing).

## Assumption Reassessment (2026-06-12)

1. `citationKeysFor` (`citation-keys.ts:8-21`) sorts records by `(type, displayLabel, id)` and assigns `[type: label]` with a `· 2`-style suffix counted **per `type: label`** (`citation-keys.ts:11-18`). Slot grounds already pull `keys.get(record.id)` (`packages/core/src/compiler/ideation/slot-assignment.ts:90`, rendered at `sections/ideation.ts:23`), so changing the key string flows to grounds automatically. The new format is `[<TYPE>-<n>]` with `<n>` a 1-based ordinal **per type** under the same sort — so the collision counter changes from per-`type:label` to per-`type`; the sort order is preserved.
2. SPEC-022 §A confirms the per-type key-render-site table and that key prefixes appear in the ideation prompt only. The operator-eligible types (union of `IDEATION_OPERATORS[].feedingTypes`, `packages/core/src/compiler/ideation/operators.ts:12-85`) are SECRET, BELIEF, FACT, EVENT, CLOCK, PLAN, INTENTION, OBLIGATION, CONSEQUENCE, RELATIONSHIP, OPEN THREAD, VISIBLE AFFORDANCE, OBJECT, LOCATION — EMOTION and ENTITY STATUS ground no operator and are correctly unkeyed.
3. Cross-artifact boundary under audit: the citation-key contract spans the compiler (key string + inline render), the server verifier (`packages/server/src/ideate-routes.ts:79`, `packages/server/src/ideation-parse.ts:16,81`), and the web display (-004). This ticket owns the compiler + server-fixture surfaces; `ideation-parse.ts`'s pattern `/\[[^\]]+\]/g` is format-agnostic and matches `[TYPE-n]` already, so the **parser needs no code change** — only its test fixtures and the round-trip test update. The UI provenance change is -004.
4. §8 deterministic compilation / §29.3 (the FOUNDATIONS surfaces touched): keying adds no LLM intermediary; ordinals derive from the existing deterministic sort, so identical inputs ⇒ identical keys (sort-stability holds under record-insertion permutation). The **citation-coverage invariant** — every key in any slot's `Grounds:` renders inline exactly once elsewhere — is the §29.3 guard that no grounded record (including a non-active LOCATION/OBJECT from `reincorporate_dormant`/`close_escape_route`) is cited but rendered nowhere.
5. Output-schema extension (the grounds-key value shape): consumers of the key string are the slot grounds (compiler), `citationKeysFor`-derived `validCitationKeys` (`ideate-routes.ts:79`, recomputed — flows automatically), the parser fixtures, and the web (-004). The change is a value-shape change, additive to no field; `citationKeysFor`'s return type (`ReadonlyMap<string,string>`) is unchanged.
6. Verified non-consequence: because the parse pattern is format-agnostic and the server recomputes `citationKeysFor` for verification, `ideation-parse.ts` and `ideate-routes.ts` production code need no change — unknown-key flagging still fires for fabricated keys. Only their tests' fixtures move to `[TYPE-n]`.

## Architecture Check

1. Keeping `citationKeysFor` the single source for both compile-time key strings and server verification (rather than a second key derivation) preserves the one-source guarantee the triage relied on. Inline keying is reached by threading the `citationKeysFor` map plus the prose/ideation signal into the record-rendering resolvers, so each ideation render site prepends `keys.get(record.id)`; the prose path passes no key map and is byte-identical. This is cleaner than a post-hoc string-rewrite pass, which would have to re-parse rendered lines to find records.
2. No backwards-compatibility aliasing: the old `[type: label]` format is removed outright, not kept behind a flag. There is no dual key scheme — the server, golden, and UI all move to `[TYPE-n]` in one revision.

## Verification Layers

1. Key format -> `compiler-ideation-golden.test.ts`: grounds match `[A-Z ]+-\d+` and no `[TYPE: label]` form remains.
2. Coverage invariant (§29.3) -> golden test: every key in every slot's `Grounds:` appears inline exactly once elsewhere in the compiled prompt.
3. Determinism / sort-stability (§8) -> golden test: two compiles from identical inputs yield identical key maps; permuting record insertion order does not change keys.
4. Server round-trip -> `ideate-routes.test.ts` / `ideation-parse.test.ts`: short keys parse; fabricated keys still flag as unknown citations.
5. Prose untouched -> `compiler-golden.test.ts` byte-identical.

## What to Change

### 1. Key format in `citation-keys.ts`

Emit `[<TYPE>-<n>]` where `<n>` is the 1-based ordinal of the record among records of the same `type` under the existing `(type, displayLabel, id)` sort. Replace the per-`type: label` collision counter with a per-`type` ordinal counter. Preserve the sort and the `ReadonlyMap<id,key>` shape.

### 2. Inline keyed render sites

Thread the `citationKeysFor(records)` map and the prose/ideation signal into the record-rendering resolvers so each ideation render site prepends the record's key. Affected resolver homes: `sections/pressure.ts` (PLAN/INTENTION → plans, CLOCK, OBLIGATION/CONSEQUENCE, OPEN THREAD, and the RELATIONSHIP lane of `relationship_emotion_pressure` — RELATIONSHIP keyed, EMOTION not); `sections/records-tail.ts` (FACT/BELIEF/EVENT sub-blocks, LOCATION/OBJECT/VISIBLE AFFORDANCE); `sections/front.ts` + `compile-prompt.ts`'s `renderSecretsAndRevealConstraintsSection` (SECRET). Prose rendering passes no key map (unchanged).

### 3. Golden, fixtures, contract/template docs (same revision, §8)

Refresh `golden-ideation.prompt.txt`; add the key-format/coverage/determinism assertions to `compiler-ideation-golden.test.ts`; move `ideation-slot-assignment.test.ts`, `ideation-parse.test.ts`, and `ideate-routes.test.ts` fixtures to `[TYPE-n]`. Update `docs/compiler-contract.md` (key format + the per-type key-render-site table) and `docs/ideation-prompt-template.md` (key format + the per-compile ordinal-stability note — no cross-session key identity is promised).

## Files to Touch

- `packages/core/src/compiler/ideation/citation-keys.ts` (modify)
- `packages/core/src/compiler/sections/pressure.ts` (modify)
- `packages/core/src/compiler/sections/records-tail.ts` (modify)
- `packages/core/src/compiler/sections/front.ts` (modify)
- `packages/core/src/compiler/compile-prompt.ts` (modify)
- `packages/core/test/golden-ideation.prompt.txt` (modify)
- `packages/core/test/compiler-ideation-golden.test.ts` (modify)
- `packages/core/test/ideation-slot-assignment.test.ts` (modify)
- `packages/server/src/ideation-parse.test.ts` (modify)
- `packages/server/src/ideate-routes.test.ts` (modify)
- `docs/compiler-contract.md` (modify)
- `docs/ideation-prompt-template.md` (modify)

## Out of Scope

- The section restructure / new relationship section / slim physical-continuity (`archive/tickets/SPEC022IDENATPRO-001.md` — prerequisite).
- Ideation-framed contract variants and the distinctness instruction (SPEC022IDENATPRO-003).
- UI grounds provenance — resolving short keys to labels in `SlateCard`/`keepers` (SPEC022IDENATPRO-004).
- Any change to record selection, slot assignment, operator taxonomy, dormancy logic, or the server's unknown-citation verification logic (only its test fixtures move).

## Acceptance Criteria

### Tests That Must Pass

1. `compiler-ideation-golden.test.ts`: grounds are of the form `[BELIEF-1]`; no `[TYPE: full label]` key remains; the coverage invariant holds (every grounds key renders inline exactly once); determinism + sort-stability assertions pass.
2. `ideation-parse.test.ts` / `ideate-routes.test.ts`: short keys round-trip; a fabricated key still surfaces in `unknownCitations`.
3. `compiler-golden.test.ts` (prose golden) byte-identical; `npm test`, `npm run lint`, `npm run typecheck` pass.

### Invariants

1. Every key appearing in any slot's `Grounds:` is rendered inline exactly once elsewhere in the ideation prompt (§29.3); EMOTION and ENTITY STATUS render unkeyed.
2. Identical inputs + versions ⇒ identical key map and identical prompt; ordinals derive only from the deterministic `(type, displayLabel, id)` sort (§8).

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-ideation-golden.test.ts` — key-format, coverage-invariant, and determinism/sort-stability assertions; golden expectations refreshed.
2. `packages/core/test/ideation-slot-assignment.test.ts` — assert slot grounds use `[TYPE-n]`.
3. `packages/server/src/ideation-parse.test.ts`, `packages/server/src/ideate-routes.test.ts` — fixtures use `[TYPE-n]`; unknown-key flagging still fires.

### Commands

1. `npx vitest run packages/core/test/compiler-ideation-golden.test.ts packages/core/test/ideation-slot-assignment.test.ts`
2. `npx vitest run packages/server/src/ideation-parse.test.ts packages/server/src/ideate-routes.test.ts`
3. `npm test` — full-pipeline gate (core build + all Vitest), the correct merge boundary since this ticket spans core and server.

## Outcome

Completed: 2026-06-12

What changed:
- Replaced ideation citation keys with deterministic per-type short keys such as `[BELIEF-1]` and `[VISIBLE AFFORDANCE-1]`.
- Threaded the ideation citation-key map into compiler renderers so each operator-eligible record renders its key inline once at its authoritative ideation section.
- Kept EMOTION and ENTITY STATUS records unkeyed, and kept the prose prompt unkeyed.
- Updated golden, slot-assignment, parser, route, and e2e fixtures for the short-key contract.
- Updated `docs/compiler-contract.md` and `docs/ideation-prompt-template.md` with the key format, ordinal semantics, and inline render-site table.

Deviations from original plan:
- None. UI label resolution remains out of scope for SPEC022IDENATPRO-004.

Verification:
- `npm exec -- vitest run packages/core/test/compiler-ideation-golden.test.ts packages/core/test/compiler-golden.test.ts packages/core/test/ideation-slot-assignment.test.ts packages/server/src/ideation-parse.test.ts packages/server/src/ideate-routes.test.ts` passed.
- `npm exec -- vitest run packages/server/src/ideate.e2e.test.ts` passed.
- `npm test` passed: 121 files, 909 tests.
- `npm run typecheck` passed.
- `npm run lint` passed.
