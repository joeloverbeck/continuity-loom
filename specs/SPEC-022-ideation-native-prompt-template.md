# SPEC-022 — Ideation-Native Prompt Template (lean grounded ideation prompt)

Status: DRAFT
Phase: post-v1 refinement of the SPEC-021 ideation surface (not gated by the archived v1 implementation order)
Depends on: SPEC-021 (completed, archived), IDEAPROMPT-001 / IDEAPROMPT-002 / SECRETLINE-001 (completed 2026-06-12). No FOUNDATIONS amendment required: §9's universal section list and §29.4's omission hard-fail scope explicitly to the prose prompt class; assistance prompts are governed by §9.1, which mandates determinism, inspectability, validation gating, no-prose output, and quarantine — not a section list.
Governing authority: `docs/FOUNDATIONS.md`
Primary authority docs: `docs/FOUNDATIONS.md` §9.1 (assistance prompt class), §4.4 / §8 (deterministic compilation and the same-revision drift rule), §7 / §29.3 (active working set supremacy; no silent record removal or dossier compression), §26 / §26.1 (assistance output handling and mandatory provenance), §22 (prompt inspection), §28.2 / §28.3 (ordered context over dumping; record-grounded generation as context engineering)
Supporting authorities: `docs/ideation-prompt-template.md` (domain authority for the ideation template — amended by this spec), `docs/compiler-contract.md` (updated in the same change as any compiler mapping change, per §8), `docs/prompt-template.md` + `docs/prompt-template-rationale.md` (prose-template authorities — untouched), `docs/story-record-schema.md` (record taxonomy the operator table maps onto)

> Section style note: this file uses the canonical `specs/` section set
> (Problem Statement / Approach / Deliverables / FOUNDATIONS Alignment /
> Verification / Out of Scope / Risks & Open Questions) that the `reassess-spec`
> and `spec-to-tickets` skills parse.

## Brainstorm Context

