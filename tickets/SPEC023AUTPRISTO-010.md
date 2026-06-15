# SPEC023AUTPRISTO-010: Docs — Private Notes section in the user guide

**Status**: PENDING
**Priority**: LOW
**Effort**: Small
**Engine Changes**: Yes — adds a Private Notes section to `docs/user-guide.md`; no production behavior change
**Deps**: 008

## Problem

The user guide must explain the new Private Notes surface to authors: what it is (a per-story local scratchpad), how to use it (create, edit, browse, delete), the hard boundary (notes are never records, working-set entries, brief fields, validation input, or prompt context, and cannot link to records), and the local project lifecycle (notes open and close with the project). This is the user-facing counterpart to the constitutional §6.6 amendment (ticket 001).

## Assumption Reassessment (2026-06-15)

1. `docs/user-guide.md` is an existing registered active doc (per `docs/ACTIVE-DOCS.md`); adding a section to it needs no new ACTIVE-DOCS entry. SPEC-023 §Deliverable 7 explicitly says not to create a new active `docs/*.md` unless the same change registers it in `docs/ACTIVE-DOCS.md` — this ticket edits the existing guide only, so no registry change is required.
2. SPEC-023 §Deliverable 7 prescribes the content: Private Notes, the no-prompt / no-record-link boundary, and the local project lifecycle. The boundary wording must match the §6.6 / §29.12 doctrine landed by ticket 001 (notes never enter validation, readiness, working set, compiler input, any prompt, any OpenRouter request, prompt inspection, or assistance output; a note influences generation only when the author manually re-authors its substance into a record or generation-time field).
3. **Cross-artifact boundary under audit**: the guide section describes the `/notes` UI surface delivered by tickets 007–008 and the boundary established by ticket 001. It is **not** §8-bound (it is neither `docs/compiler-contract.md` nor `docs/story-record-schema.md`), so it correctly lands in this trailing docs ticket rather than co-locating with a code ticket. It documents the feature in aggregate (no individually-staleable compiler/schema symbols), so `Deps: 008` (the completed UI surface) is sufficient and it may land parallel to the capstone (009).
4. **FOUNDATIONS principle under audit (§24 / §27)**: §24 local-first user-owned data — the guide frames notes as local project data owned by the author. §27 — the guide reinforces the surface distinction by stating plainly that notes are inert scratch, never continuity authority or prompt context.

## Architecture Check

1. A single trailing docs edit that lands once the UI exists avoids a staleness window where the guide describes a surface users cannot yet open; keeping it out of the code tickets keeps each code diff focused. The guide references the feature in aggregate, so it needs no per-symbol `Deps`.
2. No backwards-compatibility aliasing/shims; documentation-only.
3. **Same revision; co-lands with the feature (§1.1)** — transitively after 001; the boundary copy must not describe a constitution that has not yet been amended.

## Verification Layers

1. The guide explains Private Notes, the no-prompt / no-record-link boundary, and the local project lifecycle -> codebase grep-proof (section heading + boundary phrases present).
2. No new `docs/*.md` is created and `docs/ACTIVE-DOCS.md` needs no entry -> manual review (only `docs/user-guide.md` in Files to Touch) + grep-proof that no new doc file was added.

## What to Change

### 1. `docs/user-guide.md` (modify)

Add a "Private Notes" section covering: the per-story local scratchpad purpose; create / edit / browse / delete; the boundary (notes are never records, working-set entries, generation-time brief fields, validation/readiness input, or prompt context, and cannot link to or from records); the manual-only influence path (the author must re-author substance into a record or brief field); and the local project lifecycle (notes live in the project's local store and open/close with it). Align the boundary wording with the §6.6 / §29.12 doctrine from ticket 001.

## Files to Touch

- `docs/user-guide.md` (modify)

## Out of Scope

- The FOUNDATIONS amendment (ticket 001) — this ticket is the user-facing guide, not the constitution.
- Any new `docs/*.md` file or `docs/ACTIVE-DOCS.md` registry change.
- `docs/compiler-contract.md` / `docs/story-record-schema.md` — unchanged (Notes add no compiler placeholder or record schema).
- Any implementation code.

## Acceptance Criteria

### Tests That Must Pass

1. `grep -niE "private notes" docs/user-guide.md` returns the new section heading.
2. `grep -niE "never .*(prompt|record)|not .*prompt context|cannot link" docs/user-guide.md` confirms the boundary statement is present.
3. `git status --porcelain docs/` shows only `docs/user-guide.md` modified (no new doc file, no ACTIVE-DOCS change).

### Invariants

1. The guide states the Notes boundary consistent with FOUNDATIONS §6.6 / §29.12 (no prompt, no record link, manual re-authoring only).
2. No new active doc is introduced; the only docs surface touched is the existing user guide.

## Test Plan

### New/Modified Tests

1. `None — documentation-only ticket; verification is command-based (grep-proofs) and existing pipeline coverage is unaffected (no production behavior change).`

### Commands

1. `grep -niE "private notes" docs/user-guide.md`
2. `grep -niE "never|cannot link|manually" docs/user-guide.md`
3. A narrower command is the correct boundary: this ticket changes only user-guide prose, so `npm run lint`/`typecheck`/`build` are unaffected; verification is the grep-proof set.
