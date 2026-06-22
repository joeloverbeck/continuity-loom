# Continuity Loom schema, generation-brief, and record-taxonomy re-audit — pass 2

**Document class:** change-proposal hand-off; not a numbered specification  
**Target repository:** `joeloverbeck/continuity-loom`  
**Target commit:** `a1846efaddfb95c64de8256dc1b8e4780c170844`  
**Audit baseline:** post-implementation state of the first schema audit  
**Verdict date:** 2026-06-20

## 0. Scope and provenance limitation

This document does **not** independently establish that the target commit is the current `main`. It treats the user-supplied commit as the target of record and makes repository-state claims only from manifest-listed files acquired through exact-commit URLs.

The uploaded manifest was used only as a path inventory. Repository metadata, default-branch lookup, branch-name fetches, code search, repository snippets, cloning, prior-chat code, and connector namespace labels were not used as evidence of target-repository state. Mentions of other repositories inside validly fetched files were treated as ordinary file content, not as transport contamination.

Final acquisition result:

```text
Requested repository: joeloverbeck/continuity-loom
Target commit: a1846efaddfb95c64de8256dc1b8e4780c170844
Freshness claim: user-supplied target commit only; not independently verified as latest main
Manifest role: path inventory only
Repository metadata used: no
Default-branch lookup used: no
Branch-name file fetch used: no
Target-repository code search used: no
Clone used: no
URL fetch method: web.open(full exact URL); container.download(full exact URL) for full local copies of mandated documents
Requested file count (unique manifest paths): 132
Successfully verified file count (unique manifest paths): 132
Exact URL entries logged: 178
Fetch-provenance contamination observed: no
Foreign-repository references inside fetched file contents: permitted; not a provenance check
Connector/tool namespace trusted as evidence: no
External research lane: separate from repository evidence
```

The complete append-only URL list is supplied separately as `continuity-loom-exact-commit-fetch-ledger.txt`.

## 1. Executive verdict

The post-pass-1 schema is substantially sound, but it is **not fully clean**. Six changes clear the high evidentiary bar:

1. remove `UNIVERSAL CONTENT POLICY.governing_policy_note`;
2. remove `IMMEDIATE HANDOFF.prior_accepted_prose_status_or_handoff_note`, conditional on an explicit amendment to `FOUNDATIONS.md` §10;
3. retain `CAST VOICE OVERRIDES[].reason` in storage and UI but make it author-only and non-prompt-facing;
4. remove the one-value payload field `FACT.status`;
5. remove `PLAN.can_drive_prose` and make selected-record membership the sole prose-inclusion authority;
6. define one deterministic **effective POV** and make `PROSE MODE.pov_character`, `ACTIVE WORKING SET.selected_pov`, compilation, and validation obey it consistently.

No proposed addition clears the bar. The current system does **not** need a new field or a new record category. The most serious defects are not missing expressivity; they are duplicate or contradictory authority paths.

The six recommendations comprise four stored-field removals, one render-scope correction, and one authority-resolution correction. Only recommendation 2 conflicts with the constitution as currently written. It is therefore explicitly marked `FOUNDATIONS-amendment-required`; it must not be implemented by silently ignoring §10.

### 1.1 Per-surface determination

| Surface | Axis | Verdict | One-line justification |
|---|---|---:|---|
| STORY CONTRACT | all three | unchanged | Its remaining fields establish durable story identity, envelope, register, and setting; the pass-1 fixed-doctrine field is already gone. |
| UNIVERSAL CONTENT POLICY | unnecessary/harmful | **remove** | `governing_policy_note` duplicates immutable external-policy priority as editable story data and cannot truthfully validate the actual provider policy. |
| PROSE MODE | unnecessary/harmful | **modify** | Global `pov_character` and generation `selected_pov` currently create two inconsistent POV authorities, and `variable` can render literally. |
| ACTIVE WORKING SET | unnecessary/harmful | **modify** | Keep `selected_pov`, but make it a conditional per-generation selector under a single effective-POV rule instead of a competing authority. |
| CURRENT AUTHORITATIVE STATE | all three | unchanged | Its fields jointly support current-state compilation, physical validation, perception limits, and continuity locks without future structure. |
| IMMEDIATE HANDOFF | unnecessary/harmful | **remove + amendment-required** | The accepted-prose-named lane duplicates the causal bridge/cut-point lanes, creates clerical boilerplate, and keeps the forbidden source cognitively salient. |
| MANUAL MOMENT DIRECTIVE | all three | unchanged | The must/may/do-not-force triad provides bounded authorial control while retaining canon, physical, POV, reveal, and policy priority. |
| CURRENT CAST VOICE PRESSURE | all three | unchanged | The post-pass-1 shape is a legitimate optional generation-local salience layer; role authority now correctly lives only in the working set. |
| CAST VOICE OVERRIDES | unnecessary/harmful | **modify** | `reason` earns author/UI value but not writer-instruction value; compiling it leaks explanation and possible facts beside the actual override. |
| GENERATION VALIDATION FOCUS | all three | unchanged | Its structured tags activate deterministic checks and remain expressly non-prompt-facing, avoiding plot machinery. |
| STOP GUIDANCE | all three | unchanged | Optional local stop narrowing complements the immutable response-point stop rule and does not impose a plot beat. |
| ENTITY | all three | unchanged | General identity plus non-person material pressure cannot be replaced by cast, status, location, or object records. |
| ENTITY STATUS | all three | unchanged | It supplies operational life, agency, location, visibility, activity, and state needed by live validation. |
| CAST MEMBER | all three | unchanged | Rich durable character structure protects voice, body, behavior, perception, agency, and anti-generic rendering. |
| FACT | unnecessary/harmful | **remove field** | `status` is required but has only one legal value, `active`; active truth is already the category invariant. |
| BELIEF | all three | unchanged | Holder-specific, potentially false or partial mental state is distinct from objective truth and directly protects behavior and POV. |
| SECRET | all three | unchanged | Holder, non-holder, clue, audience, POV, and reveal-permission lanes support deterministic reveal discipline. |
| POV KNOWLEDGE PROFILE | all three | unchanged after POV repair | A derived profile avoids stale duplicated storage and remains essential to non-omniscient generation. |
| AUDIENCE KNOWLEDGE PROFILE | all three | unchanged | Separate audience state enables dramatic irony without granting the POV forbidden knowledge. |
| LOCATION | all three | unchanged | Space, routes, visibility/sound, hazards, shelter, and social constraints support movement and situated behavior. |
| OBJECT | all three | unchanged | Holder, location, visibility, affordance, constraint, and durability fields support physical continuity and author review. |
| VISIBLE AFFORDANCE | all three | unchanged | It expresses current possible action under requirements and risk, not a future event or branch. |
| EVENT | all three | unchanged | Causal history and visibility/knowledge provenance carry past events forward without importing prose. |
| INTENTION | all three | unchanged | Current holder commitment and behavioral pressure preserve intentional action without prescribing outcomes. |
| PLAN | unnecessary/harmful | **remove field** | `can_drive_prose:false` does not stop compilation but does suppress safety checks, making the field deceptive and dangerous. |
| CLOCK | all three | unchanged | Current pressure, trigger, next threshold, and possible effects express local escalation; tick history remains private continuity history. |
| OBLIGATION | all three | unchanged | Terms, parties, urgency, visibility, and breach consequence model normative causal pressure not covered elsewhere. |
| CONSEQUENCE | all three | unchanged | Current/pending effects and contingent next effect connect causes to present pressure without requiring future structure. |
| OPEN THREAD | all three | unchanged | It tracks unresolved pressure while explicitly refusing to command closure; `answer_if_known` remains author-only. |
| RELATIONSHIP | all three | unchanged | Durable relational structure and current expression provide social pressure distinct from transient emotion. |
| EMOTION | all three | unchanged | Current affect, target, cause, intensity, behavioral pressure, surface expression, and regulation preserve local behavior. |
| Whole field set | missing fields | **no addition** | Every researched candidate is already represented compositionally, belongs in private notes, or would create stale/duplicated/plot-rail authority. |
| Whole taxonomy | missing categories | **no addition** | Existing entity, knowledge, material, causal, relationship, and emotion records cover the required state model without planner machinery. |

## 2. Governing method

### 2.1 Field-economy test

Each field was re-derived against `docs/FOUNDATIONS.md` §13. A field earns its place only through at least one concrete function:

- deterministic prompt compilation;
- deterministic validation;
- continuity interpretation;
- character voice or behavior preservation;
- prose-quality protection; or
- authorial control.

Compilation by itself was not treated as proof of value. A field can literally render and still fail §13 when the rendered material is duplicate authority, misleading metadata, irrelevant context, or a control that the compiler does not actually honor. Conversely, an intentionally non-prompt-facing field was retained when it demonstrably supports authoring, validation, continuity history, or UI review.

### 2.2 Harm tests

Every field and category was checked for the four brief-defined failure modes:

1. prose degradation or over-constraint;
2. author/agent misdirection through dead destinations, circular checks, or false guidance;
3. contamination or hidden state, especially accepted/candidate/auto-derived prose;
4. generator bias or event forcing that approaches §12 plot machinery.

### 2.3 Evidence order

Target-repository findings were derived from the active authority documents first, then checked against the exact-commit Zod schemas, compiler resolvers, field guidance, validation rules, tests, UI descriptors, and server migration/storage seams. The first-pass change proposal and its “unchanged” findings were treated as precedent to engage, not as authority immune to revision.

External research was used directionally. It supports the value of relevant context, explicit character/mental-state representation, and the distinction between local causal records and autonomous narrative planning. It is not used to claim what exists in this repository, and the context studies are not presented as a direct A/B test of Continuity Loom’s prose prompt.

## 3. Recommended change 1 — remove `UNIVERSAL CONTENT POLICY.governing_policy_note`

### 3.1 Exact surface and failure mode

- **Field path:** `storyConfig.universalContentPolicy.governing_policy_note`
- **Concern axis:** unnecessary/harmful field
- **Primary harm:** (ii) misleading or duplicate authority
- **Secondary harm:** (i) prompt clutter and possible instruction conflict
- **Constitutional amendment:** not required

### 3.2 Existing rationale, engaged

`docs/prompt-template-rationale.md` §3 defends five story-specific content-policy fields on the ground that maturity permission, tonal handling, provider-policy priority, and character-bias handling are separate concerns. The first pass retained `governing_policy_note`, describing it as the field that preserves provider/platform policy as the outer boundary. The compiler contract promises a live `{governing_policy_note}` destination and says governing policy remains first authority.

That defense is correct about **priority** but wrong about **where the priority belongs**. Provider/platform policy is an external invariant, not user-authored story state. The prompt already contains the fixed sentence that the story envelope “does not override governing external model/platform policy,” and the authority hierarchy already places external policy above story pressure. Making the user restate that doctrine in a required free-prose field creates a second, editable representation of an authority the user cannot define.

### 3.3 Repository evidence and determination

At the target commit:

- `packages/core/src/records/global-config.ts` requires the field in a strict Zod object.
- `packages/core/src/compiler/sections/front.ts` renders it directly into `{governing_policy_note}`.
- `packages/core/src/validation/rules/universal-completeness.ts` blocks when it is blank and claims the prompt needs “provider-policy handling.”
- `packages/core/src/records/field-guidance-brief-config.ts` tells the author to enter a “Provider or platform policy note that outranks story pressure.”
- `docs/prompt-template.md` already states the immutable policy boundary separately, after the editable fields.
- No deterministic rule can verify that arbitrary user prose accurately reflects the currently selected model/provider policy.

The field therefore repeats fixed doctrine while implying that user-authored text can accurately specify an external governing policy. This is the same field-economy class as the already removed `STORY CONTRACT.continuity_philosophy`: a constitutional literal presented as project data. The other four content-policy fields remain distinct and valuable because they express actual story choices.

**Determination:** remove the field and its placeholder. Keep the immutable external-policy sentence in the template and authority hierarchy.

### 3.4 Target core shape

```ts
export const universalContentPolicySchema = z
  .object({
    rating_label: nonemptyString,
    allowed_content_scope: nonemptyString,
    tonal_handling: nonemptyString,
    character_bias_handling: nonemptyString,
  })
  .strict();
```

The draft story-config shape must remove the same key. Do not retain an alias, compatibility property, hidden fallback, or provider-specific policy cache in project data.

### 3.5 Code cascade

#### `@loom/core`

Update at least:

