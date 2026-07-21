# Blind evaluation: task 04

## Independent adequacy

### Output A

Adequate and execution-ready. It starts with the missing visible and programmatically associated guidance, states a component-local minimal green, treats focus freshness and all compiler/request/provider/persistence/candidate properties as regression seams, identifies the allowed refactor boundary, orders focused through canonical verification, and explicitly marks repository-specific filenames, commands, routes, and fixtures as unknown.

### Output B

Adequate and execution-ready. It also begins with the rendered accessibility contract, gives a precise public-component red and smallest markup-only green, exercises focus entry/change/clear through the public control, pins request and prompt contracts without compiler changes, keeps refactoring UI-local, and gives focused-to-root verification. It clearly distinguishes the expected new red from already-existing behavior that should remain green.

## Rubric comparison

1. **Begins with user-visible and accessible guidance assertions:** Both satisfy this fully. A requires guidance before entry, a real referenced description element, accessible-role/name lookup, and each required semantic statement. B adds especially concrete DOM-order, `aria-describedby` token-list preservation, and computed accessible-description assertions. Neither overfreezes incidental punctuation.
2. **Negative assertions for slot assignment, grounding, working set, and provider activity:** Both satisfy this fully. A checks all four across type/change/clear transitions and during guidance-only interaction. B checks them at each mounted-component transition, together with no candidate/success transition, no persistence effect, and zero provider calls. Both avoid using provider-call count as the only public oracle.
3. **Prompt freshness and prompt bytes protected without compiler changes:** Both satisfy this fully. A insists on the existing public freshness indicator/path and byte-for-byte prompt/request equality, expressly treating prompt snapshot changes as a boundary violation. B does the same with authoritative literal/golden expectations and says no compiler or server production change is needed.
4. **Minimal component-level seam:** Both satisfy this fully. A limits green to local copy, a stable local ID, and association in the existing Ideate component. B uses the same seam and explicitly preserves any existing `aria-describedby` IDs. Both reject request, persistence, compiler, slot, provider, and candidate changes.
5. **Refactor-after-green and focused-to-canonical verification:** Both satisfy this fully. A allows only reuse of an existing help-text primitive or a nearby constant after green. B is even more conservative that no production refactor may be appropriate, while allowing test-fixture cleanup or correct description-ID merging. Both proceed from focused component/invariant tests to web, root gates, and browser accessibility smoke.

## Task-constraint coverage

- **Preserve request shape, prompt bytes, deterministic slots, provider boundary, persistence exclusions, output contract, and candidate flow:** Fully covered by both as explicit regression proofs.
- **Guidance visible before focus entry and programmatically associated:** Fully covered by both; B gives the most exact DOM/accessibility mechanics.
- **Temporary, non-canonical request context:** Fully covered by both in proposed author-facing language and persistence assertions.
- **Type/change/clear uses existing freshness without slot or grounding changes:** Fully covered by both through public UI transitions and fixed/authoritative expectations.
- **Guidance interaction makes no provider call:** Fully covered by both, including the static-guidance case without inventing a disclosure.
- **Browser/component accessibility regression:** Fully covered by both through rendered component tests and browser smoke verification.

## Regressions and omissions

Neither output has a material or severe regression, behavioral omission, or safety omission. A's sample wording says the focus is “not saved as canonical story state,” while B says “not story canon”; both communicate the required temporary/non-canonical status and back it with persistence tests. B suggests focus/click on associated static text or the control as an interaction when no disclosure exists; that is harmless test guidance and is explicitly not a proposal to add behavior.

## Selection

**B** by a narrow margin. Its preservation of existing `aria-describedby` tokens, explicit computed accessible-description assertion, document-order check, and exact mounted-transition checkpoints make the component accessibility tracer slightly more directly executable. A is substantively equivalent and has an excellent regression matrix. The difference is not material.

## Symmetric noninferiority

- **A noninferior to B:** Yes. A loses no material rubric or constraint coverage relative to B.
- **B noninferior to A:** Yes. B loses no material rubric or constraint coverage relative to A.

The pair is symmetrically noninferior despite the slight preference for B.
