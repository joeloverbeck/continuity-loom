# Audit-induced risk patterns

| Pattern | Evidence and risk | Candidate treatment |
| --- | --- | --- |
| Qualifications layered onto source validation | The input section interleaves blocking failures, one schema-v1 exception, stale evidence, tracker outages, reproduction failure, and a retired skill route. Their order obscures the stop/continue decision. | Recast as a compact stop/continue gate while retaining the route because downstream custody still names it and the corpus cannot prove a replacement. |
| Repeated phase conformance prose | Four phases end with “complete only when” paragraphs that repeat exact fields and gates already stated in the steps and validator. | Replace with one short output condition per phase or one final completion gate. |
| First-action semantics in several homes | Workflow step 3, artifact required-fields prose, validator diagnostics, tests, and downstream custody all define the same “substantive, not handoff” rule. | Keep one workflow rule, exact artifact syntax, and executable enforcement; remove repeated explanatory prose. |
| Contract migration repeated across runtime prose | `SKILL.md` narrates version migration that the artifact contract, active ADR, validator, tests, and downstream inspector already own. | Keep a concise pointer and preserve executable behavior unchanged. |
| Freshness protocol duplicated | The exact status capture/classification/post-validation loop appears in workflow prose and again in the artifact contract, while the validator enforces the ledger shape. | Keep execution sequence in `SKILL.md`; keep only shape and equality invariant in the reference. |
| Custody boundary repeated | Description, intro, write phase, completion gate, reference completion prose, and final response all restate that `$playtest-to-issues` precedes `/to-prd`. | Keep the intro safety boundary, artifact field, and exact final response; remove intermediate restatements. |
| Stale retired workflow name | The source-defect route says `$skill-audit`, which was deleted at audit retirement, while downstream custody still names and tests it. | Retain as uncertain material. Replacing the cross-skill owner would be repair, not behavior-preserving simplification, and no frozen trial establishes a safe substitute. |
| Normal-path reference cost | Every run loads 1,864 words of `SKILL.md` plus 2,270 words of `prep-format.md`, before active authorities and `/to-prd` house style. Much of the first two files repeats the same definitions. | Shorten both Markdown files while leaving scripts, tests, artifact fields, and all frozen branch behavior unchanged. |
| Large exact templates | The reference includes full candidate, ticket, consumption, and worktree shapes. These are substantial but transfer domain meaning the validator cannot invent. | Retain exact templates; trim surrounding narration only. |
| Incident-era additions mistaken for automatic deletions | Prior-prep migration, versioning, ticket packets, and worktree equality entered in later audit-era commits. | Preserve because current ADR, downstream custody, tests, and baseline trials independently demonstrate transferability. |

## Candidate hypothesis

A prose-only consolidation can materially reduce mandatory runtime context while preserving every executable check, artifact field, domain disposition, safety boundary, continuation ledger, ticket packet, and exact user closeout. No script, test, trigger, or artifact contract version changes are justified.
