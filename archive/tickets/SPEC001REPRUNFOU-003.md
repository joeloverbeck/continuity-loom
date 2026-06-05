# SPEC001REPRUNFOU-003: `@loom/server` localhost Fastify server and stub API

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — new `packages/server` (`@loom/server`) depending on `@loom/core` and `fastify`; stub `/api/health` + `/api/version`; server smoke test
**Deps**: SPEC001REPRUNFOU-002

## Problem

Phase 1 needs a localhost-only transport boundary that serves the built UI and a stub API, keeping the domain core independent of HTTP. This ticket adds `@loom/server`: a Fastify server bound to loopback, exposing `/api/health` and `/api/version` (version payload sourced from `core`, shape validated with Zod), with logging configured to never emit secrets — established as a standing default before any sensitive data exists.

## Assumption Reassessment (2026-06-05)

1. `packages/server` does not exist; `@loom/core` (from 002) provides the `versionInfo` type the `/api/version` payload renders. `fastify` and `zod` are net-new dependencies of this package only (not of `core`).
2. `archive/specs/SPEC-001-repository-and-runtime-foundation.md` §`packages/server` fixes Fastify (encapsulated in `server`, not leaked into `core`), loopback-only bind (`127.0.0.1`, never `0.0.0.0`/LAN), the two stub endpoints, and the no-secret logging default; `docs/requirements-version-1/TECHNOLOGY-DECISIONS.md` §Security confirms localhost-only + no logging of keys/prompts/prose/record payloads. Zod is the project standard for transport-edge payload validation in Phase 1.
3. Shared boundary under audit: the `server → core` edge (one-way) and the HTTP boundary the core must never depend on. Confirm `core` does not import `server`.
4. FOUNDATIONS principles motivating: §23 / §29.9 (OpenRouter & secrets — logging must never emit keys/prompts/prose/payloads) and §29.10 (local-first — localhost-only, no LAN exposure). Restated before implementation.
5. Secret-firewall surface (§15/§23): no secret is *handled* in Phase 1, but the logging configuration is the firewall's first brick. Confirm the default log serializer omits request bodies / would-be-secret fields, so the firewall is not weakened the moment secrets arrive in Phase 9.

## Architecture Check

1. Fastify over bare `node:http`: first-class request/response schema validation for the future record-CRUD/compile/send API and controllable logging (redaction) — without leaking the framework choice into `core`. Loopback bind by default makes LAN exposure a deliberate act, not an accident.
2. No backwards-compatibility aliasing/shims — net-new package.

## Verification Layers

1. Server binds loopback only -> codebase grep-proof + manual review: the smoke test asserts the bound address is `127.0.0.1`/`::1`; grep confirms no `0.0.0.0`/LAN host literal.
2. `/api/health` contract -> schema validation: smoke test asserts `{ status: "ok" }`.
3. `/api/version` contract -> schema validation: response parsed by the Zod version schema; shape matches the `core` `versionInfo` type.
4. No-secret logging default -> FOUNDATIONS alignment check (§23): manual review + a log-serializer assertion that request bodies / configured sensitive keys are not emitted.

## What to Change

### 1. `@loom/server` package

`packages/server/package.json` (`@loom/server`, deps `@loom/core` + `fastify` + `zod`), `tsconfig.json` extending base with a project reference to `core`.

### 2. Server + stub API

`src/server.ts`: a Fastify instance bound to `127.0.0.1`; `GET /api/health` → `{ status: "ok" }`; `GET /api/version` → version payload from `core`, validated against a Zod schema. Static-asset serving of the built `web` dist is wired here but exercised by the launch ticket (006).

### 3. Logging firewall default

Configure the logger so API keys, prompts, candidate/accepted prose, and full record payloads are never emitted by default (redaction / body omission).

### 4. Server smoke test

`src/server.test.ts`: boots on an ephemeral loopback port; asserts the health/version contracts (Zod) and the loopback bind address.

## Files to Touch

- `packages/server/package.json` (new)
- `packages/server/tsconfig.json` (new)
- `packages/server/src/server.ts` (new)
- `packages/server/src/version-schema.ts` (new)
- `packages/server/src/server.test.ts` (new)

## Out of Scope

- Serving built web assets end-to-end + single-port launch + browser open (006).
- The inert settings boundary (005).
- Any filesystem, SQLite, OpenRouter, or secret access (Phases 2/9).
- Real record payload validation (Phase 3+).

## Acceptance Criteria

### Tests That Must Pass

1. `npm run test --workspace @loom/server` — smoke test green: health, version (Zod), loopback bind.
2. The `GET /api/version` payload validates against the Zod schema and matches `core`'s `versionInfo` shape.
3. `npm run typecheck --workspace @loom/server` green.

### Invariants

1. The server binds only to a loopback address by default; no `0.0.0.0`/LAN literal exists.
2. No log path emits API keys, prompts, prose, or full record payloads.

## Test Plan

### New/Modified Tests

1. `packages/server/src/server.test.ts` — boot-on-loopback + health/version contract + bind-address assertions.

### Commands

1. `npm run test --workspace @loom/server`
2. `npm run typecheck --workspace @loom/server && npm run lint --workspace @loom/server`

## Outcome

Implemented `@loom/server` with a Fastify app factory, loopback-only listen
helper, `/api/health`, and `/api/version` sourced from `@loom/core` and parsed
through Zod schemas. Configured the server logger to omit request bodies and
redact future secret/prose/payload paths by default. Verified with
`npm run test --workspace @loom/server`, `npm run typecheck --workspace
@loom/server`, `npm run lint --workspace @loom/server`, and grep checks showing
no LAN bind literal and no secret handling beyond redaction path names.
