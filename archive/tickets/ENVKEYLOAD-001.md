# ENVKEYLOAD-001: Load root `.env` into the server process at launch

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Small
**Engine Changes**: Yes — `packages/server/src/launch.ts` (server launch entry point); no schema, compiler, or validation change.
**Deps**: None

## Problem

The Settings page reports "API key missing" even though a valid `OPENROUTER_API_KEY` exists in the gitignored root `.env` file. Root cause: nothing in the codebase loads `.env` into the process environment — there is no `dotenv` dependency, no `--env-file` flag, and no `process.loadEnvFile()` call (`grep -rIE "dotenv|env-file|loadEnvFile|process.loadEnvFile"` over `*.ts`/`*.mjs`/`*.json` returns nothing). The credential check reads `Boolean(process.env.OPENROUTER_API_KEY)` (`packages/server/src/settings.ts:164`); the launcher (`scripts/dev.mjs:13` for `npm run dev`, root `package.json` `start` for `npm start`) spawns `node packages/server/dist/launch.js` with only inherited env. The key in `.env` is therefore never visible to the server, and generation cannot be configured unless the user manually exports the variable into the shell first.

This contradicts the repo's own scaffolding: `.env.example` ships `OPENROUTER_API_KEY=` and `.gitignore:70-71` ignores `.env`/`.env.*`, establishing the root `.env` as the intended key location (FOUNDATIONS §23: "API keys must live in `.env`… must be gitignored"). The loader step was simply never wired up.

## Assumption Reassessment (2026-06-07)

<!-- Items 1-3 always required. Items 4+ are a menu; include only those matching this ticket's scope. -->

1. **Credential status reads `process.env` only.** Verified `packages/server/src/settings.ts:161-166` — `withCredentialStatus` returns `hasOpenRouterCredential: Boolean(process.env.OPENROUTER_API_KEY)`. `packages/server/src/openrouter/models.ts:18-25` defaults `apiKey = process.env.OPENROUTER_API_KEY` and returns `missing-key` when falsy. Both read at request/call time, so loading env before `app.listen` is sufficient.
2. **No env-file loading exists today.** Verified by repo-wide grep (no `dotenv`/`--env-file`/`loadEnvFile`). `scripts/dev.mjs:12-21` and root `package.json` `start` both invoke `node packages/server/dist/launch.js` with inherited env only. Live repro: running launch.js process had no `OPENROUTER_API_KEY` in `/proc/<pid>/environ` and the API returned `hasOpenRouterCredential: false`.
3. **Shared boundary under audit: the secret-loading surface.** The only new transport is OS env → `process.env`. The key value must never reach logs, prompts, prompt-inspection UI, story files, or the SQLite store (FOUNDATIONS §23, §29.9). `process.loadEnvFile()` only populates `process.env`; it does not log values. No existing secret-firewall surface is altered.
4. **FOUNDATIONS principle restated before trusting narrative.** §23: the app must "fail safely and clearly when no API key is configured" and keys live in gitignored `.env`. The fix must (a) make a present root `.env` load, and (b) preserve the clear "API key missing" status when `.env` is absent — i.e. the load must be guarded, never throwing on a missing file.
5. **Entry-point placement vs. test isolation.** `launch.ts` exports `parseLaunchArgs`/`launch`/`defaultWebDistDir`, which are imported by tests. Env loading must live **inside** the `if (import.meta.url === \`file://${process.argv[1]}\`)` main guard (`packages/server/src/launch.ts:124`), not at module top, so importing the module in tests has no env side effect.
6. **Path resolution under the compiled layout.** Compiled file is `packages/server/dist/launch.js`. Repo root is `new URL("../../../.env", import.meta.url)` (mirrors the existing `defaultWebDistDir` pattern at `launch.ts:60-62`, which resolves `../../web/dist/`). Use `fileURLToPath` (already imported, `launch.ts:5`) to get a filesystem path for `process.loadEnvFile`.
7. **No mismatch found.** The diagnosis holds against current code; no correction to scope required.

## Architecture Check

1. **Single-source fix at the funnel point.** Both `npm run dev` and `npm start` run through `launch.js`, so loading env once in the main guard fixes every launch path. The rejected alternative — `--env-file-if-exists=.env` in npm scripts — requires the flag in three drift-prone sites (`scripts/dev.mjs`, root `start`, server `dev`) and breaks if `launch.js` is run directly. A `dotenv` dependency is unnecessary given Node ≥ 24 (`.nvmrc`) ships native `process.loadEnvFile`.
2. **No backwards-compatibility aliasing/shims introduced.** Env loading is additive at the entry point; no existing path is duplicated or aliased. Shell-exported `OPENROUTER_API_KEY` continues to work because `process.loadEnvFile` populates `process.env` without clobbering pre-set values that the OS already injected for keys not present in `.env`. (Note: `process.loadEnvFile` does overwrite `process.env` entries that are also defined in `.env`; this is acceptable and expected — `.env` is the documented source of record.)

