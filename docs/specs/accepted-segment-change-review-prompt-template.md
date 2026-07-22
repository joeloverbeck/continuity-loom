# Accepted-Segment Change Review Prompt Template

Status: active reference — domain authority for the accepted-segment-change-review assistance prompt template
Authority: domain authority for the accepted-segment-change-review assistance prompt template (see `docs/ACTIVE-DOCS.md`)
Profile id: `accepted-segment-change-review`
Template version: `2.1.0`
Compiler version: `2.0.0`
Compiler-contract version: `1.16.0`
Output contract: `accepted_segment_change_review.v2`

## Purpose

Accepted-Segment Change Review is the sole user-facing post-acceptance assistance workflow. After the author accepts a prose segment, it produces readable, deterministic, quarantined advisory accounting of the changes the accepted segment likely introduces, so the author can decide what to record in canonical story state. Its output is never canon, never prose-prompt authority, and never an automatic mutation. Only independently authored edits saved in the canonical editors change continuity. This template is governed by `docs/principles/FOUNDATIONS.md` §9.1, PRD #145, the final-activation amendment ratified through issue #146 and landed by issue #149, and `docs/specs/compiler-contract.md` §2.3.

## Source Profile

The compiler renders from these sources only:

- exactly one accepted segment selected by an explicit `segmentSelection: "latest"` request — `latest` is the sole permitted selection. The server fetches one latest accepted row directly and includes its complete text, id, sequence, and accepted timestamp.
- exactly the nineteen saved-draft CURRENT AUTHORITATIVE STATE and IMMEDIATE HANDOFF paths registered in `docs/specs/story-record-schema.md`. Missing and blank values remain explicit; no prose-readiness normalization or other Generation Brief surface is imported.
- every complete non-archived record in one explicit scope: `active_working_set` by default or `whole_project` by explicit choice, rendered completely in registry-type / full-label / id order with no lifecycle-status filter.
- minimal deterministic reference-label stubs (id, type, complete payload-derived label) when an in-scope record references a non-rendered record. Stubs support citation labels only; they are never change targets and import no payload authority.
- deterministic accepted-segment spans, brief/record citation keys, disclosure counts, prompt length and token estimate, versions, and prompt fingerprint.

The profile excludes every older accepted segment, segment range, candidate, regeneration, automatic prose-derived summary, author-private note, story-configuration value, prompt archive, prior assistance output, provider memory, hidden UI state, archived record, schema catalog, lifecycle catalog, JSON Patch vocabulary, creation payload, full proposed canonical value, and model-selected destination.

## Field Boundary

The nineteen review paths are exactly the CURRENT AUTHORITATIVE STATE and IMMEDIATE HANDOFF paths declared in `docs/specs/story-record-schema.md`. No other Generation Brief surface — generation context, selected POV, cast bands, working-set membership, manual directive, stop guidance, voice controls, or validation focus — is a review source. The accepted segment is bounded evidence for advisory review, not canon authority and not prose-prompt authority.

## Inherited-Brief Drift Elicitation

Change review contrasts the accepted segment against the declared brief fields in both directions. Beyond a change the segment renders, the role prompt also elicits reverse-direction drift: an inherited current-state or immediate-handoff field that presupposes a beat the latest accepted segment never renders — drift that rests on the segment's absence of that beat. Because absence provides no qualifying verbatim excerpt, such an item is always `interpretation requiring author judgment` with an empty `evidence_excerpt`; it can never be an `established change`, and a drift item asserted as established quarantines under the same evidence_excerpt gate. The item names the drifted brief field through its contrast key and cites the accepted-segment span where the segment actually ends. This adds no output field, epistemic status, coverage row, or additional read; it is a role-prompt elicitation over the same nineteen brief paths and the single `latest` accepted segment (template `2.1.0`). The `immediate next-segment handoff` coverage row reflects such an item when present.

## Record Scope

The record contrast scope is an explicit, user-selected, disclosed projection: the Active Working Set by default or the Whole Project by explicit user selection. Every qualifying non-archived record renders completely; none is hidden, semantically filtered, ranked, summarized, batched, trimmed, or omitted. Reading active-working-set membership to honor an explicitly selected Active Working Set scope is not a working-set mutation and grants no record prose authority.

## Section Order

The compiler renders every section in this exact order:

1. `<accepted_segment_change_review_role>`
2. `<accepted_segment_change_review_source_contract>`
3. `<accepted_segment_change_review_request>`
4. `<accepted_segment_evidence>`
5. `<current_change_review_fields>`
6. `<record_contrast_records>`
7. `<accepted_segment_change_review_procedure>`
8. `<accepted_segment_change_review_output_format>`

All eight sections always render. Complete source stays before the review instructions; the strict shallow output contract remains at the final edge. No formal-mutation section or schema catalog is present.

