# SPEC032SEGRECASS-002: Core reconciliation types, snapshot, segment-span algorithm, and citation keys

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `@loom/core` modules `compiler/reconciliation/{types,segment-spans,citation-keys}.ts` and their tests; no change to any existing compiler/output behavior
**Deps**: SPEC032SEGRECASS-001

## Problem

Segment Reconciliation needs a dedicated, purpose-specific source-tuple and snapshot type (distinct from `GenerationSessionReadyInput`, `ValidationSnapshot`, and `StoryRecordHygieneSnapshot`) so that accidental source expansion is reviewable, plus a deterministic accepted-segment span algorithm that produces stable citation keys without asking the model to quote prose. This ticket lays the pure-`@loom/core` foundation: the `SegmentReconciliationSourceTuple` / `SegmentReconciliationSnapshot` shapes, the segment-span partition algorithm (proposal §5.3), and the citation-key generators (`[SEG-<seq>-S###]`, `[BRIEF:<path>]`, per-type record keys, `[REF-…]` stubs, `[RECORD-SCOPE]`). It is the earliest feature code, so it carries the amendment co-landing constraint.

Implements SPEC-032 Deliverable 2 (part a). The detailed span algorithm and key formats are fixed by `reports/segment-reconciliation-assistance-change-proposal.md` §5.1–§5.5.

## Assumption Reassessment (2026-06-24)

1. The new module directory `packages/core/src/compiler/reconciliation/` does not exist yet (verified: `test ! -f` on all planned files passed this session). The sibling pattern to mirror is `packages/core/src/compiler/ideation/citation-keys.ts` and `packages/core/src/compiler/hygiene/citation-keys.ts` (both exist), so this follows an established intra-compiler module convention.
2. The snapshot must NOT reuse `GenerationSessionReadyInput` (spec §2.3 / §5.2): reconciliation must operate precisely when generation-time fields are missing/stale, so blocking it on readiness would trip FOUNDATIONS §29.5. The brief-projection field set is the nineteen saved-draft paths verified present in `packages/core/src/records/generation-brief*.ts` this session (16 CURRENT AUTHORITATIVE STATE + 3 IMMEDIATE HANDOFF).
3. **Cross-artifact boundary under audit**: the span-key and brief-key formats this ticket emits are consumed by the compiler (SPEC032SEGRECASS-004) and validated by the output parser (SPEC032SEGRECASS-005). The exact key grammar (`[SEG-<sequence>-S001]`, `[BRIEF:<field_path>]`) is the shared contract; it must match what `output-schema.ts`/`parse-output.ts` will accept. The 800-UTF-16-code-unit span boundary (proposal §5.3) is a deterministic implementation default revisable only with the template/compiler/contract/golden cascade.
4. **Deterministic-compilation surface (§8)**: the span partition and key assignment are the first compilation inputs. Confirm the change introduces no nondeterminism — partition only on blank-line paragraph boundaries then sentence/whitespace/hard-split at ≤800 code units, assign keys in source order, never call an LLM, never read wall-clock time. Identical normalized segment text must yield byte-identical spans and keys. The deferred enforcement is the SPEC032SEGRECASS-004 golden test (byte-identical prompt + fingerprint); this ticket's own property tests confirm span coverage and determinism.

## Architecture Check

1. A dedicated `SegmentReconciliationSnapshot` (not a widened sibling type) keeps the source surface explicit and reviewable — any future source expansion is a visible type change, satisfying the spec's "accidental source expansion is reviewable" goal. Mirroring the ideation/hygiene module layout keeps the compiler package internally consistent.
2. No backwards-compatibility aliasing/shims: the new types are net-new; no existing snapshot type is widened or aliased to carry accepted-segment text.

## Verification Layers

1. Span coverage invariant (spans cover all normalized non-whitespace text exactly once, no overlap) → property test (`@fast-check`) over arbitrary text including LF/CRLF, long paragraphs, Unicode, and no-whitespace long runs.
2. Determinism invariant (identical normalized text → byte-identical spans + keys) → unit test asserting repeated calls are equal; no `Date`/random/LLM in the module.
3. Key-grammar invariant (keys match `[SEG-<seq>-S###]` / `[BRIEF:<path>]` / per-type / `[REF-…]` / `[RECORD-SCOPE]`) → unit test asserting emitted keys against the fixed format the parser (SPEC032SEGRECASS-005) will accept.

