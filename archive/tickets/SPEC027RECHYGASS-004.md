# SPEC027RECHYGASS-004: Core deterministic hygiene compiler + contract/schema docs + version bump

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — new `@loom/core` modules `compiler/hygiene/{citation-keys,record-renderer,template,compile-record-hygiene-prompt}.ts`, `index.ts` export, `version.ts` bump (template→`1.2.0`, compiler→`1.4.0`, contract→`1.5.0`), and the §8-co-located `docs/compiler-contract.md` + `docs/story-record-schema.md` edits. Adds the deterministic `record_hygiene` prompt compiler; no change to the prose or ideation prompt contracts (their goldens change only in version metadata).
**Deps**: `archive/tickets/SPEC027RECHYGASS-002.md`, SPEC027RECHYGASS-003

> **Same revision; never merge standalone (§8).** Co-lands with the authority doc (SPEC027RECHYGASS-003): drift between the hygiene template authority, the compiler contract, and the compiler is a continuity bug (FOUNDATIONS §8). The `version.ts` bump and every golden/pin update land in this one revision (spec §7.5).

## Problem

The feature needs a deterministic renderer that turns a `StoryRecordHygieneSnapshot` into the inspectable `record_hygiene` prompt: 11 fixed sections in a fixed order, every in-scope record rendered as escaped canonical JSON with a stable citation key and reference summaries, plus fingerprint/token/count metadata. It must be a **separate** core entry point from `compilePrompt(ValidationSnapshot, …)`, and its addition bumps the template/compiler/contract versions — which ripples to every test that asserts the *produced* version metadata.

## Assumption Reassessment (2026-06-21)

1. **Compiler seams (codebase).** `compilePrompt(snapshot: ValidationSnapshot, options): CompileResult` at `packages/core/src/compiler/compile-prompt.ts:107` is the prose/ideation entry point — the hygiene compiler is a **separate** `compileRecordHygienePrompt`, not an overload. Existing `citationKey`/`citationKeysFor` (`compiler/ideation/citation-keys.ts`) emit `[type-n]`; hygiene keys use the uppercase `[TYPE-n]` form for multi-word types (`[OPEN THREAD-2]`, `[VISIBLE AFFORDANCE-1]`) and are compiler-generated, never derived from record text. `version.ts:26/30/34` hold the current `1.1.0`/`1.3.0`/`1.4.0` pins.
2. **Spec/doc authority.** `specs/SPEC-027` Deliverable 2 + proposal §6.4 (section order), §6.5 (snapshot), §6.6 (citation keys), §6.7 (payload policy), §6.8 (procedure), §6.9 (output format), §7.1 (module layout), §7.5 (version bumps), §11.4 (`compiler-contract.md` edits), §11.5 (`story-record-schema.md` §9.3). The authority doc (003) is the normative source this compiler renders.
3. **Cross-artifact boundary under audit.** Consumes `StoryRecordHygieneSnapshot`/`HygieneRecord` from `archive/tickets/SPEC027RECHYGASS-002.md`; renders the contract authored in SPEC027RECHYGASS-003 (same revision, §8). `docs/compiler-contract.md` (replace-targets verified at `:5` version pin, `:15` determinism sentence, `:21` `## 2.`) and `docs/story-record-schema.md` (insert §9.3 after `### 9.2 EMOTION` `:950`, before `## 10.` `:991`) co-land here per §8.
4. **FOUNDATIONS principle motivating this ticket.** §8 deterministic prompt compilation: a deterministic renderer, not an intelligence layer — identical snapshot/request/template+compiler+contract versions → identical prompt text; no LLM intermediary selects/ranks/summarizes/repairs records during compilation. The new compiler must satisfy this and must not alter the universal prose-prompt contract.
5. **Deterministic-compilation + secret-firewall enforcement surface (§8/§15) — this IS the surface.** Confirm: (a) record values serialize as canonical JSON with `<`,`>`,`&` escaped to `<`/`>`/`&`, rendered only inside a fixed `<record>` data block — never interpolated into a heading, XML tag, or instruction sentence (prevents payload text masquerading as prompt instructions); (b) ordering is deterministic (fixed type order → full display label → record id), never by score/salience/timestamp; (c) the fingerprint changes on any included payload/reference/request/version change and **not** on excluded timestamp/user-order changes; (d) SECRET payloads render as inert data — the firewall is enforced by the explicit inspectable send + no-logging (SPEC027RECHYGASS-006), not weakened here.
6. **Changed-constant blast radius (version bump — grep repo-wide for hardcoded assertions of the current value).** The bump breaks the **produced-assertion** sites (assert metadata read from the bumped source) — into Files to Touch: `packages/core/test/compiler-front-sections.test.ts:436-438` (asserts `versionInfo.*` directly), `packages/server/src/compile-routes.test.ts:160,189` (route `metadata.versions`), `packages/server/src/ideate.e2e.test.ts:97`, `packages/core/test/compiler-ideation-golden.test.ts:179`, plus `version.ts`, `docs/compiler-contract.md:5` pin, and (in 003) `docs/ACTIVE-DOCS.md:158`. The `1.0.0/1.2.0/1.3.0` sites (`compiler-golden.test.ts`, `validation-taxonomy-capstone.test.ts`, `field-guidance-doctrine.test.ts`, `generation-brief-draftability.e2e.test.ts`) are **inert older fixtures** — excluded. Three `versions:{1.1.0,…}` object-literal sites (`generate-routes.test.ts:147,183`, `ideate-routes.test.ts:71`, `schema-audit-cleanup-capstone.test.ts:299`) must be traced produced-vs-input at implementation: update only those whose literal is an *assertion of produced metadata*, not an inert fixture input.

