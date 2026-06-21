# SPEC-028 — Ideation Operator Taxonomy: Distinctness and Comprehensiveness

**Status**: COMPLETED
Phase: post-v1 product-behavior spec; deterministic ideation prompt-compilation change (operator taxonomy, eligibility predicates, grounding bundles, dormancy modifier, distinctness rule, citation keys)
Depends on: the deterministic ideation prompt compiler (`packages/core/src/compiler/ideation/*`, `sections/ideation.ts`, `template-constants.ts`), the citation-key machinery, the established `lint` / `typecheck` / `test` / `build` CI gates, and the core import-boundary rule. Builds on the landed `IDEAPROMPT-001` (citation keys from full label) and `IDEAPROMPT-002` (`ideation_contradiction_prohibitions` section), both archived.
Governing authority: `docs/FOUNDATIONS.md`
Primary authority docs: `docs/FOUNDATIONS.md`, `docs/ACTIVE-DOCS.md`, `docs/ideation-prompt-template.md`, `docs/compiler-contract.md`, `docs/story-record-schema.md`
Supporting authorities: `archive/specs/SPEC-021-grounded-ideation-prompt.md`, `archive/specs/SPEC-022-ideation-native-prompt-template.md`, `docs/narrative-theory-blocker-roadmap.md`, `tickets/README.md`, `tickets/_TEMPLATE.md`

> Section style note: this file uses the canonical `specs/` section set
> (Problem Statement / Approach / Deliverables / FOUNDATIONS Alignment /
> Verification / Out of Scope / Risks & Open Questions) that the `reassess-spec`
> and `spec-to-tickets` skills parse. It deliberately omits the
> external-generator evidence-ledger preamble (`Target commit:` /
> fetch-provenance / raw-URL acquisition ledger, the source proposal's
> Appendices A–C) because this spec was authored locally against the working
> tree, not fetched at an exact commit — matching the SPEC-024 / SPEC-025 /
> SPEC-026 precedent.

---

## Brainstorm Context

- **Original request:** Analyze `reports/ideation-operator-taxonomy-change-proposal.md`
  and create a spec in `specs/*` with the actionable work aligned with `docs/**`;
  include a FOUNDATIONS amendment in the spec if one is warranted.
- **Source report:** `reports/ideation-operator-taxonomy-change-proposal.md` — a
  spec-precursor change proposal pinned to commit `c10355e`. It determines the
  shipped nine-entry ideation-operator taxonomy is sound but not yet mutually
  distinct or comprehensive, and prescribes a replacement to nine *peer dramatic
  lenses* (each naming one dominant local state transition), current-state-aware
  fail-closed eligibility, minimum deterministic grounding bundles, a rewritten
  distinctness rule, EMOTION/ENTITY STATUS citation keys, and a four-location
  lockstep authority-sync map. It flags **no FOUNDATIONS amendment** required.
- **Spec number:** `SPEC-028` — highest existing across `specs/` (none active)
  and `archive/specs/` (through `SPEC-027`, with `SPEC-026` since archived) is
  `SPEC-027`.
- **Deliverable-count decision:** **one spec.** The request asked for "a spec";
  the proposal is a single lockstep change in which the code authority, domain
  doc, compiler co-authority, and tests/golden must all move together. Splitting
  would manufacture cross-spec dependencies with no review benefit. The repo's
  `spec-to-tickets` workflow performs the per-diff decomposition separately.
- **Deliverable-class decision:** the request pre-authorized a spec; this work
  rewrites the deterministic ideation prompt-compilation surface that
  `docs/ACTIVE-DOCS.md` routes to a spec, so the pre-authorized class is correct.
- **FOUNDATIONS-amendment determination:** **none warranted** — see
  §FOUNDATIONS Alignment. The user's request was contingent ("if amendments are
  warranted"); this spec records the negative determination explicitly rather
  than amending the constitution.

### Premise verification (operator-verified by Read/grep against the working tree)

Target commit `c10355e21563645930506eae0d039ad7c761ee2e` (the proposal's stated
target) equals `git rev-parse HEAD`, so the proposal audited current state; its
freshness caveat is mooted. Every load-bearing premise was verified directly:

- **Current taxonomy** — `packages/core/src/compiler/ideation/operators.ts:12-89`
  defines `IDEATION_OPERATORS` as exactly nine entries: `reveal`,
  `falsify_belief` (with `requiredTypeGroups` `[[BELIEF],[FACT,EVENT]]`),
  `clock_advances`, `plan_meets_friction`, `debt_comes_due`,
  `relationship_reversal`, `close_escape_route`, `collide_two_threads`
  (`minimumRecords: 2`), `reincorporate_dormant`. The
  `REINCORPORATE_DORMANT_OPERATOR` export is at `operators.ts:87-89`.
- **"All matching records" grounding** — `slot-assignment.ts:40-54`
  `eligibleRecordsForOperator` returns **every** record whose type is in the
  operator's `feedingTypes` (after the `minimumRecords` / `requiredTypeGroups`
  gate), not a minimum bundle. The slot then renders all of them
  (`sections/ideation.ts:22-23` `Grounds:` line).
- **Fixed-order assignment** — `slot-assignment.ts:12-23` fills slots by iterating
  `IDEATION_OPERATORS` in array order until `nonDormantTarget`, then handles the
  dormant slot separately (`:25-30`).
- **Reveal permission gate** — `slot-assignment.ts:63-70` `hasRevealPermission`
  admits only `natural_reveal_allowed` or `directive_required`; it does not
  consider `clue_only`, available clue carriers, or `locked` cue states.
- **Dormancy selection (prior-triage O4-validated, preserved here)** —
  `slot-assignment.ts:72-79` `dormantTargetRecords` sorts the selected records by
  `metadata.updatedAt` (lexical = chronological on fixed-length ISO-8601), tie-break
  by `id`, and takes the oldest. This spec preserves that selection logic and only
  changes which operator the dormant slot carries.
