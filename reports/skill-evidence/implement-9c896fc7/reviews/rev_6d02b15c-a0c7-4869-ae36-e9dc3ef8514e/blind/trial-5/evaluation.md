# Trial 5 blind evaluation

## Scope and rubric applied

This evaluation considers only the supplied task and the anonymous `cedar` and `quartz` outputs. The decisive requirements are the mandatory size/headroom gate; a disjoint, collectively exhaustive subset-manifest split; a stable pre-index shared core with mutation-ready preflight immediately before its first post; exact stored-body readback after every post or patch; linked chunks built only after the core URL exists; a final concrete-URL index patch and revalidation; and child-before-parent closure with exact state readbacks. Local-only SHA, TDD, review-with-fixed-findings, browser freshness, fixed-child, and sink-ownership gates must remain intact.

## Cedar

**Verdict: PASS.**

Cedar correctly treats `low-headroom` as a hard stop and preserves the full completed audit rather than proposing compression. It requires a disjoint and collectively exhaustive manifest partition, verbatim projection of completed rows, core ownership of the shared TDD/review/browser/Principles/identity evidence, and per-body size/headroom validation. It also limits every validator to the relevant subset and explicitly states that the final URL index is navigation rather than authority for chunk-owned rows.

Its lifecycle ordering is sound: freeze stable final evidence; build and validate a truthful pre-index core; emit the mutation-ready preflight immediately before mutation; post the core and exact-read it; build, validate, post, and exact-read chunks only after the verified core URL exists; patch and exact-read the concrete final index; inspect identical fixed-child text; close and read back all children; durably record those exact states; then close and read back the parent and full family. It does not authorize commands or mutations in the response.

No material regression or omission warrants failure. Two minor precision weaknesses are worth noting. First, it says size plans must have "acceptable headroom" rather than naming the terminal `ok` result. Second, its final-core step says to include and validate the concrete fixed-child field "if" that field is carried by the core. The later mandatory fixed-child inspection and child-close gate prevent that conditional wording from becoming an actual unsafe sequence, but the final-core instruction itself is less categorical than ideal.

## Quartz

**Verdict: PASS.**

Quartz preserves every critical gate and expresses the split workflow with especially clear mutation boundaries. It requires mechanical partitioning of the completed audit, collective one-time coverage, audit-row-only chunk inputs, and an `ok` size/headroom result for the core and every chunk. It builds the core from a refreshed final SHA, final review frame, browser freshness, identity sweep, and full local-only explanation, while assigning only core-subset acceptance rows to that sink.

The pre-index contract is truthful and placeholder-free, and the response requires whole-body inspection plus TDD, normal-review/immediate-fix, and implement/mutation-ready validation immediately before posting. It then requires HTTPS URL capture and exact stored-body comparison, constructs chunks only after that readback, validates each only against its own subset, exact-reads every chunk, patches all concrete chunk URLs into the core, unconditionally installs the real fixed-child comment, revalidates the final core, and exact-reads the patch. It closes children only after the evidence graph is verified, exact-reads each child state and comment, creates and exact-reads durable post-child state evidence, closes the parent last, and finishes with bounded family readbacks. It explicitly rejects cross-sink row claims and speculative replay.

No material regression or omission is present. A minor wording issue is that the core-subset rule refers to issues named by a TDD row or "TDD review fix," whereas the broader invariant is issues named by TDD rows or review-fix rows. The surrounding requirements keep the complete review arrays and keyed fixed-finding evidence in the core, so this does not materially weaken the plan for the stated family.

## Comparative result

**Choice: quartz.**

Both outputs pass. Quartz is preferred because it states the acceptable size result as `ok`, gives exact pre-index and inspection text, forbids pending URL placeholders directly, and makes the concrete fixed-child field and final-core revalidation unconditional. Those details make the mutation boundary and final evidence graph slightly less ambiguous than Cedar's otherwise correct plan.
