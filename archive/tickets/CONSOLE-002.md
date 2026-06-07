# CONSOLE-002: Add a favicon to stop the /favicon.ico 404 on app load

**Status**: COMPLETED
**Priority**: LOW
**Effort**: Small
**Engine Changes**: Yes — `packages/web` static assets only: new `packages/web/public/favicon.svg` and a `<link rel="icon">` in `packages/web/index.html`. No code, schema, compiler, server, or validation changes.
**Deps**: None

## Problem

On every load of the app, the browser console logs `Failed to load resource: status 404 (Not Found)` for `/favicon.ico`. `packages/web/index.html` declares no `<link rel="icon">`, so the browser falls back to auto-requesting `/favicon.ico`, which nothing serves. There is no `packages/web/public/` directory, and the built `packages/web/dist/index.html` also has no favicon link, so the 404 occurs in both dev and production builds.

## Assumption Reassessment (2026-06-06)

1. `packages/web/index.html` contains no favicon link (verified — full file is 12 lines, `<head>` has only charset, viewport, and title). Confirmed via read.
2. There is no `packages/web/public/` directory (verified via `ls packages/web`), and Vite's default `publicDir` is `public` (no override in `packages/web/vite.config.ts`), so creating `packages/web/public/favicon.svg` will be served at `/favicon.svg` in dev and copied into `dist/` on `npm run build`. Confirmed: `vite.config.ts` sets only `server.host`, `server.port`, and the `/api` proxy.
3. `packages/web/dist/index.html` (built output) likewise has no favicon link (verified via grep), confirming the 404 is not dev-only.
4. FOUNDATIONS check: this is a static UI asset with no engaged principle. The asset is served locally from the app's own origin — no external/CDN fetch — so the local-first network boundary (network traffic limited to the intentional OpenRouter prompt) is preserved.

## Architecture Check

1. Shipping a local SVG asset and referencing it explicitly is cleaner than the alternatives: an inline `data:` URI in `index.html` would bloat the document and is harder to maintain, and an external/CDN icon would violate the local-first network boundary. A single `public/favicon.svg` referenced by a `<link>` is the standard Vite pattern and self-contained.
2. No backwards-compatibility aliases or shims introduced. No duplicate authority path.

## Verification Layers

1. Invariant: the app serves a favicon and no longer 404s for the icon → manual review via browser/Puppeteer `console://logs` (no `404` for the favicon on load).
2. Invariant: the favicon ships in the production build → codebase grep-proof that `dist/index.html` references the icon and `dist/` contains the asset after `npm run build`.

## What to Change

### 1. Add a local favicon asset

Create `packages/web/public/favicon.svg` — a small, self-contained SVG (no external references). A simple geometric/loom-themed glyph is sufficient.

### 2. Reference it from index.html

In `packages/web/index.html`, add inside `<head>`:
`<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`

## Files to Touch

- `packages/web/public/favicon.svg` (new)
- `packages/web/index.html` (modify)

## Out of Scope

- A multi-format favicon set (`.ico`, PNG sizes, apple-touch-icon, web manifest) — a single SVG icon covers all current targets; additional formats are unneeded.
- Any application logic, routing, or API change.

## Acceptance Criteria

### Tests That Must Pass

1. `npm run build` — completes; `packages/web/dist/index.html` contains the `<link rel="icon" ... href="/favicon.svg">` and `packages/web/dist/favicon.svg` exists.
2. `npm run lint` and `npm run typecheck` — pass (no regressions; no code changed).

### Invariants

1. Loading the app issues no 404 for the favicon (the icon resolves from the app's own origin).
2. No network request leaves localhost for the icon (asset is served from `public/`, not a CDN).

## Test Plan

### New/Modified Tests

1. None — static-asset/markup-only change; verification is build-output inspection and manual console check, consistent with the absence of HTML-asset unit tests in this package.

### Commands

1. `npm run build && grep -c 'favicon.svg' packages/web/dist/index.html && ls packages/web/dist/favicon.svg`
2. Manual: `npm run dev`, open `http://127.0.0.1:5173/`, confirm DevTools console (or Puppeteer `console://logs`) shows no `404` for the favicon.
3. A narrower command than the full test suite is correct here because no TypeScript/runtime code changes — the verification boundary is the build output and the served asset.

## Outcome

Completed on 2026-06-06.

What changed:

- Added `packages/web/public/favicon.svg`, a local self-contained SVG favicon.
- Added `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` to `packages/web/index.html`.

Deviations from original plan:

- None. No application logic, API route, schema, compiler, validation, or server behavior changed.

Verification:

- `npm run build` passed and copied `packages/web/dist/favicon.svg`.
- `grep -c 'favicon.svg' packages/web/dist/index.html` returned `1`.
- `ls packages/web/dist/favicon.svg` found the built asset.
- `npm run lint` passed.
- `npm run typecheck` passed.
- Localhost browser smoke at `http://127.0.0.1:5173/` showed zero console errors/warnings; network requests included `GET /favicon.svg => 200 OK`.