## Accepted-Segment Evidence

The complete latest accepted segment renders as escaped evidence spans partitioned by the shared deterministic span algorithm. Evidence spans are local compiler partitions, not model-selected retrieval. An absent segment or empty spans block the operation with `no-accepted-segment`; no excerpt selection, older chooser, archive access, summary, or truncation is permitted.

## Output Contract

Model output must contain only `contract`, `items`, and `coverage`.

Each `items` entry contains: a sequential local identifier (`ITEM-001`, `ITEM-002`, and later); a `change_statement` — an independently readable, present-tense, plain-English statement of the possible change, constrained only by the no-material-accepted-prose-echo rule and the future-possibility exclusion; an `evidence_excerpt` — an always-present provider-safe string that is an exact three-to-seven-word verbatim excerpt occurring in one of the item's cited accepted-segment evidence spans for an `established change` item and the empty string for an `interpretation requiring author judgment` item; one or more resolvable accepted-segment evidence keys; the resolvable current-record or Generation Brief contrast keys used to form the item; exactly one epistemic status (`established change` or `interpretation requiring author judgment`); exactly one retention horizon (`durable record candidate`, `next-brief-only`, `no storage`, or `author decision required`); affected-target hints that identify likely canonical destinations without selecting or drafting a canonical value; and nonblank uncertainty or rival-reading text.

`coverage` contains exactly one reasoned row for each of these six dimensions: (1) spatial, material, and bodily state; (2) time, clocks, and ongoing processes; (3) facts, knowledge, beliefs, and secrets; (4) intentions, plans, commitments, promises, and open pressures; (5) emotions and relationships; (6) immediate next-segment handoff. Each row uses exactly one status — `changes found`, `checked - no relevant change`, or `uncertain` — and a nonblank reason. An empty `items` list is valid only when all six reasoned coverage rows are present, and the result remains visibly labeled as unverified advisory output rather than proof that canonical state is current.

## Anti-Invention Witness

The `evidence_excerpt` witness is the sole structural anti-invention gate. An invented or explicitly unstated implication carries no qualifying verbatim excerpt in a cited span, so it cannot be labeled `established change` and may appear only as `interpretation requiring author judgment`. `change_statement` is never required to equal the excerpt. Future-possibility discipline is prompt-led — the role prompt directs the model not to draft future possibilities — and is observed through playtest, not enforced by parser keyword heuristics.

## Verbatim-Echo Guard

The complete response is quarantined when malformed, stale, enum-invalid, coverage-incomplete, citation-invalid, materially echoing accepted prose, or when an `established change` item's `evidence_excerpt` is missing, is not an exact three-to-seven-word verbatim excerpt, or does not occur in one cited evidence span. Model-authored text must not materially quote or echo accepted prose. Provenance is represented only through deterministic evidence keys pointing back to the readable accepted segment.

## UI Quarantine

Items and coverage are session-only, visibly non-canonical scratch. Keeping, copying, marking reviewed, clearing, or navigating from them must not acknowledge the durable-change reminder; write project data; enter any prose prompt, story record, Generation Brief field, active working set, log, export, backup, or provenance field; prefill a canonical editor; or cause an automatic retry, repair, fallback, or provider call. The author must independently write and explicitly save any canonical change in its normal editor.

## Consumed-Guidance Control

Accepted-Segment Change Review may present a separate deterministic consumed-guidance control. It is not model output and must not infer what the accepted prose consumed. It may list only nonblank values from `manual_moment_directive.must_render[]`, `manual_moment_directive.may_render_if_naturally_caused[]`, `manual_moment_directive.do_not_force[]`, populated `current_cast_voice_pressure[]` and `cast_voice_overrides[]` entries, `generation_validation_focus.validation_focus_tags.expected_local_modes[]`, `generation_validation_focus.validation_focus_tags.possible_durable_changes[]`, and `stop_guidance.soft_unit_guidance`. It must exclude `generation_context`, the active working set including selected POV and cast bands, `current_authoritative_state`, and `immediate_handoff`. Nothing is preselected. Only values explicitly selected by the user may be removed from the editable Generation Brief draft, and the existing explicit Generation Brief Save action remains the sole project-store mutation.

## Change Control

Any change to this template, the source profile, the nineteen-path projection, record scope, reference-stub boundary, section order, versions, request/disclosure shape, output schema, `evidence_excerpt` witness rule, parser quarantine, shared echo threshold, provider policy, scratch behavior, or consumed-guidance allowlist must update this document, `docs/specs/compiler-contract.md`, `docs/specs/story-record-schema.md` and `docs/user-guide.md` where applicable, template/compiler/contract versions, and the focused core/route/component/property tests in the same revision. If the change widens accepted-prose access or authority, it also requires a `docs/principles/FOUNDATIONS.md` amendment approved under §1.1.
