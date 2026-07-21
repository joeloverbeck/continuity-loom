# Triage — Prompt-generation issues in a production story (2026-06-09)

Source: user diagnostic request (no formal report). Four issues observed in a compiled production prompt; request was to check alignment with `docs/**`, trace the lifecycle of each feeding field, and create tickets in alignment with the docs.

Classification: product-behavior (deterministic prompt compilation). Post-exploration confidence ~93%; root causes pinned statically from the compiler code, brief schema, prompt template, and compiler contract (confirmatory golden-test repro skipped per the deterministic-`@loom/core` static-root-cause rule; the pasted production prompt evidences the symptoms).

User decisions (via AskUserQuestion):
- O1: **Amend FOUNDATIONS §29.4, then ticket the omission.**
- O4: **Decouple + add a dedicated authored field.**

## Findings and disposition

### O1 — `<hard_canon>` renders `None selected for this generation` and the requested omission trips FOUNDATIONS §29.4
- Root cause: generic template path (`template-constants.ts:129-131`) + empty fallback (`front.ts:44-47`, `empty-states.ts:35`); sections never dropped unless `null` (`compile-prompt.ts:87-88`).
- Feed is correct (selected `FACT` with `fact_kind=hard_canon`); empty phrase is contract-specified (`docs/specs/compiler-contract.md:97`).
- **Constitutional conflict**: omitting a universal section needs an amendment (`docs/principles/FOUNDATIONS.md:910`, §9 list `:274`). Only cast-band sections are sanctioned-omittable.
- Disposition: **ACTION — ticket `HARDCANONOMIT-001`**. FOUNDATIONS §9 + §29.4 amendment (wording in the ticket) **signed off by the user 2026-06-09**; apply it atomically with the compiler change in one revision.

### O2 — Onstage entities render one-per-line instead of comma-joined
- Root cause: `renderEntityReferenceList` joins with `"\n"` (`front.ts:195-201`); siblings use `", "` (`front.ts:241-266`). Same helper also renders `offstage_pressuring_entities` (`front.ts:63-70`), so both are affected.
- Pure rendering bug; template implies a single line (`docs/specs/prompt-template.md:90,94`); no contract change.
- Disposition: **ACTION — ticket `ONSTAGEJOIN-001`** (fixes onstage + offstage via the shared helper).

### O3 — `<pov_knowledge_constraints>` renders empty `POV does not know: None specified` (token waste)
- Root cause: generic template with hardcoded value-lines (`template-constants.ts:132-150`); empty fallbacks `"None specified"` (`front.ts:306-357`, `:126-130`, `empty-states.ts:59-63`).
- Feeds correct and surfaced (compiled from FACT/BELIEF/SECRET keyed to POV). Omitting empty *lines within* a section is the sanctioned pattern (`compile-prompt.ts:128-134`, `docs/specs/compiler-contract.md:261-265`); section tag + static rule text always remain, so §29.4 is satisfied — no FOUNDATIONS amendment.
- Coverage-widening: applies uniformly to all four POV value-lines, not just `pov_does_not_know`.
- Disposition: **ACTION — ticket `POVEMPTYLINE-001`** (compiler + `docs/specs/compiler-contract.md` §4/§8 + `docs/specs/prompt-template.md` in lockstep).

### O4 — `POV cannot perceive right now` is fed the wrong field (misframe + duplication)
- Root cause: `pov_cannot_perceive_now` wired to `current_authoritative_state.line_of_sight_and_visibility` (`front.ts:126-130`) — the same field already rendered as `Line of sight / visibility:` (`compile-prompt.ts:31`). Scene-geometry text is duplicated and misframed as a POV perception bar.
- No dedicated field exists (`generation-brief.ts:30-48`); field-guidance maps the field only to `{line_of_sight_and_visibility}` (`field-guidance-brief-config.ts:236-238`); contract names an unimplemented profile source (`docs/specs/compiler-contract.md:123`).
- Disposition: **ACTION — ticket `POVPERCEIVE-001`** (decouple + add dedicated optional authored field; correct the contract row).

## What already conforms (conformance coverage)
- Comma-join is already correct for `secret_holders`, `secret_non_holders_to_protect`, clue/reveal lines (`front.ts:241-266`); only `renderEntityReferenceList` was wrong (O2).
- Empty-line omission already correct for `<current_authoritative_state>`, `<immediate_handoff>`, `<manual_directive>`, and the composite sections; O3 extends the same pattern.
- Cast-band section omission (`<present_minor_cast>`, `<offstage_relevance>`) is the only §29.4-sanctioned section omission and is implemented correctly (`compile-prompt.ts:92-98`).
- The hard-canon feed (O1) is itself correct; only the requested omission needed a constitutional change.

## FOUNDATIONS alignment
- O2, O3 → deterministic compilation @ prompt-compilation (§8) — aligns.
- O4 → POV knowledge limits @ prompt-compilation (§15/§29.6) — aligns (removes a false perception constraint).
- O1 → §29.4 universal-section omission — tensions; resolved by the sign-off-gated §9/§29.4 amendment authored in `HARDCANONOMIT-001`.

## Deliverables (finding → ticket map)
| Finding | Ticket | Notes |
|---|---|---|
| O1 | `tickets/HARDCANONOMIT-001.md` | Includes sign-off-gated FOUNDATIONS §9 + §29.4 amendment |
| O2 | `tickets/ONSTAGEJOIN-001.md` | Fixes onstage + offstage entity-list join |
| O3 | `tickets/POVEMPTYLINE-001.md` | Omit empty value-lines in `<pov_knowledge_constraints>` |
| O4 | `tickets/POVPERCEIVE-001.md` | Decouple + dedicated `pov_cannot_perceive_now` field |

## Named assumptions
- Deliverable class is tickets (user directive), one per finding.
- Each compiler change carries its in-same-revision `docs/specs/compiler-contract.md` update (§10 change-control) and golden-test refresh.
