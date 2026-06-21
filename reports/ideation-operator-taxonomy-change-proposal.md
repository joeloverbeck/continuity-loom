# Ideation Operator Taxonomy — Distinctness and Comprehensiveness Change Proposal

**Artifact status:** spec-precursor change proposal; not a numbered specification.  
**Target repository:** `joeloverbeck/continuity-loom`  
**Target commit:** `c10355e21563645930506eae0d039ad7c761ee2e`  
**Freshness scope:** the user-supplied commit is the target of record; this audit does not independently verify that it is the current `main`.

## 1. Determination / verdict

### 1.1 Determination

**No: the shipped nine-entry taxonomy is useful, but it is not yet as mutually distinct or as comprehensive as its own design intends.**

The core is sound. `Reveal`, `Falsify a Belief`, `Clock Advances`, `Plan Meets Friction`, `Debt Comes Due`, and `Relationship Reversal` identify recognizable local causal moves. `Close the Escape Route` also points at a valuable material-pressure move, although its present definition is substantially a subtype of plan friction. The defects are concentrated but load-bearing:

1. **Two entries are not peer dramatic lenses.** `Collide Two Threads` is an umbrella that can instantiate several other operators, while `Reincorporate the Dormant` is a deterministic target-selection policy based on recency rather than a dramatic move. Treating both as peers makes mutual distinctness impossible by construction.[R3][R8][R9]
2. **The compiler and the distinctness instruction contradict each other.** The golden prompt assigns `[BELIEF-2]` to both `Falsify a Belief` and `Reincorporate the Dormant`, while `<ideation_quality>` says that no two ideas may share the same dominant pressure source.[R16] The current compiler also gives a slot every matching record, so broad grounding overlap is normal rather than exceptional.[R9][R16]
3. **`EMOTION` is a genuine coverage hole.** Loom's constitution treats emotion as causal pressure, and the schema stores explicit `behavioral_pressure`; nevertheless, emotion is rendered without a citation key and cannot ground any operator.[R2][R3][R5][R6] External narrative and emotion research independently treats affective response or action-readiness as causal, not merely decorative.[E7][E8][E9]
4. **`ENTITY STATUS` is underused, but it does not warrant a standalone lens.** It is authoritative current state—life, agency, location, visibility, activity—and should feed the material/agency lens that changes the immediate option set.[R5]
5. **The current two-thread move is too weak to cover the missing dilemma/decision family.** “Pressures interfere” describes a condition. It does not require a character to commit, pay, expose, postpone, or sacrifice anything. Scene/sequel models, story grammars, Polti's sacrifice/dilemma situations, Bremond's actualization model, and tabletop move design all identify commitment under cost as a distinct source of local dramatic motion.[E1][E3][E4][E5][E10]
6. **Fixed-order assignment currently favors the historical head of the list.** With the default request and a dense working set, the golden slate is the first four eligible operators plus dormancy. Later lenses can exist in the taxonomy yet rarely appear.[R9][R10][R16]

The recommended disposition is therefore:

- retain and sharpen five operators;
- rename and sharpen two operators;
- replace the generic collision operator with one specific commitment-under-cost move;
- add an emotion-to-action operator;
- remove dormancy from the operator taxonomy while preserving the unchanged `dormantSlot` request as a deterministic slot-selection modifier;
- keep the taxonomy at **nine actual dramatic lenses**.

### 1.2 Category test: what kind of thing is each current entry?

| Current entry | Actual axis | Audit result |
|---|---|---|
| `Reveal` | Change in access to hidden information | Genuine dramatic lens; needs a sharper boundary from belief correction and fail-closed reveal eligibility. |
| `Falsify a Belief` | Change in an actor's operative interpretation | Genuine dramatic lens; must ground exactly one belief plus one fact/event, not every matching record. |
| `Clock Advances` | Change in temporal pressure | Genuine dramatic lens; distinguish a threshold/tick from a generic setback or debt deadline. |
| `Plan Meets Friction` | Change in an attempted course of action | Genuine dramatic lens; define the target as attempt state. |
| `Debt Comes Due` | Activation of obligation or consequence | Genuine dramatic lens; define the target as a duty/effect becoming operative now. |
| `Relationship Reversal` | Change in relationship pressure | Genuine lens, but “reversal” is narrower than the implementation's “invert, stress, or reframe.” Rename to `Relationship Turns` and require a relational-state change. |
| `Close the Escape Route` | Reduction of available actions | Valuable lens, but presently a concrete subtype of plan friction and unable to use `ENTITY STATUS`. Broaden and sharpen to an option-set transition. |
| `Collide Two Threads` | Composition of two sources | **Umbrella, not peer lens.** Any reveal, plan setback, debt activation, relationship turn, or option loss can also be described as two threads colliding. |
| `Reincorporate the Dormant` | Record selection by stored recency | **Meta-policy, not dramatic lens.** It says which ground to use, not what local state transition to produce. |

### 1.3 Complete current pairwise distinctness audit

Legend: **clean** = the current definitions already identify different dominant transitions; **boundary** = separable, but only if the definitions name different dominant targets; **overlap** = one is substantially a subtype of the other; **umbrella** = `Collide Two Threads` can reproduce the other move; **meta** = dormancy is a selection rule and therefore cannot be mutually exclusive with a move.

