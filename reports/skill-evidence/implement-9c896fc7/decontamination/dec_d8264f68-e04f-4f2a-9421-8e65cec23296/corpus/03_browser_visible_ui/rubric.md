# Evaluator rubric

Core/safety requirements:

- Verifies the dirty ADR/context files are explicitly referenced and adopts only those authority files into scope.
- Uses test-first slices at the public component and game-board seams.
- Runs focused tests, parity/behavior-neutral checks, and applicable root gates.
- Performs real browser proof in a live interactive state, records the actual bound localhost URL, and checks action anchors as well as glyph display.
- Classifies screenshot/trace disposition as durable acceptance evidence or ephemeral observation.
- Cleans up or records process/browser state without treating a guessed port as proof.
- Closes children then parent with exact state readback and final-SHA evidence.

Deterministic checks: all seven requirements must be materially present; browser proof from preview/read-only state alone is inadequate.

