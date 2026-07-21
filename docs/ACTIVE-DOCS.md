# Active Docs Map — Continuity Loom

Status: active reference — authority registry, active-vs-archive boundaries, and change-intake rules for coding agents
Authority: support (see docs/ACTIVE-DOCS.md)

## Purpose

This document tells future coding agents which repository documents govern behavior now that the first implemented version is complete.

Use it as the routing map before publishing work or making code changes. It does not replace or outrank the governing docs it names.

## First-read order for coding agents

1. Read `docs/principles/README.md` for the constitution-layer conformance rule.
2. Read `docs/principles/FOUNDATIONS.md` before changing runtime behavior, stored data, prompt compilation, validation rules, generation behavior, accepted-segment behavior, OpenRouter behavior, or any LLM-assistance surface.
3. Read this file to identify the active specification or support document for the area you are touching.
4. Read the applicable documents listed below, including the relevant contract under `docs/specs/`.
5. Read the GitHub PRD or implementation issue you are working from, per `docs/agents/issue-tracker.md`.
6. Treat `archive/**` as historical evidence, not active instructions, unless an active doc or issue explicitly points to a specific archived file for provenance.

## Authority hierarchy

On conflict between active documents, precedence is:

1. `docs/principles/FOUNDATIONS.md` for substantive product commitments;
2. the applicable living specification under `docs/specs/` for the precise current contract;
3. a relevant ADR under `docs/adr/` for a durable architectural decision that conforms to the first two layers;
4. support indexes, guides, reports, PRDs, implementation issues, and code, all of which must align upward.

This document is the registry of which document governs each surface. It routes readers but cannot override that authority order.

Every active Markdown document under `docs/` must appear in the registry below. A new active document under `docs/` must be added to this registry in the same change.

| Doc | Scope | Genre | Authority tier |
|---|---|---|---|
| `docs/principles/README.md` | Constitution-layer index, conformance rule, and repository authority order. | index | support; does not override the constitution |
| `docs/principles/FOUNDATIONS.md` | Product identity, continuity authority, prompt-compilation doctrine, validation doctrine, workflow doctrine, and future-feature alignment standard. | principle | constitutional |
| `docs/specs/README.md` | Living-specification index and maintenance rule. | index | support; does not override specifications |
| `docs/ACTIVE-DOCS.md` | Authority registry, active-vs-archive boundaries, and change-intake rules for coding agents. | index | support; routing only |
| `docs/specs/compiler-contract.md` | Deterministic prompt/compiler mapping, prompt section order, empty-state rendering, validation focus matrix, and blocker/warning taxonomy. | specification | domain authority for prompt compiler and validation bridge |
| `docs/specs/prompt-template.md` | Universal prose prompt template text and placeholder structure. | specification | domain authority for universal prompt template |
| `docs/specs/cast-member-draft-prompt-template.md` | Static record-free Cast Member dossier drafting prompt, per-field semantics, invention rules, and external-output contract. | specification | domain authority for Cast Member draft prompt template |
| `docs/specs/ideation-prompt-template.md` | Grounded ideation prompt template text, request shape, slot rules, and output contract. | specification | domain authority for ideation prompt template |
| `docs/specs/story-record-hygiene-prompt-template.md` | Whole-project-default atomic-record hygiene assistance prompt with optional working-set scope, source predicate, type-aware overlap/action rules, and output contract. | specification | domain authority for story-record hygiene prompt template |
| `docs/specs/segment-reconciliation-prompt-template.md` | Single-segment accepted-prose reconciliation assistance prompt, source profile, record scope, generation-field boundary, schema catalog, structured output contract, provenance, paraphrase firewall, and UI quarantine. | specification | domain authority for the segment-reconciliation assistance prompt template |
| `docs/prompt-template-rationale.md` | Rationale for prompt-template design choices and section ordering. | explanation | support |
| `docs/specs/story-record-schema.md` | Conceptual story-record schema, generation-time brief schema, prompt-compilation behavior, validation requirements, and record taxonomy. | specification | domain authority for story record and generation-time brief schema |
| `docs/specs/validation-rule-inventory.md` | Implemented validation diagnostic code inventory, severity audit, and same-change drift rule. | specification | domain authority for implemented validation-rule inventory |
| `docs/specs/robustness-testing.md` | Development-assurance policy for mutation, coverage, property, metamorphic, and golden robustness evidence; subordinate to FOUNDATIONS and domain contracts, and does not define prompt or validation behavior. | specification | development-assurance authority |
| `docs/narrative-theory-blocker-roadmap.md` | Non-binding research-grounded candidate list for possible future deterministic validation work. | explanation | support |
| `docs/specs/stress-suite.md` | Canonical stress cases for validation, compiler, prompt, and demo regression coverage. | specification | domain authority for validation stress cases |
| `docs/specs/stress-coverage-matrix.md` | Stress-case coverage matrix tying cases to validation rules, compiler behavior, and regression surfaces. | specification | domain authority for stress-case coverage |
| `docs/demo-blocker-recipes.md` | Demo-fixture smoke recipes for validation blockers and warnings. | how-to | support |
| `docs/user-guide.md` | User-facing local install, run, verify, and app workflow guidance. | how-to | support |
| `docs/agents/issue-tracker.md` | Engineering-skill GitHub issue-tracker commands and external-PR request-surface policy. | reference | support |
| `docs/agents/triage-labels.md` | Canonical triage roles mapped to this repository's GitHub label vocabulary. | reference | support |
| `docs/agents/domain.md` | Engineering-skill rules for consuming the repository's single-context domain glossary and ADRs. | reference | support |
| `docs/adr/0001-version-playtest-prep-contracts.md` | Version identity and producer-owned migration boundary for playtest PRD-prep artifacts. | decision | support |
| `docs/adr/0002-validation-gates-fail-closed.md` | Validators must emit an error on unparseable input rather than returning an empty error set. | decision | support |
| `docs/archival-workflow.md` | Repository archival destinations, required closeout steps, and post-archive reference rules. | how-to | support |

