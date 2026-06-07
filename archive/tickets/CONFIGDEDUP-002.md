# CONFIGDEDUP-002: De-register STORY CONTRACT / UNIVERSAL CONTENT POLICY / PROSE MODE as story-record types

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — record registry (`packages/core/src/records/registry.ts`, `global-config.ts`), compile-destinations preview (`packages/core/src/records/compile-destinations.ts`), and their tests. No prompt-template, compiler-output, or validation-rule behavior change.
**Deps**: CONFIGDEDUP-001 (the migration must move existing global-config records into `story_config` before/with this de-registration, otherwise those rows become unloadable).

## Problem

`STORY CONTRACT`, `UNIVERSAL CONTENT POLICY`, and `PROSE MODE` are registered as story-record types through `globalConfigDefinitions`, which folds them into `recordTypes`. This produces three "Create …" buttons on `/records` (`RecordBrowser.tsx:358-368`, rendered from `recordTypes`) that write rows the compiler never reads — the compiler and validator source these three solely from the `story_config` table (the `/story-config` page). The record path is therefore a **dead, duplicate authority path**, which CLAUDE.md conventions and `docs/ACTIVE-DOCS.md` non-negotiables explicitly forbid.

Worse, `compile-destinations.ts:55-76` maps these three record types into the `story_contract_and_prose_mode` compile family, so the "what will compile" preview tells the user a selected `STORY CONTRACT` record will land in the prompt — it never does (brushes FOUNDATIONS §29.3: the inspect-what-will-compile surface misinforms).

This ticket removes the record-type registration so the three kinds exist **only** as per-story config, making the `story_config` store the single authority. It is the de-duplication half of the fix; CONFIGDEDUP-001 preserves existing authored data.

FOUNDATIONS basis: §13 (atomic record enumeration deliberately excludes these three), §6 (keep the five continuity surfaces distinct), §8/§29.4 (deterministic compilation; no misleading compile-preview), and the ACTIVE-DOCS invariant against duplicate authority paths.

## Assumption Reassessment (2026-06-07)

1. **Registration mechanics confirmed.** `globalConfigDefinitions` (`packages/core/src/records/global-config.ts:57-78`) is spread into `definitions` (`packages/core/src/records/registry.ts:25-26`), which builds both `recordTypeRegistry` (`registry.ts:35-37`) and `recordTypes` (`registry.ts:39`). The `/records` create rail iterates `recordTypes` (`packages/web/src/records/RecordBrowser.tsx:358-368`), and record editor descriptors derive from `recordTypeRegistry` (`packages/core/src/records/editor-descriptors.ts:3`) — so removing the registry entry **automatically** drops both the three create buttons and their editor descriptors; no separate web change is required for those.
2. **The schemas must survive removal.** `storyContractSchema`, `universalContentPolicySchema`, `proseModeSchema`, and the `StoryContract` / `UniversalContentPolicy` / `ProseMode` types are exported from `global-config.ts` and consumed by the `story_config` path (`packages/server/src/record-repository.ts:73-77` `storyConfigSchemas`; `packages/server/src/snapshot-builder.ts` `loadStoryConfig`; compiler resolvers in `packages/core/src/compiler/sections/front.ts`). Only the `globalConfigDefinitions` **record-type wrapper** is removed; the schemas and types stay exported.
3. **Shared boundary under audit:** the record-type registry (`recordTypes` / `recordTypeRegistry`) as the contract consumed by `RecordBrowser`, `editor-descriptors`, `compile-destinations`, `parseRecordPayload`, and core/web tests. The change is the removal of three entries from that contract; the `story_config` contract is untouched.
4. **FOUNDATIONS principle restated:** §13 — these three are not atomic record types; §6 — config belongs on the config surface; §8/§29.4 — the compiler and its inspection surfaces must be honest about what compiles, so the false `compile-destinations` mapping for these types must go.
5. **Removal blast radius (grep-proof required before/with implementation).** Repo-wide references to the three type strings as *record types* (distinct from their legitimate `story_config` / compiler-contract usage): `packages/core/src/records/compile-destinations.ts:70,73,74` (`recordTypeFamilies` entries — remove), `packages/core/src/records/global-config.ts` (`globalConfigDefinitions` — remove), `packages/core/src/records/registry.ts:6,26` (import + spread — remove), and tests asserting these as creatable record types (`packages/core/test/records.test.ts`, plus any `recordTypes`/createRail assertions in `packages/web/src/records/*.test.tsx`). Grep `rg -n "STORY CONTRACT|UNIVERSAL CONTENT POLICY|PROSE MODE" packages/**/*.ts packages/**/*.tsx` and, for each hit, classify as *record-type usage* (remove/update) vs *story_config / compiler-contract usage* (leave intact). Do not touch `story-config-routes.ts`, `record-repository.ts` `storyConfigSchemas`, `snapshot-builder.ts`, `demo-creation.ts` (which already seeds via `setStoryConfig`), or `compiler/sections/front.ts`.
6. **Compilation safety (§8 / §29.4).** This change does not alter compiler output for any project: the compiler already reads only `snapshot.storyConfig`. Removing the dead record path and its false preview makes the compile surfaces deterministic-and-honest; it cannot make output nondeterministic. Verify no validation rule keys off these being record types (the `missing-story-config` checks read `story_config`, not record presence).
7. **Adjacent contradiction classification:** existing red-bunny rows of these types are a **required dependency** handled by CONFIGDEDUP-001, not this ticket. Without that migration, opening a project with such rows would throw `Unsupported record type` from `parseRecordPayload` during `listRecords` — hence the hard dependency.