- `packages/core/src/records/global-config.ts`;
- `story-config-descriptors.ts`;
- `field-guidance-brief-config.ts`;
- field-path enumeration and coverage expectations;
- `packages/core/src/compiler/placeholder-map.ts`;
- `packages/core/src/compiler/template-constants.ts` and `empty-states.ts` if they carry the placeholder;
- `packages/core/src/compiler/sections/front.ts`;
- `packages/core/src/validation/rules/universal-completeness.ts`;
- compile-destination, guidance, scaffold, conformance, and golden tests;
- demo story configuration and fixtures.

The completeness rule must require the four remaining policy fields and must stop claiming that a user-entered provider-policy note is necessary. This is not a request to weaken the external policy boundary; the fixed prompt text remains mandatory. There is no record-registry change because this is global configuration. Update all demo fixtures and demo golden inputs that construct universal content policy.

#### `@loom/web`

Remove the input from `StoryConfigEditor`, its display label/help content, requiredness marker, tests, and any API typing generated from the core schema. Preserve clear UI language that story settings cannot override provider/platform policy.

#### `@loom/server`

Extend `packages/server/src/global-config-migration.ts`. The current migration already strips retired STORY CONTRACT keys before strict parsing. Add an idempotent transformation that removes `universalContentPolicy.governing_policy_note` from both live story-config storage and any supported orphan/legacy global-config payload path before parsing with the new strict schema.

The migration must:

- run transactionally during project open/create in the established package-boundary order;
- preserve sibling values byte-for-byte except for canonical JSON serialization already required by the storage layer;
- be idempotent;
- roll back and report the affected project/config row on malformed JSON or failed post-transform validation;
- never manufacture replacement policy prose.

### 3.6 Authority-doc and prompt synchronization

Same-change updates are required in:

- `docs/story-record-schema.md` §2.2: list four fields and explain external policy priority as fixed template doctrine, not story data;
- `docs/compiler-contract.md`: delete the placeholder row and any completeness/empty-state rule for it;
- `docs/prompt-template.md`: delete `Governing policy note: {governing_policy_note}` and retain the static external-policy sentence;
- `docs/prompt-template-rationale.md` §3: distinguish story-authored envelope fields from immutable external policy priority;
- `docs/validation-rule-inventory.md`: remove the field-level presence requirement and update the story-config completeness wording.

No other prompt prose should be audited or rewritten under this change.

### 3.7 Ideation-template and golden consequence

The ideation compiler shares story-config serialization. Remove the same field/placeholder from `docs/ideation-prompt-template.md` only where that template currently exposes it, and update `packages/core/test/golden-ideation.prompt.txt`. The fixed provider-policy boundary remains. Prose and ideation goldens should show only the removed label/value, not unrelated wording churn.

### 3.8 Required verification

Tests must prove:

- new strict schemas reject the retired key after migration;
- old projects containing the key open successfully after deterministic stripping;
- migration is idempotent and rollback-safe;
- preview and generation still block for genuinely missing remaining policy fields;
- prompt and ideation output retain the static external-policy boundary;
- no placeholder or guidance entry advertises the retired destination;
- the external-policy sentence is present in template-conformance tests.

### 3.9 `FOUNDATIONS.md` §29 clearance

- **§29.1–29.2:** no autonomous plot decision, LLM mutation, or prose-derived canon.
- **§29.3:** active working set behavior is untouched.
- **§29.4:** compilation remains deterministic and preserves the universal content-policy section; only a duplicate user field is removed.
- **§29.5:** fail-closed policy-envelope validation remains through the actual story fields and fixed hierarchy.
- **§29.6–29.8:** POV, reveals, physical continuity, and accepted prose are unchanged.
- **§29.9–29.10:** no key, logging, network, or ownership change.
- **§29.11:** clerical burden and duplicate authority decrease.
- **§29.12:** private notes remain isolated.

## 4. Recommended change 2 — remove `IMMEDIATE HANDOFF.prior_accepted_prose_status_or_handoff_note`

### 4.1 Exact surface and failure mode

- **Field path:** `generationSession.immediate_handoff.prior_accepted_prose_status_or_handoff_note`
- **Concern axis:** unnecessary/harmful field
- **Primary harms:** (ii) misleading/duplicate authority and (iii) accepted-prose contamination pressure
- **Secondary harm:** (i) repeated bridge text and boilerplate
- **Constitutional status:** **`FOUNDATIONS-amendment-required`**

### 4.2 Existing rationale, engaged

The constitution’s §10 explicitly calls this “the correct generation-time field.” `docs/prompt-template-rationale.md` §§5–6 and the first-pass proposal defend it as a deliberately narrow firewall: `None` for no prior prose, otherwise a user-authored bridge that prevents authors from pasting accepted prose. The first pass warned that removal could weaken continuation clarity or pressure authors toward forbidden copying.

That rationale correctly rejects accepted-prose summaries and preserves a user-authored handoff. It does not establish that a **fourth handoff lane named after accepted prose** performs a unique function.

### 4.3 Repository evidence and less-deferential determination

At the target commit, immediate handoff already contains three functional lanes:

- `recent_causal_context`: the user-authored causal bridge;
- `last_visible_moment`: the final visible/sensory cutpoint;
- `begin_after`: the exact launch instruction.

The disputed field is described in guidance as optional and suitable for `None`, yet `universal-completeness.ts` requires all four handoff values for every continuation. This contradicts `docs/story-record-schema.md` §3.3, which says a continuation needs a recent causal bridge and **either** a last visible moment **or** a begin-after point. The field has therefore become mandatory clerical text in practice, not a narrow optional firewall.

Its two plausible content functions are already owned:

- a “user-authored continuity bridge” duplicates `recent_causal_context`;
- a “causal hinge or begin-after point” duplicates `last_visible_moment` or `begin_after`.

Its safety function is also weaker than the rationale claims. `universal-blockers.ts` detects a small list of lexical contamination markers; it cannot establish the provenance of pasted or paraphrased prose. Naming a prompt-facing field after accepted prose keeps the forbidden source in the author’s immediate task model, while the prompt already includes explicit fixed instructions not to include, quote, mine, or infer canon from accepted prose.

The constitution itself states that allowed continuation material is recent causal context, last visible moment, begin-exactly-after guidance, current state, manual directive, and selected records. Those are sufficient. External context research also points toward removing irrelevant or duplicative context rather than creating another lane whose ordinary value is `None` [E1][E2].

**Determination:** remove the field, preserve the three functional handoff lanes, correct continuation readiness, and strengthen the static accepted-prose prohibition. Because current §10 mandates the field by name, implementation is forbidden until the constitution is amended explicitly.

### 4.4 Required constitutional amendment

**Flag:** `FOUNDATIONS-amendment-required`

**Conflict:** `docs/FOUNDATIONS.md` §10 says:

- prompt/schema/compiler surfaces must not name a field as accepted prose or accepted-prose summary;
- then expressly names `prior_accepted_prose_status_or_handoff_note` as the correct exception.

Amend §10 in the same authoritative change to remove that exception and replace it with the stronger invariant:

> No prompt-facing schema field may use accepted prose, rejected candidates, superseded candidates, or automatic prose-derived summaries as its source. Continuation launch must use user-authored recent causal context plus a visible or imperative cutpoint, grounded in selected records and current authoritative state.

Preserve every other §10 rule: accepted prose remains excluded; durable change still must be written into records/current state; no archive mining, summaries, phrase reuse, or hidden inference is introduced.

This amendment sharpens the no-accepted-prose doctrine. It does not loosen it.

### 4.5 Target core shapes and readiness rule

Ready shape:

```ts
export const immediateHandoffSchema = z
  .object({
    recent_causal_context: nonemptyString,
    last_visible_moment: nonemptyString.optional(),
    begin_after: nonemptyString.optional(),
  })
  .strict()
  .superRefine((handoff, ctx) => {
    if (!handoff.last_visible_moment && !handoff.begin_after) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A continuation needs last_visible_moment or begin_after.",
      });
    }
  });
```

The actual repository separates draftability and readiness; therefore the cross-field rule should live in the ready-input normalization/readiness layer rather than making ordinary draft storage unsaveable. The coherent target behavior is:

- `first_segment`: all three fields may be absent/blank and deterministic empty/omission behavior applies;
- `continuation_after_accepted_segment`: `recent_causal_context` is required and at least one of `last_visible_moment` or `begin_after` is required;
- no ready input may contain accepted/candidate/auto-derived prose in any remaining prompt-facing handoff lane.

### 4.6 Code cascade

#### `@loom/core`

Update:

- `generation-brief.ts`, `generation-brief-draft.ts`, and `generation-brief-readiness.ts`;
- generation-brief descriptors, display labels, field paths, guidance, and coverage tests;
- `placeholder-map.ts`, `template-constants.ts`, and `empty-states.ts`;
- `compiler/sections/front.ts`;
- `validation/rules/universal-completeness.ts`;
- `validation/rules/universal-blockers.ts` and any contamination-field enumerator;
- prompt-kind applicability only if diagnostic codes change;
- demo fixtures, compiler scaffold/front/golden tests, readiness tests, contamination tests, and schema cleanup capstones.

Delete the resolver and placeholder. Do **not** replace it with an automatic summary, accepted-segment lookup, latest-prose cache, inferred handoff, or hidden fallback.

`validateGenerationBriefSurfaces` must implement the documented bridge-plus-either-cutpoint rule instead of requiring four nonblank strings. The contamination scanner should continue to inspect `recent_causal_context`, `last_visible_moment`, `begin_after`, manual directives, stop guidance, and any other genuinely prompt-facing user instruction lanes. There is no record-registry change because immediate handoff is generation-session state. Update all demo generation-session fixtures and blocker recipes that currently populate the retired lane.

#### `@loom/web`

Remove the editor row, help, requiredness display, section-fill calculation, and tests. The UI should explain continuation readiness directly:

- “Recent causal context” is required;
- “Last visible moment” or “Begin after” is required;
- accepted prose must not be pasted or summarized.

This is clearer than asking the author to fill a separate accepted-prose-status row.

#### `@loom/server`

Extend `packages/server/src/generation-session-draft-migration.ts`, which already strips retired pass-1 generation-brief keys. Remove the legacy handoff key before parsing with the new strict draft schema.

The migration must be transactional, idempotent, sibling-preserving, and rollback-safe. It must not copy the retired value into `recent_causal_context`: that would guess at semantic equivalence and could preserve contaminated text. Existing values in the three retained lanes remain untouched.

### 4.7 Authority-doc and prompt synchronization

Update in the same change:

- `docs/FOUNDATIONS.md` §10 — mandatory amendment above;
- `docs/story-record-schema.md` §§3.3 and 10;
- `docs/compiler-contract.md` placeholder table, first-segment/continuation matrix, omission rules, and accepted-prose firewall wording;
- `docs/prompt-template.md` — delete the label and placeholder, retain the fixed no-accepted-prose instructions;
- `docs/prompt-template-rationale.md` §§5–6 — explain that the causal bridge and cutpoint are sufficient and that naming accepted prose is itself avoided;
- `docs/validation-rule-inventory.md` — document the corrected conditional readiness rule and contamination scan.

No unrelated prompt prose should change.

### 4.8 Ideation-template and golden consequence

The ideation path shares front/handoff serialization. Remove the lane wherever ideation currently renders it and update the ideation golden. If ideation does not require continuation handoff, keep its existing readiness applicability; do not make prose-only handoff blockers gate ideation merely because the schema changed.

Both prose and ideation goldens must retain the fixed statement that accepted prose is not prompt context. Only the retired field label/value should disappear.

### 4.9 Required verification

Add tests proving:

- first segment can reach readiness without any handoff field;
- continuation blocks without `recent_causal_context`;
- continuation blocks without both cutpoint fields;
- continuation succeeds with causal context plus either cutpoint;
- contamination markers in any retained prompt-facing handoff lane still block;
- no compiler path, placeholder, empty state, UI row, or guidance entry mentions the retired key;
- migration strips old keys without copying their values elsewhere;
- accepted-prose archive tests still prove no accepted segment content enters prompt snapshots;
- prompt output contains the static firewall but no accepted-prose-named input lane.

### 4.10 Post-amendment §29 clearance

Before amendment, the change cannot be considered aligned because it contradicts explicit §10 text. After the amendment:

