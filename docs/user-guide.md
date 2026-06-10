# Continuity Loom User Guide

Status: active how-to — user-facing local install, run, verify, and app workflow guidance
Authority: support (see docs/ACTIVE-DOCS.md)

Continuity Loom is a local-first story-state app. You maintain story records, choose the records that matter for the next local prose segment, inspect the deterministic prompt, and decide whether to send it to OpenRouter.

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
10. Send the prompt to OpenRouter when you are ready.
11. Review the returned candidate prose.
12. Edit, regenerate, discard, or accept the candidate.
13. The accepted final segment is stored in the accepted segment archive.
14. Update records manually for any durable continuity changes before generating again.

## Generation Readiness

Saving a Generation Brief is draft persistence. It preserves your work even when the brief is incomplete.

Readiness is the gate for Prompt Preview and Generate. A blocker means the app cannot safely compile or send the prompt until you fix a required item. A warning means generation is possible, but the prose may be weaker, less specific, or harder for the model to use. Warnings never block Preview or Generate.

The readiness checklist should explain the issue in author language first. Technical codes belong in details.

Important fields:

- Generation context defaults from project state: no accepted prose means first segment; one or more accepted segments means continuation. You can still see and edit the resolved value.
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

## Prompt Preview

Prompt preview shows the deterministic prompt that will be sent for generation. It is gated by validation.

If validation has blockers, preview and send are disabled. There is no override in v1. Fix the underlying records or generation-time fields, then compile again.

The prompt preview is operational context for the current generation session. It is not canon and is not kept as a permanent prompt archive by default.

## OpenRouter Settings

OpenRouter is the external prose transport. It is not a continuity authority.

Configure the model, temperature, maximum output tokens, and optional top-p in global OpenRouter settings. These are local app settings, not project canon.

For local key setup, copy `.env.example` to `.env` at the repository root and set `OPENROUTER_API_KEY=<your key>`. The root `.env` is gitignored and loads automatically when the app launches through `npm run dev` or `npm start`; a shell-exported `OPENROUTER_API_KEY` also works as an alternative. The key is not stored in project metadata, the SQLite project store, accepted segment metadata, compiled prompts, prompt preview text, or logs. If a key appears in any of those surfaces, treat it as a security bug.

## Candidate Lifecycle

Sending a prompt returns a candidate prose segment.

You can:

- edit the candidate before accepting it;
- regenerate, which replaces or supersedes the current unsaved candidate;
- discard the current candidate;
- accept the final text you want to keep.

Rejected and superseded candidates are not stored by default. Only the accepted or user-edited final segment is written to the accepted segment archive.

## Accepted Segments

Accepted segments are readable story output. They are not future prompt context.

The accepted segment archive lets you read, filter, delete, and export accepted output. It does not provide an "include in prompt" action. If something in accepted prose should affect future generation, update the story records, current authoritative state, immediate handoff, or another user-authored continuity field.

After acceptance, Continuity Loom reminds you that durable changes likely require manual record updates. The app never extracts canon from prose automatically.

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

Use `prior_accepted_prose_status_or_handoff_note` only for a user-authored status or continuity handoff note. Do not paste accepted prose, rejected candidates, superseded regenerations, or automatic prose summaries into prompt-facing fields.

### Why can I save a brief that still has blockers?

Saving protects your draft. Blockers prevent prompt preview and generation, not ordinary form persistence.

### Do I have to fill stop guidance?

No. Stop guidance is optional narrowing. If it is blank, the universal local stop rule still applies.

### Why is the app asking for a manual directive?

The directive is the immediate launch choice for the next local prose unit. It tells the prose writer what pressure or action to render now without becoming a plot outline.

### Is my data uploaded?

No project folder is uploaded by Continuity Loom. The only remote request in the v1 generation loop is the OpenRouter request you choose to send, and it contains the compiled prompt for that generation.

Your local project remains the continuity owner.
