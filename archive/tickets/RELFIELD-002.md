# RELFIELD-002: Author comprehensive `i`-button field guidance for all RELATIONSHIP fields

**Status**: COMPLETED
**Priority**: HIGH
**Effort**: Medium
**Engine Changes**: Yes — `packages/core/src/records/field-guidance-records.ts` (RELATIONSHIP `specificGuidance` entries), plus a guard test (`packages/core/test/` — new or extended) asserting no prompt-facing RELATIONSHIP field falls back to generic guidance.
**Deps**: `archive/tickets/RELFIELD-001.md` (so the `pressure_text` / `current_expression` guidance describes the *actual* compiled behavior).

## Problem

When an author clicks the `i` button next to a RELATIONSHIP field, the popup shows near-useless generic text. Only `RELATIONSHIP.pressure_text` has a real override (`packages/core/src/records/field-guidance-records.ts:131-136`); every other field falls through to the generic generator `recordEntry()` (`:281-302`), which emits boilerplate like *"current expression for the RELATIONSHIP record."* with a single one-size `continuityRole` and `authoringAdvice` shared by the whole record type (`:317-318`, `:329-330`). The enum fields (`axis`, `value`, `valence`, `direction_kind`, `visibility`, `status`) carry **no** `enumValues` guidance, so the dropdown options are unexplained.

The concrete user symptom that triggered this work: an author editing a RELATIONSHIP could not tell what `current_expression` is for, or how it differs from `pressure_text` and `description` — because the help text for two of the three is generic and identical in shape. This ticket authors specific, distinguishing guidance for **all 12** RELATIONSHIP fields, including per-enum-value guidance.

The `FieldGuidance` shape supports everything needed (`packages/core/src/records/field-guidance.ts:21-41`): `short`, `details`, `authoringAdvice`, `continuityRole`, `examples`, `antiExamples`, `relatedFields`, `enumValues` (`EnumValueGuidance` = `short` + optional `implications`/`useWhen`/`avoidWhen`), `commonMistakes`, `doctrineWarnings`. The `FieldHelp` component already renders all of these.

## Assumption Reassessment (2026-06-09)

<!-- Items 1-3 always required. -->

1. **Only `pressure_text` has specific RELATIONSHIP guidance today.** Confirmed: `specificGuidance` (`packages/core/src/records/field-guidance-records.ts:58-267`) contains exactly one `RELATIONSHIP.*` key, `RELATIONSHIP.pressure_text` (`:131-136`). All other RELATIONSHIP paths resolve via `recordEntry()` fallback (`:276-278`, `:281-302`).
2. **The fields and their enum domains are fixed by the schema.** The 12 fields and enum value sets are `relationshipSchema` (`packages/core/src/records/relationship-emotion.ts:9-43`). Guidance must mirror these exactly; `id` is auto/operational and not author-facing. Authority for *meaning*: `docs/story-record-schema.md:852-871` (§9.1) and `docs/prompt-template-rationale.md:134-138` (§16).
3. **Shared boundary under audit:** the guidance keys are `RELATIONSHIP.<field>` canonical field paths consumed by `buildGuidanceRegistry` → `getFieldGuidance` → `FieldHelp` (`packages/web/src/field-help/FieldHelp.tsx`). `buildGuidanceRegistry` throws on duplicate paths (`field-guidance.ts:57-59`), so each new key must be unique. Enum-value keys must match the schema enum strings exactly or they render nothing.
4. **FOUNDATIONS principle restated:** §18 — RELATIONSHIP records "render as pressure text and current expression, not raw axes alone." The guidance must teach authors to write *behaviorally legible* prose, not restate the axis label; this is an authoring/LLM-assistance surface (FOUNDATIONS §8 prose-facing), not a validation change.
6. **Schema/consumer note:** this ticket adds guidance *entries* only; it does not extend any record schema or prompt section. Consumers: `GUIDANCE_REGISTRY` and the `FieldHelp` UI. Additive-only.
8. **Adjacent contradiction handling:** `current_expression`'s compile behavior is fixed by `archive/tickets/RELFIELD-001.md`; this ticket's `current_expression` guidance must describe the post-RELFIELD-001 behavior (it compiles), hence the dependency. The `description`-as-display-label fact (RELFIELD-001 item 8) is surfaced here in the `description` guidance so authors know it doubles as the line label.

