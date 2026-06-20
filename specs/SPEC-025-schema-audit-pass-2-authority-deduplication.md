# SPEC-025 — Schema Audit Pass 2: Authority Deduplication and Effective POV

**Status**: DRAFT
Phase: post-v1 cleanup spec; schema + validation + compiler + storage + docs alignment (second schema-audit pass)
Depends on: existing local project store, the two global-config / generation-session-draft migration hooks, the record-payload repository read path, the deterministic compiler, the validation engine, story-config and generation-brief UIs, and the field-guidance system
Governing authority: `docs/FOUNDATIONS.md`
Primary authority docs: `docs/FOUNDATIONS.md`, `docs/ACTIVE-DOCS.md`, `docs/story-record-schema.md`, `docs/compiler-contract.md`, `docs/prompt-template.md`, `docs/prompt-template-rationale.md`, `docs/validation-rule-inventory.md`
Supporting authorities: `docs/ideation-prompt-template.md`, `docs/stress-suite.md`, `docs/demo-blocker-recipes.md`, `docs/archival-workflow.md`, `tickets/README.md`, `tickets/_TEMPLATE.md`

> Section style note: this file uses the canonical `specs/` section set
> (Problem Statement / Approach / Deliverables / FOUNDATIONS Alignment /
> Verification / Out of Scope / Risks & Open Questions) that the `reassess-spec`
> and `spec-to-tickets` skills parse. It deliberately omits the external-generator
> evidence-ledger preamble (target-commit / fetch-provenance / raw-URL ledger)
> carried by the source audit report, because this spec was authored locally
> against the working tree, not fetched at an exact commit — matching SPEC-024's
> precedent.

---

## Brainstorm Context

- **Original request:** Analyze `reports/continuity-loom-schema-audit-pass-2.md`
  and create a spec in `specs/*` with the actionable changes aligned with
  `docs/**`; if amendments to the foundational docs are truly warranted, include
  them.
- **Source report:** `reports/continuity-loom-schema-audit-pass-2.md` — a second
  schema/generation-brief/record-taxonomy re-audit. It proposes six changes
  (four stored-field removals, one render-scope correction, one POV
  authority-resolution), affirms every other field/category as unchanged, and
  rejects all addition candidates. Exactly one change (R2) is flagged
  `FOUNDATIONS-amendment-required` against §10.
- **Spec number:** `SPEC-025` — highest existing across `specs/` (empty) and
  `archive/specs/` is `SPEC-024-remove-story-contract-prose-preferences.md`.
- **Deliverable-class decision:** the request pre-authorized a spec; this is a
  broad, multi-surface change (schema + compiler + validation + storage +
  constitution) that `docs/ACTIVE-DOCS.md` routes to a spec, so the
  pre-authorized class is correct.
