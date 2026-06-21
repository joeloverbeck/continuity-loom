# SPEC028IDEOPETAX-001: Replace the ideation operator taxonomy with nine peer operators, fail-closed eligibility, minimum bundles, and dormancy-as-modifier

**Status**: PENDING
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — rewrites `@loom/core` ideation operator taxonomy + slot-assignment algorithm (`operators.ts`, `types.ts`, `slot-assignment.ts`, `sections/ideation.ts`), removes the `REINCORPORATE_DORMANT_OPERATOR` public export, bumps the deterministic template/compiler/contract version triple, and co-lands the `docs/ideation-prompt-template.md` + `docs/compiler-contract.md §3.2` taxonomy/slot authority sections and the regenerated ideation golden
**Deps**: None

## Problem

The shipped nine-entry ideation operator taxonomy (`packages/core/src/compiler/ideation/operators.ts`) is not mutually distinct or comprehensive: `collide_two_threads` is an umbrella that can instantiate other operators, `reincorporate_dormant` is a recency selection policy rather than a dramatic move, `EMOTION` grounds no operator, and `eligibleRecordsForOperator` gives every matching record a slot (no current-state gate, no minimum bundle), so cross-slot grounding overlap is normal and contradicts the distinctness instruction. SPEC-028 §A–§E replace the taxonomy with nine peer operators, make eligibility current-state-aware and fail-closed, replace "all matching records" with minimum deterministic grounding bundles, and demote dormancy to a deterministic slot-selection modifier — all without changing the request shape, response schema, section order, or any prose-prompt behavior. This ticket is the indivisible core vertical: the operator-id removal breaks its consumers and the §8-bound authority docs + golden must move in the same diff.

## Assumption Reassessment (2026-06-21)

1. **Current taxonomy + dormancy logic** — `operators.ts:12-89` defines `IDEATION_OPERATORS` as nine entries and `REINCORPORATE_DORMANT_OPERATOR` (`:87-89`). `slot-assignment.ts:12-30` fills slots in array order then handles the dormant slot via `dormantTargetRecords` (`:72-79`, sorts by `metadata.updatedAt`, tie-break `id`, takes oldest). `eligibleRecordsForOperator` (`:40-54`) returns every record whose type is in `feedingTypes` after the `minimumRecords`/`requiredTypeGroups` gate; `hasRevealPermission` (`:63-70`) admits only `natural_reveal_allowed`/`directive_required`. Verified against the working tree.
2. **Spec authority** — SPEC-028 §A (nine operators + order), §B (operator-active matrix), §C (minimum bundles + deterministic tie-break), §D (`commit_at_a_cost` pressure families), §E (dormancy-as-modifier algorithm), and the reassess-applied note that the distinctness emitted text is a code constant. `docs/ideation-prompt-template.md` (`## Operator Taxonomy`, `## Slot Assignment`) and `docs/compiler-contract.md §3.2` are the co-authorities per the spec's authority-sync map (§Deliverables 3-4).
3. **Cross-artifact boundary under audit** — the deterministic ideation slot-assignment contract shared by code (`slot-assignment.ts`), the two authority docs, and the golden (`golden-ideation.prompt.txt`). All four must render the same operator set, eligibility predicates, bundle rule, and dormancy behavior; drift between template/contract/code is a §8 continuity bug.
4. **FOUNDATIONS principle restated** — §4.4/§8 deterministic compilation: identical snapshot + request + template/compiler/contract version → identical prompt; no LLM intermediary selects/ranks/omits records. §29.4: assignment stays deterministic, provider-neutral, inspectable, with **no token-budget eviction** — minimum bundles *select* which records ground a slot but every selected record still renders at its authoritative section. §12: `commit_at_a_cost` emits one committed move, never an A/B menu/branch list.
5. **Enforcement surface** — this ticket *is* the deterministic-compilation surface for the ideation assistance prompt (§9.1). Confirmed no leakage/nondeterminism path is added: eligibility reads only typed record status fields (no keyword search, embeddings, model judgment, accepted prose, candidates, author-private notes, or hidden UI state); bundle selection breaks ties by the existing deterministic citation-key order; dormancy sorts by stored `updatedAt` then `id`. The **`PLAN` operator-active predicate must read `payload.plan_status`** (not `payload.status`) — precedent `isActivePlan` at `sections/pressure.ts:422`; every other type reads `payload.status`. Using `status` for PLAN silently yields zero eligible plans.
6. **Schema extension** — none. No story-record schema field is added or changed; eligibility reads existing status enums validated against `docs/story-record-schema.md` (`plan_status`, `status`, `reveal_permission`, `current_relevance`). The response block schema and `IDEATION_SECTION_ORDER` are unchanged.
7. **Rename/removal blast radius** — operator ids `relationship_reversal`→`relationship_turns`, `close_escape_route`→`shift_option_set`, `collide_two_threads`→`commit_at_a_cost`; `reincorporate_dormant` and `emotion_becomes_action` added/removed. Repo-wide grep: src consumers are `operators.ts`, `types.ts` (`IdeationOperatorId` union), `slot-assignment.ts`, and the **public barrel re-export `packages/core/src/index.ts:51`** (`REINCORPORATE_DORMANT_OPERATOR` must be dropped there too); tests `ideation-operator-eligibility.test.ts`, `ideation-slot-assignment.test.ts`, `ideation-slot-assignment.property.test.ts`, and `golden-ideation.prompt.txt`. `packages/server` verifies returned ideas by citation key / operator **name**, never operator id (`ideation-parse.ts` treats `operator` as a free-form string) — no server allow-list to update. `dist/**` and `packages/web/dist/**` are build artifacts.
8. **Adjacent contradiction (version triple)** — re-baselining the golden without a version bump contradicts the repo convention (`compiler-front-sections.test.ts:435` "deliberate compiler and contract version bump"; `compiler-golden.test.ts:192` "re-baseline this fixture only with a deliberate version change"). Classified as a **required consequence** of this ticket per approved Issue I1→(A): bump `version.ts` to `template 1.3.0 / compiler 1.5.0 / contract 1.6.0` and update the produced-version assertions.
9. **Mismatch + correction** — SPEC-028 Deliverable 2 lists `sections/ideation.ts` among the EMOTION/ENTITY STATUS key render sites; per the reassess correction those keys live in `sections/pressure.ts`/`sections/records-tail.ts` (ticket 002). `sections/ideation.ts` is touched **here** only for the dormant-slot instruction in the `<ideation_slots>` body (coupled to the dormancy modifier).

