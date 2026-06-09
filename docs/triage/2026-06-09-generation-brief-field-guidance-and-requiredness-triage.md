# Triage — Generation Brief field guidance & requiredness (2026-06-09)

Source: user-reported confusion while authoring a real scene's Generation Brief (no formal report). Diagnostic brainstorm; the request itself was the spec. Prior-triage discovery in `docs/triage/` was performed (not excluded): the prior June-08 current-authoritative-state triage and the archived `SPEC-015-field-guidance-and-contextual-help` were checked — this work **conforms to** SPEC-015's "requiredness stays visible" doctrine and reverses no prior decision. Companion written because the triage produced ≥3 tickets.

## Question (verbatim, condensed)

Author could not distinguish `immediate_situation_summary`, `recent_causal_context`, `last_visible_moment`, `begin_after`, and `prior_accepted_prose_status_or_handoff_note`; suspected redundancy; could not tell which fields are required; and saw no required/optional visual feedback next to field names on `/generation-brief`. Asked: keep only what's needed, and if kept, make the editor info exceptional. Seek full alignment with `docs/**`.

## Findings

### O1 — `immediate_situation_summary` vs `recent_causal_context`: not redundant; guidance fails to draw the line
Current state = "what is true now" (prose-neutral snapshot); handoff causal context = "how we got here" and is *writer-visible, not automatically POV knowledge* (`docs/prompt-template.md:108`; `docs/prompt-template-rationale.md:44` calls the separation the biggest safeguard after POV/reveal locks). The user's example mixed both. The popups never state the distinction.
→ **BRIEFGUIDE-002**

### O2 — `last_visible_moment`: distinct role, but the thinnest guidance entry in the file
Its job is the concrete final image/action the prose renders from; its entry (`field-guidance-brief-config.ts:231-233`) has only a one-line `short`, no role/advice/examples.
→ **BRIEFGUIDE-002**

### O3 — `begin_after` vs `last_visible_moment`: the closest pair; descriptive image vs imperative cut-point
`docs/compiler-contract.md:114,116` treats them as an either/or for continuation readiness. They differ in function (description vs "begin prose exactly after this point"); the popups must explain why both exist.
→ **BRIEFGUIDE-002**

### O4 — `prior_accepted_prose_status_or_handoff_note`: constitutionally mandated firewall; guidance misleads toward status bookkeeping
FOUNDATIONS §10 (`docs/FOUNDATIONS.md:337`) requires this exact field as the `None`-or-user-authored-bridge replacement for the forbidden "accepted prose summary." Cannot be removed. But the popup's example pushes "Previous segment accepted" — low-value status the prose writer does not need.
→ **BRIEFGUIDE-002**

### O5 — Can any of the five fields be deleted? No. (Analysis answer — no deliverable.)
All five are enumerated in the prompt template, schema, and compiler contract, and `prior_accepted…` is named in FOUNDATIONS §10. Removal would require a FOUNDATIONS amendment + template/contract/schema/golden-test changes for marginal authoring gain. The felt redundancy is a guidance defect, not a schema defect.
→ **No ticket — analysis answer.**

### O6 — Applying it to the user's scene. (Analysis answer — no deliverable.)
For a first segment, the three handoff bridge fields are optional and `prior_accepted…` is `None`; the user's `immediate_situation_summary` should be split, moving the "intended to pass / attention captured" causal half to `recent_causal_context`.
→ **No ticket — analysis answer.**

### O7 — Requiredness has no UI-consumable source and is invisible next to fields (the second axis the user raised)
`FieldGuidance` carries no requiredness; the readiness blocker engine computes it and it surfaces only in the separate `ValidationPanel`/`ReadinessChecklist`. The hand-rolled `GenerationBriefView` never adopted the record editor's required marker (`RecordEditor.tsx:256`), violating SPEC-015's "requiredness stays visible" doctrine on this one surface. Requiredness is three-tiered and contextual per `docs/compiler-contract.md:98-116` + `docs/user-guide.md:36-38` (always / continuation / conditional / optional).
→ **BRIEFGUIDE-001** (single deterministic tier source in `@loom/core`), **BRIEFGUIDE-003** (popup surfaces the tier), **BRIEFGUIDE-004** (inline context-aware markers on the page).

## Finding → deliverable map

| Finding | Outcome |
|---|---|
| O1, O2, O3, O4 | `tickets/BRIEFGUIDE-002.md` — enrich the five fields' guidance prose + `relatedFields` cross-links |
| O5, O6 | No ticket — analysis answers (kept here for the record) |
| O7 | `tickets/BRIEFGUIDE-001.md` (core requiredness tier), `tickets/BRIEFGUIDE-003.md` (popup), `tickets/BRIEFGUIDE-004.md` (inline markers) |

Dependencies: BRIEFGUIDE-003 and -004 depend on -001; -002 is independent.

## What already conforms (coverage note)

The schema, compiler, and readiness engine are correct and aligned: the state/handoff separation, conditional-line rendering, the `None` accepted-prose firewall, and the fail-closed readiness gate all match FOUNDATIONS and the rationale. The eleven context-gated current-state lines and the non-flagged brief fields have adequate guidance prose. The record-editor surface already renders required markers. The defect set is localized to (a) the five flagged fields' guidance prose and (b) requiredness being absent from `FieldGuidance` and from the brief page.

## FOUNDATIONS alignment

- Deterministic / fail-closed validation @ readiness engine — **aligns**: the new requiredness tier is descriptive metadata mirroring `docs/compiler-contract.md`; the readiness blocker engine stays the sole gate. The inline marker is an authoring affordance and never blocks Save/Preview.
- SPEC-015 "requiredness stays visible; popovers supplement" @ brief UI — **aligns**: the work closes a gap where this one surface hid requiredness.
- §10 no accepted prose in prompts / record-first continuity @ guidance prose — **aligns**: the enriched `prior_accepted…` and `recent_causal_context` guidance reinforce the firewall.
- No §29 hard-fail tripped; no FOUNDATIONS or docs amendment required (the work conforms to the existing compiler-contract table and SPEC-015 doctrine).

## Named assumptions

1. Requiredness is added as a field on `FieldGuidance` rather than a parallel map (one registry lookup the UI already uses).
2. Inline markers are advisory and never gate Save/Preview; the `ValidationPanel` remains the authority.
3. Ticket namespace `BRIEFGUIDE-NNN` (fits the existing `BRIEF*` family; no archive collision).
