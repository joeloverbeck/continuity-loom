This is the second issue in the explicitly ratified two-PRD program. The product scope, publication order, `bug` type, `ready-for-agent` posture, and named testing seams were all confirmed in the frozen program receipt; this simulated body has not been published and is independently implementable from the first issue.

## Problem Statement

Prompt-facing compiler surfaces currently inherit compact browse labels and therefore truncate record identity where the model needs the complete label. The defect affects Prose ordering, grounded Ideation, Record Hygiene, Segment Reconciliation, references, and stubs. Recovering missing text from accepted prose or hidden state would violate source authority and determinism rather than fix the projection.

## Solution

Keep compact labels in browse UI while projecting complete prompt-facing labels from complete record payloads in pure core code. Apply that projection consistently to every named compiler surface, including references and stubs. Compilation remains deterministic and validation remains fail-closed; accepted prose and hidden state are never label sources.

## User Stories

1. As an author, I want prompt-facing records to retain their complete labels, so that generated prose can distinguish records without browse-oriented truncation
2. As an author, I want browse lists to keep compact labels, so that fixing model context does not make the browsing interface harder to scan
3. As an author, I want Prose ordering and grounded Ideation to use the same complete label projection, so that ordering and ideation prompts describe records consistently
4. As an author, I want Record Hygiene and Segment Reconciliation to use complete labels, so that maintenance prompts do not act on ambiguous truncated identities
5. As an author, I want references and stubs to preserve complete labels, so that every prompt-facing representation follows one deterministic rule
6. As a project owner, I want labels derived only from complete record payloads, so that accepted prose and hidden state never become substitute authority
7. As an author inspecting a prompt, I want the full projected labels shown accessibly, so that I can verify the exact context before any external-model call
8. As an implementer, I want invalid or incomplete prompt projections to fail closed, so that compiler defects cannot silently emit misleading context
9. As a maintainer, I want deterministic projection and compiler regression gates, so that future prompt surfaces cannot reintroduce browse truncation

## Implementation Decisions

- Browse UI labels remain compact; only prompt-facing compiler projections change.
- One pure-core label projection derives the complete prompt-facing label from the complete record payload.
- Prose ordering, grounded Ideation, Record Hygiene, Segment Reconciliation, references, and stubs all consume the complete projection.
- Accepted prose and hidden state are not fallback label sources and cannot be used to reconstruct truncated text.
- Compiler output remains deterministic for identical authoritative inputs, including ordering and serialization.
- Missing or invalid authoritative label data fails closed through existing validation behavior rather than falling back to compact or inferred text.

## Testing Decisions

Tests assert the emitted and inspected prompt behavior rather than private helper structure. The tested surfaces are a pure label-projection matrix and compiler goldens, route compile behavior, prompt inspector and UI behavior, the localhost production browser, and repository root quality gates. The matrix covers all relevant record kinds and boundary payloads; goldens cover Prose ordering, grounded Ideation, Record Hygiene, Segment Reconciliation, references, and stubs; route and browser checks prove complete prompt labels, unchanged compact browse labels, accessible inspection, deterministic recompilation, and fail-closed invalid inputs. No same-kind published exemplar was supplied in this isolated simulation, so the candidate PRD body contract is the descriptive prior-art fallback.

Seam confirmation: confirmed for the pure label projection matrix and compiler goldens; route compile tests; prompt inspector/UI checks; localhost production browser; and root gates.

## Principles

The implementation must follow `docs/FOUNDATIONS.md`, including deterministic compilation, authoritative story-state inputs, accepted-prose exclusion, fail-closed validation, localhost-only serving, and the Section 29 alignment checklist. `docs/compiler-contract.md` and `docs/prompt-template.md` govern prompt-facing projections, while `docs/validation-rule-inventory.md` governs hard-fail behavior. No exception to these authorities is authorized; any discovered conflict must be resolved before implementation proceeds.

## Out of Scope

- Expanding compact browse UI labels.
- Recovering complete labels from accepted prose, generated candidates, or hidden state.
- Changing record payload authority or introducing a duplicate label store.
- Weakening deterministic output or fail-closed validation.
- Implementing User-Supplied Candidate Intake in this issue; that is the first independently implementable PRD in the ratified program.

## Further Notes

This issue is second by program priority. It has no technical dependency on the first issue and may be implemented independently. The issue title is `PRD: Prompt-Facing Full Labels — Complete Deterministic Compiler Labels`; its labels are `bug` and `ready-for-agent`. After simulated numbers exist, the same exact sequence comment is associated with both program issues. The frozen program description is summarized as the ratification receipt and is not cited as a machine-local source.

### Browser-visible guidance checklist mapping

- entry point and availability: the Solution and Implementation Decisions distinguish unchanged compact browse labels from complete labels on every prompt-facing surface.
- user-visible states, actions, and outcomes: the User Stories and Testing Decisions cover unchanged browsing plus complete prompt-inspection output across all named compiler modes.
- validation, warning, error, and recovery behavior: the Implementation Decisions and Testing Decisions require invalid prompt-facing projections to fail closed without inferred or compact fallback.
- prompt preview contents and freshness: the User Stories and Testing Decisions require the inspected prompt to expose complete labels derived deterministically from the current complete record payloads.
- user-initiated external LLM boundary: the Solution and Testing Decisions keep the prompt inspector preview-only and make no OpenRouter call; any external LLM request remains an explicit user action.
- canon and prose boundary visibility: the Implementation Decisions explicitly prohibit accepted prose and hidden state as label sources; candidate and acceptance behavior is otherwise unchanged.
- persistence, migration, export, and provenance: N/A - this PRD changes a pure prompt-facing projection and neither changes stored records nor requires migration, export, or provenance changes.
- browser and accessibility regression scenario: the User Stories and Testing Decisions require complete labels to remain inspectable with accessible names and navigation in the localhost production browser.

Seam confirmation: confirmed for the pure label projection matrix and compiler goldens; route compile tests; prompt inspector/UI checks; localhost production browser; and root gates.
