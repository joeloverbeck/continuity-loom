# Independent ownership and duplication analysis: `code-review`

## Scope and method

This analysis inspected only the frozen baseline under `baseline/`, the byte-identical live `code-review` skill, the current sibling owner contracts it names, and their executable validators/builders. The baseline and live `code-review` trees are byte-identical for `SKILL.md`, both references, both validators, their shared contract module, and the validator tests; `SKILL.md` has SHA-256 `db36af66b0c4cf8190cb361efb03bd017731474605ee8657184c14603331e910` in both locations.

I did not read the corpus rubrics or any trial response. I did not inspect or edit a candidate, events, or gate status.

## Determination

The durable, reusable `code-review` method is already identifiable: pin a fixed review frame, identify concrete Standards and Spec authorities, run the two axes independently, expose both initial reports before fixes, and aggregate without reranking. That method occupies the core described at baseline lines 6-17 and implemented through Steps 1-5. The principal legacy contamination is not the two-axis method; it is the large amount of implementation-closeout, tracker-publication, TDD, browser-proof, and evidence-body schema copied into the entrypoint after the core.

The safest decontamination seam is therefore routing, not semantic deletion:

- Keep review-frame identity, source inventories, the smell baseline, axis isolation, reviewer dispatch briefs, the pre-fix reporting gate, original-fixed-point re-review, and the no-spec disposition in `code-review`.
- Keep the fallback decision and the fact that fallback cannot masquerade as normal review in `code-review`, but leave the full fallback body in its existing conditional reference.
- Route TDD evidence construction and validation to `tdd`.
- Route body construction, acceptance manifests, final-SHA publication, size/split planning, tracker mutation, and readback to `implement`.
- Consolidate truly shared runtime-evidence primitives rather than maintaining three prose and validator copies.

This can substantially shorten the baseline without weakening any enforced behavior because the owner references and nested validators already exist.

## Duplicated definitions and their current owners

