# Browser-visible checklist run sheet - PRD #200 scene beat annotations

Affected slice: `editor` (one row per canonical checklist item).
Unaffected slices: `record`, `compiler` (one `browser-visible guidance checklist` row each).

| Slice | Checklist item | Covered by final AC mapping | N/A reason |
|---|---|---|---|
| editor | entry point and availability | AC 1 - "reachable from the scene editor toolbar entry point, and is available only while a scene is selected, staying hidden otherwise" | - |
| editor | user-visible states, actions, and outcomes | AC 2 - "shows empty, editing, and saved states, with add and remove actions whose outcomes appear without a reload" | - |
| editor | validation, warning, error, and recovery behavior | AC 3 - "rejected with an inline validation blocker, an over-length label raises a warning, a save error is surfaced, and the author can recover by editing the field" | - |
| editor | prompt preview contents and freshness | AC 4 - "The prompt preview shows the complete compiled annotation contents and marks the preview stale when annotations change after the last fingerprint" | - |
| editor | user-initiated external LLM boundary | AC 5 - "No annotation edit sends data to an external LLM, and only the user-initiated Get ideas action crosses the OpenRouter boundary" | - |
| editor | canon and prose boundary visibility | AC 6 - "render with canon record authority, visually distinct from candidate prose segments, so the boundary stays visible" | - |
| editor | persistence, migration, export, and provenance | AC 7 - "persist to the project store, migrate older projects without loss, export with the project, and record their origin provenance" | - |
| editor | browser and accessibility regression scenario | AC 8 - "A browser regression scenario covers keyboard navigation and the accessible name of the annotation list component" | - |
| record | browser-visible guidance checklist | - | N/A - the slice only stores scene beat annotations on the story record and changes no UI, so no browser-visible surface exists to check. |
| compiler | browser-visible guidance checklist | - | N/A - the slice only compiles stored annotations into the prose prompt and changes no UI, so no browser-visible surface exists to check. |
