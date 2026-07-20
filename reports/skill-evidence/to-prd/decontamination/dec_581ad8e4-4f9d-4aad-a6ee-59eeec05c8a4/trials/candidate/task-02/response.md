Prepared the ratified one-issue publication package. The seam checkpoint is already satisfied by the supplied receipt, so no further question is owed. No GitHub read or write was performed in this simulation.

Title: `PRD: Author-Focused Ideation — bounded request context and deterministic prompt placement`

Labels: `enhancement`, `ready-for-agent`

Body:

This PRD synthesizes the ratified Author-Focused Ideation package as one standalone enhancement. The product decisions and the pure-core compiler, existing server route, Ideate UI, production localhost browser, and root quality-gate seams are explicitly confirmed.

## Problem Statement

Grounded Ideation has no bounded, reproducible way for an author to state what kind of possibility they want next. Authors must accept a generic six-slot slate or edit the compiled prompt outside Continuity Loom, bypassing the deterministic request path and making the result impossible to reproduce from the in-app request.

## Solution

Add an optional `Author focus` field to Ideate. The field supplies bounded request context for the next slate only. Continuity Loom deterministically normalizes and validates the value, includes its normalized presence and value in preview/send fingerprinting, and renders a single escaped `AUTHOR FOCUS` section after grounded source material and before output instructions. The focus can steer content within the existing six Ideation slots but cannot change their taxonomy or assignment. It survives regeneration only while the Ideate surface remains mounted and is never persisted or promoted to canon.

## User Stories

1. As an author, I want to optionally describe what kind of possibility I want next, so that the next grounded Ideation slate responds to my immediate creative intent
2. As an author, I want blank focus input to behave exactly like omission, so that incidental whitespace does not alter my request
3. As an author, I want focus input normalized and limited to 500 characters before send, so that the request remains bounded and predictable
4. As an author, I want an over-limit focus rejected before any model transport occurs, so that invalid input cannot incur a request or produce an unreviewed slate
5. As an author, I want the focus shown in a fresh prompt preview before send, so that I can inspect the exact bounded context the model will receive
6. As an author, I want delimiter-like text treated as inert focus content, so that my words cannot create another prompt section or alter the output contract
7. As an author, I want focus to steer content without changing the six-slot taxonomy or slot assignments, so that every returned slate preserves the established Ideation contract
8. As an author, I want focus retained when I regenerate in the current Ideate session, so that I can request another slate with the same immediate direction
9. As an author, I want focus cleared when I navigate away or remount Ideate, so that session-only intent does not leak into a later visit
10. As an author, I want clear accessible copy that focus applies only to the next slate and does not become canon, so that I understand its scope before sending
11. As a project owner, I want author focus excluded from project storage and browser storage, so that temporary request context never becomes durable story state
12. As a project owner, I want author focus excluded from logs and accepted metadata and records and exports, so that temporary intent cannot become a hidden continuity source
13. As a maintainer, I want preview and send to use the same normalized focus fingerprint, so that a stale or reconstructed request fails closed instead of sending different context

## Implementation Decisions

- `Author focus` is optional and session-only. It is request context, not canon, a story record, accepted prose, accepted metadata, or a continuity source.
- One shared pure-core contract normalizes line endings and surrounding whitespace deterministically before all other decisions. A normalized blank value is omission. The normalized value has a maximum of 500 characters, and UI and server enforcement use the same core rule.
- Over-limit input is rejected before send. Server reconstruction and validation happen before model transport, with zero transport on any validation or stale-fingerprint failure.
- When present, the core renderer emits the normalized value exactly once in a clearly delimited `AUTHOR FOCUS` section. That section follows all grounded source material and precedes output instructions.
- Delimiter-significant content is deterministically escaped as inert text before rendering. Author input cannot create a second section, terminate the focus section, inject instructions outside it, or alter the output contract.
- The request fingerprint includes normalized focus presence and normalized value. Preview/send divergence, including a focus edit after preview, fails closed and requires a fresh preview.
- The existing six-slot Ideation taxonomy and assignment rules remain authoritative. Focus may influence the content proposed within assigned slots but cannot add, remove, rename, select, reorder, or reassign slots.
- Ideate owns the field as mounted component state. Regeneration reuses it within the same mount; navigation away, remount, and a new Ideate session reset it.
- No code path writes focus to project storage, browser storage, logs, accepted metadata, story records, accepted prose, or exports.
- The field has an accessible name, an associated count and limit state, and author-facing copy stating that it applies to the next slate only and does not become canon.

## Testing Decisions

Tests assert externally observable request, rendering, validation, lifecycle, and author-facing behavior at existing seams:

