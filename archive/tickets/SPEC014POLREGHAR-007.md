# SPEC014POLREGHAR-007: User guide + README pointer

**Status**: ✅ COMPLETED
**Priority**: MEDIUM
**Effort**: Large
**Engine Changes**: Yes — adds `docs/user-guide.md` and a pointer in `README.md` (documentation surfaces only); no code changes.
**Deps**: None

## Problem

Continuity Loom ships with developer-facing docs (`README.md`, `docs/requirements-version-1/*`) but **no end-user guide**. New users have nothing explaining the loop, that their data is locally owned, how to configure OpenRouter, the candidate lifecycle, the manual-record-update responsibility after accepting durable changes, or how to back up a project. SPEC-014 D7 (plus the D3 documentation part) closes this with a single `docs/user-guide.md` and a README pointer, keeping a FOUNDATIONS-aligned FAQ. No in-app help UI is added (that would be new product behavior, out of scope for a hardening phase).

## Assumption Reassessment (2026-06-06)

1. `docs/user-guide.md` does not exist (confirmed absent on 2026-06-06); `README.md` exists and is developer-facing; every doc under `docs/requirements-version-1/` is a requirements/dev doc, not an end-user guide. This ticket creates the first user-facing guide and links it from `README.md`.
2. The guide describes **existing** behavior only — the canonical loop is FOUNDATIONS §3 (steps 1–15); local-first ownership is §24/§10; OpenRouter/global-key/secrets is §23; the candidate lifecycle (edit/regenerate/discard/accept) is §3/§21; the post-acceptance manual-record-update reminder is §3 (steps 14–15)/§20. Storage backup/recoverability is `docs/requirements-version-1/LOCAL-FIRST-STORAGE.md` (folder-copy backup, `VACUUM INTO` consistent-copy, recoverable version gate) — the user guide gives the *actionable* "how to back up / what a version mismatch means" subset without duplicating the requirements doc.
3. Cross-artifact boundary under audit: the guide documents behavior that sibling tickets pin — storage recoverability (SPEC014POLREGHAR-003), accepted-prose exclusion (006), key handling (005) — but has **no code dependency**: the behavior exists in the current tree, so the guide can be authored and merged independently. The audit is doc↔behavior fidelity, verified by review against the cited FOUNDATIONS/LOCAL-FIRST sections.
4. FOUNDATIONS principles the FAQ must restate accurately before trusting any narrative: §2/§12 "no branches / single continuity"; §10/§28.1 "accepted prose is never prompt context"; §23/§24 "data is local; nothing is uploaded except the prompt you send." Stating any of these loosely would misinform users — restate from the sections, not from memory.
5. No mismatch: the absence of `docs/user-guide.md` and the presence of `README.md` were confirmed on 2026-06-06.

## Architecture Check

1. A single markdown guide plus a README pointer is the minimal, portable, inspectable surface consistent with the local-first ethos (no app bundle bloat, no in-app help framework). Co-locating the storage-backup section here (rather than a separate doc) keeps the user's actionable guidance in one place and avoids duplicating LOCAL-FIRST-STORAGE.md.
2. No backwards-compatibility shims: this is additive documentation; it changes no existing doc's contract beyond adding one pointer line to `README.md`.

## Verification Layers

1. Guide exists and covers required topics → grep-proof: `docs/user-guide.md` contains sections for the loop, ownership, prompt preview, OpenRouter settings, candidate lifecycle, manual record updates, storage backup/recoverability, and the FAQ.
2. README links the guide → grep-proof: `README.md` contains a link to `docs/user-guide.md`.
3. FAQ is FOUNDATIONS-accurate → FOUNDATIONS alignment check (manual review): the "no branches", "accepted prose isn't prompt context", and "is my data uploaded?" answers match §12, §10, and §23/§24.
4. Build/lint unaffected → `npm run lint && npm run typecheck && npm test` still green (docs-only change touches no code).

## What to Change

### 1. Author `docs/user-guide.md`

Cover, for an end user:

- **The loop**: records → curate active working set → edit generation-time fields → validate → compile → preview → send → candidate → edit/regenerate/discard → accept → archive → manual record update → repeat.
- **Local-first ownership**: the project folder is yours; copy/back it up; nothing is uploaded except the prompt you choose to send.
- **Prompt preview**: what it is and why it is gated by validation (fail-closed; no override in v1).
- **OpenRouter setup**: where the key lives (global secret storage, never the project; gitignored; never in prompts/logs), and configuring model/temperature/max tokens.
- **Candidate lifecycle**: edit / regenerate / discard / accept; only the accepted/edited final segment is stored.
- **Manual record-update responsibility**: after accepting durable changes the app reminds you to update records; the app never extracts canon from prose.
- **Storage backup & recoverability** (D3 doc part): how to back up (close + copy the folder, or the "Create Backup Copy" consistent-copy workflow), and what a version mismatch means (the app blocks opening an incompatible store with a clear message and leaves it intact — recoverable, not corrupting).
- **FAQ**: "Why no branches?", "Why isn't accepted prose used as prompt context?", "Is my data uploaded?" — answered in line with FOUNDATIONS §12, §10, §23/§24.

### 2. Add a README pointer

Add a short line in `README.md` linking to `docs/user-guide.md` (e.g. under a "Documentation" or "Getting started" heading).

## Files to Touch

- `docs/user-guide.md` (new)
- `README.md` (modify)

## Out of Scope

- **In-app help UI / tooltips** — new product behavior, excluded from a hardening phase.
- Duplicating `docs/requirements-version-1/*` content — the guide gives the actionable user subset and cross-references rather than copying.
- Any code, schema, validation, or compiler change.

## Acceptance Criteria

### Tests That Must Pass

1. `test -f docs/user-guide.md` — the guide exists.
2. `grep -q "user-guide.md" README.md` — the README links the guide.
3. `npm run lint && npm run typecheck && npm test` — docs-only change leaves the build/suite green.

### Invariants

1. The guide covers the loop, ownership, prompt preview, OpenRouter settings, candidate lifecycle, manual record updates, and storage backup/recoverability.
2. The FAQ answers align with FOUNDATIONS §12 (no branches), §10 (accepted prose not prompt context), and §23/§24 (data ownership / only the sent prompt leaves the machine).

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based (grep-proofs + existing pipeline) and the documented behavior is pinned by sibling tickets 003/005/006.`

### Commands

1. `test -f docs/user-guide.md && grep -nE "Backup|OpenRouter|candidate|active working set|no branches|uploaded" docs/user-guide.md`
2. `grep -n "user-guide.md" README.md`
3. `npm run lint && npm run typecheck && npm test` — the full-pipeline check confirms the docs change introduced no accidental code/link breakage.

## Outcome

Completed: 2026-06-06

What changed:
- Added `docs/user-guide.md` covering the story loop, local ownership, active working set, prompt preview, OpenRouter settings, candidate lifecycle, accepted segments, manual record updates, backup/recoverability, and FAQ.
- Added a README Documentation pointer to `docs/user-guide.md`.

Deviations from original plan:
- None. No in-app help UI or product behavior was added.

Verification results:
- `test -f docs/user-guide.md` passed.
- `grep -nE "Backup|OpenRouter|candidate|active working set|no branches|uploaded" docs/user-guide.md` found the required coverage.
- `grep -n "user-guide.md" README.md` found the README link.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed: 72 files, 429 tests.