- **§29.1–29.2:** the change further prevents prose from becoming canon or hidden source state.
- **§29.3:** selected records remain explicit.
- **§29.4:** prompt compilation stays deterministic and includes no accepted prose.
- **§29.5:** readiness becomes more accurately fail-closed: causal bridge plus cutpoint, rather than four arbitrary strings.
- **§29.6–29.7:** POV/reveal and physical continuity remain grounded in records/current state.
- **§29.8:** the archive remains review-only and excluded from prompt context.
- **§29.9–29.10:** no logging, key, network, or ownership change.
- **§29.11:** clerical friction falls while continuation clarity is preserved.
- **§29.12:** private notes remain isolated.

## 5. Recommended change 3 — make `CAST VOICE OVERRIDES[].reason` author-only

### 5.1 Exact surface and failure mode

- **Field path:** `generationSession.cast_voice_overrides[].reason`
- **Concern axis:** unnecessary/harmful prompt content
- **Verdict:** retain the stored field; remove its prompt destination
- **Primary harm:** (i) prose degradation through explanatory leakage
- **Secondary harms:** (ii) misleading field guidance and (iii) accidental hidden-fact/context leakage
- **Constitutional amendment:** not required

### 5.2 Existing rationale, engaged

`docs/prompt-template-rationale.md` §11 defends the override object as target, reason, affected functions, and override text. The first pass correctly removed the fixed `scope` literal but retained `reason`, noting its value for author understanding “even if not always prompt-facing.”

The code does not implement that cautious qualification. `packages/core/src/compiler/sections/cast.ts` prints `reason` in every rendered current-generation override for active/full and present-minor cast. `field-guidance-brief-config.ts` advertises active prompt destinations for it, and `universal-blockers.ts` includes it in the prompt-facing content-envelope scan. It is therefore always treated as writer instruction text.

The rationale is persuasive that an author may need to remember **why** a temporary override exists. It does not show that the external prose writer needs the explanation. `applies_to` defines the affected surface, and `override_text` defines the operative instruction. A reason such as “because the previous accepted segment made him sound too warm,” “because she is secretly the saboteur,” or “to fix model tendency” can leak process notes, forbidden source references, or facts that should instead live in records/current state. Even a benign explanation adds non-operative prose beside a precise voice instruction.

### 5.3 Determination and target semantics

Keep the field because it earns an authorial-control and UI-maintenance function. Make it explicitly non-prompt-facing:

```ts
export const castVoiceOverridesSchema = z
  .object({
    cast_member_id: recordId,
    reason: z.union([nonemptyString, z.literal("none")]),
    applies_to: z.array(castVoiceOverrideFunctionSchema),
    override_text: nonemptyString,
  })
  .strict();
```

The Zod shape is unchanged. The semantic contract changes:

- `reason` is private generation-session authoring metadata visible in the editor and prompt-inspection provenance UI only as noncompiled metadata;
- `applies_to` and `override_text` are the prompt-facing override;
- any fact needed by the writer must be represented in selected records, current state, current voice pressure, or the override text itself;
- no compiler path may concatenate `reason` into a voice pin, full dossier, compressed note, ideation prompt, or provider request.

### 5.4 Code cascade

#### `@loom/core`

In `packages/core/src/compiler/sections/cast.ts`, change the coherent override renderer from a four-part explanation to the operative instruction only. Conceptually:

```ts
function overrideLines(
  generationSession: GenerationSession,
  castMemberId: string,
  castBand: RenderedCastBand,
): string[] {
  if (castBand === "offstage_relevant_cast") return [];

  return generationSession.cast_voice_overrides
    .filter((override) => override.cast_member_id === castMemberId)
    .map((override) =>
      compactParts([
        "Current generation voice override",
        labelValue("applies to", override.applies_to),
        override.override_text,
      ]),
    );
}
```

Update:

- `field-guidance-brief-config.ts`: `promptFacing: "never"`, no prompt destinations, authoring/validation role text;
- compile-destination assertions and guidance coverage;
- `universal-blockers.ts`: remove `entry.reason` from `promptFacingUserInstructionText` and any prompt-contamination enumeration;
- compiler cast-section and golden tests;
- prompt audit/inspection metadata tests so the field is not mistaken for provider-bound text.

The reason may still be checked structurally by Zod. Do not attempt semantic validation of whether it is a “good reason.” There is no record-registry change. Update demo/compiler fixtures containing overrides so their expected provider-bound text omits the reason while saved draft data retains it.

#### `@loom/web`

Retain the editor input and label it plainly as author-only, for example: “Reason (not sent to the writer).” Prompt preview must demonstrate that changing only the reason does not change compiled prose or ideation prompts. Keep the value in saved drafts.

#### `@loom/server`

No storage migration is required because the field remains in the strict schema. API and persistence shapes remain stable. Add a regression test that a saved reason survives round-trip while provider-bound prompt text remains unchanged.

### 5.5 Authority-doc and prompt synchronization

Update:

- `docs/story-record-schema.md` §3.6: identify `reason` as authoring-only and name only `applies_to` plus `override_text` as compiled content;
- `docs/compiler-contract.md`: remove `reason` from override serialization and state its non-prompt role;
- `docs/prompt-template-rationale.md` §11: retain the value of author explanation but reject forwarding it to the writer;
- `docs/validation-rule-inventory.md`: remove it from prompt-facing policy/contamination text scans;
- field guidance and destination documentation.

No placeholder is added, renamed, or deleted. `docs/prompt-template.md` should not need direct wording changes unless it currently documents the serialized subfields.

### 5.6 Ideation-template and golden consequence

The ideation compiler shares cast serializers. It must omit `reason` as well. Update both prose and ideation goldens where override fixtures contain a reason. The same stored snapshot with only a reason change must produce byte-identical prompt output and the same compiler fingerprint if fingerprints are computed from compiled prompt material rather than all draft metadata. If the current fingerprint intentionally covers all input state, document that distinction rather than allowing the reason into prompt bytes.

### 5.7 Required verification

- reason persists through draft save/load;
- reason appears in the authoring UI with a non-prompt badge/help text;
- reason never appears in prose prompt, ideation prompt, OpenRouter request, or prompt preview;
- `applies_to` and `override_text` continue to render for active/full and present-minor cast;
- offstage override behavior remains unchanged;
- content-envelope validation evaluates the actual prompt-facing override text, not the private reason;
- guidance coverage marks the field non-prompt-facing.

### 5.8 `FOUNDATIONS.md` §29 clearance

- **§29.1–29.4:** no plot decision, hidden selection, or nondeterminism; prompt transparency improves because provider-bound text matches documented destinations.
- **§29.5–29.6:** operative override text remains subject to canon, policy, POV, and reveal checks; private rationale cannot accidentally grant knowledge.
- **§29.7–29.8:** physical state and accepted-prose exclusion are strengthened, not weakened.
- **§29.9–29.10:** no secret/log/network/storage-boundary change.
- **§29.11:** author maintainability is preserved while irrelevant prompt context is removed.
- **§29.12:** this field remains generation-session metadata, not an author-private note and not a source for notes.

## 6. Recommended change 4 — remove `FACT.status`

### 6.1 Exact surface and failure mode

- **Field path:** `FACT.status`
- **Concern axis:** unnecessary/harmful field
- **Primary harm:** (ii) tautological, misleading schema surface
- **Secondary harm:** avoidable authoring/UI/storage friction
- **Constitutional amendment:** not required

### 6.2 Evidence and determination

`packages/core/src/records/knowledge.ts` defines:

```ts
export const factStatusValues = ["active"] as const;
```

and nevertheless requires every FACT payload to carry `status: z.enum(factStatusValues)`. `docs/story-record-schema.md` §6.1 likewise lists only `status: active` and immediately explains that supersession is a diagnostic, not a persistent FACT status. `FOUNDATIONS.md` §14 establishes the same category rule: a plain FACT represents active truth; when it ceases to be true, revise, remove, or replace it rather than preserving a false record as inactive canon.

The compiler does not use the field to select or phrase facts. The value cannot distinguish two valid states, cannot express author control, and cannot back a meaningful validation decision beyond “the fixed literal was entered.” Showing it in record editors/grids falsely suggests a lifecycle choice that does not exist.

The first pass correctly retained the FACT category but did not challenge this one-value payload field. The category earns its place; the field does not.

**Determination:** remove `FACT.status` from stored payloads. Keep “active” as the record type’s implicit projected status where generic registry/table APIs require a status value.

### 6.3 Target core shape

```ts
export const factSchema = z
  .object({
    id: recordId,
    fact_kind: z.enum([
      "hard_canon",
      "current_state",
      "setting_fact",
      "discovered_fact",
    ]),
    statement: nonemptyString,
    scope: z.enum([
      "global",
      "entity",
      "location",
      "object",
      "relationship",
      "current_segment",
    ]),
    known_by: z.union([
      z.array(recordId),
      z.enum(["public", "unknown", "not_applicable"]),
    ]),
    audience_visibility: z.enum([
      "hidden",
      "implied",
      "explicit",
      "not_applicable",
    ]),
    salience: z.enum(["low", "medium", "high", "critical"]),
  })
  .strict();
```

Registry definition:

```ts
{
  recordType: "FACT",
  payloadSchema: factSchema,
  statusValues: ["active"] as const,
  projectStatus: () => "active" as const,
  // existing salience and reference projection
}
```

`statusValues` may remain registry metadata for generic presentation/filtering. It must not be reintroduced into the payload or editable form.

### 6.4 Code cascade

#### `@loom/core`

Update:

- `records/knowledge.ts` and inferred `Fact` type;
- `records/registry.ts` integration if status projection assumes a payload key;
- `editor-descriptors.ts` and generic record form descriptors;
- `column-manifest.ts` so no editable/payload status column is advertised for FACT;
- `field-guidance-records.ts`, field paths, destination coverage, fixture factories, demo data, and schema tests;
- any tests that construct FACT payloads with `status`;
- record-grid tests that should still show implicit active status only if the product deliberately exposes registry metadata.

Compiler behavior should not change. `compiler/sections/front.ts`, `pressure.ts`, `records-tail.ts`, and ideation serializers already select FACTs by fact kind, scope, knowledge, visibility, salience, and working-set membership, not by payload status.

#### `@loom/web`

Remove the FACT status input and any dropdown containing a single option. If the records grid has a generic status column, either render the registry-projected read-only `active` value or omit the column for FACT according to the existing column-manifest policy. Do not fake an editable control to satisfy generic UI code.

#### `@loom/server`

Add a deterministic record-payload cleanup migration, preferably a general exact-key removal migration that can also carry recommendation 5. For each FACT row:

1. parse `payload_json` inside a transaction;
2. delete only the top-level `status` key;
3. validate the transformed payload with the new strict FACT parser;
4. write canonical JSON only when changed;
5. preserve row id, record type, display label, metadata, timestamps under the repository’s established policy, and every sibling payload field;
6. roll back the complete migration on malformed JSON or failed validation;
7. be idempotent.

Run it after record tables and display-label backfill exist but before `RecordRepository` performs strict reads in both create/open paths in `project-store.ts`.

### 6.5 Authority-doc and prompt synchronization

Update:

- `docs/story-record-schema.md` §6.1: remove the field and state that FACT active status is an implicit category invariant;
- `docs/prompt-template-rationale.md` §15 only as needed to clarify that FACT grouping is unaffected;
- `docs/compiler-contract.md` only if it currently enumerates the payload status; no placeholder changes are required;
- `docs/validation-rule-inventory.md` only if a rule names the field;
- field guidance and record editor documentation.

The prose prompt and its template should be byte-identical for equivalent migrated data. Any prompt change indicates accidental dependence and should fail the implementation.

### 6.6 Ideation-template and golden consequence

No semantic prompt change is intended. The ideation template and ideation golden must remain byte-identical after fixtures are migrated, except for any non-prompt test serialization snapshot that intentionally shows raw record JSON. Add byte-stability tests for prose and ideation compilation from pre/post-migration equivalent snapshots.

### 6.7 Required verification

- new FACT payloads contain no `status` key;
- legacy FACT rows migrate and open;
- migration is transactional and idempotent;
- malformed payloads roll back with an actionable error;
- compiler output and fingerprints for equivalent semantic state do not change;
- generic status filtering/presentation still treats FACT as active if required;
- no UI offers a one-choice status control;
- no alias accepts `status` after migration.

### 6.8 `FOUNDATIONS.md` §29 clearance

