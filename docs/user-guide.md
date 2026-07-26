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

## Concealing A Premise From The Reader

A FACT's **Audience visibility** field is author metadata about how openly you treat that fact. It is not a reader-concealment control: setting a FACT to `hidden` does not hide it from the reader. A FACT renders only among the point-of-view character's accessible facts, so its audience-visibility value never reaches the compiled prompt's audience-knowledge block and adds no concealment instruction — a `hidden` fact compiles the same as an `explicit` one.

To keep the reader in the dark about a premise the point-of-view character already knows — dramatic irony — model it as a **SECRET**, not a FACT. Give the SECRET `pov_access: knows` (the POV keeps its knowledge) and `audience_visibility: hidden` (the reader does not know yet). A hidden SECRET is what fills the compiled "Audience does not know" line, and the SECRET record also carries holders, characters who must not know, allowed surface cues, forbidden reveals, and reveal permission. The SECRET record is the only mechanism that instructs reader-concealment.

If you set a hard-canon or critical FACT to `hidden`, the app shows a non-blocking advisory warning that points you to the SECRET model. It never blocks Preview or Generate; you clear it by modeling the premise as a SECRET or by changing the FACT's audience visibility.

## Linking A Person ENTITY To A CAST MEMBER

An ENTITY owns a durable identity; a CAST MEMBER is a separate rich dossier that links to it for voice and behavior. When you open a person ENTITY that has no current linked dossier, its detail offers **Create linked CAST MEMBER**, which opens the CAST MEMBER editor with that ENTITY relationship already selected. Nothing is written until you use Create Record, and if that save fails your authored values and the linked relationship are kept for retry. If a current linked dossier already exists, the detail offers **Open linked CAST MEMBER** instead of inviting a duplicate; an archived link explains itself so you can restore it or create a new dossier deliberately.

Creating the dossier does not add it to the active working set or assign a cast band. After a successful save, the app confirms the linked person and offers explicit **Add to Active Working Set** and **Open Active Working Set** actions. Adding selects only that new CAST MEMBER; choosing its cast band and local function stays a separate step in the working set, so record creation, membership, and band assignment remain distinct author decisions.

## Drafting A CAST MEMBER With An External LLM

The CAST MEMBER editor has an optional, local copy-and-paste drafting loop. **Copy Cast Member draft prompt** copies a static, versioned template that contains no story records or project data. Take that template and the dossier material you choose to share to an external LLM yourself; Continuity Loom does not contact a provider for this workflow.

Paste the external response through **Import Cast Member draft**. The app parses it locally, imports each valid field independently, and shows an ephemeral report of filled fields, skipped fields with reasons, and items that still need your attention. An imported `entity_id` is always rejected, and the editor keeps the ENTITY relationship you selected. If an import would replace a non-empty field, the app lists the exact paths and waits for confirmation before changing the form.

Imported values are an unsaved draft, not a record, not canon, and not story prose. Review uncertainties and fields the external model says it invented, revise the form, then choose **Create Record** or **Save Record** only if you want the dossier to become durable. Cancelling, discarding, or leaving the editor keeps the paste and report out of project storage, browser storage, prompts, migration, backup, export, and provenance surfaces.

One imported draft stays active at a time so its report and original discard baseline cannot be separated from its values. While the report is visible, either create or save the record, or choose **Discard imported draft** before importing another response. A successful Create or Save clears the ephemeral report; Discard restores the form exactly to its pre-import state.

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

You can optionally use **What do you need ideas or questions about?** to tell Ideate what local uncertainty you want the grounded slate to address. Author focus is temporary, non-canonical request context: it can shape ideas or questions only within the slots already grounded by your selected records. It does not change story records, continuity authority, slot grounding, or the active working set, and it is never copied from Private Notes or other story and assistance surfaces.

The live counter measures the trimmed focus in Unicode code points. Up to `500 / 500` is valid. At 501 or more, Ideate shows an associated error and makes the old preview and all send actions unavailable. Shorten the text to recover; the app recompiles locally without reloading or contacting OpenRouter. Inspect the exact escaped focus and the current fingerprint in Prompt Inspector before sending.

