# Issue #202 snapshot

Title: Cast Member editor loses the linked Entity after save

Author: repository maintainer

Labels: `bug`, `needs-triage`

Body: "Create an ENTITY, create a CAST MEMBER linked to it, save, reopen the CAST MEMBER. The Entity selector is blank even though the stored JSON still contains the reference. Expected: the selected Entity remains visible."

Comments: a maintainer reproduced this on Node 24 from current `main`. A focused component test fails because the editor initialises its control from the wrong field. The stored schema and API payload are correct. The intended behavior is already stated in the active story-record schema and user guide. No migration, compiler, validation, or OpenRouter behavior changes.

Repository facts: type label `bug` and readiness label `ready-for-agent` exist. The browser-visible checklist maps to the described entry point/state, existing validation behavior is unchanged, prompt/network/canon items are specific N/A cases, persistence is unchanged, and the failing component test is the regression seam.