- **Original request (2026-06-12):** the compiled production ideation prompt
  (`reports/example-ideate-prompt.md`, `red-bunny` project) "inherits virtually
  all infrastructure from the original LLM prose writer prompt. There is massive
  repetition of events, beliefs, facts, etc." Research what works better for
  LLM ideation; keep the character dossiers as generated now ("to ground the
  ideas offered in genuine character specificities"); create work items aligned
  with `docs/**`; foundational amendments if warranted. User confirmed via
  question round: Approach A (ideation-native template), short deterministic
  citation keys, spec-first deliverable.
- **Prior decision records (reversal check):**
  - `triage/2026-06-12-ideation-prompt-issues-triage.md` (same day, same
    surface): O1–O4 settled line-level fixes. This spec is the structural
    delta; it does not reopen O1 (secrets empty-line hygiene), O3 (trimmed
    ideation contradiction prohibitions), or O4 (dormancy logic conforms).
  - **IDEAPROMPT-001** (completed 2026-06-12) chose full-display-label
    citation keys to fix truncated, unmatchable keys. This spec **supersedes
    that mechanism** with short deterministic IDs while preserving its goal
    (unambiguous, server-verifiable keys). The user explicitly confirmed this
    reversal on 2026-06-12.
  - `archive/specs/prompt-duplication-verdict-and-spec.md` ruled dual-frame
    duplication net-positive and rejected pointer-only cross-references —
    **for the prose prompt**, before the ideation prompt existed (its evidence
    ledger contains no ideation files). Its rationale (priming voice and
    physical continuity *for prose rendering*) does not transfer to a
    consultant output of ~5 one-line premise ideas. This spec narrows nothing
    in that verdict; the prose prompt is untouched.
- **External research consulted (2026-06-12 pass; primary sources):** focused
  context beats exhaustive context (Chroma "Context Rot", 2025 — a focused
  ~300-token prompt outperformed the full ~113k-token prompt across model
  families); reasoning degrades from the low thousands of tokens (Levy et al.,
  arXiv 2402.14848) and semantic context use decays sharply past ~8–32k
  (NoLiMa, arXiv 2502.05167); irrelevant context measurably hurts (Shi et al.,
  arXiv 2302.00093); no literature supports duplicating *data* blocks — the
  only evidenced repetition is restating the short *task instruction* (RE2,
  arXiv 2309.06275); LLM idea pools homogenize by default and explicit
  mutual-distinctness constraints raise variance (Anderson et al., arXiv
  2402.01536; Si et al., arXiv 2409.04109; Meincke et al., arXiv 2402.01727);
  Anthropic context-engineering guidance: smallest set of high-signal tokens,
  data at top, instructions at the end. Tool note: web search ran via direct
  fetch of arXiv/Anthropic/OpenAI/Chroma sources after `mgrep --web` quota
  exhaustion; all fetches succeeded.
- **Premise verification (all verified first-hand against the working tree, 2026-06-12):**
  - `packages/core/src/compiler/template-constants.ts:34-61` —
    `IDEATION_SECTION_ORDER` reuses 21 prose sections incl.
    `active_working_set` (line 45) and `authority_hierarchy` (line 35).
  - `packages/core/src/compiler/template-constants.ts:106-122` — shared
    `authority_hierarchy` template; line 110: "This role and output contract:
    prose only, no commentary or record updates."
  - `packages/core/src/compiler/template-constants.ts:205-229` —
    `active_working_set` template (pressure lanes incl.
    `{relationship_emotion_pressure}` and voice pressure pins).
  - `packages/core/src/compiler/template-constants.ts:408+` —
    `IDEATION_SECTION_TEMPLATES` (`ideation_contradiction_prohibitions`,
    `ideation_role`, …).
  - `packages/core/src/compiler/ideation/citation-keys.ts:4-41` — keys are
    `[TYPE: full display label]` via `recordLabel` → `displayLabel`
    (`packages/core/src/compiler/labels.ts:4-6`), deterministic sort + collision
    suffix in `citationKeysFor`.
  - `packages/core/src/compiler/sections/ideation.ts:17-24` — slot `Grounds:`
    joins full citation keys.
  - `packages/core/src/compiler/compile-prompt.ts:116-127` — ideation render
    path; `:59` "Begin prose exactly after this point" handoff label; `:67`
    "Must render" directive label; `:221` handoff trailer ("Do not recap except
    through brief POV-colored perception or pressure").
  - `packages/server/src/ideate-routes.ts:65-66` +
    `packages/server/src/ideation-parse.ts:81` — server recomputes
    `citationKeysFor` and flags `unknownCitations`.
  - `packages/web/src/ideate/SlateCard.tsx:21` — UI renders raw `grounds`
    strings.
  - Goldens: `packages/core/test/compiler-ideation-golden.test.ts`,
    `packages/core/test/golden-ideation.prompt.txt`.
  - Measured duplication in the example prompt (~125 KB ≈ ~31k tokens):
    `<active_working_set>` ≈ 31.6 KB (~25%), slot `Grounds:` ≈ 11.7 KB (~9%),
    plus `<physical_continuity>` re-rendering location/object descriptions
    already in `<locations_objects_affordances>`.
- **Scope decisions:**
  - Cast dossiers (`active_cast_full_dossiers`) are kept byte-identical —
    content and section framing — per the user's explicit requirement.
  - `pov_knowledge_constraints` keeps its fact/belief restatements: the
    section's *function* (the knowledge boundary) differs from the record
    sections' function (record authority), which is the duplication-verdict's
    own legitimacy test, and the cost is small (~0.5k tokens).
  - The prose prompt, the ideation request shape (`mode`, `count`,
    `dormantSlot`, `avoidList`), slot assignment, operator taxonomy, and
    validation gating are all unchanged.

## Problem Statement

The ideation prompt reuses 21 of the prose prompt's 28 sections, replacing the
prose-only launch/output sections with five ideation-specific sections,
compiled by the same renderers. For a real mid-story project this
yields a ~31k-token prompt in which most records render two to four times and
several instructions contradict the ideation contract:

1. **Structural duplication.** `<active_working_set>` (~25% of the prompt) is
   a salience précis duplicating the detail sections. Its prose-side rationale
   — priming pressure and voice *before long dossiers so prose rendering keeps
   them in working memory* — does not apply to a consultant emitting ~5
   one-line premise ideas whose instructions already sit at the prompt's end.
   `<physical_continuity>` re-renders every location/object description
   already present in `<locations_objects_affordances>`.
2. **Citation-key reprint.** Keys are `[TYPE: full display label]`, so slot
   `Grounds:` reprint full record text a third time (~3k tokens in the
   example; one slot cites ~24 full records), and the model must echo those
   multi-hundred-character keys back verbatim in every `grounds:` line —
   inviting transcription drift that the server then flags as unknown
   citations.
3. **Contract contradictions.** `<authority_hierarchy>` item 2 commands
   "prose only" while `<ideation_role>` commands "Do not write prose";
   `<immediate_handoff>` says "Begin prose exactly after this point";
   `<manual_directive>` says "Must render:"; the working-set voice pins are
   framed for "dialogue, POV narration … turn-taking". These are conflicting
   instructions, not just wasted tokens.

Research (Brainstorm Context above) is unambiguous that this hurts the
ideation task: focused beats exhaustive, duplication of data blocks has no
supporting evidence and behaves as distractor mass, and degradation is already
material at this token range. FOUNDATIONS §28.2 ("ordered context", no
dumping) and §28.3 (record-grounded generation as context engineering) point
the same direction.

## Approach

Make the ideation prompt **ideation-native**: every selected record's full
keyed dossier renders once, carrying a short deterministic citation key at that
single render site (the slim `<physical_continuity>` status lines and
`<pov_knowledge_constraints>` knowledge boundary are sanctioned functional
surfaces, not duplicative dossiers); prose-contract residue is replaced by
ideation-framed variants; the
diversity requirement gets an evidence-backed mutual-distinctness instruction.
Compilation stays a deterministic renderer (§8): no LLM involvement, no
selection changes, no silent dropping or compression of any selected record.

### A. Short deterministic citation keys

- Key format: `[<TYPE>-<n>]` (e.g. `[BELIEF-2]`, `[VISIBLE AFFORDANCE-1]`),
  where `<TYPE>` is the record-type label already used in keys today and
  `<n>` is the record's 1-based ordinal under the existing deterministic
  ordering in `citationKeysFor` (type, then full display label, then id).
  Identical selected set ⇒ identical keys; no collision suffixes needed.
- `citationKeysFor` remains the single source for compile-time rendering and
  server-side verification (`ideate-routes.ts` / `ideation-parse.ts` continue
  to work unchanged in shape).
- Slot `Grounds:` lines cite keys only: `Grounds: [BELIEF-1], [EVENT-3]`.
- **Keyed single render site per record.** Each record type eligible to ground
  any operator renders its key inline, once, at its authoritative section:
  PLAN/INTENTION → `<active_plans_and_intentions>`; CLOCK → `<active_clocks>`;
  OBLIGATION/CONSEQUENCE → `<active_obligations_and_consequences>`;
  OPEN THREAD → `<active_open_threads>`; FACT/BELIEF/EVENT →
  `<relevant_facts_beliefs_events>`; LOCATION/OBJECT/VISIBLE AFFORDANCE →
  `<locations_objects_affordances>`; SECRET →
  `<secrets_and_reveal_constraints>`; RELATIONSHIP → the new relationship
  section (B below; RELATIONSHIP keyed there, EMOTION rendered there unkeyed —
  EMOTION grounds no operator). The compiler contract gains a per-type
  key-render-site table; key prefixes appear only in the ideation prompt (prose
  rendering is unchanged).
- **Every operator-eligible record must render, keyed, at exactly one inline
  site regardless of status.** Today the `locations`/`objects` sub-blocks of
  `<locations_objects_affordances>` are status-gated (they render only `active`
  / `available` records), while `reincorporate_dormant` and `close_escape_route`
  can ground a LOCATION (`inactive` / `destroyed` / `inaccessible`) or OBJECT
  (`lost` / `destroyed` / `transferred` / `inactive`) that those sub-blocks
  would skip — leaving today's full-label key self-describing but a short
  `[OBJECT-n]` keyed at no site. For the ideation prompt the `locations` /
  `objects` sub-blocks therefore **drop the active-status gate** so every
  selected LOCATION/OBJECT record renders keyed there (status shown as a label);
  the slim `<physical_continuity>` keeps only unkeyed status lines. This
  guarantees no `Grounds:` key cites a record rendered nowhere — the exact
  failure this spec eliminates. The prose prompt's status gating is unchanged.
- **UI provenance.** `SlateCard` (and keepers) resolve returned keys to full
  record labels for display, using the same deterministic key map the server
  already computes — short keys in the prompt, human-readable provenance in
  the UI (§26.1).

### B. Ideation section order: drop the précis, keep every authority

New `IDEATION_SECTION_ORDER`:

1. `<ideation_role>` — moved verbatim to the top as the task frame (single
   render, no repetition). The remaining instructional sections
   (`<ideation_quality>`, `<ideation_output_format>`) stay at the end, so the
   task framing brackets the records: role up front, output rules last.
2. `<authority_hierarchy>` from a new `ideation_authority_hierarchy` template
   (C below).
3. `<content_policy>` (ideation-framed trailer, C below).
4. `<story_contract>`
5. `<hard_canon>` (conditional, as today)
6. `<current_authoritative_state>`
7. `<immediate_handoff>` (ideation-framed labels/trailer, C below)
8. `<manual_directive>` (conditional; ideation-framed, C below)
9. `<pov_knowledge_constraints>`
10. `<audience_knowledge>`
11. `<secrets_and_reveal_constraints>` (keyed)
12. `<active_plans_and_intentions>` (keyed)
13. `<active_clocks>` (keyed)
14. `<active_obligations_and_consequences>` (keyed)
15. `<active_open_threads>` (keyed)
16. `<relationship_and_emotion_pressure>` — **new ideation section** rendering
    both RELATIONSHIP **and EMOTION** records — the full set currently surfaced
    only via the working set's `{relationship_emotion_pressure}` lane (which
    resolves `["RELATIONSHIP", "EMOTION"]`). RELATIONSHIP lines carry citation
    keys; EMOTION lines do not (EMOTION grounds no operator). Without this,
    dropping `<active_working_set>` would orphan both types — the Relationship
    Reversal operator's grounds would cite RELATIONSHIP records rendered
    nowhere, and EMOTION records would vanish entirely — a silent removal of
    selected records (§29.3 hard fail).
17. `<active_cast_full_dossiers>` — byte-identical to today.
18. `<present_minor_cast>` (conditional, as today)
19. `<offstage_relevance>` (conditional, as today)
20. `<relevant_facts_beliefs_events>` (keyed)
21. `<locations_objects_affordances>` (keyed)
22. `<physical_continuity>` from a slim ideation variant: time, location,
    statuses, routes/exits, and entity/object **status lines only** — no
    re-render of location/object descriptions already keyed in section 21.
23. `<contradiction_prohibitions>` (ideation template, unchanged from
    IDEAPROMPT-002)
24. `<ideation_slots>` (keys-only grounds)
25. `<ideation_quality>` (distinctness addition, D below)
26. `<ideation_output_format>`

`<active_working_set>` (including voice pressure pins) leaves the ideation
order entirely. Every record it summarized still renders at its authoritative
section; nothing leaves the selection. The prose `SECTION_ORDER` is untouched.

### C. Ideation-framed variants for prose-contract residue

New ideation-framed variants (deterministic text). Only
`ideation_authority_hierarchy` is a clean static `IDEATION_SECTION_TEMPLATES`
swap. The other variants are **not** static templates and must not be added as
plain `IDEATION_SECTION_TEMPLATES` entries: `<content_policy>` carries
placeholders (`{rating_label}`, …) and must route through `renderTemplate` (the
static-ideation render path returns templates raw, so a plain entry would emit a
literal `{rating_label}`); `<immediate_handoff>`, `<manual_directive>`, and the
slim `<physical_continuity>` are function-rendered (`renderImmediateHandoffSection`,
`renderManualDirectiveSection`, `renderPhysicalContinuity`) and need a
promptKind flag threaded into those renderers (`renderSection` already passes a
prose/ideation boolean its renderers can extend). The variants are:

- `ideation_authority_hierarchy`: item 2 becomes "This role and output
  contract: premise-level ideas or questions only, no prose, no record
  updates."; item 5 frames the manual directive as authored context for what
  the next segment must render (ideas must not contradict it); the voice-pin
  and prose-craft references drop from items 8–9; closing line becomes "Do not
  mention this hierarchy in the output."
- `<content_policy>`: the shared placeholder block is kept; the static trailer
  sentences that say "into the prose" are rendered for ideation with
  output-neutral phrasing ("into the output").
- `<immediate_handoff>` ideation labels: "Begin prose exactly after this
  point" → "The next prose segment will begin after this point"; the trailer
  becomes ideation-appropriate ("Use this handoff only as user-authored
  continuity context. Ideas must continue from this point; do not treat
  archived prose as canon."). The recent-causal-context and last-visible-moment
  content is unchanged.
- `<manual_directive>` ideation label: "Must render" → "The author's directive
  for the next segment (binding context: ideas must be compatible with it)".
- All variant text is enumerated in `docs/ideation-prompt-template.md` and the
  compiler contract in the same revision (§8 drift rule).

### D. Evidence-backed distinctness instruction

`<ideation_quality>` gains one instruction block: ideas must be mutually
distinct — no two ideas may share the same dominant pressure source or the
same dramatic move; each idea should differ from the others along at least one
named axis (who acts, which pressure fires, what changes durably). This is the
homogenization counter-measure the diversity literature supports; the existing
eventfulness rubric, reveal-permission rules, and SKIPPED rule are unchanged.

## Deliverables

Each numbered deliverable is one reviewable diff; each carries its
`docs/ideation-prompt-template.md` + `docs/compiler-contract.md` updates and
golden refresh in the same revision.

1. **D1 — Short citation keys end to end.** `citation-keys.ts` emits
   `[<TYPE>-<n>]` keys (ordering preserved); keyed inline rendering at each
   record's single render site for the ideation prompt only; slot grounds emit
   keys only; server verification unchanged in shape; web UI resolves keys to
   record labels for grounds display (SlateCard + keepers); golden + unit +
   parse + UI tests updated.
2. **D2 — Ideation section order restructure.** Drop `active_working_set`
   from `IDEATION_SECTION_ORDER`; add the
   `<relationship_and_emotion_pressure>` ideation section rendering RELATIONSHIP
   (keyed) and EMOTION (unkeyed) records; move `<ideation_role>` verbatim to the
   top (single render, no repetition); slim `<physical_continuity>` ideation
   variant (status lines only); drop the active-status gate on the ideation
   `locations`/`objects` sub-blocks so every selected LOCATION/OBJECT renders
   keyed; golden refresh.
3. **D3 — Ideation-framed variants.** `ideation_authority_hierarchy`,
   content-policy trailer phrasing, handoff labels/trailer, directive label;
   golden refresh.
4. **D4 — Distinctness instruction.** The `<ideation_quality>` addition;
   golden refresh.

Suggested decomposition: D1 and D2 are independent tickets; D3 and D4 are
small and may be one ticket; `spec-to-tickets` decides final boundaries.

## FOUNDATIONS Alignment

| Principle | Stance | Rationale |
|---|---|---|
| §9.1 assistance prompt class @ prompt-compilation | aligns | Still deterministic, inspectable before send, validation-gated, never prose, output quarantined; identical inputs ⇒ identical prompt (key ordinals derive from the deterministic key sort). |
| §29.4 universal-section omission hard-fail @ prompt-compilation | aligns (N/A by scope) | The hard-fail scopes to "(prose prompts)"; the prose `SECTION_ORDER` and templates are untouched. The ideation section list is governed by `docs/ideation-prompt-template.md`, amended in lockstep. |
| §8 deterministic compilation + drift rule @ prompt-compilation | aligns | No LLM selection/summarization; every placeholder/variant/key-site change updates the compiler contract and template doc in the same revision. |
| §7 / §29.3 active working set supremacy @ selection | aligns | Dropping the *précis section* removes no selected record: each record keeps an authoritative render site. The new relationship section renders RELATIONSHIP **and EMOTION** records (the full `{relationship_emotion_pressure}` lane) precisely to prevent orphaning them; non-active LOCATION/OBJECT keep a keyed site because the ideation `locations`/`objects` sub-blocks drop the active-status gate. Cast dossiers are byte-identical (no silent compression). |
| §26.1 provenance @ assistance UI | aligns | Grounds keys resolve to full record labels in the Ideate view; provenance is more readable than today's raw bracketed labels. |
| §28.2 / §28.3 ordered context, no dumping @ prompt-compilation | aligns | This spec is the affirmative application: high-signal tokens once, task instructions at the edges. |
| §22 prompt inspection @ UI | aligns | The compiled ideation prompt remains fully inspectable before send; keys are visible inline next to the records they name. |

No §29 hard-fail question answers "yes". No FOUNDATIONS amendment is required.

## Verification

- `npm run lint`, `npm run typecheck`, `npm test` all pass.
- `compiler-ideation-golden.test.ts`: byte-for-byte golden refresh; assertions
  that the ideation prompt contains no `<active_working_set>`, no "prose only"
  authority line, no "Begin prose exactly after this point", no "Must render",
  exactly one keyed render of a sampled BELIEF and RELATIONSHIP record, exactly
  one *keyed* render of a sampled LOCATION record (it also appears as an unkeyed
  status line in the slim `<physical_continuity>`), and keyed grounds of the
  form `[BELIEF-1]`.
- Citation coverage invariant: every citation key appearing in any slot's
  `Grounds:` is rendered inline exactly once elsewhere in the compiled ideation
  prompt — guards against a key cited with no render site (including a non-active
  LOCATION/OBJECT grounded by `reincorporate_dormant` or `close_escape_route`).
- Determinism: two compiles from identical inputs produce identical prompts
  and identical key maps; permuting record insertion order does not change
  keys (sort-stability test).
- Server round-trip: `parseIdeationResponse` accepts short keys; unknown-key
  flagging still fires for fabricated keys.
- Web: SlateCard test renders resolved labels for known keys and a marked
  fallback for unknown keys.
- Prose regression: `compiler-golden.test.ts` (prose golden) byte-identical —
  proves the prose prompt is untouched.
- Manual: compile the `red-bunny` ideation prompt before/after; confirm the
  token reduction (~40% expected) and that the dossier block is byte-identical.

## Out of Scope

- Any change to the prose prompt, its section order, templates, or the
  prompt-duplication verdict's dual-framing doctrine for prose.
- Any change to cast dossier rendering (content or framing) in either prompt.
- Any change to record selection, slot assignment, operator taxonomy,
  dormancy logic, request shape, validation gating, or the quarantine rules.
- De-duplicating `pov_knowledge_constraints` (retained as a
  knowledge-boundary surface; see Scope decisions).
- FOUNDATIONS amendments.

## Risks & Open Questions

- **Key echo fidelity.** Short keys are easier to echo than full labels, but
  a model may still mangle brackets; the existing unknown-citation flagging is
  the containment, and `<ideation_output_format>` already shows the exact
  expected shape. Low risk.
- **Ordinal stability across edits.** Keys are per-compile: editing the
  selection between compiles renumbers ordinals. This matches today's behavior
  (full-label keys also change when records are edited) and grounds are only
  verified against the same compile's snapshot; the UI resolves against the
  same map. No cross-session key identity is promised — document this in the
  template doc.
- **Relationship section novelty.** `<relationship_and_emotion_pressure>` is
  a new ideation-only section; its renderer should reuse the existing
  `{relationship_emotion_pressure}` resolver output (plus key prefixes) rather
  than introduce a second derivation of relationship pressure. Implementation
  detail for the ticket, flagged here so it isn't re-derived.
- **Dossier framing residue.** The dossier section's instructional preamble
  retains prose-flavored phrasing ("do not narrate non-POV thoughts...") by
  deliberate scope decision (user directive to keep dossiers as generated).
  Harmless for ideation; revisit only if observed to leak prose into ideas.