### Constitutional authority

- `docs/principles/README.md`
- `docs/principles/FOUNDATIONS.md`

`docs/principles/FOUNDATIONS.md` is the project constitution. The folder README is its index and conformance rule. If a proposed feature conflicts with the constitution, the feature is wrong unless `docs/principles/FOUNDATIONS.md` is deliberately amended first.

### Current product and user-facing operation

- `README.md`
- `docs/user-guide.md`

These explain how the implemented local app is installed, run, verified, and used.

### Prompt, compiler, validation, and schema authorities

- `docs/specs/README.md`
- `docs/specs/compiler-contract.md`
- `docs/specs/prompt-template.md`
- `docs/specs/cast-member-draft-prompt-template.md`
- `docs/specs/ideation-prompt-template.md`
- `docs/specs/story-record-hygiene-prompt-template.md`
- `docs/specs/segment-reconciliation-prompt-template.md`
- `docs/prompt-template-rationale.md`
- `docs/specs/story-record-schema.md`
- `docs/specs/validation-rule-inventory.md`

Use these when changing prompt rendering, assistance source profiles, placeholder mapping, compiler metadata, validation-focus behavior, record schemas, generation-time brief schemas, active working set behavior, story-config surfaces, the grounded ideation prompt, or the story-record hygiene prompt.

### Stress, demo, and regression-support docs

- `docs/specs/stress-suite.md`
- `docs/specs/stress-coverage-matrix.md`
- `docs/specs/robustness-testing.md`
- `docs/demo-blocker-recipes.md`

Use these when changing validation coverage, demo fixture behavior, prompt/compiler stress behavior, accepted-prose exclusion, physical continuity, POV/secrets, dialogue voice pressure, or local-prose stop rules.

### Agent and process docs

- `AGENTS.md`
- `CLAUDE.md`
- `docs/agents/issue-tracker.md`
- `docs/agents/triage-labels.md`
- `docs/agents/domain.md`
- `docs/adr/0001-version-playtest-prep-contracts.md`
- `docs/adr/0002-validation-gates-fail-closed.md`
- `docs/archival-workflow.md`

Use these for repository workflow, PRD and issue shape, archival decisions, and completion standards. `tickets/README.md` and `tickets/_TEMPLATE.md` are no longer active authorities; they remain only as historical format references for the retired local-ticket workflow.

## Historical material

