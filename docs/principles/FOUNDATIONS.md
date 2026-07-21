# FOUNDATIONS.md — Continuity Loom

Status: constitutional baseline  
Date: 2026-06-04  
Last amended: 2026-07-21 — Accepted-Segment Change Review readiness-transition amendment (`ASCR-FND-A-READINESS-TRANSITION`) for PRD #145, issue #147: retire the issue-#136 old-versus-new comparison gate for the new-candidate-only readiness bar and steward `GO`, and decouple the `evidence_excerpt` witness from `change_statement`.
Scope: product identity, continuity authority, prompt-compilation doctrine, validation doctrine, workflow doctrine, and future-feature alignment standard

---

## 1. Purpose

`FOUNDATIONS.md` is the binding foundation document for Continuity Loom.

Every future plan, spec, ticket, validation rule, prompt-compiler change, UI workflow, storage decision, schema evolution, and LLM-assistance proposal must align with this document. When a proposed feature conflicts with this document, the feature is wrong unless this document is deliberately amended first.

This document is not an implementation ticket. It is not a feature backlog. It is not a database schema. It is not a general brainstorming memo. It is the project constitution.

Continuity Loom exists to help a human author maintain story continuity as explicit, inspectable story state and use that state to generate the next local prose segment through an external prose-writing model.

The app must protect the author’s continuity from three recurring failure modes:

1. prose-as-canon drift,
2. model-inferred continuity mutation,
3. plot-structure machinery displacing causal story state.

The app’s first obligation is not to make generation effortless. Its first obligation is to make continuity disciplined, legible, and author-owned.

### 1.1 Amendment procedure and precedence

A change to this document is constitutional work. An amendment must:

1. be proposed as an explicitly labeled FOUNDATIONS amendment in a spec or ticket, with the exact wording shown;
2. receive explicit user sign-off on that wording before implementation;
3. if coupled to a code or behavior change that depends on it, land in the same revision as that change — never standalone ahead of it;
4. update the §29 alignment checklist in the same amendment when it changes what proposals must clear.

On conflict between active documents, precedence is: this document first, then the domain authority that `docs/ACTIVE-DOCS.md` names for the touched surface, then support docs and guides. `docs/ACTIVE-DOCS.md` is the registry of which document is the domain authority for each surface.

---

## 2. App identity

Continuity Loom is a **story-state operating system** for continuity-first prose generation.

It is not an autonomous story generator.  
It is not a plot planner.  
It is not a branching-story engine.  
It is not a dramatic-rail manager.  
It is not a prose archive treated as canon.  
It is not an agent that decides what the story “really” means.

The user maintains a single current story continuity as structured story records. The app compiles the user-selected active working set of records into a deterministic universal prose prompt. The user may send that prompt through OpenRouter to an external LLM prose writer, or may keep the prompt local for inspection and explicitly supply candidate prose through the Generate / Candidate surface. Candidate prose may originate from the app-managed OpenRouter call or from explicit user supply. Both sources enter the same ephemeral Draft Candidate lifecycle: the user may edit, replace or regenerate, discard, or accept the prose. Supplying a candidate makes no provider call, does not make the candidate canon, and does not bypass deterministic prompt-readiness validation. Accepted prose becomes readable story output. It does not become the canonical source of truth for later prompt generation.

The constitutionally correct mental model is:

> The records are the loom. The prompt is the shuttle. The generated prose is cloth. The cloth is not the loom.

Continuity Loom may also provide author-private per-story notes as an inert
scratch surface. These notes are local project data owned by the user, but they
are not continuity authority, not story records, not generation-time fields, and
never compiler input. A note can influence generation only when the user manually
rewrites its substance into a prompt-facing record or generation-time field.

---

## 3. Core loop

The canonical workflow is:

1. The user adds, modifies, removes, or selects story records.
2. The user curates the active working set for the next generation.
3. The user edits generation-time fields, especially the manual directive, current authoritative state, and immediate handoff.
4. The user can save a generation-time brief draft even while required readiness fields are incomplete.
5. Deterministic readiness validation runs against the saved draft, selected records, story configuration, and normalized project-derived defaults.
6. If validation finds blockers, prompt preview, deterministic compilation, OpenRouter sending, and candidate generation are blocked until the user fixes them.
7. Warnings remain visible and actionable, but they do not block Preview, Generate, compilation, or draft saving.
8. If validation passes, the deterministic compiler generates the universal prose prompt.
9. The user can inspect the generated prompt.
10. The user chooses Generate or Write or paste candidate. Generate sends the current prompt to OpenRouter; Write or paste candidate makes no provider call.
11. Generate returns an OpenRouter candidate. Write or paste candidate creates an empty user-supplied Draft Candidate tied to the current inspected prompt.
12. Both paths use the same ephemeral Draft Candidate editor; the user may edit, replace or regenerate, discard, or accept the prose.
13. The user may go back to modify records and generation-time fields.
14. The user accepts a final prose segment.
15. The app stores the accepted segment text plus useful metadata.
16. The app reminds the user that durable changes in the accepted segment likely require manual record updates.
17. The user manually updates records before the next generation.

Generation-time brief editing has a draft state. Saving an incomplete generation brief is ordinary authoring work and must not be blocked by generation-readiness validation. Deterministic validation gates prompt preview, deterministic compilation, OpenRouter sending, and candidate generation. It does not gate basic persistence of a structurally saveable draft.

Rejected candidates and superseded regenerations should be discarded. Only the accepted or user-edited final segment is stored.

Accepted prose workflow is deliberately asymmetrical: generation may propose local forward motion, but continuity is updated only by the human.

---

## 4. Non-negotiable principles

Continuity Loom is governed by the following principles.

### 4.1 User-owned continuity

The user is the sole continuity authority.

Canon is maintained exclusively through story records that the user adds, modifies, removes, and selects for generation. No external prose writer may update records. The app must not infer canon from prose automatically. No LLM may make authoritative continuity changes.

Optional future LLM-assisted record suggestions may exist only as non-authoritative, reviewable suggestions. They must never automatically alter story records.

### 4.2 Single continuity

Continuity Loom stores and works from one current continuity.

There are no story branches, branch histories, alternative timelines, choose-your-own-adventure structures, or canon trees.

The user may keep records outside the active working set. That is not branching. It is simply inactive, archived, unresolved, abandoned, or currently irrelevant story material.

### 4.3 Records are the generative substrate

Prompt generation is grounded in selected story records and generation-time fields, not in accepted prose.

If nuance matters, it must exist in a story record or generation-time field. It must not be left as an expectation that the compiler or external prose writer will infer it from archived prose.

### 4.4 Deterministic compilation

Given the same story configuration, active working set, generation-time fields, template version, and compiler version, the generated prompt must be identical.

The compiler may format, order, and render records according to deterministic rules. It must not use an LLM intermediary to interpret, summarize, rank, repair, select, or prioritize records. It must not invent missing narrative pressure. It must not silently repair contradictions.

### 4.5 Fail closed

When deterministic validation detects contradictions, impossible prompt conditions, unsafe continuity gaps, or structural prompt-contract failures, generation must be blocked. Quality, salience, prompt-length, and optional nuance risks are warnings unless they also prove deterministic impossibility or a prompt-contract failure.

Fail closed applies to prompt compilation, prompt preview availability where no valid prompt can be compiled, provider sending, and candidate generation. It does not mean incomplete generation-time drafts cannot be saved. It does not let advisory warnings disable Preview or Generate. Quality, salience, and prompt-length risks are warnings unless they also prove a structural prompt-contract failure, hard contradiction, policy conflict, or deterministic impossibility.

There is no override in v1.

### 4.6 Local prose only

The external prose writer renders only the next local prose segment. It must not be asked to write whole chapters, global outlines, future plot packages, alternate options, or downstream consequences.

The prompt must stop the model at the first new response point where the user should decide what happens next or update records.

### 4.7 Causality over structure

Continuity Loom produces local causal motion, not global plot shape.

Active plans, intentions, clocks, obligations, consequences, open threads, relationships, emotions, affordances, events, secrets, and beliefs may drive choices, refusals, tactics, interruptions, vulnerability, and durable change. They must never become act-structure machinery.

### 4.8 Character voice is continuity

Prose quality is not ornamental. Character voice, behavior, and pressure response are continuity concerns. Active/onstage characters must not be flattened into interchangeable speech or generic psychology.

### 4.9 Prompt transparency without prompt hoarding

The user must be able to inspect the generated prompt around the current generation session. The app must not keep a permanent prompt archive by default.

### 4.10 Local-first user-owned data

Continuity Loom should prefer local, inspectable, portable, exportable project storage over opaque cloud-first storage.

Cloud sync may exist later, but remote services must not become the canonical owner of the story.

---

## 5. Story-state authority

Continuity authority is ordered as follows.

1. Governing external model, provider, and platform policy.
2. Continuity Loom’s role and output contract.
3. Selected story records and current authoritative state.
4. Physical continuity, POV knowledge boundaries, and reveal constraints.
5. Manual directive.
6. Active plans, intentions, clocks, obligations, and consequences.
7. Beliefs, relationships, emotions, open threads, facts, and events.
8. Active cast characterization, voice, speech-pattern peculiarities, and behavior.
9. Story tone, prose mode, and prose craft preferences.
10. Optional local texture, minor complication, and durable-change permissions.

The manual directive is authorial pressure. It may push a character past ordinary reluctance, soft tendencies, or default behavior. It cannot grant impossible knowledge, move bodies impossibly, reveal locked secrets, contradict selected records, or override governing content rules.

Characterization and voice are binding. They cannot violate hard canon, current authoritative state, physical continuity, POV limits, or reveal locks.

Prose craft improves rendering. It never changes continuity.

---

## 6. The six project surfaces

