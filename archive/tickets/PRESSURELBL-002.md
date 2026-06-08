# PRESSURELBL-002: Deduplicate compact pressure-summary lines whose label and projected text are identical

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `packages/core/src/compiler/sections/pressure.ts`, `docs/compiler-contract.md` (row 135), `packages/core/test/golden-first-segment.prompt.txt`, `packages/core/test/compiler-pressure-sections.test.ts`
**Deps**: None

## Problem

The compact pressure-summary placeholders in `<active_working_set>` render each record as a two-part line `- <displayLabel>; <projectedText>`. For **knowledge-pressure** records the projected text collapses onto the *same field* the display label already used, producing verbatim duplication that burns tokens and confuses the prose writer. Observed in the committed golden (`packages/core/test/golden-first-segment.prompt.txt:206`):

```
- The sealed letter says a market ledger page was replaced before Orin's audit.; The sealed letter says a market ledger page was replaced before Orin's audit.
```

Root cause: each summary line is built as `compactParts([displayLabel(record), project(record, payload)])` (`packages/core/src/compiler/sections/pressure.ts:136`). For knowledge records the `project` field list `["secret_claim", "claim", "statement", "current_relevance", "description"]` (`:23`) is the same set of primary content fields `displayLabel` derives from (`labelFieldsByType`: SECRET→`secret_claim`, BELIEF→`claim`, FACT→`statement`, EVENT→`description`; `packages/core/src/records/editor-descriptors.ts:116-132`). So SECRET/BELIEF/FACT lines render the identical claim twice. EVENT escapes exact duplication only because the projection falls through to `current_relevance`, yielding a bare enum tail `; high` / `; critical` (`golden:207-208`) — the same low-value token noise.

The duplication risk is structural to the shared `pressureFromRecords` builder, so `relationship_emotion_pressure` and `material_pressure` (which also call it) can collide the same way whenever their projection field is absent and falls through to the label field.

## Assumption Reassessment (2026-06-08)

<!-- Items 1-3 always required. -->

1. **The duplication is produced by the shared summary builder, not by stored data.** Confirmed in `packages/core/src/compiler/sections/pressure.ts`: `pressureFromRecords` (`:126-138`) renders every line as `compactParts([displayLabel(record), project(record, payload)])` (`:136`); `compactParts` (`:189-191`) joins with `"; "` and only drops empty parts — it does not deduplicate. `displayLabel` (`packages/core/src/compiler/labels.ts:4-6`) delegates to `deriveFullDisplayLabel`, which reads `labelFieldsByType` (`packages/core/src/records/editor-descriptors.ts:115-134`). The knowledge projection field list (`pressure.ts:23`) overlaps that label-field set for SECRET (`secret_claim`), BELIEF (`claim`), FACT (`statement`), EVENT (`description`).
2. **Contract does not pin the two-part line format.** `docs/compiler-contract.md` row 135 (`{active_knowledge_pressure}`) specifies source ("User-authored pressure summary + POV/SECRET/BELIEF/EVENT lanes"), requiredness, and empty-state (`None beyond detailed records below`) but does **not** mandate a `<label>; <text>` shape — so collapsing a redundant second part is a deterministic rendering refinement, not a contract change. Row 135 gains a one-line Note documenting the dedup rule.
3. **Shared boundary under audit:** the `pressureFromRecords` line builder (`pressure.ts:126-138`), used by four summary placeholders — `active_action_pressure` (`:12-18`), `active_knowledge_pressure` (`:19-25`), `relationship_emotion_pressure` (`:26-32`), `material_pressure` (`:33-40`). The dedup applies to all four, hardening the whole class; the visible defect is in knowledge pressure.
4. **FOUNDATIONS principle under audit:** §8 deterministic prompt compilation — the compiler renders records into prose-facing prompt sections, "not raw database dumps" (§4.4, `docs/FOUNDATIONS.md:104-114`), and must not waste the prompt on redundant restatement. Intended behavior: a knowledge-pressure record contributes its claim once, deterministically derived from the selected snapshot. No LLM, no invented pressure.
5. **Deterministic-compilation surface:** the change is a pure string-equality guard over two already-deterministic values (label + projection); it reads only the selected snapshot, touches no secret-firewall logic, and cannot alter ordering. Determinism preserved.
8. **Adjacent contradiction / scope classification:** the EVENT `; <current_relevance>` enum tail (`golden:207-208`) is the **same** "confusing, token-wasting second component" defect class the duplication exhibits; removing `current_relevance` from the knowledge projection list (so EVENT renders its single `description` claim, then dedup keeps it single) is a required consequence handled here, not a separate ticket. No other pressure type relies on `current_relevance` in its projection.