## Architecture Check

1. **A separate entry point beats overloading `compilePrompt`.** The hygiene source contract (whole-project records-only) is fundamentally different from `ValidationSnapshot` (active-working-set + story config). A dedicated `compileRecordHygienePrompt(snapshot, request?)` avoids unsafe unions and prevents whole-project data from leaking into the prose/ideation compiler. Shared fingerprint/label/order/escaping utilities are extracted only where semantics are identical — no duplicate authority path.
2. **No backwards-compatibility aliasing/shims.** New modules; `ValidationSnapshot` is not widened, `compilePrompt` is not overloaded, and `promptKindSchema` is **not** extended with a `record_hygiene` arm (dedicated routes own the dispatch — spec Deliverable 4 / §Out of Scope).

## Verification Layers

1. Prompt has all 11 sections in exact §6.4 order, incl. truthful empty state → golden test (`record-hygiene-golden.test.ts`).
2. Canonical escaping prevents a hostile payload from opening/closing template tags or injecting a section → unit test with adversarial record text.
3. Deterministic record order + stable, unique citation keys under input permutation → unit test.
4. Fingerprint changes on included payload/reference/request/version change; unchanged on excluded timestamp/user-order change → unit test.
5. Prose + ideation goldens unchanged except expected version metadata → existing golden/route tests (their produced version assertions updated, structure unchanged).
6. Core platform/framework boundary intact → ESLint `no-restricted-imports` via `npm run lint`.

## What to Change

### 1. `compiler/hygiene/citation-keys.ts` (new)
Deterministic `[TYPE-n]` keys (uppercase type label, 1-based per-type ordinal after the §3.4 order), compiler-generated and stable for identical inputs; render the actual `record_id` alongside the key.

### 2. `compiler/hygiene/record-renderer.ts` (new)
Canonical escaped-JSON serialization of each in-scope record's full field set (escape `<`,`>`,`&`), the fixed `<record key=… record_id=… type=…>` block, and outgoing/incoming reference-summary rendering (citation keys when the target is in-snapshot, else raw id + locally-resolved label). Excluded ENTITY/CAST MEMBER payloads never render.

### 3. `compiler/hygiene/template.ts` (new)
The 11 static sections (`<record_hygiene_role>` … `<record_hygiene_output_format>`) as normative template text mirroring the authority doc, plus the truthful empty-records state.

### 4. `compiler/hygiene/compile-record-hygiene-prompt.ts` (new)
`compileRecordHygienePrompt(snapshot, request?)`: validate the fixed request, order records (type → full label → id), render every section, compute fingerprint, length/token estimate, counts-by-type, and version metadata; return a `CompileResult`.

### 5. `version.ts` (modify) + `index.ts` (modify)
Bump `templates.version` `1.2.0`, `compiler.version` `1.4.0`, `contract.version` `1.5.0`; export `compileRecordHygienePrompt` from `index.ts`.

### 6. `docs/compiler-contract.md` + `docs/story-record-schema.md` (modify)
Apply proposal §11.4 (contract-version pin → `1.5.0`, determinism-sentence rewrite, replace §2 source hierarchy, add §3.3 section order, add §4.1 source mapping, add §10 change-control rule) and §11.5 (insert §9.3 hygiene projection after §9.2 EMOTION).

### 7. Version-assertion test updates
Update the produced-assertion sites enumerated in Assumption Reassessment item 6 (and trace the three object-literal sites).

## Files to Touch

- `packages/core/src/compiler/hygiene/citation-keys.ts` (new)
- `packages/core/src/compiler/hygiene/record-renderer.ts` (new)
- `packages/core/src/compiler/hygiene/template.ts` (new)
- `packages/core/src/compiler/hygiene/compile-record-hygiene-prompt.ts` (new)
- `packages/core/src/version.ts` (modify)
- `packages/core/src/index.ts` (modify)
- `packages/core/test/record-hygiene-golden.test.ts` (new)
- `docs/compiler-contract.md` (modify)
- `docs/story-record-schema.md` (modify)
- `packages/core/test/compiler-front-sections.test.ts` (modify — version assertion)
- `packages/core/test/compiler-ideation-golden.test.ts` (modify — version assertion :179)
- `packages/server/src/compile-routes.test.ts` (modify — version assertion :160,189)
- `packages/server/src/ideate.e2e.test.ts` (modify — version assertion :97)

