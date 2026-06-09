# Triage — Prompt-generation defects (2026-06-08)

Status: triaged → 4 tickets created
Classification: product-behavior (deterministic prompt compilation)
Source: user-reported defects in the compiled prose prompt (no formal report; the request itself is the spec)
Discovery note: per the user's instruction, `docs/triage/` was **not** read for prior triage of these surfaces; this companion is written as a Step-6 threshold output.

## Summary

Five reported symptoms across the compiled prompt, all pinned to `@loom/core` and all encoded by the current golden `packages/core/test/golden-first-segment.prompt.txt`. Resolved into four tickets (one ticket folds two same-mechanism symptoms).

## Findings → verdicts → deliverables

| ID | Finding | Root cause | Verdict | Ticket |
|---|---|---|---|---|
| O1 | `<stop_rule>` shows `Soft unit: Soft unit: …`; user STOP GUIDANCE input never appears | `soft_unit_guidance` has **no resolver** → default empty resolver always returns the empty constant, whose own `Soft unit:` prefix doubles the template's; docs already prescribe conditional omission | **Fix** | `SOFTUNIT-001` |
| O2 | `<offstage_relevance>` renders full preamble + `None` when empty (token waste) | `renderCompressedCastBand` returns `None`; static template always emits preamble (`sections/cast.ts`, `template-constants.ts`) | **Fix — full omission, requires FOUNDATIONS §9/§29.4 amendment** (user-chosen path) | `CASTBANDOMIT-001` |
| O3 | `<present_minor_cast>` renders full preamble + `None` when empty | same path as O2 (`present_minor_cast_compressed` band) | **Fix** (same ticket as O2) | `CASTBANDOMIT-001` |
| O4 | `entity_id` UUID rendered inside active cast dossiers | `activeDossierFieldOrder` lists `"entity_id"` (`sections/cast.ts:13`); contradicts §9 (IDs validation-only) | **Fix** | `DOSSIERID-001` |
| O5 | `<active_obligations_and_consequences>` (and intentions/plans) render raw UUIDs for `owed_by`/`owed_to`/`target`/`cause`/`holder` | `pressure.ts` renders reference fields via `labelValue` with no `resolveRecordLabel` lookup | **Fix — all four causal-pressure records** (user-chosen scope) | `PRESSURELBL-001` |

## Key decisions

- **O2/O3 (FOUNDATIONS tension):** §9 lists *present minor cast* and *offstage relevance* as universal-prompt-contract sections; §29.4 makes omitting a contract section a hard fail "without constitutional amendment." The user chose **full omission**, so `CASTBANDOMIT-001` carries a deliberate §9/§29.4 amendment (omission must remain deterministic and offstage-relevance still renders when offstage pressure is validation-active). The alternative considered and rejected: keep the tag + terse `None`, drop preamble (no amendment).
- **O5 scope:** user chose to fix all four causal-pressure reference-bearing records (OBLIGATION, CONSEQUENCE, INTENTION, PLAN), not only the two named, for a consistent prompt. `cause` (a `recordId | free-text` union) is safe because `resolveRecordLabel` passes free text through unchanged; the genuinely free-text fields (`terms`, `consequence_if_broken`, `current_effect`, `possible_next_effect`) are explicitly excluded from resolution.
- **Cross-cutting:** every ticket updates `docs/compiler-contract.md` in the same diff (contract §10 / FOUNDATIONS §8). The goldens currently encode the bugs and are **regenerated to corrected output**, never adapted to preserve a bug.

## FOUNDATIONS alignment

§4.4/§8 deterministic compilation, §22 IDs validation-only, §9/§29.4 universal-section preservation @ prompt-compilation surface. O1/O3-as-mechanism/O4/O5 **align**; O2/O3 **tension §9/§29.4** under full omission, resolved by the deliberate amendment in `CASTBANDOMIT-001`.

## Named assumptions

- Tickets (not a single prompt-compilation spec), per the user's explicit "create tickets" and each being a single grep-verifiable diff.
- New per-topic ticket prefixes at `-001`, matching repo house style.