Continuity Loom has six project surfaces. The first five are the only
continuity-facing surfaces: story records, active working set, generation-time
brief, generated prompt, and accepted prose segment archive. The sixth,
author-private story notes, is a local scratch surface and is never prompt-facing
or continuity-bearing.

The app must keep these surfaces visibly and mechanically distinct. No surface
may silently stand in for another.

### 6.1 All story records

The full set of user-authored story-state records for a project.

This is the author’s structured continuity store. It may contain records that are inactive, unresolved, resolved, abandoned, archived, or irrelevant to the current segment.

### 6.2 Active working set

The user-selected records that are relevant to the next generation.

The active working set is the story authority for the next generated prompt. Records outside the active working set are omitted unless the user selects them or the generation-time brief includes equivalent user-authored context.

The app must not silently include globally important records merely because the app believes they matter. It may warn that omission creates risk or blocks generation when required state is missing, but it must not quietly fix the selection.

### 6.3 Generation-time brief

The immediate launch surface for the next prose segment.

This includes current authoritative state, immediate handoff, manual directive, POV/prose mode, stop guidance, and any user-authored recent causal context.

Generation-time fields are not a license to paste accepted prose. They are user-maintained continuity inputs.

The generation-time brief has two operational states: draft and ready. Draft fields may be partial, blank, or locally inconsistent while the author is working. The app may show readiness diagnostics while the draft is incomplete, but it must still preserve the author's partial work. Ready state is the normalized input used for prompt preview, compilation, and generation.

Deterministic non-story defaults are allowed when derived from project state. For example, generation context may resolve to first segment when there are no accepted segments, and to continuation after accepted segment when accepted segments exist. Such defaults must not invent story facts, handoff prose, current situation, routes, positions, voice pressure, or directive content.

### 6.4 Generated prompts

Generated prompts are deterministic, inspectable operational artifacts. A prose prompt compiles from the active working set and generation-time brief. An assistance prompt compiles only from the declared assistance source profile permitted by §9.1 and documented in the applicable domain authority and compiler contract.

No generated prompt is canon. A project-review assistance prompt does not change the active working set and does not grant any record authority in a prose prompt.

### 6.5 Accepted prose segment archive

The ordered readable output archive.

Accepted segments are story text. They are not the future-generation authority.

### 6.6 Author-private story notes

Author-private story notes are per-project local notes for the user's own
brainstorming, worldbuilding, reminders, todos, research fragments, and other
scratch material. Notes are not story records, not generation-time brief fields,
not active-working-set entries, not generated prompts, and not accepted prose.

Notes must never enter validation snapshots, readiness diagnostics, compiler
inputs, prose prompts, ideation prompts, assistance prompts, OpenRouter request
bodies, active-working-set membership, record reference graphs, or prompt
inspection surfaces. The app must not infer canon from notes, promote notes to
records, link notes to records, or use notes to satisfy readiness. A note affects
future generation only if the user manually authors equivalent content into a
prompt-facing record or generation-time field.

---

## 7. Active working set supremacy

The active working set is a first-class authorial decision.

The user decides which story records matter for the next local prose segment. A record may be hard canon, emotionally important, globally true, or historically central and still be omitted if the user judges it irrelevant to the current segment.

The app should make active working set curation fast, pleasing, and hard to misuse. It should support templates, filtering, search, grouping, salience labels, inclusion/exclusion controls, and clear record previews.

The app may warn when the active working set is risky. It may block generation when the working set is structurally unsafe. It must not override the user by silently adding, removing, compressing, rewriting, or reprioritizing records.

---

## 8. Deterministic prompt compilation

The prompt compiler is a deterministic renderer, not an intelligence layer.

Every prompt class must have one explicit source contract. Assistance prompts declare their source profile under §9.1; every prompt class must also document its sources in the applicable domain authority and `docs/specs/compiler-contract.md`. The compiler must not read a source merely because it is available in the project store.

It must:

- compile a prose prompt or prose-aligned assistance prompt only from the records and generation-time fields declared by that prompt's source profile;
- compile a project-review assistance prompt only from the explicit deterministic project-record projection declared by that prompt's source profile;
- compile a `segment-reconciliation` assistance prompt only from exactly one explicitly selected accepted segment, the purpose-limited generation-time field projection, the explicit user-selected record-contrast scope, and the deterministic record-schema catalog declared by that prompt’s source profile;
- compile an `accepted-segment-change-review` assistance prompt only for deterministic tests and the deterministic offline readiness bar and the separately authorized new-candidate-only live conformance smoke, from exactly one explicitly requested latest accepted segment, the exact nineteen saved-draft CURRENT AUTHORITATIVE STATE and IMMEDIATE HANDOFF paths declared by its compiler contract, and either every complete non-archived Active Working Set record by default or every complete non-archived Whole Project record by explicit user selection, with only minimal declared reference-label stubs and with no schema catalog, lifecycle catalog, mutation schema, or record-creation payload;
- use stable section names and deterministic ordering;
- render records and accepted-segment evidence into purpose-specific, inspectable prompt sections rather than raw database or archive dumps;
- preserve author-written nuance fields needed by the declared prompt purpose;
- keep operational fields meaningful for validation, formatting, or review;
- expose every compiled prompt to the user for inspection before sending.

It must not:

- use an LLM to choose source records, accepted segments, fields, or evidence spans;
- use an LLM to summarize source records or accepted prose during compilation;
- use an LLM to repair contradictions or malformed assistance output during compilation or parsing;
- decide by intuition what matters;
- silently compress or omit records or accepted-segment text required by the declared source profile;
- infer source material from accepted prose, candidates, author-private notes, or hidden UI state; the direct, explicit read of one selected latest accepted segment by either exact one-segment profile sanctioned in §9.1 is not inference;
- include accepted prose text in any prose prompt or in any assistance prompt other than the exact `segment-reconciliation` profile or the non-user-facing candidate `accepted-segment-change-review` profile declared in §9.1;
- mutate story records, generation-time fields, active-working-set membership, or accepted prose; or
- let a project-review, `segment-reconciliation`, or non-user-facing candidate `accepted-segment-change-review` assistance source grant any record authority in a prose prompt.

Structured fields carry operational meaning. Author-written prose fields carry nuance. The compiler must respect both. A relationship axis, status enum, or salience tag may help sort, validate, or review records, but purpose-facing rendering should use human-authored text whenever nuance matters.

Compiler mapping is part of deterministic compilation, not a convenience appendix. Any prompt placeholder, schema field used for prompt generation, validation-only field, empty-state rendering rule, source-profile rule, or prompt-section ordering rule must have an explicit deterministic source in the compiler contract or schema mapping. Adding, renaming, deleting, or changing the requiredness of a prompt placeholder or assistance source predicate must update the compiler contract in the same change. Drift between template, schema, rationale, example, and compiler contract is a continuity bug.

A prose or prose-aligned assistance compiler receives normalized readiness input. Normalization may apply deterministic non-story defaults, such as first-segment versus continuation derived from accepted-segment count. Normalization must not invent story facts, handoff prose, current situation, routes, positions, voice pressure, or directive content.

A project-review assistance compiler receives its own typed deterministic snapshot. A `segment-reconciliation` assistance compiler receives its own typed deterministic snapshot containing the one selected accepted segment and only the declared reconciliation sources. The non-user-facing candidate `accepted-segment-change-review` compiler receives a separate typed deterministic snapshot containing the one selected latest accepted segment and only its declared Generation Brief review projection, selected complete record scope, and minimal reference-label metadata. None of these compilers may reuse generation-readiness input when doing so would add undeclared sources, omit declared sources, or block the diagnostic purpose on the condition it exists to inspect.


---

## 9. Universal prose prompt contract

Continuity Loom uses one universal prose prompt template in v1.

v1 also recognizes exactly one additional prompt class: the **assistance
prompt** (§9.1). The universal-section list below, the local-prose stop rule,
and every rule in this document that addresses "the prompt" in the context of
prose generation govern the prose prompt class. Assistance prompts are governed
by §9.1 and §26.

### 9.1 Assistance prompt class

An assistance prompt is a deterministic, inspectable prompt whose declared source profile is explicitly sanctioned for its assistance purpose and whose output is never story text or continuity authority.

Until the new-candidate-only readiness bar and a verified explicit steward `GO` are both recorded, Segment Reconciliation remains the sole user-facing post-acceptance assistance workflow and `docs/specs/segment-reconciliation-prompt-template.md` remains its sole active prompt-template authority. The old-versus-new bounded comparison is retired as the activation gate: no run of the `segment_reconciliation.v1` prompt is ever required to activate the replacement. The `accepted-segment-change-review` profile and its versioned candidate contract may coexist only as a non-user-facing candidate, exercised through deterministic tests, the deterministic offline readiness bar, and a separately authorized new-candidate-only live conformance smoke. The candidate must not appear in production navigation, the post-acceptance reminder, a public old/new toggle, a compatibility alias, or an alternative public authority path. It must not remove, rename, alias, or weaken the active Segment Reconciliation workflow.

The readiness bar has two parts and runs no old-versus-new comparison. The hard automated gate is offline and deterministic: over the eight synthetic gold cases, the adjudicated gold outputs and their fixtures must parse valid under the amended candidate contract — sequential `ITEM-001` identifiers, resolvable bare citation keys, exactly six reasoned coverage rows, complete declared-source accounting, zero invented items labeled `established change`, and the bounded `evidence_excerpt` witness rule — with no provider request. A separately authorized bounded new-candidate-only live conformance smoke — fixed request ceiling, no retries, no fallbacks, no old prompt, synthetic fixtures only — produces steward-reviewed evidence, not an automatic pass/fail threshold. Activation requires the repository owner's explicit literal steward `GO` recording rationale, pinned revision, model and settings, request count, cost, and the deterministic-floor result. Candidate implementation, a passing offline bar, favorable live-smoke output, or closure of any replacement issue is never equivalent to that receipt.