- **Relationship to pass 1:** the first pass shipped as
  `archive/specs/continuity-loom-schema-audit-and-changes.md` →
  `CONLOOSCHAUD-001..007` (merged #60, completed). This pass extends the same
  field-economy standard to a different field set; it does **not** revert any
  pass-1 change. The report explicitly reaffirms all five pass-1 changes.

### Premise verification (operator-verified by Read/grep against the working tree)

The source report disclaims that its target commit (`a1846ef`) is current `main`.
It is: `a1846ef` is the current `main` HEAD, so the report audited current state.
Every load-bearing premise below was verified directly, not relayed:

| Premise | Evidence (file:line) | Status |
|---|---|---|
| `governing_policy_note` is a required UCP field | `packages/core/src/records/global-config.ts:23` | confirmed |
| `pov_character` accepts `recordId \| omniscient \| variable` | `packages/core/src/records/global-config.ts:30` | confirmed |
| `selected_pov` accepts `recordId \| omniscient` (no `variable`), optional | `packages/core/src/records/generation-brief.ts:25` | confirmed |
| Ready handoff requires `prior_accepted_prose_status_or_handoff_note` | `packages/core/src/records/generation-brief.ts:54` | confirmed |
| Draft / readiness handoff carry the same key | `generation-brief-draft.ts:59`, `generation-brief-readiness.ts:63` | confirmed |
| `factStatusValues = ["active"]` (single value), `status` required | `packages/core/src/records/knowledge.ts:7,14` | confirmed |
| `can_drive_prose` is a required PLAN boolean | `packages/core/src/records/causal-pressure.ts:60` | confirmed |
| Validator suppresses holder/agency blocker when `can_drive_prose === false` | `packages/core/src/validation/rules/universal-blockers.ts:203` | confirmed |
| Completeness requires **all four** handoff strings | `packages/core/src/validation/rules/universal-completeness.ts:115-118` | confirmed (contradicts `story-record-schema.md` §3.3) |
| `renderPovCharacter` reads only `proseMode.pov_character` | `packages/core/src/compiler/sections/front.ts:232` | confirmed |
| POV knowledge lanes read `selected_pov` | `packages/core/src/compiler/sections/front.ts:339` | confirmed (dual authority) |
| Override renderer prints `reason` into prompt | `packages/core/src/compiler/sections/cast.ts:231` | confirmed |
| Compiler renders selected active PLANs via generic status renderer, never reading `can_drive_prose` | `packages/core/src/compiler/sections/pressure.ts` | confirmed |
| §10 names the field as "the correct generation-time field" | `docs/FOUNDATIONS.md:407-409,411` | confirmed (R2 constitutional conflict) |
| Migration seams exist | `packages/server/src/global-config-migration.ts`, `generation-session-draft-migration.ts`, `record-repository.ts` | confirmed |

### Scope decisions

1. **One spec, six changes.** They share schema/doc synchronization and migration
   gates (report §15); splitting would fragment the migration and golden-stability
   story. Decomposition into tickets preserves package-boundary order.
2. **R2 is gated on the §10 amendment.** The amendment wording is included here as
   **Deliverable 0**, fenced and sign-off-gated. If sign-off is declined, R2 (and
   only R2) is dropped wholesale — no partial removal that leaves §10 naming a
   field that no longer exists (report §15.1).
3. **No new fields, no new record categories.** The report's exhaustive
   addition-candidate rejection (report §§13–14) is adopted as binding Out of
   Scope; this spec only removes or reconciles authority.
4. **Equivalent migrated data must compile byte-identically** for R4 and R5 (and
   for unchanged sections under all six). Any prompt-byte change for equivalent
   FACT/PLAN state indicates accidental dependence and fails implementation.

---

## Problem Statement

Continuity Loom's post-pass-1 schema is substantially sound — the second audit
finds **no missing universal field and no missing record category**. The
remaining defects are all **authority duplication or contradiction**: surfaces
where two representations of the same authority disagree, or where a field claims
a destination/effect the runtime does not honor. Six such defects clear the
audit's high evidentiary bar:

1. **`UNIVERSAL CONTENT POLICY.governing_policy_note`** (`global-config.ts:23`) is
   a required, prompt-facing free-prose field restating an **immutable external
   invariant** (provider/platform policy) that the user cannot truthfully define.
   The template already states the fixed external-policy boundary statically and
   the authority hierarchy already ranks external policy above story pressure.
   This is the same field-economy class as the already-removed
   `STORY CONTRACT.continuity_philosophy`: a constitutional literal presented as
   editable project data. No deterministic rule can verify that user prose matches
   the actual selected provider policy.

2. **`IMMEDIATE HANDOFF.prior_accepted_prose_status_or_handoff_note`**
   (`generation-brief.ts:54`) is a fourth handoff lane **named after accepted
   prose**. Its two plausible content functions are already owned by
   `recent_causal_context` (the causal bridge) and `last_visible_moment` /
   `begin_after` (the cutpoints). Guidance calls it optional/`None`, yet
   `universal-completeness.ts:115-118` requires **all four** handoff strings for
   every continuation — contradicting `story-record-schema.md` §3.3 (bridge **plus
   either** cutpoint). It has become mandatory clerical boilerplate while keeping
   the forbidden accepted-prose source cognitively salient in the author's task
   model. Removal requires amending `docs/FOUNDATIONS.md` §10, which currently
   names this exact field as "the correct generation-time field."

3. **`CAST VOICE OVERRIDES[].reason`** is rendered into every prompt-facing
   override block (`cast.ts:231`) and scanned as prompt-facing content. The
   external prose writer needs only `applies_to` (surface) and `override_text`
   (instruction); the *reason* ("because she is secretly the saboteur", "to fix
   model tendency") leaks process notes, forbidden-source references, or facts
   that belong in records/current state.

4. **`FACT.status`** (`knowledge.ts:14`) is a required enum whose only legal value
   is `active` (`knowledge.ts:7`). Active truth is already the FACT category
   invariant (§14); the field cannot distinguish two states, express author
   control, or back a meaningful validation decision. It falsely implies a
   lifecycle choice in editors/grids.

5. **`PLAN.can_drive_prose`** (`causal-pressure.ts:60`) is internally
   contradictory: the compiler renders every selected active PLAN regardless of
   the flag (`pressure.ts`), while the validator **honors** `=== false` to
   *suppress* the holder/agency safety blocker (`universal-blockers.ts:203`). A
   selected active plan marked `false` still pressures prose **and** silently
   bypasses the check proving its holder can plausibly act — a deceptive control
   and a §29.3 silent-inclusion ambiguity.

6. **Two unsynchronized POV authorities.** `proseMode.pov_character`
   (`global-config.ts:30`, allows `variable`) and
   `active_working_set.selected_pov` (`generation-brief.ts:25`, no `variable`)
   never have a defined authority relationship. `renderPovCharacter`
   (`front.ts:232`) renders only the global value — so the literal string
   `variable` can reach the prose writer — while POV-knowledge/reveal lanes
   (`front.ts:339`) use `selected_pov`. A valid snapshot can tell the writer
   `POV: variable` while building knowledge from a specific person, threatening
   §29.6. This is a SPEC-024-class misleading-destination defect.

The corrective standard throughout is FOUNDATIONS §13 (field economy): a field
earns its place only by a concrete deterministic compilation, validation,
continuity, voice, prose-quality, or authorial-control function. Removing or
reconciling these six authority paths makes the schema smaller and more truthful
without reducing continuity expressivity, voice protection, author control, or
prose quality.

## Approach

Implement all six as one coherent change set, in strict package-boundary order so
the constitution and authority docs lead and migrations precede strict reads
(report §15):

1. **Authority decision first.** Amend `docs/FOUNDATIONS.md` §10 (Deliverable 0,
   sign-off-gated). If declined, drop R2 entirely. Then synchronize
   `docs/story-record-schema.md` with all six target semantics, and the compiler
   contract / validation inventory / rationale / prompt + ideation templates as
   synchronization consequences only.
2. **Core schema + helpers.** Remove the four stored fields from draft/ready
   schemas; keep `reason` in the schema but flip its guidance/destination
   metadata to non-prompt-facing; add a pure `resolveEffectivePov` helper +
   diagnostics; narrow the FACT registry to project `status: "active"` from
   registry metadata, not payload.
3. **Validation.** Correct continuation readiness to bridge + either cutpoint;
   keep contamination scans on all *actual* prompt-facing user text; drop
   `reason` from prompt-facing scans; apply holder/reference/means checks to
   **every** selected active PLAN; route every POV/reveal/knowledge rule through
   effective POV; keep warnings non-gating and drafts saveable.
4. **Compiler.** Delete the two placeholders/resolvers (governing-policy-note,
   accepted-prose status/handoff note); drop `reason` from the shared cast
   serializer; resolve `{pov_character}` from effective POV and forbid literal
   `variable` in ready output; leave FACT/PLAN rendering otherwise untouched so
   equivalent migrated state compiles identically.
5. **Server migrations.** Three idempotent, transactional, sibling-preserving,
   rollback-safe seams: extend global-config cleanup (UCP key), extend
   generation-session-draft cleanup (handoff key), add a record-payload cleanup
   for FACT.`status` and PLAN.`can_drive_prose`. Run all before strict
   parsing/repository hydration. No aliases, no semantic-guess copies, no
   backwards-compatible schema branches after migration.
6. **Web UI.** Remove the four retired controls; keep `reason` with a conspicuous
   "not sent to the writer" label; make effective-POV requiredness/conflict
   visible; preserve draft work and actionable blocker navigation.
7. **Tests + goldens** updated in the same package order, with capstone tests
   proving the retired keys and destinations are gone.

## Deliverables

### Deliverable 0 — `docs/FOUNDATIONS.md` §10 amendment ⚠️ CONSTITUTIONAL CHANGE — REQUIRES EXPLICIT SIGN-OFF

> **This deliverable edits the project constitution and gates Deliverable 2 (R2).**
> Per FOUNDATIONS §1, the constitution is amended deliberately and on purpose. It
> must be signed off before R2 is implemented, and the §10 edit must land
> **atomically in the same revision** as the field removal — never standalone
> (which would leave §10 naming a field the code no longer has). **If sign-off is
> declined, drop Deliverable 2 entirely** and ship the other five changes.

`docs/FOUNDATIONS.md` §10 currently (lines 407–411) forbids naming any prompt
field as accepted prose, then immediately names
`prior_accepted_prose_status_or_handoff_note` as the sanctioned exception. Remove
that exception and replace it with the stronger invariant:

> No prompt-facing schema field may use accepted prose, rejected candidates,
> superseded candidates, or automatic prose-derived summaries as its source.
> Continuation launch must use user-authored recent causal context plus a visible
> or imperative cutpoint, grounded in selected records and current authoritative
> state.

Preserve every other §10 rule: accepted prose remains excluded; durable change
must still be written into records/current state before the next prompt; no
archive mining, summaries, phrase reuse, or hidden inference is introduced. The
amendment **sharpens** the no-accepted-prose doctrine; it does not loosen it.

### Deliverable 1 (R1) — Remove `UNIVERSAL CONTENT POLICY.governing_policy_note`

Constitutional amendment: **not required.**

- **Core:** strip the key from the strict UCP schema (`global-config.ts`) and the
  draft story-config shape; remove from story-config descriptors, field-guidance,
  field-path enumeration/coverage, `placeholder-map.ts`,
  `template-constants.ts`/`empty-states.ts` (if carried), `sections/front.ts`. The
  completeness rule (`universal-completeness.ts`) must require the four remaining
  policy fields and stop claiming a user-entered provider-policy note is needed.
  No alias/fallback/provider-policy cache. Update demo fixtures and goldens.
- **Web:** remove the input/label/help/requiredness from `StoryConfigEditor`;
  preserve clear UI language that story settings cannot override provider policy.
- **Server:** extend `global-config-migration.ts` to idempotently strip
  `universalContentPolicy.governing_policy_note` from live and legacy/orphan
  global-config payloads before strict parse; transactional, sibling-preserving,
  rollback-safe; never manufacture replacement policy prose.
- **Docs:** `story-record-schema.md` §2.2 (four fields; external policy = fixed
  template doctrine), `compiler-contract.md` (delete placeholder row + its
  completeness/empty-state rule), `prompt-template.md` (delete the
  `Governing policy note: {governing_policy_note}` line, retain the static
  external-policy sentence), `prompt-template-rationale.md` §3,
  `validation-rule-inventory.md`. Ideation: `ideation-prompt-template.md` +
  `golden-ideation.prompt.txt` only where exposed.

### Deliverable 2 (R2) — Remove `IMMEDIATE HANDOFF.prior_accepted_prose_status_or_handoff_note`

Constitutional amendment: **required (Deliverable 0).** Do not implement until §10
sign-off is recorded.

- **Core:** remove the lane from `generation-brief.ts`, `generation-brief-draft.ts`,
  `generation-brief-readiness.ts`; descriptors/labels/field-paths/guidance/coverage;
  `placeholder-map.ts`, `template-constants.ts`, `empty-states.ts`;
  `sections/front.ts`; delete the resolver/placeholder with **no** replacement
  (no auto-summary, accepted-segment lookup, latest-prose cache, inferred handoff,
  or hidden fallback). Retain the three functional lanes
  (`recent_causal_context`, `last_visible_moment`, `begin_after`).
- **Readiness:** `universal-completeness.ts` must implement the documented rule —
  `first_segment`: all handoff fields may be absent; `continuation`:
  `recent_causal_context` required **and** at least one of `last_visible_moment`
  or `begin_after` required (not four nonblank strings). Contamination scan
  (`universal-blockers.ts`) keeps inspecting all genuinely prompt-facing handoff
  lanes + manual directives + stop guidance.
- **Web:** remove the editor row/help/requiredness/section-fill; surface readiness
  directly (causal context required; one cutpoint required; accepted prose must
  not be pasted/summarized).
- **Server:** extend `generation-session-draft-migration.ts` to strip the legacy
  handoff key before strict parse; transactional/idempotent/sibling-preserving/
  rollback-safe; **must not** copy the retired value into `recent_causal_context`.
- **Docs:** §10 amendment (Deliverable 0); `story-record-schema.md` §§3.3 and 10;
  `compiler-contract.md` (placeholder table, first-segment/continuation matrix,
  omission + firewall wording); `prompt-template.md` (delete label+placeholder,
  retain fixed no-accepted-prose instructions);
  `prompt-template-rationale.md` §§5–6; `validation-rule-inventory.md`. Ideation
  golden retains the fixed accepted-prose-is-not-context statement.

### Deliverable 3 (R3) — Make `CAST VOICE OVERRIDES[].reason` author-only

Constitutional amendment: **not required.** Zod shape unchanged; only the semantic
contract and delivery change.

- **Core:** in `sections/cast.ts`, render only `applies_to` + `override_text` in
  the override block (drop `reason`). Field guidance → `promptFacing: "never"`,
  no prompt destinations. Remove `reason` from
  `promptFacingUserInstructionText` and any prompt-contamination enumeration in
  `universal-blockers.ts`. `reason` stays structurally Zod-checked (no semantic
  validation). Update compile-destination/guidance/cast-section/golden and
  prompt-inspection metadata tests; the same draft with only a `reason` change
  must produce byte-identical prompt + ideation output.
- **Web:** keep the editor input, labeled author-only (e.g. "Reason (not sent to
  the writer)."); preview must show that changing only `reason` changes nothing.
- **Server:** no migration (field retained); add a round-trip regression test.
- **Docs:** `story-record-schema.md` §3.6, `compiler-contract.md` (drop `reason`
  from override serialization), `prompt-template-rationale.md` §11,
  `validation-rule-inventory.md`. Ideation goldens updated.

### Deliverable 4 (R4) — Remove `FACT.status`

Constitutional amendment: **not required.**

- **Core:** remove `status` from the FACT payload schema (`knowledge.ts`) and
  inferred `Fact` type; keep `statusValues: ["active"]` as **registry metadata**
  with a `projectStatus: () => "active"` projection (not a payload key). Update
  `registry.ts` status projection, `editor-descriptors.ts`,
  `column-manifest.ts` (no editable status column for FACT),
  `field-guidance-records.ts`, field-paths, fixtures, demo data, schema tests.
  **Compiler behavior must not change** — FACTs are already selected by kind,
  scope, knowledge, visibility, salience, and working-set membership, not payload
  status.
- **Web:** remove the single-option FACT status input; render the registry-projected
  read-only `active` (or omit the column per existing policy). No fake editable
  control.
- **Server:** add a transactional record-payload cleanup migration (shared with
  R5): per FACT row, parse `payload_json`, delete only top-level `status`,
  validate with the new strict parser, write canonical JSON only when changed,
  preserve siblings/id/type/label/metadata/timestamps, roll back on malformed
  JSON or failed validation, idempotent. Run before strict `RecordRepository`
  reads in create/open paths.
- **Docs:** `story-record-schema.md` §6.1 (FACT active status = implicit
  invariant), and rationale/contract/inventory only where they name the field.
  Prose + ideation goldens byte-identical for equivalent migrated data (add
  byte-stability tests).

### Deliverable 5 (R5) — Remove `PLAN.can_drive_prose`

Constitutional amendment: **not required.**

- **Core:** remove the boolean from `causal-pressure.ts` and inferred types;
  update guidance/descriptors/column-manifests/field-paths/fixtures/schema tests.
  In `universal-blockers.ts`, **delete** the `payload.can_drive_prose === false`
  bypass from `validateActivePlanHolders` so every selected active PLAN holder is
  a required selected ENTITY/CAST MEMBER reference subject to holder/means checks.
  **Also update `validation/rules/record-internal.ts`**: its
  `isRecordReferenceRequired` predicate currently makes a PLAN `holder` reference
  required only when `can_drive_prose === true` **or** the
  `non_pov_hidden_plan_behavior` local mode is set (`record-internal.ts:67`).
  Removing the field without fixing this would silently reduce that arm to
  `undefined === true` (false), making PLAN holder references required *only*
  under `non_pov_hidden_plan_behavior` — the opposite of this deliverable's
  intent. Drop the `can_drive_prose === true` arm so a PLAN `holder` is a required
  selected reference for every selected active PLAN (preserving the
  `non_pov_hidden_plan_behavior` mode and any selected-active gating), consistent
  with the `universal-blockers.ts` change; add a test pinning that PLAN holder
  references stay required after removal.
  Compiler stays unchanged (already correct) — add a test pinning the intended
  selected-active behavior rather than a new filter. `fallback_steps` stays
  author-only / non-prompt-facing (preserves §12 no-rail boundary);
  `hasPlausibleMeans` may still read `resources`/`fallback_steps`/current step.
- **Web:** remove the boolean + guidance; replace with working-set selection
  guidance (select to pressure the writer; deselect to exclude).
- **Server:** same shared record-payload cleanup migration (remove only
  `can_drive_prose`); include mixed FACT/PLAN transaction tests proving one
  malformed row rolls back all changes.
- **Docs:** `story-record-schema.md` §8.3 (selected-record membership is the gate;
  revise holder-selection language), `compiler-contract.md`,
  `prompt-template-rationale.md` causal-pressure sections,
  `validation-rule-inventory.md`. Equivalent migrated data compiles identically;
  ideation/prose goldens byte-identical after fixture cleanup.

### Deliverable 6 (R6) — One deterministic effective POV

Constitutional amendment: **not required.** Keep **both** fields; assign distinct
roles under one pure resolver.

- **Schema (unchanged shapes):** `proseMode.pov_character` stays
  `recordId | "omniscient" | "variable"`; `selected_pov` stays
  `recordId | "omniscient"` optional (do **not** add `variable` — it is a
  configuration sentinel, never a concrete generation choice).
- **Core resolver:** add a pure, framework-free
  `resolveEffectivePov(snapshot)` module (`records/effective-pov.ts` or
  `validation/effective-pov.ts`) returning `string | "omniscient" | undefined`:
  if `pov_character` is `variable` → return `selected_pov`; if a fixed id →
  return it; if `omniscient` → `omniscient`. Drive every POV consumer from it:
  `{pov_character}` display-label resolution in `front.ts`, `renderPovKnows` /
  `renderPovBeliefs` / `renderPovDoesNotKnow`, secret firewall + dramatic-irony,
  POV-knowledge completeness, matrix knowledge/voice rules, referential POV
  validation, and any viewpoint-dependent ideation slot.
  **This replaces the existing ad-hoc `selected_pov ?? proseMode.pov_character`
  coalesce**, which is already the shared resolution convention at five validation
  sites — `universal-blockers.ts:521`, `universal-completeness.ts:307`,
  `cast-band.ts:58`, `matrix-voice.ts:200`, `matrix-knowledge.ts:201` (use a sweep
  for the coalesce token to confirm none is left on the old form). The resolver's
  semantics **deliberately differ** from that coalesce: the coalesce lets
  `selected_pov` silently win even over a fixed `pov_character` and treats
  `(variable, absent selected_pov)` as no-POV, whereas the resolver makes a fixed
  `pov_character` authoritative and converts `(fixed, divergent selected_pov)` and
  `(variable, absent selected_pov)` into the conflict/required blockers in the
  table below. Validation tests/goldens that exercise these cases must be updated
  to the new blockers, not re-blessed (cf. the golden-stability stance in Risk 2).
- **Readiness combination table** (new diagnostics
  `selected-pov-required-for-variable-mode`,
  `selected-pov-conflicts-with-prose-mode` — do not overload a generic code):
  | Global `pov_character` | `selected_pov` | Result |
  |---|---|---|
  | `variable` | entity/cast id | effective POV = selected id |
  | `variable` | `omniscient` | effective POV = omniscient |
  | `variable` | absent | **blocker:** per-generation POV required |
  | fixed id | absent | effective POV = fixed id |
  | fixed id | same id | effective POV = fixed id (valid; normalize away only if an established deterministic pattern, visible in saved draft) |
  | fixed id | different id / `omniscient` | **blocker:** conflicts with prose mode |
  | `omniscient` | absent or `omniscient` | effective POV = omniscient |
  | `omniscient` | concrete id | **blocker:** conflicts with prose mode |
  Effective non-omniscient id must resolve to a selected ENTITY/CAST MEMBER;
  literal `variable` must be impossible in a ready compiled prompt; never silently
  choose between conflicting values.
- **Web:** when variable, mark `selected_pov` readiness-required; when fixed,
  hide/disable the selector (show fixed value) or allow only the matching value;
  show actionable conflict blockers; preview shows the resolved label, never
  `variable`. UI changes do not alter the storage schema.
- **Server:** no stored-field migration; snapshot/readiness routes use the new
  resolver/diagnostics; add route tests for every table combination and ensure
  compile/send is blocked on conflict.
- **Docs:** `story-record-schema.md` §§2.3 and 3.1 (distinguish sentinel from
  concrete selection; **delete** the erroneous claim that `selected_pov` accepts
  `variable` at `story-record-schema.md:137`, which already contradicts the correct
  `selected_pov: entity_id | omniscient` at line 115), `compiler-contract.md`
  (`{pov_character}` maps to effective POV; `variable` never renders) — the
  `variable`-renders-as-literal claim appears at **both** `compiler-contract.md:172`
  (placeholder table row) **and** `:383` (the id-resolution paragraph), so edit
  both; the edit is surgical — drop `variable` but **retain `omniscient`** as a
  rendered literal, and leave `proseMode.pov_character` keeping `variable` as a
  sentinel (`story-record-schema.md:70`). `prompt-template-rationale.md`,
  `validation-rule-inventory.md` (two diagnostics; all rules use effective POV).
  Add an invariant test that `POV: variable` cannot occur in a ready prompt.

## FOUNDATIONS Alignment

| Principle / §29 checklist | Stance | Rationale (mechanism @ surface) |
|---|---|---|
| §10 No accepted prose in prompts | tensions (interim) — cleared by Deliverable 0 | R2 removes a field §10 names by name; the §10 amendment removes that naming and replaces it with a stronger invariant, landing atomically with the field removal @ constitution + schema. |
| §13 Field economy | aligns | R1/R3/R4/R5 each remove a field with no earning deterministic function @ schema/authoring; R6 keeps only fields with distinct functions. |
| §14 FACT = active truth | aligns | R4 makes the active-truth invariant impossible to mis-enter; supersession stays a diagnostic, not a stored lifecycle @ schema. |
| §29.1 Identity (no plotter) | aligns | No arc/beat/branch/planner added; R5 removes a secondary gate, making PLAN *less* plot-like @ compiler. |
| §29.3 Active working set | aligns | R5 makes selected-record membership the sole inclusion authority; R6 keeps `selected_pov` explicit @ validation/working-set. |
| §29.4 Prompt compilation | aligns (after Deliverable 0 for R2) | Compilation stays pure/deterministic; R6's resolver removes contradictory section sources; equivalent migrated FACT/PLAN data compiles byte-identically @ compiler. |
| §29.5 Validation fail-closed | aligns | R2 readiness becomes accurate (bridge + either cutpoint); R5 holder/means checks apply to every selected active plan; R6 POV conflicts fail closed; drafts stay saveable @ validation. |
| §29.6 POV and reveal | aligns | R6 routes all POV/knowledge/reveal/interiority rules through one effective-POV authority; literal `variable` can no longer reach the writer @ compiler/validation. |
| §29.7 Physical continuity | aligns | R5 strengthens active-plan agency/means/route checks; current-state fields untouched @ validation. |
| §29.8 Accepted-prose archive | aligns (after Deliverable 0) | R2 removes one accepted-prose-adjacent field; the archive stays review-only and excluded from prompts @ schema/compiler. |
| §29.11 Quality/workflow | aligns | Four misleading controls disappear; `reason` metadata stays available, labeled non-prompt @ UI/authoring. |
| §29.12 Author-private notes | aligns | No change; notes stay isolated from continuity/prompt/validation @ storage. |

## Verification

A repository-wide type-aware audit shows no live schema, descriptor, guidance
entry, editor, compiler resolver, validation field-path, demo fixture, or API
type for `universalContentPolicy.governing_policy_note`,
`immediate_handoff.prior_accepted_prose_status_or_handoff_note`, `FACT.status`,
or `PLAN.can_drive_prose`. Archived historical docs may still mention them and
must not be rewritten as current authority.

**Destination truthfulness:** every prompt-facing field names a real destination;
`cast_voice_overrides[].reason` is explicitly non-prompt-facing; `selected_pov`
truthfully participates in effective-POV resolution; no compiled prompt contains
literal `variable` as POV; no deleted placeholder remains in the contract or
template.

**Storage safety:** a legacy project containing all four retired keys opens after
deterministic migration; a second open produces no further change; malformed JSON
or invalid transformed payload rolls back atomically with an actionable error; no
migration copies data into a semantically guessed field; no alias remains.

**Prompt behavior — intended changed bytes:** governing-policy-note line removed;
accepted-prose-status/handoff line removed; override reason removed;
variable/conflicting POV now resolves or blocks. **Intended unchanged bytes:**
FACT rendering after status cleanup; PLAN rendering after boolean cleanup; all
unrelated sections/ordering; fixed external-policy boundary; fixed accepted-prose
firewall; static local-unit stop rule.

**Validation behavior:** continuation requires causal bridge + either cutpoint;
contamination markers in actual prompt-facing lanes still block; selected active
plans cannot bypass holder/means checks; POV conflicts and missing variable-mode
selection block; warnings never gate preview/send; structurally-saveable drafts
still save.

**No new hidden authority:** no automatic summarizer/ranker/selector/relevance
model/prose-miner/LLM intermediary; no accepted/rejected/superseded text enters a
snapshot or request; no record silently added/removed; no author-only field
smuggled into ideation/prose through a shared serializer; no private note enters
validation or prompting.

**Test order (per package):** schema/record/guidance/field-path → migration
(rollback + idempotence, incl. mixed FACT/PLAN) → validation rule/inventory/
applicability → compiler section/scaffold/conformance → prose + ideation goldens
→ server readiness/compile/send/e2e → web editor/readiness/preview → capstone
assertions proving retired keys/destinations are gone, **extending the existing
pass-1 `packages/core/test/schema-audit-cleanup-capstone.test.ts`** rather than
adding a second capstone file.

Gate every claim through `npm run lint`, `npm run typecheck`, and `npm test`.

## Out of Scope

- **No new fields.** Every addition candidate the report examined
  (PLAN/INTENTION prerequisites, manual-directive actor target, structured story
  time / deadlines / thread age, further knowledge provenance, durable-change
  handoff note, theme/motif/symbol/dramatic-question/scene-goal/outcome, sensory/
  style/surprise/conflict quotas, universal provenance/audit metadata, automatic
  summaries/embeddings/memory caches, prior-prose excerpt/pointer) is rejected and
  must not be introduced (report §13).
- **No new record categories** (FACTION/INSTITUTION/THREAT/SYSTEM,
  MEMORY/RUMOR/LIE, CLUE/EVIDENCE/DOCUMENT, RESOURCE/CAPABILITY,
  GOAL/QUEST/MISSION, SOCIAL NORM/LAW, ACTION/SCENE/BEAT/ARC/BRANCH,
  THEME/MOTIF, NARRATOR, AUDIENCE/READER STATE, SEGMENT) — report §14.
- **No reversal of pass-1 changes** (all five reaffirmed).
- **No prompt-prose rewriting** beyond the named placeholder/label deletions and
  the static-sentence retentions; unrelated wording churn fails implementation.
- **No backwards-compatibility aliases, shims, or duplicate-authority paths**
  after migration.

## Risks & Open Questions

1. **§10 sign-off (R2).** Deliverable 0 is a constitutional amendment requiring
   explicit user sign-off; if declined, R2 is dropped wholesale and the other five
   ship. The §10 edit must land atomically with the field removal — never as a
   standalone doc commit ahead of the code.
2. **Golden byte-stability (R4, R5).** The intent is byte-identical prose/ideation
   output for equivalent migrated data. If a golden moves, it reveals an
   accidental dependence on the retired field — treat as a bug to fix, not a
   golden to re-bless.
3. **Shared record-payload migration ordering.** The FACT/PLAN cleanup must run
   after record tables + display-label backfill exist but before strict
   `RecordRepository` reads in both create and open paths; mixed-row rollback must
   be proven.
4. **Effective-POV normalization choice (R6).** Whether to normalize away an
   exactly-matching redundant `selected_pov` is left to the established
   deterministic-normalization pattern; if none exists, accept the duplicate exact
   match. Never silently resolve a *conflict*.
5. **Diagnostic-code naming (R6).** New codes must not overload a generic
   missing-config code, or the UI cannot tell the author what to fix; confirm the
   two new codes integrate with the existing readiness-diagnostics taxonomy.
6. **Decomposition.** This spec is intended for `spec-to-tickets`; the natural
   ticket boundaries are Deliverable 0 (amendment, gated) and one ticket per
   reviewable diff per change, preserving package-boundary order.
