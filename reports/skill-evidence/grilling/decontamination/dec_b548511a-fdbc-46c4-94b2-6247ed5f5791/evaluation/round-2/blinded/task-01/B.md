Classification: design / plan stress-test.

Freshness limitation: I can assess only the frozen proposal excerpts and their stated target commit. I cannot verify the proposal against current authorities, implementation, runtime capabilities, or tracker state, so this is an internal-coherence verdict, not a current-repository alignment verdict.

Explored fact: the proposal has a coherent core: loose capture remains intact; Scene Prep stays author-private; clips are snapshots rather than transclusions; source pointers are deliberately narrow; deletion remains manual; and the isolation boundary is carried into the implementation sequence. The broad alternatives are resolved well enough that I would not reopen folders, graphs, blocks, semantic search, or LLM assistance without new evidence.

Finding: the proposal is ready to enter spec drafting, but it is not yet ready for implementation delegation. The spec still needs explicit contracts for a few design-changing branches: prep-sheet cardinality and ownership, tray-to-body insertion and clip lifecycle, source-edit/staleness behavior, literal and short-query search behavior, and batch-deletion eligibility and transaction semantics. Those are not ticket-level details; different answers change storage, routes, and the user-visible workflow.

Recommendation: proceed toward a draft spec after this grill, then verify that draft against live repository authorities before approval. Do not delegate implementation from the proposal alone. I will not edit files or start implementation.

Question 1: What is the cardinality of Scene Prep? My recommendation (Recommended): allow multiple Scene Prep sheets per project, with each sheet remaining an ordinary private note that owns exactly one ordered clip tray; do not create a project-global singleton or a scene association. This preserves the stated loose-note model, lets preparation artifacts coexist when work overlaps, and avoids making “the current scene” hidden domain state. Do you agree?
