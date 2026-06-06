# Research Notes — Continuity Loom v1

## Purpose

This document records the current research basis, as of June 2026, for Continuity Loom v1 technology, storage, UI, OpenRouter, prompt/context engineering, and adjacent-tool comparisons.

It is a rationale companion, not an implementation plan or ticket backlog.

## Scope

Research covers:

- TypeScript, Node, WSL2/Ubuntu, React, and Vite;
- packaged desktop alternatives;
- SQLite as local application file format;
- Node SQLite access and TypeScript ergonomics;
- runtime schemas, forms, and table/list tooling;
- local-first principles and project-folder storage;
- OpenRouter authentication, model listing, parameters, non-streaming chat completion, and errors;
- prompt/context engineering and long-context risks;
- similar or adjacent writing tools;
- human-AI writing research and author agency.

## Non-goals

This research does not overrule `FOUNDATIONS.md`, select a cloud architecture, justify collaboration, introduce plot rails, authorize LLM record mutation, or recommend accepted-prose prompt inclusion.

## Technology stack findings

### Node and WSL2

Node.js 24 is the appropriate v1 baseline because it is the current LTS line in mid-2026, while Node 26 is current and not scheduled to enter LTS until October 2026. Vite’s current guide requires Node 20.19+ or 22.12+, so Node 24 LTS is comfortably compatible. Microsoft’s WSL guidance supports WSL2 as the default and recommended Linux development environment for Node workflows on Windows.

Decision: use TypeScript on Node 24 LTS, developed comfortably in WSL2 Ubuntu.

Sources:

- Node releases and release schedule: https://nodejs.org/en/about/previous-releases and https://nodejs.org/en/about/previous-releases#release-schedule
- Vite guide: https://vite.dev/guide/
- Microsoft WSL install: https://learn.microsoft.com/windows/wsl/install
- Microsoft Node on WSL: https://learn.microsoft.com/windows/dev-environment/javascript/nodejs-on-wsl

### React + Vite local web app

React’s official docs show Vite’s React TypeScript template as a lightweight path for a new project, and Vite remains a fast, lean development/build tool. A local browser UI launched by a Node process is enough for v1 and avoids desktop packaging complexity before the core continuity engine exists.

Decision: React + Vite local web app, served by a local Node process.

Sources:

- React project setup: https://react.dev/learn/start-a-new-react-project
- Vite guide: https://vite.dev/guide/

### Tauri vs Electron vs local web

Tauri is attractive for future packaging because it uses system webviews and can produce small binaries, but it adds Rust and Linux system dependencies such as WebKitGTK packages. Electron is mature and straightforward but embeds Chromium and Node, which is unnecessary for v1. A local web app avoids both packaging paths for now.

Decision: no mandatory packaged desktop app in v1; mention Tauri as preferred future packaging option if needed; do not choose Electron unless distribution requirements change.

Sources:

- Tauri overview and prerequisites: https://tauri.app/ and https://v2.tauri.app/start/prerequisites/
- Electron docs: https://www.electronjs.org/docs/latest/

### SQLite as application file format

SQLite’s own documentation explicitly supports SQLite databases as application file formats: single-file documents, transactions, queryability, cross-platform behavior, and accessibility through many tools. SQLite’s atomic-commit behavior supports continuity safety under crashes, and the Library of Congress describes SQLite as widely adopted, public, and sustainable.

Decision: SQLite is the canonical project store. Markdown/JSON folders are not canonical in v1.

Sources:

- SQLite application file format: https://sqlite.org/appfileformat.html
- SQLite atomic commit: https://sqlite.org/atomiccommit.html
- SQLite corruption and journaling guidance: https://sqlite.org/howtocorrupt.html
- SQLite PRAGMA documentation: https://sqlite.org/pragma.html
- Library of Congress SQLite format note: https://www.loc.gov/preservation/digital/formats/fdd/fdd000461.shtml

### SQLite access, ORMs, and TypeScript ergonomics

Node now documents an official `node:sqlite` module with synchronous database APIs, prepared statements, and SQL tag support. `better-sqlite3` remains a strong explicit synchronous option. Kysely offers a thin type-safe SQL builder. Drizzle supports SQLite including `node:sqlite`. Prisma supports SQLite but is heavier and less aligned with the desired explicit deterministic core.

