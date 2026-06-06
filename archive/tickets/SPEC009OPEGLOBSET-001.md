# SPEC009OPEGLOBSET-001: Global OpenRouter settings module

**Status**: ✅ COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — rewrites `packages/server/src/settings.ts` into a read/write surface over a global config file (new `OpenRouterSettings` type, config-location resolver); replaces `packages/server/src/settings.test.ts`.
**Deps**: None

## Problem

The OpenRouter settings boundary is still the SPEC-001 placeholder: `getSettings()` returns the inert `{ openRouterModel: "unset", hasOpenRouterCredential: false }` and is wired to nothing. Phase 9 needs real, **global** (not per-project) model settings persisted outside any project folder, plus a credential-presence signal — without ever reading, persisting, or returning the API key. This module is the foundation the settings routes (SPEC009OPEGLOBSET-004), the pure transport builders (SPEC009OPEGLOBSET-002), and the generate endpoint (SPEC009OPEGLOBSET-005) all build on.

## Assumption Reassessment (2026-06-06)

1. `packages/server/src/settings.ts` currently exports `interface Settings { openRouterModel: string; hasOpenRouterCredential: boolean }` and `getSettings(): Settings` returning inert static defaults (verified: lines 1–11). Its **only** consumer is `packages/server/src/settings.test.ts:3,7` (verified `grep -rn getSettings packages/server/src/` returns just `settings.ts` + `settings.test.ts`); no route imports it. Removing `getSettings()` therefore breaks exactly one test file, which this ticket rewrites.
2. `docs/requirements-version-1/OPENROUTER-INTEGRATION.md` ("Global settings", "API key handling", "Data/logic implications") mandates: settings global not per-project; the project store holds no key and needs no per-project model config; key read from `OPENROUTER_API_KEY` or equivalent **outside project folders**; cached model metadata, if any, lives outside project folders and contains no key. `specs/SPEC-009-…md` Deliverable 1 fixes the resolver order `CONTINUITY_LOOM_CONFIG_DIR` → `$XDG_CONFIG_HOME/continuity-loom/` → `~/.config/continuity-loom/`, filename `openrouter.json`.
3. Cross-artifact boundary under audit: the **`OpenRouterSettings` type** this module owns is imported by SPEC009OPEGLOBSET-002 (`request.ts` builder input) and SPEC009OPEGLOBSET-004 (route response). The persisted **non-secret shape** `{ model, temperature, maxOutputTokens, topP?, cachedModels? }` is the contract those tickets consume; it must never gain a key-shaped field.
4. FOUNDATIONS principle motivating this ticket — §23 "OpenRouter and secrets": the model setting must be "stored data-driven in a configurable file or equivalent local configuration surface, not hardcoded into compiler logic," and the app must "fail safely and clearly when no API key is configured." Restated before trusting the spec narrative: settings are data-driven config, the key is never part of persisted state.
5. Secret-firewall surface (§15 / §23 / §29.9): the config file and every value this module returns must be key-free. `process.env.OPENROUTER_API_KEY` is read **only** to derive the boolean `hasOpenRouterCredential` at call time — never copied into the returned object or the persisted file. `writeOpenRouterSettings` rejects any key-shaped field (mirrors `project-store.secret-boundary.test.ts`'s `/openRouterApiKey|OPENROUTER_API_KEY|apiKey/` guard) so a key can never round-trip into config. No deterministic-compilation surface is touched (transport is downstream of `compilePrompt()`).
6. Rename/removal blast radius: `getSettings` and `interface Settings` are removed. Repo-wide grep (`.claude/skills/`, `docs/`, `specs/`, `packages/`) shows the only code consumer is `settings.test.ts` (rewritten here); `packages/server/dist/settings.d.ts` is build output (regenerated). No skill/doc references `getSettings`.

## Architecture Check

1. A single read/write module over one global JSON file keeps model settings data-driven (§23) and isolates the secret boundary to one place: the key is read on demand for a boolean and nowhere else. Putting settings in the project store would violate §23 (per-project key/model leakage) and break the "global, not per-project" mandate. A bare env-only approach (no file) could not persist `model`/`temperature`/`maxOutputTokens` across runs.
2. No backwards-compatibility shim: `getSettings()` / `interface Settings` are deleted outright, not aliased. The new surface (`readOpenRouterSettings` / `writeOpenRouterSettings` / `OpenRouterSettings`) replaces them.

## Verification Layers

1. Config file never contains a key → secret-firewall audit: a test writes settings then reads the raw file and asserts no `/openRouterApiKey|OPENROUTER_API_KEY|apiKey|sk-/` match.
2. `hasOpenRouterCredential` derives from env presence → test toggles `process.env.OPENROUTER_API_KEY` and asserts the boolean flips while the persisted file is unchanged.
3. Key-shaped write field rejected → schema validation: a `writeOpenRouterSettings({ openRouterApiKey: "sk-…" })`-style call throws/rejects via Zod and writes nothing.
4. `getSettings` fully removed → codebase grep-proof: `grep -rn "getSettings" packages/server/src/` returns no matches.

## What to Change

### 1. Rewrite `settings.ts` as a read/write surface

Export `interface OpenRouterSettings { model: string; temperature: number; maxOutputTokens: number; topP?: number; cachedModels?: ModelListEntry[] }` (with `ModelListEntry` = `{ id: string; name: string; contextLength?: number }`), a Zod schema for the non-secret shape, and:

- `readOpenRouterSettings(): OpenRouterSettings & { hasOpenRouterCredential: boolean }` — loads the config file (defaults applied when absent/partial), derives `hasOpenRouterCredential` from `process.env.OPENROUTER_API_KEY` presence at call time, never returns the key. Reads tolerate a missing file (return defaults).
- `writeOpenRouterSettings(patch: Partial<OpenRouterSettings>): OpenRouterSettings & { hasOpenRouterCredential: boolean }` — Zod-validates the **non-secret** patch, rejects any key-shaped field, merges over current settings, persists to the config file (created on first write), returns the new settings.

Sensible defaults when the file is absent (e.g. `temperature: 1`, `maxOutputTokens` a safe default, `model: ""` so the UI prompts for one).

### 2. Config-location resolver

Resolve the config directory: `process.env.CONTINUITY_LOOM_CONFIG_DIR` → `$XDG_CONFIG_HOME/continuity-loom/` → `~/.config/continuity-loom/`; filename `openrouter.json`. Use `node:fs`/`node:os`/`node:path` (allowed in `@loom/server`; the purity boundary applies only to `@loom/core`). Create the directory on first write.

### 3. Replace `settings.test.ts`

Remove the inert-defaults assertion (it imports the now-deleted `getSettings`). Add the round-trip/secret/credential/rejection/missing-file tests below, pointing `CONTINUITY_LOOM_CONFIG_DIR` at a temp dir per test.

## Files to Touch

- `packages/server/src/settings.ts` (modify)
- `packages/server/src/settings.test.ts` (modify)

## Out of Scope

- `settings-routes.ts` (GET/PUT/models refresh) — SPEC009OPEGLOBSET-004.
- Transport request/error/client/models modules — SPEC009OPEGLOBSET-002, -003.
- Any web surface, any project-store change, any new SQLite table.
- Caching pricing / supported-parameters model metadata — intentionally deferred per spec Deliverable 2.

## Acceptance Criteria

### Tests That Must Pass

1. Round-trip: `writeOpenRouterSettings({ model, temperature, maxOutputTokens, topP })` then `readOpenRouterSettings()` returns the persisted non-secret values from the config file.
2. Credential signal: with `OPENROUTER_API_KEY` set, `hasOpenRouterCredential` is `true`; unset, `false` — and the persisted file is byte-identical in both cases.
3. Key rejection + secrecy: a key-shaped write field throws and writes nothing; the raw config file contents match no `/openRouterApiKey|OPENROUTER_API_KEY|apiKey|sk-/`.
4. Missing-file tolerance: `readOpenRouterSettings()` against an absent config file returns defaults without throwing.
5. `npm test --workspace @loom/server -- src/settings.test.ts` is green; `npm run typecheck` and `npm run lint` pass (full `npm test` stays green — no other consumer of the removed symbol).

### Invariants

1. The API key never enters the persisted file or any returned object — only the derived boolean does.
2. Settings are global: nothing in this module reads or writes the project store; `project-store.secret-boundary.test.ts` continues to pass unchanged.

## Test Plan

### New/Modified Tests

1. `packages/server/src/settings.test.ts` — replaces the inert-`getSettings` assertion with round-trip, credential-toggle, key-rejection, raw-file-secrecy, and missing-file tests using a temp `CONTINUITY_LOOM_CONFIG_DIR`.

### Commands

1. `npm test --workspace @loom/server -- src/settings.test.ts`
2. `npm run typecheck && npm run lint && npm test`
3. `grep -rn "getSettings" packages/server/src/` — must return nothing (removal proof).

## Outcome

Completed: 2026-06-06

Implemented `packages/server/src/settings.ts` as the global OpenRouter settings boundary:
it now resolves `openrouter.json` via `CONTINUITY_LOOM_CONFIG_DIR`, `XDG_CONFIG_HOME`, or
`~/.config/continuity-loom`; persists only non-secret settings; derives
`hasOpenRouterCredential` from `OPENROUTER_API_KEY` at read time; and rejects key-shaped
fields before writing. The old `getSettings()` placeholder was removed.

Replaced `packages/server/src/settings.test.ts` with coverage for missing-file defaults,
round-trip persistence, credential boolean derivation without config mutation, key-field
rejection, and raw-file secrecy.

Deviations: none from the ticket scope.

Verification:

- `npm test --workspace @loom/server -- src/settings.test.ts` — passed.
- `rg -n "getSettings" packages/server/src` — no matches.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — 49 files / 263 tests passed.
- `npm run build` — passed.
