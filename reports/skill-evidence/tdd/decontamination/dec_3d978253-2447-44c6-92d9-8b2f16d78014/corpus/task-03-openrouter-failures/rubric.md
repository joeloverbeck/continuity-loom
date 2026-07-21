# Comparison rubric

- Starts with failing sanitizer/normalizer examples, including secret and payload canaries.
- Separates server normalization, wire-contract survival, shared presentation, and consumer integration tests.
- Uses the smallest shared seams and does not overfit to the originally observed provider failure.
- Treats privacy and no-automatic-retry constraints as regression invariants.
- Includes focused server/web checks followed by canonical gates.
