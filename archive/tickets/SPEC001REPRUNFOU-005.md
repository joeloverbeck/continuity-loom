# SPEC001REPRUNFOU-005: Inert placeholder settings boundary

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: Yes — new inert settings module in `@loom/server`
**Deps**: SPEC001REPRUNFOU-003

## Problem

The Phase-1 gate requires a placeholder settings boundary that handles no secrets. This ticket adds an inert `settings` module that defines the *interface* for future global settings (OpenRouter model, key-presence) and returns static defaults — reading, storing, and logging no API key — so §23 / §29.9 are clean from the first commit, before any secret exists.

## Assumption Reassessment (2026-06-05)

1. No settings module exists; it lands in `@loom/server` (003), which owns the future filesystem/secret boundary. `@loom/core` stays pure (it must not gain secret-handling responsibility).
2. `specs/SPEC-001-repository-and-runtime-foundation.md` §Key decisions #4 ("Inert placeholder settings boundary") requires the module to define the interface and return static defaults, reading/storing/logging no API key. `docs/FOUNDATIONS.md` §23 lists the constitutional secret rules; §29.9 is the hard-fail group.
3. Shared boundary under audit: the secret firewall. The settings interface must expose only *presence/shape* (e.g. a `hasApiKey` boolean that is statically `false` in Phase 1), never a key value.
4. FOUNDATIONS principles motivating: §23 (API keys live only in `.env`-equivalent local storage, never in code/logs/prompts) and §29.9 (secret hard-fails). Restated before implementation.
5. Secret-firewall surface (§15/§23): confirm the module has no code path that reads `process.env` for a key, returns a key, or logs one. Inert by construction — the firewall cannot be weakened because no key is ever in scope.

## Architecture Check

1. Defining the settings *interface* now (returning static defaults) lets Phase 9 swap in real config-file-backed settings without changing call sites, while keeping Phase 1 provably secret-free. Living in `server` (not `core`) preserves core purity.
2. No backwards-compatibility aliasing/shims — net-new module.

## Verification Layers

1. No key is read/stored/logged -> codebase grep-proof + FOUNDATIONS alignment check (§23): grep the settings module for `process.env`, key-like access, and value logging (must be absent/inert).
2. Interface returns static defaults -> manual review / unit test: `getSettings()` returns the documented defaults with `hasApiKey === false`.

## What to Change

### 1. Inert settings module

`packages/server/src/settings.ts`: a typed `Settings` interface (future global OpenRouter model, key-presence flag) and a `getSettings()` returning static defaults; `hasApiKey` is statically `false`; no `.env`/key access.

## Files to Touch

- `packages/server/src/settings.ts` (new)
- `packages/server/src/settings.test.ts` (new)

## Out of Scope

- Real key reading, config-file storage, OpenRouter model selection (Phase 9).
- Any UI for settings.

## Acceptance Criteria

### Tests That Must Pass

1. `npm run test --workspace @loom/server` — the settings test asserts static defaults and `hasApiKey === false`.
2. Grep proof: `grep -rnE "process\.env|apiKey|api_key" packages/server/src/settings.ts` returns nothing key-related.

### Invariants

1. The settings module reads, stores, and logs no API key in Phase 1.

## Test Plan

### New/Modified Tests

1. `packages/server/src/settings.test.ts` — asserts the inert interface returns static defaults and exposes no secret.

### Commands

1. `npm run test --workspace @loom/server`
2. `grep -rnE "process\.env|apiKey|api_key" packages/server/src/settings.ts || echo "clean"`

## Outcome

Implemented an inert `settings` boundary in `@loom/server` with static defaults
for the future OpenRouter model and credential-presence state. The module reads
no environment variables, returns no key value, and exposes only
`hasOpenRouterCredential: false`. Verified with `npm run test --workspace
@loom/server`, `npm run typecheck --workspace @loom/server`, `npm run lint
--workspace @loom/server`, and `rg -n "process\\.env|apiKey|api_key"
packages/server/src/settings.ts || true`.
