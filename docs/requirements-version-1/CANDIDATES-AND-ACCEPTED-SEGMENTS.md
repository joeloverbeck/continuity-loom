# Candidates and Accepted Segments — Continuity Loom v1

## Purpose

This spec defines the lifecycle of generated prose after OpenRouter returns it. It preserves the foundation distinction between candidate prose, accepted prose, and canonical continuity records.

Candidate prose is editable cloth-in-progress. Accepted prose is readable cloth. Neither is the loom.

## Scope

This spec covers candidate lifecycle, regenerate/discard/edit/accept behavior, rejected/superseded candidate non-storage, accepted segment archive rules, append-only behavior, segment metadata, reading/browsing UI, deletion/export, and post-acceptance record-update reminders.

It does not define production code, manuscript publishing export, version control, diffing, or prose-to-canon extraction.

## Non-goals

This spec does not store rejected or superseded candidates permanently, does not track candidate edits as canon metadata, does not auto-accept responses, does not summarize accepted prose into records, and does not make the accepted archive a prompt source.

## Candidate lifecycle

A candidate exists only inside the current generation session.

Candidate creation:

- validation passes;
- prompt is compiled and previewed;
- user sends to OpenRouter;
- OpenRouter returns prose content;
- app displays it as editable candidate text.

Candidate states:

- current candidate visible and editable;
- discarded candidate removed from session;
- superseded candidate replaced by regeneration;
- accepted candidate written as an accepted segment.

Rejected and superseded candidates are not permanently stored.

## Edit before acceptance

The user may edit the candidate before acceptance. The app does not need to track whether editing occurred. The accepted text is the final text in the candidate editor at the moment the user accepts.

The editor should support ordinary prose editing without implying record editing. It should not offer automatic extraction of facts, events, or durable changes in v1.

## Regenerate

Regenerate sends the same current validated prompt or a newly compiled prompt depending on whether inputs changed.

Required behavior:

- if records/brief changed after the previous send, validation and preview must refresh before send;
- if the same prompt is regenerated, the current unsaved candidate may be replaced or the UI may let the user choose to discard it first;
- superseded candidates are not permanently stored;
- no accepted segment is created by regeneration alone.

The UI should avoid accidental loss by warning when replacing edited unsaved candidate text, but this warning is session-level friction, not permanent storage.

## Discard

Discard removes the current session candidate. It does not delete accepted segments, mutate records, or write a rejection history.

Discard should return the user to prompt preview/generation workflow with validation state intact.

## Accept

Accept writes one accepted segment containing the candidate editor’s current text plus metadata. Acceptance does not mutate records, current authoritative state, active working set, generation-time brief, or cast dossiers.

After acceptance, the app shows the durable-change reminder.

## Phase 10 implementation note

Implemented via SPEC-010 on 2026-06-06. The realized Phase 10 lifecycle uses a dedicated
`/generate` surface with prompt inspection before Send, editable session-only candidate
text, Regenerate/Discard/Accept actions, and `POST /api/accepted-segments` over the
existing `accepted_segments` table. Accepted segments store the edited accepted text plus
the full key-free generation metadata snapshot: model, provider, temperature, max output
tokens, optional top-p, and template/compiler/contract versions. Rejected, discarded, and
superseded candidates are not persisted, and no full prompt is stored with the segment.

The ordered accepted-segment browser, deletion, and export remain Phase 11. The persistent
durable-change reminder with checklist, quick links, acknowledge, and snooze remains Phase
12; Phase 10 provides only a minimal ephemeral post-accept notice.

## Phase 11 implementation note

Implemented via SPEC-011 on 2026-06-06. The realized Phase 11 archive browser uses
`GET /api/accepted-segments` for ordered read-back and `DELETE /api/accepted-segments/:id`
for confirmed deletion. Deletion removes only the readable output row, leaves stored
sequence gaps unrenumbered, and does not mutate records or create branches.

The `/accepted-segments` surface is prose-forward and read-only: it shows accepted text in
stored sequence order, displays the model/provider/settings and template/compiler/contract
version metadata, supports a simple client-side substring filter over fetched text and
visible metadata, and exports the complete archive as Markdown or plain text regardless of
the active filter. The app provides no "include last segment in prompt" or other
prompt-context affordance from this archive. The persistent durable-change reminder remains
Phase 12.

## Accepted segment archive

Accepted segments are stored in order. They are append-only except deletion/export.

Each accepted segment should store:

