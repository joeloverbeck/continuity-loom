This is the first issue in the explicitly ratified two-PRD program. The product scope, publication order, `enhancement` type, `ready-for-agent` posture, and named testing seams were all confirmed in the frozen program receipt; this simulated body has not been published.

## Problem Statement

Authors can obtain a generated Draft Candidate but cannot directly write or paste trial prose into the same candidate workflow. That blocks external trial prose and creates pressure either to misuse provider readiness as a gate or to fabricate OpenRouter metadata for text that never came from OpenRouter. Existing accepted rows also lack the explicit provenance needed to preserve this distinction safely.

## Solution

Add a `Write or paste candidate` action that appears when deterministic prompt preview is ready and does not depend on provider readiness. Starting the action creates one empty ephemeral user-supplied Draft Candidate without an OpenRouter call. Generated and user-supplied candidates use the same edit, discard, replace, and accept workflow with loss prevention for non-empty drafts. Acceptance stores an honest discriminated provenance value, migrates existing rows transactionally to explicit OpenRouter provenance, and continues to keep accepted prose outside prompt and canon authority.

## User Stories

1. As an author, I want to start a user-supplied Draft Candidate when deterministic prompt preview is ready, so that I can try prose without configuring or calling OpenRouter
2. As an author, I want generated and user-supplied candidates to share editing and acceptance behavior, so that candidate source does not create two different authoring workflows
3. As an author, I want confirmation before a non-empty draft is refreshed or replaced, so that an accidental action cannot silently destroy my prose
4. As an author, I want accepted provenance to distinguish OpenRouter output from user-supplied prose, so that project history never invents provider details
5. As a returning author, I want existing accepted rows migrated atomically and only once, so that opening an older project either succeeds intact or stops without partial damage
6. As an author using assistive technology, I want the new action and loss-prevention confirmation to expose clear names and focus behavior, so that I can complete the workflow without pointer-only interaction
7. As a privacy-conscious author, I want the manual path to make no external-model call, so that writing or pasting prose remains local
8. As a project owner, I want accepted prose excluded from prompt and canon inputs, so that accepting prose cannot silently change future compilation authority
9. As an implementer, I want migration and provenance failures to fail closed at project open and acceptance boundaries, so that invalid state cannot be persisted or concealed

## Implementation Decisions

- `Write or paste candidate` is available only when deterministic prompt preview is ready. OpenRouter or provider readiness is irrelevant to this action.
- Starting the action creates exactly one empty ephemeral user-supplied Draft Candidate and performs no OpenRouter request.
- Generated and user-supplied Draft Candidates share edit, discard, replace, and accept behavior. Refreshing or replacing any non-empty draft requires an explicit loss-prevention confirmation.
- Accepted provenance is one discriminated union. The OpenRouter variant retains the actual provider, model, settings, and applicable compiler versions. The user-supplied variant retains only its source and applicable compiler versions and cannot contain fabricated provider, model, or settings fields.
- Existing accepted rows migrate transactionally and idempotently to explicit OpenRouter provenance. Any migration failure leaves the project unchanged and stops project opening.
- Archive and export preserve the provenance distinction without inventing unavailable fields.
- Accepted prose remains output only. It does not become prompt context or canon authority.

## Testing Decisions

Tests assert external behavior rather than private implementation structure. The tested surfaces are the Candidate component, accepted route, project-open migration, archive/export component, localhost production browser, and repository root quality gates. Coverage includes readiness gating, zero external calls on the manual path, shared candidate behavior, destructive-action confirmation, both provenance variants, transactional and idempotent migration, migration rollback, archive/export fidelity, accessibility, and the continued exclusion of accepted prose from compilation inputs. No same-kind published exemplar was supplied in this isolated simulation, so the candidate PRD body contract is the descriptive prior-art fallback.

Seam confirmation: confirmed for the Candidate component; accepted route; project-open migration; archive/export component; localhost production browser; and root gates.

## Principles

The implementation must follow `docs/FOUNDATIONS.md`, including local-first ownership, deterministic compilation, fail-closed validation, API-key secrecy, localhost-only serving, and the Section 29 alignment checklist. `docs/story-record-schema.md` governs the stored accepted-prose and provenance shape, `docs/compiler-contract.md` governs prompt-context boundaries, and `docs/user-guide.md` governs the user-visible candidate workflow. No exception to these authorities is authorized; any discovered conflict must be resolved before implementation proceeds.

## Out of Scope

- Calling OpenRouter from the user-supplied candidate path.
- Making provider readiness a prerequisite for writing or pasting a candidate.
- Creating a separate editor or acceptance workflow for user-supplied candidates.
- Recovering provenance from prose content or fabricating provider metadata.
- Adding accepted prose to prompt context or canon authority.
- Implementing Prompt-Facing Full Labels in this issue; that is the second independently implementable PRD in the ratified program.

## Further Notes

This issue is first because it unblocks external trial prose. That order is priority only and creates no technical dependency on the second issue. The issue title is `PRD: User-Supplied Candidate Intake — Manual Drafts and Honest Provenance`; its labels are `enhancement` and `ready-for-agent`. After simulated numbers exist, the same exact sequence comment is associated with both program issues. The frozen program description is summarized as the ratification receipt and is not cited as a machine-local source.

### Browser-visible guidance checklist mapping

- entry point and availability: the Solution and Implementation Decisions define when `Write or paste candidate` is visible and state that it creates one empty local draft without an external call.
- user-visible states, actions, and outcomes: the Solution and Implementation Decisions cover the empty ephemeral draft plus edit, discard, replace, accept, and confirmation outcomes.
- validation, warning, error, and recovery behavior: the User Stories and Testing Decisions cover loss warnings, transactional migration, rollback, idempotence, and fail-closed project opening.
- prompt preview contents and freshness: the Problem Statement and Solution make deterministic prompt-preview readiness the sole prerequisite and preserve prompt boundaries.
- user-initiated external LLM boundary: the Solution and User Stories state that the manual path makes no OpenRouter call.
- canon and prose boundary visibility: the Implementation Decisions and Out of Scope sections state that accepted prose remains output and never becomes prompt or canon authority.
- persistence, migration, export, and provenance: the Implementation Decisions define the provenance union, transactional migration, archive/export fidelity, and the prohibition on invented provider fields.
- browser and accessibility regression scenario: the User Stories and Testing Decisions require named controls, focus behavior, non-pointer operation, and a localhost production-browser check.

Seam confirmation: confirmed for the Candidate component; accepted route; project-open migration; archive/export component; localhost production browser; and root gates.
