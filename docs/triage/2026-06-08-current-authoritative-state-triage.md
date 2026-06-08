# Triage — `<current_authoritative_state>` block (2026-06-08)

Source: user-reported defect in a real first-generation prompt preview (no formal report). Diagnostic brainstorm; the request itself was the spec. Prior-triage discovery in `docs/triage/` was skipped per the user's explicit exclusion of the triage folder; this companion is written because the triage produced ≥3 tickets (an output write, not a folder read).

## Symptom (verbatim from user)

```
<current_authoritative_state>
Time: Early April, half past six in the afternoon, light already dimming.
Location: The park near the Leka-Enea school, between the Anaka and Puiana neighborhoods.
Onstage entities: 019ea1b1-3957-705f-8332-d3a06305ccd3
019ea213-8f7e-73dc-8e5b-67ba95ca94fe
Immediate situation: Jon is returning home ...
Offstage but pressuring entities: None specified
Current physical positions: None currently specified
... (many "None currently specified" lines) ...
Consent or force conditions: none
Current continuity locks: None currently specified
</current_authoritative_state>
```

## Findings

### O1 — Onstage/offstage entities render raw UUIDs (bug)
`packages/core/src/compiler/sections/front.ts:53-64` resolves `onstage_entities` / `offstage_pressuring_entities` via `valueOrEmpty`→`renderValue` (raw id join), unlike `secret_holders`/`objects` which use `resolveRecordLabel` (`labels.ts:8`). `docs/compiler-contract.md §9` mandates label resolution for entity-id placeholders but omits these two — so the fix is code + an additive §9 amendment.
→ **Ticket: `CURSTATELABEL-001`**

### O2 — 11 of 15 documented authoritative-state fields have no editor (gap; the "oversight")
Only 4 fields have editor widgets (`GenerationBriefView.tsx:377-424`). The other 11 exist in the draft schema (`generation-brief-draft.ts:41-51`) and are consumed by the compiler but are unreachable from the UI, so they are permanently empty. Fields align with docs; consumers are correct; the editor surface is the gap. User chose to add all 11 widgets.
→ **Ticket: `CURSTATEEDIT-001`**

### O3 — Empty optional lines render `None currently specified` (token economy)
The block is a flat `SECTION_TEMPLATES` entry rendered by unconditional placeholder substitution (`compile-prompt.ts:39-47`), so empty optional lines always emit placeholder text. The composite-section path already omits empty blocks (`compile-prompt.ts:49-60`) and `docs/compiler-contract.md:257-260` authorizes omitting blank optional fields. Fix: render only populated optional lines; keep the 4 readiness-required lines always; treat literal `"none"` as empty. Code + `compiler-contract.md` + `prompt-template.md` amendments.
→ **Ticket: `CURSTATEOMIT-001`**

## FOUNDATIONS alignment
- §8 / §4.4 deterministic compilation @ compiler — **aligns** (all three are deterministic pure functions of the snapshot).
- §9 universal prompt contract @ prompt-compilation — **aligns** (O1 human-readable refs; O3 keeps the constitutional section/required lines).
- §28.2 token discipline @ prompt-compilation — **aligns** (O3 removes empty scaffolding).
- No §29 hard-fail tripped; no FOUNDATIONS amendment required (changes live in `docs/compiler-contract.md` / `docs/prompt-template.md`).

## Decisions taken
- Editor scope (O2): add all 11 missing fields now.
- Packaging: 3 separate, independently-reviewable tickets.

## Finding → deliverable map
| Finding | Type | Deliverable |
|---|---|---|
| O1 | bug | `archive/tickets/CURSTATELABEL-001.md` |
| O2 | gap | `archive/tickets/CURSTATEEDIT-001.md` |
| O3 | token economy | `tickets/CURSTATEOMIT-001.md` |

## Named assumptions
- O1 uses silent raw-id fallback (parity with `secret_holders`/`objects`), no new warning.
- O3 treats `consent_or_force_conditions: "none"` (schema default) as empty for omission.
- Union fields in O2 (`entity_statuses`/`positions`/`possessions`) get the free-text widget; entity-ref-array variants deferred.
