# Continuity Loom v1 — Spec Index

## Purpose

This spec set defines the first implementation boundary for **Continuity Loom v1**, a local-first, single-user, continuity-first prose-generation cockpit. It is written to guide a future implementation agent without becoming a ticket backlog, production-code design dump, database migration plan, or test-file suite.

The governing product model is preserved exactly:

> The records are the loom. The prompt is the shuttle. The generated prose is cloth. The cloth is not the loom.

## Scope

The set contains these v1 implementation specs:

1. `README-SPEC-INDEX.md` — this index, source hierarchy, reading order, and alignment summary.
2. `PRODUCT-SCOPE.md` — v1 product identity, user model, core loop, continuity surfaces, and feature boundary.
3. `TECHNOLOGY-DECISIONS.md` — stack recommendation and researched alternatives.
4. `LOCAL-FIRST-STORAGE.md` — project-folder model, SQLite canonical store, backup, inspectability, migrations, and secret boundaries.
5. `DATA-MODEL-AND-RECORDS.md` — implementation-oriented interpretation of the story record taxonomy.
6. `VALIDATION-ENGINE.md` — deterministic fail-closed validation doctrine, blocker/warning model, and focus-tag rules.
7. `PROMPT-COMPILER.md` — deterministic prompt rendering, section order, empty states, and prompt inspection boundaries.
8. `UI-WORKFLOWS.md` — local web UI navigation, record editing, working-set curation, generation, acceptance, and browsing workflows.
9. `OPENROUTER-INTEGRATION.md` — transport-only OpenRouter settings, non-streaming send, model list, errors, and secret handling.
10. `CANDIDATES-AND-ACCEPTED-SEGMENTS.md` — candidate lifecycle, accepted archive, and post-acceptance record-update reminder.
11. `DEMO-PROJECT-AND-STRESS-COVERAGE.md` — tame built-in demo fixture and v1 stress-suite coverage mapping.
12. `TESTING-STRATEGY.md` — validation, compiler, storage, UI, OpenRouter mock, security, and regression test strategy.
13. `RESEARCH-NOTES.md` — concise research summary, sources, similar-tool comparisons, rejected alternatives, and open questions.
14. `IMPLEMENTATION-ORDER.md` — recommended build sequence, phase gates, and cross-spec dependencies.

## Source hierarchy

The implementation specs obey this internal source hierarchy:

1. `FOUNDATIONS.md` — constitutional authority.
2. `compiler-contract.md` — authoritative deterministic compiler/validation bridge.
3. `prompt-template.md` — definitive generated prompt surface.
4. `prompt-template-rationale.md` — rationale for prompt sections and design decisions.
5. `story-record-schema.md` — conceptual record model and requirements schema.
6. `stress-suite.md` — conceptual stress coverage v1 must support.
7. `red-bunny-prompt-example.md` — high-pressure generated-prompt example only; not a demo fixture.

When researched implementation choices appear to create tension with those files, the uploaded source hierarchy wins. Research may choose tools and storage strategies; it may not redefine continuity authority.

## Conflict resolution log

No unresolved conflict was found among the uploaded source documents.

One apparent difference is worth making explicit: `FOUNDATIONS.md` lists the universal prompt’s conceptual sections, while `compiler-contract.md` gives the authoritative section order and placeholder mapping. This spec set treats the foundation list as the constitutional set of required conceptual functions, and treats the compiler contract as authoritative for ordering, requiredness, placeholder sources, validation focus tags, and empty-state rendering.

Another apparent difference is that `red-bunny-prompt-example.md` contains mature, explicit stress content, while the v1 demo fixture must be tame. The hierarchy and mission text resolve this cleanly: Red Bunny is a stress example, not bundled demo content.

## Non-negotiable alignment summary

Continuity Loom v1 must preserve these rules across product, storage, UI, validation, compiler, and OpenRouter integration:

