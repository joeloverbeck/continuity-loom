# SPEC021GROIDEPRO-007: Web slate interactions — cards, controls, regenerate, session keepers

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Large
**Engine Changes**: Yes — new slate-card / controls / session-keepers components wired into `IdeateView`; no production engine, record, or server change. Keepers are sessionStorage-only.
**Deps**: `archive/tickets/SPEC021GROIDEPRO-006.md` (the Ideate view shell this extends)

## Problem

On top of the Ideate shell, the author needs the actual ideation slate: 3–6 cards revealed together (streaming the first anchors fixation), each showing its operator badge, premise headline, why line, and record-citation chips (provenance, §26); plus controls (mode toggle, count, dormant-slot toggle, regenerate-all, per-slot regenerate that sends the current slate as an avoid-list), a session-scoped keepers list (sessionStorage, never the project store), and clear-all. There is no insert-into-records / insert-into-brief / use-as-prompt affordance anywhere; copying is manual text selection only.

## Assumption Reassessment (2026-06-12)

1. **Extends the 006 shell.** `packages/web/src/ideate/IdeateView.tsx` (created by 006) renders the lifecycle + placeholder slate region; this ticket replaces that placeholder with `SlateCard`/`IdeateControls` and wires the session keepers. The `ideate(request)` API client (006, with `avoidList` support) is reused for per-slot regenerate — no new `api.ts` function needed.
2. **Response contract confirmed.** Cards render the structured ideas from `/api/ideate` (005): operator name, headline, why, `grounds` citation keys (and any `unknownCitations` flag), or the malformed-raw fallback. Question-mode renders the question-form contract. Citation chips display record provenance (the cited keys), not secret payloads.
3. **Cross-artifact boundary under audit:** the keepers store is **client session scope only** — `sessionStorage`, never `/api/...` and never the project store. This is the §26.1 "session-scoped scratch surface" that still obeys every assistance-output rule (quarantined, provenance-carrying, no residue on clear). The boundary under audit is keepers ↔ project store: there must be zero write path from keepers to any record, brief field, or prompt.
4. **FOUNDATIONS principle restated:** §26 / §26.1 — assistance output is quarantined, shows provenance, is ephemeral by default; a session-scoped keepers list is allowed and still obeys every rule; current ephemeral output may parameterize a follow-up assistance request (the avoid-list for per-slot regenerate) as explicit inspectable input but never prose generation. §10 / §28.8 — ideas are never prompt context for prose, never records, never brief fields; cleared/rejected ideas leave no residue (no state laundering).

## Architecture Check

1. Splitting cards/controls/keepers into their own components wired by `IdeateView` is cleaner than one monolith: each is independently testable (card rendering, control state, keepers persistence) and the keepers store is a small isolated `sessionStorage` module with no project-store import, making the no-residue invariant auditable by import-graph. Revealing cards together is a deliberate anti-anchoring choice from the research.
2. No backwards-compatibility shims: additive components and a new session store; no existing component or API changes. Keepers deliberately do **not** reuse any project-store helper — using `sessionStorage` is the architectural guarantee against persistence, not a shortcut.

## Verification Layers

1. Slate cards render together (not streamed one-by-one) with operator badge, headline, why, and citation chips → `SlateCard.test.tsx`.
2. Per-slot regenerate sends the current slate headlines as the avoid-list via `ideate` → `IdeateView.test.tsx` (mocked `api.ts`, asserts request payload).
3. Keepers persist within a session in `sessionStorage` and survive a reload, but write nothing to the project store / any `/api` endpoint → `keepers.test.ts` (asserts `sessionStorage` only; no `localStorage`, no fetch).
4. Clear-all and reject leave no residue (keepers + slate cleared, `sessionStorage` entry removed) → `keepers.test.ts` / `IdeateView.test.tsx`.
5. No insert-into-records/brief/prompt affordance exists anywhere on the surface → `IdeateView.test.tsx` negative assertion.

## What to Change

