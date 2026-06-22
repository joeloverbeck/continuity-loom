# SPEC030RECHYGWOR-002: Core request modes, compiler scope disclosure, version bump, and §8 contract docs

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — widens `RecordHygieneRequest.mode`; adds a scope-disclosure line to the record-hygiene compiler; bumps the template/compiler/contract version triple in `packages/core/src/version.ts`; co-lands the §8-bound prompt-contract docs (`docs/compiler-contract.md`, `docs/story-record-hygiene-prompt-template.md`, `docs/story-record-schema.md §9.3`); refreshes all goldens asserting the produced version triple.
**Deps**: SPEC030RECHYGWOR-001

## Problem

To let the author scope hygiene to the active working set, the request must carry a second mode and the compiled prompt must disclose the active scope (the reworded §29.3 hard fail requires disclosure in the compiled prompt). This ticket widens the core request type and makes the compiler a scope-aware deterministic renderer — it renders whichever scope it is told, and discloses it — while the actual scope *selection* happens server-side in -003. Because the compiled prompt changes (a new scope line) and the prompt-template/source-contract docs change, FOUNDATIONS §8 mandates a version bump and co-landing the template + compiler-contract + schema-projection docs in the same change. The shared version triple means the bump ripples into every golden asserting produced version metadata.

## Assumption Reassessment (2026-06-22)

1. Current core surfaces confirmed this session: `RecordHygieneRequest` is `{ mode: "full_active_atomic_review" }` at `packages/core/src/compiler/hygiene/types.ts:22-24`; `normalizeRequest` rejects any non-default mode at `compile-record-hygiene-prompt.ts:59-65`; the compiler renders `request_mode` at `:95` and stamps `versionInfo` versions at `:37-39`; `versionInfo` is the single shared triple `templates 1.3.0 / compiler 1.5.0 / contract 1.6.0` at `packages/core/src/version.ts:26/30/34`.
2. Specs/docs confirmed: the spec's Deliverable 1 + premise verification (`specs/SPEC-030-record-hygiene-working-set-scope.md:99-101,251-268`) fixes the proposed bumps at template `1.4.0` / compiler `1.6.0` / contract `1.7.0`. The §8-bound docs to co-land here are named by reassess finding I1 with exact line anchors: `docs/compiler-contract.md:46` ("fixed `RecordHygieneRequest`"), `:49` (excludes active-working-set membership), `:53` (compiler must-not-filter clause — unchanged); `docs/story-record-hygiene-prompt-template.md:11` (intro "does not read … active-working-set membership"), `:17` (§1 Excluded list), `:78` (§8 only-mode), `:134` (§11 quarantine), `:3` (status banner); `docs/story-record-schema.md:991-997` (§9.3 projection note).
3. Cross-artifact boundary under audit: the shared `versionInfo` triple feeds every prompt class's metadata. Bumping it for a hygiene-only change changes the asserted version metadata of prose, ideation, and hygiene goldens alike — this is the spec's accepted consequence ("prose + ideation goldens unchanged except expected version metadata," `:339-340`). The template↔compiler↔contract docs cross-reference each other's mode count; they must co-land or they contradict (the §8 "drift between template, schema, and contract is a continuity bug" rule).
4. FOUNDATIONS principle restated: §8 — the compiler is a deterministic renderer; it must render whatever the snapshot contains in fixed order and must not filter/rank/evict. This ticket keeps the compiler a pure renderer (the scope line reflects the mode it is *given*; the snapshot is built upstream in -003), so identical snapshot + request + versions → identical prompt. The compiler does NOT itself read the working set.
5. Deterministic-compilation enforcement surface: `compileRecordHygienePrompt`. Confirm the widened `mode` union and the new scope line introduce no nondeterminism (no wall-clock, no collection-order dependence — the scope line is a fixed string keyed off `request.mode`) and no LLM intermediary. The secret firewall is unaffected (no new source; SECRET payload handling is unchanged).
6. Existing output schema extended: `RecordHygieneRequest.mode` widens from a single string literal to a two-member union; the default stays `full_active_atomic_review`. This is **additive** for existing constructors (every existing `{ mode: "full_active_atomic_review" }` stays valid) — confirmed the only construction sites are `compile-record-hygiene-prompt.ts:19` and `record-hygiene-routes.ts:10`, both using the default. No constructor breaks.
7. Version-bump blast radius (changed-constant grep): the bumped triple is asserted *literally* in ~15 produced-version test files — core: `record-hygiene-golden.test.ts:21`, `compiler-front-sections.test.ts`, `compiler-golden.test.ts`, `compiler-ideation-golden.test.ts`, `cross-pillar-contracts.test.ts`, `field-guidance-doctrine.test.ts`, `ideation-request-rendering.test.ts`, `ideation-taxonomy-capstone.test.ts`, `schema-audit-cleanup-capstone.test.ts`, `validation-taxonomy-capstone.test.ts`; server: `compile-routes.test.ts:160,189`, `generate-routes.test.ts`, `generation-brief-draftability.e2e.test.ts`, `ideate-routes.test.ts`, `ideate.e2e.test.ts`. **Inert fixture inputs are excluded** — `packages/core/test/support/arbitraries/validation-snapshots.ts:126-128` builds a snapshot's own `versions` field as arbitrary input (`compiler: "1.3.0"`, already divergent from real `versionInfo`) and never tracks the bumped source; web tests assert versions dynamically and stay green. Method: bump `version.ts`, run `npm test`, update exactly the failing produced-version assertions.
8. Adjacent contradiction classification: after this ticket the §8 docs describe a working-set scope the *server* does not yet apply (that lands in -003). This is a required, transient documents-ahead window, not a separate bug — the working-set mode is not route-reachable until -003 rewords `record-hygiene-routes.ts:136`, so no user can hit the gap; and the compiler genuinely supports both modes. Acceptance below does NOT claim end-to-end working-set scoping works.

