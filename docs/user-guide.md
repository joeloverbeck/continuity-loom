# Continuity Loom User Guide

Continuity Loom is a local-first story-state app. You maintain story records, choose the records that matter for the next local prose segment, inspect the deterministic prompt, and decide whether to send it to OpenRouter.

The records are the continuity authority. Accepted prose is readable output, not canon for future prompts.

## The Loop

1. Create or open a local project folder.
2. Add, edit, archive, or remove story records.
3. Curate the active working set for the next segment.
4. Edit generation-time fields: current authoritative state, immediate handoff, manual directive, POV/prose mode, stop guidance, and current voice pressure.
5. Run validation.
6. If validation has blockers, fix the records or generation-time fields. Prompt preview and OpenRouter send stay blocked in v1.
7. Compile and inspect the prompt preview.
8. Send the prompt to OpenRouter when you are ready.
9. Review the returned candidate prose.
10. Edit, regenerate, discard, or accept the candidate.
11. The accepted final segment is stored in the accepted segment archive.
12. Update records manually for any durable continuity changes before generating again.

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

Your API key belongs in global local secret storage, such as the `OPENROUTER_API_KEY` environment variable. The key is not stored in project metadata, the SQLite project store, accepted segment metadata, compiled prompts, prompt preview text, or logs. If a key appears in any of those surfaces, treat it as a security bug.

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

### Is my data uploaded?

No project folder is uploaded by Continuity Loom. The only remote request in the v1 generation loop is the OpenRouter request you choose to send, and it contains the compiled prompt for that generation.

Your local project remains the continuity owner.
