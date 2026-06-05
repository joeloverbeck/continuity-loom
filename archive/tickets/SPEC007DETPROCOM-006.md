# SPEC007DETPROCOM-006: Tail record resolvers (facts/beliefs/events, locations/objects/affordances, physical continuity) + golden full-prompt test

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — adds the final record resolvers (`compiler-contract.md` §3 sections 21–23) and a golden full-prompt determinism test that exercises the whole compiler.
**Deps**: SPEC007DETPROCOM-002, SPEC007DETPROCOM-003, SPEC007DETPROCOM-004, SPEC007DETPROCOM-005

## Problem

This ticket completes the core compiler: the relevant facts/beliefs/events section, the
locations/objects/affordances section (including the physical-impossibility list that
must be rendered, not invented), and the physical-continuity section. It then adds the
**golden full-prompt** test — a fully-populated fixture compiled end-to-end, asserting
all 28 sections, byte-identical output across runs, and a stable fingerprint — which is
only meaningful once 003–005's resolvers exist. A representative `docs/stress-suite.md`
subset is exercised as fixtures here.

## Assumption Reassessment (2026-06-05)

1. The scaffold (002) and the front/pressure/cast resolvers (003/004/005) exist; this
   ticket overrides the scaffold's empty-state defaults for sections 21–23 and adds the
   golden test. The ordering helper (`compiler/ordering.ts` from 004) is reused for the
   tail list sections.
2. The placeholders, sources, and empty-state constants are fixed by
   `docs/compiler-contract.md` §4: `{pov_accessible_facts}` → `None beyond current
   state and hard canon`; `{writer_visible_or_non_pov_facts}` → `None`;
   `{pov_relevant_beliefs}`/`{non_pov_behavior_shaping_beliefs}` → `None specified`;
   `{recent_events}`/`{relevant_backstory}`/`{offstage_or_withheld_events}` →
   `None selected`; `{locations}`/`{objects}`/`{visible_affordances}`/
   `{unavailable_or_impossible_actions}` → `None specified`; `{physical_continuity}`
   (N/A only for nonphysical abstract prose). Record field names must be verified
   against `docs/story-record-schema.md` at implementation time.
3. **Cross-artifact boundary under audit**: two boundaries. (a) snapshot field → §4
   placeholder → prompt string for sections 21–23 (as in 003/004/005). (b) The golden
   test is the integration boundary across **all** core resolvers — it asserts the
   composed 28-section prompt is byte-identical and fingerprint-stable, proving 002–006
   compose correctly. Hence `Deps` on 003/004/005.
4. **FOUNDATIONS principle restated**: §16 physical continuity — `{unavailable_or_impossible_actions}`
   must render impossible/unavailable actions when omission would invite continuity
   errors, and must **not** be invented by an LLM (deterministic from current-state
   locks + AFFORDANCE records). §15/§29.6 — `{writer_visible_or_non_pov_facts}` and
   `{offstage_or_withheld_events}` are writer-visible, not POV knowledge; they must not
   leak into POV-facing placeholders. §8 — determinism across the full prompt.
5. **Deterministic-compilation / firewall surface named**: the golden test is the
   primary §8/§29.4 enforcement surface for the whole compiler — same fixture + version
   triple → byte-identical prompt + identical fingerprint. The tail resolvers read only
   the snapshot, order via the shared helper, and never synthesize impossible-action
   text via an LLM; writer-visible facts/events render only in their writer-facing
   placeholders.

## Architecture Check

1. Landing the tail resolvers and the golden test together is cleaner than a separate
   integration ticket: the golden fixture naturally co-locates with the last resolver
   group, and re-enumerating expected section counts from the fixture (not hardcoded)
   keeps it from going stale.
2. No backwards-compatibility aliasing/shims: resolvers replace scaffold defaults; the
   golden test exercises the real pipeline, introduces no production logic of its own.

## Verification Layers

