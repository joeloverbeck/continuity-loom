# SPEC019REFINTSTR-001: Project record index in the validation snapshot

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — extends `ValidationSnapshot` and `BuildValidationSnapshotInput` (`@loom/core`); populates the index in `snapshot-builder.ts` (`@loom/server`); excludes the index from the `prompt-middle-salience-risk` size heuristic in `warnings.ts`; adds snapshot/index-invariance tests. No prompt-compilation behavior change.
**Deps**: None

## Problem

Validation cannot distinguish a *dangling* reference (target deleted/nonexistent) from an *existing-but-unselected* one, because `ValidationSnapshot` carries only the selected `records` plus the session/config/versions — it has no project-wide record existence knowledge (`packages/core/src/validation/snapshot.ts:42-47`). SPEC-019 D1 adds a deterministic, validation-only project record index (record id → record type) so the reference-classification helper (002) and every reference rule (003–006) can emit precise `selected` / `unselected` / `dangling` diagnostics. The compiler must never read it (§29.3).

## Assumption Reassessment (2026-06-10)

1. `ValidationSnapshot` today is `{ records, generationSession, storyConfig, versions }` with no project-wide index; `buildValidationSnapshot` deep-clones each field (`packages/core/src/validation/snapshot.ts:35-56`). `resolveRecordLabel` (compiler) reads `snapshot.records` only (`packages/core/src/compiler/labels.ts:8-16`).
2. The sole **production** construction site is `packages/server/src/snapshot-builder.ts:58`; `record-repository.ts:306` exposes `listRecords({ includeArchived })` returning `RecordReadResult[]` with `id` and `type`, so the index is buildable with no new storage API. `buildValidationSnapshot` has ~22 test construction sites repo-wide.
3. Shared boundary under audit: `ValidationSnapshot` is consumed by **both** the deterministic compiler (read-only over `records`) and the validation engine. The new field must be reachable by validation while remaining unread by compilation — enforced by review + an index-invariance test, not by type visibility.
4. FOUNDATIONS principle motivating this ticket: §29.3 (no silent inclusion of unselected records) and §8 (deterministic compilation). The index is the data that later rules use to *block* unselected references from compiling as raw ids; it must not itself become a compiler input.
5. Deterministic-compilation surface named: the prompt compiler (`packages/core/src/compiler/**`). The index is part of the snapshot **input**, so identical input → identical result is preserved; the compiler reads `records`, never `projectRecordIndex`. The index-invariance test locks this: compiling one snapshot with two different index values must yield byte-identical output. No secret-firewall path is touched (the index holds ids and type strings only — no prose, no secret content).
6. Schema extension: `ValidationSnapshot` / `BuildValidationSnapshotInput`. Per SPEC-019 I2 disposition, the field is **required on the built `ValidationSnapshot`** but **optional on `BuildValidationSnapshotInput` with a `{}` default** inside `buildValidationSnapshot` — additive, so the ~22 existing test construction sites compile unchanged; the production site passes the real index.
7. Adjacent interaction (required consequence, not a separate bug): `prompt-middle-salience-risk` measures `JSON.stringify(snapshot).length > 5000` (`packages/core/src/validation/rules/warnings.ts:40`). Adding the index to the snapshot would inflate that measurement and spuriously trip the warning; this ticket excludes the index from the measured projection (SPEC-019 D1 salience-size carveout, Risk 5).
8. Mismatch + correction: the spec text says "extend `ValidationSnapshot` (and `BuildValidationSnapshotInput`)" without specifying optionality; this ticket realizes it as required-on-snapshot / optional-on-input per the approved I2 disposition.

## Architecture Check

1. Optional input field with a `{}` default keeps the snapshot field always-present (so rules never branch on `undefined`) while leaving every existing `buildValidationSnapshot` caller compiling — cleaner than making it required and rewriting 22 fixtures, and cleaner than making the snapshot field optional and forcing every rule to null-guard. Measuring the salience size on a projection that omits the index keeps the warning's meaning (prompt-size proxy) intact rather than re-tuning the 5000 threshold.
2. No backwards-compatibility aliasing or shims: the field is new; no second authority path or legacy accessor is introduced.

