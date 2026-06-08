# SECRETPROMPT-003: Resolve the status of the unused SECRET `secret_kind` field

**Status**: COMPLETED
**Priority**: LOW
**Effort**: Small
**Engine Changes**: Yes — either `packages/core/src/compiler/sections/front.ts` (`writer_visible_hidden_truths` projection) + `docs/compiler-contract.md` row 127, **or** a docs-only clarification in `docs/story-record-schema.md` §6.3 + `docs/compiler-contract.md` §9. Decide in the Architecture Check.
**Deps**: None.

## Problem

The SECRET-field audit found `secret_kind` (`identity | motive | location | event_cause | artifact_truth | relationship | institutional | body_state | plan | other`, `packages/core/src/records/knowledge.ts:66`) is defined and populated (demo: `letter-under-flour-bin.ts:266`) but read **nowhere** — not in the compiler, not in validation. Every other prompt-facing SECRET field earns its place; `secret_kind` currently does not satisfy the schema's own "field economy rule" (`docs/story-record-schema.md` §1: every field must earn its place through at least one concrete function).

Unlike SECRETPROMPT-002's `clue_carriers`, **no doc authority promises `secret_kind` in the prompt** — `docs/FOUNDATIONS.md` §15 lists the required secret distinctions and `secret_kind` is not among them, and `docs/compiler-contract.md` row 127 (`{writer_visible_hidden_truths}`) sources only `secret_claim`. So this is a deliberate "should it be used?" decision, not a code/contract mismatch.

This ticket resolves the ambiguity one way or the other so the field stops being silently inert.

## Assumption Reassessment (2026-06-08)

1. **Field unused, confirmed.** Repo-wide grep for `secret_kind` returns only `packages/core/src/records/knowledge.ts:66` (schema) and `packages/core/src/demo/letter-under-flour-bin.ts:266` (demo). No compiler/validation read.
2. **No doc requires it in the prompt, confirmed.** `docs/FOUNDATIONS.md` §15 enumerates the constitutional secret distinctions (holders, non-holders, allowed clues, forbidden reveals, reveal permission, writer-visible truths, POV/audience knowledge) — `secret_kind` is absent. `docs/compiler-contract.md` row 127 sources `{writer_visible_hidden_truths}` from `SECRET.secret_claim` only.
3. **Field-economy rule under audit.** `docs/story-record-schema.md` §1 requires each field to earn its place via compilation, validation, continuity interpretation, voice preservation, prose-quality protection, or authorial control. `secret_kind` could plausibly serve *authorial control* (categorizing/filtering secrets in the editor) even if it never compiles — that is a legitimate keep-reason and the likely outcome.
4. **FOUNDATIONS principle under audit.** §15 (secrets) and §8 (determinism). If the chosen path annotates `{writer_visible_hidden_truths}` with the kind, it is a deterministic literal from the snapshot, LLM-free, writer-facing only, and cannot leak (it adds no new mind-facing knowledge). No §29 hard-fail either way.
5. **Schema-extension check.** No schema field is added or removed; `secret_kind` stays required as today. Only its *consumption* (compile) or its *documented role* (mark authoring-only) changes.
6. **Adjacent contradiction classification.** This is the cleanly-separable third audit item; it is intentionally its own LOW-priority ticket rather than folded into the HIGH bug fix (SECRETPROMPT-001) or the MEDIUM contract-mismatch (SECRETPROMPT-002).

## Architecture Check

1. Two clean options — pick one in implementation, do not ship both:
   - **(a) Annotate writer-visible truths.** Prefix each `{writer_visible_hidden_truths}` bullet with its kind, e.g. `[identity] Ane Arrieta has been a sex worker for years.` Deterministic, one-line projection change in `front.ts:127-129`; update `docs/compiler-contract.md` row 127 to add `secret_kind` to the source. Gives the writer salience about *what category* of hidden truth is in play.
   - **(b) Mark authoring-only.** Leave the prompt untouched and document `secret_kind` as a validation/authoring-only field (editor categorization/filtering), satisfying the field-economy rule via *authorial control*. Add the "not prompt-facing by default" marking required by `docs/story-record-schema.md` §10 and note it in `docs/compiler-contract.md` §9. Docs-only diff.