## Architecture Check

1. Keeping the operator-id removal, the `IdeationOperatorId` union, the slot-assignment algorithm rewrite, the §8 authority docs, the version bump, and the golden in one diff is the only compliant path: removing `reincorporate_dormant` from the union breaks `operators.ts`; removing the `REINCORPORATE_DORMANT_OPERATOR` export breaks `slot-assignment.ts`; the contract docs and golden drift from the compiler if they lag. Any split leaves a non-compiling or contract-divergent intermediate, and CLAUDE.md forbids the compatibility shim that would bridge it (spec §Deliverables "single lockstep change"; decomposition §removal-breaks-consumer indivisible case).
2. No backwards-compatibility aliasing or shims: the old operator ids are removed outright (no `oldId → newId` map — verified unnecessary in Assumption 7); `REINCORPORATE_DORMANT_OPERATOR` is deleted, not retained as a deprecated alias.

## Verification Layers

1. Operator set + ids match across code and docs → codebase grep-proof (`IDEATION_OPERATORS` ids in `operators.ts` ↔ `IdeationOperatorId` union in `types.ts` ↔ `## Operator Taxonomy` in `docs/ideation-prompt-template.md` ↔ `docs/compiler-contract.md §3.2`).
2. Fail-closed eligibility per the §B matrix (incl. `PLAN: revised`/`CLOCK: paused` excluded, `EMOTION: transformed` included, `plan_status` field) → `ideation-operator-eligibility.test.ts` status cases + schema validation against `docs/story-record-schema.md`.
3. Minimum bundle + `commit_at_a_cost` two-family + dormancy-as-modifier + shrink → `ideation-slot-assignment.test.ts` + `ideation-slot-assignment.property.test.ts` invariants.
4. Determinism (identical snapshot+request+versions → byte-identical prompt) and no eviction (all selected records still render/key) → `compiler-ideation-golden.test.ts` + FOUNDATIONS §29.4 alignment check.
5. Version bump recorded and produced assertions consistent → `compiler-front-sections.test.ts` versionInfo assertion + server produced-version assertion.