Every user-facing assistance prompt must declare exactly one source profile in the applicable domain authority and in `docs/specs/compiler-contract.md`. The non-user-facing `accepted-segment-change-review` candidate is the sole temporary exception to the requirement for an active prompt-template domain authority; its exact transitional contract is governed by this section, PRD #145, the readiness-transition amendment ratified through issue #146, its landing issue #147, and `docs/specs/compiler-contract.md`. The historical issue #133 and issue #135 wording remains its historical provenance.

- **prose-aligned:** the same authority sources as the prose prompt: story configuration, the active working set, and only the generation-time fields needed by the assistance purpose; or
- **project-review:** a deterministic records-only projection of explicitly named story-record types, drawn from an explicit, user-selected, disclosed scope — the whole project by default, or a narrower scope the user has explicitly chosen — with explicit archive and per-type status predicates applied identically to every record within that scope; or
- **segment-reconciliation:** exactly one accepted segment selected by the explicit assistance request — the latest accepted segment is the only v1 selection — plus only the CURRENT AUTHORITATIVE STATE and IMMEDIATE HANDOFF fields declared by the segment-reconciliation domain authority, every non-archived record in an explicit user-selected and disclosed record-contrast scope, minimal declared reference-label metadata, and a deterministic schema catalog derived from registered record types and validators. The accepted segment is bounded evidence for advisory reconciliation, not canon authority and not prose-prompt authority.
- **accepted-segment-change-review (non-user-facing candidate):** exactly one accepted segment selected by the explicit assistance request — `latest` is the sole permitted selection — plus the exact nineteen saved-draft CURRENT AUTHORITATIVE STATE and IMMEDIATE HANDOFF paths declared in its compiler contract, and either every complete non-archived record in the Active Working Set by default or every complete non-archived record in the Whole Project by explicit user selection. Minimal deterministic reference-label stubs may support citations but may not become change targets or import out-of-scope payload authority. No schema catalog, lifecycle catalog, record-creation schema, or mutation vocabulary is part of this profile. The accepted segment is bounded evidence for advisory change review, not canon authority and not prose-prompt authority.

A project-review, `segment-reconciliation`, or non-user-facing candidate `accepted-segment-change-review` assistance prompt does not change the active working set and grants no record outside the active working set authority in a prose prompt. Assistance source selection must never be keyword-triggered, probabilistic, model-selected, embedding-selected, token-budget-evicted, derived from author-private notes, taken from hidden UI state, or inferred from accepted prose or candidates. The direct read of the one accepted segment named by an explicit request to either sanctioned one-segment profile is the sole accepted-prose source exception; no model or compiler chooses that segment by content.

These assistance prompts may offer more than one record scope only when every scope is an explicit, user-selected, deterministic, and disclosed projection. The active scope must be named in the compiled prompt and surfaced before sending. The applicable archive and status rules must render every qualifying record within the selected scope completely — none hidden, semantically filtered, ranked, summarized, batched, trimmed, or omitted. Reading active-working-set membership to honor an explicitly selected Active Working Set scope is not a working-set mutation and grants no record prose authority.

The `segment-reconciliation` profile and non-user-facing candidate `accepted-segment-change-review` profile share these source constraints:

- each reads exactly one accepted segment and never a range, rolling window, archive dump, candidate, regeneration, automatic prose-derived summary, or model-selected excerpt;
- the request value is `latest`, selected explicitly by the person invoking the operation, and the server fetches one latest accepted row directly;
- each renders the complete selected segment as escaped evidence spans with deterministic citation keys; evidence spans are local compiler partitions, not model-selected retrieval;
- each renders only the purpose-limited Generation Brief fields and complete selected record scope declared by its governing contract;
- the active scope, full record count, counts by record type, SECRET inclusion, prompt length or token estimate, versions, and fingerprint must be disclosed before sending;
- the server rebuilds the declared source and fingerprint instead of trusting client-supplied prompt bytes;
- only an explicit user-initiated Analyze action after prompt inspection may send the source to OpenRouter;
- an oversize or otherwise unrepresentable prompt fails visibly; no source may be trimmed, summarized, compressed, batched, retrieved, ranked, or evicted to fit a context budget.

During the transition, Segment Reconciliation may continue to expose schema and enum vocabularies derived from deterministic registered validators and declared lifecycle/reference metadata. The non-user-facing candidate Accepted-Segment Change Review candidate must not expose or request a schema catalog, JSON Patch, lifecycle operation, complete creation payload, full proposed value, or other formal mutation vocabulary.

Assistance prompts must:

- compile deterministically: identical declared source records and fields, accepted-segment source where permitted, assistance-request inputs, template version, compiler version, and compiler-contract version must produce an identical prompt;
- be inspectable before sending, under the same audit boundaries as §22;
- use purpose-appropriate deterministic gating: structurally malformed or unrepresentable source data and unsafe provider/policy configuration block the affected operation; prose-launch readiness requirements apply only when the assistance purpose needs them; a diagnostic assistance prompt must not be blocked merely because it detects the contradiction, overlap, redundancy, staleness, missing field, or durable change it exists to inspect;
- never use an LLM intermediary to select, rank, summarize, repair, rewrite, or omit sources during compilation;
- never produce story prose and never be used to request story prose;
- never have their output enter any prose prompt, story record, active working set, or generation-time field automatically (§26 assistance-output rules).

Until a verified explicit steward `GO`, user-facing Segment Reconciliation assistance output must continue to satisfy its existing formal contract:

- attach one or more valid accepted-segment span citations to every proposed brief update, record change, lifecycle deactivation, or record creation;
- carry the current field or record contrast keys used to form the proposal;
- use only registered record types, schema-valid field shapes, real enum values, and declared lifecycle destinations;
- omit accepted-prose quotations and independently paraphrase any proposed prose value;
- be validated locally as one complete structured response and quarantined in full when malformed, stale, schema-invalid, reference-invalid, provenance-invalid, or materially verbatim;
- remain ephemeral scratch, with no project-store write, prompt reuse, automatic editor insertion, or automatic retry/repair.

Non-user-facing candidate Accepted-Segment Change Review model output must contain only `contract`, `items`, and `coverage`.

Each `items` entry must contain:

- a sequential local identifier;
- a `change_statement`: an independently readable, present-tense, plain-English statement of the possible change, constrained only by the no-material-accepted-prose-echo rule (§10); the model's role prompt directs it not to draft future possibilities, but that discipline is prompt-led and observed through playtest rather than enforced by parser keyword heuristics;
- an `evidence_excerpt`: an always-present provider-safe string — for an `established change` item, an exact three-to-seven-word verbatim excerpt that occurs in one of the item's cited accepted-segment evidence spans; for an `interpretation requiring author judgment` item, the empty string. The excerpt is the bounded extractive witness that keeps an established claim grounded and non-inventive; `change_statement` is never required to be that excerpt;
- one or more resolvable accepted-segment evidence keys;
- the resolvable current record or Generation Brief contrast keys used to form the item;
- exactly one epistemic status: `established change` or `interpretation requiring author judgment`;
- exactly one retention horizon: `durable record candidate`, `next-brief-only`, `no storage`, or `author decision required`;
- affected-target hints that identify likely canonical destinations without selecting or drafting a canonical value; and
- nonblank uncertainty or rival-reading text.

`coverage` must contain exactly one reasoned row for each of these six dimensions:

1. spatial, material, and bodily state;
2. time, clocks, and ongoing processes;
3. facts, knowledge, beliefs, and secrets;
4. intentions, plans, commitments, promises, and open pressures;
5. emotions and relationships;
6. immediate next-segment handoff.

Each coverage row must use exactly one status: `changes found`, `checked - no relevant change`, or `uncertain`, and must contain a nonblank reason. Duplicate, missing, or unknown dimensions quarantine the complete response. An empty `items` list is valid only when all six reasoned coverage rows are present, and the result must remain visibly labeled as unverified advisory output rather than proof that canonical state is current.

The model-output envelope must not contain source metadata, a schema catalog, record-creation payload, JSON Patch, lifecycle operation, full proposed canonical value, or model-selected destination. Accepted-segment id and sequence, selected record scope, source profile, template/compiler/contract versions, and prompt fingerprint are trusted server metadata attached only after local parsing.

The complete response is quarantined when malformed, stale, enum-invalid, coverage-incomplete, citation-invalid, materially echoing accepted prose, or when an `established change` item's `evidence_excerpt` is missing, is not an exact three-to-seven-word verbatim excerpt, or does not occur in one cited evidence span. That bounded witness is what keeps an invented or explicitly unstated implication from being labeled `established change`: such an implication carries no qualifying excerpt and may appear only as `interpretation requiring author judgment`. The role prompt directs the model not to draft future possibilities (future actions, opportunities, predictions, or likely developments are not change-review items); that discipline is prompt-led and observed through playtest rather than enforced by parser keyword heuristics, which false-positive on ordinary advisory modal verbs and on epistemic hedging in the rival-reading field.

Items and coverage are session-only, visibly non-canonical scratch. Keeping, copying, marking reviewed, clearing, or navigating from them must not acknowledge the durable-change reminder; write project data; enter any prose prompt, story record, Generation Brief field, active working set, log, export, backup, or provenance field; prefill a canonical editor; or cause an automatic retry, repair, fallback, or provider call. The author must independently write and explicitly save any canonical change in its normal editor.

Accepted-Segment Change Review may also present a separate deterministic consumed-guidance control. This control is not model output and must not infer what the accepted prose consumed. It may list only nonblank values from:

- `manual_moment_directive.must_render[]`;
- `manual_moment_directive.may_render_if_naturally_caused[]`;
- `manual_moment_directive.do_not_force[]`;
- populated `current_cast_voice_pressure[]` and `cast_voice_overrides[]` entries;
- `generation_validation_focus.validation_focus_tags.expected_local_modes[]`;
- `generation_validation_focus.validation_focus_tags.possible_durable_changes[]`; and
- `stop_guidance.soft_unit_guidance`.

It must exclude `generation_context`, the active working set including selected POV and cast bands, `current_authoritative_state`, and `immediate_handoff`. Nothing is preselected. Only values explicitly selected by the user may be removed from the editable Generation Brief draft, and the existing explicit Save action remains the sole project-store mutation.

Project data remains local and user-owned throughout the comparison candidate. API keys remain local secrets and must not appear in prompt inspection, model output, logs, fixtures, or comparison artifacts. Opening, inspecting, changing scope, manipulating scratch, navigating, or selecting consumed guidance makes no provider call. Only the inspected, explicitly confirmed Analyze action may send the declared prompt to OpenRouter.

The local-prose stop rule and the prohibition on requesting alternatives, plans, or summaries (§4.6, §11 item 7, §19, §29.5) scope to the prose prompt class. An assistance prompt may request non-prose alternatives, questions, comparisons, review findings, or structured advisory deltas because no prose writer is being asked to branch the story.

The template must remain portable, inspectable, and model-provider-neutral. Markdown with XML-style section boundaries is the constitutional default because it is readable to humans and gives models stable semantic boundaries. A provider's schema-constrained response mode may enforce the same inspected output contract, but provider-specific hidden source selection, repair, compression, or prompt forks must not enter the v1 core.

Provider-specific wrappers, hacks, hidden adapters, or model-specific prompt forks must not enter the v1 core. Future provider-specific compatibility layers may exist only if explicitly justified and only if they preserve the declared assistance source profile and output quarantine.

The universal prompt must preserve these conceptual sections:

- role and output contract;
- authority hierarchy;
- content policy;
- story contract;
- prose mode;
- hard canon, except that this designated optional section may be deterministically omitted when no hard-canon FACT is selected and no immutable story lock is active;
- current authoritative state;
- immediate handoff;
- manual directive;
- POV knowledge constraints;
- audience knowledge;
- secrets and reveal constraints;
- active working set;
- active cast full dossiers;
- present minor cast, except that this designated optional cast-band section may be deterministically omitted when no present-minor cast is selected;
- offstage relevance, except that this designated optional cast-band section may be deterministically omitted when no offstage cast is selected and no offstage pressure or interruption is active;
- active plans and intentions;
- active clocks;
- active obligations and consequences;
- active open threads;
- relevant facts, beliefs, and events;
- locations, objects, and affordances;
- physical continuity;
- invention permissions;
- contradiction prohibitions;
- prose craft;
- stop rule;
- final output instruction.

The template may evolve, but any evolution must preserve the constitutional functions above unless this document is amended.

Critical state and binding instructions should appear near the prompt edges where feasible. Long-context models can underuse information buried in the middle of very long contexts, so the prompt should keep hard state, output contract, and final stop/output instructions especially prominent. This does not justify dumping less context. It justifies ordered context.

The universal prompt always contains the local-unit stop rule. Optional stop guidance may narrow that local unit for the current generation, but blank optional stop guidance is not a structural prompt failure. Nonlocal or contradictory supplied stop guidance remains a blocker.

---

## 10. Accepted prose is excluded from prose prompts and continuity authority

Accepted prose segments must not be included in generated prose prompts.

This remains a hard constitutional rule.

The only prompt-source exceptions are the active `segment-reconciliation` profile and the non-user-facing candidate `accepted-segment-change-review` profile declared in §9.1. Each may read exactly one explicitly requested accepted segment — `latest` is the sole permitted selection — as bounded evidence for quarantined advisory review. Neither may read a range, archive, candidate, regeneration, model-selected excerpt, or automatic prose-derived summary. The non-user-facing candidate profile is not a second user-facing workflow or active prompt-template authority.

The exception does not make accepted prose canon authority. Accepted prose must never be used automatically to populate or mutate a story record, generation-time field, active-working-set entry, story configuration field, or prose prompt. Assistance output derived from it remains non-canonical until the user independently reviews and authors a change in the canonical editor.

Segment Reconciliation output must continue to omit accepted-prose quotations from proposed handoff, current-state, record, label, or rationale values. Accepted-Segment Change Review must not materially quote or echo accepted prose in an item statement, coverage reason, uncertainty field, target hint, or other model-authored text. Both profiles represent provenance through deterministic evidence keys pointing back to the readable accepted segment and quarantine the complete response when the applicable echo rule fails.

Outside this narrow assistance exception, the reason for the prohibition is unchanged. Accepted prose encourages phrase echo, style mimicry, accidental leakage, context bloat, and prose-as-canon drift. Continuity Loom must not ask the external prose writer to derive continuity from prior prose.

The correct mechanism for carrying prior events forward is user-maintained structured story state, especially EVENT, CURRENT AUTHORITATIVE STATE, IMMEDIATE HANDOFF, FACT, BELIEF, RELATIONSHIP, EMOTION, PLAN, CLOCK, OBLIGATION, CONSEQUENCE, OPEN THREAD, LOCATION, OBJECT, VISIBLE AFFORDANCE, ENTITY STATUS, and CAST MEMBER.

The only allowed continuation-launch material is user-authored generation-time context, such as recent causal context, last visible moment, begin-after guidance, manual directive, relevant current state, and selected records. Segment Reconciliation suggestions and Accepted-Segment Change Review items or coverage are not continuation-launch material unless and until the user independently authors equivalent content into canonical fields or records.

Prompt-facing prose-generation schema fields must not use accepted prose, rejected candidates, superseded candidates, or automatic prose-derived summaries as their source. The two exact one-segment assistance profiles may label their bounded data section as accepted-segment evidence, but neither may expose a reusable accepted-prose summary or any stored prompt-facing accepted-prose field.

If a prior accepted segment created continuity-relevant durable change, that change belongs in user-authored story records, current authoritative state, immediate handoff, or selected records before the next prose prompt is generated. Segment Reconciliation may propose formal candidate changes and Accepted-Segment Change Review may provide readable accounting, but neither performs the transfer, drafts an authoritative value, or replaces independent human authorship and explicit canonical Save.

Prompt, schema, and compiler surfaces must not name or label any prompt field as “most recent accepted prose,” “accepted prose summary,” or anything that implies accepted prose is a prompt source.

No prompt-facing schema field may use accepted prose, rejected candidates, superseded candidates, or automatic prose-derived summaries as its source. Continuation launch must use user-authored recent causal context plus a visible or imperative cutpoint, grounded in selected records and current authoritative state.

If a prior accepted segment created continuity-relevant durable change, that change belongs in story records, current authoritative state, immediate handoff, or selected EVENT/FACT/BELIEF/RELATIONSHIP/EMOTION/PLAN/CLOCK/OBLIGATION/CONSEQUENCE/OPEN THREAD/LOCATION/OBJECT/AFFORDANCE/CAST MEMBER records before the next prompt is generated.

---

## 11. Validation and hard fails

Validation is deterministic and blocking.

Generation must be blocked when deterministic validation detects contradictions, impossible conditions, unsafe continuity gaps, or structural prompt-contract failures. Advisory warnings do not block prompt preview, generation, or OpenRouter sending. OpenRouter sending must remain disabled until the user fixes blocking records or generation-time fields.

There is no override in v1.

This blocker taxonomy defines when readiness blockers are legitimate. Readiness blockers are legitimate only when deterministic validation proves one of these conditions:

1. The compiler cannot produce a structurally valid universal prompt.
2. A required prompt contract section would be missing and has no truthful deterministic empty state.
3. Selected records or generation fields contain a hard contradiction.
4. The manual directive requires impossible knowledge, perception, movement, timing, physical action, reveal, or provider-policy violation based on explicit fields.
5. The selected local mode requires state that is deterministically absent.
6. Provider or content-policy configuration is missing or contradictory enough that sending would be unsafe.
7. The prompt would ask the external prose writer to plan, summarize future consequences, produce alternatives, produce branches, or perform nonlocal story-structure work (this condition scopes to prose prompts; a sanctioned §9.1 assistance prompt may request non-prose alternatives).

Hard validation must include objective continuity contradictions and deterministically detectable prompt-safety gaps, including:

- two current locations for the same entity;
- two holders for the same object;
- selected POV lacks required knowledge constraints;
- manual directive requires impossible knowledge, perception, movement, timing, or physical action;
- current authoritative state contradicts immediate handoff;
- offstage interruption lacks an entrance, communication, timing, or route mechanism;
- missing current location when physical continuity matters;
- missing onstage cast when required by prose mode;
- missing manual directive;
- manual directive or stop guidance requests a whole chapter, global outline, alternate options, downstream consequence summary, plot beat/act/chapter package, or multiple response points instead of one local prose segment;
- selected secret is both hidden from POV and revealed to POV by another selected record;
- no current authoritative state for an active physical interaction;
- active physical action lacks necessary bodies, objects, routes, consent/force conditions where relevant, or available time;
- active plan belongs to a dead, captive, unconscious, absent, or incapacitated entity with no plausible means to act;
- active obligation, consequence, or clock assumes a state contradicted by selected current state;
- content envelope contradicts active cast ages, statuses, story configuration, or provider constraints;
- prompt sections required by the universal prompt contract are missing or structurally empty where needed.

Validation errors must be legible and actionable. A validation error should identify the conflicting records or fields, explain the conflict in plain language, and indicate what the user can change.

The app should distinguish warnings from blockers. Length warnings, lost-in-the-middle warnings, salience doubts, or missing optional nuance may be warnings. Contradictions, impossible prompt conditions, and missing mandatory generation fields are blockers.

