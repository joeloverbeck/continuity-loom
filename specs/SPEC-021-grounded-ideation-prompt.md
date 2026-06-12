# SPEC-021 — Grounded Ideation Prompt ("What could happen next?")

Status: DRAFT
Phase: post-v1 feature (idea 1 of `brainstorming/2026-06-10-post-v1-feature-brainstorm.md`; not gated by the archived v1 implementation order)
Depends on: FOUNDATIONS amendments A1 + A2 (proposed below, sign-off-gated; must land in the same revision as the dependent code change per FOUNDATIONS §1.1)
Governing authority: `docs/FOUNDATIONS.md`
Primary authority docs: `docs/FOUNDATIONS.md` §9 (universal prose prompt contract — amended by A1), §11 / §29.5 (blocker taxonomy item 7 and the "alternate options" rows — scoped by A1), §26 (optional LLM assistance — extended by A2), §4.4 / §8 (deterministic compilation), §4.5 / §11 (fail closed), §22 (prompt inspection and audit boundaries), §23 (OpenRouter and secrets), §12 / §4.2 (no branches, no plot rails), §10 / §28.8 (anti-contamination)
Supporting authorities: `docs/compiler-contract.md` (must be updated in the same change as any compiler mapping addition, per §8), `docs/prompt-template.md` + `docs/prompt-template-rationale.md` (prose-template authorities; the ideation template gets its own doc), `docs/story-record-schema.md` (record taxonomy the operator table maps onto), `brainstorming/2026-06-10-post-v1-feature-brainstorm.md` (idea 1 design sketch and amendment list)

> Section style note: this file uses the canonical `specs/` section set
> (Problem Statement / Approach / Deliverables / FOUNDATIONS Alignment /
> Verification / Out of Scope / Risks & Open Questions) that the `reassess-spec`
> and `spec-to-tickets` skills parse.

## Brainstorm Context

- **Original request:** Design the implementation of the brainstorming doc's idea 1
  (Grounded Ideation Prompt), with in-depth external research on similar
  implementations, research papers, narrative theory, and prompt engineering for
  ideation-class LLM calls. Stated goal: the external LLM produces distinct
  "things that could happen next" that are compelling, fit the generation brief
  fields and the story records involved, and reflect what research says makes an
  interesting story development. Stated worries: (1) interface placement,
  (2) the ideation prompt needing a very different design from the prose prompt,
  (3) FOUNDATIONS alignment, with amendments if necessary. Deliverable: this spec.
- **Prior decision records:** No prior triage of this surface exists (grep over
  `triage/`, `tickets/`, and `archive/specs/` for ideation returned nothing). The
  brainstorming doc is the only prior record; this spec implements its idea 1 and
  its amendments A1 + A2 as written there, reversing nothing.
- **External research consulted (summary, two passes 2026-06-12):**
  - *Divergent-ideation prompt engineering:* assigning each idea slot a distinct
    categorical axis before generation beats "make them different" (Luminate,
    CHI 2024, arXiv 2310.12953; Wharton "Prompting Diverse Ideas", arXiv 2402.01727);
    resampling one prompt mostly redraws duplicates (~5% unique of 4,000 samples,
    arXiv 2409.04109) and temperature is a weak diversity lever (arXiv 2405.00492),
    so diversity must live in prompt structure — one call with slots, not N calls;
    closed-context record-ID citation is reliable when each record carries a stable
    key and the model must paraphrase why the cited records support the idea
    (Anthropic context guidance; arXiv 2408.04568), and cited keys are
    server-verifiable deterministically; shallow structured output (flat tagged
    blocks, schema shown, "malformed output is discarded") is safe for creative
    tasks (dottxt rebuttal to arXiv 2408.02442; SillyTavern "Choices!" field
    practice), nested JSON is not; the prose-writer frame must be suspended
    entirely (every surveyed tool/prototype builds ideation as its own prompt
    regime: Sudowrite Brainstorm, Dramatron, Wordcraft, Choices!).
  - *Narrative theory and competitors:* a 13-operator "what could happen next"
    taxonomy consolidates from structural-affect theory (Brewer & Lichtenstein),
    suspense/surprise economics (Ely–Frankel–Kamenica, JPE 2015), Dramatis
    escape-route suspense (AAAI 2014), try/fail cycles (yes-but / no-and),
    reincorporation (Johnstone; LLMs demonstrably fail to reincorporate dormant
    material unprompted — arXiv 2601.07033), and decades of solo-RPG oracle
    practice (Mythic GME event-focus tables, Ironsworn plot-twist tables) that
    independently converged on *target record × abstract move, human interprets*.
    Schmid's eventfulness criteria (relevance, unpredictability, persistence,
    irreversibility, non-iterativity) serve as an in-prompt quality rubric.
    Curation UX: 3–6 ideas is the evidence-backed slate size; reveal cards
    together (streaming the first anchors fixation); Sudowrite's "Keepers" list is
    the most-copied triage pattern; per-slot regenerate exists in no competitor;
    passive consumption of ideas measurably hinders ideation, so no auto-insertion
    anywhere. No direct competitor grounds ideation in deterministic typed state
    with citations — this is the documented open quadrant.
