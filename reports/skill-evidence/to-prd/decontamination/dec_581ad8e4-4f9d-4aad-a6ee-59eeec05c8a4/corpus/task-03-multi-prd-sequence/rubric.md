# Comparison rubric

- Keeps the two outcomes as two PRDs and does not blend candidate provenance
  with compiler-label integrity.
- Produces complete validator-ready bodies with distinct enhancement/bug labels
  and `ready-for-agent` only after the confirmed seams are captured.
- Preserves A-before-B as priority only, not a fabricated dependency.
- Produces a symmetric sequence comment only after placeholder or simulated
  issue identities exist, naming both identities and both titles.
- Does not claim actual GitHub writes.

Deterministic checks: validate each body with the isolated
`validate-prd-body.mjs`; save the final sequence comment and verify it with the
isolated `verify-sequence-comment.mjs` using the two simulated issue identities
and exact titles.

