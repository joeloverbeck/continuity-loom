# Proposed execution and closeout transcript

1. Start with read-only intake. Read the repository's root agent instructions, `docs/ACTIVE-DOCS.md`, and the active documentation/ADR authorities it selects. Run `git status --short` before any edit. Record every exact unrelated path under `.claude/skills/` and leave those files untouched and unstaged throughout.

2. Fetch issue #3 exactly, including comments and structured state, with `gh issue view 3 --comments --json number,title,state,body,comments,labels,closed,closedAt,url`. If the first tracker read fails transiently, record the failed command and error and retry that same read-only lookup once; do not infer the issue from the fixture and do not edit until the exact lookup succeeds. If the retry also fails, stop with scope resolution blocked. Confirm that #3 is open and `ready-for-agent`, inspect any explicit links, and exact-view any linked candidate before classifying it as a blocker, prerequisite, or contextual item.

3. Save the exact issue body in one canonical snapshot for all later manifest, review, and closeout work:

   `node .claude/skills/implement/scripts/capture-github-issues.mjs 3 --output /tmp/issue-3.json`

   Read the existing `docs/adr/0004-stack.md`, ADR 0001, ADR 0002, the repository's ADR form/status authority, and every authority selected by `docs/ACTIVE-DOCS.md` for this decision. If issue #3 contains a `## Principles` section, also follow the repository-native domain-authority procedure and read `CONTEXT.md` plus every named principle or ADR. Expand every composite term: enumerate each ADR 0002 criterion, the exact ADR 0001 migration mandate, each of the three settled postures, and every element of the React/Vite revision path. Do not treat those umbrella phrases as sufficient acceptance statements.

4. Post this scope ledger before the first edit, replacing the summarized acceptance labels with the exact issue wording and the exact named atoms just read:

   `Artifact disposition: docs/adr/0004-stack.md -> remain active as the repository ADR authority after its required status/form is completed; it is not a completed implementation report to archive.`

   | Issue | Blockers | Acceptance | Principles | Evidence | Test seam | Status | Closeout comment |
   |---|---|---|---|---|---|---|---|
   | #3 | none after exact linked-item classification | ADR form; explicit rationale against every named ADR 0002 criterion; ADR 0001 migration mandate; all three settled postures named separately; clear React/Vite revision path | ADR 0001, ADR 0002, ADR-form authority, and any inline Principles | exact document diff, criterion-by-criterion audit, final verification, Standards/Spec review | docs-only; no runnable behavior seam exists, so conformance review replaces an invented test | planned | final SHA plus verified closeout comment URL |

   `Scope ledger posted: yes; no edits started; unrelated dirty files .claude/skills/** (exact paths listed above); in-scope issues #3; related tracker classification done; artifact disposition docs/adr/0004-stack.md remains active as ADR authority; ownership/placement decisions N/A.`

5. Record the TDD disposition before editing: `TDD evidence: N/A because no tdd skill was invoked; issue #3 is documentation-only and has no runnable behavior seam.` No browser or synthetic unit test is invented for prose conformance.

6. Edit only `docs/adr/0004-stack.md`. Bring it into the repository's exact ADR form and status, then make the decision text explicitly cover:

   - the rationale against every individually named ADR 0002 criterion;
   - the exact migration mandate imposed by ADR 0001;
   - all three settled postures, each named and resolved rather than implied;
   - the concrete React/Vite revision path, including any trigger, authority, ordered action, and supersession/result that the issue or ADR authorities require.

   Preserve the existing valid content and avoid unrelated ADR cleanup. Re-read the finished document beside issue #3, ADR 0001, and ADR 0002. Inspect `git diff -- docs/adr/0004-stack.md` and `git diff --check`; confirm `.claude/skills/**` is unchanged by this implementation.

7. Start a durable verification-command ledger before using any command as pass evidence. Run the repository's canonical commands against the completed working tree:

   - `pnpm test`
   - `pnpm typecheck`
   - `pnpm build`

   Record each exact command, its output-derived result/counts, run count, and represented working-tree identity. A failure keeps the relevant audit row `blocked` or `not done`; do not stage merely because the ADR reads plausibly.

8. Build the deterministic acceptance manifest and working audit from `/tmp/issue-3.json`. Preserve every generated check ID and exact criterion text. Fill one row per acceptance check; when one issue checkbox contains a composite term, enumerate every atom in that row, and split it further if that is needed for honest evidence. Every satisfied Evidence cell must include literal `atoms:`, `proof surfaces:`, and `sequence:` labels. Use `docs/adr/0004-stack.md`, the exact issue/ADR anchors, the diff, and verification/review commands as concrete proof surfaces. Use `sequence: N/A because the documentation criterion is not sequence-sensitive` only where true; the migration or React/Vite revision row must instead give the ordered steps if the authority makes order part of the requirement. Run the audit-only validator with `--review-entry --acceptance-manifest /tmp/issue-3-acceptance-manifest.json`. Any unsupported atom remains `blocked` or `not done`, the document is repaired, and the audit is rerun before review.