- **§29.1–29.4:** no narrative-planning, active-set, or compiler behavior changes.
- **§29.5:** validation remains fail-closed; the category invariant becomes impossible to mis-enter.
- **§29.6–29.8:** knowledge/reveal and accepted-prose boundaries are unchanged.
- **§29.9–29.10:** migration is local, transactional, and does not touch keys/network/logging.
- **§29.11:** atomic record creation is faster and less misleading.
- **§29.12:** private notes remain isolated.

## 7. Recommended change 5 — remove `PLAN.can_drive_prose`

### 7.1 Exact surface and failure mode

- **Field path:** `PLAN.can_drive_prose`
- **Concern axis:** unnecessary/harmful field
- **Primary harm:** (ii) false authorial control and validation misdirection
- **Secondary harm:** (iv) a hidden secondary prose-inclusion gate that weakens safety
- **Constitutional amendment:** not required

### 7.2 Existing rationale, engaged

The field guidance treats `can_drive_prose` as a non-prompt operational flag indicating whether a plan may drive local prose. The first pass grouped it with legitimate authoring/validation metadata and retained it. That verdict would be defensible only if the compiler and validators obeyed the same gate.

They do not.

### 7.3 Repository evidence and determination

At the target commit:

- `packages/core/src/records/causal-pressure.ts` requires the boolean in every PLAN payload.
- `packages/core/src/compiler/sections/pressure.ts` renders every selected PLAN whose `plan_status` is `active` into both the compact action-pressure lane and the full active-plans lane. It never checks `can_drive_prose`.
- `packages/core/src/validation/rules/universal-blockers.ts` explicitly returns early when `can_drive_prose === false`, suppressing the inactive/incapacitated/dead/offstage holder blocker.
- referential applicability similarly treats the field as a reason not to require the selected holder except under hidden-plan focus.

The result is internally contradictory: a selected active plan marked `false` still reaches the writer and can shape prose, while the field disables checks intended to prove that its holder can plausibly act. This is worse than a dead destination. It gives the author a control the compiler ignores and lets an active prompt pressure bypass a safety floor.

The constitution already provides the correct authority: explicit working-set selection controls prompt inclusion. A selected active PLAN is allowed to pressure prose; an unselected plan is absent. A second payload boolean creates duplicate authority and invites the exact silent-inclusion ambiguity §29.3 rejects.

**Determination:** remove the field. Apply holder/reference/means checks to every selected active PLAN. Keep `fallback_steps` author-only: it supports continuity interpretation and the existing plausible-means check without compiling multiple future options.

### 7.4 Target core shape

```ts
export const planSchema = z
  .object({
    id: recordId,
    plan_status: z.enum(planStatusValues),
    holder: recordId,
    objective: nonemptyString,
    resources: z.array(nonemptyString).default([]),
    blockers: z.array(nonemptyString).default([]),
    current_step: nonemptyString,
    fallback_steps: z.array(nonemptyString).default([]),
    visibility_to_pov: z.enum(["visible", "hidden", "suspected", "known"]),
    salience: salienceEnum,
  })
  .strict();
```

Prompt rule:

> A selected PLAN with `plan_status: active` is eligible for deterministic plan pressure. `selected_records` is the only inclusion gate. No payload field silently overrides working-set selection.

### 7.5 Code cascade

#### `@loom/core`

Update:

- `records/causal-pressure.ts` and inferred types;
- record guidance, editor descriptors, column manifests, field paths, fixtures, and schema tests;
- `validation/rules/universal-blockers.ts`: delete the `payload.can_drive_prose === false` bypass from `validateActivePlanHolders`;
- internal reference applicability: every selected active PLAN holder is a required selected ENTITY/CAST MEMBER reference;
- any warnings/rules that distinguish plans by the retired boolean;
- validation inventory mapping tests and PLAN regression cases.

Compiler code should remain intentionally unchanged: it already implements the desired selected-active behavior. Add a test to make that intention explicit rather than adding a new hidden filter. The PLAN registry definition keeps its existing status, salience, and holder-reference projections with only the payload type narrowed. Update demo PLAN fixtures and stress recipes by deleting the boolean.

`hasPlausibleMeans` may continue to consider `resources`, `fallback_steps`, and a current step that explicitly uses remote/delegated means. `fallback_steps` must remain non-prompt-facing until a fallback becomes the current step or current state; this preserves §12’s no-options/no-rail boundary.

#### `@loom/web`

Remove the boolean control and guidance. Replace any “Can drive prose” explanation with working-set selection guidance: select a plan when it is current authority for this generation; deselect it when it should not pressure the writer.

#### `@loom/server`

Use the same transactional record-payload cleanup migration described for FACT. For PLAN rows, remove only `can_drive_prose`, validate with the new strict schema, and preserve all siblings. Run before strict repository hydration. Include mixed FACT/PLAN transaction tests so one malformed row rolls back all changes.

### 7.6 Authority-doc and prompt synchronization

Update:

- `docs/story-record-schema.md` §8.3: remove the field; state selected-record membership is the prompt gate; revise holder-selection validation language;
- `docs/compiler-contract.md`: state selected active PLAN inclusion and remove any operational-flag claim;
- `docs/prompt-template-rationale.md` causal-pressure sections only as required to identify active-set authority;
- `docs/validation-rule-inventory.md`: make holder/reference/means blockers apply to every selected active plan;
- field guidance and editor documentation.

No placeholder or prompt-template wording change is needed. Equivalent migrated data should compile identically.

### 7.7 Ideation-template and golden consequence

No prompt bytes should change for equivalent selected records. Ideation and prose goldens must remain byte-identical after fixture cleanup. Add a regression proving a selected active plan formerly marked `false` already rendered before the change and still renders after it, but now receives the same referential/holder safety checks as every other active plan.

### 7.8 Required verification

- legacy PLAN rows migrate without data loss;
- no schema, UI, guidance, or API surface accepts the retired key;
- every selected active PLAN holder must resolve to a selected ENTITY/CAST MEMBER;
- dead/incapacitated/offstage holders block unless the plan has deterministically represented plausible means;
- unselected plans never enter the validation snapshot/compiler through this change;
- selected active plans compile exactly as before;
- inactive/blocked/suspended/fulfilled/failed/abandoned/revised status behavior remains governed by existing compiler rules;
- `fallback_steps` stays absent from provider-bound prompts.

### 7.9 `FOUNDATIONS.md` §29 clearance

- **§29.1:** removing a secondary gate makes PLAN less like plot machinery, not more.
- **§29.2:** no automatic mutation or planning.
- **§29.3:** selected-record membership becomes the sole, inspectable inclusion authority.
- **§29.4:** deterministic compiler behavior is unchanged.
- **§29.5:** impossible agency and missing-holder conditions fail closed more consistently.
- **§29.6:** hidden-plan visibility remains explicit and does not grant POV knowledge.
- **§29.7:** physical agency/route plausibility is strengthened.
- **§29.8–29.10:** no accepted-prose, logging, key, network, or ownership change.
- **§29.11:** removes a deceptive toggle and improves validation legibility.
- **§29.12:** private notes remain isolated.

## 8. Recommended change 6 — establish one deterministic effective POV

### 8.1 Exact surface and failure mode

- **Joint field paths:** `storyConfig.proseMode.pov_character` and `generationSession.active_working_set.selected_pov`
- **Concern axis:** unnecessary/harmful duplicate authority
- **Primary harms:** (i) contradictory POV rendering and (ii) false destination/authority guidance
- **Secondary harm:** (iii) hidden divergence between prompt sections and validation consumers
- **Constitutional amendment:** not required

### 8.2 Existing rationale and first-pass verdict, engaged

The schema intends two useful concepts:

- a durable prose-mode setting, which may be a fixed entity, `omniscient`, or `variable`;
- a generation-time selected POV, which identifies the concrete viewpoint for the current active working set.

The first pass retained `selected_pov` because it appeared to back reference resolution, POV validation, prompt inspection, and `{pov_character}` compilation. `field-guidance-brief-config.ts` explicitly says it targets `{pov_character}`. The compiler contract promises the placeholder from PROSE MODE and says `variable` renders literally.

The concepts can coexist, but the current implementation never defines their authority relationship.

### 8.3 Repository evidence and determination

At the target commit:

- `global-config.ts` allows `PROSE MODE.pov_character` to be a record id, `omniscient`, or `variable`.
- `generation-brief.ts` allows `selected_pov` to be a record id or `omniscient`, but not `variable`.
- `story-record-schema.md` §3.1 correctly lists the latter shape, then incorrectly says `selected_pov` may be `omniscient` or `variable`.
- `compiler/sections/front.ts::renderPovCharacter` ignores `active_working_set.selected_pov` and renders only global `proseMode.pov_character`; the literal string `variable` can therefore reach the prose writer.
- The same file’s POV knowledge/reveal renderers use only generation `selected_pov`.
- Other validation rules use `selected_pov ?? proseMode.pov_character`.
- No single rule blocks a fixed global POV from conflicting with a different generation selected POV.

A valid snapshot can consequently tell the writer `POV: variable` while building knowledge lanes from a specific person, or tell the role block one fixed POV while secret/knowledge validation uses another. This directly threatens §29.6 and is a SPEC-024-style misleading-destination defect: field guidance promises a destination that the resolver does not use.

**Determination:** keep both fields but assign distinct roles under one pure deterministic resolver. Global `variable` is a configuration sentinel, never prompt text. Generation `selected_pov` is required only to instantiate that sentinel. A fixed global POV remains authoritative and cannot be silently overridden.

### 8.4 Target schema and semantic contract

The stored Zod shapes remain intentionally distinct:

```ts
export const proseModeSchema = z
  .object({
    pov_character: z.union([recordId, z.enum(["omniscient", "variable"])]),
    // existing prose-mode fields
  })
  .strict();

const activeWorkingSetReadySchema = z
  .object({
    // existing working-set fields
    selected_pov: z.union([recordId, z.literal("omniscient")]).optional(),
  })
  .strict();
```

Do not add `variable` to `selected_pov`; it is a configuration sentinel, not a concrete generation choice. Do not remove either field: fixed projects need durable POV authority, while variable projects need an explicit per-generation selection.

Define a shared type and pure resolver in `@loom/core`, for example:

```ts
export type EffectivePov = string | "omniscient";

export function resolveEffectivePov(
  snapshot: ValidationSnapshot,
): EffectivePov | undefined {
  const configured = snapshot.storyConfig.proseMode?.pov_character;
  const selected = snapshot.generationSession.active_working_set?.selected_pov;

  if (!configured) return undefined;
  if (configured === "variable") return selected;
  return configured;
}
```

The helper alone is not enough; readiness rules define valid combinations:

| Global `pov_character` | Generation `selected_pov` | Result |
|---|---|---|
| `variable` | selected entity/cast id | effective POV is selected id |
| `variable` | `omniscient` | effective POV is omniscient |
| `variable` | absent | blocker: per-generation POV required |
| fixed id | absent | effective POV is fixed id |
| fixed id | same id | effective POV is fixed id; redundant but valid, or normalized away deterministically |
| fixed id | different id/omniscient | blocker: generation POV conflicts with prose mode |
| `omniscient` | absent or `omniscient` | effective POV is omniscient |
| `omniscient` | concrete id | blocker: generation POV conflicts with prose mode |

Prefer normalization that removes an exactly matching redundant `selected_pov` from ready input only if that normalization is already an established deterministic pattern and remains visible in the saved draft. Otherwise accept the duplicate exact match. Never silently choose between conflicting values.

### 8.5 Code cascade

#### `@loom/core`

Create a small shared module, such as `records/effective-pov.ts` or `validation/effective-pov.ts`, with no framework or platform dependencies. Use it from every POV consumer:

- `compiler/sections/front.ts` for `{pov_character}` display-label resolution;
- `renderPovKnows`, `renderPovBeliefs`, and `renderPovDoesNotKnow`;
- secret firewall and dramatic-irony checks;
- POV knowledge completeness;
- matrix knowledge/voice rules;
- referential validation for selected POV;
- any ideation operator or citation selection that depends on viewpoint.

Add dedicated diagnostics, with precise names/messages such as:

- `selected-pov-required-for-variable-mode`;
- `selected-pov-conflicts-with-prose-mode`.

Use existing codes only if their documented semantics and remediation remain exact; do not overload a generic missing-config code so the UI cannot tell the author what to fix.

Readiness must also verify that the effective non-omniscient id resolves to a selected ENTITY or CAST MEMBER. All POV knowledge and reveal profiles must use that same id. `variable` must be impossible in a ready compiled prompt.

The record registry is unchanged because POV fields are story configuration/generation-session state, not record payloads. Update demo fixtures to include explicit variable-mode and fixed-mode cases and to remove any expectation that `variable` is provider-bound text.

