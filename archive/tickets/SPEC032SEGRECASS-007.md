# SPEC032SEGRECASS-007: Web review page, quarantine cards, keepers, disclosure, and reminder CTA

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Large
**Engine Changes**: Yes — new `segment-reconciliation/{SegmentReconciliationView,ReconciliationProposalCard,keepers}.tsx/ts` and tests; `api.ts` typed clients; `AppShell` primary route; `DurableChangeReminder` CTA
**Deps**: SPEC032SEGRECASS-006

## Problem

The user-facing surface: a project-gated `/segment-reconciliation` page beside Ideate and Record Hygiene that compiles, inspects, and (on explicit send) renders three groups of advisory proposals — each card strictly on the review side of the authority boundary. The page must offer only navigation/copy/keeper controls (never Apply/Create/Prefill/Deactivate/Archive/Merge/Remove/Add-to-working-set/Use-as-prose), disclose the full source before send (including secret-bearing records, with its own one-time send confirmation), invalidate a stale prompt, quarantine malformed output in a separate error surface, and add a **Reconcile latest segment** CTA to the durable-change reminder that navigates without acknowledging or snoozing.

Implements SPEC-032 Deliverable 4. Control taxonomy, disclosure, and CTA behavior are fixed by `reports/segment-reconciliation-assistance-change-proposal.md` §8.1–§8.7.

## Assumption Reassessment (2026-06-24)

1. The web seams to mirror exist (verified this session): `AppShell.tsx` registers primary routes via a `primaryRoutes` array (L29, `{ to, label, requiresProject: true }`) plus `<Route … element={<RequireProject>…}/>` (the `/record-hygiene` registration is the mirror); `api.ts` uses `postJson<T>("/api/…", req)` / `fetchJson<T>`; the sibling `record-hygiene/keepers.ts` exports `addKeeper/clearKeepers/keeperKey/listKeepers/removeKeeper` over `sessionStorage`, consumed by `RecordHygieneView` (L17,36). The new keepers module mirrors this.
2. `DurableChangeReminder.tsx` has the Acknowledge button (L95-96, `acknowledgeDurableChangeReminder`) and Snooze (L98-99, `setSnoozed(true)`) — verified. The CTA must navigate to `/segment-reconciliation` only; it must NOT call `acknowledgeDurableChangeReminder()` or set snooze, and must preserve the existing checklist + controls.
3. **Cross-artifact boundary under audit**: the page consumes the compile/analyze routes (SPEC032SEGRECASS-006) and renders the valid-proposal vs malformed-scratch envelopes the parser (SPEC032SEGRECASS-005) produces. Keepers are `sessionStorage`-only, keyed by project + prompt fingerprint; a refreshed/source-changed prompt starts a distinct keeper set; Clear performs no server write.
4. **FOUNDATIONS principle restated (§20/§29.2/§29.3/§15)**: every card stays on the review side — navigation + copy + keeper only; no Apply/prefill/stage/create/deactivate/archive/merge/remove/working-set/use-as-prose control may exist (a permanent "Suggestion only" badge marks this). The disclosure surface names secret-bearing records explicitly with an opt-in send (§15 firewall held at the UI), and the prompt is inspected before send (§22). The reminder CTA upgrades, never replaces, acknowledge/snooze (§29.8) — opening the surface never implies canonical updates are complete.

## Architecture Check

1. Reusing the sibling assistance-view structure (compile → inspect → disclose → send → quarantined cards + `sessionStorage` keepers) keeps the three assistance surfaces consistent and inherits their audited firewall patterns. Navigation-plus-copy (not per-item Apply) is intentionally stricter than "explicit click to apply" — it keeps the surface visibly non-mutating, the cleanest way to satisfy the no-state-laundering invariant.
2. No backwards-compatibility aliasing/shims: the page, cards, and keepers are net-new; the CTA is an additive control on the existing reminder, not a rewrite of its acknowledge/snooze logic.

## Verification Layers

1. No-mutation-control invariant (only navigation/copy/keeper controls render; no apply/prefill/create/deactivate/archive/merge/remove/working-set/prose controls) → component test asserting the absence of the forbidden controls and presence of the "Suggestion only" badge.
2. Disclosure + inspect-before-send invariant (full source incl. secret-bearing records disclosed; own one-time send confirmation; prompt inspector before send) → component test.
3. Stale-prompt + keeper-scoping invariant (a new accepted segment / scope change / brief save marks the prompt stale; keepers are session-scoped by project + fingerprint; Clear leaves no residue) → component test.
4. CTA-no-side-effect invariant (the CTA navigates only; no acknowledge/snooze/background compile) → `DurableChangeReminder` test asserting no acknowledge endpoint call on CTA click.