## What to Change

### 1. Operator taxonomy (`operators.ts`, `types.ts`, `index.ts`)

Replace `IDEATION_OPERATORS` with the nine SPEC-028 §A peer operators in fixed order (`reveal`, `plan_meets_friction`, `emotion_becomes_action`, `shift_option_set`, `falsify_belief`, `clock_advances`, `debt_comes_due`, `relationship_turns`, `commit_at_a_cost`), each with its id, display name, definition (proposal §2.1 replacement text), feeding types, and minimum-bundle/required-group metadata. Add `emotion_becomes_action`; rename `relationship_reversal`→`relationship_turns` and `close_escape_route`→`shift_option_set` (gaining `ENTITY STATUS`); replace `collide_two_threads`→`commit_at_a_cost`. Remove `REINCORPORATE_DORMANT_OPERATOR` from `operators.ts` and from the `packages/core/src/index.ts:51` barrel re-export. Update the `IdeationOperatorId` union in `types.ts` to the new id set.

### 2. Slot-assignment algorithm (`slot-assignment.ts`)

- **Operator-active predicate**: encode the §B matrix as a deterministic per-type status gate (`PLAN`/`INTENTION` via `plan_status`/`status`, `EMOTION` not `settled`, `CLOCK` active not paused, `EVENT` not abandoned & `current_relevance ≠ none`, `SECRET` hidden/partially_revealed with reveal additionally requiring a legal authored cue/`clue_only`/`natural_reveal_allowed`, etc.). Replace `hasRevealPermission` with the matrix-driven reveal eligibility.
- **Minimum deterministic grounding bundles**: replace `eligibleRecordsForOperator`'s "all matching records" with the smallest bundle proving eligibility, choosing by (1) unused-first, (2) fewest reused, (3) deterministic citation-key order; never make a valid operator ineligible solely for reuse; keep every selected record rendered/keyed.
- **`commit_at_a_cost`**: eligible only when two operator-active records come from two different §D pressure families (`FACT` excluded); cite exactly one per family.
- **Dormancy as modifier (§E)**: keep `dormantSlot` reserving the final slot; build dormant candidates (operator-active pressure/material records, excluding `FACT`), sort by `updatedAt` then `id` (preserved), pick the oldest viable candidate that supports an otherwise-unused operator's minimum bundle (candidate mandatory in the bundle); if none, omit the dormant slot and shrink. Remove the `REINCORPORATE_DORMANT_OPERATOR` pseudo-operator path.

### 3. Dormant-slot instruction (`sections/ideation.ts`)

In the `<ideation_slots>` slot body, add the deterministic instruction identifying the mandatory dormant citation key for the dormant slot. Do not add a field to the response format.

### 4. Authority docs (§8 co-land)

`docs/ideation-prompt-template.md`: replace `## Operator Taxonomy` and `## Slot Assignment` bodies with the proposal §2.7 text. `docs/compiler-contract.md §3.2`: mirror the revised taxonomy, operator-active predicates, minimum bundles, dormancy modifier, and shrink behavior. (Citation-keys + distinctness doc sections are ticket 002.)

### 5. Version bump (`version.ts` + produced assertions)

Bump `versionInfo` to `templates 1.3.0 / compiler 1.5.0 / contract 1.6.0`. Update produced-version assertions: `compiler-front-sections.test.ts:436-438` and the server produced-version assertion in `ideate.e2e.test.ts`. Confirm produced-vs-inert classification at implementation (hand-built fixture triples that do not read `versionInfo` stay as-is unless they assert produced metadata).

### 6. Tests + golden

Rewrite `ideation-operator-eligibility.test.ts` truth table + status/reveal/family cases; update `ideation-slot-assignment.test.ts` (minimum bundles, unused-first, dormant-as-modifier, shrink) and `ideation-slot-assignment.property.test.ts` invariants; regenerate `golden-ideation.prompt.txt` via `compiler-ideation-golden.test.ts`.

## Files to Touch