Decision: use raw SQL through `node:sqlite` behind a typed repository boundary for v1. Keep better-sqlite3, Kysely, or Drizzle as later alternatives if implementation evidence justifies a switch. Do not use Prisma in v1.

Sources:

- Node `node:sqlite`: https://nodejs.org/api/sqlite.html
- better-sqlite3: https://github.com/WiseLibs/better-sqlite3
- Kysely: https://kysely.dev/
- Drizzle SQLite: https://orm.drizzle.team/docs/get-started-sqlite
- Prisma SQLite: https://www.prisma.io/docs/concepts/database-connectors/sqlite

### Runtime schemas, forms, and dense tables

Zod’s TypeScript-first runtime schemas fit the requirement that persisted project data be parsed and validated at runtime. TanStack Form and React Hook Form are both viable for complex typed forms; TanStack Form pairs naturally with a TanStack Table record browser. TanStack Table is a headless table/data-grid library suited to dense browsing and filtering.

Decision: Zod for runtime parsing; TanStack Table for dense record browsing; TanStack Form or React Hook Form for typed editors, with TanStack Form recommended if implementation ergonomics hold.

Sources:

- Zod: https://zod.dev/
- TanStack Form: https://tanstack.com/form
- React Hook Form: https://react-hook-form.com/
- TanStack Table: https://tanstack.com/table

## Local-first and storage findings

Ink & Switch’s local-first principles emphasize local availability, long-term preservation, privacy, and user control. Continuity Loom does not need CRDTs or collaboration in v1, but it strongly needs local ownership and network-optional project access.

Obsidian demonstrates the appeal of a folder of local Markdown files. Continuity Loom should adopt explicit user-owned folders and inspectability, but not Markdown as canonical storage because the app needs stronger reference integrity, transactions, active working set state, validation across records, and accepted segment ordering.

Decision: explicit project folder containing SQLite canonical store plus small readable metadata/config files.

Sources:

- Local-first software: https://www.inkandswitch.com/essay/local-first/
- Obsidian data storage: https://obsidian.md/help/data-storage

## OpenRouter findings

OpenRouter uses bearer API-key authentication. Its chat-completion API supports non-streaming and streaming modes. The model-list API returns model IDs and metadata including supported parameters. OpenRouter documents standard request parameters such as temperature, top_p, and token limits, and common error statuses including invalid credentials, insufficient credits, rate limits, provider errors, timeouts, and malformed requests.

Decision: v1 exposes global model, temperature, maximum output tokens, and optionally top_p. It uses non-streaming chat completion. It supports manual model entry and optional model-list refresh. It does not expose advanced provider routing or streaming debug options.

Sources:

- Authentication: https://openrouter.ai/docs/api/reference/authentication
- Chat completion: https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request
- Parameters: https://openrouter.ai/docs/api/reference/parameters
- Models API: https://openrouter.ai/docs/api/api-reference/models/get-models
- Errors: https://openrouter.ai/docs/api/reference/errors-and-debugging
- Quickstart: https://openrouter.ai/docs/quickstart

## Prompt and context engineering findings

Provider prompt guidance supports clear instructions and structured boundaries. OpenAI guidance supports separating instructions, context, and structured inputs; Anthropic recommends XML tags for complex prompts; Google’s Gemini docs emphasize clear, iterative prompt design.

Long-context research shows models can underuse information in the middle of long prompts. RAG research supports explicit external context over relying on model memory. Continuity Loom applies these principles by compiling selected records and generation-time fields, keeping hard state early, compact pressure before long dossiers, and final stop/output rules at the final edge.

Persona/role-playing research supports rich character profiles, but few-shot over-prompting risk supports sparse, annotated, non-copyable sample utterances rather than large catchphrase banks.

Decision: preserve the Markdown/XML hybrid universal prompt, deterministic section order, no accepted prose archive dumping, and active cast dossiers with current voice pressure pins.

Sources:

- OpenAI prompt engineering: https://developers.openai.com/api/docs/guides/prompt-engineering
- Anthropic prompt engineering: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview
- Google Gemini prompt design: https://ai.google.dev/gemini-api/docs/prompting-strategies
- Lost in the Middle: https://arxiv.org/abs/2307.03172
- Retrieval-Augmented Generation: https://arxiv.org/abs/2005.11401
- Persona/role-playing survey: https://aclanthology.org/2024.findings-emnlp.969/
- Few-shot over-prompting: https://arxiv.org/html/2509.13196v1

