# Comparative validation summary

## Method

- Seven frozen tasks covered common design grilling, a materially different taxonomy decision, publication authorization, delegated sequencing, premise divergence, PRD readiness, and recap-only behavior.
- The unchanged baseline and candidate were run in fresh independent agents.
- Candidate outputs were compared with baseline outputs behind counterbalanced A/B labels by fresh evaluators who saw only the task rubric and paired responses.
- Round 1 exposed one material core-task regression. The smallest transferable invariant was restored, and all seven candidate trials and blind evaluations were rerun.
- Round 2 used a stricter frozen-input harness so neither performer could replace the supplied snapshot with current-repository exploration.

## Round 2 after unblinding

| Task | Candidate | Baseline | Comparative result |
| --- | --- | --- | --- |
| Private Notes proposal | Mostly adequate | Partly adequate | Candidate preferred; both omitted part of the whole-slice migration/workspace test. |
| Ideation taxonomy | Partly adequate | Adequate with one omission | **Baseline preferred; material candidate completeness gap remained.** |
| SECRET publication boundary | Fully adequate | Fully adequate | Candidate narrowly preferred. |
| Delegated sequence | Adequate with reservations | Partly adequate | Candidate preferred. |
| Premise divergence | Fully adequate | Fully adequate | Candidate slightly preferred. |
| PRD readiness | Fully adequate | Fully adequate | Tie. |
| Recap only | Fully adequate | Fully adequate | Candidate slightly preferred. |

## Noninferiority decision

Rejected.

The candidate was adequate or better on six tasks and remained materially smaller. It did not remain noninferior on the core Ideation taxonomy task after the permitted invariant restoration and full rerun. The candidate still treated slot assignment as a secondary edge, did not directly establish fail-closed behavior, and did not concretely preserve user-control authority. The evaluator found that these omissions could allow a sound taxonomy to be approved while ambiguous assignment behavior undid it.

No severe regression, destructive behavior, or direct safety breach occurred. The gate nevertheless requires noninferiority on every core and safety-relevant task, so one material completeness regression is sufficient to reject the candidate.

## Deterministic checks

- Candidate has the same seven files and all internal Markdown links resolve.
- Candidate frontmatter retains the target name and trigger description.
- Frozen corpus checksum passes.
- Seven baseline outputs, seven round-2 candidate outputs, and seven round-2 evaluations exist.
- Candidate-versus-baseline whitespace check produced no whitespace-error output.
- The live `.claude/skills/grilling` directory remains byte-identical to the claimed baseline.
- `.agents/skills/grilling` remains the canonical symlink mirror.

## Outcome

`candidate_rejected_validation`. The candidate must not land, and the live target remains unchanged at claimed hash `314a80595a7bea1d80679e2bc73a17ab3ef492729e8750bb31ee73877063dfc8`.