| Definition repeated in the baseline | Other copies / enforcement | Ownership finding |
|---|---|---|
| Immediate-fix handoff fields and finding ledger | Baseline lines 91 and 187-224 repeat the same outcome fields, `P<pass>-...` ledger, TDD disposition, freshness, currentness, identity, and residual requirements. The implement scaffold renders these fields in `.claude/skills/implement/scripts/build-closeout-body.mjs:438-576`, and normal review validation enforces them at `.claude/skills/code-review/scripts/validate-review-normal-body.mjs:447-595`. | `code-review` owns finding identity and the semantic result of re-review. `implement` owns the combined closeout-body rendering. The baseline should state the handoff trigger and invariant, not reproduce the whole caller body twice. |
| Full TDD closeout contract | Baseline line 91 and line 214 enumerate preflight labels, compact-row atoms/proof/sequence, RF rows, proof-server state, backend currentness, and identity refresh. The declared single source of truth is `.claude/skills/tdd/closeout-evidence.md:1-7`; its validator declares the exact gate/preflight labels at `.claude/skills/tdd/scripts/validate-tdd-closeout-body.mjs:88-140`. The implement builder also renders the same table and gate at `.claude/skills/implement/scripts/build-closeout-body.mjs:349-412`. | `tdd` owns red/green evidence, TDD rows, RF maps, the preflight, and the TDD gate. `code-review` should classify a finding and route behavior-changing fixes to TDD, then require a passed or linked TDD result. It should not restate TDD's evolving field list. |
| Local fallback output | `.claude/skills/code-review/fallback-evidence.md:1-13` explicitly owns the complete fallback contract and `.claude/skills/code-review/fallback-evidence.md:47-117` contains the canonical body. A second near-copy exists in `.claude/skills/implement/references/review-evidence.md:59-121`. | The canonical owner is `code-review/fallback-evidence.md`. The implement copy should become a reference or builder-rendered inclusion. This is already a real drift source: the implement copy's TDD gate at `review-evidence.md:89` omits the canonical `Evidence-only proof server preflight` requirement and the `proof server preflight` gate field present in `fallback-evidence.md:9` and `fallback-evidence.md:82`. |
| Evidence identity schema | `.claude/skills/code-review/evidence-identities.md:3-23` says to use one shared block, but the same four-line inventory is copied into `.claude/skills/tdd/closeout-evidence.md:120-124` and the implement parent template at `.claude/skills/implement/references/closeout-templates.md:216-224`; the builder carries another literal copy at `.claude/skills/implement/scripts/build-closeout-body.mjs:623-627`. | The current prose owner is `code-review/evidence-identities.md`, but this is actually a cross-skill evidence primitive. Either retain that file as the single canonical reference for all three skills or promote it to a neutral shared evidence contract. Do not keep literal copies. |
| Evidence identity validation | Review identity parsing and sweep rules live in `.claude/skills/code-review/scripts/review-evidence-contract.mjs:409-545`. TDD separately validates the same categories and sweep in `validate-tdd-closeout-body.mjs:625-760`. Implement separately validates a partial version in `validate-closeout-body.mjs:470-526`. | This should be one importable validator. The implement copy is notably weaker: it requires current/superseded fields but does not enforce the full historical-red inventory with the same rigor as the review contract. One shared implementation would remove both duplication and inconsistent acceptance. |
| Browser/manual freshness and backend currentness | Baseline lines 112-143 and 216-219 restate the same rerun/not-affected/commit-only, console, server ownership, restart/reload, API probe, and fixture snapshot rules. TDD's reusable code already owns freshness/currentness primitives in `.claude/skills/tdd/scripts/tdd-evidence-contract.mjs:64-183`. | Runtime proof semantics should have one shared owner. At minimum, `code-review` should import TDD's helper for every overlapping rule and refer to a single prose contract. |
| Backend-currentness regexes | The shared TDD helper exports `validateBackendCurrentnessValue` at `tdd-evidence-contract.mjs:138-157`, but normal review reimplements it at `validate-review-normal-body.mjs:379-395`, and fallback reimplements it again at `validate-review-fallback-body.mjs:185-203`. | This is executable duplication, not just verbose documentation. Normal and fallback should import the shared helper, with a thin review-specific N/A adapter only if their accepted N/A vocabulary intentionally differs. |
| Console-state regexes | Normal and fallback maintain separate console validators at `validate-review-normal-body.mjs:368-377` and `validate-review-fallback-body.mjs:169-183`; TDD validates evidence-only browser console state in its own body validator. | Promote console-state validation to the same shared runtime-evidence module as freshness/currentness. Route-specific constraints such as “`--browser` forbids N/A” remain in the route validators. |
| Exact acceptance, atoms, proof surfaces, sequence, and manifest coverage | Baseline Spec prompt lines 159-171, fallback checklist lines 20-31, TDD closeout exactness, and implement audit templates all define overlapping acceptance granularity. Review implements its own manifest parser at `review-evidence-contract.mjs:248-321`; TDD implements another at `validate-tdd-closeout-body.mjs:25-68`; implement validates manifest/audit identity separately. | `code-review` owns the question “does the diff satisfy the exact Spec?” Implement's acceptance manifest/audit contract should own manifest shape and generated check identity. TDD owns how a criterion maps to a red/green seam. Shared manifest parsing should be imported rather than independently relaxed or tightened. |
| Closing body size and publication constraints | Baseline line 123 carries GitHub's 65,536-byte ceiling. Review, TDD, implement validator, and implement builder each define a separate `65_536` constant. TDD additionally prints the GitHub `gh issue comment --body-file` readback reminder at `validate-tdd-closeout-body.mjs:18-23`. | The tracker closeout ceiling, splitting strategy, comment publication, and exact readback belong to `implement`. Standalone review/TDD validators may accept an injected ceiling when embedded in a closing body, but should not own GitHub publication policy. |
| Validator-passing phrase examples | Exact-token examples appear in `code-review/evidence-identities.md:25-44`, `tdd/closeout-evidence.md:181-210`, and `implement/closeout-templates.md:313-335`. | Examples tied to a regex should live beside the validator or its canonical prose owner and be linked from callers. Multiple “copy-paste passing” lists ensure the docs drift whenever a regex changes. |