## What to Change

### 1. `segment-reconciliation/SegmentReconciliationView.tsx` + `ReconciliationProposalCard.tsx` + `keepers.ts`

The page: read-only latest-segment source line, scope radio (`Active working set` default / `Whole project`), Compile/Inspect/Copy/Send/Clear, the full pre-send disclosure with secret-exposure warning + own send-confirmation key, prompt-staleness invalidation, three-group valid cards (evidence chips, contrast keys, current-vs-proposed, rationale, permanent "Suggestion only" badge) with navigation/copy/keeper controls only, and a separate malformed-output error surface (reason code + collapsed raw + copy + clear, no parsed cards). `keepers.ts` mirrors the hygiene keeper module (`sessionStorage`, project+fingerprint key).

### 2. `api.ts` typed clients

Add `postJson` clients for `/api/segment-reconciliation/compile` and `/api/segment-reconciliation/analyze` with the response types from SPEC032SEGRECASS-006.

### 3. `AppShell.tsx` + `DurableChangeReminder.tsx`

Add `{ to: "/segment-reconciliation", label: "Segment Reconciliation", requiresProject: true }` to `primaryRoutes`, the `<Route>` element, and the import. Add a **Reconcile latest segment** CTA to the reminder (visible whenever the reminder is visible and a latest segment exists) that navigates only.

## Files to Touch

- `packages/web/src/segment-reconciliation/SegmentReconciliationView.tsx` (new)
- `packages/web/src/segment-reconciliation/ReconciliationProposalCard.tsx` (new)
- `packages/web/src/segment-reconciliation/keepers.ts` (new)
- `packages/web/src/api.ts` (modify)
- `packages/web/src/shell/AppShell.tsx` (modify)
- `packages/web/src/shell/DurableChangeReminder.tsx` (modify)
- `packages/web/src/segment-reconciliation/SegmentReconciliationView.test.tsx` (new)

## Out of Scope

- Any server route/parse change (SPEC032SEGRECASS-006) — this ticket consumes them.
- The cross-pillar capstone, stress docs, robustness enrollment, and user-guide update (SPEC032SEGRECASS-008).
- Persisting keepers or output anywhere beyond `sessionStorage`.

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- SegmentReconciliationView` — forbidden-control absence + "Suggestion only" badge, disclosure incl. secret-bearing records, prompt inspector before send, stale-prompt invalidation, three-group card rendering, malformed quarantine, keeper scoping + Clear residue, and CTA-navigates-without-acknowledge tests pass.
2. `npm run typecheck && npm run lint` — green.
3. `npm test` — no regression in existing web suites (AppShell nav, DurableChangeReminder).

### Invariants

1. Only navigation/copy/keeper controls render; no apply/prefill/create/deactivate/archive/merge/remove/working-set/use-as-prose control exists; the "Suggestion only" badge is permanent.
2. The reminder CTA navigates only — it never calls `acknowledgeDurableChangeReminder()`, never snoozes, never compiles in the background; keepers are `sessionStorage`-only and Clear performs no server write.

## Test Plan

### New/Modified Tests

1. `packages/web/src/segment-reconciliation/SegmentReconciliationView.test.tsx` — the proposal §12.5 web cases.
2. Extend the `DurableChangeReminder` assertions (within the new view test or alongside the existing reminder test) for the CTA's no-side-effect behavior.

### Commands

1. `npm test -- SegmentReconciliationView`
2. `npm test && npm run typecheck && npm run lint`
3. The scope control is a **controlled radio group**: per the known jsdom limitation (jsdom does not emulate native radio-group exclusivity — see the repo's documented Radix/jsdom gesture caveat), assert on the controlled scope *state/value* and the serialized request, not on native `.checked` exclusivity; reserve native-radio behavior for the accessibility check. This is why a component-state assertion, not a raw DOM-native assertion, is the correct verification boundary here.

## Outcome

Completed: 2026-06-24

Added the Segment Reconciliation web page, proposal cards, fingerprint-scoped session keepers, typed API clients, shell route, and durable-change reminder CTA with no acknowledge/snooze side effect.

Verification: `npm test -- SegmentReconciliationView`; `npm run typecheck`; `npm run lint`; `npm test`; `npm run build`; `git diff --check`.