## Architecture Check

1. Removing the duplicate registration (single authority = `story_config`) is cleaner than: (a) keeping both and syncing them — that is the forbidden duplicate-authority-path with hidden state; or (b) only hiding the `/records` buttons in the web layer — that leaves the dead registry entry, the misleading `compile-destinations` mapping, and the record-type create API still live. Editor descriptors and create buttons collapse automatically from the single registry edit, which is the minimal correct surface.
2. No backwards-compatibility aliasing/shims. The `globalConfigDefinitions` export and its registry spread are deleted outright (schemas/types retained for the config path). No alias `recordType` remains.

## Verification Layers

1. The three kinds are no longer record types → codebase grep-proof (`recordTypes` from `@loom/core` excludes all three; `getRecordTypeDefinition('STORY CONTRACT')` is `undefined`).
2. `/records` no longer offers create buttons for them → schema/UI test (`RecordBrowser` renders no "Create STORY CONTRACT/UNIVERSAL CONTENT POLICY/PROSE MODE" button) — follows from layer 1, asserted in a web test.
3. The compile-preview no longer claims these compile as records → codebase grep-proof (`compile-destinations.ts` `recordTypeFamilies` has no entry for the three; `whatWillCompile` routes a hypothetical such record to `other_selected_records` only via the default, and no production path can produce one post-migration).
4. The `story_config` path is untouched and still compiles → FOUNDATIONS alignment check (§8) + test (`compile-routes` / `snapshot-builder` suites still pass; demo project still compiles its contract/policy/prose-mode).
5. Creating an unknown/removed type fails closed → schema validation (`parseRecordPayload('STORY CONTRACT', …)` throws `Unsupported record type`).

## What to Change

### 1. Remove the record-type registration (core)

- `packages/core/src/records/registry.ts`: remove the `globalConfigDefinitions` import (`registry.ts:6`) and its spread from `definitions` (`registry.ts:26`).
- `packages/core/src/records/global-config.ts`: remove the `globalConfigDefinitions` export (lines 57-78) and the now-unused `RecordTypeDefinition` / `compactReferences` imports if they become unused. **Keep** `storyContractSchema`, `universalContentPolicySchema`, `proseModeSchema`, and the three exported types.

### 2. Remove the misleading compile-preview mapping (core)

- `packages/core/src/records/compile-destinations.ts`: delete the `recordTypeFamilies` entries for `PROSE MODE` (line 70), `STORY CONTRACT` (line 73), and `UNIVERSAL CONTENT POLICY` (line 74). Leave the `story_contract_and_prose_mode` family id and label in place (still used as a prompt-family ordering concept); it simply no longer receives any record.

### 3. Update tests (core + web)

- `packages/core/test/records.test.ts`: drop/adjust assertions that treat the three as registered record types or that round-trip them through `parseRecordPayload` / `extractRecordReferences` / `whatWillCompile`.
- `packages/web/src/records/*.test.tsx`: drop assertions expecting create buttons for the three; add an assertion that none are rendered. (Per Assumption 5, grep-confirm the exact test files first.)

## Files to Touch