| Pair | Classification | Reason / required boundary |
|---|---|---|
| Reveal × Falsify | boundary | A secret exposure can falsify a belief. Distinguish **information access** from **operative interpretation**. |
| Reveal × Clock | clean | Information access and temporal escalation are different transitions. |
| Reveal × Plan | clean | A reveal may affect a plan, but the assigned transition can still be access rather than attempt state. |
| Reveal × Debt | clean | Exposure and obligation/consequence activation are different moves. |
| Reveal × Relationship | boundary | A relationship secret can alter a relationship. Require Reveal to end in changed access; Relationship to end in changed relational pressure. |
| Reveal × Close Escape Route | clean | Information access and available-action reduction are distinct. |
| Reveal × Collide Two Threads | umbrella | A secret colliding with another thread can simply be a Reveal slot with a second source. |
| Reveal × Dormant | meta | Any dormant secret can be revealed; recency does not specify a different move. |
| Falsify × Clock | clean | Epistemic correction and time pressure are distinct. |
| Falsify × Plan | boundary | Disconfirming evidence can defeat a plan. Distinguish the actor's model from the attempt's outcome. |
| Falsify × Debt | clean | Interpretation change differs from a duty/effect becoming operative. |
| Falsify × Relationship | boundary | A mistaken belief about another person can create a relationship turn. Require different state targets. |
| Falsify × Close Escape Route | boundary | Material evidence can both falsify an assumption and close an option. Name which state changes. |
| Falsify × Collide Two Threads | umbrella | Belief plus event is already a two-thread collision. |
| Falsify × Dormant | meta | The golden prompt actually reuses one belief across these slots; recency supplies no distinct move.[R16] |
| Clock × Plan | boundary | A ticking clock is a common source of plan friction. Clock must change temporal pressure; Plan must change attempt state. |
| Clock × Debt | boundary | A deadline can make an obligation due. Clock must be about authored threshold/tick; Debt about the claim or effect becoming operative. |
| Clock × Relationship | clean | Temporal and relational state changes are distinct. |
| Clock × Close Escape Route | boundary | Expiry can close a route. Distinguish temporal threshold from the resulting option-set change. |
| Clock × Collide Two Threads | umbrella | A clock interfering with another pressure is a collision by definition. |
| Clock × Dormant | meta | An old clock can advance; dormancy does not identify a second move. |
| Plan × Debt | boundary | An obligation commonly obstructs a plan. Distinguish attempt state from duty/effect activation. |
| Plan × Relationship | boundary | Relationship pressure commonly obstructs an intention. Distinguish attempt state from relationship state. |
| Plan × Close Escape Route | **overlap** | Removing an easy route is one of the clearest forms of plan friction under the current wording. |
| Plan × Collide Two Threads | umbrella | “Two pressures interfere” frequently means a plan meets another pressure. |
| Plan × Dormant | meta | An old plan can meet friction; recency is only target selection. |
| Debt × Relationship | boundary | Relational debt can activate both. Require duty/effect activation versus a changed relationship. |
| Debt × Close Escape Route | clean | A claim becoming due and an option becoming unavailable can be separated by target. |
| Debt × Collide Two Threads | umbrella | An obligation colliding with another pressure is already a collision. |
| Debt × Dormant | meta | An old obligation can come due; recency does not change the move. |
| Relationship × Close Escape Route | clean | Relational pressure and material/agency options are different targets. |
| Relationship × Collide Two Threads | umbrella | A relationship pressure interfering with another thread is a collision. |
| Relationship × Dormant | meta | A dormant relationship can turn; dormancy remains selection. |
| Close Escape Route × Collide Two Threads | umbrella | A material thread can collide with a plan by closing the route. |
| Close Escape Route × Dormant | meta | A dormant object/location/affordance can close an option. |
| Collide Two Threads × Dormant | meta | One is a generic composition and the other a recency selector; neither defines a mutually exclusive dominant move. |

The pairwise result is not that narrative events must belong to only one category. Real events can do several things. The defect is that the current prompt asks the model to generate mutually exclusive lenses without naming a unique **dominant state transition** for every lens.

### 1.4 Internal comprehensiveness: record-type coverage

“Direct” below means that the record can be a required ground for a distinct dramatic move. A support-only type can be comprehensive without receiving a standalone operator when the type is evidence or state rather than pressure.

| Record type | Current direct lens(es) | Current assessment | Proposed treatment |
|---|---|---|---|
| `PLAN` | Plan; Collide; Dormant | Over-served by two generic/meta entries, but well served by Plan. | Plan Meets Friction; Commit at a Cost. |
| `INTENTION` | Plan; Dormant | Adequate through Plan. | Plan Meets Friction; Commit at a Cost. |
| `CLOCK` | Clock; Dormant | Adequate, with boundary overlap against Plan/Debt/Close. | Clock Advances; Commit at a Cost. |
| `OBLIGATION` | Debt; Dormant | Adequate. | Debt Comes Due; Commit at a Cost. |
| `CONSEQUENCE` | Debt; Dormant | Adequate if “due” is read as an effect becoming operative. | Debt Comes Due; Commit at a Cost. |
| `OPEN THREAD` | Collide; Dormant | Under-served by non-lenses. A standalone “resolve the thread” operator would violate Loom's rule that open threads do not command closure.[R2][R5] | Use only as one side of Commit at a Cost. This is a deliberate constrained coverage choice. |
| `RELATIONSHIP` | Relationship; Dormant | Adequate source, definition too broad. | Relationship Turns; Commit at a Cost. |
| `EMOTION` | none | **Comprehensiveness hole.** The schema already stores behavior-driving action tendencies.[R5] | Emotion Becomes Action; Commit at a Cost. |
| `VISIBLE AFFORDANCE` | Close; Dormant | Adequate but narrowly negative. | Shift the Option Set; Commit at a Cost. |
| `EVENT` | Falsify support; Collide; Dormant | Mostly support/context; generic collision is not sufficient. | Falsify support; Commit at a Cost when current relevance makes it pressure. |
| `SECRET` | Reveal; Collide; Dormant | Adequate, subject to reveal-permission eligibility. | Reveal; Commit at a Cost. |
| `BELIEF` | Falsify; Dormant | Adequate, but Falsify currently cites all beliefs. | Falsify a Belief; Commit at a Cost when `behavioral_effect` supplies present pressure. |
| `LOCATION` | Close; Dormant | Adequate material input. | Shift the Option Set; Commit at a Cost. |
| `OBJECT` | Close; Dormant | Adequate material input. | Shift the Option Set; Commit at a Cost. |
| `FACT` | Falsify support; Dormant | A FACT is active truth, not necessarily pressure. Dormancy incorrectly treats it as a dramatic target by itself. | Keep as support-only evidence for Falsify. Do not make it a dormant target. |
| `ENTITY STATUS` | none | Not a standalone dramatic family, but an important current constraint on agency, location, visibility, and activity.[R5] | Feed Shift the Option Set and the material/agency side of Commit at a Cost. |