- Pure core request/rendering and golden tests cover deterministic line-ending and surrounding-whitespace normalization, blank-as-omission behavior, the 500-character boundary, exact `AUTHOR FOCUS` section multiplicity and placement, delimiter escaping, normalized presence/value fingerprinting, and unchanged six-slot taxonomy and assignments.
- Existing server Ideation compile/send route tests cover reconstruction from normalized input, matching and stale fingerprints, over-limit rejection, and proof that no model transport occurs before validation succeeds.
- Ideate component tests cover accessible labeling and limit feedback, author-visible next-slate/non-canon wording, preview freshness after edits, send availability, regeneration retention, and navigation/remount reset.
- A production localhost browser smoke covers entering focus, previewing the exact request, sending, regenerating with retained focus, and navigating/remounting to observe reset.
- Root lint, typecheck, test, and build gates must pass.

Same-kind prior art is the existing deterministic Ideation request compilation, preview/send freshness, six-slot rendering, and production localhost smoke behavior; this enhancement extends those surfaces without introducing a parallel request path.

Seam confirmation: ratified pure core request/rendering and golden tests; existing server Ideation compile/send route tests; Ideate component tests; production localhost browser smoke; and root lint, typecheck, test, and build gates.

## Principles

- `docs/FOUNDATIONS.md` governs deterministic prompt compilation, validation, accepted-prose boundaries, local-first ownership, API-key secrecy, and localhost-only serving. Author focus must travel only through the deterministic request path, validation must fail closed before transport, and temporary focus must never enter accepted or durable story context.
- `docs/compiler-contract.md`, `docs/prompt-template.md`, and `docs/prompt-template-rationale.md` govern prompt structure and placement. The new section is singular, delimited, escaped, and positioned between grounded sources and output instructions without changing the output contract.
- `docs/story-record-schema.md` governs durable record shape. This PRD adds no record field and no migration.
- `docs/validation-rule-inventory.md` governs the shared rejection boundary, including the normalized limit and stale-fingerprint failures.
- `docs/user-guide.md` must describe the visible field as next-slate-only and non-canonical.
- Section 29 of `docs/FOUNDATIONS.md` applies to implementation and acceptance. No deliberate exception to an active authority is authorized by this PRD, and no new ADR is required because the change preserves the existing compiler, route, storage, and accepted-prose boundaries.

## Out of Scope

- Changing, selecting, adding, removing, renaming, reordering, or reassigning the six Ideation slots.
- Persisting focus across navigation, remounts, application restarts, or devices.
- Saving focus in project files, story records, canon, accepted prose, accepted metadata, browser storage, logs, analytics, or exports.
- Reusing focus for accepted-segment compilation or any generation workflow other than the next Ideation slate.
- Allowing author focus to modify output instructions or the output contract.
- Adding a second compiler, route, or hidden continuity path.

## Further Notes

The source package is fully ratified and selects one enhancement PRD with no deferred program entries or open product decisions. The title is `PRD: Author-Focused Ideation — bounded request context and deterministic prompt placement`; the intended labels are `enhancement` and `ready-for-agent` after body validation. In this analysis-only simulation, the publication body is prepared and validated without querying or writing the tracker.

### Browser-visible guidance checklist mapping

- **entry point and availability:** The optional `Author focus` control is present on Ideate whenever the existing Ideation request surface is available; Solution and Implementation Decisions keep it inside that existing entry point rather than creating a second flow.
- **user-visible states, actions, and outcomes:** User Stories 1 through 5 and 8 through 10 cover blank, within-limit, over-limit, edited-after-preview, send, regenerate, and remount states; the visible outcome is either a validated six-slot slate or a blocked request requiring correction or a fresh preview.
- **validation, warning, error, and recovery behavior:** User Stories 3, 4, and 13 plus Implementation Decisions require count/limit feedback, fail-closed over-limit and stale-fingerprint errors, zero transport on failure, and recovery through corrected input and a fresh preview.
- **prompt preview contents and freshness:** User Story 5 and Testing Decisions require preview of the exact normalized and escaped focus section, and fingerprint checks invalidate a preview after any normalized presence/value change.
- **user-initiated external LLM boundary:** User Stories 3 through 5 and Implementation Decisions require the author to preview and explicitly send; validation and fingerprint agreement complete before any model transport.
- **canon and prose boundary visibility:** User Stories 7, 10, and 12 plus Implementation Decisions preserve the six-slot candidate contract and require visible next-slate/non-canon copy while excluding focus from accepted prose, accepted metadata, and records.
- **persistence, migration, export, and provenance:** User Stories 8, 9, 11, and 12 require same-mount regeneration retention, navigation/remount reset, no storage or export, and no schema migration; the request fingerprint records normalized request identity without making focus durable story provenance.
- **browser and accessibility regression scenario:** User Story 10 and Testing Decisions require an accessible name, associated count/limit state, next-slate/non-canon guidance, component coverage, and a production localhost browser smoke spanning enter, preview, send, regenerate retention, and remount reset.

Seam confirmation: ratified pure core request/rendering and golden tests; existing server Ideation compile/send route tests; Ideate component tests; production localhost browser smoke; and root lint, typecheck, test, and build gates.

Validation result: pass with all eight browser-visible checklist items mapped, 13 conforming user stories, both seam markers present, only approved durable local authorities cited, and no unresolved ADR shorthand. The exact-title duplicate guard, label existence read, issue creation, and published readback were intentionally not run because this task forbids network and tracker access.