## Architecture Check

1. Adding entries to the existing `specificGuidance` map is the established extension point (used for SECRET, OPEN THREAD, PLAN, etc.); no new mechanism is introduced. A guard test converts "comprehensive" from a subjective claim into an enforced invariant.
2. No backwards-compatibility shim; the generic fallback remains for other record types and is simply no longer reached for RELATIONSHIP prompt-facing fields.

## Verification Layers

1. Every author-facing RELATIONSHIP field has specific guidance -> guard test asserts `getFieldGuidance("RELATIONSHIP.<field>").short` is not equal to the generic `` `${label} for the RELATIONSHIP record.` `` string, for each non-`id` field.
2. Every RELATIONSHIP enum field documents every schema value -> guard test asserts `enumValues` keys equal the schema enum set for `axis`, `value`, `valence`, `direction_kind`, `visibility`, `status`.
3. Registry integrity -> existing `buildGuidanceRegistry` duplicate-path guard (`field-guidance.ts:57-59`) plus `npm run typecheck` (the new entries are typed `Partial<FieldGuidance>`).

## What to Change

Add `RELATIONSHIP.*` entries to `specificGuidance` in `packages/core/src/records/field-guidance-records.ts`. The three prose fields are the crux — their `short`/`details` must make the distinction unmistakable:

### Prose fields

- **`RELATIONSHIP.description`** — `short`: "What the bond *is*: its nature, history, and stakes. Also used as the record's display label in the prompt." `authoringAdvice`: "State the relationship and why it matters; keep it stable across segments. Pressure that changes *now* goes in pressure_text/current_expression, not here." `examples`: ["They trust each other's decency but disagree over whether protection justifies concealment."] `antiExamples`: ["She is angry at him right now." (that is current pressure, not the bond)] `relatedFields`: ["RELATIONSHIP.pressure_text", "RELATIONSHIP.current_expression"].

- **`RELATIONSHIP.pressure_text`** (refine existing) — keep `short` "The live relational pressure that can bend behavior now." Add `details`: "The *internal/relational charge* that pushes a choice, a word, or a silence in the next segment — distinct from how it visibly shows (current_expression)." Keep existing `examples`/`antiExamples`/`authoringAdvice`. Add `relatedFields`: ["RELATIONSHIP.current_expression", "RELATIONSHIP.description"].

- **`RELATIONSHIP.current_expression`** — `short`: "How the relationship *visibly shows* right now — the behavior the POV and others can perceive." `details`: "The observable, embodied manifestation: tone, body language, distance, touch, eye contact, hesitation, warmth or coldness. It answers 'what would a camera catch?', whereas pressure_text is the unseen charge driving it. The RELATIONSHIP analog of EMOTION's surface_expression; it compiles into the relationship line alongside pressure_text." `examples`: ["They stand close but leave a careful inch between them; his voice flattens whenever she decides without asking."] `antiExamples`: ["He resents needing her." (that is the internal pressure — belongs in pressure_text)] `authoringAdvice`: "Write what is seen or heard, not what is felt." `relatedFields`: ["RELATIONSHIP.pressure_text", "RELATIONSHIP.description"].

### Reference fields

- **`RELATIONSHIP.from`** — `short`: "The entity who *holds* this relationship quality (the one who trusts, fears, owes, etc.)." `authoringAdvice`: "For a directed axis, from is the subject of the feeling; to is its target."
- **`RELATIONSHIP.to`** — `short`: "The entity the relationship is *directed at* (the one trusted, feared, owed)." `relatedFields`: ["RELATIONSHIP.from", "RELATIONSHIP.direction_kind"].

### Enum fields — every schema value must get an `EnumValueGuidance.short`