This treatment covers every causal-pressure record type with at least one genuine lens while refusing false symmetry: `FACT` remains evidence, `ENTITY STATUS` remains current-state/material input, and `OPEN THREAD` remains unresolved pressure rather than an instruction to close a mystery.

### 1.5 External narrative-theory benchmark

The benchmark is used to test missing **local dramatic moves**, not to import acts, beats, branches, plots, or global structures.

| Anchor | What it contributes to this audit | Taxonomy implication |
|---|---|---|
| Polti's dramatic situations | Polti's list repeatedly distinguishes obtaining/refusal, rivalry, mistaken judgment, sacrifice, and dilemma-like forced alternatives; he also warns that a common accident such as murder is too generic to be a useful category.[E1] | Keep lenses at the level of causal mechanism, not outcome. Add a specific commitment-under-cost move rather than retain generic “threads collide.” |
| Propp's functions | Propp distinguishes functions such as interdiction/violation, lack, struggle, and exposure, but the analysis is explicitly tied to a fairy-tale corpus and ordered function sequences.[E2] | Current Reveal, Plan, and option-set pressure cover useful local functions. Do not import Propp's sequence or quest structure. |
| Bremond's narrative possibilities | Bremond models a process as possibility, actualization, and result, while emphasizing that a possible action need not be actualized.[E3] | Each operator should request one local transition that becomes actual, not a menu of branches. Dormancy remains a selector, not a transition. |
| Swain-style scene/sequel | The action side is commonly summarized as goal–conflict–disaster; the reaction side as reaction–dilemma–decision.[E4] | Plan Meets Friction covers goal/conflict. Emotion Becomes Action and Commit at a Cost cover the missing reaction/dilemma/decision space without imposing scene architecture. |
| McKee's value turn and Butler's thwarted yearning | McKee's local-event test asks whether a value-charged condition changes; Butler describes plot in terms of desire being challenged or thwarted.[E5][E6] | Give every lens a named dominant change target. Retain Plan Meets Friction, but do not let “different actors” count as sufficient distinctness. |
| Story grammar | Stein-and-Glenn-style episode components include initiating event, internal response, plan, attempt, direct consequence, and reaction.[E7] | Loom already covers plan, attempt, and consequence. The lack of an emotion-to-action lens leaves internal response/reaction causally inert. |
| Lehnert's plot-unit analysis | Lehnert makes affect states central and distinguishes motivational links from the actualization of intentional events.[E8] | Add an affective lens whose endpoint is observable action, not mood description. Do not import plot-unit graph machinery. |
| Emotion/action-readiness research | Frijda describes emotions as action instigation and urges that can intrude on ongoing thought and behavior.[E9] | `EMOTION.behavioral_pressure` is exactly the kind of authored causal signal a distinct lens can use. |
| Tabletop “move” design | Apocalypse World's basic moves make partial success concrete through a worse outcome, hard bargain, or ugly choice.[E10] | Replace generic collision with one committed costly outcome. Explicitly forbid branch menus. |
| Narrative planning research | Riedl and Young identify causal progression and believable intentional agents as central to narrative understandability.[E11] | Keep operators local, causal, and agent-grounded; do not adopt an autonomous planner. |
| LLM ideation-diversity research | AI idea pools tend to have insufficient dispersion, and prompt structure can improve variance.[E12] | Categorical operator assignment is justified, but a vague “differ on one axis” rule is not enough. Unique change targets and minimal grounding bundles are the stronger implementation. |

### 1.6 Synthesis

The current taxonomy is **close in subject matter but wrong in type discipline**. Its useful seven concepts span information, belief, time, pursuit, duty/consequence, relationship, and material constraint. What it lacks is affective agency and a precise dilemma/commitment move. What it wrongly includes are a composition umbrella and a recency selector.

The target state should therefore be nine peer operators, each answering the same question:

> **What single local state changes because this lens fires?**

The answers must be non-identical: information access, attempt state, affect-driven tactic, immediate option set, operative belief, temporal pressure, duty/consequence activation, relationship pressure, or commitment under cost.

## 2. Recommended changes

### 2.1 Replace the operator list with nine peer dramatic moves

The proposed order deliberately interleaves different source domains in its first four positions, because the default `count: 5` with `dormantSlot: true` leaves four ordinary slots. The broad two-pressure operator remains last. The order is deterministic and inspectable; it is not model-ranked.

| Order | Recommended id | Display name | Required grounds | Dominant change target | Replacement definition |
|---:|---|---|---|---|---|
| 1 | `reveal` | Reveal | one eligible `SECRET` | Information access | **Use one selected SECRET to change who can perceive, suspect, or know it now through an authored cue, partial exposure, or permitted reveal. Do not make belief correction the dominant move.** |
| 2 | `plan_meets_friction` | Plan Meets Friction | one active `PLAN` or `INTENTION` | Attempt state | **Make one selected plan or intention meet concrete resistance and end in one locally consequential yes-but or no-and. The dominant change is what happens to the attempt.** |
| 3 | `emotion_becomes_action` | Emotion Becomes Action | one current `EMOTION` | Observable tactic or control shift | **Turn one selected emotion's authored behavioral pressure into an observable tactic, refusal, approach, withdrawal, confession, concealment, mistake, or loss of control that changes immediate pressure. Do not invent or diagnose an emotion.** |
| 4 | `shift_option_set` | Shift the Option Set | one `VISIBLE AFFORDANCE`, `OBJECT`, `LOCATION`, or `ENTITY STATUS` | Immediate feasible-action set | **Use one selected material or current-state record to make one concrete immediate action become possible, impossible, or materially costlier. Do not invent a new object, route, ability, or status.** |
| 5 | `falsify_belief` | Falsify a Belief | one active `BELIEF` plus one `FACT` or currently relevant `EVENT` | Operative interpretation | **Put one selected belief against one selected fact or event so the holder's behavior-shaping interpretation becomes untenable or materially limited. The dominant change is the holder's model, not merely information availability.** |
| 6 | `clock_advances` | Clock Advances | one active `CLOCK` | Temporal pressure | **Trigger one selected clock's authored tick trigger or next threshold so immediate urgency, cost, or available time changes now. Do not invent a deadline, tick, or effect.** |
| 7 | `debt_comes_due` | Debt Comes Due | one current `OBLIGATION` or `CONSEQUENCE` | Duty/effect activation | **Make one selected obligation or consequence become operative now by claiming action, payment, refusal, exposure, or cost. The dominant change is that the authored claim or effect can no longer remain background.** |
| 8 | `relationship_turns` | Relationship Turns | one active `RELATIONSHIP` | Relational pressure | **Make the current interaction materially change one selected relationship's operative pressure or current expression. An emotional reaction alone is insufficient; what the parties can expect, demand, risk, or exert on each other must change.** |
| 9 | `commit_at_a_cost` | Commit at a Cost | exactly two current records from different pressure families | Commitment/tradeoff | **Make one actor commit now between two incompatible selected pressures, advancing one by sacrificing, postponing, exposing, or worsening the other. Output one specific commitment, never a menu of alternatives.** |

