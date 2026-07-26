# Deterministic Checks

- Baseline package: 7 Markdown files; all relative links resolved.
- Candidate package: 7 Markdown files; all relative links resolved.
- Portability scan: neither package contained `/home/`, `/Users/`, or a Windows drive path.
- Candidate scope: only `references/recap-contracts.md` differed from the baseline.
- Whitespace check: `git diff --no-index --check` emitted no errors.
- Mirror: `.agents/skills/grilling` resolved to `.claude/skills/grilling`.
- Runtime size: baseline 7,038 words / 49,353 bytes; candidate 7,088 words / 49,764 bytes; delta +50 words / +411 bytes.
- Live-target verification after rejection: the live target was byte-identical to the neutral baseline package, and `git diff -- .claude/skills/grilling` was empty.

All deterministic checks passed. Behavioral acceptance failed separately.
