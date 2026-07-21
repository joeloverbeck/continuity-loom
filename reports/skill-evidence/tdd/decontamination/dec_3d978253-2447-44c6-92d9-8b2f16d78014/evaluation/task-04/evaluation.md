# Blind paired evaluation: task 04

## Output A

**Independent adequacy: Adequate.**

- **User-visible and accessible first red:** The first tracer renders the Ideate entry point before entry, checks visible guidance, verifies a real programmatic description relationship, and independently covers optionality, temporary/non-canonical status, already-assigned slots, and all three non-effects. It uses author-facing semantic assertions instead of freezing incidental markup or punctuation.
- **Negative invariants:** It asserts zero provider calls and no candidate/request emission for guidance interaction, then preserves response kinds/operators, grounding, active-working-set membership, and provider inactivity while focus is typed, changed, and cleared. It also protects persistence exclusions, request shape, output parsing, and candidate flow.
- **Prompt freshness and bytes:** Focus edits must continue through the existing public freshness path. Guidance-only interaction leaves compiled request/prompt bytes identical, and existing exact prompt fixtures must remain unchanged. It explicitly treats compiler or request-pipeline changes as out of scope.
- **Minimal implementation seam:** The only initial green is local copy and markup in the existing Ideate component, using a stable help-text ID and the existing accessibility pattern. The plan sensibly falls back to lower-level public contract tests when slot or grounding state is not observable in the component rather than reaching into internals.
- **Refactor and verification:** Refactoring is limited to local help-text reuse or a nearby constant after green. Verification progresses from component accessibility and no-provider/freshness checks through existing prompt, slot, grounding, persistence, output, and candidate tests, then the web suite, canonical gates, and an accessibility browser smoke.

Every acceptance criterion is explicit: guidance precedes entry and is associated with the control; copy identifies temporary request-only context and the operator-bound limitation; focus edits preserve the existing freshness path; guidance causes no provider call; and browser/component accessibility is exercised. Request shape, prompt bytes, deterministic assignment, provider boundary, persistence, output contract, and candidate flow are all protected.

**Material or severe regression/safety omission:** None.

## Output B

**Independent adequacy: Adequate.**

- **User-visible and accessible first red:** It starts with the missing component guidance and accessible relationship. DOM/reading order, role/label queries, `aria-describedby`, author-facing language, optional/temporary/non-canonical status, already-assigned slots, and all prohibited selection effects are directly asserted.
- **Negative invariants:** One mounted public component flow covers guidance use plus type/change/clear transitions with zero provider calls and unchanged public slots, grounding, and working-set membership. The explicit-generation regression additionally fixes operator identity/order, one expected provider call, request shape, persistence exclusion, output contract, and candidate flow.
- **Prompt freshness and bytes:** It reuses the existing focus handler and public freshness state, preserves golden prompt bytes for supported focus states, forbids guidance-only request fields, and warns against generating expectations from the production compiler. It proposes no compiler change.
- **Minimal implementation seam:** The production change is one visible help element and its control association in the current Ideate component, reusing existing styles and state. It rejects new fields, handlers, state, dialogs, provider actions, and domain abstractions.
- **Refactor and verification:** Post-green cleanup stays within field markup/help-text reuse. Focused component and compiler-contract checks precede all four canonical gates, with explicit completion conditions for accessibility, freshness, provider inactivity, and unchanged contracts.

Every task constraint is covered. The component slice initially prefers public rendered slot/grounding observations, which might not exist, but the subsequent compile/request seam supplies the appropriate public contract proof and the response explicitly marks actual filenames and UI observability as uncertain. This is at most a minor execution detail, not a missing requirement.

**Material or severe regression/safety omission:** None.

## Selection

**Winner: Tie.** Both outputs are independently execution-ready and satisfy every rubric bullet and acceptance constraint. A is marginally stronger about zero persistence writes from guidance interaction and about routing non-UI-observable invariants to existing lower-level public seams. B is marginally stronger about the explicit-generation checkpoint, fixed operator identity/order, and the precise expected provider call. Those differences balance and do not create a meaningful clarity or efficiency advantage.

**Noninferiority conclusion:** Under a symmetric material-regression standard, A and B are mutually noninferior. Neither contains a material regression, safety omission, compiler-scope expansion, or missing acceptance proof, regardless of which version is treated as baseline or candidate.
