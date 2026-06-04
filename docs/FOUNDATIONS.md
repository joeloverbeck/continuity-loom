# FOUNDATIONS.md — Continuity Loom

Status: constitutional baseline  
Date: 2026-06-04  
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

---

## 2. App identity

Continuity Loom is a **story-state operating system** for continuity-first prose generation.

It is not an autonomous story generator.  
It is not a plot planner.  
It is not a branching-story engine.  
It is not a dramatic-rail manager.  
It is not a prose archive treated as canon.  
It is not an agent that decides what the story “really” means.

The user maintains a single current story continuity as structured story records. The app compiles the user-selected active working set of records into a deterministic universal prose prompt. The app sends that prompt through OpenRouter to an external LLM prose writer. The user may edit, regenerate, discard, or accept the returned candidate prose. Accepted prose becomes readable story output. It does not become the canonical source of truth for later prompt generation.

The constitutionally correct mental model is:

> The records are the loom. The prompt is the shuttle. The generated prose is cloth. The cloth is not the loom.

---

## 3. Core loop

The canonical workflow is:

1. The user adds, modifies, removes, or selects story records.
2. The user curates the active working set for the next generation.
3. The user edits generation-time fields, especially the manual directive, current authoritative state, and immediate handoff.
4. Deterministic validation runs.
5. If validation fails, prompt generation and OpenRouter sending are blocked.
6. If validation passes, the deterministic compiler generates the universal prose prompt.
7. The user can inspect the generated prompt.
8. The app sends the prompt to OpenRouter using the configured global model setting.
9. The app receives candidate prose from the external prose writer.
10. The user may edit the candidate prose before acceptance.
11. The user may regenerate, discard, or go back to modify records and generation-time fields.
12. The user accepts a final prose segment.
13. The app stores the accepted segment text plus useful metadata.
14. The app reminds the user that durable changes in the accepted segment likely require manual record updates.
15. The user manually updates records before the next generation.

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

When deterministic validation detects contradictions, impossible prompt conditions, unsafe continuity gaps, or dangerous prompt-quality gaps, generation must be blocked.

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

## 6. The five continuity surfaces

Continuity Loom must keep these surfaces distinct.

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

### 6.4 Generated prompt

The deterministic, inspectable prompt compiled from the active working set and generation-time brief.

The generated prompt is not canon. It is an operational artifact for one generation request.

### 6.5 Accepted prose segment archive

The ordered readable output archive.

Accepted segments are story text. They are not the future-generation authority.

---

## 7. Active working set supremacy

The active working set is a first-class authorial decision.

The user decides which story records matter for the next local prose segment. A record may be hard canon, emotionally important, globally true, or historically central and still be omitted if the user judges it irrelevant to the current segment.

The app should make active working set curation fast, pleasing, and hard to misuse. It should support templates, filtering, search, grouping, salience labels, inclusion/exclusion controls, and clear record previews.

The app may warn when the active working set is risky. It may block generation when the working set is structurally unsafe. It must not override the user by silently adding, removing, compressing, rewriting, or reprioritizing records.

---

## 8. Deterministic prompt compilation

The prompt compiler is a deterministic renderer, not an intelligence layer.

It must:

- compile from selected records and generation-time fields;
- use stable section names and deterministic ordering;
- render records into prose-facing prompt sections, not raw database dumps;
- preserve author-written nuance fields;
- keep operational fields meaningful for validation and formatting;
- separate state, handoff, knowledge, secrets, cast, pressure, affordances, and stop instructions;
- expose the generated prompt to the user for inspection.

It must not:

- use an LLM to choose records;
- use an LLM to summarize selected records;
- use an LLM to repair contradictions;
- decide by intuition what matters;
- silently compress active/onstage cast dossiers;
- infer missing pressure from archived prose;
- include accepted prose text in prompts;
- mutate story records.

Structured fields carry operational meaning. Author-written prose fields carry nuance. The compiler must respect both. A relationship axis, status enum, or salience tag may help sort and validate records, but the prompt-facing rendering should use human-authored pressure text whenever nuance matters.

---

