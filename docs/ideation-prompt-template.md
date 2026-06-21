# Grounded Ideation Prompt Template

Status: active reference - grounded ideation prompt template text, request shape, slot rules, and output contract
Authority: domain authority for ideation prompt template (see docs/ACTIVE-DOCS.md)

---

Output expected from external LLM: premise-level ideas or author-facing questions, never prose.
Style: portable Markdown/XML hybrid.

The ideation prompt is the `prose-aligned` assistance source profile sanctioned by `docs/FOUNDATIONS.md` Section 9.1. It is deterministic, inspectable before send, and compiled from the prose-aligned source set: story configuration, selected active-working-set records, and generation-time fields. Its output is quarantined scratch. It is not a story record, not a generation-time brief field, not accepted prose, and not context for prose generation.

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

`<present_minor_cast>` keeps durable compressed cast notes and temporary overrides, but it does not render current voice-delivery pressure from `current_cast_voice_pressure`; that pressure is prose-only. Temporary overrides are structurally current-generation-only and render without a per-item scope clause.

## Ideation Sections

### `<ideation_role>`

Frames the model as a story-development consultant for a continuity-first fiction system. It asks for premise-level ideas or questions and forbids prose, dialogue, scene text, beat sheets, outlines, branches, chapter plans, future summaries, new named entities, new facts, new locations, new objects, new secrets, and new backstory beyond compiled records. It labels the output as AI-suggested scratch, not story state, not a generation-time field, and not prompt context for prose generation.

### Ideation-framed shared sections

The ideation prompt uses prompt-kind-specific variants for shared contract sections that would otherwise imply prose output:

- `<authority_hierarchy>` says the output contract is premise-level ideas or questions only, no prose, no record updates. It frames the manual directive as authored compatibility context, omits voice-pin/prose-craft prose-rendering references, and tells the model not to mention the hierarchy in the output.
- `<content_policy>` resolves the same policy placeholders as the prose prompt, but its trailer says not to inject assistant disclaimers, warnings, analysis, or conventional safety moralizing into the output.
- `<immediate_handoff>` labels `begin_after` as "The next prose segment will begin after this point" and uses a trailer that treats the handoff as user-authored continuity context for ideas rather than a prose launch command.
- `<manual_directive>` labels `must_render` as "The author's directive for the next segment (binding context: ideas must be compatible with it)".

### `<relationship_and_emotion_pressure>`

Renders RELATIONSHIP and EMOTION records from the deterministic `relationship_emotion_pressure` placeholder. This is the ideation-native replacement for the relationship/emotion lane that prose renders inside `<active_working_set>`; it keeps those selected records visible without carrying the full prose pressure precis.

### Ideation `<locations_objects_affordances>` and `<physical_continuity>`

The ideation prompt renders every selected LOCATION and OBJECT record in `<locations_objects_affordances>` regardless of status, with status shown as a label. LOCATION records include hazards/shelters and social rules. This prevents dormant, inactive, transferred, destroyed, or otherwise non-active records from becoming invisible when they can still ground an ideation operator.

The ideation `<physical_continuity>` body is slim: current-state physical lines plus status-only ENTITY STATUS, LOCATION, OBJECT, and VISIBLE AFFORDANCE lines. It does not repeat LOCATION or OBJECT descriptions already rendered in `<locations_objects_affordances>`, and it does not render prose-only entity material pressure. The prose prompt keeps the fuller physical-continuity body and the active/available status gate for location/object detail blocks.

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
- prefer causal pressure, try-fail friction, dormant-pressure return, consequence, and costly commitment over spectacle;
- ideas must be mutually distinct: each idea must execute its assigned operator and produce one dominant local state transition. No two ideas may use the same operator or end in the same dominant change target: information access, attempt state, observable tactic or control shift, immediate feasible-action set, operative interpretation, temporal pressure, duty or effect activation, relational pressure, or commitment under cost. Different wording, actors, or citation keys do not by themselves make ideas distinct. Prefer different grounds where deterministic assignment permits; when a ground must recur, the assigned move and changed state must still differ. Who acts and which pressure fires are secondary preferences, not the primary distinctness test.

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

1. Reveal - feeds from one operator-active `SECRET`; changes information access through an authored legal cue or reveal permission.
2. Plan Meets Friction - feeds from one operator-active `PLAN` or `INTENTION`; changes attempt state through resistance, cost, or interruption.
3. Emotion Becomes Action - feeds from one operator-active `EMOTION`; changes observable tactic or control state.
4. Shift the Option Set - feeds from one `VISIBLE AFFORDANCE`, `OBJECT`, `LOCATION`, or `ENTITY STATUS`; changes the immediate feasible-action set.
5. Falsify a Belief - feeds from one active `BELIEF` plus one `FACT` or operator-active `EVENT`; changes operative interpretation.
6. Clock Advances - feeds from one operator-active `CLOCK`; changes temporal pressure.
7. Debt Comes Due - feeds from one operator-active `OBLIGATION` or `CONSEQUENCE`; changes duty or effect pressure.
8. Relationship Turns - feeds from one operator-active `RELATIONSHIP`; changes relational pressure.
9. Commit at a Cost - feeds from exactly two operator-active records from different pressure families; changes commitment under cost and must not render an A/B menu, branch list, or alternate future set.

