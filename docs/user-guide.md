# Continuity Loom User Guide

Status: active how-to — user-facing local install, run, verify, and app workflow guidance
Authority: support (see docs/ACTIVE-DOCS.md)

Continuity Loom is a local-first story-state app. You maintain story records, choose the records that matter for the next local prose segment, inspect the deterministic prompt, and decide whether to send it to OpenRouter or keep it local while you write or paste candidate prose yourself.

The records are the continuity authority. Accepted prose is readable output, not canon for future prompts.

## The Loop

1. Create or open a local project folder.
2. Add, edit, archive, or remove story records.
3. Curate the active working set for the next segment.
4. Edit generation-time fields: current authoritative state, immediate handoff, manual directive, POV/prose mode, stop guidance, and current voice pressure.
5. Save the Generation Brief draft. A draft can save before it is ready.
6. Run validation or review the readiness checklist.
7. If readiness has blockers, fix the records or generation-time fields. Prompt preview and OpenRouter send stay blocked in v1, but the draft remains saved.
8. If readiness has only warnings, decide whether to improve the brief or continue.
9. Compile and inspect the prompt preview.
10. Choose **Generate** to send the prompt to OpenRouter, or **Write or paste candidate** to keep the prompt local and open an empty editor.
11. Review the OpenRouter-generated or user-supplied Draft Candidate and its displayed source and inspected-prompt context.
12. Edit, replace or regenerate, discard, or accept the candidate.
13. The accepted final segment is stored in the accepted segment archive.
14. After acceptance, return to Generation Brief. If the saved context says First segment, the app shows that Continuation after accepted segment is now required; choose it and save explicitly.
15. Update records manually for any durable continuity changes before generating again.

## Generation Readiness

Saving a Generation Brief is draft persistence. It preserves your work even when the brief is incomplete.

Readiness is the gate for Prompt Preview and Generate. A blocker means the app cannot safely compile or send the prompt until you fix a required item. A warning means generation is possible, but the prose may be weaker, less specific, or harder for the model to use. Warnings never block Preview or Generate.

The readiness checklist should explain the issue in author language first. Technical codes belong in details.

Important fields:

- Generation context follows accepted-segment count: no accepted segments requires First segment; one or more requires Continuation after accepted segment. Generation Brief shows the saved value, required value, count, and Coherent or Mismatch status beside the selector.
- A missing context defaults safely. A contradictory saved value is not changed automatically when you accept or delete prose, open the project, validate, preview, or try to generate. Draft Save remains available, but Preview, Write or paste candidate, Generate, and provider transport stay blocked until you choose the required value and save the Generation Brief explicitly.
- The same mismatch explanation and **Edit generation context** action appear on Generation Brief, Prompt Preview, and Generate. The action returns keyboard focus to the existing selector. After saving, reload or refresh the prompt; only a fresh readiness check and compile can reopen candidate actions.
- Current state needs a minimum of time, place or scene-space, onstage/material entities, and what is happening now.
- Manual moment directive is required for readiness. It should be an immediate launch action or pressure, such as "Have Mara open the cellar door" or "Render the next immediate beat from Ken's intention to lie."
- Stop guidance is optional. Blank stop guidance uses the universal local stop rule.
- Immediate handoff is usually only required for continuation after accepted prose. It must be user-authored and must not paste accepted prose.
- Current cast voice pressure is optional local emphasis. Durable CAST MEMBER profiles are the primary voice authority.

## Project Ownership

Your project folder is yours. It contains project metadata, the local SQLite story store, backup copies created by the app, and accepted segment data.

Continuity Loom has no account, login, or cloud service. The localhost app binds to `127.0.0.1`. Project data stays on your machine unless you intentionally send a compiled prompt to OpenRouter.

The app does not upload the full project folder. OpenRouter receives only the generated prompt you choose to send, which is compiled from the active working set and generation-time fields.

## Active Working Set

The active working set is the set of records selected for the next prompt. Records outside it can remain true, important, or useful later, but they are omitted from the prompt unless you select them or write equivalent user-authored context into the generation-time brief.

