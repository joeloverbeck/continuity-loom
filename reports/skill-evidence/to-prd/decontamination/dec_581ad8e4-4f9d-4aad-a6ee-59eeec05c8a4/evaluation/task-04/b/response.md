The publication-ready PRD is below. I did not write to GitHub or make any tracker change.

Title: `PRD: Cast Member Dossier Draft Import — Static Prompt and Safe Field Mapping`

Labels: `enhancement`, `ready-for-agent`

Body:

This PRD synthesizes the ratified Cast Member dossier draft-import direction from a temporary local preparation artifact. The requested package is one enhancement PRD, all product decisions are settled, and the named testing seams are confirmed. The temporary source is summarized, not cited.

## Problem Statement

The Cast Member editor exposes a large, structured dossier schema, but authors have no bounded way to use an external LLM to draft that dossier and safely bring useful fields back into the editor. A manual copy-and-paste workflow can introduce unknown fields, overwrite identity or existing work, blur invented material with uncertain material, and accidentally make unreviewed output look canonical. The app needs an author-controlled import boundary that treats external output as an ephemeral draft and preserves local-first ownership.

## Solution

Add a static, versioned, record-free Cast Member drafting prompt that an author can explicitly copy to the clipboard without making a provider call. The prompt asks an external LLM for JSON containing registered dossier fields plus declared uncertainty and invention lists, while forbidding `entity_id` and unknown keys.

Add a local paste/import flow to the Cast Member editor in create, edit, and linked-record modes. Pure core behavior extracts one JSON object from a fenced or prose-wrapped response, parses it, validates each field, maps only present valid values, and produces a report that separates filled, skipped, and needs-author items. Existing non-empty values that differ require exact-field confirmation. Canceling restores the form without loss, and identity is never imported or overwritten.

Imported values remain an unsaved, ephemeral form draft until the author explicitly saves. The pasted response, import report, and unsaved draft never enter project storage, browser storage, prompt context, migrations, exports, logs, or provenance surfaces.

## User Stories

1. As an author, I want to copy a stable Cast Member drafting prompt, so that I can request a structured dossier from an external LLM on my own terms
2. As an author, I want prompt copying to remain a local clipboard action, so that the app never makes an external-model call on my behalf
3. As an author, I want the drafting prompt to exclude project records, so that copying it cannot disclose story data
4. As an author, I want external output to use registered dossier fields and declared uncertainty and invention lists, so that I can distinguish usable material from content that needs judgment
5. As an author, I want to paste fenced or prose-wrapped JSON, so that ordinary external-model response formatting does not prevent import
6. As an author, I want malformed JSON and invalid fields reported without mutating my form, so that I can correct the response or continue editing safely
7. As an author, I want only present valid fields prefilled, so that omitted or invalid fields do not erase existing work
8. As an author, I want `entity_id` and unknown keys rejected, so that imported output cannot alter record identity or expand the schema
9. As an author, I want each differing non-empty field confirmed individually, so that existing dossier content is never overwritten in bulk or by surprise
10. As an author, I want canceling import or overwrite review to be lossless, so that trying the workflow cannot damage my current draft
11. As an author, I want a report separating filled, skipped, and needs-author items, so that I can understand every import outcome and finish unresolved work
12. As an author, I want the same import guarantees in create, edit, and linked-record modes, so that safety does not depend on how I opened the Cast Member editor
13. As a keyboard or assistive-technology user, I want copy, paste, report, confirmation, cancel, and recovery states to be operable and announced clearly, so that I can complete the workflow without pointer-only interaction or hidden status
14. As an author, I want imported content to remain unsaved until I explicitly save, so that external output never becomes canonical merely because I pasted it
15. As a privacy-conscious author, I want pasted responses and unsaved import state excluded from storage, logs, exports, provenance, and prompt context, so that temporary external output remains local and ephemeral
16. As an implementer, I want parsing, validation, mapping, and reporting expressed as deterministic core behavior, so that the import boundary can be tested exhaustively without browser or provider dependencies

## Implementation Decisions

- The drafting prompt is static, versioned, and record-free. It contains no active Cast Member, project, or story data.
- Copying the prompt is an explicit local clipboard action and makes no OpenRouter or other provider call.
- The response contract is a JSON object limited to registered dossier fields plus declared uncertainty and invention lists. It must omit `entity_id`; unknown keys are invalid.
- Pure core behavior extracts a single JSON object from either a fenced block or prose wrapper, parses it, validates values field by field, maps valid present fields, and returns a deterministic report.
- The import report has three explicit categories: filled, skipped with reasons, and needs-author. A parse failure or response-level shape failure leaves the form unchanged and provides a recoverable error.
- Import prefills only fields that are both present and valid. It never clears an omitted field and never changes `entity_id`.
- A valid imported value may fill an empty field directly. A differing non-empty field requires exact-field confirmation before replacement. Confirmation is not bundled across fields.
- Canceling at paste review or overwrite review is lossless and restores the exact pre-import form state.
- Create, edit, and linked-record modes use the same import contract and safety rules.
- Pasted text, parsed candidates, reports, confirmation state, and imported-but-unsaved values are ephemeral form state. They are excluded from project and browser storage, prompt compilation and context, migrations, exports, logs, and provenance.
- Explicit author save remains the only transition from imported draft values to canonical Cast Member data.

