# Issue #204 snapshot

Title: Cache compiled prompts in project storage

Author: repository maintainer

Labels: `enhancement`, `needs-triage`

Body: "Prompt preview feels repetitive. Cache the compiled prompt in the project so reopening is instant."

Comments: one maintainer suggests persisting the full prompt; another suggests a memory-only cache keyed by the validation snapshot. No decision has been made.

Repository facts: `FOUNDATIONS.md` says full prompts must not be logged by default, project data remains local and user-owned, and the compiler must be deterministic. `ACTIVE-DOCS.md` says storage, prompt persistence, compiler metadata, and project-store compatibility require a spec. There is no performance measurement establishing the bottleneck.
