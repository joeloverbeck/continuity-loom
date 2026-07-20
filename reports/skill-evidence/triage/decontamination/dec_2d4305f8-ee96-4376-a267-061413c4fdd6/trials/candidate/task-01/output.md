## Recommendation

Keep #201 open in triage. It is an **enhancement**, but it is not ready for an implementation brief: the issue has not decided what the timeline represents, whether it is read-only, or how it relates to Continuity Loom's record authority and accepted-prose boundary.

**Proposed labels/state:** add the category label `enhancement`; retain the state label `needs-triage`. Do not move it to `ready-for-agent` or `ready-for-human` yet.

**Verification:** insufficient detail. The supplied context confirms that no active spec or ticket owns the work, but it does not establish whether equivalent UI already exists in the implementation. A current-tree redundancy check is still required.

**Evidence and decisions still needed:**

- Define the timeline's source and ordering semantics: accepted segments, records, or a combined view.
- Decide whether it is presentation-only or editable. If editable, specify exactly what changes, what persists, and how the UI preserves the distinction between records and accepted prose.
- Supply acceptance criteria for entry point/availability, visible states and actions, validation/error/recovery behavior, persistence and provenance, and keyboard/accessibility behavior. Record specific N/A reasons for the prompt-preview and external-LLM checklist items if they remain outside scope.
- Name the browser/component test seam and verify the intended integration point in the current tree.

**Next owner/workflow:** the maintainer should resolve the product choices through `/grilling` and record the resulting domain terms/authority decision through `/domain-modeling`. Because this spans browser navigation and stored-project presentation with unresolved authority boundaries, the resolved design should become a focused spec, then return to triage for readiness verification.
