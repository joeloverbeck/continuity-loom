### Resume and protect scope

1. Re-read `HEAD` and `git status --short`. Confirm `HEAD` is `aaaa111`, classify the validation-guard change and regression test as implementation-owned, and record every unrelated user edit. Do not edit, stage, revert, or include those unrelated paths.
2. Preserve the review finding as a real behavior finding, for example `P1-spec-1`, and map it to one review-fix proof row, `RF-1`. Keep `aaaa111` as the reviewed pre-fix implementation commit; it is no longer a valid final SHA.
3. Invalidate the original closeout draft for publication because its active final-tree fields still name `aaaa111`.

### Complete review-fix evidence

4. If an intended-behavior red was not captured before the already-present fix, reproduce it without disturbing the dirty worktree: use an isolated tree based on `aaaa111`, apply only the regression test, and run the focused test command. Record the output-derived failure showing that the missing validation guard—not setup or an unrelated failure—causes the regression test to fail.
5. Run the same focused test against the fixed working tree and record its passing counts. The durable review-fix record now states: finding, issue/seam, intended red at `aaaa111`, green on the fixed tree, regression-test path, repair, browser/backend freshness disposition, and evidence-identity refresh disposition.
6. Re-audit every issue acceptance and Principles/ADR row. A satisfied row must contain the exact required atoms, concrete proof surfaces, and ordered sequence evidence, or a justified sequence N/A. Any unsupported row remains blocked and stops this transcript before commit or tracker mutation.

### Create the final implementation commit

7. Inspect the worktree and staged lists again. Stage only the owned validation-guard and regression-test paths, then inspect `git diff --cached --name-only` and the staged diff. The pre-commit note records the audit sink, no unresolved rows, artifact disposition, ownership decisions, the exact staged paths, and the unrelated dirt left unstaged.
8. Create an intentional follow-up commit rather than rewriting away the reviewed state. Resolve `FINAL_SHA` from the new `HEAD` and confirm `FINAL_SHA != aaaa111`.
9. Run every affected focused gate and the repository's canonical final-tree gates against `FINAL_SHA`, recording exact commands, output-derived results/counts, run counts, and represented SHA. Any failure is repaired and followed by another owned commit, after which `FINAL_SHA`, all stale gates, and all evidence are refreshed again.
10. Re-evaluate browser/manual applicability from the changed seam. If it is browser-consumed behavior, prove the production route and user action in a real browser against the reviewed backend, record URL/process ownership, outcome, console state, backend currentness, freshness, artifact disposition, and cleanup. Otherwise record a concrete reasoned browser/backend N/A. A stale or blocked required browser result keeps the issue open.

### Review the actual final tree

11. Invoke the repository `code-review` workflow from the original pre-implementation fixed point through `FINAL_SHA`, so the frame includes `aaaa111` and the follow-up review-fix commit. Rerun every review axis made stale by the fix.
12. Carry the canonical review handoff into the durable closeout evidence unchanged. Preserve `P1-spec-1` as historical, map it to `RF-1`, and report the final outcome as `findings fixed`; do not rewrite the history as “no findings.” If review finds another defect, repeat the red/green, owned-commit, verification, freshness, identity, and review-refresh loop before proceeding.
13. Push the final commit when remote publication is required, then verify actual remote reachability of `FINAL_SHA`. A merely local SHA does not qualify unless both repository policy and explicit user authorization allow local-only closeout and that rationale is included in the durable body.

### Rebuild and validate closeout evidence

14. Rebuild the exact publishable body from the saved issue acceptance manifest and final evidence, using the immediate-review-fix path and structured evidence where appropriate. The body includes:

    - one exact audit row per manifest check, all literally `satisfied`, with atoms, proof surfaces, and sequence evidence;
    - `FINAL_SHA` consistently in every active final-tree, reviewed-HEAD, and verification field, plus verified remote reachability;
    - original TDD evidence and the `RF-1` intended-red/green regression evidence;
    - the canonical final review evidence with `P1-spec-1` fixed;
    - final-tree command ledger, Principles/ADR evidence or reasoned N/A, browser/console/backend/freshness evidence or reasoned N/A, and artifact disposition;
    - current, historical-red, and superseded evidence identities.

    `aaaa111` may remain only where it is clearly classified as the historical pre-fix commit/red subject. Replace every stale active reference from the original draft, run the superseded-token sweep, inspect body size and all required sections, and ensure no unresolved placeholders remain.
15. Run the applicable nested TDD and review validators on that exact body with `--closing`, `--expected-final-sha FINAL_SHA`, and the acceptance manifest. Then run the implement validator diagnostically with `--closing` and finally on the unchanged body with `--closing --expected-final-sha FINAL_SHA --emit-preflight --mutation-ready` and the manifest.
16. Visually confirm the exact body still has every named criterion and literal satisfied status. Preserve verbatim the emitted `Closeout preflight:`, `Closeout gate passed:`, `Post-comment verification next:`, mutation-ready confirmation, and any machine-derived `Accepted residuals:` line. Any body change makes inspection and affected validation stale and requires rerunning them.

### Mutate and exact-read the tracker

17. Only after the mutation-ready pass, post the long body to the still-open issue by body file. Preserve the returned comment URL. If the mutation result is ambiguous, perform a read-only lookup; do not replay the comment merely because verification was unavailable.
18. Exact-read the posted UTF-8 body with `verify-github-comment-body.mjs`. Do not close the issue unless the exact body match passes.
19. Close the issue as completed with a short pointer to the verified evidence comment.
20. Read back the issue number, `CLOSED` state, completed state reason, URL, and latest relevant comment. Independently recheck `FINAL_SHA` remote visibility. If state readback is unavailable, preserve the mutation evidence, retry read-only lookup only, and do not claim verified completion.
21. Stop only proof-owned processes, classify retained or removed evidence artifacts, and run a final `git status --short`. Report `FINAL_SHA`, passing final-tree verification, review outcome `findings fixed`, verified live issue state, browser/process cleanup or reasoned N/A, and the unrelated user edits still untouched and unstaged.
