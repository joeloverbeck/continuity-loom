I would pin and retain this review frame before dispatch:

- Fixed-point input: `HEAD~2`
- Resolved fixed point: `3333333333333333333333333333333333333333`
- Reviewed HEAD: `4444444444444444444444444444444444444444`
- Committed input: `git diff 3333333333333333333333333333333333333333...HEAD`
- Commit list: `git log 3333333333333333333333333333333333333333..HEAD --oneline`
- WIP inputs: `git diff --cached` for staged `packages/server/src/routes.ts`, and `git diff` for unstaged tracked `packages/web/src/App.tsx`
- Scope: the non-empty committed diff plus those staged and unstaged tracked changes. Untracked `notes.txt` is explicitly excluded.

The status and non-empty-diff gates pass. I would not stage, patch, or otherwise mutate anything.

`Pre-dispatch Standards source inventory: AGENTS.md | docs/FOUNDATIONS.md | smell baseline`

`Pre-dispatch Spec source inventory: no spec available`

Because the user has already confirmed that there is no issue, PRD, or spec, I would skip only the Spec reviewer. I would dispatch `standards-wip` read-only with the committed, cached, and unstaged tracked diffs, the exact Standards inventory, the contents of both named standards files, and the full smell baseline. Its result must distinguish the hard rule breach from the judgement-only smell.

## Standards

Initial finding count: 2 total (1 hard violation, 1 judgement call). Worst severity: hard violation.

1. **Hard violation — `packages/server/src/routes.ts` (staged):** the listen host is `0.0.0.0`. That breaches the localhost-only binding rule in `AGENTS.md` and `docs/FOUNDATIONS.md`. This is a release-blocking standards failure; the review should recommend binding to `127.0.0.1`, but make no fix during this review.
2. **Judgement call — `packages/web/src/App.tsx` (unstaged):** possible **Divergent Change** smell. It must remain labelled as a tentative smell, not a documented-rule breach. The supplied facts do not include the hunk text, so I would require the actual report to quote the relevant hunk before treating this reviewer output as complete; I would not invent that quote or promote the smell to a hard finding.

## Spec

Initial finding count: 0. Worst severity: none.

`no spec available`

The Spec reviewer was intentionally skipped, so this means no Spec axis could be evaluated; it is not a claim that the changes satisfy an absent specification.

Reviewer custody: `standards-wip` — terminal status `completed`. The scenario does not supply whether a close operation surfaced, so the real run must record the observed close result rather than invent `auto-disposed` or `close operation unavailable`. Spec reviewer: not dispatched. `Review recovery: none`.

Final summary: Standards — 2 findings, worst hard violation; Spec — 0 findings, worst none (`no spec available`). No repairs were authorized or performed.