Update field guidance:

- `PROSE MODE.pov_character`: durable POV authority; choose `variable` only when the viewpoint is selected per generation;
- `ACTIVE WORKING SET.selected_pov`: conditionally prompt-facing through effective-POV resolution, required only for variable mode, forbidden from conflicting with fixed mode.

#### `@loom/web`

Make the relationship visible:

- when prose mode is variable, mark Selected POV as readiness-required;
- when prose mode is fixed, either hide/disable the selector with the fixed value shown or allow only the matching value;
- display an actionable conflict blocker rather than silently compiling one source;
- prompt preview must show the resolved record label, never `variable`.

Do not change the storage schema merely to enforce UI behavior; server/core validation remains authoritative.

#### `@loom/server`

No stored-field migration is required. Snapshot building and readiness routes must use the updated core resolver/diagnostics. Add route tests for all table combinations above and ensure compile/send remains blocked on conflict.

### 8.6 Authority-doc and prompt synchronization

Update:

- `docs/story-record-schema.md` §§2.3 and 3.1: distinguish sentinel from concrete generation selection and delete the erroneous claim that `selected_pov` accepts `variable`;
- `docs/compiler-contract.md`: `{pov_character}` maps to **effective POV**, not raw global config; `variable` never renders; requiredness and resolution rules become explicit;
- `docs/prompt-template.md`: placeholder remains unchanged; no prose rewrite is needed;
- `docs/prompt-template-rationale.md`: explain durable fixed POV versus per-generation variable resolution;
- `docs/validation-rule-inventory.md`: add the two combination diagnostics and identify all rules as using effective POV.

This is a field-semantics synchronization change, not a general template rewrite.

### 8.7 Ideation-template and golden consequence

Ideation must use the same effective POV for any viewpoint-sensitive slots, knowledge lanes, and front matter. Update ideation and prose goldens to include a variable-mode fixture that resolves to a human display label. Add an invariant test that the string `POV: variable` cannot occur in a ready compiled prompt.

For fixed-mode fixtures with no conflict, prompt bytes should remain unchanged. For previously conflicting or variable-literal fixtures, the new blocker/resolved label is the intended behavioral change.

### 8.8 Required verification

- one shared helper is imported by all compiler and validation POV consumers;
- variable mode without selected POV blocks preview, compilation, and send;
- variable mode with selected POV renders the selected human display label;
- fixed mode with a conflicting selected POV blocks;
- fixed mode with absent/matching selected POV succeeds;
- omniscient combinations obey the table;
- knowledge, belief, secret, audience, dramatic-irony, and non-POV-interiority checks use the same effective POV;
- a selected POV id must resolve to a selected allowed record type;
- no ready prompt contains literal `variable` as its POV;
- prose and ideation behavior stay synchronized.

### 8.9 `FOUNDATIONS.md` §29 clearance

- **§29.1–29.2:** no plot planning, automatic canon, or LLM mutation.
- **§29.3:** selected POV remains explicit and user-controlled; no silent record inclusion.
- **§29.4:** a pure resolver makes identical snapshots deterministic and removes contradictory section sources.
- **§29.5:** conflicts and missing variable-mode selection fail closed.
- **§29.6:** all POV, knowledge, reveal, and interiority rules now share one authority, directly strengthening the checklist.
- **§29.7:** perception/line-of-sight rules receive the same concrete POV identity.
- **§29.8–29.10:** accepted prose, prompt logging, secrets, networking, and local ownership are untouched.
- **§29.11:** author workflow and blocker legibility improve.
- **§29.12:** private notes remain isolated.

## 9. Examined but unchanged — global story properties

This section records the negative findings so the audit is complete rather than a changelist.

### 9.1 STORY CONTRACT

**Verdict:** unchanged at the post-pass-1 baseline.

The remaining fields all perform concrete prompt and authorial-control functions:

- `title` identifies the project contract and prompt subject;
- `premise` establishes the durable story promise against which local prose is interpreted;
- `genre_mode` provides genre expectations without encoding an act or plot formula;
- `tone` constrains prose treatment rather than future events;
- `setting_baseline` gives stable world context not reducible to the current LOCATION;
- `content_intensity` selects the intended intensity lane;
- `explicitness` states project-specific rendering boundaries more precisely than a generic maturity label;
- `language_register` sets durable narration/dialogue register.

All compile through the front section, are visible in prompt inspection, and represent actual author choices. None imports prior prose or hidden state. No new “theme,” “arc,” “ending,” “genre beats,” or “continuity summary” field is justified.

**Pass-1 change affirmed:** removing `STORY CONTRACT.continuity_philosophy` was correct. The value was a fixed constitutional literal, not an author choice, and the template still carries continuity-first/no-branches doctrine statically. Recommendation 1 applies the same field-economy principle to a different fixed-doctrine echo; it does not reverse the earlier decision.

### 9.2 UNIVERSAL CONTENT POLICY — retained fields

After removing `governing_policy_note`, retain:

- `rating_label`: human-readable envelope and UI orientation;
- `allowed_content_scope`: substantive permission/boundary control;
- `tonal_handling`: distinguishes whether permitted material is restrained, sensational, clinical, tender, comic, horrific, and so on;
- `character_bias_handling`: protects the distinction between character perception and narrator-certified truth.

These are story-authored variables, not provider-policy restatements. They compile into the policy block and support deterministic contradiction checks against prompt-facing directives. No additional per-topic taxonomy is warranted; a proliferating matrix would over-constrain prose and duplicate free-prose scope.

### 9.3 PROSE MODE — retained fields

Subject to the effective-POV repair, the block remains correct:

- `pov_character` supplies fixed POV or the explicit `variable` sentinel;
- `person` controls grammatical viewpoint;
- `tense` controls temporal grammar;
- `psychic_distance` controls proximity to perception/thought;
- `interiority_mode` controls permitted thought rendering;
- `dialogue_density` gives prose-composition pressure without forcing dialogue events;
- `paragraphing` controls local paragraph rhythm;
- `language_output` selects output language;
- `special_style_constraints` preserves author-specific style rules not reducible to the enums.

The block is prompt-facing and directly protects prose quality. Removing its apparent overlap would lose independent controls: close psychic distance is not the same as direct interiority; dialogue density is not paragraph rhythm; language is not register. No separate narrator record is needed at this baseline: omniscience/fixed viewpoint plus CAST MEMBER voice and special constraints cover the current product without introducing a second durable prose authority.

## 10. Examined but unchanged — generation-time brief

### 10.1 ACTIVE WORKING SET, apart from effective POV semantics

Retain:

- `selected_records`: the explicit, inspectable inclusion authority;
- `active_onstage_cast_full[].cast_member_id`: assigns full dossier treatment;
- `active_onstage_cast_full[].local_function`: activates deterministic voice/body/participation floors without compressing the dossier;
- `present_minor_cast_compressed[]`: permits intentional compression for materially present minor cast;
- `offstage_relevant_cast[]`: permits constrained offstage pressure without making absent cast onstage;
- `selected_pov`: the per-generation concrete viewpoint only when global prose mode is variable, subject to recommendation 6.

These fields drive snapshot membership, ordering, cast-band validation, compiler sections, and prompt inspection. They are user-controlled, and no relevance model silently adds records.

**Pass-1 change affirmed:** removing `ACTIVE WORKING SET.manual_directive_id` was correct. No MANUAL DIRECTIVE record category exists; the actual directive is the generation-session object. The phantom id had no stable referential target and created duplicate authority.

No `selected_location`, `selected_object`, or per-record “include in prompt” boolean should be added. `selected_records` plus typed record references already perform that function.

### 10.2 CURRENT AUTHORITATIVE STATE

**Verdict:** unchanged. Every field supports a distinct current-continuity or validation function:

- `current_time`: temporal position and timing feasibility;
- `current_location`: authoritative scene-space and selected LOCATION resolution;
- `onstage_entities`: physical/narrative presence and onstage-reference validation;
- `immediate_situation_summary`: compact state-now orientation that is explicitly not a recap;
- `offstage_pressuring_entities`: immediate offstage agency and interruption-route validation;
- `positions`: body/object geometry for physical action;
- `possessions`: immediate holder/control state where objects matter;
- `visible_conditions`: current visible surface facts;
- `environmental_conditions`: weather, light, noise, heat, terrain, or other live environment pressure;
- `entity_statuses`: structured current life/agency/location/visibility/activity authority;
- `line_of_sight_and_visibility`: scene geometry and perception feasibility;
- `pov_cannot_perceive_now`: explicit negative perception boundary not captured by general geometry alone;
- `routes_and_exits`: movement/interruption possibility;
- `available_time`: deadline/timing feasibility at the local unit;
- `consent_or_force_conditions`: current agency, coercion, restraint, or permission constraints;
- `current_locks`: hard impossible/unavailable options that prevent continuity invention.

The first four form the universal minimum; the rest are context-gated. That is appropriate field economy: the schema can preserve detailed physical/reveal safety without making every field readiness-required in every scene. None is future plot structure.

Potential overlaps were examined and rejected:

- positions do not replace routes/exits;
- line of sight does not replace explicit POV perception prohibition;
- possessions do not replace OBJECT records, because the brief is the immediate aggregate while OBJECT is durable typed state;
- immediate situation does not replace recent causal context, because one is state-now and the other is launch cause;
- available time does not replace CLOCK, because one is current local feasibility and the other is a durable pressure mechanism.

### 10.3 IMMEDIATE HANDOFF — retained fields

After recommendation 2, retain:

- `recent_causal_context`: the user-authored causal bridge into the local unit;
- `last_visible_moment`: a sensory/action anchor that prevents spatial or temporal discontinuity;
- `begin_after`: an imperative cutpoint that prevents repetition or time-skipping.

The last two are not duplicates. One describes the final visible state; the other defines where new prose starts. Readiness correctly requires either, not necessarily both, for continuation.

No “previous segment summary,” “last paragraph,” “accepted prose excerpt,” automatic recap, or hidden archive pointer should be added.

### 10.4 MANUAL MOMENT DIRECTIVE

**Verdict:** unchanged.

- `must_render` is the required local authorial pressure and prevents the system from deciding the next story move autonomously;
- `may_render_if_naturally_caused` grants bounded permission without requiring incident manufacture;
- `do_not_force` protects against premature outcomes, reveals, reconciliation, escalation, or other generator bias.

The triad is superior to a single instruction blob because it separates obligation, permission, and prohibition deterministically. It remains subordinate to canon/current state/physical/POV/reveal/policy authority, so it does not become a plot rail. Draft-saving before `must_render` is complete remains correct; readiness, not storage, should block.

No outcome field, scene goal, desired ending, beat list, or “surprise” quota should be added.

### 10.5 CURRENT CAST VOICE PRESSURE

**Verdict:** unchanged at the post-pass-1 shape.

Retain:

- `cast_member_id`: target identity;
- `current_voice_pressure`: compact cross-channel local pressure;
- `dialogue_pressure`: speech-specific local pressure or `none`;
- `pov_narration_pressure`: narration/interiority texture when that cast member is the viewpoint;
- `nonverbal_or_silence_pressure`: body, turn-taking, restraint, silence, or social presence;
- `current_must_preserve`: scene-specific voice invariants;
- `current_must_avoid`: scene-specific anti-errors.

These fields are optional salience controls. Durable CAST MEMBER data remains primary. Their compiler destinations are real: active/full voice pins and present-minor compressed notes. They protect local voice without stale mutation of the durable dossier.

**Pass-1 change affirmed:** removing `CURRENT CAST VOICE PRESSURE[].local_function` was correct. Local function is already owned by `active_onstage_cast_full`; duplicating it inside pressure objects allowed role disagreement. The implemented routing of present-minor current pressure into compressed notes and removal of the redundant standalone `{voice_pressure}` lane were also correct. The current compact pin/full-dossier duplication performs two different salience functions rather than repeating the same framing.

No automatic pressure derivation from accepted prose or LLM analysis should be added.

### 10.6 CAST VOICE OVERRIDES — retained fields

After recommendation 3, retain:

- `cast_member_id`: target;
- `reason`: author-only maintenance metadata;
- `applies_to`: structured surface targeting;
- `override_text`: operative current-generation instruction.

The override block remains generation-local and never mutates durable identity. The split between applies-to and instruction is useful: it lets validation/UI explain the affected voice surface while preserving free-prose precision.