The app may warn or block unsafe selections, but it does not silently add records because it thinks they matter.

## Private Notes

Private Notes are a per-story local scratchpad for your own author memory: loose questions, research fragments, reminders, discarded possibilities, or anything else you want beside the project without making it continuity authority.

Open Private Notes from the project navigation to create, edit, browse, search, tag, pin, preview, or delete notes. Notes live in the project's local SQLite store and open or close with that project.

Private Notes are never records, working-set entries, Generation Brief fields, validation input, readiness input, compiler input, prompt context, prompt-preview content, OpenRouter request content, or assistance output. Notes cannot link to or from records and cannot be selected for the active working set.

A note can influence generation only when you manually re-author its substance into a real story record or a generation-time field. Treat that as a deliberate authoring step, not a transfer or sync feature.

## Scene Prep In Private Notes

Scene Prep is a workspace inside Private Notes for finding loose material, reading sources, and composing a prep sheet beside them. It is still author-private scratch. Prep sheets and clips are not records, not active working set entries, not readiness input, not prompt context, and not accepted prose.

The workspace has three panes:

- **Find** searches private notes locally, including note titles, tags, and bodies. Search is ranked in the local SQLite store; it does not call OpenRouter or any remote service.
- **Source** shows the selected note as a safe preview or Markdown source. Use the source view to collect an exact selected excerpt.
- **Prep** edits a scene-prep sheet and shows its source tray of collected clips.

Collected clips are snapshots. A whole-note clip copies the source note body at capture time. An excerpt clip copies the exact selected Markdown text after the app confirms the source has not changed. Later source edits do not silently change collected clips, and collected copies survive deletion of their source note.

Use permanent deletion carefully. Private Notes have no archive, undo, recycle bin, or soft-delete state. Deleting a source note leaves already collected tray copies intact. Deleting a prep sheet deletes that prep sheet's tray clips, but leaves source notes untouched.

## Prompt Preview

Prompt preview shows the deterministic prompt that will be sent for generation. It is gated by validation.

If validation has blockers, preview, user-supplied candidate intake, and send are disabled. There is no override in v1. Fix the underlying records or generation-time fields, then compile again. When accepted-segment count changes, any previously inspected prompt is withheld until generation-context coherence and the rest of readiness pass again.

The prompt preview is operational context for the current generation session. It is not canon and is not kept as a permanent prompt archive by default.

## Ideate - What Could Happen Next?

Use Ideate when you are stuck before generation and want grounded, non-canonical possibilities from the active working set and Generation Brief.

The Ideate view is pull-based. Open it intentionally from the primary navigation or the "Stuck? Get ideas" link on the Generation Brief page. Inspect the compiled ideation prompt before sending. The prompt uses the same selected records and generation-time fields as the prose workflow, but it asks for premise-level ideas or author-facing questions, not prose.

You can choose ideas or questions, set the slate size from 3 to 6, keep or remove the dormant-record slot, generate a full slate, regenerate the whole slate, or regenerate an individual slot. Per-slot and full regeneration send the current slate titles as an avoid-list for the next ideation request.

Ideas are AI-suggested scratch. They are not story state, not records, not Generation Brief fields, not accepted prose, and not prompt context for prose generation. There is no insert-into-records, insert-into-brief, or use-as-prompt action. If an idea is useful, copy it by hand and decide what durable record or brief field you want to author yourself.

Keepers are session-scoped scratch stored in browser session storage. They can survive a page reload within the same browser session, but they are not project data and are not written to the local project store. Clear the slate or keepers when you no longer need them; cleared ideas leave no project-store residue.

## Record Hygiene - Review Overlapping Active Records

Use Record Hygiene when a project has grown enough that active atomic records may overlap, restate one another, drift stale, or need manual consolidation. Open it from the primary navigation, inspect the compiled record-hygiene prompt locally, review the source counts and exclusions, then optionally confirm a one-time OpenRouter send.

