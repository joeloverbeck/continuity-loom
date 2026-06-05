# SPEC007DETPROCOM-004: Active-set pressure + causal-pressure renderers + deterministic intra-section ordering

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — adds resolvers for `compiler-contract.md` §3 sections 13–17 and the deterministic intra-section ordering helper into the `@loom/core` compiler.
**Deps**: SPEC007DETPROCOM-002

## Problem

The scaffold renders sections 13–17 as empty-state constants. This ticket fills the
active-working-set pressure summaries and the causal-pressure renderers (plans/
intentions, clocks, obligations/consequences, open threads), plus the deterministic
intra-section ordering rule every list section relies on. Ordering must be a stable
rule — never model ranking — and the causal-pressure records must render as immediate
choice/consequence pressure, never as plot-rail machinery.

## Assumption Reassessment (2026-06-05)

1. The scaffold (`compiler/placeholder-map.ts`, section-order array) exists after 002.
   `whatWillCompile` (`packages/core/src/records/compile-destinations.ts:78`) already
   buckets selected records into prompt families in a fixed `promptFamilyOrder` and
   sorts within buckets — the deterministic-ordering helper reuses/extends it rather
   than re-deriving family routing.
2. The placeholders, sources, and empty-state constants are fixed by
   `docs/compiler-contract.md` §4: `{active_action_pressure}`/`{active_knowledge_pressure}`/
   `{relationship_emotion_pressure}`/`{material_pressure}`/`{voice_pressure}` →
   `None beyond detailed records below`; `{active_intentions}`/`{active_plans}`/
   `{active_clocks}`/`{active_obligations}`/`{active_consequences}`/`{active_open_threads}`
   → `None active`. `{voice_pressure}` is the **user-authored** generation-time voice
   pressure summary (this ticket); the CAST MEMBER-derived
   `{active_cast_voice_pressure_pins}` is **005's** (see boundary note below).
3. **Cross-artifact boundary under audit**: section `<active_working_set>` (slot 13) is
   **shared** — this ticket renders its user-authored pressure summaries (incl.
   `{voice_pressure}`); SPEC007DETPROCOM-005 renders `{active_cast_voice_pressure_pins}`
   near the same slot. Both `Deps: 002` and override different placeholder-map entries;
   they do not write the same entry. The shared-slot coordination is recorded so the
   implementer of 005 places pins adjacent to (not inside) 004's pressure block.
4. **FOUNDATIONS principle restated**: §8/PROMPT-COMPILER "Deterministic ordering" —
   ordering is user order → stable schema grouping → stable metadata (salience/urgency
   where the schema defines it) → display label → stable ID; it is **not** model
   ranking and must not infer salience by reading prose fields. §18 — PLAN/CLOCK/
   OBLIGATION/CONSEQUENCE/OPEN THREAD render as immediate causal pressure; §12/§29.1 —
   they must never become act/beat/arc machinery (no plot-rail tokens in output).
5. **Deterministic-compilation surface named**: the ordering helper is a §8/§29.4
   enforcement surface — identical selected records must produce identical order.
   It reads only structured metadata (`salience`/`urgency`/`userOrder`/`displayLabel`/
   `id` from `ValidationRecord.metadata`, confirmed present in
   `packages/core/src/validation/snapshot.ts`), never prose-field intuition, and calls
   no LLM.

## Architecture Check

1. A single `ordering.ts` helper applied uniformly across every list section (reusing
   `whatWillCompile`'s family routing) is cleaner than per-section sort logic: one
   tie-break chain, one place to verify §8 compliance, no drift between sections.
2. No backwards-compatibility aliasing/shims: resolvers replace the scaffold's
   empty-state defaults; the ordering helper extends `whatWillCompile` rather than
   forking a second routing table.

## Verification Layers

1. Each section-13–17 placeholder resolves or renders its exact empty-state constant →
   schema validation against `compiler-contract.md` §4.
2. Deterministic ordering (§8) → unit test: records with equal salience sort by the
   documented tie-break chain (userOrder → grouping → salience/urgency → label → id);
   shuffling input order does not change output.
3. No plot-rail leakage (§12) → FOUNDATIONS alignment check: causal-pressure output
   contains no act/beat/arc/chapter tokens; renders pressure text only.
4. Determinism → unit test: identical snapshot → identical pressure-section output.

## What to Change

### 1. Deterministic ordering helper (`compiler/ordering.ts`)

A stable comparator implementing user order → schema grouping (via `whatWillCompile`
families) → salience/urgency → display label → stable ID, over `ValidationRecord`
metadata. Used by every list section here and reusable by 005/006.

### 2. Pressure + causal-pressure resolvers (`compiler/sections/pressure.ts`)

Resolvers for `<active_working_set>` pressure summaries (action/knowledge/relationship-
emotion/material/voice), `<active_plans_and_intentions>`, `<active_clocks>`,
`<active_obligations_and_consequences>`, `<active_open_threads>`. Each emits the §4
source ordered by the helper, or the exact empty-state constant.

### 3. Register resolvers (`compiler/placeholder-map.ts`)

Wire the section-13–17 resolvers into the map (overriding scaffold defaults).

## Files to Touch

- `packages/core/src/compiler/ordering.ts` (new)
- `packages/core/src/compiler/sections/pressure.ts` (new)
- `packages/core/src/compiler/placeholder-map.ts` (modify — Deps 002 creates it; shared with 003/005/006)
- `packages/core/test/compiler-pressure-sections.test.ts` (new)

## Out of Scope

- `{active_cast_voice_pressure_pins}` and all cast dossier rendering — 005.
- Tail record sections (006), server route (007), docs (008).
- Any change to `whatWillCompile`'s family table itself (reused as-is; extended only
  by the ordering helper).

## Acceptance Criteria

### Tests That Must Pass

1. Each section-13–17 placeholder resolves from a populated snapshot and renders its
   exact empty-state constant when absent.
2. Ordering test: input-order-independent, tie-break chain honored, no salience
   inferred from prose fields.
3. `npm run typecheck && npm test && npm run lint && npm run build` — green.

### Invariants

1. Intra-section ordering is a deterministic function of structured metadata only (§8).
2. Causal-pressure sections emit pressure text, never plot-structure machinery (§12).

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-pressure-sections.test.ts` — per-placeholder
   resolution + empty-state pinning; ordering determinism + tie-breaks; no-plot-rail
   assertion.

### Commands

1. `npm test --workspace @loom/core` — targeted pressure-section + ordering tests.
2. `npm run typecheck && npm test && npm run lint && npm run build` — full-pipeline gate.
