# Scenario facts

- The implementation closes parent PRD #200 and child issues #201 and #202.
- Parent user stories: US1 authors can inspect provenance; US2 authors can export provenance.
- #201 defines provenance as atoms `actor`, `timestamp`, `flow step`; required proof surfaces are API and rendered report; the transition is accept segment -> provenance persists -> report renders it, observed by integration test `provenance-flow`.
- #202 requires export JSON and download UI; order is not acceptance-sensitive.
- Exact saved issue JSON exists at `review-inputs/issues.json`; acceptance manifest exists at `review-inputs/manifest.json` and names #200, #201, and #202.
- Standards and Spec reviewers completed normally with zero findings. No browser/manual evidence was used. No files changed after review.
- The local durable sink is `review-body.md`; the parent-rollup compact TDD table is not in use.