- `packages/core/src/records/registry.ts` (modify)
- `packages/core/src/records/global-config.ts` (modify)
- `packages/core/src/records/compile-destinations.ts` (modify)
- `packages/core/test/records.test.ts` (modify)
- `packages/web/src/records/RecordBrowser.test.tsx` (modify — exact filename confirmed via grep during implementation)

## Out of Scope

- Migrating or deleting existing global-config records — **CONFIGDEDUP-001** (hard dependency).
- Any change to `/story-config`, `story-config-routes.ts`, `story_config` schema, `snapshot-builder`, the compiler resolvers, or the prompt template.
- Removing the `story_contract_and_prose_mode` compile-family id/label (still a valid prompt section concept).
- Documentation edits to `docs/story-record-schema.md` / `docs/compiler-contract.md` (those already frame these as "story configuration"; no correction required by this fix).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test` — full suite (builds `@loom/core` first) green, including updated `records.test.ts` and web record-browser tests.
2. `npm run lint` — passes, including the `@loom/core` import-boundary rule (no new `node:*`/framework imports introduced).
3. `npm run typecheck` — clean (confirms no remaining consumer imports `globalConfigDefinitions`).

### Invariants

1. `recordTypes` (exported from `@loom/core`) contains none of `STORY CONTRACT`, `UNIVERSAL CONTENT POLICY`, `PROSE MODE`; `getRecordTypeDefinition` returns `undefined` for each.
2. The `story_config` path (page → `/api/story-config/:kind` → `story_config` table → `loadStoryConfig` → compiler) is unchanged and remains the single authority for these three kinds.
3. No duplicate transport path for story contract / content policy / prose mode remains in the codebase.

## Test Plan

### New/Modified Tests

1. `packages/core/test/records.test.ts` — assert the three are not registered record types and that `parseRecordPayload` throws for them; keep coverage of the remaining record types intact.
2. `packages/web/src/records/RecordBrowser.test.tsx` — assert the create rail renders no button for the three kinds.

### Commands

1. `rg -n "STORY CONTRACT|UNIVERSAL CONTENT POLICY|PROSE MODE" packages/core/src/records/` — expect hits only in `global-config.ts` (schemas/types) and `compile-destinations.ts` family label context, none as `recordTypeFamilies` keys or registry entries.
2. `npm test`
3. `npm run lint && npm run typecheck`

## Outcome

Completed: 2026-06-07

What changed:

- Removed `globalConfigDefinitions` and its spread into the core record registry, while keeping the three config schemas and exported types.
- Removed the three false `recordTypeFamilies` mappings from `compile-destinations.ts`.
- Removed stale label-field fallbacks for the three config kinds from `editor-descriptors.ts`.
- Updated core tests to prove `recordTypes` excludes the three kinds, `getRecordTypeDefinition` returns `undefined`, and `parseRecordPayload("STORY CONTRACT", ...)` fails closed.
- Updated compile-destination tests to prove hypothetical config-kind records route only to `other_selected_records`.
- Updated `RecordBrowser` tests to prove the create rail offers no buttons for the three config kinds.
- Split the story configuration editor from record-type registration by letting `RecordEditor` accept an explicit descriptor/schema and by giving `StoryConfigEditor` its own config descriptors backed by the existing story-config schemas.

Deviations from original plan:

- `StoryConfigEditor.tsx` and `RecordEditor.tsx` needed scoped changes because the story-config page was previously borrowing record-editor descriptors from `recordTypeRegistry`; removing the duplicate record types otherwise made the legitimate `/story-config` page render "Unsupported record type." The final path keeps `story_config` editable without reintroducing record-type registration.

Verification:

- Targeted tests passed: `packages/web/src/config/StoryConfigEditor.test.tsx`, `packages/web/src/records/RecordBrowser.test.tsx`, `packages/core/test/records.test.ts`, and `packages/core/test/compile-destinations.test.ts`.
- Record-path grep proof passed with no hits for `globalConfigDefinitions`, global-config `recordType:` wrappers, or global-config `recordTypeFamilies` mappings.
- `npm test` passed: 75 files, 460 tests.
- `npm run lint` passed.
- `npm run typecheck` passed.
- Production localhost smoke via `npm start` + Playwright opened red-bunny, confirmed `/records` create rail no longer offered `Create STORY CONTRACT`, `Create UNIVERSAL CONTENT POLICY`, or `Create PROSE MODE`, and confirmed `/story-config` still rendered editable Story Contract, Universal Content Policy, and Prose Mode sections. The only console error was the expected 404 for missing red-bunny `PROSE MODE`.
