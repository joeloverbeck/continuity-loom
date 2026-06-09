# PRODUPVERSPE-002: Remove VISIBLE AFFORDANCE action text from `material_pressure`

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — modifies the `@loom/core` compiler `material_pressure` resolver in `packages/core/src/compiler/sections/pressure.ts`; amends `docs/compiler-contract.md` §4 `{material_pressure}` and `{active_action_pressure}` rows; production prompt output changes (golden baseline regenerates).
**Deps**: PRODUPVERSPE-001

## Problem

A VISIBLE AFFORDANCE currently renders its action `prompt_text` in up to four pressure-like surfaces — `active_action_pressure`, `material_pressure`, `visible_affordances`, and `physical_continuity` — producing same-framing repetition of one action possibility ("listen at the stair door" three times in the golden). Per the spec verdict (`specs/prompt-duplication-verdict-and-spec.md` §3.5 + §7.4.3/§7.4.4), `material_pressure` should cover location/object/entity-status constraints only; the affordance's action possibility is already carried by `active_action_pressure` and its detail by `visible_affordances`/`physical_continuity`. Removing it from `material_pressure` cuts the clearest same-framing duplicate while keeping every affordance instruction intact elsewhere.

## Assumption Reassessment (2026-06-09)

1. `packages/core/src/compiler/sections/pressure.ts:50-57` renders `material_pressure` from `["LOCATION", "OBJECT", "VISIBLE AFFORDANCE", "ENTITY STATUS"]` via `firstText(payload, ["layout_relevant_now", "description", "prompt_text", "constraints", "visible_conditions"])` — for a VISIBLE AFFORDANCE this projects `prompt_text`. `active_action_pressure` (:24-31) already lists `VISIBLE AFFORDANCE`, and the action status descriptor for it exists at :16-22 (`status` / `available`). Confirmed by direct read this session.
2. Spec §7.4.3 supplies the replacement `{material_pressure}` row (drops AFFORDANCE from the source list; adds the status-only note for any future blocked-affordance warning) and §7.4.4 appends the "affordance action text belongs in `{active_action_pressure}`, not here" note to the `{active_action_pressure}` row. The spec was reassessed this session and carries both verbatim.
3. **Shared boundary under audit**: the `material_pressure` resolver and the `docs/compiler-contract.md` §4 rows. `Deps: PRODUPVERSPE-001` because both tickets edit `pressure.ts`, `docs/compiler-contract.md` §4, `compiler-pressure-sections.test.ts`, and `golden-first-segment.prompt.txt`; serializing on 001 keeps each diff conflict-free and each merge green.
4. **FOUNDATIONS §16 physical continuity / §8 determinism**: removing affordance *action text* from `material_pressure` loses no affordance information — it remains in `active_action_pressure`, `{visible_affordances}`, and `{physical_continuity}`. §16's rule that compilation must surface unavailable/impossible actions stays satisfied through those surfaces; the spec preserves a status-only path for a future blocked-affordance warning. The change is a pure deterministic edit (one record type dropped from one list); no LLM, no nondeterminism.
5. **Deterministic-compilation enforcement surface**: `compilePrompt` → `PRESSURE_PLACEHOLDER_RESOLVERS.material_pressure`. Dropping `"VISIBLE AFFORDANCE"` from the resolver's type set keeps identical inputs+versions → byte-identical output; the golden regression proves it. No secret-firewall surface is touched.
6. **Adjacent contradiction (required consequence)**: `compiler-pressure-sections.test.ts` asserts `"- Loose latch; The latch can be slipped quietly."` appears in `active_working_set` (:500, :543) via `sectionBody(prompt, "active_working_set")`, which spans both the Action-pressure and Material-pressure sub-blocks. After removal the affordance still renders once (in Action pressure), so `.toContain` stays green — but the assertion no longer pins *which* sub-block. Resolution in-scope: add a test that slices the `active_working_set` body on its `Action pressure:` / `Material pressure:` / `Voice pressure:` markers and asserts the affordance text is present under Action pressure and absent under Material pressure. Not a separate bug.
7. **Mismatch + correction**: none; the spec was reassessed this session and §7.4.3/§7.4.4 carry the corrected rows.

## Architecture Check

