# Triage — CAST MEMBER display-label bug (working-set band/local_function ambiguity)

**Date:** 2026-06-07
**Trigger:** Diagnostic request — working-set CAST MEMBER section shows `band` / `local_function` selects that don't indicate which cast member they apply to; suspicion of downstream prompt-generation problems.
**Type:** No-source-report diagnostic (live reproduction against the red-bunny project).
**Outcome:** 3 tickets — CASTLABEL-001, CASTLABEL-002, CASTLABEL-003.

## Reproduction

Opened `/home/joeloverbeck/stories/red-bunny` and visited the working-set view. The CAST MEMBER section showed **two rows both labelled "Cast Member"**, each with `band` + `local_function` selects. The project actually contains *Ane Arrieta* and *Jon Ureña* (confirmed via `identity.one_line` in the SQLite store and the linked ENTITY records, which correctly show those names). So the rows — not just the bare select captions — were indistinguishable.

## Findings

| ID | Finding | Evidence | Verdict |
|----|---------|----------|---------|
| O1 | **Root cause.** `labelFieldsByType` registers cast members under key `CAST_MEMBER` (underscore) but the record-type string is `"CAST MEMBER"` (space). `deriveDisplayLabel` misses the lookup and falls back to `titleCase("CAST MEMBER")` → "Cast Member" for every cast member. Lone typo; all other multi-word types use the spaced key. No test covered cast-member derivation. | `packages/core/src/records/editor-descriptors.ts:108-127` (key `:110`), `:155-165` (derive); `packages/core/src/records/cast-member.ts:150`; gap at `packages/core/test/editor-descriptors.test.ts:133-139`. | **Fix → CASTLABEL-001** |
| O2 | **Stale persisted labels + prompt leakage.** `display_label` is stored, so all existing cast members keep "Cast Member" even after O1. Leaks into working-set rows, the Records browser Label column, reference pickers (POV/relationship dropdowns), **and the compiled prompt** (`## Cast Member` dossier headings + voice-pressure pins) — flattening cast identity (FOUNDATIONS §17 / §4.8). `display_label` is never user-edited (always re-derived by the editors), so a deterministic recompute/backfill is safe. | `RecordBrowser.tsx`; pickers `RecordEditor.tsx:240-247`, `CastMemberEditor.tsx:161`; compiler `packages/core/src/compiler/sections/cast.ts:57,89,121,236-238`; editors always derive at `RecordEditor.tsx:439-440`, `CastMemberEditor.tsx:83-84`; on-open migration precedent `project-store.ts:348-350` + `working-set-integrity-migration.ts`. | **Fix → CASTLABEL-002** |
| O3 | **band/local_function controls not associated with the cast member** (the literal reported surface). Bare `band` / `local_function` `<label>` captions; controls are row-scoped to the correct `record.id` but have no cast-member-bearing accessible name. Largely mooted for sighted users once O1/O2 restore row names; remains an accessibility gap. | `packages/web/src/working-set/WorkingSetView.tsx:215-250` (captions `:222,235`; row key `:216`; label `:217`); coupled tests `WorkingSetView.test.tsx`. | **Fix (LOW) → CASTLABEL-003** |
| O4 | **band/local_function consumption is correct — no bug.** The suspicion that the *values* are mis-consumed does not hold. `band` routes to `castBand`; `local_function` feeds voice pins and validation. The only prompt-generation defect is the label leakage (O2), not these values. | `packages/server/src/snapshot-builder.ts:137-157`; `packages/core/src/compiler/sections/cast.ts:58`; `packages/core/src/validation/rules/matrix-voice.ts:82,153,188`. | **No action (reassurance)** |

## FOUNDATIONS alignment

- **§8 deterministic compilation / §4.4** — display labels derive deterministically from payload; the fix and backfill keep a single derivation authority (`@loom/core deriveDisplayLabel`) and re-synchronize the stored cache. No second derivation path. `aligns`.
- **§17 / §4.8 character voice is continuity** — distinct cast members must not be flattened; O2 restores per-character dossier headings in the prompt. `aligns`.
- **§24 / §4.10 local-first user-owned data** — the backfill recomputes a derived denormalization only; it never mutates author-written `payload_json` (story canon). No §29.2 hard-fail. `aligns`.
- **§27 / §29.3 UI inspectability** — O3 makes it programmatically clear which cast member each control configures. `aligns`.

## Delta vs prior triage

The `2026-06-07-record-id-generation-triage.md` pass referenced `displayLabel` and treated reference pickers as "resolved" because they render `displayLabel` rather than UUIDs. That conclusion silently assumed `displayLabel` is meaningful — which is **false for cast members** due to O1. This triage surfaces a new bug, not a reversal of that decision; it strengthens the picker assumption once O1/O2 land.

## Ticket map

- **CASTLABEL-001** (HIGH, Small) — fix the `CAST_MEMBER` → `"CAST MEMBER"` key + regression test. `@loom/core`.
- **CASTLABEL-002** (HIGH, Medium, deps 001) — idempotent on-open backfill of stale `display_label` for all record types. `@loom/server`.
- **CASTLABEL-003** (LOW, Small, deps 001) — cast-member-scoped accessible names on the band/local_function selects + test update. `@loom/web`.
