This PRD is the single enhancement selected and ratified in the Author-Focused Ideation package supplied in this session. The product decisions, publication package, and testing seams are settled; there are no deferred decisions or follow-on PRDs in this package.

## Problem Statement

Grounded Ideation gives an author no bounded, reproducible way to state what kind of possibility they want next. The author must either accept a generic six-slot slate or edit the compiled prompt outside the application. External prompt editing breaks the relationship between the previewed request and the sent request, bypasses the application's validation, and makes the result difficult to reproduce.

Authors need a small amount of influence over the next slate without turning that influence into canon, changing the Ideation taxonomy, or introducing another hidden continuity source.

## Solution

Add an optional, session-only `Author focus` field to Ideate. The field accepts at most 500 characters after deterministic normalization and tells Ideation what to emphasize within the existing six slots. Blank normalized input is omission. Over-limit input is rejected before any model request is sent.

The compiler renders a nonblank value exactly once in a clearly delimited `AUTHOR FOCUS` section after grounded source material and before output instructions. Delimiter-like text in the value is escaped so it remains data inside that section and cannot create another prompt section or change the output contract. The normalized presence and value participate in the request fingerprint, so preview/send mismatches fail closed.

The focus remains available for regeneration while the same Ideate view stays mounted, but navigation or remount clears it. The interface explains that the focus applies to the next slate only and does not become canon. The value is never persisted, logged, exported, copied into accepted metadata, or turned into a story record, accepted prose, or another continuity source.

## User Stories

1. As an author, I want to optionally describe what kind of possibility I want next, so that the Ideation slate can respond to my immediate creative intent
2. As an author, I want the focus field to be visibly optional, so that I can continue to request the existing generic slate without supplying extra context
3. As an author, I want blank focus text to behave exactly like omission, so that incidental whitespace does not change the request
4. As an author, I want line endings and surrounding whitespace normalized deterministically, so that equivalent input produces equivalent prompt context
5. As an author, I want a clear 500-character limit and accessible count feedback, so that I can correct an over-limit focus before sending
6. As an author, I want over-limit input rejected before model transport begins, so that invalid requests do not consume a generation attempt
7. As an author, I want the preview to show the normalized focus in its final prompt position, so that I can inspect exactly what the next request will use
8. As an author, I want edits to the focus reflected in preview freshness, so that a send cannot silently use a different focus from the one I reviewed
9. As an author, I want focus text that resembles prompt delimiters to remain ordinary text, so that my wording cannot create a second section or override output instructions
10. As an author, I want the focus rendered after grounded source material, so that grounded continuity remains the basis of Ideation
11. As an author, I want the focus rendered before output instructions, so that the six-slot output contract remains authoritative
12. As an author, I want the same six Ideation slots and assignment rules with or without a focus, so that focus steers content rather than changing the product's ideation model
13. As an author, I want a focus to influence possibilities within every applicable slot, so that the slate is directed without letting me add, remove, rename, or preselect slots
14. As an author, I want the focus retained when I regenerate in the same mounted session, so that I can explore another slate without retyping it
15. As an author, I want navigation or remount to clear the focus, so that an old request preference does not leak into a later Ideation session
16. As an author, I want copy explaining that the focus applies to the next slate only, so that I do not mistake it for a lasting project instruction
17. As an author, I want copy explaining that the focus does not become canon, so that I understand the boundary between request context and story truth
18. As an author, I want omitted and blank focus states to preserve current Ideation behavior, so that the enhancement does not disturb my existing workflow
19. As an author, I want stale preview/send combinations to fail closed, so that every transported request corresponds to the request I inspected
20. As a privacy-conscious author, I want focus text excluded from project and browser storage, so that a transient creative direction does not become stored project data
21. As a privacy-conscious author, I want focus text excluded from logs, accepted metadata, records, and exports, so that transient request context cannot surface later as durable information
22. As a maintainer, I want the server to reconstruct and validate the normalized focus before transport, so that a caller cannot bypass the same limit and fingerprint rules enforced by the interface
23. As a maintainer, I want focus behavior covered at the pure compiler, route, component, and production-browser seams, so that regressions are caught at the highest useful boundary

## Implementation Decisions

