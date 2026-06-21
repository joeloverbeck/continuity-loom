# SPEC027RECHYGASS-007: Web Record Hygiene page + API client + route

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Large
**Engine Changes**: Yes — new `@loom/web` modules under `packages/web/src/record-hygiene/`, two `api.ts` client functions, and an `AppShell.tsx` menu entry + route. Adds the Record Hygiene page; no change to existing pages.
**Deps**: `archive/tickets/SPEC027RECHYGASS-006.md`

## Problem

The user needs a menu-accessible, project-required **Record Hygiene** page that compiles and inspects the prompt locally, optionally sends it through OpenRouter on an explicit click (with a clear data-boundary disclosure), and renders the parsed findings as quarantined cluster cards that navigate to records but never mutate them. The page must contain **no** apply/merge/delete/deactivate/archive/accept/"fix all"/brief-insertion/working-set/use-as-prose control anywhere in its DOM or handlers.

## Assumption Reassessment (2026-06-21)

1. **Web seams (codebase).** `AppShell.tsx`: menu shape `{ to, label, requiresProject }` (`:28`, Ideate entry at `:36`), routes declared `<Route path="/ideate" element={<RequireProject><IdeateView/></RequireProject>} />` (`:130`), `RequireProject` wrapper (`:146`). `api.ts`: `ideate()` via `postJson` (`:457`); `compileIdeation()` via `postJson("/api/compile", …)` (`:434`). `packages/web/src/ideate/keepers.ts:1` uses `sessionStorage` key `loom.ideate.keepers.v1`; the hygiene page uses `loom.record-hygiene.keepers.v1`. Web tests are co-located `*.test.tsx` (`packages/web/src/ideate/IdeateView.test.tsx`).
2. **Spec/doc authority.** `specs/SPEC-027` Deliverable 5 + proposal §7.3 (the ten ordered page sections and the explicit prohibited-control list).
3. **Cross-artifact boundary under audit.** The page consumes `POST /api/record-hygiene/compile` and `/analyze` (`archive/tickets/SPEC027RECHYGASS-006.md`) via new `api.ts` client functions, and navigates citations to `/records?recordId=<id>`. **Seam to confirm at implementation**: that the existing Records route reads a `recordId` query param for deep-linking; if it does not, the deep-link is a small additive change to the Records page (a pre-existing file the approved navigation behavior requires) — flag it in implementation rather than expanding scope into record editing.
4. **FOUNDATIONS principle motivating this ticket.** §26 / §26.1 assistance-output handling: opt-in, pull-based, quarantined in a clearly-labeled non-canonical surface, provenance shown, ephemeral by default (session-scoped scratch), and never auto-applied to records/working-set/prompt.
5. **Secret-firewall + quarantine enforcement (§26/§29.2/§29.6) — the no-mutation boundary.** The page renders findings as advisory scratch only: **no** apply/merge/delete/deactivate/archive/accept/"fix all"/brief-insertion/active-working-set/use-as-prose/notes-import/background-scan/persisted-history control exists in the rendered DOM or any event handler. Keepers live only in `sessionStorage` (no project-store residue; clear leaves none). The network-disclosure/confirmation step makes explicit that the full active payload — including hidden SECRET content — leaves the machine only on the `Analyze` click. `REMOVE` carries the strongest caution and is never styled as a one-click optimization; `KEEP_DISTINCT` reads as protective; the three high-stakes actions are distinguishable without relying on color alone.

## Architecture Check

1. **Mirror the IdeateView quarantine pattern.** Reusing the inspect-before-send affordance, the session keepers shape, and the project-guarded route keeps the surface consistent and auditable, while the deliberately-absent mutation controls make the no-auto-write guarantee structural (provable by a DOM/handler absence test) rather than a convention.
2. **No backwards-compatibility aliasing/shims.** New page modules; one `AppShell` menu+route addition; two additive `api.ts` functions; existing pages untouched.

## Verification Layers

