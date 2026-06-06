# SPEC009OPEGLOBSET-007: Settings surface — real OpenRouter editor

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Large
**Engine Changes**: Yes — extracts `SettingsSurface` from `packages/web/src/shell/AppShell.tsx` into `packages/web/src/shell/SettingsSurface.tsx` (real editor); updates `App.test.tsx`; adds settings-form CSS.
**Deps**: SPEC009OPEGLOBSET-006

## Problem

The `/settings` route currently renders an inline placeholder showing a static "OpenRouter key — Not configured". Phase 9 promotes it to a real editor: model id (manual entry + optional refresh-populated chooser), temperature, max output tokens, optional `top_p`, an "API key configured/missing" status (never the value), and a Refresh-model-list action whose failure is a non-blocking notice.

## Assumption Reassessment (2026-06-06)

1. `SettingsSurface` is currently an inline function in `packages/web/src/shell/AppShell.tsx:65`, rendering a `<dl>` with `<dt>OpenRouter key</dt><dd>Not configured</dd>` (`AppShell.tsx:72–75`), wired to `<Route path="/settings" element={<SettingsSurface />} />` (`AppShell.tsx:110`). The `/settings` nav link already exists (`AppShell.tsx:25`) — no nav change. Extraction means deleting the inline function and importing the new component.
2. `packages/web/src/App.test.tsx:134–137` asserts the placeholder: clicks the Settings link, then `getByText("OpenRouter key")` and `getByText("Not configured")`. These assertions break once the surface is promoted and **must** be updated to the new status text — `specs/SPEC-009-…md` Deliverable 5 calls this out explicitly.
3. Cross-artifact boundary under audit: this component consumes `getOpenRouterSettings`/`putOpenRouterSettings`/`refreshModels` and the `OpenRouterSettingsResponse` type from SPEC009OPEGLOBSET-006 (`api.ts`). The "API key configured/missing" status is driven solely by the `hasOpenRouterCredential` boolean — the component never receives or renders the key.
4. FOUNDATIONS principle motivating this ticket — §23 / §29.9: "API keys must never appear in prompt inspection UI"; settings UI shows only configured/missing. Restated before trusting the spec: the surface has no key input field and no field that could carry a secret-storage value; the model setting is data-driven (edited here, persisted server-side), never hardcoded.
5. Secret-firewall surface (§23): the only credential signal in the DOM is the boolean status string. A component test asserts the key value never appears in the DOM. No deterministic-compilation surface is touched.
6. `packages/web/src/styles.css` is also modified by SPEC009OPEGLOBSET-008 (candidate panel). Parallel siblings on a shared file (both `Deps: 006`, not each other) — this ticket adds settings-form rules, -008 adds candidate-panel rules; mechanical merge expected.

## Architecture Check

1. Extracting `SettingsSurface` into its own file matches the repo's one-component-per-file layout (`records/`, `preview/`, `config/`) and keeps `AppShell.tsx` a routing shell. Driving key status off the boolean keeps the secret firewall intact by construction. A refresh action that degrades to a non-blocking notice (manual entry still usable) directly satisfies "cache failure must not prevent manual model entry".
2. No backwards-compatibility shim: the inline placeholder is removed, not kept behind a flag.

## Verification Layers

1. Settings load/edit/save → component test (RTL): renders current settings, edits a field, saves via `putOpenRouterSettings`, reflects the result.
2. Key status from boolean → test: `hasOpenRouterCredential: true` → "API key configured"; `false` → "API key missing"; the key value appears in no DOM node.
3. Refresh resilience → test: a failing `refreshModels` shows a non-blocking notice and leaves the manual model field usable.
4. Placeholder assertion updated → `App.test.tsx` green: the old "Not configured" assertion is replaced with the promoted status text.
5. Extraction → grep-proof: `SettingsSurface` is defined in `shell/SettingsSurface.tsx` and imported (not defined) in `AppShell.tsx`.

## What to Change

### 1. `shell/SettingsSurface.tsx` (new)

