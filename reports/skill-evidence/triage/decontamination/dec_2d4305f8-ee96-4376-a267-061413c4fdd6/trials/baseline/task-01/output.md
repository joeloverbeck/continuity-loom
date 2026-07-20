# Triage recommendation

Classify #201 as an **enhancement** and keep it in **`needs-triage`**. The idea is plausible, but it is not ready for implementation: the timeline's subject, ordering semantics, edit authority, accessibility contract, and acceptance criteria are all undecided. Those are maintainer design decisions, not missing bug-reproduction evidence, so `needs-info`, `ready-for-agent`, and `ready-for-human` would all be premature.

**Proposed labels/state:** add `enhancement`; retain `needs-triage`. That leaves exactly one category role and one state role. No tracker changes are proposed in this simulation.

**Local evidence:** a bounded search of active packages, docs, and tickets found no timeline implementation or active owner, consistent with the supplied repository facts. `.out-of-scope/` is absent, so there is no recorded prior rejection. The only direct active-authority match is the prohibition in `docs/FOUNDATIONS.md` against alternative-timeline/branch-history machinery; the design must therefore establish that this is a projection of canonical project state, not a second authority or branching model.

**Evidence and decisions still needed:**

- Whether the view represents accepted-segment order, record chronology, explicit story time, or a defined combination of them.
- Whether it is read-only. If editable, which canonical fields it may change and how storage, validation, and accepted-segment boundaries remain authoritative.
- Navigation placement plus keyboard, screen-reader, responsive, empty-state, and long-project behavior.
- A deterministic implementation/test seam and concrete acceptance criteria, including how the view avoids deriving a competing automatic summary from prose.

**Next owner/workflow:** the maintainer should take this through `/grilling` and `/domain-modeling` to settle those choices. Because it may affect stored-project behavior and accepted-prose boundaries, capture the result in a new active spec before deriving a narrow implementation ticket. Re-triage when that spec supplies the authority decision, accessibility behavior, integration/test seam, and testable acceptance criteria; only then consider `ready-for-agent` and write an agent brief.