## 9. Universal prose prompt contract

Continuity Loom uses one universal prose prompt template in v1.

The template must remain portable, inspectable, and model-provider-neutral. Markdown with XML-style section boundaries is the constitutional default because it is readable to humans and gives models stable semantic boundaries.

Provider-specific wrappers, hacks, hidden adapters, or model-specific prompt forks must not enter the v1 core. Future provider-specific compatibility layers may exist only if explicitly justified and only if they preserve the universal prompt contract.

The universal prompt must preserve these conceptual sections:

- role and output contract;
- authority hierarchy;
- content policy;
- story contract;
- prose mode;
- hard canon;
- current authoritative state;
- immediate handoff;
- manual directive;
- POV knowledge constraints;
- audience knowledge;
- secrets and reveal constraints;
- active working set;
- active cast full dossiers;
- present minor cast;
- offstage relevance;
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

---

## 10. No accepted prose in generated prompts

Accepted prose segments must not be included in generated prose prompts.

This is a hard constitutional rule.

The reason is continuity discipline. Accepted prose encourages phrase echo, style mimicry, accidental leakage, context bloat, and prose-as-canon drift. Continuity Loom must not ask the external prose writer to derive continuity from prior prose.

The correct mechanism for carrying prior events forward is structured story state, especially:

- EVENT;
- CURRENT AUTHORITATIVE STATE;
- IMMEDIATE HANDOFF;
- FACT;
- BELIEF;
- RELATIONSHIP;
- EMOTION;
- PLAN;
- CLOCK;
- OBLIGATION;
- CONSEQUENCE;
- OPEN THREAD;
- LOCATION;
- OBJECT;
- AFFORDANCE;
- CAST MEMBER.

The only allowed continuation-launch material is user-authored generation-time context, such as recent causal context, last visible moment, begin-exactly-after-this guidance, manual directive, relevant current state, and selected EVENT records.

Any template field that appears to refer to the most recent accepted prose must be interpreted narrowly: it may contain `None`, or it may be replaced by a user-authored handoff note that summarizes continuity-relevant state. It must not contain verbatim accepted prose. It must not contain automatic authoritative prose-derived summary. It must not invite the model to mine the prose archive for canon.

---

## 11. Validation and hard fails

Validation is deterministic and blocking.

Generation must be blocked when deterministic validation detects contradictions, impossible conditions, or dangerous prompt-quality gaps. OpenRouter sending must remain disabled until the user fixes the records or generation-time fields.

There is no override in v1.

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
- missing stop guidance;
- selected secret is both hidden from POV and revealed to POV by another selected record;
- no current authoritative state for an active physical interaction;
- active physical action lacks necessary bodies, objects, routes, consent/force conditions where relevant, or available time;
- active plan belongs to a dead, captive, unconscious, absent, or incapacitated entity with no plausible means to act;
- active obligation, consequence, or clock assumes a state contradicted by selected current state;
- content envelope contradicts active cast ages, statuses, story configuration, or provider constraints;
- prompt sections required by the universal prompt contract are missing or structurally empty where needed.

Validation errors must be legible and actionable. A validation error should identify the conflicting records or fields, explain the conflict in plain language, and indicate what the user can change.

The app should distinguish warnings from blockers. Length warnings, lost-in-the-middle warnings, salience doubts, or missing optional nuance may be warnings. Contradictions, impossible prompt conditions, and missing mandatory generation fields are blockers.

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

The prompt must not ask for alternate options, future summaries, downstream consequences, chapter packages, or global continuation plans.

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

The app should allow the user to see accepted segments individually and in order. Segment browsing is a reading and review affordance, not a prompt source.

Accepted segment metadata should include:

- story identifier;
- segment order or index;
- timestamp;
- model used;
- provider/model identifier;
- prompt template version where available;
- compiler version where available.

The app does not need to mark whether the user edited the candidate before acceptance. The accepted text is the accepted text.

Discarded candidates and regenerated candidates should not be stored.

After acceptance, the app should remind the user that durable changes likely require manual record updates.

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

---

## 27. UI and workflow principles

