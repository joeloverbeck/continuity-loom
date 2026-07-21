# Proposed execution/evidence/closeout transcript

1. **Resolve live scope before any edit.**

   - Read the repository's root instructions, active-doc map, verification guidance, and the exact authority paths named by issues #69, #70, and #71.
   - Run `git status --short`. Classify the referenced dirty ADR and untracked context document as in-scope pending authority, preserve their existing content, and list every other dirty path as unrelated and excluded from edits/staging.
   - Fetch exact structured bodies and comments for #69, #70, and #71 with `gh issue view ... --comments --json number,title,state,body,comments,labels,closed,closedAt,url`.
   - Search all issue states for explicit `#69` references, exact-read every candidate, and classify it as child, blocker, enabling prerequisite, contextual backlog, intentionally excluded, or unrelated. The parent cannot be considered closable until every real child is accounted for.
   - Save one ordered canonical snapshot for #69, #70, and #71 with `capture-github-issues.mjs`; use that same snapshot for the ledger, acceptance manifest, review, and closeout.
   - If any issue contains `## Principles`, follow the repository-native authority procedure: read the active domain guidance, the referenced context document, the dirty ADR, and every other named principle/ADR. Even without a `## Principles` heading, read the ADR and context document because the issue bodies make them pending authority that must land with this work.
   - Expand every acceptance criterion into its exact atoms and proof surfaces. In particular, do not treat “retrofit the UI” or “preserve enabled action anchors” as umbrella proof: enumerate the market-card, player-mat, and legend surfaces and every named anchor/enablement condition from #71.
   - Preflight the non-test proof before editing: confirm the browser wrapper is available; inspect configured UI/API ports and current owners; identify the real routed game screen and action path; and decide how the required screenshot will be retained and identified. If the browser mechanism is unavailable, mark #71 and therefore #69 blocked, quote the affected criterion, and ask whether to proceed with a code-only partial implementation. Do not promise closure.

2. **Post the scope ledger and first-edit gate.**

   The visible ledger will contain exact issue wording rather than summaries and will include:

   `Ownership/placement decisions: Glyph primitive and its runtime-validation contract -> the existing shared React primitive/component owner determined from current imports and nearest callers; #71 surface-specific composition remains with the game UI owners; the referenced ADR/context authority governs the placement. No flow-specific behavior will be parked in a broader helper merely for convenience.`

   `Artifact disposition: referenced dirty ADR -> retain as active authority and commit with this implementation; referenced untracked context document -> retain as active context authority and commit with this implementation; issue family #69/#70/#71 -> close only after exact acceptance, review, browser, SHA, and live-state gates pass.`

   | Issue | Blockers | Acceptance | Principles/ADR obligations | Planned evidence | Test seam | Status | Closeout comment |
   |---|---|---|---|---|---|---|---|
   | #70 | none after authority and ownership confirmation | every exact #70 criterion, split into runtime-validation and rendered-primitive atoms | dirty ADR, context document, and any inline Principles | focused primitive tests, typecheck, parity tests where applicable | shared `Glyph` public contract at the highest practical consumer-visible layer | planned | parent rollup URL after proof |
   | #71 | depends on #70 | every exact #71 criterion, with market cards, player mat, legend, required screenshot, and each enabled-action-anchor atom named separately | same authority set plus any #71-specific obligations | focused consumer/parity tests; routed browser assertions; screenshot; console state | game UI render/interaction seam plus evidence-only browser row | planned | parent rollup URL after proof |
   | #69 | #70 and #71 closed; every other discovered child classified and non-blocking or closed | exact parent solution/user-story/implementation/testing/Principles checks from the manifest | parent Principles/ADR checks | child evidence rollup, code review, exact child state readback | parent conformance/audit rows; no invented runnable seam | planned | parent closeout only after child CLOSED readback |

   The ledger will also name unrelated dirty files, related tracker classification, exact artifact paths, and the final screenshot sink/disposition.

   `Scope ledger posted: yes; no edits started; unrelated dirty files [exact paths or N/A]; in-scope issues #69, #70, #71; related tracker classification done; artifact disposition listed; ownership/placement decisions listed.`

3. **Start durable TDD and command evidence before the first evidentiary command.**

   - Invoke the repository `tdd` skill at the ledgered seams. Record its pre-red preflight and compact rows in a durable working ledger before the first red command.
   - Start a verification-command ledger with columns `Exact command`, `Observed result/counts`, `Run count`, and `Represented SHA/tree`. Record every unexpected failure separately; never reconstruct counts later.
   - Establish whether focused game/UI tests resolve the shared workspace from current source or built output. If they resolve built output, refresh it before baseline/red and after changing public exports. Classify only proven stale-build failures as setup evidence, then rerun the same focused command.

