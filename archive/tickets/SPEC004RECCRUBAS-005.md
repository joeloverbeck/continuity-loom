# SPEC004RECCRUBAS-005: Web app shell, router, and typed API client

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — `@loom/web` navigation shell + router; new web dependencies; `packages/web/src/api.ts`
**Deps**: SPEC004RECCRUBAS-003, SPEC004RECCRUBAS-004

## Problem

The web app is a single project picker — `App.tsx` mounts `ProjectPicker.tsx`, with `api.ts` wrapping only project-lifecycle calls. Phase 4 needs a navigation shell that keeps the five continuity surfaces conceptually distinct and a typed API client for the new record/config/working-set routes, so the browser and editor tickets have a foundation to mount onto. This ticket establishes that foundation: a lightweight router, the shell with the record-centric primary areas, the new web dependencies (added once here), and the full typed `api.ts` client.

## Assumption Reassessment (2026-06-05)

1. Current web state confirmed: `packages/web/src/App.tsx` (mounts ProjectPicker, shows runtime status), `ProjectPicker.tsx`, `api.ts` (`fetchRuntimeStatus`/`createProject`/`openProject`/`getProject`/`createBackup`/`closeProject`), plain React 19 + Vite, vitest+jsdom test infra (`packages/web/src/*.test.tsx`), **no** router/table/form libraries (`packages/web/package.json`). The new routes this client wraps are defined by SPEC004RECCRUBAS-003 (records) and -004 (config/working-set).
2. Spec `specs/SPEC-004-...md` (Approach → `@loom/web` app shell + navigation, API client; UI-WORKFLOWS.md "Navigation model") requires primary areas Project Library / Records / Active Working Set / Story Configuration / Settings (placeholder), conceptual five-surface separation, and clearly-disabled "later phase" affordances for unbuilt surfaces. The confirmed dependency posture is TanStack Table + React Hook Form (+ Zod resolver) + a lightweight router.
3. Shared boundary under audit: the **typed API client** is the single contract the browser/editor tickets call; it must mirror the route request/response + structured-error envelopes from -003/-004 exactly. The router/shell file is a shared mount point that SPEC004RECCRUBAS-006/-009/-010 each add a route to (parallel siblings; mechanical merges).
4. FOUNDATIONS §6 (five continuity surfaces kept distinct) and §27 (UI makes surfaces obvious, never blurs authority) motivate a shell that separates Records / Working Set / Config and does not present unbuilt generation/candidate/preview surfaces as usable. §23/§29.9: the Settings area is a placeholder that must never display an API key (none is handled this phase); it shows at most a configured/not-configured indicator with no value.

## Architecture Check

1. Adding all new web dependencies once in this foundation ticket (router, `@tanstack/react-table`, `react-hook-form`, `@hookform/resolvers`, `zod`) keeps `package.json` churn out of the downstream UI tickets, avoiding parallel package.json merge conflicts. A single typed `api.ts` client keeps fetch/error handling in one place rather than scattered per component.
2. No backwards-compatibility shim: `ProjectPicker` is re-homed under the shell's Project Library route without an alias wrapper; the existing project-lifecycle `api.ts` functions are extended, not duplicated.

## Verification Layers

1. Shell renders the primary surface areas and routes between them -> web component test (Testing Library) navigating the shell.
2. API client functions issue the correct method/path and surface structured errors -> web test with a mocked fetch asserting request shape + error propagation.
3. Unbuilt surfaces are presented as disabled/"later phase", not usable -> component test asserting disabled affordances.
4. Settings placeholder shows no key value -> manual review + FOUNDATIONS §23 alignment check.

## What to Change

### 1. Dependencies

Add to `packages/web/package.json`: a lightweight router (e.g. `react-router-dom`), `@tanstack/react-table`, `react-hook-form`, `@hookform/resolvers`, and `zod` (matching the `^4.x` used by core/server so the resolver validates against the same Zod major). Pin versions consistent with the repo.

### 2. Shell + router

Add a shell/layout component and router config with primary areas: Project Library (re-homing `ProjectPicker`), Records, Active Working Set, Story Configuration, Settings (placeholder). Unbuilt surfaces (Generation Brief, Validation/Preview, Generate/Candidate, Accepted Segments) appear as clearly-disabled later-phase affordances or are omitted. Update `App.tsx` to render the shell.

### 3. Typed API client

Extend `packages/web/src/api.ts` with typed wrappers for all routes from -003 (records list/get/create/update/archive/delete/references) and -004 (story-config get/set per kind, working-set get/set), including the structured-error envelope types the UI field-links against.

## Files to Touch

- `packages/web/package.json` (modify)
- `packages/web/src/App.tsx` (modify)
- `packages/web/src/api.ts` (modify)
- `packages/web/src/shell/` (new — shell/layout + router config)
- `packages/web/src/App.test.tsx` (modify) — shell navigation + disabled-surface assertions
- `packages/web/src/api.test.ts` (new) — request-shape + structured-error tests with mocked fetch

## Out of Scope

- Record browser implementation — SPEC004RECCRUBAS-006.
- Editor engine / CAST MEMBER / config editors — SPEC004RECCRUBAS-007/-008/-009.
- Working-set surface — SPEC004RECCRUBAS-010.
- Any OpenRouter/secret handling beyond a do-nothing Settings placeholder — Phase 9.

## Acceptance Criteria

### Tests That Must Pass

1. The shell renders and navigates between Project Library, Records, Active Working Set, and Story Configuration areas.
2. API client wrappers issue the correct HTTP method/path for each route and propagate the structured-error envelope on failure (mocked fetch).
3. Unbuilt later-phase surfaces are not presented as usable; the Settings placeholder displays no key value.
4. `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` pass.

### Invariants

1. The five continuity surfaces remain conceptually distinct in the shell; no unbuilt generation/candidate/preview surface is presented as functional (FOUNDATIONS §6/§27).
2. No API key value is ever rendered (FOUNDATIONS §23/§29.9).

## Test Plan

### New/Modified Tests

1. `packages/web/src/App.test.tsx` — shell navigation, disabled later-phase surfaces.
2. `packages/web/src/api.test.ts` — per-route request shape + structured-error propagation.

### Commands

1. `npx vitest run --environment jsdom packages/web/src/App.test.tsx packages/web/src/api.test.ts`
2. `npm test && npm run typecheck && npm run lint && npm run build`
