Publication-ready simulation complete; no GitHub or tracker write was performed. The temporary local preparation is summarized without citing its undurable path.

Title: `PRD: Cast Member Dossier Draft Import — Static Prompt and Safe Local Prefill`

Labels: `enhancement`, `ready-for-agent`

Body:

This PRD synthesizes a same-session local preparation whose settled product decisions, single-PRD publication package, and testing seams were ratified for publication. The temporary source was summarized, not cited because it is not available at the publication ref. No product or testing decision remains open.

## Problem Statement

The Cast Member editor exposes a rich, structured dossier, but authors have no bounded way to use an external LLM to draft that dossier and bring useful fields back into Continuity Loom. Manual transcription is slow and error-prone, while a naive import could silently replace the linked entity, treat model output as canon, persist unwanted material, or leak assistance output into prompt and project surfaces.

Authors need a workflow that reduces dossier-entry friction without weakening their control over continuity. They must be able to see what was accepted, what was rejected, what needs judgment, and what would overwrite existing work before any canonical record changes.

## Solution

Add a Cast Member dossier drafting and import workflow to the Cast Member editor. The editor provides an explicit copy action for a static, independently versioned, record-free drafting prompt. Copying happens locally and makes no provider call; the author supplies their source dossier and invokes any external LLM outside Continuity Loom.

The editor then accepts a pasted response and processes it locally. The importer extracts a JSON object from a JSON fence or prose wrapper, parses it, validates every recognized dossier field against the registered Cast Member shape, and produces a review report. Valid present fields may prefill the unsaved form; absent fields stay untouched; `entity_id`, unknown keys, empty values, malformed values, and invalid values are skipped with reasons. The report distinguishes fields that were filled, fields that were skipped, and uncertainties or substantial inventions that need the author.

A differing non-empty editor value is never replaced silently. The author sees the exact conflicting fields and confirms those replacements before they are applied. Canceling either review or overwrite confirmation leaves the form unchanged. Imported values and their report remain ephemeral form state until the author deliberately uses the existing Save or Create action, which remains the sole continuity-authority gate.

## User Stories

1. As an author creating a Cast Member, I want to copy a dossier drafting prompt from the editor, so that I can ask an external LLM for structured drafting help without exposing project records
2. As an author editing a Cast Member, I want the same drafting workflow to be available without changing the linked entity, so that I can enrich an existing dossier safely
3. As an author, I want the copied prompt to be static and versioned, so that the instructions and response contract are deterministic and auditable
4. As a privacy-conscious author, I want copying the prompt to remain a local clipboard action, so that Continuity Loom makes no provider call and sends no project data
5. As an author, I want to paste JSON returned inside a fence or surrounding prose, so that harmless response wrapping does not force manual cleanup
6. As an author, I want pasted content parsed and validated locally, so that importing a draft makes no network request
7. As an author, I want valid present fields mapped independently, so that useful dossier material survives even when other returned fields are invalid
8. As an author, I want absent response fields left untouched, so that a partial response cannot erase existing work
9. As an author, I want `entity_id`, unknown keys, empty values, malformed values, and invalid values rejected with reasons, so that model output cannot bypass the Cast Member contract
10. As an author, I want the linked `entity_id` preserved in create, edit, and linked-entity modes, so that importing assistance cannot relink continuity records
11. As an author, I want the import report to separate filled, skipped, and needs-author items, so that I can understand both accepted material and unresolved uncertainty or invention
12. As an author with existing draft values, I want to see the exact non-empty fields that would change, so that I can make a deliberate overwrite decision
13. As an author, I want canceling import review or overwrite confirmation to be lossless, so that evaluating model output never destroys my current form state
14. As an author, I want imported material to remain visibly non-canonical until I save or create the record, so that assistance cannot silently become continuity authority
15. As a local-first author, I want pasted responses, reports, and abandoned drafts to leave no persisted residue, so that assistance output does not enter storage, browser storage, prompts, migrations, exports, logs, or provenance
16. As a keyboard or assistive-technology user, I want copy, paste, review, confirm, cancel, and recovery controls to have clear names and predictable focus, so that the workflow is usable without relying on pointer-only or visual cues
17. As an author encountering clipboard, extraction, or parsing failure, I want a clear error and a retry path that preserves my current draft, so that I can recover without losing work