## Repository- and tool-specific requirements mixed into the baseline

These requirements may be valid in Continuity Loom, but they are not part of the reusable two-axis method and should be reached through a repository or tool adapter:

1. **Repository authority layout.** The baseline hard-codes `/setup-matt-pocock-skills`, `docs/agents/issue-tracker.md`, `docs/ACTIVE-DOCS.md`, `docs/agents/domain.md`, `CONTEXT.md`, and `docs/adr/` (baseline lines 15 and 39-47). The reusable invariant is to resolve the repository's tracker and domain-authority guides. The exact paths and setup command belong to this repository's agent configuration.

2. **Git and GitHub closeout protocol.** Three-dot `git diff` and a resolved fixed-point SHA are intrinsic to this skill's current Git review model and should remain. By contrast, GitHub issue JSON, `gh issue comment --body-file`, `https://github.com/...`, the 65,536-byte body ceiling, fixed child close comments, parent rollups, exact comment readback, and mutation-ready output are tracker-specific implement concerns. TDD's own owner document acknowledges that implement is the sole authority for these mechanics at `.claude/skills/tdd/closeout-evidence.md:13-29`.

3. **Worldloom residue.** The Continuity Loom implement contract still uses `/tmp/worldloom-*` filenames throughout its examples (`closeout-templates.md:27-29` and `closeout-templates.md:41-56`) and the TDD prose contains a “Worldloom SQLite” special case. These examples are repo residue, not `code-review` method. Parameterize them or keep them only in the implementation/tracker adapter.

4. **Agent-host lifecycle vocabulary.** `closed`, `auto-disposed`, unavailable close primitives, live agent inventory, and follow-up unaddressability are host-specific. They are correctly enforced by the review validator, but only the delegation branch needs them (baseline lines 79-83). They do not belong in the always-loaded standalone review path.

5. **Browser proof infrastructure.** Configured API/UI ports, proxy/API-base alignment, HMR contamination, backend process ownership, clean sessions, and fixture snapshots are browser-harness concerns. They matter only when browser/manual evidence is actually used.

6. **SQLite/WAL snapshot behavior.** The `.backup`/checkpoint-aware-copy requirement at baseline line 139 and `evidence-identities.md:23` is a valuable safety rule for stateful SQLite fixtures, but it is a rare conditional branch. It should be loaded only when current browser evidence names a stateful SQLite fixture.

7. **Node/ESM script paths.** Exact `.claude/skills/.../*.mjs` invocations are repository tooling. The behavior to retain is “run the applicable local validator with the active flags”; command inventories belong beside their validator owner, not in the review method.

## Canonical-owner map

