# Active Docs Map — Continuity Loom

Status: active post-v1 agent map  
Scope: authority hierarchy, active-vs-archive boundaries, and change-intake rules for future coding agents

## Purpose

This document tells future coding agents which repository documents govern behavior now that the first implemented version is complete.

Use it as the starting map before opening tickets or making code changes. It does not replace the governing docs it names.

## First-read order for coding agents

1. Read `docs/FOUNDATIONS.md` before changing runtime behavior, stored data, prompt compilation, validation rules, generation behavior, accepted-segment behavior, OpenRouter behavior, or any LLM-assistance surface.
2. Read this file to identify the active source of truth for the area you are touching.
3. Read the relevant domain docs listed below.
4. Read `tickets/README.md` and any active ticket you are implementing.
5. Treat `archive/**` as historical evidence, not active instructions, unless an active doc or ticket explicitly points to a specific archived file for provenance.

## Authority hierarchy

On conflict between active documents, precedence is: this document first, then the domain authority that `docs/ACTIVE-DOCS.md` names for the touched surface, then support docs and guides. `docs/ACTIVE-DOCS.md` is the registry of which document is the domain authority for each surface.

Every active `docs/*.md` file must appear in the registry below. A new file under `docs/` must be added to this registry in the same change.

| Doc | Scope | Genre | Authority tier |
|---|---|---|---|
| `docs/FOUNDATIONS.md` | Product identity, continuity authority, prompt-compilation doctrine, validation doctrine, workflow doctrine, and future-feature alignment standard. | reference | constitutional |
| `docs/ACTIVE-DOCS.md` | Authority registry, active-vs-archive boundaries, and change-intake rules for coding agents. | reference | support |
| `docs/compiler-contract.md` | Deterministic prompt/compiler mapping, prompt section order, empty-state rendering, validation focus matrix, and blocker/warning taxonomy. | reference | domain authority for prompt compiler and validation bridge |
| `docs/prompt-template.md` | Universal prose prompt template text and placeholder structure. | reference | domain authority for universal prompt template |
| `docs/prompt-template-rationale.md` | Rationale for prompt-template design choices and section ordering. | explanation | support |
| `docs/story-record-schema.md` | Conceptual story-record schema, generation-time brief schema, prompt-compilation behavior, validation requirements, and record taxonomy. | reference | domain authority for story record and generation-time brief schema |
| `docs/validation-rule-inventory.md` | Implemented validation diagnostic code inventory, severity audit, and same-change drift rule. | audit | domain authority for implemented validation-rule inventory |
| `docs/stress-suite.md` | Canonical stress cases for validation, compiler, prompt, and demo regression coverage. | audit | domain authority for validation stress cases |
| `docs/stress-coverage-matrix.md` | Stress-case coverage matrix tying cases to validation rules, compiler behavior, and regression surfaces. | audit | support |
| `docs/demo-blocker-recipes.md` | Demo-fixture smoke recipes for validation blockers and warnings. | how-to | support |
| `docs/user-guide.md` | User-facing local install, run, verify, and app workflow guidance. | how-to | support |
| `docs/archival-workflow.md` | Repository archival destinations, required closeout steps, and post-archive reference rules. | how-to | support |

### Constitutional authority

- `docs/FOUNDATIONS.md`

This is the project constitution. If a proposed feature conflicts with it, the feature is wrong unless `FOUNDATIONS.md` is deliberately amended first.

### Current product and user-facing operation

- `README.md`
- `docs/user-guide.md`

These explain how the implemented local app is installed, run, verified, and used.

### Prompt, compiler, validation, and schema authorities

- `docs/compiler-contract.md`
- `docs/prompt-template.md`
- `docs/prompt-template-rationale.md`
- `docs/story-record-schema.md`

Use these when changing prompt rendering, placeholder mapping, compiler metadata, validation-focus behavior, record schemas, generation-time brief schemas, active working set behavior, or story-config surfaces.

### Stress, demo, and regression-support docs

- `docs/stress-suite.md`
- `docs/stress-coverage-matrix.md`
- `docs/demo-blocker-recipes.md`

