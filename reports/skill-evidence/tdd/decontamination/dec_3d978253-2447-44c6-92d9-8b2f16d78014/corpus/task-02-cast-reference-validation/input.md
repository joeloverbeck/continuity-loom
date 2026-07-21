# Historical task: Require validated CAST MEMBER to ENTITY references (#130)

Make `entity_id` on selected CAST MEMBER records a required reference in all three cast bands. Dangling and wrong-kind references already block. Add the missing case where the ENTITY exists in the project but is absent from the active working set.

Constraints and acceptance criteria:

- Reuse the existing required-but-unselected diagnostic, severity, and message shape.
- Prove dangling, wrong-kind, and unselected paths for all three cast bands.
- Prove selecting, repointing, or correcting the ENTITY clears the relevant blocker.
- While blocked, no prompt bytes or raw identifier are shown and send remains gated.
- No other reference role changes required/optional posture.
- No schema migration, stored-field change, automatic working-set mutation, or provider call.
- Synchronize the compiler contract and story-record schema with the cast-specific fail-closed rule.