- **`RELATIONSHIP.axis`** — `short`: "The dimension of the bond. Pick the single axis the pressure runs along; nuance goes in the prose fields, not extra axes." `enumValues` for all 18: `trust`, `fear`, `desire`, `debt`, `intimacy`, `loyalty`, `resentment`, `power_imbalance`, `attention`, `familiarity`, `approval`, `respect`, `obligation`, `hostility`, `dependency`, `rivalry`, `protectiveness`, `other` — each a one-line gloss (e.g. `debt`: "One party owes the other and feels the weight of owing."; `power_imbalance`: "One party holds leverage or authority over the other."; `protectiveness`: "One party feels responsible for shielding the other."; `other`: "None of the listed axes fit; explain in description.").
- **`RELATIONSHIP.value`** — `short`: "Intensity of the bond on its axis." `enumValues`: `none` ("Effectively absent."), `trace` ("Barely present."), `low`, `medium`, `high`, `extreme` ("Dominates how this party acts toward the other.").
- **`RELATIONSHIP.valence`** — `short`: "The shape of reciprocity/stability between the two parties." `enumValues`: `symmetric` ("Both feel it similarly."), `asymmetric` ("One party feels it far more than the other."), `bidirectional` ("Mutual but not necessarily equal."), `adversarial` ("Opposed or hostile."), `unstable` ("Fluctuating or contested.").
- **`RELATIONSHIP.direction_kind`** — `short`: "Whether the quality flows one way or both." `enumValues`: `directed` ("From → to only."), `bidirectional` ("Held by both parties.").
- **`RELATIONSHIP.visibility`** — `short`: "Who can perceive this relationship." `enumValues`: `private` ("Not visible to others."), `shared` ("Known to some involved parties."), `public` ("Widely known in-world."), `hidden` ("Actively concealed."), `audience_only` ("Visible to the reader but not to the characters — dramatic irony.").
- **`RELATIONSHIP.status`** — `short`: "Whether the relationship is eligible to pressure new prose." `enumValues`: `active` ("Live; can compile into pressure."), `resolved` ("Settled; should not drive new pressure."), `abandoned` ("Intentionally dropped.").

### Guard test

Add a test that, for every RELATIONSHIP field path enumerated by `enumerateCanonicalPaths` except `id`: (a) `short` differs from the generic fallback string, and (b) where the field is an enum, `enumValues` keys equal the schema enum set.

## Files to Touch

- `packages/core/src/records/field-guidance-records.ts` (modify)
- `packages/core/test/<relationship-field-guidance>.test.ts` (new) — guard test

## Out of Scope

- The `FieldHelp` React component / rendering (no UI change needed; it already renders all `FieldGuidance` fields).
- Guidance for any other record type's fields.
- Schema or compiler changes (compiler behavior for `current_expression` is `archive/tickets/RELFIELD-001.md`).
- Exhaustive prose for EMOTION fields (separate concern if pursued later).

## Acceptance Criteria

### Tests That Must Pass

1. New guard test: every non-`id` RELATIONSHIP field has a specific `short` (≠ generic fallback), and every enum field's `enumValues` covers its full schema value set.
2. `npm run typecheck` — new entries conform to `FieldGuidance`/`EnumValueGuidance`.
3. `npm run lint && npm run typecheck && npm test` — full gate green; `buildGuidanceRegistry` raises no duplicate-path error.

### Invariants

1. No prompt-facing RELATIONSHIP field renders the generic `"<label> for the RELATIONSHIP record."` help text.
2. `pressure_text`, `current_expression`, and `description` guidance each state the distinction from the other two (cross-linked via `relatedFields`).

## Test Plan

### New/Modified Tests

1. `packages/core/test/<relationship-field-guidance>.test.ts` (new) — enforces comprehensiveness and enum-value coverage so the guidance can't silently regress to boilerplate.

### Commands

1. `npm test -w @loom/core`
2. `npm run lint && npm run typecheck && npm test`

## Outcome

Completed on 2026-06-09.

What changed:

- Added specific `RELATIONSHIP.*` field guidance for every author-facing relationship field.
- Added enum-value guidance for `axis`, `value`, `valence`, `direction_kind`, `visibility`, and `status`.
- Refined the prose-field guidance so `description`, `pressure_text`, and `current_expression` explain their distinct prompt-facing roles and cross-link each other.
- Extended `field-guidance-records.test.ts` with a schema-derived guard proving RELATIONSHIP fields do not fall back to generic guidance and enum guidance covers the schema values.

Deviations from original plan:

- The guard test was added to the existing `field-guidance-records.test.ts` file instead of a new file, matching the existing guidance-test organization.

Verification:

- `npm test -w @loom/core` passed.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed.
