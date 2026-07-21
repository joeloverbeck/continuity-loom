# Segment Reconciliation Assistance — Change Proposal

**Document type:** research-backed change-proposal precursor; not a numbered specification  
**Hand-off artifact:** `segment-reconciliation-assistance-change-proposal.md`  
**Target repository:** `joeloverbeck/continuity-loom`  
**Target commit:** `5375d9c4aa87333656be15bc7c434338bb9094fb`  
**Freshness limitation:** this proposal analyzes the user-supplied target commit only. It does not independently establish that the commit is the current `main`.  
**Downstream context:** the coding agent may convert this document into the next available numbered specification, expected to be SPEC-032 if that number remains free. This document neither claims that number nor acts as the specification.

> Repository claims below use only manifest-listed files fetched from full exact-commit URLs. References to other repositories inside those files are ordinary file content, not fetch-provenance contamination. External research is cited separately and is never used to assert what exists in Continuity Loom.

## Executive decision

Continuity Loom should ship a third, top-level LLM-assistance surface named **Segment Reconciliation**. The user explicitly invokes it after accepting prose. It compares **exactly the latest accepted segment** with a purpose-limited projection of the saved generation-time brief and an explicit record-contrast scope, then returns quarantined advisory proposals in three groups:

1. changes to the nineteen allowed CURRENT AUTHORITATIVE STATE and IMMEDIATE HANDOFF fields;
2. changes or lifecycle deactivations for existing records; and
3. schema-guided creation proposals for new records.

The output is not canon, is never written automatically, is never inserted into an editor, is never added to the working set, and never becomes prose-prompt context. The only actions offered from a proposal are navigation and copying. The user must open the relevant canonical editor and author every accepted change there.

The surface needs a constitutional amendment before implementation. The exact proposed wording appears in §10 for owner sign-off under FOUNDATIONS §1.1. The amendment creates a third assistance source profile, `segment-reconciliation`, and makes one narrow exception to the accepted-prose prohibition: **one directly selected accepted segment may be sent as evidence to this assistance prompt only**. Accepted prose remains forbidden from every prose prompt, every stored continuity field, every automatic summary, and every other assistance profile.[R2]

The recommended record scope is a deterministic two-mode model:

- `active_working_set`, the default, renders every non-archived record selected in the current working set, across every registered type and lifecycle state; and
- `whole_project`, an explicit alternative, renders every non-archived project record, across every registered type and lifecycle state.

Neither mode applies a semantic-active predicate. A reconciliation pass needs to see resolved, transferred, revealed, blocked, revised, and otherwise non-active records because they may be the records that the accepted segment has just changed, or the records whose existence should prevent duplicate creation. No scope may rank, retrieve, summarize, hide, batch, or evict records. A prompt that is too large fails visibly instead of being truncated.

The model-facing record-creation catalog must be generated from the exact TypeScript/Zod registry rather than copied into a second hand-maintained taxonomy. The brief calls the product taxonomy “17 record types”; the target commit actually registers **18**: ENTITY, ENTITY STATUS, CAST MEMBER, FACT, BELIEF, SECRET, LOCATION, OBJECT, VISIBLE AFFORDANCE, EVENT, INTENTION, PLAN, CLOCK, OBLIGATION, CONSEQUENCE, OPEN THREAD, RELATIONSHIP, and EMOTION.[R6][R16] The implementation must derive the type list, field shapes, requiredness, and enum vocabularies from the registry, so correctness never depends on either count being typed into a prompt constant.

The output contract is one strict JSON object, validated locally in full. Unknown keys, unknown fields, invented enum values, invalid record types, illegal lifecycle destinations, unresolved provenance, invalid reference targets, stale source fingerprints, malformed patches, cyclic new-record references, or material verbatim echo from the accepted segment quarantine the **entire** response. There is no partial repair and no second LLM pass. Provider-native JSON-schema-constrained output should be used when the selected OpenRouter model supports it, but the same local parser remains authoritative; unsupported models may use plain text generation with the same pure-JSON contract and a higher malformed-output risk.[E1][E2][E5]

The durable-change reminder remains intact. It gains a **Reconcile latest segment** call to action that opens the new section, while Acknowledge and Snooze keep their current meaning and behavior.[R9][R22]

---

## 1. Problem and intent

### 1.1 The existing loop ends with clerical debt

The current user guide makes the post-acceptance responsibility explicit: after accepting a segment, the author must manually update records for every durable continuity change before generating again. The reminder helps the user remember this obligation, but it does not help identify the affected fields, locate the relevant records, or construct valid new records.[R8][R9]

That manual step is disproportionately difficult because an accepted segment can change several authority layers at once. A single local scene may:

- move time and location;
- change who is onstage, visible, reachable, armed, injured, restrained, or in possession of an object;
- alter the immediate causal handoff;
- fulfill, block, revise, or abandon a plan;
- tick a clock;
- close, transfer, or escalate an obligation;
- activate or resolve a consequence;
- answer or supersede an open thread;
- reveal or disprove a secret;
- transform a relationship or emotion;
- create a new event, fact, object, affordance, promise, injury, or institutional condition.

The prose itself is readable evidence of what happened, but Loom correctly refuses to let prose become continuity authority by osmosis. The missing surface is therefore not an automatic extractor and not a prose-to-canon pipeline. It is a **review instrument** that places the latest segment beside current structured authority, asks an external model for typed candidate deltas, and leaves every canonical decision to the user.

### 1.2 Place in the assistance family

Segment Reconciliation is a sibling of the two shipped assistance surfaces, not a mode inside either one:

| Surface | Declared source profile | Purpose | Why it cannot absorb reconciliation |
|---|---|---|---|
| Ideate | `prose-aligned` | Produce grounded local dramatic possibilities without prose | Its source is forward-looking launch context and selected pressure, not accepted prose or full schema-guided state updates.[R4][R11][R12] |
| Record Hygiene | `project-review` | Review record overlap, redundancy, and distinctions | Its source contract explicitly excludes accepted prose, generation-time fields, ENTITY payloads, and CAST MEMBER payloads; it is records-only and cannot propose creation from a new segment.[R5][R13][R14] |
| **Segment Reconciliation** | **`segment-reconciliation`** | Contrast one accepted segment with current brief fields and records, then propose non-authoritative deltas | It needs a constitutionally distinct accepted-segment evidence lane and a record-creation schema catalog. |

The closest structural precedent is Ideate: explicit request input, stable section order, deterministic citation keys, inspect-before-send, and quarantined output. The closest scope/output precedent is Record Hygiene: explicit dual scopes, complete record rendering, action taxonomy, malformed-output quarantine, session keepers, and same-change synchronization. Reconciliation reuses those patterns without weakening either sibling's source firewall.

### 1.3 Upgrade, not replacement, of the durable-change reminder

The current reminder expresses the right doctrine: acceptance may have created durable change, and the author must update authority manually. It should remain visible until acknowledged and should retain Snooze. Segment Reconciliation turns the reminder from a pure warning into an optional next step; it does not acknowledge the reminder, decide that all changes were handled, or suppress the existing checklist.[R9]

### 1.4 Goals

The change succeeds when it:

- reduces the work of finding likely post-segment deltas without transferring authority to the model;
- reads one and only one accepted segment, the latest, through a visible and deterministic assistance profile;
- exposes a focused default record scope and a complete whole-project alternative;
- proposes only backward-looking state/handoff reconciliation, never next-scene direction;
- makes all eighteen registered record schemas and every controlled enum available to the model from one generated source of truth;
- attaches accepted-segment span provenance to every proposed item;
- detects stale source state between prompt inspection and send;
- rejects malformed or schema-invalid output without hidden repair;
- prevents accepted prose from being copied into proposed handoff or record text;
- preserves the reminder, validation gate, local-first ownership, API-key boundary, and prose-prompt firewall.

### 1.5 Non-goals

This change does not:

- generate prose, dialogue, scene text, summaries of future scenes, branches, beats, outlines, or plot rails;
- reconcile more than one accepted segment;
- mine the accepted archive, candidates, rejected regenerations, prompt logs, or author-private notes;
- infer canon, auto-update records, auto-create records, auto-fill the generation brief, or auto-curate the working set;
- replace Record Hygiene's MERGE/REMOVE review;
- make accepted prose a source of future prose authority;
- add readiness blockers to prose generation;
- add a background watcher, acceptance hook, scheduled job, or automatic provider call;
- add storage for prompts, raw responses, findings, keeper state, or accepted-prose-derived summaries.

---

## 2. Repository baseline and constitutional conflict

### 2.1 Authority order

At the target commit, `docs/principles/FOUNDATIONS.md` is the constitution; `docs/ACTIVE-DOCS.md` names domain authorities and requires every new active `docs/` authority to be registered in the same change. `docs/specs/compiler-contract.md` governs deterministic prompt mapping and synchronization. The ideation and hygiene template documents govern the two current assistance prompt classes. `docs/specs/story-record-schema.md` governs field shapes and enum vocabularies.[R1][R2][R3][R4][R5][R6]

The implementation already has the necessary architectural seams:

- pure compiler/type modules in `@loom/core` for Ideate and Hygiene;
- a central record registry with Zod payload schemas, status projection, parsing, and reference extraction;
- saved generation-brief draft shapes distinct from readiness-normalized prose input;
- server snapshot builders and compile/analyze route pairs;
- accepted-segment persistence and latest-segment access;
- prompt inspection, quarantine banners, session-scoped keepers, and route-level tests in the web package;
- separate template, compiler, contract, and app version constants.[R15][R16][R17][R18][R19][R20][R21][R22]

No database migration is required. The surface reads existing accepted text, brief drafts, records, registry schemas, and provider settings; all response state is ephemeral.

### 2.2 Why the current constitution blocks the feature

The feature is sanctioned in spirit by FOUNDATIONS §26, which allows candidate event extraction from user-selected prose, handoff suggestions, and record suggestions, subject to human review and provenance. But several current sentences make the proposed source illegal:

- §8 says the compiler must not infer source material from accepted prose and must not include accepted prose text in prompts.
- §9.1 recognizes exactly two source profiles and says assistance selection must not be inferred from accepted prose.
- §10 makes accepted prose exclusion a hard rule for generated prompts.
- §21 says segment browsing is not a prompt source.
- §28.1 says accepted prose is not included in v1 at all.
- §29.4 and §29.8 reject any generated prompt or prompt context containing accepted segments.[R2]

Implementation therefore cannot precede or silently reinterpret the constitution. §10 supplies the exact proposed amendment package and preserves the reason for the existing prohibition everywhere outside the new single-segment assistance lane.

### 2.3 Why reconciliation must not reuse prose readiness input

The prose and Ideate compilers consume normalized `GenerationSessionReadyInput`. Reconciliation exists partly to discover missing or stale generation-time fields. Blocking it because CURRENT AUTHORITATIVE STATE or IMMEDIATE HANDOFF is incomplete would trip the existing diagnostic-assistance rule in §29.5. It therefore needs a dedicated typed snapshot built from the **saved draft**, with missing values represented explicitly and no prose-readiness gate.[R2][R3][R7][R17]

Structurally malformed stored JSON, malformed records, no accepted segment, a stale fingerprint, unsafe provider configuration, or a prompt that cannot fit without source loss may block reconciliation itself. Missing story-state content may not.

### 2.4 Resolved count discrepancy

The task brief describes seventeen record types. The exact-commit registry and schema expose eighteen. This proposal follows the exact repository state for implementation facts and treats “valid record type from the schema taxonomy” as the controlling requirement. The compiler must derive the catalog from `recordTypes`/`recordTypeRegistry`; tests must assert agreement rather than hard-code a prose count. The UI may display the derived count.

---

## 3. Decisions and owner-overridable assumptions

The following are committed recommendations unless marked as an owner-overridable assumption.

### 3.1 Name and route

**Assumption A1 — recommended default:** finalize the visible name as **Segment Reconciliation**, route it at `/segment-reconciliation`, and use `segment-reconciliation` as the source-profile identifier. The owner may rename the visible surface during amendment/spec sign-off. The profile identifier should remain stable once shipped because it enters the compiler contract and versioned prompt schema.

### 3.2 Segment choice

The v1 request accepts only:

```ts
type SegmentSelection = "latest";
```

The user selects the source by explicitly invoking reconciliation with `segmentSelection: "latest"`. There is no segment picker, range, “last N,” archive checkbox, similarity retrieval, or hidden fallback. The server obtains the latest row directly with an ordered single-row query; it does not load the archive and then choose client-side.

This is the most faithful reconciliation of two phrases in the brief: “one user-selected accepted segment, latest by default” and the locked “latest accepted segment ONLY.” A future older-single-segment mode is not pre-authorized by this proposal.

### 3.3 Generation-brief boundary

The model may propose only the following nineteen saved-draft paths.

**CURRENT AUTHORITATIVE STATE**

1. `current_time`
2. `current_location`
3. `onstage_entities`
4. `immediate_situation_summary`
5. `offstage_pressuring_entities`
6. `positions`
7. `possessions`
8. `visible_conditions`
9. `environmental_conditions`
10. `entity_statuses`
11. `line_of_sight_and_visibility`
12. `pov_cannot_perceive_now`
13. `routes_and_exits`
14. `available_time`
15. `consent_or_force_conditions`
16. `current_locks`

**IMMEDIATE HANDOFF**

17. `recent_causal_context`
18. `last_visible_moment`
19. `begin_after`

The following are always excluded because they direct the next segment rather than reconcile the completed one:

- MANUAL MOMENT DIRECTIVE: `must_render`, `may_render_if_naturally_caused`, `do_not_force`;
- STOP GUIDANCE: `soft_unit_guidance`.

**Assumption A2 — recommended default:** also exclude CURRENT CAST VOICE PRESSURE, CAST VOICE OVERRIDES, ACTIVE WORKING SET curation including `selected_records`, cast bands and `selected_pov`, GENERATION VALIDATION FOCUS, auto-normalized `generation_context`, STORY CONTRACT, UNIVERSAL CONTENT POLICY, and PROSE MODE. These are forward-looking launch controls, selection authority, operational metadata, or durable story identity rather than backward state reconciliation. The owner may narrow or expand only these assumption-labeled exclusions during sign-off; the explicitly named manual-directive and stop-guidance exclusions are fixed.

### 3.4 Record scope

Use two explicit modes:

```ts
type SegmentReconciliationRecordScope =
  | "active_working_set"
  | "whole_project";
```

#### `active_working_set` — default

Render the complete payload of every non-archived record whose id occurs in the saved generation session's `active_working_set.selected_records`, including ENTITY and CAST MEMBER, regardless of lifecycle status. Deduplicate ids deterministically. An empty selection remains a valid source: the operation may still propose brief changes and new records.

This mode matches the owner's manual baseline, limits unnecessary secret exposure, and keeps the common prompt focused.

#### `whole_project` — explicit alternative

Render the complete payload of every non-archived record in the project, including all eighteen registered types and every lifecycle state.

This mode is necessary because a durable change may affect a record omitted from the last working set, and because seeing an existing inactive/resolved/transferred/revealed record may prevent a duplicate creation. It mirrors Hygiene's explicit dual-scope precedent while deliberately rejecting Hygiene's semantic-active predicate.

#### Rules common to both modes