**Pass-1 change affirmed:** removing `CAST VOICE OVERRIDES[].scope` was correct. The containing block is intrinsically current-generation-only, and `applies_to` carries the meaningful targeting. Recommendation 3 is an additional delivery correction, not a restoration of scope.

### 10.7 GENERATION VALIDATION FOCUS

**Verdict:** unchanged.

- `generation_context` deterministically selects first-segment versus continuation rules;
- `expected_local_modes` activates dialogue, ensemble, introspection, physical, silent-presence, perception, offstage, nonhuman/institutional, secret/clue, and hidden-plan validation matrices;
- `possible_durable_changes` activates object, location, coercion/intimacy, violence/injury, institution, clock, and obligation update checks.

These tags are explicitly validation-only. They do not compile into writer instructions and do not define beats, required incidents, or outcomes. This is exactly the safe use of structured anticipation: inspect risk without forcing it.

No generic `scene_type`, `beat_type`, `dramatic_function`, or act-position field should be added. Such fields would bias generation and cross §12.

### 10.8 STOP GUIDANCE

**Verdict:** unchanged.

`soft_unit_guidance` allows the author to narrow the stopping point for this local generation. It is optional because the universal template always contains the response-point stop rule. Supplied text is validated against chapter/outline/multi-response scope and against contradiction with the manual directive.

A structured list of beats, target word count, chapter endpoint, or downstream consequence would be worse: those controls encourage over-generation and future structure. A word-count hint could be useful in other products, but here it does not clear the prose-quality and §12 bar.

## 11. Examined but unchanged — record taxonomy

### 11.1 ENTITY

**Verdict:** unchanged.

ENTITY supplies identity for persons, animals, place agents, object agents, institutions, factions, supernatural forces, systems, and other non-person agents. `entity_kind` plus `short_description` now has a truthful material-pressure destination for selected non-person entities; person identity remains subordinate to CAST MEMBER for rich character authority. The category is the common referential backbone for status, cast, knowledge, intention, plans, relationships, emotions, objects, obligations, and consequences.

A separate FACTION, INSTITUTION, THREAT, SYSTEM, or WORLD-RULE category is not needed. Those concepts can be an ENTITY plus FACT/STATUS/LOCATION/OBLIGATION/RELATIONSHIP/PLAN/CLOCK records as appropriate. Splitting them would duplicate identity and reference infrastructure without adding a unique deterministic function.

**Pass-1 delivery change affirmed:** rendering selected non-person `ENTITY.entity_kind` and `short_description` into material pressure was correct. It repaired a real promised destination without adding fields.

### 11.2 ENTITY STATUS

**Verdict:** unchanged.

ENTITY STATUS isolates mutable operational state from stable identity. Life, agency, location, visibility, activity/availability, and related status fields drive contradiction, active-plan-holder, cast, physical, and current-state checks. Multiple selected incompatible statuses can be blocked rather than silently resolved.

This should not be merged into ENTITY: doing so would make one identity record carry changing current snapshots and increase stale-state risk. Nor should status be inferred from accepted prose.

### 11.3 CAST MEMBER

**Verdict:** unchanged.

The rich dossier exception to atomic records is justified. Core identity, voice anchor, pressure behavior, body presence, agency, world pressure, relational charge, moral/psychological edge, extended embodiment/perception/behavior/planning, and sparse annotated sample utterances perform concrete character voice and behavior preservation. Active/full compilation is intentionally rich; present-minor and offstage bands provide explicit user-selected compression.

The on-record rationale that long dossiers need core-first ordering and compact voice pins remains persuasive. External CHIRON results are not a direct generation-quality test for this codebase, but they support the general decision to retain structured character sheets rather than collapse characters into one-line summaries [E4].

No personality-trait score matrix, diagnosis field, archetype, alignment, or automatic character summary should be added. Existing prose-rich structure is more expressive and less reductive. Sample utterances remain optional, sparse, and non-copyable by default; expanding them into a quote bank would increase phrase echo.

### 11.4 FACT — retained fields and category

After removing `status`, retain:

- `fact_kind`: separates hard canon, current state, setting truth, and discovered truth;
- `statement`: the atomic objective claim;
- `scope`: bounds relevance and pressure framing;
- `known_by`: objective knowledge distribution;
- `audience_visibility`: audience disclosure state;
- `salience`: ordering/pressure significance.

FACT remains the objective-truth category distinct from BELIEF. Supersession and contradiction should remain diagnostics/workflow actions, not a lifecycle of inactive false canon.

No general source/provenance field is required. Where access route matters to a character, BELIEF already models it. Where a document/object/location trace matters, typed records and EVENT links can represent it. A universal citation field would add clerical burden and could imply source truth the system cannot validate.

### 11.5 BELIEF

**Verdict:** unchanged.

`holder`, `claim`, `belief_mode`, `truth_relation`, `confidence`, `visibility`, `access_route`, `behavioral_effect`, `salience`, and lifecycle status jointly model holder-specific mental state that may be true, false, partial, contested, concealed, reported, inferred, or misremembered. The behavioral-effect lane gives the compiler a prose-relevant pressure rather than dumping epistemic metadata alone.

This is not redundant with FACT or SECRET. Objective truth and a character’s representation of it must be separable for dramatic irony, deception, error, and psychologically coherent action. OpenToM’s benchmark design explicitly includes intention-triggered action and both physical and psychological mental-state tracking, while reporting that psychological mental-state tracking remains difficult for strong models; that direction supports retaining explicit belief state rather than relying on model inference [E3].

No additional “memory” or “rumor” category is needed: `belief_mode`, `truth_relation`, `visibility`, and `access_route` already cover those distinctions.

### 11.6 SECRET

**Verdict:** unchanged.

SECRET’s status, kind, claim, holders, protected non-holders, audience visibility, POV access, salience, allowed cues, forbidden reveals, reveal permission/triggers, and clue carriers support a complete deterministic reveal firewall. The split lanes are not gratuitous: the writer can know a truth while the narrator/POV cannot, and the audience can know more or less than the POV.

No standalone CLUE category is required at this baseline. Durable clue objects/locations can be OBJECT/LOCATION/FACT/EVENT records; secret-local clue carriers already model availability, strength, discovery, audience visibility, and status. A new category would create duplicate ownership unless a future product requirement demonstrates cross-secret reusable clue identity that the present schema cannot express.

### 11.7 POV KNOWLEDGE PROFILE

**Verdict:** retain as a compiled profile, not a stored record category.

`pov_knows`, beliefs/suspicions/misreads, protected ignorance, current perception limits, and non-POV interiority rules are derived deterministically from selected records, prose mode, and current state. Storing a duplicate profile would create stale authority and a migration burden. Recommendation 6 repairs the identity source without changing the derived-profile design.

### 11.8 AUDIENCE KNOWLEDGE PROFILE

**Verdict:** retain as compiled state, not stored data.

Audience-known, audience-unknown, dramatic-irony permission, and ambiguity are distinct from POV knowledge. Their separation prevents the common error of making narrator knowledge automatically available to the viewpoint character. No “reader model” record or inferred audience-memory cache is warranted.

### 11.9 LOCATION

**Verdict:** unchanged.

`label`, `description`, `layout_relevant_now`, `access_routes`, `visibility_and_sound`, `hazards_or_shelters`, `social_rules`, and lifecycle status support spatial continuity, movement, perception, environmental hazard, refuge, and socially constrained behavior. These are not decorative setting fields; they are current action constraints.

**Pass-1 delivery change affirmed:** rendering `hazards_or_shelters` and `social_rules` in prose and ideation was correct. Their earlier omission misled authors about live destinations; the implementation repair made retained fields truthful without adding schema.

No separate MAP, ZONE, or SOCIAL NORM category is needed. Multiple LOCATION records plus FACT/ENTITY/OBLIGATION/RELATIONSHIP compose those concepts.

### 11.10 OBJECT

**Verdict:** unchanged.

Description, owner, carrier, current location, POV visibility, usable affordances, constraints, durability, and lifecycle status provide a coherent material-state record. Owner and carrier are not redundant: legal/social ownership and physical possession may differ. `durability` earns its author-review role even though it is not literal prompt text; it determines how seriously the user must update continuity after use/transfer/destruction.

No RESOURCE category is needed. A resource with identity/state is an OBJECT; abstract available means belong in PLAN.resources, LOCATION access, ENTITY capability, FACT, or current state.

### 11.11 VISIBLE AFFORDANCE

**Verdict:** unchanged.

Availability target, action families, requirements, risk, durability, prompt text, and status express what can currently be attempted under known constraints. This is local possibility, not an event order or guaranteed result. Explicit unavailable/blocked affordances protect against impossible action.

A universal ACTION record would be harmful: it would blur present possibility, performed EVENT, character INTENTION, and active PLAN. The existing separation is correct.

### 11.12 EVENT

**Verdict:** unchanged.

Event kind, sequence metadata, description, participants, location, POV/audience visibility, knowledge distribution, causes/effects, relevance, and lifecycle status carry causal history forward without importing prose. `sequence_order` remains authoring metadata rather than a compiler sorting rail; actual compiler order stays deterministic under the contract.

No scene/chapter/beat wrapper should be added. EVENT is atomic causal history, not future structure.

### 11.13 INTENTION

**Verdict:** unchanged.

Holder, intent, urgency, behavioral pressure, and lifecycle status model a current commitment that shapes action without guaranteeing fulfillment. INTENTION is distinct from PLAN: a person may want something without having an operational sequence, and behavioral pressure is often enough for prose.

No GOAL category is needed; it would duplicate active intentions and plan objectives. Long-range aspirations can be an intention with appropriate urgency/current pressure or private notes until they become continuity-relevant.

### 11.14 PLAN — retained fields

After removing `can_drive_prose`, retain:

- `holder` and `objective` for intentional ownership;
- `plan_status` for current operational lifecycle;
- `resources` and `blockers` for plausible means/constraints;
- `current_step` for local pressure;
- `fallback_steps` for author continuity and deterministic plausible-means validation, never as a menu sent to the writer;
- `visibility_to_pov` for hidden/suspected/known behavior;
- `salience` for ordering and warning context.

The record remains local causal state, not an autonomous planner. External Glaive work illustrates the categorical difference: a narrative planner constructs action sequences to achieve author goals from character-goal-oriented steps and reasons over possible worlds [E5]. Continuity Loom’s PLAN stores a user-authored current objective/step and never searches future action space. No planner, beat generator, or alternative plan tree should be added.

### 11.15 CLOCK

**Verdict:** unchanged.

Title/kind, salience, visibility, current pressure, tick trigger, next threshold, possible effects, tick history, and lifecycle status model escalating conditions. `possible_effects` is not a mandated sequence; it bounds plausible local consequences. `tick_history` earns its author/history role and stays out of the prompt unless restated as current state/event/consequence.

No universal timestamp/deadline structure is yet justified. Fictional time can be qualitative, calendrical, relative, magical, or uncertain. `current_time`, `available_time`, `tick_trigger`, and `next_threshold` cover the deterministic functions without imposing one temporal ontology.

### 11.16 OBLIGATION

**Verdict:** unchanged.

Kind, parties, urgency, terms, breach consequence, visibility, and lifecycle state preserve promises, debts, roles, legal/social/familial/moral/institutional duties. This is neither merely a relationship nor a plan: it can bind entities independent of current affection or chosen strategy.

No separate CONTRACT, PROMISE, DEBT, or DUTY categories are needed; `obligation_kind` provides the distinction within one shared validation/compiler shape.

### 11.17 CONSEQUENCE

**Verdict:** unchanged.

Kind, target, cause, urgency, current effect, possible next effect, visibility, and lifecycle status connect a prior cause to current/pending pressure. `possible_next_effect` is acceptable because it is a contingent local pressure, not a required outcome or future package. The compiler must continue to frame it as possible rather than inevitable.

No generic EFFECT category is needed; CONSEQUENCE already performs that role with current/pending lifecycle and target/cause references.

### 11.18 OPEN THREAD

**Verdict:** unchanged.

Type, status, title, summary, audience visibility, urgency, current relevance, possible pressure now, and author-only answer track unresolved continuity without commanding closure. The explicit doctrine “color local pressure; do not command closure” prevents the record from becoming a dramatic-question rail.

`answer_if_known` earns an authoring/history function even though it is not prompt-facing. Removing it would force the author to keep resolution truth elsewhere; compiling it would leak answers. The current split is correct.

