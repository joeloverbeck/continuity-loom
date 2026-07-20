# Bounded Cast Draft Contract Comparison

Status: completed evidence report
Date: 2026-07-20
Tracker: GitHub issue #126

## Outcome

The current full-dossier arm maximized populated downstream material, but it did so by asking the author to review 49 invention flags for a deliberately sparse dossier. The required-core-plus-explicit-optional arm eliminated invention pressure and was immediately schema-valid, but it omitted the one optional field directly supported by the input and promoted mostly explicit-unknown core guidance when made active.

**Selected disposition: reopen #117.** The evidence is strong enough to reconsider the current drafting contract, but one paired exercise is not broad enough to ratify a replacement rule. This report does not reopen or otherwise mutate #117.

## Boundary and controls

This was a source-and-document-blind, evidence-only exercise. Two fresh cold contexts received the same bounded dossier, field set, output rules, and quality rules. Neither context received repository sources, active documents, project records, accepted prose, or the other arm's output. The only varied text was the drafting contract:

- Current full-dossier arm: populate every required and optional field, invent fitting proposals where the dossier is silent, and declare each substantially invented field.
- Counterfactual arm: populate required core with truthful explicit-unknown guidance where needed; include optional fields only when the dossier directly supports them; do not invent merely to populate optional fields.

The common dossier established only that Elias Venn is Mara Chen's estranged former mentor, is currently offstage, is remembered as a technical authority, and taught Mara a private precise calibration sequence that resembles a suspect transmission without proving its sender. His present condition, location, motive, agency, voice, body, behavior, and broader psychology were explicitly unknown.

No product code, prompt template, authority document, schema, compiler rule, skill, OpenRouter endpoint, browser state, or project store participated in draft generation. Raw outputs remained temporary. Privacy-safe identities for reproducibility are:

| Arm | Raw-output SHA-256 | Bytes | Words |
|---|---:|---:|---:|
| Current full dossier | `4697ae4c5c98c1561beded874f419ecd2239ca2f25323f59d959fe3a354413e0` | 14,480 | 1,574 |
| Counterfactual | `cec23402ae36dd11ffc256a8d4a4689cc34fd6ab782470019b8d83ddfd273d38` | 3,687 | 421 |

## Evaluation method

The same evaluator was applied to both raw outputs.

- The registered Cast draft parser and mapper checked parseability, allowed keys, empty or malformed values, and enum values.
- A pure `castMemberSchema.safeParse` with the same synthetic linked ENTITY id served as one dry-run save-schema attempt. It did not call the server or mutate a project.
- Counts use 51 normalized schema fields: each scalar field, prose-list field, and `sample_utterances` collection counts once. Present explicit-unknown guidance counts as uncertain; omitted optional fields count as skipped; a declared invention takes precedence over the other present states; all other present fields count as filled.
- The bounded review separately checked declared inventions against the dossier and checked whether directly supported optional material was omitted.
- Cost uses action count because comparable elapsed time was not captured. The count is one cold draft action, one dry-run schema attempt, each surfaced invention decision, and each contract-compliance correction decision.
- Downstream utility used the current deterministic compiler in memory. Both arms used the same synthetic ENTITY, CAST MEMBER identity, empty generation-time pins, versions, and story configuration. The only promotion delta was the same `offstage_relevant_cast` to `active_onstage_cast_full` band change and matching offstage-to-active local function change. No prompt was sent.

“Useful” below means deterministically rendered and available to a future prose model. It does not mean true, high quality, or safe to adopt without review.

## Measurements

### Structural compliance and field state

| Measure | Current full dossier | Counterfactual |
|---|---:|---:|
| JSON parsed | yes | yes |
| Mapper-skipped malformed/unknown values | 0 | 0 |
| Required core present | 25 / 25 | 25 / 25 |
| Optional fields present | 26 / 26 | 0 / 26 |
| Arm-contract compliance | pass | miss: 0 / 1 directly supported optional field |
| Dry-run schema attempts | 1 | 1 |
| Dry-run schema result | pass | pass |
| Actual project save attempts | 0 | 0 |
| Filled fields | 2 | 3 |
| Skipped fields | 0 | 26 |
| Uncertain fields | 0 | 22 |
| Declared substantially invented fields | 49 | 0 |
| Separate uncertainty notes | 5 | 4 |

The current arm's two non-invented filled fields were `identity.one_line` and `relational_charge`. Its 49 declared inventions covered voice, pressure behavior, embodiment, agency, most optional richness, and the sample utterances. Bounded review confirmed 44 fields as clearly invention-bearing. Five paths were conservatively overflagged by the draft because their content was primarily dossier-derived prohibitions or explicit-absence guardrails; no unflagged invention was found.

The counterfactual's three filled fields were `identity.one_line`, `voice_anchor.must_avoid`, and `voice_anchor.anti_repetition_warnings`. Twenty-two required fields used explicit unknown or not-established guidance. All 26 optional fields were omitted, including `relational_charge`; the established estranged-former-mentor relationship made that one omission a counterfactual-contract miss. No unflagged invention was found.