Real editor: model id (text input for manual entry + an optional chooser populated by `refreshModels`), temperature, max output tokens, optional `top_p`, an "API key configured" / "API key missing" status from `hasOpenRouterCredential`, and a "Refresh model list" button. Load via `getOpenRouterSettings` on mount; save via `putOpenRouterSettings`. Refresh failure → inline non-blocking notice; manual entry unaffected. No key input field.

### 2. `shell/AppShell.tsx` (modify)

Remove the inline `SettingsSurface` function; import the new component; keep the existing `/settings` route and nav link unchanged.

### 3. `App.test.tsx` (modify)

Update the settings-route assertions (lines ~134–137) from the static placeholder to the promoted surface's status text so `npm test` stays green.

### 4. `styles.css` (modify)

Minimal settings-form rules consistent with existing surfaces; no new CSS framework.

## Files to Touch

- `packages/web/src/shell/SettingsSurface.tsx` (new)
- `packages/web/src/shell/SettingsSurface.test.tsx` (new)
- `packages/web/src/shell/AppShell.tsx` (modify — remove inline, import component)
- `packages/web/src/App.test.tsx` (modify — update settings assertions)
- `packages/web/src/styles.css` (modify — settings-form rules)

## Out of Scope

- The API clients themselves — SPEC009OPEGLOBSET-006.
- The Generate button + candidate panel — SPEC009OPEGLOBSET-008.
- Any key-entry field or secret-storage UI — forbidden by §23.
- Candidate-panel CSS — SPEC009OPEGLOBSET-008.

## Acceptance Criteria

### Tests That Must Pass

1. The surface loads current settings, edits model/temperature/max-tokens/top_p, and saves via `putOpenRouterSettings`.
2. Key status renders "configured"/"missing" from the boolean; the key value is in no DOM node.
3. A failing refresh shows a non-blocking notice and leaves manual model entry usable.
4. `App.test.tsx` passes with the updated status assertion.
5. `npm test --workspace @loom/web -- src/shell/SettingsSurface.test.tsx src/App.test.tsx`, `npm run typecheck`, `npm run lint`, `npm test` all green.

### Invariants

1. No settings UI field can carry an API key; only the boolean status is shown.
2. Model-list refresh failure never disables manual model entry.

## Test Plan

### New/Modified Tests

1. `packages/web/src/shell/SettingsSurface.test.tsx` — RTL: load/edit/save, key-status-from-boolean, key-never-in-DOM, refresh-failure resilience.
2. `packages/web/src/App.test.tsx` — update the `/settings` assertions to the promoted status text.

### Commands

1. `npm test --workspace @loom/web -- src/shell/SettingsSurface.test.tsx src/App.test.tsx`
2. `npm run typecheck && npm run lint && npm test`
3. `grep -n "SettingsSurface" packages/web/src/shell/AppShell.tsx` — must show an import, not a `function SettingsSurface` definition (extraction proof).

## Outcome

Completed: 2026-06-06

Extracted the inline placeholder into `packages/web/src/shell/SettingsSurface.tsx` and
implemented the real OpenRouter editor. The surface loads current non-secret settings,
shows "API key configured" / "API key missing" from `hasOpenRouterCredential`, edits model
ID, temperature, max output tokens, and optional Top P, saves through
`putOpenRouterSettings`, refreshes the model list through `refreshModels`, and keeps manual
model entry usable when refresh fails. No key input or key value is rendered.

Updated `AppShell.tsx` to import the extracted component, updated `App.test.tsx` for the
promoted settings status, and added minimal settings form CSS.

Added `packages/web/src/shell/SettingsSurface.test.tsx` coverage for load/edit/save,
credential status from the boolean, key non-rendering, model-list refresh success, and
refresh failure resilience with manual entry still enabled.

Deviations: none from the ticket scope.

Verification:

- `npm test --workspace @loom/web -- src/shell/SettingsSurface.test.tsx src/App.test.tsx` — passed.
- `rg -n "SettingsSurface|function SettingsSurface" packages/web/src/shell/AppShell.tsx` — import and route usage only; no inline function.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — 56 files / 320 tests passed.
- `npm run build` — passed.