Warnings never compile into the prompt. Warnings never block Preview, Generate, prompt compilation, candidate generation, or draft saving; warnings never block readiness surfaces. Deterministic validation cannot use an LLM. Validation cannot infer semantics from accepted prose, candidate prose, or hidden model judgment to create blockers. Deterministic threshold diagnostics, such as length, salience, or lost-in-the-middle risk, are allowed only as warnings unless they also prove a structural prompt-contract failure, hard contradiction, policy conflict, or deterministic impossibility.

Readiness diagnostics must be author-actionable. Raw technical codes may appear in details, logs, or developer-facing audit output, but they must not be the primary author-facing message.

Generation validation focus tags may be used to activate context-dependent completeness checks, such as dialogue, physical interaction, object use or transfer, location change, intimacy, violence/injury, offstage interruption, hidden-plan behavior, clock ticks, obligation breach, or continuation after an accepted segment. These tags are validation controls, not plot beats, act structure, dramatic machinery, or instructions to force events. They should remain non-prompt-facing by default. If a future prompt-facing use is proposed, it must be justified by demonstrated generation-quality gain and must not weaken local-prose-only or no-plot-rails doctrine.


---

## 12. No branches and no plot-rail machinery

Continuity Loom has one current continuity.

The app must not introduce story branches, branch histories, alternative timeline machinery, choose-your-own-adventure structures, or canon trees.

The app must also reject act, arc, beat, scene-structure, chapter-structure, milestone, midpoint, climax, three-act, save-the-cat, hero’s-journey, drama-manager, plot-shape, or narrative-rail machinery in app logic, prompt compilation, validation, or generated prompts.

Local prose units and response-point stop rules are allowed. They are continuation-control rules, not story-structure machinery.

Use these terms:

- local prose segment;
- local unit of causally connected forward motion;
- response point;
- current pressure;
- immediate handoff;
- current authoritative state;
- active working set;
- open thread.

For unresolved pressures, use `OPEN THREAD`.

Stories may go anywhere if they respect selected records, active constraints, physical continuity, POV boundaries, reveal rules, and the current manual directive.

---

## 13. Records and current continuity

The default record style is atomic.

Most records should be small, direct, and easy to create, select, remove, revise, filter, and understand. Atomic record types include:

- FACT;
- EVENT;
- BELIEF;
- SECRET;
- EMOTION;
- RELATIONSHIP;
- INTENTION;
- PLAN;
- CLOCK;
- OBLIGATION;
- CONSEQUENCE;
- OPEN THREAD;
- LOCATION;
- OBJECT;
- AFFORDANCE;
- ENTITY STATUS.

Atomic records do not mean thin records. They mean one record should normally carry one continuity claim, pressure, event, state, relationship expression, or affordance. The user should be able to include or exclude it without dragging in unrelated baggage.

CAST MEMBER is the exception. Active/onstage cast need rich dossiers because voice, behavior, body, perception, pressure response, and contradiction are too deep to preserve through tiny slices.

Field economy means every field must earn its place through at least one concrete function: deterministic compilation, deterministic validation, continuity interpretation, character voice or behavior preservation, prose-quality protection, or authorial control.

A field must not be deleted merely because its prose content cannot be fully validated deterministically. If a prose-rich field compiles as binding context that protects voice, characterization, continuity nuance, POV interpretation, or authorial control, it can be justified.

Conversely, sophisticated-sounding fields that have no prompt-compilation use, no validation use, no continuity use, no voice/prose-quality use, and no authorial-control use should be merged, demoted, renamed, or deleted.

Continuity Loom is current-continuity-first, not archive-first. Historical information matters only when it remains causally relevant, character-relevant, knowledge-relevant, or pressure-relevant to the current generation.

---

## 14. Resolved and abandoned record philosophy

Plain FACT records should usually represent active truth.

If a fact becomes false, the user should modify it, remove it, or replace it with a current fact, event, belief, consequence, or current authoritative state record. Deprecated facts must not remain normal prompt-facing records. Retired facts invite leakage.

Resolved or abandoned statuses are useful for pressure records when the resolution or abandonment still matters now.

Examples:

- an abandoned PLAN may reveal a character’s cowardice, exhaustion, loyalty shift, or loss of resources;
- a resolved OBLIGATION may leave gratitude, resentment, debt cancellation, or social consequence;
- an answered OPEN THREAD may remain current knowledge or create a new pressure;
- a transformed EMOTION may explain present behavior;
- a failed CLOCK may leave a consequence that is now active.

Such records must not be treated as historical clutter. They should be selected only when currently relevant.

If something matters only because it happened, it usually belongs as an EVENT or as a current BELIEF, CONSEQUENCE, RELATIONSHIP, or EMOTION. It should not linger as stale residue in the prompt-facing state.

---

## 15. POV, knowledge, secrets, and audience knowledge

POV discipline is constitutional.

The prompt must distinguish:

- what the POV knows;
- what the POV believes, suspects, misreads, denies, or doubts;
- what the POV does not know;
- what the POV cannot perceive now;
- what the audience knows;
- what the audience does not know;
- writer-visible hidden truths;
- who holds a secret;
- who must not know yet;
- allowed clues and surface cues;
- forbidden reveals;
- reveal permission.

Hidden truths may shape visible behavior, timing, silence, posture, evasions, object handling, subtext, and local tension. They must not leak into the wrong narrator or character mind.

Audience knowledge may create dramatic irony. It must not give the POV forbidden knowledge.

A secret may be revealed only when reveal permission, manual directive, or immediate causality makes the reveal natural and earned. Otherwise, the prompt should allow surface cues without narrator-certified exposure.

Non-POV interiority must be governed by prose mode. In first person or close third, non-POV psychology should be rendered through behavior, speech, timing, silence, posture, gesture, object handling, and withheld response unless the prose mode explicitly permits otherwise.

---

## 16. Physical continuity

Physical continuity is constitutional.

The prose writer must not move characters or objects without plausible action, route, time, consent or force where relevant, and physical possibility.

The app should make physical continuity visible through:

- current authoritative state;
- entity status;
- current location;
- physical positions;
- object possession;
- visibility and line of sight;
- routes and exits;
- location records;
- object records;
- affordance records;
- physical-continuity prompt sections.

Prompt compilation must include unavailable or impossible actions when omitting them would invite continuity errors.

Validation must block generation when selected records make physical continuity impossible or dangerously underspecified.

Physical continuity is hard authority when the selected local mode involves bodies, movement, object use, transfer, pursuit, intimacy, violence, restraint, entrance, interruption, perception, or timing. The minimum current state is universal, but not every detailed spatial or affordance field is universal. The absence of detailed routes, line of sight, possessions, locks, or force conditions should not block a quiet minimal opening unless an explicit tag, selected record, or manual directive makes that detail structurally necessary.

The external prose writer may invent local blocking, gesture, small movements, and sensory detail only within the physical affordances established by the selected records and current state.

---

## 17. Character voice and cast dossiers

Continuity Loom exists to help produce strong fiction, not merely valid event sequences.

Character voice is continuity.

A character’s voice is not a generic style label. It includes:

- sentence rhythm;
- vocabulary pool;
- metaphor pool;
- class, education, professional, regional, and social register;
- profanity behavior;
- taboo words;
- avoided subjects;
- register switching under pressure;
- address terms and naming habits;
- interruption and silence behavior;
- lying and evasion style;
- intimacy style;
- anger style;
- bargaining style;
- refusal style;
- anti-repetition warnings;
- speech-function examples where useful.

Active/onstage cast should receive full rich dossiers in the prompt. Present-but-minor cast should receive compressed notes. Offstage cast should receive relevance slices only.

The compiler must not impose token-budget-driven compression on active/onstage cast. The user is the gate. The compiler may warn about prompt length or lost-in-the-middle risk, but it must not silently flatten active cast.

Sample utterances are optional. When used, they must be annotated by situation, speech function, and copy policy. The default copy policy is never-copy-verbatim. Sample utterances should be sparse and pressure-relevant. They should teach speech function, cadence, and register; they must not become catchphrase banks or mimicry traps.

A durable cast dossier should distinguish stable voice identity from current-generation voice pressure. Stable voice identity belongs in a durable voice anchor. Current voice pressure pins are compiled salience duplicates for the active local unit, assembled deterministically from the voice anchor, current generation-time pressure, and any temporary cast voice override. A current voice pressure pin is not a second character bible and must not silently rewrite durable identity.

Durable CAST MEMBER records are the primary voice and behavior authority. Current cast voice pressure is optional scene-specific salience reinforcement or temporary emphasis. It may help in dialogue-heavy, ensemble, close-POV, or silent-body-pressure moments, but its absence is not normally a blocker when durable voice/body anchors are sufficient. It blocks only when supplied pressure contradicts hard canon, current state, POV/reveal constraints, physical continuity, or provider policy, or when the selected local mode requires voice/body authority and no durable or compressed authority exists.

Temporary cast voice overrides are allowed only as generation-time instructions scoped to the current request. They may adjust dialogue, POV narration, register, rhythm, diction, nonverbal behavior, or silence behavior for the current local unit. They must be clearly labeled when compiled, must not persist into CAST MEMBER records automatically, and must not override hard canon, current state, physical continuity, POV/reveal locks, or governing provider policy.


Active characters must not be reduced to role labels, moods, diagnoses, or moral positions. A dossier should preserve contradiction, pressure behavior, perception, agency, bodily presence, social presentation, and anti-generic warnings.

---

## 18. Causal pressure records

The app should produce local causal motion through records, not global plot form.

The most important pressure records are:

- PLAN;
- INTENTION;
- CLOCK;
- OBLIGATION;
- CONSEQUENCE;
- OPEN THREAD;
- RELATIONSHIP;
- EMOTION;
- AFFORDANCE;
- EVENT;
- SECRET;
- BELIEF.

