# SPEC009OPEGLOBSET-008: Generate action + read-only ephemeral candidate on /preview

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Large
**Engine Changes**: Yes — extends `packages/web/src/preview/PromptPreviewView.tsx` with a Generate action and a read-only ephemeral candidate panel; adds candidate-panel CSS.
**Deps**: SPEC009OPEGLOBSET-006

## Problem

The `/preview` surface compiles and displays the prompt but cannot send it. Phase 9 adds a Generate button to the **ready** (compiled, not blocked) state that calls `generate()` and renders the returned candidate text **read-only and ephemeral** — with a Clear action and a "draft candidate — not accepted, not canon" notice — plus normalized errors. No editing, regenerate, discard, or accept (those are Phase 10).

## Assumption Reassessment (2026-06-06)

1. `packages/web/src/preview/PromptPreviewView.tsx` holds a `PreviewState` union `loading | idle | ready{result: CompileResult} | blocked{result: CompileBlocked} | error{kind,message}` (`PromptPreviewView.tsx:8–12`); the **ready** branch (`state.status === "ready"`, line 98) renders the compiled prompt with a copy action. The Generate button attaches to this ready branch, exactly as `specs/SPEC-009-…md` Deliverable 6 specifies.
2. `docs/requirements-version-1/OPENROUTER-INTEGRATION.md` request-lifecycle step 7 says "displays **editable** candidate prose" — but that editable candidate is the **Phase-10 end-state**; `IMPLEMENTATION-ORDER.md` Phase 9 requires only "non-streaming send returns candidate text" and Phase 10 owns "user can edit candidate before acceptance". Restated so this ticket does not over-build: Phase 9 is **display-only** (read-only panel + Clear), no edit/regenerate/discard/accept control.
3. Cross-artifact boundary under audit: this component consumes `generate()` and its `GenerateResponse` union (SPEC009OPEGLOBSET-006). It must switch on the union's `ok`/`kind`: success → candidate; `validation-blocked` → defer to the existing blocked view (no candidate); `ApiFailure` (incl. `missing-key`) → actionable error.
4. FOUNDATIONS principles motivating this ticket — §2 / §3 / §20 (accepted prose only by explicit human acceptance; generation proposes, it does not commit), §10 / §22 (no permanent prompt/candidate archive; candidate is session-only), §25 (provider `moderation-refusal` surfaced as a transport outcome, not a story-state verdict). Restated: the candidate is a draft proposal in React state only, never persisted, never canon.
5. Secret-firewall / ephemerality surface (§22): the candidate text lives **only** in React component state for the session — never written to `localStorage` / `sessionStorage` / IndexedDB / disk, never `console.log`-ed; Clear or navigation drops it. A component test asserts no `localStorage`/`sessionStorage` write. No deterministic-compilation surface is touched (the model output is never fed back into compilation).
6. `packages/web/src/styles.css` is also modified by SPEC009OPEGLOBSET-007 (settings form). Parallel siblings on a shared file (both `Deps: 006`, not each other) — this ticket adds candidate-panel rules; mechanical merge expected.

## Architecture Check

1. Attaching Generate to the existing ready state reuses the compiled-prompt flow and the established `status`-switch pattern, so the new sending/candidate/error sub-states slot into the same render structure. Keeping the candidate strictly in component state (no storage) makes ephemerality structural, not a cleanup step — the strongest form of §22 compliance. Deferring all candidate-lifecycle controls to Phase 10 keeps this a reviewable additive diff.
2. No backwards-compatibility shim: additive states on an existing component; no existing branch changes contract.

## Verification Layers

1. Success → read-only candidate → RTL test: a mocked `generate()` success renders the candidate text in a read-only, scrollable panel with the "draft — not accepted, not canon" notice and **no** editable field / accept control.
2. Error → actionable message → test: a mocked `missing-key` (and a generic transport error) renders the actionable category message with no candidate; project data unchanged.
3. Blocked-on-send → test: a `validation-blocked` response renders no candidate (defers to the blocked view).
4. Clear + ephemerality → test: Clear removes the candidate from the DOM; assert the candidate text is written to neither `localStorage` nor `sessionStorage`; no accept/persist affordance exists.

