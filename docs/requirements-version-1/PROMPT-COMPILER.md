# Prompt Compiler — Continuity Loom v1

## Purpose

The prompt compiler renders the deterministic, inspectable prompt sent to the external prose writer. It is a renderer, not an intelligence layer. Its obligation is to preserve the selected story state, generation-time brief, prompt template, and compiler contract exactly enough that the same inputs produce the same prompt.

## Scope

This spec covers compiler inputs, section order, placeholder mapping obligations, deterministic ordering, empty-state rendering, active cast dossier handling, prompt-facing vs validation-only fields, accepted prose exclusion, prompt preview, versioning, change control, and failure modes.

It does not define production code, provider-specific prompt adapters, migrations, or test files.

## Non-goals

This spec does not define provider-specific prompt forks, permanent prompt archives, accepted-prose summaries, token-budget compression, LLM prompt repair, LLM record ranking, or automatic context injection. It does not let the compiler decide what the story means.

## Compiler doctrine

The compiler must not use an LLM to:

- select records;
- rank records;
- summarize records;
- repair contradictions;
- rewrite author prose fields;
- compress active/onstage cast dossiers;
- infer missing state;
- prioritize records;
- mine accepted prose;
- generate prompt sections.

The compiler may format, group, sort, label, and render selected records by deterministic rules.

## Source inputs

The compiler renders only from:

1. template constants from `prompt-template(17).md`;
2. story configuration records;
3. generation-time brief fields;
4. user-selected active working set records;
5. user-selected cast inclusion bands;
6. deterministic empty-state constants defined in `compiler-contract(8).md`.

The compiler must not use accepted prose, rejected candidates, superseded regenerations, prompt archives, model memory, inactive unselected records, or automatic prose-derived summaries.

## Section order

V1 must render the exact section order from `compiler-contract(8).md`:

1. `<role>`
2. `<authority_hierarchy>`
3. `<content_policy>`
4. `<story_contract>`
5. `<prose_mode>`
6. `<hard_canon>`
7. `<current_authoritative_state>`
8. `<immediate_handoff>`
9. `<manual_directive>`
10. `<pov_knowledge_constraints>`
11. `<audience_knowledge>`
12. `<secrets_and_reveal_constraints>`
13. `<active_working_set>`
14. `<active_plans_and_intentions>`
15. `<active_clocks>`
16. `<active_obligations_and_consequences>`
17. `<active_open_threads>`
18. `<active_cast_full_dossiers>`
19. `<present_minor_cast>`
20. `<offstage_relevance>`
21. `<relevant_facts_beliefs_events>`
22. `<locations_objects_affordances>`
23. `<physical_continuity>`
24. `<invention_permissions>`
25. `<contradiction_prohibitions>`
26. `<prose_craft>`
27. `<stop_rule>`
28. `<final_output_instruction>`

This order keeps hard state near the front, compact active pressure before long dossiers, and stop/output constraints at the final edge.

## Placeholder mapping obligations

Every placeholder in `prompt-template(17).md` must have a deterministic source, requiredness rule, missing behavior, and empty-state behavior in `compiler-contract(8).md`.

V1 implementation must treat placeholder mapping as part of the compiler contract, not documentation drift. Adding, renaming, deleting, or changing a prompt placeholder requires updating the contract in the same source revision.

## Deterministic ordering

Within each prompt section:

- use explicit user order where the user provides ordering;
- otherwise use stable schema-defined grouping;
- then use stable metadata such as salience/urgency when the schema defines it;
- then display label;
- then stable ID.

Deterministic ordering is not model ranking. It must not infer salience by reading prose fields.

## Empty-state rendering

Constitutional sections are never omitted. Optional lists render exact deterministic empty-state phrases from `compiler-contract(8).md`, such as `None`, `None active`, `None selected`, or `None specified` as appropriate.

Empty states are not a substitute for missing required state. Required missing context blocks in validation before compilation.

## Active cast dossier rendering

Active/onstage full CAST MEMBER dossiers compile with all populated fields. The compiler must not silently compress them for token budget. It may warn about prompt length and lost-in-the-middle risk before compilation, but the user remains the gate.

Render active/onstage dossiers core-first:

1. identity;
2. voice anchor and voice-related extended fields;
3. pressure behavior core;
4. body presence core;
5. agency core;
6. remaining optional extended fields in schema order;
7. selected sample utterances last.

Current voice pressure pins compile near `<active_working_set>` as salience duplicates. They do not replace the full dossier. Temporary cast voice overrides compile only for the current generation and never mutate durable CAST MEMBER records.

Present-minor and offstage cast are rendered in their compressed or relevance bands. Present-minor material speech requires enough compressed voice guidance or validation blocks.

## Prompt-facing vs validation-only fields

Validation-only by default:

- validation focus tags;
- diagnostics;
- blocker/warning severity;
- record IDs unless a debug view is deliberately added outside the generated prompt;
- source provenance metadata;
- prompt/template/compiler version metadata unless shown in UI outside the prompt.

