# Independent provenance map: `code-review`

## Scope and evidence boundary

This is a provenance-only map. It does not judge a candidate, score behavior, or claim that any instruction is necessary merely because it is old or validator-enforced.

Evidence inspected:

- Git history and diffs for `.claude/skills/code-review/**`.
- The event records in `reports/skill-evidence/code-review/events.jsonl` and their committed-versus-worktree status.
- File names in this decontamination run and byte identity of the live `SKILL.md` and the run baseline.

Deliberately not inspected:

- corpus rubrics;
- any trial output;
- any candidate content.

No live target, event ledger, or gate-status file was edited.

## Status of the claimed run

- The live `.claude/skills/code-review/SKILL.md` and `baseline/SKILL.md` are byte-identical (`sha256 db36af66b0c4cf8190cb361efb03bd017731474605ee8657184c14603331e910`). The target itself is not modified in the worktree.
- The code-review ledger contains `decontamination_started` event `evt_d42f0db8-6137-474a-aa81-aaa7e0e61fad`, recorded at `2026-07-21T02:04:12.677Z`, for review `dec_4bdc2f7f-a55a-4ed3-8f36-5305480cd71e` and the same target hash as the preceding five use records.
- No terminal decontamination event is present in that ledger. The start event's `provisional_trial_count: 7` and risk rationale are a plan, not trial evidence or an acceptance result.
- The run directory was untracked at inspection time. Its pre-existing file inventory contained a baseline and corpus setup, but no terminal report or trial-output file. This map adds only the independent analysis file.
- Of the six current event lines, only the first use record was in `HEAD`; the other four use records and the decontamination-start event were worktree-only. Therefore the repository history supports “run started locally,” not “decontamination completed” or “candidate accepted.”

## Instruction provenance timeline

| First appearance in this repository | Major instruction group | Provenance class | What the history does and does not establish |
|---|---|---|---|
| `2026-07-16`, `06b719a7` on the active lineage; duplicate import `0ca56b68` on another lineage | Core two-axis model: pin a comparison point, review Standards and Spec independently, source each axis, use the Fowler smell baseline, prefer independent reviewers when allowed, use separated local fallback otherwise, report axes separately | Durable review-domain nucleus | Both parent commits lacked the path and both subjects are only “Copied over skills.” This repository establishes the import date, not the instructions' original author, incident, or prior validation history. |
| `2026-07-16`, same import | Review-frame custody: resolve fixed point and reviewed HEAD, preserve the original frame across fixes, include WIP inputs explicitly, fail early on a bad ref or empty diff | Mixed: durable review behavior plus closeout bookkeeping | The explicit comparison frame is intrinsic to reviewing a change. Exact durable field wording and the blanket empty-diff hard stop are operational policy and need scenario trials, especially for non-diff deliverables. |
| `2026-07-16`, same import | Spec completeness: per-issue coverage, parent coverage, named acceptance items, user-story rows, composite acceptance atoms, sequence proof, production route/action-path proof, browser-N/A challenge, exact-acceptance challenge, nonlocal-proof challenge | Durable Spec-axis behavior, expressed through audit-heavy output requirements | The semantic checks are review behavior. The mandated tables, keyed rows, and exact tokens are evidence-accounting mechanisms. Their presence in the initial bulk import gives no local incident provenance. |
| `2026-07-16`, same import | Implementation-closeout appendix: normal/fallback body shapes, accepted-residual records, TDD handoff fields, browser freshness, console state, backend currentness, evidence identities, manifests, GitHub byte ceiling, builder and validator commands | Downstream handoff and validator bookkeeping | This material arrived already coupled to `implement` and `tdd` and to executable validators. It is not the basic code-review method. Git age alone is not evidence that every copied field belongs in this skill. |
| `2026-07-17`, `6645191e` | Repository authority routing changed from a presumed `docs/principles/README.md` to `docs/ACTIVE-DOCS.md`, `docs/agents/domain.md`, `CONTEXT.md`, and relevant ADRs | Durable repository/domain behavior | This is a concrete adaptation to Continuity Loom's authority layout. It is the clearest locally grounded domain change in the history. |
| `2026-07-17`, `6645191e` | Immutable `P<N>-standards|spec-<ordinal>` finding ledger, repair classes, RF mappings, keyed TDD review-fix map, structured evidence JSON as a single derivation source | Audit bookkeeping and cross-skill validator contract | The same commit substantially changed normal/fallback validators and tests. The shape is intended to reconcile counts and generated closeout evidence; it is not itself a rule for finding code defects. |
| `2026-07-18`, `e34fadc9` | Pre-fix reporting gate: show both initial axis reports, counts, and worst severities before any repair; rerun after repairs | Durable review-domain behavior | This changes reviewer/user interaction, not only output syntax. The commit subject “Updated skills” gives no incident attribution, so necessity and usability still require trials. |
| `2026-07-18`, `a3d6b437` | Shared review/TDD evidence parsing and validation refactor; no `SKILL.md` behavior change | Validator maintenance | The commit moved/reused helper logic and removed duplicated validator code. It should not be read as evidence that agent behavior improved. |
| `2026-07-19`, `d3dbe5f` | Pre-dispatch Standards/Spec inventories, exact handoff inventory reconciliation, reviewer cleanup proof, resume/compaction reconstruction | Audit custody and coordination bookkeeping | Added alongside 141 lines of normal-validator changes and 120 lines of validator tests. These fields preserve attribution and state across handoff, but the commit subject about method-gap research is not proof that research identified them. |
| `2026-07-19`, `f0570194` | Large tracker-body workflow delegated to the implement-owned contract; zero-residual Spec output hard-stops if required tables/maps/sequence are absent | Mixed: durable module boundary and durable Spec completeness, plus validator enforcement | Removing a copied CLI sequence from code-review is a clear ownership/deepening move. Rejecting incomplete zero-finding output is semantic. Exact enforcement remains validator-shaped. The “3rd playtest” subject is context, not a causal incident record. |
| `2026-07-19`, `45160f9f` | Orientation explicitly separates the standalone Steps 1-5 core from implement-only closeout fields | Scoping/documentation, potentially durable | This is a late explanatory claim over a much older mixed document. It is useful provenance evidence that maintainers recognized two layers, but not proof that standalone agents reliably ignore the appendix. |
| `2026-07-19`, `10e1c19f` | Residual wording changed from “no unhandled...” to the validator literal “unhandled findings none...”; evidence-identity reference gained lexical cautions | Validator compatibility | This is exact-token repair, not domain behavior. The accompanying commit subject about CAST MEMBER PRD prep does not establish why the token was needed. |
| `2026-07-20`, `7e8a5458` | Concrete tracker-comment identities, structured interrupted-review recovery, final-review inventories that preserve and extend dispatch authority, resolved ADR/principle status wording | Audit custody and recovery behavior, enforced by validators | The commit added 143 validator lines and 172 validator-test lines. Recovery attribution is a real coordination invariant; the prescribed field grammar and inventory equality are bookkeeping. This commit predates all recorded use events below, so those events did not originate the patch. |