- The existing Ideation request contract gains one optional author-focus value. It is request context only and is not part of canon, accepted prose, accepted metadata, the story-record model, or any other continuity input.
- Normalization is deterministic: normalize line endings first, remove surrounding whitespace, treat the resulting blank value as omitted, and apply the 500-character limit to the normalized result.
- Validation completes before external-model transport. An over-limit value is a hard request failure and must result in zero transport.
- The prompt compiler emits a nonblank value exactly once under the `AUTHOR FOCUS` delimiter. That section sits after all grounded source material and before output instructions.
- Author-supplied delimiter-like content is escaped within the focus payload. It cannot terminate the focus section, create an additional section, inject output instructions, or otherwise change the prompt contract.
- The request fingerprint includes both normalized presence and normalized value. Blank and omitted values share omission behavior, while any meaningful focus change invalidates an older preview or send fingerprint.
- The six-slot Ideation taxonomy and its assignment rules remain unchanged. Focus may steer the content proposed inside slots but cannot add, remove, rename, select, reorder, or reassign slots.
- Ideate owns the value only for the lifetime of its current mounted session. Regeneration reuses the current value; navigation or remount starts with no value.
- The interface provides an accessible label, optional-state cue, normalized-length feedback, limit feedback, and explicit next-slate/non-canon guidance. It does not imply that focus is saved as a project preference.
- The focus value must never be written to project storage, browser storage, logs, records, accepted metadata, or exports. Accepting an Ideation result does not copy the focus into accepted state.
- Existing preview and send reconstruction remain deterministic. The server independently applies the request contract and does not trust a client-only length or freshness check.

### Browser-visible guidance checklist mapping

| Browser-visible concern | PRD home |
|---|---|
| User-facing purpose and benefit | Problem Statement, Solution, and User Stories 1-2 |
| Visible field state, character feedback, and limit behavior | Solution, User Stories 3-6, and Implementation Decisions |
| Preview and send consistency | Solution, User Stories 7-8 and 19, and Testing Decisions |
| Prompt-injection-safe treatment of entered text | Solution, User Story 9, and Implementation Decisions |
| Existing workflow and six-slot behavior | User Stories 10-13 and 18, and Implementation Decisions |
| Regeneration, navigation, and remount lifecycle | Solution, User Stories 14-15, and Testing Decisions |
| Author-facing next-slate and non-canon guidance | Solution, User Stories 16-17, and Implementation Decisions |
| Accessibility | User Story 5 and the Ideate component seam in Testing Decisions |
| Privacy and local-first ownership | User Stories 20-21, Implementation Decisions, and Principles |
| Production-browser verification | Production localhost browser smoke in Testing Decisions |

## Testing Decisions

- Tests assert externally observable request, prompt, transport, UI, and lifecycle behavior rather than private helpers or component internals.
- The pure core Ideation request and rendering seam receives normalization, exact-section-placement, escaping, blank/omitted, request-fingerprint, and golden prompt coverage. The golden assertions prove that the existing six slot names, count, order, and assignment rules remain unchanged.
- The existing server Ideation compile/send route seam receives coverage for over-limit rejection, deterministic reconstruction, stale fingerprint failure, and zero external-model transport before validation succeeds.
- The Ideate component seam receives accessible-name and description coverage, count and limit feedback, preview freshness behavior, next-slate/non-canon wording, focus retention across regeneration, and reset on navigation-driven remount.
- A production localhost browser smoke covers entering a focus, inspecting its preview placement, sending, regenerating with the retained value, and navigating away and back to prove remount reset.
- Root lint, typecheck, test, and build commands remain required completion gates.
- Prior art is the core compiler's deterministic prompt golden tests, the server's Ideation compile/send route tests, the web package's accessible Ideate component tests, and the production localhost browser smoke suite.
- Seam confirmation: answered in this session; the pure core request/rendering seam, existing server Ideation compile/send route seam, Ideate component seam, production localhost browser smoke seam, and root quality gates are ratified.

## Principles

This enhancement must conform to `docs/FOUNDATIONS.md`, including its Section 29 alignment checklist, and to the active prompt and data authorities in `docs/compiler-contract.md`, `docs/prompt-template.md`, `docs/prompt-template-rationale.md`, `docs/story-record-schema.md`, `docs/validation-rule-inventory.md`, and `docs/user-guide.md`.

The design preserves deterministic compilation, grounded-source authority, fail-closed validation, localhost-only model invocation, local-first project ownership, and the boundary that prevents non-canon or unaccepted text from becoming continuity context. It introduces no deliberate exception or contradiction. Any implementation discovery that would require such an exception must be raised to the project steward before implementation continues.

## Out of Scope

- Changing the six-slot Ideation taxonomy, slot count, slot names, order, assignment rules, or output contract
- Letting focus select slots or replace grounded continuity as the source of Ideation
- Persisting focus as canon, a story record, accepted prose, accepted metadata, a project preference, or browser state
- Adding focus to logs, exports, analytics, or any durable history
- Adding a general-purpose prompt editor or exposing arbitrary output-instruction editing
- Applying author focus to workflows other than Ideation
- Changing story-record schema or accepted-segment behavior
- Creating additional PRDs or follow-on issues from this package

## Further Notes

The publication package is one enhancement PRD. With the settled product decisions and testing seams represented above, the intended publication labels are `enhancement` and `ready-for-agent` after staged-body validation and the repository's publication checks.

Focus applying to the "next slate" describes its request-context boundary, not automatic clearing after a successful send: regeneration in the same mounted Ideate session intentionally retains the current value, while navigation or remount clears it.

Seam confirmation: answered in this session; all five named testing seams and the single-PRD publication package are ratified, with no decision open to veto.
