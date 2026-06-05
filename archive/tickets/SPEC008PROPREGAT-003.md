# SPEC008PROPREGAT-003: `PromptPreviewView` surface + AppShell route promotion + preview styling

**Status**: PENDING
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: None — `packages/web` only; no `@loom/server` route, `@loom/core` module, or DDL/`user_version` change.
**Deps**: SPEC008PROPREGAT-001, SPEC008PROPREGAT-002

## Problem

There is no UI to inspect the compiled prompt. `AppShell` lists `"Validation/Preview"`
only as a **disabled** later-phase placeholder (`AppShell.tsx:26`). SPEC-008 Phase 8
requires a validation-gated, ephemeral, inspectable prompt-preview surface: it shows the
compiled prompt **only** when validation reports no blockers, shows **no prompt** (not
even an empty element) when blocked, never persists or logs the prompt, and surfaces no
secret. This ticket builds that surface over `compile()` (001), reuses
`ValidationResultView` (002) for the blocked view, promotes the placeholder to a real
`/preview` route, fixes the test that asserted the placeholder, and adds the preview
styling.

## Assumption Reassessment (2026-06-05)

1. `AppShell` (`packages/web/src/shell/AppShell.tsx`) verified: `primaryRoutes` is an
   `as const` array of `{ to, label }` (lines 17-24); `laterPhaseSurfaces =
   ["Validation/Preview", "Generate/Candidate", "Accepted Segments"]` (line 26) renders as
   disabled buttons (lines 92-98); `<Routes>` holds six `<Route>`s (lines 101-108) using
   `react-router-dom` (`^7.17.0`, `packages/web/package.json:21`). **Change rationale
   (§20):** the placeholder is promoted, not removed silently — it becomes a live nav link
   + route because Phase 8 builds the surface it reserved.