Use these when changing validation coverage, demo fixture behavior, prompt/compiler stress behavior, accepted-prose exclusion, physical continuity, POV/secrets, dialogue voice pressure, or local-prose stop rules.

### Agent and process docs

- `AGENTS.md`
- `CLAUDE.md`
- `docs/archival-workflow.md`
- `tickets/README.md`
- `tickets/_TEMPLATE.md`

Use these for repository workflow, ticket shape, archival decisions, and completion standards.

## Historical material

After the post-v1 transition, completed v1 requirements should live under:

- `archive/requirements-version-1/`

Completed implementation specs and tickets already live under:

- `archive/specs/`
- `archive/tickets/`

Completed reports should live under:

- `archive/reports/`

Do not use archived files as current implementation instructions. Use them only for historical provenance, rationale recovery, or when an active ticket explicitly depends on one.

## Active tickets and specs

Active implementation tickets live in:

- `tickets/`

Check `tickets/` directly for active implementation tickets. The directory contents are the current task authority, not a point-in-time statement in this map.

The post-v1 cleanup ticket that removed the orphaned validation diagnostic code is complete and archived at:

- `archive/tickets/CLEANUP-001.md`

Active specs live in:

- `specs/`

Check `specs/` directly for active implementation specs. The directory contents are the current spec authority, not a point-in-time statement in this map. The generation-readiness spec sequence (draftability/save, validation gating taxonomy, readiness/three-page UX) and its ordering/regression-plan spine are complete and archived under `archive/specs/`:

- `archive/specs/SPEC-implementation-order-and-regression-plan.md`
- `archive/specs/IMPLEMENTATION-ORDER-2026-06-08.md`

Create a new active spec only when the change is too broad or risky for a single ticket.

## When a change needs a spec, ticket, ADR, or doc correction

Use a new spec when the change touches one or more of these:

- deterministic prompt compilation or compiler metadata;
- validation blockers, warnings, focus tags, or fail-closed gates;
- record schema, generation-time brief schema, accepted-segment metadata, or project-store compatibility;
- OpenRouter transport boundaries, API-key handling, logging, prompt persistence, or candidate persistence;
- accepted-prose exclusion, durable-change reminders, or prose-to-canon boundaries;
- local-first project ownership, backup, migration, or storage safety;
- any feature that could introduce branches, plot rails, autonomous continuity changes, or hidden prompt context.

Use a ticket when the work is narrow, already scoped, and can be verified with direct tests or grep-proof. `archive/tickets/CLEANUP-001.md` is the historical model for a small cleanup ticket.

Use a doc correction when an active doc misstates current behavior, points at a stale path, duplicates authority in a confusing way, or could mislead agents into implementing completed v1 planning as new backlog.

Use an ADR only for a durable architectural decision that should remain discoverable independently from an implementation spec. Do not create an ADR log just to record routine implementation choices.

## Non-negotiable invariants

Future work must not violate these boundaries:

- Records and user-authored generation-time fields are the continuity authority.
- Accepted prose, rejected candidates, superseded candidates, and automatic prose-derived summaries are not prompt context.
- The compiler must be deterministic and must not query hidden state outside the validation snapshot.
- Validation must fail closed. Blockers gate prompt preview and send; warnings do not become prompt instructions.
- The active working set is explicit and user-controlled. The app must not silently add globally important records because they seem relevant.
- The app has no branches, plot rails, beat packages, act machinery, or autonomous plot planner.
- The app must not use an LLM to mutate records automatically.
- API keys are global local secrets, not project data. Keys, full prompts, candidates, accepted prose, and full record payloads must not be logged by default.
- Project data remains local and user-owned. Network traffic is limited to the prompt the user intentionally sends through OpenRouter.

## Version note

The root and workspace package versions are private-package metadata and may remain `0.0.0`. The implemented prompt template, compiler, and compiler-contract versions are separate contract versions whose source of truth is `packages/core/src/version.ts`; as of this writing, template is `1.0.0`, compiler is `1.2.0`, and compiler contract is `1.2.0`.

Do not change app/package version semantics casually. If public release metadata becomes necessary, write a focused release/versioning spec.
