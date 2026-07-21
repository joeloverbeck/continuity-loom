# Scenario facts

- User request: `Review since main`.
- `main` resolves to `1111111111111111111111111111111111111111`; reviewed `HEAD` is `2222222222222222222222222222222222222222`.
- `git status --short` is empty. The three-dot diff is non-empty and contains commit `2222222 Add deterministic chronology warning (#142)`.
- Changed files: `packages/core/src/validate.ts` and `packages/core/test/validate.test.ts`.
- Issue #142 requires: detect an end timestamp earlier than its start timestamp; emit warning code `chronology-reversed`; do not block compilation; preserve deterministic diagnostic ordering.
- The diff implements those four requirements and adds focused tests. No unrelated behavior is present.
- Standards sources are `AGENTS.md`, `docs/FOUNDATIONS.md`, and `docs/validation-rule-inventory.md`. The diff conforms to them and presents no material smell-baseline concern.
- Parallel read-only reviewers are permitted. Standards reviewer `standards-142` and Spec reviewer `spec-142` both completed; the host exposes no close primitive.

