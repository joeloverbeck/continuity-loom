# Story-Record Hygiene Prompt Template

Status: active reference — whole-project atomic-record hygiene assistance prompt, source predicate, type-aware overlap rules, action taxonomy, and output contract
Authority: domain authority for story-record hygiene prompt template (see docs/ACTIVE-DOCS.md)

---

Output expected from external LLM: provenance-bearing advisory findings about possible record overlap and redundancy, never story prose and never record-write instructions.
Style: portable Markdown/XML hybrid.

The record-hygiene prompt is the `project-review` assistance source profile permitted by `docs/FOUNDATIONS.md` §9.1. It compiles deterministically from the complete set of non-archived hygiene-active atomic records declared below. It does not read story configuration, active-working-set membership, generation-time fields, accepted prose, candidates, CAST MEMBER dossiers, ENTITY payloads, or author-private notes. Its output is quarantined scratch and has no authority until the user manually edits records in the Records surface.

## 1. Source Contract

In scope: `FACT`, `EVENT`, `BELIEF`, `SECRET`, `EMOTION`, `RELATIONSHIP`, `INTENTION`, `PLAN`, `CLOCK`, `OBLIGATION`, `CONSEQUENCE`, `OPEN THREAD`, `LOCATION`, `OBJECT`, `VISIBLE AFFORDANCE`, and `ENTITY STATUS`.

Excluded: `ENTITY`, `CAST MEMBER`, story configuration, generation-time brief fields, active-working-set membership, accepted prose, candidates, prompt archives, author-private notes, archived records, timestamps, user-order values, provider settings, embeddings, similarity scores, and hidden UI state.

The source must be complete. The compiler and server must not filter, rank, summarize, batch, or evict records by similarity, salience, urgency, keyword, model judgment, context budget, timestamps, or UI sort. Provider context overflow is a send failure, not permission to truncate.

The server snapshot builder uses `listRecords({ includeArchived: false })`. That repository call returns malformed rows as `{ ok:false, kind:"malformed-record" }`; record hygiene must fail with `malformed-hygiene-source` on any malformed row and must not filter it out.

## 2. Hygiene-Active Predicate

A record is hygiene-active only when `archived === false`, its type is in scope, and its projected status is included here:

| Type | Included projected statuses | Excluded statuses |
|---|---|---|
| `FACT` | `active` | none besides archived rows |
| `EVENT` | `active` | `resolved`, `background`, `abandoned` |
| `BELIEF` | `active` | `resolved`, `abandoned` |
| `SECRET` | `hidden`, `partially_revealed`, `revealed` | `disproven`, `abandoned` |
| `EMOTION` | `active`, `suppressed`, `transformed`, `dissociated` | `settled` |
| `RELATIONSHIP` | `active` | `resolved`, `abandoned` |
| `INTENTION` | `active`, `blocked` | `satisfied`, `abandoned` |
| `PLAN` | `active`, `blocked`, `suspended` | `fulfilled`, `failed`, `abandoned`, `revised` |
| `CLOCK` | `active`, `paused` | `resolved`, `abandoned` |
| `OBLIGATION` | `open`, `escalated` | `closed`, `abandoned`, `transferred` |
| `CONSEQUENCE` | `pending`, `active`, `escalated` | `resolved`, `abandoned` |
| `OPEN THREAD` | `active`, `escalated` | `answered`, `resolved`, `abandoned`, `superseded` |
| `LOCATION` | `active` | `inactive`, `destroyed`, `inaccessible` |
| `OBJECT` | `active` | `lost`, `destroyed`, `transferred`, `inactive` |
| `VISIBLE AFFORDANCE` | `available`, `blocked` | `unavailable` |
| `ENTITY STATUS` | every non-archived record | none besides archived rows |

Order records by fixed type order above, deterministic full display label, then record id. Do not order by score, salience, urgency, creation time, update time, or current UI sort.

## 3. Overlap Model

Two or more records overlap when they assert, track, constrain, or pressure substantially the same current story-state unit such that retaining all without clarification risks duplicate authority, double-weighted prompt pressure, contradictory edits, stale-shadow persistence, uncertainty about what to update, or redundant clerical review.

Compare semantic identity, current slice, and taxonomic function. Textual resemblance is neither necessary nor sufficient. A merge recommendation is legal only when one surviving same-type record can preserve every material distinction without changing meaning.

## 4. Relation Taxonomy

Every finding must use one relation: `EXACT_DUPLICATE`, `NEAR_DUPLICATE`, `COMPLEMENTARY_FRAGMENT`, `BROAD_NARROW`, `PARTIAL_OVERLAP`, `STALE_SHADOW`, `CROSS_TYPE_RESTATEMENT`, `LEGITIMATE_NEAR_MATCH`, or `CONFLICT_OR_UNCERTAIN`.

