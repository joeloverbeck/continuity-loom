# SPEC021GROIDEPRO-002: Ideation operator taxonomy + deterministic slot-assignment engine

**Status**: ✅ COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `@loom/core` `compiler/ideation/` module (prompt-kind + ideation-request types, operator taxonomy data, deterministic slot-assignment, citation-key derivation) + unit tests; no existing prose-compilation file modified, no prose behavior change
**Deps**: SPEC021GROIDEPRO-001 (the §9.1 assistance-prompt class this code first realizes; co-landed in the same revision per §1.1)

## Problem

The ideation prompt's distinctiveness comes from assigning each idea slot a different causal mechanism drawn from the typed pressure records *before* generation — research shows slot assignment must precede generation and (§4.4) the compiler must decide deterministically, never an LLM. This ticket builds the pure-`@loom/core` engine: the fixed operator taxonomy, the deterministic eligibility-and-fill algorithm, the dormancy rule, and the stable citation keys — the substrate the prompt-assembly ticket (003) and the kind-aware validation ticket (004) consume. It introduces the `promptKind` and `ideationRequest` types both downstream tickets import.

## Assumption Reassessment (2026-06-12)

1. **No prior ideation code exists.** Repo-wide `grep -rni "ideation|ideate"` over `packages/` returns zero hits (confirmed this session); `packages/core/src/compiler/ideation/` does not exist. `promptKind` has zero repo hits — clean type addition. The compiler dir is `packages/core/src/compiler/` (`compile-prompt.ts`, `template-constants.ts`, `labels.ts`, `sections/`).
2. **Record substrate confirmed.** Records carry a stored `updatedAt: z.iso.datetime()` (`packages/core/src/records/metadata.ts:14`) — the deterministic dormancy ordering key (ISO-datetime lexical sort = chronological), with record id as tie-break per spec §B. Stable human-readable labels already resolve through `displayLabel(record)` / `resolveRecordLabel` (`packages/core/src/compiler/labels.ts`, used in `sections/pressure.ts:3`) — the foundation citation keys build on. Operator feeding-types map to the record `type` discriminant (§18 pressure types + §13 LOCATION/OBJECT/AFFORDANCE); exact tag spelling is confirmed against the record schema union at implementation.
3. **Cross-artifact boundary under audit:** the `promptKind` / `ideationRequest` / `IdeationSlot` types defined here are the shared contract consumed by SPEC021GROIDEPRO-003 (prompt assembly renders `ideation_slots` from the slot list) and SPEC021GROIDEPRO-004 (readiness keys its relaxed gate on `promptKind`). They live in `compiler/ideation/types.ts` so both consumers import one source. No existing type is changed.
4. **FOUNDATIONS principle restated:** §4.4/§8 deterministic compilation — identical working set + ideation request must yield an identical slot assignment; no LLM intermediary anywhere. §29.3 working-set supremacy — the engine reads only the user-selected working set, and dormancy targets *selected* records only; nothing is silently added or reprioritized.
5. **Deterministic-compilation surface (substrate feeding the compiler):** this engine is the input to the deterministic ideation prompt that 003 assembles. Confirm it introduces no nondeterminism path the compiler would have to undo: assignment iterates the frozen operator array in fixed order, eligibility is a pure set-membership test over record types, dormancy sorts by `updatedAt` then id (no `Date.now()`, no incidental object-key order, no unsorted Set iteration). The secret firewall is untouched — the engine emits operator/slot metadata and record citation keys, never secret payloads (the prompt-side reveal-permission discipline is rendered in 003's `ideation_quality`).

## Architecture Check

1. Separating the pure assignment engine (data + algorithm) from prompt rendering (003) is cleaner than inlining slot logic into a section renderer: the algorithm is independently unit-testable against record-type fixtures with no prompt-text coupling, and the operator taxonomy lives as frozen data (fixed order = assignment priority) that the determinism proof rests on. It mirrors the existing split where `sections/pressure.ts` renders while `labels.ts` resolves.
2. No backwards-compatibility aliasing/shims: an additive new module; `promptKind` defaults `"prose"` at every consumer so existing callers are untouched; no existing export is re-pathed.

## Verification Layers

1. Operator eligibility from record types (an operator is eligible iff the working set holds ≥1 record of a feeding type) → unit test with per-type fixtures.
2. Taxonomy-order fill until `count`, slate shrinks (never silently pads) when fewer operators are eligible → unit test asserting order + shrink-signal.
3. Deterministic dormancy targeting: least-recently-updated selected record by `updatedAt`, ties broken by id → unit test with controlled `updatedAt`/id fixtures (including a tie).
4. Determinism: same working set + same `ideationRequest` compiled twice yields an identical slot list → unit test (deep-equal two runs).
5. Core purity preserved (no `fastify`/`react`/`vite`/`node:*` import) → `packages/core/test/boundary.test.ts` grep-proof passes.

## What to Change

### 1. Prompt-kind and ideation-request types

`packages/core/src/compiler/ideation/types.ts` (new): `PromptKind = "prose" | "ideation"`; `IdeationRequest = { mode: "ideas" | "questions"; count: number /* 3–6, default 5 */; dormantSlot: boolean /* default true */; avoidList?: string[] /* current-slate headlines for per-slot regenerate */ }`; `IdeationSlot = { operator: OperatorId; operatorName: string; definition: string; recordKeys: string[] }`. Zod schema with `count` bounded 3–6 and defaults, so the server (005) can parse request input against it.

### 2. Operator taxonomy (frozen data, fixed order = assignment priority)

`packages/core/src/compiler/ideation/operators.ts` (new): the 9 operators in spec §B order — 1 Reveal (SECRET, **reveal-permission-aware**: feeding eligibility prefers secrets carrying reveal permission), 2 Falsify a Belief (BELIEF + FACT/EVENT), 3 Clock Advances (CLOCK), 4 Plan Meets Friction / yes-but·no-and (PLAN/INTENTION), 5 Debt Comes Due (OBLIGATION/CONSEQUENCE), 6 Relationship Reversal (RELATIONSHIP), 7 Close the Escape Route (AFFORDANCE/OBJECT/LOCATION), 8 Collide Two Threads (two of OPEN THREAD/PLAN/SECRET/EVENT), 9 Reincorporate the Dormant. Each entry carries its `id`, display name, one-line definition, and feeding record-type set. `Object.freeze`d.

### 3. Deterministic slot assignment + dormancy

`packages/core/src/compiler/ideation/slot-assignment.ts` (new): `assignSlots(records, request) → IdeationSlot[]`. An operator is eligible iff the working set holds ≥1 record of a feeding type; fill in taxonomy order until `count` is reached. When `request.dormantSlot` is on, the final slot is always operator 9 targeting the least-recently-updated selected pressure record (sort by `updatedAt`, tie-break by id). If fewer operators are eligible than `count`, the slate shrinks and the function signals the shrink (return shape or companion flag) so the UI can warn — never silently padded. Question mode (`mode: "questions"`) uses the same slot machinery; only the output contract differs (rendered in 003).

### 4. Citation-key derivation

`packages/core/src/compiler/ideation/citation-keys.ts` (new): `citationKey(record) → string` — a stable, unique-per-compile bracketed key derived from record type + `displayLabel(record)` (building on `compiler/labels.ts`). Deterministic; collisions within one compile resolved by a deterministic suffix. Exact format (`[SECRET: <label>]` vs short ids) is a rendering decision finalized here against the prose-golden non-perturbation constraint that 003 enforces.

## Files to Touch

- `packages/core/src/compiler/ideation/types.ts` (new)
- `packages/core/src/compiler/ideation/operators.ts` (new)
- `packages/core/src/compiler/ideation/slot-assignment.ts` (new)
- `packages/core/src/compiler/ideation/citation-keys.ts` (new)
- `packages/core/test/ideation-slot-assignment.test.ts` (new)

## Out of Scope

- Prompt assembly, the four ideation section templates, `IDEATION_SECTION_ORDER`, version bumps, and the byte-frozen golden — SPEC021GROIDEPRO-003.
- Threading `promptKind` through readiness / the relaxed validation gate — SPEC021GROIDEPRO-004.
- The server route, idea-block parsing, and server-side citation *verification* against the compiled set — SPEC021GROIDEPRO-005 (this ticket only *derives* keys; the verify pass is server-side).
- User-editable / custom operators; acceptance-history dormancy — spec §Out of Scope.
- EMOTION and ENTITY STATUS feed no operator by design (spec §Risks); not added here.

## Acceptance Criteria

### Tests That Must Pass

1. `packages/core/test/ideation-slot-assignment.test.ts` — eligibility per record type, taxonomy-order filling, slate-shrink signal, deterministic dormancy with id tie-break, two-run determinism deep-equal, question-mode slot parity.
2. `packages/core/test/boundary.test.ts` — core import-boundary still passes with the new `ideation/` module present.
3. `npm test` (builds `@loom/core` then Vitest) and `npm run typecheck`, `npm run lint`, `npm run build` all pass.

### Invariants

1. `assignSlots` is a pure function of `(records, request)` — no wall-clock, no unsorted-collection iteration, no LLM call; identical inputs deep-equal identical outputs.
2. Dormancy and tie-break order are total and deterministic (`updatedAt` then id); the working set is read-only — no record is added, removed, or reprioritized.

## Test Plan

### New/Modified Tests

1. `packages/core/test/ideation-slot-assignment.test.ts` — unit coverage of the assignment algorithm, dormancy ordering, slate shrink, and determinism, per Verification Layers.

### Commands

1. `npm test -- ideation-slot-assignment`
2. `npm test && npm run typecheck && npm run lint && npm run build`
3. `npm test -- boundary` — the narrower core-purity boundary check is the correct surface for confirming the new module did not breach the `@loom/core` framework-free rule.

## Outcome

Completed: 2026-06-12

What changed:
- Added the pure `packages/core/src/compiler/ideation/` module with prompt-kind and ideation-request schemas, frozen operator taxonomy, deterministic slot assignment, and deterministic citation-key derivation.
- Exported the ideation schemas, assignment API, operator data, citation helpers, and types from `@loom/core`.
- Added `packages/core/test/ideation-slot-assignment.test.ts` covering request defaults and bounds, operator eligibility, taxonomy-order fill, slate shrink signaling, belief/fact eligibility, deterministic dormancy, question-mode parity, determinism, and citation-key collision suffixes.

Deviations:
- `assignSlots` returns an `IdeationAssignment` result object rather than a bare slot array so downstream UI/server code can surface `shrunk` without duplicating assignment logic.
- Citation keys prefer `record.metadata.displayLabel` before falling back to compiler-derived labels, matching existing record-ordering behavior and keeping test fixtures focused.

Verification:
- `npm test -- ideation-slot-assignment` passed: 7 tests.
- `npm test -- boundary` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test` passed: 112 files, 878 tests.
- `npm run build` passed; Vite reported the existing large-chunk warning.
