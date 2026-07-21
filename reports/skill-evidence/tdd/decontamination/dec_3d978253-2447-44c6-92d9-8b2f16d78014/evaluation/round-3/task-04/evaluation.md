# Round 3 blind evaluation: task 04

## Independent adequacy

### Output A

**Adequate.** It satisfies every rubric bullet and gives an execution-ready UI-first TDD sequence:

- Its first red is the user-visible guidance and accessible relationship at the rendered Ideate entry point. It checks pre-entry visibility, a resolvable programmatic description, optional/temporary/non-canonical meaning, already-assigned slots, and all three exclusions: response kinds/operators, grounding, and active-working-set membership.
- Its negative regression slices explicitly protect slot/operator assignment, grounding, working-set membership, zero provider activity before generation, request emission, candidate flow, and persistence.
- It exercises empty-to-typed-to-changed-to-cleared focus through the existing public freshness path while retaining exact prompt/request bytes and shape. It explicitly bars compiler changes and says prompt-byte expectations must not be updated to accommodate the UI copy.
- The smallest green is local markup/copy plus the existing accessible-description pattern in the Ideate entry component. Compiler, request, provider, storage, output, and candidate paths remain outside the production diff.
- Refactoring is deferred until green and limited to existing UI-help primitives or local constants. Verification progresses from the focused component test through boundary regressions, the web suite, all canonical root gates, and a browser accessibility smoke.

It covers every task constraint: request shape, prompt bytes, deterministic assignment, provider boundary, persistence exclusion, output/candidate behavior, visible and associated guidance, temporary request-only status, focus freshness, unchanged grounding/working set, and zero provider calls from guidance interaction. It also handles the possible absence of a disclosure or public component-level slot observation without proposing test-only product behavior or private hooks.

There is **no material or severe regression and no safety omission**. Capturing a request before/after guidance-only interaction may need an existing preview seam, but A acknowledges that exact public seams remain to be resolved and does not require a production seam to be invented.

### Output B

**Adequate.** It also satisfies every rubric bullet and all task constraints:

- It begins directly with visible, pre-entry, programmatically associated author guidance. The assertions cover temporary/non-canonical request context, already-assigned slots, response kinds/operators, grounding, and working-set membership.
- Its mounted type/change/clear sequence supplies direct negative assertions for unchanged independently known slots, grounding, working set, and zero provider calls. The later integration slice also protects persistence, request shape, output contract, and candidate flow.
- It preserves the existing freshness route and literal/golden prompt-byte contract, including restoration of exact no-focus bytes after clearing and exclusion of guidance copy from provider prompts. It expressly rejects compiler or request-contract changes.
- Its green is one hint/help element and the existing accessible-description API/`aria-describedby` in the Ideate component, with no new interaction or schema/store/request field.
- Refactoring waits for the focused component green and remains UI-local. Verification proceeds from the focused accessibility and freshness tests through compiler, persistence, and candidate regressions, then package and canonical gates.

It makes uncertainty about component names, public freshness observation, test paths, and runner commands explicit. Its fallback when freshness is not publicly rendered uses an existing request-preview/builder seam and a controlled explicit generation, while separately proving that guidance/focus interaction itself has made zero provider calls. That preserves the provider boundary rather than creating a private test hook.

There is **no material or severe regression and no safety omission**. It does not list a separate manual browser smoke after canonical gates, but the required browser/component accessibility regression is fully specified at the rendered component boundary; the omission is not material under the rubric.

## Pairwise judgment

**Result: tie.** A is marginally stronger on the concrete proposed author copy, guidance-only byte/request invariants, and final browser accessibility smoke. B is marginally stronger on the single mounted focus-transition sequence, explicit restoration of no-focus golden bytes, and the practical existing-seam fallback for observing a generated request without mistaking it for guidance-triggered provider activity. Neither advantage exposes a gap in the other output.

**Symmetric noninferiority:**

- **A is noninferior to B:** yes. A has no material regression, severe omission, or safety loss relative to B.
- **B is noninferior to A:** yes. B has no material regression, severe omission, or safety loss relative to A.

Neither output warrants a downgrade on any rubric bullet or task constraint.