- **Premise verification (code, read directly):**
  - `packages/core/src/compiler/compile-prompt.ts:79` — `compilePrompt(snapshot:
    ValidationSnapshot)` is the single entry point; the header
    `"# Generated Prose Prompt"` is hardcoded at line 95.
  - `packages/core/src/compiler/template-constants.ts:1` — `SECTION_ORDER` is one
    frozen 28-section array ending `…, "contradiction_prohibitions",
    "prose_craft", "stop_rule", "final_output_instruction"`; the prose-only
    section templates sit at lines 331–372.
  - `packages/core/src/compiler/sections/pressure.ts:3,153` — record rendering
    already goes through `displayLabel(record)` / `resolveRecordLabel`, so stable
    human-readable citation keys have an existing deterministic foundation.
  - `packages/core/src/records/generation-brief.ts:173` — `GenerationSession` is
    a zod-inferred type; no `promptKind` field exists anywhere in `packages/`
    (repo-wide grep: zero hits), so the new field is a clean addition.
  - `packages/core/src/validation/rules/index.ts:15` — `validationRules` is one
    frozen rule array; severity is decided inside each rule.
    `packages/core/src/validation/readiness.ts:51–53, 208–211` — readiness
    computes `canPreview`/`canGenerate` from the blocker list with no
    prompt-kind dimension.
  - `packages/server/src/compile-routes.ts:8` (`POST /api/compile`) and
    `packages/server/src/generate-routes.ts:10` (`POST /api/generate`) are the
    existing endpoints; `packages/server/src/settings.ts:13` —
    `OpenRouterSettings { model, temperature, … }` is a global singleton;
    OpenRouter client lives under `packages/server/src/openrouter/`.
  - `packages/web/src/generate/GenerateView.tsx`,
    `packages/web/src/readiness/ReadinessChecklist.tsx`,
    `packages/web/src/prompt/PromptInspector.tsx`, and
    `packages/web/src/shell/AppShell.tsx` (navigation) exist as the reusable UI
    surfaces; routing is React Router (`packages/web/src/App.tsx:2`).
  - `packages/core/test/compiler-golden.test.ts` +
    `golden-first-segment.prompt.txt` are the byte-frozen golden pattern;
    `packages/core/test/boundary.test.ts` enforces core purity.
  - `packages/core/src/version.ts` — current versions: templates `1.0.0`,
    compiler `1.2.0`, contract `1.3.0` (note: `docs/ACTIVE-DOCS.md`'s version
    note still says contract `1.2.0`; `version.ts` is the declared source of
    truth — the registry note should be refreshed in this spec's doc deliverable).
- **Scope decisions (user-confirmed during the brainstorm):**
  - v1 includes all four optional capabilities: the question sub-mode, the
    dormant-record slot, per-slot regenerate, and a session-scoped keepers list.
  - UI placement: a dedicated sibling **Ideate** view alongside Generate (same
    working set + brief + readiness model with a relaxed gate), linked from the
    Generation Brief page; chosen over a brief-page dock or a Generate-view mode
    toggle for clearest surface quarantine (§6/§27).
  - Amendment scope: **A1 + A2 together** — the second sanctioned prompt class
    plus the codified shared rules for all future assistance surfaces.
- **Named assumptions carried into this spec:** (1) relaxed-but-fail-closed
  validation gate (hard contradictions and config/policy blockers still block
  ideation; prose-launch blockers do not apply); (2) the global OpenRouter model
  setting is reused — per-purpose model slots (brainstorming doc amendment A3)
  stay deferred; (3) operator slots are compiler-assigned deterministically from
  the selected record types — no user operator-picking in v1; (4) ideas are
  copyable by hand but never one-click inserted into records or brief fields.
- **Final confidence:** 95% after a three-question interview (scope, placement,
  amendment breadth).

## Problem Statement

The core loop has a documented friction moment the app does not serve: the author
is "at the edge of progressing but not sure what could happen," upstream of the
manual directive they must write before generation can run. The market's ideation
tools are either ungrounded (Sudowrite Brainstorm cannot see story-bible state)
or unstructured (NovelCrafter chat outputs freeform conversation); research shows
ungrounded brainstorm output is precisely what professional writers find "not
interesting enough to be useful" (Wordcraft), while AI-contributed *ideas* —
unlike AI-contributed *text* — preserve authorial ownership (CoAuthor). Continuity
Loom already owns the unfair advantage: typed pressure records from which
distinct causal mechanisms can be enumerated, and a deterministic compiler that
can assign them.

The blocker is constitutional, not technical. FOUNDATIONS §9 mandates "one
universal prose prompt template in v1"; §11's blocker taxonomy item 7 and the
§29.5 checklist block any prompt that asks the model to "produce alternatives" —
rules written to keep the *prose writer* local, which an ideation prompt is not
(its output is never prose). A feature that conflicts with FOUNDATIONS is wrong
unless FOUNDATIONS is deliberately amended first (§1), so this spec leads with
two explicitly worded amendments (A1 required, A2 codifying the assistance lane
§26 already authorizes) and gates all implementation on their sign-off.

Considered and rejected during the brainstorm: a brief-page dock and a
Generate-view mode toggle for placement (blur the surface quarantine §6/§27);
LLM-chosen idea mechanisms (research shows slot assignment must precede
generation, and §4.4 demands the compiler decide deterministically); N sampled
calls instead of one slotted call (duplication plateau, token cost); nested-JSON
output (creative-reasoning degradation risk); push-based ideation (rejected by
name in the brainstorming doc — pull-based only).

## Approach

### A. FOUNDATIONS amendments (sign-off-gated; land with the first dependent code change)

> **PROPOSED CONSTITUTIONAL WORDING — requires explicit user sign-off on this
> exact text before any implementation ticket begins. Per §1.1, the
> `docs/FOUNDATIONS.md` edit lands in the same revision as the first code change
> that depends on it, never standalone, and updates §29 in the same amendment.**

**A1 — second sanctioned prompt class.** In §9, after the opening sentence
("Continuity Loom uses one universal prose prompt template in v1."), insert:

> v1 also recognizes exactly one additional prompt class: the **assistance
> prompt** (§9.1). The universal-section list below, the local-prose stop rule,
> and every rule in this document that addresses "the prompt" in the context of
> prose generation govern the prose prompt class. Assistance prompts are governed
> by §9.1 and §26.
>
> ### 9.1 Assistance prompt class
>
> An assistance prompt is a deterministic, inspectable prompt compiled from the
> same authority sources as the prose prompt (story configuration, active working
> set, generation-time fields) whose output is never story text. Assistance
> prompts must:
>
> - compile deterministically: identical story configuration, active working
>   set, generation-time fields, assistance-request inputs (e.g. mode, slot
>   count, slot selection, avoid-list), template version, and compiler version
>   must produce an identical prompt;
> - be inspectable before sending, under the same audit boundaries as §22;
> - be gated by deterministic validation: hard contradictions, impossible
>   state, and unsafe provider/policy configuration block assistance compilation
>   and sending exactly as they block prose generation; prose-launch readiness
>   requirements (e.g. the manual directive) apply only where the assistance
>   purpose needs them;
> - never produce story prose, and never be used to request story prose;
> - never have their output enter any prose prompt, story record, or
>   generation-time field automatically (§26 assistance-output rules).
>
> The local-prose stop rule and the prohibition on requesting alternatives,
> plans, or summaries (§4.6, §11 item 7, §19, §29.5) scope to the prose prompt
> class; an assistance prompt may request non-prose alternatives such as
> premise-level ideas or questions, because no prose writer is being asked to
> branch the story.

In §11, blocker taxonomy item 7, append the parenthetical: "(this condition
scopes to prose prompts; a sanctioned §9.1 assistance prompt may request
non-prose alternatives)". In §19, after "The prompt must not ask for alternate
options, future summaries, downstream consequences, chapter packages, or global
continuation plans.", append: "(this scopes to the prose prompt class; a
sanctioned §9.1 assistance prompt may request non-prose alternatives)" — §19's
bare subject "The prompt" would otherwise read as a blanket ban contradicting
§9.1. §4.6's parallel prohibition is already scoped by its explicit subject
("the external prose writer"), but the §9.1 cross-reference above makes the
scoping unambiguous. In §29.4, the universal-contract-sections row gains
"(prose prompts)" after "universal prompt contract sections". In §29.5, the
"alternate options" row gains "(in a prose prompt or its directive/stop
guidance)".