- The user is the sole continuity authority.
- The app stores and works from one current continuity per story. There are no branches, alternate timelines, canon trees, or choose-your-own-adventure structures.
- Story records and generation-time fields are the generative substrate.
- Accepted prose is readable story output only; it is never prompt context or canon authority.
- The compiler is deterministic and never uses an LLM to select, rank, summarize, repair, rewrite, compress, or prioritize records.
- Validation fails closed. Blockers have no override in v1.
- Prompt preview and OpenRouter send are blocked when validation blockers exist.
- The external prose writer renders only the next local prose segment.
- Plot-rail machinery is rejected: acts, beats, arcs, milestones, chapter packages, dramatic structure, save-the-cat, hero’s journey, future plot summaries, and global story planning must not enter app logic, validation, compiler behavior, or prompts.
- Active/onstage cast dossiers must not be silently compressed.
- Prompt inspection is required, but permanent prompt archives are not stored by default.
- API keys never live in project data, prompts, logs, accepted prose, prompt inspection surfaces, or generated files.
- OpenRouter is transport only and never a continuity authority.
- Mature fiction support remains bounded by story configuration and governing external model/provider/platform policy.
- Future LLM assistance, if ever added, may only produce reviewable, non-authoritative suggestions and is out of v1 unless separately justified.

## How to read these specs

Read `PRODUCT-SCOPE.md` first to fix the product identity and loop. Then read `TECHNOLOGY-DECISIONS.md` and `LOCAL-FIRST-STORAGE.md` before data modeling, because the storage model affects every editor and validation surface. Read `DATA-MODEL-AND-RECORDS.md`, `VALIDATION-ENGINE.md`, and `PROMPT-COMPILER.md` together; they form one deterministic substrate. Read `UI-WORKFLOWS.md`, `OPENROUTER-INTEGRATION.md`, and `CANDIDATES-AND-ACCEPTED-SEGMENTS.md` as the operational loop. Use `DEMO-PROJECT-AND-STRESS-COVERAGE.md` and `TESTING-STRATEGY.md` to verify coverage. Use `IMPLEMENTATION-ORDER.md` last.

## Non-goals

This spec index does not define implementation tickets, production code, database migrations, test files, cloud architecture, collaboration architecture, sync, packaged desktop delivery, autonomous story generation, or plot planning.

## User-facing behavior

The user should experience the spec set as a coherent product contract: the app exists to make continuity disciplined, inspectable, manually curated, and locally owned before each generation. The user should never be surprised by hidden record injection, automatic canon extraction, opaque prompt mutation, stored rejected generations, or prompts generated from accepted prose.

## Data/logic implications

All implementation choices must preserve the five continuity surfaces as separate data surfaces: all story records, active working set, generation-time brief, generated prompt, and accepted segment archive. Storage, UI, compiler, validation, and OpenRouter transport must not merge those surfaces.

## Alignment with `FOUNDATIONS.md`

This index follows the foundation’s identity, core loop, active working set supremacy, deterministic compilation doctrine, fail-closed validation doctrine, no-branches/no-plot-rails doctrine, no accepted prose in prompts rule, local-first data ownership rule, prompt-inspection boundary, and OpenRouter secret-handling rule.

## Security/privacy implications

The spec set assumes local project ownership and no cloud account system. API keys are always global secrets outside project folders. Generated prompts are inspectable but not permanently archived by default. Logs, generated files, fixtures, and project stores must never contain API keys.

## Validation implications

Validation is not a later polish layer. It is a hard product boundary. Any implementation that can preview a partial prompt, send to OpenRouter, or accept prompt compilation while blockers exist violates the spec set.

## Failure modes

Primary spec-level failure modes are constitutional drift, treating accepted prose as canon, accidentally introducing plot rails through UI labels, allowing a model or helper to choose records, silently compressing active cast, weakening blockers with overrides, hiding project data in an opaque app store, or leaking API keys through logs/prompts/project files.

## Done Means

The spec set is complete when:

- each required topic from the mission is covered by a Markdown spec;
- each spec includes purpose, scope, non-goals, user-facing behavior, data/logic implications, foundation alignment, relevant security/privacy and validation implications, failure modes, and Done Means criteria;
- researched technology decisions cite current sources;
- uploaded source hierarchy is explicit;
- Red Bunny is clearly treated as a stress example only;
- no spec introduces branches, plot rails, prose-as-canon, LLM record mutation, permanent prompt archives by default, API-key leakage, or validation overrides;
- the implementation order is sequenced enough for a coding agent to partition work later without being a ticket backlog.