## Similar and adjacent tool comparisons

### Novelcrafter Codex

Novelcrafter’s Codex uses entries, types, tags, references, and scene context. Its documentation shows users can attach specific Codex entries to scene context and inspect prompt preview placement; it also warns that too many entries or buried key information can cause the AI to ignore important material.

Adopt:

- structured story reference entries;
- user-selected scene/generation context;
- prompt preview;
- tags/filtering for human organization.

Avoid:

- always-on/global context that silently feeds the AI;
- keyword/mention-driven context inclusion as authority;
- scene beats/planning assumptions in Continuity Loom core.

Sources:

- Novelcrafter Codex anatomy: https://www.novelcrafter.com/help/docs/codex/anatomy-codex-entry
- Adding Codex entries as scene context: https://www.novelcrafter.com/courses/codex-cookbook/codex-scenes
- Novelcrafter glossary on global entries and relations: https://www.novelcrafter.com/help/reference/terms/novelcrafter

### Sudowrite Story Bible

Sudowrite’s Story Bible gathers core story elements so the user and AI can reference them, and includes generated or manually populated story components such as genre, style, synopsis, characters, worldbuilding, and outline. Sudowrite’s docs also describe AI suggestions that the writer revises.

Adopt:

- visible story-state surfaces;
- author revision and control;
- project-level organization.

Avoid:

- outline/chapter/prose generation pipeline as v1 core;
- Story Bible as AI co-authorial source of truth;
- beat/chapter generation machinery;
- AI-generated record fields in v1.

Sources:

- Story Bible docs: https://docs.sudowrite.com/using-sudowrite/1ow1qkGqof9rtcyGnrWUBS/what-is-story-bible/jmWepHcQdJetNrE991fjJC
- Sudowrite glossary: https://docs.sudowrite.com/getting-started/dQph1snuwbfMWG9wRjsNug/glossary/1Symu5y4wtu65nQVYHjhxa

### SillyTavern World Info / Lorebooks

SillyTavern World Info dynamically inserts lorebook entries into prompts based on keywords and context-specific sources. Its docs describe World Info as a dynamic dictionary that inserts relevant information into prompts and notes that inserted information does not guarantee output behavior.

Adopt:

- recognition that structured context can guide generation;
- prompt inspection mindset.

Avoid:

- keyword-triggered automatic context injection;
- recursive lore activation as continuity authority;
- chat history as canon substrate;
- automatic lorebook generation or mutation.

Source:

- SillyTavern World Info docs: https://docs.sillytavern.app/usage/core-concepts/worldinfo/

### Scrivener

Scrivener is a strong precedent for local long-form writing organization, project outline, split research/material views, and sectioned manuscript work.

Adopt:

- local project feel;
- split views for records/prose/reference;
- pleasant accepted segment reading.

Avoid:

- making Continuity Loom a manuscript word processor;
- drag-and-drop chapter/outline structure as generation logic;
- chapter reordering as continuity architecture.

Source:

- Scrivener overview: https://www.literatureandlatte.com/scrivener/overview

### Obsidian and local knowledge bases

Obsidian stores Markdown notes in a local vault, proving the value of local folders, inspectability, and external-tool friendliness.

Adopt:

- local folder ownership;
- inspectability;
- optional readable metadata.

Avoid:

- plaintext Markdown as canonical store for Continuity Loom’s relational graph;
- relying on links/text search for physical/state/reference validation.

Source:

- Obsidian data storage: https://obsidian.md/help/data-storage

## Academic and prototype human-AI fiction/writing systems

Dramatron demonstrates hierarchical prompt chaining for coherent scripts, but it uses story beats, plot points, and hierarchical generation. This is useful as a caution: Continuity Loom should preserve author agency and local prose generation without adopting plot machinery.

TaleBrush demonstrates human-controlled story co-creation through visual steering of a protagonist’s fortune. It is a useful example of author control, but Continuity Loom must reject arc/fortune controls as v1 story machinery.

CoAuthor documents rich human-AI writing interactions, including accepting, dismissing, and editing suggestions. It supports Continuity Loom’s candidate edit/accept/discard model and the principle that AI output is material for human judgment.