PLAN records are high-signal because users should create them only when a real plan exists. Active relevant plans should drive tactics, refusals, approach, evasion, fallback behavior, conflict, and choice.

CLOCK records are writer-facing pressure, not hidden drama machinery. The prose may make a clock visibly tick only when the current moment strongly triggers it. If accepted, the user updates records.

OBLIGATION and CONSEQUENCE records constrain plausible choice and justify escalation or durable change.

OPEN THREAD records are unresolved pressures, promises, risks, mysteries, tensions, or setups. They are not commands to close anything. They should color the current local unit without forcing resolution.

RELATIONSHIP and EMOTION records should render as pressure text and current expression, not raw axes alone.

AFFORDANCE records define what can plausibly happen now and what cannot happen now.

Causal pressure records must never become plot-rail machinery. They exist to make immediate choice and consequence legible.

---

## 19. Local prose segment policy

The external prose writer should render only the next local unit of causally connected forward motion.

A local unit may be:

- one approach;
- one refusal;
- one short exchange;
- one physical maneuver;
- one interruption;
- one discovery;
- one reveal-withheld;
- one practical offer;
- one visible clock tick;
- one vulnerability becoming newly visible;
- one irreversible event when strongly caused.

The stop rule must dominate length preference.

The prose should stop when a materially new response point appears: a decision lands, a refusal changes the pressure, a question demands response, a threat becomes active, a secret is partially exposed or withheld, a practical result changes what can happen next, an interruption changes the pressure, or an irreversible event occurs.

The prompt must not ask for alternate options, future summaries, downstream consequences, chapter packages, or global continuation plans (this scopes to the prose prompt class; a sanctioned §9.1 assistance prompt may request non-prose alternatives).

---

## 20. Durable change and human gatekeeping

The external prose writer may create durable or irreversible continuity changes when they are strongly caused by the active working set and current moment.

Durable changes include:

- secret revelation;
- injury;
- sex or intimacy;
- violence;
- arrest;
- death;
- promise;
- object transfer;
- major location change;
- relationship redefinition;
- institutional involvement;
- clock threshold tick;
- obligation breach;
- decisive refusal or acceptance.

This is acceptable because the human remains the gatekeeper.

If the user rejects the prose, the change never enters the accepted segment archive and must not be reflected in records. If the user edits and accepts the prose, the user is responsible for updating story records.

Durable changes may be justified by:

- manual directive;
- immediate causality;
- active plan current step;
- active clock tick trigger;
- obligation enforcement or breach;
- pending or active consequence;
- physical affordance;
- relationship or emotion pressure combined with feasible action;
- secret reveal permission;
- current danger;
- authority pressure;
- object or location affordance.

Durable changes must not arise from tone alone, genre expectation alone, stale backstory, a hidden truth with no current clue or reveal permission, or the model’s desire to escalate.

---

## 21. Accepted segment archive

Accepted segments are readable story output.

They are not canon authority for future generation.

Accepted segment metadata must identify its candidate source as OpenRouter or user-supplied. OpenRouter-source metadata records the actual model, provider, generation settings, and compiler versions. User-supplied metadata must not invent model, provider, or generation-setting values; it records the compiler versions associated with the inspected prompt where available.

The app should allow the user to see accepted segments individually and in order. Segment browsing is a reading and review affordance, not a prose-prompt source. During the comparison transition, the sole accepted-prose assistance exceptions are the active `segment-reconciliation` profile and the non-user-facing candidate `accepted-segment-change-review` profile in §9.1. Each reads exactly one explicitly requested accepted segment — latest only — for quarantined advisory review. Neither exception authorizes archive ranges, prose generation, stored summaries, or automatic continuity writes.

Accepted segment metadata should include:

- story identifier;
- segment order or index;
- timestamp;
- candidate source;
- prompt template, compiler, and compiler-contract versions where available;
- for OpenRouter-source segments only, the actual provider/model identifier and generation settings.

User-supplied metadata must omit provider, model, temperature, maximum-output-token, and top-p fields rather than storing blank or fabricated placeholders.

The app does not need to mark whether the user edited the candidate before acceptance. The accepted text is the accepted text.

Discarded candidates and regenerated candidates should not be stored.

After acceptance, the app should remind the user that durable changes likely require manual record updates. Until a verified explicit steward `GO`, the reminder may link only to Segment Reconciliation. The non-user-facing candidate Accepted-Segment Change Review candidate must not appear in the reminder or production navigation. Opening or using Segment Reconciliation must not acknowledge the reminder or imply that canonical updates are complete.

---

## 22. Prompt inspection and audit boundaries

Prompt transparency is required. Permanent prompt archives are not.

The current/generated prompt must be inspectable before sending. The sent prompt may remain visible during the active generation session or around the immediate generation workflow for debugging.

The app must not save prompts permanently as audit artifacts by default.

If temporary prompt inspection is implemented:

- it must not contain API keys or secrets;
- it must not leak local secret storage values;
- it should be easy to clear;
- it must not be treated as story canon;
- it must not become a hidden source for future prompt compilation;
- prompt logs must not be committed to git.

Prompt inspection exists so the user can understand and debug prompt compilation. It does not exist to create a second continuity archive.

---

## 23. OpenRouter and secrets

OpenRouter integration exists in v1.

The app should have one global OpenRouter model setting. The model setting must be stored data-driven in a configurable file or equivalent local configuration surface, not hardcoded into compiler logic.

The app must fail safely and clearly when no API key is configured. Missing-key failure must not damage project data, create partial records, expose prompts to logs, or produce confusing downstream errors.

Secrets rules are constitutional:

- API keys must live in `.env` or equivalent local secret storage.
- API keys must be gitignored.
- API keys must never be stored in story files.
- API keys must never be embedded in prompts.
- API keys must never appear in prompt inspection UI.
- API keys must never appear in logs.
- Example environment files may name variables but must not contain real keys.
- If a key is detected in a project file, prompt, or log, that is a security bug.

OpenRouter is a transport and provider-access layer. It is not a continuity authority. Model choice may affect prose quality, but it must not affect record authority or deterministic prompt compilation.

---

## 24. Local-first and user-owned data

Continuity Loom should be local-first and user-owned.

Project data should be local, inspectable, portable, and exportable. The user should not be locked into a remote service to access their records or accepted prose.

The constitution does not mandate SQL, SQLite, flat files, Markdown, JSON, YAML, or another storage engine. Implementation may use files, SQLite, or another local store if it preserves portability, integrity, inspectability, backup, export, and developer ergonomics.

The app should support easy backup and export. It should be possible for power users to inspect or edit underlying project data with ordinary tools if the storage design permits it. Ordinary users should not be forced to edit raw files.

Remote sync, collaboration, or cloud backup may be future features. They must not make remote storage the sole authority. They must not hide user data behind an opaque service boundary. They must not weaken the rule that the user owns continuity.

---

## 25. Mature fiction envelope

Continuity Loom may support mature, explicit, dark, violent, erotic, morally compromised, traumatic, prejudiced, transgressive, or otherwise disturbing fiction when such content serves character, situation, continuity, and the story’s intended tone.

Continuity Loom does not self-sanitize mature fictional content beyond governing model/provider/platform policy and user/story configuration.

The app-level envelope must not attempt to override external model, provider, or platform policy. Governing external policy remains first in the authority hierarchy.

The prose prompt should avoid assistant-style disclaimers, moral lectures, warnings, safety commentary, or out-of-fiction analysis inside generated prose.

When mature fiction includes prejudiced, biased, or morally reprehensible perception, the prompt must preserve the distinction between character-held perception and narrator-certified truth. The prose may render a character's prejudice as voice, belief, misread, fear, or social pressure, but it must not convert that prejudice into objective story fact unless selected records actually establish it as fact.


Each story may define rating, intensity, explicitness, tone, content handling, and content boundaries. Those story-level fields must be respected, but they do not replace provider policy or continuity constraints.

The content envelope is not a permission to violate character ages, statuses, consent/force continuity, provider constraints, or physical possibility. Mature content must remain bound by story records and validation.

---

## 26. Optional future LLM assistance

Future LLM assistance may be useful for drafting record suggestions, identifying possible inconsistencies, proposing handoff text, extracting candidate events from user-selected prose for review, or helping the user phrase records.

Such assistance must remain non-authoritative.

Any LLM-assisted continuity feature must obey these rules:

- suggestions are suggestions, not record mutations;
- the user must review and accept each proposed change;
- suggestions must be distinguishable from canonical records;
- the app must show provenance for what the suggestion is based on;
- the app must not automatically infer canon from accepted prose;
- the app must not auto-repair records;
- the app must not use an LLM intermediary during deterministic prompt compilation;
- the app must not let the external prose writer update records;
- rejected suggestions should not pollute the active working set.

LLM assistance may reduce clerical effort. It must not replace human continuity authority.

### 26.1 Assistance-output handling

All LLM-assistance surfaces, present and future, obey these shared rules:

- assistance is invoked opt-in, per invocation, pull-based — never
  background-automatic and never push-based;
- assistance output is quarantined in a clearly labeled non-canonical surface; the sole exception is the unsaved CAST MEMBER editor prefill defined by §26.2;
- provenance is mandatory: assistance output must show what records or fields it derives from; for §26.2’s record-free external-dossier workflow, provenance consists of the pasted response plus its filled, skipped, uncertain, and substantially invented field classifications;
- rejected or cleared assistance output leaves no residue in the project
  store, the active working set, or any prompt;
- assistance output is ephemeral by default and is never logged or archived
  by default (mirroring §22); a user may keep items in a session-scoped
  scratch surface, which still obeys every rule above;
