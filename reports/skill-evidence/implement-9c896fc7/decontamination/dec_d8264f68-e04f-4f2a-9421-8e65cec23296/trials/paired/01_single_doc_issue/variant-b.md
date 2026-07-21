# Ordered execution transcript for issue #3

1. Read the repository instructions and active authority map before touching the ADR. Follow their links to the repository ADR form/conventions, ADR 0001, ADR 0002, and any authority specifically named by issue #3. Treat those live documents—not assumptions about a conventional ADR—as the source of the required form, migration mandate, and comparison criteria.

2. Establish the starting fixed point and worktree boundary:

   - Record the current `HEAD`.
   - Run `git status --short`.
   - Classify every pre-existing unstaged path under `.claude/skills/` as unrelated, user-owned dirt. Do not edit, stage, revert, format, or include those paths in any commit.

3. Exact-read GitHub issue #3: body, comments, labels, state, dependencies, and related items. If the first tracker read fails transiently, record that failed intake attempt and retry only the read-only query. Do not infer scope from the prompt and do not mutate the tracker. Proceed only after a successful exact read confirms that #3 is still open, is labeled `ready-for-agent`, has no unresolved prerequisite, and still asks for ADR 0004. If exact intake remains unavailable, make no edit and return a blocked handoff naming tracker intake as the missing prerequisite.

4. Save one ordered issue-body snapshot with `capture-github-issues.mjs`, then build the acceptance manifest and audit scaffold from that snapshot. Continue to use live exact reads for comments and mutable issue state.

5. Make the pre-edit ledger visible:

   | Work item | Dependencies/blockers | Exact acceptance atoms | Authority | Proof seam | Artifact disposition | Status |
   |---|---|---|---|---|---|---|
   | #3 / ADR form | None after live confirmation | Every exact field, heading, and status convention required by the repository ADR form | ADR form/conventions | Conformance review of `docs/adr/0004-stack.md` against the form | ADR 0004 remains active; no archive action | planned |
   | #3 / ADR 0002 rationale | None | Name every applicable ADR 0002 criterion and explicitly explain why ADR 0004's decision satisfies or departs from it | ADR 0002 | Criterion-by-criterion textual comparison in ADR 0004 | same | planned |
   | #3 / ADR 0001 migration | None | State the exact migration mandate imposed by ADR 0001 and make ADR 0004's plan conform to it | ADR 0001 | Explicit mandate and compliant migration text in ADR 0004 | same | planned |
   | #3 / settled postures | None | The three postures named by the live issue, each stated as settled with an unambiguous outcome | Issue #3 plus named authority | Three separately identifiable decisions in ADR 0004 | same | planned |
   | #3 / React-Vite revision path | None | A clear current-to-revised React/Vite path with the required steps, ordering, and end state from the live issue | Issue #3 and applicable ADRs | Revision-path section in ADR 0004 | same | planned |

   Related-item classification: only exact-read related items are classified; none is silently adopted into scope. Ownership: no new helper, module, persistence call, or cross-module entrypoint is introduced. Proof availability: local document conformance and repository checks are available; browser proof is not applicable. Next action: minimally revise only `docs/adr/0004-stack.md`.

6. Use the repository TDD guidance and record **TDD: N/A — documentation-only acceptance has no runnable behavior seam; proof is direct conformance and review.** Do not invent a test or alter tests to manufacture red/green evidence.

7. Compare the existing ADR 0004 line by line with the manifest, ADR form, ADR 0001, and ADR 0002. Preserve already-correct content. Edit only `docs/adr/0004-stack.md`, adding the missing form elements and the smallest text necessary to satisfy all five ledger rows. The rationale must address the actual ADR 0002 criteria, the migration language must reflect ADR 0001's actual mandate, all three issue-named postures must be settled rather than deferred, and the React/Vite revision path must be actionable and unambiguous. Do not broaden the change into implementation work or unrelated documentation cleanup.

8. Inspect the working diff and audit every acceptance row against the exact issue wording. For each row, record:

   - `atoms:` the complete required form elements, named ADR criteria/mandate, exact three postures, or revision-path elements;
   - `proof surfaces:` the precise ADR 0004 sections/lines plus the governing issue or ADR section they satisfy;
   - `sequence:` `N/A — static document conformance; no lifecycle transition is claimed`, except where the React/Vite migration path itself requires an ordered sequence, in which case quote that order as evidence.

   No row becomes `satisfied` merely because nearby prose discusses the topic.

9. Start and retain a verification ledger. Run the repository's canonical checks on the candidate final tree and record exact output-derived results, run counts, and represented tree/SHA:

   | Exact command | Required observed result | Run count | Represented tree/SHA |
   |---|---|---:|---|
   | `pnpm test` | successful exit and actual test counts/output | increment for every run | candidate tree, later final SHA |
   | `pnpm typecheck` | successful exit and package/result summary | increment for every run | candidate tree, later final SHA |
   | `pnpm build` | successful exit and build summary | increment for every run | candidate tree, later final SHA |

   Record setup failures separately and rerun the exact command after repair; a setup failure is not behavioral red evidence. Only successful rows refreshed on the final tree may appear as passing closeout proof.