No QUEST, ARC, MYSTERY, or STORYLINE category is needed. OPEN THREAD plus INTENTION/PLAN/SECRET/OBLIGATION/CLOCK composes those cases without future structure.

### 11.19 RELATIONSHIP

**Verdict:** unchanged.

Axis, direction, endpoints, durable definition, current expression, pressure text, visibility, salience, and lifecycle status model stable social structure plus its present manifestation. It is distinct from EMOTION: trust, debt, power imbalance, loyalty, dependency, rivalry, or protectiveness can persist across changing feelings.

No social-graph edge type system beyond the existing axis enum is justified. Free prose supplies nuance while structured endpoints/direction support validation.

### 11.20 EMOTION

**Verdict:** unchanged.

Holder, target/cause, emotion label, intensity, behavioral pressure, surface expression, regulation/visibility, salience, and lifecycle state preserve current affect as behavior and perception pressure. The category avoids forcing the model to infer inner state from generic personality alone.

No MOOD, DESIRE, IMPULSE, or BODY-SENSATION category is needed at present. These can be expressed as EMOTION, INTENTION, CAST MEMBER embodiment, ENTITY STATUS, or current state depending on authority and duration.

## 12. Pass-1 implementation bundle — explicit reaffirmation

The brief requires an explicit verdict on all five implemented first-pass changes. This audit agrees with all five; none should be reverted.

1. **Removed `STORY CONTRACT.continuity_philosophy`: correct.** It was fixed constitutional doctrine, not author-controlled story data.
2. **Removed `ACTIVE WORKING SET.manual_directive_id`: correct.** It was a phantom reference with no MANUAL DIRECTIVE record target and no compiler function.
3. **Removed `CURRENT CAST VOICE PRESSURE[].local_function`: correct.** The working set remains the sole local-role authority; duplicate role values could disagree.
4. **Removed `CAST VOICE OVERRIDES[].scope`: correct.** Current-generation scope is intrinsic; `applies_to` carries real targeting.
5. **Delivery repair bundle: correct.** Removing the redundant `{voice_pressure}` lane, routing present-minor pressure into compressed notes, rendering selected non-person ENTITY pressure, rendering LOCATION hazards/social rules, and explicitly classifying retained authoring/validation/history/UI-only fields all improved destination truthfulness without schema inflation.

The new recommendations extend the same standard. They do not repackage completed work as new findings.

## 13. Missing-field candidates examined and rejected

No missing field clears the brief’s addition bar. The following candidates were re-examined from first principles, including the non-binding `docs/narrative-theory-blocker-roadmap.md`.

### 13.1 PLAN/INTENTION prerequisites

The roadmap identifies explicit causal prerequisites as a possible future deterministic surface. This pass does **not** recommend adding a universal `prerequisites` field.

Current schemas already provide:

- PLAN `resources`, `blockers`, and `current_step`;
- VISIBLE AFFORDANCE `requires` and status;
- EVENT `causes`;
- current-state routes, positions, time, locks, and entity statuses;
- manual directive plus active selected records.

A dedicated prerequisite list would be justified only after a concrete validator design demonstrates a recurring gap that these fields cannot express and can distinguish record references from prose conditions without duplicate authority. The current roadmap itself says deterministic checking is only partial. Adding the field now would be speculative and likely create another hollow presence check.

### 13.2 Manual-directive actor target

A structured actor reference could make “unmotivated action” checks easier, but it would split a single local directive across a new targeting mini-language and free prose. The current directive may intentionally address an exchange, environment, narrator, group, or material event rather than one actor. INTENTION, PLAN, OBLIGATION, AFFORDANCE, cast bands, and onstage records already establish agency. No field addition is justified without evidence that actual false negatives are common and deterministically repairable.

### 13.3 Structured story time, deadlines, and thread age

The roadmap’s clock-expiry, anachrony, and thread-starvation candidates would benefit from normalized time. This pass retains the deferral.

A single schema would need to cover exact calendars, relative durations, non-Earth calendars, dream/time-loop structures, uncertainty, flashback order, magical time, and prose-only temporal positions. Premature normalization would either be too weak to compare or too rigid for fiction. Current `current_time`, `available_time`, EVENT `sequence_order`, CLOCK trigger/threshold, status, urgency, relevance, and ordinary metadata support authorial continuity and limited warnings. A later spec may add optional typed time only when an end-to-end deterministic comparison contract is specified; the field should not be added merely to make a roadmap row implementable.

### 13.4 Further knowledge provenance

The schema already has BELIEF `access_route`, EVENT `pov_visibility`/`known_by`, FACT `known_by`, SECRET holders/non-holders/POV access, clue-carrier discovery state, current perception limits, and derived POV/audience profiles. Recommendation 6 fixes the shared POV identity source.

A universal `source_record_id`, `learned_at`, or chain-of-custody field would often duplicate EVENT/OBJECT/DOCUMENT-like records and would not prove epistemic validity. No additional provenance field is required now. The roadmap’s goal—block impossible knowledge, warn on thin routes—should first be pursued through the existing structured fields.

### 13.5 Durable-change note in handoff

The roadmap refers to an “IMMEDIATE HANDOFF durable-change note,” but the constitution requires durable changes to live in records/current state. Adding such a field would create a second authority path and invite exactly the temporary-state persistence problem the product is designed to prevent. The correct response to missing durable representation is a blocker/reminder that points to the owning record, not a handoff field.

### 13.6 Theme, motif, symbolism, dramatic question, scene goal, or desired outcome

These concepts can be valuable author-private planning material, but they do not clear §13 as universal story-state fields:

- compiling them risks overt symbolic prose, thematic restatement, or event forcing;
- deterministic validation cannot prove faithful thematic execution;
- scene-goal/outcome fields approach §12 plot rails;
- private notes are intentionally isolated and must not enter prompts.

Theme can already be embodied through premise, tone, facts, relationships, objects, recurring current pressure, and manual directives when the author deliberately wants it to shape the next unit. No dedicated prompt-facing field is warranted.

### 13.7 Sensory, style, dialogue, surprise, conflict, or description quotas

PROSE MODE, CAST MEMBER, current voice pressure, current state, material records, and special style constraints already give direct qualitative control. Numeric quotas encourage mechanical prose and manufacture incident. No addition.

### 13.8 Universal record provenance/audit metadata

The system already has database identity and timestamps/metadata at the record layer. Adding author-visible payload fields such as `source`, `confidence`, `created_from`, `last_verified`, or `provenance_note` to every category would bloat atomic records and imply validation guarantees the product cannot make. Type-specific truth, knowledge, visibility, confidence, and cause fields are preferable.

### 13.9 Automatic summaries, salience caches, embeddings, or “memory” fields

All are rejected as continuity authority or prompt context. Automatic prose-derived summaries violate the constitution; hidden embeddings/rankers would violate deterministic explicit selection; user-authored duplicate summaries would stale and compete with records. Context research supports curation, but the product’s answer is explicit working-set selection and compact deterministic serializers, not a hidden memory layer [E1][E2].

### 13.10 Prior prose excerpt, last paragraph, or accepted-segment pointer

Rejected categorically. Accepted prose is archive output, not prompt context. Recommendation 2 removes rather than expands accepted-prose-adjacent schema.

## 14. Missing record-category candidates examined and rejected

### 14.1 FACTION / INSTITUTION / ORGANIZATION / SYSTEM / THREAT

Use ENTITY for identity and compose status, location, plans, obligations, relationships, facts, clocks, consequences, and open threads. A distinct category would duplicate references and compiler paths while adding no unique invariant.

### 14.2 MEMORY / RUMOR / TESTIMONY / LIE

Use BELIEF with holder, mode, truth relation, confidence, visibility, access route, and behavioral effect; use EVENT/FACT/SECRET where objective truth or concealment also matters. No category gap.

### 14.3 CLUE / EVIDENCE / DOCUMENT

Use SECRET clue carriers for secret-local disclosure, OBJECT for material carriers, FACT for objective content, EVENT for discovery, and BELIEF for interpretation. A new category would need demonstrated reusable identity/validation needs not present in the current product.

### 14.4 RESOURCE / CAPABILITY / SKILL

Use PLAN.resources, OBJECT, ENTITY/CAST MEMBER dossier, FACT, STATUS, LOCATION, or VISIBLE AFFORDANCE. These concepts differ in authority and duration; one generic category would blur them.

### 14.5 GOAL / QUEST / MISSION

Use INTENTION for holder commitment, PLAN for operational means, OBLIGATION for imposed duty, CLOCK for pressure, OPEN THREAD for unresolved state, and manual directive for the immediate unit. A quest/mission category would encourage future-structure bundling.

### 14.6 SOCIAL NORM / LAW / RULE

Use LOCATION.social_rules for place-local norms, FACT for world rules, OBLIGATION for binding duties, ENTITY for institutions, and UNIVERSAL CONTENT POLICY for rendering policy. No separate category.

### 14.7 ACTION / SCENE / BEAT / SEQUENCE / CHAPTER / ARC / BRANCH

Rejected. ACTION conflates affordance, intention, plan, and completed event. The remaining terms are expressly prohibited plot/structure machinery under §12 and §29.1. External narrative planners such as Glaive search plans that achieve author goals through goal-oriented character steps; importing planner categories would change the product’s identity rather than fill a continuity gap [E5].

### 14.8 THEME / MOTIF / SYMBOL

These are authorial interpretive structures, not necessarily current continuity. They belong in isolated notes or emerge from selected records and prose constraints. A universal record risks forcing symbolism and narrator commentary.

### 14.9 NARRATOR

The current product can model a character narrator through ENTITY/CAST MEMBER plus effective POV, person, interiority, voice, and style constraints; omniscient narration is represented directly. A separate narrator category might become necessary for a persistent non-character narrator with a rich independent dossier, but no repository behavior or external evidence demonstrates that this is a current blocking gap. Do not add speculative taxonomy.

### 14.10 AUDIENCE / READER STATE

The compiled audience profile already derives from truth/reveal records. Storing a reader-state record would be stale duplicate authority. No category.

### 14.11 SEGMENT / SCENE STATE

The generation session already owns current authoritative state, handoff, directive, validation focus, and stop guidance. Accepted segments remain a separate archive. A segment record would blur those surfaces and risk prose-as-canon.

## 15. Implementation grouping and order

The six changes should become one coherent implementation spec because they share schema/document synchronization and migration gates, but the work should preserve package-boundary order.

### 15.1 Authority decision first

1. Amend `FOUNDATIONS.md` §10 for recommendation 2. If the owner rejects that amendment, omit recommendation 2 entirely; do not implement a partial removal that leaves the constitution contradictory.
2. Update `docs/story-record-schema.md` with all six target semantics.
3. Update compiler contract, validation inventory, rationale, and prompt/ideation templates only as synchronization consequences.

### 15.2 Core schema and semantic helpers

1. Remove the four stored fields from draft/ready schemas:
   - UCP `governing_policy_note`;
   - handoff `prior_accepted_prose_status_or_handoff_note`;
   - FACT `status`;
   - PLAN `can_drive_prose`.
2. Keep override `reason` in schema but change guidance/destination metadata.
3. Add the pure effective-POV helper and diagnostics.
4. Update registry status projection for FACT.
5. Update field paths, descriptors, column manifests, and guidance coverage.

### 15.3 Validation

1. Correct continuation readiness to bridge plus either cutpoint.
2. Retain contamination checks on all actual prompt-facing user text.
3. Remove override reason from prompt-facing scans.
4. Apply active-plan holder/reference/means checks to every selected active plan.
5. Route every POV/reveal/knowledge rule through effective POV.
6. Keep warnings non-gating and drafts saveable.

### 15.4 Compiler

1. Delete two placeholders/resolvers: governing policy note and accepted-prose status/handoff note.
2. Remove override reason from shared cast serialization.
3. Resolve `{pov_character}` from effective POV and forbid literal `variable` in ready output.
4. Do not alter FACT/PLAN prompt rendering except as necessary for typing; equivalent migrated state must compile identically.

### 15.5 Server migrations

Implement three idempotent migration seams:

- extend global-config cleanup for the UCP key;
- extend generation-session draft cleanup for the handoff key;
- add transactional record-payload cleanup for FACT and PLAN keys.

Run them before strict parsing/repository hydration. Do not add aliases or backwards-compatible schema branches after migration.

### 15.6 Web UI

1. Remove the four retired controls.
2. Keep override reason with a conspicuous “not sent to writer” explanation.
3. Make effective-POV requiredness/conflict visible.
4. Update section fill/readiness displays and API typing.
5. Preserve draft work and actionable blocker navigation.

