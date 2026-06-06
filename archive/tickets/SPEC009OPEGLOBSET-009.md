# SPEC009OPEGLOBSET-009: Create `.env.example` naming OPENROUTER_API_KEY

**Status**: ✅ COMPLETED
**Priority**: LOW
**Effort**: Small
**Engine Changes**: Yes — adds a new repository-root `.env.example` file.
**Deps**: None

## Problem

Phase 9 reads the OpenRouter key from `OPENROUTER_API_KEY`, but the repo has no example env file documenting the variable. FOUNDATIONS §23 allows (and the spec requires) an example env file that **names** the variable without a real value, so a user knows what to set before configuring the key.

## Assumption Reassessment (2026-06-06)

1. `.env.example` does **not** exist yet (verified `test -f .env.example` → absent; collision check confirms the path is free). This is a file **creation**, not an edit — `specs/SPEC-009-…md` Deliverable 8 was updated during the `/reassess-spec` session (2026-06-06) to say "create".
2. `.gitignore` already ignores `.env` and `.env.*` and whitelists the example with `!.env.example` (verified: lines 70–72 — `.env`, `.env.*`, `!.env.example`). No gitignore change is needed; the example will be tracked while real `.env` files stay ignored.
3. Cross-artifact boundary under audit: the variable name `OPENROUTER_API_KEY` must match exactly what the transport client reads from `process.env` (SPEC009OPEGLOBSET-003 `client.ts`) and what the settings module checks for `hasOpenRouterCredential` (SPEC009OPEGLOBSET-001). A drift in the name would silently break credential detection.
4. FOUNDATIONS principle motivating this ticket — §23 / §29.9: "Example environment files may name variables but must not contain real keys." Restated: the example contains the bare key name with an empty value and no real secret; committing a real key would be a security bug.
5. Secret-firewall surface (§23): the example holds `OPENROUTER_API_KEY=` with **no value**. A grep proof asserts no key-shaped string (`sk-…`) is present. No deterministic-compilation surface is touched.

## Architecture Check

1. A tracked `.env.example` with the bare variable name is the canonical, FOUNDATIONS-sanctioned way to document required secrets without leaking them, and the existing `!.env.example` whitelist already anticipates it — so this is the minimal correct change.
2. No backwards-compatibility shim: a single new file.

## Verification Layers

1. File exists and is tracked → `test -f .env.example` and `git check-ignore .env.example` returns non-zero (not ignored).
2. No real key present → grep-proof: the file contains `OPENROUTER_API_KEY=` and matches no `/sk-[A-Za-z0-9]/`.
3. Variable name matches consumers → grep-proof: `OPENROUTER_API_KEY` is the exact string read in `client.ts` / `settings.ts`.

## What to Change

### 1. `.env.example` (new)

Create the file at the repo root containing the OpenRouter key variable name with no value, e.g. a brief comment plus `OPENROUTER_API_KEY=`.

## Files to Touch

- `.env.example` (new)

## Out of Scope

- Any `.gitignore` change — the `!.env.example` whitelist already exists.
- Reading/using the variable — SPEC009OPEGLOBSET-001 (credential boolean) and SPEC009OPEGLOBSET-003 (transport).
- Any real secret value — forbidden by §23.

## Acceptance Criteria

### Tests That Must Pass

1. `.env.example` exists at the repo root and is not git-ignored.
2. It names `OPENROUTER_API_KEY` with no value and contains no key-shaped string.
3. The variable name matches the string read by the transport/settings code.

### Invariants

1. The example env file names the variable but contains no real key (§23).

## Test Plan

### New/Modified Tests

1. `None — file-creation ticket; verification is command-based (existence + git-tracking + secrecy grep), not a unit test.`

### Commands

1. `test -f .env.example && ! git check-ignore -q .env.example && echo tracked`
2. `grep -n "OPENROUTER_API_KEY=" .env.example`
3. `grep -nE "sk-[A-Za-z0-9]" .env.example` — must return nothing (no real key).

## Outcome

Completed: 2026-06-06

Created repository-root `.env.example` with a short OpenRouter comment and
`OPENROUTER_API_KEY=` with no value. No `.gitignore` change was needed because
`.env.example` was already whitelisted while real `.env` files remain ignored.

Deviations: none from the ticket scope.

Verification:

- `test -f .env.example && ! git check-ignore -q .env.example && echo tracked` — printed `tracked`.
- `grep -n "OPENROUTER_API_KEY=" .env.example` — found the empty variable.
- `grep -nE "sk-[A-Za-z0-9]" .env.example` — no matches.
- `rg -n "OPENROUTER_API_KEY" packages/server/src/openrouter/client.ts packages/server/src/openrouter/models.ts packages/server/src/settings.ts .env.example` — variable name matches the settings and transport consumers.