### 1. Slate cards

`packages/web/src/ideate/SlateCard.tsx` (new): one card per idea — operator badge, premise headline, why line, record-citation chips (with an unknown-citation marker when flagged). Cards render as a group (revealed together). Question-mode variant renders the question text. No action buttons other than thumbs-up-to-keepers; copying is manual selection.

### 2. Controls

`packages/web/src/ideate/IdeateControls.tsx` (new): mode toggle (ideas/questions), count selector (3–6), dormant-slot toggle, regenerate-all, and per-slot regenerate (passes the current slate as avoid-list), clear-all. Controls drive the `ideate` request shape.

### 3. Session keepers + view wiring

`packages/web/src/ideate/keepers.ts` (new): a `sessionStorage`-backed add/remove/list/clear keepers store, namespaced per session; no project-store or network access. `packages/web/src/ideate/IdeateView.tsx` (modify): replace the 006 placeholder slate region with `IdeateControls` + the `SlateCard` grid + a keepers panel; wire regenerate and keepers. `packages/web/src/styles.css` (modify): card/badge/chip/keepers styling (shared co-located styling with 006).

## Files to Touch

- `packages/web/src/ideate/SlateCard.tsx` (new)
- `packages/web/src/ideate/IdeateControls.tsx` (new)
- `packages/web/src/ideate/keepers.ts` (new)
- `packages/web/src/ideate/IdeateView.tsx` (modify) — created by 006 (Deps: 006)
- `packages/web/src/ideate/SlateCard.test.tsx` (new)
- `packages/web/src/ideate/keepers.test.ts` (new)
- `packages/web/src/ideate/IdeateView.test.tsx` (modify) — created by 006 (Deps: 006)
- `packages/web/src/styles.css` (modify) — shared with `archive/tickets/SPEC021GROIDEPRO-006.md`

## Out of Scope

- The view shell, route, nav, brief link, prompt inspection, readiness — `archive/tickets/SPEC021GROIDEPRO-006.md`.
- Any cross-session / project-store persistence of ideas or keepers — forbidden (spec §Out of Scope; §26.1).
- Server-side parsing/verification — `archive/tickets/SPEC021GROIDEPRO-005.md`.
- Any insertion of ideas into records, brief fields, or prompts; any idea→directive path — forbidden everywhere.

## Acceptance Criteria

### Tests That Must Pass

1. `packages/web/src/ideate/SlateCard.test.tsx` — card grid renders together with operator badge, headline, why, citation chips; unknown-citation marker; question-mode variant.
2. `packages/web/src/ideate/keepers.test.ts` — keepers persist in `sessionStorage`, survive reload, clear leaves no residue, and never touch `localStorage` or the network/project store.
3. `packages/web/src/ideate/IdeateView.test.tsx` — per-slot regenerate avoid-list payload, clear-all, and absence of any insertion affordance.
4. `npm test && npm run typecheck && npm run lint && npm run build` all pass.

### Invariants

1. Keepers and slate state live only in client session memory/`sessionStorage`; there is zero write path from the Ideate surface to the project store, any record, brief field, or prompt.
2. Rejected/cleared ideas leave no residue anywhere; the avoid-list parameterizes only the next ideation request, never prose generation.

## Test Plan

### New/Modified Tests

1. `packages/web/src/ideate/SlateCard.test.tsx` (new) — card rendering + provenance chips + question variant.
2. `packages/web/src/ideate/keepers.test.ts` (new) — session-scope persistence + no-residue + no-project-store guarantees.
3. `packages/web/src/ideate/IdeateView.test.tsx` (modify) — regenerate/keepers wiring + no-insertion negative assertion.

### Commands

1. `npm test -- ideate/`
2. `npm test && npm run typecheck && npm run lint && npm run build`
3. `grep -rn "localStorage\|/api\|project-store\|projectStore" packages/web/src/ideate/keepers.ts` — must return nothing: the narrow proof that keepers are session-scoped with no persistence path.
