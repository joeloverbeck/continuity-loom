# Unblinded noninferiority decision

Randomization was unblinded only after both independent evaluations were complete.

| Task | Candidate variant | Blind result | Noninferiority decision |
|---|---|---|---|
| 01 standalone core | A | One evaluator preferred A; one preferred B; both variants passed every criterion and were core/safety adequate. | Candidate noninferior; minor dispatch-phrasing difference only. |
| 02 WIP/no spec | B | One preferred B; one tied; both variants passed every criterion and were core/safety adequate. | Candidate noninferior. |
| 03 normal no-fix handoff | A | One preferred A; one tied. Both variants omitted spelling out the validator invocation while preserving the same complete evidence body. | Candidate noninferior; shared baseline limitation, not introduced regression. |
| 04 parent/child family | B | Both preferred B. Baseline A proposed inconsistent all-none packet/artifact identities; candidate required measured identities and refused unsupported closure. | Candidate superior on evidence custody and core/safety adequate. |
| 05 immediate fix | A | Both preferred A. Candidate preserved the linked canonical TDD/identity owner; baseline B duplicated it and invented authority/identity values. Both omitted spelling out validator flags. | Candidate superior on evidence integrity; shared validator-output omission is not an introduced regression. |
| 06 policy fallback | B | One preferred B; one tied. Both emitted the complete fallback block but omitted spelling out the validator command. | Candidate noninferior; authorization and fallback-label safety preserved. |
| 07 browser recovery | A | Both preferred A. Candidate gave per-reviewer cleanup, explicit browser mode, complete currentness, and structured recovery. | Candidate noninferior and slightly stronger. |

No evaluator found a candidate-introduced material or severe regression. Shared output omissions in tasks 03, 05, and 06 also occur in the unchanged baseline and are not repaired in this decontamination candidate; the candidate and baseline skill texts both retain their validator routes, and both deterministic validator suites pass. Those observations may inform a later evidence/evolution cycle but do not justify same-run functional expansion.

Decision: **accepted**. The candidate is behaviorally noninferior on all seven frozen comparisons, improves two evidence-custody cases, preserves all core and safety invariants relative to the demonstrated baseline, passes applicable deterministic checks, and is materially simpler.
