# BRIEFSPACEBAR-001: Stop the Manual Moment Directive `must_render` field from eating spaces

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `@loom/web` only: `packages/web/src/generation-brief/GenerationBriefView.tsx` (the `lines()` helper + `must_render` onChange + `save()` payload builder). No schema, compiler, validation, or server change.
**Deps**: None

## Problem

In the Generation Brief view (`/generation-brief`), under **MANUAL MOMENT DIRECTIVE**, the `must_render` textarea silently rejects the spacebar. Every other key works; every other field on the page accepts spaces. The user cannot type multi-word phrases (e.g. "the door closing") into the one field that most needs them.

**Root cause (reproduced live via Puppeteer against the running app, no save):** `must_render` is the only brief field whose textarea is a *fully controlled* input whose displayed value is **derived from a normalized array**, re-normalized on every keystroke. In `GenerationBriefView.tsx`:

- `lines()` (line 32-34) does `value.split("\n").map((line) => line.trim()).filter(Boolean)`.
- The textarea `value={manualDirective.must_render.join("\n")}` (line 323) and `onChange={... must_render: lines(event.target.value) ...}` (line 324).

Sequence when pressing space after `hello`: browser proposes `"hello "` → `lines("hello ")` → `.trim()` → `["hello"]` → state `["hello"]` → React re-renders with `value="hello"`. The trailing space is destroyed on that keystroke and the caret resets to the end, so the next character lands immediately after `hello`. A space can never survive between two words. (Internal spaces in a single bulk paste survive because `"a b".trim() === "a b"`; the bug is specifically the in-progress trailing space, which is why it reads as "the spacebar is broken.")

Live evidence: simulating real controlled-input keystrokes for `"hello world"`, the space keystroke returned `attempted: "hello "` → `domAfter: "hello"`; every non-space keystroke round-tripped intact.

This also **violates `docs/FOUNDATIONS.md:195`**: a draft brief field "must still preserve the author's partial work." Trim/filter normalization belongs at the ready/save boundary (`FOUNDATIONS.md:195`, `:254`), not during draft editing.

## Assumption Reassessment (2026-06-08)

1. **Code:** `lines()` is defined at `packages/web/src/generation-brief/GenerationBriefView.tsx:32-34` and is used in exactly one place — the `must_render` onChange at line 324. The textarea binds `value={manualDirective.must_render.join("\n")}` at line 323. Confirmed by repo-wide grep: `lines(` and the `join("\n")`/`split(...).trim().filter(Boolean)` round-trip exist only in this file for this field.
2. **Docs:** `docs/FOUNDATIONS.md:195` ("Draft fields may be partial, blank, or locally inconsistent while the author is working… it must still preserve the author's partial work") and `:254` (normalization is the *ready* input) place normalization at the save/ready boundary, not at per-keystroke draft edit. The fix realigns the field with this principle rather than weakening anything.
3. **Schema contract under audit:** the view parses/saves against the *draft* schema. `packages/core/src/records/generation-brief-draft.ts:66` defines `must_render: z.array(draftString).optional()` where `draftString = z.string()` (line 5). The draft schema imposes **no** trim/non-empty requirement, so the per-keystroke trim/filter is pure UI normalization and is safe to defer to save time. The strict/ready schemas (`generation-brief.ts:61` `z.array(nonemptyString).min(1)`, `generation-brief-readiness.ts:70` `z.array(readyString).min(1)`) are evaluated server-side against the saved draft, and the save payload remains normalized (trim + drop empties), so readiness/compilation inputs are unchanged.
4. **Codebase-wide recurrence check (explicitly requested):** no other field has this bug today.
   - The other two `manual_moment_directive` arrays — `may_render_if_naturally_caused`, `do_not_force` — exist in the model (`generation-brief-draft.ts`) but are **not rendered** in `GenerationBriefView.tsx` (no input element). No input → no bug. Out of scope (see Out of Scope).
   - `RecordEditor`'s `ListField` (`packages/web/src/records/RecordEditor.tsx:251-303`) renders array fields as one input per element with Add/Remove and registers via react-hook-form (`inputOptions` `setValueAs` only maps `"" → undefined`; no trim). Immune.
   - All other brief fields store `event.target.value` raw (e.g. `current_time` line 261, `recent_causal_context` line 291, `soft_unit_guidance` line 423). Immune.
5. **Adjacent contradiction classification:** the unrendered `may_render_if_naturally_caused` / `do_not_force` arrays are a *latent* risk, not an active bug — classified as future cleanup that must become its own ticket if/when those fields are rendered, not a required consequence of this fix.

## Architecture Check

1. The fix splits `lines()`'s two conflated responsibilities. The display ↔ edit round-trip must be lossless, so the onChange transform becomes **split-only** (`value.split("\n")`), making `join("\n")` ∘ `split("\n")` an exact identity — spaces, trailing whitespace, and in-progress empty lines all survive editing. Normalization (trim each line, drop empties) runs **once**, at save time, in the `save()` payload builder, which is exactly where `FOUNDATIONS.md:195/:254` says it belongs. This is strictly simpler than the rejected alternative of a separate local raw-text buffer state (which adds a second source of truth requiring re-sync on initial load and after every save) and far smaller than redesigning the field into per-item inputs.
2. No backwards-compatibility aliasing or shims are introduced. `lines()` is replaced by two focused helpers (`splitLines`, `normalizeLines`); no dual code paths remain.