| Concern | Canonical owner | What `code-review` should retain |
|---|---|---|
| Fixed point, diff scope, committed vs WIP inclusion | `code-review` | Full invariant and commands. This is part of review identity, not closeout decoration. |
| Standards/Spec authority discovery and pre-dispatch inventories | `code-review`, parameterized by repository authority docs | Full invariant; route exact repo paths through `ACTIVE-DOCS`/agent guidance. |
| Smell baseline and repo-overrides rule | `code-review` | Full baseline or one directly loaded `code-review` reference; reviewers need the actual list. |
| Independent axes, reviewer prompts, pre-fix display, no reranking | `code-review` | Full behavior. |
| Reviewer cleanup, interrupted-output recovery | `code-review` delegation reference | A short always-visible trigger; full field vocabulary only when delegation/recovery occurs. |
| Local two-axis fallback | `code-review/fallback-evidence.md` plus fallback validator | A short route and the prohibition against labeling fallback as normal review. |
| Finding IDs, found-vs-residual accounting, accepted-residual semantics | `code-review` shared review contract | Preserve semantics and validator; let implement render them into a tracker body. |
| Red/green evidence, RF IDs, TDD compact table/preflight/gate | `tdd/closeout-evidence.md` plus TDD validator | Route behavior-changing and coverage-only findings to TDD and require its passed/linked result. |
| Evidence identity inventory and sweep | Current owner: `code-review/evidence-identities.md`; preferred owner: neutral shared evidence contract | Require one refreshed block at handoff; do not reproduce its fields in `SKILL.md`. |
| Freshness, console state, backend/process/fixture currentness | Preferred owner: neutral shared runtime-evidence contract, seeded by `tdd-evidence-contract.mjs` | Only the trigger: consult when browser/manual evidence exists or a later change could stale it. |
| Acceptance manifests, deterministic audit rows, structured evidence JSON | `implement` builders/contracts | Require exact Spec coverage; delegate manifest generation and closeout serialization. |
| Parent/child/sibling rollups, body size/splitting, final SHA, publication, exact readback, mutation gate | `implement/closeout-templates.md` and tracker closeout gates | One conditional handoff sentence when invoked by `implement`; no copied CLI or sequence. |
| Repository domain and tracker configuration | `docs/ACTIVE-DOCS.md`, `docs/agents/*`, setup skill | Ask the repo adapter for concrete authorities; do not universalize these paths. |

## Rare branches that can move behind conditional references

The following branches can be removed from the always-loaded entrypoint while preserving behavior, provided each trigger remains explicit and the named validator/reference remains mandatory:

| Trigger | Conditional owner/reference | Behavior that must remain visible at the trigger |
|---|---|---|
| Sub-agents are unavailable or policy-blocked | `fallback-evidence.md` | Use local two-axis fallback; never publish fallback as `Review:`; validate before implement handoff. |
| A reviewer is interrupted, produces partial output, or cannot be cleaned up normally | A focused `code-review` delegation/recovery reference (currently embedded at baseline lines 81-83) | Preserve raw output, complete the missing axis, record actual terminal/cleanup status, and switch to fallback if the main agent synthesizes reviewer output. |
| Review findings are fixed immediately | A focused `code-review` review-fix/handoff reference plus normal validator | Keep the original fixed point, preserve every immutable finding row, rerun affected axes, distinguish found from residual, and record commit handling. |
| A review fix changes behavior or adds coverage | `tdd/closeout-evidence.md` | Invoke TDD where possible; preserve intended-red, wrong-reason/skip, green, and RF mapping. |
| TDD was invoked | TDD owner and validator | Include or link the canonical preflight/table/gate once; do not mirror its field inventory in `code-review`. |
| Browser/manual proof was used, or later edits may stale it | Shared runtime-evidence reference | Record final-tree freshness, console state, and backend dependency/currentness; `--browser` cannot use a no-browser N/A. |
| Current proof uses a stateful fixture | Evidence-identity/currentness reference | Record snapshot method/source/expected-state probe or the exact no-copy disposition; load the SQLite/WAL detail only for SQLite. |
| Parent PRD, child family, or sibling issue set is in review scope | Implement acceptance-manifest/closeout reference plus review Spec-coverage validator | Preserve per-issue exact acceptance and sequence coverage; do not copy rollup publication mechanics into review. |
| Multi-pass review or more than one TDD review fix | Implement structured-evidence builder | Use one structured source for TDD rows, RF rows, finding ledger, counts, and severities; do not hand-copy derived fields. The baseline already points correctly at this seam at lines 119-121. |
| Body is large or must be split | Implement Large Tracker Body Workflow | Stop on low headroom/excess, retain one evidence core, use disjoint audit chunks, validate and exact-read each sink. The baseline already routes rather than copies this sequence at line 121. |
| Findings are intentionally accepted | Focused `code-review` residual reference/validator | Preserve axis, source, rationale, concrete revisit trigger, and “unhandled findings none beyond accepted residuals”; never summarize as no findings. |
| The review resumes after compaction/interruption | Focused `code-review` recovery reference | Re-resolve the fixed point, status, non-empty diff, commits, source inventories, and recovery state before reporting. |
| A Principles section exists | Repository domain-authority route | Read and apply the repository-selected domain/ADR authorities; do not require this material when the source has no such section. |
| No spec exists | Core `code-review` branch | Keep the explicit user-confirmed `no spec available` disposition and skip only the Spec reviewer. This is small and belongs in the core. |