### 15.7 Tests and goldens

Update tests in the same package order:

- schema/record/guidance/field-path tests;
- migration tests, including rollback and idempotence;
- validation rule/inventory/applicability tests;
- compiler section/scaffold/conformance tests;
- prose and ideation goldens;
- server readiness/compile/send/e2e tests;
- web editor/readiness/preview tests;
- capstone tests proving the retired keys and destinations are gone.

## 16. Acceptance criteria

The implementation is complete only when all of the following hold.

### 16.1 Retired keys

A repository-wide type-aware test/fixture audit shows no live schema, descriptor, guidance entry, editor, compiler resolver, validation field path, demo fixture, or API type for:

```text
universalContentPolicy.governing_policy_note
immediate_handoff.prior_accepted_prose_status_or_handoff_note
FACT.status
PLAN.can_drive_prose
```

Occurrences in archived historical documents are allowed and must not be rewritten as current authority.

### 16.2 Destination truthfulness

- Every prompt-facing field names a real destination.
- `cast_voice_overrides[].reason` is explicitly non-prompt-facing.
- `active_working_set.selected_pov` truthfully participates in effective-POV resolution.
- No compiled prompt contains literal `variable` as POV.
- No deleted placeholder remains in the compiler contract or template.

### 16.3 Storage safety

- A legacy project containing all four retired stored keys opens after deterministic migration.
- A second open produces no further change.
- Malformed JSON or invalid transformed payload rolls back atomically with an actionable error.
- No migration copies data into a semantically guessed replacement field.
- No compatibility alias remains after migration.

### 16.4 Prompt behavior

Intended changed bytes:

- governing-policy-note line removed;
- accepted-prose-status/handoff line removed;
- override reason removed;
- variable/conflicting POV now resolves or blocks.

Intended unchanged bytes:

- FACT rendering after status cleanup;
- PLAN rendering after boolean cleanup;
- all unrelated sections and ordering;
- fixed external policy boundary;
- fixed accepted-prose firewall;
- static local-unit stop rule.

### 16.5 Validation behavior

- continuation requires causal bridge plus either cutpoint;
- accepted/candidate/auto-derived prose markers in actual prompt-facing lanes still block;
- selected active plans cannot bypass holder/means checks;
- POV conflicts and missing variable-mode selection block;
- warnings never gate preview/send;
- incomplete but structurally saveable drafts still save.

### 16.6 No new hidden authority

- no automatic summarizer, ranker, selector, relevance model, prose miner, or LLM intermediary is introduced;
- no accepted/rejected/superseded text enters a snapshot or request;
- no record is silently added or removed;
- no author-only field is smuggled into ideation or prose through a shared serializer;
- no private note enters validation or prompting.

## 17. Consolidated `FOUNDATIONS.md` §29 determination

| Checklist area | Result |
|---|---|
| §29.1 Identity | Pass. No autonomous plotter, branch, arc, beat, scene, or future-plan search is added. |
| §29.2 Continuity authority | Pass. All changes remove duplicate authority or unify explicit user-authored authority; no LLM mutation or prose mining. |
| §29.3 Active working set | Pass. PLAN selection is clarified as sole inclusion authority; effective POV remains explicit. |
| §29.4 Prompt compilation | Pass after §10 amendment for recommendation 2. Compilation remains pure and deterministic; universal sections stay present. |
| §29.5 Validation | Pass. Handoff requiredness becomes accurate, PLAN safety strengthens, POV conflicts fail closed, drafts remain saveable. |
| §29.6 POV and reveal | Pass. Recommendation 6 materially strengthens one-source POV/reveal behavior. |
| §29.7 Physical continuity | Pass. Active-plan agency/means checks strengthen; current-state fields remain intact. |
| §29.8 Accepted prose archive | Pass after §10 amendment. The archive remains excluded and one accepted-prose-adjacent field is removed. |
| §29.9 Prompt audit and secrets | Pass. Provider-bound fields become more truthful; no key/log change. |
| §29.10 Data ownership | Pass. Migrations are local and transactional. |
| §29.11 Quality/workflow | Pass. Four misleading controls disappear; reason metadata remains available; blocker guidance improves. |
| §29.12 Author-private notes | Pass. Notes remain outside all continuity/prompt/validation surfaces. |

## 18. External research used

The repository defects above are established by target-commit evidence. The following sources shaped conservative decisions about context economy, explicit character/mental-state representation, and the boundary between local causal records and narrative planning.

**[E1]** Nelson F. Liu, Kevin Lin, John Hewitt, Ashwin Paranjape, Michele Bevilacqua, Fabio Petroni, and Percy Liang. “Lost in the Middle: How Language Models Use Long Contexts.” *Transactions of the Association for Computational Linguistics* 12 (2024): 157–173. DOI: `10.1162/tacl_a_00638`. https://aclanthology.org/2024.tacl-1.9/

Relevant result: performance on long-context retrieval tasks varies substantially with information position and is often worse when relevant material is buried in the middle. This supports treating prompt space and placement as scarce, but it does not by itself prove that any one Loom field harms prose.

**[E2]** Freda Shi, Xinyun Chen, Kanishka Misra, Nathan Scales, David Dohan, Ed H. Chi, Nathanael Schärli, and Denny Zhou. “Large Language Models Can Be Easily Distracted by Irrelevant Context.” *Proceedings of the 40th International Conference on Machine Learning*, PMLR 202 (2023): 31210–31227. https://proceedings.mlr.press/v202/shi23a.html

Relevant result: models can be distracted by irrelevant context. This supports removing non-operative explanation and duplicate doctrine, while preserving context with demonstrated continuity/voice functions.

**[E3]** Hainiu Xu, Runcong Zhao, Lixing Zhu, Jinhua Du, and Yulan He. “OpenToM: A Comprehensive Benchmark for Evaluating Theory-of-Mind Reasoning Capabilities of Large Language Models.” *Proceedings of ACL 2024*, 8593–8623. DOI: `10.18653/v1/2024.acl-long.466`. https://aclanthology.org/2024.acl-long.466/

Relevant result: the benchmark explicitly represents personality traits, intention-triggered actions, and physical/psychological mental states, and reports weaker model performance on psychological mental-state tracking. This supports retaining explicit BELIEF, INTENTION, POV, and reveal structures rather than expecting the prose model to infer them.

**[E4]** Alexander Gurung and Mirella Lapata. “CHIRON: Rich Character Representations in Long-Form Narratives.” *Findings of EMNLP 2024*, 8523–8547. DOI: `10.18653/v1/2024.findings-emnlp.499`. https://aclanthology.org/2024.findings-emnlp.499/

Relevant result: CHIRON’s organized character-sheet representation outperformed comparable summary-based baselines on masked-character prediction. The task is not prose generation, so the evidence is directional; it supports retaining rich structured CAST MEMBER dossiers rather than collapsing them into summaries.

**[E5]** Stephen Ware and R. Michael Young. “Glaive: A State-Space Narrative Planner Supporting Intentionality and Conflict.” *Proceedings of the AAAI Conference on Artificial Intelligence and Interactive Digital Entertainment* 10, no. 1 (2014): 80–86. DOI: `10.1609/aiide.v10i1.12712`. https://ojs.aaai.org/index.php/AIIDE/article/view/12712

Relevant distinction: Glaive constructs plans that achieve author goals from character-goal-oriented steps and reasons over causal structures/possible worlds. That is a planner. Loom’s user-authored INTENTION/PLAN/CLOCK/OBLIGATION/CONSEQUENCE records should remain local current pressure and must not evolve into search, branching, or story-goal machinery.

## 19. Repository evidence map

Load-bearing repository evidence came from the following exact-commit paths. This map is not a substitute for the complete URL ledger.

### Constitution and authority

- `docs/ACTIVE-DOCS.md`
- `docs/FOUNDATIONS.md` §§5, 9–13, 28, 29
- `docs/story-record-schema.md` §§2–11
- `docs/compiler-contract.md`
- `docs/prompt-template.md`
- `docs/prompt-template-rationale.md`
- `docs/validation-rule-inventory.md`
- `docs/narrative-theory-blocker-roadmap.md`

### First-pass precedent

- `archive/specs/continuity-loom-schema-audit-and-changes.md`
- `reports/schema-field-and-taxonomy-audit-research-brief.md`
- `archive/specs/SPEC-024-remove-story-contract-prose-preferences.md`
- `archive/specs/SPEC-003-typed-data-model-and-record-identity.md`
- `archive/specs/SPEC-005-custom-cast-and-generation-brief-editors.md`

### Core schemas and guidance

- `packages/core/src/records/global-config.ts`
- `packages/core/src/records/generation-brief.ts`
- `packages/core/src/records/generation-brief-draft.ts`
- `packages/core/src/records/generation-brief-readiness.ts`
- `packages/core/src/records/knowledge.ts`
- `packages/core/src/records/causal-pressure.ts`
- `packages/core/src/records/entity.ts`
- `packages/core/src/records/space-material.ts`
- `packages/core/src/records/relationship-emotion.ts`
- `packages/core/src/records/cast-member.ts`
- `packages/core/src/records/cast-member-sections.ts`
- `packages/core/src/records/registry.ts`
- `packages/core/src/records/compile-destinations.ts`
- `packages/core/src/records/field-guidance-brief-config.ts`
- `packages/core/src/records/field-guidance-records.ts`
- `packages/core/src/records/field-guidance-cast-material.ts`
- `packages/core/src/records/editor-descriptors.ts`
- `packages/core/src/records/column-manifest.ts`

### Compiler

- `packages/core/src/compiler/sections/front.ts`
- `packages/core/src/compiler/sections/cast.ts`
- `packages/core/src/compiler/sections/pressure.ts`
- `packages/core/src/compiler/sections/records-tail.ts`
- `packages/core/src/compiler/sections/ideation.ts`
- `packages/core/src/compiler/placeholder-map.ts`
- `packages/core/src/compiler/empty-states.ts`
- `packages/core/src/compiler/template-constants.ts`
- `packages/core/src/compiler/compile-prompt.ts`

### Validation

- `packages/core/src/validation/rules/universal-completeness.ts`
- `packages/core/src/validation/rules/universal-blockers.ts`
- `packages/core/src/validation/rules/referential-brief.ts`
- `packages/core/src/validation/rules/record-internal.ts`
- `packages/core/src/validation/rules/structural-contradiction.ts`
- `packages/core/src/validation/rules/matrix-knowledge.ts`
- `packages/core/src/validation/rules/matrix-physical.ts`
- `packages/core/src/validation/rules/matrix-voice.ts`
- `packages/core/src/validation/rules/cast-band.ts`
- `packages/core/src/validation/rules/onstage-cast-band.ts`
- `packages/core/src/validation/kind-applicability.ts`

### Storage and UI cascade

- `packages/server/src/global-config-migration.ts`
- `packages/server/src/generation-session-draft-migration.ts`
- `packages/server/src/project-store.ts`
- `packages/server/src/record-repository.ts`
- `packages/web/src/config/StoryConfigEditor.tsx`
- `packages/web/src/generation-brief/GenerationBriefView.tsx`
- `packages/web/src/records/RecordEditor.tsx`
- `packages/web/src/working-set/WorkingSetView.tsx`

### Regression boundary

- core compiler, validation, schema, guidance, accepted-prose-exclusion, and golden tests;
- `docs/stress-suite.md`, `docs/stress-coverage-matrix.md`, and `docs/demo-blocker-recipes.md`;
- server migration/readiness/compile/send tests;
- web story-config, generation-brief, records, working-set, readiness, and preview tests.

## 20. Final determination

Continuity Loom’s overall model is already well chosen: explicit user-selected records, rich cast dossiers, current authoritative state, derived POV/audience profiles, local causal pressure, deterministic compilation, and fail-closed validation. The second pass finds no missing universal field and no missing record category.

The remaining defects come from **authority duplication**:

- editable text restating external policy;
- a redundant accepted-prose-named handoff lane;
- private override rationale forwarded as writer instruction;
- a one-value FACT lifecycle field;
- a PLAN inclusion switch ignored by the compiler but honored by validators;
- two unsynchronized POV sources.

Removing or reconciling those paths makes the schema smaller and more truthful without reducing continuity expressivity, voice protection, author control, or prose quality. Recommendation 2 must remain conditional on an explicit §10 amendment. The other five changes are compatible with the current constitution and should proceed together with their documented migration, synchronization, and regression surfaces.