## Implementation Decisions

- The Cast Member editor is the sole entry point. The copy and import actions are available in create and edit modes, including when an existing ENTITY is linked; they do not add a background or automatic assistance path.
- The drafting prompt is a static, record-free core template with its own version. The browser copies the current core template directly rather than compiling project state or maintaining a second cached template.
- Copying is local clipboard behavior. Continuity Loom does not call OpenRouter or any other provider for this workflow; the author controls what they supply to an external LLM outside the app.
- The external response contract is one JSON object containing registered Cast Member dossier fields plus top-level `uncertainties` and `invented_fields`. It excludes `entity_id` and all unknown keys.
- A pure core import pipeline extracts a JSON object from a JSON fence or prose wrapper, parses it, validates recognized fields independently, maps valid present fields, and reports every rejected field with a stable reason. Extraction or top-level parse failure applies nothing.
- Field validation reuses the registered Cast Member dossier shape and vocabularies. `entity_id`, unknown keys, empty values, malformed entries, and invalid entries are never mapped; omitted fields do not participate in the import.
- The import plan is computed before form mutation. It separates fields that can be filled, fields that are skipped, uncertainty notes, and substantially invented fields that need author judgment.
- Empty editor fields may be prefilled from valid values. Any valid value that differs from an existing non-empty field enters an exact-field overwrite confirmation list and is applied only after explicit confirmation.
- Canceling review, canceling overwrite confirmation, or encountering an error restores the pre-import form exactly. A retry begins from the still-current form rather than from partially applied output.
- The editor keeps the pasted response, review report, field-level provenance, and imported draft only in ephemeral component state. Saving or creating the record clears assistance state and persists only the author-reviewed Cast Member record through the existing canonical action.
- No assistance artifact enters the project store, browser persistence, active working set, prompt context, migration, export, application logs, or stored provenance. Abandoning or rejecting the import leaves no residue.
- The UI identifies imported, skipped, uncertain, and substantially invented fields until the draft is discarded or explicitly saved. Copy success and failure, parse failure, validation reasons, overwrite confirmation, cancellation, and successful prefill are all visible outcomes.
- Interactive controls have accessible names, modal or dialog focus is contained while confirmation is active, cancel returns focus to the initiating control, and status or error feedback is exposed without requiring visual-only interpretation.

Browser-visible guidance checklist mapping

| Canonical item | PRD home |
| --- | --- |
| `entry point and availability` | Solution and Implementation Decisions: the Cast Member editor exposes explicit copy and import actions in create, edit, and linked-entity modes. |
| `user-visible states, actions, and outcomes` | Solution, User Stories, and Implementation Decisions: copy, paste, review, filled/skipped/needs-author results, overwrite confirmation, cancel, retry, prefill, Save, and Create are specified. |
| `validation, warning, error, and recovery behavior` | Solution and Implementation Decisions: extraction and parse failures apply nothing; rejected fields carry reasons; conflicts require exact-field confirmation; cancellation and retry preserve the current form. |
| `prompt preview contents and freshness` | Implementation Decisions: the copied content is the current static, independently versioned core template and is never compiled from project state or served from a second browser copy. |
| `user-initiated external LLM boundary` | Solution and Implementation Decisions: copy and paste are separate user actions, both are local, and Continuity Loom makes no provider call; the author invokes the external LLM outside the app. |
| `canon and prose boundary visibility` | Problem Statement, Solution, and User Stories: imported assistance is visibly non-canonical form state and becomes a record only through explicit Save or Create. |
| `persistence, migration, export, and provenance` | Solution and Implementation Decisions: assistance artifacts are ephemeral, field-level provenance remains visible only during review, and none enters storage, browser persistence, migration, export, logs, prompts, or stored provenance. |
| `browser and accessibility regression scenario` | Testing Decisions and Implementation Decisions: component and production-localhost browser coverage exercise accessible controls, focus, create/edit/linked modes, overwrite, cancel, errors, retry, and save boundaries. |

## Testing Decisions