9. Rerun `git status --short` and make the pre-stage gate visible:

   `Implementation pre-stage gate passed: working pre-close audit drafted in the issue #3 acceptance-audit scaffold; blocked/not done rows none; artifact disposition reconciled; ownership/placement decisions N/A; unrelated dirty files .claude/skills/** (exact paths listed).`

   Stage only `docs/adr/0004-stack.md`. Inspect `git diff --cached --name-only` and `git diff --cached`; abort staging if any `.claude/skills/**` path appears. Then make the commit gate visible:

   `Implementation commit gate passed: staged files scoped yes; staged file list docs/adr/0004-stack.md; working pre-close audit issue #3 acceptance-audit scaffold; blocked/not done rows none; artifact disposition reconciled.`

10. Save the resolved pre-implementation fixed-point SHA and commit the scoped ADR change. Read and apply the repository's `code-review` skill, then invoke it against that resolved fixed point through the implementation commit. Review both axes:

    - Standards: repository documentation and ADR conventions, active-doc authority, and scoped-diff hygiene.
    - Spec: every exact issue #3 criterion and all expanded ADR 0001/0002/posture/revision-path atoms.

    If normal review cannot run, choose fallback only after the `code-review` skill's own policy check and carry its complete two-axis fallback block and validator evidence. If review finds a documentation or conformance defect, repair only the ADR, record the finding in the immutable review ledger, use the docs-only/conformance-only red-first skip disposition rather than fabricating a behavioral red, stage only the ADR, amend or make a follow-up fix commit intentionally, rerun the affected and canonical verification, and re-review the final tree. Continue until the final HEAD is covered by current review evidence with no unhandled findings, or with explicitly justified accepted residuals.

11. Resolve the literal final 40-character SHA and rerun `pnpm test`, `pnpm typecheck`, and `pnpm build` on that exact final tree. Update the verification ledger with only final-SHA rows for publication. Determine remote reachability. If the SHA is not on an intended remote branch, the closeout body must contain the filled sentence: `Local-only SHA: ACTUAL_FINAL_SHA is not remote-reachable because the implementation was committed locally and no push was requested; local-only closeout is acceptable because the user requested implementation and tracker closeout without a push and repository policy permits local-only closeout.` `ACTUAL_FINAL_SHA` is replaced by the literal SHA before validation; no symbolic value is posted.

12. Treat browser proof as N/A, with the exact rationale: `browser smoke N/A because issue #3 is docs-only; no UI, route, browser-consumed API shape, fixture, validation response, rendered behavior, or action path changed.` Record console state and final freshness consistently as N/A. Record the evidence identity refresh even though no browser/TDD artifacts exist:

    - `Current evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none`
    - `Historical red identities retained: none`
    - `Superseded evidence identities: fixture paths none; browser sessions none; packet paths/hashes none; active revisions none; artifacts none`
    - `Superseded-token sweep: N/A because every superseded category is none`

13. Re-read the tracker closeout gates immediately before drafting closeout evidence. Build a private `/tmp` closeout body from the acceptance manifest with the closeout scaffold helper, normal or fallback review mode as actually observed, `--size-plan`, and `--require-headroom`. Do not fill it unless the size plan says `ok`. The publishable body uses `GitHub issue #3 closeout comment body inspected before posting` as its stable sink identity and never exposes the `/tmp` staging path.

