# Baseline structure and provenance classification

Classification applies to the hash-verified baseline snapshot. Each substantive instruction or coherent implementation group appears once.

| Surface / group | Category | Treatment rationale |
| --- | --- | --- |
| `agents/openai.yaml` explicit-only UI metadata | Core trigger or output contract | Preserve. |
| `SKILL.md` frontmatter trigger and diagnosis-only description | Core trigger or output contract | Preserve. |
| Intro: one source, one same-stem portfolio, no implementation/publication, custody before `/to-prd` | Necessary safety or state-integrity invariant | Preserve concisely. |
| Input path resolution and exclusion of assets/derivatives | Core trigger or output contract | Preserve. |
| Source validator and source-inspector commands | Current tool-specific requirement | Preserve exact commands. |
| Blocking versus historical-v1 nonblocking source failures and explicit limitations | Domain knowledge unavailable to a general agent | Preserve concisely. |
| Exact `$skill-audit` repair route | Stale empirical quantity or environment assertion | The named owner was retired after this baseline, but downstream custody still names and tests the route. Retain it because the corpus does not adjudicate a replacement and cross-skill repair is outside scope. |
| Intake identity/state checklist | Necessary safety or state-integrity invariant | Preserve as one compact gate. |
| Exact branch, HEAD, and full worktree capture; unowned dirt boundary | Necessary safety or state-integrity invariant | Preserve. |
| Required authority and tracker-convention reads | Current repository convention with a canonical owner | Preserve as pointers. |
| Frontier report, bounded prior-report traversal, no unrelated scans | Domain knowledge unavailable to a general agent | Preserve. |
| Launch/current drift and durability classification | Necessary safety or state-integrity invariant | Preserve. |
| Prior-report and same-stem prep recommendation reconciliation | Necessary safety or state-integrity invariant | Preserve; ADR and downstream custody require producer-owned migration. |
| Projected tracker search and no AFK-readiness claim when unavailable | Current tool-specific requirement | Preserve. |
| Step-1 “complete only when” restatement | Duplicated instruction | Merge into a single phase gate. |
| Exactly one disposition per cumulative row and no parallel IDs | Necessary safety or state-integrity invariant | Preserve. |
| Observation-not-mandate doctrine and evidence ladder | Domain knowledge unavailable to a general agent | Preserve. |
| Conditional guarded browser reproduction | Current tool-specific requirement | Move behind the unresolved-contradiction condition. |
| Strengths as preservation constraints rather than scope | Domain knowledge unavailable to a general agent | Preserve. |
| Step-2 “complete only when” restatement | Duplicated instruction | Merge into the phase gate. |
| Trace report-derived rules across mechanically affected surfaces only | Core trigger or output contract | Preserve. |
| Smallest-governed-destination taxonomy | Domain knowledge unavailable to a general agent | Preserve. |
| PRD grouping, ordering, and ranking rules | Domain knowledge unavailable to a general agent | Preserve. |
| `First operational action` semantics repeated in process prose | Duplicated instruction | Keep one workflow statement; artifact syntax stays in the contract. |
| PRD-ready behavioral depth and one-question exception | Core trigger or output contract | Preserve. |
| Step-3 “complete only when” restatement | Duplicated instruction | Merge into the phase gate. |
| Mandatory full `prep-format.md` read and same-stem rewrite | Current repository convention with a canonical owner | Preserve. |
| Contract-version migration repeated in workflow prose | Duplicated instruction | Point to the artifact contract and ADR-owned rule once. |
| `/to-prd` house-style-only boundary and mutation prohibition | Necessary safety or state-integrity invariant | Preserve. |
| Privacy exclusions | Necessary safety or state-integrity invariant | Preserve. |
| “Could draft without rereading source” artifact adequacy rule | Core trigger or output contract | Preserve. |
| Draft-validator and final-validator commands | Current tool-specific requirement | Preserve exact commands. |
| Manual semantic review and pre/post validation freshness loop | Necessary safety or state-integrity invariant | Preserve once. |
| Skip unrelated root gates for report-only work | Current repository convention with a canonical owner | Preserve. |
| Overall completion/custody gate | Necessary safety or state-integrity invariant | Preserve once. |
| Exact final keyed response block | Core trigger or output contract | Preserve. |
| `prep-format.md` title and exact section order | Core trigger or output contract | Preserve. |
| Header fields and contract-version rules | Necessary safety or state-integrity invariant | Preserve. |
| Source-validation and external-research field forms | Core trigger or output contract | Preserve. |
| Reassessment verdict/package fields and repeated first-action explanation | Duplicated instruction | Preserve field syntax; shorten prose already owned by workflow. |
| Source-count and PRD-publication input fields | Core trigger or output contract | Preserve. |
| Draft/final self-check states | Necessary safety or state-integrity invariant | Preserve. |
| Evidence disposition ledger and taxonomy | Domain knowledge unavailable to a general agent | Preserve. |
| Strength preservation ledger | Domain knowledge unavailable to a general agent | Preserve. |
| Authority/change-surface map | Core trigger or output contract | Preserve. |
| PRD candidate fields and package cardinality rules | Core trigger or output contract | Preserve. |
| Non-PRD table, ticket packets, and live checklist mapping | Core trigger or output contract | Preserve; T02 and T06 exercise this branch. |
| Prior recommendation consumption ledger | Necessary safety or state-integrity invariant | Preserve; T02, T04, and T06 exercise it. |
| Final worktree ledger and post-validation equality | Necessary safety or state-integrity invariant | Preserve, but do not repeat the workflow. |
| Privacy and durability rules | Necessary safety or state-integrity invariant | Preserve. |
| Completed-state language | Necessary safety or state-integrity invariant | Preserve concisely. |
| Validator table/field parsing helpers | Current tool-specific requirement | Preserve unchanged. |
| Contract versions and machine-readable diagnostics | Necessary safety or state-integrity invariant | Preserve unchanged; active ADR owns them. |
| Source validation, schema-v1 compatibility, counts, stable IDs, prior-prep derivation | Necessary safety or state-integrity invariant | Preserve unchanged. |
| Candidate and ticket-packet parsing/validation | Necessary safety or state-integrity invariant | Preserve unchanged. |
| Prior recommendation inventory and exact consumption matching | Necessary safety or state-integrity invariant | Preserve unchanged. |
| Required fields, dispositions, strengths, package agreement, and counts | Necessary safety or state-integrity invariant | Preserve unchanged. |
| Privacy/stale-language executable checks | Necessary safety or state-integrity invariant | Preserve unchanged. |
| Final-worktree executable checks | Necessary safety or state-integrity invariant | Preserve unchanged. |
| Validator CLI modes and JSON result | Current tool-specific requirement | Preserve unchanged. |
| Test fixture builders | Current tool-specific requirement | Preserve unchanged. |
| Source/schema/continuation inspection tests | Necessary safety or state-integrity invariant | Preserve unchanged. |
| Package, ticket, coverage, and strength tests | Necessary safety or state-integrity invariant | Preserve unchanged. |
| Version, migration, and circular-action tests | Necessary safety or state-integrity invariant | Preserve unchanged. |
| Consumption, worktree, completion, and privacy tests | Necessary safety or state-integrity invariant | Preserve unchanged. |

## Provenance summary

The target was introduced on 2026-07-18 and changed in four pre-retirement skill-update commits. The initial version already contained the core five-phase workflow and exact artifact contract. Later commits added prior-prep migration, final-worktree equality, custody handoff, version diagnostics, substantive-first-action enforcement, and full ticket packets. Those additions are now corroborated by the active ADR, executable validator/tests, downstream custody contract, and frozen trials; they are not removed merely because they arrived during the audit era.
