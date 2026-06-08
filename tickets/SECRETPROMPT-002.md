# SECRETPROMPT-002: Reconcile SECRET `clue_carriers` with the compiled `{allowed_clues_and_surface_cues}` placeholder

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — `packages/core/src/compiler/sections/front.ts` (`allowed_clues_and_surface_cues` resolver) and/or `docs/compiler-contract.md` row 130; regression coverage in `packages/core/test/compiler-front-sections.test.ts`. No schema or stored-data change.
**Deps**: None (independent of SECRETPROMPT-001; both touch the same `<secrets_and_reveal_constraints>` block but different placeholders).

## Problem

The SECRET schema defines a rich `clue_carriers` array (`clue_text`, `clue_strength`, `discovered_by`, `audience_visible`, `status`) at `packages/core/src/records/knowledge.ts:62-78`, and `docs/compiler-contract.md` **row 130** explicitly states the source of `{allowed_clues_and_surface_cues}` is:

> `SECRET.allowed_surface_cues + clue_carriers available now`

But the resolver reads **only** `allowed_surface_cues` (`front.ts:137-139`); `clue_carriers` is read nowhere in the compiler **or** validation (confirmed: the only references are the schema definition and the demo fixture `packages/core/src/demo/letter-under-flour-bin.ts:283`). Available clue carriers therefore never reach the prompt, so the compiled output silently under-delivers what the contract promises. This is a code/contract mismatch surfaced by the SECRET-field audit.

The audit's verdict: `clue_carriers` *should* be used, because a doc authority (compiler-contract row 130) already commits to it. The remaining decision is **compile it** vs. **retract the contract clause** — this ticket implements the compile path and, if the reassessment finds compilation undesirable, falls back to the doc-only correction (see Out of Scope / item 8).

## Assumption Reassessment (2026-06-08)

1. **Field unused, confirmed.** Repo-wide grep for `clue_carrier` returns only `packages/core/src/records/knowledge.ts:77` (schema) and `packages/core/src/demo/letter-under-flour-bin.ts:283` (demo). No compiler or validation reads it.
2. **Contract promises it, confirmed.** `docs/compiler-contract.md` row 130 (`{allowed_clues_and_surface_cues}`) lists source `SECRET.allowed_surface_cues + clue_carriers available now`, requiredness "Required for clue pressure; optional otherwise". The current resolver (`front.ts:137-139`) honors only the first half.
3. **Shared boundary under audit.** The contract row, the schema field, and the single resolver must agree after this change. `clue_carriers[].status` has the value `available` (`knowledge.ts:54-58`), which is the natural filter for "available now".
4. **FOUNDATIONS principle under audit.** §15 ("allowed clues and surface cues") and §8 (deterministic compilation). Rendering a deterministically-filtered subset of authored clue text is pure and LLM-free. Leakage guard: `clue_carriers[].audience_visible` and `discovered_by` describe *who already perceives* a clue; the compiled `{allowed_clues_and_surface_cues}` block is the writer-facing "cues you may surface now" lane, so the resolver must only emit `clue_text` (and optionally `clue_strength`), never convert a clue into a narrator-certified reveal. No §29.6 hard-fail; this *adds* legible clue authority.
5. **Deterministic-compilation surface.** Change is confined to one resolver's projection; selection/ordering/empty-state of the placeholder are otherwise unchanged. Empty state stays `EMPTY_STATE_CONSTANTS.allowed_clues_and_surface_cues` when neither source yields a line.
6. **Schema-extension check.** Additive read only; no schema field added or changed. `clue_carriers` already defaults to `[]` (`knowledge.ts:77`), so existing projects without carriers render exactly as today.
7. **`discovered_by` id handling.** If `clue_carriers` rendering ever surfaces `discovered_by` (an `entity_id`), it must resolve to a display label — but the recommended projection emits only `clue_text` to the writer lane and omits `discovered_by`, so no id is rendered. Keep it that way unless the reassessment justifies otherwise (and if so, reuse the SECRETPROMPT-001 resolver).
8. **Adjacent contradiction classification.** If implementation review concludes available clue carriers should *not* compile (e.g. they duplicate `allowed_surface_cues` in practice), the correct resolution is to amend contract row 130 to drop the `+ clue_carriers available now` clause instead — a doc-only diff. Decide this in the Architecture Check before writing code; do not leave code and contract disagreeing.

