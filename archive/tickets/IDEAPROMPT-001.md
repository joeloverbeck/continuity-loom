# IDEAPROMPT-001: Ideation grounds must cite full record labels, not the truncated browse-label

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `@loom/core` citation-key derivation (`packages/core/src/compiler/ideation/citation-keys.ts`); golden-ideation fixture refresh; `docs/compiler-contract.md` + `docs/ideation-prompt-template.md` clarification (lockstep).
**Deps**: None

## Problem

In the Ideate page prompt, every `Grounds:` citation key is truncated mid-word with `...` for any record whose label exceeds 80 characters — beliefs, intentions, plans, consequences, obligations, locations alike. Example from a production prompt:

```
Grounds: [BELIEF: Jon Ureña keeps daydreaming in his spare time, during commute, even in bed be...], ...
```

The truncated text loses the meaning the LLM needs to ground an idea, and near-duplicate long labels collapse to the same 77-char prefix (then get a `2`/`3` collision suffix instead of being distinguishable). The compiler already has the full, untruncated text available; the citation-key builder is simply reaching for the wrong field.

## Assumption Reassessment (2026-06-12)

1. **Root cause (verified):** `packages/core/src/compiler/ideation/citation-keys.ts:39-41` — `recordLabel()` returns `record.metadata?.displayLabel ?? displayLabel(record)`. `metadata.displayLabel` is the stored UI `display_label` column (`packages/server/src/snapshot-builder.ts:187`, `record-repository.ts:149`), which is **truncated** by `packages/core/src/records/editor-descriptors.ts:167-168` → `truncateLabel` (`:530-533`, `slice(0,77) + "..."`, cap 80). Confirmed against the real `red-bunny` DB: BELIEF `display_label` rows are exactly `length=80` ending in `...`.
2. **Full label is already available (verified):** `packages/core/src/compiler/labels.ts:4-6` `displayLabel(record)` → `deriveFullDisplayLabel(record.type, record.payload)` (`editor-descriptors.ts:171`) returns the **untruncated** text. `deriveDisplayLabel` (`:167-168`) is the truncating UI variant; the citation key must use the full one.
3. **Shared boundary under audit:** `citationKeysFor` / `citationKey` are the single source for both prompt generation (`slot-assignment.ts:8,90`) **and** server-side returned-key verification (`packages/server/src/ideate-routes.ts:65`). Changing `recordLabel` changes both sides consistently — keys stay matchable. No prose-prompt consumer exists (`index.ts:27` re-export aside, only ideation uses these).
4. **Deterministic-compilation surface (§8):** the change is pure/deterministic and reads no wall-clock/accepted prose; it only swaps which derived label feeds the key. Citation keys remain deterministic per compile, preserving the doc contract that the server verifies returned keys against the compiled set (`docs/ideation-prompt-template.md:136-138`).
5. **Schema/consumer check:** citation-key *string format* is the output contract here. The change widens the label inside the bracket (`[TYPE: <full label>]`); the bracket structure, collision-suffix logic (`citation-keys.ts:13-18`), and verification set are unchanged. Additive to readability, not a structural break.

## Architecture Check

1. Cleaner because the citation key's purpose (let the LLM and the verifier identify a record) is defeated by a browse-oriented 80-char cap; deriving from `deriveFullDisplayLabel` uses the authority already designated as the record's full label, with no new truncation policy invented for prompts.
2. No backwards-compatibility shim: `recordLabel` is changed in place to stop preferring `metadata.displayLabel`. (`metadata.displayLabel` remains correct for its UI purpose; only the citation-key derivation stops borrowing it.)

## Verification Layers

1. Long-label grounds render in full → `@loom/core` unit test: a record whose full label > 80 chars produces a `Grounds:` key with no `...` and the complete text.
2. Server-side key verification still matches → existing `ideate-routes` e2e (`packages/server/src/ideate.e2e.test.ts`) passes unchanged, because both sides call `citationKeysFor`.
3. Determinism preserved → golden-ideation snapshot regenerated and stable across runs.

## What to Change

