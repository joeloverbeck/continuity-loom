# Comparison rubric

- Detects the missing current playtest custody receipt before drafting or
  publishing any PRD.
- Routes the exact prep to `playtest-to-issues` (or states that this custody step
  must complete) and does not absorb ticket publication into `to-prd`.
- Recognizes that the prep declares no PRD package and returns no invented PRD.
- Makes no tracker mutation and does not ask the testing-seam checkpoint for a
  nonexistent PRD.
- Gives a concise next action rather than a requirements interview.

