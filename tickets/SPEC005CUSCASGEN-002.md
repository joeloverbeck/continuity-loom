# SPEC005CUSCASGEN-002: Core "what will compile" destination helper

**Status**: PENDING
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — new `@loom/core` pure helper (`compile-destinations.ts`) + new exports in `packages/core/src/index.ts`
**Deps**: None

## Problem

Active-working-set curation (SPEC005CUSCASGEN-007) must show "what will compile" — selected records grouped by prompt-section destination — at a conceptual level *before* the real prompt preview exists (`UI-WORKFLOWS.md:124`). No such helper exists; the deterministic compiler is Phase 7. This ticket adds a pure, deterministic record-type-to-section-family grouping in `@loom/core`.

## Assumption Reassessment (2026-06-05)

1. No destination helper exists in `@loom/core` today (`packages/core/src/index.ts:1-89` exports none). Record types come from `recordTypes` / `recordTypeRegistry` (`packages/core/src/records/registry.ts`, re-exported in `index.ts:61-74`). Cast inclusion bands live in `activeWorkingSetSchema` (`packages/core/src/records/generation-brief.ts:5-28`): `active_onstage_cast_full` (array of `{cast_member_id, local_function}`), `present_minor_cast_compressed`, `offstage_relevant_cast`.
2. Destination section-family names are authoritative in `docs/story-record-schema.md:940-961` (§13 prompt ordering) and `docs/compiler-contract.md:34-65` (§3 prompt section order) — e.g. rich active cast dossiers, present-minor/offstage cast, facts/beliefs/events, plans/clocks/obligations, locations/objects/affordances.
3. Shared boundary under audit: the sole consumer is web ticket SPEC005CUSCASGEN-007. The contract is `(selected records + cast band) → coarse section family`; the helper outputs a deterministic, stable-sorted grouping.
4. (FOUNDATIONS §8 / §29.4) Deterministic compilation: this helper is **not** a compiler. It must not select/rank/summarize/rewrite records, must not assemble prompt text, must produce identical output for identical inputs, and must not read accepted prose. Per SPEC-005 (resolved finding M2) it keys on **record type (plus cast band for CAST MEMBER)** into coarse families and deliberately does **not** read discriminant subfields (`fact_kind`, `event_kind`, BELIEF holder-POV); that finer per-record routing is the Phase-7 compiler's job.
5. (Deterministic-compilation substrate) The real §8 compiler is Phase 7; this conceptual helper introduces no LLM intermediary and no nondeterminism (stable sort), and reads only record type + band assignment — never secret values — so it opens no §15 secret-firewall path.

## Architecture Check

1. A pure deterministic type-to-family map in core is unit-testable at the purity boundary and reused by the curation UI without embedding prompt-section knowledge in React. Keeping it deliberately coarse (type-keyed, no discriminant read) prevents it drifting into a shadow compiler that would duplicate Phase-7 logic.
2. No backwards-compatibility aliasing or shims — a net-new export only.

## Verification Layers

1. Deterministic, stable-sorted buckets → core unit test: identical input yields identical ordered output.
2. Coarse granularity (no discriminant read) → core unit test: two FACT records with different `fact_kind` land in the same family.
3. Core purity preserved → `packages/core/test/boundary.test.ts` stays green (no `node:*` / framework imports added).

## What to Change

### 1. New destination helper

Add `packages/core/src/records/compile-destinations.ts` exporting `whatWillCompile(selectedRecords, activeWorkingSet)` returning the selected records grouped into stable-sorted destination-family buckets (names drawn from §13 / compiler-contract §3). CAST MEMBER records route by band (active-onstage full / present-minor / offstage); all other record types route by type → family. No subfield is read.

### 2. Export from index

Add the helper (and any result type) to `packages/core/src/index.ts`.

## Files to Touch

- `packages/core/src/records/compile-destinations.ts` (new)
- `packages/core/test/compile-destinations.test.ts` (new)
- `packages/core/src/index.ts` (modify)

## Out of Scope

- Prompt-text assembly, salience inference, or any accepted-prose read (Phase 7).
- Discriminant-subfield routing (`fact_kind` / `event_kind` / holder-POV) — Phase 7.
- React rendering of the preview (SPEC005CUSCASGEN-007).

## Acceptance Criteria

### Tests That Must Pass

1. New `compile-destinations.test.ts`: identical input produces identical, stable-sorted output (determinism).
2. New `compile-destinations.test.ts`: differing-`fact_kind` FACT records group into the same family (coarse, no discriminant read); CAST MEMBER records route by band.
3. `npm run typecheck && npm run lint && npm test && npm run build` all green (including `packages/core/test/boundary.test.ts`).

### Invariants

1. Buckets are keyed by record type (plus cast band); no discriminant subfield is read.
2. Output is stable-sorted and deterministic; no LLM intermediary, no accepted-prose read.

## Test Plan

### New/Modified Tests

1. `packages/core/test/compile-destinations.test.ts` — determinism + coarse-family grouping + cast-band routing.

### Commands

1. `npm test` — builds `@loom/core` first, then runs Vitest across packages.
2. `npm run typecheck && npm run lint && npm test && npm run build` — full CI gate.
3. Narrower boundary: the helper is pure `@loom/core` logic, so its core unit test inside `npm test` is the correct surface; `npx vitest run packages/core/test/compile-destinations.test.ts` (from `packages/core`) filters to it during development.
