# Historical regression task: Accepted-segment generation-context coherence (#96)

Enforce one deterministic lifecycle rule: `first_segment` at zero accepted segments and `continuation_after_accepted_segment` above zero. Missing context may be normalized; a contradictory saved value remains saveable but blocks readiness until explicitly repaired.

Constraints and acceptance criteria:

- Cover zero, one, and multiple accepted segments for missing, matching, and contradictory saved context.
- Contradiction emits one named blocker while other checks evaluate the archive-derived required context.
- Acceptance/deletion boundary operations may create a mismatch but never auto-mutate the saved brief.
- One shared readiness result gates preview, compilation, candidate intake, Generate, and provider sending; blocked paths produce no prompt bytes/candidate/provider call.
- Explicit save plus fresh compilation restores ordinary behavior; stale inspected prompt cannot remain current.
- Preserve accepted prose exclusion, storage boundaries, schema compatibility, export, and provenance.
- Cover core, server routes/repository boundaries, web accessibility/recovery, docs, and canonical gates.