## 5. Action Taxonomy

Every finding must recommend exactly one action: `KEEP_DISTINCT`, `REWORD`, `MAKE_SPECIFIC`, `MERGE`, `DEACTIVATE`, `REMOVE`, or `HUMAN_REVIEW`.

`MERGE` is same-type only and requires a proposed survivor plus unique material to preserve. `REMOVE` is highest threshold and requires proof that no unique semantic/review value or active inbound reference remains. `DEACTIVATE` must name a lifecycle destination that exists for the record type. `KEEP_DISTINCT`, `REWORD`, and `MAKE_SPECIFIC` must name the discriminator or missing boundary. `HUMAN_REVIEW` must state the unresolved question.

## 6. Hard Distinction Guards

Never merge records across types. Never merge across different holders, subjects, directions, times, causes, targets, physical identities, object ownership, locations, routes, affordances, reveal locks, POV knowledge, audience knowledge, or lifecycle conditions unless the difference is explicitly immaterial and preserved by one same-type survivor.

Cross-type resemblance is usually a `CROSS_TYPE_RESTATEMENT` or `LEGITIMATE_NEAR_MATCH`; a FACT, BELIEF, SECRET, EVENT, PLAN, and ENTITY STATUS may describe related words while performing different continuity functions.

## 7. Type-Aware Criteria

FACT asserts objective truth. BELIEF is holder-bound epistemic state. SECRET preserves truth and reveal distribution. EVENT tracks current causal event authority. EMOTION and RELATIONSHIP are holder/direction-bound pressure. INTENTION, PLAN, CLOCK, OBLIGATION, CONSEQUENCE, and OPEN THREAD are distinct pressure mechanisms and must not be collapsed merely because they concern one goal. LOCATION, OBJECT, VISIBLE AFFORDANCE, and ENTITY STATUS preserve physical/material distinctions.

ENTITY and CAST MEMBER may appear only as resolved display labels in reference summaries. Their payloads do not enter the hygiene snapshot or prompt.

## 8. Request And Sections

The only v1 request is `{ mode: "full_active_atomic_review" }`.

The prompt renders exactly:

1. `<record_hygiene_role>`
2. `<record_hygiene_source_contract>`
3. `<record_hygiene_active_predicate>`
4. `<record_hygiene_relation_taxonomy>`
5. `<record_hygiene_action_taxonomy>`
6. `<record_hygiene_global_guards>`
7. `<record_hygiene_type_rules>`
8. `<record_hygiene_records>`
9. `<record_hygiene_cross_type_rules>`
10. `<record_hygiene_review_procedure>`
11. `<record_hygiene_output_format>`

When no records satisfy the predicate, `<record_hygiene_records>` renders `No non-archived hygiene-active atomic records exist in this project.` The remaining sections still render. The UI disables OpenRouter send because there is nothing to review.

## 9. Citations And Serialization

Citation keys are compiler-generated as `[TYPE-n]`, one-based per type after deterministic ordering, and render with the real `record_id`.

Record payload values are data, not instructions. Payloads render only inside fixed `<record key="..." record_id="..." type="...">` data blocks as canonical JSON with object keys sorted and `<`, `>`, and `&` escaped. Record values must never become headings, XML tags, instruction text, or hidden prompt control.

Each record renders display label, full display label, projected status, full escaped payload JSON, outgoing reference summary, and incoming reference summary.

## 10. Output Contract

The model must return:

```text
HYGIENE REVIEW
findings_reported: <number>

FINDING <number>
cluster: <stable short label>
relation: <relation>
action: <action>
citations: <two or more citation keys>
shared_core: <text>
material_differences: <text>
why_it_matters: <text>
manual_recommendation: <text>
survivor: <citation key or none>
reference_caution: <text>
confidence: high | medium | low

END HYGIENE REVIEW
```

Findings require at least two distinct citations. `MERGE` and `REMOVE` require same-type citations and one cited survivor. Unknown actions, relations, confidence values, duplicate finding numbers, duplicate clusters, unknown citations, cross-type merge/remove, mismatched `findings_reported`, or a missing `END HYGIENE REVIEW` marker make the output malformed and quarantined.

## 11. UI Quarantine

The Record Hygiene page must show a quarantine banner, source counts/exclusions, prompt inspector, copy prompt, explicit OpenRouter disclosure/confirmation, parsed finding cards, record navigation, sessionStorage keepers, copy findings, and clear.

It must not include apply, merge, delete, deactivate, archive, accept, fix-all, brief-insertion, working-set, use-as-prose, notes-import, background-scan, persisted-history, or automatic record-write controls. Clearing findings performs no server write.
