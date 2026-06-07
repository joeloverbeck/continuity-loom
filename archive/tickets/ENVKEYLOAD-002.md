# ENVKEYLOAD-002: Reconcile API-key setup docs with root `.env` auto-loading

**Status**: COMPLETED
**Priority**: MEDIUM
**Effort**: Small
**Engine Changes**: None — documentation and `.env.example` comment only; no code, schema, compiler, or validation change.
**Deps**: `archive/tickets/ENVKEYLOAD-001.md` (documents the behavior that ticket introduces)

## Problem

The repo's API-key setup guidance does not match where the key actually needs to live, and (until ENVKEYLOAD-001) did not match how the key is loaded. `docs/user-guide.md:50` tells the user their key "belongs in global local secret storage, such as the `OPENROUTER_API_KEY` environment variable" but never mentions the root `.env` file — even though `.env.example` ships `OPENROUTER_API_KEY=` and `.gitignore:70-71` ignores `.env`/`.env.*`, which is the de-facto intended location (FOUNDATIONS §23). Once ENVKEYLOAD-001 makes the root `.env` auto-load at launch, the docs should state plainly: copy `.env.example` to `.env`, set the key, and it loads automatically. The `.env.example` comment should say the same.

## Assumption Reassessment (2026-06-07)

<!-- Items 1-3 always required. Items 4+ are a menu; include only those matching this ticket's scope. -->

1. **Doc target verified.** `docs/user-guide.md:50` is the only user-guide line referencing the API key / env var (verified by `grep -niE 'api[ _-]?key|OPENROUTER_API_KEY|\.env|environment variable' docs/user-guide.md`). The "OpenRouter Settings" section is at `docs/user-guide.md:44`.
2. **Scaffolding verified.** `.env.example` (repo root) contains a comment line plus `OPENROUTER_API_KEY=`; `.gitignore:70-71` lists `.env` and `.env.*`. No other doc currently instructs `.env` setup (confirm with a repo-wide grep during implementation before adding a second location).
3. **Cross-artifact boundary: the documented contract for key storage.** This ticket aligns three surfaces that describe the same fact — `docs/user-guide.md`, `.env.example`, and the loader behavior from ENVKEYLOAD-001 — so they agree that the gitignored root `.env` is the canonical local key store.
4. **FOUNDATIONS principle restated.** §23: keys live in gitignored `.env`, must never appear in story files, prompts, inspection UI, or logs; example env files may name variables but must not contain real keys. The docs must reinforce these, and `.env.example` must remain value-empty.
5. **Mismatch + correction.** Pre-ENVKEYLOAD-001, the docs implied a shell-exported env var was the mechanism. After the loader lands, the simpler and accurate instruction is "put it in root `.env`". Shell export remains a valid alternative and may be mentioned as such, but `.env` is the documented default.

## Architecture Check

1. **Single documented source of truth.** Reconciling the three surfaces removes the doc/scaffolding contradiction that caused the original confusion, rather than adding yet another setup path. Aligning docs with the as-built loader is cleaner than leaving users to discover the shell-export workaround.
2. **No backwards-compatibility aliasing/shims introduced.** Documentation-only change; no code paths added or aliased.

## Verification Layers

1. `docs/user-guide.md` OpenRouter section states the root `.env` workflow (copy `.env.example` → `.env`, set `OPENROUTER_API_KEY`, auto-loaded at launch) → manual review.
2. `.env.example` comment states the file should be copied to `.env` and that the key loads automatically; the example remains value-empty → manual review + grep-proof that `.env.example` contains no real key (`grep -E 'OPENROUTER_API_KEY=.+' .env.example` returns nothing).
3. Docs continue to assert the secret firewall (key never in story files, prompts, inspection, logs) → FOUNDATIONS alignment check (§23, §29.9).

## What to Change

### 1. `docs/user-guide.md` — OpenRouter Settings section

Update the API-key paragraph (around line 50) to instruct: copy `.env.example` to `.env` at the repo root, set `OPENROUTER_API_KEY=<your key>`, and note it is loaded automatically when the app launches (`npm run dev` / `npm start`). Preserve the existing secret-firewall sentence (key not stored in project metadata, SQLite store, accepted-segment metadata, compiled prompts, prompt preview, or logs). Optionally note that a shell-exported `OPENROUTER_API_KEY` also works as an alternative.

### 2. `.env.example` — comment

Expand the comment to say: copy this file to `.env`, fill in the key, and it loads automatically at launch. Keep `OPENROUTER_API_KEY=` empty (no real key).

## Files to Touch

- `docs/user-guide.md` (modify)
- `.env.example` (modify)

## Out of Scope

- The loader code change itself (ENVKEYLOAD-001).
- Restructuring the user guide beyond the OpenRouter Settings section.
- Adding a separate `README` setup section (only touch it if a repo-wide grep finds it already documents key setup and now contradicts the as-built behavior; otherwise leave for a follow-up).

## Acceptance Criteria

### Tests That Must Pass

1. None — documentation-only ticket; verification is review-based and grep-based per the Verification Layers.
2. `.env.example` contains no real key value: `grep -E 'OPENROUTER_API_KEY=.+' .env.example` returns nothing.

### Invariants

1. Documentation describes exactly one canonical key location (gitignored root `.env`), with shell export noted only as an alternative.
2. No example/committed file contains a real API key (FOUNDATIONS §23).

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based and existing pipeline coverage is named in Assumption Reassessment.`

### Commands

1. `grep -E 'OPENROUTER_API_KEY=.+' .env.example` (must return nothing — example stays value-empty)
2. `npm run lint` (ensure no doc tooling/link checks regress)
3. Manual review of `docs/user-guide.md` OpenRouter section against the as-built ENVKEYLOAD-001 behavior.

## Outcome

Completed: 2026-06-07.

What changed:

- Updated `docs/user-guide.md` OpenRouter Settings guidance to document the root `.env` workflow: copy `.env.example` to `.env`, set `OPENROUTER_API_KEY=<your key>`, and launch through `npm run dev` or `npm start`.
- Preserved the secret-firewall guidance that the key is not stored in project metadata, the SQLite project store, accepted segment metadata, compiled prompts, prompt preview text, or logs.
- Updated `.env.example` to say the file should be copied to `.env` and loads automatically at app launch, while keeping `OPENROUTER_API_KEY=` empty.

Deviations from original plan:

- None.

Verification:

- `grep -E 'OPENROUTER_API_KEY=.+' .env.example` returned no output with exit code 1, proving the example key remains value-empty.
- `grep -niE 'api[ _-]?key|OPENROUTER_API_KEY|\.env|environment variable' docs/user-guide.md` shows the OpenRouter section now documents the root `.env` setup and shell-export alternative in one paragraph.
- `npm run lint` passed.
- Manual review confirmed the documented behavior matches the ENVKEYLOAD-001 compiled launch loader.
