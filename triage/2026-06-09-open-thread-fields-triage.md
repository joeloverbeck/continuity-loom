# Triage — OPEN THREAD field guidance, the answer_if_known control, and EVENT.sequence_order (2026-06-09)

Source: user-reported confusion while editing an OPEN THREAD record in a production story (no formal report). Diagnostic + conformance-audit brainstorm; the request itself was the spec. The user explicitly scoped out the triage folder for alignment reads, so the `triage/` prior-triage discovery was **skipped per that exclusion**; this companion is nonetheless written because the triage produced ≥3 tickets (the exclusion governs reads, not this output). Filed under root `triage/` per the current brainstorm-docs convention.

## Question (verbatim, condensed)

(1) What goes in an OPEN THREAD `summary` — a recap of everything that happened, a description of what the thread is about, or a hint at consequences? (2) `answer_if_known` is a selectbox that only allows `none` — clearly broken; trace its purpose, origin, intended uses, and prompt display. Then audit and strengthen the guidance of **all** OPEN THREAD fields so no one is confused again about what each field is and how it is used. Align with `docs/**`. A follow-up concern asked how `EVENT.sequence_order` is used in prompt generation and whether it adheres to `docs/**`.

## Findings

### O1 — `summary` has only auto-generated boilerplate; the three prose fields are not differentiated
`summary` has no `specificGuidance` override (`field-guidance-records.ts:58-182`), so it falls through to the `recordEntry` default (line 209: "summary for the OPEN THREAD record.") — no examples, no contrast with siblings. Docs + compiler settle the meaning: `summary` is concise present-tense prose describing *what the unresolved thread is*; it compiles into `{active_open_threads}` right after the title (`compiler/sections/pressure.ts:99-107`). It is **not** a recap of past events (prose-derived summaries are barred from prompt context — `docs/ACTIVE-DOCS.md:125`), **not** a consequence hint (that is `possible_pressure_now`), **not** the answer (`answer_if_known`). FOUNDATIONS §18 (`docs/principles/FOUNDATIONS.md:607`): color local pressure without commanding closure.
→ **OPENTHREAD-002**

### O2 — `answer_if_known` renders as a single-option "none" selectbox (real UI bug)
Schema `z.union([nonemptyString, z.literal("none")])` (`causal-pressure.ts:139`). `enumValuesForSchema` (`editor-descriptors.ts:355-372`) flat-maps the union → `["none"]`; `describeField` (`279-282`) classifies it `kind: "enum"`; the editor renders a `<select>` (`RecordEditor.tsx:533-542`) and, the field being required, offers no "Unset" (`EnumGuidance.tsx:71`). Net: a required field permanently pinned to `none` — an author can never record an answer. Correct shape is a scalar prose-or-sentinel field (the scalar analogue of the existing `sentinel_prose_list`).
→ **OPENTHREAD-001**

### O3 — `answer_if_known` prompt-facing status is contradictory; correct classification is "never"
Guidance marks it `promptFacing: "conditional"` (recordEntry default), so the popup falsely says it is sent to the prompt (`FieldHelp.tsx:122-137`). The compiler never renders it — `pressure.ts:99-107` emits only title/summary/urgency/possible_pressure_now, and no resolver references the field. Per §18, feeding a known answer to the prose writer would pressure premature closure/reveal. It is authoring metadata: classify `promptFacing: "never"` (set in the override, not via `operationalFields`). No compiler/runtime behavior changes — this aligns the metadata surface to the already-correct behavior.
→ **OPENTHREAD-002**

### O4 — every other OPEN THREAD field has only boilerplate guidance
`type`, `status`, `title`, `audience_visibility`, `urgency`, `current_relevance` fall through to the `recordEntry` default with no per-enum-value guidance (the popup "Values" section renders empty). Authors cannot distinguish `tension` from `mystery`, do not know only `status: active` compiles (`isActiveStatus`, `pressure.ts:228-230`), and do not know `audience_visibility`/`current_relevance` are operational. Only `possible_pressure_now` is well-specified (`field-guidance-records.ts:177-181`).
→ **OPENTHREAD-002**