2. Recommended default: **(a)** if the writer benefits from the kind label at negligible cost; otherwise **(b)**. Either way the field stops being undocumented-and-inert. No backwards-compatibility shim in either path.

## Verification Layers

1. (Path a) Each writer-visible hidden-truth bullet is prefixed with its `secret_kind` → component test in `compiler-front-sections.test.ts`; row 127 updated. **(Path b)** `secret_kind` is documented as not-prompt-facing and the compiled prompt is unchanged → grep-proof that no compiler file reads `secret_kind` + doc review.
2. Determinism preserved → golden test unchanged (path b) or regenerated (path a).

## What to Change

### 1. Path (a) — annotate, OR Path (b) — document

- **(a)** In `writer_visible_hidden_truths` (`front.ts:127-129`), project `[${secret_kind}] ${secret_claim}`; update `docs/compiler-contract.md` row 127 source to `SECRET.secret_claim (prefixed with secret_kind)`.
- **(b)** Add to `docs/story-record-schema.md` §6.3 (or §10's validation-only marking) that `secret_kind` is authoring/validation-only and not prompt-facing; note the same in `docs/compiler-contract.md` §9. No code change.

## Files to Touch

- Path (a): `packages/core/src/compiler/sections/front.ts` (modify), `packages/core/test/compiler-front-sections.test.ts` (modify), `packages/core/test/compiler-golden.test.ts` (modify if golden affected), `docs/compiler-contract.md` (modify).
- Path (b): `docs/story-record-schema.md` (modify), `docs/compiler-contract.md` (modify). No code/test change beyond a grep-proof note.

## Out of Scope

- SECRET holder/non-holder label rendering (SECRETPROMPT-001) and `clue_carriers` compilation (SECRETPROMPT-002).
- Adding any new validation rule that gates on `secret_kind`.
- Building editor UI for filtering by `secret_kind` (separate ticket if desired).

## Acceptance Criteria

### Tests That Must Pass

1. Path (a): `{writer_visible_hidden_truths}` renders each active secret as `[<secret_kind>] <secret_claim>`. Path (b): a grep-proof confirms no compiler file reads `secret_kind` and the doc marks it not-prompt-facing.
2. `npm run lint && npm run typecheck && npm test` pass.

### Invariants

1. After this ticket, `secret_kind` has a documented role (compiled annotation, or explicitly authoring/validation-only) — it is no longer an undocumented inert field.
2. Compilation remains deterministic and introduces no secret leakage.

## Test Plan

### New/Modified Tests

1. Path (a): `packages/core/test/compiler-front-sections.test.ts` — assert the kind-prefixed bullet. Path (b): `None — documentation-only path; verification is the grep-proof named in Verification Layers and existing pipeline coverage.`

### Commands

1. Path (a): `npm test --workspace @loom/core -- compiler-front-sections`; Path (b): `grep -rn "secret_kind" packages/core/src` to prove non-consumption.
2. `npm run lint && npm run typecheck && npm test` (full-pipeline gate).

## Outcome

Completed: 2026-06-08

What changed:

- Chose path (a): `{writer_visible_hidden_truths}` now renders active secrets as `[<secret_kind>] <secret_claim>`.
- `secret_kind` now has a concrete deterministic compiler role and is no longer silently inert.
- Focused compiler tests assert the kind-prefixed writer-visible hidden-truth bullet.
- The golden demo prompt now renders `[artifact_truth]` before the hidden letter claim in the writer-visible hidden-truth lane only.
- `docs/compiler-contract.md` row 127 now names `SECRET.secret_kind` as part of the placeholder source.

Deviations from original plan:

- None.

Verification:

- `npm test --workspace @loom/core -- compiler-front-sections` passed.
- `npm test --workspace @loom/core -- compiler-golden` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 99 files, 657 tests.