You can choose ideas or questions, set the slate size from 3 to 6, keep or remove the dormant-record slot, generate a full slate, regenerate the whole slate, or regenerate an individual slot. Focus stays in the mounted Ideate view through those controls and actions. Per-slot and full regeneration send the current slate titles as an avoid-list for the next inspected ideation request. Clear all removes the slate and keepers but preserves the current focus; leaving and later remounting Ideate starts with blank focus.

Typing, counting, validation, prompt compilation, and inspection stay local. Only Get ideas, Get new slate, Regenerate all, and an individual Regenerate action can make one explicit OpenRouter request, and only after the server rebuilds the complete request and confirms it matches the inspected fingerprint. If the request or project changed, Ideate requires a fresh preview instead of sending a stale prompt.

Ideas are AI-suggested scratch. They are not story state, not records, not Generation Brief fields, not accepted prose, and not prompt context for prose generation. There is no insert-into-records, insert-into-brief, or use-as-prompt action. If an idea is useful, copy it by hand and decide what durable record or brief field you want to author yourself.

Keepers are session-scoped scratch stored in browser session storage. They can survive a page reload within the same browser session, but they are not project data and are not written to the local project store. Author focus is not stored with keepers or anywhere else in browser or project storage. Clear the slate or keepers when you no longer need them; cleared ideas leave no project-store residue.

## Cast Possibilities - Explore Character Responses

Open Cast Possibilities from primary navigation or **Explore cast
possibilities** on Generation Brief. It uses the most recently saved Generation
Brief, not unsaved edits still visible in another mounted editor. Save first
when those edits should be included.

The local preview lists the resolved POV, every eligible non-POV active/full
character, record counts, SECRET inclusion, exact prompt, versions, and
fingerprint. Cast Possibilities needs saved time, location, onstage entities,
an immediate situation, resolved character POV, and at least one eligible
linked dossier. It does not require a prose-ready `must_render`.
The preview also pins the exact ordered output key and owned dossier evidence
keys for each eligible character. The provider schema accepts only the compiled
character, dossier, and context citation keys.
Each card must remain compatible with the saved immediate situation and manual
directive. A card is one character-move premise, not a whole-scene package, but
any requirement explicitly constraining that character's participation applies
to each of its cards. If one requirement joins several participation conditions,
each card must satisfy all of them rather than splitting them across the slate.
A card may summarize something a character could say, but it must not draft or
quote the character's exact dialogue. Prompt Inspector repeats the exact
constraints immediately before the output instructions; the inspected request
schema carries the same constraint set.

Analyze remains disabled until you inspect and confirm the one-time OpenRouter
send. It makes one full-cast request and either shows every character with
exactly three cards or quarantines the whole response. Each card exposes its
observable move, character fit, moment fit, local effect, dossier and context
evidence, and distinction.

Keep and Copy affect session scratch only. Regenerate first compiles a
target-only prompt containing that character's three current observable-move
summaries as an avoid list; the server first confirms that those cards still
belong to the inspected full-slate source. Inspect and confirm the target prompt
before its one request. It replaces only that character. If the saved source
changes, older cards remain readable and copyable but become stale and cannot
be regenerated. Missing capability data offers a read-only model-list refresh;
a known incompatible model routes to Settings instead. Clear removes every
Cast Possibilities scratch entry for the open project. If a provider response
succeeds but browser session storage fails, the visible result remains
non-canonical and the error says the provider request already completed.
When OpenRouter supplies safe diagnostic codes for a failed request, the error
also shows those short codes alongside the stable local explanation. It never
shows raw provider metadata, prompts, records, or credentials.

Cards are unverified, non-canonical, non-prose suggestions. They cannot be
applied, accepted, inserted into records or the Generation Brief, added to the
working set, or used as prose prompt authority. They are not stored in the
project, backups, exports, accepted-segment provenance, or prompt archives.