## Verification Layers

1. Invariant: the `must_render` textarea preserves arbitrary in-progress whitespace (spaces survive). → component test (jsdom + RTL `fireEvent.change` with a trailing-space value asserting the DOM value is unchanged).
2. Invariant: the saved draft payload still normalizes `must_render` (lines trimmed, empties dropped). → component test asserting `setGenerationBrief` is called with the normalized array after editing then saving.
3. Invariant: no `must_render` round-trip transform survives elsewhere in `@loom/web`. → codebase grep-proof (`lines(`, `split("\n").map(...).trim()...filter(Boolean)` appear nowhere after the change).
4. Invariant: draft data contract unaffected. → FOUNDATIONS alignment check against `generation-brief-draft.ts:66` (`z.array(z.string())`) — the deferred normalization keeps the saved array within the strict/ready schemas evaluated server-side.

## What to Change

### 1. Replace `lines()` with two focused helpers

In `packages/web/src/generation-brief/GenerationBriefView.tsx`, replace the single `lines()` helper (lines 32-34) with:

```ts
function splitLines(value: string): string[] {
  return value.split("\n");
}

function normalizeLines(values: readonly string[]): string[] {
  return values.map((line) => line.trim()).filter(Boolean);
}
```

### 2. Make the `must_render` onChange lossless

At line 324, change the transform from `lines(event.target.value)` to `splitLines(event.target.value)` so the controlled textarea round-trips raw text faithfully. The `value={manualDirective.must_render.join("\n")}` binding (line 323) stays.

### 3. Normalize `must_render` at save time

In `save()` (lines 178-203), when building `payload.manual_moment_directive`, normalize the array:

```ts
manual_moment_directive: { ...manualDirective, must_render: normalizeLines(manualDirective.must_render) },
```

so the saved/ready input retains today's trimmed, non-empty shape. (The post-save `setSession(parseSession(response.session))` already re-displays the server-normalized array.)

## Files to Touch

- `packages/web/src/generation-brief/GenerationBriefView.tsx` (modify)
- `packages/web/src/generation-brief/GenerationBriefView.test.tsx` (modify — add regression test)

## Out of Scope

- Rendering or fixing `may_render_if_naturally_caused` / `do_not_force` (not currently rendered; no bug). If they are ever rendered as multiline list textareas, they must reuse `splitLines`/`normalizeLines` — that is a separate ticket.
- Any change to record-editor list inputs (`RecordEditor.tsx`) — already immune.
- Any schema, compiler, validation-rule, or server change.
- Extracting a shared cross-component list-textarea helper/abstraction (YAGNI for a single call site).

## Acceptance Criteria

### Tests That Must Pass

1. New regression test: editing `must_render` via `fireEvent.change` with a trailing-space value (e.g. `"door closing "`) leaves the textarea DOM value byte-for-byte unchanged (space preserved).
2. New/extended test: after editing `must_render` to multi-line content including blank and untrimmed lines, clicking **Save Generation Brief** calls `setGenerationBrief` with `manual_moment_directive.must_render` trimmed and empty-filtered.
3. `npm test` (builds `@loom/core`, then full Vitest) passes.

### Invariants

1. The `must_render` textarea is a lossless controlled input: `join("\n")` ∘ `split("\n")` is identity for the value the user typed; no keystroke is silently dropped.
2. The saved draft payload's `must_render` remains a trimmed, non-empty `string[]`, identical in shape to today's saved output.

## Test Plan

### New/Modified Tests

1. `packages/web/src/generation-brief/GenerationBriefView.test.tsx` — add a regression case proving a trailing space survives an edit (fails on current code: `lines("door closing ")` → `["door closing"]` → re-render drops the space; passes after the split-only change). Reuse the existing mocked-api harness (`getGenerationBrief`/`setGenerationBrief` are already `vi.fn()`-mocked at the top of the file).
2. `packages/web/src/generation-brief/GenerationBriefView.test.tsx` — assert the save path still normalizes (trim + drop empties), guarding against a regression where normalization is dropped entirely instead of deferred.

### Commands

1. `npm test -- packages/web/src/generation-brief/GenerationBriefView.test.tsx` (targeted)
2. `npm run lint && npm run typecheck && npm test` (full pipeline)
3. Narrower targeted command is the correct first boundary because the change is confined to one `@loom/web` component; the full pipeline confirms no cross-package regression and that `@loom/core` still builds.

## Outcome

Completion date: 2026-06-08

What changed:

- Replaced per-keystroke `must_render` trim/filter normalization with lossless split-only textarea editing.
- Added save-time `must_render` normalization so the saved draft payload remains trimmed and empty-filtered.
- Added regression coverage for trailing-space preservation and save-time normalization.

Deviations from original plan: none.

Verification results:

- `npm test -- packages/web/src/generation-brief/GenerationBriefView.test.tsx` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed.
- `npm run build` passed.