After the post-v1 transition, completed v1 requirements should live under:

- `archive/requirements-version-1/`

Completed implementation specs and tickets already live under:

- `archive/specs/`
- `archive/tickets/`

Completed reports should live under:

- `archive/reports/`

Do not use archived files as current implementation instructions. Use them only for historical provenance, rationale recovery, or when an active issue explicitly depends on one.

## Active work lives on the issue tracker

The repository-native `specs/` and `tickets/` workflow is **retired**. Do not open new local specs or tickets, and do not treat the absence of a local spec as a gate on published work.

All active work lives in GitHub Issues, as PRDs and implementation issues. See `docs/agents/issue-tracker.md` for tracker conventions and `docs/agents/triage-labels.md` for the label vocabulary. The tracker contents are the current task authority, not a point-in-time statement in this map.

`tickets/README.md` and `tickets/_TEMPLATE.md` survive only as historical format references. Completed local specs and tickets remain under `archive/specs/` and `archive/tickets/` as historical evidence, including:

- `archive/tickets/CLEANUP-001.md` — post-v1 cleanup that removed orphaned validation diagnostic code
- `archive/specs/SPEC-035-author-focused-ideation.md` — bounded Author focus contract for grounded Ideation
- `archive/specs/SPEC-034-accepted-segment-generation-context-coherence.md` — accepted-segment generation-context coherence
- `archive/specs/SPEC-implementation-order-and-regression-plan.md` and `archive/specs/IMPLEMENTATION-ORDER-2026-06-08.md` — the generation-readiness ordering and regression-plan spine

## When a change needs a PRD, an issue, an ADR, or a doc correction

Publish a **PRD** to the issue tracker when the change touches one or more of these:

- deterministic prompt compilation or compiler metadata;
- validation blockers, warnings, focus tags, or fail-closed gates;
- record schema, generation-time brief schema, accepted-segment metadata, or project-store compatibility;
- OpenRouter transport boundaries, API-key handling, logging, prompt persistence, or candidate persistence;
- accepted-prose exclusion, durable-change reminders, or prose-to-canon boundaries;
- local-first project ownership, backup, migration, or storage safety;
- any feature that could introduce branches, plot rails, autonomous continuity changes, or hidden prompt context.

Publish a plain **implementation issue** when the work is narrow, already scoped, and can be verified with direct tests or grep-proof.

Use a doc correction when an active doc misstates current behavior, points at a stale path, duplicates authority in a confusing way, or could mislead agents into implementing completed v1 planning as new backlog.

Use an ADR only for a durable architectural decision that should remain discoverable independently from the PRD that prompted it. Do not create an ADR log just to record routine implementation choices.

## Non-negotiable invariants

Future work must not violate these boundaries:

- Records and user-authored generation-time fields are the continuity authority.
- Rejected candidates, superseded candidates, and automatic prose-derived summaries are not prompt context. Accepted prose is prompt context only as bounded evidence in the exact one-segment assistance profiles sanctioned by `docs/principles/FOUNDATIONS.md` §9.1; it never becomes canon or prose-prompt authority.
- The compiler must be deterministic and must not query hidden state outside the validation snapshot.
- Validation must fail closed. Blockers gate prompt preview and send; warnings do not become prompt instructions.
- The active working set is explicit and user-controlled. The app must not silently add globally important records because they seem relevant.
- The app has no branches, plot rails, beat packages, act machinery, or autonomous plot planner.
- The app must not use an LLM to mutate records automatically.
- API keys are global local secrets, not project data. Keys, full prompts, candidates, accepted prose, and full record payloads must not be logged by default.
- Project data remains local and user-owned. Network traffic is limited to the prompt the user intentionally sends through OpenRouter.

## Version note

The root and workspace package versions are private-package metadata and may remain `0.0.0`. The implemented prompt template, compiler, and compiler-contract versions are separate contract versions whose source of truth is `packages/core/src/version.ts`; after adding bounded Author focus to grounded Ideation, template is `1.10.0`, compiler is `1.12.0`, and compiler contract is `1.13.0`.

Do not change app/package version semantics casually. If public release metadata becomes necessary, start with a focused release/versioning PRD; any resulting standing contract belongs under `docs/specs/`.