The record-hygiene prompt reviews non-archived hygiene-active atomic records within the scope you choose. Whole project is the default and remains the way to find duplicates anywhere in the store. Active working set scope focuses the review on records you are currently working with; records outside the active working set are excluded by your scope choice, not by archive or terminal status. Both scopes exclude accepted prose, candidates, private notes, archived records, terminal records, ENTITY payloads, and CAST MEMBER payloads. Citation chips navigate back to Records with the exact cited record id.

Findings are AI-suggested review scratch. They are not validation diagnostics, not story state, not records, not working-set entries, not Generation Brief fields, and not prompt context for prose generation. There is no apply, merge, delete, deactivate, archive, accept, fix-all, working-set mutation, or use-as-prose action. If a finding is useful, navigate to the cited records and edit them manually.

Keepers are session-scoped scratch stored in browser session storage. They can survive a page reload within the same browser session, but they are not project data and are not written to the local project store. Clear the review scratch or keepers when you no longer need them.

## Segment Reconciliation - Review Latest Accepted Segment

Use Segment Reconciliation after accepting prose when you want help finding durable continuity changes that may need manual record or Generation Brief updates. It is optional assistance. It may be wrong, incomplete, or over-specific, and it never updates canon automatically.

The optional loop is:

1. Accept the final segment you want to keep.
2. Read the durable-change reminder checklist.
3. Open Segment Reconciliation from the primary navigation or the reminder CTA.
4. Choose Active working set or Whole project scope.
5. Inspect the compiled prompt and source disclosure, including whether SECRET records are included.
6. Confirm the one-time OpenRouter send only if you want advisory review.
7. Review the grouped proposals for Generation Brief fields, existing records, and possible new records.
8. Keep, copy, or navigate from useful suggestions, but author any real changes manually in the canonical editor.
9. Clear the scratch surface when finished, then acknowledge the durable-change reminder only when you decide the canonical updates are complete.

Segment Reconciliation reads exactly the latest accepted segment as bounded evidence for review. It does not read older accepted segments, rejected candidates, private notes, prompt archives, or automatic prose summaries. The accepted segment is not canon authority for future prompts; records and user-authored Generation Brief fields remain the authority.

Every proposal is suggestion-only scratch. There is no apply, prefill, create, deactivate, archive, merge, remove, working-set mutation, or use-as-prose action. Malformed model output is quarantined as raw scratch. Keepers are session-scoped by project and prompt fingerprint in browser session storage, not project data.

## OpenRouter Settings

OpenRouter is the external prose transport. It is not a continuity authority.

Configure the model, temperature, maximum output tokens, and optional top-p in global OpenRouter settings. These are local app settings, not project canon.

For local key setup, copy `.env.example` to `.env` at the repository root and set `OPENROUTER_API_KEY=<your key>`. The root `.env` is gitignored and loads automatically when the app launches through `npm run dev` or `npm start`; a shell-exported `OPENROUTER_API_KEY` also works as an alternative. The key is not stored in project metadata, the SQLite project store, accepted segment metadata, compiled prompts, prompt preview text, or logs. If a key appears in any of those surfaces, treat it as a security bug.

## Candidate Lifecycle

After readiness passes and the compiled prompt is visible, choose one of two ways to start a Draft Candidate:

- **Generate** sends the current prompt to OpenRouter and returns an OpenRouter-sourced draft.
- **Write or paste candidate** makes no provider call and opens an empty user-supplied draft tied to the prompt you are inspecting.

Both paths use the same ephemeral editor. The draft remains not accepted and not canon. Its source, prompt fingerprint, and compiler versions stay visible while you work. A user-supplied draft remains available when OpenRouter is unconfigured, out of credits, rate limited, or unavailable, provided prompt readiness itself allows preview.

You can:

- edit the candidate before accepting it;
- regenerate an OpenRouter draft, or replace a user-supplied draft with a new OpenRouter generation when provider readiness allows it;
- discard the current candidate;
- accept the final text you want to keep.