**A2 — assistance-output handling.** Append to §26:

> ### 26.1 Assistance-output handling
>
> All LLM-assistance surfaces, present and future, obey these shared rules:
>
> - assistance is invoked opt-in, per invocation, pull-based — never
>   background-automatic and never push-based;
> - assistance output is quarantined: it is rendered in a clearly labeled
>   non-canonical surface, is not a story record, not a generation-time field,
>   and not prompt context for prose generation;
> - provenance is mandatory: assistance output must show what records or fields
>   it derives from;
> - rejected or cleared assistance output leaves no residue in the project
>   store, the active working set, or any prompt;
> - assistance output is ephemeral by default and is never logged or archived
>   by default (mirroring §22); a user may keep items in a session-scoped
>   scratch surface, which still obeys every rule above;
> - within a single assistance surface, current ephemeral output may
>   parameterize a follow-up assistance request (e.g. an avoid-duplicates list
>   for regenerating one idea) as explicit, inspectable request input; it must
>   never parameterize prose generation.

In §29.2, add one hard-fail question: "Does it let assistance output enter a
prose prompt, a story record, or a generation-time field without explicit
per-item user action?"

### B. Core: a second deterministic prompt kind (`@loom/core`)

- Add `promptKind: "prose" | "ideation"` to the compile entry surface
  (snapshot or an explicit compile parameter; default `"prose"` so every
  existing caller and test is untouched). Add an `ideationRequest` input
  carrying: `mode: "ideas" | "questions"`, `count` (3–6, default 5),
  `dormantSlot: boolean` (default true), and an optional `avoidList` of
  current-slate headlines for per-slot regeneration (deterministic input,
  rendered in a clearly labeled section).
