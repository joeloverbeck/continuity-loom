Status: active support — non-binding research-grounded candidate list, not a backlog, not validation authority
Authority: support (see docs/ACTIVE-DOCS.md)

# Narrative-Theory Blocker Roadmap

This document captures research-grounded candidates for future deterministic validation work. It is not a backlog, not a validation authority, and not permission to implement any candidate below.

Promoting any candidate requires a published PRD that clears `docs/principles/FOUNDATIONS.md` §29. Semantic prose-quality judgments, model interpretation, and inferred story meaning are out of scope for deterministic blockers under `docs/principles/FOUNDATIONS.md` §11.

## Candidate List

| Candidate | Theory citation | Deterministic-checkability | Blocker vs warning grade | Schema fields required | §12 / §29.1 screening note |
|---|---|---|---|---|---|
| Causal-antecedent-missing for a planned beat | Trabasso and van den Broek causal networks; Riedl and Young narrative planning | Partially; only when a PLAN/INTENTION explicitly names prerequisites or causal dependencies | Blocker only for explicit missing prerequisite fields; otherwise warning | PLAN prerequisites, INTENTION prerequisites, EVENT causes, AFFORDANCE requires | Risky wording because "beat" can imply plot rails; acceptable only as an explicit causal-precondition check on selected records, not scene structure. |
| Unmotivated-action / intentionality gap | Riedl and Young intentional agents; Swain/Bickham motivation-reaction guidance | Partially; deterministic only when an action directive names an actor but selected records give no goal, pressure, affordance, or obligation | Warning by default; blocker only when directive requires impossible or unsupported agency | MANUAL DIRECTIVE actor target, INTENTION holder/intent, PLAN holder/current_step, OBLIGATION owed_by, AFFORDANCE available_to | Checks local agency support, not global plot purpose. It must not require every scene to have a formal goal. |
| Dead-end pressure | Trabasso causal networks; script-supervisor continuity practice | Partially; deterministic when selected pressure records have no current opportunity, route, actor, or relevance marker | Warning unless the directive depends on the dead-ended pressure | OPEN THREAD current relevance, PLAN blockers, CLOCK tick trigger, OBLIGATION opportunity, CONSEQUENCE possible_next_effect | Can highlight inert selected pressure without forcing closure or resolution. It must not become a command to pay off threads. |
| Scene-goal absence | Swain/Bickham scene-sequel terminology | No as a blocker; partially as an advisory check for missing local manual directive pressure | Warning only | MANUAL DIRECTIVE must_render, INTENTION/PLAN/OPEN THREAD selected pressure | High plot-rail risk. Any future use must frame this as "local pressure may be weak," never a required scene-goal structure. |
| Sequel/outcome linkage | Swain/Bickham scene-sequel; causal progression practice | Partially; deterministic only when a continuation handoff declares a durable outcome but selected records/current state omit it | Blocker when continuation handoff contradicts or lacks required represented durable change; otherwise warning | IMMEDIATE HANDOFF durable-change note, CONSEQUENCE, EVENT, CURRENT AUTHORITATIVE STATE | Acceptable as current-state consistency, not as mandatory sequel structure after every scene. |
| Plant/payoff linkage, setup without reachable payoff | Barthes hermeneutic code; Chekhov's gun practice | No as a blocker; partially as stale pressure warning | Warning only | OPEN THREAD current relevance, FACT/OBJECT/AFFORDANCE salience, EVENT current_relevance | High plot-rail risk. It must not force payoff; it can only warn that selected high-salience setup may need current relevance or deselection. |
| Plant/payoff linkage, payoff without selected setup | Barthes hermeneutic code; causal-network practice | Partially; deterministic only when a directive asks to reveal/use a specific object, clue, or promise absent from selected records | Blocker only when directive requires unavailable knowledge/object/affordance; otherwise warning | MANUAL DIRECTIVE must_render, SECRET allowed clues/reveal permission, OBJECT, AFFORDANCE, EVENT causes | Acceptable as missing selected continuity support, not as a generic rule that every event needs foreshadowing. |
| Thread starvation | Barthes hermeneutic code; continuity-board practice | Partially; deterministic only over selected records and explicit age/relevance metadata | Warning only | OPEN THREAD status, urgency, current_relevance, updated_at or story-time marker | Must not force thread closure or story pacing. It can suggest curation or current relevance updates. |
| Pressure staleness | Script-supervisor continuity practice; causal relevance theory | Partially; deterministic when selected records are resolved/abandoned/superseded or old with no current relevance | Warning by default; blocker only if selected stale record contradicts current state | Record metadata status, EVENT current_relevance, OPEN THREAD status, CONSEQUENCE status | Aligns with FOUNDATIONS §14: resolved/abandoned pressure matters only when current. It must not auto-deselect records. |
| Clock-deadline expiry against story time | Causal-network temporal ordering; script-supervisor continuity practice | Yes if current time and clock deadline are structured enough to compare | Blocker when an active clock assumes an unexpired deadline contradicted by current time; warning when time is prose-only | CLOCK deadline/current threshold, CURRENT AUTHORITATIVE STATE current_time, story-time normalization | Local temporal consistency check, not a pacing or act-structure clock. |
| Flagged anachrony with fabula-time-aware continuity checks | Genette anachrony/fabula ordering | Partially; deterministic only with explicit story-time markers and intentional anachrony flags | Warning by default; blocker only for hard contradiction between selected current state and event order | EVENT story_time, EVENT sequence_order or successor field, anachrony flag, CURRENT AUTHORITATIVE STATE current_time | High complexity but not inherently plot-rail machinery if limited to explicit chronology consistency. |
| Knowledge provenance | Genette focalization/paralepsis; script-supervisor continuity practice | Partially; deterministic when POV/audience knowledge claims lack route/source fields | Blocker when POV is given hidden or impossible knowledge; warning when provenance is merely thin | BELIEF access route, EVENT pov_visibility/known_by, SECRET holders/non_holders, POV knowledge profile | Strongly aligned with POV/reveal doctrine. It must police knowledge routes, not infer what characters "should" know from prose. |

## Known Deferred Item

`EVENT.sequence_order` prompt-wiring remains deferred. The 2026-06-09 open-thread-fields triage item O5 states that `sequence_order` is authoring metadata, is not used in prompt generation, and would require a published PRD before any compiled output or ordering behavior changed. `docs/specs/story-record-schema.md` currently matches that decision: `sequence_order` is not sent to the prose prompt and does not control compiled event ordering.

This roadmap does not re-propose `EVENT.sequence_order` wiring.

## Research Sources

- Trabasso and van den Broek 1985, causal-network account of story comprehension.
- Genette focalization and anachrony; Niederhoff's focalization summaries.
- Barthes, `S/Z`, hermeneutic code.
- Swain/Bickham scene-sequel craft tradition.
- Script-supervisor continuity practice.
- Riedl and Young 2010; Ware and Young CPOCL.
- Re3 and DOC story-generation systems.
- Dramatron.
- Knowledge-graph-guided storytelling research, 2025.
