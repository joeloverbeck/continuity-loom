# Structure and provenance analysis

## Provenance

The target was introduced at `ca861e8301e5d98d6fced5bdd93de4d710f206bd`, then expanded at `dafea24f08bb1ccb998b051ddce2ad85c842e133` and `45160f9fbd8c51943ea0f872ce3186a4cb1a5be6` before `skill-audit` retired at `7e8a545860c0d70f25be429d0a02b37d44be8bbc`. The two post-introduction changes added 730 lines across runtime prose, the custody helper, and tests. Their content is not presumed unnecessary: contract-version handling, artifact-dependency durability, blocked receipts, route validation, and exact closeout rendering remain current safety behavior.

No trustworthy audit report was available as an answer key. The candidate is therefore based on present structure, current authorities, and the frozen trials rather than on the historical reason a clause appeared.

## Classification

Each substantive group has exactly one category from the decontamination taxonomy.

| Group | Category | Candidate treatment |
| --- | --- | --- |
| Frontmatter trigger, accepted prep artifact, and returned residual PRD queue | Core trigger or output contract | Preserve. |
| Custody definition and prohibition on drafting or publishing a PRD | Core trigger or output contract | Preserve. |
| Exact-path intake helper and hash-verified inventory frontier | Current tool-specific requirement | Preserve concisely. |
| `current`, `legacy-compatible`, `migration-required`, and `invalid` intake semantics | Necessary safety or state-integrity invariant | Preserve; keep producer-owned migration. |
| Baseline dirt, branch, HEAD, publication-ref, authority, and tracker-vocabulary reads | Current repository convention with a canonical owner | Preserve as a compact conditional checklist. |
| Separate durability of source report, evidence dependencies, and prep artifact | Necessary safety or state-integrity invariant | Preserve; point publication mechanics to `to-issues`. |
| Per-row evidence, exact-title guards, semantic owner reads, and failed-read fail-closed rule | Necessary safety or state-integrity invariant | Preserve. |
| Current ticket-packet fields and legacy packet limitations | Domain knowledge unavailable to a general agent | Preserve concisely. |
| Five non-PRD dispositions | Core trigger or output contract | Preserve. |
| Routed-skill trigger/input/state verification in both `SKILL.md` and the ledger reference | Duplicated instruction | Keep once in the ledger contract and point to it from the workflow. |
| Literal retired `$skill-audit` route examples in runtime prose, ledger example, and tests | Stale empirical quantity or environment assertion | Remove from runtime/reference and replace the test-only example with a neutral durable workflow route. |
| Blanket rule that every ticket, coverage, correction, or verification row is an issue candidate | Contradictory or instruction-competing clause | Remove the blanket default; retain the transferable rule that bounded actionable verification may be published without a false product label. |
| Existing-issue mutation approval boundary | Necessary safety or state-integrity invariant | Preserve. |
| Ledger source order, exact inventory coverage, and grouped-owner proof | Necessary safety or state-integrity invariant | Preserve in the ledger contract. |
| Four PRD dispositions, source order, no promotion, and no deferred bundling | Core trigger or output contract | Preserve. |
| First-action classification and circular-handoff rejection | Domain knowledge unavailable to a general agent | Preserve; intake owns legacy semantic drift. |
| Repeated “This step is complete only when…” and final exhaustive self-check prose | Audit bookkeeping, report conformance, custody ceremony, self-audit scaffolding | Remove; keep executable gates and one compact completion condition. |
| Full `to-issues` Step 4 restatement | Duplicated instruction | Preserve the ownership pointer and only target-specific additions. |
| Artifact-source statements, dependency manifest, and source-publication approval gate | Necessary safety or state-integrity invariant | Preserve target-specific conditions; leave staging mechanics to `to-issues`. |
| Publication protocol staging, exact-read, recovery, family verification, and cleanup | Current repository convention with a canonical owner | Preserve as a post-approval pointer; do not duplicate. |
| JSON ledger example plus separate prose restatement of every field | Duplicated instruction | Replace with a compact schema skeleton and disposition-specific requirements. |
| Passing and blocked renderer commands, final posture capture, cleanup, and equality check | Necessary safety or state-integrity invariant | Preserve in the ledger contract only. |
| Helper parsing, validation, rendering, CLI, and its behavior tests | Necessary safety or state-integrity invariant | Preserve executable behavior unchanged; only neutralize the stale route fixture text. |
| Agent UI metadata | Core trigger or output contract | Preserve. |

## Marked risk patterns

- Qualifications accumulated around receipt rendering in both runtime and reference prose. The executable renderer and tests own the exact shape, so prose duplication increases instruction competition without adding enforcement.
- Route validation is stated twice and illustrated with a retired skill. The validation rule is transferable; the named historical route is not.
- The blanket issue-candidate default competes with producer-declared `no-create` or routed dispositions and caused the no-approval baseline trial to propose an extra fifth issue. The candidate retains bounded verification publication as an option without overriding evidence.
- Six repeated completion paragraphs act as self-audit scaffolding. The helper, shared publisher verifier, and renderer already enforce their material gates.
- Progressive disclosure is weakened by requiring the normal path to absorb receipt-format details that are only needed at closeout. The candidate keeps those details in the closeout reference.

## Candidate hypothesis

Keep the helper and safety gates, make `SKILL.md` the custody workflow, make `custody-contract.md` the sole ledger/receipt authority, rely on `to-issues` for publication mechanics, remove the retired route example and blanket issue default, and shorten repeated completion ceremony. This should reduce mandatory context and instruction conflict while preserving or improving all frozen behaviors.