- **Ideation section order** (new frozen array beside `SECTION_ORDER`): reuse the
  shared front/state/knowledge/records renderers unchanged — authority
  hierarchy, content policy, story contract, hard canon, current authoritative
  state, immediate handoff (empty-state allowed), manual directive (rendered
  only when present, labeled as optional author intent), POV knowledge,
  audience knowledge, secrets and reveal constraints, active working set, cast
  sections (unchanged rendering — no new compression machinery), pressure
  sections, facts/beliefs/events, locations/objects/affordances, physical
  continuity, contradiction prohibitions. Replace the prose-specific sections
  (`role`, `prose_mode`, `prose_craft`, `stop_rule`, `final_output_instruction`,
  invention permissions) with four new ideation sections:
  1. `ideation_role` — story-development consultant frame; suspends the prose
     writer entirely; output is premise-level ideas (or questions), never prose,
     dialogue, or scene text; no new named entities or facts beyond the compiled
     records.
  2. `ideation_slots` — the deterministically assigned operator slots (below),
     each naming its operator, its definition, and the citation keys of the
     selected records eligible to feed it.
  3. `ideation_quality` — the Schmid eventfulness rubric (each idea should
     change something relevant, unexpected within the storyworld's expectation
     order, persistent, hard to reverse, non-repetitive) plus the
     surprise-without-contradiction rule (an idea moves the story far while
     contradicting no compiled record), the reveal-discipline rule (a reveal
     idea must respect the compiled reveal constraints — propose surface cues,
     not narrator-certified exposure, where reveal permission is absent, per
     §15), and the skip rule (if no record supports a slot, output `SKIPPED` for
     that slot rather than inventing support).
  4. `ideation_output_format` — flat tagged block per idea: one-sentence
     headline (premise level, ~25-word cap), one-sentence `why` paraphrasing the
     cited records, `grounds` listing citation keys, the slot's operator name;
     an optional free-text thinking region before the block; "output only the
     ideas block; malformed output is discarded."