### Author correction and readiness cost

| Cost measure | Current full dossier | Counterfactual |
|---|---:|---:|
| Corrections needed for JSON/schema validity | 0 | 0 |
| Invention accept/replace/reject decisions before durable adoption | 49 | 0 |
| Contract-compliance correction decisions | 0 | 1 (`relational_charge`) |
| Observed action-count proxy including review | 51 | 3 |

Both arms were truthfully reviewable because uncertainty and invention metadata were visible, and both passed the registered payload schema on the first dry run. “Schema-valid” is not “ready as a rich active character”: the counterfactual's explicit-unknown core is safe but offers little positive characterization, while the current arm cannot be treated as authored continuity until its 49 surfaced proposals are individually accepted, replaced, or declined.

No comparable elapsed-time measure was available. No actual save was attempted because the issue prohibits stored-project mutation; the dry-run schema attempt is the nearest non-mutating comparison and is reported separately rather than presented as a real save.

### Deterministic prompt utility under the same promotion

| Measure | Current full dossier | Counterfactual |
|---|---:|---:|
| Offstage fingerprint | `fnv1a32:cd72d438` | `fnv1a32:d33fb935` |
| Offstage prompt bytes | 16,124 | 16,013 |
| Fields rendered in offstage band | 2 | 2 |
| Present fields unused while offstage | 49 | 23 |
| Active fingerprint | `fnv1a32:2b040699` | `fnv1a32:a8701432` |
| Active prompt bytes | 27,050 | 18,939 |
| Fields rendered in active band | 51 | 25 |
| Fields newly rendered on promotion | 49 | 23 |
| Sample utterances rendered | 3 | 0 |
| Newly rendered fields needing invention review | 49 | 0 |

Before promotion, both arms contributed only `identity.one_line` and `voice_anchor.core_voice`. The identity sentence was grounded in both. The current arm's voice anchor was a declared proposal; the counterfactual instead contributed an explicit warning that no voice pattern was established. The remaining populated detail was unused while Elias remained offstage.

After the same promotion, the current arm made all 51 fields available and increased the prompt by 10,926 bytes relative to its offstage form. That included potentially useful specific voice, behavior, embodiment, agency, and sample material, but almost all of the newly available detail required author review because it was proposed rather than dossier-grounded.

The counterfactual made 25 fields available and increased the prompt by 2,926 bytes. Its newly rendered material mainly preserved unknowns and anti-invention boundaries. That is useful for continuity safety but weak as positive active-character guidance. Adding the omitted grounded relational charge would improve it without invention, but the raw cold output did not do so.

## Interpretation

The exercise exposes two different costs rather than a simple winner.

- The current contract reliably produces a complete, richly usable active-band shape and correctly surfaces its invention burden. In this sparse case, however, the burden dominated the output: 49 of 51 normalized fields entered the author-review queue.
- The counterfactual sharply reduced output size and eliminated invented characterization, while remaining schema-valid. It also showed that “optional only when supported” needs a stronger extraction check: it skipped a plainly supported relational field, and required core still became mostly explicit-unknown guidance.
- Offstage compilation makes most full-dossier labor dormant. Promotion exposes that labor, but also exposes every accepted invention. The value of the additional bytes therefore depends on author review, not structural completeness alone.

This supports reopening the existing contract for a narrower design decision about evidence-gated optional drafting, required-core unknown handling, and how the import review should distinguish grounded guardrails from proposed characterization. It does not support silently replacing the current contract.

## Limitations and confounds

- This is one bounded dossier and one cold output per arm. It cannot estimate population-wide quality, variance, or model sensitivity.
- The common rules and dossier were fixed across arms, but the contract wording necessarily differed and had different instruction length.
- The 51-field classification is report-level normalization. The product mapper reports scalar/list-item paths at a finer granularity.
- Invention declarations are model self-reports. The bounded manual review reduced but cannot eliminate classification judgment.
- The counterfactual's missed `relational_charge` makes it an imperfect example of its own contract.
- Action count is a proxy. Elapsed time, cognitive effort, and the cost of rewriting accepted proposals were not measured.
- Schema validation was in memory. No browser import, server save, storage round trip, provider request, or OpenRouter cost was part of this exercise.
- The compiler comparison proves deterministic inclusion for these two payloads and this band transition; it does not measure prose quality or whether a provider would use the rendered details well.

## Lawful current manual alternative

The author can continue using the existing static Cast Member draft prompt outside the app, review every uncertainty and invention in the quarantined import report, preserve or select the linked ENTITY manually, replace or decline proposals field by field, leave lawful optional collections empty, and save only the dossier they choose to make authoritative. They may also author the dossier directly without external assistance. Neither path grants draft output canon or prose authority.

## Authority and mutation statement

This comparison is historical evidence only. It changes no product behavior, schema, validation rule, Cast draft prompt, compiler, active authority document, skill, stored project, OpenRouter state, or tracker disposition other than supporting closure of its own evidence issue. Closed #117 remains authoritative unless separately reopened through tracker action.
