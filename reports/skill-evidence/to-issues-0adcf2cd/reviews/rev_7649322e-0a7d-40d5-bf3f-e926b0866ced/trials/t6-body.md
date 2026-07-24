## Parent

PRD #200

## What to build

Editing of scene beat annotations in the scene editor, end to end from the panel entry point through
persistence and prompt preview refresh. The `compiler` slice already lands compilation; this slice
adds no new compilation rule.

## User stories covered

US3 - As an author I want to annotate scene beats while editing a scene.

## Acceptance criteria

- [ ] The beat annotation panel is reachable from the scene editor toolbar entry point, and is available only while a scene is selected, staying hidden otherwise.
- [ ] The panel shows empty, editing, and saved states, with add and remove actions whose outcomes appear without a reload.
- [ ] An empty annotation label is rejected with an inline validation blocker, an over-length label raises a warning, a save error is surfaced, and the author can recover by editing the field.
- [ ] The prompt preview shows the complete compiled annotation contents and marks the preview stale when annotations change after the last fingerprint.
- [ ] No annotation edit sends data to an external LLM, and only the user-initiated Get ideas action crosses the OpenRouter boundary.
- [ ] Annotations render with canon record authority, visually distinct from candidate prose segments, so the boundary stays visible.
- [ ] Annotations persist to the project store, migrate older projects without loss, export with the project, and record their origin provenance.
- [ ] A browser regression scenario covers keyboard navigation and the accessible name of the annotation list component.

## Blocked by

- #202

## Principles

Local-first project ownership; no new provider call on the edit path.