- The user must select the mode; the default is visible and serialized in the request.
- The compiled prompt and inspector name the mode, record count, per-type counts, archive exclusion, and “all lifecycle states included” rule.
- Every qualifying record renders. No keyword activation, embedding retrieval, salience/urgency ranking, model selection, timestamp cutoff, reference closure, hidden UI state, batching, summarization, or token eviction is allowed.
- Records order by fixed registry order, deterministic full display label, then id.
- Archived records never render.
- References to non-rendered records may resolve to declared **reference stubs** containing only id, type, and stored display label. Stubs are disclosed, may be used as reference targets in a creation proposal, and may not be change/deactivation targets because their payloads are outside the selected contrast scope.
- If the full declared source cannot fit the selected model, send fails with `segment-reconciliation-prompt-too-large`. OpenRouter context-compression/middle-out transforms must be explicitly disabled; truncation would violate deterministic completeness.[E6]

### 3.5 No status predicate

Record Hygiene asks whether current atomic records overlap, so excluding resolved/abandoned states is part of its purpose. Reconciliation asks what the latest accepted segment changed. A terminal state is often the answer. Applying Hygiene's predicate here would hide exactly the transitions the model should detect and would make creation proposals more likely to duplicate closed records.

### 3.6 No automatic suggestion application

There is no Apply button, bulk or otherwise. A proposal card may:

- copy its structured value or patch;
- open the canonical Generation Brief field;
- open an existing record;
- open a blank editor for the proposed record type;
- reveal the accepted-segment evidence spans.

It may not prefill, stage, patch, save, create, archive, deactivate, merge, remove, select, or reorder anything. This is stricter than “explicit click to apply,” and it is intentional: it keeps the assistance surface visibly on the review side of the authority boundary.

---

## 4. New assistance source profile

### 4.1 Profile identifier

`segment-reconciliation`

### 4.2 Declared source tuple

A compiled reconciliation prompt is a pure function of:

```ts
interface SegmentReconciliationSourceTuple {
  request: {
    segmentSelection: "latest";
    recordScope: "active_working_set" | "whole_project";
  };
  acceptedSegment: {
    segmentId: string;
    sequence: number;
    acceptedAt: string;
    text: string;
  };
  briefProjection: SegmentReconciliationBriefProjection;
  records: readonly SegmentReconciliationRecord[];
  referenceStubs: readonly SegmentReconciliationReferenceStub[];
  creationSchemaCatalog: SegmentReconciliationSchemaCatalog;
  versions: {
    templates: string;
    compiler: string;
    contract: string;
  };
}
```

Only `acceptedSegment.text` is new constitutional source material. Everything else is an explicit purpose-limited projection of existing structured authority or a deterministic schema description.

### 4.3 Sources included

1. Exactly one latest accepted segment, including stable sequence/id metadata and the full text.
2. The saved-draft values, including explicit missing states, of the nineteen paths in §3.3.
3. Every complete non-archived record in the selected §3.4 scope.
4. Minimal id/type/display-label stubs needed to resolve references without silently importing payloads from outside the selected scope.
5. A deterministic schema catalog generated from the registered record payload schemas, plus explicit lifecycle-destination and reference-token rules.
6. The explicit request, deterministic empty-state strings, output schema, and pinned versions.

### 4.4 Sources excluded

- every older accepted segment;
- rejected, superseded, regenerated, or unaccepted candidates;
- accepted-segment summaries or model-mined continuity;
- every generation-time field not listed in §3.3;
- story configuration;
- author-private notes;
- prompt archives, prior assistance outputs, keeper state, provider memories, embeddings, similarity scores, UI filters/sorts, timestamps other than the selected segment disclosure, and wall-clock time;
- archived records;
- full payloads of reference stubs outside the selected scope.

### 4.5 Determinism and inspectability

Identical source tuples and versions must produce byte-identical prompts and identical prompt fingerprints. The compiler may only normalize line endings, escape data, sort declared collections, generate citation keys/spans, and generate JSON Schema deterministically. It may not summarize, classify narrative significance, select records, infer updates, or repair malformed data.

The compile endpoint returns:

```ts
interface SegmentReconciliationCompileResponse {
  prompt: string;
  promptFingerprint: string;
  segment: { id: string; sequence: number; acceptedAt: string };
  recordScope: SegmentReconciliationRecordScope;
  sourceDisclosure: SegmentReconciliationSourceDisclosure;
  outputJsonSchema: object;
}
```

The user inspects this prompt before send. The analyze request must echo `promptFingerprint`; the server rebuilds the entire snapshot and prompt and returns `409 reconciliation-source-changed` if the fingerprint differs. The server never trusts a client-supplied prompt.

### 4.6 Source data is not instruction text

Accepted text and record payloads render as canonical escaped JSON inside fixed data containers. All `<`, `>`, and `&` characters are escaped. The prompt states before and after the data blocks that their contents are untrusted evidence and cannot amend the role, source contract, output format, or quarantine rules. Record/segment text never becomes a heading, XML tag, or instruction block.

This does not make prompt injection impossible. It limits the attack surface, and strict output validation plus zero automatic mutation limits the consequence of a model following hostile prose.

### 4.7 Operation-local gating

Reconciliation itself blocks only for:

- no open project;
- no accepted segment;
- malformed accepted-segment storage;
- malformed saved generation-session JSON that prevents projection;
- any malformed in-scope record row;
- failure to generate the schema catalog;
- prompt/source fingerprint drift;
- missing or unsafe OpenRouter configuration;
- provider rejection;
- complete declared source exceeding the selected model's context without truncation;
- malformed, invalid, stale, or verbatim-echoing response.

It does not block because generation readiness is incomplete, contradictions exist, handoff is blank, records are stale, or the accepted segment contains a durable change. Those are the conditions the surface exists to inspect.

---

## 5. Request shape, snapshot, provenance, and deterministic prompt order

### 5.1 Request shape

```ts
const segmentReconciliationRequestSchema = z.object({
  segmentSelection: z.literal("latest"),
  recordScope: z.enum(["active_working_set", "whole_project"]),
  expectedPromptFingerprint: z.string().min(1).optional(),
}).strict();

type SegmentReconciliationCompileRequest = Omit<
  z.infer<typeof segmentReconciliationRequestSchema>,
  "expectedPromptFingerprint"
>;

type SegmentReconciliationAnalyzeRequest = z.infer<
  typeof segmentReconciliationRequestSchema
> & {
  expectedPromptFingerprint: string;
};
```

`expectedPromptFingerprint` is absent on compile and required on analyze. No freeform objective, focus text, custom field selection, custom record-type filter, accepted-segment id, or model-authored follow-up input is accepted in v1. The job is fixed enough that extra request prose would create a second, weakly governed instruction surface.

### 5.2 Dedicated snapshot

```ts
interface SegmentReconciliationSnapshot {
  segment: {
    id: string;
    sequence: number;
    acceptedAt: string;
    normalizedText: string;
    spans: readonly AcceptedSegmentSpan[];
  };
  brief: {
    fields: readonly ReconciliationBriefField[];
  };
  recordScope: SegmentReconciliationRecordScope;
  records: readonly ReconciliationRecord[];
  referenceStubs: readonly ReconciliationReferenceStub[];
  schemaCatalog: SegmentReconciliationSchemaCatalog;
}
```

The snapshot is not `GenerationSessionReadyInput`, `ValidationSnapshot`, `StoryRecordHygieneSnapshot`, or a widened sibling type. It is a purpose-specific boundary that makes accidental source expansion reviewable.

### 5.3 Accepted-segment span algorithm

Provenance must identify a stable span, not ask the model to quote prose. The compiler creates citation spans locally:

1. Convert CRLF and lone CR to LF for rendering and fingerprinting; do not modify stored text.
2. Split at blank-line paragraph boundaries while preserving half-open UTF-16 offsets in the normalized text.
3. Trim only leading/trailing whitespace from each candidate and adjust offsets.
4. Split any candidate longer than 800 UTF-16 code units at the last sentence boundary at or before 800; if none exists, split at the last whitespace; if none exists, hard-split at 800.
5. Do not overlap spans and do not omit non-whitespace text.
6. Assign keys in source order: `[SEG-<sequence>-S001]`, `[SEG-<sequence>-S002]`, and so on.

```ts
interface AcceptedSegmentSpan {
  key: string;
  startUtf16: number;
  endUtf16: number;
  text: string;
}
```

The prompt renders each span's key, offsets, and exact escaped text. Output contains only keys, never evidence quotations. The UI resolves a key back to the already-stored accepted segment and highlights it read-only.

The 800-code-unit boundary is an implementation default chosen to keep citations locally meaningful without sentence-level fragmentation. It is deterministic and may be revised only with the template/compiler/contract/golden synchronization cascade.

### 5.4 Brief-field keys

Every allowed field always receives one key, whether populated or missing:

```text
[BRIEF:current_time]
[BRIEF:current_location]
...
[BRIEF:begin_after]
```

Each rendering carries:

- `field_path`;
- `current_state: "missing" | "blank" | "present"`;
- canonical JSON `current_value` when present;
- a path-specific summary of allowed value shape.

Missing and blank are not silently collapsed. A proposal with `operation: "FILL"` is legal only for missing/blank state; `REPLACE` is legal only for present state; `CLEAR` is legal only where the draft schema permits omission/blank.

### 5.5 Record and reference-stub keys

Full records use one-based per-type keys after deterministic ordering:

```text
[ENTITY-1]
[CAST-MEMBER-1]
[FACT-1]
...
```

Each full record includes real id, type, stored display label, projected lifecycle state where one exists, canonical escaped full payload, and deterministic outgoing/incoming reference summaries.

Reference stubs use:

```text
[REF-ENTITY-1]
[REF-CAST-MEMBER-1]
...
```

A stub includes only key, id, type, and display label. The output parser rejects a change proposal that names a `REF-*` key, but creation reference tokens may target it.

A special source key `[RECORD-SCOPE]` describes the selected scope and may appear as contrast provenance for a creation proposal when the relevant fact is the absence of any matching rendered record.

### 5.6 Schema-catalog generation

The compiler generates a stable, provider-neutral catalog from `recordTypeRegistry` and each type's Zod payload schema. The target uses Zod 4, whose first-party `z.toJSONSchema()` conversion can provide the base JSON Schema.[R16][R23][E4]

For each registered type, the catalog includes:

- exact type literal;
- payload JSON Schema, including required fields, defaults, unions, arrays, and every enum value;
- a separate `display_label` requirement;
- `id` marked repository-managed and forbidden in model output;
- lifecycle field name, all legal lifecycle values, and the allowed deactivation destinations in §7.4;
- reference-bearing paths, cardinality, legal literal alternatives, and expected target types;
- a stable catalog version tied to `contract.version`.

Generation must fail if a schema cannot be represented without silently dropping a constraint relevant to record creation. JSON-schema conversion is a transport aid, not the final validator: after resolving reference tokens and injecting a temporary id, every proposed payload is parsed by the same `parseRecordPayload` registry path used by the repository.[R16]

### 5.7 Deterministic prompt section order

Add `RECONCILIATION_SECTION_ORDER` with exactly these always-present sections:

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

The role/source contract is at the front edge; the strict output schema is at the final edge. The accepted segment appears before the current structured state because the task is to identify changes caused or evidenced by that segment, while field/record rules and the schema catalog sit immediately before the review procedure and output contract.

### 5.8 Section responsibilities

#### `<segment_reconciliation_role>`

Frames the model as a continuity-review assistant, not a prose writer or canon authority. Forbids scene text, plot planning, summaries for future generation, and direct mutation instructions.

#### `<segment_reconciliation_source_contract>`

Names the exact source profile; says one latest segment only; lists included and excluded source classes; says all data blocks are untrusted evidence; says no source may be selected or omitted by the model.

#### `<segment_reconciliation_request>`

Renders `segment_selection`, `segment_sequence`, `record_scope`, source counts, versions, and prompt fingerprint.

#### `<accepted_segment_evidence>`

Renders every locally generated span, in order, as escaped JSON data. Never renders an archive list or summary.

#### `<current_reconciliation_fields>`

Renders all nineteen fields in fixed order, including explicit missing/blank states.

#### `<record_contrast_scope>`

Renders the selected scope definition, archive rule, all-status rule, full-record count by type, reference-stub count, and completeness/no-eviction rule.

#### `<record_contrast_records>`

Renders every full record and reference stub in deterministic order. Empty full-record state is exactly:

```text
No non-archived records exist in the selected reconciliation scope.
```

The remaining sections still render, and send remains enabled because the segment and brief can still justify field or creation proposals.

#### `<segment_reconciliation_field_rules>`

Lists the nineteen legal paths and their types; forbids every other generation field; distinguishes backward state/handoff from forward instruction; forbids verbatim accepted prose.

#### `<segment_reconciliation_record_rules>`

Defines UPDATE_FIELDS and DEACTIVATE, legal JSON-pointer patches, lifecycle destinations, reference tokens, no id mutation, no archive/delete/merge/remove, and complete-response validation.

#### `<record_creation_schema_catalog>`

Renders the generated schemas and reference/lifecycle metadata in fixed registry order. This is the authoritative vocabulary presented to the model.

#### `<segment_reconciliation_provenance_and_paraphrase_rules>`

Requires nonempty segment-span provenance on every proposal, contrast keys, no quote fields, and independent paraphrase. States that citations prove source location, not correctness.

#### `<segment_reconciliation_review_procedure>`

Requires a fixed pass:

1. derive only explicit durable changes from the segment;
2. compare each against current brief fields;
3. compare each against all full records in scope;
4. prefer updating an existing record over creating a duplicate;
5. use DEACTIVATE only when a legal lifecycle destination represents the change;
6. create only records supported by evidence and not already represented;
7. omit uncertain proposals rather than inventing fields, enum values, ids, or facts;
8. return all three arrays, using `[]` where no proposal is warranted.

#### `<segment_reconciliation_output_format>`

Contains the complete strict JSON Schema and says: one JSON object only, no Markdown fence, no preamble, no postscript, no comments.

---

## 6. Output contract

### 6.1 Why strict JSON is the right deliberate deviation

Ideate and Hygiene use human-readable tagged output. Reconciliation must express nested values across eighteen heterogeneous schemas, typed field patches, reference dependencies, and path-specific values. A flat tagged format would either become ambiguous or duplicate a fragile parser grammar. JSON Schema directly represents objects, arrays, required keys, discriminated unions, and enum restrictions; constrained decoding can improve structural compliance, but benchmark evidence shows schema support and downstream quality still vary, so local semantic validation remains necessary.[E1][E2][E3]

The canonical contract is therefore **pure JSON plus local validation**, not provider-specific function calling. When supported, the same JSON Schema may be sent through OpenRouter `response_format: { type: "json_schema" }` with `strict: true` and `provider.require_parameters: true`. This routes only to providers that honor the parameter. Response Healing is explicitly disabled because it mutates malformed output after generation and would obscure whether the model followed the inspected contract.[E5][E6]

### 6.2 Top-level object

```json
{
  "contract": "segment_reconciliation.v1",
  "source": {
    "prompt_fingerprint": "sha256:...",
    "segment_sequence": 42,
    "record_scope": "active_working_set"
  },
  "brief_field_proposals": [],
  "record_change_proposals": [],
  "record_creation_proposals": []
}
```

Rules:

- `additionalProperties: false` at every object layer.
- The three proposal arrays are always present.
- `source` values must exactly match the current inspected source.
- Proposal ids are unique across the entire response.
- Array order is proposal-id order: BF, RC, then NEW, each numerically ascending.
- No count fields are model-authored; the UI computes counts.