This is a replacement, not an additive pile-on:

- `Collide Two Threads` is replaced by `Commit at a Cost`.
- `Reincorporate the Dormant` is removed from `IDEATION_OPERATORS` and becomes a slot-selection modifier.
- `Close the Escape Route` becomes `Shift the Option Set` and gains `ENTITY STATUS` as a feeding type.
- `Relationship Reversal` becomes `Relationship Turns` so the name matches the allowed move while the definition becomes stricter.
- `Emotion Becomes Action` is new.

The revised taxonomy's highest-risk boundaries must be explicit:

| Revised pair | Non-overlap rule |
|---|---|
| Reveal × Falsify a Belief | Reveal changes access to information; Falsify changes an actor's operative interpretation. A revealed fact that happens to disconfirm a belief is still assigned by its dominant endpoint. |
| Plan Meets Friction × Shift the Option Set | Plan changes the outcome/state of an attempted course; Option Set changes what can immediately be attempted. Closing a route is Option Set unless the idea follows the attempt into a yes-but/no-and result. |
| Plan Meets Friction × Emotion Becomes Action | Plan changes pursuit; Emotion changes an observable tactic or control state caused by authored affective pressure. An angry character obstructing a plan is not enough—the assignment follows the state actually changed. |
| Emotion Becomes Action × Relationship Turns | Emotion may alter one person's behavior without changing the relationship. Relationship requires a material change in what the parties can expect, demand, risk, or exert on each other. |
| Clock Advances × Debt Comes Due | Clock changes time remaining or threshold pressure; Debt activates a claim or effect. A deadline crossing is Clock until the obligation/consequence itself becomes operative. |
| Any single-source lens × Commit at a Cost | Commit uniquely requires two incompatible pressure families, one actor's immediate commitment, and a named sacrifice/postponement/exposure/worsening. Mere interference, friction, or escalation is insufficient. |

### 2.2 Make eligibility current-state-aware and fail closed

Type presence alone is too permissive. A selected resolved clock, fulfilled plan, settled emotion, or fully revealed secret should not automatically create a slot. All selected records must continue to render at their authoritative ideation sites; this predicate controls only whether a record can ground a move.

The downstream spec should encode the following deterministic operator-active matrix:

| Type | Operator-active states |
|---|---|
| `SECRET` | `hidden` or `partially_revealed` may ground `Commit at a Cost` as protected information pressure. `Reveal` additionally requires at least one legal authored surface move: an allowed cue, an available clue carrier, `clue_only`, or `natural_reveal_allowed`. A `locked` secret may support only its authored surface cues; `directive_required` cannot certify a reveal unless the existing declared source profile already carries explicit deterministic authorization. |
| `BELIEF` | `status: active`. |
| `FACT` | Always active by schema invariant, but support-only. |
| `EVENT` | Not `abandoned`, with `current_relevance` other than `none`. |
| `PLAN` | `active`, `blocked`, or `suspended`. |
| `INTENTION` | `active` or `blocked`. |
| `CLOCK` | `active`. |
| `OBLIGATION` | `open`, `escalated`, or `transferred`. |
| `CONSEQUENCE` | `pending`, `active`, or `escalated`. |
| `OPEN THREAD` | `active` or `escalated`. |
| `RELATIONSHIP` | `active`. |
| `EMOTION` | `active`, `suppressed`, `transformed`, or `dissociated`; not `settled`. |
| `VISIBLE AFFORDANCE`, `OBJECT`, `LOCATION` | Selected current material state remains eligible even when blocked, unavailable, lost, destroyed, transferred, inactive, inaccessible, or otherwise constraining, because the status itself can alter the option set. |
| `ENTITY STATUS` | Always current by record purpose. |

Resolved, fulfilled, settled, closed, answered, superseded, and abandoned records may still render because the user selected them, but they do not ground an operator under this matrix. A currently relevant `EVENT` is the deliberate exception: its typed relevance field can keep a resolved or background event causally usable. Any future exception must be typed and documented rather than inferred from prose. No keyword search, embeddings, LLM judgment, token budget, accepted prose, candidates, author-private notes, or hidden UI state may participate.

### 2.3 Replace “all matching records” with minimum deterministic grounding bundles

Current slots receive every matching record; the golden Falsify slot carries two beliefs and two events.[R16] That makes the lens diffuse and causes source reuse across slots. Each slot should instead receive the smallest bundle that proves eligibility:

| Operator | Minimum bundle |
|---|---|
| Reveal | one `SECRET` |
| Plan Meets Friction | one `PLAN` or `INTENTION` |
| Emotion Becomes Action | one `EMOTION` |
| Shift the Option Set | one material/status record |
| Falsify a Belief | one `BELIEF` plus one `FACT` or `EVENT` |
| Clock Advances | one `CLOCK` |
| Debt Comes Due | one `OBLIGATION` or `CONSEQUENCE` |
| Relationship Turns | one `RELATIONSHIP` |
| Commit at a Cost | exactly two records from two different pressure families |

Bundle choice must be deterministic:

1. prefer a bundle whose records have not grounded an earlier slot;
2. then prefer the bundle with the fewest reused records;
3. break remaining ties by the existing deterministic citation-key order;
4. never make an otherwise valid operator ineligible solely because a ground was reused—reuse is allowed when unavoidable, but the prompt's dominant transition must still differ;
5. keep every selected record rendered and keyed at its authoritative section even when it is not chosen for a slot bundle.

