# Validation Engine — Continuity Loom v1

## Purpose

The validation engine protects continuity before prompt compilation and OpenRouter sending. It is deterministic, fail-closed, and author-facing. Its job is not to improve prose, but to prevent impossible, contradictory, structurally unsafe, or constitutionally invalid prompts from being generated.

## Scope

This spec covers deterministic validation doctrine, blocker/warning behavior, universal minimum completeness, validation focus tags, context-dependent checks, error-message requirements, no-overrides, prompt/send gating, failure modes, and Done Means.

It does not define test files, production code, UI layouts, or low-level validation functions.

## Non-goals

This spec does not define a prose-quality grader, model critic, auto-repair agent, plot planner, or override system. It does not use validation focus tags as story beats and does not allow warnings to become prompt instructions.

## Doctrine

Validation is deterministic. Given the same project records, selected active working set, generation-time brief, story configuration, template version, compiler version, and compiler contract version, validation produces the same diagnostics.

Validation must not use an LLM to detect contradictions, fill gaps, summarize missing context, propose automatic repair, or choose selected records.

Validation fails closed. In v1, blockers cannot be overridden. The user fixes records, current state, directive, stop guidance, selections, or focus tags before preview/send can proceed.

## Blockers vs warnings

### Blockers

Blockers prevent prompt preview, prompt compilation, and OpenRouter sending. They indicate contradictions, impossible prompt conditions, missing mandatory fields, accepted-prose contamination, secret leakage, physical impossibility, or local-prose-only violations.

### Warnings

Warnings are visible but do not block. They indicate risk, likely prompt-quality weakness, length/lost-in-the-middle concerns, sparse optional context, too many high-salience records, missing optional samples, or other non-fatal issues.

Warnings never compile into the prompt. A warning is an app-surface diagnostic, not an instruction to the external prose writer.

## Universal minimum completeness

Every generation must satisfy the universal minimum from `compiler-contract(8).md`:

- role/output contract, authority hierarchy, content policy, story contract, prose mode, stop rule, and final output instruction exist;
- story title, premise, tone/content envelope, language/register, and prose mode are populated enough to avoid a generic prompt;
- current authoritative state, immediate handoff, manual directive, and stop guidance exist and remain local-prose-only;
- non-omniscient POV has a populated POV knowledge profile;
- active secrets have holders, protected non-holders, allowed cues when clues may appear, forbidden reveals, and reveal permission;
- active physical interaction has location, onstage entities, positions/distance, possession state when objects matter, visibility/line of sight, routes/exits, available time, and unavailable/impossible actions where omission invites errors;
- active/onstage person-like cast materially involved has a core dossier and local function;
- validation focus tags identify first segment vs continuation and activate relevant contextual blockers;
- optional prompt sections render explicit empty states;
- accepted prose text, rejected candidate text, superseded regeneration text, and automatic prose-derived summaries are absent from prompt-facing fields.

## Validation focus tags

Validation focus tags are user-selected or deterministically suggested from explicit UI controls. They are validation controls only. They are not plot beats, acts, arcs, milestones, dramatic structure, or instructions to force events.

Exactly one generation-context tag is required:

- `first_segment`; or
- `continuation_after_accepted_segment`.

Expected local mode tags include dialogue, ensemble dialogue, introspection, physical interaction, active silent presence, present-minor speech, ambiguous perception, offstage interruption, nonhuman/institutional pressure, secret/clue pressure, and non-POV hidden-plan behavior.

Possible durable-change tags include object use, object transfer, location change, restraint/coercion, intimacy/sex, violence/injury, institutional involvement, clock tick, and obligation breach.

The UI may provide deterministic suggestions such as “You selected two likely speakers; add `dialogue_expected`?” The UI must not silently set or clear tags without explicit user action unless the control itself is explicitly defined as setting that tag.

## Context-dependent validation matrix

V1 must implement the validation matrix in `compiler-contract(8).md`. The following implementation interpretation is binding:

- `dialogue_expected`: active speakers require CAST MEMBER core voice anchors, current voice pressure or sufficient durable pin, language/register state, knowledge boundaries, and relationship/status context.
- `ensemble_dialogue_expected`: three or more likely speakers require distinct voice pins, speaker functions, relationship/status pressure, and audibility/interruptibility state.
- `introspection_expected`: requires POV beliefs/suspicions/misreads, relevant emotion/interior pressure, psychic distance/interiority mode, and non-POV interiority restrictions.
- `physical_interaction_expected`: requires location, bodies, positions/distance, visibility, relevant possessions, routes/exits, available time, and impossible/unavailable actions when omission invites errors.
- `active_silent_presence_expected`: requires active silent cast body presence, position/visibility, nonverbal/silence pressure, allowed actions, and POV access limits.
- `present_minor_speech_possible`: present-minor speaker needs a compressed voice note or promotion to active/onstage full.
- `ambiguous_perception_expected`: requires line-of-sight/sound state, obstruction/uncertainty, what POV can/cannot perceive, possible misreads, and audience/writer knowledge difference when applicable.
- `offstage_interruption_possible`: requires offstage location or uncertainty, awareness mechanism, communication/entrance/timing route, and interruption type.
- `nonhuman_or_institutional_pressure_expected`: requires operating rules, reach, authority relation, current pressure mechanism, and limits on agency/interiority.
- `secret_or_clue_pressure`: requires secret claim, holders, protected non-holders, POV access, audience visibility, allowed clues, forbidden reveals, reveal permission, and triggers if any.
- durable-change tags require the corresponding physical, object, consent/force, route/time, injury, institution, clock, or obligation state.