- **Operator taxonomy** (data in template constants, fixed order = assignment
  priority): 1. Reveal (SECRET — reveal-permission-aware: prefer secrets that
  carry reveal permission; for a secret without it the operator proposes a
  surface cue or partial exposure, never a certified reveal, per §15/§29.6),
  2. Falsify a Belief (BELIEF + FACT/EVENT),
  3. Clock Advances (CLOCK), 4. Plan Meets Friction — yes-but / no-and
  (PLAN/INTENTION), 5. Debt Comes Due (OBLIGATION/CONSEQUENCE),
  6. Relationship Reversal (RELATIONSHIP), 7. Close the Escape Route
  (AFFORDANCE/OBJECT/LOCATION), 8. Collide Two Threads (two of OPEN
  THREAD/PLAN/SECRET/EVENT), 9. Reincorporate the Dormant (the dormant slot's
  operator). **Deterministic assignment:** an operator is eligible iff the
  active working set contains at least one record of a feeding type; slots are
  filled in taxonomy order with eligible operators until `count` is reached;
  when `dormantSlot` is on, the final slot is always operator 9 targeting the
  least-recently-updated selected pressure records, ordered by the stored record
  `updatedAt` field (`packages/core/src/records/metadata.ts:14`, an ISO-datetime
  whose lexical sort is chronological), ties broken by record id. `updatedAt` is
  a stored captured-at value read at compile time, not a wall-clock read during
  compilation, so the ordering is deterministic per §4.4.
  If fewer operators are eligible than `count`, the slate shrinks (surfaced as
  a warning, never silently padded). Question mode uses the same slot machinery
  with a question-form output contract ("Who benefits if CLOCK c1 expires?").
- **Citation keys:** each record in the compiled ideation prompt carries a
  stable bracketed key derived from record type + display label/id (building on
  the existing `displayLabel` rendering). Keys are deterministic and unique per
  compile.
- Version bumps per `packages/core/src/version.ts` conventions: templates minor
  bump (a second template exists), compiler minor bump, contract minor bump;
  `docs/compiler-contract.md` updated in the same change (§8 same-change rule).

### C. Validation: prompt-kind-aware readiness (still fail-closed)

- Thread `promptKind` through readiness. For `ideation`, the blocker set is the
  relaxed deterministic subset: hard contradictions (two locations, two
  holders, state-vs-handoff conflicts, secret hidden-and-revealed, etc.),
  structural snapshot failures, and provider/content-policy configuration
  blockers continue to block compile/preview/send. Prose-launch blockers —
  missing manual directive, prose-mode/local-mode completeness, voice-pressure
  requirements, stop-guidance rules — do not apply to ideation. Warnings remain
  visible and never block (§4.5). No LLM in validation; no overrides.
- Implementation shape: a per-kind blocker applicability map (rule code →
  applies-to kinds) rather than forked rule logic, so the rule inventory stays
  single-sourced; `docs/validation-rule-inventory.md` gains the ideation
  applicability column in the same change.

### D. Server: ideation endpoint + deterministic citation check

- `POST /api/ideate` (and `POST /api/compile` accepting the optional
  `promptKind`/`ideationRequest` inputs for preview): compiles the ideation
  prompt, runs kind-aware readiness, sends via the existing OpenRouter client
  with the **global** model setting, parses the flat idea blocks, and
  deterministically verifies every cited citation key against the compiled
  record set — unknown citations are flagged on the idea, never silently
  dropped. Parse failure returns the raw text with a malformed flag (the UI
  shows it as unparsed scratch; the user can regenerate).
- Nothing is persisted server-side: no prompts archived (§22), no ideas stored,
  no new logging of prompts/keys/records (§23, ACTIVE-DOCS invariants). The
  same secret-leakage test posture as `/api/generate` applies.

### E. Web: the Ideate view

- New sibling route + `AppShell` nav entry: **Ideate**, plus a "Stuck? Get
  ideas" link from the Generation Brief page. The view reuses the readiness
  checklist (relaxed gate), shows the compiled ideation prompt in the existing
  prompt inspector before sending (§22), and renders the slate as cards
  revealed together (anti-anchoring): operator badge, premise headline, why
  line, and record-citation chips (provenance, §26). Controls: mode toggle
  (ideas/questions), count (3–6), dormant-slot toggle, regenerate-all,
  per-slot regenerate (sends the avoid-list as inspectable request input),
  thumbs-up to a **session-scoped keepers list** (sessionStorage; never the
  project store), clear-all. The surface is persistently labeled as
  AI-suggested scratch — not story state. There is no insert-into-records,
  insert-into-brief, or use-as-prompt affordance anywhere; copying is manual
  text selection only.