1. `Record Hygiene` renders only as a project-required route → web test asserting the `RequireProject` wrapper.
2. Prompt visible before send; source counts/exclusions and the sensitive-data disclosure are visible; `Copy prompt` works without OpenRouter credentials → web test.
3. **No** apply/merge/delete/status/archive/working-set/brief action exists in rendered DOM or event handlers → web test asserting absence.
4. Keepers use `sessionStorage`, survive same-session navigation, and disappear on clear/session end; clearing performs no server write → web test.
5. Findings link to exact record ids; malformed raw output is labeled non-canonical + copyable and never parsed optimistically → web test.
6. The three high-stakes actions (`KEEP_DISTINCT`/`REMOVE`/`HUMAN_REVIEW`) have distinguishable accessible labels not relying on color alone → web test / manual a11y review.

## What to Change

### 1. `api.ts` (modify)
Add `recordHygieneCompile()` and `recordHygieneAnalyze()` via `postJson("/api/record-hygiene/compile" | "/api/record-hygiene/analyze", { mode:"full_active_atomic_review" })`, with typed success/malformed/blocked/failure responses mirroring the ideate client.

### 2. `packages/web/src/record-hygiene/keepers.ts` (new)
Session keepers under `loom.record-hygiene.keepers.v1` mirroring `ideate/keepers.ts` (list/add/remove/clear).

### 3. `RecordHygieneView.tsx` (new)
The §7.3 ordered sections: quarantine banner (`AI-suggested review scratch — not story state`), source disclosure (counts by type + explicit exclusions), prompt inspector, `Refresh prompt` / `Copy prompt` / `Analyze with OpenRouter`, network disclosure/confirmation, parsed cluster cards, record navigation to `/records?recordId=<id>`, session keepers, copy findings, and clear. No mutation/apply controls.

### 4. `HygieneFindingCard.tsx` (new)
Render action, relation, citations, shared core, material differences, why, manual recommendation, survivor, reference caution, confidence; `KEEP_DISTINCT` protective styling, `REMOVE` strongest caution, non-color-only accessible labels.

### 5. `AppShell.tsx` (modify)
Add `{ to:"/record-hygiene", label:"Record Hygiene", requiresProject:true }` and `<Route path="/record-hygiene" element={<RequireProject><RecordHygieneView/></RequireProject>} />`.

## Files to Touch

- `packages/web/src/record-hygiene/RecordHygieneView.tsx` (new)
- `packages/web/src/record-hygiene/HygieneFindingCard.tsx` (new)
- `packages/web/src/record-hygiene/keepers.ts` (new)
- `packages/web/src/record-hygiene/RecordHygieneView.test.tsx` (new)
- `packages/web/src/api.ts` (modify)
- `packages/web/src/shell/AppShell.tsx` (modify)

## Out of Scope

- The server routes (`archive/tickets/SPEC027RECHYGASS-006.md`) and any record-editing behavior in the Records page (this ticket only *navigates* there).
- Any apply/merge/delete/deactivate/archive/accept/fix-all/brief-insertion/working-set/use-as-prose/notes-import control, background scanning, or persisted run history.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test` — the page renders the quarantine banner, source disclosure (counts + exclusions), prompt inspector, and the network disclosure; `Copy prompt` works with no credentials; citations navigate to `/records?recordId=<id>`.
2. `npm test` — a DOM/handler absence test proves no apply/merge/delete/status/archive/working-set/brief/use-as-prose control exists.
3. `npm test` — keepers persist in `sessionStorage`, survive same-session navigation, vanish on clear/session end, and clearing issues no server write; malformed raw output is labeled non-canonical and copyable, never parsed optimistically.

### Invariants

1. The page can never mutate a record, the active working set, the generation brief, or any prompt — it only inspects, sends on explicit action, and navigates.
2. All assistance output is session-scoped scratch; clearing leaves no project-store residue.

## Test Plan

### New/Modified Tests

1. `packages/web/src/record-hygiene/RecordHygieneView.test.tsx` (new) — render/disclosure, no-mutation-control absence, sessionStorage keeper lifecycle, citation navigation, malformed-output quarantine, and accessible-label assertions for the three high-stakes actions.

### Commands

1. `npm test -- RecordHygieneView` — targeted page coverage.
2. `npm run build && npm run typecheck && npm run lint && npm test` — full-pipeline gate.
3. RTL component tests are the correct boundary for the DOM/handler-absence and sessionStorage invariants; the live OpenRouter `Analyze` round-trip is exercised by the capstone manual runbook (SPEC027RECHYGASS-009).