### 6.3 Common proposal contract

Every proposal contains:

```ts
interface ReconciliationProposalBase {
  proposal_id: `BF-${string}` | `RC-${string}` | `NEW-${string}`;
  evidence_spans: readonly string[];       // one or more valid SEG keys
  contrast_keys: readonly string[];        // one or more BRIEF/full-record/stub/scope keys
  rationale: string;                       // concise, independently phrased
  confidence: "high" | "medium" | "low";
}
```

Validation requires:

- at least one valid span from the selected segment;
- no duplicate citation within an item;
- at least one valid contrast key;
- no unknown or wrong-kind key;
- rationale not blank and not a quotation;
- no raw segment offsets, raw evidence text, or invented citation keys.

Confidence is presentation metadata, not permission to apply. A high-confidence item remains advisory.

### 6.4 Brief-field proposals

```ts
interface BriefFieldProposal extends ReconciliationProposalBase {
  proposal_id: `BF-${number}`;
  field_path: ReconciliationBriefFieldPath;
  operation: "FILL" | "REPLACE" | "CLEAR";
  proposed_value: unknown | null;
}
```

Rules:

- `field_path` must be one of the nineteen exact paths.
- `FILL` requires current state missing/blank and a non-null value.
- `REPLACE` requires current state present and a non-null value different from the canonical current value.
- `CLEAR` requires a path whose saved-draft schema permits blank/omitted and `proposed_value: null`.
- `proposed_value` is validated against the path-specific saved-draft field schema, not prose-ready normalization.
- Arrays are whole-field replacements. Index patches are forbidden because ordering semantics differ across fields and would be harder to transcribe safely.
- The model may not propose `generation_context`, working-set membership, selected POV, cast bands, directive, stop, voice pressure/overrides, validation focus, or story configuration.
- A brief proposal must cite its own `[BRIEF:<path>]` key among `contrast_keys`.

Example shape only:

```json
{
  "proposal_id": "BF-001",
  "field_path": "possessions",
  "operation": "REPLACE",
  "proposed_value": ["..."],
  "evidence_spans": ["[SEG-42-S003]"],
  "contrast_keys": ["[BRIEF:possessions]", "[OBJECT-2]"],
  "rationale": "The accepted action changes current custody of the object.",
  "confidence": "high"
}
```

The example deliberately contains no accepted-prose quotation.

### 6.5 Existing-record change proposals

```ts
interface RecordFieldChange {
  op: "SET" | "REMOVE_OPTIONAL";
  path: string;                  // RFC 6901 JSON Pointer into payload
  value?: unknown;
}

interface RecordChangeProposal extends ReconciliationProposalBase {
  proposal_id: `RC-${number}`;
  record_key: string;            // full record key only, never REF-* 
  record_id: string;
  action: "UPDATE_FIELDS" | "DEACTIVATE";
  lifecycle_destination: string | null;
  field_changes: readonly RecordFieldChange[];
}
```

Common rules:

- `record_key` and `record_id` must identify the same full rendered record.
- The payload `id` path is immutable and cannot appear in `field_changes`.
- Pointers must name real writable payload paths for that record type.
- Parent/child overlapping patches, duplicate paths, array-element patches, and unknown paths are rejected.
- `SET` requires `value`; `REMOVE_OPTIONAL` forbids it and is legal only for optional fields.
- Reference-valued SETs use the reference-token syntax in §6.7; raw model-invented UUIDs are rejected.
- After token resolution and patch application to an in-memory copy, the complete payload must pass `parseRecordPayload` and the existing deterministic reference checks.
- `contrast_keys` must contain the target `record_key`.
- At most one proposal may target a record. This prevents contradictory partial patches in one response.

`UPDATE_FIELDS` rules:

- `lifecycle_destination` must be `null`.
- `field_changes` must be nonempty.
- A patch that sets the lifecycle field to a deactivation destination is rejected; use `DEACTIVATE`.

`DEACTIVATE` rules:

- `lifecycle_destination` must be one of the explicit destinations for the record's type.
- The parser injects the lifecycle-field change; the model must not duplicate that path in `field_changes`.
- `field_changes` may contain additional non-lifecycle updates needed to leave an accurate terminal record, or may be empty.
- Deactivation is a lifecycle transition, not SQLite archival or deletion.

### 6.6 Record-creation proposals

```ts
interface RecordCreationProposal extends ReconciliationProposalBase {
  proposal_id: `NEW-${number}`;
  record_type: RecordType;
  display_label: string;
  payload_template: Record<string, unknown>; // no id
  dependencies: readonly `NEW-${number}`[];
}
```

Rules:

- `record_type` must equal one registry type literal.
- `display_label` must be nonblank and must not materially copy accepted prose.
- `payload_template` must not contain `id` at any depth.
- Every enum-valued field must use a value present in the generated schema's `enum`/`const` vocabulary.
- Required fields must be present after reference-token resolution; unknown keys are rejected.
- Existing-record references use rendered keys; new-to-new references use proposal ids as described in §6.7.
- `dependencies` must exactly equal the unique NEW ids referenced by the payload, in sorted order.
- The dependency graph must be acyclic; self-reference is rejected.
- The parser assigns deterministic temporary UUIDs derived from the prompt fingerprint and proposal id, resolves all tokens, injects each temporary `id`, validates every complete payload through the registry, and validates target existence/type against a synthetic project index containing existing records plus all proposals.
- Temporary ids exist only during validation and are never shown as ids to copy or written to storage.
- The UI presents proposals in topological order and describes unresolved human steps, for example “Create NEW-001 first, then select it in this reference field.”
- A creation proposal must cite `[RECORD-SCOPE]` or at least one full record key showing the comparison made against existing authority.

This makes multi-record suggestions possible without letting the model invent permanent ids. A common example is a new ENTITY followed by a linked CAST MEMBER or an EVENT linked to a newly introduced OBJECT. It remains a transcription guide, not an executable create graph.

### 6.7 Reference-token syntax

Only schema-declared reference fields interpret tokens. Elsewhere the same text is ordinary prose and is not resolved.

```text
$record:[ENTITY-1]
$record:[REF-ENTITY-1]
$new:NEW-001
```

Rules:

- Existing targets may be full records or declared reference stubs.
- New targets must name a creation proposal in the same response.
- A token occupies the entire string value; tokens embedded inside prose are rejected.
- For lists, each reference element is one token.
- Union literals such as `public`, `unknown`, `self`, `institution`, `offstage`, or `all_except_holders` remain their exact schema literals and never use token syntax.
- Raw UUIDs authored by the model are rejected even if syntactically valid. This prevents hallucinated ids and forces all existing references through inspectable source keys.

### 6.8 Full-response validation and quarantine

Parsing is all-or-nothing. The response is `valid` only after all of these passes succeed:

1. response is exactly one JSON object, with no surrounding text or code fence;
2. strict top-level Zod/JSON Schema parse;
3. source fingerprint, segment sequence, and scope match current source;
4. unique, correctly prefixed, sequential proposal ids;
5. every citation key resolves and has the correct kind;
6. every brief value passes path-specific validation;
7. every record pointer and operation is legal;
8. every lifecycle destination is legal for the target type;
9. every record type, field, requiredness rule, enum, union literal, and unknown-key rule passes;
10. every reference token resolves to a compatible existing or proposed type;
11. creation dependencies are exact and acyclic;
12. all patched/created payloads pass registry parsing and reference validation;
13. no proposal duplicates an identical target/action within the response;
14. the accepted-prose echo firewall passes.

Any failure yields:

```ts
interface MalformedSegmentReconciliationResult {
  status: "malformed";
  reasonCode: SegmentReconciliationMalformedReason;
  summary: string;
  rawOutput: string; // in-memory/session scratch only
}
```

The UI may show/copy raw output under a prominent “Malformed, non-canonical provider output” label. It does not salvage valid-looking items, repair JSON, call another model, or persist the response.

Suggested reason codes include:

```text
not-pure-json
schema-mismatch
source-mismatch
unknown-citation
invalid-brief-path
invalid-brief-value
invalid-record-target
invalid-patch
invalid-lifecycle-destination
invalid-record-type
invalid-enum
invalid-record-payload
invalid-reference
cyclic-creation-dependency
verbatim-source-echo
```

### 6.9 Accepted-prose echo firewall

Prompt instructions alone are insufficient for the locked “never verbatim” requirement. The parser must scan every model-authored natural-language string that could reach a clipboard or canonical editor: brief prose values, string/list record patches, creation prose fields, display labels, and rationales.

The proposed deterministic rule is:

1. Unicode-normalize to NFKC, case-fold, and collapse whitespace for comparison.
2. Reject any model-authored string containing an exact accepted-segment substring of at least 50 normalized characters.
3. Independently tokenize words and reject any exact run of eight or more accepted-segment word tokens.
4. Exempt only schema enum literals, booleans, numbers, ids/keys/tokens, and independently validated proper-name atoms of no more than three word tokens.
5. Never exempt a full sentence merely because it contains a name.

This is a conservative operational definition of a material verbatim passage. It cannot prove semantic originality, and very short conventional phrases will naturally overlap; the combination of no quote field, provenance-by-key, direct paraphrase instruction, and fail-closed overlap checks is the strongest deterministic boundary available without preventing useful text suggestions. A change to either threshold is contract behavior and requires the synchronization cascade.

### 6.10 No hidden provider transformations

For this operation the server must explicitly disable:

- OpenRouter Response Healing;
- context compression/middle-out transforms;
- web search, file parsing, or other plugins;
- tool calls/functions not represented in the inspected request;
- model fallback to a provider that ignores required structured-output parameters when structured mode is used.

If provider/account defaults force an undisclosable transformation that cannot be disabled, the operation fails clearly. OpenRouter documents that response healing changes malformed JSON and context compression removes/truncates middle content; both conflict with exact-source inspection.[E5][E6]

---

## 7. Lifecycle contract and schema-guided creation details

### 7.1 Registered type set at the target commit

The generated catalog must contain the following exact registry set, in registry order:

```text
ENTITY
ENTITY STATUS
CAST MEMBER
FACT
BELIEF
SECRET
LOCATION
OBJECT
VISIBLE AFFORDANCE
EVENT
INTENTION
PLAN
CLOCK
OBLIGATION
CONSEQUENCE
OPEN THREAD
RELATIONSHIP
EMOTION
```

This list is explanatory documentation. Runtime and golden assertions derive it from the registry.

### 7.2 Why the model receives the schemas

The owner's hardest problem is not naming that “a record should exist”; it is producing a proposal that can be transcribed without repeatedly looking up type-specific fields and controlled vocabularies. JSON Schema is well suited to this part because `enum` constrains values to a finite set, while object schemas express required properties and reject extras.[E3] Zod 4 can derive those schemas from the same validators already used at repository boundaries.[E4]

Constrained structured output reduces syntactic and enum errors but does not guarantee that an extracted fact is true, complete, or the right taxonomic choice. JSONSchemaBench finds meaningful differences in coverage, efficiency, and downstream quality among constrained decoders. The schema therefore narrows the shape; provenance, comparison against current records, local validation, and human review govern meaning.[E2]

### 7.3 Lifecycle field map

| Record type | Lifecycle field | Legal values |
|---|---|---|
| ENTITY | none | — |
| ENTITY STATUS | none | — |
| CAST MEMBER | none | — |
| FACT | implicit active only | `active` projection only |
| BELIEF | `status` | `active`, `resolved`, `abandoned` |
| SECRET | `status` | `hidden`, `partially_revealed`, `revealed`, `disproven`, `abandoned` |
| LOCATION | `status` | `active`, `inactive`, `destroyed`, `inaccessible` |
| OBJECT | `status` | `active`, `lost`, `destroyed`, `transferred`, `inactive` |
| VISIBLE AFFORDANCE | `status` | `available`, `blocked`, `unavailable` |
| EVENT | `status` | `active`, `resolved`, `background`, `abandoned` |
| INTENTION | `status` | `active`, `satisfied`, `abandoned`, `blocked` |
| PLAN | `plan_status` | `active`, `blocked`, `suspended`, `fulfilled`, `failed`, `abandoned`, `revised` |
| CLOCK | `status` | `active`, `paused`, `resolved`, `abandoned` |
| OBLIGATION | `status` | `open`, `closed`, `escalated`, `abandoned`, `transferred` |
| CONSEQUENCE | `status` | `pending`, `active`, `resolved`, `escalated`, `abandoned` |
| OPEN THREAD | `status` | `active`, `answered`, `resolved`, `escalated`, `abandoned`, `superseded` |
| RELATIONSHIP | `status` | `active`, `resolved`, `abandoned` |
| EMOTION | `status` | `active`, `suppressed`, `settled`, `transformed`, `dissociated` |

The values come from the exact schema/registry and must not be maintained independently in runtime prompt text.[R6][R16]

### 7.4 Allowed DEACTIVATE destinations

A legal status value is not automatically a deactivation destination. Reconciliation should use the same “no longer active for the current purpose” boundary already expressed by Hygiene's included/excluded lifecycle predicate. The exact proposed destination table is:

| Record type | Allowed destination(s) | Notes |
|---|---|---|
| ENTITY | none | Update descriptive fields or create/update ENTITY STATUS; do not deactivate identity. |
| ENTITY STATUS | none | Update current status payload; no lifecycle field exists. |
| CAST MEMBER | none | The dossier remains identity authority. |
| FACT | none | FACT has no inactive lifecycle value; contradicting truth needs explicit human review/update, not invented deactivation. |
| BELIEF | `resolved`, `abandoned` | `active` is not deactivation. |
| SECRET | `disproven`, `abandoned` | `revealed` remains a live truth/reveal-history state, not generic deactivation. |
| LOCATION | `inactive`, `destroyed`, `inaccessible` | All are schema destinations. |
| OBJECT | `lost`, `destroyed`, `transferred`, `inactive` | Transfer may still require holder/location field updates. |
| VISIBLE AFFORDANCE | `unavailable` | `blocked` remains current pressure. |
| EVENT | `resolved`, `background`, `abandoned` | Background is explicit non-current event authority. |
| INTENTION | `satisfied`, `abandoned` | `blocked` remains active pressure. |
| PLAN | `fulfilled`, `failed`, `abandoned`, `revised` | `blocked` and `suspended` remain active/reviewable. |
| CLOCK | `resolved`, `abandoned` | `paused` remains a live clock. |
| OBLIGATION | `closed`, `abandoned`, `transferred` | `escalated` remains active pressure. |
| CONSEQUENCE | `resolved`, `abandoned` | `escalated` remains current. |
| OPEN THREAD | `answered`, `resolved`, `abandoned`, `superseded` | `escalated` remains current. |
| RELATIONSHIP | `resolved`, `abandoned` | Active relationship changes normally use UPDATE_FIELDS. |
| EMOTION | `settled` | `suppressed`, `transformed`, and `dissociated` remain current emotional states under the existing hygiene predicate. |

This table is part of the proposed schema/domain contract and requires owner sign-off. Runtime should expose it as structured registry-adjacent metadata, not infer “anything except active.”

### 7.5 Creation taxonomy choice

The model must choose the narrowest record type whose taxonomic function matches the new durable state:

- objective truth → FACT;
- holder-bound interpretation → BELIEF;
- hidden truth plus reveal distribution → SECRET;
- completed/current causal occurrence → EVENT;
- actor aim → INTENTION;
- attempted course of action → PLAN;
- temporal pressure → CLOCK;
- duty/debt/promise → OBLIGATION;
- operative effect → CONSEQUENCE;
- unresolved question/setup/risk → OPEN THREAD;
- physical place/object/action availability → LOCATION, OBJECT, VISIBLE AFFORDANCE;
- directional social pressure → RELATIONSHIP;
- holder-bound affective pressure → EMOTION;
- identity/dossier/current entity state → ENTITY, CAST MEMBER, ENTITY STATUS.

The prompt tells the model not to create several records merely because one fact could be restated in several taxonomies. When two records are genuinely needed, each must have a distinct operational role and its own evidence/contrast rationale.

### 7.6 Human-in-the-loop is not optional quality polish

A 2025 study of LLM extraction across explicit and derived variables reported only roughly 62–72% agreement with human coding and argued for a human-in-the-loop validation process.[E7] That result is from a different domain, but it supports the architectural conclusion already required by Loom: typed output and provenance reduce clerical work; they do not confer authority. The UI must make manual verification the normal path, not a fallback for low confidence.

---

## 8. UI, quarantine, reminder integration, and API behavior

### 8.1 Navigation and page identity

Add a project-gated primary route beside Ideate and Record Hygiene:

```text
/segment-reconciliation
```

Suggested navigation label: **Reconcile Segment** or **Segment Reconciliation**. Use the latter as the heading even if the shorter nav label is chosen.

The page opens with:

```text
AI-suggested reconciliation scratch — not story state.
```

A second sentence states that the latest accepted segment will be sent to the configured external model only after prompt inspection and explicit send.

### 8.2 Source controls and disclosure

Controls:

- read-only segment source: `Latest accepted segment — #<sequence>`;
- record scope radio group: `Active working set` (default) / `Whole project`;
- Compile/Refresh prompt;
- Prompt Inspector;
- Copy prompt;
- Send to OpenRouter;
- Clear scratch.

Before send, disclose:

- exactly one full accepted segment, its sequence and accepted timestamp;
- all nineteen saved-draft fields, including blank/missing values;
- selected record scope, full-record count and per-type counts;
- whether reference stubs are included and what they contain;
- all lifecycle states included and archived rows excluded;
- generated eighteen-type schema catalog;
- that records may contain secrets and hidden author-facing truth;
- that author-private notes, other accepted segments, candidates, excluded generation fields, and prompt history are not sent;
- that provider handling follows the user's OpenRouter/model/provider configuration.

Mirror the existing one-time explicit send confirmation used by the assistance siblings, but give reconciliation its own disclosure key because accepted prose is a materially new source class.

### 8.3 Prompt freshness

After compile, any of these invalidates the visible prompt:

- a new segment is accepted;
- the latest accepted segment changes;
- any in-scope brief field is saved;
- record scope changes;
- any in-scope record or relevant display label changes;
- registry/schema or version changes.

The page marks the prompt stale and requires Refresh. The server fingerprint check remains authoritative even if the client misses an event.

Unsaved Generation Brief edits are not source. The page says “Saved draft values only” and links to Save Draft when relevant.

### 8.4 Valid-output presentation

Render three top-level tabs or stacked groups:

1. **Brief fields**
2. **Existing records**
3. **New records**

Every card shows:

- proposal id and confidence;
- accepted-segment evidence chips;
- current contrast keys;
- current value/record summary;
- proposed value/patch/type;
- rationale;
- a permanent “Suggestion only” badge.

Allowed controls:

- Show evidence in latest segment;
- Open brief field;
- Open record;
- Open blank `<TYPE>` editor;
- Copy proposed value;
- Copy patch JSON;
- Copy creation JSON;
- Keep/Unkeep in this browser session.

Forbidden controls/behaviors:

- Apply, Accept change, Fix, Fix all, Auto-update, Create from proposal, Prefill editor, Merge, Remove, Delete, Archive, Deactivate, Add to working set, Change cast band, Use as prose, Use as prompt, Import to notes;
- background scanning or automatic rerun after acceptance;
- persisted findings history;
- server writes caused by Keep, Unkeep, or Clear.

### 8.5 Session-scoped keepers

Match the sibling pattern: keeper ids may live in `sessionStorage`, keyed by project plus prompt fingerprint. They are convenience state only. A refreshed/source-changed prompt starts a distinct keeper set. Clearing deletes current output and keepers and performs no server write.

Do not store full accepted text or raw output in `localStorage`, project SQLite, analytics, logs, or URLs.

### 8.6 Malformed output

A malformed response renders in a separate error surface with:

- reason code and concise local validation message;
- raw output collapsed by default;
- Copy raw output;
- Clear;
- no parsed proposal cards and no navigation/prefill actions derived from it.

The UI must not imply that some items are safe merely because they look plausible.

### 8.7 Durable-change reminder CTA

Add one CTA:

```text
Reconcile latest segment
```

Behavior:

- visible whenever the existing durable-change reminder is visible and a latest segment exists;
- navigates to `/segment-reconciliation`;
- does not call the acknowledge endpoint;
- does not snooze;
- does not pre-send or compile in the background;
- preserves the existing manual checklist and all current reminder controls.

After navigation, the page may compile only on an explicit user action. This keeps assistance pull-based.

### 8.8 Server routes

Recommended routes:

```text
POST /api/segment-reconciliation/compile
POST /api/segment-reconciliation/analyze
```

Compile:

1. parse strict request;
2. obtain latest accepted segment with a dedicated one-row repository method including text;
3. load saved draft and project records;
4. build selected scope and reference stubs;
5. generate catalog/spans/keys;
6. compile and fingerprint;
7. return prompt, disclosure, output schema, and source metadata.

Analyze:

1. parse strict request with expected fingerprint;
2. rebuild snapshot/prompt from repository state;
3. reject drift;
4. make one OpenRouter request with inspected prompt and exact structured-output policy;
5. parse/validate the response locally;
6. return either typed valid proposals or malformed scratch.

The server must not accept prompt text, records, brief values, segment text, schema catalogs, or source counts from the client.

### 8.9 Repository and implementation seams

Recommended new core modules:

```text
packages/core/src/compiler/reconciliation/types.ts
packages/core/src/compiler/reconciliation/citation-keys.ts
packages/core/src/compiler/reconciliation/segment-spans.ts
packages/core/src/compiler/reconciliation/schema-catalog.ts
packages/core/src/compiler/reconciliation/record-renderer.ts
packages/core/src/compiler/reconciliation/template.ts
packages/core/src/compiler/reconciliation/compile-segment-reconciliation-prompt.ts
packages/core/src/compiler/reconciliation/output-schema.ts
packages/core/src/compiler/reconciliation/parse-output.ts
```

Recommended server modules:

```text
packages/server/src/segment-reconciliation-snapshot-builder.ts
packages/server/src/segment-reconciliation-routes.ts
packages/server/src/segment-reconciliation-parse.ts
```

Recommended web modules:

```text
packages/web/src/segment-reconciliation/SegmentReconciliationView.tsx
packages/web/src/segment-reconciliation/ReconciliationProposalCard.tsx
packages/web/src/segment-reconciliation/keepers.ts
```

Extend:

- `packages/core/src/compiler/template-constants.ts` with `RECONCILIATION_SECTION_ORDER`;
- `packages/core/src/index.ts` exports;
- `packages/server/src/record-repository.ts` with `getLatestAcceptedSegmentForReconciliation()` returning id/sequence/time/text from one ordered row;
- server registration;
- `packages/web/src/api.ts` typed clients;
- `packages/web/src/shell/AppShell.tsx` primary route;
- `packages/web/src/shell/DurableChangeReminder.tsx` CTA.

Do not widen `getReminderAcknowledgedSequence()` or reminder metadata methods to carry accepted text. Keep the new evidence access purpose-specific.

---

## 9. External prior art and design consequences

### 9.1 Structured output: constrain shape, then validate meaning

OpenAI's Structured Outputs documentation describes strict JSON-Schema adherence, including prevention of missing required keys and invalid enum values. OpenRouter exposes the same `response_format: json_schema` pattern for supported models and recommends `require_parameters: true` to avoid routing to a provider that ignores it.[E1][E5] JSON Schema's `enum` keyword is specifically designed to restrict a value to a finite set, and Zod 4 can generate JSON Schema from the validators Loom already uses.[E3][E4]

The consequence for Loom is not “trust structured output.” It is:

- derive one schema catalog from the existing registry;
- request strict structured output where available;
- reject unknown enum values and types locally;
- rerun the canonical Zod parser after token resolution;
- quarantine the entire response on semantic or source mismatch.

JSONSchemaBench evaluates roughly ten thousand real-world schemas and reports meaningful differences among constrained-decoding systems in schema coverage, efficiency, and output quality.[E2] Therefore provider constraint support is an error-reduction layer, not a substitute for local validation or human judgment.

### 9.2 Memory systems show the tempting path Loom should reject

Generative Agents stores a natural-language record of experiences, synthesizes reflections, and retrieves memories to plan behavior. MemGPT lets an LLM manage tiers of memory. Mem0 dynamically extracts, consolidates, and retrieves salient information.[E8][E9][E10]

Those systems demonstrate that extracting durable state from ongoing text can improve longitudinal coherence. They also illustrate exactly why Loom's authority boundary matters: an agent-controlled memory write can silently turn an interpretation into future context. Segment Reconciliation adopts the useful **delta-identification** pattern but rejects autonomous persistence, reflection-as-canon, model-managed retrieval, and automatic reuse. The model proposes; deterministic code validates shape; the author decides and re-authors canonical state.

### 9.3 Human validation remains necessary after schema validation

Human-in-the-loop extraction research reports substantial but imperfect consistency between model extraction and human coding and explicitly recommends a validation workflow.[E7] Loom's provenance chips, current-value comparison, strict schema, and canonical-editor navigation should make that review fast. They must not be presented as evidence that review is optional.

### 9.4 Creative-writing tools commonly couple story bibles to generation context

Current product documentation shows several common patterns:

- Novelcrafter's Codex stores characters, locations, objects, and progressions, with automatic mentions and relationships that can bring linked entries into context.[E12]
- Sudowrite's Story Bible and Worldbuilding cards directly inform outlines, scenes, and prose generation; its saliency engine chooses context it judges relevant, and smart import can generate character/worldbuilding cards from text.[E13]
- SillyTavern World Info and NovelAI Lorebook activate entries from keywords found in recent text, with recursive or always-on inclusion and context trimming/placement controls.[E14][E15]

These products solve different problems and are not being criticized for violating Loom's constitution. They are useful counterexamples for this design. Loom deliberately does not let accepted text trigger automatic record inclusion, automatic story-bible creation, saliency-based source selection, or context insertion. Its differentiation is visible source selection, deterministic completeness, validation before use, and a human-controlled canon boundary.[R2]

### 9.5 Long context does not justify archive access

“Lost in the Middle” found that model performance can degrade when relevant information is buried in the middle of long contexts, even for long-context models.[E11] This reinforces, but does not solely determine, the constitutional choice: exactly one local segment, stable sections, source contract at the front edge, output contract at the final edge, and no archive dumping. Whole-project record scope is allowed because it is structured, explicit, and sometimes necessary; if it is too large, the operation fails instead of using hidden retrieval or compression.

### 9.6 Prior-art synthesis

The recommended design combines four lessons without importing their unsafe defaults:

| Prior-art lesson | Adopt | Reject |
|---|---|---|
| JSON-schema constrained output | Generated schemas, enums, strict object shape | Treating syntactic compliance as factual correctness |
| Agent memory/state updating | Explicit candidate deltas after new experience | Autonomous extraction, consolidation, retrieval, or persistence |
| Human-in-loop extraction | Provenance, comparison, fast review | “High confidence” as permission to write |
| Story-bible/context systems | Typed world-state organization | Keyword/saliency activation, prose-mined canon, automatic context insertion |

---

## 10. **PROPOSED FOUNDATIONS AMENDMENT — exact wording for owner sign-off**

**Status:** proposal only. This block has not been approved or applied. Under FOUNDATIONS §1.1, the owner must explicitly sign off on this exact wording before implementation; the amendment, code behavior, domain docs, checklist changes, version bumps, and tests must land in the same revision.[R2]

The amendment should replace or add the following complete text.

### 10.1 Replace the prompt-class source/prohibition paragraphs in §8 with this text

> The prompt compiler is a deterministic renderer, not an intelligence layer.
>
> Every prompt class must have one explicit source contract. Assistance prompts declare their source profile under §9.1; every prompt class must also document its sources in the applicable domain authority and `docs/specs/compiler-contract.md`. The compiler must not read a source merely because it is available in the project store.
>
> It must:
>
> - compile a prose prompt or prose-aligned assistance prompt only from the records and generation-time fields declared by that prompt's source profile;
> - compile a project-review assistance prompt only from the explicit deterministic project-record projection declared by that prompt's source profile;
> - compile a segment-reconciliation assistance prompt only from exactly one explicitly selected accepted segment, the purpose-limited generation-time field projection, the explicit user-selected record-contrast scope, and the deterministic record-schema catalog declared by that prompt's source profile;
> - use stable section names and deterministic ordering;
> - render records and accepted-segment evidence into purpose-specific, inspectable prompt sections rather than raw database or archive dumps;
> - preserve author-written nuance fields needed by the declared prompt purpose;
> - keep operational fields meaningful for validation, formatting, or review;
> - expose every compiled prompt to the user for inspection before sending.
>
> It must not:
>
> - use an LLM to choose source records, accepted segments, fields, or evidence spans;
> - use an LLM to summarize source records or accepted prose during compilation;
> - use an LLM to repair contradictions or malformed assistance output during compilation or parsing;
> - decide by intuition what matters;
> - silently compress or omit records or accepted-segment text required by the declared source profile;
> - infer source material from accepted prose, candidates, author-private notes, or hidden UI state; the segment-reconciliation profile's direct, explicit read of one selected accepted segment is not inference;
> - include accepted prose text in any prose prompt or in any assistance prompt other than the exact segment-reconciliation profile declared in §9.1;
> - mutate story records, generation-time fields, active-working-set membership, or accepted prose; or
> - let a project-review or segment-reconciliation assistance source grant any record authority in a prose prompt.
>
> A prose or prose-aligned assistance compiler receives normalized readiness input. Normalization may apply deterministic non-story defaults, such as first-segment versus continuation derived from accepted-segment count. Normalization must not invent story facts, handoff prose, current situation, routes, positions, voice pressure, or directive content.
>
> A project-review assistance compiler receives its own typed deterministic snapshot. A segment-reconciliation assistance compiler receives its own typed deterministic snapshot containing the one selected accepted segment and only the declared reconciliation sources. Neither compiler may reuse generation readiness input when doing so would add undeclared sources, omit declared sources, or block the diagnostic purpose on the condition it exists to inspect.

All other §8 paragraphs remain unchanged.

### 10.2 Replace §9.1 in full with this text