1. Removing `VISIBLE AFFORDANCE` from the `material_pressure` type list is cleaner than a status-only render in `material_pressure`: a status-only line would duplicate affordance identity for no new instruction, whereas `active_action_pressure` already carries the action possibility and `physical_continuity` the route/object state. The spec permits — but does not require — a future status-only blocked-affordance warning, so none is added now.
2. No backwards-compatibility aliasing or shims: the affordance is dropped from the one list outright; no dual rendering path is retained.

## Verification Layers

1. Affordance absent-from-material invariant -> codebase unit test: slice the Material-pressure sub-block of `active_working_set` and assert the affordance `prompt_text` is absent (`compiler-pressure-sections.test.ts`).
2. Affordance present-in-action invariant -> unit test: the Action-pressure sub-block still renders the affordance line (no information lost).
3. Determinism invariant -> golden regression proves identical inputs → byte-identical output (`compiler-golden.test.ts`).
4. Contract↔code correspondence -> run `compiler-scaffold.test.ts` green after the §4 row edits.

## What to Change

### 1. `material_pressure` resolver (`pressure.ts`)

Change the type list at `pressure.ts:50-57` from `["LOCATION", "OBJECT", "VISIBLE AFFORDANCE", "ENTITY STATUS"]` to `["LOCATION", "OBJECT", "ENTITY STATUS"]`. Leave the projection field list and `active_action_pressure` (which keeps `VISIBLE AFFORDANCE`) unchanged.

### 2. `docs/compiler-contract.md` rows

Apply spec §7.4.3 (replacement `{material_pressure}` row: source list `LOCATION/OBJECT/ENTITY STATUS`, plus the note that affordance action text renders via `{active_action_pressure}`/`{visible_affordances}`/`{physical_continuity}` and any future blocked-affordance warning must be status-only) and §7.4.4 (append the affordance-belongs-in-action note to the `{active_action_pressure}` row).

### 3. `compiler-pressure-sections.test.ts`

Add a sub-block-scoped test: split `sectionBody(prompt, "active_working_set")` on its `Action pressure:` / `Material pressure:` / `Voice pressure:` markers; assert the `Loose latch` affordance `prompt_text` is present in the Action-pressure slice and absent from the Material-pressure slice. Keep the existing `.toContain` assertions (they remain true via the Action-pressure rendering).

### 4. `golden-first-segment.prompt.txt`

Regenerate the baseline. The demo fixture's `Material pressure:` block currently ends with `- listen at the stair door; …` (the VISIBLE AFFORDANCE); after this change that line drops from Material pressure while remaining under Action pressure. Commit the regenerated baseline.

## Files to Touch

- `packages/core/src/compiler/sections/pressure.ts` (modify)
- `docs/compiler-contract.md` (modify)
- `packages/core/test/compiler-pressure-sections.test.ts` (modify)
- `packages/core/test/golden-first-segment.prompt.txt` (modify)

## Out of Scope

- `active_knowledge_pressure` FACT/EVENT/BELIEF predicates (PRODUPVERSPE-001).
- `template-constants.ts` static prose, `prompt-template.md`, `prompt-template-rationale.md`, §10 change-control (PRODUPVERSPE-003).
- Stress-suite Case 32 + coverage-matrix row (PRODUPVERSPE-004).
- Implementing a status-only blocked/unavailable-affordance warning in `material_pressure` (spec §7.4.3 frames it as conditional future work, not part of this mini-spec).
- Any schema change and any FOUNDATIONS amendment (spec §7.7).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- compiler-pressure-sections` — the new Material-vs-Action sub-block test passes and the existing affordance assertions stay green.
2. `npm test -- compiler-golden` — golden regression passes against the regenerated baseline (affordance line dropped from Material pressure only).
3. `npm test` — full `@loom/core` suite green, including `compiler-scaffold.test.ts` after the contract edits.

### Invariants

1. A VISIBLE AFFORDANCE's action `prompt_text` never renders inside the Material-pressure sub-block; it renders in Action pressure and the affordance/physical-continuity detail sections.
2. Identical inputs + template/compiler/contract versions produce a byte-identical prompt (§8 determinism).

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-pressure-sections.test.ts` — new Material-pressure-vs-Action-pressure sub-block scoping test for the affordance.
2. `packages/core/test/golden-first-segment.prompt.txt` — regenerated baseline (consequence of the resolver change; the golden verification artifact, not a test file).

### Commands

1. `npm test -- compiler-pressure-sections`
2. `npm test`
3. `npm run typecheck` — confirm the resolver edit type-checks under strict TS.
