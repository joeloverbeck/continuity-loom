# Round-2 blind evaluation: task 01

## Rubric-by-rubric comparison

1. **Distinguishes proposal claims from repository authority**
   - **A: Adequate.** It treats the excerpts as a proposal, says the target commit may not be current, and requires a freshness check before delegation. Its statement that the excerpts “settle” several choices is bounded to proposal-level coherence rather than presented as live repository truth.
   - **B: Strongly adequate.** It explicitly limits the verdict to frozen excerpts, distinguishes internal coherence from current-repository alignment, and requires verification against live authorities before approval.
   - **Advantage: B.** The epistemic boundary is more explicit and harder to misread.

2. **Tests whether FTS5, snapshot clips, migration, deletion semantics, and the three-pane workspace form one coherent slice or need a decision/seam**
   - **A: Inadequate to partial.** It asserts that the direction is coherent and mentions snapshot clips, manual retirement, and a broad implementation sequence, but it does not actually test the coupling among FTS5/search, migration, deletion, and the three-pane workspace. FTS5, migration, and the workspace are absent. The cardinality question is important, but it cannot substitute for this required slice-level analysis.
   - **B: Partial.** It does more behavioral testing: snapshot semantics, source staleness, search-query behavior, tray-to-body insertion and clip lifecycle, and batch-deletion transaction semantics. Even so, it never addresses migration, does not name or assess the three-pane workspace as a whole, and only indirectly reaches FTS5 through literal/short-query behavior. It therefore identifies several seams without fully determining whether the entire named slice is coherent.
   - **Advantage: B, with a material gap remaining.** B covers more of the cross-feature behavior, but neither response fully satisfies the central rubric item.

3. **Identifies the highest-impact unresolved decision without spraying low-value questions**
   - **A: Adequate.** It selects one decision—Scene Prep cardinality—explains its effects on storage, routes, navigation, creation, and deletion, recommends a concrete answer, and asks one focused question.
   - **B: Mostly adequate.** It lists several genuinely design-changing branches rather than low-value details, then asks only one question and gives the same concrete cardinality recommendation. However, it does not explicitly establish why cardinality outranks the deletion, search, or insertion contracts it also names.
   - **Advantage: A, narrowly.** A is more disciplined about making one issue the next decision, though B’s additional branches are materially relevant rather than question spray.

4. **Gives a provisional determination/recommendation, reasons, and a path to readiness**
   - **A: Adequate.** Its determination is “close to spec-ready, not delegation-ready,” supported by the unresolved cardinality and authority-freshness concerns. The path is present but narrow: resolve cardinality and perform a freshness check.
   - **B: Strongly adequate.** It distinguishes spec-drafting readiness from implementation-delegation readiness, names the contracts a spec must settle, and gives an ordered path: grill, draft, verify against live authorities, then approve or delegate.
   - **Advantage: B.** Its readiness path is more operational and better connected to the risks it identifies.

5. **Preserves local-first and notes-firewall boundaries**
   - **A: Adequate.** It keeps Scene Prep and clips in the private-note model and proposes no cloud, generation-context, or authority leakage. The local-first boundary is implicit rather than expressly restated.
   - **B: Stronger adequate.** It expressly preserves author-private Scene Prep, narrow source pointers, the isolation boundary, and the flat loose-note model. Local-first is still mostly implicit, but no recommendation weakens it.
   - **Advantage: B.** Neither response causes a safety or domain-boundary loss.

6. **Does not edit, implement, or claim the proposal is authoritative**
   - **A: Adequate.** It performs no implementation or edit, calls for a later freshness check, and does not elevate the proposal to repository authority.
   - **B: Strongly adequate.** It explicitly says it will not edit or implement and warns against delegating from the proposal alone.
   - **Advantage: B.** The behavior is equivalent, but B makes the guardrail unambiguous.

## Regression and safety assessment

There is no severe regression, destructive action, or safety/domain-boundary loss in either response. A does have a **material task-coverage deficiency**: it does not perform the rubric’s required whole-slice test across FTS5, migration, deletion, snapshot clips, and the three-pane workspace. B materially improves coverage, but its omission of migration and explicit workspace-level analysis means it is still incomplete rather than fully rubric-satisfying.

## Overall adequacy and decision

- **A: Partially adequate.** It is a good focused opening grill and handles authority, recommendation, and decision discipline well, but it is not sufficient as the requested evaluation because it largely skips the central cross-feature coherence test.
- **B: Mostly adequate.** It has the stronger authority boundary, readiness determination, non-action guardrail, and coverage of design-changing seams. Its remaining omissions prevent a fully adequate rating.

**Winner: B.** The choice is based on behavior, not length: B more effectively separates proposal coherence from live authority, examines more of the design-changing contracts, and gives a clearer route from proposal to verified spec and eventual delegation. A’s tighter single-question focus is a real strength, but it does not compensate for omitting most of the required slice-level analysis.