The UI should make high-friction continuity work feel pleasant, fast, and tractable.

It should support:

- fast atomic record creation through templates or forms;
- discoverable rich cast dossier editing;
- easy active working set curation;
- clear distinction between all records, active working set, generation-time brief, generated prompt, and accepted segment archive;
- clear validation errors;
- prompt inspection;
- editable generated prose before acceptance;
- regenerate and discard paths;
- accepted segment browsing;
- post-acceptance reminders to update records;
- visible object/location/entity state;
- obvious POV and secret-boundary controls;
- no hidden automatic continuity mutation.

The UI should respect power users without punishing ordinary users. Power users may edit underlying files manually if the project storage supports it. Ordinary use should be possible through the app.

The app should make dangerous actions hard to do accidentally: accepting prose without understanding durable changes, generating from contradictory state, sending with missing secrets, leaking API keys, or relying on prose archives as canon.

---

## 28. Research-grounded conclusions

The following conclusions are settled for this project.

### 28.1 Prior accepted prose should not be included in prompts

Accepted prose should not be included by default and should not be included in v1 at all. Structured records and user-authored handoff fields are the continuity mechanism. This avoids prose echo, style mimicry, context bloat, and prose-as-canon drift.

### 28.2 Long-context capability does not justify archive dumping

Long context windows are useful, but they do not make indiscriminate context safe. Important information can be underused when buried in the middle of long prompts. Continuity Loom should use stable sections, place hard state and final stop/output instructions near prompt edges, and avoid dumping prose archives.

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

---

## 29. Alignment checklist for future specs and tickets

A future spec, ticket, feature, workflow, validation rule, compiler change, schema change, or UI change must pass this checklist.

If any hard-fail question is answered “yes,” the proposal violates the foundation and must be rejected or redesigned.

### 29.1 Identity hard fails

- Does it turn Continuity Loom into an autonomous story generator?
- Does it make the app responsible for deciding future plot?
- Does it add branching, alternative timelines, branch histories, or a canon tree?
- Does it introduce plot-rail machinery into logic, validation, compiler behavior, or prompts?
- Does it make accepted prose a source of canon?

### 29.2 Continuity authority hard fails

- Does it let an LLM make authoritative record changes?
- Does it infer canon automatically from accepted prose?
- Does it mutate records without explicit user review and acceptance?
- Does it allow the external prose writer to update records?
- Does it hide continuity changes inside generation, regeneration, or acceptance?

### 29.3 Active working set hard fails

- Does it silently include records the user did not select?
- Does it silently remove selected records?
- Does it silently compress active/onstage cast dossiers?
- Does it treat inactive records as branches?
- Does it prevent the user from inspecting what will be compiled?

### 29.4 Prompt compilation hard fails

- Does it use an LLM intermediary to select, rank, summarize, repair, or rewrite records during prompt compilation?
- Does it make prompt output nondeterministic for identical inputs and versions?
- Does it include accepted prose in generated prompts?
- Does it preserve provider-specific prompt hacks as v1 core behavior?
- Does it omit one of the universal prompt contract sections without constitutional amendment?

### 29.5 Validation hard fails

- Does it allow generation from contradictory current state?
- Does it allow generation when mandatory generation-time fields are missing?
- Does it allow impossible physical movement, perception, timing, object possession, or knowledge?
- Does it allow secret leakage when deterministic records forbid it?
- Does it allow a user override for hard validation failure in v1?
- Does it treat validation warnings and blockers as the same thing?

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
- Does it use accepted segments as prompt context?
- Does it require accepted segments to mark whether the user edited them?
- Does it hide accepted segments from user review?
- Does it fail to remind the user to update records after accepted durable changes?

### 29.9 Prompt audit and secrets hard fails

- Does it permanently archive prompts by default?
- Does it commit prompt logs to git?
- Does it expose API keys in prompt inspection UI?
- Does it store API keys in story files?
- Does it log API keys or embed them in prompts?
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
- Does it reduce clerical friction without reducing authorial control?
- Does it help the user update records after accepted durable changes?
- Does it make the five continuity surfaces more distinct rather than more blurred?

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