- `packages/core/src/compiler/ideation/operators.ts` (modify)
- `packages/core/src/compiler/ideation/types.ts` (modify)
- `packages/core/src/compiler/ideation/slot-assignment.ts` (modify)
- `packages/core/src/index.ts` (modify)
- `packages/core/src/compiler/sections/ideation.ts` (modify)
- `packages/core/src/version.ts` (modify)
- `docs/ideation-prompt-template.md` (modify)
- `docs/compiler-contract.md` (modify)
- `packages/core/test/ideation-operator-eligibility.test.ts` (modify)
- `packages/core/test/ideation-slot-assignment.test.ts` (modify)
- `packages/core/test/ideation-slot-assignment.property.test.ts` (modify)
- `packages/core/test/golden-ideation.prompt.txt` (modify)
- `packages/core/test/compiler-ideation-golden.test.ts` (modify)
- `packages/core/test/compiler-front-sections.test.ts` (modify)
- `packages/server/src/ideate.e2e.test.ts` (modify)

## Out of Scope

- EMOTION + ENTITY STATUS citation keys and the `<ideation_quality>` distinctness instruction (ticket 002).
- Capstone regression suite + dense-working-set breadth fixture + spec archival + ACTIVE-DOCS version note (ticket 003).
- Request fields/defaults (`mode`, `count`, `dormantSlot`, `avoidList`), the 3-6 count bound, `IDEATION_SECTION_ORDER`, the response block schema, citation-key syntax, and any prose prompt/template/compiler, record-writing, or validation-gate behavior (spec §Out of Scope).
- The adversarial semantic-distinctness model-evaluation corpus (offline; must not become runtime model judgment).
- Any operator-id backward-compatibility mapping (verified unnecessary).

## Acceptance Criteria

### Tests That Must Pass

1. `npx vitest run packages/core/test/ideation-operator-eligibility.test.ts` — nine operators; §B status edges (`PLAN: revised` & `CLOCK: paused` excluded, `EMOTION: transformed` included, `SECRET: directive_required` cue-only, locked secret with no legal cue cannot make `reveal` eligible).
2. `npx vitest run packages/core/test/ideation-slot-assignment.test.ts packages/core/test/ideation-slot-assignment.property.test.ts` — minimum bundle per slot, no operator id repeats, no ground repeats when an all-unused bundle exists, `commit_at_a_cost` two-family, dormant slot uses oldest viable candidate + real unused operator or shrinks.
3. `npx vitest run packages/core/test/compiler-ideation-golden.test.ts packages/core/test/compiler-front-sections.test.ts && npm run lint && npm run typecheck && npm test && npm run build` — regenerated golden is byte-stable; version assertions consistent; full pipeline green.

### Invariants

1. Slot assignment is deterministic and provider-neutral: no LLM/keyword/embedding/token-budget/accepted-prose/notes/hidden-UI input; identical snapshot+request+versions → byte-identical prompt (§4.4/§8/§29.4).
2. No eviction: every selected record still renders and keys at its authoritative section even when not chosen for a slot bundle (§29.4 / §28.8 token-budget-eviction prohibition).

## Test Plan

### New/Modified Tests

1. `packages/core/test/ideation-operator-eligibility.test.ts` — new operator truth table + status/reveal/family eligibility cases.
2. `packages/core/test/ideation-slot-assignment.test.ts` + `packages/core/test/ideation-slot-assignment.property.test.ts` — minimum-bundle/unused-first/dormant-as-modifier/shrink behavior and invariants.
3. `packages/core/test/golden-ideation.prompt.txt` + `packages/core/test/compiler-ideation-golden.test.ts` — regenerated golden under the bumped version triple; `packages/core/test/compiler-front-sections.test.ts` + `packages/server/src/ideate.e2e.test.ts` — updated produced-version assertions.

### Commands

1. `npx vitest run packages/core/test/ideation-operator-eligibility.test.ts packages/core/test/ideation-slot-assignment.test.ts packages/core/test/ideation-slot-assignment.property.test.ts packages/core/test/compiler-ideation-golden.test.ts`
2. `npm run lint && npm run typecheck && npm test && npm run build`
3. Targeted vitest first localizes operator/slot/golden regressions before the full `npm test` (which builds `@loom/core` first) confirms cross-package version-assertion consistency.