This improves diversity without silently removing user-selected context from the prompt.

### 2.4 Define the two-pressure families for `Commit at a Cost`

`Commit at a Cost` is eligible only when two operator-active records come from different families:

| Pressure family | Record types |
|---|---|
| pursuit | `PLAN`, `INTENTION` |
| time | `CLOCK` |
| duty/effect | `OBLIGATION`, `CONSEQUENCE` |
| unresolved pressure | `OPEN THREAD` |
| relationship | `RELATIONSHIP` |
| affect | `EMOTION` |
| information/interpretation | `SECRET`, `BELIEF` |
| material/agency | `VISIBLE AFFORDANCE`, `OBJECT`, `LOCATION`, `ENTITY STATUS` |
| causal event | `EVENT` |

`FACT` is excluded because truth by itself is evidence, not an authored pressure demand. The operator must cite exactly one record from each of two families. Its prompt wording must require one selected commitment and its cost; “A or B?” lists, alternate futures, and branch menus are invalid.

### 2.5 Preserve `dormantSlot` by moving dormancy into deterministic assignment

The request shape remains unchanged. `dormantSlot: true` continues to reserve the final slot, but that slot receives a **real dramatic operator**.

Recommended deterministic algorithm:

1. Build the ordinary eligible bundles using the revised predicates.
2. Define dormant candidates as operator-active selected pressure/material records, excluding support-only `FACT`.
3. Sort candidates by stored `updatedAt`, then record id, exactly as today.
4. Select the oldest candidate that can participate in a valid bundle for an operator not already assigned to the slate.
5. Choose that operator by revised taxonomy order, then choose its minimum bundle using the unused-first tie-break; the dormant candidate is mandatory in the bundle.
6. Render the actual operator name/id and add a slot instruction identifying the mandatory dormant citation key. Do not add a field to the response format.
7. If no candidate can support a distinct unused operator, omit the dormant slot and let the slate shrink.

This preserves deterministic reincorporation while restoring type consistency: dormancy says **which authored pressure must return**; the selected operator says **what dramatic move it makes**.

### 2.6 Replace the mutual-distinctness instruction

Replace the current `<ideation_quality>` distinctness bullet with:

> **Each idea must execute its assigned operator and produce one dominant local state transition. No two ideas may use the same operator or end in the same dominant change target. Different wording, actors, or citation keys do not by themselves make ideas distinct. Prefer different grounds where the deterministic assignment permits; when a ground must recur, the assigned move and changed state must still differ. The nine dominant targets are information access, attempt state, affect-driven tactic, immediate option set, operative belief, temporal pressure, duty/consequence activation, relationship pressure, and commitment under cost.**

This rule makes the categorical axes primary. “Who acts” and “which pressure fires” remain useful secondary diversity preferences, but they no longer certify distinctness by themselves.

### 2.7 Proposed replacement text for the active domain authority

The downstream spec should replace `docs/ideation-prompt-template.md`'s current `## Operator Taxonomy` and `## Slot Assignment` bodies with wording materially equivalent to the following. `docs/compiler-contract.md` §3.2 must mirror it.

```md
## Operator Taxonomy

Operators are evaluated in fixed order. Every operator names one dominant local state transition:

1. Reveal — feeds from one operator-active `SECRET`; changes who can perceive, suspect, or know it now through an authored cue, partial exposure, or permitted reveal.
2. Plan Meets Friction — feeds from one operator-active `PLAN` or `INTENTION`; changes the state of one attempted course of action through one consequential yes-but or no-and.
3. Emotion Becomes Action — feeds from one operator-active `EMOTION`; makes its authored behavioral pressure become observable action or a control shift.
4. Shift the Option Set — feeds from one selected `VISIBLE AFFORDANCE`, `OBJECT`, `LOCATION`, or `ENTITY STATUS`; changes which one concrete immediate action is possible, impossible, or materially costlier.
5. Falsify a Belief — feeds from one operator-active `BELIEF` plus one `FACT` or operator-active `EVENT`; changes the holder's operative interpretation.
6. Clock Advances — feeds from one operator-active `CLOCK`; changes immediate temporal pressure through an authored trigger or threshold.
7. Debt Comes Due — feeds from one operator-active `OBLIGATION` or `CONSEQUENCE`; makes an authored claim or effect become operative now.
8. Relationship Turns — feeds from one operator-active `RELATIONSHIP`; changes the relationship's operative pressure or current expression.
9. Commit at a Cost — feeds from exactly two operator-active records in different pressure families; makes one actor advance one pressure by sacrificing, postponing, exposing, or worsening the other. It outputs one commitment, never alternatives.

Dormancy is not an operator. When `dormantSlot` is enabled, the final slot deterministically requires the least-recently-updated viable selected pressure/material record and assigns an otherwise-unused operator that can make a valid move from it.

## Slot Assignment

The compiler assigns slots deterministically from selected records only:

- A record grounds an operator only when it passes that type's documented operator-active predicate.
- Every slot receives the minimum grounding bundle required by its operator, not every matching selected record.
- Bundle selection prefers unused grounds, then the fewest reused grounds, then deterministic citation-key order.
- Ordinary operators fill in taxonomy order until the non-dormant target is reached.
- `Falsify a Belief` requires one `BELIEF` and one `FACT` or `EVENT`.
- `Commit at a Cost` requires exactly two records from different documented pressure families.
- When `dormantSlot` is true, the final slot uses the oldest viable dormant candidate by stored `updatedAt`, with record id as tie-break, and assigns a real unused operator whose minimum bundle contains that candidate.
- If no distinct viable operator or bundle exists, the slate shrinks rather than padding or repeating a move.
- No wall-clock reads or model-mediated selection are allowed during compilation.
```

Update `## Citation Keys` in the same change:

- `EMOTION` receives a key at `<relationship_and_emotion_pressure>`.
- `ENTITY STATUS` receives a key at its authoritative ideation current-state render site.
- Remove the statement that those types are unkeyed because they ground no operator.
- Keep the rule that a selected record's key renders inline at exactly one authoritative site.

### 2.8 Behaviors explicitly unchanged

This proposal does **not** change:

