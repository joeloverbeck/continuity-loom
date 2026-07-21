# Deterministic checks

## Before candidate trials

- Live `SKILL.md` SHA-256 matched the claimed baseline:
  `3dcbaa3ed3ca229d98ca34f382ba83475ba53e5b741e6b09e409e2d64980f55d`.
- Candidate `SKILL.md` SHA-256:
  `e1244b06d2ddc7c8b0da91c783f1b0f07de07e89a35084895b2a0ed5e44b55c8`.
- Baseline and candidate contain the same three-file layout.
- `DEEPENING.md` and `DESIGN-IT-TWICE.md` are byte-identical across versions.
- Both `SKILL.md` files have the expected `codebase-design` frontmatter and all
  referenced local Markdown files resolve.
- `git diff --no-index --check baseline candidate` emitted no whitespace errors;
  its status was `1` only because the candidate intentionally differs.
- The decontamination helper suite passed 12/12 tests.
- No product/runtime test applies: the target contains Markdown instructions and no
  executable helper.