2. Spec contract verified against `specs/SPEC-008-prompt-preview-gated-by-validation.md`
   (§Approach, §Deliverables 2-3): the metadata version triple is read from
   `CompileResult.metadata.versions` (`ValidationVersions = { template, compiler, contract
   }`, `packages/core/src/validation/snapshot.ts:23`) — **not** `VersionInfo`/`versionInfo`
   (per the spec's corrected Risk R-6). Other metadata fields: `fingerprint`,
   `lengthEstimate`, `tokenEstimate` (`packages/core/src/compiler/types.ts:3-8`).
3. Shared boundaries under audit: (a) `compile()` / `CompileResponse` from
   `packages/web/src/api.ts` (SPEC008PROPREGAT-001) — the discriminated union drives the
   four render states; (b) `ValidationResultView` from
   `packages/web/src/generation-brief/ValidationResultView.tsx`
   (SPEC008PROPREGAT-002) — renders the blocked view from the compile body's
   `validation: ValidationResult`, so this surface issues **no** `/api/validate` call. Both
   are created earlier in this batch; this ticket `Deps:` on both (create-then-consume).
4. FOUNDATIONS principles restated before trusting the narrative: §6.4 the generated prompt
   is an inspectable, non-canon operational artifact; §22 prompt inspection must be
   ephemeral (no permanent archive), easy to clear, key-free, and not a future-compilation
   source; §4.5 fail closed — no prompt when blocked; §27 prompt inspection is a UI
   principle (the outside-the-body version-metadata placement traces to the Phase-8 gate /
   UI-WORKFLOWS, not §27 itself).
5. Fail-closed + secret-firewall enforcement surface named: the no-prompt-when-blocked gate
   is the **server-side** `runValidation()` in `packages/server/src/compile-routes.ts`;
   this surface trusts the `validation-blocked` branch and never re-derives completeness
   (§4.5/§29.5). Secret firewall (§22/§23/§29.9): the `/api/compile` payload is key-free
   (`CompileMetadata` has no key field; `prompt` is compiled text), and this view renders
   the payload verbatim adding no secret-bearing field — confirm no new field, no logging,
   and no `localStorage`/`sessionStorage`/IndexedDB write path is introduced (ephemerality
   invariant). No nondeterminism is added: the view displays compiler output verbatim and
   performs no selection/summarization (§8/§29.4).

## Architecture Check

1. A dedicated `/preview` route (vs. inlining into `GenerationBriefView`) matches the
   UI-WORKFLOWS navigation model that lists "Validation and Prompt Preview" as a distinct
   continuity surface, and keeps the always-available inline `ValidationPanel` in the
   generation workflow untouched. Driving all four states off the `compile()` discriminated
   union means "blocked vs ready" is never re-decided client-side. Rendering the blocked
   view via the shared `ValidationResultView` avoids a redundant `/api/validate` fetch.
2. No backwards-compatibility aliasing/shims: the placeholder string is removed from
   `laterPhaseSurfaces` (not kept as a dead alias); the new route is the single source of
   the surface.

## Verification Layers

1. Blocked compile → blocker list shown AND **no prompt element exists in the DOM** (assert
   absence, not emptiness) → component test (query the prompt `<pre>`/role and assert null).
2. Not-blocked compile → prompt text present with expected sections; version triple +
   fingerprint render **outside** the prompt body element → component test (assert the
   triple is NOT within the prompt `<pre>`).
3. Inspection affordances: **Copy** writes the exact prompt to the clipboard; in-prompt
   **search** navigates a long prompt; **Clear** removes prompt + metadata from the DOM;
   **Refresh preview** re-issues `compile()` and replaces prior state → component test
   (mock `navigator.clipboard`, mock `compile`).
4. Ephemerality: no prompt text written to `localStorage`/`sessionStorage`/IndexedDB →
   component test (assert storage untouched after compile + clear).
5. Nav promotion: "Validation / Prompt Preview" renders as a routing link and the
   `"Validation/Preview"` disabled button is gone → `App.test.tsx`.
6. Determinism/secret-firewall: the version triple comes from `metadata.versions` and never
   appears inside the prompt body; payload carries no key → component test + FOUNDATIONS
   alignment check (§22/§23/§29.9).

## What to Change

### 1. New `PromptPreviewView` (`packages/web/src/preview/PromptPreviewView.tsx`)

- Local React state for the discriminated `CompileResponse` result (or `null` = idle after
  Clear). On mount and on **Refresh preview**, call `compile()` (always re-fetch on entry —
  never reuse a memoized prior tree, per UI-WORKFLOWS "no stale success").
- Render by branch:
  - **loading** — non-committal "Compiling prompt…" status.
  - **blocked** (`ok === false && kind === "validation-blocked"`) — `<ValidationResultView
    result={validation} />` + a "Prompt preview is unavailable while blockers exist"
    message; render **no** prompt element at all.
  - **ready** (`CompileResult`) — the prompt pane (below).
  - **error** (`ok === false`, other kinds) — `no-open-project` → "Open a project first";
    `malformed-validation-source` / session-load → a safe structured message; no prompt.
  - **idle** (after Clear) — an empty state with a control to compile again.
- Ready-state prompt pane: `metadata.prompt` rendered in a monospace, scrollable `<pre>`;
  **Copy prompt** (`navigator.clipboard.writeText(prompt)`); **Search within prompt**
  (lightweight highlight/scroll-to or filter — no regex/find-replace engine, per R-4);
  **Clear** (set result to `null`); a prominent **"This prompt is temporary and not canon"**
  notice.
- Metadata panel **outside** the prompt body: `metadata.versions.template` /
  `.compiler` / `.contract`, `metadata.fingerprint`, `metadata.lengthEstimate`,
  `metadata.tokenEstimate` — rendered quietly (reproducibility signals, not story canon).
- Write nothing to any durable store; log no prompt text; make no analytics/telemetry call.

### 2. AppShell promotion (`packages/web/src/shell/AppShell.tsx`)

- Add `{ to: "/preview", label: "Validation / Prompt Preview" }` to `primaryRoutes`.
- Remove `"Validation/Preview"` from `laterPhaseSurfaces` (leaving `"Generate/Candidate"`,
  `"Accepted Segments"` disabled).
- Register `<Route path="/preview" element={<PromptPreviewView />} />` in `<Routes>`.

### 3. `App.test.tsx` update (`packages/web/src/App.test.tsx`)

- Change the disabled-button loop (line 113) to `["Generate/Candidate", "Accepted
  Segments"]` and assert `"Validation/Preview"` is no longer a button.
- Add a positive assertion: the "Validation / Prompt Preview" nav link renders and routes
  to the surface. Extend the `runtimeFetch` stub to answer `POST /api/compile` (e.g. a
  `validation-blocked` or `no-open-project` body) so navigation lands on a deterministic
  state showing the surface heading.

### 4. Preview styling (`packages/web/src/styles.css`)

- Minimal additions for the prompt pane (readable monospace, scroll, large-prompt
  tolerance) and the metadata panel, consistent with existing surface styles; no new CSS
  framework.

### 5. Tests (`packages/web/src/preview/PromptPreviewView.test.tsx`)

- `vi.mock("../api.js")` for `compile`; render within `MemoryRouter` (matching the existing
  view-test pattern). Cover all six Verification-Layer invariants.

## Files to Touch

- `packages/web/src/preview/PromptPreviewView.tsx` (new)
- `packages/web/src/preview/PromptPreviewView.test.tsx` (new)
- `packages/web/src/shell/AppShell.tsx` (modify)
- `packages/web/src/App.test.tsx` (modify)
- `packages/web/src/styles.css` (modify)

## Out of Scope

- OpenRouter settings / API-key detection / model list / any "Generate" or "Send" button
  (Phase 9 — "Generate/Candidate" stays disabled).
- Candidate editor / regenerate / discard / accept / accepted-segment archive (Phases 10-12
  — "Accepted Segments" stays disabled).
- Any `@loom/server` / `@loom/core` / schema / `user_version` change — endpoint, compiler,
  version triple, and validation engine consumed as-is.
- Permanent prompt archive / prompt logging / prompt history / diffing (forbidden in v1, §22).
- Section expand/collapse of the prompt body ("if feasible" — deferred; v1 is a plain
  scrollable body).
- Re-validating or re-deriving completeness on the client (trust the server gate).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- packages/web/src/preview/PromptPreviewView.test.tsx` — blocked/ready/error/idle states, copy, search, clear, refresh, and storage-untouched assertions pass.
2. `npm test -- packages/web/src/App.test.tsx` — nav promotion asserted; placeholder button gone.
3. `npm run lint && npm run typecheck && npm test && npm run build` — all green.

### Invariants

1. No prompt element is rendered in blocked or error states (DOM absence, not an empty
   `<pre>`); the only branch with a prompt is the success `CompileResult`.
2. The template/compiler/contract triple + fingerprint render outside the prompt body and
   never inside it; the prompt body contains only `CompileResult.prompt`.
3. The surface writes nothing to `localStorage`/`sessionStorage`/IndexedDB/disk and logs no
   prompt text; **Clear** and navigation away discard the in-memory prompt; re-entry
   re-fetches.

## Test Plan

### New/Modified Tests

1. `packages/web/src/preview/PromptPreviewView.test.tsx` — full state-matrix + affordance + ephemerality coverage (new).
2. `packages/web/src/App.test.tsx` — nav-promotion + placeholder-removal assertions (modify).

### Commands

1. `npm test -- packages/web/src/preview/PromptPreviewView.test.tsx packages/web/src/App.test.tsx`
2. `npm run lint && npm run typecheck && npm test && npm run build`
3. The two-file `vitest run` is the targeted boundary for the new surface + nav; the full lint/typecheck/test/build run is the merge gate (and proves the "web-only diff" boundary).
