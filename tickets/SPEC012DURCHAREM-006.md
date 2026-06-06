# SPEC012DURCHAREM-006: Post-accept coordination + ephemeral-notice supersession

**Status**: PENDING
**Priority**: MEDIUM
**Effort**: Medium
**Engine Changes**: Yes — new shared reminder-refresh React context; `GenerateView` triggers a shell reminder refresh on accept; Phase-10 ephemeral `acceptNotice` reduced/removed so the durable-change copy is not duplicated
**Deps**: SPEC012DURCHAREM-005

## Problem

Acceptance happens on `GenerateView` (the `/generate` "Generate / Candidate" route), but the durable-change banner lives in `AppShell`. After a successful accept the banner must appear immediately without navigation. This ticket adds a lightweight shared refresh signal so `GenerateView` can nudge the banner, and supersedes the Phase-10 ephemeral `acceptNotice` (which currently carries the full durable-change sentence) so the two surfaces do not double up. (SPEC-012 Deliverable 5.)

## Assumption Reassessment (2026-06-06)

1. **The ephemeral notice carries the full durable-change copy.** `packages/web/src/generate/GenerateView.tsx:43` declares `acceptNotice` (local `useState`), and on a successful accept (`:145-148`) sets `"Accepted as segment ${sequence}. Durable changes likely need manual record updates before the next generation."`, rendered at `:271`. `acceptNotice` is local component state, not exported (grep: only `GenerateView.tsx` references it) — reducing it has no cross-file blast radius.
2. **No existing React context pattern.** Repo-wide grep finds no `createContext` in `packages/web/src`; the shared refresh signal is genuinely new. The banner (SPEC012DURCHAREM-005) fetches on mount; this ticket adds the refresh signal and the banner's subscription to it. SPEC-012 §Approach (Post-accept coordination) and §Deliverables 5 govern.
3. **Create-then-modify boundary under audit:** this ticket creates `reminder-refresh.tsx` (new) and modifies `DurableChangeReminder.tsx` and `AppShell.tsx` (created/mounted in SPEC012DURCHAREM-005) to provide/consume the signal — hence the explicit `Deps: SPEC012DURCHAREM-005`.
4. **FOUNDATIONS principle restated:** §21 / §29.8 #5 — after acceptance the app reminds the user to update records; folding the ephemeral notice into the persistent banner keeps exactly one, more durable reminder (clearance, not regression). §20 (no silent retcon) — the behavior change (removing the standalone ephemeral durable-change sentence) is intentional: the persistent banner is the superseding surface; this rationale is recorded here.
5. **Adjacent-contradiction classification:** removing/reducing `acceptNotice` is a *required consequence* of this deliverable (avoid double-up), not a separate bug — the persistent banner must be the single durable-change surface.

## Architecture Check

1. A single-purpose context exposing `refreshReminder()` (trigger) plus a subscribable signal (e.g. a counter the banner watches) is the lightest seam that lets a deep route nudge a shell-level component — no global store framework for one signal, as the spec's Risks section directs. Polling on route change is the heavier fallback and is rejected.
2. No backwards-compatibility shim: the ephemeral notice is superseded outright, not kept behind a flag or aliased. The persistent banner is the one durable-change surface.

## Verification Layers

1. Post-accept banner activation -> component/integration test: after a successful accept on `GenerateView` (with the provider + banner mounted), the banner becomes active without navigation.
2. Ephemeral notice no longer duplicates the durable-change copy -> component test: after accept, `GenerateView` no longer renders the full Phase-10 durable-change sentence as a standalone notice (it shows nothing, or a minimal non-duplicating "Accepted as segment N" confirmation).
3. Refresh seam is inert without the provider -> manual review / test: `GenerateView` and the banner render correctly when the context default (no-op) is used (no crash if mounted in isolation).

## What to Change

### 1. Shared reminder-refresh context

New `packages/web/src/shell/reminder-refresh.tsx`: a React context exposing `refreshReminder()` and a subscribable signal (default `refreshReminder` is a no-op so components render in isolation), plus a `useReminderRefresh()` hook and a provider component.

### 2. Provide in AppShell, subscribe in the banner

- `packages/web/src/shell/AppShell.tsx`: wrap the content with the refresh provider.
- `packages/web/src/shell/DurableChangeReminder.tsx`: subscribe to the signal and re-call `getDurableChangeReminder()` when it changes (in addition to the on-mount fetch).

### 3. Trigger from GenerateView + supersede the notice

- `packages/web/src/generate/GenerateView.tsx`: on a successful accept (`:145-148`), call `refreshReminder()`. Remove the standalone durable-change `acceptNotice`, or reduce it to a minimal non-duplicating confirmation (e.g. "Accepted as segment N") that does not restate the durable-change reminder copy.

## Files to Touch

- `packages/web/src/shell/reminder-refresh.tsx` (new)
- `packages/web/src/shell/AppShell.tsx` (modify)
- `packages/web/src/shell/DurableChangeReminder.tsx` (modify)
- `packages/web/src/generate/GenerateView.tsx` (modify)
- `packages/web/src/generate/GenerateView.test.tsx` (modify)

## Out of Scope

- The banner component itself, its checklist/quick-links, and its styling — SPEC012DURCHAREM-005 (`Deps`).
- The reminder endpoints / clients — SPEC012DURCHAREM-002/003.
- Any server-side change — this is web-only coordination.
- A global state-management framework — a single-purpose context only.

## Acceptance Criteria

### Tests That Must Pass

1. After a successful accept on `GenerateView` (provider + banner mounted), the shell banner becomes active without navigation.
2. `GenerateView` no longer shows the full Phase-10 durable-change sentence as a standalone ephemeral notice (renders nothing, or a minimal non-duplicating confirmation).
3. `GenerateView` and `DurableChangeReminder` render without error when the context default (no-op) is used.
4. `npm run typecheck && npm run lint && npm test && npm run build` all green.

### Invariants

1. There is exactly one durable-change reminder surface — the persistent banner; the ephemeral notice no longer duplicates its copy.
2. The refresh seam carries a signal only; it transports no accepted prose, segment text, or secret.

## Test Plan

### New/Modified Tests

1. `packages/web/src/generate/GenerateView.test.tsx` — assert `refreshReminder()` is invoked on successful accept and that the standalone durable-change sentence is gone (or reduced to a minimal confirmation); update existing accept-path assertions accordingly.

### Commands

1. `npm test -- GenerateView` — targeted run of the generate-view suite.
2. `npm test -- DurableChangeReminder AppShell` — banner/shell coordination checks.
3. `npm run typecheck && npm run lint && npm test && npm run build` — full pipeline.