## What to Change

### 1. `PromptPreviewView.tsx` (modify)

In the ready branch, add a **Generate** button → `generate()`, and extend the component's local state with the send sub-states:

- **sending** — a non-committal "Generating…" status (optional `AbortSignal` cancellation only if cheap; not required to be durable).
- **candidate** — the returned text in a **read-only**, scrollable panel, clearly ephemeral, with a **Clear** action and a "draft candidate — not accepted, not canon" notice. No edit field, no regenerate/discard/accept.
- **error** — the normalized category as an actionable message (e.g. "API key missing — configure it in Settings", "Insufficient credits", "Rate limited — wait and retry", "Provider/model unavailable"), project data unchanged.
- **blocked** — defer to the existing blocked view when `generate()` returns `validation-blocked`.

The candidate text lives only in React state; Clear/navigation drops it; never persisted or logged.

### 2. `styles.css` (modify)

Minimal read-only candidate-panel rules consistent with existing surfaces; no new CSS framework.

## Files to Touch

- `packages/web/src/preview/PromptPreviewView.tsx` (modify — Generate action + candidate states)
- `packages/web/src/preview/PromptPreviewView.test.tsx` (modify — new state tests)
- `packages/web/src/styles.css` (modify — candidate-panel rules)

## Out of Scope

- Candidate editing / regenerate / discard / accept — Phase 10; the disabled "Generate/Candidate" nav placeholder stays disabled.
- The settings editor — SPEC009OPEGLOBSET-007.
- The `generate()` client — SPEC009OPEGLOBSET-006.
- Any durable write / accepted-segment creation — Phase 11.

## Acceptance Criteria

### Tests That Must Pass

1. Success → read-only candidate text present, with the draft notice, no editable field, no accept control.
2. Error (incl. `missing-key`) → actionable category message, no candidate.
3. `validation-blocked` on send → no candidate (blocked view).
4. Clear removes the candidate from the DOM; the candidate text is written to no `localStorage`/`sessionStorage` (asserted); no accept/persist affordance exists.
5. `npm test --workspace @loom/web -- src/preview/PromptPreviewView.test.tsx`, `npm run typecheck`, `npm run lint`, `npm test` all green.

### Invariants

1. The candidate is read-only and ephemeral: session React state only, never persisted to storage/disk, never logged.
2. No Phase-10 affordance (edit/regenerate/discard/accept) exists in Phase 9.

## Test Plan

### New/Modified Tests

1. `packages/web/src/preview/PromptPreviewView.test.tsx` — RTL with mocked `generate()`: success read-only candidate, error actionable message, blocked-on-send, Clear + no-storage-write assertion, absence of edit/accept controls.

### Commands

1. `npm test --workspace @loom/web -- src/preview/PromptPreviewView.test.tsx`
2. `npm run typecheck && npm run lint && npm test`
3. `grep -nE "localStorage|sessionStorage|indexedDB" packages/web/src/preview/PromptPreviewView.tsx` — must return nothing (ephemerality proof).

## Outcome

Completed: 2026-06-06

Extended `packages/web/src/preview/PromptPreviewView.tsx` with a Generate action in the
ready prompt-preview state. The send state is local to the component and covers sending,
read-only draft candidate, actionable transport errors, and validation-blocked responses
that defer back to the existing blocked view. The candidate panel has a Clear action and a
"Draft candidate; not accepted, not canon." notice, with no edit, regenerate, discard, or
accept affordance.

Added candidate-panel CSS in `packages/web/src/styles.css`.

Extended `packages/web/src/preview/PromptPreviewView.test.tsx` with mocked `generate()`
coverage for successful read-only candidate rendering, missing-key and provider errors,
blocked-on-send handling, Clear behavior, no accept/edit controls, and no storage writes.

Deviations: none from the ticket scope.

Verification:

- `npm test --workspace @loom/web -- src/preview/PromptPreviewView.test.tsx` — passed.
- `rg -n "localStorage|sessionStorage|indexedDB" packages/web/src/preview/PromptPreviewView.tsx` — no matches.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — 56 files / 324 tests passed.
- `npm run build` — passed.