4. **Implement #70 first, red-green-refactor.**

   - Restate each exact #70 criterion and the proposed shared-component seam.
   - Add the smallest focused failing tests that prove the new `Glyph` render contract and each exact runtime-validation behavior. A red must fail because the required behavior is absent, not because a file/module is missing or the workspace build is stale.
   - Implement the shared React primitive and its validation in the ledgered owning module, export it through the existing public seam only if the current architecture requires that export, and avoid compatibility aliases or duplicate authority paths.
   - Run the exact focused test to green, then the applicable package typecheck/parity tests. Update the #70 ledger rows with commands, paths, atoms, proof surfaces, and sequence evidence or a justified sequence N/A.

5. **Implement #71 second, preserving the user action path.**

   - Add focused failing render/interaction/parity assertions for every exact surface named by #71: market cards, player mat, and legend. Add explicit assertions for every named enabled action anchor so visual replacement cannot silently disable, remove, cover, or reroute an action.
   - Retrofit those surfaces to use `Glyph`, changing only implementation-owned UI files. Keep action semantics, accessible names, enablement, handlers/links, and routing intact as required by the exact issue.
   - Run the focused commands to green and confirm output shows the intended files/seams actually ran.
   - Treat the required screenshot and routed interaction proof as an evidence-only TDD row rather than pretending a screenshot is a red-green unit seam. The row will name its route/action/outcome, proof-server preflight, browser console state, backend-currentness disposition, and evidence identity.

6. **Run preliminary real-browser proof through the actual user route.**

   - Recheck configured ports and owning processes immediately before starting proof. Do not stop or reuse unrelated pre-existing servers as evidence.
   - If default Vite/API ports are occupied, select isolated proof-owned ports, align the Vite proxy/API base, record exact commands, URLs, PIDs/session names, and probe expected application behavior before UI assertions.
   - Open the real routed game screen with the browser wrapper. Navigate through the same decision/action path a user takes to reach the market cards, player mat, and legend; do not substitute a component harness or legacy screen.
   - On that active routed surface, assert every named glyph outcome and each enabled action anchor, activate the relevant anchor where the criterion is action-sensitive, and record the observed result.
   - Capture the acceptance-required screenshot at the issue/repository-authorized evidence location. Record its stable identity and SHA-256 in the evidence inventory, and retain it through closeout; if it is intended tracked evidence, include it in the implementation commit, otherwise use the approved durable/local evidence disposition from the issue.
   - Record browser console errors and warnings. A reused/HMR-tainted session or agent-induced setup error makes the proof preliminary; rerun in a clean session before closeout.
   - Record backend process currentness if the route consumes server/API behavior: server command, watch/reload mode, process/port ownership, restart or demonstrated reload, and expected API behavior probe. Otherwise record the exact N/A reason.
   - Stop only proof-owned processes and sessions, leaving unrelated owners untouched.

