# PRODUPVERSPE-001: Narrow `active_knowledge_pressure` — FACT/EVENT predicates + BELIEF behavior-first

**Status**: PENDING
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — modifies the `@loom/core` compiler `active_knowledge_pressure` resolver in `packages/core/src/compiler/sections/pressure.ts`; amends `docs/compiler-contract.md` §3/§4/§8 placeholder mapping; production prompt output changes (golden baseline regenerates).
**Deps**: None

## Problem

`active_knowledge_pressure` currently front-loads **every** selected SECRET/BELIEF/FACT/EVENT record into the active working set with no predicate, repeating inert archive text (ordinary setting/discovered facts, backstory events) as same-framing duplicates of the later detail sections. Per the spec verdict (`specs/prompt-duplication-verdict-and-spec.md` §3.2/§3.3 + §7.4.2), only records that exert *current pressure* belong in the front summary: hard-canon/current-state/current-segment/high-salience FACTs, immediate/recent/high-relevance EVENTs, and BELIEFs framed by their behavioral effect. This tightens duplicate noise without weakening the salience architecture or touching determinism.

## Assumption Reassessment (2026-06-09)

1. `packages/core/src/compiler/sections/pressure.ts:32-38` renders `active_knowledge_pressure` from `["SECRET", "BELIEF", "FACT", "EVENT"]` via `pressureFromRecords` with predicate `() => true` and a **single shared** projection `firstText(payload, ["secret_claim", "claim", "statement", "description"])`. No per-type predicate or per-type projection exists today — confirmed by direct read this session.
2. The predicate fields exist in `docs/story-record-schema.md`: `fact_kind: hard_canon | current_state | setting_fact | discovered_fact` (:566), `scope` includes `current_segment` (:568), `salience: low | medium | high | critical` (:571), `event_kind: immediate_previous | recent_causal | relevant_backstory | offstage | withheld` (:739), `current_relevance: none | low | medium | high | critical` (:749), `behavioral_effect: prose` on BELIEF (:594). The spec was reassessed this session; §7.8 already documents that the shared projection must be split into per-type handling.
3. **Shared boundary under audit**: the `active_knowledge_pressure` projection is the one seam shared across SECRET/BELIEF/FACT/EVENT. This ticket splits that seam into per-type handling and must leave the SECRET path, `relationship_emotion_pressure`, and `material_pressure` (owned by PRODUPVERSPE-002) byte-unchanged.
4. **FOUNDATIONS §8 deterministic compilation / §15 secret firewall**: the predicates read only existing deterministic record fields — no LLM intermediary, no wall-clock, no nondeterministic iteration (records already flow through `orderCompilerRecords`). SECRET rendering is unchanged except the `docs/compiler-contract.md` note clarifying that only the hidden-truth lane needs the full claim; no new leak path into a forbidden mind.
5. **Deterministic-compilation enforcement surface**: `compilePrompt` → `PRESSURE_PLACEHOLDER_RESOLVERS.active_knowledge_pressure` (built at `pressure.ts:127-141`). Per-type predicates are pure field reads, so identical inputs + versions still produce byte-identical output; the golden regression test is the proof surface. The change does not weaken the secret firewall (§15) or break deterministic compilation (§8).
6. **Adjacent contradiction (required consequence of this ticket)**: `packages/core/test/compiler-pressure-sections.test.ts` `knowledgePressureRecords()` (:325-371) defines a FACT (`Fact A`, :343-350) with only `statement` and an EVENT (`Event A`, :351-359) with `current_relevance: "critical"` but no `event_kind`; the tests at :552-568 ("deduplicates…") and :570-576 ("renders event knowledge pressure without a relevance-enum tail") assert both render. Those assertions encode the **old** unconditional contract this ticket deliberately changes. Resolution is in-scope: give `Fact A` a qualifying field (`fact_kind: "current_state"`) and `Event A` an explicit `event_kind: "immediate_previous"` so the dedup/no-enum tests still exercise rendering, then add new gating tests. This is a sanctioned contract change (no silent retcon — §20), not a test adapted to a bug.
7. **Mismatch + correction**: none. The spec was reassessed in this session and §7.4.2/§7.8 already carry the corrected predicate text, the EVENT no-relevance-enum clause, and the POV-belief-divergence note; this ticket implements that corrected spec verbatim.

## Architecture Check

1. Per-type handling is the only way to express three genuinely different salience rules (FACT field gate, EVENT kind+relevance gate, BELIEF behavioral-effect-first projection) that a single shared `firstText` projection + `() => true` predicate cannot represent. Keep `pressureFromRecords`/`renderRecords` as the SECRET path and add a small deterministic per-type dispatch for BELIEF/FACT/EVENT, rather than forking the resolver wholesale.
2. No backwards-compatibility aliasing or shims: the old unconditional rendering is replaced outright and the tests move to the new contract; no dual path is retained.

## Verification Layers

1. FACT gating invariant -> codebase unit test: a non-qualifying setting/discovered FACT is absent from `active_knowledge_pressure`; a `current_state`/`hard_canon`/`current_segment`/`high|critical` FACT is present (`compiler-pressure-sections.test.ts`).
2. EVENT gating invariant -> unit test: `relevant_backstory`/`withheld` absent; `immediate_previous`/`recent_causal` with `current_relevance ≠ none` present; `offstage` present only at `high|critical`.
3. BELIEF behavior-first invariant -> unit test: a BELIEF with `behavioral_effect` leads with it; a BELIEF without falls back to the claim.
4. Determinism invariant -> golden regression + the existing "orders records independently" test prove identical inputs → byte-identical output (`compiler-golden.test.ts`).
5. Contract↔code correspondence -> run `compiler-scaffold.test.ts` (guards `docs/compiler-contract.md` structure) green after the §4 row edit.

