# SPEC021GROIDEPRO-006: Web Ideate view shell — route, nav, brief link, prompt inspection, relaxed readiness

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — new `packages/web/src/ideate/` view, AppShell nav entry + route, Generation Brief "Stuck? Get ideas" link, `api.ts` ideate/compile-ideation client methods; no production engine, record, or behavior change to existing surfaces
**Deps**: SPEC021GROIDEPRO-005 (`/api/ideate` + `/api/compile` ideation preview)

## Problem

The author needs a dedicated, quarantined surface to ask "what could happen next?" — a sibling **Ideate** view alongside Generate that reuses the same working set + brief + readiness model with the relaxed gate, shows the compiled ideation prompt in the existing inspector before sending (§22), and is persistently labeled AI-suggested scratch (not story state). This ticket builds the view *shell* — navigation, the brief-page entry point, prompt inspection, the relaxed readiness checklist, the send/fetch lifecycle, and quarantine labeling. The slate cards, controls, regenerate, and keepers are SPEC021GROIDEPRO-007.

## Assumption Reassessment (2026-06-12)

1. **Shell ownership confirmed.** `packages/web/src/shell/AppShell.tsx` owns **both** the `primaryRoutes` array (lines 26–35) and the `<Routes>`/`<Route>` block (lines 118–127); `App.tsx` only wraps `BrowserRouter`. So the Ideate nav entry and its `<Route>` both land in `AppShell.tsx` — `App.tsx` is **not** touched. (This corrects the Step-4 table's tentative `App.tsx`; mechanical Files-to-Touch correction to the actual route-registration site.)
2. **Reuse surfaces confirmed.** `GenerateView.tsx` is the pattern to mirror: it imports `CompileResult`/`GenerationReadiness` from `@loom/core`, reuses `PromptInspector` (`../prompt/PromptInspector.js`) and `ReadinessChecklist` (`../readiness/ReadinessChecklist.js`), and calls `compile`/`readiness`/`generate` from `../api.js`. `api.ts` exposes `export async function x(): Promise<T> { return postJson/fetchJson(...) }`; new `ideate`/`compileIdeation` calls follow that shape. The brief page is `packages/web/src/generation-brief/GenerationBriefView.tsx`.
3. **Cross-artifact boundary under audit:** the view consumes the `/api/ideate` and ideation `/api/compile` contracts from 005 (request: mode/count/dormant + avoid-list; response: ideas | malformed+raw, with provenance). This shell renders the prompt-inspection + readiness + lifecycle states; the slate/controls contract it leaves to 007 (which modifies `IdeateView.tsx` created here — hence 007 `Deps: 006`).
4. **FOUNDATIONS principle restated:** §22 — the ideation prompt is inspectable before sending and not archived (reuse `PromptInspector`, which already excludes keys/secrets). §26 / §6 / §27 — the surface is a clearly-labeled non-canonical scratch surface (quarantine), a *sibling* view to keep the five continuity surfaces distinct; chosen over a brief-page dock or a Generate-view mode toggle. §4.5 — the readiness checklist renders the relaxed gate but Generate-side prose readiness is untouched.

## Architecture Check

1. A dedicated sibling route reusing `PromptInspector` + `ReadinessChecklist` is cleaner than a Generate-view mode toggle or a brief dock: it keeps the ideation surface quarantined and visually distinct (§6/§27) while reusing the inspection and readiness components verbatim, so no duplicated prompt-rendering or readiness logic. Splitting the view shell (this ticket) from the slate interactions (007) keeps each a reviewable diff.
2. No backwards-compatibility shims: additive route + nav entry + brief link + new `api.ts` functions; no existing view, route, or API call changes behavior.

## Verification Layers

1. Ideate nav entry + route render and navigate (project-gated like siblings) → `IdeateView.test.tsx` + AppShell render assertion.
2. The compiled ideation prompt is shown in `PromptInspector` before sending → `IdeateView.test.tsx` (mocked `compileIdeation`).
3. The relaxed readiness checklist renders for the ideation kind (a missing-directive state does not block ideation) → `IdeateView.test.tsx` (mocked readiness).
4. Quarantine labeling is persistently present ("AI-suggested scratch — not story state") and there is no insert-into-records/brief affordance in the shell → `IdeateView.test.tsx` grep/role assertion.
5. The Generation Brief page shows a "Stuck? Get ideas" link to `/ideate` → `GenerationBriefView.test.tsx` assertion.

## What to Change

### 1. Ideate view shell

`packages/web/src/ideate/IdeateView.tsx` (new): mirror `GenerateView`'s state machine (loading/idle/ready/blocked/error + a malformed-scratch state). On open, fetch ideation readiness + the compiled ideation prompt (`compileIdeation`) and render it in `PromptInspector`. A send action calls `ideate` and hands the response to the (007) slate region — in this ticket the slate region is a placeholder that renders the raw/malformed response and a "no ideas yet" empty state. Persistent quarantine banner; no insertion affordances.

### 2. Navigation + route

`packages/web/src/shell/AppShell.tsx` (modify): add `{ to: "/ideate", label: "Ideate", requiresProject: true }` to `primaryRoutes` (placed near Generate) and `<Route path="/ideate" element={<RequireProject><IdeateView /></RequireProject>} />` to the `<Routes>` block.

### 3. Brief-page entry point + API client

`packages/web/src/generation-brief/GenerationBriefView.tsx` (modify): add a "Stuck? Get ideas" link to `/ideate`. `packages/web/src/api.ts` (modify): add `ideate(request)` (POST `/api/ideate`) and `compileIdeation(request)` (POST `/api/compile` with `promptKind:"ideation"`), typed against 005's response shapes. `packages/web/src/styles.css` (modify): Ideate view + quarantine-banner styling (co-located styling deliverable; shared with 007).

## Files to Touch

- `packages/web/src/ideate/IdeateView.tsx` (new)
- `packages/web/src/ideate/IdeateView.test.tsx` (new)
- `packages/web/src/shell/AppShell.tsx` (modify)
- `packages/web/src/generation-brief/GenerationBriefView.tsx` (modify)
- `packages/web/src/api.ts` (modify)
- `packages/web/src/styles.css` (modify) — shared with SPEC021GROIDEPRO-007

## Out of Scope

- Slate cards, operator badges, citation chips, mode/count/dormant controls, regenerate, session keepers — SPEC021GROIDEPRO-007 (modifies `IdeateView.tsx`).
- Any insert-into-records / insert-into-brief / use-as-prompt affordance — forbidden anywhere (§26).
- Server route, parsing, citation verification — SPEC021GROIDEPRO-005.

## Acceptance Criteria

### Tests That Must Pass

1. `packages/web/src/ideate/IdeateView.test.tsx` — nav/route render, prompt inspection shown pre-send, relaxed readiness rendering, quarantine labeling, no insertion affordance.
2. `packages/web/src/generation-brief/GenerationBriefView.test.tsx` — "Stuck? Get ideas" link present and points to `/ideate` (existing test file extended).
3. `npm test && npm run typecheck && npm run lint && npm run build` all pass.

### Invariants

1. The Ideate surface is visually and structurally quarantined (labeled non-canonical scratch) with no path to write a record, brief field, or prose prompt.
2. The ideation prompt is inspectable before sending and is not archived client-side; prose Generate/Preview surfaces are unchanged.

## Test Plan

### New/Modified Tests

1. `packages/web/src/ideate/IdeateView.test.tsx` (new) — shell rendering, lifecycle states, prompt inspection, quarantine labeling, against mocked `api.ts`.
2. `packages/web/src/generation-brief/GenerationBriefView.test.tsx` (modify) — brief-page link assertion.

### Commands

1. `npm test -- IdeateView GenerationBriefView`
2. `npm test && npm run typecheck && npm run lint && npm run build`
3. `npm test -- AppShell` — narrower check that the nav entry + route registered without disturbing sibling routes.