Current-line attribution reinforces the import-heavy history: 184 of 233 `SKILL.md` lines blame to the initial `06b719a7` import; only 49 lines blame to all later local commits combined. That ratio is provenance, not a quality score.

## Event-to-instruction map

| Event | What it can be tied to | Provenance limit |
|---|---|---|
| `evt_79c332b8-d979-43f4-8a49-9d9ee162e3e4`, `2026-07-20T19:28:55.708Z`, friction / `tool-compatibility` | Reviewer cleanup: both axes reportedly completed, but no close operation was available; workaround used terminal inventory and the unavailable-close disposition | Cleanup/unavailable-close wording already existed in the initial import four days earlier. The event corroborates a live tool mismatch but did not cause that instruction. It has no evidence refs and `top_level_session_id` is unavailable. |
| `evt_305471a6-5329-459b-851e-96a24de04ae7`, `2026-07-20T22:33:20.384Z`, clean | A normal implementation review of issue `#130` reportedly completed | No symptom, evidence ref, or session identity is recorded. It does not validate any particular instruction group. |
| `evt_fed7ac29-fd2c-4eb2-afc7-34f3197e4cab`, `2026-07-21T00:09:12.288Z`, friction / `cost` | Tension between the non-empty-diff preflight and a tracker-only constitutional-approval packet; workaround used unchanged `HEAD` plus full local fallback evidence | This is the only recorded evidence against the breadth of the imported empty-diff rule/fallback burden. It supports trialing a tracker-only/non-code review mode; it does not by itself prove which rule should change. No evidence refs are present. |
| `evt_dff2d242-d468-4abb-bcf8-09a4fa5a5783`, `2026-07-21T00:11:06.862Z`, clean | Issue `#131` implementation review reportedly completed | Self-recorded clean outcome only; no linked artifacts or detailed branch coverage. |
| `evt_d9ce2484-d237-4db1-bcd8-c3bcc7c2145e`, `2026-07-21T01:53:40.981Z`, clean | Issue `#134` implementation review reportedly completed | Self-recorded clean outcome only; no linked artifacts or detailed branch coverage. |
| `evt_d42f0db8-6137-474a-aa81-aaa7e0e61fad`, `2026-07-21T02:04:12.677Z`, decontamination started | Owner-confirmed legacy basis; seven provisional scenarios proposed for multi-axis review, coordination, and downstream handoff risk | A start receipt is not a completed run, trial result, candidate decision, or permission to edit the target. |