- request fields or defaults: `mode`, `count`, `dormantSlot`, `avoidList`;
- the 3–6 count bound;
- ideation section selection or `IDEATION_SECTION_ORDER`;
- the response block schema;
- the broader quality rubric outside the distinctness sentence;
- citation-key syntax;
- prompt inspection, pull-only send, malformed-output handling, or scratch quarantine;
- any prose prompt, prose template, prose compiler behavior, record-writing behavior, or validation gate.

## 3. Authority-sync map

The downstream spec must treat these four authority locations as one lockstep change:

| Authority location | Required update |
|---|---|
| **1. Code authority** — `packages/core/src/compiler/ideation/operators.ts` | Replace `IDEATION_OPERATORS`, definitions, order, feeding types, minimum bundles, and required groups. Remove `REINCORPORATE_DORMANT_OPERATOR`. Directly coupled implementation changes belong in `slot-assignment.ts`, `types.ts`, `citation-keys.ts`, `sections/ideation.ts`, and `template-constants.ts` as needed; these are implementation consequences of the same code-authority change, not separate authorities. |
| **2. Domain authority** — `docs/ideation-prompt-template.md` | Replace `## Operator Taxonomy` and `## Slot Assignment`; replace the `<ideation_quality>` distinctness rule; update `## Citation Keys` for `EMOTION` and `ENTITY STATUS`. Preserve request shape, output format, and section order. |
| **3. Compiler co-authority** — `docs/compiler-contract.md` §3.2 | Mirror the revised taxonomy, active predicates, minimum bundles, dormancy modifier, distinctness rule, and new key render sites. Keep the assistance source profile and section order unchanged. |
| **4. Tests and golden contract** — `packages/core/test/ideation-operator-eligibility.test.ts` plus golden ideation baseline | Replace the operator truth table; add status/reveal/family eligibility cases; update `ideation-slot-assignment.test.ts` for minimum bundles, unused-first selection, dormant-as-modifier, and shrink behavior; regenerate `golden-ideation.prompt.txt` through `compiler-ideation-golden.test.ts`. |

Minimum regression properties for the downstream spec:

- every assigned operator has exactly its minimum valid grounding bundle;
- no operator id repeats in a slate;
- no ground repeats when an all-unused deterministic bundle exists;
- every assigned `Commit at a Cost` bundle contains two different pressure families;
- a locked secret with no legal cue cannot make Reveal eligible;
- stale/resolved statuses do not create unsupported pressure slots;
- the dormant slot uses the oldest **viable** candidate and a real unused operator;
- identical snapshot, request, and compiler versions produce byte-identical prompts;
- all selected records still render at their authoritative sites;
- the output schema and `IDEATION_SECTION_ORDER` remain unchanged.

## 4. Foundational-amendment flag

**No `docs/FOUNDATIONS.md` amendment is required for these recommendations.**

They align with the existing constitution:

- **§4.7, causality over structure:** every operator produces one local pressure, complication, reveal/reveal-withheld, option change, or commitment; none schedules global plot shape.[R2]
- **§9.1, assistance prompt class:** inputs remain deterministic selected records plus the existing ideation request; output remains non-prose quarantined scratch and cannot mutate records or enter prose context.[R2][R3][R4]
- **§12, no plot-rail machinery:** `Commit at a Cost` must output one committed move, not alternative branches, beats, scenes, acts, or future plans.[R2]
- **§18, causal pressure records:** the new emotion lens finally uses the constitution's explicit treatment of `EMOTION` as pressure, while the option-set lens uses affordances and current state to make immediate choice legible.[R2][R5]
- **§28.4, narrative-planning research:** the recommendation adopts causal progression and intentional action only; it does not introduce a planner.[R2][E11]
- **§29.4, prompt-compilation hard fails:** assignment remains deterministic, provider-neutral, inspectable, and free of model judgment, hidden embeddings, keyword activation, token eviction, accepted prose, candidates, author-private notes, or hidden UI state.[R2]

A foundational amendment would become necessary only if an implementation departed from this proposal by adding autonomous semantic ranking, branch/beat output, hidden source selection, automatic record mutation, or ideation-to-prose context flow. None is recommended.

## 5. Open questions / risks for the downstream spec

1. **Operator-id compatibility.** Determine whether operator ids survive anywhere beyond session-scoped scratch. If an id is externally or durably observed, preserve the old id while changing the display name, or define an explicit compatibility mapping. Do not assume this from the files audited here.
2. **Status-edge semantics.** Encode and test the proposed matrix exactly, especially the exclusions (`PLAN: revised`, `CLOCK: paused`), the inclusion (`EMOTION: transformed`), and the operator-specific handling of `SECRET: directive_required`. Any departure needs an explicit domain-doc rationale; it must remain typed and deterministic.
3. **Reveal authorization boundary.** `assignSlots` currently receives records and request data, not arbitrary semantic interpretation of a manual directive. `directive_required` must therefore remain cue-only unless the existing declared source profile exposes a deterministic authorization field; do not smuggle directive interpretation into eligibility.
4. **Fixed-order bias.** The proposed interleaving materially improves the default dense slate, but any fixed order still favors earlier eligible operators. Add a dense-working-set golden/property fixture and confirm that the chosen order gives acceptable breadth without introducing dynamic or opaque ranking.
5. **Dormant viability versus strict recency.** “Oldest viable” may skip the absolute oldest record when it cannot support an unused operator. That is preferable to emitting a duplicate move, but the UI copy should not claim “absolute oldest selected record” after this change.
6. **Minimum bundles and model context.** All selected records remain visible, so a model may still draw incidental support from unlisted records. The response verifier can validate cited keys, not semantic exclusivity. The prompt must make the assigned operator and grounds normative, and golden/manual evaluation should test leakage.
7. **Costly commitment degenerating into alternatives.** The operator is constitutional only when it proposes one commitment and one cost. A/B menus, “either/or” branch lists, or future beat packages must be rejected by prompt wording and covered by golden/manual cases.
8. **Citation render sites.** Adding keys to `EMOTION` and `ENTITY STATUS` must preserve the one-authoritative-site invariant and must not duplicate those records in a second section.
9. **Semantic distinctness is only partly machine-testable.** Eligibility, bundle uniqueness, source-family separation, and prompt text are testable. Whether generated ideas truly end in different state transitions still needs a small adversarial model-evaluation corpus; that evaluation must not become runtime model judgment.

