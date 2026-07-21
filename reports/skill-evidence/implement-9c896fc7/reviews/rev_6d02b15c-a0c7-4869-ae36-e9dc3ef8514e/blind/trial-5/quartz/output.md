Use the split-evidence closeout path. The `low-headroom` result is a hard stop on the one-comment design: do not compress the audit, weaken `atoms:` / `proof surfaces:` / `sequence:` evidence, or mutate the tracker yet.

Plan only; no tracker action is authorized by this response.

1. Freeze the closeout inputs

- Preserve the exact parent and five-child issue JSON, the completed full acceptance audit, and a full acceptance manifest. The manifest must include every parent PRD check, every child acceptance check, and every applicable Principles check exactly once.
- Freeze the normal-review final state against the final local SHA. Because review found and fixed findings, use structured evidence and the immediate-fix shape: immutable finding IDs, every fix and rerun, the keyed TDD review-fix mapping, final Standards and Spec inventories, and a `Review:` outcome stating that findings were fixed in the same SHA named as the reviewed HEAD and final SHA.
- Refresh browser proof against the final touched-file set, including route/action/outcome, console state, backend-process currentness when server or browser-consumed API code is involved, and the final freshness delta.
- Refresh current, historical-red, and superseded evidence identities, then perform the exact superseded-token sweep.
- Put the full explanatory sentence in the publishable core: `Local-only SHA: FINAL_SHA is not remote-reachable because ACTUAL_REASON; local-only closeout is acceptable because ACTUAL_USER_REQUEST_OR_REPO_POLICY.` If either reason is not known and true, closeout remains blocked.

2. Partition the completed audit mechanically

- Split the full manifest and completed audit into disjoint subsets. The subsets must collectively cover the full manifest with no omitted or duplicated check.
- Keep one subset for the shared evidence core. Because the core owns the TDD and review arrays, its subset must retain at least one selected check for every issue named by a TDD row or TDD review fix; with this family that will normally mean the parent and all five children.
- Project completed rows from the already-completed full audit rather than rebuilding blank audit rows or filtering Markdown by hand.
- Keep the complete TDD and review arrays only in the core evidence input. Each chunk evidence input may contain only its own `auditRows`.
- Run the size/headroom plan independently for the core and every proposed chunk. Continue splitting until every body reports `ok`, not merely below GitHub’s hard byte ceiling.

3. Build the shared core in its truthful pre-index state

The core is a parent-PRD comment and owns:

- final SHA and the full local-only explanation;
- verification ledger;
- parent-rollup TDD evidence and keyed review-fix rows;
- normal review evidence with fixed findings, Standards and Spec sections, and terminal reviewer state;
- browser proof, console state, backend currentness, and final freshness;
- Principles/ADR conformance;
- current/historical-red/superseded evidence identities and the superseded-token sweep;
- closeout preflight and body-check evidence;
- only the acceptance rows in the core’s subset manifest.

Its first-post form must use the split-core pre-index contract and say exactly:

`Linked acceptance-audit chunks: not indexed in this first-post core; this core claims only the disjoint rows in its supplied subset manifest.`

Its inspection field must truthfully say:

`Body file(s) inspected: shared core body inspected; linked audit chunk bodies do not exist in the pre-index state`

Use stable self-referential wording for the future fixed child comments; do not post a pending URL placeholder.

4. Gate the first mutation on the pre-index core

Before posting anything, inspect the whole core without truncated output and sweep for unresolved placeholders. Validate it against only the core subset with:

- the TDD parent-rollup closing contract;
- the normal-review contract with immediate-fix, parent-PRD, child-family, browser, and TDD-parent-rollup branches;
- the implement closing contract with Principles, local-only SHA, fixed-child-pending, split-core-preindex, expected final SHA, and the core subset manifest.

The final implement validation immediately before the first mutation must also emit the mutation-ready preflight. Copy its output verbatim, including `Closeout preflight:`, `Closeout gate passed: audit sink ...`, `Post-comment verification next:`, and the mutation-ready confirmation. Do not claim those gates passed in advance.

5. Publish and verify the evidence graph before closing issues

- Post the pre-index core to the parent first, capture its HTTPS comment URL, and exact-read the stored UTF-8 body against the inspected core. A mismatch blocks the sequence; do not repost without first proving the original mutation did not take effect.
- Build each remaining audit chunk only after that verified core URL exists. Each chunk contains its final SHA, the exact shared-core URL, its own disjoint acceptance rows, and its audit-chunk body-check line. It must not repeat TDD, review, browser, identity, Principles, or mutation-preflight evidence.
- Validate each chunk with the audit-chunk closing contract, the verified shared-core URL, the expected final SHA, and only that chunk’s subset manifest. Do not use mutation-ready or preflight flags on chunks.
- Post every chunk to the parent and exact-read each returned comment URL. No child closes while any chunk is missing or unverified.
- Patch the core so `Linked acceptance-audit chunks:` lists every unique verified HTTPS chunk URL, and change the inspection field to exactly `shared core body and every linked audit chunk body inspected after URL capture` only after that is true.
- Put the concrete fixed child comment in the final core state, revalidate the core with split-core-final and fixed-child against only the core subset, rerun the applicable nested validators, patch the stored core, and exact-read it again. The indexed core is the one URL all five child comments will cite; neither the core nor a chunk may claim rows owned by another sink.

6. Close children, then the parent

- After the indexed core URL is verified, inspect the exact fixed child text once and record this gate with real values:

  `Fixed child final inline close comment inspected: Completed by FINAL_SHA. Evidence: VERIFIED_CORE_COMMENT_URL`

- Use that byte-for-byte identical inline comment for each of the five child closes. Do not add child-specific wording unless it receives its own inspection.
- Read each child back by exact issue number and verify both CLOSED state and the latest close comment.
- Before parent closure, add or patch durable parent evidence that names all five exact child issue numbers and their CLOSED states, then exact-read that evidence. Verify the five states again immediately before closing the parent.
- Close the parent only after its own audit rows are satisfied and the durable post-child verification is present. Its short close comment should cite the indexed core and the durable post-child state record.

7. Final readback

- Exact-read the parent and all five children with output-bounded state checks, and inspect the relevant latest comments.
- Reconfirm the final local SHA, report explicitly that it is not remote-reachable, run the final worktree-status check, account for any retained evidence artifacts, and stop or report any proof server/browser process.
- If any stored-body verification or state readback is unavailable, report that tracker state as unverified and do not claim closeout completion or replay a possibly successful mutation.

The critical ordering is: pre-index core gate -> core post and exact read -> disjoint chunks post and exact read -> core URL index patch and exact read -> fixed child comment inspection -> five child closes -> exact child-state verification recorded durably -> parent close -> final family readback.