- stable segment ID;
- project/story ID;
- segment index/order;
- accepted timestamp;
- text;
- model identifier used;
- provider/transport identifier where useful;
- generation parameter snapshot such as temperature and max output tokens;
- prompt template version;
- compiler version;
- compiler-contract version.

Optional metadata may include non-reversible prompt fingerprint, response finish reason, and token usage if returned, as long as this does not store prompt text.

Do not store full generated prompt by default.

## Deletion and export

Deletion is allowed with confirmation. It removes a readable output segment; it does not rewrite records automatically and does not create a branch. If deletion leaves a continuity discrepancy, the user must repair records manually.

Export is allowed for accepted prose reading/output. Exported prose is not canonical continuity and must not become a compiler input through the app.

V1 does not need a sophisticated publishing/export pipeline. Plain text or Markdown export is sufficient if implemented.

## Accepted prose is not prompt context

Compiler queries must not read accepted segment text. The UI must not offer a “include last segment in prompt” action. The handoff field must not be labeled “recent accepted prose.”

Continuation after an accepted segment requires user-authored current state, immediate handoff, selected EVENT/FACT/BELIEF/RELATIONSHIP/EMOTION/PLAN/CLOCK/OBLIGATION/CONSEQUENCE/OPEN THREAD/LOCATION/OBJECT/AFFORDANCE/CAST records, and updated ENTITY STATUS as needed.

If accepted prose text appears in prompt-facing fields, validation blocks.

## Post-acceptance durable-change reminder

After acceptance, show a persistent banner/checklist such as:

- Did a secret become known?
- Did a character move location?
- Did an object change hands?
- Did a relationship or emotion change?
- Did a promise, obligation, clock, consequence, injury, or open thread change?
- Does current authoritative state need updating before the next generation?

The reminder should provide quick links to relevant record creation/editing surfaces. It must not parse the accepted prose with an LLM or create records automatically.

The reminder can be acknowledged or snoozed, but the app should keep it visible enough that the user remembers the manual record update step.

## User-facing behavior

The user should always know whether they are looking at:

- a current unsaved candidate;
- an accepted segment;
- a durable record;
- a generated prompt;
- a generation-time brief.

Candidate editor UI should be prose-focused and editable. Accepted segment browser should be pleasant and readable. Neither should masquerade as canonical record state.

## Data/logic implications

Candidate text is session state. Accepted segment text is durable archive state. Neither enters the deterministic compiler input path.

No database write to accepted segments occurs until acceptance. OpenRouter success alone does not write durable prose. Network errors do not write anything.

Accepted segment ordering is stable and project-local. Segment deletion should preserve remaining order or clearly re-index display order without rewriting meaning.

## Alignment with `FOUNDATIONS.md`

This spec implements the core loop, editable candidate requirement, rejected/superseded non-storage, accepted prose archive boundary, no accepted prose in prompts, durable-change human gatekeeping, and post-acceptance reminder doctrine.

## Security/privacy implications

Candidate and accepted prose may contain sensitive content. Candidate text should not be logged. Accepted prose is stored locally only. Exports are explicit user actions.

API keys must never be stored in candidate session state or accepted segment metadata.

## Validation implications

Validation must block if accepted prose, rejected candidate text, superseded regeneration text, or automatic prose-derived summary appears in prompt-facing fields. Accepted segment archive is not a validation source except for contamination checks or archive integrity checks.

Continuation generation requires a user-authored handoff and updated records/current state, not accepted prose inclusion.

## Failure modes

Candidate/archive failure modes include:

- storing every regeneration as hidden history;
- tracking edits as a canon signal;
- accepting automatically on OpenRouter success;
- using accepted segments as prompt context;
- allowing a “summarize accepted prose into prompt” button in v1;
- failing to remind user to update records after durable changes;
- storing full prompt text with segment metadata;
- logging candidate prose;
- letting deletion imply branch rollback.

## Done Means

Candidate and accepted segment behavior is satisfied when:

- OpenRouter success creates an editable session candidate only;
- candidates can be edited, regenerated, discarded, and accepted;
- rejected and superseded candidates are not permanently stored;
- acceptance writes exactly one accepted segment with metadata and no full prompt archive;
- accepted segments are browsable in order and can be deleted/exported;
- accepted segment text cannot be selected or queried as compiler input;
- continuation after accepted prose requires user-authored record/current-state/handoff updates;
- a durable-change reminder appears after acceptance;
- no API key, prompt text, or candidate history leaks into logs or project metadata.
