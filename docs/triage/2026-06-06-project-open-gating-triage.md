# Triage — Console errors / crashes on project-scoped views with no project open

**Date**: 2026-06-06
**Source**: No formal report — diagnostic of a live bug. The app was reproduced at `http://127.0.0.1:5173/` (Puppeteer) with no project open; console behavior and crashes were captured per view.
**Classification**: product-behavior (UI/workflow over project-ownership and story-state surfaces; governed by `docs/FOUNDATIONS.md` §27).
**Deliverables**: `tickets/PROJGATE-001.md`, `archive/tickets/PROJGATE-002.md`, `archive/tickets/PROJGATE-003.md`.

## Reproduction (live, no project open)

| View | Observed behavior |
|---|---|
| Generation Brief | **Hard crash** — entire SPA blanks (body empty, nav gone), requires reload. Stack: `TypeError: Cannot read properties of undefined (reading 'length')` at `ValidationResultView.tsx:33`. |
| Records, Active Working Set | Render, but fire failing project-scoped fetches on mount (HTTP 409 `no-open-project` → console errors); generic/awkward state. |
| Validation/Preview, Generate, Accepted Segments, Story Configuration | Render a graceful "Open a project first." / "No project is open." message (still emit a mount-time 409). |
| Project Library, Settings | Work correctly — no project-scoped fetch on mount. |

## Findings

### O1 — Generation Brief hard-crashes the whole SPA (BLOCKER)
Chain: `ValidationPanel.tsx:24` calls `validate()` → `POST /api/validate` returns HTTP 409 `{ ok:false, kind:"no-open-project", … }`. `requestJson` (`api.ts:197`) never checks `response.ok`, so the failure body is cast to `ValidationResult` (`validate()` typed `Promise<ValidationResult>` at `api.ts:330` — unsound). `ValidationPanel` sets `status:"ready"` and passes it to `ValidationResultView`, which reads `result.blockers.length` (`ValidationResultView.tsx:33`) on `undefined` → throws. No React error boundary exists (grep-confirmed) → the throw unmounts the whole tree → blank page.

**Recommended fix:** data-layer soundness at the `validate()` boundary + a render-safety net. → `archive/tickets/PROJGATE-003.md` (transport/typing) and `archive/tickets/PROJGATE-002.md` (error boundary).
**Rejected alternative:** make the shared `requestJson` throw on `!response.ok`. Rejected — `compile`, `generate`, settings, and accepted-segment callers intentionally consume `ok:false` bodies and render friendly failures; a global throw would break that handling.

### O2 — Pervasive mount-time 409 console errors + inconsistent empty states (MODERATE)
All seven project-scoped views fetch on mount with no project open; the server fails closed (409) and the browser logs each as a console error. Empty-state handling is inconsistent (four graceful, two generic, one crash).

**Recommended fix:** prevent project-scoped views from mounting/fetching when no project is open, via shared project-open state + nav gating + route guards. → PROJGATE-001.
**Rejected alternative:** suppress/silence the 409 console logging. Rejected — it hides a real precondition violation rather than fixing it, and leaves the inconsistent empty states.

### O3 — No shared project-open state, no nav gating, no route guard (ROOT/STRUCTURAL)
`AppShell.tsx` renders all routes unconditionally; `getProject()` is polled independently by `ProjectPicker` and `DurableChangeReminder`. There is no single owner of "is a project open," which is the precondition for both O1 and O2.

**Recommended fix:** a shell-level `ProjectOpenProvider` (mirroring `ReminderRefreshProvider`) owns the truth; nav and route guards consume it; `DurableChangeReminder`'s duplicate open-check is collapsed into it. → PROJGATE-001.

## Decisions taken (user-confirmed 2026-06-06)

1. **Gating UX:** disabled-but-visible project-scoped nav items when no project is open, **plus** route guards so typed URLs / programmatic `navigate()` render a shared "Open a project first" panel. (Chosen over "hide entirely" — more discoverable, honors §27 "don't punish ordinary users" — and over "no gating, fix safety only".)
2. **Ticket split:** three tickets, one reviewable diff each.

## FOUNDATIONS alignment

- §27 (UI/workflow): all three tickets advance "clear distinction between surfaces," "make dangerous actions hard to do accidentally," and "respect power users without punishing ordinary users." No principle tensioned.
- §11 (validation fails closed): `archive/tickets/PROJGATE-003.md` ensures a validation *failure* body is rendered as "could not validate," never as "no blockers" — preserves fail-closed semantics client-side.
- §8 / §15 / §23 / §24 (deterministic compilation, secret firewall, OpenRouter/logging, local-first): untouched — no compiler, secret, network, or storage surface changes.

## Ticket map

| Finding | Ticket |
|---|---|
| O3 (root), O2 (trigger removal) | PROJGATE-001 — shared project-open state, nav gating, route guards |
| O1 (render-safety net) | `archive/tickets/PROJGATE-002.md` — app-level error boundary |
| O1 (data-layer root cause) | `archive/tickets/PROJGATE-003.md` — sound `validate()` failure handling |
