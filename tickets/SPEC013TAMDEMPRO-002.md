# SPEC013TAMDEMPRO-002: Server demo creation orchestration + `POST /api/project/create-demo`

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — extends `createProjectInputSchema`/`CreateProjectInput` with optional `isDemoFixture`; new `demo-creation` orchestration module; new `POST /api/project/create-demo` route
**Deps**: SPEC013TAMDEMPRO-001

## Problem

SPEC-013 D2 needs a server path that creates a project marked `isDemoFixture: true` and populates it with the demo fixture through the *same* repository calls a user's actions drive — so the result is indistinguishable from a hand-built project except the marker. Today `createProject` neither accepts nor sets `isDemoFixture` (it builds metadata once at `project-store.ts:220` without it), there is no bulk insert, and there is no demo route. This ticket adds the orchestration and a thin `create-demo` route over the existing `createRecord`/`setStoryConfig`/`setGenerationSession` paths.

## Assumption Reassessment (2026-06-06)

1. `createProject` parses input via `createProjectInputSchema.parse(input)` (`packages/server/src/project-store.ts:201`, schema at `:86-93`, `.strict()`) then builds metadata via `projectMetadataSchema.parse({...})` (`:220`) which does NOT pass `isDemoFixture`. `projectMetadataSchema` already declares `isDemoFixture: z.boolean().optional()` (`packages/core/src/project-storage.ts:16`). There is no metadata-update method (metadata is written once at `project-store.ts:232`), so the clean path is to extend `createProjectInputSchema` and thread the flag into the `:220` parse — confirmed by SPEC-013 §Risks (reassessed in-session 2026-06-06).
2. Population primitives exist on `RecordRepository`: `createRecord` (`packages/server/src/record-repository.ts:142`), `setStoryConfig` (`:300`), `setGenerationSession` (`:323`); the active manager exposes `getRecordRepository()` (`packages/server/src/project-store.ts:103`). No bulk insert exists, so creation loops `createRecord` (~25 records) — spec §Risks R-1 requires a success/failure boundary so a mid-loop failure does not leave a half-populated project.
3. Shared boundary under audit: the orchestration imports the typed fixture from `@loom/core` (produced by SPEC013TAMDEMPRO-001) and the route is registered inside `registerProjectRoutes` (`packages/server/src/project-routes.ts:29`, already wired in `packages/server/src/server.ts:72`). Contract: route returns the created `ProjectStatus`; populated store matches the fixture.
4. FOUNDATIONS principle motivating a guardrail: §23 / §29.9 — demo creation must log no prompt text or API key, and the bundled demo contains no key. Restated before trusting spec narrative; asserted by test.
5. Schema extension blast radius: `createProjectInputSchema` / `CreateProjectInput` (`project-store.ts:86-95`) gains `isDemoFixture?: boolean` (additive, optional, no default needed). Consumers: the store's own `createProject`, and `manager.createProject` callers. The only existing call site is `project-routes.ts:33` via `createProjectBodySchema` (route schema, `.strict()`, UNCHANGED) — it never sets the new field, so the regular `/api/project/create` path is unaffected. Extension is additive-only; §20 no-silent-retcon: the rationale (enable a demo-marked create path) is recorded here.

## Architecture Check

1. A dedicated `demo-creation` module orchestrating `createProject` → loop `createRecord` → `setStoryConfig` → `setGenerationSession` keeps the route handler thin and makes the success/failure boundary unit-testable in isolation; reusing the existing repository primitives (rather than a bulk-insert shortcut or special-case compiler path) preserves "demo is ordinary project data" (FOUNDATIONS §4.4). Threading `isDemoFixture` through the existing schema (vs. rewriting the metadata file post-hoc) avoids a second metadata-write path.
2. No backwards-compatibility aliasing/shims: the new field is additive-optional; the existing create route and schema are untouched; no parallel create path is introduced.

## Verification Layers

