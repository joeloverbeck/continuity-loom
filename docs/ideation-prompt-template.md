# Grounded Ideation Prompt Template

Status: active reference - grounded ideation prompt template text, request shape, slot rules, and output contract
Authority: domain authority for ideation prompt template (see docs/ACTIVE-DOCS.md)

---

Output expected from external LLM: premise-level ideas or author-facing questions, never prose.
Style: portable Markdown/XML hybrid.

The ideation prompt is the sanctioned assistance prompt class from `docs/FOUNDATIONS.md` Section 9.1. It is deterministic, inspectable before send, and compiled from the same authority sources as the prose prompt: story configuration, the active working set, and generation-time fields. Its output is quarantined scratch. It is not a story record, not a generation-time brief field, not accepted prose, and not context for prose generation.

## Request Shape

The ideation request is deterministic compiler input:

- `mode`: `ideas` or `questions`; default `ideas`.
- `count`: integer from 3 through 6; default `5`.
- `dormantSlot`: boolean; default `true`.
- `avoidList`: explicit list of current slate headlines/questions to avoid on a follow-up request; default empty.

Changing any request field changes the compiled ideation prompt and its fingerprint. The compiler must not read wall-clock time, accepted prose, rejected candidates, superseded candidates, or hidden UI state to assign ideation slots.

## Section Order

The compiler renders ideation sections in this order:

1. `<ideation_role>`
2. `<authority_hierarchy>`
3. `<content_policy>`
4. `<story_contract>`
5. `<hard_canon>` when at least one hard-canon FACT is selected
6. `<current_authoritative_state>`
7. `<immediate_handoff>`
8. `<manual_directive>` when at least one manual directive field is supplied
9. `<pov_knowledge_constraints>`
10. `<audience_knowledge>`
11. `<secrets_and_reveal_constraints>`
12. `<active_plans_and_intentions>`
13. `<active_clocks>`
14. `<active_obligations_and_consequences>`
15. `<active_open_threads>`
16. `<relationship_and_emotion_pressure>`
17. `<active_cast_full_dossiers>`
18. `<present_minor_cast>` when at least one present-minor cast record is selected
19. `<offstage_relevance>` when at least one offstage cast record is selected or offstage pressure/interruption is active
20. `<relevant_facts_beliefs_events>`
21. `<locations_objects_affordances>`
22. `<physical_continuity>`
23. `<contradiction_prohibitions>` from the ideation-specific continuity-only template
24. `<ideation_slots>`
25. `<ideation_quality>`
26. `<ideation_output_format>`

Ideation prompts do not render prose-only sections: `<role>`, `<prose_mode>`, `<active_working_set>`, `<invention_permissions>`, `<prose_craft>`, `<stop_rule>`, or `<final_output_instruction>`.

## Ideation Sections

### `<ideation_role>`

Frames the model as a story-development consultant for a continuity-first fiction system. It asks for premise-level ideas or questions and forbids prose, dialogue, scene text, beat sheets, outlines, branches, chapter plans, future summaries, new named entities, new facts, new locations, new objects, new secrets, and new backstory beyond compiled records. It labels the output as AI-suggested scratch, not story state, not a generation-time field, and not prompt context for prose generation.

### `<relationship_and_emotion_pressure>`

Renders RELATIONSHIP and EMOTION records from the deterministic `relationship_emotion_pressure` placeholder. This is the ideation-native replacement for the relationship/emotion lane that prose renders inside `<active_working_set>`; it keeps those selected records visible without carrying the full prose pressure precis.

### Ideation `<locations_objects_affordances>` and `<physical_continuity>`

The ideation prompt renders every selected LOCATION and OBJECT record in `<locations_objects_affordances>` regardless of status, with status shown as a label. This prevents dormant, inactive, transferred, destroyed, or otherwise non-active records from becoming invisible when they can still ground an ideation operator.

The ideation `<physical_continuity>` body is slim: current-state physical lines plus status-only ENTITY STATUS, LOCATION, OBJECT, and VISIBLE AFFORDANCE lines. It does not repeat LOCATION or OBJECT descriptions already rendered in `<locations_objects_affordances>`. The prose prompt keeps the fuller physical-continuity body and the active/available status gate for location/object detail blocks.

### `<ideation_slots>`

Renders the request mode and the deterministic slot assignment. Each slot includes:

- slot number;
- operator name;
- operator id;
- operator definition;
- citation keys for the selected records eligible to ground that slot.

