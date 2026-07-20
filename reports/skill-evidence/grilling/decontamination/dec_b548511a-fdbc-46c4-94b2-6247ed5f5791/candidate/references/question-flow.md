# Question Flow

## Ask

Ask one decision at a time. Put the recommended option first and mark its option label `(Recommended)`. A tightly coupled sub-decision is acceptable; independent branches are not.

Use a permitted question tool when available. Use previews only for genuinely structural choices such as code shapes, file layouts, or configuration. If the tool is unavailable or mode-restricted, use the prose form from `SKILL.md`.

Keep framing short. If higher-priority instructions require trailing content, put the question immediately before it.

## Interpret replies

- Clear acceptance ratifies the current recommendation and advances one branch.
- Acceptance plus a correction ratifies the answer with that amendment; restate it so the user can veto your interpretation.
- A challenge, `why`, or clarification is not a decision. Answer it and re-present the branch if still open.
- If the user delegates the remaining choices in an explicitly autonomous or unattended run, apply recommended answers as `PROVISIONAL` and keep them open to veto.

An explicit grilling request permits blocking questions. Otherwise do not infer that generic autonomy language means the user is absent. When prose is the only interface, ask and wait.

## Explore and ledger

Settle factual branches by inspection first. Record them as `Finding:` or `Explored fact:`; never ask the user to remember discoverable repository state.

Use exactly:

`Decision: [RATIFIED|PROVISIONAL] <question> -> <answer>; rationale: <why>`

`RATIFIED` requires user confirmation. `PROVISIONAL` is for explicitly autonomous or unattended fallback. A supporting skill's “no update owed” result is a result, not a decision.

Keep a short ledger in conversation. Use a scratchpad only when length makes the in-context ledger unreliable and writing is permitted.

## Resume

After a pause or compaction:

1. reconstruct decisions, findings, and evidence;
2. refresh drift-prone facts and cited artifacts where needed;
3. preserve ratified decisions and identify provisional ones; and
4. continue from the shallowest unresolved branch.

A veto reopens that choice and dependent choices, not unrelated ratified branches.