## Verification Layers

1. Every built snapshot carries `projectRecordIndex` -> unit test asserting the field is present and frozen after `buildValidationSnapshot`.
2. Compiler never reads the index -> index-invariance test: compile one valid snapshot with two different `projectRecordIndex` values, assert byte-identical output (complements the existing `compiler-golden.test.ts` baseline).
3. Salience warning ignores index size -> unit test: a snapshot whose `projectRecordIndex` is large but whose non-index payload is <5000 bytes does **not** emit `prompt-middle-salience-risk`.
4. Determinism preserved -> FOUNDATIONS §8 alignment + identical-input/identical-result assertion in the snapshot test.

## What to Change

### 1. Extend the snapshot type (`packages/core/src/validation/snapshot.ts`)

Add `projectRecordIndex: Readonly<Record<string, string>>` to `ValidationSnapshot` (required). Add `projectRecordIndex?: Readonly<Record<string, string>>` to `BuildValidationSnapshotInput` (optional). In `buildValidationSnapshot`, default to `{}` and deep-clone/freeze it alongside the other fields.

### 2. Populate the index server-side (`packages/server/src/snapshot-builder.ts`)

Build `id → type` from `repository.listRecords({ includeArchived: false })` (all non-archived project records) and pass it into the `buildValidationSnapshot({ ... })` call at `:58`.

### 3. Salience-size carveout (`packages/core/src/validation/rules/warnings.ts`)

Replace the `JSON.stringify(snapshot).length` measurement at `:40` with a measurement over a projection that excludes `projectRecordIndex` (e.g. stringify `{ ...snapshot, projectRecordIndex: undefined }`), so the validation-only index never moves the prompt-size proxy.

## Files to Touch

- `packages/core/src/validation/snapshot.ts` (modify)
- `packages/server/src/snapshot-builder.ts` (modify)
- `packages/core/src/validation/rules/warnings.ts` (modify)
- `packages/core/test/validation-snapshot-index.test.ts` (new)
- `packages/server/src/snapshot-builder.test.ts` (modify)

## Out of Scope

- Any new validation rule consuming the index (003–006 own those).
- The reference-classification helper (002).
- The `docs/compiler-contract.md` §9 note that the index is validation-only (routed to 009).
- Extending pruning to generation-brief fields (rejected, SPEC-019 scope decision 3).
- Any compiler-rendering change.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test --workspace @loom/core -- validation-snapshot-index` — index present/frozen, index-invariant compiler output, salience carveout, determinism.
2. `npm test --workspace @loom/server -- snapshot-builder` — built snapshot's `projectRecordIndex` contains every non-archived record id mapped to its type and excludes archived records.
3. `npm run typecheck && npm test` — existing `buildValidationSnapshot` construction sites still compile (optional input field) and `compiler-golden.test.ts` remains byte-identical.

### Invariants

1. The deterministic compiler never reads `projectRecordIndex`: identical snapshots differing only in their index produce byte-identical prompts.
2. `projectRecordIndex` is always present on a built `ValidationSnapshot` (never `undefined`), holding only `id → type` string pairs.

## Test Plan

### New/Modified Tests

1. `packages/core/test/validation-snapshot-index.test.ts` (new) — field presence/freeze; index-invariance of compiler output; salience carveout; same-input determinism.
2. `packages/server/src/snapshot-builder.test.ts` (modify) — index population from `listRecords`, archived records excluded.

### Commands

1. `npm test --workspace @loom/core -- validation-snapshot-index`
2. `npm test --workspace @loom/server -- snapshot-builder`
3. `npm run lint && npm run typecheck && npm test` — full gate; proves the optional-input extension broke no existing construction site and the golden baseline is unchanged.