---

## Appendix A — Final exact-commit acquisition ledger

```text
Requested repository: joeloverbeck/continuity-loom
Target commit: c10355e21563645930506eae0d039ad7c761ee2e
Freshness claim: user-supplied target commit only; not independently verified as latest main
Manifest role: path inventory only
Repository metadata used: no
Default-branch lookup used: no
Branch-name file fetch used: no
Target-repository code search used: no
Clone used: no
URL fetch method: web.open with full exact URL; container.download only after URL verification for locally readable copies
Requested unique repository file count: 20
Successfully verified unique file count: 20
Successful exact-URL response count: 30 (20 primary raw responses, 6 supplemental exact-commit GitHub blob views, and 4 duplicate raw re-verifications during final QA)
Unique successful exact repository-file URLs: 26
Pre-transport API URL rejections: 5; not used as evidence; each required file was acquired through another allowed exact-commit URL
Fetch-provenance contamination observed: no
Foreign-repository references inside fetched file contents: permitted; not a provenance check
Connector/tool namespace trusted as evidence: no
External research lane: separate from repository evidence
Substantive analysis began only after all 20 required unique files were verified: yes
```

### Successful primary raw-file requests

1. https://raw.githubusercontent.com/joeloverbeck/continuity-loom/c10355e21563645930506eae0d039ad7c761ee2e/docs/ACTIVE-DOCS.md
2. https://raw.githubusercontent.com/joeloverbeck/continuity-loom/c10355e21563645930506eae0d039ad7c761ee2e/docs/FOUNDATIONS.md
3. https://raw.githubusercontent.com/joeloverbeck/continuity-loom/c10355e21563645930506eae0d039ad7c761ee2e/docs/ideation-prompt-template.md
4. https://raw.githubusercontent.com/joeloverbeck/continuity-loom/c10355e21563645930506eae0d039ad7c761ee2e/docs/compiler-contract.md
5. https://raw.githubusercontent.com/joeloverbeck/continuity-loom/c10355e21563645930506eae0d039ad7c761ee2e/docs/story-record-schema.md
6. https://raw.githubusercontent.com/joeloverbeck/continuity-loom/c10355e21563645930506eae0d039ad7c761ee2e/archive/specs/SPEC-021-grounded-ideation-prompt.md
7. https://raw.githubusercontent.com/joeloverbeck/continuity-loom/c10355e21563645930506eae0d039ad7c761ee2e/archive/specs/SPEC-022-ideation-native-prompt-template.md
8. https://raw.githubusercontent.com/joeloverbeck/continuity-loom/c10355e21563645930506eae0d039ad7c761ee2e/docs/prompt-template.md
9. https://raw.githubusercontent.com/joeloverbeck/continuity-loom/c10355e21563645930506eae0d039ad7c761ee2e/docs/prompt-template-rationale.md
10. https://raw.githubusercontent.com/joeloverbeck/continuity-loom/c10355e21563645930506eae0d039ad7c761ee2e/docs/narrative-theory-blocker-roadmap.md
11. https://raw.githubusercontent.com/joeloverbeck/continuity-loom/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/src/compiler/ideation/operators.ts
12. https://raw.githubusercontent.com/joeloverbeck/continuity-loom/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/src/compiler/ideation/slot-assignment.ts
13. https://raw.githubusercontent.com/joeloverbeck/continuity-loom/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/src/compiler/ideation/types.ts
14. https://raw.githubusercontent.com/joeloverbeck/continuity-loom/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/src/compiler/ideation/citation-keys.ts
15. https://raw.githubusercontent.com/joeloverbeck/continuity-loom/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/src/compiler/sections/ideation.ts
16. https://raw.githubusercontent.com/joeloverbeck/continuity-loom/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/src/compiler/template-constants.ts
17. https://raw.githubusercontent.com/joeloverbeck/continuity-loom/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/test/ideation-operator-eligibility.test.ts
18. https://raw.githubusercontent.com/joeloverbeck/continuity-loom/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/test/ideation-slot-assignment.test.ts
19. https://raw.githubusercontent.com/joeloverbeck/continuity-loom/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/test/golden-ideation.prompt.txt
20. https://raw.githubusercontent.com/joeloverbeck/continuity-loom/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/test/compiler-ideation-golden.test.ts

### Successful supplemental exact-commit render requests

1. https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/src/compiler/ideation/operators.ts
2. https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/src/compiler/ideation/slot-assignment.ts
3. https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/src/compiler/ideation/types.ts
4. https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/test/ideation-operator-eligibility.test.ts
5. https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/test/ideation-slot-assignment.test.ts
6. https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/test/compiler-ideation-golden.test.ts

### Duplicate exact raw-file verification requests during final QA

These requests repeat URLs already listed under the successful primary raw-file requests; they are recorded here because the acquisition ledger is append-only.

1. https://raw.githubusercontent.com/joeloverbeck/continuity-loom/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/src/compiler/ideation/operators.ts
2. https://raw.githubusercontent.com/joeloverbeck/continuity-loom/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/src/compiler/ideation/slot-assignment.ts
3. https://raw.githubusercontent.com/joeloverbeck/continuity-loom/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/src/compiler/ideation/citation-keys.ts
4. https://raw.githubusercontent.com/joeloverbeck/continuity-loom/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/test/golden-ideation.prompt.txt

### Exact API URLs rejected before transport and not used as evidence

1. https://api.github.com/repos/joeloverbeck/continuity-loom/contents/packages/core/src/compiler/ideation/operators.ts?ref=c10355e21563645930506eae0d039ad7c761ee2e
2. https://api.github.com/repos/joeloverbeck/continuity-loom/contents/packages/core/src/compiler/ideation/slot-assignment.ts?ref=c10355e21563645930506eae0d039ad7c761ee2e
3. https://api.github.com/repos/joeloverbeck/continuity-loom/contents/packages/core/src/compiler/ideation/types.ts?ref=c10355e21563645930506eae0d039ad7c761ee2e
4. https://api.github.com/repos/joeloverbeck/continuity-loom/contents/packages/core/test/ideation-operator-eligibility.test.ts?ref=c10355e21563645930506eae0d039ad7c761ee2e
5. https://api.github.com/repos/joeloverbeck/continuity-loom/contents/packages/core/test/ideation-slot-assignment.test.ts?ref=c10355e21563645930506eae0d039ad7c761ee2e

