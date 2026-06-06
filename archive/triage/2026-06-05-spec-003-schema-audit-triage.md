# SPEC-003 Schema Audit Triage — 2026-06-05

**Trigger:** Round-2 audit of the SPEC-003 typed-data-model implementation against
`docs/story-record-schema.md`, after a prior `SPEC003SCHEMAFIX-001..004` pass
(commits `Close cast member extended schemas`, `Fix consequence reference UUID guard`,
`Restore global config schema fidelity`, `Remove stop guidance stop_before field`)
had already corrected the first wave of deviations.

**Scope:** All 29 schema surfaces (global config §2, generation brief §3, entity/cast
§4–5, knowledge §6, space/material §7, causal pressure §8, relationship/emotion §9),
the record-type registry, the `@loom/server` DDL + repository, and every reference
extractor — audited field-by-field, enum-value-by-enum-value, against the schema doc
and SPEC-003 deliverables.

**Confidence:** ~95%. Every actionable finding below is confirmed by direct code reads.

## Method

Six parallel auditors each owned a schema slice and compared the Zod implementation
to the authority doc; a seventh swept every `extractReferences` for the
non-UUID-projection defect class fixed in `SPEC003SCHEMAFIX-002`. Load-bearing
findings were re-verified first-hand before ticketing.

## Faithful (no action)

- **§2 global config** (STORY CONTRACT / UNIVERSAL CONTENT POLICY / PROSE MODE) —
  fully faithful (post `SCHEMAFIX-003`).
- **§3 generation brief** — all eight surfaces' enum sets exact, including the
  deliberately-distinct §3.1 (6-value) vs §3.5 (7-value, adds `present_minor_speaker`)
  `local_function` enums; `must_render`/`generation_context`/`soft_unit_guidance`
  required-handling correct (post `SCHEMAFIX-004`). (Two field-level findings below.)
- **§4–5 entity/cast** — ENTITY (11+11 enums), ENTITY STATUS, and the full CAST MEMBER
  core+extended dossier faithful; `additional_do_not_write` correctly removed
  (post `SCHEMAFIX-001`).
- **§6 knowledge** — FACT/BELIEF/SECRET field sets and all long enums exact;
  `deprecated_fact` and `branch_counterfactual` correctly absent. POV/AUDIENCE
  KNOWLEDGE PROFILES (§6.4/6.5) correctly unimplemented (compiled projections, Phase 7).
- **§7–8 space/causal** — all 10 types faithful, including 20-value `action_families`,
  11-value `clock_kind`/`obligation_kind`/`consequence_kind`, the `plan_status`
  field-naming trap, and CLOCK `tick_history` nesting.
- **§9 relationship/emotion** — RELATIONSHIP (18-value `axis`) and EMOTION (22-value
  `affect_kind` incl. literal `null`, 18-value `behavioral_pressure`) faithful.
- **Registry / server** — all 21 registry types present; PLAN `plan_status` projected;
  status-less types project NULL; all five DDL tables + columns correct; idempotent
  `ensureRecordTables` invoked on both create and open paths; reference-integrity
  archive/delete genuinely implemented; `accepted_segments` isolated from all record
  and reference queries.
- **CONSEQUENCE `holder_or_target`** scalar `recordId` union member — a faithful
  encoding of the doc's `location_id | object_id` placeholders. Not a deviation.
- **§3.1 ACTIVE WORKING SET** `present_minor_cast_compressed` / `offstage_relevant_cast`
  `.default([])` — §3.1 is not under a "Required fields" heading, so defaulting is
  faithful. **Deliberately left unchanged.**

## Actionable findings → tickets

| ID | Finding | Severity | Resolution | Ticket |
|---|---|---|---|---|
| O1 | ENTITY STATUS `current_location` emits a reference for the `unknown`/`concealed`/`offstage`/`not_applicable` sentinels (`entity.ts:67`), polluting `record_references` with non-UUID `target_id`s. Same defect class as the fixed CONSEQUENCE bug. | HIGH | Code fix — route through `referenceIfId` guard. | `SPEC003SCHEMAFIX-005` |
| O2 | EVENT `location` (a reference-bearing `location_id` field) is never extracted (`causal-pressure.ts:157–161`), so real EVENT→LOCATION edges never reach the projection. | MEDIUM | Code fix — add a guarded `referenceIfId("location", …)` edge. | `SPEC003SCHEMAFIX-006` |
| O3 | BELIEF and SECRET carry payload `salience` (§6.2/§6.3) but wire no `projectSalience` (`knowledge.ts:96–112`), so their denormalized `records.salience` column is always NULL — salience filtering silently omits all beliefs/secrets. | MEDIUM | Code fix — add `projectSalience` to both definitions. | `SPEC003SCHEMAFIX-007` |
| O4 | CURRENT AUTHORITATIVE STATE `offstage_pressuring_entities` carries `.default([])` (`generation-brief.ts:35`) though §3.2 lists it under "Required fields" alongside the required sibling `onstage_entities`. | MEDIUM | **Code fix** — remove the default (make required; explicit `[]` still valid). Alternative *relax-the-doc* resolution was considered and **rejected**: `story-record-schema.md` is the field-level authority (CLAUDE.md), and the project rule is to fix code to the doc, not relax the doc to a `.default([])` convenience. | `SPEC003SCHEMAFIX-008` |

## Deferred / not ticketed

- **LOW** — `record-tables.ts:10–11` declares `salience`/`urgency` columns as `REAL`,
  but the domain is enum strings. Harmless today (SQLite TEXT affinity round-trips,
  verified) and free to change since no released stores exist. Originally left
  unticketed by user decision (scope = O1–O4). **Update 2026-06-05 (round-3 audit):**
  now ticketed as `SPEC003SCHEMAFIX-009` (REAL→TEXT + narrow the metadata Zod union
  to a string enum), realizing Decision of record #3's "deferred, not rejected."

## Round-3 audit addendum (2026-06-05)

A follow-up audit re-confirmed the round-2 findings are all implemented in current code
(`SPEC003SCHEMAFIX-005..008` landed via commits `Fix entity status location references`,
`Project event location references`, `Project belief and secret salience`,
`Require offstage pressuring entities`) and surfaced one **new** finding beyond the
round-2 scope:

- **LOW** — `record-repository.ts` `updateRecord` does not check that the parsed
  payload's `id` equals the row PK (`input.id`), so an id-bearing record could persist a
  row whose PK and `payload_json.id` disagree. No live route exposes it yet (Phase 4), but
  it is a record-identity integrity edge. Ticketed as `SPEC003SCHEMAFIX-010`.

## FOUNDATIONS alignment

All four tickets **restore** alignment — none tension the constitution. O1/O2 clean the
deterministic reference substrate (§8 deterministic compilation, §11 fail-closed
validation); O3 restores faithful denormalized projection for §13 record continuity;
O4 honors the §3.2 "always included / explicit" rule. No amendment required.

## Decisions of record

1. **O4 resolved as code-fix, not doc-relax** (user delegated; decided per CLAUDE.md
   doc-authority and the "fix code to the doc" rule).
2. **§3.1 defaulted lists and CONSEQUENCE `holder_or_target` are faithful** — no future
   re-triage should re-propose them as deviations.
3. **Column affinity (REAL→TEXT) deferred**, not rejected — eligible for a future LOW
   cleanup ticket if desired. **Resolved 2026-06-05: ticketed as `SPEC003SCHEMAFIX-009`.**