## Slot Assignment

The compiler assigns slots deterministically from selected records only:

- An operator is eligible only when the active working set contains the required operator-active records. Resolved, fulfilled, settled, closed, answered, superseded, abandoned, irrelevant, paused, or revised records may still render at their authoritative sites, but they do not ground slots unless this contract explicitly marks them active.
- Operator-active states are: `SECRET` hidden or partially revealed, with Reveal additionally requiring an authored surface cue, an available clue carrier, `clue_only`, or `natural_reveal_allowed`; `BELIEF` active; `FACT` always; `EVENT` not abandoned and `current_relevance` not `none`; `PLAN.plan_status` active, blocked, or suspended; `INTENTION` active or blocked; `CLOCK` active; `OBLIGATION` open, escalated, or transferred; `CONSEQUENCE` pending, active, or escalated; `OPEN THREAD` active or escalated; `RELATIONSHIP` active; `EMOTION` active, suppressed, transformed, or dissociated; material/status records (`VISIBLE AFFORDANCE`, `OBJECT`, `LOCATION`, `ENTITY STATUS`) current by record purpose.
- Operators fill in taxonomy order until `count` is reached, reserving the final slot first when `dormantSlot` is true.
- Each slot receives the minimum deterministic grounding bundle: one record for single-source operators, one `BELIEF` plus one `FACT`/`EVENT` for `Falsify a Belief`, and exactly two different pressure families for `Commit at a Cost`.
- Bundle choice prefers all-unused grounds, then fewer reused grounds, then deterministic citation-key order. Reuse is allowed only when no all-unused valid bundle exists; every selected record still renders at its authoritative section.
- `Commit at a Cost` pressure families are pursuit (`PLAN`, `INTENTION`), time (`CLOCK`), duty/effect (`OBLIGATION`, `CONSEQUENCE`), unresolved pressure (`OPEN THREAD`), relationship (`RELATIONSHIP`), affect (`EMOTION`), information/interpretation (`SECRET`, `BELIEF`), material/agency (`VISIBLE AFFORDANCE`, `OBJECT`, `LOCATION`, `ENTITY STATUS`), and causal event (`EVENT`). `FACT` is support-only and excluded.
- When `dormantSlot` is true, dormancy is a slot-selection modifier, not an operator. Dormant candidates are operator-active selected pressure/material records except `FACT`, sorted by stored `updatedAt` then record id. The compiler selects the oldest candidate that can participate in a valid bundle for an otherwise unused real operator and marks that candidate as mandatory in the slot. If no candidate is viable, the dormant slot is omitted and the slate shrinks.
- No wall-clock reads are allowed during compilation.

## Citation Keys

Every selected record used for ideation receives a deterministic bracketed citation key in the form `[<TYPE>-<n>]`, for example `[BELIEF-1]` or `[VISIBLE AFFORDANCE-1]`. The ordinal is the record's 1-based position among selected records of the same type under the compiler's deterministic full-label sort. Keys are stable for identical selected records and versions, but no cross-session identity is promised after selection or record edits.

Keys render inline once at the record's authoritative ideation section:

| Record type | Inline key render site |
|---|---|
| `SECRET` | `<secrets_and_reveal_constraints>` / writer-visible hidden truths |
| `BELIEF`, `FACT`, `EVENT` | `<relevant_facts_beliefs_events>` |
| `CLOCK` | `<active_clocks>` |
| `PLAN`, `INTENTION` | `<active_plans_and_intentions>` |
| `OBLIGATION`, `CONSEQUENCE` | `<active_obligations_and_consequences>` |
| `RELATIONSHIP`, `EMOTION` | `<relationship_and_emotion_pressure>` |
| `OPEN THREAD` | `<active_open_threads>` |
| `VISIBLE AFFORDANCE`, `OBJECT`, `LOCATION` | `<locations_objects_affordances>` |
| `ENTITY STATUS` | `<physical_continuity>` / status lines |

`EMOTION` records render keys at `<relationship_and_emotion_pressure>`. `ENTITY STATUS` records render keys at their authoritative ideation current-state site in `<physical_continuity>`. Slot `grounds:` lines cite only these short keys. The server verifies returned citation keys against the compiled selected-record key set. Unknown citations are flagged on the idea; malformed blocks are rendered only as raw quarantined scratch.

## UI Handling

The Ideate view must keep assistance output quarantined:

- pull-based only; the user intentionally sends each request;
- prompt inspection before send;
- no automatic record writes;
- no insertion into the Generation Brief;
- no use-as-prose-prompt action;
- keepers are session-scoped scratch, not project data;
- clearing output or keepers leaves no project-store residue.