## Deliverables

1. **D1 — FOUNDATIONS amendments A1 + A2** with the exact §9/§9.1, §11, §26.1,
   §29.2/§29.4/§29.5 wording above (sign-off-gated; lands with the first
   dependent core change).
2. **D2 — `@loom/core` ideation prompt kind**: `promptKind` + `ideationRequest`
   inputs, ideation section order, four new section templates, operator
   taxonomy + deterministic slot assignment + dormancy rule, citation keys,
   version bumps; byte-frozen ideation golden fixture + tests; core purity
   boundary untouched.
3. **D3 — kind-aware validation readiness**: per-kind blocker applicability
   map, ideation relaxed subset, tests proving contradictions still block
   ideation and prose-launch blockers do not; `docs/validation-rule-inventory.md`
   updated same-change.
4. **D4 — server `/api/ideate`** (+ `promptKind` on `/api/compile`): OpenRouter
   send with global settings, idea-block parsing with malformed fallback,
   deterministic citation verification, secret-leakage and no-persistence
   tests.
5. **D5 — web Ideate view**: route + nav + brief-page link, relaxed readiness
   checklist, prompt inspection, slate cards with operator badges and citation
   chips, mode/count/dormant controls, per-slot + full regenerate, session
   keepers list, quarantine labeling; component tests.
6. **D6 — docs**: new `docs/ideation-prompt-template.md` (domain authority for
   the ideation template, registered in `docs/ACTIVE-DOCS.md` in the same
   change, per its registry rule); `docs/compiler-contract.md` ideation mapping;
   `docs/user-guide.md` workflow addition; refresh the ACTIVE-DOCS version note
   (currently template `1.0.0` / compiler `1.2.0` / contract `1.2.0`, the last
   already stale) to the post-bump values this spec produces — template `1.1.0`,
   compiler `1.3.0`, contract `1.4.0` — matching `version.ts` after D2's bumps.

## FOUNDATIONS Alignment

| Principle | Stance | Rationale |
|---|---|---|
| §9 universal prose prompt (one template in v1) | tensions — cleared by amendment A1 | The ideation template is a second prompt class; A1 adds §9.1 recognizing it while leaving the prose contract untouched. No implementation before sign-off. |
| §11 item 7 / §29.5 "produce alternatives" | tensions — cleared by amendment A1 | The prohibition exists to keep the prose writer local; A1 scopes it to prose prompts. The ideation prompt asks a non-prose consultant for premises, and the prose prompt never sees them. |
| §4.4 / §8 deterministic compilation | aligns | Identical snapshot + ideation request → identical ideation prompt; operator slots and dormancy are compiler-computed from typed records; no LLM intermediary anywhere in compilation; compiler-contract updated same-change. |
| §4.5 / §11 fail closed, no override | aligns | Ideation keeps the deterministic gate: contradictions, impossible state, and policy/config failures block compile/preview/send; the relaxation removes only prose-launch requirements that have no ideation function; warnings never block. |
| §26 LLM assistance (non-authoritative, provenance, review) | aligns | Pull-based, opt-in per invocation; every idea cites the records it builds on; ideas mutate nothing; A2 codifies these as shared constitutional rules. |
| §10 / §28.8 anti-contamination (prose-as-canon, state laundering) | aligns | Ideas are never prompt context for prose generation, never records, never brief fields; rejected/cleared ideas leave no residue; keepers are session-scoped scratch; no accepted prose is read by the ideation prompt (same compiled sources as the prose prompt). |
| §4.2 / §12 single continuity, no branches or plot rails | aligns | Output is ephemeral premise-level options, not stored timelines, beats, or arcs; operators are local causal-pressure mechanisms (§18 record types), not act machinery; nothing commands closure. |
| §22 prompt inspection without hoarding | aligns | The ideation prompt is inspectable before sending and is not archived; ideas are ephemeral by default. |
| §23 OpenRouter and secrets | aligns | Same transport, same global model setting (per-purpose models stay deferred), same key-secrecy rules and missing-key failure behavior; one additional user-initiated network surface, invoked explicitly. |
| §29.3 working-set supremacy | aligns | Ideation compiles only the user-selected working set; the dormant slot targets *selected* records; nothing is silently added or removed. |