## Testing Decisions

Tests assert external behavior at the highest useful existing seams. Core coverage exercises the static prompt/template and uses table-driven cases for extraction, parsing, field validation, mapping, report categories, identity rejection, unknown keys, uncertainty and invention lists, and unchanged-state failures. Editor component coverage exercises create, edit, and linked-record modes, accessible status and controls, per-field overwrite decisions, cancel, malformed-response recovery, and explicit save. Sequence coverage proves overwrite and recovery behavior from the author's point of view. A production-localhost browser check proves the integrated copy/import flow without any provider request, and the repository root lint, typecheck, test, and build gates remain required.

Descriptive prior art is the existing deterministic core-test style, editor component interaction coverage, production-localhost browser smoke coverage, and repository root gate suite. The implementation must test public module and UI behavior rather than introduce test-only internal interfaces.

Seam confirmation: confirmed for static prompt/template core tests; pure parse/map/report table tests; editor component create, edit, and linked-record modes; overwrite and recovery sequences; production-localhost browser behavior; and root gates.

## Principles

Implementation must conform to `docs/FOUNDATIONS.md`, including local-first ownership, deterministic behavior, explicit author control, and the rule that unaccepted or temporary prose does not enter prompt context. Section 29 is the alignment checklist for the implementation ticket and review. Registered dossier fields and identity behavior must remain aligned with `docs/story-record-schema.md`; prompt-boundary behavior must remain aligned with `docs/compiler-contract.md`; and user-facing behavior and recovery guidance must be reflected in `docs/user-guide.md`.

No deliberate exception to these authorities is authorized. If implementation requires one, work stops until the governing authority is deliberately amended.

## Out of Scope

- Calling OpenRouter or any other external model from the drafting or import flow
- Injecting current records, story state, accepted prose, or other project data into the static drafting prompt
- Accepting unknown response keys, importing `entity_id`, or extending the dossier schema through import
- Automatically saving, bulk-confirming differing non-empty fields, or treating imported output as canonical
- Persisting pasted responses, import reports, parsed candidates, overwrite state, or unsaved imported drafts in any storage or audit surface
- Adding migrations, export formats, provenance records, or prompt-context entries for ephemeral import state
- General-purpose JSON import for record types other than Cast Member

## Further Notes

Publication package: one enhancement PRD with `enhancement` and `ready-for-agent`. No follow-on PRD is implied by this scope.

Source posture: temporary source summarized, not cited. Its ratified product decisions and seam receipt are represented directly in this PRD without claiming that the local preparation artifact is durable authority.

Browser-visible guidance checklist mapping

- Entry point and availability: explicit prompt-copy and paste/import actions are available in the Cast Member editor's create, edit, and linked-record modes, as specified in Solution and Implementation Decisions.
- User-visible states, actions, and outcomes: the author can copy, paste, inspect filled, skipped, and needs-author results, review exact-field overwrites, cancel, and explicitly save, as specified in Solution and User Stories 9 through 12.
- Validation, warning, error, and recovery behavior: malformed input and invalid fields leave the form unchanged, skipped fields include reasons, differing non-empty fields require confirmation, and cancel is lossless, as specified in User Stories 6 through 10 and Testing Decisions.
- Prompt preview contents and freshness: the copied drafting prompt is a visible, static, versioned, record-free template rather than a record-derived preview, so its version defines freshness, as specified in Solution and Implementation Decisions.
- User-initiated external LLM boundary: copying is explicitly user initiated and local, and the app makes no provider call, as specified in Implementation Decisions and Out of Scope.
- Canon and prose boundary visibility: imported values remain visibly unsaved candidates until explicit save and never enter prompt context while unsaved, as specified in Solution and Implementation Decisions.
- Persistence, migration, export, and provenance: pasted text, reports, and unsaved imported drafts are excluded from project storage, browser storage, migrations, exports, logs, provenance, and prompt context, as specified in Solution and Implementation Decisions.
- Browser and accessibility regression scenario: production-localhost coverage exercises clipboard, import, reporting, field confirmation, cancel, recovery, keyboard operation, and announced status, as specified in User Story 13 and Testing Decisions.

Seam confirmation: confirmed for static prompt/template core tests; pure parse/map/report table tests; editor component create, edit, and linked-record modes; overwrite and recovery sequences; production-localhost browser behavior; and root gates.