## Architecture Check

1. Widening the existing `mode` union and rendering a scope line keeps the compiler a single deterministic renderer with one source contract — cleaner than a parallel scoped-hygiene compiler, which would duplicate ordering/serialization logic and create two drift surfaces. Applying scope upstream (snapshot builder, -003) rather than in the compiler preserves the §8 renderer boundary.
2. No backwards-compatibility aliasing/shims: the `mode` union is widened in place; `normalizeRequest` accepts exactly the two valid modes and rejects all others. No deprecated-mode alias retained.

## Verification Layers

1. `RecordHygieneRequest.mode` accepts exactly the two modes; `normalizeRequest` rejects a third → schema validation (core unit test on `normalizeRequest`).
2. Compiler renders `request_mode` + the scope line deterministically for both modes; identical snapshot + request + versions → identical prompt → codebase grep-proof + golden test (`record-hygiene-golden.test.ts`).
3. Produced version metadata equals the bumped triple everywhere it is asserted → schema validation (run `npm test`; every produced-version assertion updated).
4. Template↔compiler-contract↔schema docs mutually consistent (same mode count, same scope wording, contract pin = `version.ts`) → FOUNDATIONS alignment check (§8) + grep-proof on the version pin.

## What to Change

### 1. Widen the request mode (core)

In `packages/core/src/compiler/hygiene/types.ts`, widen `RecordHygieneRequest.mode` to `"full_active_atomic_review" | "active_working_set_atomic_review"`; default stays `full_active_atomic_review`. Update `normalizeRequest` (`compile-record-hygiene-prompt.ts:59-65`) to accept both modes and reject any other string.

### 2. Render the active scope (core compiler)

Keep `request_mode` and add a deterministic human-readable scope line in the records/source section (e.g. `hygiene_scope: whole_project | active_working_set`, keyed off `request.mode`). The compiler does not read or filter by the working set — it renders the snapshot it is given.

### 3. Bump the version triple + refresh goldens