> ### 9.1 Assistance prompt class
>
> An assistance prompt is a deterministic, inspectable prompt whose declared source profile is explicitly sanctioned for its assistance purpose and whose output is never story text or continuity authority.
>
> Every assistance prompt must declare exactly one source profile in the applicable domain authority and in `docs/specs/compiler-contract.md`:
>
> - **prose-aligned:** the same authority sources as the prose prompt: story configuration, the active working set, and only the generation-time fields needed by the assistance purpose;
> - **project-review:** a deterministic records-only projection of explicitly named story-record types, drawn from an explicit, user-selected, disclosed scope — the whole project by default, or a narrower scope the user has explicitly chosen — with explicit archive and per-type status predicates applied identically to every record within that scope; or
> - **segment-reconciliation:** exactly one accepted segment selected by the explicit assistance request — the latest accepted segment is the only v1 selection — plus only the CURRENT AUTHORITATIVE STATE and IMMEDIATE HANDOFF fields declared by the segment-reconciliation domain authority, every non-archived record in an explicit user-selected and disclosed record-contrast scope, minimal declared reference-label metadata, and a deterministic schema catalog derived from registered record types and validators. The accepted segment is bounded evidence for advisory reconciliation, not canon authority and not prose-prompt authority.
>
> A project-review or segment-reconciliation assistance prompt does not change the active working set and grants no record outside the active working set authority in a prose prompt. Assistance source selection must never be keyword-triggered, probabilistic, model-selected, embedding-selected, token-budget-evicted, derived from author-private notes, taken from hidden UI state, or inferred from accepted prose or candidates. The segment-reconciliation profile's direct read of the one accepted segment named by its explicit request is the sole accepted-prose source exception; no model or compiler chooses that segment by content.
>
> A project-review or segment-reconciliation assistance prompt may offer more than one record scope only when every scope is an explicit, user-selected, deterministic, and disclosed projection. The active scope must be named in the compiled prompt and surfaced in the inspection UI. The declared archive and status rules must render every qualifying record within the selected scope — none hidden, ranked, summarized, batched, or omitted. Reading active-working-set membership to honor a user-selected working-set scope is not a working-set mutation and grants no record prose authority.
>
> The segment-reconciliation profile has these additional source constraints:
>
> - it reads exactly one accepted segment and never a range, rolling window, archive dump, candidate, regeneration, automatic prose-derived summary, or model-selected excerpt;
> - the v1 request value is `latest`, selected explicitly by the user invoking the operation, and the server fetches one latest accepted row directly;
> - it renders the complete selected segment as escaped evidence spans with deterministic citation keys; evidence spans are local compiler partitions, not model-selected retrieval;
> - it renders only the purpose-limited generation-time fields and record scope registered in its domain authority and compiler contract;
> - it may expose schema and enum vocabularies only from deterministic registered validators and declared lifecycle/reference metadata;
> - an oversize prompt fails visibly; no source may be trimmed, summarized, compressed, or evicted to fit a context budget.
>
> Assistance prompts must:
>
> - compile deterministically: identical declared source records and fields, accepted-segment source where permitted, assistance-request inputs, template version, compiler version, and compiler-contract version must produce an identical prompt;
> - be inspectable before sending, under the same audit boundaries as §22;
> - use purpose-appropriate deterministic gating: structurally malformed or unrepresentable source data and unsafe provider/policy configuration block the affected operation; prose-launch readiness requirements apply only when the assistance purpose needs them; a diagnostic assistance prompt must not be blocked merely because it detects the contradiction, overlap, redundancy, staleness, missing field, or durable change it exists to inspect;
> - never use an LLM intermediary to select, rank, summarize, repair, rewrite, or omit sources during compilation;
> - never produce story prose and never be used to request story prose;
> - never have their output enter any prose prompt, story record, active working set, or generation-time field automatically (§26 assistance-output rules).
>
> Segment-reconciliation assistance output must additionally:
>
> - attach one or more valid accepted-segment span citations to every proposed brief update, record change, lifecycle deactivation, or record creation;
> - carry the current field or record contrast keys used to form the proposal;
> - use only registered record types, schema-valid field shapes, real enum values, and declared lifecycle destinations;
> - omit accepted-prose quotations and independently paraphrase any proposed prose value;
> - be validated locally as one complete structured response and quarantined in full when malformed, stale, schema-invalid, reference-invalid, provenance-invalid, or materially verbatim;
> - remain ephemeral scratch, with no project-store write, prompt reuse, automatic editor insertion, or automatic retry/repair.
>
> The local-prose stop rule and the prohibition on requesting alternatives, plans, or summaries (§4.6, §11 item 7, §19, §29.5) scope to the prose prompt class. An assistance prompt may request non-prose alternatives, questions, comparisons, review findings, or structured advisory deltas because no prose writer is being asked to branch the story.
>
> The template must remain portable, inspectable, and model-provider-neutral. Markdown with XML-style section boundaries is the constitutional default because it is readable to humans and gives models stable semantic boundaries. A provider's schema-constrained response mode may enforce the same inspected output contract, but provider-specific hidden source selection, repair, compression, or prompt forks must not enter the v1 core.

The existing universal-prose section list and following §9 text remain after this replacement.

### 10.3 Replace §10 in full with this text

> ## 10. Accepted prose is excluded from prose prompts and continuity authority
>
> Accepted prose segments must not be included in generated prose prompts.
>
> This remains a hard constitutional rule.
>
> The sole prompt-source exception is the `segment-reconciliation` assistance profile in §9.1. That profile may read exactly one accepted segment — the latest accepted segment is the only v1 selection — as bounded evidence for quarantined advisory proposals. It may not read a range, archive, candidate, regeneration, model-selected excerpt, or automatic prose-derived summary.
>
> The exception does not make accepted prose canon authority. Accepted prose must never be used automatically to populate or mutate a story record, generation-time field, active-working-set entry, story configuration field, or prose prompt. Assistance output derived from it remains non-canonical until the user independently reviews and authors a change in the canonical editor.
>
> Segment-reconciliation output must not quote or copy accepted prose into proposed handoff, current-state, record, label, or rationale text. Provenance is represented by deterministic span keys that point back to the readable accepted segment; proposed prose values must be independently paraphrased and must pass the declared verbatim-echo guard before display as valid output.
>
> Outside this narrow assistance exception, the reason for the prohibition is unchanged. Accepted prose encourages phrase echo, style mimicry, accidental leakage, context bloat, and prose-as-canon drift. Continuity Loom must not ask the external prose writer to derive continuity from prior prose.
>
> The correct mechanism for carrying prior events forward is user-maintained structured story state, especially EVENT, CURRENT AUTHORITATIVE STATE, IMMEDIATE HANDOFF, FACT, BELIEF, RELATIONSHIP, EMOTION, PLAN, CLOCK, OBLIGATION, CONSEQUENCE, OPEN THREAD, LOCATION, OBJECT, VISIBLE AFFORDANCE, ENTITY STATUS, and CAST MEMBER.
>
> The only allowed continuation-launch material is user-authored generation-time context, such as recent causal context, last visible moment, begin-after guidance, manual directive, relevant current state, and selected records. Segment-reconciliation suggestions are not continuation-launch material unless and until the user independently authors equivalent content into those canonical fields or records.
>
> Prompt-facing prose-generation schema fields must not use accepted prose, rejected candidates, superseded candidates, or automatic prose-derived summaries as their source. The segment-reconciliation domain may label its bounded data section as accepted-segment evidence, but it must not expose a reusable “accepted prose summary” or any stored prompt-facing accepted-prose field.
>
> If a prior accepted segment created continuity-relevant durable change, that change belongs in user-authored story records, current authoritative state, immediate handoff, or selected records before the next prose prompt is generated. Segment Reconciliation may help the user identify and phrase candidate changes; it does not perform that transfer.

### 10.4 Replace the opening and closing prompt-source sentences of §21 by replacing §21 in full with this text

> ## 21. Accepted segment archive
>
> Accepted segments are readable story output.
>
> They are not canon authority for future generation.
>
> The app should allow the user to see accepted segments individually and in order. Segment browsing is a reading and review affordance, not a prose-prompt source. The sole assistance-source exception is the `segment-reconciliation` profile in §9.1, which reads exactly one explicitly requested accepted segment — latest only in v1 — for quarantined advisory review. That exception does not authorize archive ranges, prose generation, stored summaries, or automatic continuity writes.
>
> Accepted segment metadata should include:
>
> - story identifier;
> - segment order or index;
> - timestamp;
> - model used;
> - provider/model identifier;
> - prompt template version where available;
> - compiler version where available.
>
> The app does not need to mark whether the user edited the candidate before acceptance. The accepted text is the accepted text.
>
> Discarded candidates and regenerated candidates should not be stored.
>
> After acceptance, the app should remind the user that durable changes likely require manual record updates. The reminder may link to Segment Reconciliation, but opening or using that assistance surface must not acknowledge the reminder or imply that canonical updates are complete.

### 10.5 Replace §28.1 and §28.2 with this text

> ### 28.1 Prior accepted prose must not become prose-prompt context or automatic canon
>
> Accepted prose must never be included in a prose prompt. Structured records and user-authored handoff fields remain the continuity mechanism. This avoids prose echo, style mimicry, context bloat, and prose-as-canon drift.
>
> One narrow v1 assistance exception is allowed: the `segment-reconciliation` profile may inspect exactly the latest accepted segment as bounded evidence for quarantined advisory updates. The segment remains non-authoritative; the model must not quote it into proposed fields; and no result is stored or reused without explicit, independent user authorship in a canonical surface.
>
> ### 28.2 Long-context capability does not justify archive dumping or hidden source loss
>
> Long context windows are useful, but they do not make indiscriminate context safe. Important information can be underused when buried in the middle of long prompts. Continuity Loom should use stable sections, place source/output contracts near prompt edges, and avoid dumping prose archives.
>
> Segment Reconciliation therefore reads one complete accepted segment only. It must not read a multi-segment range, retrieve excerpts by similarity or keyword, summarize an archive, or silently truncate/compress the segment or selected record scope. If the declared complete source cannot fit, the operation fails and asks the user to choose the explicit narrower record scope or a compatible model; the compiler never decides what to omit.

### 10.6 Replace §29.2 with this text

> ### 29.2 Continuity authority hard fails
>
> - Does it let an LLM make authoritative record or generation-brief changes?
> - Does it infer canon automatically from accepted prose or assistance output?
> - Does it treat an accepted segment as continuity authority rather than bounded reconciliation evidence?
> - Does it mutate records or generation-time fields without explicit user review and independent authorship in the canonical editor?
> - Does it allow the external prose writer to update records?
> - Does it hide continuity changes inside generation, regeneration, acceptance, reconciliation, or reminder acknowledgement?
> - Does it let assistance output enter a prose prompt, a story record, a generation-time field, or the active working set automatically or through an assistance-surface prefill/staging control?
> - Does it copy accepted prose verbatim into a proposed canonical field or record value?

### 10.7 Replace §29.3 with this text

> ### 29.3 Active working set and assistance-scope hard fails
>
> - Does it silently include records the user did not select in a prose prompt, or treat records outside the active working set as authority for prose generation?
> - Does a record-scoped assistance prompt hide, vary, or incompletely render the source predicate within its declared user-selected scope; apply a scope the user did not explicitly select; or fail to disclose its active scope in the compiled prompt and inspection UI?
> - Does Segment Reconciliation apply a hidden status predicate, retrieval/ranking rule, reference closure, or token-budget omission instead of rendering every non-archived record in the selected contrast scope?
> - Does it let a reference-label stub become a change target or import an out-of-scope payload without explicit whole-project selection?
> - Does it silently remove selected records?
> - Does it silently compress active/onstage cast dossiers?
> - Does it treat inactive records as branches?
> - Does it prevent the user from inspecting what will be compiled?

### 10.8 Replace §29.4 with this text

> ### 29.4 Prompt compilation hard fails
>
> - Does it use an LLM intermediary to select, rank, summarize, repair, rewrite, or omit records, accepted prose, fields, or evidence spans during prompt compilation?
> - Does it make prompt output nondeterministic for identical inputs and versions?
> - Does any prose prompt include accepted prose?
> - Does any assistance prompt include accepted prose outside the exact `segment-reconciliation` profile?
> - Does Segment Reconciliation read more than one accepted segment; read any non-selected segment, candidate, regeneration, archive range, or automatic prose-derived summary; choose source by content; or substitute a model/compiler summary for the complete selected segment?
> - Does Segment Reconciliation silently trim, compress, retrieve, rank, or token-budget-evict any accepted-segment text or qualifying record?
> - Does it treat accepted-segment data as prompt instructions, expose an uninspected provider transform, or use hidden response repair?
> - Does it preserve provider-specific prompt hacks as v1 core behavior?
> - Does it omit one of the universal prompt contract sections for prose prompts other than the designated optional sections enumerated in §9 without constitutional amendment, or omit even a designated optional section nondeterministically?
> - Does an assistance prompt use a source profile that is not explicitly named and deterministically specified in its domain authority and the compiler contract?
> - Does a project-review or segment-reconciliation assistance prompt cause its source records or output to enter a prose prompt or alter active-working-set membership?
> - Does an assistance prompt select, rank, omit, or evict source records by keyword activation, probability, model judgment, hidden embeddings, token budget, candidates, author-private notes, or hidden UI state?
> - Does Segment Reconciliation accept a client-supplied prompt instead of rebuilding and fingerprint-checking the declared source?

### 10.9 Replace §29.8 with this text

> ### 29.8 Accepted prose archive hard fails
>
> - Does it store rejected candidates by default?
> - Does it use accepted segments as prose-prompt context?
> - Does it use accepted prose as assistance-prompt context outside the exact one-segment `segment-reconciliation` profile?
> - Does Segment Reconciliation read a range/archive, expose an older-segment chooser in v1, include a model-selected excerpt, or allow a provider transform to omit part of the selected segment?
> - Does it automatically store, summarize, canonize, or reuse information mined from accepted prose?
> - Does it require accepted segments to mark whether the user edited them?
> - Does it hide accepted segments from user review?
> - Does it fail to remind the user to update records after accepted durable changes?
> - Does opening Segment Reconciliation automatically acknowledge or clear that reminder?

### 10.10 Replace §29.9 with this text

> ### 29.9 Prompt audit, assistance scratch, and secrets hard fails
>
> - Does it permanently archive prompts or assistance responses by default?
> - Does it commit prompt logs to git?
> - Does it persist accepted-segment prompt copies, raw reconciliation output, parsed proposals, or keeper state in the project store by default?
> - Does clearing assistance scratch leave project-store, working-set, prompt, log, or persisted browser residue?
> - Does it expose API keys in prompt inspection UI?
> - Does it store API keys in story files?
> - Does it log API keys or embed them in prompts?
> - Does it send accepted prose or record secrets without an explicit source disclosure and user-initiated provider action?
> - Does it fail unclearly when no OpenRouter key is configured?

### 10.11 Checklist sections that do not require wording changes

No wording change is proposed for:

- §29.1: accepted prose still does not become canon or plot authority;
- §29.5: its existing diagnostic-assistance exception already forbids blocking the surface merely because state is incomplete or stale;
- §29.12: author-private notes remain absolutely excluded.

Those sections still apply and need direct tests.

---

## 11. Same-change cascade and exact domain-document wording

The constitutional amendment is necessary but insufficient. The following documentation, implementation, version, and test changes form one indivisible synchronization set.

### 11.1 New active domain authority

Create:

```text
docs/specs/segment-reconciliation-prompt-template.md
```

It should be the domain authority for the profile, source predicate, field boundary, section order, schema catalog, lifecycle destinations, output schema, provenance spans, echo guard, and UI quarantine. Its normative substance should be the rules in §§3–8 of this proposal, converted to active-document form without research discussion or open alternatives.