## Record Hygiene - Review Overlapping Active Records

Use Record Hygiene when a project has grown enough that active atomic records may overlap, restate one another, drift stale, or need manual consolidation. Open it from the primary navigation, inspect the compiled record-hygiene prompt locally, review the source counts and exclusions, then optionally confirm a one-time OpenRouter send.

The record-hygiene prompt reviews non-archived hygiene-active atomic records within the scope you choose. Whole project is the default and remains the way to find duplicates anywhere in the store. Active working set scope focuses the review on records you are currently working with; records outside the active working set are excluded by your scope choice, not by archive or terminal status. Both scopes exclude accepted prose, candidates, private notes, archived records, terminal records, ENTITY payloads, and CAST MEMBER payloads. Citation chips navigate back to Records with the exact cited record id.

Findings are AI-suggested review scratch. They are not validation diagnostics, not story state, not records, not working-set entries, not Generation Brief fields, and not prompt context for prose generation. There is no apply, merge, delete, deactivate, archive, accept, fix-all, working-set mutation, or use-as-prose action. If a finding is useful, navigate to the cited records and edit them manually.

Keepers are session-scoped scratch stored in browser session storage. They can survive a page reload within the same browser session, but they are not project data and are not written to the local project store. Clear the review scratch or keepers when you no longer need them.

## Accepted-Segment Change Review - Review Latest Accepted Segment

Use Accepted-Segment Change Review after accepting prose when you want help finding durable continuity changes that may need manual record or Generation Brief updates. It is optional assistance. It may be wrong, incomplete, or over-specific, and it never updates canon automatically.

The optional loop is:

1. Accept the final segment you want to keep.
2. Read the durable-change reminder checklist.
3. Open Accepted-Segment Change Review — the **Change Review** entry in the primary navigation — or use the durable-change reminder CTA.
4. Choose Active working set or Whole project scope.
5. Inspect the compiled prompt and source disclosure, including whether SECRET records are included.
6. Confirm the one-time OpenRouter send only if you want advisory review.
7. Review the readable change statements, their evidence excerpts, and the six coverage rows.
8. Keep, copy, mark reviewed, or navigate from useful items, but author any real changes manually in the canonical editor.
9. Clear the scratch surface when finished, then acknowledge the durable-change reminder only when you decide the canonical updates are complete.

Accepted-Segment Change Review reads exactly the latest accepted segment as bounded evidence for review. It does not read older accepted segments, rejected candidates, private notes, prompt archives, or automatic prose summaries. The accepted segment is not canon authority for future prompts; records and user-authored Generation Brief fields remain the authority.

Returning-author discipline: your Generation Brief current-state and immediate-handoff fields are carried forward by hand and can silently drift from what the latest accepted segment actually rendered — for example, the handoff can presuppose a beat (a turn, a move, a reveal) that the accepted segment ends before reaching. Before you trust the inherited brief at the start of a continuation, re-read the full latest accepted segment, and run (or re-run) Accepted-Segment Change Review with the explicit Analyze action; the latest accepted segment is unchanged, so the review contrasts your current inherited brief against it. When a current-state or immediate-handoff field presupposes a beat the segment does not render, the review surfaces it as an `interpretation requiring author judgment` item that names the drifted brief field and cites where the segment actually ends; drift resting on that absence never carries an evidence excerpt and never becomes an established change. The item is advisory only — re-author any drifted field yourself in the Generation Brief and save it; the review never edits a field, never acknowledges the durable-change reminder, and never gates Preview or Generate.

Every item is suggestion-only scratch. There is no apply, prefill, create, deactivate, archive, merge, remove, working-set mutation, or use-as-prose action. Model output that fails local validation is quarantined without displaying its raw text. Keepers are session-scoped by project and prompt fingerprint in browser session storage, not project data.

## OpenRouter Settings

OpenRouter is the external prose transport. It is not a continuity authority.