### O5 — EVENT.sequence_order: same broken-selectbox bug AND a dormant/mislabeled field (adjacent discovery, then user-confirmed concern)
Surfaced during the OPENTHREAD-001 blast-radius check. `sequence_order: z.union([z.number().finite(), nonemptyString, z.literal("unknown")])` (`causal-pressure.ts:24`) renders as a single-option `unknown` dropdown via the same root cause. Additionally, it is **not used in prompt generation at all**: no compiler section references it (grep of `compiler/` is empty), and event ordering runs off `metadata.userOrder` → family → salience → urgency → label → id (`compiler/ordering.ts:30-41`), never the payload field. The only reference in `src` is its schema declaration. `docs/specs/story-record-schema.md:738` declares `number | prose | unknown` with no prompt role and `docs/specs/compiler-contract.md` lists none — so the compiler's omission conforms to the contract, but the guidance falsely marks the field prompt-facing and its purpose is wired to nothing. Treated as authoring metadata (FOUNDATIONS §8: deterministic record ordering, not a payload field, is the ordering authority). Wiring it into compiled output/ordering would be new behavior needing a spec — out of scope.
→ **EVENTSEQ-001**

## Finding → deliverable map

| Finding | Outcome |
|---|---|
| O2 | `tickets/OPENTHREAD-001.md` — scalar prose-or-sentinel field kind in descriptors + renderer + tests |
| O1, O3, O4 | `tickets/OPENTHREAD-002.md` — strengthen all OPEN THREAD field guidance + reclassify `answer_if_known` to `never` |
| O5 | `tickets/EVENTSEQ-001.md` — fix the `sequence_order` control (generalizes OPENTHREAD-001) + reclassify to `never`; scopes out any ordering/compiler change |

Dependencies: EVENTSEQ-001 depends on OPENTHREAD-001 (generalizes its sentinel-scalar detector/renderer). OPENTHREAD-001 and OPENTHREAD-002 are independent.

## What already conforms (coverage note)

- The OPEN THREAD schema (`causal-pressure.ts:128-141`) matches `docs/specs/story-record-schema.md` §8.7 field-for-field — no schema defect; no validation change.
- `possible_pressure_now` guidance is already strong and is the template `summary` should match.
- The compiler is already FOUNDATIONS-correct for both excluded fields: `answer_if_known` and `sequence_order` are kept out of the prompt, consistent with §18 (no commanded closure) and the compiler-contract (neither is a listed compiled field). O3/O5 fix only the *metadata claims* about these fields, not behavior.
- `answer_if_known` and `sequence_order` staying **required with their sentinels** (`none` / `unknown`) is the correct, consistent pattern (mirrors `SECRET.forbidden_reveals`).

## FOUNDATIONS alignment

- §18 OPEN THREAD colors local pressure without commanding closure @ guidance + prompt-facing classification — **aligns**: O3 makes the no-closure principle explicit at the authoring surface; O1/O4 strengthen authoring legibility; O2 is a UI-correctness fix with no compiler effect.
- §8 deterministic compilation @ EVENT ordering — **aligns**: O5 reclassifies `sequence_order` as authoring metadata, matching the contract that ordering is the deterministic record ordering (`metadata.userOrder`), not a payload field; compiled output stays byte-for-byte unchanged.
- No §29 hard-fail tripped; no FOUNDATIONS amendment required. An optional one-line `docs/specs/story-record-schema.md` note (per OPENTHREAD-002 / EVENTSEQ-001) keeps the schema doc consistent with the corrected guidance.

## Named assumptions

1. No schema/validation change — `answer_if_known` and `sequence_order` stay required-with-sentinel (not made optional).
2. `answer_if_known`/`sequence_order` are reclassified `never` via per-path guidance overrides, not by adding them to `operationalFields` (they are authored content, not operational/UI metadata).
3. Wiring `sequence_order` into compiled ordering/output is deferred as a future spec, not folded into EVENTSEQ-001.
4. Ticket namespaces: new `OPENTHREAD-NNN` (OPEN THREAD record surface) and new `EVENTSEQ-NNN` (EVENT.sequence_order surface) — no archive collision; EVENTSEQ chosen over `OPENTHREAD-003` because the prefix names the record surface and this is an EVENT field.