- **EMOTION / ENTITY STATUS coverage hole** — neither type appears in any
  operator's `feedingTypes` (`operators.ts:12-89`); both render **unkeyed** by
  documented design (`docs/ideation-prompt-template.md:179`,
  `docs/compiler-contract.md:169`: "render without keys / unkeyed because they do
  not ground ideation operators"). EMOTION renders at the
  `relationship_emotion_pressure` placeholder
  (`docs/ideation-prompt-template.md:76`, `docs/compiler-contract.md:140`);
  ENTITY STATUS renders in ideation `<physical_continuity>`
  (`docs/ideation-prompt-template.md:82`).
- **Distinctness rule contradiction** — `<ideation_quality>` requires "no two
  ideas may share the same dominant pressure source or the same dramatic move;
  each idea should differ from the others along at least one named axis: who acts,
  which pressure fires, or what changes durably"
  (`docs/ideation-prompt-template.md:106`, emitted from the
  `IDEATION_SECTION_TEMPLATES.ideation_quality` code constant at
  `packages/core/src/compiler/template-constants.ts:461-468`) while the compiler
  gives every matching record a slot, so cross-slot grounding overlap is normal —
  the "same dominant pressure source" clause is contradicted by construction.
- **Citation keys** — `citation-keys.ts:8-36` `citationKeysFor` keys **every**
  passed record by `[<TYPE>-<n>]` using the full-label sort (`recordLabel` →
  `displayLabel`, `citation-keys.ts:34-36`, post-`IDEAPROMPT-001`). The "unkeyed"
  behavior for EMOTION/ENTITY STATUS is therefore a *render-site* omission in the
  doc/section layer, not a `citationKeysFor` limitation.
- **Operator-id durability (resolves proposal Open Question #1)** — operator ids
  appear only in `ideation/operators.ts`, `ideation/types.ts:20-29`
  (`IdeationOperatorId` union), `slot-assignment.ts`, and the rendered scratch
  line `Operator id: ${slot.operator}` (`sections/ideation.ts:21`). The server
  (`packages/server/src/ideate-routes.ts`, `ideation-parse.ts`) verifies returned
  ideas by **citation key, not operator id**; no operator id is persisted to the
  database. Operator ids are therefore session-scoped scratch + internal types and
  may be renamed freely with no external compatibility mapping. The golden prompt
  and operator/slot tests change in lockstep.
- **Request shape (unchanged target)** — `ideation/types.ts:9-18`
  `ideationRequestSchema`: `mode` (`ideas`/`questions`), `count` (3-6, default 5),
  `dormantSlot` (default true), `avoidList`. `IDEATION_SECTION_ORDER` at
  `template-constants.ts:34-62`.

### Scope-decisions block

1. **Operator-id rename is safe** (verified above) — no `oldId → newId`
   compatibility map; the deterministic golden regeneration absorbs the rename.
2. **Dormancy selection logic is preserved, not rebuilt** — consistent with prior
   triage `triage/2026-06-12-ideation-prompt-issues-triage.md` O4 ("dormancy
   least-recently-updated logic is reliable — no defect"). Only the slot's
   *operator* changes from the `reincorporate_dormant` pseudo-operator to a real
   unused operator.
3. **Lockstep test set is broader than the proposal's §3 list** — SPEC-026 added
   `ideation-slot-assignment.property.test.ts` and
   `ideation-citation-keys.property.test.ts`, which assert eligibility/slot/key
   invariants this change alters; they are included in the authority-sync update.
4. **The adversarial semantic-distinctness evaluation corpus is out of scope** —
   it must not become runtime model judgment (FOUNDATIONS §29.4); it is a
   manual/offline activity, not a code deliverable here.
5. **No FOUNDATIONS amendment** — recorded as a determination, per the user's
   contingent request.

---

## Problem Statement

The shipped nine-entry ideation-operator taxonomy
(`packages/core/src/compiler/ideation/operators.ts`) is useful but is not yet as
mutually distinct or as comprehensive as its own `<ideation_quality>` distinctness
instruction demands. Six concentrated, load-bearing defects:

1. **Two entries are not peer dramatic lenses.** `collide_two_threads` is an
   umbrella that can instantiate several other operators (any reveal, plan
   setback, debt activation, relationship turn, or option loss is also "two
   threads colliding"); `reincorporate_dormant` is a deterministic recency
   *selection policy*, not a local dramatic move. Treating both as peers makes
   mutual distinctness impossible by construction.
2. **The compiler and the distinctness instruction contradict each other.**
   `<ideation_quality>` says no two ideas may share the same dominant pressure
   source (`docs/ideation-prompt-template.md:106`), but
   `eligibleRecordsForOperator` (`slot-assignment.ts:40-54`) gives every matching
   record a slot, so broad grounding overlap is normal — the golden Falsify slot
   carries two beliefs and two events.
3. **`EMOTION` is a genuine coverage hole.** FOUNDATIONS §18 treats EMOTION as a
   causal pressure record and the schema stores explicit behavioral pressure, yet
   EMOTION grounds no operator and renders unkeyed
   (`docs/ideation-prompt-template.md:179`).
4. **`ENTITY STATUS` is underused.** It is authoritative current state (life,
   agency, location, visibility, activity) and should feed the material/agency
   lens that changes the immediate option set, but it grounds no operator and is
   unkeyed.
5. **The two-thread move is too weak to cover the dilemma/decision family.**
   "Pressures interfere" describes a condition, not a commitment under cost.
6. **Fixed-order assignment favors the historical head of the list**
   (`slot-assignment.ts:12-23`): with the default request and a dense working
   set, the slate is the first four eligible operators plus dormancy, so later
   lenses rarely appear.

Each lens should answer one question — *what single local state changes because
this lens fires?* — with a **non-identical** answer across the nine: information
access, attempt state, affect-driven tactic, immediate option set, operative
belief, temporal pressure, duty/consequence activation, relationship pressure, or
commitment under cost.

## Approach

Replace the taxonomy with **nine peer operators**, make eligibility
**current-state-aware and fail-closed**, replace "all matching records" with
**minimum deterministic grounding bundles**, demote dormancy to a **deterministic
slot-selection modifier**, and rewrite the **distinctness instruction** — all as
one lockstep change across code, the two authority docs, and the tests/golden.
The request shape, response schema, section order, citation-key syntax, and all
prose-prompt behavior are unchanged.

### A. Nine peer operators (fixed evaluation order)

| Order | Id | Display name | Required grounds | Dominant change target |
|---:|---|---|---|---|
| 1 | `reveal` | Reveal | one operator-active `SECRET` | information access |
| 2 | `plan_meets_friction` | Plan Meets Friction | one operator-active `PLAN` or `INTENTION` | attempt state |
| 3 | `emotion_becomes_action` | Emotion Becomes Action | one operator-active `EMOTION` | observable tactic / control shift |
| 4 | `shift_option_set` | Shift the Option Set | one `VISIBLE AFFORDANCE`, `OBJECT`, `LOCATION`, or `ENTITY STATUS` | immediate feasible-action set |
| 5 | `falsify_belief` | Falsify a Belief | one active `BELIEF` + one `FACT` or operator-active `EVENT` | operative interpretation |
| 6 | `clock_advances` | Clock Advances | one operator-active `CLOCK` | temporal pressure |
| 7 | `debt_comes_due` | Debt Comes Due | one operator-active `OBLIGATION` or `CONSEQUENCE` | duty/effect activation |
| 8 | `relationship_turns` | Relationship Turns | one operator-active `RELATIONSHIP` | relational pressure |
| 9 | `commit_at_a_cost` | Commit at a Cost | exactly two operator-active records from different pressure families | commitment / tradeoff |

Replacement deltas vs. the current taxonomy:

- `collide_two_threads` → **replaced** by `commit_at_a_cost` (one committed costly
  move from two incompatible pressure families; **never** an A/B menu, alternate
  futures, or branch list).
- `reincorporate_dormant` → **removed** from `IDEATION_OPERATORS`; becomes a
  slot-selection modifier (§E). `REINCORPORATE_DORMANT_OPERATOR` export removed.
- `close_escape_route` → **renamed** `shift_option_set`; gains `ENTITY STATUS` as a
  feeding type; broadened from "remove an easy path" to an option-set transition.
- `relationship_reversal` → **renamed** `relationship_turns`; the name matches the
  allowed move and the definition tightens (a relational-state change is required;
  an emotional reaction alone is insufficient).
- `emotion_becomes_action` → **new**.
- The first four positions deliberately interleave source domains so the default
  `count: 5` with `dormantSlot: true` (four ordinary slots) draws breadth rather
  than the historical list head. The order stays deterministic and inspectable; it
  is never model-ranked.

The operator definitions/wording become the proposal's §2.1 replacement text and
the highest-risk non-overlap rules (proposal §2.1 boundary table) — each lens is
assigned by its **dominant endpoint**, e.g. a revealed fact that disconfirms a
belief is still `reveal` if its dominant change is access, `falsify_belief` if its
dominant change is the holder's model.

### B. Current-state-aware, fail-closed eligibility

Type presence alone is too permissive. A selected resolved clock, fulfilled plan,
settled emotion, or fully revealed secret must not ground a move (it still
renders at its authoritative site — eligibility controls *grounding*, not
*rendering*). Encode this deterministic operator-active matrix:

| Type | Operator-active states |
|---|---|
| `SECRET` | `hidden` / `partially_revealed` may ground `commit_at_a_cost` as protected-information pressure. `reveal` additionally requires a legal authored surface move: an allowed cue, an available clue carrier, `clue_only`, or `natural_reveal_allowed`. A `locked` secret may support only its authored surface cues; `directive_required` cannot certify a reveal unless the existing declared source profile already carries explicit deterministic authorization. |
| `BELIEF` | `status: active` |
| `FACT` | always active (schema invariant); support-only |
| `EVENT` | not `abandoned`, `current_relevance` ≠ `none` |
| `PLAN` | `active`, `blocked`, or `suspended` (read from the **`plan_status`** field, not `status`) |
| `INTENTION` | `active` or `blocked` |
| `CLOCK` | `active` |
| `OBLIGATION` | `open`, `escalated`, or `transferred` |
| `CONSEQUENCE` | `pending`, `active`, or `escalated` |
| `OPEN THREAD` | `active` or `escalated` |
| `RELATIONSHIP` | `active` |
| `EMOTION` | `active`, `suppressed`, `transformed`, or `dissociated`; not `settled` |
| `VISIBLE AFFORDANCE`, `OBJECT`, `LOCATION` | current material state is eligible even when blocked/unavailable/lost/destroyed/transferred/inactive/inaccessible — the status itself can alter the option set |
| `ENTITY STATUS` | always current by record purpose |

Resolved/fulfilled/settled/closed/answered/superseded/abandoned records still
render (the user selected them) but do not ground an operator. The currently
relevant `EVENT` is the one deliberate exception (its typed relevance field keeps
it causally usable). Any future exception must be typed and documented, never
inferred from prose. No keyword search, embeddings, model judgment, token budget,
accepted prose, candidates, author-private notes, or hidden UI state may
participate (FOUNDATIONS §29.4).

The exact state-edge cases must be encoded and tested verbatim — especially the
exclusions (`PLAN: revised`, `CLOCK: paused`), the inclusion (`EMOTION:
transformed`), and the `SECRET: directive_required` handling. Validate each state
literal against `docs/story-record-schema.md` during implementation. **Field-name
guard:** every type's status predicate reads `payload.status` **except `PLAN`,
which reads `payload.plan_status`** (schema field `plan_status`, precedent
`isActivePlan` at `packages/core/src/compiler/sections/pressure.ts`). Using
`status` for PLAN silently yields zero eligible plans and disables
`plan_meets_friction`.

### C. Minimum deterministic grounding bundles

Each slot receives the smallest bundle that proves eligibility (not every matching
record):

| Operator | Minimum bundle |
|---|---|
| `reveal` | one `SECRET` |
| `plan_meets_friction` | one `PLAN` or `INTENTION` |
| `emotion_becomes_action` | one `EMOTION` |
| `shift_option_set` | one material/status record |
| `falsify_belief` | one `BELIEF` + one `FACT` or `EVENT` |
| `clock_advances` | one `CLOCK` |
| `debt_comes_due` | one `OBLIGATION` or `CONSEQUENCE` |
| `relationship_turns` | one `RELATIONSHIP` |
| `commit_at_a_cost` | exactly two records from two different pressure families |

Bundle choice is deterministic: (1) prefer a bundle whose records have not
grounded an earlier slot; (2) then fewest reused records; (3) break ties by the
existing deterministic citation-key order; (4) never make an otherwise-valid
operator ineligible solely because a ground was reused (reuse is allowed when
unavoidable, but the dominant transition must still differ); (5) keep **every**
selected record rendered and keyed at its authoritative section even when not
chosen for a slot bundle. This improves diversity **without** evicting
user-selected context — distinguishing it from a token-budget eviction
(FOUNDATIONS §29.4).

### D. `commit_at_a_cost` pressure families

Eligible only when two operator-active records come from **different** families:

| Family | Types |
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

`FACT` is excluded (truth is evidence, not an authored pressure demand). The
operator cites exactly one record from each of two families and its wording must
require one selected commitment plus its cost; "A or B?" lists, alternate
futures, and branch menus are invalid.

### E. Dormancy as a deterministic slot-selection modifier

The request shape is unchanged: `dormantSlot: true` still reserves the final slot,
but that slot now receives a **real** operator. Algorithm:

1. Build ordinary eligible bundles using the revised predicates.
2. Define dormant candidates as operator-active selected pressure/material records,
   excluding support-only `FACT`.
3. Sort candidates by stored `updatedAt`, then record id (exactly as today,
   `slot-assignment.ts:72-79` — preserved).
4. Select the oldest candidate that can participate in a valid bundle for an
   operator not already assigned to the slate.
5. Choose that operator by revised taxonomy order, then its minimum bundle via the
   unused-first tie-break; the dormant candidate is mandatory in the bundle.
6. Render the real operator name/id and add a slot instruction identifying the
   mandatory dormant citation key. **Do not add a field to the response format.**
7. If no candidate supports a distinct unused operator, omit the dormant slot and
   let the slate shrink.

Dormancy says *which authored pressure must return*; the selected operator says
*what dramatic move it makes*. (Consistent with prior triage O4: the selection
logic it validated is preserved.)

### F. Replacement distinctness instruction

Replace the `<ideation_quality>` distinctness bullet with the proposal §2.6
wording: each idea must execute its assigned operator and produce one dominant
local state transition; no two ideas may use the same operator or end in the same
dominant change target; different wording/actors/citation keys do not by
themselves make ideas distinct; prefer different grounds where the deterministic
assignment permits, and when a ground must recur the assigned move and changed
state must still differ; the nine dominant targets are enumerated. Categorical
axes become primary; "who acts" / "which pressure fires" remain secondary
preferences only.

**The emitted text is a code constant, not just doc prose.** The `<ideation_quality>`
body the model receives is generated from `IDEATION_SECTION_TEMPLATES.ideation_quality`
at `packages/core/src/compiler/template-constants.ts:461-468` (confirmed by
`docs/compiler-contract.md`: "`<ideation_quality>` from a template constant"). The
replacement must land in **both** that code constant **and** the
`docs/ideation-prompt-template.md:106` description (Deliverable 3) so they do not
drift; editing only the doc leaves the emitted prompt and golden byte-identical
while the two authorities diverge (a §8 continuity bug). While editing the
constant, sweep it for the now-stale `reincorporation` mention (line 466,
"Prefer causal pressure, try-fail friction, reincorporation, …") left over from
the removed `reincorporate_dormant` operator, and reconcile it with dormancy's new
status as a slot-selection modifier (§E).

## Deliverables

A single lockstep change across four authority locations (proposal §3); the
`spec-to-tickets` step will split this into reviewable diffs.

1. **Code authority — `packages/core/src/compiler/ideation/operators.ts`.**
   Replace `IDEATION_OPERATORS` (ids, names, definitions, order, feeding types,
   minimum bundles, required groups). Remove `REINCORPORATE_DORMANT_OPERATOR`. Add
   `emotion_becomes_action`; rename `relationship_reversal`→`relationship_turns`
   and `close_escape_route`→`shift_option_set`; replace
   `collide_two_threads`→`commit_at_a_cost`.
2. **Code authority — coupled implementation** (same code-authority change, not
   separate authorities): `ideation/slot-assignment.ts` (operator-active
   predicate, minimum-bundle selection with unused-first tie-break, family check
   for `commit_at_a_cost`, dormancy-as-modifier algorithm, shrink behavior),
   `ideation/types.ts` (`IdeationOperatorId` union), and the **citation key render
   sites** — which are *not* in `sections/ideation.ts` (that file renders only
   `<ideation_slots>`):
   - **EMOTION key** → `sections/pressure.ts` `keyedLabel`, which currently
     **explicitly excludes EMOTION** from keying (`if (record.type === "EMOTION")
     return label;`); remove that special-case so EMOTION keys like RELATIONSHIP.
   - **ENTITY STATUS key** → `sections/records-tail.ts` `renderEntityStatuses`
     (the ideation `<physical_continuity>` current-state path); confirm the exact
     entity-status render path before editing.
   - **dormant-slot instruction** → `sections/ideation.ts` (the `<ideation_slots>`
     slot-body renderer) — the one legitimate `sections/ideation.ts` change here.
   - **distinctness-rule emitted text** → `IDEATION_SECTION_TEMPLATES.ideation_quality`
     in `template-constants.ts` (see §F and Deliverable 3).

   Citation keys stay ideation-only structurally: `context.citationKeys` is set
   only in `renderIdeationPrompt` (`compile-prompt.ts`); the prose path passes
   `{}`, so adding EMOTION/ENTITY STATUS keys cannot leak into the prose prompt.
   `ideation/citation-keys.ts` already keys every record and needs no change.
   Touch each only as the implementation requires.
3. **Domain authority — `docs/ideation-prompt-template.md`.** Replace
   `## Operator Taxonomy` and `## Slot Assignment` bodies (proposal §2.7 text);
   replace the `<ideation_quality>` distinctness rule (§F); update
   `## Citation Keys` so EMOTION gets a key at `<relationship_and_emotion_pressure>`
   and ENTITY STATUS at its authoritative ideation current-state site, and remove
   the statement that those types are unkeyed (replacing line 179). Preserve
   request shape, output format, and section order.
4. **Compiler co-authority — `docs/compiler-contract.md` §3.2.** Mirror the revised
   taxonomy, operator-active predicates, minimum bundles, dormancy modifier,
   distinctness rule, and new key render sites; replace the EMOTION/ENTITY STATUS
   "unkeyed" statement (line 169). Keep the assistance source profile and section
   order unchanged.
5. **Tests + golden contract.** Rewrite the operator truth table and add
   status/reveal/family eligibility cases in
   `packages/core/test/ideation-operator-eligibility.test.ts`; update
   `ideation-slot-assignment.test.ts` for minimum bundles, unused-first selection,
   dormant-as-modifier, and shrink behavior; update the SPEC-026 property tests
   `ideation-slot-assignment.property.test.ts` and
   `ideation-citation-keys.property.test.ts` whose invariants this change alters;
   add a **dense-working-set** golden/property fixture (proposal §5.4); regenerate
   `golden-ideation.prompt.txt` via `compiler-ideation-golden.test.ts`.

## FOUNDATIONS Alignment

| Principle | Stance | Rationale (mechanism @ surface) |
|---|---|---|
| §12 — no branches / no plot-rail machinery | aligns | `commit_at_a_cost` emits **one** committed move, never A/B menus, alternate futures, beats, scenes, or plans; forbidden by prompt wording (§D) and golden/manual tests @ generated-ideation-prompt. This is the load-bearing guardrail — a branch-menu output would trip §12. |
| §18 — causal pressure records | aligns | The new `emotion_becomes_action` lens finally grounds EMOTION as authored pressure (action-readiness → observable action), and `shift_option_set` uses affordances/current state to make immediate choice legible @ prompt-compilation. |
| §9.1 — assistance prompt class | aligns | Inputs remain deterministic selected records + the existing ideation request; output remains non-prose quarantined scratch that cannot mutate records or enter prose context @ assistance-prompt boundary. |
| §29.4 — prompt-compilation hard fails | aligns | Assignment stays deterministic, provider-neutral, inspectable; no model judgment, hidden embeddings, keyword activation, token eviction, accepted prose, candidates, author-private notes, or hidden UI state. Minimum bundles **select grounds but never evict** rendered records @ slot-assignment. |
| §28.4 — narrative-planning research | aligns | Adopts causal progression and intentional action only; introduces no autonomous planner or semantic ranking @ compiler. |

**No `docs/FOUNDATIONS.md` amendment is required.** The recommendations
operationalize existing principles (§18's EMOTION-as-pressure; §12's
one-committed-move discipline) rather than diverging from them. An amendment would
become necessary only if an implementation departed from this spec by adding
autonomous semantic ranking, branch/beat output, hidden source selection,
automatic record mutation, or ideation-to-prose context flow — none is specified.
This determination answers the request's contingent amendment clause.

## Verification

Minimum deterministic regression properties (proposal §3) — all machine-testable
in `@loom/core`:

- every assigned operator carries exactly its minimum valid grounding bundle;
- no operator id repeats within a slate;
- no ground repeats when an all-unused deterministic bundle exists;
- every assigned `commit_at_a_cost` bundle contains two different pressure families;
- a `locked` secret with no legal cue cannot make `reveal` eligible;
- stale/resolved statuses (per the §B matrix) do not create unsupported pressure
  slots;
- the dormant slot uses the oldest **viable** candidate and a real unused operator,
  or the slate shrinks;
- identical snapshot + request + compiler version → byte-identical prompt
  (golden);
- all selected records still render at their authoritative sites (no eviction);
- the output schema and `IDEATION_SECTION_ORDER` are unchanged;
- adding EMOTION/ENTITY STATUS keys preserves the one-authoritative-site invariant
  (no record duplicated in a second section).

Gates: `npm run lint`, `npm run typecheck`, `npm test` (builds `@loom/core`
first), `npm run build` — all green before completion. Each code change carries
its in-same-revision doc + golden update so the four authorities never diverge.

Semantic distinctness (whether generated ideas truly end in different state
transitions) is only partly machine-testable: eligibility, bundle uniqueness,
family separation, and prompt text are testable; the offline adversarial
evaluation corpus is out of scope (below) and must never become runtime model
judgment.

## Out of Scope

Explicitly unchanged (proposal §2.8): request fields/defaults (`mode`, `count`,
`dormantSlot`, `avoidList`); the 3-6 count bound; ideation section selection and
`IDEATION_SECTION_ORDER`; the response block schema; the broader quality rubric
outside the distinctness sentence; citation-key syntax; prompt inspection,
pull-only send, malformed-output handling, scratch quarantine; and any prose
prompt, prose template, prose compiler behavior, record-writing behavior, or
validation gate.

Also out of scope: the **adversarial semantic-distinctness model-evaluation
corpus** (a manual/offline activity, not a code deliverable; must not become
runtime model judgment per §29.4), and any operator-id backward-compatibility
mapping (verified unnecessary — ids are session-scoped scratch + internal types).

## Risks & Open Questions

1. **Operator-id compatibility — RESOLVED.** Verified that operator ids are not
   durably observed: they live only in `ideation/{operators,types,slot-assignment}.ts`
   and the rendered scratch `Operator id:` line; the server verifies by citation
   key, not operator id; no DB persistence. Ids may be renamed freely; the golden
   regenerates in lockstep.
2. **Status-edge semantics.** Encode and test the §B matrix exactly — the
   exclusions (`PLAN: revised`, `CLOCK: paused`), the inclusion (`EMOTION:
   transformed`), and `SECRET: directive_required`. Validate each literal against
   `docs/story-record-schema.md`; any departure needs an explicit typed,
   deterministic domain-doc rationale.
3. **Reveal authorization boundary.** `assignSlots` receives records + request
   data, not arbitrary semantic interpretation of a manual directive.
   `directive_required` must remain cue-only unless the declared source profile
   exposes a deterministic authorization field; do not smuggle directive
   interpretation into eligibility.
4. **Fixed-order bias.** The interleaving improves the default dense slate, but any
   fixed order still favors earlier eligible operators. Add the dense-working-set
   golden/property fixture and confirm acceptable breadth without introducing
   dynamic or opaque ranking.
5. **Dormant viability vs. strict recency.** "Oldest viable" may skip the absolute
   oldest record when it cannot support an unused operator (preferable to a
   duplicate move). Any UI copy must not claim "absolute oldest selected record"
   after this change.
6. **Minimum bundles and model context.** All selected records remain visible, so
   the model may draw incidental support from unlisted records. The response
   verifier validates cited keys, not semantic exclusivity; the prompt must make
   the assigned operator and grounds normative, and golden/manual evaluation
   should test leakage.
7. **Costly commitment degenerating into alternatives.** `commit_at_a_cost` is
   constitutional (§12) only when it proposes one commitment and one cost. A/B
   menus, either/or branch lists, and future-beat packages must be rejected by
   prompt wording and covered by golden/manual cases.
8. **Citation render sites.** Adding keys to EMOTION and ENTITY STATUS must
   preserve the one-authoritative-site invariant and must not duplicate those
   records in a second section.

## Outcome

Completed: 2026-06-21

Implemented SPEC-028 across three dependency-ordered tickets:

- `archive/tickets/SPEC028IDEOPETAX-001.md` replaced the ideation operator taxonomy with nine peer operators, added fail-closed operator-active predicates, minimum deterministic grounding bundles, `commit_at_a_cost` pressure-family checks, dormancy-as-modifier behavior, the dormant slot instruction, the version bump to template `1.3.0` / compiler `1.5.0` / contract `1.6.0`, and the ticket-owned authority/golden updates.
- `archive/tickets/SPEC028IDEOPETAX-002.md` added EMOTION and ENTITY STATUS ideation citation keys at their authoritative render sites, replaced the emitted `<ideation_quality>` distinctness rule, updated the two authority docs, and re-baselined the ideation golden.
- `archive/tickets/SPEC028IDEOPETAX-003.md` added the capstone regression suite and updated `docs/ACTIVE-DOCS.md`; this ticket is archived in the same closeout commit as this spec.

Deviations: none from the accepted scope. The offline adversarial semantic-distinctness model-evaluation corpus remains out of scope and was not implemented. No FOUNDATIONS amendment was made because the implementation stays within deterministic, non-mutating, local-first assistance-prompt boundaries.

Verification:
- `npx vitest run packages/core/test/ideation-operator-eligibility.test.ts packages/core/test/ideation-slot-assignment.test.ts packages/core/test/ideation-slot-assignment.property.test.ts packages/core/test/compiler-ideation-golden.test.ts packages/core/test/compiler-front-sections.test.ts` passed during ticket 001.
- `npx vitest run packages/core/test/ideation-citation-keys.property.test.ts packages/core/test/ideation-request-rendering.test.ts packages/core/test/compiler-ideation-golden.test.ts packages/core/test/compiler-golden.test.ts` passed during ticket 002.
- `npx vitest run packages/core/test/ideation-taxonomy-capstone.test.ts` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test` passed on rerun after one unrelated web test flake was isolated by a passing targeted rerun: 158 test files, 1674 tests.
- `npm run build` passed with the existing non-failing Vite large chunk warning.
- `grep -q "1.3.0" docs/ACTIVE-DOCS.md` and `grep -q "1.6.0" docs/ACTIVE-DOCS.md` passed.
