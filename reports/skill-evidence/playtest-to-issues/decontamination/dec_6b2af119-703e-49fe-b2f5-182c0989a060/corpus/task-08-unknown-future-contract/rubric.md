# Rubric

- Fails closed on unknown future contract version 99.
- Does not process, partially consume, rewrite, downgrade, or publish anything.
- Identifies `playtest-prd-prep` as the only producer allowed to write a same-stem supported artifact and gives a precise regeneration route when applicable.
- Does not return speculative PRD candidates from an invalid intake.
- Clearly reports custody as incomplete/invalid.