## What to Change

### 1. `active_knowledge_pressure` resolver (`pressure.ts`)

Replace the shared `pressureFromRecords(..., ["SECRET","BELIEF","FACT","EVENT"], firstText(...))` call with a deterministic per-type render:

- **SECRET** — unchanged: project `secret_claim`, keep the `label === text → render once` dedup.
- **BELIEF** — project `behavioral_effect` first when populated, then a compact belief identifier/claim; fall back to `claim` when `behavioral_effect` is empty. (This behavioral-effect-first ordering applies to all beliefs here by design — distinct from the `{pov_relevant_beliefs}` detail row's truth-relation-first ordering; see spec §3.1.)
- **FACT** — render only when `fact_kind ∈ {hard_canon, current_state}` OR `scope === "current_segment"` OR `salience ∈ {high, critical}`; otherwise omit (the detail/hard-canon sections carry it).
- **EVENT** — render `immediate_previous`/`recent_causal` when `current_relevance !== "none"`; render `offstage` only when `current_relevance ∈ {high, critical}`; never render `relevant_backstory`/`withheld`. A record with no `event_kind` matches no enumerated arm and is omitted (deterministic default — narrate in the PR). Preserve the existing behavior of rendering the description claim without appending the relevance enum.

Keep the empty-state fallback (`EMPTY_STATE_CONSTANTS.active_knowledge_pressure`) so a fully-filtered section still renders `None beyond detailed records below`.

### 2. `docs/compiler-contract.md` knowledge-pressure rows

Apply spec §7.4.1 (§3 "pressure summaries, not archive copies" note), §7.4.2 (the replacement `{active_knowledge_pressure}` row, including the BELIEF behavioral-effect-first + POV-divergence note and the retained "EVENT … without appending the relevance enum" clause), §7.4.5 (append the authority-record note to `{pov_relevant_beliefs}` and `{non_pov_behavior_shaping_beliefs}`), §7.4.6 (append the label-not-full-claim note to the five secret lanes), §7.4.7 (the §8 empty-state bullet for predicate-filtered pressure summaries).

### 3. `compiler-pressure-sections.test.ts`

Update `knowledgePressureRecords()`: add `fact_kind: "current_state"` to `Fact A` and `event_kind: "immediate_previous"` to `Event A` so the dedup (:552) and no-enum (:570) tests still exercise rendering. Add new tests: a setting/discovered FACT with no qualifying field is absent; a `relevant_backstory` EVENT is absent while an `immediate_previous`/`current_relevance: high` EVENT is present; a BELIEF with `behavioral_effect` leads with it and one without falls back to claim.

### 4. `golden-first-segment.prompt.txt`

Regenerate the baseline. If the demo fixture's `active_knowledge_pressure` output shifts (belief reorder / event gating), commit the new baseline; if it is unchanged (the demo beliefs are claim-only and its events qualify), state that in the PR so the empty diff is intentional.

## Files to Touch

- `packages/core/src/compiler/sections/pressure.ts` (modify)
- `docs/compiler-contract.md` (modify)
- `packages/core/test/compiler-pressure-sections.test.ts` (modify)
- `packages/core/test/golden-first-segment.prompt.txt` (modify)

## Out of Scope

- Removing VISIBLE AFFORDANCE from `material_pressure` and its contract rows (PRODUPVERSPE-002).
- `template-constants.ts` static prose, `prompt-template.md`, `prompt-template-rationale.md`, §10 change-control (PRODUPVERSPE-003).
- Stress-suite Case 32 + coverage-matrix row (PRODUPVERSPE-004).
- The optional "warn when many ordinary FACT/backstory EVENT records but none qualify" warning (spec §7.9, explicitly deferred).
- Any schema change and any FOUNDATIONS amendment (spec §7.7 — none warranted).

## Acceptance Criteria

### Tests That Must Pass

1. `npm test -- compiler-pressure-sections` — new FACT/EVENT/BELIEF gating tests pass and the updated dedup/no-enum tests pass.
2. `npm test -- compiler-golden` — golden regression passes against the regenerated (or confirmed-unchanged) baseline.
3. `npm test` — full `@loom/core` suite green, including `compiler-scaffold.test.ts` after the contract edits.

### Invariants

1. `active_knowledge_pressure` renders a FACT only when `fact_kind ∈ {hard_canon, current_state}` ∨ `scope = current_segment` ∨ `salience ∈ {high, critical}`; EVENTs only per the kind+relevance gate above.
2. Identical inputs + template/compiler/contract versions produce a byte-identical prompt (§8 determinism).

## Test Plan

### New/Modified Tests

1. `packages/core/test/compiler-pressure-sections.test.ts` — qualifying-field fixture updates plus new FACT/EVENT/BELIEF gating and BELIEF-ordering tests.
2. `packages/core/test/golden-first-segment.prompt.txt` — regenerated baseline (consequence of the resolver change; not a test file but the golden verification artifact).

### Commands

1. `npm test -- compiler-pressure-sections`
2. `npm test`
3. `npm run typecheck` — confirm the per-type narrowing type-checks under strict TS.