## Validator seam findings

The validators show that decontamination can remove prose duplication without reducing assurance:

- Normal review already conditionally invokes the TDD validator and forwards scope, closing, final-SHA, size, and manifest inputs (`validate-review-normal-body.mjs:597-615`). Fallback does the same at `validate-review-fallback-body.mjs:348-360`. The baseline therefore needs to say when nested TDD validation applies, not restate everything nested validation checks.
- Review freshness already delegates to TDD's helper (`review-evidence-contract.mjs:1-4,37-50`) and fixture snapshot validation delegates to the same TDD module (`review-evidence-contract.mjs:458-464`). Completing that import pattern for backend and console rules would remove drift.
- Acceptance-manifest parsing is independently implemented with different strictness. Review validates only non-empty check IDs (`review-evidence-contract.mjs:248-270`), while TDD also requires check text and rejects duplicate check IDs (`validate-tdd-closeout-body.mjs:27-53`). A single manifest contract should define shape once; each consumer should validate only its own coverage relationship.
- Body-size policy is separately owned by review, TDD, implement validator, and implement builder. A tracker/body policy parameter should be passed inward by implement during closing validation.
- The implement builder is already the executable template owner: it constructs canonical TDD blocks, review blocks, immediate-fix ledgers, browser fields, identity blocks, and fixed-child fields (`build-closeout-body.mjs:349-640`). Hand-maintained prose templates should explain semantics and triggers, while the builder supplies exact structure.

## Behaviors that should not be moved out of the core

Decontamination should not remove or weaken these review semantics:

- resolved fixed-point SHA and three-dot diff identity, including dirty/WIP scope (baseline lines 19-33);
- concrete Standards and Spec source inventories before dispatch (baseline lines 35-55);
- the repo-overrides and judgement-only treatment of the smell baseline (baseline lines 57-75);
- independent Standards and Spec analysis and the exact source-bearing dispatch briefs (baseline lines 145-171);
- the visible pre-fix `## Standards` / `## Spec` gate before any repair (baseline line 177);
- original-fixed-point re-review after fixes, including coverage-only and conformance-only dispositions (baseline line 185);
- separate axis counts/worst severity and no cross-axis winner (baseline lines 177-183 and 226-233);
- explicit no-spec behavior (baseline lines 37-47 and 173).

These are the deep module. The closeout schemas are adapters and consumers.

## Recommended decontamination order

1. Reduce the `SKILL.md` entrypoint to the core review method plus explicit conditional routes. Preserve the existing `fallback-evidence.md`, `evidence-identities.md`, and sibling-owner links during this step.
2. Remove the copied fallback template from implement's `review-evidence.md`; point to the canonical fallback reference or have the implement builder render it. Fix the already-visible proof-server-field drift as part of that ownership change.
3. Make `tdd/closeout-evidence.md` the only prose owner of TDD table/preflight/gate fields. In `code-review`, keep only invocation, linking, and nested-validator requirements.
4. Consolidate evidence identity, freshness, console, backend currentness, fixture snapshot, and acceptance-manifest parsing into importable shared contracts. Keep route-specific policy in the route validators.
5. Leave GitHub body size, split-core, parent/child/sibling publication, final SHA, mutation readiness, and comment readback solely under implement. Parameterize or remove `/tmp/worldloom-*` examples from this repository's active guidance.
6. After ownership is singular, keep validator-passing examples only with the owning validator/reference and replace caller copies with direct links.

The key acceptance criterion for any later rewrite is not line-count reduction. It is that every removed definition remains reachable through one explicit trigger, one canonical owner, and one executable validation path.