## Appendix B — Repository evidence references

All repository references below are pinned to the target commit.

- **[R1]** [`docs/ACTIVE-DOCS.md`](https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/docs/ACTIVE-DOCS.md)
- **[R2]** [`docs/FOUNDATIONS.md`](https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/docs/FOUNDATIONS.md)
- **[R3]** [`docs/ideation-prompt-template.md`](https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/docs/ideation-prompt-template.md)
- **[R4]** [`docs/compiler-contract.md`](https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/docs/compiler-contract.md)
- **[R5]** [`docs/story-record-schema.md`](https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/docs/story-record-schema.md)
- **[R6]** [`archive/specs/SPEC-021-grounded-ideation-prompt.md`](https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/archive/specs/SPEC-021-grounded-ideation-prompt.md)
- **[R7]** [`archive/specs/SPEC-022-ideation-native-prompt-template.md`](https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/archive/specs/SPEC-022-ideation-native-prompt-template.md)
- **[R8]** [`packages/core/src/compiler/ideation/operators.ts`](https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/src/compiler/ideation/operators.ts)
- **[R9]** [`packages/core/src/compiler/ideation/slot-assignment.ts`](https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/src/compiler/ideation/slot-assignment.ts)
- **[R10]** [`packages/core/src/compiler/ideation/types.ts`](https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/src/compiler/ideation/types.ts)
- **[R11]** [`packages/core/src/compiler/ideation/citation-keys.ts`](https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/src/compiler/ideation/citation-keys.ts)
- **[R12]** [`packages/core/src/compiler/sections/ideation.ts`](https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/src/compiler/sections/ideation.ts)
- **[R13]** [`packages/core/src/compiler/template-constants.ts`](https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/src/compiler/template-constants.ts)
- **[R14]** [`packages/core/test/ideation-operator-eligibility.test.ts`](https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/test/ideation-operator-eligibility.test.ts)
- **[R15]** [`packages/core/test/ideation-slot-assignment.test.ts`](https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/test/ideation-slot-assignment.test.ts)
- **[R16]** [`packages/core/test/golden-ideation.prompt.txt`](https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/test/golden-ideation.prompt.txt)
- **[R17]** [`packages/core/test/compiler-ideation-golden.test.ts`](https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/packages/core/test/compiler-ideation-golden.test.ts)
- **[R18]** [`docs/prompt-template.md`](https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/docs/prompt-template.md)
- **[R19]** [`docs/prompt-template-rationale.md`](https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/docs/prompt-template-rationale.md)
- **[R20]** [`docs/narrative-theory-blocker-roadmap.md`](https://github.com/joeloverbeck/continuity-loom/blob/c10355e21563645930506eae0d039ad7c761ee2e/docs/narrative-theory-blocker-roadmap.md)

## Appendix C — External research references

- **[E1]** Georges Polti, *Les trente-six situations dramatiques* (1895), [Project Gutenberg edition](https://www.gutenberg.org/ebooks/72036).
- **[E2]** Vladimir Propp, *Morphology of the Folktale* (1928; English translation excerpt), [MIT-hosted PDF](https://web.mit.edu/allanmc/www/propp.pdf).
- **[E3]** Claude Bremond, “La logique des possibles narratifs,” *Communications* 8 (1966), pp. 60–76, [doi:10.3406/comm.1966.1115](https://doi.org/10.3406/comm.1966.1115).
- **[E4]** September C. Fawkes, [“Scene Structure According to Dwight V. Swain”](https://www.septembercfawkes.com/2021/09/scene-structure-according-to-dwight-v.html) and [“Sequel Structure According to Swain”](https://www.septembercfawkes.com/2021/10/sequel-structure-according-to-swain.html), modern expositions of Swain's goal–conflict–disaster and reaction–dilemma–decision model.
- **[E5]** Robert McKee, [“Do Your Scenes Turn?”](https://mckeestory.com/do-your-scenes-turn/), official McKee site.
- **[E6]** Robert Olen Butler interview, [“Fuck Sentimentality”](https://fictionwritersreview.com/interview/fuck-sentimentality-an-interview-with-robert-olen-butler-2/), *Fiction Writers Review*.
- **[E7]** Froma P. Roth and Nancy J. Spekman, “Narrative Discourse: Spontaneously Generated Stories of Learning-Disabled and Normally Achieving Students,” *Journal of Speech and Hearing Disorders* 51 (1986), 8–23, [doi:10.1044/jshd.5101.08](https://doi.org/10.1044/jshd.5101.08).
- **[E8]** Wendy G. Lehnert, “Plot Units and Narrative Summarization,” *Cognitive Science* 5.4 (1981), 293–331, [doi:10.1207/s15516709cog0504_1](https://doi.org/10.1207/s15516709cog0504_1).
- **[E9]** Nico H. Frijda, “The Psychologists' Point of View,” in *Handbook of Emotions*, 3rd ed. (2008), pp. 68–87, [University of Amsterdam record](https://dare.uva.nl/id/0ac588c7-3234-45c9-b336-32a97b15381d).
- **[E10]** D. Vincent Baker and Meguey Baker, *Apocalypse World: Basic Moves — Reconsolidated*, [official PDF](https://lumpley.games/wp-content/uploads/2024/01/AW-Basic-Moves-Reconsolidated.pdf).
- **[E11]** Mark O. Riedl and R. Michael Young, “Narrative Planning: Balancing Plot and Character,” *Journal of Artificial Intelligence Research* 39 (2010), [doi:10.1613/jair.2989](https://doi.org/10.1613/jair.2989).
- **[E12]** Lennart Meincke, Ethan Mollick, and Christian Terwiesch, “Prompting Diverse Ideas: Increasing AI Idea Variance” (2024), [arXiv:2402.01727](https://arxiv.org/abs/2402.01727).
