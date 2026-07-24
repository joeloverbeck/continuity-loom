# Checklist run sheet - PRD #200 scene beat annotations

Canonical items are the eight labels between the `browser-visible-guidance-checklist` markers in
`docs/agents/issue-tracker.md`. Affected slice: `editor` (one row per canonical item, mapped
`AC <n> - "<verbatim excerpt>"` against the staged `editor` body). Genuinely unaffected slice:
`record` (single `browser-visible guidance checklist` row with a specific N/A reason).

Scope note: this sheet stages the two slices named by this task. The `compiler` slice still owes its
own unaffected row before whole-family run-sheet validation without `--only-slice`.

| Slice | Checklist item | Covered by final AC mapping | N/A reason |
|---|---|---|---|
| record | browser-visible guidance checklist | - | N/A - the record slice only adds scene beat annotation storage behind the existing record API; it changes no browser-visible behavior, no browser workflow or navigation, no prompt preview or inspection, no user-initiated external-model invocation, and no candidate/accepted-output handling. |
| editor | entry point and availability | AC 1 - "The beat annotation panel is reachable from the scene editor toolbar entry point, and is available only while a scene is selected, staying hidden otherwise." | - |
| editor | user-visible states, actions, and outcomes | AC 2 - "The panel shows empty, editing, and saved states, with add and remove actions whose outcomes appear without a reload." | - |
| editor | validation, warning, error, and recovery behavior | AC 3 - "An empty annotation label is rejected with an inline validation blocker, an over-length label raises a warning, a save error is surfaced, and the author can recover by editing the field." | - |
| editor | prompt preview contents and freshness | AC 4 - "The prompt preview shows the complete compiled annotation contents and marks the preview stale when annotations change after the last fingerprint." | - |
| editor | user-initiated external LLM boundary | AC 5 - "No annotation edit sends data to an external LLM, and only the user-initiated Get ideas action crosses the OpenRouter boundary." | - |
| editor | canon and prose boundary visibility | AC 6 - "Annotations render with canon record authority, visually distinct from candidate prose segments, so the boundary stays visible." | - |
| editor | persistence, migration, export, and provenance | AC 7 - "Annotations persist to the project store, migrate older projects without loss, export with the project, and record their origin provenance." | - |
| editor | browser and accessibility regression scenario | AC 8 - "A browser regression scenario covers keyboard navigation and the accessible name of the annotation list component." | - |