Add this exact row to the active-doc registry table in `docs/ACTIVE-DOCS.md`:

> | `docs/specs/segment-reconciliation-prompt-template.md` | Single-segment accepted-prose reconciliation assistance prompt, source profile, record scope, generation-field boundary, schema catalog, structured output contract, provenance, paraphrase firewall, and UI quarantine. | reference | domain authority for the segment-reconciliation assistance prompt template |

Also add the file to any active prompt/compiler synchronization list in `docs/ACTIVE-DOCS.md`. Do not register this change proposal itself; it is a hand-off artifact, not a repository authority.

### 11.2 Exact proposed `docs/specs/compiler-contract.md` changes

#### Header version pin

Replace the contract pin with:

> Contract version: `1.9.0`; any change that bumps `contract.version` or `compiler.version` in `packages/core/src/version.ts` must update this pin in the same revision.

#### Insert new §2.3 and renumber Universal exclusions to §2.4

> ### 2.3 Segment-reconciliation source profile
>
> The segment-reconciliation compiler renders from these sources only:
>
> 1. Template constants from `docs/specs/segment-reconciliation-prompt-template.md`.
> 2. A `SegmentReconciliationSnapshot` containing exactly one accepted segment selected by the request. The only v1 selection is `latest`; the server fetches one latest accepted row directly and includes its complete text, sequence, id, and accepted timestamp.
> 3. A purpose-limited saved-draft generation-field projection containing exactly the CURRENT AUTHORITATIVE STATE and IMMEDIATE HANDOFF paths registered in `docs/specs/story-record-schema.md`. Missing and blank values remain explicit. The compiler does not consume `GenerationSessionReadyInput` and does not apply prose-readiness defaults.
> 4. Every complete non-archived story record in the explicit user-selected record scope: `active_working_set` by default or `whole_project`. All registered record types and lifecycle states are included. The active-working-set scope reads `active_working_set.selected_records` only to form the selected contrast set; neither mode changes working-set membership or prose authority.
> 5. Deterministic reference stubs containing only id, type, and stored display label when an in-scope source references a non-rendered record. Reference stubs are not record-change targets and do not import out-of-scope payloads.
> 6. A deterministic record-creation schema catalog derived from `recordTypeRegistry`, registered payload validators, and the lifecycle/reference metadata declared by `docs/specs/story-record-schema.md`.
> 7. A strict `SegmentReconciliationRequest` containing `segmentSelection: "latest"`, `recordScope: "active_working_set" | "whole_project"`, and the expected prompt fingerprint for analyze/send.
> 8. Deterministic empty-state, span-partition, citation-key, output-schema, and verbatim-echo constants defined by this contract and the domain authority.
>
> The compiler generates accepted-segment span keys locally and renders the complete selected segment in source order. It must not select excerpts, retrieve by similarity or keyword, summarize, rank, batch, compress, or evict segment text or qualifying records. Provider context overflow is a reconciliation send failure, not permission to truncate.
>
> The segment-reconciliation source profile excludes older accepted segments, accepted-segment ranges, candidates and regenerations, automatic prose-derived summaries, author-private notes, story configuration, prompt archives, prior assistance output, provider memory, hidden UI state, archived records, and every generation-time field not explicitly registered for reconciliation.
>
> Segment-reconciliation output is advisory scratch. It grants no record or brief-field authority, adds no readiness diagnostic, changes no active-working-set membership, and never enters a prose prompt automatically.
>
> ### 2.4 Universal exclusions
>
> No prose prompt, prose-aligned assistance prompt, or project-review assistance prompt may use accepted prose, rejected candidates, regenerated candidates, prompt archives, model memory, automatic prose-derived summaries, or author-private notes.
>
> The sole accepted-prose exception is the segment-reconciliation source profile in §2.3, which reads exactly one explicit latest accepted segment for bounded advisory review. No prompt compiler may read any other accepted-prose source or persist a derived summary.
>
> Generation-time fields may override story defaults for the current prose request, but they do not override hard canon, current authoritative state, physical continuity, POV/reveal locks, or governing provider/platform policy. Segment-reconciliation proposals have no override effect at all.

#### Insert new §3.4

> ### 3.4 Segment-Reconciliation Prompt Section Order
>
> The compiler renders every section in this exact order:
>
> 1. `<segment_reconciliation_role>`
> 2. `<segment_reconciliation_source_contract>`
> 3. `<segment_reconciliation_request>`
> 4. `<accepted_segment_evidence>`
> 5. `<current_reconciliation_fields>`
> 6. `<record_contrast_scope>`
> 7. `<record_contrast_records>`
> 8. `<segment_reconciliation_field_rules>`
> 9. `<segment_reconciliation_record_rules>`
> 10. `<record_creation_schema_catalog>`
> 11. `<segment_reconciliation_provenance_and_paraphrase_rules>`
> 12. `<segment_reconciliation_review_procedure>`
> 13. `<segment_reconciliation_output_format>`
>
> All thirteen sections always render. The complete source contract remains at the front edge and the complete strict JSON output contract remains at the final edge. Optional source values use deterministic explicit empty states; source sections are never omitted because their collections are empty.

#### Insert new §4.2 after the Hygiene mapping and renumber later mapping sections as needed

> ### 4.2 Segment-reconciliation source mapping
>
> | Prompt destination | Deterministic source | Empty-state behavior | Validation and exclusion rule |
> |---|---|---|---|
> | `<segment_reconciliation_role>` | versioned template constant | never empty | block if absent |
> | `<segment_reconciliation_source_contract>` | versioned template constant plus fixed source-profile literals | never empty | must name one segment, nineteen fields, selected record scope, schema catalog, all exclusions, and no-eviction rule |
> | `<segment_reconciliation_request>` | parsed request, selected segment metadata, source counts, pinned versions, prompt fingerprint | never empty | only `segmentSelection: latest`; scope must be explicit |
> | `<accepted_segment_evidence>` | complete selected accepted-segment text partitioned by the registered deterministic span algorithm | block with `no-accepted-segment` when absent | no excerpt selection, archive access, summary, or truncation |
> | `<current_reconciliation_fields>` | exact saved-draft paths registered in `docs/specs/story-record-schema.md` | every path renders `missing`, `blank`, or canonical present value | no readiness normalization and no other generation fields |
> | `<record_contrast_scope>` | explicit request scope plus deterministic source counts/predicates | never empty | archive excluded; every lifecycle state included; no ranking or status filter |
> | `<record_contrast_records>` | every full qualifying record plus declared reference stubs | `No non-archived records exist in the selected reconciliation scope.` | malformed qualifying row blocks; stubs are not change targets |
> | `<segment_reconciliation_field_rules>` | versioned template constant plus generated allowed-path/type table | never empty | manual directive, stop guidance, voice controls, working-set curation, validation focus, generation context, and story configuration excluded |
> | `<segment_reconciliation_record_rules>` | versioned update/deactivate/reference-token contract plus generated lifecycle map | never empty | only UPDATE_FIELDS and DEACTIVATE; no archive/delete/merge/remove |
> | `<record_creation_schema_catalog>` | deterministic JSON Schema and lifecycle/reference metadata generated from registered validators | block if catalog generation fails | every registered type/enum represented; repository-managed id forbidden in output |
> | `<segment_reconciliation_provenance_and_paraphrase_rules>` | versioned template constant plus generated citation grammar and echo thresholds | never empty | every proposal cites segment evidence; no quote field; material echo quarantines full output |
> | `<segment_reconciliation_review_procedure>` | versioned template constant | never empty | fixed compare-before-create procedure |
> | `<segment_reconciliation_output_format>` | generated strict output JSON Schema plus fixed pure-JSON instruction | never empty | no Markdown/preamble; local full-response validation remains authoritative |

#### Add these empty-state rules to §8

> - Segment Reconciliation always renders all nineteen allowed brief fields. A missing value renders the literal state `missing`; a present empty string/list renders `blank`; neither is silently omitted.
> - `<record_contrast_records>` renders `No non-archived records exist in the selected reconciliation scope.` when no full records qualify. Reference stubs, if any, render in their declared sub-block. Empty records do not disable send because brief and creation proposals may still be useful.
> - An absent accepted segment is not an empty state. It blocks reconciliation with `no-accepted-segment`.
> - Schema-catalog generation failure, malformed in-scope source, or source that cannot fit without omission is not an empty state. It blocks the operation.

#### Add this paragraph to §9, Prompt-facing vs validation-only fields

> For Segment Reconciliation, accepted-segment text, source spans, current saved-draft values, full in-scope record payloads, reference stubs, and generated record schemas are assistance-prompt-facing data only. Prompt fingerprints, offsets, versions, raw ids, parse reason codes, and temporary creation-validation ids are audit/validation metadata. None is prose-prompt-facing. Segment-reconciliation output is never prompt-facing for prose generation.

#### Append this exact paragraph to §10, Change-control rule

> Any change to the segment-reconciliation source profile, accepted-segment selection, span algorithm, allowed brief-field list, record scopes, archive/status predicate, ordering, record/reference serialization, schema-catalog generation, lifecycle destinations, reference-token grammar, section order, request shape, output JSON Schema, parser validation, verbatim-echo thresholds, provider-transform policy, or UI quarantine must update `docs/specs/segment-reconciliation-prompt-template.md`, `docs/specs/story-record-schema.md` where applicable, this contract, template/compiler/contract versions, and golden/parser/route/UI tests in the same change. If the change widens accepted-prose access or authority, it also requires a FOUNDATIONS amendment approved under §1.1.

### 11.3 Exact proposed `docs/specs/story-record-schema.md` changes

#### Append this text to §3.3 IMMEDIATE HANDOFF

> Segment Reconciliation may inspect the saved-draft values of `recent_causal_context`, `last_visible_moment`, and `begin_after` alongside exactly one latest accepted segment and may return paraphrased advisory replacements or fills. Those suggestions are not user-authored generation-time fields, do not satisfy readiness, and must not be inserted automatically. No proposal may contain a material verbatim passage from accepted prose; provenance uses accepted-segment span keys instead of quotations. The user must independently author any accepted handoff value in the Generation Brief editor.

#### Insert new §9.4 after the Hygiene projection

> ### 9.4 Segment-reconciliation assistance projection
>
> Segment Reconciliation is a `segment-reconciliation` assistance surface, not a prose-prompt source, not a validation authority, and not a mutation surface. It adds no stored schema fields.
>
> Its accepted-prose source is exactly one accepted segment selected by the explicit request. The only v1 selection is the latest accepted segment. No accepted-segment range, archive, candidate, regeneration, or automatic prose-derived summary is part of the projection.
>
> Its generation-time projection contains exactly these saved-draft CURRENT AUTHORITATIVE STATE paths:
>
> - `current_time`
> - `current_location`
> - `onstage_entities`
> - `immediate_situation_summary`
> - `offstage_pressuring_entities`
> - `positions`
> - `possessions`
> - `visible_conditions`
> - `environmental_conditions`
> - `entity_statuses`
> - `line_of_sight_and_visibility`
> - `pov_cannot_perceive_now`
> - `routes_and_exits`
> - `available_time`
> - `consent_or_force_conditions`
> - `current_locks`
>
> and exactly these saved-draft IMMEDIATE HANDOFF paths:
>
> - `recent_causal_context`
> - `last_visible_moment`
> - `begin_after`
>
> MANUAL MOMENT DIRECTIVE, STOP GUIDANCE, CURRENT CAST VOICE PRESSURE, CAST VOICE OVERRIDES, ACTIVE WORKING SET curation, selected POV, cast bands, GENERATION VALIDATION FOCUS, normalized `generation_context`, STORY CONTRACT, UNIVERSAL CONTENT POLICY, and PROSE MODE are excluded from proposal targets and prompt source except that active-working-set membership may be read solely to honor the explicit working-set record scope.
>
> The record projection uses one explicit user-selected scope:
>
> - `active_working_set`: every non-archived record named by `active_working_set.selected_records`, all registered types and lifecycle states; or
> - `whole_project`: every non-archived project record, all registered types and lifecycle states.
>
> `active_working_set` is the v1 default. Neither scope applies a semantic-active predicate. Every qualifying record renders its full payload in deterministic registry/type-label-id order. Archived records are excluded. Minimal id/type/display-label reference stubs may render for non-scope targets referenced by included source data; stubs do not become record-change targets and grant no prose authority.
>
> The record-creation schema catalog is generated deterministically from the registered record payload validators. It includes every registered record type, required and optional fields, defaults, union/literal alternatives, every enum vocabulary, repository-managed id rules, reference-bearing paths, lifecycle fields, and legal deactivation destinations. Runtime code must not maintain a second handwritten copy of type or enum vocabularies.
>
> The registered type set at adoption is ENTITY, ENTITY STATUS, CAST MEMBER, FACT, BELIEF, SECRET, LOCATION, OBJECT, VISIBLE AFFORDANCE, EVENT, INTENTION, PLAN, CLOCK, OBLIGATION, CONSEQUENCE, OPEN THREAD, RELATIONSHIP, and EMOTION. Tests compare the generated catalog to the registry so the catalog follows future same-change schema amendments.
>
> Legal Segment Reconciliation deactivation destinations are:
>
> - ENTITY, ENTITY STATUS, CAST MEMBER, FACT: none;
> - BELIEF: `resolved`, `abandoned`;
> - SECRET: `disproven`, `abandoned`;
> - LOCATION: `inactive`, `destroyed`, `inaccessible`;
> - OBJECT: `lost`, `destroyed`, `transferred`, `inactive`;
> - VISIBLE AFFORDANCE: `unavailable`;
> - EVENT: `resolved`, `background`, `abandoned`;
> - INTENTION: `satisfied`, `abandoned`;
> - PLAN: `fulfilled`, `failed`, `abandoned`, `revised` through `plan_status`;
> - CLOCK: `resolved`, `abandoned`;
> - OBLIGATION: `closed`, `abandoned`, `transferred`;
> - CONSEQUENCE: `resolved`, `abandoned`;
> - OPEN THREAD: `answered`, `resolved`, `abandoned`, `superseded`;
> - RELATIONSHIP: `resolved`, `abandoned`;
> - EMOTION: `settled`.
>
> A deactivation proposal names one destination above and may include additional non-lifecycle field updates. It never means archive, delete, remove, or merge.
>
> Every advisory proposal carries one or more deterministic accepted-segment span keys plus current field/record contrast keys. Creation proposals must name a registered type, use only schema-valid fields and enum values, and pass the same payload parser after temporary reference-token resolution. Output never mutates records, generation-time fields, lifecycle, validation, prose compilation, or active-working-set membership.

#### Append this synchronization bullet to schema §10

> - Any change to the Segment Reconciliation accepted-segment source, allowed generation-field projection, record scope, registered schema catalog, lifecycle destinations, reference-token rules, proposal shapes, or parser validation must update `docs/specs/segment-reconciliation-prompt-template.md`, this schema, `docs/specs/compiler-contract.md`, compiler/template/contract versions, and golden/parser tests in the same change.

### 11.4 User guide and reminder docs

Update `docs/user-guide.md` so the manual post-acceptance loop becomes:

1. accept the chosen segment;
2. review the durable-change reminder;
3. optionally open Segment Reconciliation;
4. inspect the exact one-segment prompt and selected record scope;
5. send only when comfortable with the disclosed accepted prose and records;
6. review suggestions against highlighted evidence;
7. manually edit canonical Generation Brief fields and records;
8. run validation and prompt preview before the next generation;
9. acknowledge the reminder when the user, not the model, judges the clerical work complete.

The guide must say that Reconciliation is optional, non-canonical, may be wrong, and never applies changes.

Update the durable-change reminder specification's active descendant/documentation, not the archived SPEC-012 text. Archive files remain historical evidence.

### 11.5 Version bumps

At this target commit, `packages/core/src/version.ts` contains:

```text
templates.version = 1.5.0
compiler.version  = 1.7.0
contract.version  = 1.8.0
app.version       = 0.0.0
```

The same implementation revision should bump:

```text
templates.version = 1.6.0
compiler.version  = 1.8.0
contract.version  = 1.9.0
app.version       = 0.0.0  // unchanged
```

If intervening work changes those values before implementation, apply the equivalent next minor increments from the then-current values and update every active pin/golden fixture in the same revision. Do not preserve aliases for the old contract.

### 11.6 No storage migration

No new project-store table, column, event, or schema version is warranted. The feature reads existing sources and returns ephemeral output. Introducing persistence would expand the constitutional surface and is explicitly rejected.

### 11.7 Same-change file set

At minimum, the implementation revision should touch:

```text
docs/principles/FOUNDATIONS.md
docs/ACTIVE-DOCS.md
docs/specs/compiler-contract.md
docs/specs/story-record-schema.md
docs/user-guide.md
docs/specs/segment-reconciliation-prompt-template.md
packages/core/src/version.ts
packages/core/src/compiler/template-constants.ts
packages/core/src/compiler/reconciliation/*
packages/core/src/index.ts
packages/server/src/record-repository.ts
packages/server/src/segment-reconciliation-snapshot-builder.ts
packages/server/src/segment-reconciliation-routes.ts
packages/server/src/segment-reconciliation-parse.ts
packages/server/src/server.ts
packages/web/src/api.ts
packages/web/src/shell/AppShell.tsx
packages/web/src/shell/DurableChangeReminder.tsx
packages/web/src/segment-reconciliation/*
core/server/web tests and golden fixtures listed in §12
```

The downstream spec may split implementation into tickets, but no ticket may ship the accepted-prose read without the amendment, source contract, output quarantine, and tests in place.

---

## 12. Test and regression plan

### 12.1 Core compiler golden tests

Add `packages/core/test/segment-reconciliation-golden.test.ts` with at least:

1. active-working-set default with all three proposal-relevant source classes;
2. whole-project scope with all eighteen registered types and terminal statuses;
3. empty selected record scope with nonempty segment/brief;
4. blank/missing values for all nineteen fields;
5. deterministic span splitting across LF/CRLF, long paragraphs, Unicode, and no-whitespace long runs;
6. reference stubs without out-of-scope payload leakage;
7. canonical JSON escaping of `<`, `>`, `&`, quotes, and prompt-injection-like accepted prose;
8. exact thirteen-section order;
9. exact source disclosure and exclusions;
10. no manual directive, stop guidance, voice controls, story config, private notes, candidates, older segments, or prompt history;
11. identical snapshot/request/versions produce byte-identical prompt and fingerprint;
12. any source/version change changes the fingerprint;
13. generated schema catalog includes every registry type and enum;
14. catalog schemas round-trip representative payloads through `parseRecordPayload`;
15. provider-output JSON Schema has `additionalProperties: false` throughout.

### 12.2 Core property and capstone tests

Add properties asserting:

- every qualifying record appears exactly once in the chosen scope;
- no nonqualifying archived record appears;
- no status value affects inclusion;
- type order follows registry order and label/id ties are deterministic;
- span keys cover all normalized non-whitespace accepted text exactly once without overlap;
- every allowed field appears once and every excluded field appears zero times;
- record-type and enum sets in the catalog equal the registry-derived sets;
- every legal lifecycle destination exists in the type schema and every forbidden destination is rejected;
- arbitrary accepted text cannot create a new prompt section/tag or alter instructions;
- no hidden random, wall-clock, model call, token budget, UI sort, or embedding influences compilation.

Add a cross-pillar capstone that fails if any prose, Ideate, or Hygiene prompt starts including accepted text while the Reconciliation prompt fails to include exactly one segment.

### 12.3 Output-parser tests

Add exhaustive valid/invalid fixtures for:

- pure JSON versus fences/preamble/trailing text;
- all three empty arrays;
- every brief path and operation/current-state combination;
- every field value type;
- unknown field paths and excluded fields;
- JSON Pointer escaping, optional removal, duplicate/overlapping/array-index patches;
- full-record key/id mismatch and REF-stub change target;
- UPDATE_FIELDS versus DEACTIVATE lifecycle rules;
- every legal and representative illegal lifecycle destination;
- every one of the eighteen creation types;
- every enum vocabulary, including near-miss spelling/case values;
- unknown keys, missing required keys, model-supplied ids;
- existing-record tokens, stub tokens, NEW tokens, list references, literal alternatives;
- missing dependencies, extra dependencies, self-reference, cycles, wrong target type, unknown target;
- deterministic temporary-id resolution and registry parse;
- duplicate proposal ids/targets and wrong id prefixes/order;
- unknown/missing provenance and contrast keys;
- stale fingerprint, segment sequence, or scope;
- verbatim substring/token echo at, below, and above thresholds;
- full-response quarantine when only one item is invalid.

Mutation coverage should target lifecycle dispatch, path allowlists, enum validation, citation resolution, dependency graph validation, and echo thresholds. Add a reconciliation mutation scope/config or explicitly register these files in the existing robustness gate.

### 12.4 Server route and repository tests

Add compile/analyze route tests for:

- no project, no accepted segment, malformed latest segment, malformed draft, malformed in-scope record;
- latest accepted segment query returns one row with text and never loads a range;
- active scope reads only selected ids plus declared stubs;
- whole-project scope reads all non-archived rows;
- archived rows excluded in both modes;
- incomplete brief is allowed;
- source changed after preview returns 409 before provider send;
- prompt too large fails rather than enabling context compression;
- no API key and provider/model failures preserve existing error discipline;
- structured-output model request includes strict schema and `require_parameters`;
- response healing, context compression, web/file plugins, and uninspected tools are disabled;
- server ignores/rejects client prompt/source payload injection;
- raw output and accepted text are not logged or persisted;
- valid/malformed response envelopes.

Add an e2e case in which a segment changes an object holder, resolves a clock, reveals a secret, and introduces a new obligation; assert typed suggestions only, then assert the project store remains byte-for-byte/row-for-row unchanged.

### 12.5 Web tests

Test:

- new project-gated primary route and nav label;
- latest segment metadata is read-only, no older/range selector;
- active-working-set default and explicit whole-project selection;
- complete source disclosure including accepted prose and secret-bearing records;
- prompt inspector before send;
- stale prompt invalidation;
- valid three-part card rendering and evidence navigation;
- only navigation/copy/keeper controls exist;
- absence of apply/prefill/create/deactivate/archive/merge/remove/working-set/prose controls;
- sessionStorage keeper scoping and Clear residue behavior;
- malformed raw-output quarantine;
- reminder CTA navigation without acknowledge/snooze side effects;
- no background compile/send after acceptance or route entry;
- accessibility of scope radios, banners, evidence chips, tabs/cards, and malformed state.

### 12.6 Stress-suite additions

Register cases in `docs/specs/stress-suite.md` and `docs/specs/stress-coverage-matrix.md` for:

- a long accepted segment containing prompt-injection instructions;
- a single segment near provider context limits;
- a whole project too large to send without omission;
- no selected records;
- incomplete CURRENT AUTHORITATIVE STATE and blank handoff;
- secret reveal with writer-only truth in records;
- object transfer and possession/current-location changes;
- character entrance/exit plus line-of-sight change;
- death/injury/consent-or-force state;
- PLAN revision, CLOCK resolution, OBLIGATION transfer, CONSEQUENCE escalation;
- RELATIONSHIP and EMOTION changes that must remain distinct;
- existing resolved record that should be updated rather than duplicated;
- new ENTITY + CAST MEMBER dependency;
- new EVENT referencing an existing stub outside active scope;
- response with one invented enum among otherwise valid proposals;
- response that quotes accepted handoff prose;
- new acceptance occurring after prompt inspection.

Stress documents describe coverage; they do not become behavior authorities.

---

## 13. Implementation sequence

A downstream spec should sequence the work as follows:

1. Obtain explicit owner sign-off on the §10 amendment wording and the §7.4 lifecycle destination table.
2. Land the amendment, new active domain authority, compiler-contract/schema registry text, ACTIVE-DOCS registration, and version pins in the same revision as the minimum behavior they authorize.
3. Implement core source/request/snapshot types, span/citation generation, schema catalog, compiler, fingerprint, output schema, parser, reference resolution, and echo guard with tests.
4. Implement the one-row latest-segment repository method and server snapshot builder.
5. Implement compile/analyze routes and provider-parameter restrictions with route/e2e tests.
6. Implement web route, inspector, disclosure, quarantine cards, keepers, and malformed state.
7. Add reminder CTA without changing acknowledgement semantics.
8. Add golden, property, mutation, cross-pillar, UI, stress-suite, and documentation coverage.
9. Run all workspace tests, type checks, lint, build, CodeQL-relevant checks, and the existing robustness gate.
10. Audit the final diff against amended FOUNDATIONS §29 before merging.

The amendment and accepted-prose read must not be split into an “enable first, harden later” sequence.

---

## 14. Risks and mitigations

| Risk | Failure mode | Required mitigation |
|---|---|---|
| State laundering | AI suggestion quietly becomes canonical truth | No apply/prefill; canonical editor re-authorship; quarantine labels; project-store invariance tests |
| Prose-as-canon drift | Accepted wording is treated as future authority | One assistance-only exception; no prose-prompt path; no automatic summary; explicit constitutional wording |
| Verbatim echo | Handoff or record text copies accepted prose | No quote fields; span-key provenance; paraphrase instruction; deterministic substring/token guard; full-response quarantine |
| Archive dumping | More context is added “for completeness” | Latest-only request type and one-row query; no range UI/API; hard-fail checklist |
| Prompt injection in story text | Segment text attempts to change the task/output | Escaped data containers; repeated untrusted-data instruction; strict schema/parser; no mutation |
| Hidden source loss | Provider compresses or compiler evicts records | Disable compression; render complete scope; oversize failure; provider metadata/test assertions |
| Schema drift | Prompt enum/type list becomes stale | Generate from registry/Zod; catalog/registry capstone; same-change version/docs rule |
| Syntactically valid but wrong extraction | Model chooses wrong fact/type/value | Current-state contrast, provenance, confidence as non-authoritative, human review, no auto-write |
| Duplicate creation | New record restates an existing or inactive record | All-status scopes; compare-before-create procedure; whole-project option; `[RECORD-SCOPE]`/record contrast keys |
| Invalid references | Model invents ids or links wrong types | Source-key/new-proposal tokens; no raw UUIDs; synthetic project validation; DAG checks |
| Stale review | Records/brief/latest segment change after inspection | Server rebuild + prompt fingerprint 409 |
| Secret exposure surprise | Whole project contains hidden truths | Explicit source counts/disclosure and opt-in send; default focused scope; notes excluded |
| UI authority blur | Cards look like editable records | Persistent suggestion badges; no canonical styling or write controls; navigation/copy only |
| Reminder false completion | Opening tool is mistaken for updating canon | CTA does not acknowledge; guide and UI say manual completion required |
| Excessive false-positive echo rejection | Common phrasing blocks a useful response | Exempt only short atomic names/enums/ids; show reason; user may rerun or manually author; thresholds are tested/versioned |
| Provider schema incompatibility | Chosen model rejects strict JSON Schema | Surface support/error clearly; optional plain pure-JSON mode with same parser; never weaken local validation |

---

## 15. Rejected alternatives

### 15.1 Automatic record/brief writes

Rejected. Even per-item “Apply” would make the assistance surface a mutation staging area and invite rubber-stamping. Navigation plus copy is slower by a click and much safer constitutionally.

### 15.2 Running automatically on segment acceptance

Rejected. It would be push-based, send accepted prose without a fresh disclosure, create background cost/privacy behavior, and blur acceptance with canon extraction.

### 15.3 Multiple recent segments or archive retrieval

Rejected. It violates the locked single-segment source, increases phrase/state laundering risk, and reintroduces hidden relevance selection and lost-in-the-middle problems.

### 15.4 Older-segment picker in v1

Rejected. “Latest only” is the settled scope. An older picker also raises the question of which later canonical changes should be considered, turning a local reconciliation tool into historical repair.

### 15.5 Whole project as the only/default scope

Rejected. It exposes more secrets and creates larger prompts than the common manual baseline needs. It remains available explicitly because a last-segment change may affect an unselected record.

### 15.6 Hygiene's active predicate

Rejected. Terminal lifecycle records are evidence against duplicate creation and may be the direct targets of the latest segment.

### 15.7 Type filters, semantic retrieval, saliency, or reference closure

Rejected. They create hidden or user-complex source predicates, can omit the affected record, and conflict with the explicit complete-scope doctrine.

### 15.8 Reusing the Hygiene surface/compiler

Rejected. Hygiene's constitutional source excludes the exact material Reconciliation needs and its 16-type atomic overlap purpose omits ENTITY/CAST MEMBER payloads and generation fields.

### 15.9 Reusing prose readiness input

Rejected. Reconciliation must operate precisely when fields are missing or stale. Readiness normalization could invent defaults or block the diagnostic purpose.

### 15.10 Flat tagged text output

Rejected. Nested payloads, arrays, per-type enum vocabularies, JSON pointers, and proposal dependencies need a real structural grammar. Strict JSON is more inspectable and easier to validate.

### 15.11 Provider-native schema as the sole validator

Rejected. Model/provider support varies; syntactic adherence does not prove current-source consistency, valid references, lifecycle meaning, provenance, or non-verbatim output.

### 15.12 Response Healing or LLM repair

Rejected. Hidden repair changes what the model returned, can manufacture structure or values the user did not inspect, and makes malformed-output behavior nondeterministic across providers.

### 15.13 Partial salvage of a malformed response

Rejected. Cross-item dependencies and one invalid enum/reference can change the meaning of the proposal set. Whole-response quarantine is simpler and safer.

### 15.14 Raw UUIDs in model output

Rejected. The model can mistype or invent ids. Citation/reference tokens bind output to inspected source and permit deterministic validation.

### 15.15 Forbidding new-to-new references

Rejected. Many valid creation bundles require an ENTITY/CAST MEMBER or another newly proposed target. Temporary local handles plus a DAG solve this without creating records automatically.

### 15.16 Hand-maintained enum catalog

Rejected. Eighteen heterogeneous payload schemas already exist in code. A copied prompt vocabulary would drift and reproduce the brief's record-count mismatch.

### 15.17 Accepted-prose quotations as provenance

Rejected. Quotes increase echo risk and can be copied into canonical fields. Span keys provide better provenance while keeping source text in its existing archive surface.

### 15.18 Automatic reminder acknowledgement

Rejected. The tool cannot know whether the user accepted, rejected, or manually transcribed every needed change.

---

## 16. Downstream acceptance criteria

The eventual specification should be considered implementable only when it states testable acceptance criteria proving all of the following:

1. owner-approved FOUNDATIONS amendment wording lands with the feature;
2. exactly one latest accepted segment enters only the reconciliation assistance prompt;
3. every prose prompt and every other assistance prompt remains accepted-prose-free;
4. only the nineteen allowed brief paths are source/targets;
5. active-working-set scope is default and whole-project scope is explicit;
6. every non-archived record in the chosen scope renders, all statuses included;
7. all registered type/field/enum schemas come from the registry and catalog tests prove agreement;
8. every proposal has valid segment-span and contrast provenance;
9. brief proposals pass path-specific draft validation;
10. record patches and deactivations pass schema/reference/lifecycle validation;
11. creation proposals use valid types/enums, no model ids, valid dependency/reference tokens, and full registry parsing;
12. material verbatim accepted-prose echo quarantines the response;
13. any malformed item quarantines the complete response with no repair;
14. no UI/API action writes, prefills, stages, archives, deactivates, creates, or changes working-set membership;
15. source fingerprint drift prevents send/result acceptance;
16. provider compression/healing/plugins are disabled for this operation;
17. Clear and keeper behavior leaves no project-store/log residue;
18. reminder CTA preserves acknowledgement and snooze behavior;
19. no new readiness blocker or storage migration exists;
20. docs, versions, golden tests, stress coverage, and ACTIVE-DOCS registration move together.

---

## 17. Handoff summary

The coding agent should turn this proposal into one new specification, not a loose collection of UI tickets. The load-bearing implementation decisions are:

- new constitutional profile `segment-reconciliation`;
- exact latest segment only;
- saved-draft nineteen-field projection;
- active-working-set default / whole-project explicit record scope;
- every non-archived type/status in scope, no retrieval or eviction;
- registry-derived schema catalog for eighteen current types;
- pure-JSON three-part contract;
- span-key provenance and strict local validation;
- explicit legal deactivation table;
- reference tokens and acyclic creation bundles;
- full-response malformed/verbatim quarantine;
- navigation/copy only, no application or prefill;
- reminder CTA without acknowledgement;
- amendment/docs/version/tests in one revision.

The owner sign-off questions are intentionally narrow:

1. approve or revise the exact FOUNDATIONS wording in §10;
2. approve or revise the lifecycle destinations in §7.4;
3. confirm **Segment Reconciliation** as the final visible name (Assumption A1);
4. confirm the recommended exclusion boundary for voice controls, working-set curation, validation focus, generated context, and story configuration (Assumption A2).

No other design question is left open by this proposal.

---

## 18. Repository evidence register

All repository URLs below identify the exact target owner, repository, commit, and path.

- **[R1]** `docs/ACTIVE-DOCS.md` — <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/docs/ACTIVE-DOCS.md>
- **[R2]** `docs/principles/FOUNDATIONS.md` — <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/docs/principles/FOUNDATIONS.md>
- **[R3]** `docs/specs/compiler-contract.md` — <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/docs/specs/compiler-contract.md>
- **[R4]** `docs/specs/ideation-prompt-template.md` — <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/docs/specs/ideation-prompt-template.md>
- **[R5]** `docs/specs/story-record-hygiene-prompt-template.md` — <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/docs/specs/story-record-hygiene-prompt-template.md>
- **[R6]** `docs/specs/story-record-schema.md` — <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/docs/specs/story-record-schema.md>
- **[R7]** `docs/specs/validation-rule-inventory.md` — <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/docs/specs/validation-rule-inventory.md>
- **[R8]** `docs/user-guide.md` — <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/docs/user-guide.md>
- **[R9]** `archive/specs/SPEC-012-durable-change-reminder-workflow.md` — <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/archive/specs/SPEC-012-durable-change-reminder-workflow.md>
- **[R10]** `archive/specs/SPEC-020-accepted-segment-browser-latest-access-and-disclosure.md` — <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/archive/specs/SPEC-020-accepted-segment-browser-latest-access-and-disclosure.md>
- **[R11]** `archive/specs/SPEC-021-grounded-ideation-prompt.md` — <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/archive/specs/SPEC-021-grounded-ideation-prompt.md>
- **[R12]** `archive/specs/SPEC-022-ideation-native-prompt-template.md` — <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/archive/specs/SPEC-022-ideation-native-prompt-template.md>
- **[R13]** `archive/specs/SPEC-027-record-hygiene-assistance-prompt.md` — <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/archive/specs/SPEC-027-record-hygiene-assistance-prompt.md>
- **[R14]** `archive/specs/SPEC-030-record-hygiene-working-set-scope.md` — <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/archive/specs/SPEC-030-record-hygiene-working-set-scope.md>
- **[R15]** `packages/core/src/version.ts` and template constants — <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/version.ts>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/compiler/template-constants.ts>
- **[R16]** record registry and type definitions — <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/records/registry.ts>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/records/entity.ts>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/records/cast-member.ts>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/records/knowledge.ts>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/records/space-material.ts>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/records/causal-pressure.ts>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/records/relationship-emotion.ts>
- **[R17]** generation-brief schemas/descriptors — <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/records/generation-brief.ts>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/records/generation-brief-draft.ts>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/records/generation-brief-readiness.ts>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/records/generation-brief-descriptors.ts>
- **[R18]** Hygiene compiler/parser seams — <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/compiler/hygiene/compile-record-hygiene-prompt.ts>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/compiler/hygiene/types.ts>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/src/record-hygiene-parse.ts>
- **[R19]** Ideation compiler/type seams — <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/compiler/ideation/types.ts>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/compiler/ideation/citation-keys.ts>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/src/ideation-parse.ts>
- **[R20]** server compile/analyze/snapshot routes — <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/src/ideate-routes.ts>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/src/record-hygiene-routes.ts>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/src/record-hygiene-snapshot-builder.ts>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/src/snapshot-builder.ts>
- **[R21]** accepted-segment/repository storage seams — <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/src/accepted-routes.ts>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/src/reminder-routes.ts>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/src/record-repository.ts>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/src/record-tables.ts>
- **[R22]** web sibling/reminder/shell/API seams — <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/web/src/ideate/IdeateView.tsx>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/web/src/record-hygiene/RecordHygieneView.tsx>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/web/src/shell/DurableChangeReminder.tsx>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/web/src/shell/AppShell.tsx>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/web/src/api.ts>
- **[R23]** package/toolchain declarations — <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/package.json>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/package.json>, <https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/package.json>

## 19. External research register

- **[E1]** OpenAI, “Structured model outputs” — <https://developers.openai.com/api/docs/guides/structured-outputs>
- **[E2]** Geng et al., “Generating Structured Outputs from Language Models: Benchmark and Studies” / JSONSchemaBench — <https://arxiv.org/abs/2501.10868>
- **[E3]** JSON Schema, “Enumerated values” — <https://json-schema.org/understanding-json-schema/reference/enum>
- **[E4]** Zod 4, “JSON Schema” — <https://zod.dev/json-schema>
- **[E5]** OpenRouter, “Structured Outputs” — <https://openrouter.ai/docs/guides/features/structured-outputs>
- **[E6]** OpenRouter, “Response Healing,” “Plugins,” and “Message Transforms” — <https://openrouter.ai/docs/guides/features/plugins/response-healing>, <https://openrouter.ai/docs/guides/features/plugins>, <https://openrouter.ai/docs/guides/features/message-transforms>
- **[E7]** Schroeder, Jaldi, and Zhang, “Large Language Models with Human-In-The-Loop Validation for Systematic Review Data Extraction” — <https://arxiv.org/abs/2501.11840>
- **[E8]** Park et al., “Generative Agents: Interactive Simulacra of Human Behavior” — <https://arxiv.org/abs/2304.03442>
- **[E9]** Packer et al., “MemGPT: Towards LLMs as Operating Systems” — <https://arxiv.org/abs/2310.08560>
- **[E10]** Chhikara et al., “Mem0: Building Production-Ready AI Agents with Scalable Long-Term Memory” — <https://arxiv.org/abs/2504.19413>
- **[E11]** Liu et al., “Lost in the Middle: How Language Models Use Long Contexts” — <https://arxiv.org/abs/2307.03172>
- **[E12]** Novelcrafter Codex documentation — <https://www.novelcrafter.com/features/codex>, <https://www.novelcrafter.com/help/docs/codex/the-codex>, <https://www.novelcrafter.com/help/docs/codex/codex-relations>
- **[E13]** Sudowrite Story Bible, Worldbuilding, Smart Import, and Saliency documentation — <https://docs.sudowrite.com/using-sudowrite/1ow1qkGqof9rtcyGnrWUBS/what-is-story-bible/jmWepHcQdJetNrE991fjJC>, <https://docs.sudowrite.com/using-sudowrite/1ow1qkGqof9rtcyGnrWUBS/worldbuilding/uc5NfWSz4x8Wm3S19LZeo8>, <https://docs.sudowrite.com/using-sudowrite/1ow1qkGqof9rtcyGnrWUBS/importing-files/rbGUgrZM6tNuXFG1hjDFyS>, <https://docs.sudowrite.com/using-sudowrite/1ow1qkGqof9rtcyGnrWUBS/saliency-engine/4KL8gFeLZNvk8CEeXpfwB2>
- **[E14]** SillyTavern, “World Info” — <https://docs.sillytavern.app/usage/core-concepts/worldinfo/>
- **[E15]** NovelAI, “Lorebook” and context-viewer documentation — <https://docs.novelai.net/en/text/lorebook/>, <https://docs.novelai.net/en/text/editor/advancedsettings/>

---

## Appendix A — Final exact-commit acquisition ledger

```text
Requested repository: joeloverbeck/continuity-loom
Target commit: 5375d9c4aa87333656be15bc7c434338bb9094fb
Freshness claim: user-supplied target commit only; not independently verified as latest main
Manifest role: path inventory only
Repository metadata used: no
Default-branch lookup used: no
Branch-name file fetch used: no
Target-repository code search used: no
Clone used: no
URL fetch method: web.run open(full exact raw URL)
Additional transport corroboration: HTTP 200 text downloads for the 24 full-read Markdown documents
Requested file count: 77
Successfully verified file count: 77
Fetched repository files:
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/docs/ACTIVE-DOCS.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/docs/principles/FOUNDATIONS.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/docs/specs/compiler-contract.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/docs/specs/ideation-prompt-template.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/docs/specs/story-record-hygiene-prompt-template.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/docs/specs/story-record-schema.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/docs/specs/validation-rule-inventory.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/docs/user-guide.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/archive/specs/SPEC-012-durable-change-reminder-workflow.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/archive/specs/SPEC-020-accepted-segment-browser-latest-access-and-disclosure.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/archive/specs/SPEC-021-grounded-ideation-prompt.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/archive/specs/SPEC-022-ideation-native-prompt-template.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/archive/specs/SPEC-027-record-hygiene-assistance-prompt.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/archive/specs/SPEC-030-record-hygiene-working-set-scope.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/reports/ideation-operator-taxonomy-change-proposal.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/reports/ideation-operator-taxonomy-research-brief.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/reports/private-notes-usability-change-proposal.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/docs/specs/prompt-template.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/docs/prompt-template-rationale.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/docs/specs/stress-suite.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/docs/specs/stress-coverage-matrix.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/docs/archival-workflow.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/tickets/README.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/tickets/_TEMPLATE.md
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/compiler/ideation/citation-keys.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/compiler/ideation/operators.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/compiler/ideation/slot-assignment.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/compiler/ideation/types.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/compiler/hygiene/active-predicate.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/compiler/hygiene/citation-keys.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/compiler/hygiene/compile-record-hygiene-prompt.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/compiler/hygiene/record-renderer.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/compiler/hygiene/template.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/compiler/hygiene/types.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/records/registry.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/records/generation-brief.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/records/generation-brief-draft.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/records/generation-brief-readiness.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/version.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/compiler/template-constants.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/src/ideate-routes.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/src/record-hygiene-routes.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/src/record-hygiene-snapshot-builder.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/src/snapshot-builder.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/src/accepted-routes.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/src/generation-brief-routes.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/src/reminder-routes.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/web/src/ideate/IdeateView.tsx
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/web/src/record-hygiene/RecordHygieneView.tsx
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/web/src/accepted-segments/AcceptedSegmentsView.tsx
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/web/src/generation-brief/GenerationBriefView.tsx
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/web/src/shell/DurableChangeReminder.tsx
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/web/src/shell/AppShell.tsx
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/web/src/api.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/test/compiler-ideation-golden.test.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/test/record-hygiene-golden.test.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/src/ideate-routes.test.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/src/ideate.e2e.test.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/src/record-hygiene-routes.test.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/src/record-hygiene.e2e.test.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/records/entity.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/records/cast-member.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/records/knowledge.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/records/space-material.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/records/causal-pressure.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/records/relationship-emotion.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/src/record-hygiene-parse.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/src/ideation-parse.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/src/record-repository.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/src/record-tables.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/records/generation-brief-descriptors.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/package.json
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/package.json
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/server/package.json
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/records/common.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/validation/reference-classification.ts
- https://raw.githubusercontent.com/joeloverbeck/continuity-loom/5375d9c4aa87333656be15bc7c434338bb9094fb/packages/core/src/records/references.ts
Fetch-provenance contamination observed: no
Foreign-repository references inside fetched file contents: permitted; not a provenance check
Connector/tool namespace trusted as evidence: no
External research lane: separate from repository evidence
Resolved-source result: every exposed source remained the same exact raw.githubusercontent.com owner/repository/commit/path; no branch page, search result, snippet, metadata substitute, or unrelated content was returned.
Substantive analysis began only after the initial 60-file acquisition ledger was reported. Seventeen additional manifest-listed exact-commit files were appended during analysis; all were verified before use.
```

The same ledger is also available as `segment-reconciliation-acquisition-ledger.txt` for machine-friendly review.

## Appendix B — Self-check

- [x] Every file mandated for full reading or boundary awareness was fetched from the user-supplied target commit; code seams were inspected through exact manifest-listed URLs.
- [x] The artifact is one change proposal and does not assign a SPEC number.
- [x] Exact proposed FOUNDATIONS wording is present and explicitly awaits owner sign-off.
- [x] The amendment covers §8, §9.1, §10, §21, §28.1–§28.2, and the touched §29 hard-fail subsections.
- [x] The compiler-contract, story-schema, ACTIVE-DOCS, version, golden, parser, route, UI, mutation, and stress cascade is enumerated.
- [x] Exactly the latest single accepted segment is read; no range/archive/older-segment mode is proposed.
- [x] The nineteen in-scope brief paths and all fixed/assumption-labeled exclusions are explicit.
- [x] The record-scope recommendation is committed: active working set default, whole project explicit, all statuses, no retrieval/eviction.
- [x] The exact commit's eighteen registered record types are acknowledged and the runtime catalog is registry-derived.
- [x] Every proposal kind requires accepted-segment span provenance and current contrast provenance.
- [x] Creation proposals require valid type, real enum values, registry parsing, reference validation, and advisory-only handling.
- [x] Malformed output is quarantined in full; no hidden repair or partial salvage exists.
- [x] No automatic mutation, prefill, storage, prompt reuse, or working-set change is proposed.
- [x] Reminder CTA upgrades rather than replaces acknowledgement/snooze.
- [x] External decisions are cited from primary papers and official documentation.
- [x] Assumptions A1 and A2 are surfaced for owner override rather than silently embedded.
