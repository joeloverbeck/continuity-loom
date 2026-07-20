This PRD is the second issue in the user-ratified two-PRD program. The user ratified this scope, its testing seams, the publication order, and its `bug` plus `ready-for-agent` label posture; it follows the candidate-intake issue as a priority choice and remains independently implementable.

## Problem Statement

Prompt-facing compiler surfaces can receive browse-oriented truncated labels instead of the complete labels stored in story records. That makes prompts less precise and can produce inconsistent grounding across Prose, Ideation, Record Hygiene, Segment Reconciliation, references, and stubs, even though compact labels remain useful in the browsing interface.

## Solution

Every prompt-facing compiler surface derives full labels from complete record payloads in pure core logic, while compact browse UI labels remain unchanged. The compiler never reconstructs a label from accepted prose or hidden state, preserves deterministic ordering and output, and fails closed when complete prompt-facing projection cannot be validated.

## User Stories

1. As an author, I want prompt-facing references to use full labels, so that generated prose receives unambiguous story context
2. As an author, I want the browse interface to retain compact labels, so that scanning records remains efficient
3. As an author, I want Prose prompts to use full labels in deterministic order, so that prose generation receives stable context
4. As an author using grounded Ideation, I want complete labels in its prompt context, so that suggestions remain tied to the intended records
5. As an author running Record Hygiene, I want complete labels in its prompt context, so that recommendations identify records without truncated ambiguity
6. As an author reconciling a segment, I want complete labels in the Segment Reconciliation prompt, so that proposed changes point to the correct story state
7. As an author, I want references and stubs to use the same full-label rule, so that every prompt-facing representation is consistent
8. As an author, I want full labels derived only from complete record payloads, so that compiler output does not depend on accepted prose or hidden UI state
9. As an author, I want malformed or incomplete prompt-facing projection to fail closed, so that the app does not silently compile misleading context
10. As an author, I want repeated compilation of the same records to be byte-stable, so that previews, invocations, and tests agree
11. As an author, I want prompt inspection to show the same full labels sent for generation, so that I can understand the model's actual context
12. As an author using the production app, I want the fix verified on localhost, so that the shipped prompt preview and generation flow use complete labels
13. As a maintainer, I want a projection matrix across record and prompt-surface variants, so that a future compiler surface cannot accidentally inherit browse truncation

## Implementation Decisions

- Browse labels and prompt-facing labels are distinct projections with distinct purposes. Existing compact browse UI labels remain unchanged.
- Pure core logic derives prompt-facing full labels directly from complete record payloads. Browser state, accepted prose, and other hidden state are not fallback data sources.
- The full-label projection applies uniformly to Prose ordering, grounded Ideation, Record Hygiene, Segment Reconciliation, references, and stubs.
- Prompt-facing references and stubs consume the same projection contract as full records so truncation cannot re-enter through a secondary representation.
- Compilation preserves deterministic ordering and byte-stable output for identical inputs.
- Missing or invalid data required for a full prompt-facing label is a validation failure. The compiler fails closed rather than substituting a compact label or synthesizing text from prose.
- Prompt inspection renders the compiled prompt-facing value, ensuring the visible inspection surface matches the context used by generation.
- The program order is priority only. This issue can begin and complete independently of the user-supplied candidate-intake issue, so it has no predecessor-based label-flip condition.

## Testing Decisions

- Tests assert compiled prompt text, validation outcomes, route responses, and browser-visible inspection rather than private projection helpers.
- A pure label-projection matrix covers complete records, references, stubs, record variants, long labels, and invalid or missing label data.
- Compiler golden tests cover Prose ordering, grounded Ideation, Record Hygiene, Segment Reconciliation, references, and stubs, including deterministic repeated compilation.
- Route compile tests verify that API consumers receive the same full prompt-facing labels and fail-closed validation behavior exposed by core compilation.
- Prompt inspector and UI checks prove that compact browse labels remain compact while prompt inspection displays full compiled labels.
- Existing pure-core projection matrices, compiler golden suites, compile-route integration tests, prompt-inspector component checks, localhost production-browser checks, and root lint/typecheck/test/build gates are the prior-art test shapes.
- The localhost production-browser check compares a compact browse label with its full prompt-inspector representation and verifies the generation path uses the inspected compiled prompt.
- Seam confirmation: answered; the user ratified the pure label projection matrix and compiler goldens, route compile tests, prompt inspector/UI checks, localhost production browser, and root gates.

## Principles

This PRD conforms to `docs/FOUNDATIONS.md`, including deterministic prompt compilation, validation that fails closed, accepted-prose boundaries, localhost-only serving, and the section 29 alignment checklist. It also conforms to `docs/compiler-contract.md`, `docs/prompt-template.md`, `docs/validation-rule-inventory.md`, and `docs/user-guide.md`. No deliberate exception is proposed; any implementation conflict must be raised to the project steward before implementation proceeds.

Browser-visible guidance checklist mapping

| Guidance concern | PRD home |
|---|---|
| User-visible browse and prompt-inspection behavior | Problem Statement; Solution; User Stories 1-2 and 11 |
| Prompt content and deterministic compilation | User Stories 3-10; Implementation Decisions; Testing Decisions |
| External-model context inspection | Solution; User Stories 11-12; Implementation Decisions; Testing Decisions |
| Validation, failure, and recovery behavior | User Story 9; Implementation Decisions; Testing Decisions |
| Accepted-output and hidden-state boundaries | User Story 8; Implementation Decisions; Principles |
| Browser and production verification | User Story 12; Testing Decisions |

## Out of Scope

- Changing compact labels in browse lists, record navigation, or other non-prompt UI surfaces.
- Adding user-supplied candidate intake or changing candidate provenance; that is the first program PRD.
- Recovering full labels from accepted prose, generated candidates, cached display strings, or hidden browser state.
- Reordering prompt sections or changing prompt-template semantics beyond replacing truncated prompt-facing labels with their complete projections.

## Further Notes

The publication label decision is `bug` plus `ready-for-agent`: the scope, implementation direction, testing seams, and label posture are ratified, and no open-to-veto decision remains.

The issue is second in a two-PRD priority sequence. Its position communicates publication priority only and does not block implementation on the first issue. After both simulated issue numbers exist, the same verified sequence comment names both issues and records this independence.

Seam confirmation: answered; the user ratified the pure label projection matrix and compiler goldens, route compile tests, prompt inspector/UI checks, localhost production browser, and root gates.