If fewer operators are eligible than requested, the slate shrinks rather than padding with unsupported ideas.

### `<ideation_quality>`

Defines the quality bar:

- ideas should be relevant, unexpected within storyworld expectations, persistent, hard to reverse, and non-repetitive;
- ideas should move the story far without contradicting compiled records, current authoritative state, physical constraints, POV knowledge, or reveal locks;
- reveal ideas must obey compiled reveal constraints;
- without reveal permission, propose surface cues, pressure, partial exposure, or suspicion rather than narrator-certified exposure;
- unsupported slots output `SKIPPED` rather than inventing support;
- prefer causal pressure, try-fail friction, reincorporation, consequence, and dilemma over spectacle.

### Ideation `<contradiction_prohibitions>`

The ideation prompt renders the same `<contradiction_prohibitions>` tag as the prose prompt at section position 23, but from an ideation-specific template. It keeps continuity, canon, physical-continuity, POV-knowledge, reveal-lock, future-consequence, and no-global-structure prohibitions. It omits prose-craft-only prohibitions such as generic speech, catchphrase reuse, exposition-dialogue, and abstract diagnosis because the ideator must not write prose.

### `<ideation_output_format>`

Defines a flat tagged block. Malformed output is discarded.

For idea mode:

```md
IDEA <slot-number>
operator: <operator name>
headline: <one sentence, premise level, about 25 words or fewer>
why: <one sentence paraphrasing why the cited records support the idea>
grounds: <comma-separated citation keys from that slot>
```

For question mode, replace `headline` with `question` and phrase it as an author-facing story question.

For unsupported slots:

```md
IDEA <slot-number>
operator: <operator name>
SKIPPED: no compiled record supports this slot.
```

## Operator Taxonomy

Operators are evaluated in fixed order:

1. Reveal - feeds from `SECRET`; brings a selected secret closer to the surface while respecting reveal permission and POV knowledge constraints.
2. Falsify a Belief - feeds from `BELIEF` plus `FACT` or `EVENT`; makes a selected belief collide with evidence that exposes its limits.
3. Clock Advances - feeds from `CLOCK`; advances a selected clock without inventing unsupported facts.
4. Plan Meets Friction - feeds from `PLAN` or `INTENTION`; turns a plan or intention into a yes-but or no-and complication.
5. Debt Comes Due - feeds from `OBLIGATION` or `CONSEQUENCE`; makes an obligation or consequence demand action now.
6. Relationship Reversal - feeds from `RELATIONSHIP`; inverts, stresses, or reframes relationship pressure in the current moment.
7. Close the Escape Route - feeds from `VISIBLE AFFORDANCE`, `OBJECT`, or `LOCATION`; removes an easy path forward.
8. Collide Two Threads - feeds from at least two records among `OPEN THREAD`, `PLAN`, `SECRET`, or `EVENT`; makes selected pressures interfere rather than resolve cleanly.
9. Reincorporate the Dormant - feeds from selected pressure/material records; brings back the least-recently-updated eligible selected record as fresh causal pressure.

## Slot Assignment

The compiler assigns slots deterministically from selected records only:

- An operator is eligible only when the active working set contains the required feeding records.
- Operators fill in taxonomy order until `count` is reached.
- `Falsify a Belief` requires at least one `BELIEF` and at least one `FACT` or `EVENT`.
- `Collide Two Threads` requires at least two feeding records.
- When `dormantSlot` is true, the final slot is reserved for `Reincorporate the Dormant` when an eligible dormant record exists.
- Dormancy uses stored record `updatedAt` values; lexical ISO timestamp order is chronological, with record id as the tie-breaker.
- No wall-clock reads are allowed during compilation.

## Citation Keys

Every selected record used for ideation receives a deterministic bracketed citation key derived from record type plus the record's full display label or id, not the truncated browse label, with deterministic suffixes for collisions. The server verifies returned citation keys against the compiled selected-record key set. Unknown citations are flagged on the idea; malformed blocks are rendered only as raw quarantined scratch.

## UI Handling

The Ideate view must keep assistance output quarantined:

- pull-based only; the user intentionally sends each request;
- prompt inspection before send;
- no automatic record writes;
- no insertion into the Generation Brief;
- no use-as-prose-prompt action;
- keepers are session-scoped scratch, not project data;
- clearing output or keepers leaves no project-store residue.