Configure the model, Temperature mode, **Prose ceiling**, **Prose reasoning
effort**, **Assistance ceiling**, **Assistance reasoning effort**, and optional
Top P in global OpenRouter settings. These are local app settings, not project
canon. Prose defaults to 2,048 tokens and applies only to Generate. Assistance
defaults to 8,192 and applies to Ideate, Record Hygiene,
Cast Possibilities full analysis and target regeneration, and Accepted-Segment
Change Review. Both are upper bounds, not target lengths or completion
guarantees, and every positive value remains valid. Both reasoning efforts
default to **low**. Reasoning is mandatory and its content is always excluded;
there is no off, automatic, provider-default, alias, or token-budget setting.

**Explicit value** requires a number from 0 through 2 and sends it on every
completion request. **Provider default** omits `temperature`; Continuity Loom
does not know or display a fabricated provider-effective number. A blank Top P
likewise means provider default: saving it clears any prior value and subsequent
requests omit `top_p`. Model selection and model-list refresh never change
these choices.

Prompt Inspector shows the exact model, Temperature intent, optional Top P,
effective Prose or Assistance ceiling and value, selected reasoning effort,
mandatory/excluded state, cached supported efforts, capability blocker, and
provider-request fingerprint that a later send must match. Changing the model,
applicable ceiling or effort, capability snapshot, or prompt requires a fresh
local inspection. Changing only an unused class setting leaves that workflow's
request unchanged.

When Prose uses fewer than 2,048 tokens or Assistance uses fewer than 8,192,
Prompt Inspector shows a suitability advisory. It names the preserved value
and fresh default. A default is a starting allowance, not a guarantee or a
predicted requirement. Use **Open
Settings** to review it, or deliberately proceed with the existing action; the
warning never changes the value or blocks sending.

When the compiled prompt's deterministic token estimate plus the effective
Prose or Assistance ceiling is greater than the selected model's cached context
window, Prompt Inspector shows a context-window advisory on every completion
surface. It names the model, cached window, and estimated counts, and identifies
the count as an estimate rather than a provider measurement. You can reduce the
effective ceiling, choose a model with a larger context window, or narrow the
selected scope on Record Hygiene and Accepted-Segment Change Review.

Neither advisory disables Generate, Analyze, or Regenerate. You may inspect
either one and send anyway; the provider's real result or existing normalized
provider failure is the outcome. If the model has no cached context length, no
size advisory appears. Merely displaying or ignoring either advisory makes no
provider request and does not refresh capabilities, retry, change models, change scope,
resend, or edit settings.

If capability or supported-effort data is missing, use the explicit model-list
refresh and inspect again. If the selected model does not support the stored
effort, the setting remains unchanged: choose a listed effort or another model,
then inspect again. If the selected model is known to lack another requirement, the error names
Temperature, Top P, response format, strict structured output, completion
length, tools, or tool choice as applicable. Change a sampling setting only
deliberately, or choose a compatible model, then inspect and invoke the existing
Generate, Analyze, or Regenerate action yourself. Refresh, settings edits,
inspection, and error viewing never make a completion request, and recovery
never retries automatically.

OpenRouter responses are decoded before any workflow treats text as usable.
Provider errors take precedence first. Recognized output-limit, content-filter,
and tool terminations remain visible even when content is null, missing, empty,
or structurally unsupported; the content problem appears only as technical
detail. Generate can preserve non-empty text stopped by the completion limit,
but labels it an **Incomplete Draft Candidate** with a diagnostic so you can
edit, discard, or invoke Generate yourself again. An output-limit response with
no candidate text is a failure and opens no Draft Candidate. A normal completion
with unusable content is an unrecognized response. Ideate, Record Hygiene,
Change Review, and Cast Possibilities require a normal completion; they do not
salvage partial structured output.