- within a single assistance surface, current ephemeral output may
  parameterize a follow-up assistance request (e.g. an avoid-duplicates list
  for regenerating one idea) as explicit, inspectable request input; it must
  never parameterize prose generation.

### 26.2 User-owned dossier draft import

The Cast Member dossier draft-import workflow is the sole assistance-output prefill exception. It may place fields parsed from an external LLM response into the unsaved CAST MEMBER editor only when all of the following are true:

- the user invokes copy and import separately and supplies the source dossier to the external LLM outside Continuity Loom;
- the copied prompt is static and record-free, and the app makes no provider or network call;
- parsing and per-field validation happen locally, `entity_id` and unknown, empty, malformed, or invalid fields are rejected and reported, and fields absent from the response remain untouched;
- before any non-empty editor value is replaced, the app lists the exact affected fields and requires explicit confirmation;
- the editor shows field-level provenance, including filled, skipped, uncertain, and substantially invented fields, until the imported draft is discarded or the record is explicitly saved;
- the paste, import report, and unsaved draft remain ephemeral and leave no project-store, active-working-set, prompt, log, or persisted-browser residue when rejected or abandoned;
- no record is created or updated until the user reviews the prefilled draft and explicitly activates the canonical Save or Create action.

For this exception, prefilling an unsaved editor is clerical assistance, not an authoritative record mutation. The user’s explicit Save or Create action is the continuity-authority gate. This exception does not apply to accepted prose, generation-time fields, active-working-set membership, story configuration, other record types, or any automatic or background assistance path.

---

## 27. UI and workflow principles

The UI should make high-friction continuity work feel pleasant, fast, and tractable.

It should support:

- fast atomic record creation through templates or forms;
- discoverable rich cast dossier editing;
- easy active working set curation;
- clear distinction between story records, author-private story notes, active
  working set, generation-time brief, generated prompt, and accepted segment
  archive;
- author-private notes must be labeled and arranged so the user can tell they
  are inert scratch, not continuity authority and not prompt context;
- clear validation errors;
- prompt inspection;
- editable Draft Candidate prose before acceptance, whether OpenRouter-generated or user-supplied;
- regenerate and discard paths;
- accepted segment browsing;
- post-acceptance reminders to update records;
- visible object/location/entity state;
- obvious POV and secret-boundary controls;
- no hidden automatic continuity mutation.

The UI should respect power users without punishing ordinary users. Power users may edit underlying files manually if the project storage supports it. Ordinary use should be possible through the app.

The app should make dangerous actions hard to do accidentally: accepting prose without understanding durable changes, generating from contradictory state, sending with missing secrets, leaking API keys, or relying on prose archives as canon.

Author-facing generation diagnostics should be presented as a readiness checklist, not as raw validation codes. The same readiness model must drive Generation Brief, Prompt Preview, and Generate. Draft saving should show whether the draft saved and whether Preview or Generate remain blocked. Warnings should explain what may degrade and why ignoring them may be reasonable.

---

## 28. Research-grounded conclusions

The following conclusions are settled for this project.

### 28.1 Prior accepted prose must not become prose-prompt context or automatic canon

Accepted prose must never be included in a prose prompt. Structured records and user-authored handoff fields remain the continuity mechanism. This avoids prose echo, style mimicry, context bloat, and prose-as-canon drift.

One narrow accepted-prose assistance exception is allowed. Until the evidence gate resolves, the active `segment-reconciliation` profile and the non-user-facing candidate `accepted-segment-change-review` profile may each inspect exactly the explicitly requested latest accepted segment as bounded evidence for quarantined advisory review. The segment remains non-authoritative; model output must not materially quote it into proposed values or readable review text; and no result is stored or reused without explicit, independent user authorship in a canonical surface.

### 28.2 Long-context capability does not justify archive dumping or hidden source loss

Long context windows are useful, but they do not make indiscriminate context safe. Important information can be underused when buried in the middle of long prompts. Continuity Loom should use stable sections, place hard state and final stop/output instructions near prompt edges, and avoid dumping prose archives.

Both one-segment profiles therefore read one complete accepted segment only. Neither may read a multi-segment range, retrieve excerpts by similarity or keyword, summarize an archive, or silently truncate, compress, rank, batch, or omit the segment or selected record scope. If the declared complete source cannot fit, the operation fails and asks the user to choose an explicit permitted scope or compatible model; the compiler never decides what to omit.

### 28.3 Record-grounded generation resembles RAG/context engineering

Selected story records function as explicit external context for the prose writer. The app’s job is not to rely on model memory. Its job is to supply the right current story state as inspectable context.

### 28.4 Narrative-planning research informs causality, not plot machinery

Narrative-planning research supports the importance of causal progression and believable intentional agents. Continuity Loom adopts that through plans, intentions, clocks, obligations, consequences, affordances, beliefs, relationships, and current state. It rejects automated plot structures and global story rails.

### 28.5 Local-first principles apply strongly

Writing projects are personal creative data. The app should preserve ownership, local access, portability, long-term availability, backup, and user control. Cloud services may assist, but they should not own continuity.

### 28.6 Resolved and abandoned records are pressure only when current

Deprecated facts are dangerous prompt-facing material. Resolved and abandoned pressure records are useful only when the resolution or abandonment still matters as current causal or characterization pressure.

### 28.7 Character speech should be profiled, not mimicked

Rich voice fields preserve character specificity better than generic labels. Sample utterances can help, but too many examples can over-condition outputs and encourage mimicry. Use sparse, annotated, non-copyable speech-function examples.

### 28.8 Validate-and-block before generation is the differentiator

Surveyed story-AI tools maintain story state, but none deterministically validate and block generation on inconsistent state; the field handles consistency probabilistically after generation, or not at all. Continuity Loom's fail-closed pre-generation gate is a deliberate inversion of the field's norm, not an implementation detail.

The industry's recurring failure modes are rejected by name:

- **state laundering** — AI-generated bible entries, automatic prose-derived summaries, or AI-updated profiles quietly becoming canon;
- **keyword-triggered context activation** — record inclusion decided by string matching against recent text instead of explicit user selection;
- **token-budget eviction** — silently trimming or dropping selected context to fit a budget;
- **probabilistic inclusion** — records entering the prompt by chance.

Compiled prompt size never causes silent eviction. Oversize and salience risks are warning surfaces; the user, not the compiler, decides what leaves the active working set.

---

## 29. Alignment checklist for future PRDs and issues

A future PRD, implementation issue, feature, workflow, validation rule, compiler change, schema change, or UI change must pass this checklist.

If any hard-fail question is answered “yes,” the proposal violates the foundation and must be rejected or redesigned.

### 29.1 Identity hard fails

- Does it turn Continuity Loom into an autonomous story generator?
- Does it make the app responsible for deciding future plot?
- Does it add branching, alternative timelines, branch histories, or a canon tree?
- Does it introduce plot-rail machinery into logic, validation, compiler behavior, or prompts?
- Does it make accepted prose a source of canon?
- Before a verified explicit steward `GO`, does it expose Accepted-Segment Change Review through production navigation, the post-acceptance reminder, a public old/new toggle, a compatibility alias, or a second active prompt authority; or remove, rename, alias, or weaken the user-facing Segment Reconciliation workflow?
- Does it treat candidate implementation, a passing offline readiness bar, favorable live-smoke output, or closure of any replacement issue as equivalent to the repository owner’s explicit evidence-backed `GO` receipt?

### 29.2 Continuity authority hard fails

- Does it let an LLM make authoritative record or generation-brief changes?
- Does it infer canon automatically from accepted prose or assistance output?
- Does it treat an accepted segment as continuity authority rather than bounded evidence for the exact one-segment assistance profile being used?
- Does it mutate a stored record or generation-time field without explicit user review and an explicit canonical save, or bypass independent authorship outside the exact unsaved CAST MEMBER draft-prefill exception in §26.2?
- Does it allow the external prose writer to update records?
- Does it hide continuity changes inside generation, regeneration, acceptance, reconciliation, change review, or reminder acknowledgement?
- Does it let assistance output enter a prose prompt, stored story record, generation-time field, or active working set automatically or through an assistance-surface prefill or staging control outside the exact unsaved CAST MEMBER draft-prefill exception in §26.2?
- Does it materially copy or echo accepted prose into a proposed canonical value, Accepted-Segment Change Review item, coverage reason, uncertainty field, or target hint?

### 29.3 Active working set and assistance-scope hard fails

- Does it silently include records the user did not select in a prose prompt, or treat records outside the active working set as authority for prose generation?
- Does a record-scoped assistance prompt hide, vary, or incompletely render the source predicate within its declared user-selected scope; apply a scope the user did not explicitly select; or fail to disclose its active scope in the compiled prompt and inspection UI?
- Does Segment Reconciliation or the non-user-facing candidate Accepted-Segment Change Review candidate apply a hidden status predicate, semantic-active filter, retrieval or ranking rule, reference closure, batching rule, summarization step, or token-budget omission instead of completely rendering every qualifying record in the explicitly selected scope?
- Does it let a reference-label stub become a change target or import an out-of-scope payload without explicit whole-project selection?
- Does it silently remove selected records?
- Does it silently compress active/onstage cast dossiers?
- Does it treat inactive records as branches?
- Does it prevent the user from inspecting what will be compiled?

### 29.4 Prompt compilation hard fails

