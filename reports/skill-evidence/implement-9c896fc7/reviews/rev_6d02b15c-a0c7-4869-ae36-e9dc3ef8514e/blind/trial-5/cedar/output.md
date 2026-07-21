Closeout is not ready for tracker mutation in its current one-comment form. The `low-headroom` result is a hard stop: preserve the completed audit exactly and split it; do not shorten required evidence or replace criterion atoms and proof surfaces with circular summaries. No commands or tracker mutations have been performed.

## Planned evidence layout

1. Preserve one full acceptance manifest and completed audit covering the parent PRD and all five children. Every generated parent, user-story, acceptance, and Principles check must have exactly one row, every row must remain `satisfied`, and every Evidence cell must retain concrete `atoms:`, `proof surfaces:`, and `sequence:` fields.
2. Partition that full manifest into disjoint subsets that collectively cover every check exactly once. Project the already-completed audit rows into each subset verbatim rather than rebuilding blank audit scaffolds. Run the size/headroom plan for the proposed shared core and each chunk; proceed only when every body has acceptable headroom and is below the tracker ceiling.
3. Use one completed closeout body as the shared evidence core. Its subset should retain at least one selected check for every issue named by the TDD rows or review-fix rows. The core alone owns:
   - final SHA and the full `Local-only SHA: ... is not remote-reachable because ...; local-only closeout is acceptable because ...` sentence;
   - the final-tree verification ledger;
   - TDD evidence and its full durable gate line;
   - normal review evidence, the immutable finding ledger, fixed-finding evidence, final reviewer/source inventories, and `Review: ... outcome findings fixed in SHA ...`;
   - browser route/action/outcome, console state, backend-process currentness, and final freshness delta;
   - Principles/ADR conformance;
   - current, historical-red, and superseded evidence identities plus the superseded-token sweep;
   - the closeout preflight and its own disjoint acceptance rows.
4. Each remaining body is a lightweight acceptance-audit chunk. It contains only the final SHA, the verified shared-core URL, its own disjoint audit rows, and its chunk body-check line. It must not repeat or reinterpret TDD, review, browser, Principles, identity, or mutation-preflight evidence. Structured evidence for chunks contains audit rows only; the full TDD/review arrays remain in the core evidence.

## Planned closeout sequence

1. Freeze the final evidence frame before body construction: confirm the local-only final SHA identifies the verified tree; refresh the normal review frame after all fixes; rerun or justify final browser freshness; refresh all evidence identities; and ensure the completed audit still matches the exact saved issue-family manifest one-to-one. Any unresolved placeholder, stale SHA, stale browser proof, unmatched check, or non-`satisfied` row stops closeout.
2. Build the shared core in its truthful first-post state. Its index must say exactly that linked audit chunks are not yet indexed and that the core claims only the rows in its supplied subset manifest. Its inspection field must truthfully state that linked chunk bodies do not exist in this pre-index state. Published sink fields should use a stable parent-issue reference, never a local staging path.
3. Validate that pre-index core against only its subset:
   - TDD parent-rollup validation against the core subset manifest and final SHA;
   - normal review validation with parent-PRD, child-family, browser, TDD-parent-rollup, closing, and immediate-fix requirements;
   - implement closing validation with final SHA, Principles, local-only, fixed-child-pending, acceptance-manifest, and split-core-preindex requirements.

   Immediately before the first tracker mutation, the implement validation must also run in mutation-ready preflight mode. Its emitted `Closeout preflight:`, `Closeout gate passed: audit sink ...`, `Post-comment verification next: ...`, mutation-ready confirmation, and accepted-residual summary must be copied verbatim into the conversation or durable audit sink. A plain successful closing validation is not mutation-ready.
4. The first future mutation is posting the pre-index core to the parent PRD. Capture its HTTPS comment URL and require an exact stored-body match before doing anything else. If posting succeeds but readback fails, preserve the returned URL and retry only read-only verification; do not repost speculatively.
5. After the core URL is verified, build every remaining disjoint audit chunk using that URL. Validate each against only its subset manifest with the audit-chunk contract and final SHA. Chunks do not receive mutation-ready flags. Post each chunk and exact-read every stored body. No issue may close while any chunk is unposted or unverified.
6. Once every chunk URL is verified, patch the shared core into its final indexed state:
   - replace the pre-index line with `Linked acceptance-audit chunks:` followed by every unique concrete HTTPS chunk URL;
   - change the inspection claim to `shared core body and every linked audit chunk body inspected after URL capture` only after that is true;
   - include the exact final fixed-child inline comment with the real core URL if the core carries that field;
   - revalidate the core with split-core-final, against only the core subset, using fixed-child rather than fixed-child-pending when the real inline comment is present;
   - patch the posted core and exact-read it again.

   The final index provides navigation; it does not make the core validator cover rows owned by chunks.
7. Before the first child close, inspect and preserve this exact line with real values:

   `Fixed child final inline close comment inspected: Completed by <final SHA>. Evidence: <verified indexed shared-core URL>`

   Use the identical `Completed by ... Evidence: ...` text for all five children. Do not reword it between issues. Close children only after the indexed core and all chunks have exact stored-body verification, then read each child state back by exact issue number.
8. Record durable post-child verification that names all five exact child issue numbers and their `CLOSED` states, either by patching the parent core, adding a follow-up parent comment, or using an inspected parent-close comment. Exact-read that durable record. The parent PRD remains open until all five states are verified closed.
9. Close the parent only after that post-child verification exists. Then exact-read the parent and all five children again with bounded state-only lookups, and verify the latest fixed child comment where needed. If any mutation result is ambiguous, verify read-only state before considering replay.
10. Before reporting completion, refresh the final SHA and worktree status, account for any temporary or untracked evidence artifacts, and stop any proof processes. Completion may be claimed only from the final exact tracker readback; until this plan is executed, parent and child closeout remain unperformed.