## Architecture Check

1. Deduplicating inside the single shared `pressureFromRecords` line builder fixes the defect at its structural source and simultaneously hardens all four summary placeholders, rather than patching the knowledge resolver alone (which would leave `relationship_emotion_pressure`/`material_pressure` exposed to the same collision). The guard is a normalized string equality, reusing the existing trimming already performed by `asString`.
2. The dedup is **not** applied to the broadly-shared `compactParts` (used by the detailed sections with `label: value` clauses that are intentionally distinct); it is scoped to the summary-line combiner so no detailed-section rendering changes. No backwards-compatibility shim.

## Verification Layers

1. A SECRET/BELIEF/FACT summary line whose projected text equals its label renders the claim exactly once (no `; <repeat>`) -> new unit test in `compiler-pressure-sections.test.ts` + regenerated golden.
2. EVENT knowledge-pressure lines render a single `description` claim with no trailing `; <current_relevance>` enum -> new unit test + regenerated golden.
3. A summary line whose two parts genuinely differ (e.g. action-pressure INTENTION `intent; behavioral_pressure`, or a knowledge record with distinct fields) still renders both parts -> existing/extended unit test.
4. Empty-state and ordering behavior unchanged -> existing tests in `compiler-pressure-sections.test.ts` (`:373-397`) continue to pass.

## What to Change

### 1. Deduplicate identical parts in the summary-line builder (`pressure.ts`)

In `pressureFromRecords` (`:126-138`), replace the unconditional `compactParts([displayLabel(record), project(record, payload)])` with a builder that drops the projected text when it is equal (after trim/normalization) to the display label, rendering the label alone in that case. Keep the existing empty-part filtering. Do not alter `compactParts` itself.

### 2. Remove the redundant `current_relevance` enum from the knowledge projection (`pressure.ts`)

In `active_knowledge_pressure` (`:19-25`), drop `"current_relevance"` from the `firstText([...])` field list so EVENT records fall through to `description` (which is then deduplicated against the label), eliminating the bare `; high` / `; critical` tails.

### 3. Update `docs/compiler-contract.md`

Add a one-line Note to row 135 stating that when a record's projected pressure text equals its display label the line renders the claim once (deterministic dedup), and that EVENT knowledge pressure renders its description claim without the relevance enum.

### 4. Regenerate the golden

Update `packages/core/test/golden-first-segment.prompt.txt` so the duplicated knowledge-pressure line (`:206`) renders once and the EVENT lines (`:207-208`) drop their `; high` / `; critical` tails.

## Files to Touch

- `packages/core/src/compiler/sections/pressure.ts` (modify)
- `docs/compiler-contract.md` (modify) — row 135 Note
- `packages/core/test/golden-first-segment.prompt.txt` (modify)
- `packages/core/test/compiler-pressure-sections.test.ts` (modify)

## Out of Scope

- The action-pressure holder-name prefix (PRESSURELBL-003).
- Any schema change to knowledge or causal-pressure records.
- Reworking the detailed `active_intentions`/`active_plans`/etc. sections or the shared `compactParts` helper.
- Choosing genuinely-complementary secondary fields per knowledge type (rejected during brainstorm: inconsistent across SECRET/BELIEF/FACT/EVENT and risks surfacing metadata noise).

## Acceptance Criteria

### Tests That Must Pass

1. New unit test: a SECRET whose `secret_claim` is the only populated content field renders `- <claim>` exactly once — no `; <claim>` repeat.
2. New unit test: a BELIEF (`claim` only) and a FACT (`statement` only) each render their claim once.
3. New unit test: an EVENT knowledge-pressure record renders `- <description>` with no trailing relevance enum.
4. New unit test: a record whose label and projected text genuinely differ still renders both parts joined by `; `.
5. `npm run lint && npm run typecheck && npm test` (golden regenerated).

### Invariants

1. No compact pressure-summary line renders the same text twice (FOUNDATIONS §8; `compiler-contract.md` row 135).
2. Records whose two summary parts genuinely differ are unaffected; the change is dedup-only and never drops distinct content.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-pressure-sections.test.ts` — duplicate-collapse for SECRET/BELIEF/FACT, EVENT relevance-tail removal, distinct-parts preservation.
2. `packages/core/test/golden-first-segment.prompt.txt` — regenerated without the duplicate line and enum tails.

### Commands

1. `npm test -- compiler-pressure-sections`
2. `npm run lint && npm run typecheck && npm test`
