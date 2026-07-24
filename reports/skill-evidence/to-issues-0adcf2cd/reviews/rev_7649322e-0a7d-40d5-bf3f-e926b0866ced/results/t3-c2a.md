## Parent

PRD #200

## What to build

Let the author read, add, edit, reorder, and remove scene beat annotations from inside the scene editor, end to end from the editing control through the existing story-record write path to the prompt the author can inspect.

The stored shape of an annotation is owned by "Store scene beat annotations on the story record" and its compiled representation is owned by "Compile scene beat annotations into the prose prompt". This slice adds no new stored field, no new compiled block, and no compile-side policy of its own; it edits the existing annotation data and surfaces the already-compiled result through existing prompt inspection. Where an annotation edit changes what a compiled prompt would contain, the editor must make a previously shown prompt visibly stale rather than let the author generate from it.

Editing scene beat annotations stays a local, user-initiated action: no path added by this slice sends data to an external provider.

## User stories covered

US3 - As an author I want to annotate scene beats while editing a scene.

## Acceptance criteria

- [ ] The scene editor exposes a labeled scene beat annotation surface for the scene currently open, reached from the existing scene editing entry point with no new navigation; when no editable scene is loaded the surface is visibly disabled with a stated reason instead of silently absent.
- [ ] Adding, editing, reordering, and removing a beat annotation each have a labeled control, and each action's resulting user-visible state, including the beat list, its order, and whether the edit is saved, is shown in the editor without a reload.
- [ ] Invalid annotation input is reported as a validation error that names the offending beat and blocks the save, advisory conditions appear as warnings that do not block, and correcting the input clears the message and restores a successful save; a failed save leaves the author's text recoverable rather than discarded.
- [ ] After an annotation is saved, any prompt preview shown before the edit is marked stale, and refreshed prompt inspection shows the annotation content carried by the existing compiled scene beat block with fresh deterministic bytes.
- [ ] Reading, editing, saving, and discarding beat annotations make no OpenRouter or other provider call; the editor's user-initiated external-model actions remain exactly the existing ones.
- [ ] Beat annotations are presented as story-record continuity authority, visibly distinct from author-private story notes, draft candidates, and accepted prose, and no accepted or candidate prose is copied into an annotation automatically.
- [ ] Annotation edits persist through the story-record storage path introduced by "Store scene beat annotations on the story record" and survive a reload, while this slice adds no new stored shape, migration, or export change and scenes saved without annotations continue to open unchanged.
- [ ] A scene editor browser regression scenario and a component scenario cover the annotation control's keyboard reachability, accessible names, and the stale-preview signal, and pass alongside the existing scene editor scenarios.

## Blocked by

- #202 - The compiled representation of scene beat annotations must land first, because this slice is only verifiable once an annotation actually reaches the prose prompt: both the stale-preview criterion and the prompt-inspection criterion assert against the compiled scene beat block, and the editor deliberately duplicates none of that compile-side policy. Shipping the editing surface earlier would let an author record beats that silently never reach generation.

## Principles

Align with docs/principles/FOUNDATIONS.md Sections 4.3, 4.4, 4.5, 22, 24, 27, and 29; docs/specs/story-record-schema.md; and docs/specs/compiler-contract.md. Records remain the generative substrate and the only continuity authority this editor writes to, compilation stays deterministic and fails closed, prompt inspection stays honest about staleness, project data stays local and user-owned, and no accepted prose or candidate text becomes prompt context or canon. No deliberate exception is approved.