## Out of Scope

- The server snapshot builder/parser/routes (SPEC027RECHYGASS-005/006) and the web page (007).
- Any `promptKind`/`/api/compile` arm for `record_hygiene` (dedicated routes own dispatch — spec §Out of Scope).
- The `1.0.0/1.2.0/1.3.0` inert fixture sites (not produced from the bumped source).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test` — `record-hygiene-golden.test.ts` proves all 11 sections in exact order, the empty-source state, hostile-text escaping (no tag injection), deterministic order + citation-key stability under permutation, and fingerprint sensitivity (changes on included fields, stable on excluded timestamp/user-order).
2. `npm test` — prose and ideation goldens pass with only their **version metadata** updated; structure unchanged.
3. `npm run build && npm run typecheck && npm run lint` — `compileRecordHygienePrompt` exported and type-safe; ESLint core boundary clean.

### Invariants

1. Identical `(snapshot, request, template+compiler+contract versions)` → byte-identical prompt; no LLM intermediary in the compile path.
2. No record value is ever interpolated into a section heading, XML tag, or instruction sentence — record text renders only inside the escaped `<record>` data block.
3. `metadata.versions` is produced from `versionInfo`; every produced assertion of it matches the new pins, and `docs/compiler-contract.md` / `docs/ACTIVE-DOCS.md` pins agree.

## Test Plan

### New/Modified Tests

1. `packages/core/test/record-hygiene-golden.test.ts` (new) — golden prompt with every record type + hostile text; section-order, empty-state, escaping, ordering, citation-key, and fingerprint assertions.
2. `packages/core/test/compiler-front-sections.test.ts`, `packages/core/test/compiler-ideation-golden.test.ts`, `packages/server/src/compile-routes.test.ts`, `packages/server/src/ideate.e2e.test.ts` (modify) — bump the produced version assertions to `1.2.0/1.4.0/1.5.0`.

### Commands

1. `npm test -- record-hygiene-golden` — targeted compiler/golden coverage.
2. `npm run build && npm run typecheck && npm run lint && npm test` — full-pipeline gate (catches every produced version-assertion site across packages; an un-updated inert-vs-produced misclassification surfaces here).
3. Running the whole suite is the correct boundary because the version bump's blast radius spans `@loom/core` and `@loom/server` tests; a narrower run would miss a produced assertion in the other package.

## Outcome

Completed: 2026-06-21

What changed:
- Added the dedicated core record-hygiene compiler entry point `compileRecordHygienePrompt`, separate citation-key generation, fixed section templates, escaped canonical record rendering, deterministic ordering, empty-source rendering, counts-by-type metadata, and citation-map metadata.
- Exported the compiler and section constants from `@loom/core`.
- Bumped `packages/core/src/version.ts` to template `1.2.0`, compiler `1.4.0`, and contract `1.5.0`.
- Updated `docs/compiler-contract.md` and `docs/story-record-schema.md` with the project-review source profile, section order, source mapping, projection rules, and same-change change-control requirements.
- Added `packages/core/test/record-hygiene-golden.test.ts` for section order, empty state, hostile payload escaping, deterministic ordering/citation keys, and fingerprint behavior.
- Updated produced version assertions in core/server tests.
- Coupled this compiler and contract work in the same revision as SPEC027RECHYGASS-003 so the registered authority doc and implementation land together.

Deviations:
- The compiler uses compact static section text that mirrors the authority doc rather than embedding the full proposal prose in code.
- `CompileMetadata` gained optional `countsByType` and `citationMap` fields so the dedicated hygiene compiler can return the required review metadata without changing existing prose/ideation callers.

Verification:
- `npm test -- record-hygiene-golden` passed: 1 file, 5 tests.
- `npm run build` passed.
- `npm run typecheck` passed.
- `npm test` passed: 137 files, 1032 tests.
- `npm run lint --workspace @loom/core` passed.
- Path-scoped `npx eslint` over touched code/tests passed.
- `grep -nE "story-record-hygiene-prompt-template|project-review" docs/ACTIVE-DOCS.md docs/story-record-hygiene-prompt-template.md` passed.
- `grep -nE "1\\.2\\.0|1\\.4\\.0|1\\.5\\.0" docs/ACTIVE-DOCS.md docs/compiler-contract.md packages/core/src/version.ts` passed.
- `npm run lint` did not pass because the pre-existing untracked `.codex/worktrees/spec026-mutdrirob` checkout is inside the repo and ESLint traversed its generated `dist` files. This was unrelated to SPEC027RECHYGASS-003/004 and was left untouched.
