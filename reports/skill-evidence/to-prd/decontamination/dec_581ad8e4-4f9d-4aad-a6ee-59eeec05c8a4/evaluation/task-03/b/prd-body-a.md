This PRD is the first issue in the user-ratified two-PRD program. The user ratified this scope, its testing seams, the publication order, and its `enhancement` plus `ready-for-agent` label posture; it is ordered first to unblock external trial prose, not because the second PRD depends on it.

## Problem Statement

Authors can generate a candidate through OpenRouter, but they cannot bring prose drafted elsewhere into the same candidate review and acceptance flow. That limitation makes external trials awkward and risks encouraging workarounds that confuse prompt readiness with provider readiness, invent provider metadata, or let accepted prose leak back into prompt context.

## Solution

When deterministic prompt preview is ready, authors can choose **Write or paste candidate** to begin one empty, ephemeral user-supplied Draft Candidate without making an OpenRouter call. User-supplied and generated candidates then use the same editing, loss-prevention, discard, replacement, and acceptance behavior. Accepted segments retain truthful discriminated provenance, existing projects migrate safely, and accepted prose remains output rather than prompt or canon authority.

## User Stories

1. As an author, I want the manual candidate action to appear when deterministic prompt preview is ready, so that I can draft without waiting for provider readiness
2. As an author, I want the manual candidate action to start one empty draft, so that I have a clear place to write or paste prose
3. As an author, I want starting a manual draft to avoid an OpenRouter request, so that local drafting remains local and predictable
4. As an author, I want generated and user-supplied candidates to share editing behavior, so that candidate origin does not change the editing experience
5. As an author, I want generated and user-supplied candidates to share discard, replacement, and acceptance behavior, so that I learn one candidate workflow
6. As an author, I want confirmation before a non-empty draft is refreshed or replaced, so that I do not lose prose accidentally
7. As an author, I want empty drafts to be replaceable without unnecessary confirmation, so that routine navigation stays efficient
8. As an author, I want accepted user-supplied prose to record truthful source provenance, so that project history never implies a provider generated my text
9. As an author, I want accepted OpenRouter prose to retain the actual provider, model, and settings, so that generated-segment provenance remains auditable
10. As an author, I want applicable compiler versions retained for accepted user-supplied prose, so that the prompt context present at drafting time remains traceable
11. As an author, I want existing accepted rows upgraded safely when I open a project, so that older projects use the explicit OpenRouter provenance shape without manual repair
12. As an author, I want a failed provenance migration to leave my project intact and stop opening it, so that partial migration cannot corrupt local story data
13. As an author, I want archives and exports to preserve the provenance distinction, so that restored or shared project data remains truthful
14. As an author, I want accepted prose excluded from prompt and canon authority, so that acceptance cannot create hidden recursive context
15. As an author using the production app, I want the complete manual-candidate flow to work on localhost, so that the shipped experience matches development behavior

## Implementation Decisions

- The **Write or paste candidate** action is gated by deterministic prompt-preview readiness. Provider readiness does not gate it.
- Starting the action creates exactly one empty, ephemeral user-supplied Draft Candidate and performs no OpenRouter invocation.
- Candidate editing, discard, replacement, and acceptance rules are origin-neutral. Any refresh or replacement that would overwrite a non-empty draft requires an explicit loss-prevention confirmation.
- Accepted-segment provenance is one discriminated union. The OpenRouter variant stores the actual provider, model, generation settings, and applicable compiler versions. The user-supplied variant stores its source and applicable compiler versions and has no provider, model, or generation-setting fields.
- Project-open migration converts legacy accepted rows to explicit OpenRouter provenance transactionally and idempotently. A migration failure preserves the pre-migration project and aborts opening rather than exposing a partial state.
- Archive and export representations preserve the same provenance union so round trips do not erase or fabricate origin data.
- Accepted prose is an output artifact only. Neither accepted prose nor an automatic summary derived from it becomes prompt context or canon authority.
- The program order is priority only. This issue can be implemented without the prompt-facing full-label issue, and it creates no label-flip condition for that issue.

## Testing Decisions

- Tests assert externally observable state transitions, persistence, compiled context, and browser behavior rather than private helpers.
- The Candidate component is tested for readiness gating, single empty-draft creation, origin-neutral editing, destructive replacement confirmation, discard, and acceptance.
- Accepted-route tests verify both provenance variants, truthful omission of provider-only fields, and the continued exclusion of accepted prose from future prompt context.
- Project-open migration tests cover legacy conversion, idempotent reopen, transactional rollback, and open failure without mutation.
- Archive/export component tests cover round-trip preservation of both provenance variants.
- Existing candidate-flow component tests, accepted-route integration tests, migration rollback tests, archive round-trip tests, localhost production-browser checks, and root lint/typecheck/test/build gates are the prior-art test shapes.
- The localhost production-browser check exercises the visible action, manual entry, loss-prevention confirmation, acceptance, and a subsequent prompt preview without making an external-model request.
- Seam confirmation: answered; the user ratified the Candidate component, accepted route, project-open migration, archive/export component, localhost production browser, and root gates.

## Principles

This PRD conforms to `docs/FOUNDATIONS.md`, including local-first ownership, deterministic compilation, accepted-prose boundaries, API-key secrecy, localhost-only serving, and the section 29 alignment checklist. It also conforms to `docs/compiler-contract.md`, `docs/story-record-schema.md`, `docs/validation-rule-inventory.md`, and `docs/user-guide.md`. No deliberate exception is proposed; any implementation conflict must be raised to the project steward before implementation proceeds.

Browser-visible guidance checklist mapping

| Guidance concern | PRD home |
|---|---|
| User-visible entry point and readiness | Solution; User Stories 1-3; Implementation Decisions |
| Candidate lifecycle, destructive actions, and recovery | User Stories 4-7; Implementation Decisions; Testing Decisions |
| External-model invocation and local-only behavior | Solution; User Story 3; Implementation Decisions; Testing Decisions |
| Candidate acceptance and persisted provenance | User Stories 8-13; Implementation Decisions; Testing Decisions |
| Prompt-context and accepted-output boundary | User Story 14; Implementation Decisions; Principles |
| Browser and production verification | User Story 15; Testing Decisions |

## Out of Scope

- Changing prompt-facing label projection or browse-label truncation; that is the second program PRD.
- Adding another provider, changing OpenRouter generation behavior, or making provider readiness part of manual drafting.
- Promoting accepted prose or prose-derived summaries into prompt context or canon authority.
- Introducing multiple simultaneous Draft Candidates or durable storage for unaccepted candidate prose.

## Further Notes

The publication label decision is `enhancement` plus `ready-for-agent`: the scope, implementation direction, testing seams, and label posture are ratified, and no open-to-veto decision remains.

The issue is first in a two-PRD priority sequence because it unblocks external trial prose. After both simulated issue numbers exist, the same verified sequence comment names both issues and records that neither technically depends on the other.

Seam confirmation: answered; the user ratified the Candidate component, accepted route, project-open migration, archive/export component, localhost production browser, and root gates.