14. Fill the final closeout body with literal observed values, not placeholders. It must contain:

    - `Final SHA:` with the literal final SHA, plus the full `Local-only SHA:` sentence when required;
    - a verification table for `pnpm test`, `pnpm typecheck`, and `pnpm build`, including observed output-derived results/counts, run counts, and the final SHA represented by every published row;
    - `TDD evidence: N/A because no tdd skill was invoked; issue #3 is docs-only and has no runnable seam`;
    - the complete normal `code-review` frame and `## Standards`/`## Spec` evidence, or the complete validated fallback block, followed by exactly one closeout-ready line such as `Review: code-review against RESOLVED_FIXED_POINT; outcome no findings; verification rerun pnpm test, pnpm typecheck, pnpm build` with both symbolic SHAs replaced by literal values;
    - `Principles/ADR conformance: no deliberate exceptions.` if the final audit confirms alignment, or a concrete steward-approved exception and approval source instead;
    - the docs-only browser N/A, console N/A, backend-currentness N/A, and final freshness N/A statements;
    - the four-part evidence-identity block above;
    - exact artifact disposition for `docs/adr/0004-stack.md`;
    - the criterion audit below, mechanically matched to the acceptance manifest.

    The final audit uses this exact shape:

    | Issue | Acceptance criterion or conformance check | Evidence | Status |
    |---|---|---|---|
    | #3 | exact ADR-form criterion | atoms: every required ADR form/status element named from repository authority; proof surfaces: `docs/adr/0004-stack.md`, scoped diff, and Standards/Spec review; sequence: N/A because form conformance is not sequence-sensitive | satisfied |
    | #3 | exact ADR 0002 rationale criterion | atoms: every ADR 0002 decision criterion individually named; proof surfaces: the corresponding rationale paragraphs in `docs/adr/0004-stack.md`, ADR 0002, scoped diff, and Spec review; sequence: N/A unless the exact criterion requires an order | satisfied |
    | #3 | exact ADR 0001 migration-mandate criterion | atoms: the mandate's exact actors, trigger, actions, and result as defined by ADR 0001; proof surfaces: the migration section in `docs/adr/0004-stack.md`, ADR 0001, scoped diff, and Spec review; sequence: the exact mandate order and observing document anchors | satisfied |
    | #3 | exact three-settled-postures criterion | atoms: each of the three postures named separately with its settled disposition; proof surfaces: the three corresponding decision passages in `docs/adr/0004-stack.md`, scoped diff, and Spec review; sequence: N/A because the three posture decisions are not lifecycle events | satisfied |
    | #3 | exact React/Vite revision-path criterion | atoms: every required trigger, authority, revision action, and resulting supersession/update; proof surfaces: the revision-path passage in `docs/adr/0004-stack.md`, scoped diff, and Spec review; sequence: trigger -> authorized revision -> documented replacement/supersession result | satisfied |

    Replace every descriptive `exact ...` phrase and every summarized atom with the literal issue/authority wording before validation. If the generated manifest has more granular checks, preserve those separate rows. Do not close #3 unless every manifest row is literally `satisfied`.

15. Inspect the completed body in bounded excerpts and run `wc -c`, the unresolved-angle-token sweep, the gate/evidence-label sweep, the audit-header/status/atoms/surfaces/sequence sweep, and the browser/freshness sweep. Visually confirm the grouped criteria. Run the applicable normal-review or fallback validator, then the implement closing validator with `--closing --expected-final-sha "$(git rev-parse HEAD)"`, `--acceptance-manifest /tmp/issue-3-acceptance-manifest.json`, and conditional `--principles`, `--local-only`, or `--review-fallback` flags. Repair and reinspect any failure.

16. Immediately before the first tracker mutation, re-read the tracker closeout gates and rerun the exact implement validator with `--emit-preflight --mutation-ready`. Copy its output verbatim into the conversation, including `Closeout preflight:`, `Closeout gate passed: audit sink ...`, `Post-comment verification next: ...`, the mutation-ready confirmation, and any machine-derived accepted-residual summary. Also record the exact body-check line:

    `Closeout body check passed: audit table columns exact; every acceptance checkbox or conformance check named; every satisfied Evidence cell contains atoms/proof surfaces/sequence; every status literal satisfied/blocked/not done; final SHA present; verification evidence present; TDD evidence present or N/A; review evidence present; evidence identity refresh and superseded-token sweep present; Principles/ADR conformance string present or N/A; full Local-only SHA explanatory sentence present or N/A; browser evidence present/N/A/blocked; browser console state recorded when browser evidence is present or N/A/blocked; final browser/manual freshness delta present/N/A; exact fixed child inline comment inspected N/A.`

17. Post the inspected body to issue #3 with `gh issue comment 3 --body-file` and capture the returned comment URL. Before any close command, verify the exact stored UTF-8 body with `verify-github-comment-body.mjs COMMENT_URL BODY_FILE`. Only after that exact match passes, close #3 as completed with a short inline comment containing the literal final SHA and verified evidence URL.

18. Exact-read issue #3 by number with bounded fields and confirm state `CLOSED`, the close reason, URL, and latest short close comment. If a mutation or readback reports an ambiguous failure, do not replay it: preserve the mutation output and URL, retry only the exact read-only state lookup, and claim completion only after readback proves the mutation took effect.

19. Run a final `git status --short`. Confirm the only implementation-owned tracked change is represented by the final commit, the unrelated `.claude/skills/**` changes remain untouched and unstaged, and no temporary verification artifact was left in the repository. Stop any proof-owned process if one was unexpectedly started.

20. Return the completion summary with the literal final SHA and its reachability, the verified issue #3 comment URL and exact `CLOSED` readback, final results for all three `pnpm` commands, the normal or fallback review outcome, `TDD N/A` and browser N/A rationales, ADR/Principles conformance, artifact disposition, and the unchanged unrelated `.claude/skills/**` dirt. If any audit row, verification command, review gate, exact-body verification, or tracker readback is not satisfied, return a blocked closeout handoff and leave issue #3 open instead.