7. **Verify, audit exact acceptance, and stage narrowly.**

   - Run focused tests/typechecks during the work, then the root canonical gates required by the blast radius: `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. Record exact result counts and the working-tree identity in the command ledger.
   - Build the deterministic acceptance manifest from the saved #69/#70/#71 JSON. Fill exactly one audit row for every generated parent, child AC, user-story, and Principles check.
   - Every `satisfied` Evidence cell must literally contain `atoms:`, `proof surfaces:`, and `sequence:`. It must name concrete tests, paths, commands, routed browser evidence, screenshot identity, or tracker anchors. Unsupported rows remain `blocked` or `not done`; that issue and #69 stay open.
   - Run the audit-only validator with `--review-entry --acceptance-manifest` only after all rows are truthfully `satisfied`.
   - Reconcile the ADR/context artifact disposition. Rerun `git status --short` and confirm the dirty ADR and context document are deliberately in scope while all other dirt remains excluded.

   `Implementation pre-stage gate passed: working pre-close audit drafted [stable working-ledger reference]; blocked/not done rows none; artifact disposition reconciled; ownership/placement decisions recorded; unrelated dirty files [exact paths or N/A].`

   - Stage only the `Glyph` implementation/tests, #71 retrofit/tests, required tracked screenshot if the authority calls for it, and the referenced ADR/context authority files. Inspect `git diff --cached --name-only` and the staged diff.

   `Implementation commit gate passed: staged files scoped yes; staged file list [exact paths]; working pre-close audit [stable working-ledger reference]; blocked/not done rows none; artifact disposition reconciled.`

8. **Commit, review against a fixed point, and refresh all final evidence.**

   - Create the implementation-owned commit and record the resolved pre-implementation fixed point and implementation SHA.
   - Invoke the repository `code-review` skill against that fixed point through final `HEAD`, covering both Standards and Spec. The Spec axis must enumerate #69, #70, and #71 exact audit sources, including every action-anchor and screenshot criterion. Use the skill-authorized local two-axis fallback only if its required review mechanism is genuinely unavailable, and preserve the full fallback block if used.
   - For each finding, give it an immutable review ID. Behavior-changing fixes get an intended-behavior red before repair when possible, then green proof. Stage only owned files, amend or make a follow-up commit intentionally, and keep the review frame anchored at the original implementation fixed point through final `HEAD`.
   - After any review fix, rerun affected focused and canonical gates. If the fix touches UI, routes, browser-consumed data/fixtures, or the action path, restart/reload the proof-owned server as necessary and rerun the real browser smoke in a clean session.
   - Establish the final SHA only after the last review fix. Rerun the required canonical verification on that exact final tree and publish only verification-ledger rows represented by that SHA.
   - Check browser freshness against the complete final touched-file set, including tests, evidence, ADR/context, and review fixes. Rerun the browser smoke on the final tree when affected; otherwise record the precise not-affected reason and targeted proof. Commit metadata alone may use the content-unchanged freshness form.
   - Refresh all evidence identities: current fixture paths, browser sessions, packet paths/hashes, active revisions, and artifacts; historical red identities; superseded identities; and an exact `rg`/`grep` superseded-token sweep showing no active-proof hits.
   - Stop all proof-owned browser/server processes and record cleanup.

9. **Compose and validate one parent rollup for the two-child family.**

   - Decide remote reachability. If the final SHA is remote-reachable, record that. If it is local-only and repository policy permits closeout without push, include exactly: `Local-only SHA: $FINAL_SHA is not remote-reachable because the implementation was committed locally and no push was requested; local-only closeout is acceptable because the user explicitly requested implementation and tracker closure without publication and repository policy permits local-only closeout.` If policy requires publication, do not close until it is reachable.
   - Build the parent rollup in an uncommitted temporary body from the acceptance manifest and final audit. Keep terminal final-SHA/review fields out of a tracked report.
   - Run the mandatory scaffold size plan with recommended headroom before filling the body. If it reports `low-headroom` or `exceeds-limit`, split into one shared evidence core and disjoint manifest-backed audit chunks; post and exact-read the core/chunks in the prescribed indexed order before closing anything.
   - For the normal small-body path, include: final SHA/reachability; final-SHA command ledger; full fielded TDD closeout evidence; normal `Review:` evidence or the complete fallback block; Standards and Spec sections; parent coverage; Principles/ADR conformance; routed browser route/action/outcome; screenshot identity; 0-error/0-warning or classified console state; backend currentness; final freshness delta; current/historical-red/superseded identities and token sweep; pre-child states for #70 and #71; exact manifest-backed audit rows; and stable self-referential wording for the fixed child comment.
   - Inspect the entire body in bounded excerpts, its byte count, placeholders, labels, audit columns/statuses, and browser/fixed-child fields. No unresolved placeholder, circular atom/surface wording, or nonliteral status may remain.
   - Run every applicable nested validator against the exact body: TDD parent-rollup validation; normal code-review validation with parent PRD, child family, browser, and TDD-parent-rollup flags (or the fallback validator if fallback was used); and implement closing validation with final SHA, acceptance manifest, Principles/local-only flags when applicable, and `--fixed-child-pending` while the rollup URL does not yet exist.

10. **Perform the continuous tracker closeout sequence with exact readbacks.**

    - Immediately before the first tracker mutation, reread/reapply the tracker-closeout gate, rerun the implement validator on the exact inspected parent body with `--emit-preflight --mutation-ready`, and copy its complete output verbatim into the conversation, including `Closeout preflight:`, `Closeout gate passed: audit sink ...`, `Post-comment verification next: ...`, mutation-ready confirmation, and any machine-derived accepted-residual summary. A successful closing validation without those flags does not authorize mutation.
    - Post the parent #69 rollup with `gh issue comment 69 --body-file "$body"`, capture the returned HTTPS comment URL, and require `verify-github-comment-body.mjs "$comment_url" "$body"` to report an exact UTF-8 match before any close command. Do not replay a mutation after an ambiguous response until a read-only lookup proves it did not take effect.
    - Substitute the real parent rollup URL into the one fixed child close string and inspect it visibly once:

      `Fixed child final inline close comment inspected: Completed by $FINAL_SHA. Evidence: $PARENT_ROLLUP_URL`

    - Close #70 first, then #71, each with `--reason completed` and that exact unchanged inline comment. Before each close, confirm its own audit rows remain `satisfied`; after each close, read back the issue by exact number using bounded state output and verify the latest inline comment.
    - After both reads show `#70 CLOSED` and `#71 CLOSED`, record those exact states durably in a verified follow-up parent comment, a verified rollup patch, or an inspected parent-close comment. If either readback is unavailable or not CLOSED, keep #69 open.
    - Exact-read all other #69-related child states from the scope ledger. Close #69 only when every true child is closed or classified by the tracker as non-blocking and the parent audit rows are all `satisfied`. Use a short inline close comment pointing to the verified parent rollup.
    - Exact-read #69, #70, and #71 again with bounded state fields and verify their latest close comments before claiming completion.

11. **Final handoff.**

    - Run final `git status --short`; report the final SHA and whether it is remote-reachable, exact final verification commands/results, `Review:` or `Review fallback:` outcome, browser route/action/screenshot/console/freshness evidence, proof-process cleanup, exact CLOSED readback for #69/#70/#71, retained screenshot/evidence disposition, and unrelated dirty paths left untouched.
    - If any audit row, browser proof, final-SHA gate, comment body verification, or exact tracker readback fails, stop at that frontier, leave the affected issue and parent open, and provide a blocked closeout handoff rather than describing the family as complete.
