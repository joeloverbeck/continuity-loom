# Runtime comparison

| Measure | Baseline | Candidate | Change |
|---|---:|---:|---:|
| Normal-path `SKILL.md` lines | 227 | 136 | -40.1% |
| Normal-path words | 5,359 | 1,487 | -72.3% |
| Normal-path token estimate (words x 1.33) | ~7,128 | ~1,978 | -72.3% |
| Approval-path runtime lines (skill + protocol) | 696 | 359 | -48.4% |
| Approval-path runtime words | 9,461 | 3,207 | -66.1% |
| Approval-path token estimate (words x 1.33) | ~12,583 | ~4,265 | -66.1% |
| Mandatory normal-path skill references | 0 | 0 | unchanged |
| Mandatory post-approval references | 1 | 1 | unchanged |
| Executable helpers/tests | 6 files | same 6 files | byte-identical |

## Structural measures

- Top-level process phases remain five: live context, implementation surface, vertical slices, approval checkpoint, approved publication.
- The conditional protocol moves from eight narrative sections to seven state-machine sections without removing a gate.
- Preserved hard gates: exact source/comments; existing-family reconciliation; unresolved-decision and premise classification; source relationship; parent-role safety; artifact durability/sufficiency; story/checklist coverage; explicit authorization; exact-title duplicate guard; working-ledger validation; per-child staged validation/readback; approved parent transition only; serial dependency order; final family verification; cleanup/final proof.
- Removed mandatory narration: unresolved-scan shell implementation, two-phase ledger-precedent command recipe, ad hoc negative-sweep shell fallback, full working-ledger example, three full family-manifest examples, repeated option explanations, and timeout-based implicit authorization.
- Literal dated incident/commit narratives: none in either runtime. Candidate removes procedure shaped by isolated incidents while retaining the transferable invariants.
- Duplicated definitions: baseline restated publication completion, checklist mapping, parent custody, forbidden values, and final proof in both runtime files. Candidate keeps the checkpoint contract in `SKILL.md` and makes the conditional protocol the single publication owner.
- Helpers added/removed: none. All helper and test files compare byte-for-byte.

## Deterministic checks

- Baseline isolated layout: 70/70 helper tests passed.
- Candidate isolated layout: 70/70 helper tests passed.
- Candidate differs from baseline only in `SKILL.md` and `references/publication-protocol.md`.
- All six executable helper/test files are byte-identical.

*** Add File: reports/skill-evidence/to-issues-0adcf2cd/decontamination/dec_502bf8bb-b1c9-4e62-a783-8bd93c470cac/evaluation/summary.md
# Blind paired-validation summary

Evaluators received only the frozen task, inputs, rubric, and unlabeled A/B outputs. Assignment was sealed until all seven decisions were written.

| Task | Candidate result | Core/safety status |
|---|---|---|
| 01 fresh large PRD | Baseline preferred | Candidate adequate on all safety dimensions; minor scope/dependency/resume weaknesses, no material or severe regression. |
| 02 cross-surface dependencies | Tie | Both adequate on all nine dimensions. |
| 03 unready parent | Baseline preferred | Candidate stopped safely; minor premature granularity opinion, no material or severe regression. |
| 04 partial resume | Candidate preferred | Candidate better separated proof recovery from unauthorized parent mutation. |
| 05 pending source | Candidate preferred | Candidate produced the more truthful and executable pending-artifact checkpoint. |
| 06 idempotent retry | Tie | Both adequate on all nine dimensions. |
| 07 parent-transition authorization | Candidate preferred | Candidate supplied stronger exact custody, resume, and verification artifacts. |

Decision count: candidate preferred 3, tie 2, baseline preferred 2. No evaluator found a severe regression. No candidate output had a material failure; every core and safety-relevant dimension was adequate. The two baseline preferences arose from bounded output judgment, not behavior removed from the runtime contract: the baseline also permits a do-not-split assessment, and the candidate's new contract details were explicitly held for ratification rather than published as authority.

## Noninferiority decision

Accepted. The candidate is noninferior on every core and safety-relevant task, introduces no material or severe regression, passes the same deterministic checks, retains domain and ownership boundaries, and is meaningfully smaller. The simplification is eligible to land.