The first event is committed in `e568f592`; the later five lines are local worktree additions. All five use records target the same content hash, so they concern the current imported-and-patched version, but none supplies an evidence reference. The three clean labels therefore count as usage bookkeeping, not independent behavioral validation.

## Durable nucleus versus provenance-heavy cargo

### Strongest candidates for durable domain behavior

These rules directly define what a code review is trying to accomplish and survived from the initial import or changed local behavior materially:

1. Fix and disclose the comparison frame and included worktree inputs.
2. Review Standards and Spec as separate axes with their own authorities.
3. Apply repository standards and explicit acceptance sources, including concrete items, sequence, and the real user-facing route where relevant.
4. Keep the axes independent and report both before repair so one cannot mask the other.
5. Preserve the original review frame through fixes and rerun every affected axis against the final tree.
6. Distinguish findings, accepted residuals, and zero findings honestly.
7. Use a visibly labelled local fallback when independent delegation cannot be used.
8. Route Continuity Loom authority through the active-doc/domain/ADR structure rather than an imported repository convention.

“Strongest candidate” still means “retain unless trials disprove or simplify it,” not “historically proven correct.”

### Instruction groups primarily tied to incidents, handoff bookkeeping, or validators

These groups mainly preserve evidence identity, cross-skill custody, tracker publication shape, or parser compatibility:

- exact pre-dispatch, final-review, and handoff inventory field names and equality rules;
- reviewer cleanup dispositions, cleanup-proof grammar, and interrupted-review recovery grammar;
- immutable finding IDs, repair-class vocabulary, RF mappings, and derived structured-evidence JSON;
- normal/fallback closeout body templates, manifest flags, GitHub byte limits, builder commands, and exact validator invocation matrices;
- TDD preflight/gate forwarding, evidence-only fields, identity-refresh blocks, and superseded-token sweeps;
- browser/manual freshness, console state, backend process currentness, and stateful-fixture snapshot fields when used as tracker-closeout evidence;
- exact lexical constraints such as the accepted-residual literal and unresolved-word bans.

Some of these protect real invariants. Provenance only shows that they accumulated around `implement`/`tdd` handoffs and validator patches; it does not show that every field must remain in the main skill, that the current grammar is the least costly design, or that a standalone review should load them.

## Historical assertions not safe to trust without trials

1. **That the claimed decontamination is complete or accepted.** The ledger contains only a start event.
2. **That the initial bulk-imported instructions were locally incident-proven.** Both import commits add the path from nothing and provide no upstream source reference.
3. **That commit subjects explain the code-review changes.** “Created playtest skill,” “2nd playtest,” “3rd playtest,” method-gap-research, and CAST MEMBER subjects co-locate changes but do not document causation.
4. **That validator coverage proves reviewer behavior.** The tests demonstrate parsing and rejection of body shapes; they do not demonstrate source discovery, finding quality, independent-axis reasoning, recovery usability, or cost.
5. **That the late Orientation paragraph reliably bounds standalone behavior.** It states the intended seam, but the large implement-only appendix remains inline and should be tested for instruction interference and compliance.
6. **That parallel sub-agents are always preferable or semantically equivalent to local fallback.** The ledger has no comparative evidence, and one fallback event reports material cost.
7. **That an empty diff should always fail.** The tracker-only issue `#133` record is direct counter-pressure; trial both code-diff and non-code deliverable cases before preserving, specializing, or removing the hard stop.
8. **That cleanup states are portable across agent hosts.** The recorded incident confirms a host with no close primitive, while `closed` and `auto-disposed` require capabilities not exercised by that event.
9. **That three `clean` event labels establish broad correctness.** They lack evidence refs, session IDs, branch detail, and observation of the skill's harder paths.
10. **That seven trials are sufficient.** Seven is only the start event's provisional count. Sufficiency depends on the actual frozen scenarios and observed discriminating power, neither of which was inspected here.
11. **That exact field literals and duplicated cross-skill contract prose are durable domain rules.** Their history is dominated by validator synchronization and lexical repairs; test whether equivalent structured ownership can preserve the invariant with less prompt load.
12. **That line age implies importance.** Most lines are old because the entire mature skill was copied in one commit, not because this repository repeatedly validated them.

## Provenance conclusion

The repository supports a narrow durable identity for `code-review`: disclose a stable review frame, judge the diff independently against Standards and Spec authorities, expose both initial results, and re-review the final tree after fixes. Most of the remaining surface arrived as already-mature implementation-closeout machinery or was added through validator and evidence-custody patches between July 17 and July 20.

The live evidence history identifies two real pressures—missing reviewer-close capability and high-cost fallback for an intentionally empty repository diff—but provides no completed decontamination result and no linked trial evidence. Any simplification should therefore be decided by blind trials, especially at the standalone-versus-implement seam, the empty-diff route, recovery/cleanup portability, and the necessity of exact closeout-field grammar.
