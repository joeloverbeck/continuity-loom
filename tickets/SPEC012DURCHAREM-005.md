# SPEC012DURCHAREM-005: `DurableChangeReminder` banner + AppShell mount + styling

**Status**: PENDING
**Priority**: HIGH
**Effort**: Large
**Engine Changes**: Yes — new `DurableChangeReminder` web component mounted in `packages/web/src/shell/AppShell.tsx`; banner/checklist/quick-link styling in `packages/web/src/styles.css`
**Deps**: SPEC012DURCHAREM-003, SPEC012DURCHAREM-004

## Problem

This is the core Phase-12 surface: a persistent, non-modal app-wide banner that appears after every acceptance and reminds the user to update records manually. It renders the six-question deterministic checklist, deterministic `/records?create=<TYPE>` quick-links, a durable **Acknowledge**, and a session-only **Snooze**. It is the persistent reminder SPEC-010 deferred from Phase 10, and delivering it clears the §29.8 #5 interim tension. (SPEC-012 Deliverable 4 banner half + Deliverable 6 styling.)

## Assumption Reassessment (2026-06-06)

1. **Mount point confirmed.** `packages/web/src/shell/AppShell.tsx:68` renders `<main className="appFrame">` with a sidebar and `<div className="contentPane">` wrapping `<Routes>` (`:81-92`). Mounting `<DurableChangeReminder />` inside `contentPane` above `<Routes>` makes it visible across routed surfaces while staying within the `BrowserRouter` from `App.tsx:37` (required for the quick-link `<NavLink>`/`<Link>`s). `/` routes to `ProjectPicker` (`:83`) — there is no Story Dashboard surface, so this banner stands in for the dashboard's reminder surfacing.
2. **Clients land in SPEC012DURCHAREM-003; consumer in -004.** The banner calls `getDurableChangeReminder()` / `acknowledgeDurableChangeReminder()` (per `Deps` on -003) and its quick-links target `/records?create=<TYPE>`, which `RecordBrowser` consumes (per `Deps` on -004) so links resolve to working create forms. SPEC-012 §Approach (web) and §Deliverables 4/6 govern.
3. **Cross-artifact boundary under audit:** the reminder render contract. The banner shows only key-free derived state (sequence number, timestamp) and static checklist text; it is visibly a reminder, not a record editor or accepted-segment browser. The 12 quick-link types are the authority list, all present in `@loom/core` `recordTypes` (`packages/core/src/records/registry.ts:39`).
4. **FOUNDATIONS principle restated:** §27 — a persistent **non-modal** banner keeps the manual-update step visible without nagging; never trap focus or block routes. §26 / §29.2 — the checklist is a static deterministic question list and the quick-links are plain navigation; no LLM, no extraction, no record creation. §29.8 #5 — the reminder appears after acceptance, positively clearing the SPEC-010 interim row. §12 / §29.1 — the checklist questions are continuity-state prompts, not act/beat/arc machinery.
5. **Determinism / firewall:** the banner reads only the derive-only reminder endpoint (sequence + timestamp). It never reads accepted prose, never includes any segment text, and adds no path from reminder state into the compiler — `buildSnapshotFromOpenProject` (`snapshot-builder.ts:31`) is untouched.
6. **Co-located styling (SPEC-012 D6).** New CSS for the banner, checklist, quick-link row, and Acknowledge/Snooze buttons lands in `packages/web/src/styles.css` with this UI ticket (no new CSS framework), consistent with existing surfaces; it is a styling addition, not a schema/consumer change.

## Architecture Check

1. A single banner component mounted once in `AppShell` is simpler and more consistent than per-route reminders, and matches the authorities' "persistent banner" intent. Reading derived state from the server (rather than recomputing client-side) keeps `active = latest > acknowledged` authoritative in one place. Snooze as client-only state (no server write) keeps the "only Acknowledge persists" contract with zero extra stored state.
2. No backwards-compatibility shim: the banner is new; the Phase-10 ephemeral `acceptNotice` it supersedes is reduced in a later ticket (SPEC012DURCHAREM-006), not aliased here.

## Verification Layers

1. Active banner content -> component test: an active reminder renders the six-question checklist, the 12 deterministic quick-links, Acknowledge, and Snooze.
2. Non-modal behavior -> component test: no focus trap and no route block (other surfaces remain reachable while the banner is shown).
3. Acknowledge is durable; Snooze is session-only -> component test: Acknowledge calls `acknowledgeDurableChangeReminder()` and hides the banner; Snooze hides it with no network write and it re-appears after a simulated refresh/remount.
4. Inactive / no-project renders nothing -> component test: `active:false` and `no-open-project` responses render no banner.
5. Quick-link target correctness -> component test: a quick-link's href/navigation is `/records?create=<TYPE>` for its type (CAST MEMBER routes to its custom editor via the -004 consumer).
6. No canon masquerade / no secrets -> manual review: banner shows only sequence + timestamp + static text; no segment prose, no key, no record-edit affordance.