## What to Change

### 1. `compiler/reconciliation/types.ts`

Define `SegmentReconciliationSourceTuple`, `SegmentReconciliationSnapshot`, `AcceptedSegmentSpan`, `ReconciliationBriefField` (`field_path`, `current_state: "missing" | "blank" | "present"`, optional canonical `current_value`), `ReconciliationRecord`, `ReconciliationReferenceStub` (id/type/display-label only), `SegmentReconciliationRecordScope = "active_working_set" | "whole_project"`, and the request shapes (`segmentSelection: "latest"`, `recordScope`). No `node:*`/fastify/react/vite imports (core purity boundary).

### 2. `compiler/reconciliation/segment-spans.ts`

Implement the proposal §5.3 algorithm: normalize CRLF/lone-CR → LF (for rendering/fingerprinting only; stored text unmodified); split at blank-line paragraph boundaries preserving half-open UTF-16 offsets; trim leading/trailing whitespace adjusting offsets; split any candidate > 800 UTF-16 code units at the last sentence boundary ≤800, else last whitespace, else hard-split at 800; never overlap, never omit non-whitespace text.

### 3. `compiler/reconciliation/citation-keys.ts`

Generate `[SEG-<sequence>-S001…]` in source order; `[BRIEF:<field_path>]` for all nineteen paths (always one key each, populated or not); one-based per-type record keys (`[ENTITY-1]`, `[CAST-MEMBER-1]`, …) after deterministic ordering; `[REF-<TYPE>-N]` stub keys; and the singleton `[RECORD-SCOPE]` key.

## Files to Touch

- `packages/core/src/compiler/reconciliation/types.ts` (new)
- `packages/core/src/compiler/reconciliation/segment-spans.ts` (new)
- `packages/core/src/compiler/reconciliation/citation-keys.ts` (new)
- `packages/core/test/segment-reconciliation-spans.test.ts` (new)

## Out of Scope

- The schema catalog and record/stub *rendering* (SPEC032SEGRECASS-003) and the compiler/template/section-order/fingerprint (SPEC032SEGRECASS-004).
- Exporting these symbols from `packages/core/src/index.ts` — the barrel export lands with the compiler ticket (SPEC032SEGRECASS-004); this ticket's tests import the module files directly.
- Any server snapshot building (SPEC032SEGRECASS-006) — this ticket defines the *type*, not the builder.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- segment-reconciliation-spans` — span coverage, determinism, and key-grammar tests pass.
2. `npm run typecheck` — the new types compile under strict TS with no `any` leakage.
3. `npm run lint` — passes, including the `@loom/core` import-boundary rule (no `node:*`/fastify/react/vite).

### Invariants

1. Spans partition the normalized segment text with no overlap and no omitted non-whitespace run; keys are assigned in source order.
2. The module is pure: no `Date.now()`, no randomness, no LLM call, no platform import — identical input yields identical output.

### Invariants (co-landing)

3. **Same revision; never merge standalone (§1.1)**: this ticket declares `Deps: SPEC032SEGRECASS-001` and lands in the *same revision* as that amendment, so no reconciliation feature code lands before the constitution authorizes the accepted-prose read. The amendment never merges standalone ahead of this code.

## Test Plan

### New/Modified Tests

1. `packages/core/test/segment-reconciliation-spans.test.ts` — property tests (span coverage/no-overlap over arbitrary LF/CRLF/Unicode/no-whitespace text), determinism unit tests, and key-grammar unit tests.

### Commands

1. `npm test -- segment-reconciliation-spans`
2. `npm run typecheck && npm run lint`
3. The targeted vitest filter plus typecheck/lint is the correct boundary because this ticket adds pure types and functions with no pipeline integration yet; full-pipeline verification belongs to the compiler golden ticket (SPEC032SEGRECASS-004) and the capstone (SPEC032SEGRECASS-008).

## Outcome

Completed: 2026-06-24

Added segment-reconciliation core source types, accepted-segment span partitioning, and deterministic citation key helpers.

Verification: `npm test -- segment-reconciliation-spans`; `npm run typecheck`; `npm run lint`; `npm test`; `npm run build`; `git diff --check`.