10. Record **Browser/manual proof: N/A — issue #3 changes only an ADR and does not change UI, routes, browser-consumed API/data, fixtures, or a user action path.** Record console, backend-currentness, proof-process cleanup, and browser freshness as N/A for the same concrete reason; no proof-owned process should be started.

11. Generate the acceptance manifest/audit, run the implement validator in audit-only review-entry mode, and visually confirm that all five rows contain exact non-circular atoms, proof surfaces, and sequence evidence. If any row is unsupported, leave it `blocked` or `not done`, do not enter closeout review, and keep #3 open.

12. Re-run `git status --short`, reconcile ADR 0004 as an active artifact, and stage only `docs/adr/0004-stack.md`. Inspect `git diff --cached --name-only`; it must contain exactly that file. The visible pre-commit note records the acceptance audit as the evidence sink, no unresolved rows, active/no-archive disposition, no ownership change, the unrelated `.claude/skills/` dirt, and the exact one-file staged list. Commit the owned documentation change without including unrelated dirt.

13. Read and invoke the repository `code-review` workflow against the resolved pre-implementation commit through the implementation commit. Require both Standards and Spec review of the actual committed diff. Preserve all findings. If review finds a defect, repair only ADR 0004, refresh the acceptance audit, rerun every stale verification gate, commit or intentionally amend only the owned file, and rerun any stale review axis so the final review frame ends at current `HEAD`. The durable closeout must carry the canonical review handoff unchanged and truthfully say one of: no findings, findings fixed, or accepted residuals.

14. Resolve the final 40-character `HEAD` SHA and ensure every verification row and reviewed-HEAD field names that same SHA. Push according to repository policy and prove actual remote reachability by naming the remote ref that contains the SHA. If the final commit cannot be made remote-visible and no explicit, policy-compatible local-only closeout was authorized, stop with a blocked handoff and leave #3 open.

15. Build the exact publishable closeout body from the acceptance manifest. It must contain, with real resolved values and no placeholders:

   - final SHA, reviewed SHA/range, and the remote ref proving reachability;
   - one audit row for each of the five acceptance checks, with columns `Acceptance criterion or conformance check`, `Evidence`, and `Status`;
   - literal `satisfied` status for every row, with complete `atoms:`, concrete ADR/authority `proof surfaces:`, and exact `sequence:` evidence or justified N/A;
   - the repository-form conformance evidence;
   - criterion-by-criterion ADR 0002 rationale evidence;
   - exact ADR 0001 migration-mandate evidence;
   - separate evidence for all three issue-named settled postures;
   - the ordered React/Vite revision-path evidence;
   - `TDD: N/A` with the docs-only reason;
   - final-tree results for `pnpm test`, `pnpm typecheck`, and `pnpm build`, including output-derived results, run counts, and final SHA;
   - the canonical `code-review` evidence covering final `HEAD` and the disposition of every finding;
   - Principles/ADR conformance, or a precise N/A only for a genuinely absent category;
   - browser, console, backend, and freshness N/A evidence with the docs-only reason;
   - current evidence identity for the final ADR/commit and truthful historical-red/superseded-evidence disposition (none if none exists);
   - ADR 0004's active/no-archive disposition, no proof processes to clean up, and preservation of unrelated `.claude/skills/` dirt.

16. Run the applicable nested TDD and normal-review validators, then the implement closeout validator against that exact body and acceptance manifest. The last implement validation immediately before mutation must include `--closing`, `--expected-final-sha` set to current `HEAD`, `--emit-preflight`, and `--mutation-ready`. Inspect the exact body size, every audit row/status, relevant sections, and absence of unresolved placeholders. Copy the validator's `Closeout preflight:`, `Closeout gate passed:`, `Post-comment verification next:`, mutation-ready confirmation, and any machine-derived `Accepted residuals:` summary verbatim into the durable body. Any body change makes inspection and affected validation stale and requires rerunning them.

17. Only after all gates pass, post the long body to issue #3 with `gh issue comment 3 --body-file ...`. Capture the returned comment URL and exact-read it with `verify-github-comment-body.mjs`; require an exact UTF-8 match before closing. Then close #3 as completed with a short comment pointing to the verified evidence URL.

18. If either mutation returns ambiguous output or tracker access fails during readback, preserve the mutation result and retry only the read-only lookup; never replay a comment or close merely because verification was temporarily unavailable. Until state is verified, report it as unverifiable rather than completed.

19. Final exact readback must establish all of the following before claiming completion:

   - issue #3 is `CLOSED` with the intended completion reason;
   - the latest relevant comment URL contains the exact validated closeout body;
   - the final SHA is still current `HEAD`, is the reviewed and verified tree, and is visible on the recorded remote ref;
   - `git status --short` shows no uncommitted implementation-owned change;
   - the pre-existing `.claude/skills/` changes remain unrelated and untouched;
   - no browser/server/proof process was started, so cleanup is N/A.

20. Return the closeout result with the resolved final SHA, all three final-tree command results, canonical review outcome, exact issue/comment readback, remote visibility, N/A browser/process disposition, active ADR disposition, and remaining unrelated dirt. If any required evidence is missing, instead return the blocked-closeout handoff with live issue state, verified file/commit frontier, verification and review status, the exact unsatisfied row, its missing proof, and the next exact action; leave issue #3 open and perform no tracker mutation.
