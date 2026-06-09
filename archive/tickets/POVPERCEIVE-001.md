# POVPERCEIVE-001: Decouple `pov_cannot_perceive_now` from line-of-sight; add a dedicated authored field

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — generation-brief schema/draft/readiness, placeholder/empty-state maps, field-guidance, compiler `front.ts`, web editor, `docs/compiler-contract.md`, `docs/story-record-schema.md` (if it documents the brief), demo fixture
**Deps**: Composes with archived `archive/tickets/POVEMPTYLINE-001.md` (omit-when-empty) but is independently mergeable

## Problem

`POV cannot perceive right now:` is fed the **same** field as `Line of sight / visibility:` — `current_authoritative_state.line_of_sight_and_visibility` (`front.ts:126-130`). Observed in a production prompt:

```
POV cannot perceive right now:
The bench where Ane Arrieta has chosen to sit ... can only be seen through a space between hedges as you pass by along the path, or from gaps in the vegetation.
```

That text is a *visibility-geometry* description (what the scene's sightlines are), not an assertion that the POV is barred from perceiving something. Reusing it under "POV cannot perceive right now" (a) duplicates the same content already rendered correctly in `<current_authoritative_state>`, and (b) misframes scene geometry as a hard POV perception limit, which will mislead the external LLM (e.g., implying the POV cannot see the bench even while passing it).

## Assumption Reassessment (2026-06-09)

1. `pov_cannot_perceive_now` resolves directly to `current_authoritative_state.line_of_sight_and_visibility` (`packages/core/src/compiler/sections/front.ts:126-130`). That same field also feeds `{line_of_sight_and_visibility}` -> the `Line of sight / visibility:` line (`compile-prompt.ts:31`, `front.ts:83-87`), so the text is rendered twice.
2. There is **no** `pov_cannot_perceive_now` field in `currentAuthoritativeStateSchema` / `generationSessionSchema` (`packages/core/src/records/generation-brief.ts:30-48`). The field-guidance for `line_of_sight_and_visibility` maps it **only** to `{line_of_sight_and_visibility}` (`field-guidance-brief-config.ts:236-238`) — the dual use was never sanctioned by guidance.
3. The contract row `{pov_cannot_perceive_now}` (`docs/compiler-contract.md:123`) names source "POV KNOWLEDGE PROFILE.pov_cannot_perceive_now + visibility/line-of-sight state" — a profile field that was never implemented. This ticket implements the dedicated field and removes the automatic line-of-sight feed, then corrects the contract row to match.
4. Schema extension classification: **additive-only** — a new *optional* `pov_cannot_perceive_now` brief field with an empty/omit default. Consumers to update (mirroring `line_of_sight_and_visibility` touch points; verify each with grep before editing): `generation-brief.ts` (schema), `generation-brief-draft.ts` (draft model), `generation-brief-readiness.ts` (readiness — keep it optional/context-gated, not a new universal blocker), `compiler/placeholder-map.ts`, `compiler/empty-states.ts`, `records/field-guidance-brief-config.ts`, `compiler/sections/front.ts` (resolver), `packages/web/src/generation-brief/GenerationBriefView.tsx` (editor), and `packages/core/src/demo/letter-under-flour-bin.ts` (demo fixture, optional). Run `grep -rn "line_of_sight_and_visibility" packages/*/src` to confirm the touch set before implementing.
5. FOUNDATIONS principle under audit: §15 / §29.6 (POV knowledge limits). Today's behavior risks fabricating a perception limit from non-perception data; the fix makes the perception-limit channel an intentional, user-authored field, strengthening (not weakening) the POV firewall. §8 deterministic compilation is preserved.
6. Information-path note (README pre-check 8): `line_of_sight_and_visibility` currently has two lawful transport paths (one correct, one wrong). Canonical end-state: `line_of_sight_and_visibility` -> `{line_of_sight_and_visibility}` only; `pov_cannot_perceive_now` (new field) -> `{pov_cannot_perceive_now}` only. After the change each placeholder has exactly one source.

## Architecture Check

1. A dedicated optional field gives the user explicit, intentional control over POV perception limits and removes the duplication/misframe — cleaner and more aligned with the contract's stated intent than either (a) silently reusing scene geometry or (b) leaving the placeholder permanently empty.
2. Additive-only optional field with a default; no backwards-compatibility shim and no aliasing of the old reuse. The wrong feed is removed outright, not preserved behind a flag.

## Verification Layers

1. `pov_cannot_perceive_now` no longer reads `line_of_sight_and_visibility` -> codebase grep-proof (`front.ts` resolver references the new field only).
2. New optional brief field validates and round-trips through draft/readiness -> schema validation against `docs/compiler-contract.md` / generation-brief schema; readiness test confirms it does not become a universal blocker.
3. `Line of sight / visibility:` still renders its content once; `POV cannot perceive right now:` renders only the new field (or omits when empty) -> golden test (no duplicated text).
4. POV perception firewall intent preserved -> FOUNDATIONS alignment check (§15/§29.6) + manual review of the rendered section.
5. Field-guidance coverage remains complete for `{pov_cannot_perceive_now}` -> `guidance-coverage-sources` / `field-guidance-brief-config` tests pass.

## What to Change

### 1. Add the dedicated field

Add optional `pov_cannot_perceive_now` to the generation brief (alongside `line_of_sight_and_visibility` in `currentAuthoritativeStateSchema`, or a POV-knowledge sub-object — implementer's call, kept optional with an empty default), plus draft and readiness handling (optional / context-gated, never a new universal blocker).

### 2. Rewire the compiler

In `front.ts`, change the `pov_cannot_perceive_now` resolver to read the new field; remove the `line_of_sight_and_visibility` reference from it. Leave `line_of_sight_and_visibility` -> `{line_of_sight_and_visibility}` untouched.

### 3. Editor + guidance

Add an editor control in `GenerationBriefView.tsx` with a label/help that clearly distinguishes "what the POV is barred from perceiving right now" from the scene's line-of-sight description. Add a `field-guidance-brief-config.ts` entry mapping the new field to `{pov_cannot_perceive_now}` with anti-examples warning against pasting scene geometry.

### 4. Docs in lockstep (§10 change-control)

- `docs/compiler-contract.md`: correct the `{pov_cannot_perceive_now}` row source to the new dedicated brief field and remove the automatic line-of-sight feed; reflect the new field in the placeholder mapping.
- `docs/story-record-schema.md`: document the new optional brief field if it enumerates the generation-time brief.

## Files to Touch

- `packages/core/src/records/generation-brief.ts` (modify)
- `packages/core/src/records/generation-brief-draft.ts` (modify)
- `packages/core/src/records/generation-brief-readiness.ts` (modify)
- `packages/core/src/compiler/sections/front.ts` (modify)
- `packages/core/src/compiler/placeholder-map.ts` (modify, if it enumerates sources)
- `packages/core/src/compiler/empty-states.ts` (modify, if the empty-state phrasing changes)
- `packages/core/src/records/field-guidance-brief-config.ts` (modify)
- `packages/web/src/generation-brief/GenerationBriefView.tsx` (modify)
- `packages/core/src/demo/letter-under-flour-bin.ts` (modify — optional, populate the new field meaningfully)
- `docs/compiler-contract.md` (modify)
- `docs/story-record-schema.md` (modify, if applicable)
- `packages/core/test/*` golden/readiness/guidance tests (modify/add)

## Out of Scope

- Aggregating `visibility_to_pov` from ENTITY STATUS / OBJECT / EVENT records into this field (possible future enhancement; not required here).
- Empty-line omission of the POV lines (completed in `archive/tickets/POVEMPTYLINE-001.md` and composes with the new field).
- Any change to `line_of_sight_and_visibility` rendering in `<current_authoritative_state>`.

## Acceptance Criteria

### Tests That Must Pass

1. A brief with `line_of_sight_and_visibility` set and `pov_cannot_perceive_now` empty: the visibility text appears exactly once (under `Line of sight / visibility:`), and `POV cannot perceive right now:` is omitted per archived `archive/tickets/POVEMPTYLINE-001.md`.
2. A brief with a populated `pov_cannot_perceive_now`: that text renders under `POV cannot perceive right now:` and is independent of `line_of_sight_and_visibility`.
3. Readiness/draft: the new field is saveable-when-blank and does not introduce a universal blocker.
4. `guidance-coverage` / `field-guidance-brief-config` tests confirm `{pov_cannot_perceive_now}` has a guidance source.
5. `npm run typecheck`, `npm run lint`, and `npm test` pass.

### Invariants

1. Each of `{line_of_sight_and_visibility}` and `{pov_cannot_perceive_now}` has exactly one deterministic source after the change.
2. No accepted-prose/derived content feeds the new field (user-authored only) — FOUNDATIONS §29.4/§15.
3. Compilation deterministic for identical inputs/versions (§8).

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-front-sections.test.ts` — assert decoupled rendering and no duplication.
2. `packages/core/test/generation-brief-readiness.test.ts` — new optional field does not block readiness.
3. `packages/core/test/field-guidance-brief-config.test.ts` / `guidance-coverage-sources.test.ts` — coverage for the new placeholder source.
4. `packages/core/test/compiler-golden.test.ts` — refresh golden output.

### Commands

1. `npm test -- compiler-front-sections`
2. `npm test -- generation-brief-readiness`
3. `npm run typecheck && npm run lint && npm test`

## Outcome

Completed: 2026-06-09

What changed:

- Added optional `current_authoritative_state.pov_cannot_perceive_now` support to the strict generation session schema, draft schema, and readiness-normalized schema.
- Rewired `{pov_cannot_perceive_now}` so it reads only the new authored field, while `{line_of_sight_and_visibility}` continues to read only line-of-sight state.
- Added Generation Brief editor support and field guidance for the new authored POV perception-limit field.
- Updated `docs/compiler-contract.md` and `docs/story-record-schema.md` so the prompt contract and generation-time field catalog name the dedicated source and warn against treating line-of-sight geometry as a POV perception limit.
- Updated compiler, schema, guidance, web, and golden tests. The demo golden now omits the old line-of-sight text from `<pov_knowledge_constraints>`.

Deviations from original plan:

- The optional demo fixture was not populated with the new field; the golden intentionally proves blank authored POV perception limits are omitted after the decoupling.

Verification:

- `npm test -- compiler-front-sections` passed.
- `npm test -- generation-brief-readiness` passed.
- `npm test -- generation-brief-draft` passed.
- `npm test -- field-guidance-brief-config` passed.
- `npm test -- guidance-coverage-sources` passed.
- `npm test -- compiler-golden` passed.
- `npm test -- GenerationBriefView` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed.
- `npm run build` passed, with the existing Vite chunk-size warning.
- Browser smoke against `http://127.0.0.1:4173/generation-brief` passed: opened a demo project, confirmed the new `pov_cannot_perceive_now` field rendered as conditional, entered text, saved, and saw `Draft saved.` with no blockers.