## What to Change

### 1. `DurableChangeReminder` component

New component (e.g. `packages/web/src/shell/DurableChangeReminder.tsx`):

- On mount and on a refresh signal, call `getDurableChangeReminder()`. When `reminder.active` and not session-snoozed, render a **non-modal** banner containing:
  - a plain-language lead (e.g. "Segment N was accepted. Accepted prose may have created durable continuity changes — update records manually before the next generation.");
  - the deterministic checklist of the six authority questions (secret became known? character moved? object changed hands? relationship/emotion changed? promise/obligation/clock/consequence/injury/open-thread changed? current authoritative state needs updating?). Static prompt list — not persisted, not tracked as canon;
  - deterministic quick-links to `/records?create=<TYPE>` for the 12 authority types (CAST MEMBER → its custom editor). Checklist question #6 (current authoritative state) is addressed via the existing Generation Brief surface (a `/generation-brief` link is acceptable), not a record-create quick-link;
  - **Acknowledge** → `acknowledgeDurableChangeReminder()`, then hide until the next acceptance advances the latest sequence past the threshold;
  - **Snooze** → hide for the current session only (client state); re-appears on reload / next session. No server write.
- When `reminder.active` is false (no segments, or latest ≤ acknowledged) or no project is open, render nothing.

### 2. Mount in AppShell

In `packages/web/src/shell/AppShell.tsx`, render `<DurableChangeReminder />` inside `<div className="contentPane">` immediately above `<Routes>`.

### 3. Styling (SPEC-012 D6)

In `packages/web/src/styles.css`, add minimal banner / checklist / quick-link-row / Acknowledge-Snooze button styles consistent with existing surfaces — visibly a reminder, not a modal and not a record editor.

## Files to Touch

- `packages/web/src/shell/DurableChangeReminder.tsx` (new)
- `packages/web/src/shell/DurableChangeReminder.test.tsx` (new)
- `packages/web/src/shell/AppShell.tsx` (modify)
- `packages/web/src/styles.css` (modify)

## Out of Scope

- Post-accept refresh wiring from `GenerateView` and `acceptNotice` supersession — SPEC012DURCHAREM-006 (this ticket exposes the refresh hook/signal the banner subscribes to; GenerateView wiring is -006).
- The `RecordBrowser` create-form consumer — SPEC012DURCHAREM-004 (`Deps`).
- The reminder endpoints / clients — SPEC012DURCHAREM-002/003 (`Deps` on -003).
- A dedicated Story Dashboard surface — deferred (the banner stands in).
- Tracking which checklist items the user addressed, or any generation gating on the reminder — the reminder is non-blocking.

## Acceptance Criteria

### Tests That Must Pass

1. An active reminder renders the six-question checklist, the deterministic quick-links, Acknowledge, and Snooze.
2. The banner is not a blocking modal (no focus trap, no route block).
3. Acknowledge calls the endpoint and hides the banner durably; Snooze hides it with no network write and it re-appears after a simulated reload/remount.
4. An inactive (`active:false`) or `no-open-project` state renders nothing.
5. A quick-link targets `/records?create=<TYPE>` for its type (CAST MEMBER → custom editor); no checklist answer is persisted and no record is created by the banner.
6. `npm run typecheck && npm run lint && npm test && npm run build` all green.

### Invariants

1. The banner is persistent and non-modal; only Acknowledge writes durable state (the integer threshold), Snooze writes nothing.
2. The banner surfaces only key-free derived state (sequence + timestamp) and static checklist text — no accepted prose, no secret, no record-edit/compiler affordance.

## Test Plan

### New/Modified Tests

1. `packages/web/src/shell/DurableChangeReminder.test.tsx` (new) — component tests (jsdom, mocked reminder clients) covering active render, non-modal behavior, Acknowledge durability, session-only Snooze + re-appear, inactive/no-project empty render, and quick-link targets.
2. `packages/web/src/shell/AppShell.test.tsx` — assert the banner is mounted above the routed content and renders nothing when inactive.

### Commands

1. `npm test -- DurableChangeReminder` — targeted run of the banner suite.
2. `npm test -- AppShell` — targeted run of the shell mount test.
3. `npm run typecheck && npm run lint && npm test && npm run build` — full pipeline.
