---
status: accepted
---

# SECRET is the sole reader-concealment authority; FACT.audience_visibility is not

Continuity Loom carries reader-facing knowledge boundaries as first-class continuity state:
`docs/principles/FOUNDATIONS.md` Section 15 requires the compiled prompt to keep *what the POV
knows* and *what the audience knows or does not know* as distinct lanes, and makes reader-concealment
of a POV-known truth — dramatic irony — the province of the SECRET record, which alone carries
holders, non-holders-to-protect, allowed surface cues, forbidden reveals, reveal permission,
`pov_access`, and `audience_visibility`.

Two record types expose an `audience_visibility` field: FACT and SECRET. The compiled prose prompt's
audience-knowledge block (`Audience already knows`, `Audience does not know`, `Dramatic irony allowed
now`, and the ambiguous-perception lane) is populated **only** from active SECRET records, keyed on
`SECRET.audience_visibility` and `SECRET.pov_access`. A FACT renders only among the POV-accessible
facts; its `audience_visibility` never reaches the audience-knowledge block and produces no per-fact
concealment annotation, so a `hidden` hard-canon FACT compiles byte-identically to an `explicit` one.
The FACT field's former guidance ("Do not expose this fact to the audience yet") promised a
concealment the compiler never delivered, giving an author false confidence that a critical premise
set to `hidden` was protected.

**Decision.** SECRET is the sole reader-concealment (dramatic-irony) authority.
`FACT.audience_visibility` is author metadata about how openly a fact is treated; it is **not** a
reader-concealment control and does not conceal the fact from the reader. An author who wants to hide
a POV-known premise from the reader models it as a SECRET with `pov_access: knows` (the POV keeps its
knowledge) and `audience_visibility: hidden` (the reader does not know yet), which is what populates
the compiled "Audience does not know" line. The FACT field guidance, the story-record-schema FACT
description, and the author-facing user guide are corrected to tell this truth and to route to the
SECRET model. A deterministic, non-gating advisory validation warning nudges an author who sets a
`hard_canon` (`fact_kind`) or `critical` (`salience`) FACT to `audience_visibility: hidden` toward the
SECRET model; consistent with FOUNDATIONS Section 29.5 it is a warning, never a blocker, and never
gates Preview, Generate, prompt compilation, or provider sending.

**Why this direction rather than wiring the FACT field.** Making `FACT.audience_visibility: hidden`
emit a compiled "audience does not know" instruction would blur POV knowledge with audience knowledge
— a hard-canon FACT the POV knows is, by category, POV-accessible truth — which FOUNDATIONS Section
29.6 names as a hard-fail question, and it would create a second reader-concealment authority parallel
to SECRET but without SECRET's holders/non-holders/clues/reveal-permission apparatus. Re-scoping keeps
a single reveal-concealment authority and preserves deterministic compilation (Section 29.4): the
audience-knowledge and facts rendering stay SECRET-driven and byte-unchanged, locked by a golden
compiler-contract test.

**Consequence and boundary.** Wiring `FACT.audience_visibility` into any compiled concealment
behavior is out of scope and must not be built by drift. Doing so would require a deliberate amendment
to `docs/principles/FOUNDATIONS.md` and a new ADR superseding this one *before* the change, so the
POV-versus-audience-knowledge boundary is never blurred without explicit constitutional ratification.