In `packages/core/src/version.ts`: `templates.version` → `1.4.0`, `compiler.version` → `1.6.0`, `contract.version` → `1.7.0`. Then run `npm test` and update every failing produced-version assertion (the ~15 files in Assumption Reassessment item 7). Add the whole-project golden's new scope line and a new working-set-scope golden (subset corpus, scope disclosed) plus the empty-working-set-scope golden (truthful empty state, distinct from empty-project) in `record-hygiene-golden.test.ts`. Do NOT touch inert fixture inputs (`validation-snapshots.ts:126`).

### 4. Co-land the §8-bound contract docs

- `docs/compiler-contract.md`: contract-version pin → `1.7.0`; add the record-hygiene request modes and the scope-disclosure mapping to §2.2; de-fix "fixed `RecordHygieneRequest` input" (`:46`); qualify the §2.2 exclusion of active-working-set membership (`:49`) so it stays excluded as a prose-prompt source but is read as the scope input in working-set mode; leave the compiler must-not-filter clause (`:53`) unchanged.
- `docs/story-record-hygiene-prompt-template.md`: move active-working-set membership from §1 "Excluded" (`:17`) to an explicit optional scope selector; add the second request mode + scope-disclosure section line to §8 (`:78`); reword the intro (`:11`, "does not read … active-working-set membership"); reword §11 UI Quarantine (`:134`) to distinguish a read-only scope selector from a working-set *mutation* control; update the status banner (`:3`). Keep §2 predicate and §§3–7 unchanged.
- `docs/story-record-schema.md`: amend the §9.3 hygiene projection note (`:991-997`) to record the user-selected scope (reads `active_working_set.selected_records`; no stored fields; no effect on prose compilation, validation, or lifecycle).

## Files to Touch

- `packages/core/src/compiler/hygiene/types.ts` (modify)
- `packages/core/src/compiler/hygiene/compile-record-hygiene-prompt.ts` (modify)
- `packages/core/src/version.ts` (modify)
- `packages/core/test/record-hygiene-golden.test.ts` (modify) — new scope line + working-set + empty-scope goldens + version triple
- `packages/core/test/compiler-front-sections.test.ts` (modify) — produced-version assertion refresh
- `packages/core/test/compiler-golden.test.ts` (modify) — produced-version assertion refresh
- `packages/core/test/compiler-ideation-golden.test.ts` (modify) — produced-version assertion refresh
- `packages/core/test/cross-pillar-contracts.test.ts` (modify) — produced-version assertion refresh
- `packages/core/test/field-guidance-doctrine.test.ts` (modify) — produced-version assertion refresh
- `packages/core/test/ideation-request-rendering.test.ts` (modify) — produced-version assertion refresh
- `packages/core/test/ideation-taxonomy-capstone.test.ts` (modify) — produced-version assertion refresh
- `packages/core/test/schema-audit-cleanup-capstone.test.ts` (modify) — produced-version assertion refresh
- `packages/core/test/validation-taxonomy-capstone.test.ts` (modify) — produced-version assertion refresh
- `packages/server/src/compile-routes.test.ts` (modify) — produced-version assertion refresh
- `packages/server/src/generate-routes.test.ts` (modify) — produced-version assertion refresh
- `packages/server/src/generation-brief-draftability.e2e.test.ts` (modify) — produced-version assertion refresh
- `packages/server/src/ideate-routes.test.ts` (modify) — produced-version assertion refresh
- `packages/server/src/ideate.e2e.test.ts` (modify) — produced-version assertion refresh
- `docs/compiler-contract.md` (modify)
- `docs/story-record-hygiene-prompt-template.md` (modify)
- `docs/story-record-schema.md` (modify)

## Out of Scope

- Server-side scope selection — the actual working-set restriction of the snapshot lives in SPEC030RECHYGWOR-003; this ticket only makes the compiler + contract docs mode-aware and renders the disclosed scope line.
- Web scope selector / API client (SPEC030RECHYGWOR-004).
- `docs/ACTIVE-DOCS.md` version note + registry description, user guide, README, stress suite/matrix (SPEC030RECHYGWOR-005 — non-§8 docs).
- Updating inert fixture inputs that do not track the produced version (`validation-snapshots.ts:126`).

