# Segment Reconciliation Prompt Template

Status: active reference — domain authority for the segment-reconciliation assistance prompt template
Authority: domain authority for the segment-reconciliation assistance prompt template (see `docs/ACTIVE-DOCS.md`)
Profile id: `segment-reconciliation`
Template version: `1.7.0`
Compiler version: `1.9.0`
Compiler-contract version: `1.10.0`

## Purpose

Segment Reconciliation is a quarantined assistance surface that helps the author review the latest accepted segment against current structured story state. It may propose advisory deltas for generation-brief fields, existing records, lifecycle destinations, or new records. It is not a prose prompt, not a validation authority, not canon authority, and not a mutation surface.

The output remains scratch until the user independently authors any accepted change in the canonical Generation Brief or record editor.

## Source Profile

The prompt renders from these sources only:

1. The explicit request: `segmentSelection: "latest"` and `recordScope: "active_working_set" | "whole_project"`.
2. Exactly one accepted segment: the latest accepted segment fetched by the server as one complete row with id, sequence, and full text.
3. The saved-draft CURRENT AUTHORITATIVE STATE and IMMEDIATE HANDOFF field projection listed in this document.
4. Every complete non-archived record in the selected record-contrast scope, all registered types and lifecycle states.
5. Minimal reference stubs for out-of-scope referenced records: id, type, and stored display label only.
6. A schema catalog generated from `recordTypeRegistry`, registered payload validators, lifecycle metadata, and reference metadata.
7. Template/compiler/contract versions and deterministic citation, span, empty-state, output-shape, and echo-guard constants.

`<segment_reconciliation_request>` renders only the source profile, segment selection, record scope, and selected accepted segment id and sequence. Source counts, accepted timestamps, span counts, prompt fingerprints, and version pins remain local metadata or other section data; they do not render in the request block.

The prompt must not read older accepted segments, accepted-segment ranges, candidates, regenerations, automatic prose-derived summaries, author-private notes, story configuration, prompt archives, prior assistance output, provider memory, hidden UI state, archived records, or generation-time fields outside the listed projection.

## Field Boundary

The generation-time projection contains exactly these CURRENT AUTHORITATIVE STATE paths:

- `current_authoritative_state.current_time`
- `current_authoritative_state.current_location`
- `current_authoritative_state.onstage_entities`
- `current_authoritative_state.immediate_situation_summary`
- `current_authoritative_state.offstage_pressuring_entities`
- `current_authoritative_state.positions`
- `current_authoritative_state.possessions`
- `current_authoritative_state.visible_conditions`
- `current_authoritative_state.environmental_conditions`
- `current_authoritative_state.entity_statuses`
- `current_authoritative_state.line_of_sight_and_visibility`
- `current_authoritative_state.pov_cannot_perceive_now`
- `current_authoritative_state.routes_and_exits`
- `current_authoritative_state.available_time`
- `current_authoritative_state.consent_or_force_conditions`
- `current_authoritative_state.current_locks`

and exactly these IMMEDIATE HANDOFF paths:

- `immediate_handoff.recent_causal_context`
- `immediate_handoff.last_visible_moment`
- `immediate_handoff.begin_after`

Manual directive, stop guidance, current cast voice pressure, cast voice overrides, active-working-set curation, selected POV, cast bands, generation validation focus, normalized `generation_context`, story contract, universal content policy, and prose mode are excluded from prompt source and proposal targets. Active-working-set membership may be read only to honor the explicit `active_working_set` record scope.

Every allowed brief field renders with a citation key and an explicit state: `missing`, `blank`, or `present`.

## Record Scope

`active_working_set` is the default. It includes every non-archived record named by `active_working_set.selected_records`, all registered types and lifecycle states.

`whole_project` includes every non-archived project record, all registered types and lifecycle states.

Neither scope applies a semantic-active predicate, retrieval, ranking, batching, summarization, reference closure, or token-budget omission. Every qualifying record renders in deterministic registry order, then display label, then id.

Reference stubs may render for records referenced by included source data but not included in the selected scope. Stubs are never proposal targets and never import out-of-scope payloads.

## Section Order

The compiler renders every section in this exact order:

1. `<segment_reconciliation_role>`
2. `<segment_reconciliation_source_contract>`
3. `<segment_reconciliation_request>`
4. `<accepted_segment_evidence>`
5. `<current_reconciliation_fields>`
6. `<record_contrast_scope>`
7. `<record_contrast_records>`
8. `<segment_reconciliation_field_rules>`
9. `<segment_reconciliation_record_rules>`
10. `<record_creation_schema_catalog>`
11. `<segment_reconciliation_provenance_and_paraphrase_rules>`
12. `<segment_reconciliation_review_procedure>`
13. `<segment_reconciliation_output_format>`