1. Each section-21–23 placeholder resolves or renders its exact empty-state constant →
   schema validation against `compiler-contract.md` §4.
2. Physical impossibility rendered, not invented (§16) →
   unit test: `{unavailable_or_impossible_actions}` derives from current-state locks +
   AFFORDANCE records deterministically.
3. Fact/event firewall (§15) → unit test: writer-visible facts/withheld events never
   appear in POV-facing placeholders.
4. Full-prompt determinism (§8) → golden test: fully-populated fixture → all 28
   sections in §3 order, byte-identical across runs, identical fingerprint; a
   representative `docs/stress-suite.md` subset (dense active scene; abstract/minimal
   empty-state moment; dense multi-cast no-compression) produces the expected shape.

## What to Change

### 1. Tail record resolvers (`compiler/sections/records-tail.ts`)

Resolvers for `<relevant_facts_beliefs_events>`, `<locations_objects_affordances>`
(incl. `{unavailable_or_impossible_actions}`), and `<physical_continuity>`. Each emits
the §4 source ordered via `compiler/ordering.ts`, or the exact empty-state constant.

### 2. Register resolvers (`compiler/placeholder-map.ts`)

Wire the section-21–23 resolvers into the map (overriding scaffold defaults).

### 3. Golden full-prompt test

A fully-populated fixture compiled end-to-end; assertions on section order/completeness,
byte-identical determinism, fingerprint stability, and the stress-suite subset.

## Files to Touch

- `packages/core/src/compiler/sections/records-tail.ts` (new)
- `packages/core/src/compiler/placeholder-map.ts` (modify — Deps 002 creates it; shared with 003/004/005)
- `packages/core/test/compiler-tail-sections.test.ts` (new)
- `packages/core/test/compiler-golden.test.ts` (new)

## Out of Scope

- The server `/api/compile` route (007) and governing-doc updates (008).
- New validation rules — the compiler consumes validation; physical-impossibility
  *blocking* is the SPEC-006 engine's job (this renders what the blocker-free snapshot
  contains).

## Acceptance Criteria

### Tests That Must Pass

1. Each section-21–23 placeholder resolves and renders its exact empty-state constant
   when absent.
2. `{unavailable_or_impossible_actions}` renders deterministically from records; no
   invented actions.
3. Golden test: all 28 sections in §3 order, byte-identical across two compiles,
   identical fingerprint; stress-suite subset matches expected shape.
4. `npm run typecheck && npm test && npm run lint && npm run build` — green.

### Invariants

1. The full compiled prompt is a deterministic function of the snapshot + version triple
   (§8/§29.4).
2. Writer-visible facts/events never cross into POV-facing placeholders (§15).

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-tail-sections.test.ts` — per-placeholder resolution +
   empty-state pinning; impossible-action determinism; fact/event firewall.
2. `packages/core/test/compiler-golden.test.ts` — full-prompt section order/completeness,
   determinism, fingerprint stability, stress-suite subset.

### Commands

1. `npm test --workspace @loom/core` — targeted tail + golden tests.
2. `npm run typecheck && npm test && npm run lint && npm run build` — full-pipeline gate.

## Outcome

Completed: 2026-06-05

What changed:
- Added tail record resolvers for facts, beliefs, events, locations, objects,
  affordances, unavailable/impossible actions, and physical continuity.
- Kept POV-accessible facts separate from writer-visible/non-POV facts and withheld
  events.
- Derived unavailable/impossible actions from current locks and unavailable/blocked
  affordance records.
- Added tail-section tests plus a golden full-prompt determinism test across all 28
  sections and the version/fingerprint metadata.

Deviations from original plan:
- None.

Verification:
- `npm test --workspace @loom/core` passed: 21 files, 132 tests.
- `npm run typecheck` passed.
- `npm test` passed: 46 files, 241 tests.
- `npm run lint` passed.
- `npm run build` passed, with Vite's large-chunk warning only.
