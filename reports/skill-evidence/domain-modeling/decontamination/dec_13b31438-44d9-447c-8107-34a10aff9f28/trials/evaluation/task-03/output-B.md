I can’t write either artifact as accepted yet.

The requested glossary entry is an implementation description, not a domain definition. `parseFindingLedger()`, `validate-report.mjs`, diagnostic arrays, and call order belong in code or implementation documentation, not `CONTEXT.md`. There is also no ratified product meaning to record. If the intended concept is an app-layer safeguard, a candidate for ratification is:

```md
**Validation gate**:
An application checkpoint that prevents a story-state operation from proceeding when required continuity rules are not satisfied.
_Avoid_: Validator function, validation script
```

That is proposed language, not a glossary patch. If “validation gate” means only the current function call, it should not become a glossary term.

The accepted-segment summary proposal also cannot be recorded as an accepted ADR. It directly conflicts with the existing constitutional rules that records and user-authored generation-time fields are authoritative, automatic prose-derived summaries are excluded from prompt context, and an LLM must not mutate records automatically. An ADR cannot silently override or duplicate that authority. The proposal is also unresolved on provenance, user review, rejection, and recovery, so there is not yet a selected, defensible trade-off to record.

A constitution-compatible direction would be for the LLM to produce a proposed record edit that remains outside both the records and prompt context until the user reviews and explicitly applies it. Only the resulting user-approved record fields—not the accepted prose or an unreviewed automatic summary—could then affect compilation. Source attribution, editing/rejection, and rollback behavior still need explicit decisions.

If the team instead intends fully automatic mutation and immediate prompt inclusion, the governing constitutional authority must be deliberately amended first through its owning process. After that, any remaining hard-to-reverse architectural trade-off can be evaluated for an ADR. No file contents or patch are proposed this turn because neither the term nor the decision is resolved.

Domain model unchanged — contingent on ratification of the provisional decisions.