All thirteen sections always render. The source contract remains at the front edge and the strict JSON output contract remains at the final edge.

## Accepted-Segment Evidence

The compiler normalizes CRLF and lone CR to LF for rendering and fingerprinting. It partitions the complete accepted segment into deterministic spans with keys `[SEG-<sequence>-S###]`.

Spans are split at blank-line paragraph boundaries, then at sentence boundaries no longer than 800 UTF-16 code units, then whitespace, then hard 800-code-unit boundaries. The compiler must not select excerpts, summarize, retrieve by similarity or keyword, silently truncate, compress, or evict accepted text.

Accepted-segment text is rendered as escaped data, never as prompt instructions or headings. Each `<segment_span>` carries only its deterministic `key` attribute; offsets and sequence numbers remain local typed span metadata. `<`, `>`, and `&` are escaped in JSON data blocks.

## Schema Catalog

The record-creation schema catalog is generated from registered record validators and includes every registered record type, required and optional fields, defaults, union/literal alternatives, enum values, repository-managed id rules, reference-bearing paths, lifecycle fields, and legal deactivation destinations.

Runtime code must not maintain a second handwritten copy of record types or enum vocabularies. Catalog generation failure blocks the operation.

Legal deactivation destinations are:

- ENTITY, ENTITY STATUS, CAST MEMBER, FACT: none
- BELIEF: `resolved`, `abandoned`
- SECRET: `disproven`, `abandoned`
- LOCATION: `inactive`, `destroyed`, `inaccessible`
- OBJECT: `lost`, `destroyed`, `transferred`, `inactive`
- VISIBLE AFFORDANCE: `unavailable`
- EVENT: `resolved`, `background`, `abandoned`
- INTENTION: `satisfied`, `abandoned`
- PLAN: `fulfilled`, `failed`, `abandoned`, `revised` through `plan_status`
- CLOCK: `resolved`, `abandoned`
- OBLIGATION: `closed`, `abandoned`, `transferred`
- CONSEQUENCE: `resolved`, `abandoned`
- OPEN THREAD: `answered`, `resolved`, `abandoned`, `superseded`
- RELATIONSHIP: `resolved`, `abandoned`
- EMOTION: `settled`

## Output Contract

The model must return one strict JSON object with contract `segment_reconciliation.v1`, a source echo, and three always-present proposal arrays:

- `brief_proposals`
- `record_change_proposals`
- `record_creation_proposals`

Every proposal must cite accepted-segment span keys and current contrast keys. Brief proposals may target only the nineteen allowed field paths. Record-change proposals may target only full in-scope records. Creation proposals must use registered types, valid enum values, no repository id, and valid reference-token dependencies.

The local parser validates the entire response. Any malformed key, stale source, invalid citation, invalid field path, invalid record target, invalid lifecycle destination, invalid enum, invalid payload, invalid reference token, cyclic creation dependency, duplicate target/action, or material accepted-prose echo quarantines the full response. There is no partial salvage, JSON repair, second model pass, or automatic retry.

## Verbatim-Echo Guard

Segment Reconciliation output must paraphrase. It must not quote or copy accepted prose into proposed handoff, current-state, record, label, or rationale text.

The parser normalizes model-authored strings with NFKC, case folding, and whitespace collapse. It rejects material accepted-prose echo at or above the declared thresholds: a 50-normalized-character accepted-segment substring or an 8-token verbatim run. Enum literals, booleans, numbers, ids, citation keys, reference tokens, and validated short proper-name atoms may remain exact.

## UI Quarantine

The UI may inspect, copy, keep, navigate to canonical editors, and clear scratch. It must not apply, prefill, stage, patch, save, create, archive, deactivate, merge, remove, select, reorder, or use suggestions as prose.

Keepers are session-scoped scratch keyed by project and prompt fingerprint. Clear performs no project-store write. Opening Segment Reconciliation from the durable-change reminder must not acknowledge or snooze that reminder.

## Change Control

Any change to accepted-segment source, selection, span algorithm, field boundary, record scope, archive/status predicate, record/reference serialization, schema-catalog generation, lifecycle destinations, reference-token grammar, section order, request shape, output schema, parser validation, echo thresholds, provider-transform policy, or UI quarantine must update this document, `docs/compiler-contract.md`, `docs/story-record-schema.md` where applicable, template/compiler/contract versions, and golden/parser/route/UI tests in the same change.
