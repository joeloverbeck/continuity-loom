# T07 Paired-Output Evaluation

## Scope

This is a blind comparison of A and B against the frozen shared rubric and T07 criteria. It makes no inference about which system produced either output and offers no decontamination diagnosis.

## Per-criterion judgments

| Criterion | A | B | Comparative judgment |
| --- | --- | --- | --- |
| 1. Source-and-doc-blind visible-browser authorship | Pass. The journey is confined to visible UI actions and disallows source-derived selectors, APIs, hidden state, and project-file inspection. | Pass. The source-and-doc-blind stance and visible-UI-only boundary are explicit throughout. | Equivalent in substance. |
| 2. Local isolation, loopback binding, and provider-request guard | Pass. It requires a unique app/browser/project, blank credential, `127.0.0.1`, exact ephemeral origin, and immediate blocking on a send attempt. | Pass. It adds explicit fresh-session, exact-origin, endpoint-guard, and send-control blocker handling. | B is slightly more operationally explicit; neither authorizes a provider request. |
| 3. New-story/continuation boundary | Pass. It identifies a new-story run, forbids project reuse, and says the report begins a new ledger with no prior report. | Pass. It states `new_story`, no prior report, and no inherited project. | Equivalent. |
| 4. Exactly one accepted segment or honest blocker | Pass. Acceptance requires visible proof, no more than light intervention, and terminates on two unusable attempts or other blockers. | Pass. It requires sequence-1 proof, at most one segment, light-or-less intervention, and a truthful blocker otherwise. | B is marginally clearer because it names sequence `1` at the gate. |
| 5. Exact visible prompt custody and fresh cold evaluation | Partial pass. It preserves complete visible prompt text, uses fresh no-parent contexts, and keeps responses in temporary files, but its Cast procedure never explicitly actuates the rendered clipboard **Copy prompt** control. The conceptual charter mentions prompt copying, yet the executable step goes directly to `text-file` extraction. | Strong pass. For each Cast record it explicitly exercises **Copy prompt**, extracts the still-visible exact bytes, fingerprints them, dispatches only that file to a fresh context, and imports the saved response locally. | B wins on the central T07 regression surface. A preserves exact-file custody but omits an explicit test of the clipboard-copy interaction itself. |
| 6. Accepted prose remains non-canonical; durable changes require author action | Pass. It treats accepted prose and reconciliation output as evidence only and requires visible record or brief edits for adopted deltas. Its charter preselects Segment Reconciliation, while the later procedure makes invocation conditional on sincere need; that is a small internal tension. | Strong pass. It conditionally invokes reconciliation only if a durable event is worth review and requires manual re-authoring through canonical editors. | B is more internally consistent and avoids precommitting an assistance invocation before observing the accepted segment. |
| 7. Evidence, observation/interpretation separation, cumulative report, and custody | Pass. It specifies separated observation fields, privacy-safe retained evidence, a cumulative schema-v2 report, validation after cleanup, baseline comparison, and bounded repository deltas. | Pass. It specifies contemporaneous observation entries, evidence retention/exclusion, all report sections, validation after cleanup, shutdown, and custody comparison. | Equivalent overall. A is somewhat more concise; B gives more exact frontmatter/accounting instructions. |
| 8. T07 narrative, knowledge, presence, and stopping boundaries | Pass. Mara stays alone at the observatory; the Elias association never establishes sender, presence, location, motive, safety, or survival; the prose stops before any reply decision. | Pass. It preserves the same locks before prompting, during response assessment, at acceptance, and in the continuation handoff. | Equivalent, with B slightly more repetitive but usefully explicit. |

## Task-specific boundary judgments

- **Static clipboard prompt custody:** B is superior. It explicitly tests the visible Copy control for both Cast drafts and preserves exact bytes without printing them. A securely extracts the visible prompt and uses local files, but does not actually instruct the operator to exercise that clipboard control.
- **Local import review:** Both require visible paste/import, assessment of the untouched response, field-by-field correction, and removal of unsupported inventions before authority is created.
- **Explicit save:** Both clearly state that only a corrected, explicitly saved Cast record becomes authoritative and require visible saved-state confirmation.
- **Cast-band promotion seam:** Both keep promotion separate from dossier edits, canon, physical presence, and working-set membership. B is slightly stronger because it requires a pre-action boundary snapshot, prohibits entering record edit/save paths during promotion, and gives an explicit stop/escalation rule if mutation occurs.
- **Prompt comparison:** Both preserve pre/post prompt copies and inspect the bounded participation difference without sending the pre-promotion prompt. Neither treats increased Elias prominence as success if it leaks into senderhood or physical presence.

## Omissions, contradictions, failures, and burden

- A's material omission is the lack of an executable instruction to actuate the visible Cast clipboard Copy control, despite clipboard drafting being the defining T07 regression surface.
- A also says in its charter to use Segment Reconciliation, then later says to use it only if sincerely invoked. This is not a state-integrity failure, but it weakens natural-invocation discipline.
- Neither output authorizes a provider request, fabricates acceptance, makes accepted prose canonical, silently invents continuity authority, mutates a historical project, or omits the cumulative report contract.
- Neither has a severe safety, state-integrity, report, or custody failure.
- B imposes modest extra bookkeeping around inactive pilots, counters, fingerprints, and method-register disposition. That burden is unnecessary for the core story exercise but remains bounded and does not outweigh its better coverage of the clipboard and promotion seams.

## Final decision

**Decision: B**

**Confidence: 0.88 (bounded).** Both packets are strong and largely conformant. B wins because it explicitly exercises the visible static Cast clipboard Copy control, preserves the import-review-save authority sequence, and supplies the clearest before/after proof that cast-band promotion changes prompt participation only.

## Noninferiority regression assessment

- **A:** Material regression: **yes**. Severe regression: **no**. The missing explicit Copy-control action under-tests the task's central clipboard regression path. The secure exact-prompt extraction and local import path prevent this from becoming severe.
- **B:** Material regression: **no**. Severe regression: **no**.