Refreshing the prompt or replacing any non-empty draft first shows an explicit discard confirmation. Cancelling keeps the exact prompt, draft text, source-specific replacement control, and makes no network request. An empty draft bypasses this confirmation. If an OpenRouter replacement fails, the existing draft and editor remain intact so you can retry, continue editing, accept, or discard it.

Successful acceptance immediately refreshes readiness and prompt state. If first acceptance makes the saved generation context stale, the accepted notice remains visible but the old prompt and both candidate-start actions disappear. Repair Generation context in the Generation Brief and refresh before starting the next candidate.

Rejected and superseded candidates are not stored by default. Only the accepted or user-edited final segment is written to the accepted segment archive.

## Accepted Segments

Accepted segments are readable story output. They are not future prompt context.

The accepted segment archive lands on the latest segment so you can review the most recent output without scrolling through the whole archive. Older segments remain listed in story order as collapsed summary rows. Expand a segment to read its full prose, inspect metadata, or use the two-step delete flow.

Use "Expand all" when you want whole-story reading or browser find across the full accepted prose text. "Collapse all" returns the archive to summary rows. On long archives, "Back to top" and "Jump to latest" move both the page and keyboard focus.

The archive also lets you filter and export accepted output. Export always uses the complete archive in story order, independent of filters or expansion state. It does not provide an "include in prompt" action. If something in accepted prose should affect future generation, update the story records, current authoritative state, immediate handoff, or another user-authored continuity field.

Each accepted segment identifies its source as `OpenRouter` or `User-supplied`, and source is searchable from the archive filter. OpenRouter entries show their actual model, provider, generation settings, and compiler versions. User-supplied entries show the compiler versions associated with the inspected prompt and omit model, provider, and generation-setting fields instead of displaying blank or invented values. Markdown and text exports preserve the same truthful source distinction in story order.

After acceptance, Continuity Loom reminds you that durable changes likely require manual record updates. The app never extracts canon from prose automatically.

Segment Reconciliation can help review the latest accepted segment against current records and Generation Brief fields, but it never applies changes automatically. Record Hygiene can help review overlapping active records after acceptance, but it never updates records automatically. Use both surfaces as optional manual audit steps when accepted prose causes you to create or revise several atomic records.

## Backup And Recoverability

The simplest backup is to close the project and copy the whole project folder somewhere safe.

When the app offers a backup workflow, use "Create Backup Copy" to produce a consistent timestamped SQLite backup without needing to understand SQLite sidecar files.

Backup copies are safety copies, not branches or alternate timelines.

If a project was created by a newer schema version, or needs a migration the current app cannot perform, Continuity Loom blocks opening it with a clear version message and leaves the project intact. That is a recoverable open failure, not a corrupting write.

## FAQ

### Why no branches?

Continuity Loom v1 works from one current continuity. Inactive, archived, unresolved, abandoned, or currently irrelevant records are allowed, but they are not branches or alternate timelines.

### Why is accepted prose not prompt context?

Accepted prose is output. Records and generation-time fields are the prompt authority. This keeps continuity explicit, inspectable, and owned by you instead of inferred from previous prose.

For continuations, write recent causal context plus either a last visible moment or a begin-after point. Do not paste accepted prose, rejected candidates, superseded regenerations, or automatic prose summaries into prompt-facing fields.

### Why can I save a brief that still has blockers?

Saving protects your draft. Blockers prevent prompt preview and generation, not ordinary form persistence.

### Do I have to fill stop guidance?

No. Stop guidance is optional narrowing. If it is blank, the universal local stop rule still applies.

### Why is the app asking for a manual directive?

The directive is the immediate launch choice for the next local prose unit. It tells the prose writer what pressure or action to render now without becoming a plot outline.

### Is my data uploaded?

No project folder is uploaded by Continuity Loom. The only remote request in the v1 generation loop is the OpenRouter request you choose to send, and it contains the compiled prompt for that generation.

Your local project remains the continuity owner.
