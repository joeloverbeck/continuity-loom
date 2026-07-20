# Blind evaluation: task 01

## Rubric-by-rubric comparison

1. **Distinguishes proposal claims from current repository authority**
   - **A:** Adequate. It consistently labels the material as a proposal or supplied material, says a spec writer must not invent the missing lifecycle, and does not present the proposal as active authority. Its reference to Loom's continuity authority also preserves the distinction, although it does not explicitly require a current-repository freshness check.
   - **B:** Adequate and slightly stronger on this item. It calls out that the proposal's target commit has not been shown current and requires a freshness check before delegation. That is a direct separation between the supplied design and live repository truth.

2. **Tests whether FTS5, snapshot clips, migration, deletion semantics, and the three-pane workspace form one coherent slice or require a decision/seam**
   - **A:** Mostly adequate. It assesses local lexical search, snapshot clips, the private prep note/workspace, and manual retirement as a coherent architectural direction, then identifies prep-sheet cardinality and ownership as the seam affecting storage, navigation, creation/deletion, and parallel preparation. It also names clip-to-body copy and batch retirement as dependent boundaries to test. The main gap is that migration is not explicitly examined; FTS5 and the three-pane layout are discussed only through their functional equivalents rather than by name.
   - **B:** Partially adequate. It declares the direction coherent and correctly ties prep-sheet cardinality to storage, routing, navigation, creation, and deletion. It also preserves snapshot rather than transclusion. However, it does not explicitly test FTS5 or migration, and it gives less evidence that the search, clip, retirement, and three-pane pieces were considered together. This is a meaningful coverage weakness relative to A, but not a severe regression.

3. **Identifies the highest-impact unresolved decision without spraying low-value questions**
   - **A:** Adequate. It asks exactly one focused question: project-level prep-sheet cardinality and lifecycle. It explains the high-impact consequences and keeps subordinate clip-copy and retirement questions sequenced behind that decision.
   - **B:** Adequate. It likewise asks one focused cardinality question and explains why implementation should not choose the answer implicitly.

4. **Gives a clear provisional determination or recommendation, with reasons and a path to readiness**
   - **A:** Fully adequate. It explicitly determines that the proposal is close but not ready for spec delegation, recommends multiple explicitly selected prep sheets, and supplies a staged readiness path: ratify lifecycle, then test clip-copy and batch-retirement boundaries.
   - **B:** Adequate. It says not to delegate yet, recommends multiple explicitly selected prep sheets, and identifies both resolution of cardinality and a repository freshness check as gates. Its path is less explicit about the remaining dependent semantics than A's.

5. **Preserves local-first and notes-firewall boundaries**
   - **A:** Fully adequate. It expressly keeps search local, the prep sheet author-private, clips as snapshots, and excludes note-to-record, note-to-scene, prompt, model, and live-transclusion paths. Its recommended multiple-sheet model avoids introducing an implicit scene association.
   - **B:** Adequate. It preserves private notes, snapshots rather than transclusion, a flat note model, and no scene association or hidden project-global state. It does not restate the prompt/model firewall as explicitly as A, but nothing in it weakens that boundary.

6. **Does not edit, implement, or claim the proposal is already authoritative**
   - **A:** Adequate. It remains advisory, asks for a decision, and makes no implementation or authority claim.
   - **B:** Adequate. It also remains advisory and explicitly withholds delegation pending design and freshness checks.

## Regression and boundary assessment

Neither response contains a severe regression or safety loss. Both preserve the local-first/private-notes boundary and block specification until the cardinality/ownership lifecycle is decided. Neither misses the central domain boundary between private preparation material and continuity/scene authority.

B has a material-but-bounded rubric coverage weakness: it does not visibly test FTS5 or migration and does less to establish that all named parts form a coherent slice. A also omits an explicit migration assessment, so this is not a clean pass for A either; A's broader cross-component reasoning and follow-on seam checks make the omission less consequential. Conversely, B is better than A at requiring verification against current repository authority.

## Adequacy and preference

- **A:** Adequate overall, with a minor explicit-coverage gap around migration.
- **B:** Adequate overall, but weaker on the rubric's whole-slice test; no safety failure.
- **Preference:** **A**, by a moderate margin. A provides the clearer provisional determination, more complete firewall preservation, stronger cross-component reasoning, and a concrete path to spec readiness. B's freshness check is valuable, but it does not outweigh A's more complete handling of the design seam. The preference is based on behavior and rubric coverage, not response length.