§29 hard-fail sweep: no question answers "yes" once A1/A2 land; without them,
§29.4/§29.5 would fail — hence the amendment gate.

## Verification

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all pass.
- New byte-frozen golden: `golden-ideation.prompt.txt` compiled from a fixture
  snapshot; a determinism test asserts two compiles of the same snapshot +
  ideation request are identical, and that prose compilation output is
  byte-identical to the existing golden (no prose regression).
- Validation tests: a hard-contradiction fixture blocks ideation; a
  missing-manual-directive fixture blocks prose but not ideation; warnings
  never block either kind.
- Slot-assignment unit tests: eligibility from record types, taxonomy-order
  filling, deterministic dormancy targeting with id tie-break, slate shrink
  warning, question-mode parity.
- Server tests: `/api/ideate` happy path, citation-key verification flags
  unknown keys, malformed-output fallback, missing-API-key failure parity,
  secret-leakage parity with `/api/generate`, nothing persisted.
- Web tests: relaxed readiness rendering, slate card rendering with citation
  chips, keepers session scoping, absence of any insertion affordance,
  quarantine labeling.
- Manual smoke against the demo project: generate a slate, inspect the prompt,
  regenerate one slot, pin a keeper, reload (keeper survives within session),
  confirm prose generation flow is byte-identical and untouched.

## Out of Scope

- Per-purpose model settings (brainstorming doc amendment A3) — deferred until
  a real need appears; ideation uses the global model.
- Acceptance-history-based dormancy (which records were cited in accepted
  segments) — would need new accepted-segment metadata; v1 dormancy is
  least-recently-updated among selected records.
- Any insertion of ideas into records, brief fields, or prompts; any "idea →
  directive" one-click path.
- Push-based or post-acceptance automatic ideation; scheduled or background
  invocation.
- Cross-session keepers persistence or any project-store storage of ideas.
- The other assistance surfaces from the brainstorming doc (record-update
  suggestions, continuity review, handoff drafting, record drafting) — they
  inherit A2 later under their own specs.
- User-editable operator taxonomy or custom operators.
- Prose-template changes of any kind; the universal prose prompt and its golden
  are untouched.

## Risks & Open Questions

- **Citation-key rendering across shared sections** — the shared section
  renderers use `displayLabel` but do not currently emit bracketed keys; the
  ideation variant must add keys without perturbing prose output (prose golden
  guards this). Exact key format (`[SECRET: <label>]` vs short ids) is a
  ticket-time decision; requirement: stable, unique, deterministic per compile.
- **Format compliance by arbitrary OpenRouter models** — mitigated by the
  shallow tagged schema, the discard clause, and the raw-text fallback path;
  if a configured model proves chronically non-compliant, that is a model
  choice issue, not a gate to weaken.
- **Groundedness vs. wildness** — slot grounding trades away some wild-spark
  energy (the Sudowrite tradeoff); the dormant slot and the
  surprise-without-contradiction rubric are the counterweights. Revisit only
  with real usage evidence.
- **Token cost of full cast dossiers in ideation prompts** — v1 deliberately
  reuses cast rendering unchanged (no new compression machinery, §29.3); prompt
  length surfaces as the existing warning class. A compressed ideation cast
  band would need its own deliberate design later.
- **Amendment sign-off is the critical path** — D2–D6 must not begin before the
  A1/A2 wording is explicitly approved; the FOUNDATIONS edit lands in the same
  revision as the first dependent core change (§1.1).
- **EMOTION and ENTITY STATUS feed no operator by design** — the taxonomy maps
  no operator to EMOTION or ENTITY STATUS records; emotions color choice rather
  than drive a discrete "what-happens-next" move. A working set dominated by
  those types will therefore fill few slots and trigger the slate-shrink
  warning; this is expected behavior, not a defect. Confirm the omission is
  intentional (or add an emotion-pressure operator) at ticket decomposition.
- **Open:** should the dormant slot's "pressure records" pool include EVENT and
  FACT, or only the §18 pressure types? Default in this spec: §18 pressure
  types plus OBJECT/LOCATION/AFFORDANCE; the dormancy ordering key is the stored
  `updatedAt` field with record-id tie-break (see §B); finalize at ticket
  decomposition.