### 1. `citation-keys.ts` — derive from the full label

In `recordLabel()`, stop preferring the truncated `metadata.displayLabel`; derive the citation label from `displayLabel(record)` (full, untruncated). Keep collision-suffix and sort behavior intact (they call `recordLabel` and remain consistent).

### 2. Docs (lockstep)

- `docs/compiler-contract.md:118` — clarify that citation keys are derived from the record's **full display label** (not the truncated browse-label).
- `docs/ideation-prompt-template.md:136-138` (§Citation Keys) — same clarification.

### 3. Golden + tests

- Refresh `packages/core/test/golden-ideation.prompt.txt` (the current fixture's grounds are all < 80 chars so it does not exercise the bug — add/extend a fixture record with a long label so the golden actually covers full-label rendering).

## Files to Touch

- `packages/core/src/compiler/ideation/citation-keys.ts` (modify)
- `packages/core/test/compiler-ideation-golden.test.ts` and `packages/core/test/golden-ideation.prompt.txt` (modify — add long-label coverage)
- `packages/core/test/ideation-slot-assignment.test.ts` (modify — assert full-label grounds for a > 80-char record)
- `docs/compiler-contract.md` (modify)
- `docs/ideation-prompt-template.md` (modify)

## Out of Scope

- The `display_label` column / `deriveDisplayLabel` truncation used by the records browser UI (correct for its purpose — untouched).
- Any prose-generation prompt rendering (citation keys are ideation-only).
- Introducing a separate, longer-but-still-bounded cap for keys (rejected — full label is the requested behavior and keeps keys unambiguous).

## Acceptance Criteria

### Tests That Must Pass

1. New `@loom/core` unit/slot-assignment test: a record with a full label > 80 chars renders its complete text in `Grounds:` with no `...`.
2. `npm test` — golden-ideation regenerated; `compiler-ideation-golden.test.ts` green.
3. `packages/server/src/ideate.e2e.test.ts` — returned-citation-key verification still matches the compiled set.
4. `npm run lint && npm run typecheck`.

### Invariants

1. Prompt-side and server-side citation keys for the same record are byte-identical (both from `citationKeysFor`).
2. Citation-key derivation introduces no character cap; `...` never appears in a key solely from length truncation.

## Test Plan

### New/Modified Tests

1. `packages/core/test/ideation-slot-assignment.test.ts` — long-label grounds assertion.
2. `packages/core/test/compiler-ideation-golden.test.ts` / `golden-ideation.prompt.txt` — golden covers a long label.

### Commands

1. `npm test`
2. `npm run lint && npm run typecheck`

## Outcome

Completion date: 2026-06-12

What changed:
- `packages/core/src/compiler/ideation/citation-keys.ts` now derives citation keys from the record's full prompt-facing display label instead of `metadata.displayLabel`, so long ideation grounds are no longer truncated by browse-label metadata.
- `packages/core/test/ideation-slot-assignment.test.ts` now covers a long BELIEF label with a deliberately truncated metadata/display label and verifies both `citationKeysFor` and slot assignment use the full label.
- `packages/core/test/compiler-ideation-golden.test.ts` and `packages/core/test/golden-ideation.prompt.txt` now include a long-label ideation grounds case.
- `docs/compiler-contract.md` and `docs/ideation-prompt-template.md` now state that ideation citation keys use the full display label, not the truncated browse label.

Deviations from original plan:
- Implemented and archived together with `IDEAPROMPT-002` because both tickets intentionally update the same ideation golden fixture and the same ideation prompt contract docs. The source changes remain separated by concern.

Verification:
- `npm exec vitest run packages/core/test/ideation-slot-assignment.test.ts packages/core/test/compiler-ideation-golden.test.ts packages/core/test/compiler-golden.test.ts` passed.
- `npm run build --workspace @loom/core` passed.
- `npm exec vitest run packages/server/src/ideate.e2e.test.ts packages/server/src/ideate-routes.test.ts` passed after updating the e2e provider fixture to the full citation key.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 121 files, 909 tests.
- `npm run build` passed, with Vite's existing large-chunk warning.
