I can’t make either write yet, because the requested artifacts would turn unresolved—and in one case contradictory—ideas into project authority.

“Validation gate” currently names an implementation sketch, not a ratified domain concept. `parseFindingLedger()`, `validate-report.mjs`, and `compilePrompt()` belong in a compiler spec or design note, not in the glossary. If the intended concept is specifically the boundary before prompt compilation, I suggest the more precise term:

> **Prompt-compilation gate** — A deterministic validation boundary that prevents prompt compilation when the story record violates a hard-fail rule.

Please confirm or amend that meaning, particularly whether the gate governs only prompt compilation or also candidate acceptance. Until that is resolved, there is no honest `CONTEXT.md` entry to write.

The accepted-segment summary proposal directly conflicts with the existing constitutional authority in two ways: it would let an LLM mutate story records automatically, and it would make an automatic prose-derived summary part of the next prompt. It also lacks the decisions needed to constitute a real trade-off—source attribution, review, rejection, and recovery are all unresolved—so an ADR would incorrectly present a proposal as an accepted decision.

Concrete cases expose the missing model:

- If the summary invents or reverses a fact, does the bad fact enter the next prompt before the user can stop it?
- If the summary conflicts with a user-authored record field, which source wins, and how is that conflict surfaced?
- If the user rejects the summary, is the prior record restored exactly, and can later generations still observe the rejected text?
- If rerunning the summarizer produces different facts, which result carries authority and provenance?

The first decision is therefore whether to preserve the current constitutional rules or deliberately amend them. If the rules stand, summaries may at most be reviewable drafts and cannot become records or prompt context automatically. If you intend to amend them, that constitutional change and the four behaviors above must be resolved first; only then can I determine whether the decision belongs in that authority’s own change record or also warrants an ADR.

No glossary or ADR patch is proposed at this turn.
