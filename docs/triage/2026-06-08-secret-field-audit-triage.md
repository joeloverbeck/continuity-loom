# Triage — SECRET record prompt-compilation audit + holder/non-holder UUID bug

Date: 2026-06-08
Topic: Why the `<secrets_and_reveal_constraints>` prompt block shows entity UUIDs, and an audit of every SECRET field's prompt usage.
Classification: product-behavior (prompt compilation + secrets/knowledge handling; governed by `docs/FOUNDATIONS.md` §8, §15).
Scope note: This is a no-source-report diagnostic + field audit. The `docs/triage/` prior-triage *discovery* step was skipped per the user's explicit exclusion ("aligned with docs/** … not inside the triage folder"); this companion record is written as a required output because the triage produced ≥3 tickets.

## Trigger

Live prompt preview rendered raw UUIDs:

```
Secret holders:
- 019ea1b1-3957-705f-8332-d3a06305ccd3
Characters who must not know yet:
- 019ea274-2ac7-7413-86d1-5ed979d2a04c
```

## Root cause (O1)

`secret_holders` / `secret_non_holders_to_protect` resolvers (`packages/core/src/compiler/sections/front.ts:130-136`) project holder arrays with `listLine(...)` (`front.ts:229-235`) — a plain string join, no id→display-label resolution — unlike `renderPovCharacter` (`front.ts:186-199`), which resolves via `displayLabel` (`front.ts:201-204`). The `<audience_knowledge>` block is correct (renders `secret_claim` prose, not ids). `docs/compiler-contract.md` §9 already declares record IDs validation-only and names `{pov_character}` "the one prompt-facing id-derived value"; raw UUIDs in `{secret_holders}` violate that intent. `archive/tickets/POVDISPLAY-001.md:16` incorrectly assumed SECRET ids never reach the compiled prompt — there is no deliberate decision to render ids, so no prior decision is reversed.

## Per-field audit (SECRET schema `packages/core/src/records/knowledge.ts:62-79`)

| Field | Prompt usage | Verdict |
|---|---|---|
| `id` | Not rendered (correct per contract §9) | OK |
| `status` | Gate: `isActiveSecret` filter (`front.ts:243`) | OK |
| `secret_kind` | Read nowhere (schema + demo only) | **O3 — decide** |
| `secret_claim` | Writer truths / POV+audience knows/doesn't-know / irony | OK |
| `holders` | `{secret_holders}` as raw UUID | **O1 — bug** |
| `non_holders_to_protect` | `{secret_non_holders_to_protect}` as raw UUID; literals pass through | **O1 — bug** |
| `audience_visibility` | Audience/irony filters | OK |
| `pov_access` | POV/irony filters | OK |
| `salience` | Projected to `metadata.salience` (`knowledge.ts:108`) → ordering (`ordering.ts:37`) | OK (indirect) |
| `allowed_surface_cues` | `{allowed_clues_and_surface_cues}` (`front.ts:138`) | OK |
| `forbidden_reveals` | `{forbidden_reveals}` + `none` sentinel | OK |
| `reveal_permission` | `{reveal_permissions}` | OK |
| `reveal_triggers` | `{reveal_permissions}` suffix | OK |
| `clue_carriers` | Read nowhere, but compiler-contract row 130 says it should compile | **O2 — gap** |

## Findings → deliverables

| ID | Finding | Verdict | Deliverable |
|---|---|---|---|
| O1 | Holder/non-holder ids render as UUIDs in the compiled prompt | ACT (HIGH) | `tickets/SECRETPROMPT-001.md` |
| O2 | `clue_carriers` never compiled though contract row 130 promises it | ACT (MEDIUM) | `tickets/SECRETPROMPT-002.md` |
| O3 | `secret_kind` defined but unused; no doc requires it | DECIDE (LOW) | `tickets/SECRETPROMPT-003.md` |

Out of scope (flagged, not actioned): `{onstage_entities}`, `{offstage_pressuring_entities}`, `{possessions}` derive from free-text current-state fields (different input class), not reported — own ticket if id-rendering is later confirmed.

## FOUNDATIONS alignment

§15 (POV/secrets discipline — "who holds a secret", "who must not know yet" must be legible) and §8 (deterministic compilation) @ prompt-compilation surface — **aligns**. The id→label fix is a deterministic, LLM-free snapshot lookup; the secret firewall (leakage/protection logic keying off raw ids in `universal-blockers.ts`, `matrix-voice.ts`, `renderPovDoesNotKnow`) is untouched. No §29 hard-fail; §29.6 is improved. Change-control §10 honored: contract docs move in the same revisions as the code (`docs/compiler-contract.md` rows 127–130, §9).

## Namespace

New prefix `SECRETPROMPT` (mirrors the existing `BELIEFPROMPT` series; no collision in `tickets/` or `archive/tickets/`), numbered `-001`/`-002`/`-003`.