## Verification Layers

1. With a root `.env` containing `OPENROUTER_API_KEY`, a launched server reports `hasOpenRouterCredential: true` → manual review (start server, `curl http://127.0.0.1:5174/api/settings/openrouter`).
2. With no root `.env`, the server still launches and reports `hasOpenRouterCredential: false` with no thrown error → manual review (rename `.env`, launch, observe clean start + clear missing-key status).
3. Importing `launch.ts` in a test does not read or load any env file → codebase grep-proof (env loading is inside the `import.meta.url` main guard, not module top) + existing `launch` test suite stays green.
4. Secret firewall intact: the key value never appears in logs/prompts/inspection → FOUNDATIONS alignment check (§23, §29.9) — `process.loadEnvFile` only writes `process.env`.

## What to Change

### 1. Load `.env` in the launch entry point

In `packages/server/src/launch.ts`, inside the `if (import.meta.url === \`file://${process.argv[1]}\`)` main guard (currently at line 124), before `launch(parseLaunchArgs(...))`, load the repo-root `.env` if it exists:

- Resolve the path: `fileURLToPath(new URL("../../../.env", import.meta.url))`.
- Guard with `existsSync` (already imported, `launch.ts:3`); call `process.loadEnvFile(envPath)` only when the file exists, so a missing `.env` is a no-op (FOUNDATIONS §23 clear-failure preservation).
- Keep it side-effect-free at module scope — the call lives only in the main guard.

Do **not** log the key, the env contents, or even confirm "loaded key X"; a neutral non-secret message (or silence) only.

## Files to Touch

- `packages/server/src/launch.ts` (modify)
- `packages/server/test/launch.test.ts` (new — no launch test file exists today; verified `packages/server/test/` has no `*launch*` file)

## Out of Scope

- Documentation reconciliation between `docs/user-guide.md:50`, `.env.example`, and the new behavior — handled by ENVKEYLOAD-002.
- Any change to how `models.ts` or `settings.ts` read `process.env`; they already read it correctly.
- Supporting `.env` files located anywhere other than the repo root, or per-project `.env` files inside opened story folders.
- Changing the env var name or adding new settings.

## Acceptance Criteria

### Tests That Must Pass

1. New/extended launch test: when a `.env` fixture with `OPENROUTER_API_KEY` is present at the resolved root path, the loader populates `process.env.OPENROUTER_API_KEY`; when absent, launch proceeds without throwing. (Test the extracted loader helper directly to avoid depending on the real repo `.env`.)
2. `npm run typecheck` passes.
3. `npm test` passes (full suite; `@loom/core` builds first).

### Invariants

1. Env loading executes only when the server is launched as the main module — importing `launch.ts` never loads an env file.
2. The OpenRouter API key value is never written to logs, prompts, prompt-inspection text, story files, or the SQLite store as a result of this change.

## Test Plan

### New/Modified Tests

1. `packages/server/test/launch.test.ts` (new) — unit test for the env-loading helper: extract the load logic into a small exported function (e.g. `loadRootEnv(envPath: string): void`) that the main guard calls, so the test can point it at a temp `.env` fixture and assert `process.env` is populated, and that a non-existent path is a silent no-op.

### Commands

1. `npm run typecheck && npm test --workspace @loom/server`
2. `npm run lint && npm run typecheck && npm test`
3. Manual end-to-end: `npm run dev`, open `http://127.0.0.1:5173/`, go to Settings → "API key configured"; confirm `curl http://127.0.0.1:5174/api/settings/openrouter` returns `hasOpenRouterCredential: true`.

## Outcome

Completed: 2026-06-07.

What changed:

- Added `defaultRootEnvPath()` and `loadRootEnv()` in `packages/server/src/launch.ts`.
- The compiled launch entry point now loads the repo-root `.env` before starting the server, only when `launch.ts` is executed as the main module.
- Extended `packages/server/src/launch.test.ts` to cover loading a fixture `.env` with `OPENROUTER_API_KEY` and silently ignoring an absent env file.

Deviations from original plan:

- `packages/server/src/launch.test.ts` already existed in the current checkout, so the existing test file was extended instead of creating a new test file.
- The localhost smoke used the compiled `node packages/server/dist/launch.js --api-only --port 5174 --no-open` entry point directly after sandboxed standalone binds failed with `listen EPERM`; the check was rerun outside the sandbox.

Verification:

- `npm run typecheck` passed.
- `npm test --workspace @loom/server` passed: 29 files, 159 tests.
- `npm test` passed: 74 files, 452 tests.
- `npm run lint` passed.
- Manual compiled-launch smoke returned `hasOpenRouterCredential: true` from `GET http://127.0.0.1:5174/api/settings/openrouter` with the existing root `.env`; no key value was printed or logged by the loader.