1. `isDemoFixture` reaches metadata -> schema validation + test: the created project's metadata carries `isDemoFixture: true` (assert on returned `ProjectStatus` / persisted `continuity-loom.project.json`).
2. Population completeness -> test assertion: after `create-demo`, the repo's records/configs/session match the SPEC013TAMDEMPRO-001 fixture (counts + spot-checked payloads via `listRecords`/`getStoryConfig`/`getGenerationSession`).
3. Fail-clean on mid-loop failure -> test: injecting a failing record insert surfaces a clear diagnostic and does not return a success status for a half-populated project (spec §Risks R-1).
4. No secret/prompt leakage during creation -> manual review + test (§23/§29.9): captured logs contain no API key or prompt text; the fixture itself contains no key.
5. Regular create path unaffected -> codebase grep-proof + existing tests: `createProjectBodySchema` unchanged; `packages/server/src/project-routes.test.ts` (and project-store tests) stay green.

## What to Change

### 1. Extend the create input schema

In `packages/server/src/project-store.ts`, add `isDemoFixture: z.boolean().optional()` to `createProjectInputSchema` and pass it into the `projectMetadataSchema.parse({...})` call at `:220` (spread only when defined, matching the existing `description` pattern). `CreateProjectInput` updates via inference.

### 2. Demo-creation orchestration module

Add `packages/server/src/demo-creation.ts` exporting `createDemoProject(manager, { parentPath, folderName })`: call `manager.createProject({ parentPath, folderName, title: <demo title>, isDemoFixture: true })`, then obtain `manager.getRecordRepository()` and, inside a clear success/failure boundary, loop `createRecord` over the fixture records, `setStoryConfig` per config kind, and `setGenerationSession` for the session. On failure, surface a diagnostic mirroring existing create/open failure shapes. Returns the created `ProjectStatus`.

### 3. `create-demo` route

In `packages/server/src/project-routes.ts`, register `POST /api/project/create-demo` (body `{ parentPath, folderName }`, `.strict()`) inside `registerProjectRoutes`; delegate to `createDemoProject` and return `201` with the `ProjectStatus`, reusing the existing `ZodError`/`ProjectCreateError` error mapping.

### 4. Tests

Add `packages/server/src/demo-creation.test.ts` covering layers 1–4.

## Files to Touch

- `packages/server/src/project-store.ts` (modify)
- `packages/server/src/project-routes.ts` (modify)
- `packages/server/src/demo-creation.ts` (new)
- `packages/server/src/demo-creation.test.ts` (new)

## Out of Scope

- The fixture data itself (SPEC013TAMDEMPRO-001).
- Web "Create demo project" affordance + client (SPEC013TAMDEMPRO-003).
- Blocker-recipe edits/tests (SPEC013TAMDEMPRO-004), stress matrix (SPEC013TAMDEMPRO-005), end-to-end accept/reminder capstone (SPEC013TAMDEMPRO-006).
- Changing `createProjectBodySchema` or the regular `/api/project/create` route.
- Any compiler/validation/schema/prompt-template behavior change (spec §Out of Scope).

## Acceptance Criteria

### Tests That Must Pass

1. `npx vitest run packages/server/src/demo-creation.test.ts` — create-demo yields a project with `isDemoFixture: true`, the complete fixture record/config/session set, fail-clean on injected mid-loop failure, and no logged key/prompt.
2. `npx vitest run packages/server/src/project-routes.test.ts` — existing regular create/open behavior unchanged.
3. `npm run lint && npm run typecheck && npm test` — full pipeline green.

### Invariants

1. The `isDemoFixture` extension is additive-only; `createProjectBodySchema` and the regular create route are byte-unchanged in behavior.
2. A failed demo creation never returns a success `ProjectStatus` for a half-populated project.

## Test Plan

### New/Modified Tests

1. `packages/server/src/demo-creation.test.ts` — orchestration + route behavior, marker, completeness, fail-clean, no-leak.
2. `packages/server/src/project-store.ts` / `project-routes.ts` — covered by existing tests re-run to prove the additive change is non-breaking.

### Commands

1. `npx vitest run packages/server/src/demo-creation.test.ts packages/server/src/project-routes.test.ts`
2. `npm run lint && npm run typecheck && npm test`
3. The targeted pair is the correct boundary (new module + regressed regular-create test); `npm test` confirms no wider server regression.