Recent human-AI writing-agency research argues designers should support writer control and ownership rather than automation everywhere. This supports Continuity Loom’s refusal to let an LLM mutate records or decide canon.

Sources:

- Dramatron paper: https://arxiv.org/abs/2209.14958
- Dramatron repository: https://github.com/google-deepmind/dramatron
- TaleBrush paper PDF: https://johnr0.github.io/assets/publications/CHI2022-TaleBrush.pdf
- CoAuthor paper: https://arxiv.org/abs/2201.06796
- CoAuthor dataset site: https://coauthor.stanford.edu/
- Co-Writing with AI, on Human Terms: https://arxiv.org/html/2504.12488v1

## Rejected alternatives

- **Packaged desktop app first**: rejected for v1 because local web app satisfies current needs with lower complexity.
- **Electron first**: rejected because embedded Chromium/Node is unnecessary before distribution requirements exist.
- **Markdown/JSON canonical store**: rejected because the app requires stronger transactions, references, queries, and validation over a complex record graph.
- **Prisma-first database layer**: rejected because it adds weight and opacity to a local deterministic SQLite core.
- **LLM-assisted record extraction in v1**: rejected because v1 must not infer canon from prose or mutate records.
- **Keyword-triggered lorebook injection**: rejected because active working set selection is authorial and explicit.
- **Chapter/beat/outline generation pipeline**: rejected because it violates the no plot-rail machinery doctrine.
- **Permanent prompt archives**: rejected by foundation; prompt inspection is session-local by default.

## Open questions

These are implementation questions, not product-identity questions:

- Whether `node:sqlite` is sufficient in practice across the target Node 24 minor versions, or whether `better-sqlite3` should replace it behind the repository boundary.
- Whether TanStack Form or React Hook Form feels better for the CAST MEMBER editor after a prototype.
- Whether read-only CodeMirror is worth using for prompt preview, or a simpler textarea/pre block is enough.
- Whether the app should provide an explicit “consistent backup copy” command in the first slice or after storage foundation is stable.
- Whether optional non-reversible prompt fingerprints are worth storing with accepted segment metadata.

None of these open questions authorize branches, cloud authority, accepted prose prompt inclusion, plot rails, LLM record mutation, or validation overrides.

## User-facing behavior implications

Research supports a strict but transparent cockpit: local folder ownership, dense structured editing, explicit context selection, prompt preview, controlled generation, editable suggestions, and human acceptance.

The app should feel closer to a local continuity/state workstation than a “write my novel” AI product.

## Data/logic implications

Research supports SQLite canonical storage with runtime schemas, explicit repository logic, and deterministic compiler/validation functions. It also supports curated prompt context over archive dumping.

## Alignment with `FOUNDATIONS.md`

All research conclusions are subordinate to the foundation. Where adjacent tools use global context, outlines, beats, story bibles as AI source-of-truth, or dynamic lore injection, Continuity Loom deliberately chooses explicit records, active working set curation, local prose segments, and user-owned continuity.

## Security/privacy implications

Research reinforces local-first privacy and OpenRouter secret boundaries. API keys are bearer secrets and must never enter project stores, prompts, or logs. Sending prompts to OpenRouter is the main remote privacy boundary.

## Validation implications

Prompt/context research supports validation gates and high-signal context. Similar-tool comparisons reinforce the need to avoid over-inclusion, keyword-triggered hidden context, and buried contradictions.

## Failure modes

Research-level failure modes include:

- imitating existing AI fiction tools in ways that violate Continuity Loom’s constitution;
- treating long context as permission to dump archives;
- mistaking local-first for “use a folder of Markdown no matter what”;
- picking tooling for trendiness rather than deterministic inspectability;
- exposing too many OpenRouter/provider knobs in v1;
- using academic co-writing systems as justification for plot arcs or beats.

## Done Means

Research notes are complete when:

- major v1 technology choices have current cited sources;
- local-first and SQLite decisions are justified;
- OpenRouter behavior is sourced from official docs;
- prompt/context engineering choices cite provider guidance and research;
- similar tools are compared without imitation that violates the foundation;
- rejected alternatives are explicit;
- open questions do not weaken non-negotiable constraints.