## Universal blockers

The engine must block at least these conditions:

- manual directive or stop guidance requests a whole chapter, global outline, alternate options, downstream consequence summary, act/beat/chapter package, plot arc, milestone, or multiple response points;
- manual directive and stop guidance disagree about the local unit;
- current authoritative state contradicts immediate handoff;
- selected records place one entity in two current locations;
- selected records give one object two current holders;
- an active plan belongs to a dead, unconscious, captive, incapacitated, absent, or otherwise unable entity with no plausible means to act;
- selected secret is both hidden from and known by the same POV without explicit partial/ambiguous access;
- hidden truth appears in a POV-knowledge field that should not contain it;
- offstage interruption lacks route, timing, communication, or awareness mechanism;
- physical action lacks bodies, positions, routes, visibility, time, or consent/force conditions where relevant;
- active/onstage cast materially involved lacks required core dossier fields;
- expected dialogue lacks enough voice pressure;
- content envelope contradicts active cast ages/statuses, story configuration, or provider constraints;
- prompt-facing fields contain accepted prose text, rejected candidate text, superseded regeneration text, or automatic prose-derived summaries;
- any required constitutional prompt section is missing or structurally empty.

## Warning examples

Warnings include:

- prompt length or lost-in-the-middle risk;
- many high-salience records selected for one local unit;
- no sample utterances selected;
- sparse setting texture;
- no active clock/obligation/open thread when directive otherwise suffices;
- long active dossier may need stronger current voice/body pressure pin;
- low-drama scene may need sharper prose-craft pressure;
- selected record is old or resolved but may still be relevant.

Warnings should help the user improve curation without turning the app into a nagging planner.

## Diagnostic message requirements

Each diagnostic must include:

- severity: blocker or warning;
- stable diagnostic code;
- plain-language explanation;
- affected records/fields when available;
- why it matters for continuity/prompt safety;
- suggested user actions such as revise, remove, deselect, add current state, add route, add knowledge constraint, add reveal permission, promote cast, add voice/body pressure, change directive, or change stop guidance.

Diagnostic text must not be moralizing, vague, or model-facing. It is a user repair surface.

## Prompt/send gating

If blockers exist:

- no prompt preview;
- no partial prompt preview;
- no OpenRouter send;
- no “send anyway” button;
- no hidden override flag;
- no LLM repair pathway.

If only warnings exist:

- prompt preview is allowed;
- sending is allowed;s
- warnings remain visible in the app but do not compile into the prompt.

Missing OpenRouter API key blocks send but should not block validation or prompt preview when the prompt itself is valid.

## User-facing behavior

The validation panel should be visible near the generation workflow and should summarize blockers and warnings separately. Blockers should be surgical and actionable. Warnings should be collapsible or visually quieter.

Clicking a diagnostic should navigate to the affected record or field when possible. Fixing a field should re-run validation deterministically.

## Data/logic implications

Validation should operate on an explicit immutable snapshot of project records, active working set, and generation-time brief. It should not read from accepted segments except to prove they are not in compiler inputs. It should not mutate records.

Validation results may be cached for UI responsiveness, but cache invalidation must be based on input snapshot/version. Cached diagnostics must never authorize prompt generation from stale invalid state.

## Alignment with `FOUNDATIONS.md`

This spec implements fail-closed validation, no v1 blocker override, prompt/send blocking, no accepted prose in prompts, physical continuity, POV/reveal discipline, no plot rails, and deterministic compiler preconditions.

## Security/privacy implications

Validation must not include API keys in diagnostics. If a key-like string is detected in a project file, prompt-facing field, or generated prompt candidate, that is a security blocker or bug-level diagnostic.

Diagnostics should not copy large sensitive prose into logs. UI may show affected field excerpts only when useful and local.

## Validation implications

The validation engine is itself the gatekeeper for prompt compilation and OpenRouter send. Its diagnostics must be computed from explicit records, selected active working set, generation-time brief, template/compiler/contract versions, and story configuration. Validation state must be invalidated whenever any of those inputs change. UI affordances may reflect validation state, but domain validation must enforce the rule even if UI controls fail.

## Failure modes

Validation failure modes include:

- blockers too broad and unactionable;
- blockers too weak and allow invalid prompt generation;
- warnings compiling into prompts;
- validation silently repairing records;
- LLM-assisted validation decisions in v1;
- prompt preview allowed with blockers;
- a hidden override flag added for convenience;
- accepted prose contamination detected only after send;
- validation focus tags treated as dramatic beats.

## Done Means

The validation engine is satisfied when:

- universal minimum completeness is enforced;
- the compiler-contract validation matrix is implemented for v1-required focus tags;
- blockers and warnings are distinct in data and UI;
- blockers disable prompt preview and OpenRouter send with no override;
- diagnostics identify affected records/fields and practical repair paths;
- no diagnostic uses an LLM or mutates records;
- accepted prose/rejected candidate/superseded regeneration/automatic prose summary contamination blocks;
- local-prose-only constraints block chapter/act/beat/arc/future-summary directives;
- physical, object, POV, secret, cast voice, content-envelope, and offstage-route contradictions are caught deterministically.