## Architecture Check

1. Preferred: extend the `allowed_clues_and_surface_cues` resolver to also collect, per active SECRET, each `clue_carriers` entry with `status === "available"`, projecting its `clue_text` (deterministic order: existing `allowed_surface_cues` lines first, then available carrier `clue_text` lines). This satisfies the contract with one local change and no schema churn. Optionally prefix `clue_strength` (e.g. `(suggestive) …`) only if a test demonstrates author value; default to bare `clue_text` (YAGNI).
2. No backwards-compatibility shim: the resolver gains one filtered source; no second placeholder or duplicate lane is introduced. The fallback (doc-only retraction) likewise introduces no shim.

## Verification Layers

1. An active SECRET with an `available` clue carrier renders that carrier's `clue_text` inside `{allowed_clues_and_surface_cues}` → component test in `compiler-front-sections.test.ts`.
2. A carrier with `status` other than `available` (e.g. `destroyed`, `suppressed`, `superseded`) is **not** rendered → unit test asserting exclusion.
3. No entity id (`discovered_by`) appears in the rendered clue lane → grep-style assertion in the test.
4. Contract and code agree after the change → `docs/compiler-contract.md` row 130 matches the implemented behavior (manual review + the row left intact when compiling, or amended in the doc-only fallback).

## What to Change

### 1. Compile available clue carriers (`front.ts:137-139`)

- In the `allowed_clues_and_surface_cues` resolver, after the `allowed_surface_cues` lines, append `clue_text` for each `clue_carriers` entry whose `status === "available"`, deterministically ordered. Emit `clue_text` only (no `discovered_by`/id, no `audience_visible`). Preserve the existing empty-state fallback when both sources are empty.

### 2. Keep the contract aligned (`docs/compiler-contract.md`)

- Confirm row 130 still accurately describes the behavior; tighten its wording if needed to state the `status === "available"` filter and that only `clue_text` is surfaced.

## Files to Touch

- `packages/core/src/compiler/sections/front.ts` (modify)
- `packages/core/test/compiler-front-sections.test.ts` (modify)
- `docs/compiler-contract.md` (modify — tighten row 130, or retract the clause in the fallback path)
- `packages/core/test/compiler-golden.test.ts` (modify only if the demo/golden fixture's clue carriers now change the golden output)

## Out of Scope

- SECRET holder/non-holder label rendering (SECRETPROMPT-001) and `secret_kind` usage (SECRETPROMPT-003).
- Surfacing `discovered_by`, `clue_strength`, or `audience_visible` as structured prompt fields beyond the optional `clue_strength` prefix noted in the Architecture Check.
- Any validation rule that gates on clue carriers.

## Acceptance Criteria

### Tests That Must Pass

1. An active SECRET with one `available` clue carrier renders its `clue_text` in `{allowed_clues_and_surface_cues}` alongside any `allowed_surface_cues`.
2. Clue carriers with non-`available` status are excluded; no `discovered_by` entity id appears in the rendered lane.
3. A SECRET with empty `allowed_surface_cues` and no available carriers still renders the existing empty-state constant.
4. `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. `{allowed_clues_and_surface_cues}` output matches the compiler-contract row-130 source description after this change (code and doc agree).
2. Clue compilation never emits an entity id or a narrator-certified reveal; it is a writer-facing surface-cue lane only.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-front-sections.test.ts` — add available/non-available carrier cases and the no-id assertion; rationale: proves the contract clause is honored without leaking ids or reveals.

### Commands

1. `npm test --workspace @loom/core -- compiler-front-sections` (targeted proof).
2. `npm run lint && npm run typecheck && npm test` (full-pipeline gate).