Prompt-facing when selected or compiled:

- user-authored current state;
- immediate handoff;
- manual directive;
- stop guidance;
- record prose fields;
- cast dossiers;
- voice anchors and current pressure pins;
- secrets/reveal lanes;
- affordances;
- temporary cast overrides.

Warnings must not compile into prompt text.

## Accepted prose exclusion

Accepted prose text must not appear in generated prompts. Rejected candidate text, superseded regeneration text, and automatic prose-derived summaries must not appear either.

The allowed handoff field is `prior_accepted_prose_status_or_handoff_note`, and it may contain only `None. No accepted prose is included.` or user-authored continuity handoff text. If the user pastes accepted prose into this field, validation blocks.

Durable changes from accepted prose must be manually represented in records, current authoritative state, immediate handoff, or selected records before the next generation.

## Prompt preview boundaries

Prompt inspection is required after validation passes. The preview shows the rendered prompt in the main UI. Source-map/debug provenance is not required in v1.

No partial preview appears when blockers exist. The user should not see an invalid prompt with holes and assume it is nearly usable.

The current generated prompt may remain visible during the active generation session. It is not permanently archived by default and is never treated as canon.

## OpenRouter boundary

OpenRouter receives the compiled prompt as transport payload. OpenRouter model choice and response quality do not alter record authority. OpenRouter errors must not mutate records or accepted segments.

Provider-specific wrappers or hidden model-specific prompt forks are out of v1 core. The prompt remains portable Markdown/XML hybrid.

## Versioning and change control

The app must track template version, compiler version, and compiler-contract version for reproducibility. Accepted segment metadata may store these versions, but not the full prompt.

Any change to prompt section order, placeholder mapping, empty-state rendering, requiredness, validation focus tags, or rendered template text requires corresponding contract updates.

## User-facing behavior

After validation passes, the user can inspect the generated prompt in a readable monospaced preview with copy/search/expand affordances. The UI should make it clear that the prompt is operational, temporary, and not canon.

If validation fails, the prompt preview area should explain that blockers must be resolved before a prompt can be rendered.

## Data/logic implications

The compiler should operate on an immutable validated snapshot. It should not query live UI state during rendering. It should not write records. It may produce an in-memory prompt string and derived metadata such as token/length estimates or a non-reversible fingerprint.

Prompt string logging is off by default and should be avoided entirely in v1.

## Alignment with `FOUNDATIONS.md`

This spec implements deterministic compilation, no accepted prose in prompts, prompt transparency without prompt hoarding, active working set supremacy, no silent active cast compression, single universal prompt contract, no LLM compiler intermediary, and local-prose-only output control.

## Security/privacy implications

The compiler must never include API keys or secret storage values. It must not read `.env` or global settings except non-secret model identifier/settings when needed for UI display outside the prompt. Prompt preview must not display API keys.

Generated prompts may contain sensitive story material. They remain local until the user explicitly sends them to OpenRouter.

## Validation implications

Compilation starts only after blocker-free validation. Compiler code may assert invariants, but it should not discover user-facing blockers for the first time. If an invariant fails during compilation, treat it as a bug-level blocker and do not produce a partial prompt.

## Failure modes

Compiler failure modes include:

- using an LLM to summarize long records;
- token-budget compression of active cast;
- hidden automatic inclusion of globally important records;
- accepted prose copied into handoff;
- warnings rendered as prompt text;
- provider-specific prompt forks in core;
- partial preview with blockers;
- prompt archived permanently by default;
- section order drift from compiler contract;
- empty-state paraphrases that change across runs.

## Done Means

The prompt compiler is satisfied when:

- identical validated inputs and version identifiers produce byte-identical prompt output;
- section order exactly matches `compiler-contract(8).md`;
- every template placeholder has a deterministic mapped source;
- empty-state constants render deterministically;
- selected active/onstage CAST MEMBER dossiers render all populated fields with no silent compression;
- current voice pressure pins and temporary overrides compile in the correct scoped locations;
- accepted prose, rejected candidates, superseded regenerations, and automatic prose-derived summaries cannot enter prompt-facing fields;
- prompt preview is available only when blockers are absent;
- prompt text is not permanently archived by default;
- OpenRouter send uses the compiled prompt without making OpenRouter a continuity authority.

## Research sources

- OpenAI prompt engineering guide: https://developers.openai.com/api/docs/guides/prompt-engineering
- Anthropic prompt engineering and XML guidance: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview
- Google Gemini prompt design strategies: https://ai.google.dev/gemini-api/docs/prompting-strategies
- Lost in the Middle: https://arxiv.org/abs/2307.03172
- Retrieval-Augmented Generation: https://arxiv.org/abs/2005.11401
- Anthropic context engineering discussion: https://www.anthropic.com/engineering/context-engineering
