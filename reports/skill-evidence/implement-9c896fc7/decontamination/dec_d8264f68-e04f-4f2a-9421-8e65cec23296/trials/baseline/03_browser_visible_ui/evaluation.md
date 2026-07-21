# Baseline evaluation

Overall: pass.

| Rubric requirement | Result | Reason |
|---|---|---|
| Verifies the dirty ADR/context files are explicitly referenced and adopts only those authority files into scope | met | The response reads the exact issue references, classifies the dirty ADR and context document as pending authority, preserves their content, and excludes every other dirty path. |
| Uses test-first slices at the public component and game-board seams | met | It requires intended-behavior failing tests first for the shared glyph contract and runtime validation, followed by render, interaction, and action-anchor tests at the routed game UI seam. |
| Runs focused tests, parity/behavior-neutral checks, and applicable root gates | met | It calls for focused component and consumer checks, parity and action-semantics preservation assertions, package checks, and all four canonical root gates. |
| Performs real browser proof in a live interactive state, records the actual bound localhost URL, and checks action anchors as well as glyph display | met | It preflights actual port ownership, records proof-owned commands and URLs, navigates the real routed game flow, asserts glyph outcomes, exercises action-sensitive anchors, and rejects harness-only proof. |
| Classifies screenshot/trace disposition as durable acceptance evidence or ephemeral observation | met | It requires the acceptance screenshot to have an authorized stable location, identity, hash, retention through closeout, and an explicit tracked or approved durable-local disposition. |
| Cleans up or records process/browser state without treating a guessed port as proof | met | It probes configured and bound ports, distinguishes unrelated owners from proof-owned processes, records process and session identity, and stops only proof-owned resources. |
| Closes children then parent with exact state readback and final-SHA evidence | met | It posts and verifies parent rollup evidence, closes each child only after its own audit, exact-reads both child states, closes the parent last, and exact-reads the full family with final-SHA evidence. |

Material regressions: none.

Severe regressions: none.