- Tests assert externally observable contracts and state transitions, not private helper structure.
- Core static-template tests verify byte stability, independent versioning, the complete registered field contract, exclusion of project data and `entity_id`, and same-change drift detection against the Cast Member schema.
- Pure core table tests cover fenced JSON, prose-wrapped JSON, malformed and unextractable input, partial payloads, unknown and forbidden keys, empty and invalid values, registered enum and nested-field validation, filled/skipped/needs-author reporting, and deterministic mapping.
- Cast Member editor component tests cover create, edit, and linked-entity modes; copy success and failure; paste and review; exact-field overwrite confirmation; cancel before and during confirmation; retry after error; explicit Save or Create; and assistance-state cleanup.
- Sequence tests prove that parse or validation failure applies nothing, absent fields remain untouched, valid empty-target fields prefill, differing non-empty fields wait for confirmation, `entity_id` never changes, and every cancellation path restores the original draft.
- A production-localhost browser regression exercises the complete copy/import/review/confirm/save workflow on `127.0.0.1`, including keyboard navigation, accessible names, focus return, user-visible errors, and no unintended provider request.
- The root lint, strict typecheck, test, and production build gates remain required.
- Prior art is the core prompt-template golden and schema-drift coverage, core parser table-test style, Cast Member editor component interaction coverage, and production localhost browser smoke coverage.
- Seam confirmation: answered; the ratified seams are static prompt/template core tests, pure parse/map/report table tests, editor component create/edit/linked modes, overwrite and recovery sequences, production-localhost browser, and root gates.

## Principles

- `docs/FOUNDATIONS.md` governs continuity authority, optional LLM assistance, ephemeral assistance output, the exact unsaved Cast Member prefill exception, local-first ownership, and the §29 alignment checklist. This PRD does not contradict it: the app makes no provider call, no import is canonical before explicit Save or Create, and assistance output never becomes hidden prompt or stored state.
- `docs/cast-member-draft-prompt-template.md` governs the static record-free prompt, registered field coverage, uncertainty and invention declarations, `entity_id` exclusion, and external JSON contract. The implementation must preserve that contract and its same-change drift rule.
- `docs/story-record-schema.md` governs the Cast Member dossier fields and controlled vocabularies. Import validation must remain aligned with that registered shape rather than introducing a parallel schema.
- `docs/agents/issue-tracker.md` governs the browser-visible guidance checklist mapped above. Every applicable item has a concrete home in this PRD.
- The §29 alignment check passes by design: the feature reduces clerical friction while retaining author review, explicit canonical save, deterministic local processing, inspectable boundaries, and zero automatic continuity mutation. No deliberate constitutional exception is requested.

## Out of Scope

- Calling an external LLM, OpenRouter, or any provider from Continuity Loom for dossier drafting.
- Sending project records, story configuration, accepted prose, candidate prose, notes, linked entity data, or hidden app state with the copied prompt.
- Importing into record types other than Cast Member, generation-time fields, story configuration, or active-working-set membership.
- Creating, updating, relinking, or saving a record automatically.
- Importing or changing `entity_id`.
- Persisting raw responses, import reports, unsaved drafts, uncertainty or invention metadata, or field-level import provenance.
- Adding project-store schema, migration, compatibility, export, prompt-compilation, or accepted-prose behavior.
- Background assistance, hidden response repair, model-selected field omission, or automatic canon inference.

## Further Notes

The preparation used for synthesis exists only as temporary local material and is absent from the publication ref. Its settled decisions are summarized here, but the local artifact is deliberately not cited as durable authority and remains pending local publication if its authors want it independently discoverable.

Publication package: one enhancement PRD. With all product decisions and seams settled and every browser-visible checklist item homed, `enhancement` plus `ready-for-agent` is the intended publication-label posture after live duplicate and label-existence checks.

Seam confirmation: answered; the user ratified static prompt/template core tests, pure parse/map/report table tests, editor component create/edit/linked modes, overwrite and recovery sequences, production-localhost browser, and root gates.

There are no deferred follow-on PRDs and no unresolved decision-closure rows.

Live exact-title, label-existence, issue-creation, and published-readback checks remain intentionally outside this no-network simulation.