Provider errors, missing content, filtered or tool-ended output, unrecognized
responses, and local validation rejection show a transient sanitized
diagnostic receipt. Expand **Technical details** to inspect safe facts, use
**Copy diagnostic receipt** for support, and use **Open OpenRouter Logs** only
when a safe generation id is available. Receipts never include prompt text,
story records, credentials, arbitrary provider metadata, or rejected candidate
text. They are not saved to the project or browser storage. Viewing, copying,
clearing, or opening Logs never retries, changes settings, or sends another
completion request.

OpenRouter reasoning text, summaries, and details are discarded at transport
and never appear in candidate content, diagnostics, logs, project data,
accepted provenance, exports, backups, or later prompts. A safe aggregate
reasoning-token count may appear transiently in technical diagnostics.

For local key setup, copy `.env.example` to `.env` at the repository root and set `OPENROUTER_API_KEY=<your key>`. The root `.env` is gitignored and loads automatically when the app launches through `npm run dev` or `npm start`; a shell-exported `OPENROUTER_API_KEY` also works as an alternative. The key is not stored in project metadata, the SQLite project store, accepted segment metadata, compiled prompts, prompt preview text, or logs. If a key appears in any of those surfaces, treat it as a security bug.

## Candidate Lifecycle

After readiness passes and the compiled prompt is visible, choose one of two ways to start a Draft Candidate:

- **Generate** sends the current prompt to OpenRouter and returns an OpenRouter-sourced draft.
- **Write or paste candidate** makes no provider call and opens an empty user-supplied draft tied to the prompt you are inspecting.

Both paths use the same ephemeral editor. The draft remains not accepted and not canon. Its source, prompt fingerprint, and compiler versions stay visible while you work. A user-supplied draft remains available when OpenRouter is unconfigured, out of credits, rate limited, or unavailable, provided prompt readiness itself allows preview.

When provider readiness blocks Generate but prompt readiness still allows preview, a **Jump to candidate entry** action appears beside the provider blocker so manual intake stays discoverable. Its accessible name is deliberately distinct from the editor-mount control so a keyboard or assistive-technology user cannot mistake the scroll-only anchor for the button that opens the editor. Activating it scrolls to and moves keyboard focus onto the existing **Write or paste candidate** button; it never opens a draft, sends a request, refreshes the prompt, or bypasses readiness on its own. The **Write or paste candidate** button remains the only control that opens an empty user-supplied draft.

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

Each accepted segment identifies its source as `OpenRouter` or `User-supplied`, and source is searchable from the archive filter. OpenRouter entries show their actual model, provider, generation settings, and compiler versions. Temperature is the sent number for explicit mode or **Provider default** when the parameter was omitted; Top P shows its sent numeric value or **Not set** when the parameter was omitted. New OpenRouter entries show the exact sent reasoning effort captured with that generated candidate, even if Settings change later. Older migrated entries show **provider_default (historical; exact effort unknown)**: this means only that the segment predates exact effort capture, not that Continuity Loom reconstructed what the provider did. Reasoning text, summaries, details, and provider-reported reasoning-token counts never enter accepted provenance. User-supplied entries show the compiler versions associated with the inspected prompt and omit model, provider, and generation-setting fields instead of displaying blank or invented values. Markdown and text exports preserve the same truthful source distinction in story order.

After acceptance, Continuity Loom reminds you that durable changes likely require manual record updates. The app never extracts canon from prose automatically.

Accepted-Segment Change Review can help review the latest accepted segment against current records and Generation Brief fields, but it never applies changes automatically. Record Hygiene can help review overlapping active records after acceptance, but it never updates records automatically. Use both surfaces as optional manual audit steps when accepted prose causes you to create or revise several atomic records.

## Backup And Recoverability

The simplest backup is to close the project and copy the whole project folder somewhere safe.

When the app offers a backup workflow, use "Create Backup Copy" to produce a consistent timestamped SQLite backup without needing to understand SQLite sidecar files. Accepted OpenRouter reasoning intent is part of the same accepted-segment metadata in the project store, so exact current efforts and historical `provider_default` markers remain intact when you copy, back up, restore, or reopen the project.

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