- Does it use an LLM intermediary to select, rank, summarize, repair, rewrite, or omit records, accepted prose, fields, or evidence spans during prompt compilation?
- Does it make prompt output nondeterministic for identical inputs and versions?
- Does any prose prompt include accepted prose?
- Does any assistance prompt include accepted prose outside the exact active `segment-reconciliation` profile or non-user-facing candidate `accepted-segment-change-review` profile?
- Does either sanctioned one-segment profile read more than one accepted segment; read a non-selected segment, candidate, regeneration, archive range, or automatic prose-derived summary; choose source by content; or substitute a model/compiler summary for the complete selected segment?
- Does either sanctioned one-segment profile silently trim, compress, retrieve, rank, summarize, batch, or token-budget-evict accepted-segment text or any qualifying record?
- Does it treat accepted-segment data as prompt instructions, expose an uninspected provider transform, or use hidden response repair?
- Does it preserve provider-specific prompt hacks as v1 core behavior?
- Does it omit one of the universal prompt contract sections for prose prompts other than the designated optional sections enumerated in §9 without constitutional amendment, or omit even a designated optional section nondeterministically?
- Does an assistance prompt use a source profile that is not explicitly named and deterministically specified in its domain authority and the compiler contract?
- Does a project-review, `segment-reconciliation`, or non-user-facing candidate `accepted-segment-change-review` assistance prompt cause its source records or output to enter a prose prompt or alter active-working-set membership?
- Does an assistance prompt select, rank, omit, or evict source records by keyword activation, probability, model judgment, hidden embeddings, token budget, candidates, author-private notes, or hidden UI state?
- Does either one-segment profile accept a client-supplied prompt instead of rebuilding and fingerprint-checking the declared source?
- Does the non-user-facing candidate Accepted-Segment Change Review model-output contract contain a schema catalog, JSON Patch, lifecycle operation, complete creation payload, full proposed canonical value, or other formal mutation vocabulary?

### 29.5 Validation hard fails

- Does it allow generation from contradictory current state?
- Does it allow generation when mandatory generation-time fields are missing?
- Does it allow a manual directive or stop guidance that asks for whole chapters, global outlines, alternate options (in a prose prompt or its directive/stop guidance), future summaries, plot beats, or multiple response points instead of one local prose segment?
- Does it allow impossible physical movement, perception, timing, object possession, or knowledge?
- Does it allow secret leakage when deterministic records forbid it?
- Does it allow a user override for hard validation failure in v1?
- Does it treat validation warnings and blockers as the same thing?
- Does it block saving a structurally saveable generation-time draft because readiness fields are incomplete?
- Does it block Preview, Generate, prompt compilation, or provider sending for anything other than a true blocker?
- Does it treat blank optional `soft_unit_guidance` as a blocker even though the universal stop rule remains compiled?
- Does it make `generation_context` depend on a UI-only local default instead of deterministic normalization from accepted-segment count?
- Does it let a warning gate Preview, Generate, prompt compilation, provider sending, candidate generation, or draft saving?
- Does a diagnostic assistance prompt block merely because the questionable condition it exists to inspect is present, when its declared source remains structurally representable and safe to send?
- Does Accepted-Segment Change Review accept model output that contains fields other than `contract`, `items`, and `coverage`, or that lacks exactly one reasoned coverage row for each of its six declared dimensions?
- Does it fail to quarantine the complete Change Review response when malformed, stale, enum-invalid, coverage-incomplete, citation-invalid, or materially echoing accepted prose (with an invented or explicitly unstated `established change` caught structurally by the `evidence_excerpt` witness in the next check, not by keyword heuristics)?
- Does it accept an `established change` Change Review item whose `evidence_excerpt` is missing, is not a three-to-seven-word verbatim excerpt, or does not occur in one cited evidence span; or accept an `interpretation requiring author judgment` item whose `evidence_excerpt` is not the empty string?
- Does it present an empty Change Review `items` list as a verified clean result rather than requiring all six reasoned coverage rows and visibly labeling the result unverified advice?

### 29.6 POV and reveal hard fails

- Does it blur POV knowledge with audience knowledge?
- Does it allow writer-visible secrets to leak into the wrong narrator or mind?
- Does it omit secret holders, non-holders, allowed clues, forbidden reveals, or reveal permission when secrets are active?
- Does it allow non-POV interiority in a prose mode that forbids it?

### 29.7 Physical continuity hard fails

- Does it allow objects to change hands without action?
- Does it allow characters to move without route, time, or physical possibility?
- Does it allow offstage interruption without communication, entrance, or timing route?
- Does it omit current location when bodies or objects matter?
- Does it treat physical continuity as optional prose texture rather than story state?

### 29.8 Accepted prose archive hard fails

- Does it store rejected candidates by default?
- Does it use accepted segments as prose-prompt context?
- Does it use accepted prose as assistance-prompt context outside the exact active `segment-reconciliation` profile or non-user-facing candidate `accepted-segment-change-review` profile?
- Does either one-segment profile read a range or archive, expose an older-segment chooser, include a model-selected excerpt, or allow a provider transform to omit part of the selected segment?
- Does it automatically store, summarize, canonize, or reuse information mined from accepted prose?
- Does it require accepted segments to mark whether the user edited them?
- Does it hide accepted segments from user review?
- Does it fail to remind the user to update records after accepted durable changes?
- Does opening Segment Reconciliation automatically acknowledge or clear the durable-change reminder, or does the non-user-facing candidate Accepted-Segment Change Review candidate appear in or alter that reminder before `GO`?

### 29.9 Prompt audit, assistance scratch, and secrets hard fails

- Does it permanently archive prompts or assistance responses by default?
- Does it commit prompt logs to git?
- Does it persist accepted-segment prompt copies, raw Segment Reconciliation output, parsed formal proposals, Accepted-Segment Change Review items or coverage, comparison scratch, or keeper/review state in the project store or durable browser storage by default?
- Does clearing assistance scratch leave project-store, working-set, prompt, log, or persisted browser residue?
- Does it expose API keys in prompt inspection UI?
- Does it store API keys in story files?
- Does it log API keys or embed them in prompts?
- Does it send accepted prose or record secrets without an explicit source disclosure and user-initiated provider action?
- Does it fail unclearly when no OpenRouter key is configured?

### 29.10 Data ownership hard fails

- Does it make remote storage the sole source of truth?
- Does it prevent local access to project data?
- Does it make export or backup unreasonably difficult?
- Does it lock user continuity behind an opaque service boundary?

### 29.11 Quality and workflow checks

These are not all hard fails, but a good proposal should satisfy them.

- Does it make atomic record creation faster?
- Does it make active working set selection clearer?
- Does it improve validation legibility?
- Does it preserve prompt inspectability?
- Does it make cast dossier editing more discoverable?
- Does it preserve rich active cast voice?
- Does it keep `manual_moment_directive.must_render` readiness-required while allowing draft saving before it is filled?
- Does it treat current cast voice pressure as optional salience unless supplied pressure contradicts authority or the local mode needs voice/body authority with no durable or compressed source?
- Does it reduce clerical friction without reducing authorial control?
- Does it help the user update records after accepted durable changes?
- Does it make the project surfaces more distinct rather than more blurred,
  keeping author-private notes visibly separate from the five continuity surfaces?

### 29.12 Author-private notes hard fails

- Does the change allow author-private notes — their titles, bodies, tags,
  metadata, previews, summaries, or derived material — to influence validation,
  readiness, active working set, compiler input, any prompt, any OpenRouter
  request, prompt inspection, or assistance output? If yes, fail.
- Does the change treat a note as a story record, generation-time field, record
  reference target/source, active-working-set member, accepted prose source, or
  promote-to-record staging item? If yes, fail.

---

## 30. Source notes

This constitution incorporates the uploaded project brief, universal prompt template, prompt-template rationale, story-record schema, and Red Bunny prompt example as core project context.

It also incorporates research and provider guidance in these areas:

- structured prompting and XML/Markdown prompt boundaries;
- long-context limitations and placement sensitivity;
- retrieval-augmented generation and explicit external context;
- narrative planning, causal progression, and character intentionality;
- persona and role-playing research for character consistency;
- few-shot over-prompting risk;
- local-first software principles;
- OpenRouter authentication and API-key handling.

The research informs the constitution but does not dilute its settled product identity. Continuity Loom remains record-first, continuity-first, local-prose-only, user-owned, and non-branching.

Selected reference anchors:

- OpenAI API documentation, “Prompt engineering”: https://developers.openai.com/api/docs/guides/prompt-engineering
- Anthropic Claude documentation, “Prompting best practices”: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- Google Gemini API documentation, “Prompt design strategies”: https://ai.google.dev/gemini-api/docs/prompting-strategies
- Liu et al., “Lost in the Middle: How Language Models Use Long Contexts”: https://arxiv.org/abs/2307.03172
- Lewis et al., “Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks”: https://arxiv.org/abs/2005.11401
- Riedl and Young, “Narrative Planning: Balancing Plot and Character”: https://arxiv.org/abs/1401.3841
- Tseng et al., “Two Tales of Persona in LLMs: A Survey of Role-Playing and Personalization”: https://aclanthology.org/2024.findings-emnlp.969/
- Tang et al., “The Few-shot Dilemma: Over-prompting Large Language Models”: https://arxiv.org/html/2509.13196v1
- Kleppmann, Wiggins, van Hardenberg, and McGranaghan, “Local-first software”: https://www.inkandswitch.com/essay/local-first/
- OpenRouter documentation, “Authentication”: https://openrouter.ai/docs/api/reference/authentication
- OpenRouter documentation, “Quickstart”: https://openrouter.ai/docs/quickstart
- Novelcrafter: https://www.novelcrafter.com/
- Sudowrite: https://www.sudowrite.com/
- Raptor Write: https://raptorwrite.com/
- Plottr: https://plottr.com/
- Campfire: https://www.campfirewriting.com/
- World Anvil: https://www.worldanvil.com/
- SillyTavern World Info documentation: https://docs.sillytavern.app/usage/core-concepts/worldinfo/
- NovelAI Lorebook documentation: https://docs.novelai.net/text/lorebook.html
- AI Dungeon: https://aidungeon.com/
- waterverri/continuum: https://github.com/waterverri/continuum