## Acceptance Criteria

### Tests That Must Pass

1. A core unit test asserts `normalizeRequest` accepts `full_active_atomic_review` and `active_working_set_atomic_review` and throws on any other mode.
2. `record-hygiene-golden.test.ts` asserts: the whole-project golden is unchanged except version metadata + the scope line; a working-set-scope golden renders only the in-scope corpus in fixed order with `hygiene_scope: active_working_set`; the empty-scope golden renders the truthful empty state; produced versions equal `{ template: "1.4.0", compiler: "1.6.0", contract: "1.7.0" }`.
3. `npm test` is green (every produced-version assertion across core + server refreshed); `npm run typecheck` passes (additive union, no broken constructor); `npm run lint` passes (core import boundary intact).

### Invariants

1. Identical snapshot + request + versions → identical compiled prompt (deterministic renderer; no LLM intermediary; no wall-clock).
2. `docs/compiler-contract.md` contract pin equals `packages/core/src/version.ts` contract version (`1.7.0`); the template, compiler-contract, and schema §9.3 docs agree on the two modes and the scope wording (no §8 drift).

### Tests That Must Pass (cross-surface)

1. `npm run build` succeeds (core builds before server/web per `npm test`).

## Test Plan

### New/Modified Tests

1. `packages/core/test/record-hygiene-golden.test.ts` — adds working-set-scope and empty-scope goldens; updates the whole-project golden and the produced-version triple.
2. The ~15 produced-version assertion files (listed in Files to Touch) — mechanical version-string updates; each confirmed a produced assertion (reads from `versionInfo` output) before updating, per `npm test` failures.
3. A `normalizeRequest` unit case for the two-mode acceptance + third-mode rejection (in `record-hygiene-golden.test.ts` or a sibling core hygiene test).

### Commands

1. `npm test -- record-hygiene-golden` (targeted core hygiene golden).
2. `npm run typecheck && npm test && npm run lint && npm run build` (full pipeline — the only boundary that proves the shared version bump refreshed every produced assertion).
3. The full pipeline is the correct verification boundary because the shared `versionInfo` triple ripples across packages; a narrower command cannot prove every produced-version assertion was refreshed.

## Same-Revision Co-Landing Constraint (FOUNDATIONS §1.1)

This ticket is the first dependent behavior of the SPEC030RECHYGWOR-001 FOUNDATIONS amendment and must land in the **same revision (commit/PR)** as -001 — never as a standalone code change ahead of the amendment, and never the amendment standalone ahead of this code. `Deps: SPEC030RECHYGWOR-001` encodes the ordering; this constraint forbids the standalone-ahead merge an ordinary Deps would permit.

## Outcome

Completed: 2026-06-22

What changed:

- Widened `RecordHygieneRequest.mode` to accept `full_active_atomic_review` and `active_working_set_atomic_review`, with invalid modes still rejected.
- Added deterministic `hygiene_scope` rendering to the record-hygiene records section while leaving the compiler as a renderer over the supplied snapshot.
- Bumped shared produced versions to template `1.4.0`, compiler `1.6.0`, and contract `1.7.0`, then refreshed produced-version assertions.
- Added core hygiene coverage for both modes, working-set scope disclosure over a supplied snapshot, empty working-set-scope rendering, and invalid-mode rejection.
- Updated §8-bound docs: `docs/compiler-contract.md`, `docs/story-record-hygiene-prompt-template.md`, and `docs/story-record-schema.md`.

Deviations:

- Co-landed in the same revision as SPEC030RECHYGWOR-001, as required. `docs/ACTIVE-DOCS.md` remains on the old version note intentionally because SPEC030RECHYGWOR-005 owns that non-§8 registry/user-doc pass.

Verification:

- `npm test -- record-hygiene-golden` passed.
- `npm run typecheck` passed.
- `npm test` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Grep proof confirmed `docs/compiler-contract.md` pins contract `1.7.0`, the compiler/template docs name `active_working_set_atomic_review`, and `docs/story-record-schema.md` names `active_working_set.selected_records`.
